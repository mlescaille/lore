import { useCallback, useEffect, useState } from 'react'
import { ESSAY_URL } from './config.ts'
import { GuessStep } from './components/GuessStep.tsx'
import { Landing } from './components/Landing.tsx'
import { OsWindow } from './components/os/OsWindow.tsx'
import { Steps } from './components/os/Steps.tsx'
import { RangeStep } from './components/RangeStep.tsx'
import { Reveal } from './components/Reveal.tsx'
import { StatusCard } from './components/StatusCard.tsx'
import { useSession, type Phase } from './useSession.ts'

type WinId = 'lore' | 'readme' | 'essay' | 'privacy' | 'forget'

const TASK_LABEL: Record<WinId, string> = {
  lore: 'Lore.exe',
  readme: 'Read Me',
  essay: 'Essay.txt',
  privacy: 'Privacy.txt',
  forget: 'Recycle Bin',
}

const START_POS: Record<WinId, { x: number; y: number }> = {
  lore: { x: 196, y: 28 },
  readme: { x: 250, y: 72 },
  essay: { x: 310, y: 110 },
  privacy: { x: 360, y: 148 },
  forget: { x: 420, y: 180 },
}

function stepOf(type: Phase['type']): 1 | 2 | 3 {
  if (type === 'guess') return 2
  if (type === 'finishing' || type === 'reveal' || type === 'error') return 3
  return 1
}

