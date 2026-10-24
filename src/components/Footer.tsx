import { ESSAY_URL } from '../config.ts'

export function Footer() {
  return (
    <footer className="site-footer">
      <a href={ESSAY_URL} target="_blank" rel="noreferrer">
        the idea behind Lore
      </a>
    </footer>
  )
}
