import { describe, expect, it } from 'vitest'
import { readLook } from './look.ts'

describe('preview looks', () => {
  it('keeps the current design when the query is missing or unknown', () => {
    expect(readLook('')).toBe('desk')
    expect(readLook('?')).toBe('desk')
    expect(readLook('?look=glass')).toBe('desk')
  })

  it('accepts the three preview directions', () => {
    expect(readLook('?look=scrapbook')).toBe('scrapbook')
    expect(readLook('?look=tabloid')).toBe('tabloid')
    expect(readLook('?look=memoir')).toBe('memoir')
  })
})
