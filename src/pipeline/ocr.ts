import Tesseract from 'tesseract.js'

export async function recognizeAll(
  items: { id: string; blob: Blob }[],
  onProgress: (done: number, total: number) => void,
  concurrency = 2,
  shouldContinue: () => boolean = () => true,
): Promise<{ id: string; text: string }[]> {
  if (items.length === 0) return []
  const count = Math.max(1, Math.min(concurrency, items.length))
  const workers = await Promise.all(Array.from({ length: count }, () => Tesseract.createWorker('eng')))
  const results: { id: string; text: string }[] = []
  let cursor = 0
  let done = 0

  async function run(worker: Awaited<ReturnType<typeof Tesseract.createWorker>>) {
    while (cursor < items.length && shouldContinue()) {
      const index = cursor
      cursor += 1
      const item = items[index]
      if (!item) continue
      try {
        const recognized = await worker.recognize(item.blob)
        results.push({ id: item.id, text: (recognized.data.text ?? '').trim() })
      } catch {
        results.push({ id: item.id, text: '' })
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
