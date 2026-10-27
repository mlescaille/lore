import { CATALOG, CATALOG_BY_ID } from './catalog.ts'
import type { VisualHit } from './signals.ts'
import { isStopWord, stem, tokenize } from './text.ts'
import type { Grouping, InputShot, Theme } from '../types.ts'

const TEXT_LOCK = 2

interface TextScore {
  themeId: string
  hits: number
  matched: string[]
}

export function scoreTextThemes(text: string): TextScore[] {
  const tokens = new Set<string>()
  for (const token of tokenize(text)) {
    tokens.add(token.surface)
    tokens.add(token.stem)
  }
  const ranked: TextScore[] = []
  for (const theme of CATALOG) {
    const matched: string[] = []
    const seen = new Set<string>()
    for (const word of theme.words) {
      const key = stem(word)
      if (seen.has(key)) continue
      if (tokens.has(word) || tokens.has(key)) {
        seen.add(key)
        matched.push(word)
      }
    }
    if (matched.length > 0) ranked.push({ themeId: theme.id, hits: matched.length, matched })
  }
  ranked.sort((a, b) => b.hits - a.hits || a.themeId.localeCompare(b.themeId))
  return ranked
}

function visionWins(best: VisualHit, other: number): boolean {
  if (best.score < 0.03) return false
  if (!(other > 0)) return true
  return best.score >= other + 0.012 && best.score >= other * 1.3
}

/**
 * One human theme per shot. Strong cleaned text wins (a recipe, a diagram).
 * Otherwise the vision score wins. Junk tokens are never a theme name.
 */
export function chooseThemeId(text: string, visual: VisualHit[] | undefined): string {
  const textRanked = scoreTextThemes(text)
  const bestText = textRanked[0]
  if (bestText && bestText.hits >= TEXT_LOCK) return bestText.themeId

  const hits = (visual ?? []).filter((hit) => hit.themeId !== 'other' && CATALOG_BY_ID.has(hit.themeId))
  const other = (visual ?? []).find((hit) => hit.themeId === 'other')?.score ?? 0
  const bestVisual = hits[0]
  if (bestVisual && visionWins(bestVisual, other)) return bestVisual.themeId

  if (bestText && bestText.hits >= 1) return bestText.themeId
  return 'vibes'
}

function keywordsFor(themeId: string, shots: InputShot[]): string[] {
  const spec = CATALOG_BY_ID.get(themeId)
  if (!spec) return []
  const matched = new Set<string>()
  for (const shot of shots) {
    const row = scoreTextThemes(shot.text).find((item) => item.themeId === themeId)
    for (const word of row?.matched ?? []) matched.add(word)
  }
  if (matched.size > 0) return [...matched].sort().slice(0, 4)
  return spec.label
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2 && !isStopWord(word))
    .slice(0, 3)
}

export function themesFromSignals(
  shots: InputShot[],
  visual: Map<string, VisualHit[]>,
  usedVision: boolean,
): { themes: Theme[]; themeOf: Map<string, string>; grouping: Grouping } {
  const themeOf = new Map<string, string>()
  const groups = new Map<string, InputShot[]>()
  for (const shot of shots) {
    const themeId = chooseThemeId(shot.text, visual.get(shot.id))
    themeOf.set(shot.id, themeId)
    const list = groups.get(themeId) ?? []
    list.push(shot)
    groups.set(themeId, list)
  }

  const themes: Theme[] = []
  for (const [id, members] of groups) {
    if (id === 'vibes') {
      themes.push({ id, label: 'no words, just vibes', keywords: [], count: members.length })
      continue
    }
    const spec = CATALOG_BY_ID.get(id)
    if (!spec) continue
    themes.push({ id, label: spec.label, keywords: keywordsFor(id, members), count: members.length })
  }
  themes.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  return { themes, themeOf, grouping: usedVision ? 'vision' : 'lexical' }
}
