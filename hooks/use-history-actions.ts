"use client"

import { useCallback } from "react"
import { clearAllData, deleteResponseImagesFromDB } from "@/lib/indexed-db"
import type { HistoryItem } from "@/lib/llm/types"

type ToastFn = (options: {
  title: string
  description?: string
  duration?: number
  variant?: "default" | "destructive"
  className?: string
}) => void

type Props = {
  history: HistoryItem[]
  setHistory: (items: HistoryItem[]) => void
  setResponseImagesMap: (updater: (prev: Map<number, string[]>) => Map<number, string[]>) => void
  setCurrentPage: (page: number) => void
  toast: ToastFn
}

export function useHistoryActions({
  history,
  setHistory,
  setResponseImagesMap,
  setCurrentPage,
  toast,
}: Props) {
  const deleteHistoryItem = useCallback(
    (id: string) => {
      const itemToDelete = history.find((item) => item.id === id)
      const updated = history.filter((item) => item.id !== id)
      setHistory(updated)

      if (itemToDelete) {
        deleteResponseImagesFromDB(itemToDelete.timestamp).catch((error) => {
          console.error("[v0] Failed to delete response images:", error)
        })
        setResponseImagesMap((prev) => {
          const next = new Map(prev)
          next.delete(itemToDelete.timestamp)
          return next
        })
      }

      toast({
        title: "记录已删除",
        description: "历史记录项已被删除",
      })
    },
    [history, setHistory, setResponseImagesMap, toast],
  )

  const clearHistory = useCallback(() => {
    clearAllData()
      .then(() => {
        setHistory([])
        setResponseImagesMap(() => new Map())
        setCurrentPage(1)
        toast({
          title: "历史记录已清空",
          description: "所有历史测试数据已被删除",
        })
      })
      .catch((error) => {
        console.error("[v0] Failed to clear all data:", error)
        toast({
          variant: "destructive",
          title: "错误",
          description: "清空历史记录失败",
        })
      })
  }, [setCurrentPage, setHistory, setResponseImagesMap, toast])

  return { clearHistory, deleteHistoryItem }
}

