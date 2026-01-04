import type { ModelHistoryItem } from "@/lib/llm/types"

export const MODEL_HISTORY_STORAGE_KEY = "modelHistory"

export const loadModelHistoryFromStorage = (storage: Pick<Storage, "getItem">): ModelHistoryItem[] => {
  try {
    const saved = storage.getItem(MODEL_HISTORY_STORAGE_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is ModelHistoryItem => {
      if (!item || typeof item !== "object") return false
      const record = item as Record<string, unknown>
      return (
        typeof record.id === "string" &&
        typeof record.timestamp === "number" &&
        typeof record.provider === "string" &&
        typeof record.model === "string" &&
        typeof record.apiKey === "string" &&
        typeof record.baseURL === "string" &&
        typeof record.apiPath === "string" &&
        (record.status === "idle" || record.status === "success" || record.status === "error") &&
        (record.duration === null || typeof record.duration === "number")
      )
    })
  } catch {
    return []
  }
}

export const saveModelHistoryToStorage = (
  storage: Pick<Storage, "setItem">,
  modelHistory: ModelHistoryItem[],
): void => {
  storage.setItem(MODEL_HISTORY_STORAGE_KEY, JSON.stringify(modelHistory))
}

export const clearModelHistoryFromStorage = (storage: Pick<Storage, "removeItem">): void => {
  storage.removeItem(MODEL_HISTORY_STORAGE_KEY)
}

