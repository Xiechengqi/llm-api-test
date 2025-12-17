"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, RotateCcw } from "lucide-react"

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

export default function ApiTester() {
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

    const curlCommand = `curl ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -d '${JSON.stringify(requestBody, null, 2).replace(/\n/g, "\n  ")}'`

    setRequestData(curlCommand)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      setResponseData(
        JSON.stringify(
          {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            body: data,
          },
          null,
          2,
        ),
      )

      if (!response.ok) {
        setError(`API Error: ${response.status} - ${data.error?.message || response.statusText}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Request failed: ${errorMessage}`)
      setResponseData(JSON.stringify({ error: errorMessage }, null, 2))
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
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>参数配置</CardTitle>
                      <CardDescription>调整 Chat Completion 参数</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleResetParameters}>
                      <RotateCcw className="mr-2 size-4" />
                      重置
                    </Button>
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
                        <p className="text-xs text-muted-foreground">
                          降低重复词频率，值越大惩罚越强（范围: -2.0 - 2.0）
                        </p>
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

                  <Button onClick={handleTest} disabled={loading} className="w-full" size="lg">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        测试中...
                      </>
                    ) : (
                      "开始测试"
                    )}
                  </Button>

                  {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>请求详情</CardTitle>
                  <CardDescription>完整的 cURL 命令（包含明文 API Key）</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs font-mono leading-relaxed">
                      {requestData || '点击"开始测试"查看 cURL 命令...'}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>响应详情</CardTitle>
                  <CardDescription>完整的 HTTP 响应内容</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs font-mono leading-relaxed">
                      {responseData || "等待响应..."}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
