import { SHARE_URL } from '../config.ts'
import { scoreSentence, topThemes } from '../pipeline/scoring.ts'
import type { ScoreResult } from '../pipeline/scoring.ts'
export type CardSize = 'square' | 'story'

/** Public share card. Themes, the portrait, and an optional guess line. Never screenshot text. */
export interface ShareCardModel {
  size: CardSize
  portrait: string
  themes: string[]
  guessLine: string | null
  footer: string
}

export const SHARE_FOOTER = `Discover your lore at ${SHARE_URL.replace(/^https?:\/\//, '')}`

const TEAL = '#163e48'
const TOMATO = '#a33b24'
const MARIGOLD = '#f0b429'
const PAPER = '#fffdf8'
const INK = '#14262c'
const LIGHT = '#f4efe4'
const DARK = '#0b242b'
const SHADOW = '#07161b'

const SANS = 'Atkinson Hyperlegible, DejaVu Sans, sans-serif'
const PIXEL = 'Silkscreen, Atkinson Hyperlegible, DejaVu Sans, sans-serif'

export function cardPixels(size: CardSize): { width: number; height: number } {
  return size === 'story' ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 }
}

/** Starting size for the portrait. Longer lines step down so they stay a few big lines. */
export function portraitFontSize(portrait: string, story: boolean): number {
  const length = portrait.length
  if (story) {
    if (length > 90) return 64
    if (length > 64) return 80
    if (length > 42) return 96
    return 112
  }
  if (length > 90) return 48
  if (length > 64) return 60
  if (length > 42) return 72
  return 88
}

export function shareCardFromResult(
  result: {
    biography: { epithet: string }
    themes: { id: string; count: number; label: string }[]
  },
  score: Pick<ScoreResult, 'matchedCount' | 'guessCount'> | null,
  guessed: boolean,
  size: CardSize,
): ShareCardModel {
  return {
    size,
    portrait: clean(result.biography.epithet),
    themes: topThemes(result.themes).map((theme) => clean(theme.label)).filter(Boolean).slice(0, 3),
    guessLine: guessed && score && score.guessCount > 0 ? scoreSentence(score.matchedCount, score.guessCount) : null,
    footer: SHARE_FOOTER,
  }
}

/** Every string a viewer can read on the card. */
export function shareSurfaceText(model: ShareCardModel): string {
  return [model.portrait, ...model.themes, model.guessLine ?? '', model.footer].filter(Boolean).join('\n')
}

