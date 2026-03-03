# TDR-005: Build-Time Publishing Safety And Metadata Hardening

**Date**: 2026-03-03
**Status**: Accepted
**Author**: Development Team
**Stakeholders**: Product Owner, Technical Lead, Frontend Developers

## Context

External review identified multiple gaps in the content publishing and frontend rendering flow:
- Draft markdown could be published when it should be excluded.
- Some HTML rendering paths used `dangerouslySetInnerHTML` without sanitation.
- `robots.txt` did not reflect protected slugs.
- The build scripts duplicated markdown parsing/conversion logic instead of consistently using `mdtohtml`.
- Missing `404.html` reduced static-hosting error-page correctness.

These issues affected security posture, crawler behavior, and long-term maintainability.

## Decision

We decided to harden the build and rendering pipeline with these controls:
- Use `mdtohtml` as the shared parser/converter for web build scripts (`vite-plugin-html-pages.ts`, `seed-content.ts`, and preview tooling).
- Enforce draft exclusion in API and web build output.
- Sanitize all HTML inserted via `dangerouslySetInnerHTML` (including content pages and static pages like About/Contact).
- Generate `robots.txt` during build from `protected-routes.json` derived from access rules.
- Add a static `404.html` to support correct hosting behavior for unknown paths.

## Consequences

### Positive
- Reduces accidental exposure of draft/protected content.
- Improves XSS resilience in content rendering paths.
- Improves crawler guidance for protected content paths.
- Reduces markdown-processing drift by consolidating on `mdtohtml`.
- Improves static-hosting 404 behavior.

### Negative
- Build flow now depends on generated intermediate data (`protected-routes.json`).
- Slight additional complexity in the Vite plugin for robots generation.

### Neutral
- `preview:content` and `seed:content` remain tooling-focused and do not affect runtime behavior directly.

## Alternatives Considered

### Option 1: Keep static `robots.txt` with broad path disallow
- **Pros**: Simpler implementation.
- **Cons**: Either incomplete protection or over-blocks public content.
- **Why not chosen**: Too blunt; dynamic protected-route disallow is more accurate.

### Option 2: Keep custom markdown parsing in web scripts
- **Pros**: No dependency wiring updates.
- **Cons**: Continued duplication and parser drift risk.
- **Why not chosen**: Directly conflicts with maintainability goal.

### Option 3: Sanitize only protected content paths
- **Pros**: Less change.
- **Cons**: Leaves XSS exposure in public/static pages that also render HTML.
- **Why not chosen**: Inconsistent and incomplete.

## Implementation Notes

- Build-time protected routes are extracted in `web/scripts/fetch-content-from-r2.ts` and written to `src/data/protected-routes.json`.
- Final `dist/robots.txt` is generated in `web/scripts/vite-plugin-html-pages.ts`.
- HTML sanitization is centralized in `web/src/utils/sanitize-html.ts`.

## References

- [web/scripts/fetch-content-from-r2.ts](../../web/scripts/fetch-content-from-r2.ts)
- [web/scripts/vite-plugin-html-pages.ts](../../web/scripts/vite-plugin-html-pages.ts)
- [web/src/utils/error-logger.ts](../../web/src/utils/error-logger.ts)
- [web/src/utils/sanitize-html.ts](../../web/src/utils/sanitize-html.ts)
- [web/public/404.html](../../web/public/404.html)
