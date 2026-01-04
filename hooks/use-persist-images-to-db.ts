"use client"

import { useEffect } from "react"
import type { MessageImage } from "@/lib/llm/types"
import { saveImagesToDB } from "@/lib/indexed-db"

type Options = {
  enabled?: boolean
}

export function usePersistImagesToDB(messageImages: MessageImage[], options: Options = {}) {
  const enabled = options.enabled ?? true

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return
    console.log("[v0] Saving images to IndexedDB, count:", messageImages.length)
    saveImagesToDB(messageImages).catch((error) => {
      console.error("[v0] Failed to save images to IndexedDB:", error)
    })
  }, [enabled, messageImages])
}
