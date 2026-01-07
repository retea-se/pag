# På G i Globenområdet / On G in the Globen Area

*"På G" is short for "På gång" (Swedish for "On going" / "In progress")*

[English below](#english)

En modern webbapp som visar kommande evenemang på arenorna i Globenområdet i Stockholm.

![På G](https://img.shields.io/badge/P%C3%A5_G-Globenomr%C3%A5det-6366f1)

## Funktioner

- Visar evenemang från Avicii Arena, 3Arena, Hovet och Annexet
- Filtrering: Igår, Idag, Imorgon, Veckan, Kommande
- Responsiv design optimerad för mobil
- **Prenumerationsflöden**: RSS, iCal (kalender) och JSON Feed (idag, imorgon, veckan, kommande)
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
- **RSS-flöden:**
  - `public/rss-today.xml` - Dagens evenemang
  - `public/rss-tomorrow.xml` - Morgondagens evenemang
  - `public/rss-week.xml` - Veckans evenemang
  - `public/rss-upcoming.xml` - Alla kommande evenemang
- **iCal-kalenderflöden:**
  - `public/calendar-today.ics` - Dagens evenemang (för kalenderappar)
  - `public/calendar-tomorrow.ics` - Morgondagens evenemang
  - `public/calendar-week.ics` - Veckans evenemang
  - `public/calendar-upcoming.ics` - Alla kommande evenemang
- **JSON Feed-flöden:**
  - `public/feed-today.json` - Dagens evenemang (modern JSON-format)
  - `public/feed-tomorrow.json` - Morgondagens evenemang
  - `public/feed-week.json` - Veckans evenemang
  - `public/feed-upcoming.json` - Alla kommande evenemang

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
- **Feed-format:**
  - RSS 2.0 med Atom-tillägg
  - iCal (.ics) för kalenderintegration
  - JSON Feed 1.1 för moderna applikationer

## Prenumerationsflöden

Projektet stöder tre olika feed-format för att prenumerera på evenemang:

### RSS
Klassisk RSS-feed för RSS-läsare som Feedly, Inoreader, NetNewsWire, etc.

### iCal (Kalender)
iCal-format för direkt integration i kalenderappar:
- **Google Calendar**: Gå till "Lägg till kalender" → "Från URL" och klistra in länken
- **Outlook**: Gå till "Lägg till kalender" → "Prenumerera på kalender" och klistra in länken
- **Apple Calendar**: Gå till "Arkiv" → "Ny kalenderprenumeration" och klistra in länken

Evenemangen synkroniseras automatiskt och uppdateras regelbundet.

### JSON Feed
Modern JSON Feed-format enligt [JSON Feed spec 1.1](https://www.jsonfeed.org/). Perfekt för:
- Utvecklare som vill bygga egna integrationer
- Moderna webbappar och mobilappar
- Direkt JSON-parsing utan XML-hantering

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
- **Subscription feeds**: Subscribe via RSS, iCal (calendar), or JSON Feed for today's events, tomorrow's events, this week's events, or all upcoming events
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
- **RSS feeds:**
  - `public/rss-today.xml` - Today's events
  - `public/rss-tomorrow.xml` - Tomorrow's events
  - `public/rss-week.xml` - This week's events
  - `public/rss-upcoming.xml` - All upcoming events
- **iCal calendar feeds:**
  - `public/calendar-today.ics` - Today's events (for calendar apps)
  - `public/calendar-tomorrow.ics` - Tomorrow's events
  - `public/calendar-week.ics` - This week's events
  - `public/calendar-upcoming.ics` - All upcoming events
- **JSON Feed:**
  - `public/feed-today.json` - Today's events (modern JSON format)
  - `public/feed-tomorrow.json` - Tomorrow's events
  - `public/feed-week.json` - This week's events
  - `public/feed-upcoming.json` - All upcoming events

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
- **Feed formats:**
  - RSS 2.0 with Atom extensions
  - iCal (.ics) for calendar integration
  - JSON Feed 1.1 for modern applications

## Subscription Feeds

The project supports three different feed formats for subscribing to events:

### RSS
Classic RSS feed for RSS readers like Feedly, Inoreader, NetNewsWire, etc.

### iCal (Calendar)
iCal format for direct integration into calendar apps:
- **Google Calendar**: Go to "Add calendar" → "From URL" and paste the link
- **Outlook**: Go to "Add calendar" → "Subscribe to calendar" and paste the link
- **Apple Calendar**: Go to "File" → "New Calendar Subscription" and paste the link

Events sync automatically and update regularly.

### JSON Feed
Modern JSON Feed format according to [JSON Feed spec 1.1](https://www.jsonfeed.org/). Perfect for:
- Developers building custom integrations
- Modern web apps and mobile apps
- Direct JSON parsing without XML handling

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
