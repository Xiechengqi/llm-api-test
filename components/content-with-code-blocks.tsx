"use client"

import { Button } from "@/components/ui/button"
import type { MessageImage } from "@/lib/llm/types"
import { ZoomIn } from "lucide-react"

type Props = {
  content: string
  cellId: string
  isExpanded: boolean
  images?: string[]
  onZoomImage: (image: MessageImage) => void
}

export function ContentWithCodeBlocks({ content, cellId, isExpanded, images, onZoomImage }: Props) {
  let processedContent = content

  try {
    const trimmed = content.trim()
    if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
      JSON.parse(trimmed)
      processedContent = "```json\n" + trimmed + "\n```"
    }
  } catch {
    // Not valid JSON, use original content
  }

  const parts = processedContent.split(/(```[\s\S]*?```)/g)

  return (
    <>
      {images && images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((imgUrl, idx) => (
            <div key={idx} className="relative group rounded border overflow-hidden bg-muted">
              <img
                src={imgUrl || "/placeholder.svg"}
                alt={`Generated image ${idx + 1}`}
                className="size-20 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() =>
                  onZoomImage({
                    id: `response-${cellId}-${idx}`,
                    type: "url",
                    base64: imgUrl,
                  })
                }
                title="点击查看大图"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onZoomImage({
                      id: `response-${cellId}-${idx}`,
                      type: "url",
                      base64: imgUrl,
                    })
                  }
                  title="放大查看"
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {parts.map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          const lines = part.split("\n")
          const language = lines[0].replace("```", "").trim()
          const codeLines = lines.slice(1, -1)
          const code = codeLines.join("\n")
          const lineCount = codeLines.length

          return (
            <div key={index} className="my-2 rounded-md bg-muted overflow-hidden border relative">
              {language && <div className="px-3 py-1 text-xs text-muted-foreground bg-muted/50 border-b">{language}</div>}
              <pre className={`p-3 overflow-x-auto text-xs ${!isExpanded && lineCount > 3 ? "max-h-24 overflow-y-hidden" : ""}`}>
                <code className="block">{code}</code>
              </pre>
              {!isExpanded && lineCount > 3 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-muted to-transparent pointer-events-none" />
              )}
            </div>
          )
        }

        return (
          <span key={index} className={`${!isExpanded && part.trim().length > 100 ? "line-clamp-2" : ""}`}>
            {part}
          </span>
        )
      })}
    </>
  )
}

