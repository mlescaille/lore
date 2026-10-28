import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { expect, test, type Page } from '@playwright/test'

const require = createRequire(import.meta.url)
const sharp = require('sharp') as typeof import('sharp')

const shareOut = '/opt/cursor/artifacts/share'
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

test.beforeAll(async () => {
  await mkdir(shareOut, { recursive: true })
})

test('share posts, copy, and both picture sizes stay free of screenshot text', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'clipboard and image export are checked in chromium')
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
  await reachShare(page)

  const post = (await page.locator('.caption-preview').textContent()) ?? ''
  expect(post).toMatch(/^I found my lore: .+ Find yours: https:\/\/mlescaille.com\/lore$/)
  for (const secret of secrets) expect(post).not.toContain(secret)

  const x = await page.getByRole('link', { name: 'Post to X' }).getAttribute('href')
  const threads = await page.getByRole('link', { name: 'Post to Threads' }).getAttribute('href')
  const linked = await page.getByRole('link', { name: 'Post to LinkedIn' }).getAttribute('href')
  expect(x).toBeTruthy()
  expect(threads).toBeTruthy()
  expect(linked).toBeTruthy()
  const xUrl = new URL(x!)
  const threadsUrl = new URL(threads!)
  const linkedUrl = new URL(linked!)
  expect(xUrl.origin + xUrl.pathname).toBe('https://x.com/intent/post')
  expect(xUrl.searchParams.get('text')).toBe(post)
  expect(xUrl.searchParams.get('url')).toBe('https://mlescaille.com/lore')
  expect(threadsUrl.origin + threadsUrl.pathname).toBe('https://www.threads.net/intent/post')
  expect(threadsUrl.searchParams.get('text')).toBe(post)
  expect(linkedUrl.origin + linkedUrl.pathname).toBe('https://www.linkedin.com/sharing/share-offsite/')
  expect(linkedUrl.searchParams.get('url')).toBe('https://mlescaille.com/lore')
  for (const href of [x, threads, linked]) {
    for (const secret of secrets) expect(href).not.toContain(secret)
  }

  const surface = await page.locator('.share-panel').evaluate((element) => element.textContent ?? '')
  expect(surface).toContain('You got')
  expect(surface).toContain('Discover your lore')
  expect(surface).toContain('mlescaille.com/lore')
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

  async function expandForShots() {
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

  await page.setViewportSize({ width: 1100, height: 1900 })
  await expandForShots()
  await panel.screenshot({ path: path.join(shareOut, 'panel-desktop.png') })
  await frame.screenshot({ path: path.join(shareOut, 'square-desktop.png') })
  await page.getByRole('button', { name: 'Story' }).click()
  await frame.screenshot({ path: path.join(shareOut, 'story-desktop.png') })

  await page.setViewportSize({ width: 390, height: 1900 })
  await expandForShots()
  await expect(page.locator('.taskbar')).toBeHidden()
  await page.getByRole('button', { name: 'Square' }).click()
  await panel.screenshot({ path: path.join(shareOut, 'panel-mobile.png') })
  await frame.screenshot({ path: path.join(shareOut, 'square-mobile.png') })
  await page.getByRole('button', { name: 'Story' }).click()
  await frame.screenshot({ path: path.join(shareOut, 'story-mobile.png') })
  await page.getByRole('button', { name: 'Square' }).click()

  await page.getByRole('button', { name: 'Copy link' }).click()
  await expect(page.getByRole('status')).toHaveText('Copied!')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('https://mlescaille.com/lore')

  await page.evaluate(() => {
    const clipboard = navigator.clipboard
    clipboard.write = async () => {
      throw new Error('image copy is not supported')
    }
  })
  const [squareDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Copy image' }).click(),
  ])
  const squarePath = path.join(shareOut, 'square.png')
  await squareDownload.saveAs(squarePath)
  await expect(page.getByRole('status')).toHaveText('Image saved.')

  const [storyDownload] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Post to Instagram' }).click(),
  ])
  const storyPath = path.join(shareOut, 'story.png')
  await storyDownload.saveAs(storyPath)
  await expect(page.getByRole('status')).toHaveText('Image saved. Open Instagram and add it to your story.')

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
})
