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

const INK = '#14081c'
const PAPER = '#fbf7ff'
const STRIPE = '#e4d2fb'
const ROW = '#f6efff'
const CHROME = '#2a0c48'
const BUTTER = '#ffe14a'
const AQUA = '#8ff6ea'
const CREAM = '#fffdf8'
const DECK = ['#ff4fa3', BUTTER, AQUA, CHROME]
const STATS = ['HP', 'ATK', 'DEF']

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
  const pad = story ? 36 : 28
  const headerH = story ? 88 : 76
  const flavorH = story ? 268 : 212
  const rows = [...stats.map((theme, index) => ({
    key: theme.label,
    stat: STATS[index] ?? 'XP',
    label: theme.label,
    value: Math.max(1, Math.round(theme.share * model.total)),
    color: theme.color,
  }))]
  if (!story) {
    rows.push({ key: 'shots', stat: 'SHOTS', label: 'Kept in the record', value: model.total, color: BUTTER })
  }
  const maxValue = Math.max(...rows.map((row) => row.value), 1)

  const shell: CSSProperties = {
    width: 1080,
    height: outer,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: '#1a062e',
    padding: pad,
    display: 'flex',
  }

  return (
    <div ref={nodeRef} style={shell}>
      <article
        style={{
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          background: PAPER,
          color: INK,
          borderTop: '6px solid #fffdf8',
          borderLeft: '6px solid #fffdf8',
          borderBottom: '6px solid #1a062e',
          borderRight: '6px solid #1a062e',
          boxShadow: story ? '16px 16px 0 #0c0614' : '12px 12px 0 #0c0614',
        }}
      >
        <header
          style={{
            height: headerH,
            flex: 'none',
            boxSizing: 'border-box',
            background: CHROME,
            color: BUTTER,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: story ? '0 28px' : '0 22px',
            borderBottom: '5px solid ' + BUTTER,
            fontFamily: PIXEL,
            fontSize: story ? 24 : 20,
            lineHeight: 1,
            letterSpacing: '0.04em',
          }}
        >
          <span>LORE CARD</span>
          <span
            style={{
              background: AQUA,
              color: INK,
              padding: story ? '10px 16px' : '8px 12px',
              fontSize: story ? 20 : 18,
              borderTop: '3px solid #fff',
              borderLeft: '3px solid #fff',
              borderBottom: '3px solid #0e6e64',
              borderRight: '3px solid #0e6e64',
            }}
          >
            {rare ? 'RARE' : 'COMMON'}
          </span>
        </header>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: story ? 22 : 16,
            boxSizing: 'border-box',
            overflow: 'hidden',
            padding: story ? '32px 40px 28px' : '22px 28px 18px',
          }}
        >
          <p
            style={{
              margin: 0,
              flex: 'none',
              fontFamily: BODY,
              fontSize: story ? 22 : 18,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1.3,
              color: INK,
            }}
          >
            {model.rangeLabel}
          </p>
          <h2
            style={{
              margin: 0,
              flex: 'none',
              fontFamily: DISPLAY,
              fontWeight: 400,
              fontSize: epithetSize,
              lineHeight: 1.16,
              letterSpacing: '0.01em',
              textTransform: 'uppercase',
              textWrap: 'balance',
              overflowWrap: 'break-word',
              color: INK,
            }}
          >
            {model.epithet}
          </h2>
          <div
            style={{
              flex: 'none',
              display: 'flex',
              height: story ? 36 : 28,
              border: '4px solid ' + INK,
            }}
          >
            {DECK.map((color) => (
              <span key={color} style={{ flex: 1, background: color }} />
            ))}
          </div>
          {story && (
            <div
              style={{
                flex: 'none',
                display: 'flex',
                alignItems: 'flex-end',
                gap: 18,
                background: STRIPE,
                borderTop: '3px solid #fff',
                borderLeft: '3px solid #fff',
                borderBottom: '3px solid #4a2878',
                borderRight: '3px solid #4a2878',
                padding: '12px 18px',
              }}
            >
              <span style={{ fontFamily: DISPLAY, fontSize: 88, lineHeight: 0.85, color: CHROME }}>{model.total}</span>
              <span style={{ fontFamily: BODY, fontSize: 24, fontWeight: 700, paddingBottom: 8, color: INK }}>shots kept</span>
            </div>
          )}
          <div
            style={{
              flex: story ? 'none' : 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: story ? 12 : 10,
            }}
          >
            {rows.map((row, index) => (
              <div
                key={row.key}
                style={{
                  flex: story ? 'none' : 1,
                  minHeight: story ? 0 : 108,
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: story ? 16 : 12,
                  background: index % 2 ? ROW : STRIPE,
                  borderTop: '3px solid #fff',
                  borderLeft: '3px solid #fff',
                  borderBottom: '3px solid #4a2878',
                  borderRight: '3px solid #4a2878',
                  padding: story ? '12px 16px' : '10px 14px',
                }}
              >
                <span
                  style={{
                    width: story ? 16 : 14,
                    alignSelf: 'stretch',
                    background: row.color,
                    border: '2px solid ' + INK,
                    flex: 'none',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: story ? 10 : 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        fontFamily: PIXEL,
                        fontSize: story ? 20 : 18,
                        lineHeight: 1,
                        flex: 'none',
                        width: story ? 112 : 96,
                        color: INK,
                      }}
                    >
                      {row.stat}
                    </span>
                    <span
                      style={{
                        fontFamily: BODY,
                        fontSize: story ? 28 : 24,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        flex: 1,
                        minWidth: 0,
                        color: INK,
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{
                        fontFamily: DISPLAY,
                        fontSize: story ? 48 : 40,
                        lineHeight: 1,
                        flex: 'none',
                        color: CHROME,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                  <div
                    style={{
                      height: story ? 28 : 24,
                      boxSizing: 'border-box',
                      background: CHROME,
                      borderTop: '3px solid #1a062e',
                      borderLeft: '3px solid #1a062e',
                      borderBottom: '3px solid #fff',
                      borderRight: '3px solid #fff',
                      padding: 3,
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.max(10, Math.round((row.value / maxValue) * 100))}%`,
                        height: '100%',
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {story && model.eras.length > 0 && (
            <div style={{ flex: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontFamily: BODY, fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK }}>
                Chapters
              </p>
              {model.eras.slice(0, 4).map((era) => (
                <div key={era.label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ width: 18, height: 18, background: era.color, border: '2px solid ' + INK, flex: 'none' }} />
                  <span style={{ fontFamily: BODY, fontSize: 24, fontWeight: 700, lineHeight: 1.3, color: INK }}>{era.label}</span>
                </div>
              ))}
            </div>
          )}
          {story && model.guesses.length > 0 && (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, flex: 'none', fontFamily: BODY, fontSize: 20, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK }}>
                Your guess
              </p>
              {model.guesses.map((guess) => (
                <div
                  key={guess.guess}
                  style={{
                    flex: 1,
                    minHeight: 64,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    background: guess.matched ? '#e7fff8' : '#ffe4f1',
                    borderTop: '3px solid #fff',
                    borderLeft: '3px solid #fff',
                    borderBottom: '3px solid #4a2878',
                    borderRight: '3px solid #4a2878',
                    padding: '8px 16px',
                  }}
                >
                  <span
                    style={{
                      flex: 'none',
                      fontFamily: PIXEL,
                      fontSize: 16,
                      lineHeight: 1,
                      color: guess.matched ? INK : CREAM,
                      background: guess.matched ? AQUA : '#8d1248',
                      border: '3px solid ' + INK,
                      padding: '10px 12px',
                    }}
                  >
                    {guess.matched ? 'HIT' : 'MISS'}
                  </span>
                  <span style={{ fontFamily: BODY, fontSize: 28, fontWeight: 700, lineHeight: 1.2, color: INK }}>{guess.guess}</span>
                  {guess.matched && guess.matchLabel && (
                    <span style={{ marginLeft: 'auto', fontFamily: BODY, fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: INK, textAlign: 'right' }}>
                      {guess.matchLabel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            height: flavorH,
            flex: 'none',
            boxSizing: 'border-box',
            background: INK,
            color: CREAM,
            padding: story ? '28px 40px' : '22px 28px',
            borderTop: '6px solid ' + BUTTER,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: story ? 16 : 12,
            overflow: 'hidden',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: BODY,
              fontSize: story ? 34 : 28,
              lineHeight: 1.35,
              fontWeight: 700,
              color: CREAM,
            }}
          >
            {model.closingLine}
          </p>
          {model.guesses.length > 0 && (
            <p
              style={{
                margin: 0,
                fontFamily: BODY,
                fontSize: story ? 24 : 20,
                lineHeight: 1.4,
                fontWeight: 700,
                color: BUTTER,
              }}
            >
              Guessed {model.guesses.map((guess) => guess.guess).join(', ')}
            </p>
          )}
        </div>
      </article>
    </div>
  )
}
