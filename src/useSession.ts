import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_SHOTS } from './config.ts'
import { analyzeShots } from './pipeline/analyze.ts'
import { closingForScore } from './pipeline/biography.ts'
import { filesFromDataTransfer } from './pipeline/drop.ts'
import { prepareFiles, type PreparedFile } from './pipeline/ingest.ts'
import { parseBlocklist } from './pipeline/exclusion.ts'
import { assignMatches, hasGuess, scoreGuessesLexically, vectorMatrix, type ScoreResult } from './pipeline/scoring.ts'
import { SAMPLE_SHOTS, sampleText } from './sample/manifest.ts'
import { sampleImageUrl } from './sample/images.ts'
import { backgroundSentence, clampCount, startBackgroundReading, type BackgroundReading } from './session/background.ts'
import { forgetAll, loadSaved, saveReading, type SavedReading } from './storage/idb.ts'
import type { VisualHit } from './pipeline/signals.ts'
import type { InputShot, LoreResult } from './types.ts'

export interface Progress {
  label: string
  done: number
  total: number
  detail?: string
}

export interface RevealModel {
  result: LoreResult
  score: ScoreResult | null
  guesses: string[]
  kind: 'sample' | 'own'
  note: string
  kept: boolean
}

export type Phase =
  | { type: 'landing' }
  | { type: 'preparing'; progress: Progress }
  | { type: 'range'; files: PreparedFile[]; note: string }
  | { type: 'guess'; kind: 'sample' | 'own'; ready: boolean; progress: Progress; note: string; holding: boolean; picking: boolean }
  | { type: 'finishing'; label: string; detail?: string; done?: number; total?: number }
  | { type: 'reveal'; model: RevealModel }
  | { type: 'error'; message: string; step: 1 | 2 | 3 }

interface Job {
  kind: 'sample' | 'own'
  shots: InputShot[]
  note: string
}

interface CachedLore {
  result: LoreResult
  visual: Map<string, VisualHit[]>
  shots: InputShot[]
}

const SAMPLE_NOTE =
  'Jules’s pictures ship with the words already read, so this pass skips the optical reader. Your own screenshots are read on this device.'

async function scoreReading(
  guesses: string[],
  result: LoreResult,
  kind: 'sample' | 'own',
  onProgress?: (done: number, total: number) => void,
): Promise<ScoreResult> {
  if (kind === 'own' && result.themes.length > 0) {
    try {
      const { embedTexts } = await import('./pipeline/embed.ts')
      const clean = guesses.map((guess) => guess.trim()).filter(Boolean)
      const labels = result.themes.map((theme) => `${theme.label}. ${theme.keywords.join(', ')}`)
      const vectors = await embedTexts([...clean, ...labels], onProgress)
      const matrix = vectorMatrix(vectors.slice(0, clean.length), vectors.slice(clean.length))
      return assignMatches(clean, result.themes, matrix, 0.36)
    } catch {
      // The meaning model is optional. Word overlap still scores the guess.
    }
  }
  return scoreGuessesLexically(guesses, result.themes)
}

