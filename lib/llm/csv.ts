import type { HistoryItem, ModelHistoryItem } from "./types"

export const escapeCsvField = (value: unknown) => {
  if (value === null || value === undefined) return '""'
  return `"${String(value).replace(/"/g, '""')}"`
}

export const buildHistoryCsv = (args: { history: HistoryItem[]; showRawColumns: boolean }) => {
  const headers = args.showRawColumns
    ? ["时间", "模型", "用时(ms)", "请求 Content", "请求 Raw", "响应 Content", "响应 Raw"]
    : ["时间", "模型", "用时(ms)", "请求 Content", "响应 Content"]

  const rows = args.history.map((item) => {
    const timestamp = new Date(item.timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    const duration = item.duration !== undefined && item.duration !== null ? item.duration : "-"

    const rowData = args.showRawColumns
      ? [
          escapeCsvField(timestamp),
          escapeCsvField(item.model),
          escapeCsvField(String(duration)),
          escapeCsvField(item.requestContent),
          escapeCsvField(item.requestRaw),
          escapeCsvField(item.responseContent),
          escapeCsvField(item.responseRaw),
        ]
      : [
          escapeCsvField(timestamp),
          escapeCsvField(item.model),
          escapeCsvField(String(duration)),
          escapeCsvField(item.requestContent),
          escapeCsvField(item.responseContent),
        ]

    return rowData.join(",")
  })

  return [headers.join(","), ...rows].join("\n")
}

export const buildModelHistoryCsv = (items: ModelHistoryItem[]) => {
  const headers = ["时间", "提供商", "模型名", "API Key", "状态", "响应延迟(ms)"]
  const rows = items.map((item) => [
    escapeCsvField(new Date(item.timestamp).toLocaleString("zh-CN")),
    escapeCsvField(item.provider),
    escapeCsvField(item.model),
    escapeCsvField(item.apiKey.substring(0, 10) + "..."),
    escapeCsvField(item.status === "success" ? "成功" : item.status === "error" ? "失败" : "未测试"),
    escapeCsvField(item.duration ? item.duration.toString() : "N/A"),
  ])

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}
