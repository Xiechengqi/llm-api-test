"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { copyTextToClipboard } from "@/lib/llm/clipboard"
import { buildShareUrl } from "@/lib/llm/share-url"
import { useToast } from "@/hooks/use-toast"

type Props = {
  baseURL: string
  apiPath: string
  apiKey: string
  model: string
}

export function ShareLinkDialog({ baseURL, apiPath, apiKey, model }: Props) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const [copied, setCopied] = useState(false)

  const openDialog = () => {
    const pageUrl = typeof window === "undefined" ? "http://localhost/" : window.location.href
    setShareUrl(buildShareUrl({ pageUrl, baseURL, apiPath, apiKey, model }))
    setCopied(false)
    setOpen(true)
  }

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(shareUrl)
    if (!ok) {
      toast({
        title: "复制失败",
        description: "无法访问剪贴板，请手动复制",
        variant: "destructive",
      })
      return
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <Share2 className="mr-2 size-4" />
        分享
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>分享配置</DialogTitle>
            <DialogDescription>
              链接包含 API Key。对方打开后会填进导航栏，也会进入浏览器历史。
            </DialogDescription>
          </DialogHeader>
          <Textarea readOnly value={shareUrl} className="min-h-24 font-mono text-xs" onFocus={(event) => event.currentTarget.select()} />
          <DialogFooter>
            <Button type="button" onClick={handleCopy}>
              {copied ? "已复制" : "复制"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
