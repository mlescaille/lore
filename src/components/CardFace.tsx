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

const BODY = '"Atkinson Hyperlegible", sans-serif'
const INK = '#2b2724'
const CREAM = '#fbf4ec'
const NAVY = '#000080'
const GREY = '#c0c0c0'
const DESK = '#008080'
const MUSTARD = '#f7b500'
const WHITE = '#ffffff'
const BLACK = '#000000'

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
  const pad = story ? 36 : 24
  const epithetSize = epithetFontSize(model.epithet, story)

  const shell: CSSProperties = {
    width: 1080,
    height: outer,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: DESK,
    paddingTop: pad,
    paddingLeft: pad,
    paddingRight: pad + 10,
    paddingBottom: pad + 10,
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
          background: GREY,
          color: INK,
          borderTop: '2px solid ' + WHITE,
          borderLeft: '2px solid ' + WHITE,
          borderBottom: '2px solid #404040',
          borderRight: '2px solid #404040',
          boxShadow: '8px 8px 0 ' + BLACK,
        }}
      >
        <header
          style={{
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: NAVY,
            color: WHITE,
            fontFamily: BODY,
            fontWeight: 700,
            fontSize: story ? 28 : 20,
            lineHeight: 1.2,
            padding: story ? '14px 16px' : '10px 12px',
          }}
        >
          <span>Your lore</span>
          <span style={{ display: 'flex', gap: 4 }}>
            {['_', '▭', '✕'].map((glyph) => (
              <span
                key={glyph}
                style={{
                  width: story ? 36 : 26,
                  height: story ? 30 : 22,
                  display: 'grid',
                  placeItems: 'center',
                  background: GREY,
                  color: BLACK,
                  fontSize: story ? 18 : 14,
                  borderTop: '2px solid ' + WHITE,
                  borderLeft: '2px solid ' + WHITE,
                  borderBottom: '2px solid #404040',
                  borderRight: '2px solid #404040',
                }}
              >
                {glyph}
              </span>
            ))}
          </span>
        </header>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: story ? 28 : 16,
            margin: story ? 18 : 12,
            padding: story ? '36px 40px 28px' : '24px 28px 20px',
            background: CREAM,
            borderTop: '2px solid #404040',
            borderLeft: '2px solid #404040',
            borderBottom: '2px solid ' + WHITE,
            borderRight: '2px solid ' + WHITE,
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
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: story ? 22 : 12 }}>
            {model.themes.map((theme, index) => (
              <div
                key={theme.label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: story ? '64px 1fr' : '48px 1fr',
                  gap: story ? 16 : 12,
                  alignItems: 'start',
                  background: WHITE,
                  border: '2px solid ' + BLACK,
                  boxShadow: story ? '8px 8px 0 ' + BLACK : '6px 6px 0 ' + BLACK,
                  padding: story ? '16px 18px' : '12px 14px',
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      width: story ? 44 : 32,
                      height: story ? 36 : 28,
                      display: 'grid',
                      placeItems: 'center',
                      background: MUSTARD,
                      color: BLACK,
                      fontFamily: BODY,
                      fontWeight: 700,
                      fontSize: story ? 22 : 16,
                      border: '2px solid ' + BLACK,
                    }}
                  >
                    {index + 1}
                  </p>
                </div>
                <div>
                  <p style={{ margin: 0, fontFamily: BODY, fontWeight: 700, fontSize: story ? 36 : 26, lineHeight: 1.2, color: INK }}>
                    {theme.label}
                  </p>
                  <p style={{ margin: story ? '8px 0 0' : '4px 0 0', fontFamily: BODY, fontWeight: 700, fontSize: story ? 22 : 18, lineHeight: 1.3, color: INK }}>
                    {shots(theme.count)}
                  </p>
                  <p style={{ margin: story ? '8px 0 0' : '4px 0 0', fontFamily: BODY, fontWeight: 400, fontSize: story ? 26 : 20, lineHeight: 1.35, color: INK }}>
                    {theme.line}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, flex: 'none', fontFamily: BODY, fontWeight: 700, fontSize: story ? 22 : 18, lineHeight: 1.4, color: INK }}>
            {model.rangeLabel} · {shots(model.total)}
          </p>
        </div>
      </article>
    </div>
  )
}
