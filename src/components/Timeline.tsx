import { colorForTheme, formatDay } from '../lib/format.ts'
import type { LoreResult, ShotRecord } from '../types.ts'

export function Timeline({
  result,
  showImages,
  onShowImages,
  onSelect,
}: {
  result: LoreResult
  showImages: boolean
  onShowImages: (on: boolean) => void
  onSelect: (record: ShotRecord) => void
}) {
  const records = result.records
  if (records.length === 0) return null
  const min = new Date(records[0].timestamp).getTime()
  const max = new Date(records[records.length - 1].timestamp).getTime()
  const span = Math.max(1, max - min)
  const low = records.some((record) => record.timestampSource === 'lastModified')
  const ticks = thinTicks(monthTicks(records[0].timestamp, records[records.length - 1].timestamp, min, span))

  return (
    <section className="timeline">
      <div className="timeline-head">
        <div>
          <p className="eyebrow">What you actually captured</p>
          <h2>One row per theme. One dot per screenshot.</h2>
        </div>
        <label className="switch">
          <input type="checkbox" checked={showImages} onChange={(event) => onShowImages(event.target.checked)} />
          <span>Show screenshots</span>
        </label>
      </div>
      <div className="plot">
        <div className="ticks" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick.label + tick.at} style={{ left: `${tick.at * 100}%` }}>
              {tick.label}
            </span>
          ))}
        </div>
        {result.themes.map((theme) => {
          const dots = records.filter((record) => record.themeId === theme.id)
          const color = colorForTheme(theme.id, result.themes)
          const share = records.length ? Math.round((theme.count / records.length) * 100) : 0
          return (
            <div className="theme-row" key={theme.id}>
              <div className="theme-name">
                <strong>{theme.label}</strong>
                <em>
                  {theme.count} · {share}%
                </em>
              </div>
              <div className="lane">
                {dots.map((record, index) => {
                  const at = ((new Date(record.timestamp).getTime() - min) / span) * 100
                  const lowConfidence = record.timestampSource === 'lastModified'
                  return (
                    <button
                      key={record.id}
                      type="button"
                      className={lowConfidence ? 'dot is-low' : 'dot'}
                      style={{
                        left: `${records.length === 1 ? 50 : at}%`,
                        background: lowConfidence ? 'transparent' : color,
                        color,
                        transform: `translate(-50%, ${((index % 3) - 1) * 7}px)`,
                      }}
                      aria-label={`${theme.label}, ${formatDay(record.timestamp)}${lowConfidence ? ', file date' : ''}`}
                      onClick={() => onSelect(record)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      {low && (
        <p className="note">
          Rings instead of filled dots are dates from the file, not the photo. iPhones sometimes drop the original time
          on the way out of Photos.
        </p>
      )}
    </section>
  )
}

function thinTicks(ticks: { label: string; at: number }[]) {
  const kept: { label: string; at: number }[] = []
  for (const tick of ticks) {
    const prev = kept[kept.length - 1]
    if (prev && tick.at - prev.at < 0.075) continue
    kept.push(tick)
  }
  return kept
}

function monthTicks(start: string, end: string, min: number, span: number) {
  const a = new Date(start)
  const b = new Date(end)
  const cursor = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1))
  const ticks: { label: string; at: number }[] = []
  while (cursor.getTime() <= b.getTime() + 1) {
    const at = (cursor.getTime() - min) / span
    if (at >= -0.02 && at <= 1.02) {
      ticks.push({
        label: cursor.toLocaleString('en', { month: 'short', timeZone: 'UTC' }),
        at: Math.min(1, Math.max(0, at)),
      })
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  }
  return ticks
}
