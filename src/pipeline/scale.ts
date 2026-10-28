/** Longest side used before a stage. CLIP's own input is 256. OCR stays readable near 1000px wide. */
export function fittedSize(width: number, height: number, maxWidth: number): { width: number; height: number } {
  const safeWidth = Math.max(1, width)
  const safeHeight = Math.max(1, height)
  if (safeWidth <= maxWidth) return { width: safeWidth, height: safeHeight }
  const scale = maxWidth / safeWidth
  return { width: maxWidth, height: Math.max(1, Math.round(safeHeight * scale)) }
}

export const OCR_MAX_WIDTH = 1000
export const CLIP_MAX_WIDTH = 256

/**
 * Shrink a picture on this device before OCR or CLIP.
 * createImageBitmap decodes, OffscreenCanvas paints the smaller copy.
 */
export async function scaleImage(blob: Blob, maxWidth: number): Promise<Blob> {
  if (typeof createImageBitmap !== 'function') return blob
  const bitmap = await createImageBitmap(blob)
  try {
    const next = fittedSize(bitmap.width, bitmap.height, maxWidth)
    if (next.width === bitmap.width && next.height === bitmap.height) return blob
    const canvas =
      typeof OffscreenCanvas === 'function'
        ? new OffscreenCanvas(next.width, next.height)
        : Object.assign(document.createElement('canvas'), next)
    const context = canvas.getContext('2d')
    if (!context) return blob
    context.drawImage(bitmap, 0, 0, next.width, next.height)
    if ('convertToBlob' in canvas) return await canvas.convertToBlob({ type: 'image/png' })
    const png = await new Promise<Blob | null>((resolve) => (canvas as HTMLCanvasElement).toBlob(resolve, 'image/png'))
    return png ?? blob
  } finally {
    bitmap.close()
  }
}
