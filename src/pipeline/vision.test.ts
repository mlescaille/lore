import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { classifyImages } from './vision.ts'
import { chooseThemeId } from './themes.ts'

async function image(id: string, file: string) {
  const bytes = await readFile(file)
  return { id, blob: new Blob([bytes]) }
}

describe('diagram vision', () => {
  it('names diagrams as diagrams and parties as people, not recipes', async () => {
    const scores = await classifyImages([
      await image('pacelc', 'fixtures/reading/Screenshot 2025-10-18 at 2.14.08 PM.png'),
      await image('boxes', 'fixtures/diagrams/boxes-and-arrows.png'),
      await image('party', 'fixtures/reading/IMG_20251004_183012.jpg'),
      await image('party2', 'fixtures/reading/IMG_20251004_191540.jpg'),
      await image('party3', 'fixtures/reading/IMG_20251004_203318.jpg'),
    ])

    const pacelc = chooseThemeId('', scores.get('pacelc'))
    const boxes = chooseThemeId('', scores.get('boxes'))
    expect(pacelc).not.toMatch(/recipes|food/)
    expect(boxes).not.toMatch(/recipes|food/)
    expect(['systems', 'tech']).toContain(pacelc)
    expect(['systems', 'tech']).toContain(boxes)

    for (const id of ['party', 'party2', 'party3']) {
      const theme = chooseThemeId('', scores.get(id))
      expect(['friends', 'celebrations', 'people']).toContain(theme)
      expect(theme).not.toMatch(/recipes|food/)
    }
  }, 120_000)
})
