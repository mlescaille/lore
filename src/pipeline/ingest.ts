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

export function isImageFile(file: File): boolean {
  const type = file.type.toLowerCase()
  return (
    type === 'image/png' ||
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/heic' ||
    type === 'image/heif' ||
    EXT.test(file.name)
  )
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase()
  return type.includes('heic') || type.includes('heif') || /\.hei[cf]$/i.test(file.name)
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function toBitmap(file: File): Promise<Blob> {
  if (!isHeic(file)) return file
  const heic2any = (await import('heic2any')).default
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.82 })
  return Array.isArray(converted) ? converted[0] : converted
}

export async function prepareFiles(
  files: File[],
  onProgress?: (done: number, total: number, label: string) => void,
  shouldContinue: () => boolean = () => true,
): Promise<PrepareResult> {
  const images = files.filter(isImageFile)
  const skipped = files.length - images.length
  const seen = new Set<string>()
  const prepared: PreparedFile[] = []
  let duplicates = 0
  let unreadable = 0
  const exifr = await import('exifr')

  for (let index = 0; index < images.length; index++) {
    if (!shouldContinue()) break
    const file = images[index]
    onProgress?.(index, images.length, index === 0 ? 'Checking for duplicates' : 'Reading dates')
    try {
      const hash = await sha256(file)
      if (seen.has(hash)) {
        duplicates += 1
        continue
      }
      seen.add(hash)
      let exifDate: Date | null = null
      try {
        const parsed = (await exifr.default.parse(file, ['DateTimeOriginal', 'CreateDate', 'ModifyDate'])) as
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
    } catch {
      unreadable += 1
    }
  }

  onProgress?.(images.length, images.length, 'Dates are in')
  prepared.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.filename.localeCompare(b.filename))
  return { files: prepared, duplicates, unreadable, skipped }
}
