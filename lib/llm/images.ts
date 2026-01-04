import type { MessageImage } from "./types"

export const addCacheBustParam = (url: string, nowMs: number = Date.now()): string => {
  return url.includes("?") ? `${url}&_t=${nowMs}` : `${url}?_t=${nowMs}`
}

export const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => resolve(event.target?.result as string)
    reader.onerror = () => reject(new Error("Failed to read blob as data URL"))
    reader.readAsDataURL(blob)
  })
}

export const fetchImageAsDataUrl = async (url: string): Promise<{ base64: string; mimeType: string }> => {
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const blob = await response.blob()
  if (!blob.type.startsWith("image/")) {
    throw new Error("URL is not an image")
  }

  const base64 = await blobToDataUrl(blob)
  return { base64, mimeType: blob.type }
}

export const reloadMessageImages = async (images: MessageImage[]): Promise<MessageImage[]> => {
  if (images.length === 0) return images

  const reloadedImages: MessageImage[] = []

  for (const img of images) {
    if (img.type === "url" && img.url) {
      try {
        const urlWithCacheBust = addCacheBustParam(img.url)
        const { base64, mimeType } = await fetchImageAsDataUrl(urlWithCacheBust)
        reloadedImages.push({ ...img, base64, mimeType })
      } catch {
        reloadedImages.push(img)
      }
    } else {
      reloadedImages.push(img)
    }
  }

  return reloadedImages
}

export const buildMessageImageFromUrl = async (url: string): Promise<MessageImage> => {
  const urlWithCacheBust = addCacheBustParam(url)
  const { base64, mimeType } = await fetchImageAsDataUrl(urlWithCacheBust)

  return {
    id: Date.now().toString(),
    type: "url",
    url,
    base64,
    mimeType,
  }
}

export const buildMessageImageFromFile = async (file: File): Promise<MessageImage> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("Not an image file")
  }

  const base64 = await blobToDataUrl(file)

  return {
    id: Date.now().toString(),
    type: "file",
    base64,
    mimeType: file.type,
    name: file.name,
  }
}

