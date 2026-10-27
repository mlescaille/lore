import wordList from './data/words.txt?raw'
import { stem } from './text.ts'

const WORDS = new Set(wordList.split('\n').map((word) => word.trim()).filter((word) => word.length >= 3))

/** True when the token is an English word, not an OCR fragment. */
export function isDictionaryWord(word: string): boolean {
  const lower = word.toLowerCase()
  if (WORDS.has(lower)) return true
  const stemmed = stem(lower)
  return stemmed !== lower && WORDS.has(stemmed)
}
