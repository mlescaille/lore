export type TimestampSource = 'exif' | 'filename' | 'lastModified'

export interface ResolvedTime {
  iso: string
  source: TimestampSource
  confidence: 'high' | 'low'
}

function validParts(year: number, month: number, day: number, hour: number, minute: number, second: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || hour < 0 || hour > 23 || minute > 59 || second > 59) return null
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return date
}

function fromGroups(groups: string[]): Date | null {
  const [year, month, day, hour, minute, second] = groups.map(Number)
  if ([year, month, day, hour, minute, second].some((n) => Number.isNaN(n))) return null
  return validParts(year, month, day, hour, minute, second)
}

function fromMacName(filename: string): Date | null {
  const base = filename.replace(/\.[a-z0-9]+$/i, '')
  const normalized = base.replace(/[\u202f\u00a0\u2007\u2009]/g, ' ').replace(/\s+/g, ' ').trim()
  const match = normalized.match(
    /^(?:Screenshot|Screen Shot) (\d{4})-(\d{2})-(\d{2}) at (\d{1,2})[.](\d{2})[.](\d{2})(?: ([AP]M))?$/i,
  )
  if (!match) return null
  let hour = Number(match[4])
  const minute = Number(match[5])
  const second = Number(match[6])
  const ampm = match[7]?.toUpperCase()
  if (ampm) {
    if (hour < 1 || hour > 12) return null
    if (ampm === 'AM') hour = hour === 12 ? 0 : hour
    else hour = hour === 12 ? 12 : hour + 12
  }
  return validParts(Number(match[1]), Number(match[2]), Number(match[3]), hour, minute, second)
}

/** EXIF first, then iOS/macOS/Android screenshot names, then the file's lastModified. */
export function timestampFromFilename(filename: string): Date | null {
  const mac = fromMacName(filename)
  if (mac) return mac
  const base = filename.replace(/\.[a-z0-9]+$/i, '')
  const img = base.match(/IMG_(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/)
  if (img) return fromGroups(img.slice(1))
  const android = base.match(/Screenshot_(\d{4})(\d{2})(\d{2})[-_](\d{2})(\d{2})(\d{2})/)
  if (android) return fromGroups(android.slice(1))
  const dashed = base.match(/Screenshot_(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/)
  if (dashed) return fromGroups(dashed.slice(1))
  return null
}

export function filenameFromTimestamp(iso: string): string {
  const date = new Date(iso)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  let hour = date.getUTCHours()
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const second = String(date.getUTCSeconds()).padStart(2, '0')
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour %= 12
  if (hour === 0) hour = 12
  return `Screenshot ${year}-${month}-${day} at ${hour}.${minute}.${second} ${ampm}.png`
}

export function dateFromExif(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
    if (match) {
      return validParts(
        Number(match[1]),
        Number(match[2]),
        Number(match[3]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6]),
      )
    }
    const parsed = new Date(value)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }
  return null
}

export function resolveTimestamp(input: {
  exif?: Date | null
  filename: string
  lastModified: number
}): ResolvedTime {
  if (input.exif && !Number.isNaN(input.exif.getTime())) {
    return { iso: input.exif.toISOString(), source: 'exif', confidence: 'high' }
  }
  const named = timestampFromFilename(input.filename)
  if (named) return { iso: named.toISOString(), source: 'filename', confidence: 'high' }
  return { iso: new Date(input.lastModified).toISOString(), source: 'lastModified', confidence: 'low' }
}
