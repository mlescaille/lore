import type { SavedReading } from '../../storage/idb.ts'
import { DropZone, RollPicker } from './RollPicker.tsx'

const SHOTS = [
  { id: 'j01', caption: 'dinner, allegedly', tilt: -8, className: 'sb-shot-a' },
  { id: 'j13', caption: 'a trip still in tabs', tilt: 6, className: 'sb-shot-b' },
  { id: 'j28', caption: 'miles, negotiated', tilt: -2, className: 'sb-shot-c' },
]

export function ScrapbookLanding({
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
  const base = import.meta.env.BASE_URL

  return (
    <DropZone className="sb" onFiles={onFiles}>
      <div className="sb-copy">
        <p className="sb-kicker">exhibit A · the camera roll</p>
        <h1 className="sb-title">
          ok. let’s look
          <br />
          at the pictures.
        </h1>
        <p className="sb-dek">
          Guess three themes. Then I tape the year to the table and write, in the margin, what you actually kept.
        </p>
        {saved && (
          <div className="sb-saved">
            <p>There’s already a reading on this device.</p>
            <button type="button" onClick={onOpenSaved}>
              Open it
            </button>
            <button type="button" onClick={onForgetSaved}>
              Forget it
            </button>
          </div>
        )}
        <RollPicker
          onFiles={onFiles}
          onSample={onSample}
          primary="Use my pictures"
          sample="Flip through Jules’s"
          folder="or a whole folder"
        />
        <p className="sb-who">Jules Navarro · fictional · Portland · one year, too many open tabs</p>
        <ul className="sb-stickers">
          <li>0 uploads</li>
          <li>secrets stay out</li>
          <li>500, then we stop</li>
        </ul>
        <details className="look-dates">
          <summary>About the dates</summary>
          <p>
            Original photo time, then the date hiding in the filename, then the file date, which gets a question mark.
            On iPhone, the Photos picker sometimes strips the original time. If every date says today, that’s why.
          </p>
        </details>
      </div>
      <div className="sb-pile" aria-hidden="true">
        {SHOTS.map((shot) => (
          <figure key={shot.id} className={`sb-shot ${shot.className}`} style={{ transform: `rotate(${shot.tilt}deg)` }}>
            <span className="sb-tape" />
            <img src={`${base}sample/${shot.id}.png`} alt="" />
            <figcaption>{shot.caption}</figcaption>
          </figure>
        ))}
      </div>
    </DropZone>
  )
}
