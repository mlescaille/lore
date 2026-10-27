import { suggestionFor } from '../pipeline/biography.ts'
import { formatRange, plural } from '../lib/format.ts'
import { downloadJson } from '../share/export.ts'
import type { RevealModel } from '../useSession.ts'
import { BiographyStage } from './BiographyStage.tsx'
import { ScorePanel } from './ScorePanel.tsx'
import { TitleBar } from './Window.tsx'
import { Button } from './ui/button.tsx'

export function Reveal({
  model,
  resolveImage,
  onKeep,
  onAnother,
}: {
  model: RevealModel
  resolveImage: (id: string) => string | null
  onKeep: (on: boolean) => void
  onAnother: () => void
}) {
  const { result, score } = model
  const top = [...result.themes].sort((a, b) => b.count - a.count).slice(0, 3)
  const start = result.records[0]?.timestamp
  const end = result.records[result.records.length - 1]?.timestamp
  const range = start && end ? formatRange(start, end) : ''
  const empty = result.records.length === 0

  return (
    <div className="reveal">
      <section className="win lore-result">
        <TitleBar title="LORE" />
        <div className="win-body">
          <h1 className="pixel-title">Your lore</h1>
          {empty ? (
            <p className="body">Everything in this set looked private, so there is no portrait. That is on purpose.</p>
          ) : (
            <>
              <p className="body">Here is what you keep saving.</p>
              <p className="lore-title">{result.biography.epithet}</p>
              <ol className="lore-themes">
                {top.map((theme) => {
                  const shots = result.records.filter((record) => record.themeId === theme.id).slice(0, 3)
                  return (
                    <li key={theme.id}>
                      <div className="thumbs">
                        {shots.map((shot) => {
                          const src = resolveImage(shot.id)
                          if (!src) return null
                          return <img key={shot.id} src={src} alt="" />
                        })}
                      </div>
                      <h2>{theme.label}</h2>
                      <p className="count">{plural(theme.count, 'screenshot')}</p>
                      <p className="body">{suggestionFor(theme.id, theme.label)}</p>
                    </li>
                  )
                })}
              </ol>
              <p className="fine">
                {range ? `${range} · ` : ''}
                {plural(result.records.length, 'screenshot')}
              </p>
            </>
          )}
          {result.meta.excludedCount > 0 && (
            <p className="fine">
              Set aside {plural(result.meta.excludedCount, 'screenshot')} that looked private. Only the count is kept.
            </p>
          )}
          {result.meta.grouping === 'lexical' && model.kind === 'own' && (
            <p className="fine">Read from the words in the pictures this time. Nothing was uploaded.</p>
          )}
        </div>
      </section>
      <ScorePanel score={score} />
      {!empty && <BiographyStage result={result} />}
      <section className="win keep-row">
        <TitleBar title="LORE" />
        <div className="win-body">
          <h2 className="pixel-title">On this device</h2>
          <p className="body">Save the reading here, or start over. Your screenshot files stay where they were.</p>
          <label className="switch">
            <input type="checkbox" checked={model.kept} onChange={(event) => onKeep(event.target.checked)} />
            <span>Keep this reading on this device</span>
          </label>
          <div className="actions">
            <Button variant="quiet" onClick={() => downloadJson(result)}>
              Download the text
            </Button>
            <Button variant="quiet" onClick={onAnother}>
              Start over
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
