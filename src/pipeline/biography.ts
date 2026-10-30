import type { Biography, Chapter, Theme, TurningPoint } from '../types.ts'
import { isImageOnly, stem, tokenize } from './text.ts'
import type { ChapterSlice } from './chapters.ts'

interface Flavor {
  id: string
  words: string[]
  title: string
  habit: string
  chapterTitles: [string, string]
}

const FLAVORS: Flavor[] = [
  {
    id: 'recipes',
    words: ['recipe', 'recipes', 'cook', 'cooking', 'pasta', 'dinner', 'ingredient', 'ingredients', 'oven', 'bake', 'baking', 'kitchen', 'miso', 'cookie', 'cookies', 'grocery', 'risotto'],
    title: 'Recipe Hoarder',
    habit: 'saves dinners for a future self',
    chapterTitles: ['The dinner you meant to cook', 'Back to the kitchen'],
  },
  {
    id: 'travel',
    words: ['lisbon', 'trip', 'trips', 'flight', 'flights', 'packing', 'airbnb', 'portugal', 'tram', 'itinerary', 'travel', 'hostel'],
    title: 'Midnight Trip Planner',
    habit: 'plans trips at midnight',
    chapterTitles: ['Lisbon, still in tabs', 'The trip, back in tabs'],
  },
  {
    id: 'friends',
    words: ['gremlin', 'gremlins', 'chat', 'meme', 'brunch', 'karaoke', 'group'],
    title: 'Group Chat Historian',
    habit: 'archives the bit before it scrolls away',
    chapterTitles: ['The group chat, entered into evidence', 'Back in the chat'],
  },
  {
    id: 'fitness',
    words: ['run', 'running', 'mile', 'miles', 'pace', 'marathon', 'interval', 'tempo', 'training', 'race'],
    title: 'Half-Marathon Romantic',
    habit: 'negotiates with miles',
    chapterTitles: ['Miles, negotiated', 'Back on the route'],
  },
  {
    id: 'studio',
    words: ['figma', 'critique', 'layout', 'sprint', 'mock', 'design', 'client', 'slack'],
    title: 'Quiet Perfectionist',
    habit: 'screenshots comments to win an argument with themselves',
    chapterTitles: ['The redlines you kept', 'Another pass at the layout'],
  },
  {
    id: 'celebrations',
    words: ['celebration', 'celebrations', 'party', 'birthday', 'wedding', 'toast', 'cheers', 'gathering', 'festival', 'balloon', 'cake'],
    title: 'Party Correspondent',
    habit: 'saves the party for later',
    chapterTitles: ['The night you kept', 'Back at the party'],
  },
  {
    id: 'people',
    words: ['friend', 'friends', 'family', 'people', 'person', 'portrait', 'reunion', 'smile'],
    title: 'Keeper of the Room',
    habit: 'keeps the people in the room',
    chapterTitles: ['The people in the room', 'Back with the people'],
  },
  {
    id: 'systems',
    words: ['tech', 'technology', 'system', 'systems', 'diagram', 'latency', 'consistency', 'software', 'computer', 'architecture', 'learning', 'algorithm', 'availability', 'partition'],
    title: 'Systems Scribbler',
    habit: 'saves diagrams for later',
    chapterTitles: ['The diagram you kept', 'Back to the figure'],
  },
  {
    id: 'food',
    words: ['food', 'meal', 'restaurant', 'coffee', 'pizza', 'dessert', 'breakfast', 'lunch'],
    title: 'Menu Archivist',
    habit: 'saves meals they meant to have',
    chapterTitles: ['The meal you meant to have', 'Back to the table'],
  },
]

const SMALL = new Set(['a', 'an', 'the', 'at', 'of', 'in', 'on', 'for', 'to', 'and', 'but', 'with', 'from', 'by', 'before'])

