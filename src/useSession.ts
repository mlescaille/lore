import { useCallback, useEffect, useRef, useState } from 'react'
import { MAX_SHOTS } from './config.ts'
import { analyzeShots } from './pipeline/analyze.ts'
import { closingForScore } from './pipeline/biography.ts'
import { filesFromDataTransfer } from './pipeline/drop.ts'
import { prepareFiles, type PreparedFile } from './pipeline/ingest.ts'
import { parseBlocklist } from './pipeline/exclusion.ts'
import { assignMatches, scoreGuessesLexically, vectorMatrix, type ScoreResult } from './pipeline/scoring.ts'
import { SAMPLE_SHOTS, sampleText } from './sample/manifest.ts'
import { sampleImageUrl } from './sample/images.ts'
import { forgetAll, loadSaved, saveReading, type SavedReading } from './storage/idb.ts'
import type { InputShot, LoreResult } from './types.ts'

export interface Progress {
  label: string
  done: number
  total: number
  detail?: string
}

export interface RevealModel {
  result: LoreResult
  score: ScoreResult
  guesses: string[]
  kind: 'sample' | 'own'
  note: string
  kept: boolean
}

export type Phase =
  | { type: 'landing' }
  | { type: 'preparing'; progress: Progress }
  | { type: 'range'; files: PreparedFile[]; note: string }
  | { type: 'guess'; kind: 'sample' | 'own'; ready: boolean; progress: Progress; note: string; holding: boolean }
  | { type: 'finishing'; label: string; detail?: string; done?: number; total?: number }
  | { type: 'reveal'; model: RevealModel }
  | { type: 'error'; message: string; step: 1 | 2 | 3 }

interface Job {
  kind: 'sample' | 'own'
  shots: InputShot[]
  note: string
}

const SAMPLE_NOTE =
  'Jules’s pictures ship with the words already read, so this pass skips the optical reader. Your own screenshots are read on this device.'

