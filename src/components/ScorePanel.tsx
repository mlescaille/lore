import { scoreSentence } from '../pipeline/scoring.ts'
import type { ScoreResult } from '../pipeline/scoring.ts'
import { TitleBar } from './Window.tsx'

export function ScorePanel({ score }: { score: ScoreResult }) {
  return (
    <section className="win score-panel">
      <TitleBar title="LORE" />
      <div className="win-body">
        <h2 className="pixel-title">Your guess</h2>
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
      </div>
    </section>
  )
}
