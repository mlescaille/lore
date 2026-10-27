export function TitleBar({ title }: { title: string }) {
  return (
    <header className="titlebar">
      <span className="titlebar-name">{title}</span>
      <span className="titlebar-bits" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </header>
  )
}
