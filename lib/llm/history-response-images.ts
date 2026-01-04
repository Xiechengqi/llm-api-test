import { loadResponseImagesFromDB } from "@/lib/indexed-db"
import type { HistoryItem } from "@/lib/llm/types"

export const loadResponseImagesForHistory = async (historyItems: HistoryItem[]) => {
  const imagesMap = new Map<number, string[]>()

  for (const item of historyItems) {
    try {
      const savedImages = await loadResponseImagesFromDB(item.timestamp)
      if (savedImages.length > 0) {
        const base64Images = savedImages.map((img) => img.base64 || img.url || "").filter(Boolean)
        if (base64Images.length > 0) {
          imagesMap.set(item.timestamp, base64Images)
        }
      }
    } catch (error) {
      console.warn(`[v0] Failed to load response images for timestamp ${item.timestamp}:`, error)
    }
  }

  return imagesMap
}

