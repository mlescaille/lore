import type { CSSProperties, Ref } from 'react'
import type { CardModel } from '../CardFace.tsx'

const DISPLAY = '"Bebas Neue", Impact, sans-serif'
const SANS = '"Barlow Condensed", "Arial Narrow", sans-serif'

const BLOCKS = ['#ff2fbf', '#d6ff3c', '#3a45ff']

export function PosterCard({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const top = model.themes[0]
  const rest = model.themes.slice(1, 3)
  const count = top ? Math.max(1, Math.round(top.share * model.total)) : model.total
  const hits = model.guesses.filter((guess) => guess.matched).length

  const shell: CSSProperties = {
    width: 1080,
    height: story ? 1920 : 1080,
    boxSizing: 'border-box',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: '#111',
    color: '#111',
    fontFamily: SANS,
  }

  return (
    <div ref={nodeRef} style={shell}>
      <section
        style={{
          flex: story ? 1.15 : 1.05,
          background: BLOCKS[0],
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: story ? '48px 48px 28px' : '28px 36px 18px',
        }}
      >
        <p style={{ margin: 0, fontFamily: SANS, fontWeight: 700, letterSpacing: '0.16em', fontSize: story ? 28 : 20, textTransform: 'uppercase' }}>
          {model.rangeLabel}
        </p>
        <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: story ? 460 : 250, lineHeight: 0.78, letterSpacing: '0.01em' }}>{count}</p>
        <h2 style={{ margin: 0, fontFamily: DISPLAY, fontWeight: 400, fontSize: story ? 108 : 72, lineHeight: 0.84 }}>
          {(top?.label ?? 'screenshots').toUpperCase()}
        </h2>
      </section>
      <div style={{ display: 'flex', flex: story ? 0.62 : 0.48, minHeight: 0 }}>
        {(rest.length > 0 ? rest : [{ label: hits ? `${hits} guesses landed` : 'no guess on file', share: 0 }]).map((theme, index) => (
          <div
            key={theme.label}
            style={{
              flex: 1,
              background: BLOCKS[(index + 1) % BLOCKS.length],
              color: index === 1 ? '#f4f4f0' : '#111',
              padding: story ? '32px 28px' : '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
            }}
          >
            {theme.share > 0 && (
              <div style={{ fontFamily: DISPLAY, fontSize: story ? 140 : 84, lineHeight: 0.8 }}>
                {Math.max(1, Math.round(theme.share * model.total))}
              </div>
            )}
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: story ? 36 : 24, lineHeight: 0.95, textTransform: 'uppercase' }}>
              {theme.label}
            </div>
          </div>
        ))}
      </div>
      <footer style={{ background: '#111', color: '#d6ff3c', padding: story ? '36px 48px 40px' : '16px 36px 20px' }}>
        <p style={{ margin: 0, fontFamily: DISPLAY, fontSize: story ? 64 : 40, lineHeight: 0.9 }}>{model.epithet.toUpperCase()}</p>
        <p style={{ margin: '8px 0 0', fontFamily: SANS, fontWeight: 600, fontSize: story ? 32 : 22, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {model.closingLine}
        </p>
      </footer>
    </div>
  )
}
