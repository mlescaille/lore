import { describe, expect, it } from 'vitest'
import { backgroundSentence, startBackgroundReading } from './background.ts'

function gate<T>() {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('background reading', () => {
  it('starts the portrait before anyone asks to see it', async () => {
    let started = false
    const hold = gate<string>()
    const run = startBackgroundReading(async (report) => {
      started = true
      report({ label: backgroundSentence('words', 1, 4), done: 1, total: 4 })
      return hold.promise
    })
    run.start()
    expect(started).toBe(true)
    expect(run.ready).toBe(false)
    expect(run.progress).toMatchObject({ done: 1, total: 4 })
    hold.resolve('portrait')
    await expect(run.result()).resolves.toBe('portrait')
    expect(run.ready).toBe(true)
  })

  it('returns the finished portrait immediately', async () => {
    const run = startBackgroundReading(async () => 'portrait')
    run.start()
    await run.result()
    const started = performance.now()
    await expect(run.result()).resolves.toBe('portrait')
    expect(performance.now() - started).toBeLessThan(50)
  })

  it('waits when a skip or a guess arrives while the portrait is still running', async () => {
    const hold = gate<string>()
    const run = startBackgroundReading(() => hold.promise)
    run.start()
    let settled = false
    const pending = run.result().then((value) => {
      settled = true
      return value
    })
    await Promise.resolve()
    expect(settled).toBe(false)
    expect(run.ready).toBe(false)
    hold.resolve('portrait')
    await expect(pending).resolves.toBe('portrait')
    expect(run.ready).toBe(true)
  })

  it('cancels a run so a late portrait is ignored', async () => {
    const hold = gate<string>()
    const run = startBackgroundReading(async (_report, alive) => {
      const value = await hold.promise
      return alive() ? value : 'late'
    })
    run.start()
    const pending = run.result()
    run.cancel()
    hold.resolve('portrait')
    await expect(pending).resolves.toBeNull()
    expect(run.cancelled).toBe(true)
    expect(run.ready).toBe(false)
  })

  it('describes background progress in plain words', () => {
    expect(backgroundSentence('words', 2, 4)).toBe('Reading words 2 of 4')
    expect(backgroundSentence('pictures', 3, 4)).toBe('Looking at pictures 3 of 4')
    expect(backgroundSentence('ready', 6, 6)).toBe('Your lore is ready.')
  })

  it('never lets the finished count pass the total', () => {
    expect(backgroundSentence('words', 9, 4)).toBe('Reading words 4 of 4')
    expect(backgroundSentence('pictures', 9, 4)).toBe('Looking at pictures 4 of 4')
    const run = startBackgroundReading(async (report) => {
      report({ label: 'too high', done: 9, total: 4 })
      return 'ok'
    })
    run.start()
    expect(run.progress.done).toBe(4)
    expect(run.progress.done).toBeLessThanOrEqual(run.progress.total)
  })
})
