import type { LoreResult } from '../types.ts'

/**
 * Next version: a paged biography (cover, foreword, one chapter per era, epilogue) and a PDF.
 * v1 already stores the pieces a book would read: chapters (title, dates, narrative, quoteIds),
 * the guess lives outside data.json, and biography.turningPoints / epilogue.
 * Quote text is looked up from records by id. The share card never prints it.
 */
export interface BookPlan {
  cover: { epithet: string }
  forewordNote: string
  chapters: LoreResult['chapters']
  turningPoints: LoreResult['biography']['turningPoints']
  epilogue: string
}

export function planBook(result: LoreResult): BookPlan {
  return {
    cover: { epithet: result.biography.epithet },
    forewordNote: 'The foreword pairs the guess with the score. The guess is not stored in data.json.',
    chapters: result.chapters,
    turningPoints: result.biography.turningPoints,
    epilogue: result.biography.epilogue,
  }
}
