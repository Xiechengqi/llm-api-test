import type { MessageImage } from "./types"

export type BuildRequestArgs = {
  provider: string
  baseURL: string
  apiKey: string
  fullApiPath: string
  model: string
  maxTokens: number
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stream: boolean
  finalSystemPrompt: string
  finalUserMessage: string
  currentImages: MessageImage[]
  isModelScopeImageGeneration: boolean
}

export type BuildRequestResult = {
  messages: any[]
  requestBody: any
  requestCurl: string
  requestContent: string
}

export type BuildProbeRequestArgs = {
  provider: string
  baseURL: string
  apiKey: string
  fullApiPath: string
  model: string
  systemPrompt: string
  isModelScopeImageGeneration: boolean
}

export type BuildProbeRequestResult = {
  requestBody: any
  requestCurl: string
}

export const buildUserMessageContent = (finalUserMessage: string, currentImages: MessageImage[]): any => {
  let userMessageContent: any = finalUserMessage

  if (currentImages.length > 0) {
    const contentParts: any[] = [
      {
        type: "text",
        text: finalUserMessage,
      },
    ]

    currentImages.forEach((img) => {
      if (img.base64) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: img.base64,
          },
        })
      }
    })

    userMessageContent = contentParts
  }

  return userMessageContent
}

export const buildMessages = (args: { finalSystemPrompt: string; userMessageContent: any }): any[] => {
  return [
    { role: "user", content: args.userMessageContent },
    { role: "system", content: args.finalSystemPrompt },
  ]
}

export const buildRequestBody = (args: {
  isModelScopeImageGeneration: boolean
  model: string
  maxTokens: number
  temperature: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stream: boolean
  finalUserMessage: string
  messages: any[]
}): any => {
  const requestBody: any = {
    model: args.model,
    max_tokens: args.maxTokens,
    temperature: args.temperature,
    top_p: args.topP,
    frequency_penalty: args.frequencyPenalty,
    presence_penalty: args.presencePenalty,
    stream: args.stream,
  }

  if (args.isModelScopeImageGeneration) {
    requestBody.prompt = args.finalUserMessage
  } else {
    requestBody.messages = args.messages
  }

  return requestBody
}

export const buildCurlCommand = (args: {
  fullApiPath: string
  apiKey: string
  requestBody: any
  provider: string
  baseURL: string
}): string => {
  const curlHeaders = ["Content-Type: application/json", `Authorization: Bearer ${args.apiKey}`]
  if (args.baseURL && args.provider === "custom") {
    // Intentionally no-op: reserved for custom provider header variations.
  }

  return `curl ${args.fullApiPath} \\
  -X POST \\
  ${curlHeaders.map((h) => `-H "${h}" \\`).join("")}
  -d '${JSON.stringify(args.requestBody, null, 2).replace(/\\n/g, "\\n  ")}'`
}

export const buildLlmRequest = (args: BuildRequestArgs): BuildRequestResult => {
  const userMessageContent = buildUserMessageContent(args.finalUserMessage, args.currentImages)
  const messages = buildMessages({ finalSystemPrompt: args.finalSystemPrompt, userMessageContent })
  const requestBody = buildRequestBody({
    isModelScopeImageGeneration: args.isModelScopeImageGeneration,
    model: args.model,
    maxTokens: args.maxTokens,
    temperature: args.temperature,
    topP: args.topP,
    frequencyPenalty: args.frequencyPenalty,
    presencePenalty: args.presencePenalty,
    stream: args.stream,
    finalUserMessage: args.finalUserMessage,
    messages,
  })

  const requestCurl = buildCurlCommand({
    fullApiPath: args.fullApiPath,
    apiKey: args.apiKey,
    requestBody,
    provider: args.provider,
    baseURL: args.baseURL,
  })

  const requestContent = JSON.stringify(messages)

  return { messages, requestBody, requestCurl, requestContent }
}

export const buildProbeRequest = (args: BuildProbeRequestArgs): BuildProbeRequestResult => {
  const requestBody: any = {
    model: args.model,
    max_tokens: 100,
    temperature: 1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  }

  if (args.isModelScopeImageGeneration) {
    requestBody.prompt = "hello"
  } else {
    requestBody.messages = [
      { role: "system", content: args.systemPrompt },
      { role: "user", content: "hello" },
    ]
  }

  const requestCurl = buildCurlCommand({
    fullApiPath: args.fullApiPath,
    apiKey: args.apiKey,
    requestBody,
    provider: args.provider,
    baseURL: args.baseURL,
  })

  return { requestBody, requestCurl }
}
