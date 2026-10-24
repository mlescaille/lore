import type { CSSProperties, Ref } from 'react'
import type { CardModel } from '../CardFace.tsx'

const SCRAPS = ['#f4d7c4', '#e7efd4', '#f7e7a8', '#edd9c8']
const TILTS = [-2.5, 2, -1.2]

export function ScrapbookCard({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const hand = '"Caveat", cursive'
  const text = '"Libre Baskerville", Georgia, serif'
  const ink = '#2a2118'

  const shell: CSSProperties = {
    width: 1080,
    height: story ? 1920 : 1080,
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    background: '#f6ead6',
    color: ink,
    padding: story ? '78px 72px 64px' : '42px 48px 36px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: text,
  }

  return (
    <div ref={nodeRef} style={shell}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(rgba(90, 58, 28, 0.08) 0.7px, transparent 0.8px), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(90, 50, 20, 0.03) 4px)',
          backgroundSize: '5px 5px, 100% 4px',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: story ? 28 : 16,
          left: '50%',
          width: story ? 220 : 160,
          height: story ? 42 : 30,
          marginLeft: story ? -110 : -80,
          background: 'rgba(236, 214, 120, 0.78)',
          transform: 'rotate(-3deg)',
          boxShadow: '0 1px 0 rgba(42, 33, 24, 0.12)',
        }}
      />
      <p style={{ position: 'relative', margin: 0, fontFamily: hand, fontSize: story ? 46 : 34, lineHeight: 1 }}>
        filed under: camera roll
      </p>
      <h2
        style={{
          position: 'relative',
          margin: story ? '18px 0 0' : '6px 0 0',
          fontFamily: hand,
          fontWeight: 700,
          fontSize: story ? 108 : 76,
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          maxWidth: 960,
        }}
      >
        {model.epithet}
      </h2>
      <p style={{ position: 'relative', margin: story ? '22px 0 0' : '10px 0 0', fontSize: story ? 30 : 20, fontStyle: 'italic' }}>
        {model.rangeLabel}
        {model.total > 0 ? ` · ${model.total} pictures I meant to delete` : ''}
      </p>
      {model.themes.length > 0 && (
        <div style={{ position: 'relative', display: 'flex', gap: story ? 22 : 14, marginTop: story ? 48 : 22 }}>
          {model.themes.slice(0, 3).map((theme, index) => (
            <div
              key={theme.label}
              style={{
                flex: 1,
                background: SCRAPS[index % SCRAPS.length],
                padding: story ? '22px 16px 16px' : '12px 12px 10px',
                transform: `rotate(${TILTS[index] ?? 0}deg)`,
                boxShadow: '5px 5px 0 rgba(42, 33, 24, 0.14)',
                border: '1px solid rgba(42, 33, 24, 0.12)',
              }}
            >
              <div style={{ fontFamily: hand, fontSize: story ? 40 : 28, lineHeight: 1 }}>{theme.label}</div>
              <div style={{ fontFamily: hand, fontWeight: 700, fontSize: story ? 72 : 46, lineHeight: 0.9 }}>
                {Math.round(theme.share * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}
      {model.guesses.length > 0 && (
        <div style={{ position: 'relative', marginTop: story ? 42 : 18, display: 'flex', flexDirection: 'column', gap: story ? 8 : 2 }}>
          {model.guesses.map((guess) => (
            <p key={guess.guess} style={{ margin: 0, fontFamily: hand, fontSize: story ? 40 : 28, lineHeight: 1.05 }}>
              you said {guess.guess}
              <span style={{ padding: '0 8px' }}>→</span>
              {guess.matched ? `the roll said ${guess.matchLabel}` : 'the roll left this blank'}
            </p>
          ))}
        </div>
      )}
      <p
        style={{
          position: 'relative',
          marginTop: 'auto',
          marginBottom: 0,
          fontFamily: hand,
          fontSize: story ? 52 : 34,
          lineHeight: 1.05,
          maxWidth: 900,
        }}
      >
        {model.closingLine}
      </p>
      <p style={{ position: 'relative', margin: story ? '18px 0 0' : '8px 0 0', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: story ? 18 : 13 }}>
        nothing on this page left the table
      </p>
    </div>
  )
}
