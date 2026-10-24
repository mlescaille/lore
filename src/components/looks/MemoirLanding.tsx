import type { SavedReading } from '../../storage/idb.ts'
import { DropZone, RollPicker } from './RollPicker.tsx'

export function MemoirLanding({
  saved,
  onFiles,
  onSample,
  onOpenSaved,
  onForgetSaved,
}: {
  saved: SavedReading | null
  onFiles: (files: File[]) => void
  onSample: () => void
  onOpenSaved: () => void
  onForgetSaved: () => void
}) {
  return (
    <DropZone className="mm" onFiles={onFiles}>
      <article className="mm-jacket">
        <header className="mm-band">
          <span>Lore Classics</span>
          <span>No. 1</span>
        </header>
        <div className="mm-panel">
          <p className="mm-series">The screenshot autobiography</p>
          <h1 className="mm-title">
            Discover
            <br />
            your lore
          </h1>
          <p className="mm-dek">
            A short book made from pictures you forgot you kept. You guess the plot. The book is then allowed to disagree, gently, and with dates.
          </p>
          {saved && (
            <div className="mm-saved">
              <p>A previous volume is still on this shelf.</p>
              <button type="button" onClick={onOpenSaved}>
                Open it
              </button>
              <button type="button" onClick={onForgetSaved}>
                Pulp it
              </button>
            </div>
          )}
          <RollPicker
            onFiles={onFiles}
            onSample={onSample}
            primary="Begin with my screenshots"
            sample="Read the sample life"
            folder="or a folder"
          />
          <p className="mm-who">The sample life is Jules Navarro’s, Portland, invented, March to February.</p>
        </div>
        <footer className="mm-band mm-band-foot">
          <span>Nothing is uploaded</span>
          <span>Secrets excised</span>
          <span>500 pages, max</span>
        </footer>
      </article>
      <details className="look-dates mm-dates">
        <summary>A note on the dates</summary>
        <p>
          The press date is the photo’s own time, then the date in the filename, then the file’s modified time, which
          we print with a question mark. The iPhone Photos picker sometimes drops the original time. A roll that all
          says today was probably stripped on the way out.
        </p>
      </details>
    </DropZone>
  )
}
