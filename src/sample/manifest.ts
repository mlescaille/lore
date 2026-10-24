import { filenameFromTimestamp } from '../pipeline/timestamps.ts'

/**
 * Fictional sample set for Jules Navarro, Portland, March 2025–February 2026.
 * Edit this list, then run `npm run sample:render`.
 * "Try the sample set" runs the real theme pipeline on these lines.
 * The pictures are drawn from the same words. Your own screenshots go through OCR.
 */

export const SAMPLE_PERSONA = {
  name: 'Jules Navarro',
  place: 'Portland',
  summary: 'A fictional product designer with a group chat called the gremlins, a Lisbon tab problem, and a half-marathon plan.',
}

export type SampleTemplate = 'notes' | 'messages' | 'safari' | 'slack' | 'run' | 'map' | 'calendar' | 'photo' | 'clinic' | 'wallet'
export type SampleHint = 'recipes' | 'lisbon' | 'gremlins' | 'running' | 'studio' | 'vibes' | 'sensitive'

export interface SampleShot {
  id: string
  filename: string
  timestamp: string
  timestampSource: 'filename'
  lines: string[]
  template: SampleTemplate
  themeHint: SampleHint
}

interface Draft {
  day: string
  hint: SampleHint
  template: SampleTemplate
  lines: string[]
}

