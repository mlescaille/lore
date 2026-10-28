import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APP_DESCRIPTION, APP_TITLE, SHARE_URL } from './config.ts'

describe('public page title', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

  it('uses the slogan for the tab and the share cards, with a generic preview image', () => {
    expect(APP_TITLE).toBe('Lore: your screenshots as your bio!')
    expect(html).toContain(`<title>${APP_TITLE}</title>`)
    expect(html).toContain(`property="og:title" content="${APP_TITLE}"`)
    expect(html).toContain(`name="twitter:title" content="${APP_TITLE}"`)
    expect(html).toContain(`name="description"\n      content="${APP_DESCRIPTION}"`)
    expect(html).toContain(`property="og:description"\n      content="${APP_DESCRIPTION}"`)
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
    expect(html).toContain(`property="og:image" content="${SHARE_URL}/og.png"`)
    expect(html).toContain(`name="twitter:image" content="${SHARE_URL}/og.png"`)
    const image = readFileSync(new URL('../public/og.png', import.meta.url))
    expect(image.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
    expect(image.readUInt32BE(16)).toBe(1200)
    expect(image.readUInt32BE(20)).toBe(630)
    expect(image.includes(Buffer.from('Screenshot'))).toBe(false)
    expect(image.includes(Buffer.from('Miso'))).toBe(false)
  })
})