function usePhone() {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const apply = () => setPhone(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return phone
}

export default function App() {
  const session = useSession()
  const phone = usePhone()
  const { phase } = session
  const [open, setOpen] = useState<Record<WinId, boolean>>({
    lore: true,
    readme: false,
    essay: false,
    privacy: false,
    forget: false,
  })
  const [minimized, setMinimized] = useState<Record<WinId, boolean>>({
    lore: false,
    readme: false,
    essay: false,
    privacy: false,
    forget: false,
  })
  const [maximized, setMaximized] = useState<Record<WinId, boolean>>({
    lore: false,
    readme: false,
    essay: false,
    privacy: false,
    forget: false,
  })
  const [pos, setPos] = useState(START_POS)
  const [stack, setStack] = useState<WinId[]>(['lore'])
  const [selected, setSelected] = useState<WinId | null>('lore')
  const [startOpen, setStartOpen] = useState(false)
  const [guessOk, setGuessOk] = useState(false)
  const [now, setNow] = useState(() => new Date())

  const onGuessValidity = useCallback((ok: boolean) => setGuessOk(ok), [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 10000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (session.confirming) focus('forget')
  }, [session.confirming])

  function focus(id: WinId) {
    setOpen((current) => ({ ...current, [id]: true }))
    setMinimized((current) => ({ ...current, [id]: false }))
    setStack((current) => [...current.filter((item) => item !== id), id])
    setStartOpen(false)
  }

  function close(id: WinId) {
    setOpen((current) => ({ ...current, [id]: false }))
    setMinimized((current) => ({ ...current, [id]: false }))
    if (id === 'forget') session.setConfirming(false)
  }

  function minimize(id: WinId) {
    setMinimized((current) => ({ ...current, [id]: true }))
  }

  const front = stack[stack.length - 1]
  const step = stepOf(phase.type)
  const busy =
    phase.type === 'preparing' ||
    phase.type === 'finishing' ||
    (phase.type === 'guess' && phase.holding)
  const loreTitle = phase.type === 'landing' ? 'Welcome to Lore' : 'Lore.exe'

  const icons: { id: WinId; label: string; art: string }[] = [
    { id: 'lore', label: 'Lore.exe', art: 'lore' },
    { id: 'readme', label: 'Read Me', art: 'note' },
    { id: 'essay', label: 'Essay.txt', art: 'doc' },
    { id: 'privacy', label: 'Privacy.txt', art: 'lock' },
    { id: 'forget', label: 'Recycle Bin', art: 'bin' },
  ]

  return (
    <div
      className="os"
      onPointerDown={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('.os-window, .desk-icon, .taskbar, .start-menu')) return
        setStartOpen(false)
        setSelected(null)
      }}
    >
      <div className="desk-surface">
        <div className="desk-icons">
          {icons.map((icon) => (
            <button
              key={icon.id}
              type="button"
              className={selected === icon.id ? 'desk-icon is-selected' : 'desk-icon'}
              data-icon={icon.id}
              onClick={() => setSelected(icon.id)}
              onDoubleClick={() => focus(icon.id)}
            >
              <Icon art={icon.art} />
              <span className="icon-label">{icon.label}</span>
            </button>
          ))}
        </div>

        {open.lore && (
          <OsWindow
            className={minimized.lore ? 'is-lore is-hidden' : 'is-lore'}
            title={loreTitle}
            active={front === 'lore' && !minimized.lore}
            zIndex={20 + stack.indexOf('lore')}
            x={pos.lore.x}
            y={pos.lore.y}
            width={760}
            height={phone ? undefined : 660}
            maximized={maximized.lore}
            phone={phone}
            onFocus={() => focus('lore')}
            onClose={phone ? undefined : () => close('lore')}
            onMinimize={phone ? undefined : () => minimize('lore')}
            onMaximize={phone ? undefined : () => setMaximized((current) => ({ ...current, lore: !current.lore }))}
            onMove={(x, y) => setPos((current) => ({ ...current, lore: { x, y } }))}
          >
            <Steps current={step} />
            <div className="lore-scroll">
              {phase.type === 'landing' && (
                <Landing
                  saved={session.saved}
                  onFiles={(files) => void session.startFiles(files)}
                  onSample={() => void session.startSample()}
                  onOpenSaved={session.openSaved}
                  onForgetSaved={() => session.setConfirming(true)}
                />
              )}
              {phase.type === 'preparing' && (
                <StatusCard
                  title="Reading your screenshots"
                  detail="Nothing is uploaded. Next you’ll guess three themes."
                  done={phase.progress.done}
                  total={phase.progress.total}
                />
              )}
              {phase.type === 'range' && (
                <RangeStep files={phase.files} note={phase.note} onConfirm={(files) => void session.confirmRange(files)} />
              )}
              {phase.type === 'guess' && (
                <GuessStep
                  kind={phase.kind}
                  ready={phase.ready}
                  holding={phase.holding}
                  progress={phase.progress}
                  note={phase.note}
                  onSubmit={(guesses, block) => void session.submitGuess(guesses, block)}
                  onValidity={onGuessValidity}
                />
              )}
              {phase.type === 'finishing' && (
                <StatusCard
                  title="Finding your lore"
                  detail="This stays on your device. Your portrait is next."
                  done={phase.done ?? 0}
                  total={phase.total ?? 0}
                  indeterminate={!phase.total}
                />
              )}
              {phase.type === 'reveal' && (
                <Reveal
                  model={phase.model}
                  resolveImage={session.resolveImage}
                  onKeep={(on) => void session.setKept(on)}
                  onAnother={session.readAnother}
                />
              )}
              {phase.type === 'error' && (
                <section>
                  <h1 className="pane-title">That didn’t finish</h1>
                  <p className="body">{phase.message}</p>
                  <button type="button" className="btn btn-primary" onClick={session.readAnother}>
                    Start over
                  </button>
                </section>
              )}
            </div>
            <div className="step-nav">
              <button type="button" className="btn" disabled={step === 1 || busy} onClick={session.readAnother}>
                Back
              </button>
              {phase.type === 'landing' ? (
                <label className="btn btn-default" htmlFor="shot-files">
                  Next
                </label>
              ) : phase.type === 'guess' && !phase.holding ? (
                <button type="submit" form="lore-guess" className="btn btn-default" disabled={!guessOk}>
                  Next
                </button>
              ) : (
                <button type="button" className="btn" disabled>
                  Next
                </button>
              )}
            </div>
          </OsWindow>
        )}

        {open.readme && (
          <OsWindow
            className={minimized.readme ? 'is-hidden' : ''}
            title="Read Me"
            active={front === 'readme' && !minimized.readme}
            zIndex={20 + stack.indexOf('readme')}
            x={pos.readme.x}
            y={pos.readme.y}
            width={460}
            phone={phone}
            onFocus={() => focus('readme')}
            onClose={() => close('readme')}
            onMinimize={() => minimize('readme')}
            onMove={(x, y) => setPos((current) => ({ ...current, readme: { x, y } }))}
          >
            <div className="note-pane">
              <h1 className="pane-title">About Lore</h1>
              <p className="body">
                Lore turns your screenshots into a short portrait of what you care about. It runs on your computer.
                Nothing is uploaded.
              </p>
              <p className="body">You guess three themes first. Then Lore shows the top three things you keep saving.</p>
            </div>
          </OsWindow>
        )}

        {open.essay && (
          <OsWindow
            className={minimized.essay ? 'is-hidden' : ''}
            title="The Screenshot as Autobiography.txt"
            active={front === 'essay' && !minimized.essay}
            zIndex={20 + stack.indexOf('essay')}
            x={pos.essay.x}
            y={pos.essay.y}
            width={480}
            phone={phone}
            onFocus={() => focus('essay')}
            onClose={() => close('essay')}
            onMinimize={() => minimize('essay')}
            onMove={(x, y) => setPos((current) => ({ ...current, essay: { x, y } }))}
          >
            <div className="note-pane">
              <h1 className="pane-title">The Screenshot as Autobiography</h1>
              <p className="body">A camera roll is a diary. This essay is about why people keep the pictures they keep.</p>
              <a className="text-link" href={ESSAY_URL} target="_blank" rel="noreferrer">
                Open the essay
              </a>
            </div>
          </OsWindow>
        )}

        {open.privacy && (
          <OsWindow
            className={minimized.privacy ? 'is-hidden' : ''}
            title="Privacy.txt"
            active={front === 'privacy' && !minimized.privacy}
            zIndex={20 + stack.indexOf('privacy')}
            x={pos.privacy.x}
            y={pos.privacy.y}
            width={480}
            phone={phone}
            onFocus={() => focus('privacy')}
            onClose={() => close('privacy')}
            onMinimize={() => minimize('privacy')}
            onMove={(x, y) => setPos((current) => ({ ...current, privacy: { x, y } }))}
          >
            <div className="note-pane">
              <h1 className="pane-title">Privacy</h1>
              <ul className="plain-list">
                <li>Screenshots never leave this computer.</li>
                <li>Pictures that look private are skipped. Only the count is kept.</li>
                <li>The picture you share uses theme names, counts, dates, and a title. Not your screenshot words or pictures.</li>
              </ul>
            </div>
          </OsWindow>
        )}

        {open.forget && (
          <OsWindow
            className={minimized.forget ? 'is-hidden' : phone ? 'is-lore' : ''}
            title="Recycle Bin"
            active={front === 'forget' && !minimized.forget}
            zIndex={20 + stack.indexOf('forget')}
            x={pos.forget.x}
            y={pos.forget.y}
            width={440}
            phone={phone}
            onFocus={() => focus('forget')}
            onClose={() => close('forget')}
            onMinimize={() => minimize('forget')}
            onMove={(x, y) => setPos((current) => ({ ...current, forget: { x, y } }))}
          >
            <div className="note-pane">
              <h1 className="pane-title">Forget this?</h1>
              <p className="body">This clears Lore on this computer. Your screenshots stay where they were.</p>
              <div className="actions">
                <button type="button" className="btn btn-default" onClick={() => void session.forget()}>
                  Forget
                </button>
                <button type="button" className="btn" onClick={() => close('forget')}>
                  Cancel
                </button>
              </div>
            </div>
          </OsWindow>
        )}
      </div>

      <footer className="taskbar">
        <button
          type="button"
          className={startOpen ? 'start-btn is-on' : 'start-btn'}
          aria-expanded={startOpen}
          onClick={() => setStartOpen((value) => !value)}
        >
          Start
        </button>
        <div className="task-windows">
          {icons.map((icon) =>
            open[icon.id] ? (
              <button
                key={icon.id}
                type="button"
                className={front === icon.id && !minimized[icon.id] ? 'task-btn is-on' : 'task-btn'}
                onClick={() => {
                  if (front === icon.id && !minimized[icon.id]) minimize(icon.id)
                  else focus(icon.id)
                }}
              >
                {TASK_LABEL[icon.id]}
              </button>
            ) : null,
          )}
        </div>
        <div className="task-clock">
          {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
        {startOpen && (
          <div className="start-menu" role="menu">
            {icons.map((icon) => (
              <button key={icon.id} type="button" role="menuitem" onClick={() => focus(icon.id)}>
                {icon.label}
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  )
}

function Icon({ art }: { art: string }) {
  return (
    <svg className="icon-art" viewBox="0 0 32 32" aria-hidden="true">
      {art === 'lore' && (
        <>
          <rect x="4" y="6" width="24" height="18" fill="#c0c0c0" stroke="#000" strokeWidth="2" />
          <rect x="4" y="6" width="24" height="6" fill="#000080" />
          <rect x="8" y="16" width="16" height="2" fill="#000" />
        </>
      )}
      {art === 'note' && (
        <>
          <rect x="7" y="3" width="18" height="24" fill="#fff" stroke="#000" strokeWidth="2" />
          <path d="M11 11h10M11 16h10M11 21h7" stroke="#000" strokeWidth="2" />
        </>
      )}
      {art === 'doc' && (
        <>
          <path d="M8 3h12l6 6v20H8V3z" fill="#fff" stroke="#000" strokeWidth="2" />
          <path d="M20 3v6h6" fill="none" stroke="#000" strokeWidth="2" />
        </>
      )}
      {art === 'lock' && (
        <>
          <rect x="7" y="14" width="18" height="14" fill="#f7b500" stroke="#000" strokeWidth="2" />
          <path d="M11 14V10a5 5 0 0 1 10 0v4" fill="none" stroke="#000" strokeWidth="2" />
        </>
      )}
      {art === 'bin' && (
        <>
          <path d="M8 10h16l-1 16H9L8 10z" fill="#c0c0c0" stroke="#000" strokeWidth="2" />
          <path d="M6 8h20M13 6h6" stroke="#000" strokeWidth="2" />
        </>
      )}
    </svg>
  )
}
