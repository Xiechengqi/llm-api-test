"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ContentWithCodeBlocks } from "@/components/content-with-code-blocks"
import { extractImagesFromRequestContent, extractImagesFromResponseContent, formatRequestContentForDisplay } from "@/lib/llm/content"
import type { HistoryItem, MessageImage } from "@/lib/llm/types"
import { Download, RotateCcw, Trash2, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ZoomIn } from "lucide-react"

type Props = {
  history: HistoryItem[]
  paginatedHistory: HistoryItem[]
  showRawColumns: boolean
  setShowRawColumns: (value: boolean) => void
  pageSize: number
  setPageSize: (value: number) => void
  currentPage: number
  setCurrentPage: (value: number | ((prev: number) => number)) => void
  totalPages: number
  expandedCells: Set<string>
  toggleCellExpansion: (cellId: string) => void
  visibleRawCells: Set<string>
  toggleRawVisibility: (cellId: string) => void
  expandRequestContent: boolean
  setExpandRequestContent: (value: boolean) => void
  expandResponseContent: boolean
  setExpandResponseContent: (value: boolean) => void
  handleClearHistory: () => void
  exportHistoryToCSV: () => void
  handleDeleteHistoryItem: (id: string) => void
  onZoomImage: (image: MessageImage) => void
  responseImagesMap: Map<number, string[]>
}

