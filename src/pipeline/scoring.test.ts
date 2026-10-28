import { describe, expect, it } from 'vitest'
import { cosine } from './vector.ts'
import { assignMatches, hasGuess, lexicalSimilarity, scoreGuessesLexically, scoreSentence, type ScoreTheme } from './scoring.ts'

const trip: ScoreTheme = {
  id: 'lisbon',
  label: 'lisbon & trip',
  keywords: ['lisbon', 'trip', 'flight', 'packing'],
  count: 12,
}
const recipes: ScoreTheme = {
  id: 'recipes',
  label: 'pasta & recipes',
  keywords: ['pasta', 'recipe', 'dinner', 'oven'],
  count: 16,
}
const chat: ScoreTheme = {
  id: 'chat',
  label: 'gremlins & chat',
  keywords: ['gremlins', 'chat', 'brunch'],
  count: 8,
}

describe('scoring', () => {
  it('matches a guess to a theme by meaning, not just the same word', () => {
    expect(lexicalSimilarity('travel', trip)).toBeGreaterThan(lexicalSimilarity('travel', recipes))
    expect(lexicalSimilarity('travel', trip)).toBeGreaterThanOrEqual(0.5)
    expect(lexicalSimilarity('travel', recipes)).toBeLessThan(0.5)
    expect(lexicalSimilarity('cooking', recipes)).toBeGreaterThanOrEqual(0.5)
    expect(lexicalSimilarity('cooking', trip)).toBeLessThan(0.5)
    expect(lexicalSimilarity('friends', chat)).toBeGreaterThanOrEqual(0.5)
  })

  it('scores a three-theme guess and leaves the miss unmatched', () => {
    const score = scoreGuessesLexically(['travel', 'cooking', 'outer space'], [recipes, trip, chat])
    expect(score.matchedCount).toBe(2)
    expect(score.guessCount).toBe(3)
    expect(score.matches.find((match) => match.guess === 'travel')?.themeId).toBe('lisbon')
    expect(score.matches.find((match) => match.guess === 'cooking')?.themeId).toBe('recipes')
    expect(score.matches.find((match) => match.guess === 'outer space')?.matched).toBe(false)
    expect(score.topThemeIds).toEqual(['recipes', 'lisbon', 'chat'])
    expect(scoreSentence(score.matchedCount, score.guessCount)).toBe('You got 2 of 3 right.')
  })

  it('gives a contested theme to the closer guess', () => {
    const themes: ScoreTheme[] = [
      { id: 'a', label: 'alpha', keywords: [], count: 5 },
      { id: 'b', label: 'beta', keywords: [], count: 9 },
    ]
    const matrix = [
      [0.95, 0.2],
      [0.9, 0.1],
    ]
    const score = assignMatches(['first', 'second'], themes, matrix, 0.5)
    expect(score.matches[0]).toMatchObject({ themeId: 'a', matched: true })
    expect(score.matches[1]?.matched).toBe(false)
    expect(score.matchedCount).toBe(1)
  })

  it('does not count a match against a theme outside the top 3', () => {
    const friends: ScoreTheme = { id: 'friends', label: 'friends and family', keywords: ['friend', 'family'], count: 4 }
    const celebrations: ScoreTheme = { id: 'celebrations', label: 'celebrations', keywords: ['party', 'celebration'], count: 3 }
    const recipes: ScoreTheme = { id: 'recipes', label: 'recipes', keywords: ['recipe', 'dinner'], count: 2 }
    const systems: ScoreTheme = { id: 'systems', label: 'systems notes', keywords: ['tech', 'system', 'diagram'], count: 1 }
    const score = scoreGuessesLexically(['celebrations', 'friends', 'tech'], [systems, recipes, celebrations, friends])
    expect(score.topThemeIds).toEqual(['friends', 'celebrations', 'recipes'])
    expect(score.matches.find((match) => match.guess === 'celebrations')).toMatchObject({ matched: true, themeId: 'celebrations' })
    expect(score.matches.find((match) => match.guess === 'friends')).toMatchObject({ matched: true, themeId: 'friends' })
    expect(score.matches.find((match) => match.guess === 'tech')?.matched).toBe(false)
    expect(score.matchedCount).toBe(2)
    expect(scoreSentence(score.matchedCount, score.guessCount)).toBe('You got 2 of 3 right.')
  })

  it('treats a blank or missing guess as no guess', () => {
    expect(hasGuess([])).toBe(false)
    expect(hasGuess(['', '  '])).toBe(false)
    expect(hasGuess(['friends'])).toBe(true)
  })

  it('does not match below the threshold', () => {
    const themes: ScoreTheme[] = [{ id: 'a', label: 'alpha', keywords: [], count: 3 }]
    const score = assignMatches(['guess'], themes, [[0.49]], 0.5)
    expect(score.matchedCount).toBe(0)
    expect(score.matches[0]?.similarity).toBe(0.49)
  })

  it('measures cosine similarity for embedding scores', () => {
    expect(cosine([1, 0, 0], [1, 0, 0])).toBeCloseTo(1)
    expect(cosine([1, 0], [0, 1])).toBeCloseTo(0)
    expect(cosine([1, 1], [1, 0])).toBeGreaterThan(0.5)
  })
})
