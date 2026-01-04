import type { CerebrasModel, ModelScopeModel, OpenRouterModel } from "./types"
import { fetchJson } from "./http"

const normalizeCatalog = (responseData: unknown): unknown[] => {
  if (Array.isArray(responseData)) return responseData
  if (responseData && typeof responseData === "object") {
    const record = responseData as Record<string, unknown>
    const models = record.models
    if (Array.isArray(models)) return models
    const data = record.data
    if (Array.isArray(data)) return data
  }
  return []
}

export const fetchCerebrasModelCatalog = async (): Promise<CerebrasModel[]> => {
  const responseData = await fetchJson<unknown>("https://models.xiechengqi.top/cerebras.json")
  return normalizeCatalog(responseData) as CerebrasModel[]
}

export const fetchModelScopeModelCatalog = async (): Promise<ModelScopeModel[]> => {
  const responseData = await fetchJson<unknown>("https://models.xiechengqi.top/modelscope.json")
  return normalizeCatalog(responseData) as ModelScopeModel[]
}

export const fetchOpenRouterModelCatalog = async (): Promise<OpenRouterModel[]> => {
  const responseData = await fetchJson<unknown>("https://models.xiechengqi.top/openrouter.json")
  return normalizeCatalog(responseData) as OpenRouterModel[]
}

