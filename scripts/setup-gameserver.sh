#!/bin/bash
# ===========================================
# Sweden Vikings - Game Server Setup (VPS 2)
# ===========================================
# Run this script on Game Server (Ubuntu 24.04) as root
# Specs: 4+ CPU, 16GB RAM, 50GB+ SSD
# Usage: sudo bash setup-gameserver.sh
#
# This installs:
# - Arma Reforger Dedicated Server
# - SteamCMD for updates
# - SSH Server (for remote management)
# ===========================================

set -e

echo "===========================================
Sweden Vikings - Game Server Setup
===========================================
"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo bash setup-gameserver.sh)"
    exit 1
fi

# ===========================================
# System Update
# ===========================================
echo ">>> Updating system..."
apt update && apt upgrade -y

# ===========================================
# Install Essential Tools
# ===========================================
echo ">>> Installing essential tools..."
apt install -y curl wget git ufw nano htop

# ===========================================
# Install SteamCMD Dependencies
# ===========================================
echo ">>> Installing SteamCMD dependencies..."
dpkg --add-architecture i386
apt update
apt install -y lib32gcc-s1 lib32stdc++6 libc6:i386 libstdc++6:i386

# ===========================================
# Create Arma Server User
# ===========================================
echo ">>> Creating armaserver user..."
if ! id "armaserver" &>/dev/null; then
    useradd -m -s /bin/bash armaserver
    usermod -aG sudo armaserver
    echo "armaserver user created"
else
    echo "armaserver user already exists"
fi

# ===========================================
# Create Directories
# ===========================================
echo ">>> Creating directories..."
mkdir -p /opt/arma-reforger-server
mkdir -p /opt/steamcmd

# ===========================================
# Install SteamCMD
# ===========================================
echo ">>> Installing SteamCMD..."
cd /opt/steamcmd
if [ ! -f "./steamcmd.sh" ]; then
    wget https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz
    tar -xvzf steamcmd_linux.tar.gz
    rm steamcmd_linux.tar.gz

    # Run once to update
    ./steamcmd.sh +quit

    echo "SteamCMD installed"
else
    echo "SteamCMD already installed"
fi

# ===========================================
# Install Arma Reforger Server
# ===========================================
echo ">>> Installing Arma Reforger Dedicated Server (this takes 10-20 minutes)..."
/opt/steamcmd/steamcmd.sh \
  +force_install_dir /opt/arma-reforger-server \
  +login anonymous \
  +app_update 1874900 validate \
  +quit

# ===========================================
# Create Default Server Config
# ===========================================
echo ">>> Creating default server configuration..."
cat > /opt/arma-reforger-server/server.json << 'EOF'
{
  "dedicatedServerId": "",
  "region": "Europe",
  "gameHostBindAddress": "0.0.0.0",
  "gameHostBindPort": 2001,
  "gameHostRegisterBindAddress": "",
  "gameHostRegisterPort": 2001,
  "adminPassword": "changeme123",
  "game": {
    "name": "Sweden Vikings - Arma Reforger",
    "password": "",
    "passwordAdmin": "changeme123",
    "scenarioId": "{ECC61978EDCC2B5A}Missions/23_Campaign.conf",
    "maxPlayers": 64,
    "visible": true,
    "gameProperties": {
      "serverMaxViewDistance": 2500,
      "serverMinGrassDistance": 50,
      "networkViewDistance": 1000,
      "disableThirdPerson": false,
      "fastValidation": true,
      "battlEye": false,
      "VONDisableUI": false,
      "VONDisableDirectSpeechUI": false
    },
    "mods": []
  },
  "operating": {
    "lobbyPlayerSynchronise": true
  }
}
EOF

echo "IMPORTANT: Edit /opt/arma-reforger-server/server.json and change default passwords!"

# ===========================================
# Create Systemd Service
# ===========================================
echo ">>> Creating systemd service for Arma Reforger..."
cat > /etc/systemd/system/arma-reforger.service << 'EOF'
[Unit]
Description=Arma Reforger Dedicated Server
After=network.target

[Service]
Type=simple
User=armaserver
Group=armaserver
WorkingDirectory=/opt/arma-reforger-server
ExecStart=/opt/arma-reforger-server/ArmaReforgerServer \
  -config /opt/arma-reforger-server/server.json \
  -profile /opt/arma-reforger-server/profile \
  -logLevel normal

Restart=on-failure
RestartSec=10

# Resource limits
LimitNOFILE=100000
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable arma-reforger

# ===========================================
# Set Permissions
# ===========================================
echo ">>> Setting permissions..."
chown -R armaserver:armaserver /opt/arma-reforger-server
chown -R armaserver:armaserver /opt/steamcmd

# ===========================================
# Setup SSH for Remote Management
# ===========================================
echo ">>> Setting up SSH for remote management..."
mkdir -p /home/armaserver/.ssh
chmod 700 /home/armaserver/.ssh
touch /home/armaserver/.ssh/authorized_keys
chmod 600 /home/armaserver/.ssh/authorized_keys
chown -R armaserver:armaserver /home/armaserver/.ssh

echo "
SSH Public Key from Web Server:
================================
Paste the public key from Web Server here (from /home/deploy/.ssh/gameserver_key.pub):
"
read -r SSH_PUBLIC_KEY

