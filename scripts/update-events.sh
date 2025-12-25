#!/bin/bash
# update-events.sh - Cron-script för att uppdatera events
# Anpassa sökvägarna nedan för din server

# Sökväg till projektet på servern
PROJECT_DIR="$HOME/pag-scripts"

# Sökväg där events.json ska sparas (din webbmapp)
export OUTPUT_DIR="$HOME/public_html/pag"

# Loggfil
LOG_FILE="$HOME/logs/pag-events.log"

# Skapa loggmapp om den inte finns
mkdir -p "$(dirname "$LOG_FILE")"

# Logga start
echo "========================================" >> "$LOG_FILE"
echo "Startar uppdatering: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"

# Byt till projektmappen och kör scriptet
cd "$PROJECT_DIR" || exit 1
node scripts/fetch-events.js >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

# Logga resultat
if [ $EXIT_CODE -eq 0 ]; then
    echo "Klar: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
else
    echo "FEL (exit code $EXIT_CODE): $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
fi

exit $EXIT_CODE
