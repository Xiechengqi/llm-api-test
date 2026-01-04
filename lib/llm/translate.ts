const MAX_MYMEMORY_LENGTH = 500

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const translateWithLibreTranslate = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "zh",
        format: "text",
      }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.translatedText) {
        console.log("[v0] LibreTranslate 翻译成功")
        return data.translatedText
      }
    }
  } catch (error) {
    console.warn("[v0] LibreTranslate 翻译失败:", error)
  }
  return null
}

const translateWithGoogleTranslate = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`,
    )

    if (response.ok) {
      const data = await response.json()
      if (data && data[0] && Array.isArray(data[0])) {
        const translated = data[0].map((item: any[]) => item[0]).join("")
        if (translated) {
          console.log("[v0] Google Translate 翻译成功")
          return translated
        }
      }
    }
  } catch (error) {
    console.warn("[v0] Google Translate 翻译失败:", error)
  }
  return null
}

const translateWithMyMemory = async (text: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN`,
    )

    if (response.ok) {
      const data = await response.json()
      console.log("[v0] MyMemory API 响应:", data)

      if (
        data.responseStatus === 429 ||
        (data.responseData?.translatedText && data.responseData.translatedText.includes("MYMEMORY WARNING"))
      ) {
        console.warn("[v0] MyMemory API 配额已用尽")
        return null
      }

      if (data.responseData && data.responseData.translatedText) {
        console.log("[v0] MyMemory 翻译成功")
        return data.responseData.translatedText
      }
    } else if (response.status === 429) {
      console.warn("[v0] MyMemory API 配额已用尽 (HTTP 429)")
      return null
    }
  } catch (error) {
    console.warn("[v0] MyMemory API 翻译失败:", error)
  }
  return null
}

export type TranslateResult = {
  translatedText: string
  errorMessage: string | null
}

export const translateEnToZhWithFallback = async (text: string): Promise<TranslateResult> => {
  if (!text) {
    return { translatedText: "", errorMessage: null }
  }

  try {
    if (text.length <= MAX_MYMEMORY_LENGTH) {
      let translated: string | null = null

      translated = await translateWithMyMemory(text)

      if (!translated) {
        console.log("[v0] 切换到备用翻译 API: LibreTranslate")
        translated = await translateWithLibreTranslate(text)
      }

      if (!translated) {
        console.log("[v0] 切换到备用翻译 API: Google Translate")
        translated = await translateWithGoogleTranslate(text)
      }

      if (translated) {
        console.log("[v0] 翻译成功:", translated.substring(0, 100))
        return { translatedText: translated, errorMessage: null }
      }

      console.warn("[v0] 所有翻译 API 都失败了")
      return { translatedText: "", errorMessage: "翻译失败：所有翻译服务暂时不可用，请稍后重试" }
    }

    const segments: string[] = []
    for (let i = 0; i < text.length; i += MAX_MYMEMORY_LENGTH) {
      segments.push(text.substring(i, i + MAX_MYMEMORY_LENGTH))
    }

    const translatedSegments: string[] = []
    let hasTranslationError = false
    let currentApi = "mymemory"

    for (const segment of segments) {
      let translated: string | null = null

      if (currentApi === "mymemory") {
        translated = await translateWithMyMemory(segment)
        if (!translated) {
          console.log("[v0] MyMemory 失败，切换到 LibreTranslate")
          currentApi = "libretranslate"
        }
      }

      if (!translated && currentApi === "libretranslate") {
        translated = await translateWithLibreTranslate(segment)
        if (!translated) {
          console.log("[v0] LibreTranslate 失败，切换到 Google Translate")
          currentApi = "google"
        }
      }

      if (!translated && currentApi === "google") {
        translated = await translateWithGoogleTranslate(segment)
      }

      if (translated) {
        translatedSegments.push(translated)
      } else {
        translatedSegments.push(segment)
        hasTranslationError = true
      }

      await delay(100)
    }

    return {
      translatedText: translatedSegments.join(""),
      errorMessage: hasTranslationError ? "翻译失败：部分内容无法翻译" : null,
    }
  } catch (error) {
    console.error("[v0] Error translating description:", error)
    return { translatedText: "", errorMessage: `翻译失败：${error instanceof Error ? error.message : "网络请求失败"}` }
  }
}

