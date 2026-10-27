import type { VisualHit } from './signals.ts'

export interface ThemeSpec {
  id: string
  label: string
  prompts: string[]
  words: string[]
}

/**
 * Human names for a reading. Card copy uses `label` only.
 * Prompts are for the vision model. Words are for cleaned OCR.
 */
export const CATALOG: ThemeSpec[] = [
  {
    id: 'celebrations',
    label: 'Celebrations',
    prompts: ['people celebrating at a party', 'a birthday party with balloons and cake', 'friends toasting at a festive gathering'],
    words: ['party', 'birthday', 'celebrate', 'celebration', 'celebrations', 'wedding', 'toast', 'cheers', 'balloon', 'balloons', 'cake', 'confetti', 'gathering', 'festival'],
  },
  {
    id: 'friends',
    label: 'Friends and family',
    prompts: ['friends laughing together', 'a family photo', 'a group of friends and family'],
    words: ['friend', 'friends', 'family', 'mom', 'dad', 'sister', 'brother', 'cousin', 'reunion', 'grandma', 'grandpa'],
  },
  {
    id: 'people',
    label: 'People',
    prompts: ['a portrait of people', 'people smiling at the camera', 'a candid photo of adults together'],
    words: ['people', 'person', 'portrait', 'smile', 'smiling', 'face', 'faces', 'crowd', 'selfie'],
  },
  {
    id: 'recipes',
    label: 'Recipes',
    prompts: ['a written recipe', 'cooking instructions on a screen', 'a cookbook page'],
    words: ['recipe', 'recipes', 'cook', 'cooking', 'bake', 'baking', 'oven', 'ingredient', 'ingredients', 'dinner', 'pasta', 'cookie', 'cookies', 'grocery', 'risotto', 'miso', 'kitchen'],
  },
  {
    id: 'food',
    label: 'Food',
    prompts: ['a plate of food', 'a meal on a table', 'people eating dinner'],
    words: ['food', 'meal', 'breakfast', 'lunch', 'restaurant', 'coffee', 'pizza', 'dessert'],
  },
  {
    id: 'travel',
    label: 'Travel',
    prompts: ['a travel plan or a map', 'a photo from a vacation', 'an airport or a train station'],
    words: ['trip', 'trips', 'travel', 'flight', 'flights', 'airport', 'packing', 'itinerary', 'hotel', 'airbnb', 'vacation', 'passport', 'train', 'tram', 'lisbon', 'hostel'],
  },
  {
    id: 'fitness',
    label: 'Fitness',
    prompts: ['someone running or exercising', 'a workout', 'a race or a training plan'],
    words: ['run', 'running', 'mile', 'miles', 'workout', 'gym', 'pace', 'marathon', 'training', 'race', 'interval', 'tempo'],
  },
  {
    id: 'messages',
    label: 'Messages',
    prompts: ['a text message conversation', 'a group chat on a phone', 'messages between friends'],
    words: ['chat', 'message', 'messages', 'meme', 'brunch', 'karaoke', 'gremlin', 'gremlins', 'texted'],
  },
  {
    id: 'work',
    label: 'Work',
    prompts: ['a work chat on a screen', 'a design file or a slide', 'an office meeting'],
    words: ['figma', 'critique', 'sprint', 'slack', 'client', 'layout', 'mock', 'meeting', 'deadline', 'ticket', 'design'],
  },
  {
    id: 'tech',
    label: 'Tech',
    prompts: ['a technology diagram', 'a software architecture sketch', 'a computer science figure'],
    words: ['software', 'computer', 'code', 'algorithm', 'server', 'database', 'api', 'network', 'protocol', 'tech', 'technology'],
  },
  {
    id: 'learning',
    label: 'Learning',
    prompts: ['study notes', 'a lecture slide', 'a textbook diagram'],
    words: ['lecture', 'study', 'homework', 'course', 'exam', 'textbook', 'class', 'chapter', 'learn', 'learning', 'theorem'],
  },
  {
    id: 'systems',
    label: 'Systems notes',
    prompts: [
      'a distributed systems diagram',
      'a chart about consistency latency and availability',
      'an architecture diagram of a computer system',
    ],
    words: [
      'consistency',
      'latency',
      'availability',
      'partition',
      'replication',
      'consensus',
      'distributed',
      'architecture',
      'quorum',
      'replica',
      'shard',
      'timeout',
      'linearizability',
      'tradeoff',
      'pacelc',
      'cap',
      'systems',
      'system',
      'diagram',
    ],
  },
]

export const CATALOG_BY_ID = new Map(CATALOG.map((theme) => [theme.id, theme]))

export const PUBLISHED_LABELS = new Set(['no words, just vibes', ...CATALOG.map((theme) => theme.label)])

/** Sentence wrapped around each prompt. CLIP-style models were trained this way. */
export const VISION_TEMPLATE = 'a photo of {}'

const OTHER_PROMPTS = ['an abstract texture', 'a blank background']

export interface VisionPrompt {
  themeId: string
  prompt: string
}

export function visionPrompts(): VisionPrompt[] {
  const prompts: VisionPrompt[] = []
  for (const theme of CATALOG) {
    for (const prompt of theme.prompts) prompts.push({ themeId: theme.id, prompt })
  }
  for (const prompt of OTHER_PROMPTS) prompts.push({ themeId: 'other', prompt })
  return prompts
}

const PROMPT_THEME = new Map(visionPrompts().map((item) => [item.prompt, item.themeId]))

/** Collapse prompt scores into one score per theme (the strongest prompt). */
export function aggregateVision(rows: { label: string; score: number }[]): VisualHit[] {
  const best = new Map<string, number>()
  for (const row of rows) {
    const themeId = PROMPT_THEME.get(row.label)
    if (!themeId) continue
    const score = Number(row.score)
    if (!Number.isFinite(score)) continue
    const previous = best.get(themeId) ?? 0
    if (score > previous) best.set(themeId, score)
  }
  return [...best.entries()]
    .map(([themeId, score]) => ({ themeId, score }))
    .sort((a, b) => b.score - a.score || a.themeId.localeCompare(b.themeId))
}
