import { describe, expect, it } from 'vitest'
import { splitChapters } from './chapters.ts'

function shot(themeId: string, day: number) {
  return {
    id: `${themeId}-${day}`,
    themeId,
    timestamp: new Date(Date.UTC(2025, 0, day, 12, 0, 0)).toISOString(),
  }
}

function themes(records: ReturnType<typeof shot>[]) {
  return splitChapters(records).map((slice) => slice.themeId)
}

describe('chaptering', () => {
  it('returns nothing for an empty roll', () => {
    expect(splitChapters([])).toEqual([])
  })

  it('keeps a single screenshot as one chapter', () => {
    const slices = splitChapters([shot('recipes', 3)])
    expect(slices).toHaveLength(1)
    expect(slices[0]?.themeId).toBe('recipes')
    expect(slices[0]?.start).toBe(slices[0]?.end)
  })

  it('splits when the dominant theme changes and stays changed', () => {
    const records = [
      shot('recipes', 1),
      shot('recipes', 2),
      shot('recipes', 3),
      shot('lisbon', 4),
      shot('lisbon', 5),
      shot('lisbon', 6),
    ]
    expect(themes(records)).toEqual(['recipes', 'lisbon'])
  })

  it('absorbs a one-off interruption', () => {
    const records = [
      shot('recipes', 1),
      shot('recipes', 2),
      shot('recipes', 3),
      shot('lisbon', 4),
      shot('recipes', 5),
      shot('recipes', 6),
      shot('recipes', 7),
    ]
    expect(themes(records)).toEqual(['recipes'])
  })

  it('opens a new chapter when a theme returns and holds', () => {
    const records = [
      shot('recipes', 1),
      shot('recipes', 2),
      shot('recipes', 3),
      shot('lisbon', 4),
      shot('lisbon', 5),
      shot('lisbon', 6),
      shot('recipes', 7),
      shot('recipes', 8),
      shot('recipes', 9),
    ]
    expect(themes(records)).toEqual(['recipes', 'lisbon', 'recipes'])
  })

  it('sorts by time before splitting', () => {
    const records = [shot('lisbon', 5), shot('recipes', 1), shot('lisbon', 4), shot('recipes', 2), shot('lisbon', 6), shot('recipes', 3)]
    expect(themes(records)).toEqual(['recipes', 'lisbon'])
    const slices = splitChapters(records)
    expect(slices[0]?.start < slices[1]?.start).toBe(true)
  })

  it('does not let image-only vibes open their own chapter inside another theme', () => {
    const records = [shot('recipes', 1), shot('recipes', 2), shot('vibes', 3), shot('recipes', 4), shot('vibes', 5), shot('vibes', 6)]
    expect(themes(records)).toEqual(['recipes'])
  })

  it('splits on a short committed run at the end', () => {
    const records = [shot('recipes', 1), shot('recipes', 2), shot('miles', 3), shot('miles', 4)]
    expect(themes(records)).toEqual(['recipes', 'miles'])
  })
})
