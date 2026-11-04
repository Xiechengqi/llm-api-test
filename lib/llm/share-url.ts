import type { SettingsState } from "@/lib/llm/page-state"
import { API_PROVIDERS } from "./providers"

export const SHARE_QUERY_KEYS = ["api", "key", "model"] as const

export type ShareQueryPatch = Partial<Pick<SettingsState, "provider" | "baseURL" | "apiPath" | "apiKey" | "model">>

export type ShareLaunch =
  | { mode: "saved" }
  | { mode: "temporary"; patch: ShareQueryPatch; invalid: boolean }

export function settingsForShareLaunch(defaults: SettingsState, launch: ShareLaunch): SettingsState {
  if (launch.mode === "saved") return { ...defaults }
  return {
    ...defaults,
    // No omitted URL field may inherit another saved connection's credential
    // or endpoint. An invalid import is also an empty temporary session.
    provider: "custom", baseURL: "", apiPath: "/v1/chat/completions", apiKey: "", model: "",
    ...(launch.invalid ? {} : launch.patch),
  }
}

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
  const fragment = new URLSearchParams()
  fragment.set("api", joinApiEndpoint(args.baseURL, args.apiPath))
  fragment.set("key", args.apiKey)
  fragment.set("model", args.model)
  page.hash = fragment.toString()
  return page.toString()
}

export const parseShareSearch = (search: string): ShareQueryPatch | null => {
  const params = new URLSearchParams(search.replace(/^[?#]/, ""))
  if (!hasShareKey(params)) return null
  if (SHARE_QUERY_KEYS.some((key) => params.getAll(key).length > 1)) return null

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
        if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.hash) return null
        const pathname = normalizePath(url.pathname)
        const match = builtinEndpoints.find(
          (endpoint) => endpoint.origin === url.origin && normalizePath(endpoint.pathname) === pathname,
        )
        patch.provider = match?.id ?? "custom"
        patch.baseURL = url.origin
        patch.apiPath = pathname + url.search
      } catch {
        return null
      }
    }
  }

  if (params.has("key")) {
    patch.apiKey = params.get("key") ?? ""
    if (/[\s\u0000-\u001f\u007f]/u.test(patch.apiKey)) return null
  }

  if (params.has("model")) {
    patch.model = params.get("model") ?? ""
    if (/[\u0000-\u001f\u007f]/u.test(patch.model)) return null
  }

  return patch
}

export const stripShareSearch = (href: string): string => {
  const page = new URL(href)
  if (hasShareKey(page.searchParams)) {
    for (const key of SHARE_QUERY_KEYS) page.searchParams.delete(key)
  }
  const fragment = new URLSearchParams(page.hash.slice(1))
  if (hasShareKey(fragment)) {
    for (const key of SHARE_QUERY_KEYS) fragment.delete(key)
    page.hash = fragment.toString()
  }
  return page.href
}

/** A fragment is one complete connection, never mixed with legacy query
 * fields or saved credentials. Even an invalid import stays isolated. */
export const readShareLaunch = (href: string): { session: ShareLaunch; cleanUrl: string } => {
  const page = new URL(href)
  const fragment = new URLSearchParams(page.hash.slice(1))
  const params = hasShareKey(fragment) ? fragment : page.searchParams
  const patch = parseShareSearch(params.toString())
  const temporary = hasShareKey(params)
  return {
    session: temporary ? { mode: "temporary", patch: patch ?? {}, invalid: patch === null } : { mode: "saved" },
    cleanUrl: stripShareSearch(href),
  }
}

/** Run before mounting the application or reading browser storage. Never log
 * navigation exceptions: their message may include the original credential. */
export const captureShareLaunch = (browser: {
  location: Pick<Location, "href">
  history: Pick<History, "state" | "replaceState">
}): ShareLaunch => {
  try {
    const { session, cleanUrl } = readShareLaunch(browser.location.href)
    if (cleanUrl !== browser.location.href) {
      browser.history.replaceState(browser.history.state, "", cleanUrl)
    }
    return session
  } catch {
    return { mode: "temporary", patch: {}, invalid: true }
  }
}
