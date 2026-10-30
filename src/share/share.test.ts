import { describe, expect, it } from 'vitest'
import { Resvg } from '@resvg/resvg-js'
import { SHARE_URL } from '../config.ts'
import {
  SHARE_FOOTER,
  cardPixels,
  defaultShareSize,
  friendlyThemeName,
  shareCardFromResult,
  shareCardSvg,
  shareSurfaceText,
} from './card.ts'
import {
  LINKEDIN_COMPOSER,
  PICTURE_COPIED,
  PICTURE_SAVED,
  buildPostText,
  copyImage,
  copyLink,
  linkedInComposer,
  pictureNotice,
  presentLore,
  sharePlatform,
  shareWithFile,
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

    const linked = linkedInComposer()
    expect(linked).toBe(LINKEDIN_COMPOSER)
    expect(linked).toBe('https://www.linkedin.com/feed/?shareActive=true')
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

  it('shares the image file with the text and Lore link when the device can share files', async () => {
    const blob = new Blob([Uint8Array.from([9])], { type: 'image/png' })
    const text = buildPostText(['Dinner recipes', 'Lisbon trips'])
    const box: { current: { files: File[]; text: string; url: string } | null } = { current: null }
    let opened = false
    const outcome = await shareWithFile(blob, 'lore-story.png', text, {
      canShare: (data) => data.files.length === 1,
      share: async (data) => {
        box.current = data
      },
      open: () => {
        opened = true
      },
    })
    expect(outcome).toBe('shared')
    expect(opened).toBe(false)
    expect(box.current?.files).toHaveLength(1)
    expect(box.current?.files[0]?.name).toBe('lore-story.png')
    expect(box.current?.files[0]?.type).toBe('image/png')
    expect(box.current?.text).toBe(text)
    expect(box.current?.url).toBe(SHARE_URL)
    expect(JSON.stringify({ text: box.current?.text, url: box.current?.url })).not.toContain(OCR)
  })

  it('saves the picture when the share sheet cannot take a file', async () => {
    const blob = new Blob([Uint8Array.from([7])], { type: 'image/png' })
    let saved = ''
    const outcome = await presentLore(blob, 'lore-square.png', buildPostText(['Dinner recipes']), {
      canShare: () => false,
      download: (_blob, filename) => {
        saved = filename
      },
    })
    expect(outcome).toBe('saved')
    expect(saved).toBe('lore-square.png')
    expect(pictureNotice(outcome)).toBe(PICTURE_SAVED)
  })
})

