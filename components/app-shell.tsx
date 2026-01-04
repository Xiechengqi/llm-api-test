"use client"

import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { ImageZoomDialog } from "@/components/image-zoom-dialog"
import type { MessageImage } from "@/lib/llm/types"

type Props = {
  navbar: React.ReactNode
  modelInfo?: React.ReactNode
  children: React.ReactNode
  zoomedImage: MessageImage | null
  setZoomedImage: (image: MessageImage | null) => void
}

export function AppShell({ navbar, modelInfo, children, zoomedImage, setZoomedImage }: Props) {
  return (
    <div className="min-h-screen bg-background">
      {navbar}
      {modelInfo}
      {children}
      <ImageZoomDialog image={zoomedImage} setImage={setZoomedImage} />
      <Toaster />
    </div>
  )
}

