import type { Look } from '../../looks/look.ts'

const MARK: Record<Exclude<Look, 'desk'>, string> = {
  scrapbook: 'on this table',
  tabloid: 'Evening edition · still free',
  memoir: 'A screenshot autobiography',
}

export function AltBar({
  look,
  showForget,
  onForget,
}: {
  look: Exclude<Look, 'desk'>
  showForget: boolean
  onForget: () => void
}) {
  return (
    <header className={`alt-bar alt-bar-${look}`}>
      <div className="shell alt-bar-row">
        <p className="alt-mark">{MARK[look]}</p>
        {showForget && (
          <button type="button" className="look-forget" onClick={onForget}>
            Forget
          </button>
        )}
      </div>
    </header>
  )
}

export function LookNav({ look }: { look: Exclude<Look, 'desk'> }) {
  const base = import.meta.env.BASE_URL
  const links = [
    ['scrapbook', 'Scrapbook'],
    ['tabloid', 'Tabloid'],
    ['memoir', 'Memoir'],
  ] as const

  return (
    <nav className="look-nav" aria-label="Preview looks">
      <span>Previewing a look. The current design is still the default.</span>
      {links.map(([id, label]) => (
        <a key={id} href={`${base}?look=${id}`} aria-current={look === id ? 'page' : undefined}>
          {label}
        </a>
      ))}
      <a href={base}>Current design</a>
    </nav>
  )
}
