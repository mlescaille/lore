import silkscreen from '@fontsource/silkscreen/files/silkscreen-latin-700-normal.woff?inline'
import atkinson from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff?inline'
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

const BANDS = [
  { bg: TEAL, fg: PAPER, mark: MARIGOLD, markFg: INK },
  { bg: TOMATO, fg: PAPER, mark: MARIGOLD, markFg: INK },
  { bg: MARIGOLD, fg: INK, mark: TEAL, markFg: PAPER },
]

/** Story is the phone default. The share button uses whichever shape is selected. */
export function defaultShareSize(phone: boolean): CardSize {
  return phone ? 'story' : 'square'
}

export function cardPixels(size: CardSize): { width: number; height: number } {
  return size === 'story' ? { width: 1080, height: 1920 } : { width: 1080, height: 1080 }
}

/** Starting size for the portrait. Longer lines step down so they stay a few big lines. */
export function portraitFontSize(portrait: string, story: boolean): number {
  const length = portrait.length
  if (story) {
    if (length > 90) return 72
    if (length > 64) return 92
    if (length > 42) return 108
    return 124
  }
  if (length > 90) return 56
  if (length > 64) return 72
  if (length > 42) return 88
  return 104
}

/**
 * Share cards say "Dinner recipes", not the keyword mash "Dinner & Recipe".
 * The words still come only from the theme name.
 */
export function friendlyThemeName(label: string): string {
  const cleaned = label.replace(/\s+/g, ' ').trim()
  const [head, ...rest] = cleaned.split(/\s+·\s+/)
  const phrase = phraseFromAmpersand(head ?? cleaned)
  return rest.length ? `${phrase} · ${rest.join(' · ')}` : phrase
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
    themes: topThemes(result.themes).map((theme) => friendlyThemeName(theme.label)).filter(Boolean).slice(0, 3),
    guessLine: guessed && score && score.guessCount > 0 ? scoreSentence(score.matchedCount, score.guessCount) : null,
    footer: SHARE_FOOTER,
  }
}

/** Every string a viewer can read on the card. */
export function shareSurfaceText(model: ShareCardModel): string {
  return ['Lore', model.portrait, ...model.themes, model.guessLine ?? '', model.footer].filter(Boolean).join('\n')
}

