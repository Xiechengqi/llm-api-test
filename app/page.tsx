"use client"

import { useState, useEffect, useRef, useMemo, useCallback, useReducer } from "react" // Import useRef, useMemo, useCallback
import type React from "react"
import { useToast } from "@/hooks/use-toast"
import { Navbar } from "@/components/navbar"
import { AppShell } from "@/components/app-shell"
import { MainDashboard } from "@/components/main-dashboard"
import { SelectedModelInfoPanel } from "@/components/selected-model-info-panel"
import { useAppDataBootstrap } from "@/hooks/use-app-data-bootstrap"
import { usePersistHistoryToDB } from "@/hooks/use-persist-history-to-db"
import { usePersistImagesToDB } from "@/hooks/use-persist-images-to-db"
import { useHistoryActions } from "@/hooks/use-history-actions"

import {
  deleteFileHandle,
  readTextFromHandleKey,
  saveFileHandle,
} from "@/lib/file-handles-db"
import { API_PROVIDERS } from "@/lib/llm/providers"
import {
  modelscopeHasImageGenerationTask,
} from "@/lib/llm/content"
import { buildMessageImageFromFile, buildMessageImageFromUrl, reloadMessageImages } from "@/lib/llm/images"
import { fetchCerebrasModelCatalog, fetchModelScopeModelCatalog, fetchOpenRouterModelCatalog } from "@/lib/llm/model-catalog"
import { parseResponseToContent } from "@/lib/llm/response"
import { buildLlmRequest, buildProbeRequest } from "@/lib/llm/request"
import { formatResponseForDisplay } from "@/lib/llm/response-format"
import { describeFetchTextError, fetchText, isHttpUrl, pickLocalTextFile } from "@/lib/llm/text-files"
import { preloadHttpTextSource, resolveTextSource } from "@/lib/llm/text-source"
import { buildHistoryCsv, buildModelHistoryCsv } from "@/lib/llm/csv"
import { downloadTextFile } from "@/lib/llm/download"
import { copyTextToClipboard } from "@/lib/llm/clipboard"
import { getTotalPages, slicePage } from "@/lib/llm/pagination"
import { translateEnToZhWithFallback } from "@/lib/llm/translate"
import type { ProbeStatus, RunState, SettingsState } from "@/lib/llm/page-state"
import { runReducer, settingsReducer } from "@/lib/llm/page-state"
import { loadCustomProvidersFromStorage, saveCustomProvidersToStorage } from "@/lib/llm/custom-providers"
import {
  SETTINGS_STORAGE_KEY,
  saveSettingsToStorage,
} from "@/lib/llm/settings-storage"
import {
  clearModelHistoryFromStorage,
  saveModelHistoryToStorage,
} from "@/lib/llm/model-history-storage"
import type {
  CerebrasModel,
  CustomProviderConfig,
  HistoryItem,
  MessageImage,
  ModelHistoryItem,
  ModelScopeModel,
  OpenRouterModel,
} from "@/lib/llm/types"

import {
  saveResponseImagesToDB,
  loadResponseImagesFromDB,
} from "@/lib/indexed-db"