export function useSession() {
  const [phase, setPhase] = useState<Phase>({ type: 'landing' })
  const [saved, setSaved] = useState<SavedReading | null>(null)
  const [confirming, setConfirming] = useState(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const runId = useRef(0)
  const job = useRef<Job | null>(null)
  const pending = useRef<{ guesses: string[]; block: string } | null>(null)
  const pickingRef = useRef(true)
  const readyRef = useRef(false)
  const finishing = useRef(false)
  const loreRun = useRef<BackgroundReading<CachedLore> | null>(null)
  const loreCache = useRef<CachedLore | null>(null)
  const blobs = useRef(new Map<string, Blob>())
  const images = useRef(new Map<string, string>())
  const urls = useRef(new Map<string, string>())

  const revoke = useCallback(() => {
    for (const url of urls.current.values()) URL.revokeObjectURL(url)
    urls.current.clear()
  }, [])

  useEffect(() => {
    loadSaved()
      .then((reading) => setSaved(reading))
      .catch(() => setSaved(null))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void import('./pipeline/vision.ts')
        .then(({ preloadVision }) => preloadVision())
        .catch((error) => console.error('Lore failed during model', error))
      void import('./pipeline/embed.ts')
        .then(({ preloadEmbed }) => preloadEmbed())
        .catch((error) => console.error('Lore failed during model', error))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const titles: Record<Phase['type'], string> = {
      landing: 'Lore — Discover your lore',
      preparing: 'Lore — Reading the roll',
      range: 'Lore — Pick a stretch',
      guess: 'Lore — Name three themes',
      finishing: 'Lore — Writing it up',
      reveal: 'Lore — Your biography',
      error: 'Lore — Try again',
    }
    document.title = titles[phase.type]
  }, [phase.type])

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      const current = phaseRef.current
      if (current.type === 'reveal' && current.model.kind === 'own' && !current.model.kept) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [])

  const resolveImage = useCallback((id: string) => {
    const known = images.current.get(id)
    if (known) return known
    const existing = urls.current.get(id)
    if (existing) return existing
    const blob = blobs.current.get(id)
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    urls.current.set(id, url)
    return url
  }, [])

  const finish = useCallback(async () => {
    if (finishing.current) return
    const guess = pending.current
    const current = job.current
    const run = loreRun.current
    if (!guess || !current || !run) return
    finishing.current = true
    const token = runId.current
    try {
      const cached = loreCache.current ?? (await run.result())
      if (runId.current !== token || !cached) return
      let result = cached.result
      const block = parseBlocklist(guess.block)
      if (block.length > 0) {
        result = await analyzeShots(cached.shots, {
          blocklist: block,
          perceive: async () => cached.visual,
          runDate: new Date().toISOString(),
        })
      }
      if (runId.current !== token) return
      const names = guess.guesses.map((item) => item.trim()).filter(Boolean)
      let score: ScoreResult | null = null
      if (hasGuess(names)) {
        if (current.kind === 'own') {
          setPhase({
            type: 'finishing',
            label: 'Loading a small meaning model. It stays on this device.',
            detail: 'Used only to score your guess against the themes.',
          })
        }
        score = await scoreReading(names, result, current.kind, (done, total) => {
          if (runId.current !== token) return
          setPhase({ type: 'finishing', label: `Scoring the guess · ${done} of ${total}` })
        })
      }
      result.biography.closingLine =
        result.records.length === 0
          ? 'The sensitive-text check kept the whole set back. Only the count remains.'
          : score
            ? closingForScore(score.matchedCount, score.guessCount)
            : 'Here is what you keep saving.'
      const keep = new Set(result.records.map((record) => record.id))
      for (const id of [...blobs.current.keys()]) if (!keep.has(id)) blobs.current.delete(id)
      for (const id of [...images.current.keys()]) if (!keep.has(id)) images.current.delete(id)
      if (runId.current !== token) return
      setPhase({
        type: 'reveal',
        model: {
          result,
          score,
          guesses: names,
          kind: current.kind,
          note: current.note,
          kept: false,
        },
      })
    } catch (error) {
      console.error('Lore failed during lore', error)
      if (runId.current !== token) return
      const detail = error instanceof Error ? error.message : ''
      const download = /fetch|network|failed to fetch|huggingface|http/i.test(detail)
      setPhase({
        type: 'error',
        step: 3,
        message: download
          ? "The picture model didn't download. Check your connection and try again."
          : 'The reading stopped on this computer. Nothing was uploaded.',
      })
    } finally {
      finishing.current = false
    }
  }, [])

  const beginOwn = useCallback(
    async (files: PreparedFile[], note: string) => {
      const token = runId.current
      loreRun.current?.cancel()
      loreRun.current = null
      loreCache.current = null
      revoke()
      blobs.current = new Map(files.map((file) => [file.id, file.blob]))
      images.current.clear()
      readyRef.current = false
      pickingRef.current = !pending.current
      setPhase({
        type: 'guess',
        kind: 'own',
        ready: false,
        holding: Boolean(pending.current),
        picking: pickingRef.current,
        progress: {
          label: backgroundSentence('words', 0, files.length),
          detail: backgroundSentence('words', 0, files.length),
          done: 0,
          total: files.length,
        },
        note,
      })
      const paint = (kind: 'words' | 'model' | 'pictures' | 'ready', done: number, total: number) => {
        if (runId.current !== token) return
        const safeTotal = kind === 'model' ? 100 : Math.max(0, total)
        const safeDone = clampCount(done, safeTotal)
        const sentence = backgroundSentence(kind, safeDone, safeTotal)
        setPhase({
          type: 'guess',
          kind: 'own',
          ready: kind === 'ready',
          holding: Boolean(pending.current),
          picking: pickingRef.current,
          progress: { label: sentence, detail: sentence, done: safeDone, total: safeTotal },
          note,
        })
      }
      loreCache.current = null
      const run = startBackgroundReading<CachedLore>(async (report, alive) => {
        const say = (kind: 'words' | 'model' | 'pictures' | 'ready', done: number, total: number) => {
          const sentence = backgroundSentence(kind, done, total)
          report({ label: sentence, done, total })
          paint(kind, done, total)
        }
        void import('./pipeline/vision.ts')
          .then(({ preloadVision }) =>
            preloadVision((loaded, total) => {
              if (!alive() || total <= 0 || loaded >= total) return
              say('model', Math.min(100, Math.round((loaded / total) * 100)), 100)
            }),
          )
          .catch((error) => console.error('Lore failed during model', error))
        const { recognizeAll } = await import('./pipeline/ocr.ts')
        const concurrency = navigator.hardwareConcurrency > 4 ? 3 : 2
        const recognized = await recognizeAll(
          files.map((file) => ({ id: file.id, blob: file.blob })),
          (done, total) => say('words', done, total),
          concurrency,
          alive,
        )
        if (!alive()) return null as unknown as CachedLore
        const textOf = new Map(recognized.map((item) => [item.id, item]))
        const shots: InputShot[] = files.map((file) => {
          const read = textOf.get(file.id)
          return {
            id: file.id,
            timestamp: file.timestamp,
            timestampSource: file.timestampSource,
            text: read?.cleanText ?? '',
            sensitiveText: read?.text ?? '',
          }
        })
        job.current = { kind: 'own', note, shots }
        const { classifyImages } = await import('./pipeline/vision.ts')
        say('pictures', 0, files.length)
        const visual = await classifyImages(
          files.map((file) => ({ id: file.id, blob: file.blob })),
          {
            shouldContinue: alive,
            onImage: (done, total) => say('pictures', done, total),
          },
        )
        if (!alive()) return null as unknown as CachedLore
        await new Promise((resolve) => setTimeout(resolve, 0))
        const result = await analyzeShots(shots, {
          perceive: async () => visual,
          runDate: new Date().toISOString(),
        })
        return { result, visual, shots }
      })
      loreRun.current = run
      run.start()
      try {
        const cached = await run.result()
        if (runId.current !== token || !cached) return
        loreCache.current = cached
        readyRef.current = true
        paint('ready', files.length, files.length)
        if (pending.current) await finish()
      } catch (error) {
        console.error('Lore failed during lore', error)
        if (runId.current !== token) return
        const detail = error instanceof Error ? error.message : ''
        const download = /fetch|network|failed to fetch|lang|traineddata|huggingface/i.test(detail)
        setPhase({
          type: 'error',
          step: 2,
          message: download
            ? "The picture reader didn't download. Check your connection and try again."
            : 'The reading stopped on this computer. Nothing was uploaded.',
        })
      }
    },
    [finish, revoke],
  )

  const startSample = useCallback(async () => {
    const token = ++runId.current
    pending.current = null
    finishing.current = false
    readyRef.current = false
    loreRun.current?.cancel()
    loreRun.current = null
    loreCache.current = null
    revoke()
    blobs.current.clear()
    images.current = new Map(SAMPLE_SHOTS.map((shot) => [shot.id, sampleImageUrl(shot.id)]))
    const shots: InputShot[] = SAMPLE_SHOTS.map((shot) => ({
      id: shot.id,
      timestamp: shot.timestamp,
      timestampSource: shot.timestampSource,
      text: sampleText(shot),
    }))
    job.current = { kind: 'sample', shots, note: SAMPLE_NOTE }
    const total = shots.length
    pickingRef.current = true
    loreCache.current = null
    const run = startBackgroundReading<CachedLore>(async (_report, alive) => {
      if (!alive()) return null as unknown as CachedLore
      const result = await analyzeShots(shots, { runDate: new Date().toISOString() })
      return { result, visual: new Map(), shots }
    })
    loreRun.current = run
    run.start()
    setPhase({
      type: 'guess',
      kind: 'sample',
      ready: false,
      holding: false,
      picking: true,
      progress: {
        label: backgroundSentence('words', 0, total),
        detail: backgroundSentence('words', 0, total),
        done: 0,
        total,
      },
      note: SAMPLE_NOTE,
    })
    const cached = await run.result()
    if (runId.current !== token || !cached) return
    loreCache.current = cached
    readyRef.current = true
    const readyLine = backgroundSentence('ready', total, total)
    setPhase({
      type: 'guess',
      kind: 'sample',
      ready: true,
      holding: Boolean(pending.current),
      picking: pickingRef.current,
      progress: { label: readyLine, detail: readyLine, done: total, total },
      note: SAMPLE_NOTE,
    })
    if (pending.current) await finish()
  }, [finish, revoke])

  const startFiles = useCallback(
    async (files: File[], alreadyUnreadable = 0) => {
      const token = ++runId.current
      pending.current = null
      finishing.current = false
      readyRef.current = false
      loreRun.current?.cancel()
      loreRun.current = null
      loreCache.current = null
      revoke()
      blobs.current.clear()
      images.current.clear()
      void import('./pipeline/vision.ts')
        .then(({ preloadVision }) => preloadVision())
        .catch((error) => console.error('Lore failed during model', error))
      void import('./pipeline/embed.ts')
        .then(({ preloadEmbed }) => preloadEmbed())
        .catch((error) => console.error('Lore failed during model', error))
      const incoming = Array.from(files ?? [])
      if (incoming.length === 0) {
        const count = alreadyUnreadable
        setPhase({
          type: 'error',
          step: 1,
          message: count > 0 ? `Couldn't read ${count} file${count === 1 ? '' : 's'}.` : 'Choose a PNG, JPG, or HEIC picture.',
        })
        return
      }
      setPhase({ type: 'preparing', progress: { label: 'Checking the files', done: 0, total: Math.max(incoming.length, 1) } })
      try {
        const prepared = await prepareFiles(
          incoming,
          (done, total, label) => {
            if (runId.current !== token) return
            setPhase({ type: 'preparing', progress: { label, done, total } })
          },
          () => runId.current === token,
        )
        if (runId.current !== token) return
        const unreadable = prepared.unreadable + alreadyUnreadable
        if (prepared.files.length === 0) {
          setPhase({
            type: 'error',
            step: 1,
            message:
              unreadable > 0
                ? `Couldn't read ${unreadable} file${unreadable === 1 ? '' : 's'}.`
                : 'Choose a PNG, JPG, or HEIC picture.',
          })
          return
        }
        const bits = [
          prepared.duplicates ? `Removed ${prepared.duplicates} duplicate${prepared.duplicates === 1 ? '' : 's'}.` : '',
          unreadable ? `Couldn't read ${unreadable} file${unreadable === 1 ? '' : 's'}.` : '',
          prepared.skipped ? `Skipped ${prepared.skipped} that were not images.` : '',
        ].filter(Boolean)
        const note = bits.join(' ')
        if (prepared.files.length > MAX_SHOTS) {
          setPhase({ type: 'range', files: prepared.files, note })
          return
        }
        await beginOwn(prepared.files, note)
      } catch (error) {
        console.error('Lore failed during open', error)
        if (runId.current !== token) return
        setPhase({
          type: 'error',
          step: 1,
          message: "Couldn't open those pictures. Nothing was uploaded.",
        })
      }
    },
    [beginOwn, revoke],
  )

  const failOpen = useCallback((message: string) => {
    console.error('Lore failed during open', message)
    setPhase({ type: 'error', step: 1, message })
  }, [])

  const startDrop = useCallback(
    async (data: DataTransfer) => {
      try {
        const files = await filesFromDataTransfer(data)
        await startFiles(files)
      } catch (error) {
        console.error('Lore failed during open', error)
        setPhase({ type: 'error', step: 1, message: "Couldn't read that folder." })
      }
    },
    [startFiles],
  )

  const confirmRange = useCallback(
    async (files: PreparedFile[]) => {
      const current = phaseRef.current
      const note = current.type === 'range' ? current.note : ''
      await beginOwn(files, note)
    },
    [beginOwn],
  )

  const showPicker = useCallback(() => {
    pickingRef.current = false
    const current = phaseRef.current
    if (current.type === 'guess') setPhase({ ...current, picking: false })
  }, [])

  const skipGuess = useCallback(async () => {
    pickingRef.current = false
    pending.current = { guesses: [], block: '' }
    if (readyRef.current) {
      await finish()
      return
    }
    const current = phaseRef.current
    if (current.type === 'guess') setPhase({ ...current, picking: false, holding: true })
  }, [finish])

  const submitGuess = useCallback(
    async (guesses: string[], block: string) => {
      pending.current = { guesses, block }
      if (readyRef.current) {
        await finish()
        return
      }
      const current = phaseRef.current
      if (current.type === 'guess') {
        setPhase({ ...current, holding: true })
      }
    },
    [finish],
  )

  const setKept = useCallback(async (on: boolean) => {
    const current = phaseRef.current
    if (current.type !== 'reveal') return
    if (!on) {
      await forgetAll().catch(() => {})
      setSaved(null)
      setPhase({ type: 'reveal', model: { ...current.model, kept: false } })
      return
    }
    const reading: SavedReading = {
      version: 1,
      savedAt: new Date().toISOString(),
      kind: current.model.kind,
      result: current.model.result,
      guesses: current.model.guesses,
      score: current.model.score,
    }
    try {
      await saveReading(reading)
      setSaved(reading)
      setPhase({ type: 'reveal', model: { ...current.model, kept: true } })
    } catch {
      setPhase({
        type: 'reveal',
        model: { ...current.model, kept: false },
      })
    }
  }, [])

  const openSaved = useCallback(() => {
    if (!saved) return
    revoke()
    blobs.current.clear()
    images.current.clear()
    if (saved.kind === 'sample') {
      for (const shot of SAMPLE_SHOTS) images.current.set(shot.id, sampleImageUrl(shot.id))
    }
    setPhase({
      type: 'reveal',
      model: {
        result: saved.result,
        score: saved.score,
        guesses: saved.guesses,
        kind: saved.kind,
        note: saved.kind === 'sample' ? SAMPLE_NOTE : 'Images from that session were not kept. The reading was.',
        kept: true,
      },
    })
  }, [revoke, saved])

  const readAnother = useCallback(() => {
    runId.current += 1
    pending.current = null
    pickingRef.current = true
    finishing.current = false
    readyRef.current = false
    loreRun.current?.cancel()
    loreRun.current = null
    loreCache.current = null
    job.current = null
    revoke()
    blobs.current.clear()
    images.current.clear()
    setPhase({ type: 'landing' })
  }, [revoke])

  const forget = useCallback(async () => {
    runId.current += 1
    pending.current = null
    pickingRef.current = true
    finishing.current = false
    readyRef.current = false
    loreRun.current?.cancel()
    loreRun.current = null
    loreCache.current = null
    job.current = null
    revoke()
    blobs.current.clear()
    images.current.clear()
    await forgetAll().catch(() => {})
    setSaved(null)
    setConfirming(false)
    setPhase({ type: 'landing' })
  }, [revoke])

  return {
    phase,
    saved,
    confirming,
    setConfirming,
    resolveImage,
    startSample,
    startFiles,
    startDrop,
    failOpen,
    confirmRange,
    submitGuess,
    showPicker,
    skipGuess,
    setKept,
    openSaved,
    readAnother,
    forget,
  }
}
