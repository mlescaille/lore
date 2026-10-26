import type { CSSProperties, Ref } from 'react'
import type { CardModel } from '../CardFace.tsx'

const PIXEL = 'Silkscreen, ui-monospace, monospace'
const DISPLAY = 'Bungee, Impact, sans-serif'

export function RetroCard({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const hits = model.guesses.filter((guess) => guess.matched).length
  const stats = model.themes.slice(0, 3)

  const shell: CSSProperties = {
    width: 1080,
    height: story ? 1920 : 1080,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: '#24143f',
    padding: story ? 36 : 28,
    display: 'flex',
  }

  return (
    <div ref={nodeRef} style={shell}>
      <article
        style={{
          flex: 1,
          background: '#efe4ff',
          color: '#1a1028',
          borderTop: '6px solid #fff6ff',
          borderLeft: '6px solid #fff6ff',
          borderBottom: '6px solid #3a2260',
          borderRight: '6px solid #3a2260',
          boxShadow: story ? '16px 16px 0 #120a22' : '12px 12px 0 #120a22',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <header
          style={{
            background: '#4b1d78',
            color: '#ffe14a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: story ? '18px 22px' : '12px 16px',
            fontFamily: PIXEL,
            fontSize: story ? 22 : 16,
          }}
        >
          <span>LORE CARD</span>
          <span style={{ background: '#67f2e4', color: '#1a1028', padding: '4px 8px' }}>{hits === model.guesses.length && hits > 0 ? 'RARE' : 'COMMON'}</span>
        </header>
        <div style={{ padding: story ? '36px 36px 28px' : '20px 22px 16px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <p style={{ margin: 0, fontFamily: PIXEL, fontSize: story ? 18 : 13, color: '#4b1d78' }}>{model.rangeLabel.toUpperCase()}</p>
          <h2
            style={{
              margin: story ? '18px 0 0' : '10px 0 0',
              fontFamily: DISPLAY,
              fontWeight: 400,
              fontSize: story ? 64 : 40,
              lineHeight: 1.15,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
            }}
          >
            {model.epithet}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginTop: story ? 22 : 12 }}>
            {['#ff4fa3', '#ffe14a', '#67f2e4', '#4b1d78'].map((color) => (
              <span key={color} style={{ width: story ? 28 : 18, height: story ? 28 : 18, background: color, border: '2px solid #1a1028' }} />
            ))}
          </div>
          <div style={{ marginTop: story ? 28 : 16, display: 'flex', flexDirection: 'column', gap: story ? 12 : 8 }}>
            {stats.map((theme, index) => (
              <div
                key={theme.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  background: index % 2 ? '#f7f1ff' : '#e2d2ff',
                  borderTop: '3px solid #fff',
                  borderLeft: '3px solid #fff',
                  borderBottom: '3px solid #6b4a96',
                  borderRight: '3px solid #6b4a96',
                  padding: story ? '12px 14px' : '8px 10px',
                  fontFamily: PIXEL,
                  fontSize: story ? 20 : 14,
                }}
              >
                <span>{['HP', 'ATK', 'DEF'][index] ?? 'XP'}</span>
                <span style={{ textAlign: 'right' }}>
                  {theme.label.toUpperCase()} {Math.max(1, Math.round(theme.share * model.total))}
                </span>
              </div>
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: PIXEL,
                fontSize: story ? 18 : 13,
                padding: '4px 4px 0',
              }}
            >
              <span>SHOTS</span>
              <span>{model.total}</span>
            </div>
          </div>
          <p
            style={{
              marginTop: 'auto',
              marginBottom: 0,
              fontFamily: PIXEL,
              fontSize: story ? 18 : 13,
              lineHeight: 1.55,
              background: '#1a1028',
              color: '#67f2e4',
              padding: story ? '16px 14px' : '10px 10px',
            }}
          >
            {model.closingLine.toUpperCase()}
            {model.guesses.length > 0 ? ` GUESS: ${model.guesses.map((guess) => guess.guess).join(', ').toUpperCase()}.` : ''}
          </p>
        </div>
      </article>
    </div>
  )
}
