import { describe, expect, it } from 'vitest'
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
