#!/bin/bash
# ===========================================
# Sweden Vikings CMS - VPS Setup Script
# ===========================================
# Run this script on a fresh Ubuntu 24.04 VPS as root
# Usage: sudo bash setup-server.sh

set -e

echo "===========================================
Sweden Vikings CMS - VPS Setup
===========================================
"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo bash setup-server.sh)"
    exit 1
fi

# ===========================================
# System Update
# ===========================================
echo ">>> Updating system..."
apt update && apt upgrade -y

# ===========================================
# Install Docker
# ===========================================
echo ">>> Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
else
    echo "Docker already installed"
fi

# ===========================================
# Install Docker Compose (included with Docker now)
# ===========================================
echo ">>> Verifying Docker Compose..."
docker compose version

# ===========================================
# Install Nginx
# ===========================================
echo ">>> Installing Nginx..."
apt install -y nginx

# ===========================================
# Install Certbot for SSL
# ===========================================
echo ">>> Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# ===========================================
# Install Git
# ===========================================
echo ">>> Installing Git..."
apt install -y git

# ===========================================
# Install SteamCMD Dependencies (for Arma Reforger)
# ===========================================
echo ">>> Installing SteamCMD dependencies..."
dpkg --add-architecture i386
apt update
apt install -y lib32gcc-s1 lib32stdc++6

# ===========================================
# Create Directories
# ===========================================
echo ">>> Creating directories..."
mkdir -p /opt/swedenvikings
mkdir -p /opt/arma-reforger-server
mkdir -p /opt/steamcmd
mkdir -p /var/www/certbot

# ===========================================
# Install SteamCMD
# ===========================================
echo ">>> Installing SteamCMD..."
cd /opt/steamcmd
if [ ! -f "./steamcmd.sh" ]; then
    curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -
else
    echo "SteamCMD already installed"
fi

# ===========================================
# Create Deploy User
# ===========================================
echo ">>> Creating deploy user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG docker deploy
    echo "deploy user created"
else
    echo "deploy user already exists"
    usermod -aG docker deploy
fi

# ===========================================
# Set Permissions
# ===========================================
echo ">>> Setting permissions..."
chown -R deploy:deploy /opt/swedenvikings
chown -R deploy:deploy /opt/arma-reforger-server
chown -R deploy:deploy /opt/steamcmd

# ===========================================
# Configure Firewall (UFW)
# ===========================================
echo ">>> Configuring firewall..."
apt install -y ufw

ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 2001/udp    # Arma Reforger game
ufw allow 17777/udp   # Arma Reforger query

echo "y" | ufw enable

# ===========================================
# Setup SSH Key Directory for Deploy User
# ===========================================
echo ">>> Setting up SSH for deploy user..."
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# ===========================================
# Print Summary
# ===========================================
echo "
===========================================
Setup Complete!
===========================================

Next steps:
1. Add your SSH public key to /home/deploy/.ssh/authorized_keys

2. Clone the repository:
   su - deploy
   cd /opt/swedenvikings
   git clone https://github.com/YOUR_USERNAME/swedenvikings.eu.git .

3. Create production environment file:
   cp .env.example .env.production
   nano .env.production  # Fill in your values

4. Setup Nginx:
   cp nginx/swedenvikings.conf /etc/nginx/sites-available/swedenvikings
   # Edit the file and replace 'yourdomain.com' with your domain
   nano /etc/nginx/sites-available/swedenvikings
   ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/
   rm /etc/nginx/sites-enabled/default
   nginx -t && systemctl reload nginx

5. Get SSL certificate:
   certbot --nginx -d yourdomain.com -d www.yourdomain.com

6. Start the application:
   su - deploy
   cd /opt/swedenvikings
   docker compose -f docker-compose.prod.yml up -d

7. Run database migrations:
   docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

8. Configure GitHub Secrets for CI/CD:
   - VPS_HOST: Your server IP or domain
   - VPS_USER: deploy
   - VPS_SSH_KEY: Your private SSH key

===========================================
"
