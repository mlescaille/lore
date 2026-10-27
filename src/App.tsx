import { useEffect, useRef } from 'react'
import { Footer } from './components/Footer.tsx'
import { GuessStep } from './components/GuessStep.tsx'
import { Landing } from './components/Landing.tsx'
import { RangeStep } from './components/RangeStep.tsx'
import { Reveal } from './components/Reveal.tsx'
import { StatusCard } from './components/StatusCard.tsx'
import { TitleBar } from './components/Window.tsx'
import { Button } from './components/ui/button.tsx'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './components/ui/dialog.tsx'
import { useSession } from './useSession.ts'

export default function App() {
  const session = useSession()
  const heading = useRef<HTMLElement>(null)
  const { phase } = session

  useEffect(() => {
    heading.current?.focus()
  }, [phase.type])

  const showForget = phase.type !== 'landing' || Boolean(session.saved)

  return (
    <div className="app">
      <header className="mast">
        <div className="shell mast-bar">
          <p className="brand">
            <span className="brand-pip" aria-hidden="true" />
            LORE
          </p>
          {showForget && (
            <Button className="on-dark" variant="quiet" size="sm" onClick={() => session.setConfirming(true)}>
              Forget
            </Button>
          )}
        </div>
      </header>
      <div className="reading">
      <main className="shell" ref={heading} tabIndex={-1}>
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
          <section className="win error-block">
            <TitleBar title="LORE" />
            <div className="win-body">
              <h1 className="pixel-title">That didn’t finish</h1>
              <p className="body">{phase.message}</p>
              <div className="actions">
                <Button size="lg" onClick={session.readAnother}>
                  Start over
                </Button>
              </div>
            </div>
          </section>
        )}
      </main>
      </div>
      <Footer />
      <Dialog open={session.confirming} onOpenChange={session.setConfirming}>
        <DialogContent>
          <header className="titlebar">
            <DialogTitle>Forget this?</DialogTitle>
            <DialogClose className="win-x" aria-label="Close">
              ×
            </DialogClose>
          </header>
          <div className="win-body">
            <DialogDescription className="body">
              This clears Lore on this device. Your screenshots stay where they were.
            </DialogDescription>
            <div className="actions">
              <Button onClick={() => void session.forget()}>Forget</Button>
              <Button variant="ghost" onClick={() => session.setConfirming(false)}>
                Keep it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
