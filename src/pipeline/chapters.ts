export interface ChapterSlice {
  themeId: string
  recordIds: string[]
  start: string
  end: string
}

function timeValue(iso: string): number {
  const value = new Date(iso).getTime()
  return Number.isNaN(value) ? Number.POSITIVE_INFINITY : value
}

/**
 * Split where a new theme takes a strict lead in the forward window.
 * One-off interruptions stay in the current chapter. Image-only "vibes"
 * never open a chapter on their own unless the whole stretch is vibes.
 */
export function splitChapters<T extends { id: string; timestamp: string; themeId: string }>(
  records: T[],
  windowSize = 4,
): ChapterSlice[] {
  const sorted = [...records].sort((a, b) => timeValue(a.timestamp) - timeValue(b.timestamp) || a.id.localeCompare(b.id))
  if (sorted.length === 0) return []

  const slices: { themeId: string; records: T[] }[] = []
  let current = sorted[0].themeId
  let bucket: T[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const record = sorted[i]
    if (record.themeId === current || record.themeId === 'vibes') {
      bucket.push(record)
      continue
    }
    const ahead = sorted.slice(i, i + windowSize)
    const next = leadingTheme(ahead.map((item) => item.themeId), current)
    if (next) {
      slices.push({ themeId: current, records: bucket })
      current = next
      bucket = [record]
    } else {
      bucket.push(record)
    }
  }
  slices.push({ themeId: current, records: bucket })

  const merged: { themeId: string; records: T[] }[] = []
  for (const slice of slices) {
    const prev = merged[merged.length - 1]
    if (prev && prev.themeId === slice.themeId) prev.records.push(...slice.records)
    else merged.push({ themeId: slice.themeId, records: [...slice.records] })
  }

  return merged.map((slice) => ({
    themeId: slice.themeId,
    recordIds: slice.records.map((record) => record.id),
    start: slice.records[0].timestamp,
    end: slice.records[slice.records.length - 1].timestamp,
  }))
}

function leadingTheme(themeIds: string[], current: string): string | null {
  const substantive = themeIds.filter((id) => id !== 'vibes')
  if (substantive.length === 0) return null
  const counts = new Map<string, number>()
  for (const id of substantive) counts.set(id, (counts.get(id) ?? 0) + 1)
  let best = ''
  let bestN = 0
  for (const [id, n] of counts) {
    if (n > bestN || (n === bestN && id < best)) {
      best = id
      bestN = n
    }
  }
  const currentN = counts.get(current) ?? 0
  if (best !== current && bestN >= 2 && bestN > currentN && bestN * 2 >= substantive.length) return best
  return null
}
