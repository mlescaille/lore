import { aggregateVision, visionPrompts } from './catalog.ts'
import { CLIP_MAX_WIDTH, scaleImage } from './scale.ts'
import type { VisualHit } from './signals.ts'
import { recordTime, timed } from './timing.ts'

/**
 * Small CLIP-style model, split into a text tower and a vision tower.
 * The text tower is quantized (~43 MB). The vision tower stays full precision (~46 MB);
 * the quantized vision file mislabels ordinary photos. Tokenizer is about 2 MB.
 * Downloaded once and run on this device. The pipeline helper cannot load
 * this checkpoint: it has no merged model file.
 */
export const VISION_MODEL_ID = 'Xenova/mobileclip_s0'

export interface VisionStats {
  modelId: string
  bytes: number
  milliseconds: number
}

interface ProgressEvent {
  status?: string
  name?: string
  file?: string
  loaded?: number
  total?: number
}

export interface ClassifyHooks {
  onDownload?: (loaded: number, total: number) => void
  onImage?: (done: number, total: number) => void
  shouldContinue?: () => boolean
}

interface Towers {
  labels: string[]
  scoreImage: (blob: Blob) => Promise<{ label: string; score: number }[]>
}

let loader: Promise<Towers> | null = null
let stats: VisionStats | null = null

export function visionModelStats(): VisionStats | null {
  return stats
}

function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node) && typeof window === 'undefined' && typeof DedicatedWorkerGlobalScope === 'undefined'
}

/** WebGPU in the browser when a GPU is present. Otherwise wasm. Node tests stay on cpu. */
async function runtimeDevice(): Promise<'webgpu' | 'wasm' | 'cpu'> {
  if (isNodeRuntime()) return 'cpu'
  if (typeof navigator !== 'undefined' && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter()
      if (adapter) return 'webgpu'
    } catch (error) {
      console.error('Lore failed during model', error)
    }
  }
  return 'wasm'
}

async function createTowers(onDownload?: (loaded: number, total: number) => void): Promise<Towers> {
  return timed('mobileclip-init', () => loadTowers(onDownload))
}

async function loadTowers(onDownload?: (loaded: number, total: number) => void, forceWasm = false): Promise<Towers> {
  const started = performance.now()
  const { AutoProcessor, AutoTokenizer, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, dot, env } =
    await import('@huggingface/transformers')
  env.allowLocalModels = false
  if (typeof caches !== 'undefined') env.useBrowserCache = true

  const files = new Map<string, { loaded: number; total: number }>()
  const progress_callback = (info: ProgressEvent) => {
    if (info.status !== 'progress' || !info.file || !info.total) return
    files.set(`${info.name ?? ''}:${info.file}`, { loaded: info.loaded ?? 0, total: info.total })
    let loaded = 0
    let total = 0
    for (const file of files.values()) {
      loaded += file.loaded
      total += file.total
    }
    onDownload?.(loaded, total)
  }

  const prompts = visionPrompts()
  const labels = prompts.map((item) => item.prompt)
  const embedded = prompts.map((item) => item.text)
  const device = forceWasm ? (isNodeRuntime() ? 'cpu' : 'wasm') : await runtimeDevice()
  const textOptions = { dtype: 'q8' as const, device, progress_callback }
  const visionOptions = { dtype: 'fp32' as const, device, progress_callback }

  let tokenizer
  let textModel
  let processor
  let visionModel
  try {
    ;[tokenizer, textModel, processor, visionModel] = await Promise.all([
    AutoTokenizer.from_pretrained(VISION_MODEL_ID, { progress_callback }),
    CLIPTextModelWithProjection.from_pretrained(VISION_MODEL_ID, textOptions),
    AutoProcessor.from_pretrained(VISION_MODEL_ID, { progress_callback }),
    CLIPVisionModelWithProjection.from_pretrained(VISION_MODEL_ID, visionOptions),
    ])
  } catch (error) {
    if (!forceWasm && device === 'webgpu') {
      console.error('Lore failed during model', error)
      return loadTowers(onDownload, true)
    }
    throw error
  }

  const textInputs = tokenizer(embedded, { padding: 'max_length', truncation: true })
  const textOutput = await textModel(textInputs)
  const textEmbeds = textOutput.text_embeds.normalize().tolist() as number[][]
  textModel.dispose?.()

  let bytes = 0
  for (const file of files.values()) bytes += file.total
  stats = { modelId: VISION_MODEL_ID, bytes, milliseconds: Math.round(performance.now() - started) }
    console.info(
    `Lore vision model ready: ${(stats.bytes / 1e6).toFixed(1)} MB in ${(stats.milliseconds / 1000).toFixed(1)}s on ${device} (${VISION_MODEL_ID})`,
  )

  return {
    labels,
    async scoreImage(blob: Blob) {
      const prepared = await timed('resize-clip', () => scaleImage(blob, CLIP_MAX_WIDTH))
      return timed('clip-image', async () => {
        const image = await RawImage.read(prepared)
        const imageInputs = await processor(image)
        const visionOutput = await visionModel(imageInputs)
        const [vector] = visionOutput.image_embeds.normalize().tolist() as number[][]
        const logits = textEmbeds.map((embed) => 100 * dot(vector ?? [], embed))
        return labels.map((label, index) => ({ label, score: Number(logits[index] ?? 0) }))
      })
    },
  }
}

