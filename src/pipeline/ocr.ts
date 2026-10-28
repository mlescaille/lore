import Tesseract, { type Page, type Word } from 'tesseract.js'
import { chooseCleanText, type OcrToken } from './ocrText.ts'

interface ReadablePage extends Page {
  words?: Word[]
}

function tokensFromPage(page: ReadablePage): OcrToken[] {
  const direct = page.words
  if (direct && direct.length > 0) {
    return direct.map((word) => ({ text: word.text, confidence: word.confidence }))
  }
  const tokens: OcrToken[] = []
  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        for (const word of line.words ?? []) tokens.push({ text: word.text, confidence: word.confidence })
      }
    }
  }
  return tokens
}

export interface RecognizedShot {
  id: string
  /** Raw reader output. Used for the exclusion pass, then dropped. */
  text: string
  /** Dictionary words that cleared the confidence bar. Safe to theme. */
  cleanText: string
}

export async function recognizeAll(
  items: { id: string; blob: Blob }[],
  onProgress: (done: number, total: number) => void,
  concurrency = 2,
  shouldContinue: () => boolean = () => true,
): Promise<RecognizedShot[]> {
  if (items.length === 0) return []
  const count = Math.max(1, Math.min(concurrency, items.length))
  const workers = await Promise.all(Array.from({ length: count }, () => Tesseract.createWorker('eng')))
  const results: RecognizedShot[] = []
  let cursor = 0
  let done = 0

  async function run(worker: Awaited<ReturnType<typeof Tesseract.createWorker>>) {
    while (cursor < items.length && shouldContinue()) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (!item) continue
      try {
        const recognized = await worker.recognize(item.blob, {}, { text: true, blocks: true })
        const data = recognized.data as ReadablePage
        const raw = (data.text ?? '').trim()
        const pageConfidence = typeof data.confidence === 'number' ? data.confidence : undefined
        results.push({
          id: item.id,
          text: raw,
          cleanText: chooseCleanText(tokensFromPage(data), raw, pageConfidence),
        })
      } catch (error) {
        console.error('Lore failed during words', item.id, error)
        results.push({ id: item.id, text: '', cleanText: '' })
      }
      done += 1
      onProgress(done, items.length)
    }
  }

  try {
    await Promise.all(workers.map((worker) => run(worker)))
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()))
  }
  return results
}
