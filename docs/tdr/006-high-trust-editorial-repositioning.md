# TDR-006: High-Trust Editorial Repositioning And Guided Site Flow

**Date**: 2026-03-03
**Status**: Accepted
**Author**: Development Team
**Stakeholders**: Product Owner, Technical Lead, Frontend Developers

## Context

The site needed a clearer professional signature and stronger authority framing.

Review feedback identified these gaps:
- Visual style felt generic and markdown-like rather than editorial and high-trust.
- "Notes" labeling did not reflect the intended framework-driven positioning.
- The site lacked a guided path for first-time visitors.
- Institutional credibility was present in content but not presented as a clear signal.
- Footer AI-tool credits reduced bespoke brand positioning.

At the same time, existing route compatibility and build stability had to be preserved.

## Decision

We decided to implement a high-trust editorial repositioning with the following constraints:

- Adopt a typography-first visual system using open-source fonts and tighter editorial spacing.
- Introduce a shared page shell component to normalize header, grid, and footer rhythm.
- Rebrand "Notes" to **"The Systems Playbook"** at the UI/copy layer while preserving `/notes` route compatibility.
- Add a dedicated `/start-here` route with curated onboarding content.
- Add a data-driven authority module for affiliations and media mentions, shipping initially with a UConn text badge due missing logo assets.
- Remove AI-tool credit text from footer; keep utility links (RSS/Resume/LinkedIn).
- Exclude newsletter integration and newsletter links from this implementation scope.

## Consequences

### Positive
- Stronger editorial identity and professional trust signal.
- Better first-visit flow through explicit guided path.
- Preserves SEO/link compatibility by retaining `/notes` route.
- Authority sections are extensible when official assets become available.

### Negative
- Additional component/style surface area increases frontend maintenance.
- Authority module currently launches without official logos, which limits immediate visual impact.

### Neutral
- No backend/API contract changes are required.
- Existing content pipeline remains the source of truth for pages/notes.

## Alternatives Considered

### Option 1: Move from `/notes` to `/playbook`
- **Pros**: Cleaner semantic alignment with new branding.
- **Cons**: Route migration/redirect complexity and potential discoverability churn.
- **Why not chosen**: UI-level rebrand achieved goal without compatibility risk.

### Option 2: Postpone `/start-here` until more content exists
- **Pros**: Avoid curation rework later.
- **Cons**: Continued unguided first-user experience.
- **Why not chosen**: Immediate guided flow value outweighed future curation updates.

### Option 3: Add newsletter CTA as part of repositioning
- **Pros**: Strong recurring relationship mechanism.
- **Cons**: New integration surface and extra operational scope.
- **Why not chosen**: Explicitly out of scope for this phase.

## Implementation Notes

- Added new route type and page component for `/start-here`.
- Introduced `PageShell` for shared layout structure.
- Added `AuthoritySignals` plus typed data in `web/src/data/authority-signals.ts`.
- Updated global typography and layout tokens in `web/src/style.css`.
- Added long-form flagship essay (`the-demo-wall.md`) and new page content (`start-here.md`).

## References

- [web/src/style.css](../../web/src/style.css)
- [web/src/components/PageShell.tsx](../../web/src/components/PageShell.tsx)
- [web/src/components/AuthoritySignals.tsx](../../web/src/components/AuthoritySignals.tsx)
- [web/src/utils/router.ts](../../web/src/utils/router.ts)
- [content/pages/start-here.md](../../content/pages/start-here.md)
- [content/notes/the-demo-wall.md](../../content/notes/the-demo-wall.md)
