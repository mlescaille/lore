import { describe, expect, it } from 'vitest'
import { suggestionFor } from '../pipeline/biography.ts'
import { scoreSentence } from '../pipeline/scoring.ts'
import { epithetFontSize } from './CardFace.tsx'

describe('epithet size', () => {
  it('steps down for longer titles, and the square card stays smaller than the story card', () => {
    const short = 'The Recipe Hoarder'
    const mid = 'The Keeper of the Room Who Saves the Party for Later'
    const long = 'The Quiet Perfectionist Who Screenshots Comments to Win an Argument with Themselves'
    expect(epithetFontSize(short, false)).toBeGreaterThan(epithetFontSize(mid, false))
    expect(epithetFontSize(mid, false)).toBeGreaterThan(epithetFontSize(long, false))
    expect(epithetFontSize(long, true)).toBeGreaterThan(epithetFontSize(long, false))
    expect(epithetFontSize(long, false)).toBeGreaterThanOrEqual(26)
  })
})

describe('plain portrait', () => {
  it('describes a theme in one friendly sentence, with no stat labels', () => {
    const line = suggestionFor('celebrations', 'Celebrations')
    expect(line.endsWith('.')).toBe(true)
    expect(line.length).toBeGreaterThan(20)
    expect(line).not.toMatch(/HP|ATK|DEF|RARE|COMMON/)
    expect(scoreSentence(2, 3)).toBe('You got 2 of 3 right.')
    expect(scoreSentence(0, 0)).toBe('You did not make a guess.')
  })
})
