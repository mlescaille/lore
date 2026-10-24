import { useState } from 'react'
import { downloadJson } from '../share/export.ts'
import { formatRange, plural } from '../lib/format.ts'
import type { RevealModel } from '../useSession.ts'
import type { ShotRecord } from '../types.ts'
import { BiographyStage } from './BiographyStage.tsx'
import { DotDialog } from './DotDialog.tsx'
import { ScorePanel } from './ScorePanel.tsx'
import { Timeline } from './Timeline.tsx'
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
  const [showImages, setShowImages] = useState(false)
  const [selected, setSelected] = useState<ShotRecord | null>(null)
  const { exclusion, excludedCount } = result.meta
  const parts = [
    exclusion.account ? `${exclusion.account} looked like an account or card number` : '',
    exclusion.medical ? `${exclusion.medical} had a medical term` : '',
    exclusion.blocklist ? `${exclusion.blocklist} matched a word you asked to leave out` : '',
  ].filter(Boolean)
  const theme = result.themes.find((item) => item.id === selected?.themeId)

  return (
    <div className="reveal">
      <ScorePanel result={result} score={score} />
      <p className="exclusion">
        {excludedCount > 0
          ? `Set aside ${plural(excludedCount, 'screenshot')} before looking for a story${parts.length ? `: ${parts.join('; ')}` : ''}. The text was dropped. Only these counts remain.`
          : 'Sensitive-text check: nothing set aside.'}
      </p>
      {result.meta.grouping === 'lexical' && model.kind === 'own' && (
        <p className="note">Themes are grouped by words this time. The meaning model didn’t load. Still nothing uploaded.</p>
      )}
      {model.note && <p className="note">{model.note}</p>}
      {result.records.length === 0 ? (
        <section className="empty-lore">
          <h2>Nothing made it into the story.</h2>
          <p>Everything in this set looked sensitive, so we kept none of the text. That’s the feature.</p>
        </section>
      ) : (
        <Timeline result={result} showImages={showImages} onShowImages={setShowImages} onSelect={setSelected} />
      )}
      {result.chapters.length > 0 && (
        <section className="eras">
          <p className="eyebrow">The eras</p>
          <div className="era-list">
            {result.chapters.map((chapter) => (
              <article key={chapter.id}>
                <p className="eyebrow">{formatRange(chapter.start, chapter.end)}</p>
                <h3>{chapter.title}</h3>
                <p>{chapter.narrative}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      {result.biography.turningPoints.length > 0 && (
        <section className="turns">
          <h2>Where it shifted</h2>
          <ul>
            {result.biography.turningPoints.map((point) => (
              <li key={point.date + point.toThemeId}>{point.line}</li>
            ))}
          </ul>
        </section>
      )}
      <BiographyStage result={result} score={score} />
      <p className="epilogue">{result.biography.epilogue}</p>
      <div className="keep-row">
        <label className="switch">
          <input type="checkbox" checked={model.kept} onChange={(event) => onKeep(event.target.checked)} />
          <span>Keep this reading on this device</span>
        </label>
        <p className="fine">Saves the themes, dates, and text in this browser. Not the image files. Forget wipes it.</p>
        <div className="actions">
          <Button
            variant="ghost"
            onClick={() => downloadJson(result)}
          >
            Download data.json
          </Button>
          <Button variant="quiet" onClick={onAnother}>
            Read another roll
          </Button>
        </div>
        <p className="fine">data.json includes the text read from your screenshots. The image card does not.</p>
      </div>
      <DotDialog
        record={selected}
        theme={theme}
        imageUrl={selected ? resolveImage(selected.id) : null}
        showImages={showImages}
        onShowImages={setShowImages}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