export function shareCardSvg(model: ShareCardModel): string {
  const { width, height } = cardPixels(model.size)
  const story = model.size === 'story'
  const marginX = story ? 64 : 48
  const marginTop = story ? 150 : 48
  const marginBottom = story ? 210 : 48
  const bevel = story ? 16 : 14
  const titleH = story ? 108 : 88
  const footerH = story ? 118 : 96
  const pad = story ? 44 : 36
  const windowW = width - marginX * 2
  const windowH = height - marginTop - marginBottom
  const x = marginX
  const y = marginTop
  const faceX = x + bevel
  const faceY = y + bevel
  const faceW = windowW - bevel * 2
  const faceH = windowH - bevel * 2
  const contentX = faceX + pad
  const contentW = faceW - pad * 2
  const contentTop = faceY + titleH + (story ? 36 : 28)
  const footerTop = faceY + faceH - footerH
  const contentBottom = footerTop - 12

  let portraitSize = portraitFontSize(model.portrait, story)
  let themeSize = story ? 84 : 64
  const minPortrait = story ? 52 : 44
  const minTheme = story ? 48 : 40
  const textW = contentW - 36
  const portraitMaxLines = story ? 4 : 3
  const portraitFloor = story ? 72 : 60
  while (
    model.portrait &&
    portraitSize > portraitFloor &&
    wrapLines(model.portrait, portraitSize, textW).length > portraitMaxLines
  ) {
    portraitSize -= 2
  }
  let portraitLines: string[] = []
  let themeLines: string[][] = []
  let blockH = 0
  const guessSize = story ? 42 : 34
  let badge = story ? 72 : 60
  const rowGap = story ? 28 : 20
  const available = contentBottom - contentTop

  for (let attempt = 0; attempt < 8; attempt++) {
    badge = Math.max(story ? 64 : 52, Math.min(themeSize, story ? 88 : 68))
    portraitLines = model.portrait ? wrapLines(model.portrait, portraitSize, textW) : []
    themeLines = model.themes.map((theme) => wrapLines(theme, themeSize, textW - badge - 24))
    const portraitH = portraitLines.length * lineHeight(portraitSize)
    const themesH = themeLines.reduce((sum, lines) => sum + Math.max(badge, lines.length * lineHeight(themeSize)) + rowGap, 0)
    const guessH = model.guessLine ? lineHeight(guessSize) + 12 : 0
    blockH = portraitH + (portraitLines.length ? 28 : 0) + themesH + guessH
    if (blockH <= available) break
    if (portraitSize > minPortrait) portraitSize -= 4
    if (themeSize > minTheme) themeSize -= 4
  }

  const extra = Math.max(0, available - blockH)
  let cursor = contentTop + Math.min(story ? extra * 0.42 : extra * 0.18, story ? 220 : 36)
  const parts: string[] = []

  parts.push(`<rect width="${width}" height="${height}" fill="${TEAL}"/>`)
  parts.push(`<rect x="${x + 18}" y="${y + 20}" width="${windowW}" height="${windowH}" fill="${SHADOW}"/>`)
  parts.push(`<rect x="${x}" y="${y}" width="${windowW}" height="${windowH}" fill="${DARK}"/>`)
  parts.push(`<rect x="${x}" y="${y}" width="${windowW - bevel}" height="${windowH - bevel}" fill="${LIGHT}"/>`)
  parts.push(`<rect x="${faceX}" y="${faceY}" width="${faceW}" height="${faceH}" fill="${PAPER}"/>`)
  parts.push(`<rect x="${faceX}" y="${faceY}" width="${faceW}" height="${titleH}" fill="${TOMATO}"/>`)

  const titleSize = story ? 42 : 34
  const titleBaseline = faceY + Math.round(titleH * 0.64)
  parts.push(
    `<text x="${faceX + 28}" y="${titleBaseline}" fill="${PAPER}" font-family="${PIXEL}" font-size="${titleSize}" font-weight="700">Lore</text>`,
  )

  const buttonW = story ? 48 : 40
  const buttonH = story ? 40 : 34
  const buttonY = faceY + Math.round((titleH - buttonH) / 2)
  const glyphs = ['_', '□', '×']
  glyphs.forEach((glyph, index) => {
    const buttonX = faceX + faceW - 20 - (glyphs.length - index) * (buttonW + 8)
    parts.push(`<rect x="${buttonX}" y="${buttonY}" width="${buttonW}" height="${buttonH}" fill="${DARK}"/>`)
    parts.push(`<rect x="${buttonX}" y="${buttonY}" width="${buttonW - 4}" height="${buttonH - 4}" fill="${LIGHT}"/>`)
    parts.push(`<rect x="${buttonX + 4}" y="${buttonY + 4}" width="${buttonW - 8}" height="${buttonH - 8}" fill="${PAPER}"/>`)
    parts.push(
      `<text x="${buttonX + buttonW / 2}" y="${buttonY + buttonH * 0.7}" fill="${INK}" font-family="${SANS}" font-size="${story ? 22 : 18}" font-weight="700" text-anchor="middle">${xml(glyph)}</text>`,
    )
  })

  if (portraitLines.length) {
    parts.push(textRun(portraitLines, contentX, cursor, portraitSize, INK, 700, 'start'))
    cursor += portraitLines.length * lineHeight(portraitSize) + (story ? 36 : 26)
    parts.push(`<rect x="${contentX}" y="${cursor}" width="${story ? 168 : 128}" height="${story ? 12 : 10}" fill="${MARIGOLD}"/>`)
    cursor += story ? 40 : 28
  }

  model.themes.forEach((theme, index) => {
    const lines = themeLines[index] ?? [theme]
    const textH = lines.length * lineHeight(themeSize)
    const rowH = Math.max(badge, textH)
    const badgeY = cursor + Math.max(0, (lineHeight(themeSize) - badge) / 2)
    parts.push(`<rect x="${contentX}" y="${badgeY}" width="${badge}" height="${badge}" fill="${INK}"/>`)
    parts.push(`<rect x="${contentX + 4}" y="${badgeY + 4}" width="${badge - 8}" height="${badge - 8}" fill="${MARIGOLD}"/>`)
    parts.push(
      `<text x="${contentX + badge / 2}" y="${badgeY + badge * 0.68}" fill="${INK}" font-family="${SANS}" font-size="${Math.round(badge * 0.46)}" font-weight="700" text-anchor="middle">${index + 1}</text>`,
    )
    const labelY = cursor + Math.max(0, (rowH - lines.length * lineHeight(themeSize)) / 2)
    parts.push(textRun(lines, contentX + badge + 24, labelY, themeSize, INK, 700, 'start'))
    cursor += rowH + rowGap
  })

  if (model.guessLine) {
    cursor += story ? 8 : 4
    const lines = wrapLines(model.guessLine, guessSize, textW)
    parts.push(textRun(lines, contentX, cursor, guessSize, TOMATO, 700, 'start'))
  }

  parts.push(`<rect x="${faceX + pad}" y="${footerTop}" width="${contentW}" height="8" fill="${MARIGOLD}"/>`)
  const footerSize = story ? 36 : 30
  const footerLines = wrapLines(model.footer, footerSize, textW)
  const footerBlockH = footerLines.length * lineHeight(footerSize)
  const footerY = footerTop + 8 + Math.max(0, (footerH - 8 - footerBlockH) / 2)
  parts.push(textRun(footerLines, faceX + faceW / 2, footerY, footerSize, TEAL, 700, 'middle'))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${parts.join('')}</svg>`
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function lineHeight(fontSize: number): number {
  return Math.round(fontSize * 1.18)
}

export function wrapLines(text: string, fontSize: number, maxWidth: number): string[] {
  const maxChars = Math.max(6, Math.floor(maxWidth / (fontSize * 0.76)))
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const pieces = word.length > maxChars ? splitWord(word, maxChars) : [word]
    for (const piece of pieces) {
      const next = line ? `${line} ${piece}` : piece
      if (line && next.length > maxChars) {
        lines.push(line)
        line = piece
      } else {
        line = next
      }
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

function splitWord(word: string, maxChars: number): string[] {
  const parts: string[] = []
  for (let index = 0; index < word.length; index += maxChars) parts.push(word.slice(index, index + maxChars))
  return parts
}

function textRun(
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  weight: number,
  anchor: 'start' | 'middle',
): string {
  const lead = Math.round(fontSize * 0.86)
  const dy = lineHeight(fontSize)
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : dy}">${xml(line)}</tspan>`)
    .join('')
  return `<text x="${x}" y="${y + lead}" fill="${fill}" font-family="${SANS}" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}">${tspans}</text>`
}

function xml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
