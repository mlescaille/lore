import { drainTimes } from './pipeline/timing.ts'
import { readRoll } from './pipeline/readRoll.ts'
import { prepareFiles } from './pipeline/ingest.ts'

;(globalThis as { __LORE_TIMING?: boolean }).__LORE_TIMING = true

const LINES = [
  ['Miso butter pasta recipe', 'Boil the pasta salty', 'Dinner for two'],
  ['Lisbon flight Friday', 'Packing list and tram', 'Trip still in tabs'],
  ['the gremlins', 'brunch this Sunday', 'the chat can wait'],
  ['pace 8:30', 'six easy miles', 'long run Sunday'],
  ['latency and consistency', 'boxes and arrows', 'a systems diagram'],
]

function phoneShot(index: number): Promise<File> {
  const canvas = document.createElement('canvas')
  canvas.width = 1170
  canvas.height = 2532
  const context = canvas.getContext('2d')
  if (!context) throw new Error('no canvas')
  const lines = LINES[index % LINES.length] ?? LINES[0]
  const ink = index % 5 === 4 ? '#163e48' : '#1c1917'
  context.fillStyle = index % 7 === 0 ? '#d7efe4' : '#fffdf8'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#a33b24'
  context.fillRect(0, 0, canvas.width, 180)
  context.fillStyle = ink
  context.font = '64px sans-serif'
  lines.forEach((line, lineIndex) => {
    context.fillText(line, 80, 420 + lineIndex * 120)
  })
  context.font = '42px sans-serif'
  context.fillText(`Shot ${index + 1}`, 80, 900)
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('png'))
        return
      }
      resolve(new File([blob], `IMG_${String(index).padStart(4, '0')}.png`, { type: 'image/png' }))
    }, 'image/png')
  })
}

function summarize(times: { name: string; ms: number }[]) {
  const groups = new Map<string, number[]>()
  for (const time of times) {
    const list = groups.get(time.name) ?? []
    list.push(time.ms)
    groups.set(time.name, list)
  }
  const rows = [...groups.entries()].map(([name, list]) => {
    const total = list.reduce((sum, value) => sum + value, 0)
    return {
      name,
      count: list.length,
      total: Math.round(total),
      each: list.length ? Math.round(total / list.length) : 0,
    }
  })
  return rows
}

async function run(count: number) {
  const files = await Promise.all(Array.from({ length: count }, (_, index) => phoneShot(index)))
  const prepared = await prepareFiles(files)
  drainTimes()
  const started = performance.now()
  const reading = await readRoll(
    prepared.files.map((file) => ({
      id: file.id,
      blob: file.blob,
      timestamp: file.timestamp,
      timestampSource: file.timestampSource,
    })),
  )
  const wall = Math.round(performance.now() - started)
  return {
    wall,
    count: prepared.files.length,
    themes: reading?.result.themes.map((theme) => theme.label) ?? [],
    stages: summarize(drainTimes()),
  }
}

;(window as unknown as { __loreBench: { run: typeof run } }).__loreBench = { run }
document.body.textContent = 'bench ready'
