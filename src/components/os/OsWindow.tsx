import { useRef, type PointerEvent, type ReactNode } from 'react'

export function OsWindow({
  title,
  active,
  zIndex,
  x,
  y,
  width,
  height,
  maximized,
  phone,
  className,
  onFocus,
  onClose,
  onMinimize,
  onMaximize,
  onMove,
  children,
}: {
  title: string
  active: boolean
  zIndex: number
  x: number
  y: number
  width?: number
  height?: number
  maximized?: boolean
  phone?: boolean
  className?: string
  onFocus: () => void
  onClose?: () => void
  onMinimize?: () => void
  onMaximize?: () => void
  onMove: (x: number, y: number) => void
  children: ReactNode
}) {
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  function down(event: PointerEvent<HTMLElement>) {
    onFocus()
    if (phone || maximized) return
    if ((event.target as HTMLElement).closest('button')) return
    drag.current = { dx: event.clientX - x, dy: event.clientY - y }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function move(event: PointerEvent<HTMLElement>) {
    if (!drag.current) return
    onMove(event.clientX - drag.current.dx, event.clientY - drag.current.dy)
  }

  function up() {
    drag.current = null
  }

  const style = phone || maximized
    ? { zIndex }
    : { zIndex, left: x, top: y, width, height }

  return (
    <section
      className={['os-window', active ? 'is-active' : '', maximized ? 'is-max' : '', phone ? 'is-phone' : '', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      role="dialog"
      aria-label={title}
      onPointerDown={onFocus}
    >
      <header className="os-title" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
        <span className="os-title-text">{title}</span>
        <span className="os-title-buttons">
          {onMinimize && (
            <button type="button" className="os-ctl" aria-label="Minimize" onClick={onMinimize}>
              _
            </button>
          )}
          {onMaximize && (
            <button type="button" className="os-ctl" aria-label="Maximize" onClick={onMaximize}>
              ▭
            </button>
          )}
          {onClose && (
            <button type="button" className="os-ctl" aria-label="Close" onClick={onClose}>
              ✕
            </button>
          )}
        </span>
      </header>
      <div className="os-client">{children}</div>
    </section>
  )
}
