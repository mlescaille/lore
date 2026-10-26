import type { CSSProperties, Ref } from 'react'
import type { CardModel } from '../CardFace.tsx'

const MONO = '"Share Tech Mono", ui-monospace, monospace'

function bars(seed: number): number[] {
  const widths: number[] = []
  let n = Math.abs(seed) || 53
  for (let i = 0; i < 56; i++) {
    n = (n * 1103515245 + 12345) & 0x7fffffff
    widths.push((n % 3) + 1)
  }
  return widths
}

export function ReceiptCard({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const size = story ? 32 : 24
  const hits = model.guesses.filter((guess) => guess.matched).length
  const missed = model.guesses.length - hits
  const items = model.themes.slice(0, story ? 6 : 4)

  const shell: CSSProperties = {
    width: 1080,
    height: story ? 1920 : 1080,
    boxSizing: 'border-box',
    overflow: 'hidden',
    backgroundColor: '#f7f6f2',
    backgroundImage: 'radial-gradient(circle at 18px 0, transparent 11px, #f7f6f2 11.5px)',
    backgroundSize: '36px 18px',
    backgroundRepeat: 'repeat-x',
    color: '#1c1c1c',
    fontFamily: MONO,
    padding: story ? '56px 72px 36px' : '40px 64px 28px',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div ref={nodeRef} style={shell}>
      <p style={{ margin: 0, textAlign: 'center', fontSize: story ? 64 : 44, letterSpacing: '0.18em' }}>LORE</p>
      <p style={{ margin: '6px 0 0', textAlign: 'center', fontSize: story ? 26 : 20 }}>YOUR PHONE · NOTHING UPLOADED</p>
      <Rule gap={story ? 22 : 14} />
      <p style={{ margin: 0, textAlign: 'center', fontSize: story ? 28 : 22 }}>{model.rangeLabel}</p>
      <p style={{ margin: story ? '18px 0 0' : '10px 0 0', textAlign: 'center', fontSize: story ? 34 : 26, lineHeight: 1.35 }}>
        {model.epithet.toUpperCase()}
      </p>
      <Rule gap={story ? 22 : 14} />
      {items.map((theme) => (
        <Row
          key={theme.label}
          left={theme.label.toUpperCase()}
          right={`x${Math.max(1, Math.round(theme.share * model.total))}`}
          size={size}
        />
      ))}
      {model.guesses.length > 0 && (
        <>
          <Rule gap={story ? 22 : 14} />
          <Row left="GUESSES THAT LANDED" right={`x${hits}`} size={size} />
          <Row left="GUESSES, WISHFUL" right={`x${missed}`} size={size} />
        </>
      )}
      <Rule gap={story ? 22 : 14} />
      <Row left="SCREENSHOTS" right={String(model.total)} size={size} />
      <Row left="UPLOADED" right="0.00" size={size} />
      <p style={{ margin: story ? '18px 0 0' : '12px 0 0', display: 'flex', justifyContent: 'space-between', fontSize: story ? 40 : 30 }}>
        <span>TOTAL</span>
        <span>A PERSONALITY</span>
      </p>
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', height: story ? 110 : 72, gap: 2 }}>
          {bars(model.total + items.length).map((width, index) => (
            <span key={index} style={{ display: 'block', width: width * (story ? 5 : 4), background: '#1c1c1c' }} />
          ))}
        </div>
        <p style={{ margin: story ? '22px 0 0' : '14px 0 0', textAlign: 'center', fontSize: story ? 32 : 24, letterSpacing: '0.06em' }}>
          THANK YOU FOR SCREENSHOTTING
        </p>
        <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: story ? 22 : 16 }}>{model.closingLine.toUpperCase()}</p>
      </div>
    </div>
  )
}

function Rule({ gap }: { gap: number }) {
  return <div style={{ borderTop: '2px dashed #1c1c1c', margin: `${gap}px 0` }} />
}

function Row({ left, right, size }: { left: string; right: string; size: number }) {
  return (
    <p style={{ margin: '4px 0', display: 'flex', justifyContent: 'space-between', gap: 24, fontSize: size, lineHeight: 1.3 }}>
      <span>{left}</span>
      <span>{right}</span>
    </p>
  )
}
