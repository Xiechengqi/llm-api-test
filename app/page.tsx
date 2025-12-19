"use client"

import { TableHeader } from "@/components/ui/table"

import { CardDescription } from "@/components/ui/card"
import {
  Copy,
  Pencil,
  List,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Play,
  StopCircle,
  Download,
  Zap,
  Activity,
  Check,
  FileText,
  Upload,
} from "lucide-react" // Import Copy, Pencil, List, Eye, EyeOff, RotateCcw, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Calendar, Check, Clock, X, Play, StopCircle icons

import { useState, useEffect, useRef } from "react" // Import useRef
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { TableBody, TableCell, TableHead, TableRow, Table } from "@/components/ui/table" // Import Table components

const DB_NAME = "llm-api-tester-db"
const DB_VERSION = 1
const STORE_NAME = "fileHandles"

// Declare verifyFilePermission here if it's expected to be globally available or imported elsewhere
declare global {
  interface Window {
    // Define verifyFilePermission if it's a global function attached to window
    verifyFilePermission?: (handle: FileSystemFileHandle) => Promise<boolean>
  }
}

// Assume verifyFilePermission is available globally or imported
// If it's a locally defined function, it should be declared above or imported.
// For the purpose of this merge, we'll assume it's correctly defined or imported elsewhere.
// If it's expected to be a new function, it needs to be implemented.
const verifyFilePermission = async (handle: FileSystemFileHandle): Promise<boolean> => {
  // Placeholder implementation. Replace with actual logic if this is a new function.
  // This is often part of the File System Access API polyfill or a custom implementation.
  try {
    if (handle.queryPermission) {
      // Check if the method exists (modern browsers)
      const status = await handle.queryPermission({ mode: "readwrite" })
      return status === "granted"
    }
    // Fallback for environments where queryPermission might not be available but granted is implied
    // This is a simplified assumption. Real-world scenarios might need more complex checks.
    return true // Assume granted if queryPermission is not available or if it implies granted by default
  } catch (error) {
    console.error("Error checking file permission:", error)
    return false
  }
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => {
      console.log("[v0] IndexedDB open error:", request.error)
      reject(request.error)
    }
    request.onsuccess = () => {
      console.log("[v0] IndexedDB opened successfully")
      resolve(request.result)
    }
    request.onupgradeneeded = (event) => {
      console.log("[v0] IndexedDB upgrade needed, creating object store")
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

const saveFileHandle = async (key: string, handle: FileSystemFileHandle): Promise<boolean> => {
  console.log("[v0] saveFileHandle called with key:", key, "handle:", handle)
  try {
    const db = await openDB()
    console.log("[v0] DB opened for saving, starting transaction...")

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)

      console.log("[v0] Putting handle into store...")
      const request = store.put(handle, key)

      request.onerror = (e) => {
        console.log("[v0] Put request error:", request.error, e)
      }

      request.onsuccess = () => {
        console.log("[v0] Put request success for:", key)
      }

      // Wait for transaction to complete, not just the put request
      tx.oncomplete = () => {
        console.log("[v0] Transaction completed successfully for:", key)
        db.close()
        resolve(true)
      }

      tx.onerror = (e) => {
        console.log("[v0] Transaction error:", tx.error, e)
        db.close()
        resolve(false)
      }

      tx.onabort = (e) => {
        console.log("[v0] Transaction aborted:", tx.error, e)
        db.close()
        resolve(false)
      }
    })
  } catch (error) {
    console.log("[v0] Error in saveFileHandle:", error)
    return false
  }
}

const getFileHandle = async (key: string): Promise<FileSystemFileHandle | null> => {
  console.log("[v0] getFileHandle called with key:", key)
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly")
      const store = tx.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onerror = () => {
        console.log("[v0] Failed to get file handle:", request.error)
        db.close()
        resolve(null)
      }

      request.onsuccess = () => {
        const handle = request.result || null
        console.log("[v0] Got file handle from IndexedDB:", key, handle ? "found" : "not found")
        db.close()
        resolve(handle)
      }
    })
  } catch (error) {
    console.log("[v0] Error in getFileHandle:", error)
    return null
  }
}

const deleteFileHandle = async (key: string): Promise<void> => {
  console.log("[v0] deleteFileHandle called with key:", key)
  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite")
      const store = tx.objectStore(STORE_NAME)
      const request = store.delete(key)

      tx.oncomplete = () => {
        console.log("[v0] Delete transaction completed for:", key)
        db.close()
        resolve()
      }

      tx.onerror = () => {
        console.log("[v0] Delete transaction error:", tx.error)
        db.close()
        resolve()
      }
    })
  } catch (error) {
    console.log("[v0] Failed to delete file handle from IndexedDB:", error)
  }
}

// Define OpenRouterModel interface
interface OpenRouterModel {
  id: string
  name?: string
  context?: number // Example property, adjust as needed
  // Add other properties as per the actual API response
}

const API_PROVIDERS = [
  {
    id: "openrouter",
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
  },
  {
    id: "openai",
    name: "OpenAI",
    endpoint: "https://api.openai.com/v1/chat/completions",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    endpoint: "https://api.anthropic.com/v1/messages",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
  },
  {
    id: "xai",
    name: "xAI",
    endpoint: "https://api.x.ai/v1/chat/completions",
  },
  {
    id: "custom",
    name: "自定义",
    endpoint: "",
  },
]

interface ModelHistoryItem {
  id: string
  timestamp: number
  provider: string
  model: string
  apiKey: string
  baseURL: string
  apiPath: string
  status: "idle" | "success" | "error"
  duration: number | null
}

interface HistoryItem {
  id: string
  timestamp: number
  duration?: number // Response time in milliseconds
  model: string // Add model field to HistoryItem interface
  requestContent: string
  requestRaw: string
  responseContent: string
  responseRaw: string
}

