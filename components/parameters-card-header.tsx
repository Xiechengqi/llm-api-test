"use client"

import { Button } from "@/components/ui/button"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp, Play, RotateCcw, StopCircle, X } from "lucide-react"

type Props = {
  isExpanded: boolean
  toggleExpanded: () => void
  handleResetParameters: () => void
  isTimerRunning: boolean
  stopTimer: () => void
  loading: boolean
  handleInterruptTest: () => void
  handleStartTest: () => void
}

export function ParametersCardHeader({
  isExpanded,
  toggleExpanded,
  handleResetParameters,
  isTimerRunning,
  stopTimer,
  loading,
  handleInterruptTest,
  handleStartTest,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleExpanded}>
          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </Button>
        <div>
          <CardTitle>参数配置</CardTitle>
          <CardDescription>调整 Chat Completion 参数</CardDescription>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleResetParameters}>
          <RotateCcw className="mr-2 size-4" />
          重置参数
        </Button>
        {isTimerRunning ? (
          <Button onClick={stopTimer} variant="destructive" size="sm">
            <StopCircle className="mr-2 size-4" />
            停止定时
          </Button>
        ) : loading ? (
          <Button onClick={handleInterruptTest} variant="destructive" size="sm">
            <X className="mr-2 size-4" />
            中断
          </Button>
        ) : (
          <Button onClick={handleStartTest} disabled={loading} size="sm">
            <Play className="mr-2 size-4" />
            开始测试
          </Button>
        )}
      </div>
    </div>
  )
}