const DRAFTS: Draft[] = [
  {
    day: '2025-03-14',
    hint: 'recipes',
    template: 'notes',
    lines: ['Miso butter pasta recipe', 'Butter, white miso, pepper', 'Boil the pasta salty', 'Dinner for two, maybe'],
  },
  {
    day: '2025-03-18',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'Maya: brunch this Sunday?', 'Sam: only if Jules picks', 'You: somewhere with cake', 'the chat has decided'],
  },
  {
    day: '2025-03-22',
    hint: 'recipes',
    template: 'safari',
    lines: ['Brown butter cookie recipe', 'One bowl. Oven at 350', 'Bake until the edges', 'smell like toffee', 'Dinner can be cookies'],
  },
  {
    day: '2025-03-29',
    hint: 'recipes',
    template: 'notes',
    lines: ['Roast chicken recipe', 'Hot oven, salty skin', 'Lemon and garlic inside', 'Sunday dinner, finally'],
  },
  {
    day: '2025-04-04',
    hint: 'recipes',
    template: 'notes',
    lines: ['Grocery for the recipe', 'Parsley, lemon, garlic', 'Spaghetti and miso', 'Dinner shopping again'],
  },
  {
    day: '2025-04-09',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'Nobody react to the meme', 'until Maya is online', 'the chat can wait', 'I saved it anyway'],
  },
  {
    day: '2025-04-15',
    hint: 'recipes',
    template: 'safari',
    lines: ['Shakshuka recipe', 'Tomatoes, eggs, cumin', 'Cook it low and slow', 'Dinner with toast'],
  },
  {
    day: '2025-04-18',
    hint: 'sensitive',
    template: 'clinic',
    lines: ['MyChart', 'OHSU patient portal', 'metformin refill request', 'A1C result is posted'],
  },
  {
    day: '2025-04-24',
    hint: 'recipes',
    template: 'notes',
    lines: ['Tomato galette recipe', 'Salad, olive oil cake', 'Bake if the oven behaves', 'Dinner for the table'],
  },
  {
    day: '2025-05-02',
    hint: 'recipes',
    template: 'safari',
    lines: ['Puttanesca recipe', 'Anchovy, olive, caper', 'Tomato, pasta, done', 'Pantry dinner again'],
  },
  {
    day: '2025-05-11',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'Maya: karaoke or was', 'that a bit, be honest', 'the chat says both', 'I am bringing earplugs'],
  },
  {
    day: '2025-05-20',
    hint: 'recipes',
    template: 'notes',
    lines: ['Weeknight dinner recipe', 'Beans, eggs, chili oil', 'Rice in the pot', 'The real cook is hunger'],
  },
  {
    day: '2025-06-04',
    hint: 'lisbon',
    template: 'safari',
    lines: ['PDX to Lisbon', 'One stop, still staring', 'Leave on the 18th', 'Trip tab open at midnight'],
  },
  {
    day: '2025-06-07',
    hint: 'lisbon',
    template: 'notes',
    lines: ['Airbnb in Alfama', 'Tram at the corner', 'Four nights in Lisbon', 'Trip stay, washing machine'],
  },
  {
    day: '2025-06-12',
    hint: 'recipes',
    template: 'notes',
    lines: ['Pasta water is sauce', 'Stop rinsing the pasta', 'Recipe rule from Sam', 'Dinner depends on it'],
  },
  {
    day: '2025-06-15',
    hint: 'lisbon',
    template: 'notes',
    lines: ['Lisbon food for the trip', 'Pastel de nata first', 'Sardines, then ginjinha', 'Eat before the walking'],
  },
  {
    day: '2025-06-20',
    hint: 'lisbon',
    template: 'map',
    lines: ['Lisbon tram 28', 'Ride early, sit right', 'Pickpockets, be boring', 'Trip transit note'],
  },
  {
    day: '2025-06-28',
    hint: 'lisbon',
    template: 'notes',
    lines: ['Lisbon trip itinerary', 'Day one: Alfama', 'Belem, then Sintra', 'Last day, just walk'],
  },
  {
    day: '2025-07-03',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'We adopted a fern', 'Her name is Deb now', 'the chat signed the card', 'Water her, Maya'],
  },
  {
    day: '2025-07-09',
    hint: 'lisbon',
    template: 'safari',
    lines: ['Lisbon back to PDX', 'Window seat on hold', 'Return leg of the trip', 'August 2, do not forget'],
  },
  {
    day: '2025-07-14',
    hint: 'lisbon',
    template: 'notes',
    lines: ['Packing for the Lisbon trip', 'Passport, adapter, shoes', 'Linen shirt, blue dress', 'The good sandals'],
  },
  {
    day: '2025-07-18',
    hint: 'sensitive',
    template: 'wallet',
    lines: ['Note to self', 'new card number', '4242 4242 4242 4242', 'do not leave this here'],
  },
  {
    day: '2025-07-22',
    hint: 'lisbon',
    template: 'notes',
    lines: ['Lisbon trip math', 'Flights, stay, food', 'Tram card, coffee', 'Midnight budget again'],
  },
  {
    day: '2025-07-29',
    hint: 'lisbon',
    template: 'map',
    lines: ['Lisbon viewpoint', 'Senhora do Monte', 'Sunset if we hurry', 'Trip map, saved pin'],
  },
  {
    day: '2025-08-04',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'Board game night poll', 'I voted cooperative', 'the chat wants chaos', 'Chaos has a quota'],
  },
  {
    day: '2025-08-09',
    hint: 'lisbon',
    template: 'notes',
    lines: ['Lisbon trip manners', 'Please and thank you', 'Obrigada, practice it', 'Say it before the coffee'],
  },
  {
    day: '2025-08-16',
    hint: 'lisbon',
    template: 'calendar',
    lines: ['Lisbon trip, day one', 'Land late, lockbox', 'Alfama in the morning', 'Do not oversleep'],
  },
  {
    day: '2025-09-03',
    hint: 'running',
    template: 'run',
    lines: ['Half marathon block', 'Easy run, 4 miles', 'Pace should feel rude', 'Week 4, be humble'],
  },
  {
    day: '2025-09-08',
    hint: 'running',
    template: 'run',
    lines: ['6.2 miles today', 'Pace 9:42, loud lungs', 'Easy run, not easy', 'Heart rate 156'],
  },
  {
    day: '2025-09-14',
    hint: 'studio',
    template: 'slack',
    lines: ['Sprint review Thursday', 'Bring the quiet mock', 'Not the kitchen sink', 'Design layout, one story'],
  },
  {
    day: '2025-09-19',
    hint: 'running',
    template: 'notes',
    lines: ['Interval day on the run', '6 by 800, calm pace', 'Jog a mile between', 'Do not race the warmup'],
  },
  {
    day: '2025-09-27',
    hint: 'running',
    template: 'run',
    lines: ['Long run, waterfront', 'Out to the bridge', '10 miles, fuel early', 'Pace stays conversational'],
  },
  {
    day: '2025-10-03',
    hint: 'running',
    template: 'notes',
    lines: ['Half marathon note', 'Finish smiling, secretly', 'want a faster pace', 'The run is many miles'],
  },
  {
    day: '2025-10-10',
    hint: 'studio',
    template: 'slack',
    lines: ['Priya on the layout', 'Crowded above the fold', 'Try the quiet version', 'Design critique, saved'],
  },
  {
    day: '2025-10-16',
    hint: 'running',
    template: 'run',
    lines: ['Tempo run, 4 miles', 'Pace 8:55, heavy legs', 'Playlist too loud', 'Miles, but make it rude'],
  },
  {
    day: '2025-10-24',
    hint: 'running',
    template: 'notes',
    lines: ['Rest from the run', 'Mobility, no heroics', 'The miles can wait', 'Coach says sit down'],
  },
  {
    day: '2025-10-31',
    hint: 'running',
    template: 'run',
    lines: ['12 miles, long run', 'Pace 10:10, fine', 'Build week, be patient', 'The miles felt honest'],
  },
  {
    day: '2025-11-06',
    hint: 'studio',
    template: 'notes',
    lines: ['Design critique notes', 'Hierarchy, fewer borders', 'The button is yelling', 'Layout needs air'],
  },
  {
    day: '2025-11-09',
    hint: 'running',
    template: 'notes',
    lines: ['Retire the blue shoes', '300 miles is enough', 'New pair for the run', 'Race day deserves them'],
  },
  {
    day: '2025-11-12',
    hint: 'running',
    template: 'calendar',
    lines: ['Race week, short run', 'Early night, lay out bib', 'Half marathon soon', 'Trust the miles'],
  },
  {
    day: '2025-12-02',
    hint: 'recipes',
    template: 'notes',
    lines: ['Holiday dinner recipe', 'Onion tart, citrus salad', 'Roast carrots, greens', 'Cook for eight'],
  },
  {
    day: '2025-12-06',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'Birthday plan for Sam', 'Cake and bad singing', 'the chat wants the booth', 'I will order the cake'],
  },
  {
    day: '2025-12-11',
    hint: 'recipes',
    template: 'safari',
    lines: ['Ginger cookie recipe', 'Bake ten minutes', 'Chewy middle, please', 'Holiday dinner sweet'],
  },
  {
    day: '2025-12-16',
    hint: 'recipes',
    template: 'notes',
    lines: ['Friday risotto recipe', 'Arborio, saffron, wine', 'Parmesan at the end', 'Dinner that takes patience'],
  },
  {
    day: '2025-12-20',
    hint: 'recipes',
    template: 'safari',
    lines: ['Olive oil cake recipe', 'Citrus, sugar, loaf pan', 'Bake until springy', 'Dinner party dessert'],
  },
  {
    day: '2025-12-28',
    hint: 'studio',
    template: 'slack',
    lines: ['Screenshot the layout', 'Before and after, please', 'For the design critique', 'I already live here'],
  },
  {
    day: '2026-01-04',
    hint: 'recipes',
    template: 'notes',
    lines: ['Pantry dinner recipe', 'Chili oil, egg, rice', 'Cook what is already here', 'No grocery heroics'],
  },
  {
    day: '2026-01-09',
    hint: 'recipes',
    template: 'safari',
    lines: ['Cookie recipe, attempt 3', 'Butter soft, rack middle', 'Parchment, then bake', 'Dinner can wait'],
  },
  {
    day: '2026-01-14',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'Brunch moved to 11', 'Nobody is a morning', 'the chat owns shoes', 'Cake is nonnegotiable'],
  },
  {
    day: '2026-01-19',
    hint: 'lisbon',
    template: 'notes',
    lines: ['Still on the Lisbon trip', 'Tram 28 in my head', 'Alfama, late coffee', 'The tab is not closed'],
  },
  {
    day: '2026-01-24',
    hint: 'recipes',
    template: 'notes',
    lines: ['Recipe grocery, again', 'Lemons, parsley, pasta', 'Butter, because dinner', 'I know what I am'],
  },
  {
    day: '2026-01-28',
    hint: 'vibes',
    template: 'photo',
    lines: [],
  },
  {
    day: '2026-02-01',
    hint: 'gremlins',
    template: 'messages',
    lines: ['the gremlins', 'Dog in a raincoat meme', 'Posting before I lose it', 'the chat deserves this', 'Deb the fern agrees'],
  },
  {
    day: '2026-02-04',
    hint: 'recipes',
    template: 'notes',
    lines: ['Baking the cookie recipe', 'Oven rack in the middle', 'Do not open the door', 'Dinner is a cookie'],
  },
  {
    day: '2026-02-06',
    hint: 'vibes',
    template: 'photo',
    lines: [],
  },
]

export const SAMPLE_SHOTS: SampleShot[] = DRAFTS.map((draft, index) => {
  const minute = String(index % 60).padStart(2, '0')
  const timestamp = `${draft.day}T12:${minute}:00.000Z`
  return {
    id: `j${String(index + 1).padStart(2, '0')}`,
    filename: filenameFromTimestamp(timestamp),
    timestamp,
    timestampSource: 'filename',
    lines: draft.lines,
    template: draft.template,
    themeHint: draft.hint,
  }
})

export function sampleText(shot: SampleShot): string {
  return shot.lines.join('\n')
}
