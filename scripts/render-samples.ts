import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { Resvg } from '@resvg/resvg-js'
import { SAMPLE_SHOTS, type SampleShot } from '../src/sample/manifest.ts'

const root = path.resolve(import.meta.dirname, '..')
const outDir = path.join(root, 'public', 'sample')
const sans = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
const sansBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
const mono = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'

function esc(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function textBlock(lines: string[], x: number, y: number, size: number, fill: string, weight = 'normal', family = 'DejaVu Sans'): string {
  return lines
    .map((line, index) => {
      const baseline = y + index * Math.round(size * 1.45)
      return `<text x="${x}" y="${baseline}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`
    })
    .join('')
}

function screen(inner: string, bg = '#12100e', ink = '#f3eee4'): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640" viewBox="0 0 360 640">
  <rect width="360" height="640" fill="${bg}"/>
  <text x="28" y="36" font-family="DejaVu Sans" font-size="13" fill="${ink}">9:41</text>
  <text x="300" y="36" font-family="DejaVu Sans" font-size="13" fill="${ink}">LTE</text>
  ${inner}
  <rect x="132" y="608" width="96" height="5" rx="2.5" fill="${ink}" opacity="0.35"/>
</svg>`
}

function renderShot(shot: SampleShot): string {
  const lines = shot.lines
  if (shot.template === 'photo') {
    const shift = shot.id.endsWith('2') || shot.id.endsWith('4') || shot.id.endsWith('6') || shot.id.endsWith('8') || shot.id.endsWith('0')
    return screen(`
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${shift ? '#1c3d36' : '#ef5b3c'}"/>
          <stop offset="0.55" stop-color="${shift ? '#e6b15a' : '#7f4b3a'}"/>
          <stop offset="1" stop-color="${shift ? '#ef5b3c' : '#1c3d36'}"/>
        </linearGradient>
      </defs>
      <rect x="0" y="48" width="360" height="548" fill="url(#sky)"/>
      <circle cx="250" cy="160" r="36" fill="#f3eee4" opacity="0.85"/>
    `)
  }
  if (shot.template === 'messages') {
    const bubbles = lines.slice(1).map((line, index) => {
      const mine = index % 2 === 1
      const y = 118 + index * 78
      const x = mine ? 78 : 24
      const fill = mine ? '#ef5b3c' : '#2a2622'
      const color = mine ? '#1a100c' : '#f3eee4'
      return `<rect x="${x}" y="${y}" width="250" height="64" rx="18" fill="${fill}"/>
        <text x="${x + 16}" y="${y + 38}" font-family="DejaVu Sans" font-size="16" fill="${color}">${esc(line)}</text>`
    })
    return screen(`
      <text x="24" y="78" font-family="DejaVu Sans" font-size="20" font-weight="700" fill="#f3eee4">${esc(lines[0] ?? 'Messages')}</text>
      ${bubbles.join('')}
    `)
  }
  if (shot.template === 'safari') {
    const host = shot.themeHint === 'lisbon' ? 'flights.example' : 'cooking.example'
    return screen(
      `
      <rect x="20" y="56" width="320" height="36" rx="18" fill="#ece6dc"/>
      <text x="36" y="79" font-family="DejaVu Sans" font-size="13" fill="#5e564c">${host}</text>
      <text x="24" y="140" font-family="DejaVu Sans" font-size="22" font-weight="700" fill="#1a1612">${esc(lines[0] ?? '')}</text>
      ${textBlock(lines.slice(1), 24, 186, 20, '#1a1612')}
    `,
      '#f7f3ec',
      '#1a1612',
    )
  }
  if (shot.template === 'slack') {
    return screen(
      `
      <rect x="0" y="48" width="360" height="44" fill="#3f2d4c"/>
      <text x="20" y="76" font-family="DejaVu Sans" font-size="16" font-weight="700" fill="#f3eee4"># studio</text>
      <circle cx="48" cy="140" r="16" fill="#ef5b3c"/>
      <text x="76" y="132" font-family="DejaVu Sans" font-size="14" font-weight="700" fill="#1a1612">Priya</text>
      ${textBlock(lines, 76, 164, 18, '#1a1612')}
    `,
      '#f7f3ec',
      '#1a1612',
    )
  }
  if (shot.template === 'run') {
    return screen(`
      <text x="24" y="100" font-family="DejaVu Sans" font-size="13" fill="#7f9a78">ACTIVITY</text>
      ${textBlock(lines, 24, 160, 26, '#f3eee4')}
    `, '#10241c')
  }
  if (shot.template === 'map') {
    return screen(`
      <rect x="0" y="48" width="360" height="360" fill="#1f4d45"/>
      <path d="M40 300 C 90 220, 140 260, 180 180 S 260 120, 320 150" fill="none" stroke="#e6b15a" stroke-width="8" stroke-linecap="round"/>
      <circle cx="180" cy="180" r="10" fill="#ef5b3c"/>
      <rect x="16" y="420" width="328" height="160" rx="18" fill="#f3eee4"/>
      ${textBlock(lines, 32, 458, 20, '#1a1612')}
    `)
  }
  if (shot.template === 'calendar') {
    return screen(
      `
      <text x="24" y="120" font-family="DejaVu Sans" font-size="18" fill="#ef5b3c">${esc(lines[0] ?? '')}</text>
      <rect x="24" y="150" width="312" height="120" rx="16" fill="#fff6ea"/>
      ${textBlock(lines.slice(1), 40, 190, 20, '#1a1612')}
    `,
      '#f7f3ec',
      '#1a1612',
    )
  }
  if (shot.template === 'clinic') {
    return screen(
      `
      <rect x="0" y="48" width="360" height="56" fill="#d5e4f2"/>
      <text x="20" y="82" font-family="DejaVu Sans" font-size="18" font-weight="700" fill="#1a3a52">${esc(lines[0] ?? 'Portal')}</text>
      ${textBlock(lines.slice(1), 24, 160, 22, '#1a1612')}
    `,
      '#f4f7fb',
      '#1a1612',
    )
  }
  if (shot.template === 'wallet') {
    return screen(`
      <rect x="24" y="120" width="312" height="190" rx="18" fill="#241c18"/>
      <text x="44" y="160" font-family="DejaVu Sans" font-size="14" fill="#e6b15a">PERSONAL NOTE</text>
      ${textBlock(lines, 44, 200, 18, '#f3eee4', 'normal', 'DejaVu Sans Mono')}
    `)
  }
  return screen(
    `
    <rect x="16" y="56" width="328" height="540" rx="20" fill="#f6f1e6"/>
    <rect x="16" y="56" width="328" height="8" fill="#ef5b3c"/>
    <text x="36" y="100" font-family="DejaVu Sans" font-size="14" fill="#ef5b3c">Notes</text>
    ${textBlock(lines, 36, 150, 22, '#1a1612')}
  `,
    '#1a1612',
  )
}

await mkdir(outDir, { recursive: true })
for (const shot of SAMPLE_SHOTS) {
  const svg = renderShot(shot)
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 360 },
    font: {
      fontFiles: [sans, sansBold, mono],
      loadSystemFonts: false,
      defaultFontFamily: 'DejaVu Sans',
    },
  })
  const png = resvg.render().asPng()
  await writeFile(path.join(outDir, `${shot.id}.png`), png)
}
console.log(`Wrote ${SAMPLE_SHOTS.length} sample screenshots to public/sample`)
