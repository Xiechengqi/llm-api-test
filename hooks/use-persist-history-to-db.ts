"use client"

import { useEffect } from "react"
import type { HistoryItem } from "@/lib/llm/types"
import { saveHistoryToDB } from "@/lib/indexed-db"

type Options = {
  enabled?: boolean
}

export function usePersistHistoryToDB(history: HistoryItem[], options: Options = {}) {
  const enabled = options.enabled ?? true

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return
    saveHistoryToDB(history).catch((error) => {
      console.error("[v0] Failed to save history to IndexedDB:", error)
    })
  }, [enabled, history])
}
