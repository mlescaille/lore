import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { expect, test, type Page } from '@playwright/test'

const require = createRequire(import.meta.url)
const sharp = require('sharp') as typeof import('sharp')

const root = path.resolve(import.meta.dirname, '..')
const out = '/opt/cursor/artifacts/upload'
const skipOut = '/opt/cursor/artifacts/skip'
const backgroundOut = '/opt/cursor/artifacts/background'
const work = path.join(root, 'e2e/.fixtures')

const people = [
  'fixtures/reading/IMG_20251004_183012.jpg',
  'fixtures/reading/IMG_20251004_191540.jpg',
  'fixtures/reading/IMG_20251004_203318.jpg',
].map((file) => path.join(root, file))
const screenshot = path.join(root, 'fixtures/reading/Screenshot 2025-09-12 at 7.41.02 PM.png')
const diagram = path.join(root, 'fixtures/diagrams/boxes-and-arrows.png')
const heic = path.join(root, 'fixtures/upload/iphone.heic')

async function largePhoto(): Promise<string> {
  const file = path.join(work, 'large.jpg')
  const raw = Buffer.alloc(4032 * 3024)
  for (let index = 0; index < raw.length; index++) raw[index] = (index * 17 + (index >> 8)) & 255
  await sharp(raw, { raw: { width: 4032, height: 3024, channels: 1 } }).jpeg({ quality: 95 }).toFile(file)
  return file
}

test.beforeAll(async () => {
  await mkdir(work, { recursive: true })
  await mkdir(path.join(work, 'folder'), { recursive: true })
  await mkdir(out, { recursive: true })
  await mkdir(skipOut, { recursive: true })
  await mkdir(backgroundOut, { recursive: true })
  await writeFile(path.join(work, 'notes.txt'), 'not a picture')
  await writeFile(path.join(work, 'folder', 'notes.txt'), 'not a picture')
  const { copyFile } = await import('node:fs/promises')
  await copyFile(people[0], path.join(work, 'folder', 'people.jpg'))
  await copyFile(diagram, path.join(work, 'folder', 'diagram.png'))
  await largePhoto()
})

async function openHome(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Lore: your screenshots as your bio!' })).toBeVisible()
  return errors
}

async function expectChoice(page: Page) {
  await expect(page.getByRole('button', { name: 'Guess first' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Just show me my lore' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'That didn’t finish' })).toHaveCount(0)
  await expect(page.getByText('Guess (optional)').first()).toBeVisible()
  await expect(page.getByText("Couldn't open those pictures")).toHaveCount(0)
}

test('file input reaches a portrait, including a bad file', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'the full on-device model run is checked in chromium')
  const errors = await openHome(page)
  const large = path.join(work, 'large.jpg')
  const uploads = [...people, screenshot, diagram, heic, large, path.join(work, 'notes.txt')]
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Start with my screenshots').click(),
  ])
  await chooser.setFiles(uploads)
  await expectChoice(page)
  await expect(page.getByText(/Skipped 1 that were not images/)).toBeVisible()
  await page.getByRole('button', { name: 'Guess first' }).click()
  await expect(page.getByRole('heading', { name: 'Before we look' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Skip guessing' })).toBeVisible()
  await page.screenshot({ path: path.join(out, 'guess.png') })
  await page.getByLabel('Theme 1').fill('celebrations')
  await page.getByLabel('Theme 2').fill('friends')
  await page.getByLabel('Theme 3').fill('tech')
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'Your lore', exact: true })).toBeVisible({ timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'That didn’t finish' })).toHaveCount(0)
  await expect(page.locator('.lore-result')).toContainText(/Celebrations|Friends and family|People|Diagrams/)
  await expect(page.getByRole('heading', { name: 'Your guess' })).toBeVisible()
  await page.screenshot({ path: path.join(out, 'result.png') })
  await page.evaluate(() => {
    const scroller = document.querySelector('.lore-scroll')
    const score = document.querySelector('.score-panel')
    if (!scroller || !score) return
    const top = score.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
    scroller.scrollTop = Math.max(0, top - 16)
  })
  await page.screenshot({ path: path.join(skipOut, 'guessed-result.png') })
  expect(errors).toEqual([])
  const stat = await import('node:fs/promises').then((fs) => fs.stat(large))
  await writeFile(
    path.join(out, 'e2e-summary.txt'),
    [
      'Upload e2e',
      `large jpg bytes: ${stat.size}`,
      'chromium: file chooser through to a portrait; folder, drop, and sample to the guess step',
      'webkit: file chooser, folder, drop, and sample to the guess step',
      `page errors: ${errors.length}`,
    ].join('\n'),
  )
})

