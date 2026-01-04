import type { ApiProvider } from "./types"

export const API_PROVIDERS: ApiProvider[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
  },
  {
    id: "modelscope",
    name: "ModelScope",
    endpoint: "https://api-inference.modelscope.cn/v1/chat/completions",
  },
  {
    id: "custom",
    name: "自定义",
    endpoint: "",
  },
]

