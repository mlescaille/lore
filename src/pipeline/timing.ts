/**
 * Stage timings. Marks always go to the Performance API.
 * Console lines are dev-only, or when a benchmark sets globalThis.__LORE_TIMING.
 */

export interface StageTime {
  name: string
  ms: number
}

const stages: StageTime[] = []
let counter = 0

function enabled(): boolean {
  if (import.meta.env.DEV) return true
  return typeof globalThis !== 'undefined' && (globalThis as { __LORE_TIMING?: boolean }).__LORE_TIMING === true
}

export function recordTime(name: string, ms: number) {
  if (!enabled()) return
  stages.push({ name, ms })
  if (typeof performance !== 'undefined') {
    const id = ++counter
    const start = `lore:${name}:start:${id}`
    const end = `lore:${name}:end:${id}`
    performance.mark(start)
    performance.mark(end)
    try {
      performance.measure(`lore:${name}`, start, end)
    } catch {
      // A missing mark should not break a reading.
    }
  }
  console.info(`[lore] ${name}: ${Math.round(ms)}ms`)
}

export async function timed<T>(name: string, run: () => Promise<T>): Promise<T> {
  const id = ++counter
  const start = `lore:${name}:start:${id}`
  const end = `lore:${name}:end:${id}`
  const measureName = `lore:${name}`
  if (typeof performance !== 'undefined') performance.mark(start)
  const began = typeof performance !== 'undefined' ? performance.now() : Date.now()
  try {
    return await run()
  } finally {
    const ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - began
    if (typeof performance !== 'undefined') {
      performance.mark(end)
      try {
        performance.measure(measureName, start, end)
      } catch {
        // A missing mark should not break a reading.
      }
    }
    if (enabled()) {
      stages.push({ name, ms })
      console.info(`[lore] ${name}: ${Math.round(ms)}ms`)
    }
  }
}

export function drainTimes(): StageTime[] {
  const copy = stages.slice()
  stages.length = 0
  return copy
}
