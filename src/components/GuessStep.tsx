import { useState } from 'react'
import type { Progress } from '../useSession.ts'
import { StatusCard } from './StatusCard.tsx'
import { TitleBar } from './Window.tsx'
import { Button } from './ui/button.tsx'
import { Input } from './ui/input.tsx'

const PLACEHOLDERS = ['a habit', 'a person or place', 'something you kept']

export function GuessStep({
  kind,
  ready,
  holding,
  progress,
  note,
  onSubmit,
}: {
  kind: 'sample' | 'own'
  ready: boolean
  holding: boolean
  progress: Progress
  note: string
  onSubmit: (guesses: string[], block: string) => void
}) {
  const [values, setValues] = useState(['', '', ''])
  const [block, setBlock] = useState('')
  const complete = values.every((value) => value.trim().length >= 2)
  const locked = holding

  return (
    <div className="guess-grid">
      <form
        className="win guess-form"
        onSubmit={(event) => {
          event.preventDefault()
          if (!complete || locked) return
          onSubmit(values, block)
        }}
      >
        <TitleBar title="GUESS.EXE" />
        <div className="win-body">
          <p className="kicker">STEP 2 OF 2 · NAME THE YEAR</p>
          <h1 className="pixel-title">What do you think this year was about?</h1>
          <p className="body">Three themes, in your own words. There are no wrong answers. Only screenshots.</p>
          <div className="guess-fields">
            {values.map((value, index) => (
              <label className="guess-field" key={index}>
                <span className="idx">0{index + 1}</span>
                <Input
                  value={value}
                  placeholder={PLACEHOLDERS[index]}
                  maxLength={48}
                  autoComplete="off"
                  enterKeyHint={index === 2 ? 'done' : 'next'}
                  aria-label={`Theme ${index + 1}`}
                  disabled={locked}
                  onChange={(event) => {
                    const next = [...values]
                    next[index] = event.target.value
                    setValues(next)
                  }}
                />
              </label>
            ))}
          </div>
          <details className="leave-out">
            <summary>Leave words out</summary>
            <p className="body">Names, a workplace, anything that should be dropped before themes. We only keep a count.</p>
            <Input
              value={block}
              placeholder="comma-separated words"
              aria-label="Words to leave out"
              disabled={locked}
              onChange={(event) => setBlock(event.target.value)}
            />
          </details>
          <div className="actions">
            <Button type="submit" size="lg" disabled={!complete || locked}>
              {locked ? 'Holding your guess' : "That's my guess"}
            </Button>
          </div>
          {locked && !ready && <p className="note">We’ll open the record the moment the read finishes.</p>}
          {ready && !locked && <p className="note">The roll is ready. Nothing shows until you guess.</p>}
        </div>
      </form>
      <StatusCard
        eyebrow={kind === 'sample' ? 'SAMPLE ROLL' : 'ON THIS DEVICE'}
        title={progress.label}
        detail={progress.detail || note || 'Names stay hidden until you commit.'}
        done={progress.done}
        total={progress.total}
      />
    </div>
  )
}
