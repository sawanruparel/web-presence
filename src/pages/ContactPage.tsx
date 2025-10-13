export function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Contact</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Get in touch for collaborations, speaking, or just to chat about technology.
        </p>
        <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/" className="hover:underline">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/teachings" className="hover:underline">Teachings</a>
          <a href="/ideas" className="hover:underline">Ideas</a>
          <a href="/contact" className="hover:underline font-semibold">Contact</a>
        </nav>
      </header>

      <section className="mt-10">
        <div className="prose prose-lg max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>
          <p>
            I'm always interested in connecting with fellow technologists, discussing AI in healthcare, 
            or sharing insights about engineering leadership.
          </p>

          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
            Get in Touch
          </h2>

          <div className="space-y-6">
            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Professional Network
              </h3>
              <p>
                Connect with me on LinkedIn for professional discussions and networking.
              </p>
              <p>
                <a 
                  href="https://linkedin.com/in/sawanruparel" 
                  className="hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  linkedin.com/in/sawanruparel
                </a>
              </p>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Writing & Thoughts
              </h3>
              <p>
                I occasionally write about technology, AI in healthcare, and engineering leadership.
              </p>
              <p>
                <a 
                  href="https://sawanruparel.com" 
                  className="hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  sawanruparel.com
                </a>
              </p>
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                Speaking & Teaching
              </h3>
              <p>
                I speak at conferences and teach workshops on AI, engineering leadership, and technology innovation.
                If you're interested in having me speak at your event, let's connect.
              </p>
            </div>
          </div>

          <p>
            Don't hesitate to reach out if you have an interesting project, question, or just want to chat about technology and its impact on society.
          </p>
        </div>
      </section>

      <footer className="mt-12 text-sm flex justify-between items-center" style={{ color: 'var(--color-text-muted)' }}>
        <span>© 2025 · built by hand.</span>
        <div className="flex gap-4">
          <a href="/rss" className="hover:underline">RSS</a>
          <a href="/resume" className="hover:underline">Resume</a>
          <a href="https://linkedin.com/in/sawanruparel" className="hover:underline" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </footer>
    </main>
  )
}
