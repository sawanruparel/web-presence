import { Footer } from '../components/footer'

export function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 leading-relaxed" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <header>
        <h1 className="text-3xl font-semibold" style={{ color: 'var(--color-text)' }}>Sawan Ruparel</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-muted)' }}>
          Building ventures at the intersection of AI and hardware.
        </p>
        <nav className="mt-4 flex gap-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/" className="hover:underline font-semibold">About</a>
          <a href="/notes" className="hover:underline">Notes</a>
          <a href="/teachings" className="hover:underline">Teachings</a>
          <a href="/ideas" className="hover:underline">Ideas</a>
          <a href="/contact" className="hover:underline">Contact</a>
        </nav>
      </header>

      <section className="mt-10">
        <div className="prose prose-lg max-w-none" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-serif)', lineHeight: '1.8' }}>

          <p>
            Building ventures at the intersection of AI and hardware.
            Teaching applications of generative AI at the University of Connecticut.
          </p>

          <p>
            I explore how humans build, make, and teach through systems—both physical and digital.
            My work blends hardware engineering, AI systems design, and education.
          </p>

          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
            Current Work
          </h3>

          <p>
            I'm building the next generation of AI-powered hardware solutions that bridge the gap between digital intelligence and physical interaction. My focus is on creating devices that understand context, learn from user behavior, and adapt to their environment.
          </p>

          <p>
            In my role at the University of Connecticut, I teach graduate students how to apply generative AI in real-world scenarios. The course covers prompt engineering, model fine-tuning, and building production-ready AI applications.
          </p>

          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
            Background
          </h3>

          <p>
            With over 18 years of experience in software development, I've worked across various industries from healthcare to finance. My journey has taken me from building custom web applications to leading large-scale AI projects that impact millions of users.
          </p>

          <p>
            I'm passionate about the intersection of technology and human experience. Whether it's designing intuitive interfaces, building robust systems, or teaching the next generation of developers, I believe technology should amplify human potential rather than replace it.
          </p>

          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.25rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}>
            Philosophy
          </h3>

          <p>
            I believe in building things that matter. Technology should solve real problems, not create new ones. Every line of code, every design decision, and every teaching moment should contribute to making the world a little better.
          </p>

          <p>
            This site is where I share my thoughts, experiments, and learnings. It's a small, deliberate collection of ideas that I hope will inspire others to build and make things that matter.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
