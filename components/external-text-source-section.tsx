"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronDown, ChevronUp, FileText, RotateCcw, Upload } from "lucide-react"

type Props = {
  label: string
  enabledId: string
  enabled: boolean
  setEnabled: (value: boolean) => void
  autoReloadId: string
  autoReload: boolean
  setAutoReload: (value: boolean) => void
  filePathInputId: string
  filePath: string
  onFilePathChange: (value: string) => void
  placeholder: string
  onPickLocalFile: () => void
  helpText: string
  loadedContent: string
  previewLabel: string
  isFromLocalFile: boolean
  canReloadLocalFile: boolean
  onReloadLocalFile: () => void
  previewExpanded: boolean
  setPreviewExpanded: (value: boolean) => void
}

export function ExternalTextSourceSection({
  label,
  enabledId,
  enabled,
  setEnabled,
  autoReloadId,
  autoReload,
  setAutoReload,
  filePathInputId,
  filePath,
  onFilePathChange,
  placeholder,
  onPickLocalFile,
  helpText,
  loadedContent,
  previewLabel,
  isFromLocalFile,
  canReloadLocalFile,
  onReloadLocalFile,
  previewExpanded,
  setPreviewExpanded,
}: Props) {
  return (
    <div className="space-y-1.5 pt-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={filePathInputId} className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={enabledId}
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
          />
          <Label htmlFor={enabledId} className="cursor-pointer font-normal text-sm">
            启用
          </Label>
          <input
            type="checkbox"
            id={autoReloadId}
            checked={autoReload}
            onChange={(e) => setAutoReload(e.target.checked)}
            disabled={!enabled}
            className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <Label htmlFor={autoReloadId} className="cursor-pointer font-normal text-sm">
            自动重载
          </Label>
        </div>
      </div>

      {enabled && (
        <>
          <div className="flex gap-2">
            <Input
              id={filePathInputId}
              value={filePath}
              onChange={(e) => onFilePathChange(e.target.value)}
              placeholder={placeholder}
              className="text-sm flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={onPickLocalFile} className="shrink-0">
              <Upload className="h-4 w-4 mr-1" />
              选择文件
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{helpText}</p>
        </>
      )}

      {enabled && loadedContent && (
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              {previewLabel}
              {isFromLocalFile && (
                <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">本地文件</span>
              )}
            </Label>
            <div className="flex items-center gap-1">
              {isFromLocalFile && canReloadLocalFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onReloadLocalFile}
                  title="重新加载文件"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewExpanded(!previewExpanded)}
              >
                {previewExpanded ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    展开
                  </>
                )}
              </Button>
            </div>
          </div>
          <Textarea
            value={loadedContent}
            readOnly
            className={`bg-muted/50 text-sm font-mono cursor-default overflow-y-auto transition-all duration-200 ${
              previewExpanded ? "h-60" : "h-20"
            }`}
          />
        </div>
      )}
    </div>
  )
}

