export const downloadBlob = (args: { blob: Blob; filename: string }) => {
  const link = document.createElement("a")
  const url = URL.createObjectURL(args.blob)
  link.setAttribute("href", url)
  link.setAttribute("download", args.filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const downloadTextFile = (args: { text: string; filename: string; mimeType: string }) => {
  const blob = new Blob([args.text], { type: args.mimeType })
  downloadBlob({ blob, filename: args.filename })
}

