"use client"

import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

type ProbeStatus = "idle" | "success" | "error"

type Props = {
  status: ProbeStatus
  duration: number | null
  isTesting: boolean
  canTest: boolean
  onTest: () => void
}

export function ProbeStatusIndicator({ status, duration, isTesting, canTest, onTest }: Props) {
  if (status === "idle") return null

  return (
    <div className="ml-2 flex items-center gap-1.5">
      <div
        className={`size-2 rounded-full ${status === "success" ? "bg-green-500" : "bg-red-500"}`}
        title={status === "success" ? "API 配置正常" : "API 配置异常"}
      />
      {status === "success" && duration ? <span className="text-xs text-muted-foreground">{duration}ms</span> : null}
      <Button
        variant="ghost"
        size="sm"
        onClick={onTest}
        disabled={isTesting || !canTest}
        className="h-6 px-2"
        title="重新测试"
      >
        {isTesting ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
      </Button>
    </div>
  )
}

