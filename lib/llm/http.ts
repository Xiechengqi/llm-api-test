export class HttpError extends Error {
  status: number
  statusText: string
  url: string

  constructor(args: { status: number; statusText: string; url: string; message?: string }) {
    super(args.message ?? `HTTP ${args.status} ${args.statusText}`)
    this.status = args.status
    this.statusText = args.statusText
    this.url = args.url
  }
}

export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
  options?: { timeoutMs?: number },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 15_000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) {
      throw new HttpError({ status: response.status, statusText: response.statusText, url })
    }
    return (await response.json()) as T
  } finally {
    clearTimeout(timeoutId)
  }
}

