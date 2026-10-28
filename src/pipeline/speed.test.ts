import { describe, expect, it } from 'vitest'
import { fittedSize } from './scale.ts'
import { ocrPoolSize } from './ocr.ts'
import { shouldSkipOcr } from './skipOcr.ts'

describe('picture size', () => {
  it('shrinks a phone screenshot to the stage width and leaves a small one alone', () => {
    expect(fittedSize(1170, 2532, 1000)).toEqual({ width: 1000, height: 2164 })
    expect(fittedSize(800, 600, 1000)).toEqual({ width: 800, height: 600 })
    expect(fittedSize(4032, 3024, 256).width).toBe(256)
  })
})

describe('ocr pool', () => {
  it('uses half the cores, and never more than 4', () => {
    expect(ocrPoolSize(8)).toBe(4)
    expect(ocrPoolSize(4)).toBe(2)
    expect(ocrPoolSize(2)).toBe(1)
    expect(ocrPoolSize(1)).toBe(1)
  })
})

describe('skip ocr', () => {
  it('skips a confident photo and keeps a diagram or a screenshot', () => {
    expect(
      shouldSkipOcr([
        { themeId: 'people', score: 0.72 },
        { themeId: 'friends', score: 0.2 },
        { themeId: 'recipes', score: 0.02 },
      ]),
    ).toBe(true)
    expect(
      shouldSkipOcr([
        { themeId: 'systems', score: 0.6 },
        { themeId: 'tech', score: 0.3 },
      ]),
    ).toBe(false)
    expect(
      shouldSkipOcr([
        { themeId: 'people', score: 0.5 },
        { themeId: 'recipes', score: 0.2 },
      ]),
    ).toBe(false)
    expect(shouldSkipOcr(undefined)).toBe(false)
  })
})
