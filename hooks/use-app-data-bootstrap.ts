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
  dispatchSettingsPatch: (patch: Partial<SettingsState>) => void
  setMessageImages: (images: MessageImage[]) => void
  setHistory: (history: HistoryItem[]) => void
  setResponseImagesMap: (map: Map<number, string[]>) => void
  setModelHistory: (items: ModelHistoryItem[]) => void
}

export function useAppDataBootstrap({
  dispatchSettingsPatch,
  setMessageImages,
  setHistory,
  setResponseImagesMap,
  setModelHistory,
}: Props) {
  const [isBootstrapped, setIsBootstrapped] = useState(false)

  useEffect(() => {
    const initializeDB = async () => {
      try {
        await initDB()
        await migrateFromLocalStorage()
        console.log("[v0] IndexedDB initialized")
      } catch (error) {
        console.error("[v0] Failed to initialize IndexedDB:", error)
      }
    }
    initializeDB()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("[v0] Loading data from storage...")

        const settingsPatch = loadSettingsFromStorage(localStorage)
        if (Object.keys(settingsPatch).length > 0) {
          dispatchSettingsPatch(settingsPatch)
        }

        console.log("[v0] Loading images from IndexedDB...")
        const imagesFromDB = await loadImagesFromDB()
        console.log("[v0] Loaded images from IndexedDB:", imagesFromDB.length, "images")
        if (imagesFromDB.length > 0) {
          setMessageImages(imagesFromDB)
          console.log("[v0] Set messageImages state with", imagesFromDB.length, "images")
        }

        console.log("[v0] Loading history from IndexedDB...")
        const historyFromDB = await loadHistoryFromDB()
        if (historyFromDB.length > 0) {
          console.log("[v0] Loaded history from IndexedDB:", historyFromDB.length, "entries")
          setHistory(historyFromDB)
          loadResponseImagesForHistory(historyFromDB)
            .then((imagesMap) => {
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
          }
        }

        const loadedModelHistory = loadModelHistoryFromStorage(localStorage)
        if (loadedModelHistory.length > 0) {
          setModelHistory(loadedModelHistory)
        }
      } catch (error) {
        console.error("[v0] Error loading data:", error)
      } finally {
        setIsBootstrapped(true)
      }
    }

    loadData()
  }, [
    dispatchSettingsPatch,
    setHistory,
    setMessageImages,
    setModelHistory,
    setResponseImagesMap,
  ])

  return isBootstrapped
}
