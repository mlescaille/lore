import type { VisualHit } from './signals.ts'

export interface ThemeSpec {
  id: string
  label: string
  /** Short captions. Embedded as "a photo of …". */
  prompts: string[]
  /**
   * Full phrases embedded as written. Used for screenshots and diagrams,
   * which are not photos and get worse when forced into the photo template.
   */
  queries?: string[]
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
    label: 'Diagrams',
    prompts: [
      'a distributed systems diagram',
      'a chart about consistency latency and availability',
      'an architecture diagram of a computer system',
    ],
    queries: [
      'a diagram',
      'a flowchart',
      'a chart with text and arrows',
      'a screenshot of a technical slide',
      'boxes connected by arrows',
      'a technical architecture diagram',
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
  /** Key used to map a model row back to a theme. */
  prompt: string
  /** Exact string embedded by the text tower. */
  text: string
}

export function visionPrompts(): VisionPrompt[] {
  const prompts: VisionPrompt[] = []
  for (const theme of CATALOG) {
    for (const prompt of theme.prompts) {
      prompts.push({ themeId: theme.id, prompt, text: VISION_TEMPLATE.replace('{}', prompt) })
    }
    for (const query of theme.queries ?? []) prompts.push({ themeId: theme.id, prompt: query, text: query })
  }
  for (const prompt of OTHER_PROMPTS) {
    prompts.push({ themeId: 'other', prompt, text: VISION_TEMPLATE.replace('{}', prompt) })
  }
  return prompts
}

const PROMPT_THEME = new Map(visionPrompts().map((item) => [item.prompt, item.themeId]))

/**
 * Average the prompt logits inside each theme, then softmax across themes.
 * Taking the max probability after a prompt-level softmax lets one stray
 * prompt (a cookbook page, a slide) steal a diagram.
 */
export function aggregateVision(rows: { label: string; score: number }[]): VisualHit[] {
  const sums = new Map<string, { sum: number; count: number }>()
  for (const row of rows) {
    const themeId = PROMPT_THEME.get(row.label)
    if (!themeId) continue
    const score = Number(row.score)
    if (!Number.isFinite(score)) continue
    const bucket = sums.get(themeId) ?? { sum: 0, count: 0 }
    bucket.sum += score
    bucket.count += 1
    sums.set(themeId, bucket)
  }
  const means = [...sums.entries()].map(([themeId, bucket]) => ({
    themeId,
    logit: bucket.count > 0 ? bucket.sum / bucket.count : 0,
  }))
  const peak = means.reduce((max, item) => Math.max(max, item.logit), 0)
  const weights = means.map((item) => ({ themeId: item.themeId, weight: Math.exp(item.logit - peak) }))
  const total = weights.reduce((sum, item) => sum + item.weight, 0) || 1
  return weights
    .map((item) => ({ themeId: item.themeId, score: item.weight / total }))
    .sort((a, b) => b.score - a.score || a.themeId.localeCompare(b.themeId))
}
