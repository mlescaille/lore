import { scoreSentence } from '../pipeline/scoring.ts'
import type { ScoreResult } from '../pipeline/scoring.ts'

export function ScorePanel({ score }: { score: ScoreResult }) {
  return (
    <section className="score-panel">
      <h2 className="pane-title">Your guess</h2>
      <p className="body">{scoreSentence(score.matchedCount, score.guessCount)}</p>
      {score.matches.length > 0 && (
        <ul className="score-list">
          {score.matches.map((match) => (
            <li key={match.guess}>
              {match.matched && match.themeLabel
                ? `${match.guess} matched ${match.themeLabel}.`
                : `${match.guess} was not in the top themes.`}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
