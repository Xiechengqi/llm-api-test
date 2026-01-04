"use client"

import { Download, Heart, Link } from "lucide-react"
import type { CerebrasModel, ModelScopeModel, OpenRouterModel } from "@/lib/llm/types"

type Props = {
  provider: "openrouter" | "cerebras" | "modelscope"
  selectedModelInfo: OpenRouterModel | CerebrasModel | ModelScopeModel
  isTranslating: boolean
  translatedDescription: string
  translationError: string
}

export function SelectedModelInfoPanel({
  provider,
  selectedModelInfo,
  isTranslating,
  translatedDescription,
  translationError,
}: Props) {
  return (
    <div className="border-b bg-muted/30 px-4 py-3 md:px-8">
      <div className="max-w-7xl mx-auto space-y-2">
        {selectedModelInfo.description && (
          <div className="space-y-2">
            {isTranslating ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedModelInfo.description}
                <span className="ml-2 text-xs opacity-60">翻译中...</span>
              </p>
            ) : translatedDescription ? (
              <>
                <p className="text-sm text-muted-foreground leading-relaxed">{translatedDescription}</p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">查看原文</summary>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{selectedModelInfo.description}</p>
                </details>
              </>
            ) : translationError ? (
              <div className="space-y-1">
                <p className="text-sm text-destructive leading-relaxed">{translationError}</p>
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">查看原文</summary>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{selectedModelInfo.description}</p>
                </details>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedModelInfo.description}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {selectedModelInfo.link &&
            (() => {
              const isFreeModel = selectedModelInfo.name?.includes("(free)") || false
              const linkToUse = isFreeModel ? `${selectedModelInfo.link}:free` : selectedModelInfo.link
              return (
                <a
                  href={linkToUse}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Link className="size-3" />
                  查看模型详情
                </a>
              )
            })()}

          {"pub_date" in selectedModelInfo && selectedModelInfo.pub_date && (
            <span className="flex items-center gap-1">
              <span>发布日期: {selectedModelInfo.pub_date}</span>
            </span>
          )}

          {provider === "modelscope" &&
            (() => {
              const modelScopeInfo = selectedModelInfo as ModelScopeModel
              return (
                <>
                  {modelScopeInfo.time && (
                    <span className="flex items-center gap-1">
                      <span>{modelScopeInfo.time}</span>
                    </span>
                  )}
                  {modelScopeInfo.task_types && (
                    <span className="flex items-center gap-1">
                      <span>
                        {Array.isArray(modelScopeInfo.task_types)
                          ? modelScopeInfo.task_types.join(", ")
                          : modelScopeInfo.task_types}
                      </span>
                    </span>
                  )}
                  {modelScopeInfo.downloads !== undefined && (
                    <span className="flex items-center gap-1">
                      <Download className="size-3" />
                      <span>{modelScopeInfo.downloads.toLocaleString()}</span>
                    </span>
                  )}
                  {modelScopeInfo.stars !== undefined && (
                    <span className="flex items-center gap-1">
                      <Heart className="size-3 fill-current" />
                      <span>{modelScopeInfo.stars.toLocaleString()}</span>
                    </span>
                  )}
                </>
              )
            })()}
        </div>
      </div>
    </div>
  )
}

