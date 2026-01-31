# Repository Policy - Pa G (Globenomradet Events)

## Overview

This document defines governance policies for the Pa G repository, a React web app displaying events at Stockholm Globen area arenas.

## Repository Classification

| Attribute | Value |
|-----------|-------|
| **Type** | Product |
| **Status** | Production |
| **Languages** | JavaScript (React 19), Node.js |
| **Build** | Vite 6 |
| **License** | MIT |

## Branch Strategy

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready code | Protected |
| `feature/*` | New features | None |
| `fix/*` | Bug fixes | None |

## Code Review Requirements

- All changes to `main` require pull request
- Build must succeed before merge

## Commit Standards

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `chore:` Maintenance

## Security Requirements

- No API keys in frontend code
- Sanitize external data
- Follow CSP guidelines
- See `docs/SECURITY.md` for detailed guidelines

## Deployment

- Build: `npm run build`
- Output: `dist/`
- Hosting: Static hosting

## Data Sources

- Stockholm Live (WordPress REST API)
- Arenas: Avicii Arena, 3Arena, Hovet, Annexet

## Feed Outputs

- RSS feeds (today, tomorrow, week, upcoming)
- iCal calendar feeds
- JSON Feed (1.1 spec)

## Documentation Requirements

- README.md must be kept up to date
- Feed format changes require documentation

## Design Guidelines

- Dark theme with Nordic minimalist design
- No emojis - SVG icons only
- Mobile-first responsive design

## Contact

**Maintainer:** Marcus
**Organization:** Retea

---
*Last updated: 2026-01-30*