export function shareCardSvg(model: ShareCardModel): string {
  const { width, height } = cardPixels(model.size)
  const story = model.size === 'story'
  const marginX = story ? 56 : 40
  const marginTop = story ? 128 : 40
  const marginBottom = story ? 168 : 40
  const bevel = story ? 18 : 14
  const titleH = story ? 118 : 96
  const footerH = story ? 132 : 112
  const windowW = width - marginX * 2
  const windowH = height - marginTop - marginBottom
  const x = marginX
  const y = marginTop
  const faceX = x + bevel
  const faceY = y + bevel
  const faceW = windowW - bevel * 2
  const faceH = windowH - bevel * 2
  const pad = story ? 48 : 40
  const textW = faceW - pad * 2
  const contentTop = faceY + titleH
  const footerTop = faceY + faceH - footerH
  const contentBottom = footerTop - (story ? 28 : 20)

  let portraitSize = portraitFontSize(model.portrait, story)
  let themeSize = story ? 64 : 52
  const portraitFloor = story ? 68 : 52
  const themeFloor = story ? 44 : 40
  const portraitMaxLines = story ? 4 : 3
  while (
    model.portrait &&
    portraitSize > portraitFloor &&
    wrapLines(model.portrait, portraitSize, textW).length > portraitMaxLines
  ) {
    portraitSize -= 2
  }

  let portraitLines: string[] = []
  let themeLines: string[][] = []
  const guessSize = story ? 40 : 32
  const badge = story ? 72 : 60
  const available = contentBottom - contentTop

  for (let attempt = 0; attempt < 8; attempt++) {
    portraitLines = model.portrait ? wrapLines(model.portrait, portraitSize, textW) : []
    themeLines = model.themes.map((theme) => wrapLines(theme, themeSize, textW - badge - 28))
    if (measure(portraitLines, portraitSize, themeLines, themeSize, badge, model.guessLine, guessSize, story) <= available) break
    if (portraitSize > portraitFloor) portraitSize -= 4
    if (themeSize > themeFloor) themeSize -= 2
  }

  const blockH = measure(portraitLines, portraitSize, themeLines, themeSize, badge, model.guessLine, guessSize, story)
  const extra = Math.max(0, available - blockH)
  const heroExtra = Math.min(story ? 240 : 140, Math.round(extra * (story ? 0.42 : 0.55)))
  const bandExtra = themeLines.length ? Math.min(story ? 56 : 36, Math.round((extra - heroExtra) / themeLines.length)) : 0
  const parts: string[] = []
  parts.push(embeddedFonts())
  parts.push(`<rect width="${width}" height="${height}" fill="${TEAL}"/>`)
  parts.push(`<rect x="${x + 18}" y="${y + 22}" width="${windowW}" height="${windowH}" fill="${SHADOW}"/>`)
  parts.push(`<rect x="${x}" y="${y}" width="${windowW}" height="${windowH}" fill="${DARK}"/>`)
  parts.push(`<rect x="${x}" y="${y}" width="${windowW - bevel}" height="${windowH - bevel}" fill="${LIGHT}"/>`)
  parts.push(`<rect x="${faceX}" y="${faceY}" width="${faceW}" height="${faceH}" fill="${PAPER}"/>`)
  parts.push(`<rect x="${faceX}" y="${faceY}" width="${faceW}" height="${titleH}" fill="${TOMATO}"/>`)

  const titleSize = story ? 46 : 36
  parts.push(
    `<text x="${faceX + 32}" y="${faceY + Math.round(titleH * 0.66)}" fill="${PAPER}" font-family="${PIXEL}" font-size="${titleSize}" font-weight="700">Lore</text>`,
  )
  drawControls(parts, faceX, faceY, faceW, titleH, story)

  let cursor = contentTop
  if (portraitLines.length) {
    const inner = portraitLines.length * lineHeight(portraitSize)
    const bandH = inner + (story ? 64 : 48) + heroExtra
    parts.push(`<rect x="${faceX}" y="${cursor}" width="${faceW}" height="${bandH}" fill="${MARIGOLD}"/>`)
    const textY = cursor + Math.round((bandH - inner) / 2)
    parts.push(textRun(portraitLines, faceX + pad, textY, portraitSize, INK, 700, 'start'))
    cursor += bandH
  }

  model.themes.forEach((theme, index) => {
    const lines = themeLines[index] ?? [theme]
    const textH = lines.length * lineHeight(themeSize)
    const bandH = Math.max(badge + 28, textH + (story ? 36 : 28)) + bandExtra
    const band = BANDS[index % BANDS.length]
    parts.push(`<rect x="${faceX}" y="${cursor}" width="${faceW}" height="${bandH}" fill="${band.bg}"/>`)
    const markY = cursor + Math.round((bandH - badge) / 2)
    const markX = faceX + (story ? 36 : 28)
    parts.push(`<rect x="${markX}" y="${markY}" width="${badge}" height="${badge}" fill="${band.mark}"/>`)
    parts.push(
      `<text x="${markX + badge / 2}" y="${markY + badge * 0.68}" fill="${band.markFg}" font-family="${SANS}" font-size="${Math.round(badge * 0.46)}" font-weight="700" text-anchor="middle">${index + 1}</text>`,
    )
    const labelY = cursor + Math.round((bandH - textH) / 2)
    parts.push(textRun(lines, markX + badge + 24, labelY, themeSize, band.fg, 700, 'start'))
    cursor += bandH
  })

  if (model.guessLine) {
    const lines = wrapLines(model.guessLine, guessSize, textW)
    const guessH = lines.length * lineHeight(guessSize)
    cursor += story ? 28 : 20
    parts.push(textRun(lines, faceX + pad, cursor, guessSize, TOMATO, 700, 'start'))
    cursor += guessH
  }

  parts.push(`<rect x="${faceX}" y="${footerTop}" width="${faceW}" height="${footerH}" fill="${TEAL}"/>`)
  parts.push(`<rect x="${faceX}" y="${footerTop}" width="${faceW}" height="10" fill="${MARIGOLD}"/>`)
  const footerSize = story ? 36 : 30
  const footerLines = wrapLines(model.footer, footerSize, textW)
  const footerBlock = footerLines.length * lineHeight(footerSize)
  const footerY = footerTop + 10 + Math.max(0, (footerH - 10 - footerBlock) / 2)
  parts.push(textRun(footerLines, faceX + faceW / 2, footerY, footerSize, PAPER, 700, 'middle'))

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img">${parts.join('')}</svg>`
}

