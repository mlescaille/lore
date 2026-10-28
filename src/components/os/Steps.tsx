const TRAIL = ['Step 1 of 3: Add screenshots', 'Step 2: Guess', 'Step 3: Your lore']
const FULL = ['Step 1 of 3: Add screenshots', 'Step 2 of 3: Guess', 'Step 3 of 3: Your lore']

export function Steps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="steps">
      <p className="steps-current">{FULL[current - 1]}</p>
      <p className="steps-trail">
        {TRAIL.map((label, index) => (
          <span key={label}>
            {index > 0 && <span aria-hidden="true"> → </span>}
            <span className={index + 1 === current ? 'is-now' : undefined}>{label}</span>
          </span>
        ))}
      </p>
    </div>
  )
}
