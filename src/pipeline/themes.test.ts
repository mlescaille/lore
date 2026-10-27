import { describe, expect, it } from 'vitest'
import type { InputShot } from '../types.ts'
import { analyzeShots } from './analyze.ts'
import { PUBLISHED_LABELS, aggregateVision } from './catalog.ts'
import type { VisualHit } from './signals.ts'
import { chooseThemeId } from './themes.ts'

const JUNK = /150k|162k|20a|aad|agai|aan/i

function shot(id: string, text: string, day: string, sensitiveText?: string): InputShot {
  return {
    id,
    text,
    sensitiveText,
    timestamp: `${day}T18:00:00.000Z`,
    timestampSource: 'filename',
  }
}

describe('theme labels', () => {
  it('collapses vision prompts into human themes', () => {
    const hits = aggregateVision([
      { label: 'people celebrating at a party', score: 0.22 },
      { label: 'a birthday party with balloons and cake', score: 0.31 },
      { label: 'friends laughing together', score: 0.18 },
      { label: 'a distributed systems diagram', score: 0.04 },
      { label: 'an abstract texture', score: 0.03 },
    ])
    expect(hits[0]).toMatchObject({ themeId: 'celebrations' })
    expect(hits.find((hit) => hit.themeId === 'celebrations')?.score).toBeCloseTo(0.31)
    expect(hits.find((hit) => hit.themeId === 'other')?.score).toBeCloseTo(0.03)
  })

  it('reads a trip note as travel even if the picture model says fitness', () => {
    const text = 'lisbon october flight lands late packing list trip tram morning itinerary'
    const visual: VisualHit[] = [
      { themeId: 'fitness', score: 0.42 },
      { themeId: 'travel', score: 0.2 },
      { themeId: 'other', score: 0.05 },
    ]
    expect(chooseThemeId(text, visual)).toBe('travel')
  })

  it('prefers a diagram’s real words over a weaker visual guess', () => {
    const visual: VisualHit[] = [
      { themeId: 'tech', score: 0.2 },
      { themeId: 'systems', score: 0.16 },
      { themeId: 'other', score: 0.04 },
    ]
    expect(chooseThemeId('consistency latency availability partition distributed systems', visual)).toBe('systems')
  })

  it('does not promote OCR junk into a theme name', async () => {
    const shots = [
      shot('p1', '', '2025-10-04', 'Aad Agai 150k 162k'),
      shot('p2', '', '2025-10-04', '20a Aan 99'),
      shot('p3', 'party', '2025-10-04', '150k collector Aad'),
      shot('d1', 'consistency latency availability partition distributed systems', '2025-10-18', 'consistency latency 150k'),
    ]
    const visual = new Map<string, VisualHit[]>([
      ['p1', [{ themeId: 'celebrations', score: 0.41 }, { themeId: 'friends', score: 0.22 }, { themeId: 'other', score: 0.04 }]],
      ['p2', [{ themeId: 'celebrations', score: 0.38 }, { themeId: 'people', score: 0.19 }, { themeId: 'other', score: 0.05 }]],
      ['p3', [{ themeId: 'friends', score: 0.36 }, { themeId: 'celebrations', score: 0.3 }, { themeId: 'people', score: 0.12 }, { themeId: 'other', score: 0.04 }]],
      ['d1', [{ themeId: 'tech', score: 0.18 }, { themeId: 'learning', score: 0.11 }, { themeId: 'other', score: 0.05 }]],
    ])
    const result = await analyzeShots(shots, {
      runDate: '2026-02-08T00:00:00.000Z',
      perceive: async () => visual,
    })

    expect(result.meta.grouping).toBe('vision')
    for (const theme of result.themes) {
      expect(PUBLISHED_LABELS.has(theme.label)).toBe(true)
      expect(theme.label).not.toMatch(JUNK)
      expect(theme.keywords.join(' ')).not.toMatch(JUNK)
    }
    expect(result.themes.map((theme) => theme.label)).toEqual(['Celebrations', 'Friends and family', 'Systems notes'])
    expect(result.biography.epithet).toBe('The Party Correspondent Who Keeps the People in the Room')
    expect(result.biography.epithet).not.toMatch(JUNK)
    expect(JSON.stringify(result.biography)).not.toMatch(JUNK)
    expect(result.records.map((record) => record.text).join(' ')).not.toMatch(JUNK)
  })

  it('names cleaned text when the vision model is missing', async () => {
    const result = await analyzeShots(
      [
        shot('r1', 'brown butter cookie recipe oven bake dinner', '2025-09-12'),
        shot('n1', 'Aad 150k 20a', '2025-09-13'),
      ],
      { perceive: async () => new Map(), runDate: '2026-02-08T00:00:00.000Z' },
    )
    expect(result.meta.grouping).toBe('lexical')
    expect(result.themes.map((theme) => theme.label).sort()).toEqual(['Recipes', 'no words, just vibes'])
    expect(JSON.stringify(result.themes)).not.toMatch(JUNK)
    expect(result.biography.epithet).toBe('The Recipe Hoarder')
  })

  it('still drops a sensitive record from the raw text before any theme is named', async () => {
    const result = await analyzeShots(
      [
        shot('ok', 'birthday party with friends', '2025-10-04', 'birthday party with friends'),
        shot('no', 'birthday party', '2025-10-05', 'new card number 4242 4242 4242 4242 do not leave this here'),
      ],
      {
        perceive: async (ids) => {
          expect(ids).toEqual(['ok'])
          return new Map([['ok', [{ themeId: 'celebrations', score: 0.4 }, { themeId: 'other', score: 0.05 }]]])
        },
      },
    )
    expect(result.meta.excludedCount).toBe(1)
    expect(result.meta.exclusion.account).toBe(1)
    expect(result.records.map((record) => record.id)).toEqual(['ok'])
    expect(result.themes.map((theme) => theme.label)).toEqual(['Celebrations'])
    expect(JSON.stringify(result)).not.toContain('4242')
  })
})
