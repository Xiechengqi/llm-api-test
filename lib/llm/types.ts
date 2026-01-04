export interface OpenRouterModel {
  id: string
  name?: string
  provider?: string
  description?: string
  link?: string
  pub_date?: string
  context_length?: number
  architecture?: {
    input_modalities?: string[]
    output_modalities?: string[]
    modality?: string
    tokenizer?: string
    instruct_type?: string | null
  }
  pricing?: {
    prompt?: string
    completion?: string
    [key: string]: any
  }
  created?: number
}

export interface CerebrasModel {
  id: string
  name?: string
  provider?: string
  description?: string
  link?: string
  pub_date?: string
  context_length?: number
}

export interface ModelScopeModel {
  id: string
  name?: string
  provider?: string
  description?: string
  link?: string
  pub_date?: string
  time?: string
  context_length?: number
  task_types?: string | string[]
  downloads?: number
  stars?: number
}

export interface ApiProvider {
  id: string
  name: string
  endpoint: string
}

export interface ModelHistoryItem {
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

export interface HistoryItem {
  id: string
  timestamp: number
  duration?: number
  model: string
  requestContent: string
  requestRaw: string
  responseContent: string
  responseRaw: string
}

export interface MessageImage {
  id: string
  type: "url" | "file"
  url?: string
  base64?: string
  mimeType?: string
  name?: string
}

export interface CustomProviderConfig {
  id: string
  name: string
  baseURL: string
  apiPath: string
  apiKey?: string
}

