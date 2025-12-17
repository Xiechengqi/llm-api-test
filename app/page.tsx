"use client"

import { CardDescription } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

const API_PROVIDERS = [
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
    id: "openrouter",
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
  },
  {
    id: "custom",
    name: "自定义",
    endpoint: "",
  },
]

interface HistoryItem {
  id: string
  timestamp: number
  model: string // Add model field to HistoryItem interface
  requestContent: string
  requestRaw: string
  responseContent: string
  responseRaw: string
}

export default function LLMAPITester() {
  const DEFAULT_VALUES = {
    provider: "openrouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    model: "gpt-3.5-turbo",
    prompt: "Hello, how are you?",
    maxTokens: 4096,
    temperature: 1.0,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
  }

  const [provider, setProvider] = useState(DEFAULT_VALUES.provider)
  const [endpoint, setEndpoint] = useState(DEFAULT_VALUES.endpoint)
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("")
  const [prompt, setPrompt] = useState(DEFAULT_VALUES.prompt)
  const [maxTokens, setMaxTokens] = useState(DEFAULT_VALUES.maxTokens)
  const [temperature, setTemperature] = useState(DEFAULT_VALUES.temperature)
  const [topP, setTopP] = useState(DEFAULT_VALUES.topP)
  const [frequencyPenalty, setFrequencyPenalty] = useState(DEFAULT_VALUES.frequencyPenalty)
  const [presencePenalty, setPresencePenalty] = useState(DEFAULT_VALUES.presencePenalty)
  const [loading, setLoading] = useState(false)
  const [requestData, setRequestData] = useState("")
  const [responseData, setResponseData] = useState("")
  const [error, setError] = useState("")
  const [maxTokensLimit, setMaxTokensLimit] = useState(8192)

  const [history, setHistory] = useState<HistoryItem[]>([])
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set())
  const [visibleRawCells, setVisibleRawCells] = useState<Set<string>>(new Set()) // State to track visible raw columns per history item

  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedProvider = localStorage.getItem("llm_api_provider")
      const savedEndpoint = localStorage.getItem("llm_api_endpoint")
      const savedApiKey = localStorage.getItem("llm_api_key")
      const savedModel = localStorage.getItem("llm_api_model")
      const savedPrompt = localStorage.getItem("llm_api_prompt")
      const savedMaxTokens = localStorage.getItem("llm_api_maxTokens")
      const savedTemperature = localStorage.getItem("llm_api_temperature")
      const savedTopP = localStorage.getItem("llm_api_topP")
      const savedFrequencyPenalty = localStorage.getItem("llm_api_frequencyPenalty")
      const savedPresencePenalty = localStorage.getItem("llm_api_presencePenalty")
      const savedHistory = localStorage.getItem("llm_api_history")

      if (savedProvider) setProvider(savedProvider)
      if (savedEndpoint) setEndpoint(savedEndpoint)
      if (savedApiKey) setApiKey(savedApiKey)
      if (savedModel) setModel(savedModel)
      if (savedPrompt) setPrompt(savedPrompt)
      if (savedMaxTokens) setMaxTokens(Number(savedMaxTokens))
      if (savedTemperature) setTemperature(Number(savedTemperature))
      if (savedTopP) setTopP(Number(savedTopP))
      if (savedFrequencyPenalty) setFrequencyPenalty(Number(savedFrequencyPenalty))
      if (savedPresencePenalty) setPresencePenalty(Number(savedPresencePenalty))
      if (savedHistory) setHistory(JSON.parse(savedHistory))
    }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_provider", provider)
    }
  }, [provider])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_endpoint", endpoint)
    }
  }, [endpoint])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_key", apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_model", model)
    }
  }, [model])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_prompt", prompt)
    }
  }, [prompt])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_maxTokens", String(maxTokens))
    }
  }, [maxTokens])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_temperature", String(temperature))
    }
  }, [temperature])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_topP", String(topP))
    }
  }, [topP])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_frequencyPenalty", String(frequencyPenalty))
    }
  }, [frequencyPenalty])

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("llm_api_presencePenalty", String(presencePenalty))
    }
  }, [presencePenalty])

  useEffect(() => {
    if (typeof window !== "undefined" && history.length > 0) {
      localStorage.setItem("llm_api_history", JSON.stringify(history))
    }
  }, [history])

  const handleProviderChange = (providerId: string) => {
    setProvider(providerId)
    const selectedProvider = API_PROVIDERS.find((p) => p.id === providerId)
    if (selectedProvider && selectedProvider.endpoint) {
      setEndpoint(selectedProvider.endpoint)
    } else {
      setEndpoint("")
    }
  }

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

    const modelToUse = model || DEFAULT_VALUES.model

    const requestBody = {
      model: modelToUse,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    }

    const requestCurl = `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '${JSON.stringify(requestBody, null, 2).replace(/\n/g, "\n  ")}'`

    setRequestData(requestCurl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 60000) // 60 second timeout

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseText = await response.text()
      let parsedResponse
      try {
        parsedResponse = JSON.parse(responseText)
      } catch {
        parsedResponse = responseText
      }

      setResponseData(responseText)

      const requestContent = requestBody.messages?.[requestBody.messages.length - 1]?.content || prompt
      const responseContent = parsedResponse?.choices?.[0]?.message?.content || JSON.stringify(parsedResponse)

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        model: model || "gpt-3.5-turbo", // Add model to history item
        requestContent,
        requestRaw: requestCurl,
        responseContent,
        responseRaw: JSON.stringify(
          {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: parsedResponse,
          },
          null,
          2,
        ),
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

      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        model: model || "gpt-3.5-turbo", // Add model to history item
        requestContent: "",
        requestRaw: "",
        responseContent: "",
        responseRaw: errorResponse,
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

  const handleResetApiConfig = () => {
    setProvider(DEFAULT_VALUES.provider)
    setEndpoint(DEFAULT_VALUES.endpoint)
    setApiKey("")
    setModel("")
    setError("")

    if (typeof window !== "undefined") {
      localStorage.removeItem("llm_api_provider")
      localStorage.removeItem("llm_api_endpoint")
      localStorage.removeItem("llm_api_key")
      localStorage.removeItem("llm_api_model")
    }
  }

  const handleResetParameters = () => {
    setPrompt(DEFAULT_VALUES.prompt)
    setMaxTokens(DEFAULT_VALUES.maxTokens)
    setTemperature(DEFAULT_VALUES.temperature)
    setTopP(DEFAULT_VALUES.topP)
    setFrequencyPenalty(DEFAULT_VALUES.frequencyPenalty)
    setPresencePenalty(DEFAULT_VALUES.presencePenalty)

    if (typeof window !== "undefined") {
      localStorage.removeItem("llm_api_prompt")
      localStorage.removeItem("llm_api_maxTokens")
      localStorage.removeItem("llm_api_temperature")
      localStorage.removeItem("llm_api_topP")
      localStorage.removeItem("llm_api_frequencyPenalty")
      localStorage.removeItem("llm_api_presencePenalty")
    }
  }

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
    const updatedHistory = history.filter((item) => item.id !== id)
    if (updatedHistory.length === 0) {
      localStorage.removeItem("llm_api_history")
    }
  }

  const handleClearHistory = () => {
    setHistory([])
    setCurrentPage(1)
    setExpandedCells(new Set())
    setVisibleRawCells(new Set()) // Clear visible raw cells on history clear
    if (typeof window !== "undefined") {
      localStorage.removeItem("llm_api_history")
    }
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-4 md:px-8">
          <h1 className="text-balance text-xl font-bold tracking-tight">LLM API 测试工具</h1>

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

            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="eg: gpt-3.5-turbo"
              className="w-[200px]"
            />

            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="API Key"
              className="w-[200px]"
            />

            <Button variant="outline" size="sm" onClick={handleResetApiConfig}>
              <RotateCcw className="size-4" />
            </Button>
          </div>
        </div>

        {provider === "custom" && (
          <div className="border-t px-4 py-3 md:px-8">
            <div className="flex items-center gap-2">
              <Label htmlFor="customEndpoint" className="text-sm font-medium whitespace-nowrap">
                自定义 API 端点
              </Label>
              <Input
                id="customEndpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://api.example.com/v1/chat/completions"
                className="max-w-2xl"
              />
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Parameters Configuration - Full width */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>参数配置</CardTitle>
                  <CardDescription>调整 Chat Completion 参数</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleResetParameters}>
                    <RotateCcw className="mr-2 size-4" />
                    重置
                  </Button>
                  <Button onClick={handleTest} disabled={loading} size="sm">
                    {loading ? (
                      <>
                        <RotateCcw className="mr-2 size-4 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      "开始测试"
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="prompt">提示词</Label>
                    <p className="text-xs text-muted-foreground">输入测试用的消息内容</p>
                  </div>
                </div>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="输入你的提示词..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-0.5">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <p className="text-xs text-muted-foreground">最大生成令牌数量（范围: 1 - {maxTokensLimit}）</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{maxTokens}</span>
                    <span className="text-xs text-muted-foreground">/</span>
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
                  <span className="text-sm font-medium">{temperature.toFixed(2)}</span>
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
                  <span className="text-sm font-medium">{topP.toFixed(2)}</span>
                </div>
                <Slider id="topP" min={0} max={1} step={0.01} value={[topP]} onValueChange={(v) => setTopP(v[0])} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
                    <p className="text-xs text-muted-foreground">降低重复词频率，值越大惩罚越强（范围: -2.0 - 2.0）</p>
                  </div>
                  <span className="text-sm font-medium">{frequencyPenalty.toFixed(2)}</span>
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
                  <span className="text-sm font-medium">{presencePenalty.toFixed(2)}</span>
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
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium w-[140px]">时间</th>
                            <th className="px-4 py-3 text-left font-medium w-[160px]">模型</th>
                            <th className="px-4 py-3 text-left font-medium">请求 Content</th>
                            <th className="px-4 py-3 text-left font-medium w-[100px]">请求 Raw</th>
                            <th className="px-4 py-3 text-left font-medium">响应 Content</th>
                            <th className="px-4 py-3 text-left font-medium w-[100px]">响应 Raw</th>
                            <th className="px-4 py-3 text-center font-medium w-[80px]">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {paginatedHistory.map((item) => {
                            const requestContentId = `${item.id}-req-content`
                            const requestRawId = `${item.id}-req-raw`
                            const responseContentId = `${item.id}-res-content`
                            const responseRawId = `${item.id}-res-raw`

                            return (
                              <tr key={item.id} className="hover:bg-muted/50">
                                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap align-top">
                                  {new Date(item.timestamp).toLocaleString("zh-CN", {
                                    month: "2-digit",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </td>
                                <td className="px-4 py-3 text-xs align-top">
                                  <span className="font-mono">{item.model}</span>
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <div className="space-y-1">
                                    <pre
                                      className={`text-xs whitespace-pre-wrap break-words ${
                                        !expandedCells.has(requestContentId) ? "line-clamp-2" : ""
                                      }`}
                                    >
                                      {item.requestContent}
                                    </pre>
                                    {item.requestContent.length > 100 && (
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
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleRawVisibility(requestRawId)}
                                    className="h-7 text-xs"
                                  >
                                    {visibleRawCells.has(requestRawId) ? "隐藏" : "显示"}
                                  </Button>
                                  {visibleRawCells.has(requestRawId) && (
                                    <div className="mt-2 space-y-1">
                                      <pre
                                        className={`text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words ${
                                          !expandedCells.has(requestRawId) ? "line-clamp-2" : ""
                                        }`}
                                      >
                                        {item.requestRaw}
                                      </pre>
                                      {item.requestRaw.length > 100 && (
                                        <button
                                          onClick={() => toggleCellExpansion(requestRawId)}
                                          className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                          {expandedCells.has(requestRawId) ? (
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
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <div className="space-y-1">
                                    <pre
                                      className={`text-xs whitespace-pre-wrap break-words ${
                                        !expandedCells.has(responseContentId) ? "line-clamp-2" : ""
                                      }`}
                                    >
                                      {item.responseContent}
                                    </pre>
                                    {item.responseContent.length > 100 && (
                                      <button
                                        onClick={() => toggleCellExpansion(responseContentId)}
                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                      >
                                        {expandedCells.has(responseContentId) ? (
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
                                </td>
                                <td className="px-4 py-3 align-top">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleRawVisibility(responseRawId)}
                                    className="h-7 text-xs"
                                  >
                                    {visibleRawCells.has(responseRawId) ? "隐藏" : "显示"}
                                  </Button>
                                  {visibleRawCells.has(responseRawId) && (
                                    <div className="mt-2 space-y-1">
                                      <pre
                                        className={`text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words ${
                                          !expandedCells.has(responseRawId) ? "line-clamp-2" : ""
                                        }`}
                                      >
                                        {item.responseRaw}
                                      </pre>
                                      {item.responseRaw.length > 100 && (
                                        <button
                                          onClick={() => toggleCellExpansion(responseRawId)}
                                          className="text-xs text-primary hover:underline flex items-center gap-1"
                                        >
                                          {expandedCells.has(responseRawId) ? (
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
                                </td>
                                <td className="px-4 py-3 text-center align-top">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteHistoryItem(item.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
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
              <CardHeader>
                <CardTitle>请求详情</CardTitle>
                <CardDescription>完整的 cURL 命令（包含明文 API Key）</CardDescription>
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
              <CardHeader>
                <CardTitle>响应详情</CardTitle>
                <CardDescription>完整的 HTTP 响应内容</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto rounded-lg bg-muted p-4">
                  <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {responseData
                      ? (() => {
                          try {
                            const parsed = JSON.parse(responseData)
                            return JSON.stringify(parsed, null, 2)
                          } catch {
                            return responseData
                              .split("\n")
                              .filter((line) => line.trim() !== "")
                              .join("\n")
                          }
                        })()
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
