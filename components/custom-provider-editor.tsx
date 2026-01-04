"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil } from "lucide-react"

type ToggleProps = {
  visible: boolean
  isEditing: boolean
  onToggle: () => void
}

export function CustomProviderToggleButton({ visible, isEditing, onToggle }: ToggleProps) {
  if (!visible) return null

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-9 w-9 ${isEditing ? "bg-muted" : ""}`}
      onClick={onToggle}
      title={isEditing ? "隐藏自定义配置" : "编辑自定义提供商"}
    >
      <Pencil className="size-4" />
    </Button>
  )
}

type PanelProps = {
  shouldRenderFields: boolean
  customProviderName: string
  onCustomProviderNameChange: (value: string) => void
  baseURL: string
  onBaseURLChange: (value: string) => void
  apiPath: string
  onApiPathChange: (value: string) => void
  onSave: () => void
  onDelete: () => void
  canDelete: boolean
  errorMessage: string
  statusMessage: string
}

export function CustomProviderFieldsPanel({
  shouldRenderFields,
  customProviderName,
  onCustomProviderNameChange,
  baseURL,
  onBaseURLChange,
  apiPath,
  onApiPathChange,
  onSave,
  onDelete,
  canDelete,
  errorMessage,
  statusMessage,
}: PanelProps) {
  return (
    <>
      {shouldRenderFields && (
        <div className="border-t px-4 py-3 md:px-8">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                id="customProviderName"
                value={customProviderName}
                onChange={(e) => onCustomProviderNameChange(e.target.value)}
                placeholder="提供商名称"
                className="min-w-[140px] flex-1"
              />
              <Input
                id="baseURL"
                value={baseURL}
                onChange={(e) => onBaseURLChange(e.target.value)}
                placeholder="https://api.example.com"
                className="min-w-[180px] flex-1"
              />
              <Input
                id="apiPath"
                value={apiPath}
                onChange={(e) => onApiPathChange(e.target.value)}
                placeholder="/v1/chat/completions"
                className="min-w-[160px] flex-1"
              />
              <Button size="sm" onClick={onSave}>
                保存
              </Button>
              {canDelete && (
                <Button variant="destructive" size="sm" onClick={onDelete}>
                  删除
                </Button>
              )}
            </div>
            {errorMessage && <p className="text-xs text-destructive">{errorMessage}</p>}
          </div>
        </div>
      )}

      {!shouldRenderFields && statusMessage && (
        <div className="border-t px-4 py-2 text-xs text-emerald-600 md:px-8">{statusMessage}</div>
      )}
    </>
  )
}

