/// <reference lib="webworker" />
import { scoreOneImage, preloadVision } from './vision.ts'

const scope = self as unknown as DedicatedWorkerGlobalScope
let cancelled = false
let ready = false
const queue: { id: string; blob: Blob }[][] = []
let working = false

async function pump() {
  if (working || !ready) return
  working = true
  try {
    while (queue.length > 0 && !cancelled) {
      const items = queue.shift() ?? []
      for (let index = 0; index < items.length; index++) {
        if (cancelled) return
        const item = items[index]
        if (!item) continue
        try {
          const started = performance.now()
          const rows = await scoreOneImage(item.blob)
          scope.postMessage({ type: 'time', name: 'clip-image', ms: performance.now() - started })
          scope.postMessage({ type: 'score', id: item.id, rows, done: index + 1, total: items.length })
        } catch (error) {
          console.error('Lore failed during model', item.id, error)
          scope.postMessage({ type: 'score', id: item.id, rows: [], done: index + 1, total: items.length })
        }
      }
      scope.postMessage({ type: 'done' })
    }
  } finally {
    working = false
  }
}

scope.onmessage = (event: MessageEvent) => {
  const data = event.data as { type?: string; items?: { id: string; blob: Blob }[] }
  if (data.type === 'cancel') {
    cancelled = true
    return
  }
  if (data.type === 'batch') {
    queue.push(data.items ?? [])
    void pump()
    return
  }
  if (data.type !== 'init') return
  const initStarted = performance.now()
  void preloadVision((loaded, total) => {
    scope.postMessage({ type: 'download', loaded, total })
  })
    .then(() => {
      ready = true
      scope.postMessage({ type: 'time', name: 'mobileclip-init', ms: performance.now() - initStarted })
      scope.postMessage({ type: 'ready' })
      void pump()
    })
    .catch((error: unknown) => {
      scope.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'The picture reader failed.' })
    })
}