export function HistoryChatCard({
  history,
  paginatedHistory,
  showRawColumns,
  setShowRawColumns,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
  expandedCells,
  toggleCellExpansion,
  visibleRawCells,
  toggleRawVisibility,
  expandRequestContent,
  setExpandRequestContent,
  expandResponseContent,
  setExpandResponseContent,
  handleClearHistory,
  exportHistoryToCSV,
  handleDeleteHistoryItem,
  onZoomImage,
  responseImagesMap,
}: Props) {
  const expandAllHistory = false

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>历史对话</CardTitle>
            <CardDescription>共 {history.length} 条记录</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showRawColumns}
                onChange={(e) => setShowRawColumns(e.target.checked)}
                className="size-4 cursor-pointer"
              />
              <span>显示 Raw</span>
            </label>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 条/页</SelectItem>
                <SelectItem value="10">10 条/页</SelectItem>
                <SelectItem value="50">50 条/页</SelectItem>
                <SelectItem value="100">100 条/页</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleClearHistory} disabled={history.length === 0}>
              <RotateCcw className="mr-2 size-4" />
              清空
            </Button>
            <Button variant="outline" size="sm" onClick={exportHistoryToCSV} disabled={history.length === 0}>
              <Download className="mr-2 size-4" />
              导出 CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无历史记录</div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">时间/用时</TableHead>
                      <TableHead className="w-[120px]">模型</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <span>请求 Content</span>
                          <label className="flex items-center gap-1 cursor-pointer" title="展开所有请求内容">
                            <input
                              type="checkbox"
                              checked={expandRequestContent}
                              onChange={(e) => setExpandRequestContent(e.target.checked)}
                              className="size-3 cursor-pointer"
                            />
                          </label>
                        </div>
                      </TableHead>
                      {showRawColumns && <TableHead className="w-[100px]">请求 Raw</TableHead>}
                      <TableHead>
                        <div className="flex items-center gap-2">
                          <span>响应 Content</span>
                          <label className="flex items-center gap-1 cursor-pointer" title="展开所有响应内容">
                            <input
                              type="checkbox"
                              checked={expandResponseContent}
                              onChange={(e) => setExpandResponseContent(e.target.checked)}
                              className="size-3 cursor-pointer"
                            />
                          </label>
                        </div>
                      </TableHead>
                      {showRawColumns && <TableHead className="w-[100px]">响应 Raw</TableHead>}
                      <TableHead className="px-4 py-3 text-center font-medium w-[80px]">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {paginatedHistory.map((item) => {
                      const requestContentId = `request-${item.timestamp}`
                      const responseContentId = `response-${item.timestamp}`

                      const responseImages = extractImagesFromResponseContent(
                        item.responseContent,
                        item.responseRaw,
                        responseImagesMap,
                        item.timestamp,
                      )

                      return (
                        <TableRow key={item.timestamp} className="hover:bg-muted/50">
                          <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap align-top">
                            <div className="flex flex-col gap-0.5">
                              <span>
                                {new Date(item.timestamp).toLocaleString("zh-CN", {
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </span>
                              <span className="font-mono text-[10px]">
                                {item.duration !== undefined && item.duration !== null ? (
                                  <>{item.duration}ms</>
                                ) : (
                                  <span className="text-muted-foreground/50">-</span>
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs align-top">
                            <span className="font-mono block truncate" title={item.model}>
                              {item.model}
                            </span>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="max-w-xl space-y-2">
                              {(() => {
                                const images = extractImagesFromRequestContent(item.requestContent)
                                if (images.length > 0) {
                                  return (
                                    <div className="grid grid-cols-3 gap-1 mb-2">
                                      {images.map((imgUrl, idx) => (
                                        <div key={idx} className="relative group rounded border overflow-hidden bg-muted">
                                          <img
                                            src={imgUrl || "/placeholder.svg"}
                                            alt={`Request image ${idx + 1}`}
                                            className="w-full h-16 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() =>
                                              onZoomImage({
                                                id: `history-${item.timestamp}-${idx}`,
                                                type: "url",
                                                base64: imgUrl,
                                              })
                                            }
                                          />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                              type="button"
                                              variant="secondary"
                                              size="sm"
                                              onClick={() =>
                                                onZoomImage({
                                                  id: `history-${item.timestamp}-${idx}`,
                                                  type: "url",
                                                  base64: imgUrl,
                                                })
                                              }
                                              title="放大查看"
                                            >
                                              <ZoomIn className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                }
                                return null
                              })()}
                              <pre
                                className={`text-xs whitespace-pre-wrap break-words ${
                                  !expandRequestContent && !expandedCells.has(requestContentId) ? "line-clamp-2" : ""
                                }`}
                              >
                                {formatRequestContentForDisplay(item.requestContent)}
                              </pre>
                              {!expandRequestContent && item.requestContent.length > 100 && (
                                <button
                                  onClick={() => toggleCellExpansion(requestContentId)}
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  {expandedCells.has(requestContentId) ? (
                                    <>
                                      <ChevronUp className="size-3" />
                                      收起
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="size-3" />
                                      展开
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </TableCell>
                          {showRawColumns && (
                            <TableCell className="px-4 py-3 align-top">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRawVisibility(`request-raw-${item.timestamp}`)}
                                className="h-7 text-xs"
                              >
                                {visibleRawCells.has(`request-raw-${item.timestamp}`) ? "隐藏" : "显示"}
                              </Button>
                              {visibleRawCells.has(`request-raw-${item.timestamp}`) && (
                                <div className="mt-2 space-y-1">
                                  <pre
                                    className={`text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words ${
                                      !expandAllHistory && !expandedCells.has(`request-raw-${item.timestamp}`) ? "line-clamp-2" : ""
                                    }`}
                                  >
                                    {item.requestRaw}
                                  </pre>
                                  {!expandAllHistory && item.requestRaw.length > 100 && (
                                    <button
                                      onClick={() => toggleCellExpansion(`request-raw-${item.timestamp}`)}
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      {expandedCells.has(`request-raw-${item.timestamp}`) ? (
                                        <>
                                          <ChevronUp className="size-3" />
                                          收起
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="size-3" />
                                          展开
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="align-top">
                            <div className="max-w-xl">
                              <div className="text-xs whitespace-pre-wrap break-words relative">
                                <ContentWithCodeBlocks
                                  content={item.responseContent}
                                  cellId={responseContentId}
                                  isExpanded={expandResponseContent || expandedCells.has(responseContentId)}
                                  images={responseImages}
                                  onZoomImage={onZoomImage}
                                />
                              </div>
                              {(() => {
                                const hasCodeBlock = item.responseContent.includes("```")
                                const codeBlockLines = hasCodeBlock
                                  ? (item.responseContent
                                      .split("```")
                                      .filter((_, i) => i % 2 === 1)[0]
                                      ?.split("\n")?.length ?? 0)
                                  : 0
                                const shouldShowToggle = item.responseContent.length > 100 || (hasCodeBlock && codeBlockLines > 3)
                                return (
                                  !expandResponseContent &&
                                  shouldShowToggle && (
                                    <button
                                      onClick={() => toggleCellExpansion(responseContentId)}
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      {expandedCells.has(responseContentId) ? (
                                        <>
                                          <ChevronUp className="size-3" />
                                          收起
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="size-3" />
                                          展开
                                        </>
                                      )}
                                    </button>
                                  )
                                )
                              })()}
                            </div>
                          </TableCell>
                          {showRawColumns && (
                            <TableCell className="px-4 py-3 align-top">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRawVisibility(`response-raw-${item.timestamp}`)}
                                className="h-7 text-xs"
                              >
                                {visibleRawCells.has(`response-raw-${item.timestamp}`) ? "隐藏" : "显示"}
                              </Button>
                              {visibleRawCells.has(`response-raw-${item.timestamp}`) && (
                                <div className="mt-2 space-y-1">
                                  <pre
                                    className={`text-xs bg-muted p-2 rounded whitespace-pre-wrap break-words ${
                                      !expandAllHistory && !expandedCells.has(`response-raw-${item.timestamp}`) ? "line-clamp-2" : ""
                                    }`}
                                  >
                                    {item.responseRaw}
                                  </pre>
                                  {!expandAllHistory && item.responseRaw.length > 100 && (
                                    <button
                                      onClick={() => toggleCellExpansion(`response-raw-${item.timestamp}`)}
                                      className="text-xs text-primary hover:underline flex items-center gap-1"
                                    >
                                      {expandedCells.has(`response-raw-${item.timestamp}`) ? (
                                        <>
                                          <ChevronUp className="size-3" />
                                          收起
                                        </>
                                      ) : (
                                        <>
                                          <ChevronDown className="size-3" />
                                          展开
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="px-4 py-3 text-center align-top">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHistoryItem(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