export function titleCasePhrase(phrase: string): string {
  return phrase
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase()
      if (index > 0 && SMALL.has(lower)) return lower
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

function flavorScore(flavor: Flavor, text: string): number {
  const tokens = new Set<string>()
  for (const token of tokenize(text)) {
    tokens.add(token.stem)
    tokens.add(token.surface)
    tokens.add(stem(token.surface))
  }
  return flavor.words.reduce((score, word) => score + (tokens.has(word) || tokens.has(stem(word)) ? 1 : 0), 0)
}

export function matchFlavor(text: string): Flavor | null {
  let best: Flavor | null = null
  let bestScore = 0
  for (const flavor of FLAVORS) {
    const score = flavorScore(flavor, text)
    if (score > bestScore) {
      best = flavor
      bestScore = score
    }
  }
  return best
}

function themeText(theme: Theme | undefined): string {
  if (!theme) return ''
  return `${theme.label} ${theme.keywords.join(' ')}`
}

const SUGGESTIONS: Record<string, string> = {
  celebrations: 'You keep the party, so you can look at it again.',
  friends: 'The people close to you keep showing up.',
  people: 'You save faces, not just places.',
  recipes: 'You save meals you mean to cook.',
  food: 'Food is how you remember a day.',
  travel: 'You save the trip while it is still a plan.',
  fitness: 'You keep the workout you mean to do.',
  messages: 'You save the chat before it disappears.',
  work: 'Work follows you into your screenshots.',
  tech: 'You keep the technical thing you want to understand.',
  learning: 'You save what you are trying to learn.',
  systems: 'You keep the diagram so you can think about it later.',
  vibes: 'Almost no words here. The mood is the point.',
}

/** One friendly sentence about what a theme suggests. Never a stat or a raw token. */
export function suggestionFor(id: string, label: string): string {
  return SUGGESTIONS[id] ?? `You keep coming back to ${label.toLowerCase()}.`
}

export function epithetFor(themes: Theme[]): string {
  if (themes.length === 0) return 'Nothing We Could Keep'
  const ranked = themes.filter((theme) => theme.id !== 'vibes').sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
  if (ranked.length === 0) return 'No Words, Just Vibes'
  const primary = matchFlavor(themeText(ranked[0]))
  const secondary = ranked[1] ? matchFlavor(themeText(ranked[1])) : null
  if (primary && secondary && primary.id !== secondary.id) {
    return `The ${primary.title} Who ${titleCasePhrase(secondary.habit)}`
  }
  if (primary) return `The ${primary.title}`
  const label = titleCasePhrase(ranked[0].label)
  return `The ${label} Collector`
}

export function closingForScore(matched: number, total: number): string {
  if (total <= 0) return 'No guess, no argument. The screenshots still kept the diary.'
  if (matched >= total) return 'You guessed your own camera roll. Unsettling, and correct.'
  if (matched === total - 1 || matched / total >= 0.6) return 'Close enough to be flattering. The miss is the interesting part.'
  if (matched > 0) return 'You were half right, which is just a kind way to say the record disagreed.'
  return 'Bold guess. Your screenshots filed a dissenting opinion.'
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function utcMonthYear(iso: string): string {
  const date = new Date(iso)
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export function utcMonth(iso: string): string {
  return MONTHS[new Date(iso).getUTCMonth()] ?? ''
}

function narrativeFor(flavor: Flavor | null, label: string, count: number, start: string, end: string, returned: boolean): string {
  const range = `${utcMonth(start)} to ${utcMonth(end)}`
  if (flavor?.id === 'recipes' && returned) {
    return `${range}. The kitchen came back. ${count} more screenshots, as if the year had unfinished dinners.`
  }
  if (flavor?.id === 'recipes') {
    return `${range} was a long meal you meant to cook. ${count} screenshots, mostly recipes, saved the way other people save sunsets.`
  }
  if (flavor?.id === 'travel') {
    return `${range}. A trip lived in tabs. ${count} screenshots of plans that were already happening in your head.`
  }
  if (flavor?.id === 'fitness') {
    return `${range}. You negotiated with miles. ${count} screenshots of pace, plans, and the run you were going to take.`
  }
  if (flavor?.id === 'friends') {
    return `${range}. The group chat became a primary source. ${count} screenshots, archived before the bit scrolled away.`
  }
  if (flavor?.id === 'studio') {
    return `${range}. Work got the red pen. ${count} screenshots of layouts, critiques, and the version you wanted to defend.`
  }
  if (flavor?.id === 'celebrations') {
    return `${range}. A celebration got filed. ${count} pictures of people who showed up, kept like the night was worth proving.`
  }
  if (flavor?.id === 'people') {
    return `${range}. The room made the cut. ${count} pictures of friends and family, saved before the moment moved on.`
  }
  if (flavor?.id === 'systems') {
    return `${range}. A diagram got the last word. ${count} shots of systems, notes, and the tradeoff you wanted to remember.`
  }
  if (flavor?.id === 'food') {
    return `${range}. Meals were the plot. ${count} shots of food you meant to cook, order, or just remember.`
  }
  if (returned) return `${range}. ${label} came back for ${count} more screenshots, which is a habit with a calendar.`
  return `${range} leaned toward ${label}. ${count} screenshots in this stretch, kept like evidence.`
}

function quoteScore(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  if (words < 6) return 0
  return 100 - Math.abs(words - 24)
}

export function describeChapters(
  slices: ChapterSlice[],
  themes: Theme[],
  records: { id: string; text: string; themeId: string }[],
): Chapter[] {
  const byId = new Map(themes.map((theme) => [theme.id, theme]))
  const seen = new Set<string>()
  return slices.map((slice, index) => {
    const theme = byId.get(slice.themeId)
    const label = theme?.label ?? slice.themeId
    const flavor = slice.themeId === 'vibes' ? null : matchFlavor(`${label} ${theme?.keywords.join(' ') ?? ''}`)
    const returned = seen.has(slice.themeId)
    seen.add(slice.themeId)
    const title =
      slice.themeId === 'vibes'
        ? 'No words, just vibes'
        : flavor
          ? flavor.chapterTitles[returned ? 1 : 0]
          : returned
            ? `Back to ${label}`
            : `The ${label} stretch`
    const themed = records.filter((record) => slice.recordIds.includes(record.id) && record.themeId === slice.themeId && !isImageOnly(record.text))
    const quoteIds = [...themed].sort((a, b) => quoteScore(b.text) - quoteScore(a.text)).slice(0, 3).map((record) => record.id)
    const count = slice.recordIds.length
    return {
      id: `c${index + 1}`,
      start: slice.start,
      end: slice.end,
      themeId: slice.themeId,
      title,
      narrative: narrativeFor(flavor, label, count, slice.start, slice.end, returned),
      quoteIds,
    }
  })
}

export function turningPointsFor(chapters: Chapter[], themes: Theme[]): TurningPoint[] {
  const labels = new Map(themes.map((theme) => [theme.id, theme.label]))
  const points: TurningPoint[] = []
  for (let i = 1; i < chapters.length; i++) {
    const prev = chapters[i - 1]
    const next = chapters[i]
    if (prev.themeId === next.themeId) continue
    const from = labels.get(prev.themeId) ?? prev.themeId
    const to = labels.get(next.themeId) ?? next.themeId
    const when = utcMonthYear(next.start)
    const line =
      i % 2 === 1
        ? `${when}: ${from} made room for ${to}. The camera roll noticed first.`
        : `${when}. You left ${from} and took up ${to}, or at least your screenshots did.`
    points.push({ date: next.start, fromThemeId: prev.themeId, toThemeId: next.themeId, line })
  }
  return points
}

export function epilogueFor(themes: Theme[], recordCount: number, start: string | null, end: string | null): string {
  const ranked = [...themes].filter((theme) => theme.id !== 'vibes').sort((a, b) => b.count - a.count)
  if (recordCount === 0) {
    return 'Everything in this set looked sensitive, so the story stops here. That is the point of the check.'
  }
  const span = start && end ? `From ${utcMonthYear(start)} to ${utcMonthYear(end)}, ` : ''
  const top = ranked[0]?.label
  const second = ranked[1]?.label
  if (top && second) {
    return `${span}you kept ${recordCount} screenshots and called it nothing. The pile says this stretch belonged to ${top}, with ${second} running underneath. A diary you did not mean to write. Hello.`
  }
  if (top) {
    return `${span}you kept ${recordCount} screenshots and they mostly agree: ${top}. A diary you did not mean to write. Hello.`
  }
  return `${span}you kept ${recordCount} screenshots and almost no sentences. The vibe is the point.`
}

export function writeBiography(themes: Theme[], chapters: Chapter[], recordCount: number): Biography {
  const start = chapters[0]?.start ?? null
  const end = chapters[chapters.length - 1]?.end ?? null
  return {
    epithet: epithetFor(themes),
    closingLine: 'Your camera roll remembers the life you meant to have. Kind of beautiful, honestly.',
    turningPoints: turningPointsFor(chapters, themes),
    epilogue: epilogueFor(themes, recordCount, start, end),
  }
}
