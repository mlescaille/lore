import type { CSSProperties, Ref } from 'react'

export interface CardThemeRow {
  label: string
  count: number
  line: string
}

export interface CardModel {
  epithet: string
  rangeLabel: string
  total: number
  themes: CardThemeRow[]
  size: 'square' | 'story'
}

const PIXEL = 'Silkscreen, ui-monospace, monospace'
const BODY = '"Atkinson Hyperlegible", sans-serif'
const INK = '#140018'
const YELLOW = '#ffe600'
const MAGENTA = '#ff2bd6'
const LIME = '#c6ff00'
const CYAN = '#00e5ff'
const TANGERINE = '#ff5a00'
const COBALT = '#0033ff'
const ROWS = [LIME, CYAN, TANGERINE]

/** Display size for the portrait title. Longer lines step down so they wrap on words. */
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

function shots(count: number): string {
  return count === 1 ? '1 screenshot' : `${count} screenshots`
}

export function CardFace({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const outer = story ? 1920 : 1080
  const pad = story ? 48 : 36
  const epithetSize = epithetFontSize(model.epithet, story)

  const shell: CSSProperties = {
    width: 1080,
    height: outer,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: COBALT,
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
          background: YELLOW,
          color: INK,
          borderTop: '6px solid #ffffff',
          borderLeft: '6px solid #ffffff',
          borderBottom: '6px solid #001466',
          borderRight: '6px solid #001466',
        }}
      >
        <header
          style={{
            flex: 'none',
            background: MAGENTA,
            color: INK,
            fontFamily: PIXEL,
            fontSize: story ? 28 : 22,
            lineHeight: 1.3,
            letterSpacing: '0.04em',
            padding: story ? '22px 40px' : '16px 32px',
            borderBottom: '5px solid ' + YELLOW,
          }}
        >
          Your lore
        </header>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: story ? 28 : 18,
            padding: story ? '40px 48px 36px' : '28px 36px 24px',
            overflow: 'hidden',
          }}
        >
          <h2
            style={{
              margin: 0,
              flex: 'none',
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: epithetSize,
              lineHeight: 1.2,
              textWrap: 'balance',
              overflowWrap: 'break-word',
              color: INK,
            }}
          >
            {model.epithet}
          </h2>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: story ? 20 : 12 }}>
            {model.themes.map((theme, index) => (
              <div
                key={theme.label}
                style={{
                  background: ROWS[index % ROWS.length],
                  borderTop: '3px solid #ffffff',
                  borderLeft: '3px solid #ffffff',
                  borderBottom: '3px solid #001466',
                  borderRight: '3px solid #001466',
                  padding: story ? '16px 18px' : '12px 14px',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontFamily: BODY,
                    fontWeight: 700,
                    fontSize: story ? 36 : 26,
                    lineHeight: 1.2,
                    color: INK,
                  }}
                >
                  {theme.label}
                </p>
                <p
                  style={{
                    margin: story ? '8px 0 0' : '4px 0 0',
                    fontFamily: BODY,
                    fontWeight: 700,
                    fontSize: story ? 22 : 18,
                    lineHeight: 1.3,
                    color: INK,
                  }}
                >
                  {shots(theme.count)}
                </p>
                <p
                  style={{
                    margin: story ? '8px 0 0' : '4px 0 0',
                    fontFamily: BODY,
                    fontWeight: 400,
                    fontSize: story ? 26 : 20,
                    lineHeight: 1.35,
                    color: INK,
                  }}
                >
                  {theme.line}
                </p>
              </div>
            ))}
          </div>
          <p
            style={{
              margin: 0,
              flex: 'none',
              fontFamily: BODY,
              fontWeight: 700,
              fontSize: story ? 22 : 18,
              lineHeight: 1.4,
              color: INK,
            }}
          >
            {model.rangeLabel} · {shots(model.total)}
          </p>
        </div>
      </article>
    </div>
  )
}
