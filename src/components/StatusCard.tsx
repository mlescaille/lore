import { TitleBar } from './Window.tsx'

export function StatusCard({
  eyebrow,
  title,
  detail,
  done = 0,
  total = 0,
  indeterminate = false,
}: {
  eyebrow: string
  title: string
  detail?: string
  done?: number
  total?: number
  indeterminate?: boolean
}) {
  const pct = indeterminate ? 36 : total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  const moving = indeterminate || (pct > 0 && pct < 100)
  return (
    <section className="win status-card" aria-live="polite" aria-busy={indeterminate || pct < 100}>
      <TitleBar title={eyebrow} />
      <div className="win-body">
        <h2 className="pixel-title">
          {title}
          <span className="cursor" aria-hidden="true" />
        </h2>
        {detail && <p className="body">{detail}</p>}
        <div
          className={indeterminate ? 'install-bar is-indet' : moving ? 'install-bar is-live' : 'install-bar'}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={indeterminate ? undefined : total || 1}
          aria-valuenow={indeterminate ? undefined : Math.min(done, total || 1)}
          aria-label={title}
        >
          <span style={{ width: `${pct}%` }}>
            <i />
          </span>
        </div>
        <p className="meter-count">
          {indeterminate ? 'Still working…' : total > 0 ? `${Math.min(done, total)} of ${total}` : 'Starting…'}
        </p>
      </div>
    </section>
  )
}
