import type { CSSProperties, Ref } from 'react'

export interface CardThemeRow {
  label: string
  share: number
  color: string
}

export interface CardGuessRow {
  guess: string
  matchLabel: string | null
  matched: boolean
}

export interface CardEra {
  label: string
  share: number
  color: string
}

export interface CardModel {
  epithet: string
  closingLine: string
  rangeLabel: string
  total: number
  themes: CardThemeRow[]
  guesses: CardGuessRow[]
  eras: CardEra[]
  size: 'square' | 'story'
}

const PIXEL = 'Silkscreen, ui-monospace, monospace'
const DISPLAY = 'Bungee, Impact, sans-serif'
const BODY = '"Atkinson Hyperlegible", sans-serif'

/** Display size for the epithet. Longer lines step down so they wrap on words. */
export function epithetFontSize(epithet: string, story: boolean): number {
  const length = epithet.length
  if (story) {
    if (length > 90) return 40
    if (length > 64) return 48
    if (length > 42) return 56
    return 64
  }
  if (length > 90) return 26
  if (length > 64) return 30
  if (length > 42) return 34
  return 42
}

export function CardFace({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const hits = model.guesses.filter((guess) => guess.matched).length
  const rare = hits === model.guesses.length && hits > 0
  const stats = model.themes.slice(0, 3)
  const epithetSize = epithetFontSize(model.epithet, story)
  const outer = story ? 1920 : 1080
  const pad = story ? 40 : 28
  const articleH = outer - pad * 2
  const titleH = story ? 58 : 46
  const flavorH = story ? 210 : 148
  const contentH = articleH - 12 - titleH - flavorH

  const shell: CSSProperties = {
    width: 1080,
    height: outer,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: '#24143f',
    padding: pad,
    display: 'flex',
  }

  return (
    <div ref={nodeRef} style={shell}>
      <article
        style={{
          width: '100%',
          height: articleH,
          boxSizing: 'border-box',
          background: '#efe4ff',
          color: '#1a1028',
          borderTop: '6px solid #fff6ff',
          borderLeft: '6px solid #fff6ff',
          borderBottom: '6px solid #3a2260',
          borderRight: '6px solid #3a2260',
          boxShadow: story ? '16px 16px 0 #120a22' : '12px 12px 0 #120a22',
        }}
      >
        <header
          style={{
            height: titleH,
            boxSizing: 'border-box',
            background: '#4b1d78',
            color: '#ffe14a',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: story ? '0 22px' : '0 16px',
            fontFamily: PIXEL,
            fontSize: story ? 20 : 16,
          }}
        >
          <span>LORE CARD</span>
          <span style={{ background: '#67f2e4', color: '#1a1028', padding: story ? '6px 10px' : '4px 8px' }}>
            {rare ? 'RARE' : 'COMMON'}
          </span>
        </header>
        <div
          style={{
            height: contentH,
            boxSizing: 'border-box',
            overflow: 'hidden',
            padding: story ? '32px 40px 12px' : '20px 24px 8px',
          }}
        >
          <p style={{ margin: 0, fontFamily: PIXEL, fontSize: story ? 18 : 14, color: '#4b1d78' }}>
            {model.rangeLabel.toUpperCase()}
          </p>
          <h2
            style={{
              margin: story ? '16px 0 0' : '12px 0 0',
              fontFamily: DISPLAY,
              fontWeight: 400,
              fontSize: epithetSize,
              lineHeight: 1.16,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              textWrap: 'balance',
              overflowWrap: 'break-word',
            }}
          >
            {model.epithet}
          </h2>
          <div style={{ display: 'flex', gap: 8, marginTop: story ? 20 : 14 }}>
            {['#ff4fa3', '#ffe14a', '#67f2e4', '#4b1d78'].map((color) => (
              <span
                key={color}
                style={{
                  width: story ? 26 : 16,
                  height: story ? 26 : 16,
                  background: color,
                  border: '2px solid #1a1028',
                }}
              />
            ))}
          </div>
          {story && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 28 }}>
              <span style={{ fontFamily: DISPLAY, fontSize: 112, lineHeight: 0.85, color: '#4b1d78' }}>{model.total}</span>
              <span style={{ fontFamily: PIXEL, fontSize: 18, paddingBottom: 10 }}>SHOTS KEPT</span>
            </div>
          )}
          <div style={{ marginTop: story ? 28 : 18, display: 'flex', flexDirection: 'column', gap: story ? 12 : 8 }}>
            {stats.map((theme, index) => (
              <div
                key={theme.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  background: index % 2 ? '#f7f1ff' : '#e2d2ff',
                  borderTop: '3px solid #fff',
                  borderLeft: '3px solid #fff',
                  borderBottom: '3px solid #6b4a96',
                  borderRight: '3px solid #6b4a96',
                  padding: story ? '12px 14px' : '8px 10px',
                }}
              >
                <span style={{ fontFamily: PIXEL, fontSize: story ? 18 : 14, flex: 'none' }}>
                  {['HP', 'ATK', 'DEF'][index] ?? 'XP'}
                </span>
                <span
                  style={{
                    fontFamily: BODY,
                    fontSize: story ? 26 : 18,
                    fontWeight: 700,
                    textAlign: 'right',
                    lineHeight: 1.25,
                  }}
                >
                  {theme.label}{' '}
                  <span style={{ fontFamily: PIXEL, fontWeight: 400, fontSize: story ? 18 : 14 }}>
                    {Math.max(1, Math.round(theme.share * model.total))}
                  </span>
                </span>
              </div>
            ))}
            {!story && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: PIXEL,
                  fontSize: 14,
                  padding: '4px 4px 0',
                }}
              >
                <span>SHOTS</span>
                <span>{model.total}</span>
              </div>
            )}
          </div>
          {story && model.eras.length > 0 && (
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontFamily: PIXEL, fontSize: 16, color: '#4b1d78' }}>CHAPTERS</p>
              {model.eras.slice(0, 4).map((era) => (
                <div key={era.label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ width: 18, height: 18, background: era.color, border: '2px solid #1a1028', flex: 'none' }} />
                  <span style={{ fontFamily: BODY, fontSize: 24, fontWeight: 700, lineHeight: 1.3 }}>{era.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            height: flavorH,
            boxSizing: 'border-box',
            margin: story ? '0 40px' : '0 24px',
            background: '#1a1028',
            color: '#67f2e4',
            padding: story ? '18px 18px' : '12px 12px',
            overflow: 'hidden',
          }}
        >
            <p
              style={{
                margin: 0,
                fontFamily: BODY,
                fontSize: story ? 28 : 20,
                lineHeight: 1.35,
                fontWeight: 700,
              }}
            >
              {model.closingLine}
            </p>
            {model.guesses.length > 0 && (
              <p style={{ margin: story ? '12px 0 0' : '8px 0 0', fontFamily: PIXEL, fontSize: story ? 16 : 13, lineHeight: 1.5 }}>
                GUESS: {model.guesses.map((guess) => guess.guess).join(', ').toUpperCase()}
              </p>
            )}
        </div>
      </article>
    </div>
  )
}
