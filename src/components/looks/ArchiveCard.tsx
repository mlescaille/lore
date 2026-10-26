import type { CSSProperties, Ref } from 'react'
import type { CardModel } from '../CardFace.tsx'

const ROMAN = ['01', '02', '03', '04', '05', '06']

export function ArchiveCard({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const face = 'Spectral, Georgia, serif'
  const ink = '#221e1a'
  const accent = '#8d2f2c'
  const rows = model.themes.slice(0, story ? 6 : 4)

  const shell: CSSProperties = {
    width: 1080,
    height: story ? 1920 : 1080,
    boxSizing: 'border-box',
    overflow: 'hidden',
    background: '#cfc6b8',
    color: ink,
    fontFamily: face,
    padding: story ? 48 : 36,
    display: 'flex',
  }

  return (
    <div ref={nodeRef} style={shell}>
      <article
        style={{
          flex: 1,
          background: '#f4f0e6',
          border: `1px solid ${ink}`,
          outline: `1px solid ${ink}`,
          outlineOffset: story ? 8 : 6,
          padding: story ? '48px 52px 40px' : '28px 36px 24px',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'baseline' }}>
          <div>
            <div style={{ fontVariant: 'small-caps', letterSpacing: '0.18em', fontSize: story ? 24 : 16 }}>Lore Museum of Attention</div>
            <div style={{ fontSize: story ? 22 : 16, marginTop: 4 }}>Department of Kept Things</div>
          </div>
          <div style={{ color: accent, letterSpacing: '0.12em', fontSize: story ? 22 : 16, textAlign: 'right' }}>
            ACC. {model.total || '—'}
            <br />
            {model.rangeLabel}
          </div>
        </header>
        <div style={{ height: 1, background: accent, margin: story ? '28px 0 22px' : '16px 0 12px' }} />
        <p style={{ margin: 0, fontVariant: 'small-caps', letterSpacing: '0.2em', fontSize: story ? 20 : 14 }}>Specimen</p>
        <h2
          style={{
            margin: '8px 0 0',
            fontWeight: 500,
            fontStyle: 'italic',
            fontSize: story ? 72 : 46,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
            maxWidth: 860,
          }}
        >
          {model.epithet}
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: story ? '72px 1fr auto' : '56px 1fr auto',
            gap: story ? '10px 16px' : '6px 12px',
            marginTop: story ? 36 : 18,
            fontSize: story ? 28 : 20,
            alignItems: 'baseline',
          }}
        >
          <span style={{ fontVariant: 'small-caps', letterSpacing: '0.14em', fontSize: story ? 16 : 13 }}>Fig.</span>
          <span style={{ fontVariant: 'small-caps', letterSpacing: '0.14em', fontSize: story ? 16 : 13 }}>Object</span>
          <span style={{ fontVariant: 'small-caps', letterSpacing: '0.14em', fontSize: story ? 16 : 13, textAlign: 'right' }}>Qty</span>
          {rows.map((theme, index) => (
            <Row
              key={theme.label}
              fig={ROMAN[index] ?? String(index + 1)}
              label={theme.label}
              qty={String(Math.max(1, Math.round(theme.share * model.total)))}
            />
          ))}
        </div>
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${ink}`, paddingTop: story ? 22 : 12 }}>
          <p style={{ margin: 0, color: accent, fontVariant: 'small-caps', letterSpacing: '0.16em', fontSize: story ? 18 : 13 }}>
            Curator’s note
          </p>
          <p style={{ margin: '8px 0 0', fontStyle: 'italic', fontSize: story ? 32 : 22, lineHeight: 1.3, maxWidth: 820 }}>{model.closingLine}</p>
          {model.guesses.length > 0 && (
            <p style={{ margin: '8px 0 0', fontSize: story ? 22 : 16 }}>
              Visitor’s guess: {model.guesses.map((guess) => guess.guess).join(', ')}.
            </p>
          )}
          <p style={{ margin: story ? '18px 0 0' : '10px 0 0', fontSize: story ? 18 : 14, letterSpacing: '0.04em' }}>
            On loan from a phone. Not for upload.
          </p>
        </div>
      </article>
    </div>
  )
}

function Row({ fig, label, qty }: { fig: string; label: string; qty: string }) {
  return (
    <>
      <span>{fig}</span>
      <span>{label}</span>
      <span style={{ textAlign: 'right' }}>{qty}</span>
    </>
  )
}
