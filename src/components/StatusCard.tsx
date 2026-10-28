export function StatusCard({
  title,
  detail,
  done = 0,
  total = 0,
  indeterminate = false,
}: {
  title: string
  detail?: string
  done?: number
  total?: number
  indeterminate?: boolean
}) {
  const pct = indeterminate ? 36 : total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  const moving = indeterminate || (pct > 0 && pct < 100)
  const showCount = !indeterminate && total > 0 && total !== 100
  return (
    <section className="status-card" aria-live="polite" aria-busy={indeterminate || pct < 100}>
      <h1 className="pane-title">{title}</h1>
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
      {showCount && <p className="meter-count">{Math.min(done, total)} of {total}</p>}
    </section>
  )
}
