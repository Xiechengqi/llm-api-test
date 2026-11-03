import type { SettingsState } from "@/lib/llm/page-state"
import { API_PROVIDERS } from "@/lib/llm/providers"

export const SHARE_QUERY_KEYS = ["api", "key", "model"] as const

export type ShareQueryPatch = Partial<Pick<SettingsState, "provider" | "baseURL" | "apiPath" | "apiKey" | "model">>

const builtinEndpoints = API_PROVIDERS.flatMap((provider) => {
  if (!provider.endpoint) return []
  try {
    const url = new URL(provider.endpoint)
    return [{ id: provider.id, origin: url.origin, pathname: url.pathname }]
  } catch {
    return []
  }
})

const normalizePath = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.replace(/\/+$/, "")
  return pathname
}

export const joinApiEndpoint = (baseURL: string, apiPath: string): string => {
  const base = baseURL.trim().replace(/\/+$/, "")
  const path = apiPath.trim()
  if (!base) return path
  if (!path) return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

const hasShareKey = (params: URLSearchParams): boolean => SHARE_QUERY_KEYS.some((key) => params.has(key))

export const buildShareUrl = (args: {
  pageUrl: string
  baseURL: string
  apiPath: string
  apiKey: string
  model: string
}): string => {
  const page = new URL(args.pageUrl)
  for (const key of SHARE_QUERY_KEYS) page.searchParams.delete(key)
  page.searchParams.set("api", joinApiEndpoint(args.baseURL, args.apiPath))
  page.searchParams.set("key", args.apiKey)
  page.searchParams.set("model", args.model)
  return page.toString()
}

export const parseShareSearch = (search: string): ShareQueryPatch | null => {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
  if (!hasShareKey(params)) return null

  const patch: ShareQueryPatch = {}

  if (params.has("api")) {
    const raw = (params.get("api") ?? "").trim()
    if (!raw) {
      patch.provider = "custom"
      patch.baseURL = ""
      patch.apiPath = ""
    } else {
      try {
        const url = new URL(raw)
        const pathname = normalizePath(url.pathname)
        const match = builtinEndpoints.find(
          (endpoint) => endpoint.origin === url.origin && normalizePath(endpoint.pathname) === pathname,
        )
        patch.provider = match?.id ?? "custom"
        patch.baseURL = url.origin
        patch.apiPath = pathname
      } catch {
        // Relative values are not endpoints. Skip them so stored settings stay intact.
      }
    }
  }

  if (params.has("key")) {
    patch.apiKey = params.get("key") ?? ""
  }

  if (params.has("model")) {
    patch.model = params.get("model") ?? ""
  }

  return patch
}

export const stripShareSearch = (href: string): string => {
  const page = new URL(href)
  if (!hasShareKey(page.searchParams)) return href
  for (const key of SHARE_QUERY_KEYS) page.searchParams.delete(key)
  const query = page.searchParams.toString()
  return `${page.origin}${page.pathname}${query ? `?${query}` : ""}${page.hash}`
}
