# TODO - På G i Globenområdet

## Cron-jobb att konfigurera

För att hålla eventdata och RSS-flöden uppdaterade behöver följande cron-jobb sättas upp på servern:

### Linux/Mac (crontab -e)

```bash
# Uppdatera events och RSS var 2:a timme
0 */2 * * * cd /path/to/globen-events && node scripts/fetch-events.js >> /var/log/globen-events.log 2>&1
```

### Windows (Task Scheduler)

1. Öppna Task Scheduler
2. Skapa ny Basic Task: "Globen Events Update"
3. Trigger: Daily, repetera var 2:a timme
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
    - cron: '0 */2 * * *'  # Var 2:a timme
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

- Skriptet scraper eventdatum från varje events sida, så det tar ca 1-2 minuter att köra
- RSS-filer genereras för: idag, imorgon, veckan, kommande
- Data sparas i `public/events.json` och `public/rss-*.xml`
