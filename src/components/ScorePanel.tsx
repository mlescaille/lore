import type { ScoreResult } from '../pipeline/scoring.ts'
import type { LoreResult } from '../types.ts'

export function ScorePanel({ result, score }: { result: LoreResult; score: ScoreResult }) {
  const top = [...result.themes].sort((a, b) => b.count - a.count).slice(0, 3)
  const matched = new Set(score.matches.filter((match) => match.matched).map((match) => match.themeId))
  const missed = top.filter((theme) => !matched.has(theme.id))
  const headline =
    score.guessCount === 0
      ? 'No guess on the table.'
      : score.matchedCount >= score.guessCount
        ? 'You named every one.'
        : score.matchedCount === 0
          ? 'The record disagreed.'
          : `You named ${score.matchedCount} of ${score.guessCount}.`

  return (
    <section className="score-panel">
      <p className="eyebrow">The gap</p>
      <h2 className="score-hero">{headline}</h2>
      <div className="score-columns">
        <div>
          <h3>You guessed</h3>
          <ol className="match-list">
            {score.matches.map((match) => (
              <li key={match.guess}>
                <span>{match.guess}</span>
                <span className={match.matched ? 'link-mark' : 'link-miss'} aria-hidden="true">
                  {match.matched ? '→' : '×'}
                </span>
                <span>{match.matched ? match.themeLabel : 'not in the record'}</span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3>The record</h3>
          <ol className="rank-list">
            {top.map((theme, index) => (
              <li key={theme.id}>
                <em>{index + 1}</em>
                <span>{theme.label}</span>
                <strong>{theme.count}</strong>
              </li>
            ))}
          </ol>
          {missed.length > 0 && (
            <p className="note">You didn’t name {missed.map((theme) => theme.label).join(', ')}.</p>
          )}
        </div>
      </div>
    </section>
  )
}
