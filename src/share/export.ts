import { toPng } from 'html-to-image'
import { APP_URL } from '../config.ts'
import type { LoreResult } from '../types.ts'

export function buildCaption(epithet: string, appUrl = APP_URL): string {
  return `Apparently I'm ${epithet}. Discover your lore: ${appUrl}`
}

export function xIntent(caption: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`
}

export function linkedInIntent(url = APP_URL): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

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
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 1,
    backgroundColor: '#1a062e',
    width: node.offsetWidth,
    height: node.offsetHeight,
  })
  const response = await fetch(dataUrl)
  return response.blob()
}

export async function shareCard(blob: Blob, filename: string, caption: string): Promise<'shared' | 'downloaded' | 'aborted'> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: caption, title: 'Lore' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'aborted'
      throw error
    }
  }
  downloadBlob(blob, filename)
  return 'downloaded'
}