function pause(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatMb(bytes: number): string {
  const mb = bytes / 1e6
  if (!Number.isFinite(mb) || mb <= 0) return '0 MB'
  return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1)} MB`
}

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
  const readyRef = useRef(false)
  const finishing = useRef(false)
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
    if (finishing.current || !readyRef.current) return
    const guess = pending.current
    const current = job.current
    if (!guess || !current) return
    finishing.current = true
    const token = runId.current
    try {
      setPhase({ type: 'finishing', label: 'Setting aside anything sensitive' })
      await pause(280)
      if (runId.current !== token) return
      const perceive =
        current.kind === 'own'
          ? async (ids: string[]) => {
              const items = ids.flatMap((id) => {
                const blob = blobs.current.get(id)
                return blob ? [{ id, blob }] : []
              })
              const { classifyImages } = await import('./pipeline/vision.ts')
              setPhase({
                type: 'finishing',
                label: 'Looking at the pictures',
                detail: 'The vision model stays on this device. Nothing is uploaded.',
                done: 0,
                total: Math.max(items.length, 1),
              })
              return classifyImages(items, {
                onDownload: (loaded, total) => {
                  if (runId.current !== token) return
                  const pct = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
                  setPhase({
                    type: 'finishing',
                    label: 'Loading the vision model',
                    detail: total > 0 ? `${formatMb(loaded)} of ${formatMb(total)}. It stays on this device.` : 'It stays on this device.',
                    done: pct,
                    total: 100,
                  })
                },
                onImage: (done, total) => {
                  if (runId.current !== token) return
                  setPhase({
                    type: 'finishing',
                    label: 'Looking at the pictures',
                    detail: 'The vision model stays on this device. Nothing is uploaded.',
                    done,
                    total,
                  })
                },
              })
            }
          : undefined
      if (!perceive) {
        setPhase({ type: 'finishing', label: 'Finding the patterns' })
        await pause(420)
      }
      if (runId.current !== token) return
      const result = await analyzeShots(current.shots, {
        blocklist: parseBlocklist(guess.block),
        perceive,
        runDate: new Date().toISOString(),
      })
      if (runId.current !== token) return
      if (current.kind === 'own') {
        setPhase({
          type: 'finishing',
          label: 'Loading a small meaning model. It stays on this device.',
          detail: 'Used only to score your guess against the themes.',
        })
      } else {
        setPhase({ type: 'finishing', label: 'Writing the biography' })
      }
      const score = await scoreReading(guess.guesses, result, current.kind, (done, total) => {
        if (runId.current !== token) return
        setPhase({ type: 'finishing', label: `Scoring the guess · ${done} of ${total}` })
      })
      result.biography.closingLine =
        result.records.length === 0
          ? 'The sensitive-text check kept the whole set back. Only the count remains.'
          : closingForScore(score.matchedCount, score.guessCount)
      const keep = new Set(result.records.map((record) => record.id))
      for (const id of [...blobs.current.keys()]) if (!keep.has(id)) blobs.current.delete(id)
      for (const id of [...images.current.keys()]) if (!keep.has(id)) images.current.delete(id)
      await pause(320)
      if (runId.current !== token) return
      setPhase({
        type: 'reveal',
        model: {
          result,
          score,
          guesses: guess.guesses.map((item) => item.trim()).filter(Boolean),
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
      revoke()
      blobs.current = new Map(files.map((file) => [file.id, file.blob]))
      images.current.clear()
      readyRef.current = false
      setPhase({
        type: 'guess',
        kind: 'own',
        ready: false,
        holding: Boolean(pending.current),
        progress: { label: 'Reading the words', done: 0, total: files.length },
        note,
      })
      let wordsReady = false
      let ocrSnap = { done: 0, total: files.length }
      let visionSnap = { loaded: 0, total: 0 }
      const paintGuess = () => {
        if (runId.current !== token || wordsReady) return
        const downloading = visionSnap.total > 0 && visionSnap.loaded < visionSnap.total
        if (downloading) {
          const pct = Math.min(100, Math.round((visionSnap.loaded / visionSnap.total) * 100))
          setPhase({
            type: 'guess',
            kind: 'own',
            ready: false,
            holding: Boolean(pending.current),
            progress: {
              label: 'Loading the vision model',
              detail: `${formatMb(visionSnap.loaded)} of ${formatMb(visionSnap.total)}. Downloaded once, then it stays on this device.`,
              done: pct,
              total: 100,
            },
            note,
          })
          return
        }
        setPhase({
          type: 'guess',
          kind: 'own',
          ready: false,
          holding: Boolean(pending.current),
          progress: { label: 'Reading the words', done: ocrSnap.done, total: ocrSnap.total },
          note,
        })
      }
      const visionReady = import('./pipeline/vision.ts')
        .then(({ preloadVision }) =>
          preloadVision((loaded, total) => {
            visionSnap = { loaded, total }
            paintGuess()
          }),
        )
        .catch((error) => {
          console.error('Lore failed during model', error)
          return undefined
        })
      try {
        const { recognizeAll } = await import('./pipeline/ocr.ts')
        const concurrency = navigator.hardwareConcurrency > 4 ? 3 : 2
        const recognized = await recognizeAll(
          files.map((file) => ({ id: file.id, blob: file.blob })),
          (done, total) => {
            ocrSnap = { done, total }
            paintGuess()
          },
          concurrency,
          () => runId.current === token,
        )
        if (runId.current !== token) return
        const textOf = new Map(recognized.map((item) => [item.id, item]))
        job.current = {
          kind: 'own',
          note,
          shots: files.map((file) => {
            const read = textOf.get(file.id)
            return {
              id: file.id,
              timestamp: file.timestamp,
              timestampSource: file.timestampSource,
              text: read?.cleanText ?? '',
              sensitiveText: read?.text ?? '',
            }
          }),
        }
        wordsReady = true
        if (runId.current !== token) return
        if (visionSnap.total > 0 && visionSnap.loaded < visionSnap.total) {
          const pct = Math.min(100, Math.round((visionSnap.loaded / visionSnap.total) * 100))
          setPhase({
            type: 'guess',
            kind: 'own',
            ready: false,
            holding: Boolean(pending.current),
            progress: {
              label: 'Loading the vision model',
              detail: `${formatMb(visionSnap.loaded)} of ${formatMb(visionSnap.total)}. Downloaded once, then it stays on this device.`,
              done: pct,
              total: 100,
            },
            note,
          })
        }
        await visionReady
        if (runId.current !== token) return
        readyRef.current = true
        setPhase({
          type: 'guess',
          kind: 'own',
          ready: true,
          holding: Boolean(pending.current),
          progress: { label: 'Ready when you are', done: files.length, total: files.length },
          note,
        })
        if (pending.current) await finish()
      } catch (error) {
        console.error('Lore failed during words', error)
        if (runId.current !== token) return
        const detail = error instanceof Error ? error.message : ''
        const download = /fetch|network|failed to fetch|lang|traineddata/i.test(detail)
        setPhase({
          type: 'error',
          step: 2,
          message: download
            ? "The text reader didn't download. Check your connection and try again."
            : 'The text reader didn’t start. It downloads a language file once, then stays on this computer.',
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
    setPhase({
      type: 'guess',
      kind: 'sample',
      ready: false,
      holding: false,
      progress: { label: 'Opening the sample roll', done: 0, total },
      note: SAMPLE_NOTE,
    })
    for (let done = 4; done <= total; done += 4) {
      await pause(45)
      if (runId.current !== token) return
      setPhase({
        type: 'guess',
        kind: 'sample',
        ready: false,
        holding: Boolean(pending.current),
        progress: { label: 'Opening the sample roll', done: Math.min(done, total), total },
        note: SAMPLE_NOTE,
      })
    }
    if (runId.current !== token) return
    readyRef.current = true
    setPhase({
      type: 'guess',
      kind: 'sample',
      ready: true,
      holding: Boolean(pending.current),
      progress: { label: 'Ready when you are', done: total, total },
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
      revoke()
      blobs.current.clear()
      images.current.clear()
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

  const submitGuess = useCallback(
    async (guesses: string[], block: string) => {
      pending.current = { guesses, block }
      const current = phaseRef.current
      if (current.type === 'guess') {
        setPhase({ ...current, holding: true })
      }
      if (readyRef.current) await finish()
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
    finishing.current = false
    readyRef.current = false
    job.current = null
    revoke()
    blobs.current.clear()
    images.current.clear()
    setPhase({ type: 'landing' })
  }, [revoke])

  const forget = useCallback(async () => {
    runId.current += 1
    pending.current = null
    finishing.current = false
    readyRef.current = false
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
    setKept,
    openSaved,
    readAnother,
    forget,
  }
}
