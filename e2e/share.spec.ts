import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { expect, test, type Page } from '@playwright/test'

const require = createRequire(import.meta.url)
const sharp = require('sharp') as typeof import('sharp')

const shareOut = '/opt/cursor/artifacts/share2'
const secrets = ['Miso butter', 'Screenshot 2025', 'IMG_20251004', '.heic']

async function reachShare(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Welcome to Lore' })).toBeVisible()
  await page.getByRole('button', { name: 'Try sample screenshots' }).click()
  await expect(page.getByRole('button', { name: 'Guess first' })).toBeVisible()
  await page.getByRole('button', { name: 'Guess first' }).click()
  await page.getByLabel('Theme 1').fill('recipes')
  await page.getByLabel('Theme 2').fill('travel')
  await page.getByLabel('Theme 3').fill('friends')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'Your lore', exact: true })).toBeVisible({ timeout: 120_000 })
  await expect(page.getByRole('heading', { name: 'Share', exact: true })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
}

async function expandForShots(page: Page) {
  await page.evaluate(() => {
    for (const selector of ['html', 'body', '#root', '.os', '.desk-surface', '.lore-scroll', '.os-client']) {
      const element = document.querySelector(selector)
      if (!(element instanceof HTMLElement)) continue
      element.style.overflow = 'visible'
      element.style.height = 'auto'
      element.style.maxHeight = 'none'
    }
    const win = document.querySelector('.os-window.is-lore')
    if (win instanceof HTMLElement) {
      win.style.position = 'relative'
      win.style.inset = 'auto'
      win.style.height = 'auto'
      win.style.maxHeight = 'none'
      win.style.width = '100%'
    }
  })
}

test.beforeAll(async () => {
  await mkdir(shareOut, { recursive: true })
})

