import { describe, expect, it } from 'vitest'
import { SAMPLE_SHOTS, sampleText } from '../sample/manifest.ts'
import { analyzeShots } from './analyze.ts'
import { timestampFromFilename } from './timestamps.ts'

describe('sample set', () => {
  it('is a year of readable screenshots with a coherent biography', async () => {
    expect(SAMPLE_SHOTS.length).toBeGreaterThanOrEqual(40)
    expect(SAMPLE_SHOTS.length).toBeLessThanOrEqual(60)

    for (const shot of SAMPLE_SHOTS) {
      expect(timestampFromFilename(shot.filename)?.toISOString()).toBe(shot.timestamp)
    }

    const result = await analyzeShots(
      SAMPLE_SHOTS.map((shot) => ({
        id: shot.id,
        timestamp: shot.timestamp,
        timestampSource: shot.timestampSource,
        text: sampleText(shot),
      })),
      { runDate: '2026-02-08T00:00:00.000Z' },
    )

    expect(result.meta.totalCount).toBe(SAMPLE_SHOTS.length)
    expect(result.meta.excludedCount).toBe(2)
    expect(result.meta.exclusion.account).toBe(1)
    expect(result.meta.exclusion.medical).toBe(1)
    expect(result.meta.labelingMode).toBe('keywords')
    expect(result.records).toHaveLength(SAMPLE_SHOTS.length - 2)

    const dumped = JSON.stringify(result).toLowerCase()
    expect(dumped).not.toContain('metformin')
    expect(dumped).not.toContain('4242')
    expect(dumped).not.toContain('mychart')

    const hints = ['recipes', 'lisbon', 'gremlins', 'running', 'studio'] as const
    const majors = hints.map((hint) => {
      const ids = SAMPLE_SHOTS.filter((shot) => shot.themeHint === hint).map((shot) => shot.id)
      const themeIds = ids.map((id) => result.records.find((record) => record.id === id)?.themeId)
      expect(themeIds.every(Boolean)).toBe(true)
      const counts = new Map<string, number>()
      for (const themeId of themeIds) counts.set(themeId ?? '', (counts.get(themeId ?? '') ?? 0) + 1)
      let best = ''
      let bestN = 0
      for (const [themeId, count] of counts) {
        if (count > bestN) {
          best = themeId
          bestN = count
        }
      }
      expect(bestN / ids.length).toBeGreaterThan(0.8)
      return best
    })
    expect(new Set(majors).size).toBe(hints.length)

    const vibeIds = SAMPLE_SHOTS.filter((shot) => shot.themeHint === 'vibes').map((shot) => shot.id)
    for (const id of vibeIds) {
      expect(result.records.find((record) => record.id === id)?.themeId).toBe('vibes')
    }

    expect(result.chapters.length).toBeGreaterThanOrEqual(3)
    expect(result.chapters.length).toBeLessThanOrEqual(6)
    expect(result.biography.epithet).toBe('The Recipe Hoarder Who Plans Trips at Midnight')
    expect(result.biography.closingLine.length).toBeGreaterThan(10)
    expect(result.biography.epilogue.length).toBeGreaterThan(20)
    expect(result.themes.some((theme) => theme.label === 'no words, just vibes')).toBe(true)

    for (const record of result.records) {
      const snippet = record.text.slice(0, 48)
      if (snippet.length < 24) continue
      expect(result.biography.epithet).not.toContain(snippet)
      expect(result.biography.closingLine).not.toContain(snippet)
      expect(result.biography.epilogue).not.toContain(snippet)
      for (const chapter of result.chapters) expect(chapter.narrative).not.toContain(snippet)
    }
  })
})
