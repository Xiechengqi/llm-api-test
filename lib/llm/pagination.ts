export const getTotalPages = (totalItems: number, pageSize: number) => {
  if (pageSize <= 0) return 1
  return Math.max(1, Math.ceil(totalItems / pageSize))
}

export const slicePage = <T,>(items: T[], page: number, pageSize: number): T[] => {
  if (pageSize <= 0) return items
  const safePage = Math.max(1, page)
  const start = (safePage - 1) * pageSize
  return items.slice(start, start + pageSize)
}

