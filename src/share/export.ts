import { toPng } from 'html-to-image'
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

export async function cardToBlob(node: HTMLElement): Promise<Blob> {
  const width = node.offsetWidth || Number(node.dataset.shareWidth)
  const height = node.offsetHeight || Number(node.dataset.shareHeight)
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    backgroundColor: '#163e48',
    width,
    height,
  })
  const response = await fetch(dataUrl)
  return response.blob()
}
