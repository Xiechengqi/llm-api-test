export const isHttpUrl = (path: string) => {
  return path.startsWith("http://") || path.startsWith("https://")
}

export const describeFetchTextError = (error: unknown): string => {
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return "跨域访问被阻止（CORS）。请确保文件服务器支持 CORS，或使用支持 CORS 的文件托管服务（如 GitHub Gist、Pastebin 等）。"
  }
  if (error instanceof Error) {
    return error.message
  }
  return "无法读取指定的文件路径"
}

export const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return await response.text()
}

export type PickLocalTextFileResult = {
  content: string
  fileName: string
  handle: FileSystemFileHandle | null
  usedFileSystemAccessApi: boolean
}

export const pickLocalTextFile = async (): Promise<PickLocalTextFileResult | null> => {
  const isInIframe = window.self !== window.top

  try {
    if ("showOpenFilePicker" in window && !isInIframe) {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: "Text Files",
            accept: {
              "text/plain": [".txt"],
              "text/markdown": [".md"],
            },
          },
        ],
        multiple: false,
      })

      const file = await fileHandle.getFile()
      const content = await file.text()

      return { content, fileName: file.name, handle: fileHandle, usedFileSystemAccessApi: true }
    }
  } catch {
    // Fall through to input method
  }

  return await new Promise<PickLocalTextFileResult | null>((resolve) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".txt,.md"
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const content = await file.text()
      resolve({ content, fileName: file.name, handle: null, usedFileSystemAccessApi: false })
    }
    input.click()
  })
}

