"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { MessageImage } from "@/lib/llm/types"

type Props = {
  image: MessageImage | null
  setImage: (image: MessageImage | null) => void
}

export function ImageZoomDialog({ image, setImage }: Props) {
  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && setImage(null)}>
      <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
        {image && (
          <div className="relative w-full flex flex-col">
            <div className="flex-1 flex items-center justify-center bg-black/90 p-4">
              <img
                src={image.base64 || image.url}
                alt={image.name || "Zoomed Image"}
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
            <div className="bg-background border-t p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{image.name || "未命名图片"}</p>
                {image.type === "url" && image.url && <p className="text-xs text-muted-foreground truncate">{image.url}</p>}
                {image.type === "file" && <p className="text-xs text-muted-foreground">本地上传图片</p>}
              </div>
              <Button variant="outline" size="sm" onClick={() => setImage(null)}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

