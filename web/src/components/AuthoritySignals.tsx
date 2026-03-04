import { affiliations, mediaMentions } from '../data/authority-signals'

export function AuthoritySignals() {
  return (
    <section className="authority-block" aria-label="Authority signals">
      <div className="authority-header">
        <h2>Institutional Work</h2>
        <p>Selected roles and affiliations grounding this work in long-term systems practice.</p>
      </div>

      <ul className="affiliation-grid">
        {affiliations.map((affiliation) => {
          const content = (
            <>
              <div className="affiliation-badge" aria-hidden="true">{affiliation.badgeText}</div>
              <div>
                <h3>{affiliation.institution}</h3>
                <p>{affiliation.role}</p>
                {affiliation.period && <span>{affiliation.period}</span>}
              </div>
            </>
          )

          return (
            <li key={affiliation.id} className="affiliation-card">
              {affiliation.url ? (
                <a href={affiliation.url} target="_blank" rel="noopener noreferrer" className="affiliation-link">
                  {content}
                </a>
              ) : (
                <div className="affiliation-link">{content}</div>
              )}
            </li>
          )
        })}
      </ul>

      {mediaMentions.length > 0 && (
        <div className="media-row" aria-label="Featured in">
          <p>Featured In</p>
          <div>
            {mediaMentions.map((mention) => (
              <a key={mention.id} href={mention.url} target="_blank" rel="noopener noreferrer">
                {mention.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
