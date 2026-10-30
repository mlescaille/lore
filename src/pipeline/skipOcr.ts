import type { VisualHit } from './signals.ts'

const PHOTO = new Set(['people', 'friends', 'celebrations', 'food', 'fitness'])
const HAS_WORDS = new Set(['recipes', 'messages', 'work', 'tech', 'systems', 'learning', 'diagrams'])

/**
 * A confident photo does not need the optical reader.
 * Anything that might be a screenshot, a recipe, or a diagram still does.
 * The hot path only uses this after CLIP has already scored that picture,
 * and only when OCR has not started on it yet.
 */
export function shouldSkipOcr(hits: VisualHit[] | undefined): boolean {
  if (!hits || hits.length === 0) return false
  const top = hits[0]
  if (!top || !PHOTO.has(top.themeId) || top.score < 0.55) return false
  for (const hit of hits) {
    if (HAS_WORDS.has(hit.themeId) && hit.score >= 0.12) return false
  }
  return true
}