if [ ! -z "$SSH_PUBLIC_KEY" ]; then
    echo "$SSH_PUBLIC_KEY" >> /home/armaserver/.ssh/authorized_keys
    echo "SSH key added successfully"
else
    echo "No key provided. You'll need to add it manually to /home/armaserver/.ssh/authorized_keys"
fi

# ===========================================
# Configure SSH Security
# ===========================================
echo ">>> Configuring SSH security..."
cat >> /etc/ssh/sshd_config << 'EOF'

# Security hardening
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
ChallengeResponseAuthentication no
AllowUsers armaserver
Protocol 2
ClientAliveInterval 300
ClientAliveCountMax 2
EOF

systemctl restart sshd

# ===========================================
# Configure Sudo for armaserver
# ===========================================
echo ">>> Configuring sudo permissions..."
cat > /etc/sudoers.d/armaserver << 'EOF'
# Allow armaserver to manage Arma service without password
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl start arma-reforger
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl stop arma-reforger
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl restart arma-reforger
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl status arma-reforger
armaserver ALL=(ALL) NOPASSWD: /opt/steamcmd/steamcmd.sh
EOF

chmod 0440 /etc/sudoers.d/armaserver

# ===========================================
# Get Web Server IP for Firewall
# ===========================================
echo "
Enter the Web Server IP address (for SSH whitelist):
"
read -r WEB_SERVER_IP

# ===========================================
# Configure Firewall
# ===========================================
echo ">>> Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing

# SSH only from Web Server
if [ ! -z "$WEB_SERVER_IP" ]; then
    ufw allow from $WEB_SERVER_IP to any port 22 proto tcp
    echo "SSH allowed from Web Server: $WEB_SERVER_IP"
else
    ufw allow 22/tcp
    echo "WARNING: SSH allowed from anywhere. Restrict this after setup!"
fi

# Arma Reforger ports
ufw allow 2001/udp    # Game port
ufw allow 17777/udp   # Query port

# Enable firewall
echo "y" | ufw enable

# ===========================================
# Create Update Script
# ===========================================
echo ">>> Creating update script..."
cat > /opt/update-arma.sh << 'EOF'
#!/bin/bash
echo "Stopping Arma Reforger Server..."
systemctl stop arma-reforger

echo "Updating server via SteamCMD..."
/opt/steamcmd/steamcmd.sh \
  +force_install_dir /opt/arma-reforger-server \
  +login anonymous \
  +app_update 1874900 validate \
  +quit

echo "Starting Arma Reforger Server..."
systemctl start arma-reforger

echo "Update completed at $(date)"
EOF

chmod +x /opt/update-arma.sh
chown armaserver:armaserver /opt/update-arma.sh

# ===========================================
# Optimize System for Gaming
# ===========================================
echo ">>> Optimizing system for gaming performance..."

# Increase file descriptor limits
cat >> /etc/security/limits.conf << 'EOF'
armaserver soft nofile 100000
armaserver hard nofile 100000
EOF

# Kernel optimizations
cat >> /etc/sysctl.conf << 'EOF'

# Network optimizations for game server
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.core.default_qdisc = fq
EOF

sysctl -p

# ===========================================
# Print Summary
# ===========================================
echo "
===========================================
Game Server Setup Complete!
===========================================

Installed services:
✓ Arma Reforger     - Port 2001 (UDP)
✓ SteamCMD          - /opt/steamcmd
✓ Systemd Service   - arma-reforger.service

Arma Server:
  Location: /opt/arma-reforger-server
  Config:   /opt/arma-reforger-server/server.json
  Profile:  /opt/arma-reforger-server/profile
  User:     armaserver

Server config REQUIRES changes:
  - Edit /opt/arma-reforger-server/server.json
  - Change adminPassword and passwordAdmin
  - Configure game name, scenario, mods, etc.

Firewall configured:
  - SSH: $([ ! -z "$WEB_SERVER_IP" ] && echo "Only from $WEB_SERVER_IP" || echo "From anywhere")
  - Game: Port 2001/UDP (all)
  - Query: Port 17777/UDP (all)

Next steps:
===========

1. Edit server configuration:
   sudo nano /opt/arma-reforger-server/server.json
   (Change passwords and game settings)

2. Start the server:
   sudo systemctl start arma-reforger

3. Check server status:
   sudo systemctl status arma-reforger

4. View logs:
   sudo journalctl -u arma-reforger -f

5. Test SSH from Web Server:
   On Web Server: ssh armaserver@THIS_SERVER_IP

6. Test server management:
   sudo systemctl stop arma-reforger
   sudo systemctl start arma-reforger
   sudo systemctl restart arma-reforger

7. Update Arma Server:
   sudo /opt/update-arma.sh

Management commands:
====================
Start server:    sudo systemctl start arma-reforger
Stop server:     sudo systemctl stop arma-reforger
Restart server:  sudo systemctl restart arma-reforger
Server status:   sudo systemctl status arma-reforger
View logs:       sudo journalctl -u arma-reforger -f
Update server:   sudo /opt/update-arma.sh

Server will start automatically on boot!

===========================================
"
