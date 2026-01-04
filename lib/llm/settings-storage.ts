import type { SettingsState } from "@/lib/llm/page-state"

export const SETTINGS_STORAGE_KEY = "llm-api-test-settings"

export const buildSettingsPatchFromStorage = (raw: unknown): Partial<SettingsState> => {
  if (!raw || typeof raw !== "object") return {}
  const settings = raw as Record<string, unknown>

  const patch: Partial<SettingsState> = {}

  if (typeof settings.provider === "string" && settings.provider) patch.provider = settings.provider
  if (typeof settings.model === "string" && settings.model) patch.model = settings.model
  if (typeof settings.apiKey === "string" && settings.apiKey) patch.apiKey = settings.apiKey
  if (typeof settings.baseURL === "string" && settings.baseURL) patch.baseURL = settings.baseURL
  if (typeof settings.apiPath === "string" && settings.apiPath) patch.apiPath = settings.apiPath

  if (typeof settings.systemPrompt === "string") patch.systemPrompt = settings.systemPrompt
  if (typeof settings.userMessage === "string") patch.userMessage = settings.userMessage

  if (typeof settings.promptFilePath === "string") patch.promptFilePath = settings.promptFilePath
  if (typeof settings.enablePromptFile === "boolean") patch.enablePromptFile = settings.enablePromptFile

  if (typeof settings.systemPromptFilePath === "string") patch.systemPromptFilePath = settings.systemPromptFilePath
  if (typeof settings.enableSystemPromptFile === "boolean") patch.enableSystemPromptFile = settings.enableSystemPromptFile

  if (typeof settings.autoReloadPrompt === "boolean") patch.autoReloadPrompt = settings.autoReloadPrompt
  if (typeof settings.autoReloadSystemPrompt === "boolean") patch.autoReloadSystemPrompt = settings.autoReloadSystemPrompt
  if (typeof settings.autoReloadImages === "boolean") patch.autoReloadImages = settings.autoReloadImages

  if (typeof settings.maxTokens === "number" && Number.isFinite(settings.maxTokens)) patch.maxTokens = settings.maxTokens
  if (typeof settings.temperature === "number" && Number.isFinite(settings.temperature)) patch.temperature = settings.temperature
  if (typeof settings.topP === "number" && Number.isFinite(settings.topP)) patch.topP = settings.topP
  if (typeof settings.frequencyPenalty === "number" && Number.isFinite(settings.frequencyPenalty))
    patch.frequencyPenalty = settings.frequencyPenalty
  if (typeof settings.presencePenalty === "number" && Number.isFinite(settings.presencePenalty))
    patch.presencePenalty = settings.presencePenalty

  if (typeof settings.showRawColumns === "boolean") patch.showRawColumns = settings.showRawColumns
  if (typeof settings.expandRequestContent === "boolean") patch.expandRequestContent = settings.expandRequestContent
  if (typeof settings.expandResponseContent === "boolean") patch.expandResponseContent = settings.expandResponseContent

  if (typeof settings.timerEnabled === "boolean") patch.timerEnabled = settings.timerEnabled
  if (typeof settings.timerInterval === "number" && Number.isFinite(settings.timerInterval)) patch.timerInterval = settings.timerInterval

  if (typeof settings.maxTokensLimit === "number" && Number.isFinite(settings.maxTokensLimit))
    patch.maxTokensLimit = settings.maxTokensLimit
  if (typeof settings.pageSize === "number" && Number.isFinite(settings.pageSize)) patch.pageSize = settings.pageSize

  if (typeof settings.prompt === "string") patch.prompt = settings.prompt
  if (typeof settings.isParametersExpanded === "boolean") patch.isParametersExpanded = settings.isParametersExpanded

  if (typeof settings.isPromptFromLocalFile === "boolean") patch.isPromptFromLocalFile = settings.isPromptFromLocalFile
  if (typeof settings.isSystemPromptFromLocalFile === "boolean")
    patch.isSystemPromptFromLocalFile = settings.isSystemPromptFromLocalFile

  if (Array.isArray(settings.selectedInputModalities))
    patch.selectedInputModalities = settings.selectedInputModalities.filter((x) => typeof x === "string")
  if (Array.isArray(settings.selectedOutputModalities))
    patch.selectedOutputModalities = settings.selectedOutputModalities.filter((x) => typeof x === "string")

  if (typeof settings.modelSearchQuery === "string") patch.modelSearchQuery = settings.modelSearchQuery

  if (Array.isArray(settings.availableInputModalities))
    patch.availableInputModalities = settings.availableInputModalities.filter((x) => typeof x === "string")
  if (Array.isArray(settings.availableOutputModalities))
    patch.availableOutputModalities = settings.availableOutputModalities.filter((x) => typeof x === "string")

  if (typeof settings.imageUrl === "string") patch.imageUrl = settings.imageUrl
  if (typeof settings.showImageUrlInput === "boolean") patch.showImageUrlInput = settings.showImageUrlInput
  if (typeof settings.isAddingImageUrl === "boolean") patch.isAddingImageUrl = settings.isAddingImageUrl

  return patch
}

export const loadSettingsFromStorage = (storage: Pick<Storage, "getItem">): Partial<SettingsState> => {
  try {
    const saved = storage.getItem(SETTINGS_STORAGE_KEY)
    if (!saved) return {}
    return buildSettingsPatchFromStorage(JSON.parse(saved))
  } catch {
    return {}
  }
}

export const saveSettingsToStorage = (storage: Pick<Storage, "setItem">, settingsState: SettingsState): void => {
  const settingsToSave = {
    ...settingsState,
    selectedInputModalities: Array.from(settingsState.selectedInputModalities),
    selectedOutputModalities: Array.from(settingsState.selectedOutputModalities),
  }
  storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsToSave))
}

