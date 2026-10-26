import type { SavedReading } from '../../storage/idb.ts'
import { DropZone, RollPicker } from './RollPicker.tsx'

export function PosterLanding({
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
    <DropZone className="po" onFiles={onFiles}>
      <div className="po-hero">
        <p className="po-kicker">Year in screenshots</p>
        <h1 className="po-title">
          How many
          <br />
          times did
          <br />
          you keep
          <br />
          <span>the same</span>
          <br />
          picture?
        </h1>
      </div>
      <div className="po-dock">
        {saved && (
          <div className="po-saved">
            <button type="button" onClick={onOpenSaved}>
              Open the last count
            </button>
            <button type="button" onClick={onForgetSaved}>
              Trash it
            </button>
          </div>
        )}
        <RollPicker onFiles={onFiles} onSample={onSample} primary="Count mine" sample="Count Jules" folder="or a folder" />
        <p className="po-note">Jules Navarro, fictional, Portland. 0 uploads. Secrets tossed. 500 max.</p>
        <ul className="po-stats">
          <li>
            <strong>0</strong>
            <span>uploaded</span>
          </li>
          <li>
            <strong>3</strong>
            <span>guesses, then the truth</span>
          </li>
          <li>
            <strong>1</strong>
            <span>year, finally counted</span>
          </li>
        </ul>
      </div>
    </DropZone>
  )
}
