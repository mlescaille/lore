import { useEffect, useRef, useState } from 'react'
import { buildCaption, cardToBlob, downloadBlob, linkedInIntent, shareCard, xIntent } from '../share/export.ts'
import type { ScoreResult } from '../pipeline/scoring.ts'
import { colorForTheme, formatRange } from '../lib/format.ts'
import type { LoreResult } from '../types.ts'
import { CardFace, type CardModel } from './CardFace.tsx'
import { Button } from './ui/button.tsx'

function modelFor(result: LoreResult, score: ScoreResult, size: 'square' | 'story'): CardModel {
  const denom = Math.max(result.records.length, 1)
  const top = [...result.themes].sort((a, b) => b.count - a.count).slice(0, 3)
  const start = result.records[0]?.timestamp ?? result.chapters[0]?.start
  const end = result.records[result.records.length - 1]?.timestamp ?? result.chapters[result.chapters.length - 1]?.end
  const spans = result.chapters.map((chapter) => Math.max(1, new Date(chapter.end).getTime() - new Date(chapter.start).getTime()))
  const spanSum = spans.reduce((sum, value) => sum + value, 0) || 1
  return {
    epithet: result.biography.epithet,
    closingLine: result.biography.closingLine,
    rangeLabel: start && end ? formatRange(start, end) : 'This reading',
    total: result.records.length,
    themes: top.map((theme) => ({
      label: theme.label,
      share: theme.count / denom,
      color: colorForTheme(theme.id, result.themes),
    })),
    guesses: score.matches.map((match) => ({
      guess: match.guess,
      matchLabel: match.themeLabel,
      matched: match.matched,
    })),
    eras: result.chapters.map((chapter, index) => ({
      label: chapter.title,
      share: (spans[index] ?? 1) / spanSum,
      color: colorForTheme(chapter.themeId, result.themes),
    })),
    size,
  }
}

export function BiographyStage({ result, score }: { result: LoreResult; score: ScoreResult }) {
  const [size, setSize] = useState<'square' | 'story'>('square')
  const [width, setWidth] = useState(640)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [canShare, setCanShare] = useState(false)
  const frameRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const model = modelFor(result, score, size)
  const scale = Math.min(1, width / 1080)
  const height = (size === 'story' ? 1920 : 1080) * scale
  const caption = buildCaption(result.biography.epithet)
  const filename = size === 'story' ? 'lore-story.png' : 'lore-square.png'

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && 'share' in navigator)
  }, [])

  useEffect(() => {
    const node = frameRef.current
    if (!node) return
    const observer = new ResizeObserver(() => setWidth(node.clientWidth))
    observer.observe(node)
    setWidth(node.clientWidth)
    return () => observer.disconnect()
  }, [])

  async function png() {
    const node = exportRef.current
    if (!node) throw new Error('Card is not ready')
    return cardToBlob(node)
  }

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setNotice('')
    try {
      await action()
    } catch {
      setNotice('Could not build the image. You can still copy the caption.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card-stage">
      <div className="timeline-head">
        <div>
          <p className="eyebrow">Your card</p>
          <h2>Share the lore, not the screenshots.</h2>
        </div>
        <div className="segmented" role="group" aria-label="Card size">
          <button type="button" className={size === 'square' ? 'is-on' : ''} onClick={() => setSize('square')}>
            Square
          </button>
          <button type="button" className={size === 'story' ? 'is-on' : ''} onClick={() => setSize('story')}>
            Story
          </button>
        </div>
      </div>
      <div className="card-frame" ref={frameRef} style={{ height }}>
        <div style={{ width: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <CardFace model={model} />
        </div>
      </div>
      <div className="export-host" aria-hidden="true">
        <CardFace model={model} nodeRef={exportRef} />
      </div>
      <div className="actions">
        <Button size="lg" disabled={busy} onClick={() => run(async () => downloadBlob(await png(), filename))}>
          {busy ? 'Making the image…' : 'Download PNG'}
        </Button>
        {canShare && (
          <Button
            size="lg"
            variant="paper"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const outcome = await shareCard(await png(), filename, caption)
                if (outcome === 'downloaded') setNotice('This browser can’t share the file, so the image downloaded instead.')
              })
            }
          >
            Share
          </Button>
        )}
        <div className="share-desktop">
          <Button
            size="lg"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              run(async () => {
                downloadBlob(await png(), filename)
                window.open(xIntent(caption), '_blank', 'noopener,noreferrer')
              })
            }
          >
            Post to X
          </Button>
          <Button
            size="lg"
            variant="ghost"
            disabled={busy}
            onClick={() =>
              run(async () => {
                downloadBlob(await png(), filename)
                await navigator.clipboard.writeText(caption).catch(() => {})
                window.open(linkedInIntent(), '_blank', 'noopener,noreferrer')
                setNotice('Caption copied. LinkedIn only takes the link, so paste the line if you want it. The image downloaded too.')
              })
            }
          >
            Post to LinkedIn
          </Button>
        </div>
        <Button
          size="lg"
          variant="quiet"
          onClick={() => {
            void navigator.clipboard.writeText(caption).then(
              () => setNotice('Caption copied.'),
              () => setNotice(caption),
            )
          }}
        >
          Copy caption
        </Button>
      </div>
      {notice && <p className="note">{notice}</p>}
      <p className="caption-preview">{caption}</p>
    </section>
  )
}
