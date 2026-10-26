import { useEffect, useRef } from 'react'
import { Footer } from './components/Footer.tsx'
import { GuessStep } from './components/GuessStep.tsx'
import { Landing } from './components/Landing.tsx'
import { AltBar, LookNav } from './components/looks/AltBar.tsx'
import { ArchiveLanding } from './components/looks/ArchiveLanding.tsx'
import { MemoirLanding } from './components/looks/MemoirLanding.tsx'
import { PosterLanding } from './components/looks/PosterLanding.tsx'
import { ReceiptLanding } from './components/looks/ReceiptLanding.tsx'
import { RetroLanding } from './components/looks/RetroLanding.tsx'
import { ScrapbookLanding } from './components/looks/ScrapbookLanding.tsx'
import { TabloidLanding } from './components/looks/TabloidLanding.tsx'
import { RangeStep } from './components/RangeStep.tsx'
import { Reveal } from './components/Reveal.tsx'
import { StatusCard } from './components/StatusCard.tsx'
import { Button } from './components/ui/button.tsx'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './components/ui/dialog.tsx'
import { currentLook } from './looks/look.ts'
import { useSession } from './useSession.ts'

export default function App() {
  const session = useSession()
  const heading = useRef<HTMLElement>(null)
  const { phase } = session

  useEffect(() => {
    heading.current?.focus()
  }, [phase.type])

  const showForget = phase.type !== 'landing' || Boolean(session.saved)
  const look = currentLook()
  const landingProps = {
    saved: session.saved,
    onFiles: (files: File[]) => void session.startFiles(files),
    onSample: () => void session.startSample(),
    onOpenSaved: session.openSaved,
    onForgetSaved: () => session.setConfirming(true),
  }

  return (
    <div className="app">
      {look === 'desk' ? (
        <header className="topbar">
          <div className="shell bar">
            <p className="brand">Lore</p>
            {showForget && (
              <Button variant="quiet" size="sm" onClick={() => session.setConfirming(true)}>
                Forget
              </Button>
            )}
          </div>
        </header>
      ) : (
        <AltBar look={look} showForget={showForget} onForget={() => session.setConfirming(true)} />
      )}
      <main className="shell" ref={heading} tabIndex={-1}>
        {phase.type === 'landing' && look === 'desk' && <Landing {...landingProps} />}
        {phase.type === 'landing' && look === 'scrapbook' && <ScrapbookLanding {...landingProps} />}
        {phase.type === 'landing' && look === 'tabloid' && <TabloidLanding {...landingProps} />}
        {phase.type === 'landing' && look === 'memoir' && <MemoirLanding {...landingProps} />}
        {phase.type === 'landing' && look === 'receipt' && <ReceiptLanding {...landingProps} />}
        {phase.type === 'landing' && look === 'poster' && <PosterLanding {...landingProps} />}
        {phase.type === 'landing' && look === 'archive' && <ArchiveLanding {...landingProps} />}
        {phase.type === 'landing' && look === 'retro' && <RetroLanding {...landingProps} />}
        {phase.type === 'preparing' && (
          <StatusCard eyebrow="On this device" title={phase.progress.label} detail="Duplicates come out. Dates get read. Nothing is uploaded." done={phase.progress.done} total={phase.progress.total} />
        )}
        {phase.type === 'range' && <RangeStep files={phase.files} note={phase.note} onConfirm={(files) => void session.confirmRange(files)} />}
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
          <StatusCard eyebrow="Still here" title={phase.label} detail="Sensitive shots leave before any theme is named." done={1} total={1} />
        )}
        {phase.type === 'reveal' && (
          <Reveal model={phase.model} resolveImage={session.resolveImage} onKeep={(on) => void session.setKept(on)} onAnother={session.readAnother} />
        )}
        {phase.type === 'error' && (
          <section className="error-block">
            <p className="eyebrow">Held up</p>
            <h1>That didn’t finish.</h1>
            <p className="dek">{phase.message}</p>
            <Button size="lg" onClick={session.readAnother}>
              Back to the start
            </Button>
          </section>
        )}
      </main>
      <div className="shell">
        {look !== 'desk' && <LookNav look={look} />}
        <Footer />
      </div>
      <Dialog open={session.confirming} onOpenChange={session.setConfirming}>
        <DialogContent>
          <DialogTitle className="sheet-title">Forget this reading?</DialogTitle>
          <DialogDescription>
            Clears the screen and anything saved on this device. Your files stay where they were. Lore never had a copy on a server.
          </DialogDescription>
          <div className="actions">
            <Button onClick={() => void session.forget()}>Forget</Button>
            <Button variant="ghost" onClick={() => session.setConfirming(false)}>
              Keep it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
