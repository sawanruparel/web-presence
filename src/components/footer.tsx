export function Footer() {
  return (
    <footer className="mt-12 text-sm flex justify-between items-center" style={{ color: 'var(--color-text-muted)' }}>
      <span>© 2025 · built by cursor, chatgpt, gemini.</span>
      <div className="flex gap-4">
        <a href="/rss" className="hover:underline">RSS</a>
        <a href="/resume" className="hover:underline">Resume</a>
        <a href="https://linkedin.com/in/sawanruparel" className="hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn</a>
      </div>
    </footer>
  )
}