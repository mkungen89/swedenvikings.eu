#!/bin/bash
# ===========================================
# Sweden Vikings CMS - Update Arma Reforger Server
# ===========================================
# Run this to manually update the Arma Reforger dedicated server
# Usage: sudo bash /opt/swedenvikings/scripts/update-arma.sh

set -e

STEAMCMD_PATH="/opt/steamcmd"
ARMA_PATH="/opt/arma-reforger-server"
ARMA_APP_ID="1874900"

echo "===========================================
Arma Reforger Server Update
==========================================="

# Check if running as root or deploy user
if [ "$EUID" -ne 0 ] && [ "$(whoami)" != "deploy" ]; then
    echo "Please run as root or deploy user"
    exit 1
fi

# Stop the server if running (via CMS API or manually)
echo ">>> Checking if server is running..."
if pgrep -x "ArmaReforgerServer" > /dev/null; then
    echo ">>> Stopping Arma Reforger server..."
    pkill -x "ArmaReforgerServer" || true
    sleep 5
fi

# Update server via SteamCMD
echo ">>> Updating Arma Reforger Dedicated Server..."
cd "$STEAMCMD_PATH"
./steamcmd.sh +login anonymous +force_install_dir "$ARMA_PATH" +app_update $ARMA_APP_ID validate +quit

echo "
===========================================
Update Complete!
===========================================
You can now start the server via the CMS admin panel.
"

