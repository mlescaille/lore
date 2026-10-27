import { describe, expect, it } from 'vitest'
import { acceptOcrToken, chooseCleanText, cleanOcrString, cleanOcrWords, isNumberish } from './ocrText.ts'
import { tokenize } from './text.ts'

describe('OCR noise', () => {
  it('rejects counts, fragments, and numbers even when the reader is sure', () => {
    const junk = ['150k', '162k', '20a', 'Aad', 'Agai', 'Aan', '99', '3pm', 'x7']
    for (const text of junk) {
      expect(acceptOcrToken({ text, confidence: 99 })).toBeNull()
    }
    expect(isNumberish('150k')).toBe(true)
    expect(isNumberish('20a')).toBe(true)
    expect(cleanOcrWords(junk.map((text) => ({ text, confidence: 99 })))).toBe('')
  })

  it('drops low-confidence words and keeps real ones', () => {
    const clean = cleanOcrWords([
      { text: 'latency', confidence: 91 },
      { text: 'consistency', confidence: 87 },
      { text: 'party', confidence: 42 },
      { text: 'recipe', confidence: 80 },
      { text: 'the', confidence: 99 },
      { text: '150k', confidence: 99 },
      { text: 'Aad', confidence: 96 },
    ])
    expect(clean.split(' ').sort()).toEqual(['consistency', 'latency', 'recipe'])
  })

  it('asks short words to be very confident', () => {
    expect(acceptOcrToken({ text: 'map', confidence: 70 })).toBeNull()
    expect(acceptOcrToken({ text: 'map', confidence: 90 })).toBe('map')
  })

  it('filters a raw page, including a trip note and the junk overlay', () => {
    const trip = cleanOcrString('Lisbon in October. Flight lands late. Packing list for the trip. Tram 28 in the morning.')
    expect(trip).toContain('flight')
    expect(trip).toContain('trip')
    expect(trip).not.toMatch(/\d/)
    expect(cleanOcrString('150k 162k Aad Agai 20a Aan x7 99 3pm')).toBe('')
  })

  it('ignores a noisy raw page when word boxes already exist', () => {
    const tokens = [
      { text: '150k', confidence: 99 },
      { text: 'Aad', confidence: 91 },
      { text: 'party', confidence: 40 },
    ]
    expect(chooseCleanText(tokens, 'party celebration consistency latency 150k')).toBe('')
  })

  it('keeps confident words from boxes and falls back only for a confident page', () => {
    const tokens = [
      { text: 'consistency', confidence: 92 },
      { text: 'latency', confidence: 88 },
      { text: '150k', confidence: 99 },
    ]
    expect(chooseCleanText(tokens, 'ignored raw page')).toBe('consistency latency')
    expect(chooseCleanText([], 'Lisbon flight packing list for the trip', 95)).toContain('trip')
  })

  it('drops a photo page whose only words are low-confidence fragments', () => {
    const photo = [
      { text: 'ast', confidence: 20 },
      { text: 'Tray', confidence: 55 },
      { text: 'Waa', confidence: 38 },
      { text: 'Agai', confidence: 91 },
      { text: '150k', confidence: 93 },
      { text: '20a', confidence: 95 },
      { text: 'Aan', confidence: 94 },
      { text: '3pm', confidence: 96 },
    ]
    expect(chooseCleanText(photo, 'ast Tray Agai 150k party celebration', 33)).toBe('')
    expect(chooseCleanText([], 'ast Tray party celebration 150k', 33)).toBe('')
  })

  it('does not let digit tokens into the word stream', () => {
    const tokens = tokenize('Aad Agai 150k 162k 20a latency consistency')
    expect(tokens.map((token) => token.surface)).not.toContain('150k')
    expect(tokens.map((token) => token.surface)).not.toContain('20a')
    expect(tokens.map((token) => token.surface)).toContain('latency')
  })
})
