import type { SavedReading } from '../../storage/idb.ts'
import { DropZone, RollPicker } from './RollPicker.tsx'

export function RetroLanding({
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
    <DropZone className="rt" onFiles={onFiles}>
      <section className="rt-win">
        <header className="rt-titlebar">
          <span>LORE SETUP</span>
          <span aria-hidden="true">_ □</span>
        </header>
        <div className="rt-body">
          <p className="rt-step">STEP 1 OF 2 · ADMIT THE FOLDER</p>
          <h1 className="rt-lead">This installer has opinions.</h1>
          <p className="rt-copy">Guess three themes. Then it opens the pictures and tells you what you actually kept.</p>
          <div className="rt-bar" role="img" aria-label="Still installing">
            <span />
          </div>
          <p className="rt-status">Asking nicely before opening the folder…</p>
          {saved && (
            <div className="rt-saved">
              <button type="button" onClick={onOpenSaved}>
                OPEN LAST FILE
              </button>
              <button type="button" onClick={onForgetSaved}>
                DELETE
              </button>
            </div>
          )}
          <RollPicker onFiles={onFiles} onSample={onSample} primary="My screenshots" sample="Load sample" folder="or a folder" />
          <ul className="rt-facts">
            <li>0 files leave this machine</li>
            <li>Sensitive shots are skipped</li>
            <li>500, then the wizard stops</li>
          </ul>
          <p className="rt-fine">Sample disk: Jules Navarro, fictional, Portland.</p>
          <details className="look-dates">
            <summary>ABOUT DATES</summary>
            <p>
              Photo time, then filename, then the file date, which we flag. iPhones sometimes strip the original time on
              the way out of Photos.
            </p>
          </details>
        </div>
      </section>
    </DropZone>
  )
}
