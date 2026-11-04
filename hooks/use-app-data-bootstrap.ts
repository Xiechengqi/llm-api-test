"use client"

import { useEffect, useState } from "react"
import type { SettingsState } from "@/lib/llm/page-state"
import { loadSettingsFromStorage } from "@/lib/llm/settings-storage"
import { loadModelHistoryFromStorage } from "@/lib/llm/model-history-storage"
import { loadRequestHistoryFromStorage } from "@/lib/llm/request-history-storage"
import type { HistoryItem, MessageImage, ModelHistoryItem } from "@/lib/llm/types"
import {
  initDB,
  loadHistoryFromDB,
  loadImagesFromDB,
  migrateFromLocalStorage,
  saveHistoryToDB,
} from "@/lib/indexed-db"
import { loadResponseImagesForHistory } from "@/lib/llm/history-response-images"

type Props = {
  enabled?: boolean
  dispatchSettingsPatch: (patch: Partial<SettingsState>) => void
  setMessageImages: (images: MessageImage[]) => void
  setHistory: (history: HistoryItem[]) => void
  setResponseImagesMap: (map: Map<number, string[]>) => void
  setModelHistory: (items: ModelHistoryItem[]) => void
}

export function useAppDataBootstrap({
  enabled = true,
  dispatchSettingsPatch,
  setMessageImages,
  setHistory,
  setResponseImagesMap,
  setModelHistory,
}: Props) {
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading")

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    const loadData = async () => {
      try {
        // localStorage can still be readable when IndexedDB is unavailable.
        // Restore it first, but do not enable any automatic writes until the
        // complete bootstrap succeeds (otherwise empty state could erase data).
        const settingsPatch = loadSettingsFromStorage(localStorage)
        if (Object.keys(settingsPatch).length > 0) dispatchSettingsPatch(settingsPatch)
        const loadedModelHistory = loadModelHistoryFromStorage(localStorage)
        if (loadedModelHistory.length > 0) setModelHistory(loadedModelHistory)

        const db = await initDB()
        db.close()
        if (cancelled) return
        await migrateFromLocalStorage()
        if (cancelled) return
        console.log("[v0] Loading data from storage...")

        console.log("[v0] Loading images from IndexedDB...")
        const imagesFromDB = await loadImagesFromDB()
        if (cancelled) return
        console.log("[v0] Loaded images from IndexedDB:", imagesFromDB.length, "images")
        if (imagesFromDB.length > 0) {
          setMessageImages(imagesFromDB)
          console.log("[v0] Set messageImages state with", imagesFromDB.length, "images")
        }

        console.log("[v0] Loading history from IndexedDB...")
        const historyFromDB = await loadHistoryFromDB()
        if (cancelled) return
        if (historyFromDB.length > 0) {
          console.log("[v0] Loaded history from IndexedDB:", historyFromDB.length, "entries")
          setHistory(historyFromDB)
          loadResponseImagesForHistory(historyFromDB)
            .then((imagesMap) => {
              if (cancelled) return
              setResponseImagesMap(imagesMap)
              console.log("[v0] Loaded response images for", imagesMap.size, "history items")
            })
            .catch((error) => {
              console.error("[v0] Failed to load response images:", error)
            })
        } else {
          const legacyHistory = loadRequestHistoryFromStorage(localStorage)
          if (legacyHistory.length > 0) {
            setHistory(legacyHistory)
            await saveHistoryToDB(legacyHistory)
            if (cancelled) return
          }
        }

        if (!cancelled) setStatus("ready")
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        if (!cancelled) setStatus("unavailable")
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [
    enabled,
    dispatchSettingsPatch,
    setHistory,
    setMessageImages,
    setModelHistory,
    setResponseImagesMap,
  ])

  return {
    canPersist: enabled && status === "ready",
    storageUnavailable: enabled && status === "unavailable",
  }
}