function measure(
  portraitLines: string[],
  portraitSize: number,
  themeLines: string[][],
  themeSize: number,
  badge: number,
  guess: string | null,
  guessSize: number,
  story: boolean,
): number {
  const portraitH = portraitLines.length ? portraitLines.length * lineHeight(portraitSize) + (story ? 64 : 48) : 0
  const themesH = themeLines.reduce((sum, lines) => {
    const textH = lines.length * lineHeight(themeSize)
    return sum + Math.max(badge + 28, textH + (story ? 36 : 28))
  }, 0)
  const guessH = guess ? lineHeight(guessSize) + (story ? 28 : 20) : 0
  return portraitH + themesH + guessH
}

function drawControls(parts: string[], faceX: number, faceY: number, faceW: number, titleH: number, story: boolean) {
  const buttonW = story ? 52 : 42
  const buttonH = story ? 42 : 34
  const buttonY = faceY + Math.round((titleH - buttonH) / 2)
  const glyphs = ['_', '□', '×']
  glyphs.forEach((glyph, index) => {
    const buttonX = faceX + faceW - 22 - (glyphs.length - index) * (buttonW + 8)
    parts.push(`<rect x="${buttonX}" y="${buttonY}" width="${buttonW}" height="${buttonH}" fill="${DARK}"/>`)
    parts.push(`<rect x="${buttonX}" y="${buttonY}" width="${buttonW - 4}" height="${buttonH - 4}" fill="${LIGHT}"/>`)
    parts.push(`<rect x="${buttonX + 4}" y="${buttonY + 4}" width="${buttonW - 8}" height="${buttonH - 8}" fill="${PAPER}"/>`)
    parts.push(
      `<text x="${buttonX + buttonW / 2}" y="${buttonY + Math.round(buttonH * 0.72)}" fill="${INK}" font-family="${SANS}" font-size="${story ? 22 : 18}" font-weight="700" text-anchor="middle">${xml(glyph)}</text>`,
    )
  })
}

function embeddedFonts(): string {
  return `<defs><style><![CDATA[@font-face{font-family:'Silkscreen';font-weight:700;font-style:normal;src:url('${silkscreen}') format('woff');}@font-face{font-family:'Atkinson Hyperlegible';font-weight:700;font-style:normal;src:url('${atkinson}') format('woff');}]]></style></defs>`
}

const AND_WHEN_PLURAL = new Set(['miles', 'friends', 'notes', 'people'])

function phraseFromAmpersand(label: string): string {
  const parts = label.split(/\s+&\s+/)
  if (parts.length < 2) return label
  const left = parts[0] ?? ''
  const right = pluralWord(parts.slice(1).join(' '))
  if (AND_WHEN_PLURAL.has(left.toLowerCase()) || /s$/i.test(left)) return `${left} and ${right}`
  return `${left} ${right}`
}

function pluralWord(word: string): string {
  const lower = word.trim().toLowerCase()
  const irregular: Record<string, string> = {
    recipe: 'recipes',
    trip: 'trips',
    run: 'runs',
    chat: 'chats',
    person: 'people',
    family: 'family',
    story: 'stories',
    party: 'parties',
  }
  if (irregular[lower]) return irregular[lower]
  if (/(s|x|z|ch|sh)$/i.test(lower)) return lower.endsWith('s') ? lower : `${lower}es`
  if (/[^aeiou]y$/i.test(lower)) return `${lower.slice(0, -1)}ies`
  return `${lower}s`
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
    .map((line, index) => `<tspan x="${Math.round(x)}" dy="${index === 0 ? 0 : dy}">${xml(line)}</tspan>`)
    .join('')
  return `<text x="${Math.round(x)}" y="${Math.round(y + lead)}" fill="${fill}" font-family="${SANS}" font-size="${fontSize}" font-weight="${weight}" text-anchor="${anchor}">${tspans}</text>`
}

function xml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
