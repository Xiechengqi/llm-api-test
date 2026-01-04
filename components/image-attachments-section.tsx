"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { MessageImage } from "@/lib/llm/types"
import { ImageIcon, Link, Loader2, Upload, X, ZoomIn } from "lucide-react"

type Props = {
  showImageUrlInput: boolean
  setShowImageUrlInput: (value: boolean) => void
  imageUrl: string
  setImageUrl: (value: string) => void
  isAddingImageUrl: boolean
  handleAddImageUrl: () => void
  handleImageFileUpload: () => void
  autoReloadImages: boolean
  setAutoReloadImages: (value: boolean) => void
  messageImages: MessageImage[]
  setZoomedImage: (img: MessageImage) => void
  handleRemoveImage: (imageId: string) => void
}

export function ImageAttachmentsSection({
  showImageUrlInput,
  setShowImageUrlInput,
  imageUrl,
  setImageUrl,
  isAddingImageUrl,
  handleAddImageUrl,
  handleImageFileUpload,
  autoReloadImages,
  setAutoReloadImages,
  messageImages,
  setZoomedImage,
  handleRemoveImage,
}: Props) {
  return (
    <div className="space-y-2 pt-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-1.5">
          <ImageIcon className="h-3.5 w-3.5" />
          图片附件
        </Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImageUrlInput(!showImageUrlInput)}
          >
            <Link className="mr-1 h-3.5 w-3.5" />
            添加链接
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleImageFileUpload}>
            <Upload className="h-4 w-4 mr-1" />
            上传文件
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <input
              type="checkbox"
              id="autoReloadImages"
              checked={autoReloadImages}
              onChange={(e) => setAutoReloadImages(e.target.checked)}
              className="h-4 w-4 rounded border-input bg-background accent-primary cursor-pointer"
            />
            <Label htmlFor="autoReloadImages" className="cursor-pointer font-normal text-sm">
              自动重载
            </Label>
          </div>
        </div>
      </div>

      {showImageUrlInput && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="输入图片链接 (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddImageUrl()
                }
              }}
              disabled={isAddingImageUrl}
            />
            <Button onClick={handleAddImageUrl} size="sm" disabled={isAddingImageUrl}>
              {isAddingImageUrl ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </>
              ) : (
                "添加"
              )}
            </Button>
            <Button
              onClick={() => {
                setShowImageUrlInput(false)
                setImageUrl("")
              }}
              variant="ghost"
              size="sm"
              disabled={isAddingImageUrl}
            >
              取消
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">示例: https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images</p>
        </div>
      )}

      {/* Image previews grid */}
      {messageImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {messageImages.map((img) => (
            <div key={img.id} className="relative group rounded-md border overflow-hidden">
              <img
                src={img.base64 || img.url}
                alt={img.name || "Image"}
                className="w-full h-24 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => setZoomedImage(img)}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setZoomedImage(img)}
                  title="放大查看"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRemoveImage(img.id)}
                  title="删除图片"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

