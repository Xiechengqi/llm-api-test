import type { ModelHistoryItem } from "@/lib/llm/types"
import { modelHistoryWithoutKey } from "./history-privacy"

export const MODEL_HISTORY_STORAGE_KEY = "modelHistory"

export const loadModelHistoryFromStorage = (storage: Pick<Storage, "getItem" | "setItem">): ModelHistoryItem[] => {
  try {
    const saved = storage.getItem(MODEL_HISTORY_STORAGE_KEY)
    if (!saved) return []
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    const items = parsed.filter((item): item is ModelHistoryItem => {
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
    }).map(modelHistoryWithoutKey)
    // Upgrade existing records without deleting their connection/result data.
    const sanitized = JSON.stringify(items)
    if (sanitized !== saved) {
      try { storage.setItem(MODEL_HISTORY_STORAGE_KEY, sanitized) } catch { /* Read-only storage. */ }
    }
    return items
  } catch {
    return []
  }
}

export const saveModelHistoryToStorage = (
  storage: Pick<Storage, "setItem">,
  modelHistory: ModelHistoryItem[],
): void => {
  storage.setItem(MODEL_HISTORY_STORAGE_KEY, JSON.stringify(modelHistory.map(modelHistoryWithoutKey)))
}

export const clearModelHistoryFromStorage = (storage: Pick<Storage, "removeItem">): void => {
  storage.removeItem(MODEL_HISTORY_STORAGE_KEY)
}