export default function LLMAPITester() {
  const DEFAULT_VALUES = {
    provider: "openrouter",
    model: "",
    apiKey: "", // Added default for apiKey
    baseURL: "https://openrouter.ai",
    apiPath: "/api/v1/chat/completions",
    systemPrompt: "You are a helpful assistant.",
    userMessage: "你是谁？中文回复",
    promptFilePath: "",
    enablePromptFile: false, // Add enablePromptFile state with default false
    systemPromptFilePath: "",
    enableSystemPromptFile: false,
    autoReloadPrompt: false,
    autoReloadSystemPrompt: false,
    autoReloadImages: false,
    maxTokens: 4096,
    temperature: 1.0,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    showRawColumns: false,
    expandRequestContent: false,
    expandResponseContent: false,
    timerEnabled: false,
    timerInterval: 60,
    maxTokensLimit: 8192,
    pageSize: 3,
    prompt: "", // Added prompt to default values
  }

  const initialSettings: SettingsState = {
    provider: DEFAULT_VALUES.provider,
    model: DEFAULT_VALUES.model,
    apiKey: DEFAULT_VALUES.apiKey,
    baseURL: DEFAULT_VALUES.baseURL,
    apiPath: DEFAULT_VALUES.apiPath,
    systemPrompt: DEFAULT_VALUES.systemPrompt,
    userMessage: DEFAULT_VALUES.userMessage,
    promptFilePath: DEFAULT_VALUES.promptFilePath,
    enablePromptFile: DEFAULT_VALUES.enablePromptFile,
    systemPromptFilePath: DEFAULT_VALUES.systemPromptFilePath,
    enableSystemPromptFile: DEFAULT_VALUES.enableSystemPromptFile,
    autoReloadPrompt: DEFAULT_VALUES.autoReloadPrompt,
    autoReloadSystemPrompt: DEFAULT_VALUES.autoReloadSystemPrompt,
    autoReloadImages: DEFAULT_VALUES.autoReloadImages,
    maxTokens: DEFAULT_VALUES.maxTokens,
    temperature: DEFAULT_VALUES.temperature,
    topP: DEFAULT_VALUES.topP,
    frequencyPenalty: DEFAULT_VALUES.frequencyPenalty,
    presencePenalty: DEFAULT_VALUES.presencePenalty,
    showRawColumns: DEFAULT_VALUES.showRawColumns,
    expandRequestContent: DEFAULT_VALUES.expandRequestContent,
    expandResponseContent: DEFAULT_VALUES.expandResponseContent,
    timerEnabled: DEFAULT_VALUES.timerEnabled,
    timerInterval: DEFAULT_VALUES.timerInterval,
    maxTokensLimit: DEFAULT_VALUES.maxTokensLimit,
    pageSize: DEFAULT_VALUES.pageSize,
    prompt: DEFAULT_VALUES.prompt,
    isParametersExpanded: true,
    isPromptFromLocalFile: false,
    isSystemPromptFromLocalFile: false,
    selectedInputModalities: [],
    selectedOutputModalities: [],
    modelSearchQuery: "",
    availableInputModalities: [],
    availableOutputModalities: [],
    imageUrl: "",
    showImageUrlInput: false,
    isAddingImageUrl: false,
  }

  const [settingsState, dispatchSettings] = useReducer(settingsReducer, initialSettings)
  const setSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    dispatchSettings({ type: "set", key, value })
  }
  const dispatchSettingsPatch = useCallback(
    (patch: Partial<SettingsState>) => dispatchSettings({ type: "patch", patch }),
    [dispatchSettings],
  )

  const initialRunState: RunState = {
    stream: false,
    loading: false,
    requestData: "",
    responseData: "",
    error: "",
    responseDuration: null,
    probeStatus: "idle",
    probeDuration: null,
    isProbeTesting: false,
    isTimerRunning: false,
  }

  const [runState, dispatchRun] = useReducer(runReducer, initialRunState)
  const setRun = <K extends keyof RunState>(key: K, value: RunState[K]) => {
    dispatchRun({ type: "set", key, value })
  }

  const provider = settingsState.provider
  const setProvider = (value: string) => setSetting("provider", value)

  const apiKey = settingsState.apiKey
  const setApiKey = (value: string) => setSetting("apiKey", value)

  const [showApiKey, setShowApiKey] = useState(false)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false)
  const model = settingsState.model
  const setModel = (value: string) => setSetting("model", value)

  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>([])
  const [cerebrasModels, setCerebrasModels] = useState<CerebrasModel[]>([])
  const [modelscopeModels, setModelscopeModels] = useState<ModelScopeModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isCustomModel, setIsCustomModel] = useState(false)
  const selectedInputModalities = settingsState.selectedInputModalities
  const setSelectedInputModalities = (value: string[]) => setSetting("selectedInputModalities", value)

  const selectedOutputModalities = settingsState.selectedOutputModalities
  const setSelectedOutputModalities = (value: string[]) => setSetting("selectedOutputModalities", value)

  const modelSearchQuery = settingsState.modelSearchQuery
  const setModelSearchQuery = (value: string) => setSetting("modelSearchQuery", value)

  const availableInputModalities = settingsState.availableInputModalities
  const setAvailableInputModalities = (value: string[]) => setSetting("availableInputModalities", value)

  const availableOutputModalities = settingsState.availableOutputModalities
  const setAvailableOutputModalities = (value: string[]) => setSetting("availableOutputModalities", value)

  const imageUrl = settingsState.imageUrl
  const setImageUrl = (value: string) => setSetting("imageUrl", value)

  const showImageUrlInput = settingsState.showImageUrlInput
  const setShowImageUrlInput = (value: boolean) => setSetting("showImageUrlInput", value)

  const isAddingImageUrl = settingsState.isAddingImageUrl
  const setIsAddingImageUrl = (value: boolean) => setSetting("isAddingImageUrl", value)

  const [translatedDescription, setTranslatedDescription] = useState<string>("")
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string>("")
  const maxTokens = settingsState.maxTokens
  const setMaxTokens = (value: number) => setSetting("maxTokens", value)

  const temperature = settingsState.temperature
  const setTemperature = (value: number) => setSetting("temperature", value)

  const topP = settingsState.topP
  const setTopP = (value: number) => setSetting("topP", value)

  const frequencyPenalty = settingsState.frequencyPenalty
  const setFrequencyPenalty = (value: number) => setSetting("frequencyPenalty", value)

  const presencePenalty = settingsState.presencePenalty
  const setPresencePenalty = (value: number) => setSetting("presencePenalty", value)

  const stream = runState.stream
  const setStream = (value: boolean) => setRun("stream", value)

  const loading = runState.loading
  const setLoading = (value: boolean) => setRun("loading", value)

  const abortControllerRef = useRef<AbortController | null>(null)
  const requestData = runState.requestData
  const setRequestData = (value: string) => setRun("requestData", value)

  const responseData = runState.responseData
  const setResponseData = (value: string) => setRun("responseData", value)

  const error = runState.error
  const setError = (value: string) => setRun("error", value)

  const maxTokensLimit = settingsState.maxTokensLimit
  const setMaxTokensLimit = (value: number) => setSetting("maxTokensLimit", value)

  const prompt = settingsState.prompt
  const setPrompt = (value: string) => setSetting("prompt", value) // This state seems redundant with userMessage, consider consolidating.

  const baseURL = settingsState.baseURL
  const setBaseURL = (value: string) => setSetting("baseURL", value)

  const apiPath = settingsState.apiPath
  const setApiPath = (value: string) => setSetting("apiPath", value)

  const systemPrompt = settingsState.systemPrompt
  const setSystemPrompt = (value: string) => setSetting("systemPrompt", value)

  const userMessage = settingsState.userMessage
  const setUserMessage = (value: string) => setSetting("userMessage", value)

  const promptFilePath = settingsState.promptFilePath
  const setPromptFilePath = (value: string) => setSetting("promptFilePath", value)

  const enablePromptFile = settingsState.enablePromptFile
  const setEnablePromptFile = (value: boolean) => setSetting("enablePromptFile", value)

  const isPromptFromLocalFile = settingsState.isPromptFromLocalFile
  const setIsPromptFromLocalFile = (value: boolean) => setSetting("isPromptFromLocalFile", value)

  const promptFileHandleRef = useRef<FileSystemFileHandle | null>(null)

  const [loadedPromptContent, setLoadedPromptContent] = useState("")
  const [isExternalPromptExpanded, setIsExternalPromptExpanded] = useState(false)

  const systemPromptFilePath = settingsState.systemPromptFilePath
  const setSystemPromptFilePath = (value: string) => setSetting("systemPromptFilePath", value)

  const enableSystemPromptFile = settingsState.enableSystemPromptFile
  const setEnableSystemPromptFile = (value: boolean) => setSetting("enableSystemPromptFile", value)

  const isSystemPromptFromLocalFile = settingsState.isSystemPromptFromLocalFile
  const setIsSystemPromptFromLocalFile = (value: boolean) => setSetting("isSystemPromptFromLocalFile", value)

  const systemPromptFileHandleRef = useRef<FileSystemFileHandle | null>(null)

  const [loadedSystemPromptContent, setLoadedSystemPromptContent] = useState("")
  const [isExternalSystemPromptExpanded, setIsExternalSystemPromptExpanded] = useState(false)

  const autoReloadPrompt = settingsState.autoReloadPrompt
  const setAutoReloadPrompt = (value: boolean) => setSetting("autoReloadPrompt", value)

  const autoReloadSystemPrompt = settingsState.autoReloadSystemPrompt
  const setAutoReloadSystemPrompt = (value: boolean) => setSetting("autoReloadSystemPrompt", value)

  const autoReloadImages = settingsState.autoReloadImages
  const setAutoReloadImages = (value: boolean) => setSetting("autoReloadImages", value)

  const [history, setHistory] = useState<HistoryItem[]>([])
  const pageSize = settingsState.pageSize
  const setPageSize = (value: number) => setSetting("pageSize", value)

  const [currentPage, setCurrentPage] = useState(1)
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [visibleRawCells, setVisibleRawCells] = useState<Set<string>>(new Set()) // State to track visible raw columns per history item
  const showRawColumns = settingsState.showRawColumns
  const setShowRawColumns = (value: boolean) => setSetting("showRawColumns", value)

  const expandRequestContent = settingsState.expandRequestContent
  const setExpandRequestContent = (value: boolean) => setSetting("expandRequestContent", value)

  const expandResponseContent = settingsState.expandResponseContent
  const setExpandResponseContent = (value: boolean) => setSetting("expandResponseContent", value)

  const probeStatus = runState.probeStatus
  const setProbeStatus = (value: ProbeStatus) => setRun("probeStatus", value)

  const probeDuration = runState.probeDuration
  const setProbeDuration = (value: number | null) => setRun("probeDuration", value)

  const isProbeTesting = runState.isProbeTesting
  const setIsProbeTesting = (value: boolean) => setRun("isProbeTesting", value)

  const timerEnabled = settingsState.timerEnabled
  const setTimerEnabled = (value: boolean) => setSetting("timerEnabled", value)

  const timerInterval = settingsState.timerInterval
  const setTimerInterval = (value: number) => setSetting("timerInterval", value)

  const timerRef = useRef<NodeJS.Timeout | null>(null) // Use useRef for timer
  const isTimerRunning = runState.isTimerRunning
  const setIsTimerRunning = (value: boolean) => setRun("isTimerRunning", value)

  const responseDuration = runState.responseDuration
  const setResponseDuration = (value: number | null) => setRun("responseDuration", value)

  const isParametersExpanded = settingsState.isParametersExpanded
  const setIsParametersExpanded = (value: boolean) => setSetting("isParametersExpanded", value)

  const [modelHistory, setModelHistory] = useState<ModelHistoryItem[]>([])
  const [modelHistoryPage, setModelHistoryPage] = useState(1)
  const modelHistoryPageSize = 5
  const [responseImagesMap, setResponseImagesMap] = useState<Map<number, string[]>>(new Map())
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set())

  const [savedProviders, setSavedProviders] = useState<CustomProviderConfig[]>([])
  const [customProviderName, setCustomProviderName] = useState("")
  const [customProviderError, setCustomProviderError] = useState("")
  const [customProviderSaved, setCustomProviderSaved] = useState(false)
  const [customProviderStatusMessage, setCustomProviderStatusMessage] = useState("")
  const [isEditingCustomProvider, setIsEditingCustomProvider] = useState(false)

  const [messageImages, setMessageImages] = useState<MessageImage[]>([])
  const [zoomedImage, setZoomedImage] = useState<MessageImage | null>(null)

  const { toast } = useToast()

  const isBootstrapped = useAppDataBootstrap({
    dispatchSettingsPatch,
    setMessageImages,
    setHistory,
    setResponseImagesMap,
    setModelHistory,
  })
  usePersistHistoryToDB(history, { enabled: isBootstrapped })
  usePersistImagesToDB(messageImages, { enabled: isBootstrapped })
  const { clearHistory: handleClearHistory, deleteHistoryItem: handleDeleteHistoryItem } =
    useHistoryActions({
      history,
      setHistory,
      setResponseImagesMap,
      setCurrentPage,
      toast,
    })

  const providerOptions = useMemo(() => {
    const customOptions = savedProviders.map((provider) => ({
      id: provider.id,
      name: provider.name,
      endpoint: provider.baseURL && provider.apiPath ? `${provider.baseURL}${provider.apiPath}` : "",
    }))
    return [...API_PROVIDERS, ...customOptions]
  }, [savedProviders])

  const selectedProviderOption = useMemo(
    () => providerOptions.find((p) => p.id === provider),
    [provider, providerOptions],
  )

  const canCurrentProviderUseCustomFields = useMemo(() => {
    if (provider === "custom") return true
    const isSavedCustomProvider = savedProviders.some((p) => p.id === provider)
    if (isSavedCustomProvider) return true
    return !selectedProviderOption?.endpoint
  }, [provider, savedProviders, selectedProviderOption])

  const shouldRenderCustomProviderFields =
    isEditingCustomProvider && canCurrentProviderUseCustomFields && !customProviderSaved

  const selectedSavedProvider = useMemo(
    () => savedProviders.find((p) => p.id === provider),
    [provider, savedProviders],
  )

  // Use a unified base URL for API calls
  const unifiedEndpoint = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL // Remove trailing slash
  
  // 获取当前选中的模型信息（提前定义，供 fullApiPath 使用）
  const selectedModelInfoForPath = useMemo(() => {
    if (provider === "openrouter" && model) {
      const modelIdWithoutFree = model.endsWith(":free") ? model.slice(0, -5) : model
      return openrouterModels.find((m) => m.id === modelIdWithoutFree)
    }
    if (provider === "cerebras" && model) {
      return cerebrasModels.find((m) => m.id === model)
    }
    if (provider === "modelscope" && model) {
      return modelscopeModels.find((m) => m.id === model)
    }
    return null
  }, [provider, model, openrouterModels, cerebrasModels, modelscopeModels])
  
  // 根据 ModelScope 的 task_types 动态选择 API 路径
  const fullApiPath = useMemo(() => {
    if (provider === "modelscope" && selectedModelInfoForPath) {
      const modelScopeInfo = selectedModelInfoForPath as ModelScopeModel
      if (modelscopeHasImageGenerationTask(modelScopeInfo)) {
        return "https://api-inference.modelscope.cn/v1/images/generations"
      } else {
        return "https://api-inference.modelscope.cn/v1/chat/completions"
      }
    }
    // 其他提供商使用统一的 baseURL + apiPath
    return `${unifiedEndpoint}${apiPath}`
  }, [provider, selectedModelInfoForPath, unifiedEndpoint, apiPath])

  useEffect(() => {
    if (typeof window === "undefined") return
    const providers = loadCustomProvidersFromStorage(localStorage)
    if (providers.length > 0) {
      setSavedProviders(providers)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    saveCustomProvidersToStorage(localStorage, savedProviders)
  }, [savedProviders])

  useEffect(() => {
    if (provider === "custom") return
    const savedProvider = savedProviders.find((p) => p.id === provider)
    if (savedProvider) {
      setCustomProviderName(savedProvider.name)
    } else if (API_PROVIDERS.some((p) => p.id === provider)) {
      setCustomProviderName("")
    }
  }, [provider, savedProviders])

  useEffect(() => {
    setCustomProviderError("")
  }, [provider])

  useEffect(() => {
    if (!customProviderStatusMessage) return
    const timer = setTimeout(() => setCustomProviderStatusMessage(""), 2000)
    return () => clearTimeout(timer)
  }, [customProviderStatusMessage])

  useEffect(() => {
    saveSettingsToStorage(localStorage, settingsState)
  }, [settingsState])

  const saveToModelHistory = (status: "idle" | "success" | "error", duration: number | null) => {
    const newItem: ModelHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      provider,
      model,
      apiKey,
      baseURL,
      apiPath,
      status,
      duration,
    }

    setModelHistory((prev) => {
      // Remove existing items with same provider, model, and apiKey
      const filtered = prev.filter(
        (item) =>
          !(item.provider === newItem.provider && item.model === newItem.model && item.apiKey === newItem.apiKey),
      )
      return [newItem, ...filtered]
    })
  }

  const readLocalFile = async (filePath: string): Promise<string | null> => {
    try {
      return await fetchText(filePath)
    } catch (error) {
      const errorMessage = describeFetchTextError(error)

      toast({
        variant: "destructive",
        title: "文件读取失败",
        description: errorMessage,
      })
      return null
    }
  }

  const handleLocalFileSelect = async (type: "prompt" | "systemPrompt") => {
    console.log("[v0] handleLocalFileSelect called with type:", type)
    console.log("[v0] enablePromptFile:", enablePromptFile, "enableSystemPromptFile:", enableSystemPromptFile)

    try {
      const picked = await pickLocalTextFile()
      if (!picked) {
        console.log("[v0] No file selected")
        return null
      }

      const { content, fileName, handle } = picked
      console.log("[v0] File loaded successfully:", fileName, "Content length:", content.length)

      if (type === "prompt") {
        promptFileHandleRef.current = handle
        if (handle) {
          const saved = await saveFileHandle("promptFileHandle", handle)
          console.log("[v0] Prompt file handle save result:", saved)
        }
        setIsPromptFromLocalFile(true)
        setLoadedPromptContent(content)
        setPromptFilePath(fileName)
        toast({
          title: "文件加载成功",
          description: `已加载本地文件: ${fileName}`,
        })
        return content
      }

      systemPromptFileHandleRef.current = handle
      if (handle) {
        const saved = await saveFileHandle("systemPromptFileHandle", handle)
        console.log("[v0] System prompt file handle save result:", saved)
      }
      setIsSystemPromptFromLocalFile(true)
      setLoadedSystemPromptContent(content)
      setSystemPromptFilePath(fileName)
      toast({
        title: "文件加载成功",
        description: `已加载本地文件: ${fileName}`,
      })
      return content
    } catch (error) {
      console.log("[v0] File select failed:", error)
      return null
    }
  }

  const reloadLocalFile = async (type: "prompt" | "systemPrompt"): Promise<string | null> => {
    const fileHandleRef = type === "prompt" ? promptFileHandleRef : systemPromptFileHandleRef
    const setContent = type === "prompt" ? setLoadedPromptContent : setLoadedSystemPromptContent
    const handleKey = type === "prompt" ? "promptFileHandle" : "systemPromptFileHandle"

    console.log(`[v0] reloadLocalFile called for ${type}`)
    console.log(`[v0] Current ref handle:`, fileHandleRef.current ? "exists" : "null")

    const result = await readTextFromHandleKey(handleKey, fileHandleRef.current)
    if (result.ok) {
      fileHandleRef.current = result.handle
      setContent(result.content)
      console.log(`[v0] Reloaded ${type} from file handle, content length:`, result.content.length)
      return result.content
    }
    console.log(`[v0] Failed to reload ${type} from file handle:`, result.reason)
    fileHandleRef.current = result.handle

    // File handle is missing or invalid, prompt user to re-select
    console.log(`[v0] File handle missing for ${type}, prompting user to re-select`)
    toast({
      title: "需要重新选择文件",
      description: "请点击确认授权文件访问，或重新选择文件。",
    })

    // Automatically open file picker
    const content = await handleLocalFileSelect(type)
    return content
  }

  useEffect(() => {
    preloadHttpTextSource({
      enabled: enablePromptFile,
      path: promptFilePath,
      isFromLocalFile: isPromptFromLocalFile,
      readHttp: readLocalFile,
      setLoadedContent: setLoadedPromptContent,
      onError: (error) => console.error("Failed to load prompt file:", error),
    })

    if (!enablePromptFile) {
      setLoadedPromptContent("")
      setIsPromptFromLocalFile(false)
      promptFileHandleRef.current = null
      deleteFileHandle("promptFileHandle")
    }
  }, [enablePromptFile, promptFilePath, isPromptFromLocalFile])

  useEffect(() => {
    preloadHttpTextSource({
      enabled: enableSystemPromptFile,
      path: systemPromptFilePath,
      isFromLocalFile: isSystemPromptFromLocalFile,
      readHttp: readLocalFile,
      setLoadedContent: setLoadedSystemPromptContent,
      onError: (error) => console.error("Failed to load system prompt file:", error),
    })

    if (!enableSystemPromptFile) {
      setLoadedSystemPromptContent("")
      setIsSystemPromptFromLocalFile(false)
      systemPromptFileHandleRef.current = null
      deleteFileHandle("systemPromptFileHandle")
    }
  }, [enableSystemPromptFile, systemPromptFilePath, isSystemPromptFromLocalFile])

  const handleReloadImages = async (): Promise<MessageImage[]> => {
    if (messageImages.length === 0) return messageImages

    console.log("[v0] Reloading images and clearing cache...")

    const reloadedImages = await reloadMessageImages(messageImages)
    setMessageImages(reloadedImages)
    console.log("[v0] Image reload complete")
    return reloadedImages
  }

  const runProbeTest = async () => {
    if (!apiKey || !model || !fullApiPath) return // Added fullApiPath check
    if (isProbeTesting) return // 防止重复点击

    setIsProbeTesting(true)
    setError("")
    setRequestData("")
    setResponseData("")
    toast({
      title: "探针测试开始",
      description: `提供商: ${provider}, 模型: ${model}`,
      className: "bg-blue-50 border-blue-200",
      duration: 3000,
    })

    try {
      const startTime = performance.now()

      // 检查是否是 ModelScope 的图片生成模型
      const isModelScopeImageGeneration =
        provider === "modelscope" &&
        !!selectedModelInfoForPath &&
        modelscopeHasImageGenerationTask(selectedModelInfoForPath as ModelScopeModel)

      const { requestBody, requestCurl } = buildProbeRequest({
        provider,
        baseURL,
        apiKey,
        fullApiPath,
        model,
        systemPrompt,
        isModelScopeImageGeneration,
      })

      setRequestData(requestCurl)

      const response = await fetch(fullApiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000), // 10 second timeout for probe
      })

      const duration = Math.round(performance.now() - startTime)
      setProbeDuration(duration)

      // Check if response is JSON
      const contentType = response.headers.get("content-type")
      const responseText = await response.text()
      setResponseData(formatResponseForDisplay(response, responseText))

      if (!contentType?.includes("application/json")) {
        setProbeStatus("error")
        saveToModelHistory("error", duration)
        toast({
          variant: "destructive",
          title: "探针测试失败",
          description: `服务器返回非JSON响应 (状态码: ${response.status})`,
          duration: 3000,
        })
        setIsProbeTesting(false)
        return
      }

      let data: any
      try {
        data = JSON.parse(responseText)
      } catch {
        data = null
      }

      if (response.ok && data?.choices?.[0]?.message) {
        setProbeStatus("success")
        saveToModelHistory("success", duration)
        toast({
          title: "探针测试成功",
          description: `API 配置正常，响应用时: ${duration}ms`,
          className: "bg-green-50 border-green-200", // Custom styling for success toast
          duration: 3000, // 3 seconds
        })
      } else {
        setProbeStatus("error")
        saveToModelHistory("error", duration)
        toast({
          variant: "destructive",
          title: "探针测试失败",
          description: data?.error?.message || "API 返回异常",
          duration: 3000, // 3 seconds
        })
      }
    } catch (error) {
      setProbeStatus("error")
      setProbeDuration(null)
      setResponseData(
        JSON.stringify(
          {
            error: error instanceof Error ? error.message : "Unknown Error",
          },
          null,
          2,
        ),
      )
      saveToModelHistory("error", null)
      toast({
        variant: "destructive",
        title: "探针测试失败",
        description: error instanceof Error ? error.message : "网络请求失败",
        duration: 3000, // 3 seconds
      })
    } finally {
      setIsProbeTesting(false)
    }
  }

  // CHANGE: Increased delay from 500ms to 5000ms (5 seconds) to prevent rapid probe firing when quickly changing settings
  useEffect(() => {
    if (apiKey && model && fullApiPath) {
      // 5 second delay to avoid triggering probe on rapid configuration changes
      const timer = setTimeout(() => {
        runProbeTest()
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setProbeStatus("idle") // Reset status if any condition is not met
    }
  }, [apiKey, model, fullApiPath]) // Dependencies for the effect

  const handleProviderChange = (providerId: string) => {
    setProvider(providerId)
    setCustomProviderSaved(false)
    setCustomProviderStatusMessage("")
    setIsEditingCustomProvider(false)
    const selectedProvider = API_PROVIDERS.find((p) => p.id === providerId)
    if (selectedProvider) {
      if (selectedProvider.endpoint) {
        // For known providers, parse endpoint into baseURL and apiPath
        try {
          const url = new URL(selectedProvider.endpoint)
          setBaseURL(url.origin)
          setApiPath(url.pathname)
        } catch (e) {
          console.error("Invalid endpoint format:", selectedProvider.endpoint, e)
          setBaseURL("")
          setApiPath(selectedProvider.endpoint) // Fallback to full endpoint if URL parsing fails
        }
      } else {
        setBaseURL("")
        setApiPath("/v1/chat/completions") // Default path for custom provider
      }
      setCustomProviderName(selectedProvider.id === "custom" ? "" : selectedProvider.name)
    } else {
      const savedProvider = savedProviders.find((p) => p.id === providerId)
      if (savedProvider) {
        setBaseURL(savedProvider.baseURL)
        setApiPath(savedProvider.apiPath)
        if (savedProvider.apiKey) {
          setApiKey(savedProvider.apiKey)
        }
        setCustomProviderName(savedProvider.name)
      } else {
        setBaseURL("")
        setApiPath("/v1/chat/completions")
        setCustomProviderName("")
      }
    }

    if (providerId === "openrouter") {
      fetchOpenRouterModels()
    } else if (providerId === "cerebras") {
      fetchCerebrasModels()
    } else if (providerId === "modelscope") {
      fetchModelScopeModels()
      // ModelScope 使用固定的 baseURL，但 fullApiPath 会根据 task_types 动态选择
      setBaseURL("https://api-inference.modelscope.cn")
      setApiPath("/v1/chat/completions") // 默认路径，实际会根据 task_types 在 fullApiPath 中覆盖
    }
  }

  const handleSaveCustomProvider = () => {
    setCustomProviderError("")
    const trimmedName = customProviderName.trim()
    const trimmedBaseURL = baseURL.trim()
    const trimmedApiPath = apiPath.trim()

    if (!trimmedName) {
      setCustomProviderError("请输入提供商名称")
      return
    }

    const normalizedName = trimmedName.toLowerCase()
    const existingNames = [
      ...API_PROVIDERS.map((p) => p.name.toLowerCase()),
      ...savedProviders.map((p) => p.name.toLowerCase()),
    ]
    if (existingNames.includes(normalizedName)) {
      setCustomProviderError("提供商名称不能重复")
      return
    }

    if (!trimmedBaseURL) {
      setCustomProviderError("请输入 Base URL")
      return
    }

    if (!trimmedApiPath) {
      setCustomProviderError("请输入 API Path")
      return
    }

    const newProvider: CustomProviderConfig = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      baseURL: trimmedBaseURL,
      apiPath: trimmedApiPath,
      apiKey,
    }

    setSavedProviders((prev) => [...prev, newProvider])
    setProvider(newProvider.id)
    setCustomProviderSaved(true)
    setCustomProviderStatusMessage("保存成功")
    setIsEditingCustomProvider(false)
    toast({
      title: "已保存自定义提供商",
      description: `${trimmedName} 已添加到提供商列表`,
    })
  }

  const handleDeleteCustomProvider = () => {
    const providerToDelete = savedProviders.find((p) => p.id === provider)
    if (!providerToDelete) return
    setSavedProviders((prev) => prev.filter((p) => p.id !== providerToDelete.id))
    setCustomProviderSaved(true)
    setCustomProviderStatusMessage("删除成功")
    setCustomProviderError("")
    setIsEditingCustomProvider(false)
    if (provider === providerToDelete.id) {
      setProvider("custom")
      setBaseURL("")
      setApiPath("/v1/chat/completions")
      setApiKey("")
      setCustomProviderName("")
    }
    toast({
      title: "已删除自定义提供商",
      description: `${providerToDelete.name} 已被移除`,
    })
  }

  const fetchCerebrasModels = async () => {
    setIsLoadingModels(true)
    try {
      const models = await fetchCerebrasModelCatalog()
      setCerebrasModels(models)
    } catch (error) {
      console.error("[v0] Error fetching Cerebras models:", error)
      setCerebrasModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  const fetchModelScopeModels = async () => {
    setIsLoadingModels(true)
    try {
      const models = await fetchModelScopeModelCatalog()
      setModelscopeModels(models)
    } catch (error) {
      console.error("[v0] Error fetching ModelScope models:", error)
      setModelscopeModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  const fetchOpenRouterModels = async () => {
    setIsLoadingModels(true)
    try {
      const models = await fetchOpenRouterModelCatalog()
      setOpenrouterModels(models)
    } catch (error) {
      console.error("[v0] Error fetching OpenRouter models:", error)
      setOpenrouterModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  useEffect(() => {
    if (provider === "openrouter") {
      fetchOpenRouterModels()
    } else if (provider === "cerebras") {
      fetchCerebrasModels()
    } else if (provider === "modelscope") {
      fetchModelScopeModels()
    } else {
      // Clear available modalities when switching away from OpenRouter
      setAvailableInputModalities([])
      setAvailableOutputModalities([])
    }
  }, [provider])

  const handleTest = async () => {
    // if (loading) return // Prevent multiple simultaneous tests
    console.log("[v0] handleTest called, loading:", loading)

    setLoading(true)
    setError("")
    setRequestData("")
    setResponseData("")
    setResponseDuration(null)
    abortControllerRef.current = new AbortController()

    // CHANGE: Store reloaded images in a variable to use in the API request
    let currentImages = messageImages

    if (autoReloadImages && messageImages.some((img) => img.type === "url")) {
      console.log("[v0] Auto-reloading images before test...")

      const reloadToast = toast({
        title: "正在重载图片",
        description: `正在重新加载 ${messageImages.filter((img) => img.type === "url").length} 张图片...`,
        duration: Number.POSITIVE_INFINITY, // Never auto-dismiss
      })

      currentImages = await handleReloadImages()

      reloadToast.dismiss()
      toast({
        title: "图片重载完成",
        description: "所有图片已更新，开始测试...",
        className: "bg-green-50 border-green-200",
        duration: 2000,
      })
    }

    if (!apiKey) {
      setError("Please provide an API key")
      toast({
        variant: "destructive",
        title: "错误",
        description: "请提供 API Key",
      })
      setLoading(false) // Ensure loading is set to false on error
      return
    }

    const modelToUse = model || DEFAULT_VALUES.model

    console.log("[v0] enablePromptFile:", enablePromptFile)
    console.log("[v0] autoReloadPrompt:", autoReloadPrompt)
    console.log("[v0] isPromptFromLocalFile:", isPromptFromLocalFile)
    console.log("[v0] promptFileHandleRef.current:", promptFileHandleRef.current)
    console.log("[v0] promptFilePath:", promptFilePath)

    // Handle external system prompt loading
    const finalSystemPrompt = await resolveTextSource({
      enabled: enableSystemPromptFile,
      path: systemPromptFilePath,
      autoReload: autoReloadSystemPrompt,
      isFromLocalFile: isSystemPromptFromLocalFile,
      loadedContent: loadedSystemPromptContent,
      fallbackContent: systemPrompt,
      readHttp: readLocalFile,
      reloadLocal: () => reloadLocalFile("systemPrompt"),
      setLoadedContent: setLoadedSystemPromptContent,
    })

    console.log("[v0] Final system prompt length:", finalSystemPrompt.length)

    // Handle external user message loading
    const finalUserMessage = await resolveTextSource({
      enabled: enablePromptFile,
      path: promptFilePath,
      autoReload: autoReloadPrompt,
      isFromLocalFile: isPromptFromLocalFile,
      loadedContent: loadedPromptContent,
      fallbackContent: userMessage,
      readHttp: readLocalFile,
      reloadLocal: () => reloadLocalFile("prompt"),
      setLoadedContent: setLoadedPromptContent,
    })

    console.log("[v0] Final user message length:", finalUserMessage.length)

    // 检查是否是 ModelScope 的图片生成模型
    const isModelScopeImageGeneration =
      provider === "modelscope" &&
      !!selectedModelInfoForPath &&
      modelscopeHasImageGenerationTask(selectedModelInfoForPath as ModelScopeModel)

    const { messages, requestBody, requestCurl, requestContent } = buildLlmRequest({
      provider,
      baseURL,
      apiKey,
      fullApiPath,
      model: modelToUse,
      maxTokens,
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      stream,
      finalSystemPrompt,
      finalUserMessage,
      currentImages,
      isModelScopeImageGeneration,
    })

    setRequestData(requestCurl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 60000) // 60 second timeout

    try {
      const startTime = performance.now() // Track start time

      const response = await fetch(fullApiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal,
      })

      clearTimeout(timeoutId)

      const endTime = performance.now() // Track end time
      const duration = Math.round(endTime - startTime) // Calculate duration
      setResponseDuration(duration) // Set response duration state

      const responseText = await response.text()
      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        parsedResponse = responseText
      }

      const formattedResponse = JSON.stringify(
        {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: parsedResponse,
        },
        null,
        2,
      )
      setResponseData(formattedResponse)

      const { responseContent, responseImagesToSave } = parseResponseToContent(parsedResponse)

      const historyTimestamp = Date.now()
      const historyItem: HistoryItem = {
        id: historyTimestamp.toString(),
        timestamp: historyTimestamp,
        model: modelToUse, // Use the actual model used
        requestContent,
        requestRaw: requestCurl,
        responseContent,
        responseRaw: formattedResponse,
        duration: duration, // Store response time
      }

      // 保存响应图片到 IndexedDB（如果存在）
      if (responseImagesToSave.length > 0) {
        saveResponseImagesToDB(historyTimestamp, responseImagesToSave)
          .then(() => {
            // 更新状态中的图片映射
            const base64Images = responseImagesToSave.map((img) => img.base64 || img.url || "").filter(Boolean)
            if (base64Images.length > 0) {
              setResponseImagesMap((prev) => {
                const newMap = new Map(prev)
                newMap.set(historyTimestamp, base64Images)
                return newMap
              })
            }
          })
          .catch((error) => {
            console.error("[v0] Failed to save response images to IndexedDB:", error)
          })
      }

      setHistory((prev) => {
        const updated = [historyItem, ...prev]
        return updated
      })

      if (!response.ok) {
        const errorMsg = `API Error: ${response.status} - ${parsedResponse.error?.message || response.statusText}`
        setError(errorMsg)
        toast({
          variant: "destructive",
          title: "请求失败",
          description: `状态码 ${response.status}: ${parsedResponse.error?.message || response.statusText}`,
        })
      } else {
        toast({
          title: "请求成功",
          description: `API 响应状态: ${response.status}`,
        })
      }
    } catch (error: any) {
      // Changed to any to access error.name and error.message
      clearTimeout(timeoutId)
      console.error("[v0] Error during test:", error)

      if (error.name === "AbortError") {
        setError("测试已中断")
        toast({
          title: "测试已中断",
          description: "测试已被用户中断",
          duration: 2000,
        })
      } else if (error.message.includes("API key")) {
        setError(error.message)
        toast({
          variant: "destructive",
          title: "错误",
          description: error.message,
        })
      } else {
        setError(error.message || "An error occurred")
        toast({
          variant: "destructive",
          title: "错误",
          description: error.message || "发生未知错误",
        })
      }

      const errorResponse = JSON.stringify({ error: error.message || "Unknown error" }, null, 2)
      setResponseData(errorResponse)
      setResponseDuration(null) // Reset duration on error

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        model: modelToUse, // Add model to history item
        requestContent: "",
        requestRaw: "",
        responseContent: "",
        responseRaw: errorResponse,
      }
      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev]
        return updated
      })
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  const startTimer = () => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    setIsTimerRunning(true)

    // Execute handleTest immediately for the first time
    handleTest()

    // Set up the interval for subsequent calls
    timerRef.current = setInterval(() => {
      handleTest()
    }, timerInterval * 1000) // Convert seconds to milliseconds
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsTimerRunning(false)
  }

  const handleInterruptTest = () => {
    console.log("[v0] handleInterruptTest called")
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setLoading(false)
      abortControllerRef.current = null
      toast({
        title: "测试已中断",
        description: "测试已被用户中断",
        duration: 2000,
      })
    }
  }

  // Combine test and timer start logic
  const handleStartTest = () => {
    if (timerEnabled) {
      startTimer()
    } else {
      handleTest()
    }
  }

  const handleResetParameters = () => {
    stopTimer() // Ensure timer is stopped on reset

    dispatchSettings({
      type: "patch",
      patch: {
        prompt: initialSettings.prompt,
        maxTokens: initialSettings.maxTokens,
        temperature: initialSettings.temperature,
        topP: initialSettings.topP,
        frequencyPenalty: initialSettings.frequencyPenalty,
        presencePenalty: initialSettings.presencePenalty,
        showRawColumns: initialSettings.showRawColumns,
        expandRequestContent: initialSettings.expandRequestContent,
        expandResponseContent: initialSettings.expandResponseContent,
        timerEnabled: initialSettings.timerEnabled,
        timerInterval: initialSettings.timerInterval,
        autoReloadPrompt: initialSettings.autoReloadPrompt,
        autoReloadSystemPrompt: initialSettings.autoReloadSystemPrompt,
        autoReloadImages: initialSettings.autoReloadImages,
        systemPrompt: initialSettings.systemPrompt,
        userMessage: initialSettings.userMessage,
        promptFilePath: initialSettings.promptFilePath,
        enablePromptFile: initialSettings.enablePromptFile,
        systemPromptFilePath: initialSettings.systemPromptFilePath,
        enableSystemPromptFile: initialSettings.enableSystemPromptFile,
        isPromptFromLocalFile: initialSettings.isPromptFromLocalFile,
        isSystemPromptFromLocalFile: initialSettings.isSystemPromptFromLocalFile,
        imageUrl: initialSettings.imageUrl,
        showImageUrlInput: initialSettings.showImageUrlInput,
        isAddingImageUrl: initialSettings.isAddingImageUrl,
      },
    })
    dispatchRun({
      type: "patch",
      patch: {
        stream: initialRunState.stream,
        responseDuration: initialRunState.responseDuration,
      },
    })

    setLoadedPromptContent("")
    setLoadedSystemPromptContent("")
    promptFileHandleRef.current = null
    systemPromptFileHandleRef.current = null
    deleteFileHandle("promptFileHandle")
    deleteFileHandle("systemPromptFileHandle")

    setMessageImages([])
    setZoomedImage(null)

    localStorage.removeItem(SETTINGS_STORAGE_KEY)
  }

  const handleReset = () => {
    stopTimer() // Ensure timer is stopped on reset

    dispatchSettings({ type: "patch", patch: initialSettings })
    dispatchRun({ type: "patch", patch: initialRunState })

    setShowApiKey(false)
    setIsCustomModel(false)
    setTranslatedDescription("")
    setIsTranslating(false)
    setTranslationError("")

    setLoadedPromptContent("")
    setLoadedSystemPromptContent("")
    promptFileHandleRef.current = null
    systemPromptFileHandleRef.current = null
    deleteFileHandle("promptFileHandle")
    deleteFileHandle("systemPromptFileHandle")

    setMessageImages([])
    setZoomedImage(null)

    setCustomProviderName("")
    setCustomProviderError("")
    setCustomProviderSaved(false)
    setCustomProviderStatusMessage("")
    setIsEditingCustomProvider(false)

    localStorage.removeItem(SETTINGS_STORAGE_KEY)
  }

  const deleteModelHistoryItem = (id: string) => {
    setModelHistory((prev) => prev.filter((item) => item.id !== id))
    toast({
      title: "记录已删除",
      duration: 2000,
    })
  }

  const toggleApiKeyVisibility = (itemId: string) => {
    setVisibleApiKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  const runHistoryProbeTest = async (item: ModelHistoryItem) => {
    if (!item.apiKey || !item.model) return

    const fullPath = item.baseURL ? `${item.baseURL}${item.apiPath}` : item.apiPath

    toast({
      title: "探针测试开始",
      description: `提供商: ${item.provider}, 模型: ${item.model}`,
      className: "bg-blue-50 border-blue-200",
      duration: 3000,
    })

    try {
      const startTime = performance.now()

      const isModelScopeImageGeneration =
        item.provider === "modelscope" && (item.apiPath.includes("/images/") || item.apiPath.includes("images/generations"))

      const { requestBody } = buildProbeRequest({
        provider: item.provider,
        baseURL: item.baseURL,
        apiKey: item.apiKey,
        fullApiPath: fullPath,
        model: item.model,
        systemPrompt,
        isModelScopeImageGeneration,
      })

      const response = await fetch(fullPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${item.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(10000),
      })

      const duration = Math.round(performance.now() - startTime)

      const contentType = response.headers.get("content-type")
      if (!contentType?.includes("application/json")) {
        setModelHistory((prev) =>
          prev.map((h) => (h.id === item.id ? { ...h, status: "error" as const, duration } : h)),
        )
        toast({
          variant: "destructive",
          title: "探针测试失败",
          description: `服务器返回非JSON响应 (状态码: ${response.status})`,
          duration: 3000,
        })
        return
      }

      const data = await response.json()

      if (response.ok && data.choices?.[0]?.message) {
        setModelHistory((prev) =>
          prev.map((h) => (h.id === item.id ? { ...h, status: "success" as const, duration } : h)),
        )
        toast({
          title: "探针测试成功",
          description: `API 配置正常，响应用时: ${duration}ms`,
          className: "bg-green-50 border-green-200",
          duration: 3000,
        })
      } else {
        setModelHistory((prev) =>
          prev.map((h) => (h.id === item.id ? { ...h, status: "error" as const, duration } : h)),
        )
        toast({
          variant: "destructive",
          title: "探针测试失败",
          description: data.error?.message || "API 返回异常",
          duration: 3000,
        })
      }
    } catch (error) {
      setModelHistory((prev) =>
        prev.map((h) => (h.id === item.id ? { ...h, status: "error" as const, duration: null } : h)),
      )
      toast({
        variant: "destructive",
        title: "探针测试失败",
        description: error instanceof Error ? error.message : "未知错误",
        duration: 3000,
      })
    }
  }

  const exportHistoryToCSV = () => {
    if (history.length === 0) return

    const csv = buildHistoryCsv({ history, showRawColumns })
    downloadTextFile({
      text: "\uFEFF" + csv,
      filename: `llm_api_history_${Date.now()}.csv`,
      mimeType: "text/csv;charset=utf-8;",
    })
  }

  const toggleCellExpansion = (cellId: string) => {
    setExpandedCells((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cellId)) {
        newSet.delete(cellId)
      } else {
        newSet.add(cellId)
      }
      return newSet
    })
  }

  const toggleRawVisibility = (cellId: string) => {
    setVisibleRawCells((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(cellId)) {
        newSet.delete(cellId)
      } else {
        newSet.add(cellId)
      }
      return newSet
    })
  }

  const totalPages = getTotalPages(history.length, pageSize)
  const paginatedHistory = slicePage(history, currentPage, pageSize)

  const [requestCopyText, setRequestCopyText] = useState("复制")
  const [responseCopyText, setResponseCopyText] = useState("复制")

  const handleCopy = async (text: string, type: "request" | "response") => {
    const setText = type === "request" ? setRequestCopyText : setResponseCopyText

    const ok = await copyTextToClipboard(text)
    if (ok) {
      setText("已复制!")
      setTimeout(() => setText("复制"), 2000)
      return
    }

    toast({
      title: "复制失败",
      description: "无法访问剪贴板，请手动复制",
      variant: "destructive",
    })
  }

  // </CHANGE>

  const expandAllHistory = false // Placeholder to resolve lint error, can be replaced with actual state if needed.

  const applyHistoryItem = (item: ModelHistoryItem) => {
    setProvider(item.provider)
    setModel(item.model)
    setApiKey(item.apiKey)
    setBaseURL(item.baseURL)
    setApiPath(item.apiPath)

    // Re-evaluate local file states based on loaded values
    // This is a simplified approach; a more robust solution might involve checking if apiKey/baseURL/apiPath match known file paths.
    // For now, we assume if provider is custom and baseURL/apiPath are set, they might be from a file.
    // However, directly inferring from file path after loading from history is complex.
    // We'll reset them to false and rely on the user to re-select if needed.
    setIsPromptFromLocalFile(false)
    promptFileHandleRef.current = null
    setIsSystemPromptFromLocalFile(false)
    systemPromptFileHandleRef.current = null

    toast({
      title: "配置已应用",
      description: `已应用 ${item.provider} - ${item.model} 的配置`,
      className: "bg-blue-50 border-blue-200",
      duration: 2000,
    })
  }

  // 自动保存 modelHistory 到 localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    if (modelHistory.length === 0) return
    saveModelHistoryToStorage(localStorage, modelHistory)
  }, [modelHistory])

  const clearModelHistory = () => {
    setModelHistory([])
    setModelHistoryPage(1)
    clearModelHistoryFromStorage(localStorage)
    toast({
      title: "历史记录已清空",
      duration: 2000,
    })
  }

  const exportModelHistoryToCSV = () => {
    if (modelHistory.length === 0) {
      toast({
        variant: "destructive",
        title: "无数据导出",
        description: "历史记录为空",
        duration: 2000,
      })
      return
    }

    const csv = buildModelHistoryCsv(modelHistory)
    downloadTextFile({
      text: "\ufeff" + csv,
      filename: `model-history-${Date.now()}.csv`,
      mimeType: "text/csv;charset=utf-8;",
    })

    toast({
      title: "导出成功",
      description: `已导出 ${modelHistory.length} 条记录`,
      className: "bg-green-50 border-green-200",
      duration: 2000,
    })
  }

  const modelHistoryTotalPages = getTotalPages(modelHistory.length, modelHistoryPageSize)
  const paginatedModelHistory = slicePage(modelHistory, modelHistoryPage, modelHistoryPageSize)

  const filteredOpenRouterModels = useMemo(() => {
    let filtered = openrouterModels

    // Filter by search query - 从 model id 和 name 匹配
    if (modelSearchQuery.trim()) {
      const query = modelSearchQuery.toLowerCase()
      filtered = filtered.filter((model) => {
        const idMatch = model.id.toLowerCase().includes(query)
        const nameMatch = model.name?.toLowerCase().includes(query) || false
        return idMatch || nameMatch
      })
    }

    return filtered
  }, [openrouterModels, modelSearchQuery])

  const filteredCerebrasModels = useMemo(() => {
    let filtered = cerebrasModels

    // Filter by search query - 从 model id 和 name 匹配
    if (modelSearchQuery.trim()) {
      const query = modelSearchQuery.toLowerCase()
      filtered = filtered.filter((model) => {
        const idMatch = model.id.toLowerCase().includes(query)
        const nameMatch = model.name?.toLowerCase().includes(query) || false
        return idMatch || nameMatch
      })
    }

    return filtered
  }, [cerebrasModels, modelSearchQuery])

  const filteredModelScopeModels = useMemo(() => {
    let filtered = modelscopeModels

    // Filter by search query - 从 model id 和 name 匹配
    if (modelSearchQuery.trim()) {
      const query = modelSearchQuery.toLowerCase()
      filtered = filtered.filter((model) => {
        const idMatch = model.id.toLowerCase().includes(query)
        const nameMatch = model.name?.toLowerCase().includes(query) || false
        return idMatch || nameMatch
      })
    }

    return filtered
  }, [modelscopeModels, modelSearchQuery])

  // 获取当前选中的模型信息（使用 selectedModelInfoForPath 的别名，保持代码一致性）
  const selectedModelInfo = selectedModelInfoForPath

  // 获取当前选中模型的显示名称（用于下拉框按钮显示）
  const selectedModelDisplayName = useMemo(() => {
    if (provider === "openrouter" && model && selectedModelInfo) {
      return selectedModelInfo.name || selectedModelInfo.id
    }
    if (provider === "cerebras" && model && selectedModelInfo) {
      return selectedModelInfo.name || selectedModelInfo.id
    }
    if (provider === "modelscope" && model && selectedModelInfo) {
      return selectedModelInfo.name || selectedModelInfo.id
    }
    return model || ""
  }, [provider, model, selectedModelInfo])

  // 翻译 description 为中文（带备用机制）
  const translateDescription = useCallback(async (text: string) => {
    if (!text) {
      console.log("[v0] translateDescription: 文本为空，跳过翻译")
      return
    }
    
    console.log("[v0] translateDescription: 开始翻译，文本长度:", text.length)
    setIsTranslating(true)
    setTranslatedDescription("") // 清空之前的翻译结果
    setTranslationError("") // 清空之前的错误信息
    try {
      const { translatedText, errorMessage } = await translateEnToZhWithFallback(text)
      if (errorMessage) {
        setTranslationError(errorMessage)
      }
      setTranslatedDescription(translatedText)
    } catch (error) {
      console.error("[v0] Error translating description:", error)
      setTranslatedDescription("")
      setTranslationError(`翻译失败：${error instanceof Error ? error.message : "网络请求失败"}`)
    } finally {
      setIsTranslating(false)
    }
  }, [])

  // 当 selectedModelInfo 的 description 变化时，自动翻译
  useEffect(() => {
    console.log("[v0] Translation useEffect 触发:", {
      provider,
      hasDescription: !!selectedModelInfo?.description,
      descriptionLength: selectedModelInfo?.description?.length,
      modelId: selectedModelInfo?.id
    })
    
    // 清空之前的翻译结果和错误信息
    setTranslatedDescription("")
    setIsTranslating(false)
    setTranslationError("")
    
    if (provider === "openrouter" && selectedModelInfo?.description) {
      const description = selectedModelInfo.description.trim()
      if (!description) {
        console.log("[v0] Translation: description 为空，跳过翻译")
        return
      }
      
      // 检查是否已经是中文（简单判断：如果包含中文字符，可能已经是中文）
      const hasChinese = /[\u4e00-\u9fa5]/.test(description)
      console.log("[v0] Translation: 检查中文", { hasChinese, descriptionPreview: description.substring(0, 50) })
      
      if (!hasChinese) {
        // 延迟一点执行，确保状态已重置
        console.log("[v0] Translation: 准备翻译，延迟 100ms")
        const timer = setTimeout(() => {
          console.log("[v0] Translation: 开始调用 translateDescription")
          translateDescription(description)
        }, 100)
        return () => {
          console.log("[v0] Translation: 清理定时器")
          clearTimeout(timer)
        }
      } else {
        console.log("[v0] Translation: 文本已包含中文，跳过翻译")
      }
    } else {
      console.log("[v0] Translation: 条件不满足", { provider, hasDescription: !!selectedModelInfo?.description })
    }
  }, [provider, selectedModelInfo?.description, selectedModelInfo?.id, translateDescription])

  const handleAddImageUrl = async () => {
    if (!imageUrl.trim()) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入图片链接",
      })
      return
    }

    setIsAddingImageUrl(true)

    try {
      const trimmedUrl = imageUrl.trim()
      const newImage = await buildMessageImageFromUrl(trimmedUrl)
      setMessageImages((prev) => [...prev, newImage])
      setImageUrl("")
      setShowImageUrlInput(false)
      toast({
        title: "成功",
        description: "图片已加载并添加",
      })
    } catch (error) {
      console.error("[v0] Error loading image from URL:", error) // Changed from "[v0] Error loading image from URL:"
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error instanceof Error ? error.message : "无法加载图片",
      })
    } finally {
      setIsAddingImageUrl(false)
    }
  }

  const handleImageFileUpload = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "请选择图片文件",
        })
        return
      }

      try {
        const newImage = await buildMessageImageFromFile(file)
        setMessageImages((prev) => [...prev, newImage])
        toast({
          title: "成功",
          description: `图片 ${file.name} 已添加`,
        })

        // Trigger auto-reload if enabled
        if (autoReloadImages) {
          console.log("[v0] Auto-reloading images after upload...")
          handleTest() // Re-run the test
        }
      } catch (error) {
        console.error("[v0] Error reading image file:", error)
        toast({
          variant: "destructive",
          title: "错误",
          description: "读取图片文件失败",
        })
      }
    }

    input.click()
  }

  const handleRemoveImage = (imageId: string) => {
    setMessageImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  useEffect(() => {
    if (autoReloadImages && messageImages.some((img) => img.type === "url")) {
      console.log("[v0] Auto-reload images is enabled, images will be reloaded before next test")
    }
  }, [autoReloadImages, messageImages])

  const navbarNode = (
    <Navbar
      probeStatus={probeStatus}
      probeDuration={probeDuration}
      isProbeTesting={isProbeTesting}
      canProbeTest={!!apiKey && !!model && !!fullApiPath}
      runProbeTest={runProbeTest}
      provider={provider}
      providerOptions={providerOptions}
      selectedProviderName={selectedProviderOption?.name || provider}
      handleProviderChange={handleProviderChange}
      canCurrentProviderUseCustomFields={canCurrentProviderUseCustomFields}
      isEditingCustomProvider={isEditingCustomProvider}
      toggleCustomProviderEditing={() => {
        setIsEditingCustomProvider((prev) => !prev)
        setCustomProviderSaved(false)
        setCustomProviderStatusMessage("")
      }}
      isCustomModel={isCustomModel}
      setIsCustomModel={setIsCustomModel}
      model={model}
      setModel={setModel}
      isLoadingModels={isLoadingModels}
      selectedModelDisplayName={selectedModelDisplayName}
      modelSearchQuery={modelSearchQuery}
      setModelSearchQuery={setModelSearchQuery}
      filteredOpenRouterModels={filteredOpenRouterModels}
      filteredCerebrasModels={filteredCerebrasModels}
      filteredModelScopeModels={filteredModelScopeModels}
      apiKey={apiKey}
      setApiKey={setApiKey}
      showApiKey={showApiKey}
      setShowApiKey={setShowApiKey}
      handleReset={handleReset}
      shouldRenderCustomProviderFields={shouldRenderCustomProviderFields}
      customProviderName={customProviderName}
      setCustomProviderName={setCustomProviderName}
      customProviderError={customProviderError}
      setCustomProviderError={setCustomProviderError}
      setCustomProviderSaved={setCustomProviderSaved}
      customProviderStatusMessage={customProviderStatusMessage}
      setCustomProviderStatusMessage={setCustomProviderStatusMessage}
      baseURL={baseURL}
      setBaseURL={setBaseURL}
      apiPath={apiPath}
      setApiPath={setApiPath}
      handleSaveCustomProvider={handleSaveCustomProvider}
      handleDeleteCustomProvider={handleDeleteCustomProvider}
      selectedSavedProvider={selectedSavedProvider}
    />
  )

  const modelInfoNode =
    (provider === "openrouter" || provider === "cerebras" || provider === "modelscope") && selectedModelInfo ? (
      <SelectedModelInfoPanel
        provider={provider}
        selectedModelInfo={selectedModelInfo}
        isTranslating={isTranslating}
        translatedDescription={translatedDescription}
        translationError={translationError}
      />
    ) : null

  const modelHistoryProps = {
    modelHistory,
    paginatedModelHistory,
    modelHistoryTotalPages,
    modelHistoryPage,
    setModelHistoryPage,
    providerOptions,
    visibleApiKeys,
    toggleApiKeyVisibility,
    runHistoryProbeTest,
    applyHistoryItem,
    deleteModelHistoryItem,
    exportModelHistoryToCSV,
    clearModelHistory,
  } satisfies React.ComponentProps<typeof MainDashboard>["modelHistoryProps"]

  const parametersProps = {
    isExpanded: isParametersExpanded,
    setIsExpanded: setIsParametersExpanded,
    handleResetParameters,
    isTimerRunning,
    stopTimer,
    loading,
    handleInterruptTest,
    handleStartTest,
    enablePromptFile,
    userMessage,
    setUserMessage,
    isPromptExpanded,
    setIsPromptExpanded,
    showImageUrlInput,
    setShowImageUrlInput,
    imageUrl,
    setImageUrl,
    isAddingImageUrl,
    handleAddImageUrl,
    handleImageFileUpload,
    autoReloadImages,
    setAutoReloadImages,
    messageImages,
    setZoomedImage,
    handleRemoveImage,
    autoReloadPrompt,
    setAutoReloadPrompt,
    setEnablePromptFile,
    promptFilePath,
    onPromptFilePathChange: (value: string) => {
      setPromptFilePath(value)
      setIsPromptFromLocalFile(false)
      promptFileHandleRef.current = null
      setLoadedPromptContent("")
    },
    loadedPromptContent,
    isPromptFromLocalFile,
    canReloadPromptLocalFile: !!promptFileHandleRef.current,
    reloadPromptLocalFile: () => reloadLocalFile("prompt"),
    isExternalPromptExpanded,
    setIsExternalPromptExpanded,
    pickPromptLocalFile: () => handleLocalFileSelect("prompt"),
    enableSystemPromptFile,
    systemPrompt,
    setSystemPrompt,
    isSystemPromptExpanded,
    setIsSystemPromptExpanded,
    autoReloadSystemPrompt,
    setAutoReloadSystemPrompt,
    setEnableSystemPromptFile,
    systemPromptFilePath,
    onSystemPromptFilePathChange: (value: string) => {
      setSystemPromptFilePath(value)
      setIsSystemPromptFromLocalFile(false)
      systemPromptFileHandleRef.current = null
      setLoadedSystemPromptContent("")
    },
    loadedSystemPromptContent,
    isSystemPromptFromLocalFile,
    canReloadSystemPromptLocalFile: !!systemPromptFileHandleRef.current,
    reloadSystemPromptLocalFile: () => reloadLocalFile("systemPrompt"),
    isExternalSystemPromptExpanded,
    setIsExternalSystemPromptExpanded,
    pickSystemPromptLocalFile: () => handleLocalFileSelect("systemPrompt"),
    timerEnabled,
    setTimerEnabled,
    timerInterval,
    setTimerInterval,
    maxTokens,
    setMaxTokens,
    maxTokensLimit,
    setMaxTokensLimit,
    temperature,
    setTemperature,
    topP,
    setTopP,
    frequencyPenalty,
    setFrequencyPenalty,
    presencePenalty,
    setPresencePenalty,
    error,
  } satisfies React.ComponentProps<typeof MainDashboard>["parametersProps"]

  const historyChatProps = {
    history,
    paginatedHistory,
    showRawColumns,
    setShowRawColumns,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    expandedCells,
    toggleCellExpansion,
    visibleRawCells,
    toggleRawVisibility,
    expandRequestContent,
    setExpandRequestContent,
    expandResponseContent,
    setExpandResponseContent,
    handleClearHistory,
    exportHistoryToCSV,
    handleDeleteHistoryItem,
    responseImagesMap,
    onZoomImage: setZoomedImage,
  } satisfies React.ComponentProps<typeof MainDashboard>["historyChatProps"]

  const requestResponseProps = {
    requestData,
    requestCopyText,
    responseData,
    responseCopyText,
    responseDuration,
    handleCopy,
  } satisfies React.ComponentProps<typeof MainDashboard>["requestResponseProps"]

  return (
    <AppShell navbar={navbarNode} modelInfo={modelInfoNode} zoomedImage={zoomedImage} setZoomedImage={setZoomedImage}>
      <MainDashboard
        modelHistoryProps={modelHistoryProps}
        parametersProps={parametersProps}
        historyChatProps={historyChatProps}
        requestResponseProps={requestResponseProps}
      />
    </AppShell>
  )
}
