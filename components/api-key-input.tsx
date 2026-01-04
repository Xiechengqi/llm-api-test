"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff } from "lucide-react"

type Props = {
  apiKey: string
  setApiKey: (value: string) => void
  showApiKey: boolean
  setShowApiKey: (value: boolean) => void
}

export function ApiKeyInput({ apiKey, setApiKey, showApiKey, setShowApiKey }: Props) {
  return (
    <div className="relative flex items-center">
      <Input
        type={showApiKey ? "text" : "password"}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="API Key"
        className="w-[200px] pr-10"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowApiKey(!showApiKey)}
        className="absolute right-0 h-full px-3 hover:bg-transparent"
        title={showApiKey ? "隐藏 API Key" : "显示 API Key"}
      >
        {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  )
}

