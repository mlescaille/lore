import { aggregateVision, VISION_TEMPLATE, visionPrompts } from './catalog.ts'
import type { VisualHit } from './signals.ts'

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

function runtimeDevice(): 'wasm' | 'cpu' {
  return typeof document === 'undefined' ? 'cpu' : 'wasm'
}

async function createTowers(onDownload?: (loaded: number, total: number) => void): Promise<Towers> {
  const started = performance.now()
  const { AutoProcessor, AutoTokenizer, CLIPTextModelWithProjection, CLIPVisionModelWithProjection, RawImage, dot, env, softmax } =
    await import('@huggingface/transformers')
  env.allowLocalModels = false

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
  const textOptions = { dtype: 'q8' as const, device: runtimeDevice(), progress_callback }
  const visionOptions = { dtype: 'fp32' as const, device: runtimeDevice(), progress_callback }

  const [tokenizer, textModel, processor, visionModel] = await Promise.all([
    AutoTokenizer.from_pretrained(VISION_MODEL_ID, { progress_callback }),
    CLIPTextModelWithProjection.from_pretrained(VISION_MODEL_ID, textOptions),
    AutoProcessor.from_pretrained(VISION_MODEL_ID, { progress_callback }),
    CLIPVisionModelWithProjection.from_pretrained(VISION_MODEL_ID, visionOptions),
  ])

  const textInputs = tokenizer(
    labels.map((label) => VISION_TEMPLATE.replace('{}', label)),
    { padding: 'max_length', truncation: true },
  )
  const textOutput = await textModel(textInputs)
  const textEmbeds = textOutput.text_embeds.normalize().tolist() as number[][]
  textModel.dispose?.()

  let bytes = 0
  for (const file of files.values()) bytes += file.total
  stats = { modelId: VISION_MODEL_ID, bytes, milliseconds: Math.round(performance.now() - started) }
  console.info(
    `Lore vision model ready: ${(stats.bytes / 1e6).toFixed(1)} MB in ${(stats.milliseconds / 1000).toFixed(1)}s (${VISION_MODEL_ID})`,
  )

  return {
    labels,
    async scoreImage(blob: Blob) {
      const image = await RawImage.read(blob)
      const imageInputs = await processor(image)
      const visionOutput = await visionModel(imageInputs)
      const [vector] = visionOutput.image_embeds.normalize().tolist() as number[][]
      const logits = textEmbeds.map((embed) => 100 * dot(vector ?? [], embed))
      const probabilities = softmax(logits)
      return labels.map((label, index) => ({ label, score: Number(probabilities[index] ?? 0) }))
    },
  }
}

export function preloadVision(onDownload?: (loaded: number, total: number) => void): Promise<Towers> {
  if (!loader) {
    loader = createTowers(onDownload).catch((error) => {
      loader = null
      throw error
    })
  }
  return loader
}

/**
 * Zero-shot labels for shots that already survived exclusion.
 * Images are read locally. Nothing is uploaded.
 */
export async function classifyImages(
  items: { id: string; blob: Blob }[],
  hooks: ClassifyHooks = {},
): Promise<Map<string, VisualHit[]>> {
  const towers = await preloadVision(hooks.onDownload)
  const scores = new Map<string, VisualHit[]>()
  for (let index = 0; index < items.length; index++) {
    const item = items[index]
    if (!item) continue
    try {
      const rows = await towers.scoreImage(item.blob)
      scores.set(item.id, aggregateVision(rows))
    } catch {
      scores.set(item.id, [])
    }
    hooks.onImage?.(index + 1, items.length)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
  return scores
}
