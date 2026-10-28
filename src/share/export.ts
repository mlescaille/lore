import type { LoreResult } from '../types.ts'

export function toContract(result: LoreResult): LoreResult {
  return {
    meta: {
      ...result.meta,
      exclusion: { ...result.meta.exclusion },
    },
    themes: result.themes.map(({ id, label, keywords, count }) => ({
      id,
      label,
      keywords: [...keywords],
      count,
    })),
    records: result.records.map(({ id, timestamp, timestampSource, themeId, text }) => ({
      id,
      timestamp,
      timestampSource,
      themeId,
      text,
    })),
    chapters: result.chapters.map(({ id, start, end, themeId, title, narrative, quoteIds }) => ({
      id,
      start,
      end,
      themeId,
      title,
      narrative,
      quoteIds: [...quoteIds],
    })),
    biography: {
      epithet: result.biography.epithet,
      closingLine: result.biography.closingLine,
      turningPoints: result.biography.turningPoints.map((point) => ({ ...point })),
      epilogue: result.biography.epilogue,
    },
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function downloadJson(result: LoreResult) {
  const blob = new Blob([JSON.stringify(toContract(result), null, 2)], { type: 'application/json' })
  downloadBlob(blob, 'lore-data.json')
}

/**
 * Rasterize the card SVG itself. The pixel title and the body face are embedded
 * in that SVG, so the saved PNG matches the preview.
 */
export async function cardToBlob(node: HTMLElement): Promise<Blob> {
  const svg = node.querySelector('svg')
  if (!svg) throw new Error('Card is not ready')
  const width = Number(svg.getAttribute('width')) || node.offsetWidth || Number(node.dataset.shareWidth)
  const height = Number(svg.getAttribute('height')) || node.offsetHeight || Number(node.dataset.shareHeight)
  const xml = new XMLSerializer().serializeToString(svg)
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const image = new Image()
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Could not draw the picture'))
    })
    image.src = url
    await loaded
    if (document.fonts?.ready) await document.fonts.ready
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not draw the picture')
    context.drawImage(image, 0, 0, width, height)
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Could not draw the picture'))), 'image/png')
    })
    return png
  } finally {
    URL.revokeObjectURL(url)
  }
}
