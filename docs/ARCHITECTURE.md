# Architecture - Pa G (Globenomradet Events)

## Overview

Pa G is a React single-page application that displays events from Stockholm's Globen area arenas. It fetches data from Stockholm Live WordPress APIs and generates multiple feed formats.

## System Architecture

```
+-------------------+
| Stockholm Live    |  (External)
| WordPress APIs    |
+-------------------+
         |
         | HTTP REST
         v
+-------------------+
| Node.js Script    |  (Background)
| fetch-events.js   |
+-------------------+
         |
         | Generates
         v
+-------------------+
| Static Files      |
| - events.json     |
| - RSS feeds       |
| - iCal feeds      |
| - JSON feeds      |
+-------------------+
         |
         | Served by
         v
+-------------------+
| React SPA         |
| (Vite build)      |
+-------------------+
         |
         | HTTPS
         v
+-------------------+
| Web Browser       |
+-------------------+
```

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React | 19 |
| **Build** | Vite | 6 |
| **Styling** | Vanilla CSS | CSS Variables |
| **Data Fetching** | Node.js | Background script |
| **Feeds** | RSS 2.0, iCal, JSON Feed 1.1 | - |

## Component Structure

```
pag/
├── public/               # Static files (generated)
│   ├── events.json      # Event data
│   ├── rss-*.xml        # RSS feeds
│   ├── calendar-*.ics   # iCal feeds
│   └── feed-*.json      # JSON feeds
├── scripts/
│   └── fetch-events.js  # Data fetching script
├── src/
│   ├── api/
│   │   └── stockholmLive.js  # API handling
│   ├── components/
│   │   └── Icons.jsx    # SVG icons
│   ├── App.jsx          # Main component
│   ├── App.css          # Styles
│   ├── RssPage.jsx      # Feed subscription page
│   └── main.jsx         # Entry point
├── index.html           # HTML template
└── vite.config.js       # Vite configuration
```

## Data Flow

### Event Fetching

```
1. fetch-events.js runs (scheduled/manual)
2. Queries WordPress REST APIs for each arena:
   - Avicii Arena
   - 3Arena
   - Hovet
   - Annexet
3. Scrapes individual event pages for dates
4. Aggregates and normalizes data
5. Generates output files:
   - events.json (raw data)
   - RSS feeds (by time period)
   - iCal feeds (calendar format)
   - JSON feeds (modern format)
```

### Frontend Display

```
1. React app loads
2. Fetches events.json
3. Filters by selected time period
4. Renders event cards
5. Updates on filter change
```

## Feed Formats

### RSS Feeds

- `rss-today.xml` - Today's events
- `rss-tomorrow.xml` - Tomorrow's events
- `rss-week.xml` - This week's events
- `rss-upcoming.xml` - All upcoming events

### iCal Feeds

- `calendar-today.ics`
- `calendar-tomorrow.ics`
- `calendar-week.ics`
- `calendar-upcoming.ics`

### JSON Feeds

Following JSON Feed 1.1 specification:
- `feed-today.json`
- `feed-tomorrow.json`
- `feed-week.json`
- `feed-upcoming.json`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FETCH_TIMEOUT_MS` | 10000 | Request timeout |
| `MAX_RUNTIME_MS` | 300000 | Max script runtime |
| `MAX_PARALLEL_SCRAPES` | 5 | Parallel requests |

## Design Decisions

### ADR-001: React + Vite

**Context**: Need modern, fast frontend framework
**Decision**: React 19 with Vite 6 for development
**Consequences**: Fast HMR, optimal production builds

### ADR-002: Static Data Generation

**Context**: External API rate limits, performance
**Decision**: Generate static JSON files via background script
**Consequences**: Fast frontend, API-independent serving

### ADR-003: No Emojis

**Context**: Accessibility and design consistency
**Decision**: Use SVG icons instead of emojis
**Consequences**: Consistent rendering, better accessibility

## Performance

- Static JSON served directly (no API calls on page load)
- Minimal bundle size
- CSS variables for theming
- Lazy loading where appropriate

## External APIs

### Stockholm Live

Arenas operated by Stockholm Live:
- https://aviciiarena.se
- https://3arena.se
- https://hovetarena.se
- https://annexet.se

---
*Last updated: 2026-01-30*
