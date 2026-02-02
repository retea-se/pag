# Changelog

All notable changes to På G are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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