export default function LLMAPITester() {
  const DEFAULT_VALUES = {
    provider: "openrouter" as const,
    model: "",
    baseURL: "https://openrouter.ai",
    apiPath: "/api/v1/chat/completions",
    systemPrompt: "You are a helpful assistant.",
    userMessage: "Hello! How are you today?",
    promptFilePath: "",
    enablePromptFile: false, // Add enablePromptFile state with default false
    systemPromptFilePath: "",
    enableSystemPromptFile: false,
    autoReloadPrompt: false,
    autoReloadSystemPrompt: false,
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
    pageSize: 10,
    prompt: "", // Added prompt to default values
  }

  const [provider, setProvider] = useState(DEFAULT_VALUES.provider)
  const [endpoint, setEndpoint] = useState("") // This state seems redundant with baseUrl, consider consolidating.
  const [apiKey, setApiKey] = useState(DEFAULT_VALUES.apiKey)
  const [showApiKey, setShowApiKey] = useState(false)
  const [isPromptExpanded, setIsPromptExpanded] = useState(false)
  const [isSystemPromptExpanded, setIsSystemPromptExpanded] = useState(false)
  const [model, setModel] = useState("")
  const [openrouterModels, setOpenrouterModels] = useState<OpenRouterModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isCustomModel, setIsCustomModel] = useState(false)
  const [maxTokens, setMaxTokens] = useState(DEFAULT_VALUES.maxTokens)
  const [temperature, setTemperature] = useState(DEFAULT_VALUES.temperature)
  const [topP, setTopP] = useState(DEFAULT_VALUES.topP)
  const [frequencyPenalty, setFrequencyPenalty] = useState(DEFAULT_VALUES.frequencyPenalty)
  const [presencePenalty, setPresencePenalty] = useState(DEFAULT_VALUES.presencePenalty)
  const [stream, setStream] = useState(false) // Added stream state
  const [loading, setLoading] = useState(false)
  const [requestData, setRequestData] = useState("")
  const [responseData, setResponseData] = useState("")
  const [error, setError] = useState("")
  const [maxTokensLimit, setMaxTokensLimit] = useState(DEFAULT_VALUES.maxTokensLimit)
  const [prompt, setPrompt] = useState(DEFAULT_VALUES.prompt) // This state seems redundant with userMessage, consider consolidating.

  const [baseURL, setBaseURL] = useState(DEFAULT_VALUES.baseURL) // Added baseURL state
  const [apiPath, setApiPath] = useState(DEFAULT_VALUES.apiPath) // Added apiPath state
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_VALUES.systemPrompt) // Added systemPrompt state
  const [userMessage, setUserMessage] = useState(DEFAULT_VALUES.userMessage) // Added userMessage state
  const [promptFilePath, setPromptFilePath] = useState(DEFAULT_VALUES.promptFilePath)
  const [enablePromptFile, setEnablePromptFile] = useState(DEFAULT_VALUES.enablePromptFile) // Add enablePromptFile state
  const [isPromptFromLocalFile, setIsPromptFromLocalFile] = useState(false)
  const promptFileHandleRef = useRef<FileSystemFileHandle | null>(null)

  const [loadedPromptContent, setLoadedPromptContent] = useState("")
  const [isExternalPromptExpanded, setIsExternalPromptExpanded] = useState(false)

  const [systemPromptFilePath, setSystemPromptFilePath] = useState(DEFAULT_VALUES.systemPromptFilePath)
  const [enableSystemPromptFile, setEnableSystemPromptFile] = useState(DEFAULT_VALUES.enableSystemPromptFile)
  const [isSystemPromptFromLocalFile, setIsSystemPromptFromLocalFile] = useState(false)
  const systemPromptFileHandleRef = useRef<FileSystemFileHandle | null>(null)

  const [loadedSystemPromptContent, setLoadedSystemPromptContent] = useState("")
  const [isExternalSystemPromptExpanded, setIsExternalSystemPromptExpanded] = useState(false)

  const [autoReloadPrompt, setAutoReloadPrompt] = useState(DEFAULT_VALUES.autoReloadPrompt)
  const [autoReloadSystemPrompt, setAutoReloadSystemPrompt] = useState(DEFAULT_VALUES.autoReloadSystemPrompt)

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [pageSize, setPageSize] = useState(DEFAULT_VALUES.pageSize)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [visibleRawCells, setVisibleRawCells] = useState<Set<string>>(new Set()) // State to track visible raw columns per history item
  const [showRawColumns, setShowRawColumns] = useState<boolean>(DEFAULT_VALUES.showRawColumns)
  const [expandRequestContent, setExpandRequestContent] = useState<boolean>(DEFAULT_VALUES.expandRequestContent)
  const [expandResponseContent, setExpandResponseContent] = useState<boolean>(DEFAULT_VALUES.expandResponseContent)

  const [probeStatus, setProbeStatus] = useState<"idle" | "success" | "error">("idle")
  const [probeDuration, setProbeDuration] = useState<number | null>(null)

  const [timerEnabled, setTimerEnabled] = useState(DEFAULT_VALUES.timerEnabled)
  const [timerInterval, setTimerInterval] = useState(DEFAULT_VALUES.timerInterval)
  const timerRef = useRef<NodeJS.Timeout | null>(null) // Use useRef for timer
  const [isTimerRunning, setIsTimerRunning] = useState(false) // Track if timer is active
  const [responseDuration, setResponseDuration] = useState<number | null>(null)
  const [isParametersExpanded, setIsParametersExpanded] = useState(true) // Default to expanded

  const [modelHistory, setModelHistory] = useState<ModelHistoryItem[]>([])
  const [modelHistoryPage, setModelHistoryPage] = useState(1)
  const modelHistoryPageSize = 5
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set())

  const { toast } = useToast()

  // Use a unified base URL for API calls
  const unifiedEndpoint = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL // Remove trailing slash
  const fullApiPath = `${unifiedEndpoint}${apiPath}`

  // Use a single for loading from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("llm-api-test-settings")
    if (saved) {
      const settings = JSON.parse(saved)
      setProvider(settings.provider ?? DEFAULT_VALUES.provider)
      setModel(settings.model ?? DEFAULT_VALUES.model)
      setApiKey(settings.apiKey ?? DEFAULT_VALUES.apiKey)
      setBaseURL(settings.baseURL ?? DEFAULT_VALUES.baseURL)
      setApiPath(settings.apiPath ?? DEFAULT_VALUES.apiPath)
      setSystemPrompt(settings.systemPrompt ?? DEFAULT_VALUES.systemPrompt)
      setUserMessage(settings.userMessage ?? DEFAULT_VALUES.userMessage)
      setPromptFilePath(settings.promptFilePath ?? DEFAULT_VALUES.promptFilePath)
      setEnablePromptFile(settings.enablePromptFile ?? DEFAULT_VALUES.enablePromptFile) // Load enablePromptFile state
      setSystemPromptFilePath(settings.systemPromptFilePath ?? DEFAULT_VALUES.systemPromptFilePath)
      setEnableSystemPromptFile(settings.enableSystemPromptFile ?? DEFAULT_VALUES.enableSystemPromptFile)
      setAutoReloadPrompt(settings.autoReloadPrompt ?? DEFAULT_VALUES.autoReloadPrompt)
      setAutoReloadSystemPrompt(settings.autoReloadSystemPrompt ?? DEFAULT_VALUES.autoReloadSystemPrompt)
      setMaxTokens(settings.maxTokens ?? DEFAULT_VALUES.maxTokens)
      setTemperature(settings.temperature ?? DEFAULT_VALUES.temperature)
      setTopP(settings.topP ?? DEFAULT_VALUES.topP)
      setFrequencyPenalty(settings.frequencyPenalty ?? DEFAULT_VALUES.frequencyPenalty)
      setPresencePenalty(settings.presencePenalty ?? DEFAULT_VALUES.presencePenalty)
      setShowRawColumns(settings.showRawColumns ?? DEFAULT_VALUES.showRawColumns)
      setExpandRequestContent(settings.expandRequestContent ?? DEFAULT_VALUES.expandRequestContent)
      setExpandResponseContent(settings.expandResponseContent ?? DEFAULT_VALUES.expandResponseContent)
      setTimerEnabled(settings.timerEnabled ?? DEFAULT_VALUES.timerEnabled)
      setTimerInterval(settings.timerInterval ?? DEFAULT_VALUES.timerInterval)
      setMaxTokensLimit(settings.maxTokensLimit ?? DEFAULT_VALUES.maxTokensLimit)
      setPageSize(settings.pageSize ?? DEFAULT_VALUES.pageSize)
      setPrompt(settings.prompt ?? DEFAULT_VALUES.prompt) // Load prompt from settings
      // Load isParametersExpanded state from localStorage if available
      setIsParametersExpanded(settings.isParametersExpanded ?? true)

      // Load local file state if settings exist
      setIsPromptFromLocalFile(settings.isPromptFromLocalFile ?? false)
      setIsSystemPromptFromLocalFile(settings.isSystemPromptFromLocalFile ?? false)

      const restoreFileHandlesSync = async () => {
        // Use settings values directly instead of state (which hasn't updated yet)
        const savedIsPromptFromLocalFile = settings.isPromptFromLocalFile ?? false
        const savedPromptFilePath = settings.promptFilePath ?? ""
        const savedIsSystemPromptFromLocalFile = settings.isSystemPromptFromLocalFile ?? false
        const savedSystemPromptFilePath = settings.systemPromptFilePath ?? ""

        // Restore prompt file handle
        if (savedIsPromptFromLocalFile && savedPromptFilePath) {
          const handle = await getFileHandle("promptFileHandle")
          if (handle) {
            promptFileHandleRef.current = handle
            console.log("[v0] Restored prompt file handle from IndexedDB")

            // Try to verify permission and reload content
            const hasPermission = await verifyFilePermission(handle)
            if (hasPermission) {
              try {
                const file = await handle.getFile()
                const content = await file.text()
                setLoadedPromptContent(content)
                console.log("[v0] Auto-loaded prompt content after restoring handle")
              } catch (error) {
                console.log("[v0] Failed to auto-load prompt content:", error)
              }
            } else {
              console.log("[v0] Permission not granted for prompt file, will request on next reload")
            }
          } else {
            console.log("[v0] No prompt file handle found in IndexedDB")
          }
        }

        // Restore system prompt file handle
        if (savedIsSystemPromptFromLocalFile && savedSystemPromptFilePath) {
          const handle = await getFileHandle("systemPromptFileHandle")
          if (handle) {
            systemPromptFileHandleRef.current = handle
            console.log("[v0] Restored system prompt file handle from IndexedDB")

            // Try to verify permission and reload content
            const hasPermission = await verifyFilePermission(handle)
            if (hasPermission) {
              try {
                const file = await handle.getFile()
                const content = await file.text()
                setLoadedSystemPromptContent(content)
                console.log("[v0] Auto-loaded system prompt content after restoring handle")
              } catch (error) {
                console.log("[v0] Failed to auto-load system prompt content:", error)
              }
            } else {
              console.log("[v0] Permission not granted for system prompt file, will request on next reload")
            }
          } else {
            console.log("[v0] No system prompt file handle found in IndexedDB")
          }
        }
      }

      restoreFileHandlesSync()
    } else {
      // First time load: initialize baseURL and apiPath for default provider
      const defaultProvider = API_PROVIDERS.find((p) => p.id === DEFAULT_VALUES.provider)
      if (defaultProvider?.endpoint) {
        try {
          const url = new URL(defaultProvider.endpoint)
          setBaseURL(url.origin)
          setApiPath(url.pathname)
        } catch (e) {
          console.error("Invalid default endpoint format:", defaultProvider.endpoint, e)
        }
      }
    }

    // Load history with migration from old key
    const savedHistory = localStorage.getItem("llm_api_history")
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory))
    } else {
      // Migrate from old key if exists
      const oldHistory = localStorage.getItem("llm-api-test-history")
      if (oldHistory) {
        setHistory(JSON.parse(oldHistory))
        localStorage.setItem("llm_api_history", oldHistory)
        localStorage.removeItem("llm-api-test-history")
      }
    }

    const savedModelHistory = localStorage.getItem("modelHistory")
    if (savedModelHistory) {
      try {
        setModelHistory(JSON.parse(savedModelHistory))
      } catch (error) {
        console.error("Failed to load model history:", error)
      }
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    const settings = {
      provider,
      model,
      apiKey,
      baseURL,
      apiPath,
      systemPrompt,
      userMessage,
      promptFilePath,
      enablePromptFile,
      systemPromptFilePath,
      enableSystemPromptFile,
      autoReloadPrompt,
      autoReloadSystemPrompt,
      maxTokens,
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      showRawColumns,
      expandRequestContent,
      expandResponseContent,
      timerEnabled,
      timerInterval,
      maxTokensLimit,
      pageSize,
      prompt,
      isParametersExpanded,
      isPromptFromLocalFile,
      isSystemPromptFromLocalFile,
    }
    localStorage.setItem("llm-api-test-settings", JSON.stringify(settings))
  }, [
    provider,
    model,
    apiKey,
    baseURL,
    apiPath,
    systemPrompt,
    userMessage,
    promptFilePath,
    enablePromptFile,
    systemPromptFilePath,
    enableSystemPromptFile,
    autoReloadPrompt,
    autoReloadSystemPrompt,
    maxTokens,
    temperature,
    topP,
    frequencyPenalty,
    presencePenalty,
    showRawColumns,
    expandRequestContent,
    expandResponseContent,
    timerEnabled,
    timerInterval,
    maxTokensLimit,
    pageSize,
    prompt,
    isParametersExpanded,
    isPromptFromLocalFile,
    isSystemPromptFromLocalFile,
  ])

  useEffect(() => {
    if (typeof window !== "undefined" && history.length > 0) {
      localStorage.setItem("llm_api_history", JSON.stringify(history))
    }
  }, [history])

  useEffect(() => {
    localStorage.setItem("modelHistory", JSON.stringify(modelHistory))
  }, [modelHistory])

  useEffect(() => {
    // Cleanup interval on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

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
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const content = await response.text()
      return content
    } catch (error) {
      let errorMessage = "无法读取指定的文件路径"

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage =
          "跨域访问被阻止（CORS）。请确保文件服务器支持 CORS，或使用支持 CORS 的文件托管服务（如 GitHub Gist、Pastebin 等）。"
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

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

    const isInIframe = window.self !== window.top

    try {
      // Check if File System Access API is supported and not in iframe
      if ("showOpenFilePicker" in window && !isInIframe) {
        console.log("[v0] Using File System Access API")
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: "Text Files",
              accept: {
                "text/plain": [".txt"],
                "text/markdown": [".md"],
              },
            },
          ],
          multiple: false,
        })

        const file = await fileHandle.getFile()
        const content = await file.text()
        console.log("[v0] File loaded successfully:", file.name, "Content length:", content.length)

        if (type === "prompt") {
          promptFileHandleRef.current = fileHandle
          const saved = await saveFileHandle("promptFileHandle", fileHandle)
          console.log("[v0] Prompt file handle save result:", saved)
          setIsPromptFromLocalFile(true)
          setLoadedPromptContent(content)
          setPromptFilePath(file.name)
          toast({
            title: "文件加载成功",
            description: `已加载本地文件: ${file.name}`,
          })
          return content
        } else {
          systemPromptFileHandleRef.current = fileHandle
          const saved = await saveFileHandle("systemPromptFileHandle", fileHandle)
          console.log("[v0] System prompt file handle save result:", saved)
          setIsSystemPromptFromLocalFile(true)
          setLoadedSystemPromptContent(content)
          setSystemPromptFilePath(file.name)
          toast({
            title: "文件加载成功",
            description: `已加载本地文件: ${file.name}`,
          })
          return content
        }
      }
    } catch (error) {
      console.log("[v0] File System Access API failed, falling back to input method:", error)
      // Fall through to fallback method
    }

    console.log("[v0] Using fallback file input method")
    return new Promise<string | null>((resolve) => {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = ".txt,.md"
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0]
        if (file) {
          console.log("[v0] Fallback file selected:", file.name)
          const content = await file.text()
          if (type === "prompt") {
            promptFileHandleRef.current = null
            setIsPromptFromLocalFile(true)
            setLoadedPromptContent(content)
            setPromptFilePath(file.name)
            toast({
              title: "文件加载成功",
              description: `已加载本地文件: ${file.name}`,
            })
            resolve(content)
          } else {
            systemPromptFileHandleRef.current = null
            setIsSystemPromptFromLocalFile(true)
            setLoadedSystemPromptContent(content)
            setSystemPromptFilePath(file.name)
            toast({
              title: "文件加载成功",
              description: `已加载本地文件: ${file.name}`,
            })
            resolve(content)
          }
        } else {
          console.log("[v0] No file selected in fallback method")
          resolve(null)
        }
      }
      input.click()
    })
  }

  const reloadLocalFile = async (type: "prompt" | "systemPrompt"): Promise<string | null> => {
    const fileHandleRef = type === "prompt" ? promptFileHandleRef : systemPromptFileHandleRef
    const setContent = type === "prompt" ? setLoadedPromptContent : setLoadedSystemPromptContent
    const handleKey = type === "prompt" ? "promptFileHandle" : "systemPromptFileHandle"

    console.log(`[v0] reloadLocalFile called for ${type}`)
    console.log(`[v0] Current ref handle:`, fileHandleRef.current ? "exists" : "null")

    // Try to get handle from ref first, then from IndexedDB
    let handle = fileHandleRef.current
    if (!handle) {
      console.log(`[v0] Attempting to restore ${type} handle from IndexedDB`)
      handle = await getFileHandle(handleKey)
      if (handle) {
        fileHandleRef.current = handle
        console.log(`[v0] Restored ${type} file handle from IndexedDB successfully`)
      } else {
        console.log(`[v0] No ${type} handle found in IndexedDB`)
      }
    }

    // If we have a valid file handle, verify permission and use it
    if (handle) {
      console.log(`[v0] Have handle for ${type}, verifying permission...`)
      try {
        const hasPermission = await verifyFilePermission(handle)
        console.log(`[v0] Permission result for ${type}:`, hasPermission)

        if (hasPermission) {
          const file = await handle.getFile()
          const content = await file.text()
          setContent(content)
          console.log(`[v0] Reloaded ${type} from file handle with permission, content length:`, content.length)
          return content
        } else {
          console.log(`[v0] Permission denied for ${type} file handle`)
          // Just return null and let the caller handle it
        }
      } catch (error) {
        console.log(`[v0] Failed to reload from file handle:`, error)
        // File handle is no longer valid, need to re-select
        fileHandleRef.current = null
        await deleteFileHandle(handleKey)
      }
    }

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

  const isHttpUrl = (path: string) => {
    return path.startsWith("http://") || path.startsWith("https://")
  }

  useEffect(() => {
    if (enablePromptFile && promptFilePath && isHttpUrl(promptFilePath) && !isPromptFromLocalFile) {
      readLocalFile(promptFilePath)
        .then((content) => {
          setLoadedPromptContent(content || "")
        })
        .catch((error) => {
          console.error("Failed to load prompt file:", error)
          setLoadedPromptContent("")
        })
    } else if (!enablePromptFile) {
      setLoadedPromptContent("")
      setIsPromptFromLocalFile(false)
      promptFileHandleRef.current = null
      deleteFileHandle("promptFileHandle")
    }
  }, [enablePromptFile, promptFilePath, isPromptFromLocalFile])

  useEffect(() => {
    if (
      enableSystemPromptFile &&
      systemPromptFilePath &&
      isHttpUrl(systemPromptFilePath) &&
      !isSystemPromptFromLocalFile
    ) {
      readLocalFile(systemPromptFilePath)
        .then((content) => {
          setLoadedSystemPromptContent(content || "")
        })
        .catch((error) => {
          console.error("Failed to load system prompt file:", error)
          setLoadedSystemPromptContent("")
        })
    } else if (!enableSystemPromptFile) {
      setLoadedSystemPromptContent("")
      setIsSystemPromptFromLocalFile(false)
      systemPromptFileHandleRef.current = null
      deleteFileHandle("systemPromptFileHandle")
    }
  }, [enableSystemPromptFile, systemPromptFilePath, isSystemPromptFromLocalFile])

  const runProbeTest = async () => {
    if (!apiKey || !model || !fullApiPath) return // Added fullApiPath check

    toast({
      title: "探针测试开始",
      description: `提供商: ${provider}, 模型: ${model}`,
      className: "bg-blue-50 border-blue-200",
      duration: 3000,
    })

    try {
      const startTime = performance.now()

      const requestBody = {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "hello" },
        ],
        max_tokens: 100, // Small token count for probe
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }

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
      if (!contentType?.includes("application/json")) {
        const text = await response.text()
        setProbeStatus("error")
        saveToModelHistory("error", duration)
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
          description: data.error?.message || "API 返回异常",
          duration: 3000, // 3 seconds
        })
      }
    } catch (error) {
      setProbeStatus("error")
      setProbeDuration(null)
      saveToModelHistory("error", null)
      toast({
        variant: "destructive",
        title: "探针测试失败",
        description: error instanceof Error ? error.message : "网络请求失败",
        duration: 3000, // 3 seconds
      })
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
    }

    if (providerId === "openrouter") {
      fetchOpenRouterModels()
    }
  }

  const fetchOpenRouterModels = async () => {
    setIsLoadingModels(true)
    try {
      // Fetching from a placeholder URL, replace with actual API endpoint if available
      const response = await fetch("https://openrouter-free-api.xiechengqi.top/data/openrouter-free-text-to-text.json")
      if (response.ok) {
        const data = await response.json()
        // Assuming the API returns an array of model objects with an 'id' field
        setOpenrouterModels(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length > 0 && !model) {
          setModel(data[0].id)
        }
      } else {
        console.error("[v0] Failed to fetch OpenRouter models:", response.statusText)
        setOpenrouterModels([])
      }
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
    }
  }, [provider])

  const handleTest = async () => {
    if (!apiKey) {
      setError("Please provide an API key")
      toast({
        variant: "destructive",
        title: "错误",
        description: "请提供 API Key",
      })
      return
    }

    setLoading(true)
    setError("")
    setResponseData("")
    setResponseDuration(null)

    const modelToUse = model || DEFAULT_VALUES.model

    console.log("[v0] enablePromptFile:", enablePromptFile)
    console.log("[v0] autoReloadPrompt:", autoReloadPrompt)
    console.log("[v0] isPromptFromLocalFile:", isPromptFromLocalFile)
    console.log("[v0] promptFileHandleRef.current:", promptFileHandleRef.current)
    console.log("[v0] promptFilePath:", promptFilePath)

    // Handle external system prompt loading
    let finalSystemPrompt = systemPrompt

    if (enableSystemPromptFile && systemPromptFilePath.trim()) {
      console.log("[v0] System prompt external loading enabled")

      if (autoReloadSystemPrompt) {
        console.log("[v0] Auto reload system prompt is ON")
        // Always reload when auto-reload is enabled
        const isHttpUrl =
          systemPromptFilePath.trim().startsWith("http://") || systemPromptFilePath.trim().startsWith("https://")

        if (isHttpUrl) {
          console.log("[v0] Reloading system prompt from HTTP URL")
          const reloadedContent = await readLocalFile(systemPromptFilePath.trim())
          if (reloadedContent) {
            setLoadedSystemPromptContent(reloadedContent)
            finalSystemPrompt = reloadedContent
            console.log("[v0] Reloaded system prompt from URL, length:", reloadedContent.length)
          } else {
            finalSystemPrompt = loadedSystemPromptContent || systemPrompt
          }
        } else if (isSystemPromptFromLocalFile) {
          console.log("[v0] Reloading system prompt from local file")
          const reloadedContent = await reloadLocalFile("systemPrompt")
          if (reloadedContent) {
            finalSystemPrompt = reloadedContent
            console.log("[v0] Reloaded system prompt from local file, length:", reloadedContent.length)
          } else {
            // User cancelled file selection, use existing content
            finalSystemPrompt = loadedSystemPromptContent || systemPrompt
          }
        } else {
          finalSystemPrompt = loadedSystemPromptContent || systemPrompt
        }
      } else {
        // Auto-reload is OFF, use cached content
        console.log("[v0] Using cached system prompt content")
        finalSystemPrompt = loadedSystemPromptContent || systemPrompt
      }
    }

    console.log("[v0] Final system prompt length:", finalSystemPrompt.length)

    // Handle external user message loading
    let finalUserMessage = userMessage

    console.log("[v0] enablePromptFile:", enablePromptFile)
    console.log("[v0] autoReloadPrompt:", autoReloadPrompt)
    console.log("[v0] isPromptFromLocalFile:", isPromptFromLocalFile)
    console.log("[v0] promptFileHandleRef.current:", promptFileHandleRef.current)
    console.log("[v0] promptFilePath:", promptFilePath)

    if (enablePromptFile && promptFilePath.trim()) {
      console.log("[v0] User message external loading enabled")

      if (autoReloadPrompt) {
        console.log("[v0] Auto reload prompt is ON")
        // Always reload when auto-reload is enabled
        const isHttpUrl = promptFilePath.trim().startsWith("http://") || promptFilePath.trim().startsWith("https://")

        if (isHttpUrl) {
          console.log("[v0] Reloading user message from HTTP URL")
          const reloadedContent = await readLocalFile(promptFilePath.trim())
          if (reloadedContent) {
            setLoadedPromptContent(reloadedContent)
            finalUserMessage = reloadedContent
            console.log("[v0] Reloaded user message from URL, length:", reloadedContent.length)
          } else {
            finalUserMessage = loadedPromptContent || userMessage
          }
        } else if (isPromptFromLocalFile) {
          console.log("[v0] Reloading user message from local file")
          const reloadedContent = await reloadLocalFile("prompt")
          if (reloadedContent) {
            finalUserMessage = reloadedContent
            console.log("[v0] Reloaded user message from local file, length:", reloadedContent.length)
          } else {
            // User cancelled file selection, use existing content
            finalUserMessage = loadedPromptContent || userMessage
          }
        } else {
          finalUserMessage = loadedPromptContent || userMessage
        }
      } else {
        // Auto-reload is OFF, use cached content
        console.log("[v0] Using cached user message content")
        finalUserMessage = loadedPromptContent || userMessage
      }
    }

    console.log("[v0] Final user message length:", finalUserMessage.length)

    const messages = [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: finalUserMessage },
    ]

    const requestBody = {
      model: modelToUse,
      messages: messages,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      stream: stream, // Include stream parameter
    }

    // Generate cURL command, handling potential undefined values for headers
    const curlHeaders = ["Content-Type: application/json", `Authorization: Bearer ${apiKey}`]
    if (baseURL && provider === "custom") {
      // Example for custom header, adjust as needed for other providers if they require different headers
      // For OpenAI, Anthropic, etc., Authorization is usually enough.
      // For some custom setups, an additional API key might be needed.
      // curlHeaders.push(`X-Custom-Auth: ${apiKey}`)
    }

    const requestCurl = `curl ${fullApiPath} \\
  -X POST \\
  ${curlHeaders.map((h) => `-H "${h}" \\`).join("")}
  -d '${JSON.stringify(requestBody, null, 2).replace(/\n/g, "\n  ")}'`

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
        signal: controller.signal,
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

      const requestContent = [...messages]
        .reverse()
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n") // user first, then system
      const responseContent =
        parsedResponse?.choices?.[0]?.message?.content ||
        parsedResponse?.content?.[0]?.text ||
        JSON.stringify(parsedResponse) // Adjusted to handle potential differences in response structure

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        model: modelToUse, // Use the actual model used
        requestContent,
        requestRaw: requestCurl,
        responseContent,
        responseRaw: formattedResponse,
        duration: duration, // Store response time
      }

      setHistory((prev) => {
        const updated = [historyItem, ...prev]
        if (typeof window !== "undefined") {
          localStorage.setItem("llm_api_history", JSON.stringify(updated))
        }
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
    } catch (err: any) {
      // Changed to any to access error.name and error.message
      clearTimeout(timeoutId)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"

      if (err instanceof Error && err.name === "AbortError") {
        const timeoutMsg = "请求超时 (60秒)"
        setError(timeoutMsg)
        toast({
          variant: "destructive",
          title: "请求超时",
          description: "API 请求超过 60 秒未响应",
        })
      } else {
        setError(`Request failed: ${errorMessage}`)
        toast({
          variant: "destructive",
          title: "请求失败",
          description: errorMessage,
        })
      }

      const errorResponse = JSON.stringify({ error: errorMessage }, null, 2)
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
        duration: null, // Duration is not applicable on error
      }
      setHistory((prev) => {
        const updated = [newHistoryItem, ...prev]
        if (typeof window !== "undefined") {
          localStorage.setItem("llm_api_history", JSON.stringify(updated))
        }
        return updated
      })
    } finally {
      setLoading(false)
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

  // Combine test and timer start logic
  const handleStartTest = () => {
    if (timerEnabled) {
      startTimer()
    } else {
      handleTest()
    }
  }

  const handleResetApiConfig = () => {
    setProvider(DEFAULT_VALUES.provider)
    setBaseURL(DEFAULT_VALUES.baseURL)
    setApiPath(DEFAULT_VALUES.apiPath)
    setApiKey("")
    setModel("")
    setError("")
    setShowApiKey(false) // Reset API Key visibility
    setProbeStatus("idle") // Reset probe status
    setSystemPrompt(DEFAULT_VALUES.systemPrompt) // Reset systemPrompt
    setUserMessage(DEFAULT_VALUES.userMessage) // Reset userMessage
    setPromptFilePath(DEFAULT_VALUES.promptFilePath) // Reset promptFilePath
    setEnablePromptFile(DEFAULT_VALUES.enablePromptFile) // Reset enablePromptFile
    // Resetting system prompt external file settings
    setSystemPromptFilePath(DEFAULT_VALUES.systemPromptFilePath)
    setEnableSystemPromptFile(DEFAULT_VALUES.enableSystemPromptFile)
    setLoadedSystemPromptContent("") // Clear loaded content

    // Reset local file states
    setIsPromptFromLocalFile(false)
    promptFileHandleRef.current = null
    setIsSystemPromptFromLocalFile(false)
    systemPromptFileHandleRef.current = null

    // Delete file handles from IndexedDB on reset
    deleteFileHandle("promptFileHandle")
    deleteFileHandle("systemPromptFileHandle")

    // Remove specific items from localStorage
    localStorage.removeItem("llm-api-test-settings")
    // Consider removing individual keys if they were previously saved separately
  }

  const handleResetParameters = () => {
    setPrompt(DEFAULT_VALUES.prompt) // This seems to reset the old prompt state, consider if userMessage is preferred
    setMaxTokens(DEFAULT_VALUES.maxTokens)
    setTemperature(DEFAULT_VALUES.temperature)
    setTopP(DEFAULT_VALUES.topP)
    setFrequencyPenalty(DEFAULT_VALUES.frequencyPenalty)
    setPresencePenalty(DEFAULT_VALUES.presencePenalty)
    setStream(false) // Reset stream
    // Reset timer settings and stop timer if running
    setTimerEnabled(DEFAULT_VALUES.timerEnabled)
    setTimerInterval(DEFAULT_VALUES.timerInterval)
    stopTimer() // Ensure timer is stopped on reset
    setShowRawColumns(DEFAULT_VALUES.showRawColumns) // Reset showRawColumns
    // Reset separate expand states
    setExpandRequestContent(DEFAULT_VALUES.expandRequestContent)
    setExpandResponseContent(DEFAULT_VALUES.expandResponseContent)
    setSystemPrompt(DEFAULT_VALUES.systemPrompt) // Reset system prompt
    setUserMessage(DEFAULT_VALUES.userMessage) // Reset user message
    setPromptFilePath(DEFAULT_VALUES.promptFilePath) // Reset promptFilePath
    setEnablePromptFile(DEFAULT_VALUES.enablePromptFile) // Reset enablePromptFile

    // Reset auto reload settings
    setAutoReloadPrompt(DEFAULT_VALUES.autoReloadPrompt)
    setAutoReloadSystemPrompt(DEFAULT_VALUES.autoReloadSystemPrompt)

    // Remove specific items from localStorage related to parameters
    localStorage.removeItem("llm-api-test-settings") // Clear all settings and reload defaults
  }

  const handleReset = () => {
    handleResetApiConfig()
    handleResetParameters()
  }

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
    const updatedHistory = history.filter((item) => item.id !== id)
    if (updatedHistory.length === 0) {
      localStorage.removeItem("llm_api_history")
    } else {
      localStorage.setItem("llm_api_history", JSON.stringify(updatedHistory))
    }
  }

  const handleClearHistory = () => {
    setHistory([])
    setCurrentPage(1)
    setExpandedCells(new Set())
    setVisibleRawCells(new Set()) // Clear visible raw cells on history clear
    localStorage.removeItem("llm_api_history")
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

      const requestBody = {
        model: item.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "hello" },
        ],
        max_tokens: 100,
        temperature: 1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }

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

    // Define CSV headers based on showRawColumns state
    const headers = showRawColumns
      ? ["时间", "模型", "用时(ms)", "请求 Content", "请求 Raw", "响应 Content", "响应 Raw"]
      : ["时间", "模型", "用时(ms)", "请求 Content", "响应 Content"]

    // Convert history data to CSV rows
    const rows = history.map((item) => {
      const timestamp = new Date(item.timestamp).toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      const duration = item.duration !== undefined && item.duration !== null ? item.duration : "-"

      // Escape double quotes and wrap fields in quotes
      const escapeCSV = (text: string) => {
        if (text === null || text === undefined) return '""'
        return `"${String(text).replace(/"/g, '""')}"`
      }

      // Build row based on showRawColumns state
      const rowData = showRawColumns
        ? [
            escapeCSV(timestamp),
            escapeCSV(item.model),
            escapeCSV(String(duration)),
            escapeCSV(item.requestContent),
            escapeCSV(item.requestRaw),
            escapeCSV(item.responseContent),
            escapeCSV(item.responseRaw),
          ]
        : [
            escapeCSV(timestamp),
            escapeCSV(item.model),
            escapeCSV(String(duration)),
            escapeCSV(item.requestContent),
            escapeCSV(item.responseContent),
          ]

      return rowData.join(",")
    })

    // Combine headers and rows
    const csv = [headers.join(","), ...rows].join("\n")

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `llm_api_history_${Date.now()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const totalPages = Math.ceil(history.length / pageSize)
  const paginatedHistory = history.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const [requestCopyText, setRequestCopyText] = useState("复制")
  const [responseCopyText, setResponseCopyText] = useState("复制")

  const handleCopy = async (text: string, type: "request" | "response") => {
    const setText = type === "request" ? setRequestCopyText : setResponseCopyText

    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(text)
      setText("已复制!")
      setTimeout(() => setText("复制"), 2000)
    } catch (err) {
      // Fallback to traditional method
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand("copy")
        setText("已复制!")
        setTimeout(() => setText("复制"), 2000)
      } catch (execErr) {
        toast({
          title: "复制失败",
          description: "无法访问剪贴板，请手动复制",
          variant: "destructive",
        })
      }

      document.body.removeChild(textArea)
    }
  }

  const renderContentWithCodeBlocks = (content: string, cellId: string, isExpanded: boolean) => {
    // Try to detect if content is JSON
    let processedContent = content
    let isJson = false

    try {
      // Check if content looks like JSON (starts with { or [)
      const trimmed = content.trim()
      if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
        // Try to parse to verify it's valid JSON
        JSON.parse(trimmed)
        // If successfully parsed, wrap original content in json code block without formatting
        processedContent = "```json\n" + trimmed + "\n```"
        isJson = true
      }
    } catch (e) {
      // Not valid JSON, use original content
    }

    const parts = processedContent.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.split("\n")
        const language = lines[0].replace("```", "").trim()
        const codeLines = lines.slice(1, -1)
        const code = codeLines.join("\n")
        const lineCount = codeLines.length

        return (
          <div key={index} className="my-2 rounded-md bg-muted overflow-hidden border relative">
            {language && <div className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 border-b">{language}</div>}
            <pre
              className={`p-3 overflow-x-auto text-xs ${
                !isExpanded && lineCount > 3 ? "max-h-24 overflow-y-hidden" : ""
              }`}
            >
              <code className="block">{code}</code>
            </pre>
            {!isExpanded && lineCount > 3 && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent pointer-events-none" />
            )}
          </div>
        )
      }
      return (
        <span key={index} className={`${!isExpanded && part.trim().length > 100 ? "line-clamp-2" : ""}`}>
          {part}
        </span>
      )
    })
  }

  // Fixed: Corrected closing tag for Table and removed undeclared variable expandAllHistory
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

  const clearModelHistory = () => {
    setModelHistory([])
    setModelHistoryPage(1)
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

    const headers = ["时间", "提供商", "模型名", "API Key", "状态", "响应延迟(ms)"]
    const rows = modelHistory.map((item) => [
      new Date(item.timestamp).toLocaleString("zh-CN"),
      item.provider,
      item.model,
      item.apiKey.substring(0, 10) + "...",
      item.status === "success" ? "成功" : item.status === "error" ? "失败" : "未测试",
      item.duration ? item.duration.toString() : "N/A",
    ])

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `model-history-${Date.now()}.csv`
    link.click()

    toast({
      title: "导出成功",
      description: `已导出 ${modelHistory.length} 条记录`,
      className: "bg-green-50 border-green-200",
      duration: 2000,
    })
  }

  const modelHistoryTotalPages = Math.ceil(modelHistory.length / modelHistoryPageSize)
  const paginatedModelHistory = modelHistory.slice(
    (modelHistoryPage - 1) * modelHistoryPageSize,
    modelHistoryPage * modelHistoryPageSize,
  )

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-4 md:px-8">
          {/* Removed h1 and added Zap icon and new h1 */}
          <div className="flex items-center gap-2">
            <Zap className="size-6 text-primary" />
            <h1 className="text-balance text-xl font-bold tracking-tight">LLM API 测试工具</h1>
            {probeStatus !== "idle" && (
              <div className="ml-2 flex items-center gap-1.5">
                <div
                  className={`size-2 rounded-full ${probeStatus === "success" ? "bg-green-500" : "bg-red-500"}`}
                  title={probeStatus === "success" ? "API 配置正常" : "API 配置异常"}
                />
                {probeStatus === "success" && probeDuration && (
                  <span className="text-xs text-muted-foreground">{probeDuration}ms</span>
                )}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Select value={provider} onValueChange={handleProviderChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="提供商">{API_PROVIDERS.find((p) => p.id === provider)?.name}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {API_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{p.name}</span>
                      {p.endpoint && <span className="text-xs text-muted-foreground">{p.endpoint}</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {provider === "openrouter" ? (
              <div className="flex items-center gap-2">
                {!isCustomModel ? (
                  <>
                    <Select value={model} onValueChange={setModel} disabled={isLoadingModels}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder={isLoadingModels ? "加载中..." : "选择模型"}>
                          {model || (isLoadingModels ? "加载中..." : "选择模型")}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {openrouterModels.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{m.name || m.id}</span>
                              {m.context && <span className="text-xs text-muted-foreground">{m.context}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => setIsCustomModel(true)} title="自定义模型">
                      <Pencil className="size-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="输入自定义模型 ID"
                      className="w-[200px]"
                    />
                    <Button variant="ghost" size="sm" onClick={() => setIsCustomModel(false)} title="返回下拉选择">
                      <List className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="eg: gpt-3.5-turbo"
                className="w-[200px]"
              />
            )}

            <div className="relative flex items-center">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API Key"
                className="w-[200px] pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-0 h-full px-3 hover:bg-transparent"
                title={showApiKey ? "隐藏 API Key" : "显示 API Key"}
              >
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-2 size-4" />
              重置
            </Button>
          </div>
        </div>

        {(provider === "custom" || !API_PROVIDERS.find((p) => p.id === provider)?.endpoint) && (
          <div className="border-t px-4 py-3 md:px-8">
            <div className="flex items-center gap-2">
              <Label htmlFor="baseURL" className="text-sm font-medium whitespace-nowrap">
                Base URL
              </Label>
              <Input
                id="baseURL"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://api.example.com"
                className="max-w-2xl"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="apiPath" className="text-sm font-medium whitespace-nowrap">
                API Path
              </Label>
              <Input
                id="apiPath"
                value={apiPath}
                onChange={(e) => setApiPath(e.target.value)}
                placeholder="/v1/chat/completions"
                className="max-w-2xl"
              />
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>历史模型</CardTitle>
                  <CardDescription>保存的模型配置和探针测试结果</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportModelHistoryToCSV}
                    disabled={modelHistory.length === 0}
                  >
                    <Download className="mr-2 size-4" />
                    导出CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearModelHistory} disabled={modelHistory.length === 0}>
                    <Trash2 className="mr-2 size-4" />
                    清空
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {modelHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无历史记录</div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[180px]">时间</TableHead>
                          <TableHead className="w-[120px]">提供商</TableHead>
                          <TableHead className="w-[200px]">模型名</TableHead>
                          <TableHead className="w-[150px]">API Key</TableHead>
                          <TableHead className="w-[150px]">状态</TableHead>
                          <TableHead className="w-[200px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedModelHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap align-top">
                              {new Date(item.timestamp).toLocaleString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </TableCell>
                            <TableCell className="text-sm">
                              {API_PROVIDERS.find((p) => p.id === item.provider)?.name || item.provider}
                            </TableCell>
                            <TableCell className="text-sm font-mono">{item.model}</TableCell>
                            <TableCell className="text-sm font-mono">
                              <div className="flex items-center gap-2">
                                <span className="flex-1">
                                  {visibleApiKeys.has(item.id) ? item.apiKey : `${item.apiKey.substring(0, 10)}...`}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleApiKeyVisibility(item.id)}
                                  className="h-6 w-6 p-0"
                                  title={visibleApiKeys.has(item.id) ? "隐藏 API Key" : "显示 API Key"}
                                >
                                  {visibleApiKeys.has(item.id) ? (
                                    <EyeOff className="size-3" />
                                  ) : (
                                    <Eye className="size-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {item.status === "success" && (
                                  <>
                                    <div className="size-2 rounded-full bg-green-500" />
                                    <span className="text-sm text-green-600">{item.duration}ms</span>
                                  </>
                                )}
                                {item.status === "error" && (
                                  <>
                                    <div className="size-2 rounded-full bg-red-500" />
                                    <span className="text-sm text-red-600">失败</span>
                                  </>
                                )}
                                {item.status === "idle" && (
                                  <>
                                    <div className="size-2 rounded-full bg-gray-400" />
                                    <span className="text-sm text-muted-foreground">未测试</span>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => runHistoryProbeTest(item)}
                                  title="探针测试"
                                >
                                  <Activity className="size-4" />
                                </Button>
                                <Button variant="default" size="sm" onClick={() => applyHistoryItem(item)}>
                                  <Check className="mr-1 size-3" />
                                  应用
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteModelHistoryItem(item.id)}
                                  title="删除"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {modelHistoryTotalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        共 {modelHistory.length} 条记录，第 {modelHistoryPage} / {modelHistoryTotalPages} 页
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModelHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={modelHistoryPage === 1}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <div className="text-sm font-medium">{modelHistoryPage}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModelHistoryPage((p) => Math.min(modelHistoryTotalPages, p + 1))}
                          disabled={modelHistoryPage === modelHistoryTotalPages}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Parameters Configuration - Full width */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsParametersExpanded(!isParametersExpanded)}>
                    {isParametersExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </Button>
                  <div>
                    <CardTitle>参数配置</CardTitle>
                    <CardDescription>调整 Chat Completion 参数</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetParameters}>
                    <RotateCcw className="mr-2 size-4" />
                    重置参数
                  </Button>
                  {isTimerRunning ? (
                    <Button onClick={stopTimer} variant="destructive" size="sm">
                      <StopCircle className="mr-2 size-4" />
                      停止定时
                    </Button>
                  ) : (
                    <Button onClick={handleStartTest} disabled={loading} size="sm">
                      {loading ? (
                        <>
                          <RotateCcw className="mr-2 size-4 animate-spin" />
                          测试中...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 size-4" />
                          开始测试
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {isParametersExpanded && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="userMessage">用户消息</Label>
                      <p className="text-xs text-muted-foreground">输入测试用的消息内容</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPromptExpanded(!isPromptExpanded)}
                    >
                      {isPromptExpanded ? (
                        <>
                          <ChevronUp className="mr-1 h-4 w-4" />
                          收起
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-4 w-4" />
                          展开
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="userMessage"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="输入你的提示词..."
                    rows={3}
                    className={isPromptExpanded ? "" : "max-h-32 overflow-y-auto"}
                  />

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="promptFilePath" className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        从外部加载用户消息
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="enablePromptFile"
                          checked={enablePromptFile}
                          onChange={(e) => setEnablePromptFile(e.target.checked)}
                          className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
                        />
                        <Label htmlFor="enablePromptFile" className="cursor-pointer font-normal text-sm">
                          启用
                        </Label>
                        <input
                          type="checkbox"
                          id="autoReloadPrompt"
                          checked={autoReloadPrompt}
                          onChange={(e) => setAutoReloadPrompt(e.target.checked)}
                          disabled={!enablePromptFile}
                          className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <Label htmlFor="autoReloadPrompt" className="cursor-pointer font-normal text-sm">
                          自动重载
                        </Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="promptFilePath"
                        value={promptFilePath}
                        onChange={(e) => {
                          setPromptFilePath(e.target.value)
                          setIsPromptFromLocalFile(false)
                          promptFileHandleRef.current = null
                          setLoadedPromptContent("")
                        }}
                        placeholder="https://example.com/prompt.txt 或点击选择本地文件"
                        className="text-sm flex-1"
                        disabled={!enablePromptFile}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLocalFileSelect("prompt")}
                        disabled={!enablePromptFile}
                        className="shrink-0"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        选择文件
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      支持 HTTP/HTTPS 链接或本地文件。点击"选择文件"按钮可直接选择本地 .txt 或 .md 文件。
                    </p>

                    {enablePromptFile && loadedPromptContent && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            外部加载的消息预览
                            {isPromptFromLocalFile && (
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                                本地文件
                              </span>
                            )}
                          </Label>
                          <div className="flex items-center gap-1">
                            {isPromptFromLocalFile && promptFileHandleRef.current && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => reloadLocalFile("prompt")}
                                title="重新加载文件"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsExternalPromptExpanded(!isExternalPromptExpanded)}
                            >
                              {isExternalPromptExpanded ? (
                                <>
                                  <ChevronUp className="mr-1 h-4 w-4" />
                                  收起
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 h-4 w-4" />
                                  展开
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={loadedPromptContent}
                          readOnly
                          className={`bg-muted/50 text-sm font-mono resize-none cursor-default overflow-y-auto transition-all duration-200 ${
                            isExternalPromptExpanded ? "h-60" : "h-20"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* System Prompt Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="systemPrompt">系统提示词</Label>
                      <p className="text-xs text-muted-foreground">为 AI 设置角色或行为指令</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSystemPromptExpanded(!isSystemPromptExpanded)}
                    >
                      {isSystemPromptExpanded ? (
                        <>
                          <ChevronUp className="mr-1 h-4 w-4" />
                          收起
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-1 h-4 w-4" />
                          展开
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="systemPrompt"
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="例如: 你是一个乐于助人的助手。"
                    rows={2}
                    className={isSystemPromptExpanded ? "" : "max-h-32 overflow-y-auto"}
                  />

                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="systemPromptFilePath" className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        从外部加载系统提示词
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="enableSystemPromptFile"
                          checked={enableSystemPromptFile}
                          onChange={(e) => setEnableSystemPromptFile(e.target.checked)}
                          className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
                        />
                        <Label htmlFor="enableSystemPromptFile" className="cursor-pointer font-normal text-sm">
                          启用
                        </Label>
                        <input
                          type="checkbox"
                          id="autoReloadSystemPrompt"
                          checked={autoReloadSystemPrompt}
                          onChange={(e) => setAutoReloadSystemPrompt(e.target.checked)}
                          disabled={!enableSystemPromptFile}
                          className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <Label htmlFor="autoReloadSystemPrompt" className="cursor-pointer font-normal text-sm">
                          自动重载
                        </Label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="systemPromptFilePath"
                        value={systemPromptFilePath}
                        onChange={(e) => {
                          setSystemPromptFilePath(e.target.value)
                          setIsSystemPromptFromLocalFile(false)
                          systemPromptFileHandleRef.current = null
                          setLoadedSystemPromptContent("")
                        }}
                        placeholder="https://example.com/system-prompt.txt 或点击选择本地文件"
                        className="text-sm flex-1"
                        disabled={!enableSystemPromptFile}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleLocalFileSelect("systemPrompt")}
                        disabled={!enableSystemPromptFile}
                        className="shrink-0"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        选择文件
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      支持 HTTP/HTTPS 链接或本地文件。点击"选择文件"按钮可直接选择本地 .txt 或 .md 文件。
                    </p>

                    {enableSystemPromptFile && loadedSystemPromptContent && (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                            外部加载的系统提示词预览
                            {isSystemPromptFromLocalFile && (
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                                本地文件
                              </span>
                            )}
                          </Label>
                          <div className="flex items-center gap-1">
                            {isSystemPromptFromLocalFile && systemPromptFileHandleRef.current && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => reloadLocalFile("systemPrompt")}
                                title="重新加载文件"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsExternalSystemPromptExpanded(!isExternalSystemPromptExpanded)}
                            >
                              {isExternalSystemPromptExpanded ? (
                                <>
                                  <ChevronUp className="mr-1 h-4 w-4" />
                                  收起
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="mr-1 h-4 w-4" />
                                  展开
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={loadedSystemPromptContent}
                          readOnly
                          className={`bg-muted/50 text-sm font-mono resize-none cursor-default overflow-y-auto transition-all duration-200 ${
                            isExternalSystemPromptExpanded ? "h-60" : "h-20"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>定时配置</Label>
                      <p className="text-xs text-muted-foreground">设置自动定时执行测试</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="timerEnabled"
                        checked={timerEnabled}
                        onChange={(e) => {
                          setTimerEnabled(e.target.checked)
                          if (!e.target.checked && isTimerRunning) {
                            stopTimer()
                          }
                        }}
                        className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
                      />
                      <Label htmlFor="timerEnabled" className="cursor-pointer font-normal">
                        启用定时执行
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="timerInterval" className="text-sm text-muted-foreground whitespace-nowrap">
                        间隔时间
                      </Label>
                      <Input
                        id="timerInterval"
                        type="number"
                        value={timerInterval}
                        onChange={(e) => setTimerInterval(Math.max(1, Number(e.target.value)))}
                        className="w-20 h-8"
                        min={1}
                        disabled={!timerEnabled} // Disable input if timer is not enabled
                      />
                      <span className="text-sm text-muted-foreground">秒</span>
                    </div>
                    {isTimerRunning && (
                      <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
                        定时运行中 (每 {timerInterval} 秒)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <p className="text-xs text-muted-foreground">最大生成令牌数量（范围: 1 - {maxTokensLimit}）</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{maxTokens}</span>
                      <span className="text-sm font-medium">/</span>
                      <Input
                        type="number"
                        value={maxTokensLimit}
                        onChange={(e) => {
                          const newLimit = Math.max(1, Number(e.target.value))
                          setMaxTokensLimit(newLimit)
                          if (maxTokens > newLimit) {
                            setMaxTokens(newLimit)
                          }
                        }}
                        className="w-20 h-8 text-xs"
                        min={1}
                      />
                    </div>
                  </div>
                  <Slider
                    id="maxTokens"
                    min={1}
                    max={maxTokensLimit}
                    step={1}
                    value={[maxTokens]}
                    onValueChange={(v) => setMaxTokens(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="temperature">Temperature</Label>
                      <p className="text-xs text-muted-foreground">控制输出随机性，值越高越随机（范围: 0.0 - 2.0）</p>
                    </div>
                    <span className="text-sm font-medium">{temperature?.toFixed(2) ?? "1.00"}</span>
                  </div>
                  <Slider
                    id="temperature"
                    min={0}
                    max={2}
                    step={0.01}
                    value={[temperature]}
                    onValueChange={(v) => setTemperature(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="topP">Top P</Label>
                      <p className="text-xs text-muted-foreground">核采样，控制输出多样性（范围: 0.0 - 1.0）</p>
                    </div>
                    <span className="text-sm font-medium">{topP?.toFixed(2) ?? "1.00"}</span>
                  </div>
                  <Slider id="topP" min={0} max={1} step={0.01} value={[topP]} onValueChange={(v) => setTopP(v[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                      <p className="text-xs text-muted-foreground">
                        降低重复词频率，值越大惩罚越强（范围: -2.0 - 2.0）
                      </p>
                    </div>
                    <span className="text-sm font-medium">{frequencyPenalty?.toFixed(2) ?? "0.00"}</span>
                  </div>
                  <Slider
                    id="frequencyPenalty"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={[frequencyPenalty]}
                    onValueChange={(v) => setFrequencyPenalty(v[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="presencePenalty">Presence Penalty</Label>
                      <p className="text-xs text-muted-foreground">
                        鼓励谈论新话题，值越大越倾向新内容（范围: -2.0 - 2.0）
                      </p>
                    </div>
                    <span className="text-sm font-medium">{presencePenalty?.toFixed(2) ?? "0.00"}</span>
                  </div>
                  <Slider
                    id="presencePenalty"
                    min={-2}
                    max={2}
                    step={0.01}
                    value={[presencePenalty]}
                    onValueChange={(v) => setPresencePenalty(v[0])}
                  />
                </div>

                {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
              </CardContent>
            )}
          </Card>

          {/* History - Full width table format */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>历史对话</CardTitle>
                  <CardDescription>共 {history.length} 条记录</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showRawColumns}
                      onChange={(e) => setShowRawColumns(e.target.checked)}
                      className="size-4 cursor-pointer"
                    />
                    <span>显示 Raw</span>
                  </label>
                  <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 条/页</SelectItem>
                      <SelectItem value="50">50 条/页</SelectItem>
                      <SelectItem value="100">100 条/页</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={history.length === 0}>
                    <RotateCcw className="mr-2 size-4" />
                    清空
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportHistoryToCSV} disabled={history.length === 0}>
                    <Download className="mr-2 size-4" />
                    导出 CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">暂无历史记录</div>
              ) : (
                <>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">时间</TableHead>
                            <TableHead className="w-[160px]">模型</TableHead>
                            <TableHead className="w-[100px]">用时</TableHead>
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <span>请求 Content</span>
                                <label className="flex items-center gap-1 cursor-pointer" title="展开所有请求内容">
                                  <input
                                    type="checkbox"
                                    checked={expandRequestContent}
                                    onChange={(e) => setExpandRequestContent(e.target.checked)}
                                    className="size-3 cursor-pointer"
                                  />
                                </label>
                              </div>
                            </TableHead>
                            {showRawColumns && <TableHead className="w-[100px]">请求 Raw</TableHead>}
                            <TableHead>
                              <div className="flex items-center gap-2">
                                <span>响应 Content</span>
                                <label className="flex items-center gap-1 cursor-pointer" title="展开所有响应内容">
                                  <input
                                    type="checkbox"
                                    checked={expandResponseContent}
                                    onChange={(e) => setExpandResponseContent(e.target.checked)}
                                    className="size-3 cursor-pointer"
                                  />
                                </label>
                              </div>
                            </TableHead>
                            {showRawColumns && <TableHead className="w-[100px]">响应 Raw</TableHead>}
                            <TableHead className="px-4 py-3 text-center font-medium w-[80px]">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y">
                          {paginatedHistory.map((item) => {
                            const requestContentId = `request-${item.timestamp}`
                            const responseContentId = `response-${item.timestamp}`

                            return (
                              <TableRow key={item.timestamp} className="hover:bg-muted/50">
                                <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap align-top">
                                  {new Date(item.timestamp).toLocaleString("zh-CN", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-xs align-top">
                                  <span className="font-mono">{item.model}</span>
                                </TableCell>
                                <TableCell className="px-4 py-3 text-xs align-top">
                                  {item.duration !== undefined && item.duration !== null ? (
                                    <span className="font-mono text-muted-foreground">{item.duration}ms</span>
                                  ) : (
                                    <span className="text-muted-foreground/50">-</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="max-w-xl">
                                    <pre
                                      className={`text-xs whitespace-pre-wrap break-words ${
                                        !expandRequestContent && !expandedCells.has(requestContentId)
                                          ? "line-clamp-2"
                                          : ""
                                      }`}
                                    >
                                      {item.requestContent}
                                    </pre>
                                    {!expandRequestContent && item.requestContent.length > 100 && (
                                      <button
                                        onClick={() => toggleCellExpansion(requestContentId)}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                      >
                                        {expandedCells.has(requestContentId) ? (
                                          <>
                                            <ChevronUp className="size-3" />
                                            收起
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown className="size-3" />
                                            展开
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </TableCell>

                                {showRawColumns && (
                                  <TableCell className="px-4 py-3 align-top">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleRawVisibility(`request-raw-${item.timestamp}`)}
                                      className="h-7 text-xs"
                                    >
                                      {visibleRawCells.has(`request-raw-${item.timestamp}`) ? "隐藏" : "显示"}
                                    </Button>
                                    {visibleRawCells.has(`request-raw-${item.timestamp}`) && (
                                      <div className="mt-2 space-y-1">
                                        <pre
                                          className={`text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words ${
                                            !expandAllHistory && !expandedCells.has(`request-raw-${item.timestamp}`)
                                              ? "line-clamp-2"
                                              : ""
                                          }`}
                                        >
                                          {item.requestRaw}
                                        </pre>
                                        {!expandAllHistory && item.requestRaw.length > 100 && (
                                          <button
                                            onClick={() => toggleCellExpansion(`request-raw-${item.timestamp}`)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                          >
                                            {expandedCells.has(`request-raw-${item.timestamp}`) ? (
                                              <>
                                                <ChevronUp className="size-3" />
                                                收起
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="size-3" />
                                                展开
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                )}
                                <TableCell>
                                  <div className="max-w-xl">
                                    <div className="text-xs whitespace-pre-wrap break-words relative">
                                      {renderContentWithCodeBlocks(
                                        item.responseContent,
                                        responseContentId,
                                        expandResponseContent || expandedCells.has(responseContentId),
                                      )}
                                    </div>
                                    {(() => {
                                      const hasCodeBlock = item.responseContent.includes("```")
                                      const codeBlockLines = hasCodeBlock
                                        ? (item.responseContent
                                            .split("```")
                                            .filter((_, i) => i % 2 === 1)[0]
                                            ?.split("\n")?.length ?? 0)
                                        : 0
                                      const shouldShowToggle =
                                        item.responseContent.length > 100 || (hasCodeBlock && codeBlockLines > 3)
                                      return (
                                        !expandResponseContent &&
                                        shouldShowToggle && (
                                          <button
                                            onClick={() => toggleCellExpansion(responseContentId)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                          >
                                            {expandedCells.has(responseContentId) ? (
                                              <>
                                                <ChevronUp className="size-3" />
                                                收起\
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="size-3" />
                                                展开
                                              </>
                                            )}
                                          </button>
                                        )
                                      )
                                    })()}
                                  </div>
                                </TableCell>

                                {showRawColumns && (
                                  <TableCell className="px-4 py-3 align-top">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleRawVisibility(`response-raw-${item.timestamp}`)}
                                      className="h-7 text-xs"
                                    >
                                      {visibleRawCells.has(`response-raw-${item.timestamp}`) ? "隐藏" : "显示"}
                                    </Button>
                                    {visibleRawCells.has(`response-raw-${item.timestamp}`) && (
                                      <div className="mt-2 space-y-1">
                                        <pre
                                          className={`text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words ${
                                            !expandAllHistory && !expandedCells.has(`response-raw-${item.timestamp}`)
                                              ? "line-clamp-2"
                                              : ""
                                          }`}
                                        >
                                          {item.responseRaw}
                                        </pre>
                                        {!expandAllHistory && item.responseRaw.length > 100 && (
                                          <button
                                            onClick={() => toggleCellExpansion(`response-raw-${item.timestamp}`)}
                                            className="text-xs text-primary hover:underline flex items-center gap-1"
                                          >
                                            {expandedCells.has(`response-raw-${item.timestamp}`) ? (
                                              <>
                                                <ChevronUp className="size-3" />
                                                展开
                                              </>
                                            ) : (
                                              <>
                                                <ChevronDown className="size-3" />
                                                展开
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </TableCell>
                                )}
                                <TableCell className="px-4 py-3 text-center align-top">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteHistoryItem(item.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Request and Response Details - Side by side */}
          <div className="grid grid-cols-2 gap-6">
            <Card className="flex flex-col h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>请求详情</CardTitle>
                    <CardDescription>完整的 cURL 命令（包含明文 API Key）</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => requestData && handleCopy(requestData, "request")}
                    disabled={!requestData}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    {requestCopyText}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto rounded-lg bg-muted p-4">
                  <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {requestData || '点击"开始测试"查看 cURL 命令...'}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card className="flex flex-col h-[600px]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>响应详情</CardTitle>
                    <CardDescription>API 返回的完整响应</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {responseDuration !== null && (
                      <div className="text-xs text-muted-foreground font-mono">用时: {responseDuration}ms</div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (responseData) {
                          const cleanedResponse = responseData
                            .split("\n")
                            .filter((line) => line.trim() !== "")
                            .join("\n")
                          handleCopy(cleanedResponse, "response")
                        }
                      }}
                      disabled={!responseData}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      {responseCopyText}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto rounded-lg bg-muted p-4">
                  <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {responseData
                      ? responseData
                          .split("\n")
                          .filter((line) => line.trim() !== "")
                          .join("\n")
                      : "等待响应..."}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}
