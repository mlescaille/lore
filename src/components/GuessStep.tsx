import { useEffect, useState } from 'react'
import type { Progress } from '../useSession.ts'
import { StatusCard } from './StatusCard.tsx'
import { Input } from './ui/input.tsx'

const PLACEHOLDERS = ['First guess', 'Second guess', 'Third guess']

export function GuessStep({
  ready,
  holding,
  progress,
  note,
  onSubmit,
  onValidity,
}: {
  kind: 'sample' | 'own'
  ready: boolean
  holding: boolean
  progress: Progress
  note: string
  onSubmit: (guesses: string[], block: string) => void
  onValidity?: (ok: boolean) => void
}) {
  const [values, setValues] = useState(['', '', ''])
  const [block, setBlock] = useState('')
  const complete = values.every((value) => value.trim().length >= 2)

  useEffect(() => {
    onValidity?.(complete && !holding)
  }, [complete, holding, onValidity])

  if (holding) {
    return (
      <StatusCard
        title="Reading your screenshots"
        detail={progress.detail || 'This stays on your device. Your lore is next.'}
        done={progress.done}
        total={progress.total}
      />
    )
  }

  return (
    <form
      id="lore-guess"
      className="guess-form"
      onSubmit={(event) => {
        event.preventDefault()
        if (!complete) return
        onSubmit(values, block)
      }}
    >
      <h1 className="pane-title">Before we look</h1>
      <p className="body">What do you think you screenshot most? Pick 3.</p>
      <div className="guess-fields">
        {values.map((value, index) => (
          <label className="guess-field" key={index}>
            <span className="idx">{index + 1}</span>
            <Input
              value={value}
              placeholder={PLACEHOLDERS[index]}
              maxLength={48}
              autoComplete="off"
              enterKeyHint={index === 2 ? 'done' : 'next'}
              aria-label={`Theme ${index + 1}`}
              onChange={(event) => {
                const next = [...values]
                next[index] = event.target.value
                setValues(next)
              }}
            />
          </label>
        ))}
      </div>
      <label className="block-field">
        Leave a name out (optional)
        <Input
          value={block}
          placeholder="a name or a workplace"
          aria-label="Words to leave out"
          onChange={(event) => setBlock(event.target.value)}
        />
      </label>
      {note && <p className="note">{note}</p>}
      {!ready && <p className="note">Still reading your screenshots. You can guess now.</p>}
    </form>
  )
}
