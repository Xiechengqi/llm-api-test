"use client"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CerebrasModel, ModelScopeModel, OpenRouterModel } from "@/lib/llm/types"
import { List, Pencil } from "lucide-react"

type Props = {
  provider: "openrouter" | "cerebras" | "modelscope"
  isCustomModel: boolean
  setIsCustomModel: (value: boolean) => void
  model: string
  setModel: (value: string) => void
  isLoadingModels: boolean
  selectedModelDisplayName: string
  modelSearchQuery: string
  setModelSearchQuery: (value: string) => void
  filteredOpenRouterModels: OpenRouterModel[]
  filteredCerebrasModels: CerebrasModel[]
  filteredModelScopeModels: ModelScopeModel[]
}

export function ModelPicker({
  provider,
  isCustomModel,
  setIsCustomModel,
  model,
  setModel,
  isLoadingModels,
  selectedModelDisplayName,
  modelSearchQuery,
  setModelSearchQuery,
  filteredOpenRouterModels,
  filteredCerebrasModels,
  filteredModelScopeModels,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {!isCustomModel ? (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                disabled={isLoadingModels}
                className="w-[280px] justify-between bg-transparent"
              >
                <span className="truncate">{selectedModelDisplayName || (isLoadingModels ? "加载中..." : "选择模型")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start">
              <Command>
                <CommandInput placeholder="搜索模型..." value={modelSearchQuery} onValueChange={setModelSearchQuery} />
                <CommandList>
                  <CommandEmpty>未找到模型</CommandEmpty>
                  <CommandGroup>
                    {provider === "openrouter"
                      ? filteredOpenRouterModels.map((m) => {
                          // 检查是否是免费模型（name 中包含 "(free)"）
                          const isFreeModel = m.name?.includes("(free)") || false
                          // 如果是免费模型，id 需要添加 :free 后缀
                          const modelIdToUse = isFreeModel ? `${m.id}:free` : m.id
                          // CommandItem 的 value 包含 id 和 name，以便 Command 组件也能搜索 name
                          const searchableValue = [m.id, m.name].filter(Boolean).join(" ")

                          return (
                            <CommandItem
                              key={m.id}
                              value={searchableValue}
                              onSelect={() => {
                                setModel(modelIdToUse)
                                // 不清空搜索词，保持搜索状态
                              }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium">{m.name || m.id}</span>
                                {m.context_length && <span className="text-xs text-muted-foreground">{m.context_length} tokens</span>}
                              </div>
                            </CommandItem>
                          )
                        })
                      : provider === "cerebras"
                        ? filteredCerebrasModels.map((m) => {
                            // CommandItem 的 value 包含 id 和 name，以便 Command 组件也能搜索 name
                            const searchableValue = [m.id, m.name].filter(Boolean).join(" ")

                            return (
                              <CommandItem
                                key={m.id}
                                value={searchableValue}
                                onSelect={() => {
                                  setModel(m.id)
                                  // 不清空搜索词，保持搜索状态
                                }}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">{m.name || m.id}</span>
                                  {m.context_length && (
                                    <span className="text-xs text-muted-foreground">{m.context_length} tokens</span>
                                  )}
                                </div>
                              </CommandItem>
                            )
                          })
                        : filteredModelScopeModels.map((m) => {
                            // CommandItem 的 value 包含 id 和 name，以便 Command 组件也能搜索 name
                            const searchableValue = [m.id, m.name].filter(Boolean).join(" ")

                            return (
                              <CommandItem
                                key={m.id}
                                value={searchableValue}
                                onSelect={() => {
                                  setModel(m.id)
                                  // 不清空搜索词，保持搜索状态
                                }}
                              >
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-medium">{m.name || m.id}</span>
                                  {m.context_length && (
                                    <span className="text-xs text-muted-foreground">{m.context_length} tokens</span>
                                  )}
                                  {m.task_types && (
                                    <span className="text-xs text-muted-foreground">
                                      {Array.isArray(m.task_types) ? m.task_types.join(", ") : m.task_types}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            )
                          })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="sm" onClick={() => setIsCustomModel(true)} title="自定义模型">
            <Pencil className="size-4" />
          </Button>
        </>
      ) : (
        <>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="输入自定义模型 ID"
            className="w-[280px]"
          />
          <Button variant="ghost" size="sm" onClick={() => setIsCustomModel(false)} title="返回下拉选择">
            <List className="size-4" />
          </Button>
        </>
      )}
    </div>
  )
}

