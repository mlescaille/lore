import Tesseract, { type Page, type Word } from 'tesseract.js'
import { OCR_MAX_WIDTH, scaleImage } from './scale.ts'
import { chooseCleanText, type OcrToken } from './ocrText.ts'
import { timed } from './timing.ts'

interface ReadablePage extends Page {
  words?: Word[]
}

/** Half the cores, capped at 4, so the page stays responsive. */
export function ocrPoolSize(cores = typeof navigator === 'undefined' ? 2 : navigator.hardwareConcurrency || 2): number {
  return Math.max(1, Math.min(4, Math.floor(cores / 2)))
}

/**
 * Integer LSTM weights, the fast set. Much smaller than best_int.
 * Quality is checked against the demo pictures before this stays on.
 */
const FAST_LANG_PATH = 'https://tessdata.projectnaptha.com/4.0.0_fast'

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

type OcrWorker = Awaited<ReturnType<typeof Tesseract.createWorker>>

let poolPromise: Promise<OcrWorker[]> | null = null

async function createPool(): Promise<OcrWorker[]> {
  const count = ocrPoolSize()
  return timed('tesseract-init', () =>
    Promise.all(
      Array.from({ length: count }, () =>
        Tesseract.createWorker('eng', 1, {
          langPath: FAST_LANG_PATH,
          gzip: true,
          cacheMethod: 'write',
        }),
      ),
    ),
  )
}

/** Download the fast English weights on page load. The second visit reads them from cache. */
export function preloadOcr(): Promise<void> {
  if (!poolPromise) {
    poolPromise = createPool().catch((error) => {
      poolPromise = null
      throw error
    })
  }
  return poolPromise.then(() => undefined)
}

export async function recognizeAll(
  items: { id: string; blob: Blob }[],
  onProgress: (done: number, total: number) => void,
  shouldContinue: () => boolean = () => true,
): Promise<RecognizedShot[]> {
  if (items.length === 0) return []
  if (!poolPromise) poolPromise = createPool().catch((error) => {
    poolPromise = null
    throw error
  })
  const workers = await poolPromise
  const results: RecognizedShot[] = new Array(items.length)
  let cursor = 0
  let done = 0

  async function run(worker: OcrWorker) {
    while (shouldContinue()) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      const item = items[index]
      if (!item) continue
      try {
        const prepared = await timed('resize-ocr', () => scaleImage(item.blob, OCR_MAX_WIDTH))
        const recognized = await timed('ocr-image', () => worker.recognize(prepared, {}, { text: true, blocks: true }))
        const data = recognized.data as ReadablePage
        const raw = (data.text ?? '').trim()
        const pageConfidence = typeof data.confidence === 'number' ? data.confidence : undefined
        results[index] = {
          id: item.id,
          text: raw,
          cleanText: chooseCleanText(tokensFromPage(data), raw, pageConfidence),
        }
      } catch (error) {
        console.error('Lore failed during words', item.id, error)
        results[index] = { id: item.id, text: '', cleanText: '' }
      }
      done += 1
      onProgress(done, items.length)
    }
  }

  const active = workers.slice(0, Math.min(workers.length, items.length))
  await Promise.all(active.map((worker) => run(worker)))
  return results.filter((item): item is RecognizedShot => Boolean(item))
}
