import { useMemo, useState } from 'react'
import { MAX_SHOTS } from '../config.ts'
import { utcDay } from '../lib/format.ts'
import type { PreparedFile } from '../pipeline/ingest.ts'
import { Button } from './ui/button.tsx'
import { Input } from './ui/input.tsx'

export function RangeStep({
  files,
  note,
  onConfirm,
}: {
  files: PreparedFile[]
  note: string
  onConfirm: (files: PreparedFile[]) => void
}) {
  const bounds = useMemo(() => {
    const days = files.map((file) => utcDay(file.timestamp)).sort()
    return { min: days[0] ?? '', max: days[days.length - 1] ?? '' }
  }, [files])
  const recent = useMemo(
    () => [...files].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, MAX_SHOTS),
    [files],
  )
  const [start, setStart] = useState(utcDay(recent[recent.length - 1]?.timestamp ?? bounds.min))
  const [end, setEnd] = useState(utcDay(recent[0]?.timestamp ?? bounds.max))
  const from = start < end ? start : end
  const to = start < end ? end : start
  const selected = files.filter((file) => {
    const day = utcDay(file.timestamp)
    return day >= from && day <= to
  })
  const lowConfidence = files.filter((file) => file.timestampSource === 'lastModified').length

  return (
    <section className="range-step">
        <h1 className="pane-title">That’s a lot of screenshots</h1>
        <p className="body">
          Pick a stretch of up to {MAX_SHOTS}. Then you’ll guess three themes. These dates start on the most recent ones.
        </p>
        {note && <p className="banner">{note}</p>}
        <div className="date-row">
          <label>
            From
            <Input type="date" value={start} min={bounds.min} max={bounds.max} onChange={(event) => setStart(event.target.value)} />
          </label>
          <label>
            To
            <Input type="date" value={end} min={bounds.min} max={bounds.max} onChange={(event) => setEnd(event.target.value)} />
          </label>
        </div>
        <p className="count-line">
          {selected.length === 0
            ? 'Nothing in these dates.'
            : `${selected.length} screenshot${selected.length === 1 ? '' : 's'} in this stretch.`}
        </p>
        {lowConfidence > files.length / 2 && (
          <p className="note">
            A lot of these dates came from the file, not the photo. On iPhone, the Photos picker sometimes drops the
            original time.
          </p>
        )}
        <div className="actions">
          <Button size="lg" disabled={selected.length === 0 || selected.length > MAX_SHOTS} onClick={() => onConfirm(selected)}>
            Read this stretch
          </Button>
          <Button size="lg" variant="ghost" onClick={() => onConfirm(recent)}>
            Read the most recent {MAX_SHOTS}
          </Button>
        </div>
    </section>
  )
}
