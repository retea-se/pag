#!/bin/bash
# server-setup.sh - Installera cron-jobb på servern
# Kör: bash server-setup.sh

echo "=== På G Events - Server Setup ==="
echo ""

# Kontrollera Node.js
if ! command -v node &> /dev/null; then
    echo "FEL: Node.js hittades inte!"
    echo "Installera Node.js först: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node.js: $NODE_VERSION"

# Skapa mappar
echo ""
echo "Skapar mappar..."
mkdir -p "$HOME/pag-scripts/scripts"
mkdir -p "$HOME/logs"

# Kopiera filer (användaren måste göra detta manuellt)
echo ""
echo "=== MANUELLA STEG ==="
echo ""
echo "1. Ladda upp följande filer till servern:"
echo "   - scripts/fetch-events.js -> ~/pag-scripts/scripts/"
echo "   - scripts/update-events.sh -> ~/pag-scripts/scripts/"
echo "   - server-package.json -> ~/pag-scripts/package.json"
echo "   - .env -> ~/pag-scripts/.env (om du använder Ticketmaster)"
echo ""
echo "2. Installera beroenden:"
echo "   cd ~/pag-scripts && npm install"
echo ""
echo "3. Gör scriptet körbart:"
echo "   chmod +x ~/pag-scripts/scripts/update-events.sh"
echo ""
echo "4. Testa manuellt:"
echo "   ~/pag-scripts/scripts/update-events.sh"
echo ""
echo "5. Lägg till cron-jobb:"
echo "   crontab -e"
echo "   Lägg till raden:"
echo "   0 */4 * * * \$HOME/pag-scripts/scripts/update-events.sh"
echo ""
echo "6. Verifiera:"
echo "   crontab -l"
echo ""
