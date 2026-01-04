"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ProviderOption = {
  id: string
  name: string
  endpoint?: string
}

type Props = {
  provider: string
  onProviderChange: (providerId: string) => void
  providerOptions: ProviderOption[]
  selectedProviderName?: string
}

export function ProviderSelector({ provider, onProviderChange, providerOptions, selectedProviderName }: Props) {
  return (
    <Select value={provider} onValueChange={onProviderChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="提供商">{selectedProviderName || provider}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {providerOptions.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{p.name}</span>
              {p.endpoint && <span className="text-xs text-muted-foreground">{p.endpoint}</span>}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

