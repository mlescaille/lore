import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const outDir = path.join(root, 'fixtures/reading')
const photos = path.resolve('/opt/cursor/artifacts/assets')

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const sans = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
const sansBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

function png(svg: string): Buffer {
  return Buffer.from(
    new Resvg(svg, {
      font: { fontFiles: [sans, sansBold], loadSystemFonts: false, defaultFontFamily: 'DejaVu Sans' },
    }).render().asPng(),
  )
}

function diagram(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
  <rect width="1400" height="900" fill="#f7f4ee"/>
  <text x="80" y="90" font-family="DejaVu Sans" font-size="54" font-weight="700" fill="#1c1915">PACELC</text>
  <text x="80" y="140" font-family="DejaVu Sans" font-size="28" fill="#3d3832">A distributed systems tradeoff. CAP, extended with latency.</text>
  <rect x="80" y="200" width="360" height="120" rx="8" fill="#fff" stroke="#1c1915" stroke-width="3"/>
  <text x="110" y="270" font-family="DejaVu Sans" font-size="36" fill="#1c1915">If Partition</text>
  <text x="520" y="270" font-family="DejaVu Sans" font-size="36" fill="#1c1915">then</text>
  <rect x="640" y="180" width="300" height="90" rx="8" fill="#efe6d6" stroke="#1c1915" stroke-width="3"/>
  <text x="675" y="235" font-family="DejaVu Sans" font-size="32" fill="#1c1915">Availability</text>
  <text x="980" y="235" font-family="DejaVu Sans" font-size="32" fill="#1c1915">or</text>
  <rect x="1040" y="180" width="300" height="90" rx="8" fill="#efe6d6" stroke="#1c1915" stroke-width="3"/>
  <text x="1075" y="235" font-family="DejaVu Sans" font-size="32" fill="#1c1915">Consistency</text>
  <text x="80" y="420" font-family="DejaVu Sans" font-size="32" fill="#1c1915">Else, when the system is healthy:</text>
  <rect x="80" y="460" width="300" height="90" rx="8" fill="#e4efe8" stroke="#1c1915" stroke-width="3"/>
  <text x="150" y="515" font-family="DejaVu Sans" font-size="32" fill="#1c1915">Latency</text>
  <text x="420" y="515" font-family="DejaVu Sans" font-size="32" fill="#1c1915">versus</text>
  <rect x="580" y="460" width="340" height="90" rx="8" fill="#e4efe8" stroke="#1c1915" stroke-width="3"/>
  <text x="630" y="515" font-family="DejaVu Sans" font-size="32" fill="#1c1915">Consistency</text>
  <text x="80" y="660" font-family="DejaVu Sans" font-size="28" fill="#3d3832">Replication, consensus, and quorum sit under the same choice.</text>
  <text x="80" y="720" font-family="DejaVu Sans" font-size="28" fill="#3d3832">Partition tolerance does not remove the latency tradeoff.</text>
  <text x="80" y="820" font-family="DejaVu Sans" font-size="22" fill="#6b645c">Figure. Distributed systems notes — availability, consistency, latency.</text>
</svg>`
}

function phone(lines: string[], title: string): string {
  const body = lines
    .map((line, index) => {
      const y = 180 + index * 52
      return `<text x="48" y="${y}" font-family="DejaVu Sans" font-size="28" fill="#1c1915">${esc(line)}</text>`
    })
    .join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844">
  <rect width="390" height="844" fill="#f6f1e8"/>
  <text x="28" y="54" font-family="DejaVu Sans" font-size="18" fill="#1c1915">9:41</text>
  <text x="300" y="54" font-family="DejaVu Sans" font-size="18" fill="#1c1915">LTE</text>
  <text x="32" y="120" font-family="DejaVu Sans" font-size="34" font-weight="700" fill="#1c1915">${esc(title)}</text>
  ${body}
  <rect x="140" y="800" width="110" height="6" rx="3" fill="#1c1915" opacity="0.25"/>
</svg>`
}

const noise = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="160">
  <rect width="1280" height="160" fill="#1a140c" fill-opacity="0.45"/>
  <text x="36" y="58" font-family="DejaVu Sans" font-size="28" fill="#d9d0c4">150k   162k   Aad Agai</text>
  <text x="36" y="112" font-family="DejaVu Sans" font-size="24" fill="#c8bfb2">20a Aan  x7  99  3pm</text>
</svg>`

async function writePhoto(source: string, filename: string, noisy = false) {
  const base = sharp(source).rotate().resize({ width: 1200 })
  if (!noisy) {
    await base.jpeg({ quality: 82 }).toFile(path.join(outDir, filename))
    return
  }
  const meta = await base.clone().metadata()
  const overlay = await sharp(png(noise))
    .resize({ width: meta.width ?? 1200 })
    .png()
    .toBuffer()
  await base.composite([{ input: overlay, gravity: 'south' }]).jpeg({ quality: 82 }).toFile(path.join(outDir, filename))
}

await mkdir(outDir, { recursive: true })
await writeFile(path.join(outDir, 'Screenshot 2025-10-18 at 2.14.08 PM.png'), png(diagram()))
await writeFile(
  path.join(outDir, 'Screenshot 2025-09-12 at 7.41.02 PM.png'),
  png(
    phone(
      ['Brown butter cookie recipe', 'One bowl. Oven at 350.', 'Bake until the edges set.', 'Dinner can be cookies.', 'No mixer, just a spoon.'],
      'Notes',
    ),
  ),
)
await writeFile(
  path.join(outDir, 'Screenshot 2025-11-03 at 9.05.33 PM.png'),
  png(
    phone(
      ['Lisbon in October', 'Flight lands late.', 'Packing list for the trip.', 'Tram 28 in the morning.', 'Itinerary still in tabs.'],
      'Trip',
    ),
  ),
)
await writePhoto(path.join(photos, 'party-friends.jpg'), 'IMG_20251004_183012.jpg')
await writePhoto(path.join(photos, 'party-toast.jpg'), 'IMG_20251004_191540.jpg')
await writePhoto(path.join(photos, 'party-outdoor.jpg'), 'IMG_20251004_203318.jpg', true)
console.log('fixtures written to', outDir)
