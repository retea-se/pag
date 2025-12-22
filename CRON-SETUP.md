# Cron-installation för Produktionsmiljö

## Förutsättningar

- Linux-server med cron installerat
- Node.js installerat och tillgängligt i PATH eller fullständig sökväg
- Skrivrättigheter till projektmappen och loggmappen

## Steg-för-steg installation

### 1. Hitta Node.js-sökvägen

```bash
which node
# Eller
whereis node
```

Vanliga sökvägar:

- `/usr/bin/node`
- `/usr/local/bin/node`
- `/opt/node/bin/node`

### 2. Bestäm projektets sökväg

För shared hosting:

```bash
# Vanligtvis:
~/public_html/pag/
# eller
/home/anvandarnamn/public_html/pag/
```

För VPS/dedikerad server:

```bash
# Vanligtvis:
/var/www/pag/
# eller
/home/anvandarnamn/pag/
```

### 3. Skapa loggmapp (om den inte finns)

```bash
mkdir -p ~/logs
# eller
mkdir -p /var/log
```

### 4. Testa skriptet manuellt

```bash
cd /path/to/globen-events
node scripts/fetch-events.js
```

Kontrollera att:

- Skriptet körs utan fel
- `public/events.json` skapas/uppdateras
- RSS-filer genereras i `public/`

### 5. Installera cron-jobb

```bash
# Öppna crontab för redigering
crontab -e
```

Lägg till följande rad (anpassa sökvägarna):

```bash
# Uppdatera events var 4:e timme
0 */4 * * * cd /path/to/globen-events && /usr/bin/node scripts/fetch-events.js >> /var/log/globen-events.log 2>&1
```

**Exempel för shared hosting (mackan.eu):**

```bash
0 */4 * * * cd ~/public_html/pag && /usr/bin/node scripts/fetch-events.js >> ~/logs/globen-events.log 2>&1
```

### 6. Verifiera installationen

```bash
# Visa alla cron-jobb
crontab -l

# Kontrollera att jobbet är schemalagt
# Körningen sker vid: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00
```

### 7. Testa första körningen

Vänta till nästa schemalagda tidpunkt, eller kör manuellt:

```bash
# Kör samma kommando som cron använder
cd /path/to/globen-events && /usr/bin/node scripts/fetch-events.js >> /var/log/globen-events.log 2>&1

# Kontrollera loggen
tail -f /var/log/globen-events.log
```

## Felsökning

### Cron körs inte

1. **Kontrollera cron-tjänsten:**

   ```bash
   systemctl status cron
   # eller
   service cron status
   ```

2. **Kontrollera loggar:**

   ```bash
   # Systemloggar
   grep CRON /var/log/syslog
   # eller
   journalctl -u cron
   ```

3. **Kontrollera sökvägar:**

   - Använd absoluta sökvägar i cron
   - Verifiera att Node.js-sökvägen är korrekt
   - Verifiera att projektmappen finns

4. **Kontrollera behörigheter:**
   ```bash
   ls -la scripts/fetch-events.js
   chmod +x scripts/fetch-events.js  # Om nödvändigt
   ```

### Skriptet misslyckas

1. **Kör manuellt med felutskrift:**

   ```bash
   cd /path/to/globen-events
   node scripts/fetch-events.js
   ```

2. **Kontrollera miljövariabler:**

   - Cron kör med minimal miljö
   - Lägg till miljövariabler i cron-raden om nödvändigt:

   ```bash
   0 */4 * * * cd /path/to/globen-events && PATH=/usr/bin:/usr/local/bin:$PATH /usr/bin/node scripts/fetch-events.js >> /var/log/globen-events.log 2>&1
   ```

3. **Kontrollera nätverksåtkomst:**
   - Verifiera att servern kan nå API:erna
   - Testa med `curl` eller `wget`

## Monitorering

### Exit-koder

Skriptet returnerar:

- `0` = Framgångsrik körning
- `1` = Kritiskt fel (t.ex. timeout eller API-fel)
- `2` = Partiella fel (några events misslyckades, men körning slutförd)

### Loggövervakning

```bash
# Visa senaste loggposter
tail -n 50 /var/log/globen-events.log

# Följ loggen i realtid
tail -f /var/log/globen-events.log

# Sök efter fel
grep -i error /var/log/globen-events.log
grep -i "kritiskt" /var/log/globen-events.log
```

### Alert-setup (valfritt)

Skapa ett enkelt monitoring-skript:

```bash
#!/bin/bash
# /usr/local/bin/check-globen-events.sh

LOG_FILE="/var/log/globen-events.log"
LAST_RUN=$(tail -n 1 "$LOG_FILE" | grep -o "Klart!")

if [ -z "$LAST_RUN" ]; then
    # Skicka alert (t.ex. email, Slack, etc.)
    echo "VARNING: Globen Events cron job har inte körts korrekt" | mail -s "Globen Events Alert" admin@example.com
fi
```

Lägg till i crontab för att köra varje timme:

```bash
0 * * * * /usr/local/bin/check-globen-events.sh
```

## Schemaläggning

Cron-uttrycket `0 */4 * * *` kör skriptet:

- Var 4:e timme
- Vid: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00

### Alternativa scheman

```bash
# Var 2:a timme
0 */2 * * *

# Var 6:e timme
0 */6 * * *

# Varje timme
0 * * * *

# Varje dag kl 02:00
0 2 * * *

# Varje dag kl 02:00 och 14:00
0 2,14 * * *
```

## Säkerhet

- Använd absoluta sökvägar
- Begränsa loggfilens storlek (t.ex. med `logrotate`)
- Kontrollera att skriptet inte exponerar känslig information i loggar
- Överväg att köra som en specifik användare med begränsade behörigheter
