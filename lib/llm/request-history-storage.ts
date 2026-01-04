import type { HistoryItem } from "@/lib/llm/types"

export const REQUEST_HISTORY_STORAGE_KEY = "llm_api_history"

export const loadRequestHistoryFromStorage = (storage: Pick<Storage, "getItem">): HistoryItem[] => {
  try {
    const saved = storage.getItem(REQUEST_HISTORY_STORAGE_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item): item is HistoryItem => {
      if (!item || typeof item !== "object") return false
      const record = item as Record<string, unknown>
      return (
        typeof record.id === "string" &&
        typeof record.timestamp === "number" &&
        (record.duration === undefined || typeof record.duration === "number") &&
        typeof record.model === "string" &&
        typeof record.requestContent === "string" &&
        typeof record.requestRaw === "string" &&
        typeof record.responseContent === "string" &&
        typeof record.responseRaw === "string"
      )
    })
  } catch {
    return []
  }
}

