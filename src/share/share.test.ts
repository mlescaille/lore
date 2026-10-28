import { describe, expect, it } from 'vitest'
import { Resvg } from '@resvg/resvg-js'
import { SHARE_URL } from '../config.ts'
import {
  SHARE_FOOTER,
  cardPixels,
  shareCardFromResult,
  shareCardSvg,
  shareSurfaceText,
} from './card.ts'
import {
  buildPostText,
  copyImage,
  copyLink,
  linkedInIntent,
  shareImageFile,
  threadsIntent,
  xIntent,
} from './post.ts'

const OCR = 'Miso butter pasta recipe'
const FILENAME = 'Screenshot 2025-03-14 at 7.41.02 PM.png'

function reading() {
  return {
    biography: { epithet: 'The Recipe Hoarder Who Plans Trips at Midnight' },
    themes: [
      { id: 'recipes', label: 'Recipes', keywords: ['miso butter', 'pasta'], count: 12 },
      { id: 'travel', label: 'Travel', keywords: [FILENAME], count: 8 },
      { id: 'messages', label: 'Messages', keywords: ['gremlins'], count: 4 },
      { id: 'other', label: 'Other', keywords: [], count: 1 },
    ],
    records: [{ id: 'shot-1', text: OCR, filename: FILENAME }],
  }
}

describe('share links', () => {
  it('builds encoded intents for X, Threads, and LinkedIn', () => {
    const text = buildPostText(['Fish & Chips', 'A/B tests'])
    expect(text).toBe('I found my lore: Fish & Chips and A/B tests. Find yours: https://mlescaille.com/lore')

    const x = new URL(xIntent(text, 'https://mlescaille.com/lore?x=1&y=2'))
    expect(x.origin + x.pathname).toBe('https://x.com/intent/post')
    expect(x.searchParams.get('text')).toBe(text)
    expect(x.searchParams.get('url')).toBe('https://mlescaille.com/lore?x=1&y=2')
    expect(x.search).toContain('Fish%20%26%20Chips')
    expect(x.search).not.toContain(OCR)

    const threads = new URL(threadsIntent(text))
    expect(threads.origin + threads.pathname).toBe('https://www.threads.net/intent/post')
    expect(threads.searchParams.get('text')).toBe(text)
    expect(threads.searchParams.get('url')).toBeNull()

    const linked = linkedInIntent()
    expect(linked).toBe(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`)
    expect(linked).not.toContain('Fish')
    expect(linked).not.toContain(OCR)
  })

  it('uses one or two theme names in the post', () => {
    expect(buildPostText(['Recipes'])).toBe('I found my lore: Recipes. Find yours: https://mlescaille.com/lore')
    expect(buildPostText(['Recipes', 'Travel', 'Messages'])).toBe(
      'I found my lore: Recipes and Travel. Find yours: https://mlescaille.com/lore',
    )
    expect(SHARE_URL).toBe('https://mlescaille.com/lore')
  })
})

describe('copy', () => {
  it('copies the Lore link', async () => {
    const written: string[] = []
    const outcome = await copyLink(SHARE_URL, async (value) => {
      written.push(value)
    })
    expect(outcome).toBe('copied')
    expect(written).toEqual(['https://mlescaille.com/lore'])
  })

  it('reports a failed link copy without throwing', async () => {
    const outcome = await copyLink(SHARE_URL, async () => {
      throw new Error('denied')
    })
    expect(outcome).toBe('failed')
  })

  it('copies a PNG, and downloads when image copy is missing', async () => {
    const blob = new Blob([Uint8Array.from([1, 2, 3])], { type: 'image/png' })
    const items: Array<{ data: Record<string, Blob> }> = []
    class FakeItem {
      data: Record<string, Blob>
      constructor(data: Record<string, Blob>) {
        this.data = data
      }
    }
    const copied = await copyImage(blob, 'lore-square.png', {
      ClipboardItem: FakeItem as unknown as typeof ClipboardItem,
      write: async (next) => {
        items.push(...(next as unknown as Array<{ data: Record<string, Blob> }>))
      },
      download: () => {
        throw new Error('should not download')
      },
    })
    expect(copied).toBe('copied')
    expect(items[0]?.data['image/png']).toBe(blob)

    let saved = ''
    const fallback = await copyImage(blob, 'lore-square.png', {
      download: (_blob, filename) => {
        saved = filename
      },
    })
    expect(fallback).toBe('saved')
    expect(saved).toBe('lore-square.png')
  })

  it('shares the image file and does not attach screenshot text', async () => {
    const blob = new Blob([Uint8Array.from([9])], { type: 'image/png' })
    const box: { current: { files: File[]; text?: string } | null } = { current: null }
    const outcome = await shareImageFile(blob, 'lore-story.png', buildPostText(['Recipes', 'Travel']), {
      canShare: (data) => data.files.length === 1 && !('url' in data),
      share: async (data) => {
        box.current = data
      },
      download: () => {
        throw new Error('should not download')
      },
    })
    expect(outcome).toBe('shared')
    expect(box.current?.files).toHaveLength(1)
    expect(box.current?.files[0]?.name).toBe('lore-story.png')
    expect(box.current?.text).toBe('I found my lore: Recipes and Travel. Find yours: https://mlescaille.com/lore')
    expect(JSON.stringify(box.current)).not.toContain(OCR)
  })
})

describe('share card', () => {
  const fonts = {
    fontFiles: ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
    loadSystemFonts: false,
    defaultFontFamily: 'DejaVu Sans',
    sansSerifFamily: 'DejaVu Sans',
  }

  it('draws both sizes and leaves screenshot text out of the picture', () => {
    const secrets = [OCR, FILENAME, 'miso butter', 'IMG_20251004', '.heic']
    for (const size of ['square', 'story'] as const) {
      const model = shareCardFromResult(reading(), { matchedCount: 2, guessCount: 3 }, true, size)
      expect(model.themes).toEqual(['Recipes', 'Travel', 'Messages'])
      expect(model.guessLine).toBe('You got 2 of 3 right.')
      expect(model.footer).toBe(SHARE_FOOTER)
      const surface = shareSurfaceText(model)
      const svg = shareCardSvg(model)
      for (const secret of secrets) {
        expect(surface).not.toContain(secret)
        expect(svg).not.toContain(secret)
      }
      expect(surface).toContain('The Recipe Hoarder Who Plans Trips at Midnight')
      expect(svg).toContain('Recipes')
      expect(svg).toContain('You got 2 of 3 right.')
      expect(svg).toContain('Discover your lore at')
      const png = new Resvg(svg, { font: fonts }).render()
      const { width, height } = cardPixels(size)
      expect(png.width).toBe(width)
      expect(png.height).toBe(height)
      const bytes = png.asPng()
      expect(bytes[0]).toBe(0x89)
      for (const secret of secrets) expect(bytes.includes(Buffer.from(secret))).toBe(false)
    }
  })

  it('omits the guess line when nobody guessed', () => {
    const model = shareCardFromResult(reading(), null, false, 'square')
    expect(model.guessLine).toBeNull()
    expect(shareCardSvg(model)).not.toContain('You got')
    expect(shareSurfaceText(model)).not.toContain(OCR)
  })
})