test('share is image-first and the card stays free of screenshot text', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard and image export are checked in chromium')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.setViewportSize({ width: 390, height: 1900 })
  await reachShare(page)

  await expect(page.getByRole('button', { name: 'Story' })).toHaveClass(/is-on/)
  await expect(page.getByRole('button', { name: 'Share my lore' })).toBeVisible()

  const post = (await page.locator('.caption-preview').textContent()) ?? ''
  expect(post).toMatch(/^I found my lore: .+ Find yours: https:\/\/mlescaille.com\/lore$/)
  for (const secret of secrets) expect(post).not.toContain(secret)
  expect(post).not.toContain(' & ')

  const surface = await page.locator('[data-share-export="story"]').evaluate((element) => element.textContent ?? '')
  expect(surface).toContain('Lore')
  expect(surface).toContain('Discover your lore')
  expect(surface).toContain('mlescaille.com/lore')
  expect(surface).not.toContain(' & ')
  for (const secret of secrets) expect(surface).not.toContain(secret)

  const squareSize = await page.locator('[data-share-export="square"] svg').evaluate((element) => ({
    width: element.getAttribute('width'),
    height: element.getAttribute('height'),
  }))
  const storySize = await page.locator('[data-share-export="story"] svg').evaluate((element) => ({
    width: element.getAttribute('width'),
    height: element.getAttribute('height'),
  }))
  expect(squareSize).toEqual({ width: '1080', height: '1080' })
  expect(storySize).toEqual({ width: '1080', height: '1920' })

  const panel = page.locator('.share-panel')
  const frame = page.locator('.share-preview')
  await expandForShots(page)
  await panel.screenshot({ path: path.join(shareOut, 'panel-mobile.png') })
  await frame.screenshot({ path: path.join(shareOut, 'story-mobile.png') })

  await page.evaluate(() => {
    const target = window as Window & { __shared?: { name?: string; text?: string; url?: string; count?: number } }
    Object.defineProperty(navigator, 'canShare', {
      configurable: true,
      value: (data: { files?: File[] }) => Array.isArray(data?.files) && data.files.length > 0,
    })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: { files?: File[]; text?: string; url?: string }) => {
        target.__shared = { name: data.files?.[0]?.name, text: data.text, url: data.url, count: data.files?.length }
      },
    })
  })
  await page.getByRole('button', { name: 'Share my lore' }).click()
  await expect.poll(async () => page.evaluate(() => (window as Window & { __shared?: { count?: number } }).__shared?.count)).toBe(1)
  const shared = await page.evaluate(() => (window as Window & { __shared?: { name?: string; text?: string; url?: string } }).__shared)
  expect(shared?.name).toBe('lore-story.png')
  expect(shared?.text).toBe(post)
  expect(shared?.url).toBe('https://mlescaille.com/lore')
  await expect(page.getByRole('status')).toHaveCount(0)

  await page.setViewportSize({ width: 1100, height: 1900 })
  await expandForShots(page)
  await page.getByRole('button', { name: 'Square' }).click()
  await panel.screenshot({ path: path.join(shareOut, 'panel-desktop.png') })
  await frame.screenshot({ path: path.join(shareOut, 'square-desktop.png') })
  await page.getByRole('button', { name: 'Story' }).click()
  await frame.screenshot({ path: path.join(shareOut, 'story-desktop.png') })
  await page.getByRole('button', { name: 'Square' }).click()

  await page.evaluate(() => {
    const target = window as Window & { __order?: string[] }
    target.__order = []
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false })
    const write = async () => {
      target.__order?.push('copy')
    }
    Object.defineProperty(navigator.clipboard, 'write', { configurable: true, value: write })
  })
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Post to X' }).click(),
  ])
  await expect(page.getByRole('status')).toHaveText('Your picture is copied. Paste it into the post (Cmd+V).')
  const order = await page.evaluate(() => (window as Window & { __order?: string[] }).__order ?? [])
  expect(order[0]).toBe('copy')
  const xLanded = decodeURIComponent(popup.url()).replace(/\+/g, ' ')
  expect(xLanded).toContain('/intent/post')
  expect(xLanded).toContain('Dinner recipes')
  expect(xLanded).not.toContain('Miso')
  expect(xLanded).not.toContain('Screenshot')
  await popup.close()

  const [linked] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('button', { name: 'Post to LinkedIn' }).click(),
  ])
  const linkedLanded = decodeURIComponent(linked.url())
  expect(linkedLanded).toContain('shareActive=true')
  expect(linkedLanded).not.toContain('share-offsite')
  expect(linkedLanded).not.toContain('Miso')
  await linked.close()

  await page.evaluate(() => {
    Object.defineProperty(navigator.clipboard, 'write', {
      configurable: true,
      value: async () => {
        throw new Error('image copy is not supported')
      },
    })
  })
  const [squareDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Copy image' }).click(),
  ])
  const squarePath = path.join(shareOut, 'square.png')
  await squareDownload.saveAs(squarePath)
  await expect(page.getByRole('status')).toHaveText('Picture saved. Attach it to your post.')

  await page.getByRole('button', { name: 'Story' }).click()
  const [storyDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Post to Instagram' }).click(),
  ])
  const storyPath = path.join(shareOut, 'story.png')
  await storyDownload.saveAs(storyPath)
  await expect(page.getByRole('status')).toHaveText('Picture saved. Attach it to your post.')

  const squareMeta = await sharp(squarePath).metadata()
  const storyMeta = await sharp(storyPath).metadata()
  expect(squareMeta.width).toBe(1080)
  expect(squareMeta.height).toBe(1080)
  expect(storyMeta.width).toBe(1080)
  expect(storyMeta.height).toBe(1920)

  const squareBytes = await readFile(squarePath)
  const storyBytes = await readFile(storyPath)
  for (const secret of secrets) {
    expect(squareBytes.includes(Buffer.from(secret))).toBe(false)
    expect(storyBytes.includes(Buffer.from(secret))).toBe(false)
  }

  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.getByRole('status')).toHaveText('Copied!')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://mlescaille.com/lore')
})
