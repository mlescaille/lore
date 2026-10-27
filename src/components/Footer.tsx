import { ESSAY_URL } from '../config.ts'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-bar">
        <span className="footer-mark">LORE</span>
        <a href={ESSAY_URL} target="_blank" rel="noreferrer">
          the idea behind Lore
        </a>
      </div>
    </footer>
  )
}
