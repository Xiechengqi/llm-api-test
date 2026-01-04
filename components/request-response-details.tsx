"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy } from "lucide-react"

type Props = {
  requestData: string
  requestCopyText: string
  responseData: string
  responseCopyText: string
  responseDuration: number | null
  handleCopy: (text: string, type: "request" | "response") => void | Promise<void>
}

function removeEmptyLines(text: string): string {
  return text
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n")
}

export function RequestResponseDetails({
  requestData,
  requestCopyText,
  responseData,
  responseCopyText,
  responseDuration,
  handleCopy,
}: Props) {
  const responseDisplay = responseData ? removeEmptyLines(responseData) : ""

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card className="flex flex-col h-[600px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>请求详情</CardTitle>
              <CardDescription>完整的 cURL 命令（包含明文 API Key）</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => requestData && handleCopy(requestData, "request")}
              disabled={!requestData}
            >
              <Copy className="h-4 w-4 mr-1" />
              {requestCopyText}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto rounded-lg bg-muted p-4">
            <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
              {requestData || '点击"开始测试"查看 cURL 命令...'}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col h-[600px]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>响应详情</CardTitle>
              <CardDescription>API 返回的完整响应</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {responseDuration !== null && (
                <div className="text-xs text-muted-foreground font-mono">用时: {responseDuration}ms</div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (responseData) {
                    handleCopy(removeEmptyLines(responseData), "response")
                  }
                }}
                disabled={!responseData}
              >
                <Copy className="h-4 w-4 mr-1" />
                {responseCopyText}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto rounded-lg bg-muted p-4">
            <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap break-words">
              {responseData ? responseDisplay : "等待响应..."}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

