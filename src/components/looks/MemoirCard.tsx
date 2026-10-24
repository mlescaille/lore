import type { CSSProperties, Ref } from 'react'
import type { CardModel } from '../CardFace.tsx'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI']

export function MemoirCard({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const face = '"EB Garamond", Palatino, "Palatino Linotype", serif'
  const orange = '#e24b20'
  const cream = '#f7f3ea'
  const ink = '#1b1714'
  const contents = (model.eras.length > 0 ? model.eras.map((era) => era.label) : model.themes.map((theme) => theme.label)).slice(0, 4)

  const shell: CSSProperties = {
    width: 1080,
    height: story ? 1920 : 1080,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: cream,
    color: ink,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: face,
  }

  const band: CSSProperties = {
    background: orange,
    color: cream,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: story ? '36px 56px' : '22px 44px',
    fontVariant: 'small-caps',
    letterSpacing: '0.22em',
    fontSize: story ? 28 : 20,
  }

  return (
    <div ref={nodeRef} style={shell}>
      <header style={band}>
        <span>Lore Classics</span>
        <span>No. {model.total || '—'}</span>
      </header>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: story ? '72px 80px 36px' : '28px 72px 16px',
        }}
      >
        <p style={{ margin: 0, fontVariant: 'small-caps', letterSpacing: '0.28em', fontSize: story ? 22 : 16 }}>
          a screenshot autobiography
        </p>
        <h2
          style={{
            margin: story ? '28px 0 0' : '14px 0 0',
            fontWeight: 500,
            fontStyle: 'italic',
            fontSize: story ? 92 : 60,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            maxWidth: 860,
          }}
        >
          {model.epithet}
        </h2>
        <div style={{ width: story ? 96 : 64, height: 1, background: ink, margin: story ? '32px 0' : '16px 0' }} />
        <p style={{ margin: 0, fontSize: story ? 32 : 22 }}>{model.rangeLabel}</p>
        {contents.length > 0 && (
          <ol style={{ listStyle: 'none', margin: story ? '36px 0 0' : '16px 0 0', padding: 0, width: '100%', maxWidth: 720 }}>
            {contents.map((label, index) => (
              <li
                key={label}
                style={{
                  display: 'grid',
                  gridTemplateColumns: story ? '64px 1fr' : '46px 1fr',
                  gap: 12,
                  textAlign: 'left',
                  fontSize: story ? 32 : 22,
                  lineHeight: 1.25,
                  padding: story ? '8px 0' : '3px 0',
                  borderTop: index === 0 ? `1px solid ${ink}` : '1px solid rgba(27, 23, 20, 0.2)',
                }}
              >
                <span>{ROMAN[index]}</span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
        )}
        {model.guesses.length > 0 && (
          <p style={{ margin: story ? '28px 0 0' : '14px 0 0', fontSize: story ? 28 : 20, maxWidth: 760 }}>
            The reader guessed {model.guesses.map((guess) => guess.guess).join(', ')}.
            {model.guesses.some((guess) => guess.matched)
              ? ` The text recognized ${model.guesses
                  .filter((guess) => guess.matched && guess.matchLabel)
                  .map((guess) => guess.matchLabel)
                  .join(', ')}.`
              : ' The text declined to agree.'}
          </p>
        )}
        <p style={{ marginTop: 'auto', marginBottom: 0, fontStyle: 'italic', fontSize: story ? 36 : 24, maxWidth: 760, lineHeight: 1.3 }}>
          {model.closingLine}
        </p>
      </div>
      <footer style={band}>
        <span>Printed on this device</span>
        <span>No copies sent</span>
      </footer>
    </div>
  )
}
