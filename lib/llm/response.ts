import type { MessageImage } from "./types"

export const parseResponseToContent = (parsedResponse: any): { responseContent: string; responseImagesToSave: MessageImage[] } => {
  let responseContent = ""
  let responseImagesToSave: MessageImage[] = []

  const modelScopeImages = parsedResponse?.images
  if (modelScopeImages && Array.isArray(modelScopeImages) && modelScopeImages.length > 0) {
    const imageUrls = modelScopeImages
      .map((img: any) => img.url)
      .filter((url: any) => url && (url.startsWith("http://") || url.startsWith("https://")))

    if (imageUrls.length > 0) {
      const timestamp = Date.now()
      responseImagesToSave = imageUrls.map((url, idx) => ({
        id: `response-${timestamp}-${idx}`,
        type: "url",
        url: url,
      }))
      responseContent = imageUrls.join("\n")
      return { responseContent, responseImagesToSave }
    }

    return { responseContent: JSON.stringify(parsedResponse), responseImagesToSave: [] }
  }

  const messageContent = parsedResponse?.choices?.[0]?.message?.content
  const anthropicContent = parsedResponse?.content?.[0]?.text

  if (messageContent || parsedResponse?.choices?.[0]?.message) {
    const reasoningDetails = parsedResponse?.choices?.[0]?.message?.reasoning_details?.[0]?.text
    const reasoningContent =
      parsedResponse?.choices?.[0]?.message?.reasoning_content || parsedResponse?.choices?.[0]?.message?.reasoning

    if (reasoningDetails) {
      if (messageContent) {
        responseContent = `<Thinking>\n${reasoningDetails}\n</Thinking>\n\n${messageContent}`
      } else {
        responseContent = reasoningDetails
      }
    } else if (reasoningContent) {
      if (messageContent) {
        responseContent = `<Thinking>\n${reasoningContent}\n</Thinking>\n\n${messageContent}`
      } else {
        responseContent = reasoningContent
      }
    } else if (messageContent) {
      responseContent = messageContent
    } else {
      responseContent = JSON.stringify(parsedResponse?.choices?.[0]?.message)
    }
  } else if (anthropicContent) {
    responseContent = anthropicContent
  } else {
    responseContent = JSON.stringify(parsedResponse)
  }

  return { responseContent, responseImagesToSave }
}

