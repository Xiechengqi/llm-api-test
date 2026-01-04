export type SettingsState = {
  provider: string
  model: string
  apiKey: string
  baseURL: string
  apiPath: string
  systemPrompt: string
  userMessage: string
  promptFilePath: string
  enablePromptFile: boolean
  systemPromptFilePath: string
  enableSystemPromptFile: boolean
  autoReloadPrompt: boolean
  autoReloadSystemPrompt: boolean
  autoReloadImages: boolean
  maxTokens: number
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  showRawColumns: boolean
  expandRequestContent: boolean
  expandResponseContent: boolean
  timerEnabled: boolean
  timerInterval: number
  maxTokensLimit: number
  pageSize: number
  prompt: string
  isParametersExpanded: boolean
  isPromptFromLocalFile: boolean
  isSystemPromptFromLocalFile: boolean
  selectedInputModalities: string[]
  selectedOutputModalities: string[]
  modelSearchQuery: string
  availableInputModalities: string[]
  availableOutputModalities: string[]
  imageUrl: string
  showImageUrlInput: boolean
  isAddingImageUrl: boolean
}

export type SettingsAction =
  | { type: "set"; key: keyof SettingsState; value: SettingsState[keyof SettingsState] }
  | { type: "patch"; patch: Partial<SettingsState> }

export const settingsReducer = (state: SettingsState, action: SettingsAction): SettingsState => {
  switch (action.type) {
    case "set":
      return { ...state, [action.key]: action.value } as SettingsState
    case "patch":
      return { ...state, ...action.patch }
    default:
      return state
  }
}

export type ProbeStatus = "idle" | "success" | "error"

export type RunState = {
  stream: boolean
  loading: boolean
  requestData: string
  responseData: string
  error: string
  responseDuration: number | null
  probeStatus: ProbeStatus
  probeDuration: number | null
  isProbeTesting: boolean
  isTimerRunning: boolean
}

export type RunAction =
  | { type: "set"; key: keyof RunState; value: RunState[keyof RunState] }
  | { type: "patch"; patch: Partial<RunState> }

export const runReducer = (state: RunState, action: RunAction): RunState => {
  switch (action.type) {
    case "set":
      return { ...state, [action.key]: action.value } as RunState
    case "patch":
      return { ...state, ...action.patch }
    default:
      return state
  }
}

