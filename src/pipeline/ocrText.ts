import { isDictionaryWord } from './dictionary.ts'
import { isStopWord } from './text.ts'

export interface OcrToken {
  text: string
  confidence: number
}

const CONFIDENCE = 60
const SHORT_CONFIDENCE = 85

export function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
}

/** Digits, counts, and letter-suffix junk such as "150k" or "20a". */
export function isNumberish(raw: string): boolean {
  const token = normalizeToken(raw)
  if (!token) return true
  return /\d/.test(token)
}

function minConfidence(word: string): number {
  return word.length <= 4 ? SHORT_CONFIDENCE : CONFIDENCE
}

/**
 * Keep a word only when OCR was confident and the token is a real word.
 * Fragments, pure numbers, and tokens like "150k" never pass.
 */
export function acceptOcrToken(token: OcrToken): string | null {
  const word = normalizeToken(token.text)
  if (!/^[a-z]{3,}$/.test(word)) return null
  if (isNumberish(word)) return null
  const confidence = Number(token.confidence)
  if (!Number.isFinite(confidence) || confidence < minConfidence(word)) return null
  if (isStopWord(word) || !isDictionaryWord(word)) return null
  return word
}

export function cleanOcrWords(words: OcrToken[]): string {
  const kept: string[] = []
  for (const word of words) {
    const accepted = acceptOcrToken(word)
    if (accepted) kept.push(accepted)
  }
  return kept.join(' ')
}

/** Dictionary-filter a raw page when the reader did not return word boxes. */
export function cleanOcrString(raw: string): string {
  const parts = raw.split(/[^A-Za-z0-9']+/).filter(Boolean)
  return cleanOcrWords(parts.map((text) => ({ text, confidence: 100 })))
}

/**
 * Word boxes win. A raw page is only a fallback when the reader returned
 * no boxes and the page itself was a confident read. Photos full of
 * fragments often have no boxes and a low page score; trusting that raw
 * text would keep dictionary-shaped noise.
 */
export function chooseCleanText(tokens: OcrToken[], raw: string, pageConfidence = 100): string {
  if (tokens.length > 0) return cleanOcrWords(tokens)
  if (!Number.isFinite(pageConfidence) || pageConfidence < 70) return ''
  return cleanOcrString(raw)
}
