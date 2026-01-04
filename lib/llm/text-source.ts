import { isHttpUrl } from "./text-files"

type ResolveTextSourceArgs = {
  enabled: boolean
  path: string
  autoReload: boolean
  isFromLocalFile: boolean
  loadedContent: string
  fallbackContent: string
  readHttp: (path: string) => Promise<string | null>
  reloadLocal: () => Promise<string | null>
  setLoadedContent: (content: string) => void
}

export const resolveTextSource = async (args: ResolveTextSourceArgs): Promise<string> => {
  if (!args.enabled) return args.fallbackContent

  const trimmedPath = args.path.trim()
  if (!trimmedPath) return args.fallbackContent

  if (!args.autoReload) {
    return args.loadedContent || args.fallbackContent
  }

  if (isHttpUrl(trimmedPath)) {
    const reloadedContent = await args.readHttp(trimmedPath)
    if (reloadedContent !== null) {
      args.setLoadedContent(reloadedContent)
      return reloadedContent
    }
    return args.loadedContent || args.fallbackContent
  }

  if (args.isFromLocalFile) {
    const reloadedContent = await args.reloadLocal()
    if (reloadedContent !== null) {
      return reloadedContent
    }
    return args.loadedContent || args.fallbackContent
  }

  return args.loadedContent || args.fallbackContent
}

type PreloadHttpTextSourceArgs = {
  enabled: boolean
  path: string
  isFromLocalFile: boolean
  readHttp: (path: string) => Promise<string | null>
  setLoadedContent: (content: string) => void
  onError?: (error: unknown) => void
}

export const preloadHttpTextSource = async (args: PreloadHttpTextSourceArgs) => {
  if (!args.enabled) return
  if (!args.path) return
  if (args.isFromLocalFile) return

  const trimmedPath = args.path.trim()
  if (!trimmedPath) return
  if (!isHttpUrl(trimmedPath)) return

  try {
    const content = await args.readHttp(trimmedPath)
    args.setLoadedContent(content || "")
  } catch (error) {
    args.onError?.(error)
    args.setLoadedContent("")
  }
}
