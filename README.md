# På G i Globenområdet / On G in the Globen Area

*"På G" is short for "På gång" (Swedish for "On going" / "In progress")*

[English below](#english)

En modern webbapp som visar kommande evenemang på arenorna i Globenområdet i Stockholm.

![På G](https://img.shields.io/badge/P%C3%A5_G-Globenomr%C3%A5det-6366f1)

## Funktioner

- Visar evenemang från Avicii Arena, 3Arena, Hovet och Annexet
- Filtrering: Igår, Idag, Imorgon, Veckan, Kommande
- Responsiv design optimerad för mobil
- RSS-flöden för prenumeration (idag, imorgon, veckan, kommande)
- Mörkt tema med modern skandinavisk design
- Ingen användning av emojis - endast SVG-ikoner

## Datakällor

Eventdata hämtas från [Stockholm Live](https://stockholmlive.com) via WordPress REST API:er för respektive arena. Datum scrapas från varje eventsida.

## Installation

```bash
npm install
```

## Utveckling

```bash
npm run dev
```

Appen körs på `http://localhost:5173/pag/`

## Produktion

```bash
npm run build
```

Bygg hamnar i `dist/` och kan deployas till valfri statisk hosting.

## Datahämtning

Eventdata cachas i `public/events.json`. Kör bakgrundsskriptet för att uppdatera:

```bash
node scripts/fetch-events.js
```

Detta genererar:
- `public/events.json` - All eventdata
- `public/rss-today.xml` - Dagens evenemang
- `public/rss-tomorrow.xml` - Morgondagens evenemang
- `public/rss-week.xml` - Veckans evenemang
- `public/rss-upcoming.xml` - Alla kommande evenemang

### Konfiguration

Skriptet stöder följande miljövariabler (valfria):

- `FETCH_TIMEOUT_MS` - Timeout för individuella nätverksanrop i millisekunder (standard: 10000 = 10 sekunder)
- `MAX_RUNTIME_MS` - Maximal total körtid för hela skriptet i millisekunder (standard: 300000 = 5 minuter)
- `MAX_PARALLEL_SCRAPES` - Maximalt antal parallella scraping-requests (standard: 5, rekommenderat: 5-8)

Exempel:
```bash
FETCH_TIMEOUT_MS=15000 MAX_PARALLEL_SCRAPES=8 node scripts/fetch-events.js
```

## Projektstruktur

```
├── public/              # Statiska filer (genererade data hamnar här)
├── scripts/
│   └── fetch-events.js  # Bakgrundsskript för datahämtning
├── src/
│   ├── api/
│   │   └── stockholmLive.js  # API-hantering och caching
│   ├── components/
│   │   └── Icons.jsx    # SVG-ikoner
│   ├── App.jsx          # Huvudkomponent
│   ├── App.css          # Stilar
│   ├── RssPage.jsx      # RSS-prenumerationssida
│   └── main.jsx         # Entry point med routing
└── vite.config.js       # Vite-konfiguration
```

## Teknik

- [React](https://react.dev) 19
- [Vite](https://vitejs.dev) 6
- Vanilla CSS med CSS-variabler
- Node.js bakgrundsskript för datahämtning
- RSS 2.0 med Atom-tillägg

## Krediter

### Datakällor

All eventdata kommer från arenor som drivs av [Stockholm Live](https://stockholmlive.com):

- [Avicii Arena](https://aviciiarena.se)
- [3Arena](https://3arena.se)
- [Hovet](https://hovetarena.se)
- [Annexet](https://annexet.se)

### Typsnitt

- [Inter](https://rsms.me/inter/) av Rasmus Andersson

## Licens

MIT

---

<a name="english"></a>
# On G in the Globen Area

**On G** (short for "På gång" in Swedish, meaning "On going" or "In progress") is a modern web app that tracks and displays what's happening at the four major arenas in the Globen area of Stockholm, Sweden. The app provides real-time information about ongoing and upcoming events, concerts, and shows at Avicii Arena, 3Arena, Hovet, and Annexet.

Perfect for event-goers, tourists, and locals who want to stay updated on what's on at Stockholm's premier entertainment venues in the Globen district.

![På G](https://img.shields.io/badge/P%C3%A5_G-Globenomr%C3%A5det-6366f1)

## Features

- **Comprehensive event tracking**: Displays all events and shows happening at the four major arenas in Stockholm's Globen area - Avicii Arena, 3Arena, Hovet, and Annexet
- **Smart filtering**: View events by time period - Yesterday, Today, Tomorrow, This Week, or all Upcoming events
- **Mobile-optimized**: Responsive design that works perfectly on phones, tablets, and desktops
- **RSS feeds**: Subscribe to RSS feeds for today's events, tomorrow's events, this week's events, or all upcoming events
- **Modern design**: Dark theme with clean Scandinavian aesthetics
- **Accessible**: No emojis - uses SVG icons for better accessibility and performance

## Data Sources

Event data is fetched from [Stockholm Live](https://stockholmlive.com) via WordPress REST APIs for each arena. Dates are scraped from each event page.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The app runs on `http://localhost:5173/pag/`

## Production

```bash
npm run build
```

Build output goes to `dist/` and can be deployed to any static hosting.

## Data Fetching

Event data is cached in `public/events.json`. Run the background script to update:

```bash
node scripts/fetch-events.js
```

This generates:
- `public/events.json` - All event data
- `public/rss-today.xml` - Today's events
- `public/rss-tomorrow.xml` - Tomorrow's events
- `public/rss-week.xml` - This week's events
- `public/rss-upcoming.xml` - All upcoming events

### Configuration

The script supports the following environment variables (optional):

- `FETCH_TIMEOUT_MS` - Timeout for individual network requests in milliseconds (default: 10000 = 10 seconds)
- `MAX_RUNTIME_MS` - Maximum total runtime for the entire script in milliseconds (default: 300000 = 5 minutes)
- `MAX_PARALLEL_SCRAPES` - Maximum number of parallel scraping requests (default: 5, recommended: 5-8)

Example:
```bash
FETCH_TIMEOUT_MS=15000 MAX_PARALLEL_SCRAPES=8 node scripts/fetch-events.js
```

## Project Structure

```
├── public/              # Static files (generated data goes here)
├── scripts/
│   └── fetch-events.js  # Background script for data fetching
├── src/
│   ├── api/
│   │   └── stockholmLive.js  # API handling and caching
│   ├── components/
│   │   └── Icons.jsx    # SVG icons
│   ├── App.jsx          # Main component
│   ├── App.css          # Styles
│   ├── RssPage.jsx      # RSS subscription page
│   └── main.jsx         # Entry point with routing
└── vite.config.js       # Vite configuration
```

## Technology

- [React](https://react.dev) 19
- [Vite](https://vitejs.dev) 6
- Vanilla CSS with CSS variables
- Node.js background script for data fetching
- RSS 2.0 with Atom extensions

## Credits

### Data Sources

All event data comes from arenas operated by [Stockholm Live](https://stockholmlive.com):

- [Avicii Arena](https://aviciiarena.se)
- [3Arena](https://3arena.se)
- [Hovet](https://hovetarena.se)
- [Annexet](https://annexet.se)

### Typography

- [Inter](https://rsms.me/inter/) by Rasmus Andersson

## License

MIT
