import { THEME_COLORS, VIBES_COLOR } from '../config.ts'
import type { Theme } from '../types.ts'

export function utcDay(iso: string): string {
  return iso.slice(0, 10)
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso))
}

export function formatRange(start: string, end: string): string {
  const a = new Date(start)
  const b = new Date(end)
  const sameYear = a.getUTCFullYear() === b.getUTCFullYear()
  const left = new Intl.DateTimeFormat('en', {
    month: 'short',
    year: sameYear ? undefined : 'numeric',
    timeZone: 'UTC',
  }).format(a)
  const right = new Intl.DateTimeFormat('en', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(b)
  return `${left} – ${right}`
}

export function colorForTheme(themeId: string, themes: Theme[]): string {
  if (themeId === 'vibes') return VIBES_COLOR
  const ordered = themes.filter((theme) => theme.id !== 'vibes')
  const index = Math.max(0, ordered.findIndex((theme) => theme.id === themeId))
  return THEME_COLORS[index % THEME_COLORS.length] ?? VIBES_COLOR
}

export function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}
