# Sidvisningsräknare API

En enkel global sidvisningsräknare som lagrar data i en JSON-fil.

## Installation

### Alternativ 1: PHP (Rekommenderat - fungerar på de flesta webbservrar)

1. Se till att `pageviews.php` är tillgänglig på servern
2. Se till att `pageviews.json` är skrivbar av webbservern
3. Klart! API:et fungerar automatiskt

**Behörigheter:**
```bash
chmod 666 public/api/pageviews.json
```

### Alternativ 2: Node.js

Om du använder en Node.js-server, kan du använda `pageviews.js` som modul eller skapa en enkel Express-endpoint.

## Hur det fungerar

- Varje gång någon besöker sidan anropas `api/pageviews.php`
- Räknaren ökar med 1 och sparas i `pageviews.json`
- Samma användare räknas bara en gång per session (förhindrar dubbelräkning vid refresh)

## Filstruktur

```
public/api/
  ├── pageviews.php      # PHP-endpoint (används i produktion)
  ├── pageviews.js       # Node.js-alternativ
  └── pageviews.json     # Lagrar räknaren (skapas automatiskt)
```

## Testa

Öppna i webbläsaren:
```
https://din-domän.se/pag/api/pageviews.php
```

Du bör se:
```json
{"count": 1}
```

Varje refresh ökar räknaren.


