export const formatResponseForDisplay = (response: Response, responseText: string) => {
  let parsedResponse: any
  try {
    parsedResponse = JSON.parse(responseText)
  } catch {
    parsedResponse = responseText
  }
  return JSON.stringify(
    {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedResponse,
    },
    null,
    2,
  )
}

