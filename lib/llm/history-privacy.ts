import type { HistoryItem, ModelHistoryItem } from "./types"

export const REDACTED_CREDENTIAL = "[REDACTED]"

/** Redact before history display, persistence or CSV export. Explicitly known
 * keys also cover a server echo, not just the generated curl header. */
export function redactCredentials(text: string, knownKeys: readonly string[] = []): string {
  let clean = text
  for (const key of knownKeys) {
    if (!key) continue
    for (const value of new Set([key, encodeURIComponent(key)])) {
      clean = clean.split(value).join(REDACTED_CREDENTIAL)
    }
  }
  return clean
    .replace(/(\b(?:authorization|proxy-authorization)\s*:\s*(?:Bearer|Basic)\s+)[^\s"'\\]+/gi, `$1${REDACTED_CREDENTIAL}`)
    .replace(/("(?:authorization|proxy-authorization)"\s*:\s*"(?:Bearer|Basic)\s+)[^"]+/gi, `$1${REDACTED_CREDENTIAL}`)
    .replace(/(\b(?:x-api-key|api-key|x-goog-api-key)\s*:\s*)[^\s"'\\]+/gi, `$1${REDACTED_CREDENTIAL}`)
    .replace(/("(?:apiKey|api_key|x-api-key|x-goog-api-key)"\s*:\s*")[^"]+/gi, `$1${REDACTED_CREDENTIAL}`)
    .replace(/([?&#](?:key|api_key|apiKey|access_token)=)[^&#\s"'<>]*/gi, `$1${REDACTED_CREDENTIAL}`)
    .replace(/\bccrt_[A-Za-z0-9_-]+/g, REDACTED_CREDENTIAL)
}

export function redactHistoryItem(item: HistoryItem, knownKeys: readonly string[] = []): HistoryItem {
  return {
    id: item.id,
    timestamp: item.timestamp,
    duration: item.duration,
    model: item.model,
    requestContent: redactCredentials(item.requestContent, knownKeys),
    requestRaw: redactCredentials(item.requestRaw, knownKeys),
    responseContent: redactCredentials(item.responseContent, knownKeys),
    responseRaw: redactCredentials(item.responseRaw, knownKeys),
  }
}

export function modelHistoryWithoutKey(item: ModelHistoryItem): ModelHistoryItem {
  // Keep the connection and result, not a reusable plaintext credential. The
  // in-memory item can still be replayed until this tab is closed.
  return {
    id: item.id, timestamp: item.timestamp, provider: item.provider, model: item.model,
    baseURL: item.baseURL, apiPath: item.apiPath, status: item.status, duration: item.duration,
    apiKey: "",
  }
}