test('Start with my screenshots accepts a photo', async ({ page }) => {
  await openHome(page)
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Start with my screenshots').click(),
  ])
  await chooser.setFiles(people[0])
  await expectChoice(page)
})

test('skipping the guess shows the portrait without a score', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'the full on-device model run is checked in chromium')
  await openHome(page)
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Start with my screenshots').click(),
  ])
  await chooser.setFiles([...people, diagram])
  await expectChoice(page)
  await page.screenshot({ path: path.join(skipOut, 'choice.png') })
  await page.getByRole('button', { name: 'Just show me my lore' }).click()
  await expect(page.getByRole('heading', { name: 'Your lore', exact: true })).toBeVisible({ timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Your guess' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Share' })).toBeVisible()
  await expect(page.locator('.lore-result')).toContainText(/Celebrations|Friends and family|People|Diagrams/)
  await page.evaluate(() => {
    const scroller = document.querySelector('.lore-scroll')
    const share = document.querySelector('.card-stage')
    if (!scroller || !share) return
    const top = share.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
    scroller.scrollTop = Math.max(0, top - 120)
  })
  await page.screenshot({ path: path.join(skipOut, 'skipped-result.png') })
})

test('waiting on step 2 shows the portrait without a processing screen', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'the full on-device model run is checked in chromium')
  await openHome(page)
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Start with my screenshots').click(),
  ])
  await chooser.setFiles([...people, diagram])
  await expectChoice(page)
  await page.screenshot({ path: path.join(backgroundOut, 'choice.png') })
  const choiceAt = Date.now()
  await expect(page.getByText('Your lore is ready.')).toBeVisible({ timeout: 180_000 })
  const readyAt = Date.now()
  await page.screenshot({ path: path.join(backgroundOut, 'ready.png') })
  const clickAt = Date.now()
  await page.getByRole('button', { name: 'Just show me my lore' }).click()
  await expect(page.getByRole('heading', { name: 'Your lore', exact: true })).toBeVisible({ timeout: 5_000 })
  const resultAt = Date.now()
  expect(resultAt - clickAt).toBeLessThan(1_500)
  await expect(page.getByRole('heading', { name: 'Finding your lore' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Your guess' })).toHaveCount(0)
  await page.screenshot({ path: path.join(backgroundOut, 'instant-result.png') })
  await writeFile(
    path.join(backgroundOut, 'timings.txt'),
    [
      'Before: the portrait (picture model, themes, and text) started only after Just show me my lore.',
      'A skip of 4 pictures on a warm model took about 8 seconds from that click to the result.',
      `After: background reading became ready ${(readyAt - choiceAt) / 1000}s after the choice screen.`,
      `Clicking Just show me my lore then showed the result in ${resultAt - clickAt}ms, with no processing screen.`,
    ].join('\n'),
  )
})

test('a folder of pictures reaches the guess step', async ({ page }) => {
  await openHome(page)
  await page.locator('.roll-folder input').setInputFiles(path.join(work, 'folder'))
  await expectChoice(page)
  await expect(page.getByText(/Skipped 1 that were not images/)).toBeVisible()
})

test('dropping a picture reaches the guess step', async ({ page }) => {
  await openHome(page)
  const bytes = await readFile(people[0])
  await page.locator('.welcome').evaluate(
    async (element, payload) => {
      const binary = atob(payload.b64)
      const data = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index++) data[index] = binary.charCodeAt(index)
      const transfer = new DataTransfer()
      transfer.items.add(new File([data], payload.name, { type: 'image/jpeg' }))
      element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: transfer }))
    },
    { b64: bytes.toString('base64'), name: 'dropped.jpg' },
  )
  await expectChoice(page)
})

test('the sample set reaches the guess step', async ({ page }) => {
  await openHome(page)
  await page.getByRole('button', { name: 'Try sample screenshots' }).click()
  await expectChoice(page)
  await expect(page.getByText("Couldn't open those pictures")).toHaveCount(0)
})
