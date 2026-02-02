# Changelog

All notable changes to På G are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-02-02

### Added

- **Matomo event tracking** for user interactions
  - Filter changes (yesterday/today/tomorrow/week/upcoming)
  - Event card clicks (arena and category)
  - Manual refresh actions
  - Navigation link clicks (RSS, info, GitHub, dashboard)
  - Feed URL copy and view actions
  - Dashboard manual update triggers
  - Error tracking for failed operations
- Virtual page view tracking for SPA navigation
- New `useMatomo` hook in `src/hooks/useMatomo.js`
- Analytics documentation in `docs/ANALYTICS.md`

### Technical

- All tracking is privacy-focused: cookieless, respects DNT, no PII
- Events use category `PagApp` for easy filtering in Matomo

---

## [1.0.1] - 2026-02-02

### Fixed

- Fixed blank page issue in production by ensuring built dist/ files are used
  - Production was serving source index.html referencing /src/main.jsx
  - Now correctly serves built assets from /pag/static/

---

## [1.0.0] - 2026-01-30

### Added

- Initial release of På G (Globenområdet Events)
- Event display from Avicii Arena, 3Arena, Hovet, and Annexet
- Smart filtering: Yesterday, Today, Tomorrow, Week, Upcoming
- Subscription feeds: RSS, iCal, JSON Feed
- Mobile-optimized responsive design
- Dark theme with Scandinavian design
- Automatic event data updates
