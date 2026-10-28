import { dateFromExif, resolveTimestamp, type TimestampSource } from './timestamps.ts'

export interface PreparedFile {
  id: string
  filename: string
  blob: Blob
  timestamp: string
  timestampSource: TimestampSource
}

export interface PrepareResult {
  files: PreparedFile[]
  duplicates: number
  unreadable: number
  skipped: number
}

const EXT = /\.(png|jpe?g|heic|heif)$/i

export function isImageFile(file: { type?: unknown; name?: unknown } | null | undefined): boolean {
  if (!file) return false
  const type = typeof file.type === 'string' ? file.type.toLowerCase() : ''
  const name = typeof file.name === 'string' ? file.name : ''
  return (
    type === 'image/png' ||
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    EXT.test(name)
  )
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  return type.includes('heic') || type.includes('heif') || /\.hei[cf]$/i.test(file.name)
}

async function fileId(file: File): Promise<string> {
  const bytes = await file.arrayBuffer()
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    try {
      const digest = await subtle.digest('SHA-256', bytes)
      return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    } catch (error) {
      console.error('Lore failed during open', file.name, error)
    }
  }
  let hash = 2166136261
  const view = new Uint8Array(bytes)
  for (let index = 0; index < view.length; index += 97) {
    hash ^= view[index]
    hash = Math.imul(hash, 16777619)
  }
  return `file-${(hash >>> 0).toString(16)}-${view.length}`
}

async function toBitmap(file: File): Promise<Blob> {
  if (!isHeic(file)) return file
  const heic2any = (await import('heic2any')).default
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.82 })
  return Array.isArray(converted) ? converted[0] : converted
}

export async function prepareFiles(
  files: ArrayLike<File>,
  onProgress?: (done: number, total: number, label: string) => void,
  shouldContinue: () => boolean = () => true,
): Promise<PrepareResult> {
  const list = Array.from(files ?? [])
  const images = list.filter((file) => isImageFile(file))
  const skipped = list.length - images.length
  const seen = new Set<string>()
  const prepared: PreparedFile[] = []
  let duplicates = 0
  let unreadable = 0
  let exifr: typeof import('exifr') | null = null
  try {
    exifr = await import('exifr')
  } catch (error) {
    console.error('Lore failed during dates', error)
  }

  for (let index = 0; index < images.length; index++) {
    if (!shouldContinue()) break
    const file = images[index]
    onProgress?.(index, images.length, index === 0 ? 'Checking for duplicates' : 'Reading dates')
    try {
      const hash = await fileId(file)
      if (seen.has(hash)) {
        duplicates += 1
        continue
      }
      seen.add(hash)
      let exifDate: Date | null = null
      try {
        const parsed = (await exifr?.default?.parse(file, ['DateTimeOriginal', 'CreateDate', 'ModifyDate'])) as
          | { DateTimeOriginal?: unknown; CreateDate?: unknown; ModifyDate?: unknown }
          | undefined
        exifDate =
          dateFromExif(parsed?.DateTimeOriginal) ??
          dateFromExif(parsed?.CreateDate) ??
          dateFromExif(parsed?.ModifyDate)
      } catch {
        exifDate = null
      }
      const time = resolveTimestamp({ exif: exifDate, filename: file.name, lastModified: file.lastModified })
      const blob = await toBitmap(file)
      prepared.push({
        id: hash.slice(0, 16),
        filename: file.name,
        blob,
        timestamp: time.iso,
        timestampSource: time.source,
      })
    } catch (error) {
      unreadable += 1
      console.error('Lore failed during open', file.name, error)
    }
  }

  onProgress?.(images.length, images.length, 'Dates are in')
  prepared.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.filename.localeCompare(b.filename))
  return { files: prepared, duplicates, unreadable, skipped }
}
