export function StatusCard({
  eyebrow,
  title,
  detail,
  done,
  total,
}: {
  eyebrow: string
  title: string
  detail?: string
  done: number
  total: number
}) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0
  return (
    <section className="status-card" aria-live="polite">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {detail && <p>{detail}</p>}
      <div
        className="meter"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total || 1}
        aria-valuenow={Math.min(done, total || 1)}
        aria-label={title}
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      {total > 0 && (
        <p className="meter-count">
          {Math.min(done, total)} of {total}
        </p>
      )}
    </section>
  )
}
