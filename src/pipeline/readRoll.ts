import type { InputShot, LoreResult } from '../types.ts'
import type { VisualHit } from './signals.ts'
import { analyzeShots } from './analyze.ts'
import { recognizeAll } from './ocr.ts'
import { classifyImages } from './vision.ts'
import { scoreTextThemes } from './themes.ts'
import { timed } from './timing.ts'

export interface RollFile {
  id: string
  blob: Blob
  timestamp: string
  timestampSource: InputShot['timestampSource']
}

export interface RollReading {
  result: LoreResult
  visual: Map<string, VisualHit[]>
  shots: InputShot[]
}

/**
 * Words and pictures run together, in the order the files were added.
 * The portrait is returned as soon as both are done. Nothing is uploaded.
 */
export async function readRoll(
  files: RollFile[],
  hooks: {
    alive?: () => boolean
    onWords?: (done: number, total: number) => void
    onPictures?: (done: number, total: number) => void
    onDownload?: (loaded: number, total: number) => void
  } = {},
): Promise<RollReading | null> {
  const alive = hooks.alive ?? (() => true)
  const total = files.length
  const items = files.map((file) => ({ id: file.id, blob: file.blob }))
  const warming = import('./vision.ts')
    .then(({ preloadVision }) => preloadVision(hooks.onDownload))
    .catch((error) => {
      console.error('Lore failed during model', error)
    })
  // Words start immediately, in the order the pictures were added.
  // The picture model only looks at shots whose words do not already name a theme.
  // A locked text theme wins over vision, so skipping the model there does not change the portrait.
  const recognized = await recognizeAll(items, (done) => hooks.onWords?.(done, total), alive)
  if (!alive()) return null
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
  const blobs = new Map(items.map((item) => [item.id, item.blob]))
  const unclear = shots.filter((shot) => {
    const best = scoreTextThemes(shot.text)[0]
    return !best || best.hits < 2
  })
  let visual = new Map<string, VisualHit[]>()
  if (unclear.length > 0) {
    await warming
    if (!alive()) return null
    visual = await classifyImages(
      unclear.map((shot) => ({ id: shot.id, blob: blobs.get(shot.id) ?? new Blob() })),
      {
        shouldContinue: alive,
        onDownload: hooks.onDownload,
        onImage: (done) => hooks.onPictures?.(done, unclear.length),
      },
    )
  }
  const result = await timed('cluster-portrait', () =>
    analyzeShots(shots, {
      perceive: async () => visual,
      runDate: new Date().toISOString(),
    }),
  )
  return { result, visual, shots }
}
