# Technical Decision Records (TDR)

This directory contains Technical Decision Records (TDRs) that document important architectural and design decisions made during the development of the Web Presence project.

## What are TDRs?

Technical Decision Records are documents that capture the context, decision, and consequences of important technical choices. They help:

- **Document the "why"** behind technical decisions
- **Preserve context** for future developers
- **Track the evolution** of the system architecture
- **Facilitate knowledge transfer** and onboarding

## TDR Format

Each TDR follows this structure:

1. **Title** - Clear, descriptive title
2. **Status** - Current status (Proposed, Accepted, Deprecated, Superseded)
3. **Date** - When the decision was made
4. **Context** - The situation and problem being addressed
5. **Decision** - The technical decision made
6. **Consequences** - Expected outcomes and trade-offs
7. **Alternatives Considered** - Other options that were evaluated

## TDR Index

### 001 - Access Control Architecture
- **File**: `001-access-control-architecture.md`
- **Status**: Accepted
- **Date**: October 17, 2025
- **Summary**: Decision to implement a three-tier access control system (open, password, email-list) with JWT tokens and database backing.

### 002 - Content Folder Structure
- **File**: `002-content-folder-structure.md`
- **Status**: Accepted
- **Date**: October 16, 2025
- **Summary**: Decision to use a dual-folder structure (`content/` and `content-protected/`) with frontmatter-based access control.

### 003 - Database Implementation
- **File**: `003-database-implementation.md`
- **Status**: Accepted
- **Date**: October 17, 2025
- **Summary**: Decision to migrate from JSON configuration to Cloudflare D1 database for access control rules and audit logging.

### 004 - Frontend Architecture
- **File**: `004-frontend-architecture.md`
- **Status**: Accepted
- **Date**: October 16, 2025
- **Summary**: Decision to use React with Vite, static HTML generation, and hybrid SPA/static architecture.

### 005 - Build System
- **File**: `005-build-system.md`
- **Status**: Accepted
- **Date**: October 16, 2025
- **Summary**: Decision to use Vite as the build tool with custom plugins for content processing and static HTML generation.

## Creating New TDRs

When making significant technical decisions:

1. **Create a new TDR file** following the naming convention: `XXX-descriptive-name.md`
2. **Use the next available number** in sequence
3. **Follow the TDR template** structure
4. **Include all stakeholders** in the decision process
5. **Update this README** with the new TDR entry

## TDR Template

```markdown
# TDR-XXX: [Title]

**Date**: [YYYY-MM-DD]
**Status**: [Proposed/Accepted/Deprecated/Superseded]
**Author**: [Name]
**Stakeholders**: [List of people involved]

## Context

[Describe the situation and problem being addressed]

## Decision

[State the technical decision made]

## Consequences

### Positive
- [List positive outcomes]

### Negative
- [List negative outcomes or trade-offs]

### Neutral
- [List neutral consequences]

## Alternatives Considered

### Option 1: [Name]
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]
- **Why not chosen**: [Reason for rejection]

### Option 2: [Name]
- **Pros**: [List advantages]
- **Cons**: [List disadvantages]
- **Why not chosen**: [Reason for rejection]

## Implementation Notes

[Any specific implementation details or considerations]

## References

- [Link to related documents]
- [Link to relevant code]
- [Link to external resources]
```

## Review Process

TDRs should be reviewed by:

1. **Technical Lead** - Architecture and technical soundness
2. **Product Owner** - Business impact and alignment
3. **Team Members** - Implementation feasibility and concerns
4. **Stakeholders** - Any affected parties

## Maintenance

- **Regular Review**: TDRs should be reviewed annually for relevance
- **Status Updates**: Update status when decisions change
- **Superseding**: When a TDR is superseded, create a new one and link to it
- **Archiving**: Deprecated TDRs should be moved to archive but kept for historical reference

## Related Documentation

- [Architecture Overview](../architecture.md)
- [API Documentation](../api/README.md)
- [Web Documentation](../web/README.md)
- [Implementation Summary](../archive/implementation-summary.md)
