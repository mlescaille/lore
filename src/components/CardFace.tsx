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

export function CardFace({ model, nodeRef }: { model: CardModel; nodeRef?: Ref<HTMLDivElement> }) {
  const story = model.size === 'story'
  const width = 1080
  const height = story ? 1920 : 1080
  const pad = story ? 88 : 64
  const epithetSize = model.epithet.length > 58 ? (story ? 78 : 54) : model.epithet.length > 44 ? (story ? 88 : 60) : story ? 100 : 68
  const ink = '#1a1612'
  const soft = '#5e564c'
  const line = '#e4d9c8'
  const paper = '#f3eee4'

  const shell: CSSProperties = {
    width,
    height,
    boxSizing: 'border-box',
    background: paper,
    color: ink,
    padding: pad,
    display: 'flex',
    flexDirection: 'column',
    gap: story ? 36 : 22,
    fontFamily: '"Outfit Variable", sans-serif',
  }
  const display: CSSProperties = {
    fontFamily: '"Fraunces Variable", Georgia, serif',
    fontWeight: 560,
    letterSpacing: '-0.03em',
    lineHeight: 1.02,
    margin: 0,
  }

  return (
    <div ref={nodeRef} style={shell}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <strong style={{ ...display, fontSize: story ? 42 : 28, fontStyle: 'italic', color: '#ef5b3c' }}>Lore</strong>
        <span style={{ letterSpacing: '0.16em', textTransform: 'uppercase', fontSize: story ? 18 : 14, color: soft }}>
          screenshot biography
        </span>
      </div>
      <h2 style={{ ...display, fontSize: epithetSize, maxWidth: 920 }}>{model.epithet}</h2>
      <p style={{ margin: 0, fontSize: story ? 28 : 22, color: soft }}>
        {model.rangeLabel}
        {model.total > 0 ? ` · ${model.total} screenshots` : ''}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: story ? 18 : 12 }}>
        {model.themes.map((theme) => (
          <div key={theme.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: story ? 28 : 22, marginBottom: 6 }}>
              <span>{theme.label}</span>
              <span>{Math.round(theme.share * 100)}%</span>
            </div>
            <div style={{ height: story ? 14 : 10, background: '#e7dfd1', borderRadius: 99 }}>
              <div style={{ width: `${Math.max(4, Math.round(theme.share * 100))}%`, height: '100%', background: theme.color, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
      {model.guesses.length > 0 && (
        <div style={{ borderTop: `1px solid ${line}`, paddingTop: story ? 28 : 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <span style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: story ? 16 : 13, color: soft }}>You guessed</span>
            <span style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: story ? 16 : 13, color: soft }}>The record</span>
            {model.guesses.map((guess) => (
              <GuessPair key={guess.guess} guess={guess} story={story} ink={ink} soft={soft} />
            ))}
          </div>
        </div>
      )}
      {model.eras.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 6, height: story ? 120 : 56 }}>
            {model.eras.map((era) => (
              <div
                key={era.label + era.color}
                title={era.label}
                style={{ flexGrow: Math.max(era.share, 0.08), background: era.color, borderRadius: 10 }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: soft, fontSize: story ? 18 : 14 }}>
            <span>{model.eras[0]?.label}</span>
            <span>{model.eras[model.eras.length - 1]?.label}</span>
          </div>
        </div>
      )}
      <p style={{ ...display, fontStyle: 'italic', fontWeight: 460, fontSize: story ? 40 : 28, marginTop: 'auto' }}>{model.closingLine}</p>
      <div style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontSize: story ? 16 : 13, color: soft }}>discover your lore</div>
    </div>
  )
}

function GuessPair({
  guess,
  story,
  ink,
  soft,
}: {
  guess: CardGuessRow
  story: boolean
  ink: string
  soft: string
}) {
  const size = story ? 26 : 20
  return (
    <>
      <span style={{ fontSize: size, color: ink }}>{guess.guess}</span>
      <span style={{ fontSize: size, color: guess.matched ? ink : soft }}>{guess.matched ? guess.matchLabel : '—'}</span>
    </>
  )
}
