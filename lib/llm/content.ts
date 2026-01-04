import type { ModelScopeModel } from "./types"

export const extractImagesFromRequestContent = (requestContent: string): string[] => {
  if (!requestContent || requestContent.trim() === "") {
    return []
  }

  try {
    const parsed = JSON.parse(requestContent)
    const images: string[] = []

    if (Array.isArray(parsed)) {
      parsed.forEach((message: any) => {
        if (message.content && Array.isArray(message.content)) {
          message.content.forEach((item: any) => {
            if (item.type === "image_url" && item.image_url?.url) {
              const url = item.image_url.url
              if (url.startsWith("data:image/") || url.startsWith("http://") || url.startsWith("https://")) {
                images.push(url)
              }
            }
          })
        }
      })
    }

    return images
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[v0] Error parsing request content for images:", error)
    }
    return []
  }
}

export const extractImagesFromResponseContent = (
  responseContent: string,
  responseRaw: string,
  responseImagesMap?: Map<number, string[]>,
  historyTimestamp?: number,
): string[] => {
  if (!responseContent || responseContent.trim() === "") {
    return []
  }

  if (historyTimestamp !== undefined && responseImagesMap) {
    const savedImages = responseImagesMap.get(historyTimestamp)
    if (savedImages && savedImages.length > 0) {
      return savedImages
    }
  }

  if (responseContent.startsWith("data:image")) {
    return [responseContent]
  }

  if (responseContent.includes("\n") && responseContent.split("\n").every((line) => line.startsWith("data:image"))) {
    return responseContent.split("\n").filter(Boolean)
  }

  try {
    const parsed = JSON.parse(responseRaw)
    const images: string[] = []

    let responseBody = parsed
    if (parsed.body && typeof parsed.body === "object") {
      responseBody = parsed.body
    }

    if (responseBody.images && Array.isArray(responseBody.images)) {
      responseBody.images.forEach((img: any) => {
        if (img.url && (img.url.startsWith("http://") || img.url.startsWith("https://"))) {
          images.push(img.url)
        }
      })
    }

    if (responseBody.choices && Array.isArray(responseBody.choices)) {
      responseBody.choices.forEach((choice: any) => {
        if (choice.message && choice.message.images && Array.isArray(choice.message.images)) {
          choice.message.images.forEach((img: any) => {
            if (img.image_url && img.image_url.url) {
              const url = img.image_url.url
              if (url.startsWith("data:image") || url.startsWith("http://") || url.startsWith("https://")) {
                images.push(url)
              }
            }
          })
        }
      })
    }

    return images
  } catch (error) {
    console.error("[v0] Error extracting images from response:", error)
    return []
  }
}

export const formatRequestContentForDisplay = (requestContent: string): string => {
  try {
    const parsed = JSON.parse(requestContent)

    if (Array.isArray(parsed)) {
      let textParts: string[] = []

      parsed.forEach((message: any) => {
        if (!message.content) return

        if (typeof message.content === "string") {
          textParts.push(message.content)
          return
        }

        if (Array.isArray(message.content)) {
          const messageParts = message.content
            .filter((item: any) => item.type === "text")
            .map((item: any) => item.text)
          textParts = textParts.concat(messageParts)
        }
      })

      return textParts.join("\n")
    }

    return requestContent
  } catch (error) {
    return requestContent
  }
}

export const modelscopeHasImageGenerationTask = (model: ModelScopeModel): boolean => {
  const taskTypes = model.task_types
  if (Array.isArray(taskTypes)) return taskTypes.includes("生成图片")
  if (typeof taskTypes === "string") return taskTypes.includes("生成图片")
  return false
}

