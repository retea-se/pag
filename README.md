# På G i Globenområdet

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

Se `TODO.md` för cron-konfiguration.

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
├── TODO.md              # Cron-konfiguration
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

### Utveckling

Byggt med hjälp av [Claude Code](https://claude.ai/claude-code) av [Anthropic](https://anthropic.com).

## Licens

MIT
