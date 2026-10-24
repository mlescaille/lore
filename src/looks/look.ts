/** Preview directions. The shipped design is `desk` until one of these is chosen. */
export type Look = 'desk' | 'scrapbook' | 'tabloid' | 'memoir'

const LOOKS: Look[] = ['scrapbook', 'tabloid', 'memoir']

export function readLook(search: string): Look {
  const value = new URLSearchParams(search).get('look')
  return LOOKS.find((look) => look === value) ?? 'desk'
}

export function currentLook(): Look {
  if (typeof window === 'undefined') return 'desk'
  return readLook(window.location.search)
}