function inPage(): boolean {
  return typeof window !== 'undefined' && typeof Worker !== 'undefined'
}

let workerPromise: Promise<Worker> | null = null

function startVisionWorker(onDownload?: (loaded: number, total: number) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./vision.worker.ts', import.meta.url), { type: 'module' })
      const listen = (event: MessageEvent) => {
        const data = event.data as { type?: string; loaded?: number; total?: number; message?: string; name?: string; ms?: number }
        if (data.type === 'time' && data.name && typeof data.ms === 'number') recordTime(data.name, data.ms)
        if (data.type === 'download' && data.total) onDownload?.(data.loaded ?? 0, data.total)
        if (data.type === 'ready') {
          worker.removeEventListener('message', listen)
          resolve(worker)
        }
        if (data.type === 'error') {
          worker.removeEventListener('message', listen)
          workerPromise = null
          reject(new Error(data.message || 'The picture reader failed.'))
        }
      }
      worker.addEventListener('message', listen)
      worker.postMessage({ type: 'init' })
    })
  }
  return workerPromise
}

function towersFor(onDownload?: (loaded: number, total: number) => void): Promise<Towers> {
  if (!loader) {
    loader = createTowers(onDownload).catch((error) => {
      loader = null
      throw error
    })
  }
  return loader
}

export function preloadVision(onDownload?: (loaded: number, total: number) => void): Promise<Towers | void> {
  if (inPage()) return startVisionWorker(onDownload).then(() => undefined)
  return towersFor(onDownload)
}

/** Used by the vision worker. The page itself does not run the model. */
export async function scoreOneImage(blob: Blob): Promise<{ label: string; score: number }[]> {
  const towers = await towersFor()
  return towers.scoreImage(blob)
}

/**
 * Zero-shot labels for shots that already survived exclusion.
 * Images are read locally. Nothing is uploaded.
 */
async function classifyInWorker(
  items: { id: string; blob: Blob }[],
  hooks: ClassifyHooks,
): Promise<Map<string, VisualHit[]>> {
  const worker = await startVisionWorker(hooks.onDownload)
  const scores = new Map<string, VisualHit[]>()
  if (items.length === 0) return scores
  await new Promise<void>((resolve, reject) => {
    const listen = (event: MessageEvent) => {
      const data = event.data as {
        type?: string
        id?: string
        rows?: { label: string; score: number }[]
        done?: number
        total?: number
        message?: string
        name?: string
        ms?: number
      }
      if (data.type === 'time' && typeof data.ms === 'number' && data.name) recordTime(data.name, data.ms)
      if (data.type === 'score' && data.id) {
        scores.set(data.id, aggregateVision(data.rows ?? []))
        hooks.onImage?.(data.done ?? scores.size, data.total ?? items.length)
      }
      if (data.type === 'done') {
        worker.removeEventListener('message', listen)
        resolve()
      }
      if (data.type === 'error') {
        worker.removeEventListener('message', listen)
        reject(new Error(data.message || 'The picture reader failed.'))
      }
    }
    worker.addEventListener('message', listen)
    if (hooks.shouldContinue && !hooks.shouldContinue()) {
      worker.postMessage({ type: 'cancel' })
      worker.removeEventListener('message', listen)
      resolve()
      return
    }
    worker.postMessage({ type: 'batch', items })
  })
  return scores
}

export async function classifyImages(
  items: { id: string; blob: Blob }[],
  hooks: ClassifyHooks = {},
): Promise<Map<string, VisualHit[]>> {
  if (inPage()) return classifyInWorker(items, hooks)
  const towers = await towersFor(hooks.onDownload)
  const scores = new Map<string, VisualHit[]>()
  for (let index = 0; index < items.length; index++) {
    if (hooks.shouldContinue && !hooks.shouldContinue()) break
    const item = items[index]
    if (!item) continue
    try {
      const rows = await towers.scoreImage(item.blob)
      scores.set(item.id, aggregateVision(rows))
    } catch (error) {
      console.error('Lore failed during model', item.id, error)
      scores.set(item.id, [])
    }
    hooks.onImage?.(index + 1, items.length)
  }
  return scores
}
