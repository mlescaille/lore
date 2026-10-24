import type { CSSProperties, Ref } from 'react'
import type { CardModel } from '../CardFace.tsx'

export function TabloidCard({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const display = 'Anton, Impact, sans-serif'
  const text = 'Newsreader, Georgia, serif'
  const mono = '"IBM Plex Mono", ui-monospace, monospace'
  const top = model.themes[0]
  const count = top ? Math.max(1, Math.round(top.share * model.total)) : model.total
  const subject = (top?.label ?? 'a personality').toUpperCase()
  const alibiGuess = model.guesses.find((guess) => guess.matched && guess.matchLabel === top?.label) ?? model.guesses[0]
  const hits = model.guesses.filter((guess) => guess.matched).length

  const shell: CSSProperties = {
    width: 1080,
    height: story ? 1920 : 1080,
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    background: '#f3ecd8',
    color: '#141414',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: text,
  }

  return (
    <div ref={nodeRef} style={shell}>
      <div
        style={{
          position: 'absolute',
          right: story ? 24 : 16,
          top: story ? 200 : 140,
          width: story ? 420 : 280,
          height: story ? 420 : 280,
          borderRadius: '50%',
          backgroundImage: 'radial-gradient(#141414 1.1px, transparent 1.2px)',
          backgroundSize: '6px 6px',
          opacity: 0.18,
          pointerEvents: 'none',
        }}
      />
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'end',
          gap: 12,
          padding: story ? '28px 36px 10px' : '16px 28px 6px',
          borderBottom: '5px solid #141414',
        }}
      >
        <span style={{ fontFamily: mono, fontSize: story ? 18 : 13 }}>VOL. I · NO. {model.total || '—'}</span>
        <strong style={{ fontFamily: display, fontSize: story ? 78 : 52, lineHeight: 0.8, letterSpacing: '0.02em' }}>
          THE DAILY LORE
        </strong>
        <span style={{ fontFamily: mono, fontSize: story ? 18 : 13, textAlign: 'right' }}>{model.rangeLabel}</span>
      </header>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          padding: story ? '10px 36px' : '6px 28px',
          borderBottom: '1px solid #141414',
          fontFamily: mono,
          fontSize: story ? 16 : 12,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <span>Evening edition</span>
        <span>Still free</span>
        <span>Nothing uploaded</span>
      </div>
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: story ? '36px 40px 20px' : '16px 28px 12px' }}>
        <p style={{ margin: 0, fontFamily: mono, color: '#c11212', letterSpacing: '0.16em', fontSize: story ? 22 : 14 }}>
          {model.guesses.length > 0 ? `${hits} OF ${model.guesses.length} GUESSES SURVIVED` : 'CAMERA ROLL, EXPOSED'}
        </p>
        <p style={{ margin: story ? '8px 0 0' : '2px 0 0', fontFamily: display, fontSize: story ? 220 : 132, lineHeight: 0.8 }}>
          {count}
        </p>
        <h2 style={{ margin: 0, fontFamily: display, fontWeight: 400, fontSize: story ? 78 : 52, lineHeight: 0.88, letterSpacing: '0.01em' }}>
          SHOTS OF {subject}
        </h2>
        <p style={{ margin: story ? '18px 0 0' : '8px 0 0', fontFamily: text, fontStyle: 'italic', fontSize: story ? 40 : 26, lineHeight: 1.15, maxWidth: 920 }}>
          also known as {model.epithet}
        </p>
        {alibiGuess && (
          <p style={{ margin: story ? '16px 0 0' : '8px 0 0', fontFamily: display, fontSize: story ? 48 : 32, lineHeight: 0.95 }}>
            THE ALIBI WAS “{alibiGuess.guess.toUpperCase()}”
          </p>
        )}
        {model.guesses.length > 0 && (
          <div
            style={{
              marginTop: 'auto',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: story ? '8px 28px' : '4px 20px',
              borderTop: '2px solid #141414',
              paddingTop: story ? 18 : 10,
            }}
          >
            <span style={{ fontFamily: mono, fontSize: story ? 16 : 12, letterSpacing: '0.14em' }}>YOU SAID</span>
            <span style={{ fontFamily: mono, fontSize: story ? 16 : 12, letterSpacing: '0.14em' }}>THE RECORD</span>
            {model.guesses.map((guess) => (
              <Guess key={guess.guess} guess={guess.guess} record={guess.matched ? guess.matchLabel : 'NO COMMENT'} story={story} />
            ))}
          </div>
        )}
      </div>
      <footer
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(model.themes.length, 1)}, 1fr)`,
          background: '#141414',
          color: '#f3ecd8',
        }}
      >
        {model.themes.length === 0 && (
          <div style={{ padding: story ? 28 : 16, fontFamily: display, fontSize: story ? 36 : 24 }}>NOTHING KEPT</div>
        )}
        {model.themes.slice(0, 3).map((theme) => (
          <div key={theme.label} style={{ padding: story ? '22px 24px' : '12px 16px', borderRight: '1px solid #f3ecd8' }}>
            <div style={{ fontFamily: display, fontSize: story ? 42 : 26, lineHeight: 0.9 }}>{Math.round(theme.share * 100)}%</div>
            <div style={{ fontFamily: mono, fontSize: story ? 16 : 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{theme.label}</div>
          </div>
        ))}
      </footer>
      <p style={{ margin: 0, padding: story ? '16px 36px 22px' : '8px 28px 12px', fontStyle: 'italic', fontSize: story ? 28 : 18 }}>
        {model.closingLine}
      </p>
    </div>
  )
}

function Guess({ guess, record, story }: { guess: string; record: string | null; story: boolean }) {
  const size = story ? 28 : 18
  return (
    <>
      <span style={{ fontSize: size }}>{guess}</span>
      <span style={{ fontSize: size, fontWeight: 600 }}>{record}</span>
    </>
  )
}
