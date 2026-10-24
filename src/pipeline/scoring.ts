import { stem, tokenize } from './text.ts'
import { cosine } from './vector.ts'

export interface ScoreTheme {
  id: string
  label: string
  keywords: string[]
  count: number
}

export interface GuessMatch {
  guess: string
  themeId: string | null
  themeLabel: string | null
  similarity: number
  matched: boolean
}

export interface ScoreResult {
  matches: GuessMatch[]
  matchedCount: number
  guessCount: number
  topThemeIds: string[]
}

const CONCEPTS: string[][] = [
  ['travel', 'trip', 'flight', 'vacation', 'itinerary', 'packing', 'airbnb', 'passport', 'airport', 'lisbon', 'portugal', 'tram', 'hostel'],
  ['recipe', 'cook', 'cooking', 'pasta', 'dinner', 'ingredient', 'oven', 'bake', 'baking', 'kitchen', 'miso', 'cookie', 'grocery', 'risotto'],
  ['work', 'office', 'figma', 'critique', 'sprint', 'client', 'design', 'mock', 'layout', 'slack', 'ticket'],
  ['fitness', 'run', 'running', 'mile', 'workout', 'gym', 'pace', 'marathon', 'interval', 'tempo', 'training', 'race'],
  ['friend', 'chat', 'gremlin', 'meme', 'brunch', 'karaoke', 'group'],
]

const CONCEPT_OF = new Map<string, string>()
for (const group of CONCEPTS) {
  const canonical = group[0]
  for (const word of group) CONCEPT_OF.set(word, canonical)
}

function conceptsOf(text: string): Set<string> {
  const out = new Set<string>()
  for (const token of tokenize(text)) {
    out.add(CONCEPT_OF.get(token.stem) ?? CONCEPT_OF.get(token.surface) ?? CONCEPT_OF.get(stem(token.surface)) ?? token.stem)
  }
  return out
}

/** Meaning match without a model: shared concepts, so "travel" meets "trip" and "flight". */
export function lexicalSimilarity(guess: string, theme: Pick<ScoreTheme, 'label' | 'keywords'>): number {
  const guessConcepts = conceptsOf(guess)
  const themeConcepts = conceptsOf(`${theme.label} ${theme.keywords.join(' ')}`)
  if (guessConcepts.size === 0 || themeConcepts.size === 0) return 0
  let overlap = 0
  for (const concept of guessConcepts) if (themeConcepts.has(concept)) overlap += 1
  return overlap / guessConcepts.size
}

export function lexicalMatrix(guesses: string[], themes: Pick<ScoreTheme, 'label' | 'keywords'>[]): number[][] {
  return guesses.map((guess) => themes.map((theme) => lexicalSimilarity(guess, theme)))
}

export function vectorMatrix(guessVectors: number[][], themeVectors: number[][]): number[][] {
  return guessVectors.map((guess) => themeVectors.map((theme) => cosine(guess, theme)))
}

/**
 * Greedy one-to-one assignment. A guess matches when its best remaining theme
 * clears the threshold. Each theme can satisfy only one guess.
 */
export function assignMatches(guesses: string[], themes: ScoreTheme[], matrix: number[][], threshold: number): ScoreResult {
  const clean = guesses.map((guess) => guess.trim()).filter(Boolean)
  const pairs: { gi: number; ti: number; sim: number }[] = []
  for (let gi = 0; gi < clean.length; gi++) {
    for (let ti = 0; ti < themes.length; ti++) {
      pairs.push({ gi, ti, sim: matrix[gi]?.[ti] ?? 0 })
    }
  }
  pairs.sort((a, b) => b.sim - a.sim || (themes[b.ti]?.count ?? 0) - (themes[a.ti]?.count ?? 0) || a.gi - b.gi || a.ti - b.ti)

  const usedGuess = new Set<number>()
  const usedTheme = new Set<number>()
  const assigned = new Map<number, { ti: number; sim: number }>()
  for (const pair of pairs) {
    if (pair.sim < threshold) continue
    if (usedGuess.has(pair.gi) || usedTheme.has(pair.ti)) continue
    usedGuess.add(pair.gi)
    usedTheme.add(pair.ti)
    assigned.set(pair.gi, { ti: pair.ti, sim: pair.sim })
  }

  const matches: GuessMatch[] = clean.map((guess, gi) => {
    const hit = assigned.get(gi)
    if (!hit) {
      let best = 0
      for (let ti = 0; ti < themes.length; ti++) best = Math.max(best, matrix[gi]?.[ti] ?? 0)
      return { guess, themeId: null, themeLabel: null, similarity: best, matched: false }
    }
    const theme = themes[hit.ti]
    return {
      guess,
      themeId: theme?.id ?? null,
      themeLabel: theme?.label ?? null,
      similarity: hit.sim,
      matched: true,
    }
  })

  const topThemeIds = [...themes]
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, 3)
    .map((theme) => theme.id)

  return {
    matches,
    matchedCount: matches.filter((match) => match.matched).length,
    guessCount: clean.length,
    topThemeIds,
  }
}

export function scoreGuessesLexically(guesses: string[], themes: ScoreTheme[], threshold = 0.5): ScoreResult {
  const clean = guesses.map((guess) => guess.trim()).filter(Boolean)
  return assignMatches(clean, themes, lexicalMatrix(clean, themes), threshold)
}
