import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.argv[2] ?? 'http://127.0.0.1:4317/lore/bench.html'
const label = process.argv[3] ?? 'after'
const out = '/opt/cursor/artifacts/speed'

async function once(page, count) {
  return page.evaluate(async (n) => {
    const bench = window.__loreBench
    if (!bench) throw new Error('bench missing')
    return bench.run(n)
  }, count)
}

async function pair(browser, count) {
  const context = await browser.newContext()
  const page = await context.newPage()
  page.setDefaultTimeout(600_000)
  const logs = []
  page.on('console', (message) => {
    const text = message.text()
    if (text.startsWith('[lore]') || text.startsWith('Lore ')) logs.push(text)
  })
  await page.goto(base, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => document.body.textContent?.includes('bench ready') && window.__loreBench)
  const cold = await once(page, count)
  const warm = await once(page, count)
  await context.close()
  return { cold, warm, logs }
}

const browser = await chromium.launch({ channel: 'chrome' })
const rows = {}
for (const count of [20, 50]) {
  console.log(`running ${label} ${count}`)
  rows[count] = await pair(browser, count)
  console.log(label, count, 'cold', rows[count].cold.wall, 'warm', rows[count].warm.wall)
}
await browser.close()
await mkdir(out, { recursive: true })
await writeFile(`${out}/${label}.json`, JSON.stringify(rows, null, 2))
console.log('wrote', `${out}/${label}.json`)