describe('platform fallback', () => {
  const blob = new Blob([Uint8Array.from([4, 5])], { type: 'image/png' })
  const text = buildPostText(['Dinner recipes'])

  class FakeItem {
    data: Record<string, Blob>
    constructor(data: Record<string, Blob>) {
      this.data = data
    }
  }

  it('uses the share sheet for a platform when files are supported', async () => {
    const box: { current: { files: File[]; text: string; url: string } | null } = { current: null }
    const outcome = await sharePlatform('linkedin', blob, 'lore-square.png', text, {
      canShare: (data) => data.files.length === 1,
      share: async (data) => {
        box.current = data
      },
      open: () => {
        throw new Error('composer should stay closed')
      },
    })
    expect(outcome).toBe('shared')
    expect(box.current?.files).toHaveLength(1)
    expect(box.current?.url).toBe('https://mlescaille.com/lore')
  })

  it('copies the picture before opening X, and downloads before opening when copy fails', async () => {
    const order: string[] = []
    const copied = await sharePlatform('x', blob, 'lore-square.png', text, {
      canShare: () => false,
      ClipboardItem: FakeItem as unknown as typeof ClipboardItem,
      write: async () => {
        order.push('copy')
      },
      download: () => {
        order.push('download')
      },
      open: (url) => {
        order.push(url)
      },
    })
    expect(copied).toBe('copied')
    expect(order).toEqual(['copy', xIntent(text)])
    expect(pictureNotice('copied')).toBe(PICTURE_COPIED)

    const savedOrder: string[] = []
    const saved = await sharePlatform('threads', blob, 'lore-square.png', text, {
      canShare: () => false,
      ClipboardItem: FakeItem as unknown as typeof ClipboardItem,
      write: async () => {
        savedOrder.push('copy')
        throw new Error('no image clipboard')
      },
      download: () => {
        savedOrder.push('download')
      },
      open: (url) => {
        savedOrder.push(url)
      },
    })
    expect(saved).toBe('saved')
    expect(savedOrder[0]).toBe('copy')
    expect(savedOrder[1]).toBe('download')
    expect(savedOrder[2]).toBe(threadsIntent(text))
    expect(pictureNotice('saved')).toBe(PICTURE_SAVED)
  })

  it('opens the LinkedIn composer only after the picture is ready, with no empty share-offsite link', async () => {
    const order: string[] = []
    await sharePlatform('linkedin', blob, 'lore-square.png', text, {
      canShare: () => false,
      ClipboardItem: FakeItem as unknown as typeof ClipboardItem,
      write: async () => {
        order.push('copy')
      },
      open: (url) => {
        order.push(url)
      },
    })
    expect(order).toEqual(['copy', 'https://www.linkedin.com/feed/?shareActive=true'])
    expect(order[1]).not.toContain('share-offsite')
    expect(order[1]).not.toContain(text)
  })

  it('saves the Instagram picture and does not open a composer', async () => {
    let saved = ''
    let opened = false
    const outcome = await sharePlatform('instagram', blob, 'lore-story.png', text, {
      canShare: () => false,
      download: (_blob, filename) => {
        saved = filename
      },
      open: () => {
        opened = true
      },
    })
    expect(outcome).toBe('saved')
    expect(saved).toBe('lore-story.png')
    expect(opened).toBe(false)
  })

  it('does not open a composer when the person dismisses the share sheet', async () => {
    let opened = false
    let saved = false
    const outcome = await sharePlatform('x', blob, 'lore-square.png', text, {
      canShare: () => true,
      share: async () => {
        throw new DOMException('The operation was aborted.', 'AbortError')
      },
      download: () => {
        saved = true
      },
      open: () => {
        opened = true
      },
    })
    expect(outcome).toBe('aborted')
    expect(opened).toBe(false)
    expect(saved).toBe(false)
  })
})

function cardText(svg: string): string {
  const spans = [...svg.matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map((match) => match[1] ?? '')
  return ['Lore', ...spans].join('\n')
}

describe('friendly names', () => {
  it('turns keyword mashups into a phrase and keeps story as the phone default', () => {
    expect(friendlyThemeName('Dinner & Recipe')).toBe('Dinner recipes')
    expect(friendlyThemeName('Lisbon & Trip')).toBe('Lisbon trips')
    expect(friendlyThemeName('Miles & Run')).toBe('Miles and runs')
    expect(friendlyThemeName('Friends and family')).toBe('Friends and family')
    expect(defaultShareSize(true)).toBe('story')
    expect(defaultShareSize(false)).toBe('square')
    const model = shareCardFromResult(
      {
        biography: { epithet: 'The Recipe Hoarder' },
        themes: [{ id: 'recipes', label: 'Dinner & Recipe', count: 4 }],
      },
      null,
      false,
      'square',
    )
    expect(model.themes).toEqual(['Dinner recipes'])
    expect(shareSurfaceText(model)).not.toContain(OCR)
    expect(shareSurfaceText(model)).not.toContain('&')
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
        expect(cardText(svg)).not.toContain(secret)
      }
      expect(surface).toContain('The Recipe Hoarder Who Plans Trips at Midnight')
      expect(cardText(svg)).toContain('Recipes')
      expect(cardText(svg)).toContain('Lore')
      expect(cardText(svg)).toContain('You got 2 of 3 right.')
      expect(cardText(svg)).toContain('Discover your lore at')
      expect(svg).toContain("font-family:'Silkscreen'")
      expect(svg).toContain("font-family:'Atkinson Hyperlegible'")
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
    expect(cardText(shareCardSvg(model))).not.toContain('You got')
    expect(shareSurfaceText(model)).not.toContain(OCR)
  })
})
