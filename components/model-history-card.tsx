"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ModelHistoryItem } from "@/lib/llm/types"
import { Activity, Check, ChevronLeft, ChevronRight, Download, Eye, EyeOff, Trash2 } from "lucide-react"
import type React from "react"

type ProviderOption = { id: string; name: string }

type Props = {
  modelHistory: ModelHistoryItem[]
  paginatedModelHistory: ModelHistoryItem[]
  modelHistoryTotalPages: number
  modelHistoryPage: number
  setModelHistoryPage: React.Dispatch<React.SetStateAction<number>>
  providerOptions: ProviderOption[]
  visibleApiKeys: Set<string>
  toggleApiKeyVisibility: (itemId: string) => void
  runHistoryProbeTest: (item: ModelHistoryItem) => void
  applyHistoryItem: (item: ModelHistoryItem) => void
  deleteModelHistoryItem: (id: string) => void
  exportModelHistoryToCSV: () => void
  clearModelHistory: () => void
}

export function ModelHistoryCard({
  modelHistory,
  paginatedModelHistory,
  modelHistoryTotalPages,
  modelHistoryPage,
  setModelHistoryPage,
  providerOptions,
  visibleApiKeys,
  toggleApiKeyVisibility,
  runHistoryProbeTest,
  applyHistoryItem,
  deleteModelHistoryItem,
  exportModelHistoryToCSV,
  clearModelHistory,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>历史模型</CardTitle>
            <CardDescription>保存的模型配置和探针测试结果</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportModelHistoryToCSV} disabled={modelHistory.length === 0}>
              <Download className="mr-2 size-4" />
              导出CSV
            </Button>
            <Button variant="outline" size="sm" onClick={clearModelHistory} disabled={modelHistory.length === 0}>
              <Trash2 className="mr-2 size-4" />
              清空
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {modelHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无历史记录</div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">时间</TableHead>
                    <TableHead className="w-[120px]">提供商</TableHead>
                    <TableHead className="w-[200px]">模型名</TableHead>
                    <TableHead className="w-[150px]">API Key</TableHead>
                    <TableHead className="w-[150px]">状态</TableHead>
                    <TableHead className="w-[200px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedModelHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap align-top">
                        {new Date(item.timestamp).toLocaleString("zh-CN", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {providerOptions.find((p) => p.id === item.provider)?.name || item.provider}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{item.model}</TableCell>
                      <TableCell className="text-sm font-mono">
                        <div className="flex items-center gap-2">
                          <span className="flex-1">
                            {visibleApiKeys.has(item.id) ? item.apiKey : `${item.apiKey.substring(0, 10)}...`}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(item.id)}
                            className="h-6 w-6 p-0"
                            title={visibleApiKeys.has(item.id) ? "隐藏 API Key" : "显示 API Key"}
                          >
                            {visibleApiKeys.has(item.id) ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.status === "success" && (
                            <>
                              <div className="size-2 rounded-full bg-green-500" />
                              <span className="text-sm text-green-600">{item.duration}ms</span>
                            </>
                          )}
                          {item.status === "error" && (
                            <>
                              <div className="size-2 rounded-full bg-red-500" />
                              <span className="text-sm text-red-600">失败</span>
                            </>
                          )}
                          {item.status === "idle" && (
                            <>
                              <div className="size-2 rounded-full bg-gray-400" />
                              <span className="text-sm text-muted-foreground">未测试</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => runHistoryProbeTest(item)} title="探针测试">
                            <Activity className="size-4" />
                          </Button>
                          <Button variant="default" size="sm" onClick={() => applyHistoryItem(item)}>
                            <Check className="mr-1 size-3" />
                            应用
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteModelHistoryItem(item.id)}
                            title="删除"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {modelHistoryTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  共 {modelHistory.length} 条记录，第 {modelHistoryPage} / {modelHistoryTotalPages} 页
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModelHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={modelHistoryPage === 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <div className="text-sm font-medium">{modelHistoryPage}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setModelHistoryPage((p) => Math.min(modelHistoryTotalPages, p + 1))}
                    disabled={modelHistoryPage === modelHistoryTotalPages}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

