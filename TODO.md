# TODO - På G i Globenområdet

## Cron-jobb att konfigurera

För att hålla eventdata och RSS-flöden uppdaterade behöver följande cron-jobb sättas upp på servern:

### Linux/Mac (crontab -e)

```bash
# Uppdatera events och RSS var 4:e timme (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
0 */4 * * * cd /path/to/globen-events && /usr/bin/node scripts/fetch-events.js >> /var/log/globen-events.log 2>&1
```

**För shared hosting (t.ex. mackan.eu):**
```bash
# Anpassa sökvägen till din faktiska installationssökväg
0 */4 * * * cd ~/public_html/pag && /usr/bin/node scripts/fetch-events.js >> ~/logs/globen-events.log 2>&1
```

**Installation:**
1. Redigera crontab: `crontab -e`
2. Lägg till raden ovan (anpassa sökvägen)
3. Spara och stäng
4. Verifiera med: `crontab -l`

Se även `crontab.example` för ett komplett exempel.

### Windows (Task Scheduler)

1. Öppna Task Scheduler
2. Skapa ny Basic Task: "Globen Events Update"
3. Trigger: Daily, repetera var 4:e timme
4. Action: Start a program
   - Program: `node`
   - Arguments: `scripts/fetch-events.js`
   - Start in: `C:\path\to\globen-events`

### Alternativ: GitHub Actions (om hostat på GitHub Pages)

Skapa `.github/workflows/update-events.yml`:

```yaml
name: Update Events
on:
  schedule:
    - cron: '0 */4 * * *'  # Var 4:e timme
  workflow_dispatch:  # Manuell körning

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: node scripts/fetch-events.js
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "Update events data"
          file_pattern: "public/*.json public/*.xml"
```

## Noteringar

- Skriptet scraper eventdatum från varje events sida parallellt (5-8 samtidiga requests)
- Körtiden är nu kortare tack vare parallell scraping (ca 30-60 sekunder istället för 1-2 minuter)
- RSS-filer genereras för: idag, imorgon, veckan, kommande
- Data sparas i `public/events.json` och `public/rss-*.xml`

## Säkerhetsförbättringar

Skriptet inkluderar nu:
- **Timeout-hantering**: Alla nätverksanrop har timeout (standard 10 sekunder)
- **SSRF-skydd**: URL:er valideras mot allowlist innan scraping
- **Parallell scraping**: Begränsad parallellism (5-8 samtidiga requests) för bättre prestanda
- **Retry-logik**: Automatiska retries med exponential backoff för transienta fel
- **Global timeout**: Hela körningen avbryts efter max 5 minuter

## Monitorering

Skriptet returnerar olika exit-koder som kan användas för monitorering/alerts:

```bash
# I cron eller monitoring-system:
node scripts/fetch-events.js
EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ]; then
  echo "KRITISKT FEL: Skicka alert"
elif [ $EXIT_CODE -eq 2 ]; then
  echo "VARNING: Partiella fel, men körning slutförd"
fi
```

### Rekommenderad monitorering

- Alert vid exit code 1 (kritiskt fel)
- Logga exit code 2 (partiella fel) för analys
- Övervaka körtid - bör vara < 2 minuter med parallell scraping
