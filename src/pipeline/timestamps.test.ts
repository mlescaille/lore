import { describe, expect, it } from 'vitest'
import { dateFromExif, filenameFromTimestamp, resolveTimestamp, timestampFromFilename } from './timestamps.ts'

function iso(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

describe('timestamp parsing', () => {
  it('reads macOS and iOS screenshot names, including the narrow space before AM/PM', () => {
    expect(iso(timestampFromFilename('Screenshot 2024-03-15 at 9.41.22 PM.png'))).toBe('2024-03-15T21:41:22.000Z')
    expect(iso(timestampFromFilename('Screen Shot 2024-03-15 at 9.41.22 AM.png'))).toBe('2024-03-15T09:41:22.000Z')
    expect(iso(timestampFromFilename(`Screenshot 2025-03-15 at 9.41.22\u202fPM.png`))).toBe('2025-03-15T21:41:22.000Z')
    expect(iso(timestampFromFilename('Screenshot 2024-03-15 at 21.41.22.png'))).toBe('2024-03-15T21:41:22.000Z')
    expect(iso(timestampFromFilename('Screenshot 2024-03-15 at 12.00.00 AM.png'))).toBe('2024-03-15T00:00:00.000Z')
    expect(iso(timestampFromFilename('Screenshot 2024-03-15 at 12.00.00 PM.png'))).toBe('2024-03-15T12:00:00.000Z')
  })

  it('reads iOS IMG_ names and Android screenshot names', () => {
    expect(iso(timestampFromFilename('IMG_20240315_214122.PNG'))).toBe('2024-03-15T21:41:22.000Z')
    expect(iso(timestampFromFilename('Screenshot_20240315-214122.png'))).toBe('2024-03-15T21:41:22.000Z')
    expect(iso(timestampFromFilename('Screenshot_20240315_214122.jpg'))).toBe('2024-03-15T21:41:22.000Z')
    expect(iso(timestampFromFilename('Screenshot_2024-03-15-21-41-22.png'))).toBe('2024-03-15T21:41:22.000Z')
  })

  it('rejects names and dates that are not capture times', () => {
    expect(timestampFromFilename('Screenshot (12).png')).toBeNull()
    expect(timestampFromFilename('notes.jpg')).toBeNull()
    expect(timestampFromFilename('Screenshot 2024-13-01 at 9.41.22 PM.png')).toBeNull()
    expect(timestampFromFilename('Screenshot 2024-02-31 at 9.41.22 PM.png')).toBeNull()
    expect(timestampFromFilename('Screenshot 2024-03-15 at 13.41.22 PM.png')).toBeNull()
  })

  it('round-trips a generated filename', () => {
    const isoStamp = '2025-06-18T12:07:00.000Z'
    expect(timestampFromFilename(filenameFromTimestamp(isoStamp))?.toISOString()).toBe(isoStamp)
  })

  it('prefers EXIF, then the filename, then lastModified as low confidence', () => {
    const exif = resolveTimestamp({
      exif: new Date(Date.UTC(2020, 0, 2, 3, 4, 5)),
      filename: 'Screenshot 2024-03-15 at 9.41.22 PM.png',
      lastModified: Date.UTC(2023, 5, 1),
    })
    expect(exif).toEqual({ iso: '2020-01-02T03:04:05.000Z', source: 'exif', confidence: 'high' })

    const named = resolveTimestamp({
      exif: null,
      filename: 'IMG_20240315_214122.jpg',
      lastModified: Date.UTC(2023, 5, 1),
    })
    expect(named.source).toBe('filename')
    expect(named.confidence).toBe('high')
    expect(named.iso).toBe('2024-03-15T21:41:22.000Z')

    const fallback = resolveTimestamp({
      exif: new Date(Number.NaN),
      filename: 'Screenshot (3).png',
      lastModified: Date.UTC(2023, 5, 1, 8, 30, 0),
    })
    expect(fallback).toEqual({ iso: '2023-06-01T08:30:00.000Z', source: 'lastModified', confidence: 'low' })
  })

  it('parses EXIF date strings', () => {
    expect(dateFromExif('2024:03:15 21:41:22')?.toISOString()).toBe('2024-03-15T21:41:22.000Z')
    expect(dateFromExif('')).toBeNull()
    expect(dateFromExif('not a date')).toBeNull()
  })
})
