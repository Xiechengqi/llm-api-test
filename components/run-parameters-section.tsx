"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

type Props = {
  timerEnabled: boolean
  setTimerEnabled: (value: boolean) => void
  timerInterval: number
  setTimerInterval: (value: number) => void
  isTimerRunning: boolean
  stopTimer: () => void

  maxTokens: number
  setMaxTokens: (value: number) => void
  maxTokensLimit: number
  setMaxTokensLimit: (value: number) => void

  temperature: number
  setTemperature: (value: number) => void
  topP: number
  setTopP: (value: number) => void
  frequencyPenalty: number
  setFrequencyPenalty: (value: number) => void
  presencePenalty: number
  setPresencePenalty: (value: number) => void

  error: string
}

export function RunParametersSection({
  timerEnabled,
  setTimerEnabled,
  timerInterval,
  setTimerInterval,
  isTimerRunning,
  stopTimer,
  maxTokens,
  setMaxTokens,
  maxTokensLimit,
  setMaxTokensLimit,
  temperature,
  setTemperature,
  topP,
  setTopP,
  frequencyPenalty,
  setFrequencyPenalty,
  presencePenalty,
  setPresencePenalty,
  error,
}: Props) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>定时配置</Label>
            <p className="text-xs text-muted-foreground">设置自动定时执行测试</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="timerEnabled"
              checked={timerEnabled}
              onChange={(e) => {
                setTimerEnabled(e.target.checked)
                if (!e.target.checked && isTimerRunning) {
                  stopTimer()
                }
              }}
              className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
            />
            <Label htmlFor="timerEnabled" className="cursor-pointer font-normal">
              启用定时执行
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="timerInterval" className="text-sm text-muted-foreground whitespace-nowrap">
              间隔时间
            </Label>
            <Input
              id="timerInterval"
              type="number"
              value={timerInterval}
              onChange={(e) => setTimerInterval(Math.max(1, Number(e.target.value)))}
              className="w-20 h-8"
              min={1}
              disabled={!timerEnabled}
            />
            <span className="text-sm text-muted-foreground">秒</span>
          </div>
          {isTimerRunning && (
            <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded">
              定时运行中 (每 {timerInterval} 秒)
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <p className="text-xs text-muted-foreground">最大生成令牌数量（范围: 1 - {maxTokensLimit}）</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{maxTokens}</span>
            <span className="text-sm font-medium">/</span>
            <Input
              type="number"
              value={maxTokensLimit}
              onChange={(e) => {
                const newLimit = Math.max(1, Number(e.target.value))
                setMaxTokensLimit(newLimit)
                if (maxTokens > newLimit) {
                  setMaxTokens(newLimit)
                }
              }}
              className="w-20 h-8 text-xs"
              min={1}
            />
          </div>
        </div>
        <Slider id="maxTokens" min={1} max={maxTokensLimit} step={1} value={[maxTokens]} onValueChange={(v) => setMaxTokens(v[0])} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="temperature">Temperature</Label>
            <p className="text-xs text-muted-foreground">控制输出随机性，值越高越随机（范围: 0.0 - 2.0）</p>
          </div>
          <span className="text-sm font-medium">{temperature?.toFixed(2) ?? "1.00"}</span>
        </div>
        <Slider id="temperature" min={0} max={2} step={0.01} value={[temperature]} onValueChange={(v) => setTemperature(v[0])} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="topP">Top P</Label>
            <p className="text-xs text-muted-foreground">核采样，控制输出多样性（范围: 0.0 - 1.0）</p>
          </div>
          <span className="text-sm font-medium">{topP?.toFixed(2) ?? "1.00"}</span>
        </div>
        <Slider id="topP" min={0} max={1} step={0.01} value={[topP]} onValueChange={(v) => setTopP(v[0])} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
            <p className="text-xs text-muted-foreground">降低重复词频率，值越大惩罚越强（范围: -2.0 - 2.0）</p>
          </div>
          <span className="text-sm font-medium">{frequencyPenalty?.toFixed(2) ?? "0.00"}</span>
        </div>
        <Slider
          id="frequencyPenalty"
          min={-2}
          max={2}
          step={0.01}
          value={[frequencyPenalty]}
          onValueChange={(v) => setFrequencyPenalty(v[0])}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="presencePenalty">Presence Penalty</Label>
            <p className="text-xs text-muted-foreground">鼓励谈论新话题，值越大越倾向新内容（范围: -2.0 - 2.0）</p>
          </div>
          <span className="text-sm font-medium">{presencePenalty?.toFixed(2) ?? "0.00"}</span>
        </div>
        <Slider
          id="presencePenalty"
          min={-2}
          max={2}
          step={0.01}
          value={[presencePenalty]}
          onValueChange={(v) => setPresencePenalty(v[0])}
        />
      </div>

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
    </>
  )
}

