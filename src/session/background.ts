export interface BackgroundProgress {
  label: string
  done: number
  total: number
}

export interface BackgroundReading<T> {
  readonly ready: boolean
  readonly cancelled: boolean
  readonly progress: BackgroundProgress
  /** Begins the work immediately. Safe to call once. */
  start(): void
  /** The finished portrait. Null when the run was cancelled. Resolves at once if it is already done. */
  result(): Promise<T | null>
  cancel(): void
}

/**
 * Runs the portrait in the background, before anyone chooses to guess or skip.
 * Asking for the result does not start a second run.
 */
export function startBackgroundReading<T>(
  work: (report: (progress: BackgroundProgress) => void, alive: () => boolean) => Promise<T>,
): BackgroundReading<T> {
  let ready = false
  let cancelled = false
  let settled = false
  let progress: BackgroundProgress = { label: 'Reading your screenshots in the background', done: 0, total: 0 }
  let resolveReady: (value: T | null) => void = () => {}
  let rejectReady: (error: unknown) => void = () => {}
  const done = new Promise<T | null>((resolve, reject) => {
    resolveReady = resolve
    rejectReady = reject
  })
  // No one has to be waiting for the work to finish.
  done.catch(() => undefined)

  function succeed(value: T | null) {
    if (settled) return
    settled = true
    if (!cancelled && value != null) ready = true
    resolveReady(cancelled ? null : value)
  }

  function fail(error: unknown) {
    if (settled) return
    settled = true
    if (cancelled) resolveReady(null)
    else rejectReady(error)
  }

  return {
    get ready() {
      return ready
    },
    get cancelled() {
      return cancelled
    },
    get progress() {
      return progress
    },
    start() {
      void work(
        (next) => {
          progress = clampProgress(next)
        },
        () => !cancelled,
      ).then(
        (value) => succeed(value),
        (error) => fail(error),
      )
    },
    result() {
      return done
    },
    cancel() {
      cancelled = true
      ready = false
      if (!settled) {
        settled = true
        resolveReady(null)
      }
    },
  }
}

/** A count shown to the user. Never larger than the total, and never below zero. */
export function clampCount(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(Math.max(done, 0), total)
}

export function clampProgress(progress: BackgroundProgress): BackgroundProgress {
  const total = Math.max(0, progress.total)
  return { ...progress, done: clampCount(progress.done, total), total }
}

export function backgroundSentence(kind: 'words' | 'model' | 'pictures' | 'ready', done: number, total: number): string {
  const count = clampCount(done, total)
  if (kind === 'ready') return 'Your lore is ready.'
  if (kind === 'model') return 'Getting the picture reader ready...'
  if (kind === 'pictures') return `Looking at pictures ${count} of ${total}`
  return `Reading words ${count} of ${total}`
}
