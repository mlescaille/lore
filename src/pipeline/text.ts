const STOP = new Set(
  `a an the and or but if in on for of to with from at by as is are was were be been being it this that these those i you we they he she my your our their me him them not no so just than then too very can will would should into over after before about up down out what when where who how do did does done have has had im its youre dont cant wont yes ok hey hi hello please thanks thank again really also only own get got like one two three four five six seven eight nine ten eleven twelve pm am screenshot screenshots img image photo picture jpg jpeg png http https www com notes note today yesterday tomorrow week weeks day days time times tablespoon tablespoons teaspoon teaspoons tbsp tsp cup cups minute minutes hour hours ounce ounces pound pounds gram grams preheat salt pepper`.split(
    /\s+/,
  ),
)

export interface Token {
  surface: string
  stem: string
}

export function stem(word: string): string {
  if (word.length > 4 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

export function isStopWord(word: string): boolean {
  return STOP.has(word)
}

export function tokenize(text: string): Token[] {
  const raw = text
    .toLowerCase()
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
  const out: Token[] = []
  for (const surface of raw) {
    if (surface.length <= 2 || STOP.has(surface) || /\d/.test(surface)) continue
    out.push({ surface, stem: stem(surface) })
  }
  return out
}

/** Near-empty OCR becomes an image-only record: kept, but not clustered as words. */
export function isImageOnly(text: string): boolean {
  const trimmed = text.trim()
  const words = trimmed.split(/\s+/).filter(Boolean)
  const letters = trimmed.replace(/[^a-z]/gi, '')
  return words.length < 4 || letters.length < 16
}

function titleWord(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}

export function labelFromKeywords(keywords: string[]): string {
  const unique: string[] = []
  for (const keyword of keywords) {
    const lower = keyword.toLowerCase()
    if (!unique.includes(lower)) unique.push(lower)
    if (unique.length === 2) break
  }
  if (unique.length === 0) return 'Untitled'
  if (unique.length === 1) return titleWord(unique[0])
  return `${titleWord(unique[0])} & ${titleWord(unique[1])}`
}
