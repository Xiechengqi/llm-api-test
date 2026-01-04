import type { CustomProviderConfig } from "@/lib/llm/types"

export const CUSTOM_PROVIDER_STORAGE_KEY = "llm-api-test-custom-providers"

const isCustomProviderConfig = (value: unknown): value is CustomProviderConfig => {
  if (!value || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.baseURL === "string" &&
    typeof record.apiPath === "string" &&
    (record.apiKey === undefined || typeof record.apiKey === "string")
  )
}

export const loadCustomProvidersFromStorage = (storage: Pick<Storage, "getItem">): CustomProviderConfig[] => {
  try {
    const stored = storage.getItem(CUSTOM_PROVIDER_STORAGE_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCustomProviderConfig)
  } catch {
    return []
  }
}

export const saveCustomProvidersToStorage = (
  storage: Pick<Storage, "setItem">,
  providers: CustomProviderConfig[],
): void => {
  storage.setItem(CUSTOM_PROVIDER_STORAGE_KEY, JSON.stringify(providers))
}

