import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { isImageFile, prepareFiles } from './ingest.ts'

describe('prepareFiles', () => {
  it('keeps real pictures and skips a text file without throwing', async () => {
    const jpeg = await readFile('fixtures/reading/IMG_20251004_183012.jpg')
    const png = await readFile('fixtures/diagrams/boxes-and-arrows.png')
    const pictures = [
      new File([jpeg], 'IMG_20251004_183012.jpg', { type: 'image/jpeg' }),
      new File([png], 'boxes-and-arrows.png', { type: 'image/png' }),
      new File(['hello'], 'notes.txt', { type: 'text/plain' }),
      null as unknown as File,
    ]
    const prepared = await prepareFiles(pictures)
    expect(prepared.files.map((file) => file.filename).sort()).toEqual(['IMG_20251004_183012.jpg', 'boxes-and-arrows.png'])
    expect(prepared.skipped).toBe(2)
    expect(prepared.files.length).toBe(2)
    expect(isImageFile(null)).toBe(false)
    expect(isImageFile({ type: null, name: 'odd.jpg' })).toBe(true)
  })

  it('does not throw when every picture is unreadable', async () => {
    const broken = new File([new Uint8Array([1, 2, 3])], 'IMG_0001.HEIC', { type: 'image/heic' })
    const prepared = await prepareFiles([broken])
    expect(prepared.files).toEqual([])
    expect(prepared.unreadable).toBe(1)
  })
})
