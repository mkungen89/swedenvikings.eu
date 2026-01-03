#!/bin/bash
# ===========================================
# Sweden Vikings CMS - VPS Setup Script
# ===========================================
# Run this script on a fresh Ubuntu 24.04 VPS as root
# Usage: sudo bash setup-server.sh
#
# This script installs everything natively on Ubuntu (no Docker)
# - PostgreSQL 16
# - Redis 7
# - Node.js 20 LTS
# - PM2 for process management
# - Nginx with SSL support
# - SteamCMD for Arma Reforger
# ===========================================

set -e

echo "===========================================
Sweden Vikings CMS - Native Ubuntu Setup
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
# Install Essential Tools
# ===========================================
echo ">>> Installing essential tools..."
apt install -y curl wget git build-essential ufw

# ===========================================
# Install PostgreSQL 16
# ===========================================
echo ">>> Installing PostgreSQL 16..."
if ! command -v psql &> /dev/null; then
    # Add PostgreSQL APT repository
    apt install -y postgresql-common
    /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y
    apt update
    apt install -y postgresql-16 postgresql-contrib-16

    systemctl enable postgresql
    systemctl start postgresql
    echo "PostgreSQL installed"
else
    echo "PostgreSQL already installed"
fi

# ===========================================
# Install Redis 7
# ===========================================
echo ">>> Installing Redis 7..."
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server

    # Configure Redis
    sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

    systemctl enable redis-server
    systemctl restart redis-server
    echo "Redis installed and configured"
else
    echo "Redis already installed"
fi

# ===========================================
# Install Node.js 20 LTS
# ===========================================
echo ">>> Installing Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo "Node.js $(node -v) installed"
else
    echo "Node.js already installed: $(node -v)"
fi

# ===========================================
# Install PM2 (Process Manager)
# ===========================================
echo ">>> Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup systemd -u deploy --hp /home/deploy
    echo "PM2 installed"
else
    echo "PM2 already installed"
fi

# ===========================================
# Install Nginx
# ===========================================
echo ">>> Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "Nginx installed"
else
    echo "Nginx already installed"
fi

# ===========================================
# Install Certbot for SSL
# ===========================================
echo ">>> Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# ===========================================
# Install SteamCMD Dependencies (for Arma Reforger)
# ===========================================
echo ">>> Installing SteamCMD dependencies..."
dpkg --add-architecture i386
apt update
apt install -y lib32gcc-s1 lib32stdc++6 libc6:i386 libstdc++6:i386

# ===========================================
# Create Directories
# ===========================================
echo ">>> Creating directories..."
mkdir -p /opt/swedenvikings
mkdir -p /opt/arma-reforger-server
mkdir -p /opt/steamcmd
mkdir -p /var/www/certbot
mkdir -p /var/log/swedenvikings

# ===========================================
# Install SteamCMD
# ===========================================
echo ">>> Installing SteamCMD..."
cd /opt/steamcmd
if [ ! -f "./steamcmd.sh" ]; then
    curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -
    echo "SteamCMD installed"
else
    echo "SteamCMD already installed"
fi

# ===========================================
# Create Deploy User
# ===========================================
echo ">>> Creating deploy user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    echo "deploy user created"
else
    echo "deploy user already exists"
fi

# ===========================================
# Create Database and User
# ===========================================
echo ">>> Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE USER swedenvikings WITH PASSWORD 'vikings2024';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE swedenvikings OWNER swedenvikings;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE swedenvikings TO swedenvikings;"

# Configure PostgreSQL to allow local connections
echo "host    swedenvikings    swedenvikings    127.0.0.1/32    md5" >> /etc/postgresql/16/main/pg_hba.conf
systemctl reload postgresql

# ===========================================
# Set Permissions
# ===========================================
echo ">>> Setting permissions..."
chown -R deploy:deploy /opt/swedenvikings
chown -R deploy:deploy /opt/arma-reforger-server
chown -R deploy:deploy /opt/steamcmd
chown -R deploy:deploy /var/log/swedenvikings

# Allow deploy user to restart services
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl restart swedenvikings" >> /etc/sudoers.d/deploy
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl stop swedenvikings" >> /etc/sudoers.d/deploy
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl start swedenvikings" >> /etc/sudoers.d/deploy
echo "deploy ALL=(ALL) NOPASSWD: /bin/systemctl status swedenvikings" >> /etc/sudoers.d/deploy
chmod 0440 /etc/sudoers.d/deploy

# ===========================================
# Configure Firewall (UFW)
# ===========================================
echo ">>> Configuring firewall..."
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

Installed services:
✓ PostgreSQL 16    - localhost:5432
✓ Redis 7          - localhost:6379
✓ Node.js $(node -v)
✓ PM2              - Process manager
✓ Nginx            - Web server
✓ Certbot          - SSL certificates
✓ SteamCMD         - Arma Reforger server

Database created:
  Name: swedenvikings
  User: swedenvikings
  Pass: vikings2024 (CHANGE THIS!)

Next steps:
1. Add your SSH public key to /home/deploy/.ssh/authorized_keys

2. Clone the repository as deploy user:
   su - deploy
   cd /opt/swedenvikings
   git clone https://github.com/YOUR_USERNAME/swedenvikings.eu.git .

3. Install dependencies and build:
   npm install
   npm run build

4. Create production environment file:
   cp .env.example.production .env.production
   nano .env.production  # Fill in your values

5. Run database migrations:
   cd /opt/swedenvikings
   npm run db:migrate:deploy

6. Setup PM2:
   pm2 start ecosystem.config.js --env production
   pm2 save

7. Setup Nginx:
   sudo cp nginx/swedenvikings.conf /etc/nginx/sites-available/swedenvikings
   sudo nano /etc/nginx/sites-available/swedenvikings  # Edit domain
   sudo ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx

8. Get SSL certificate:
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

9. Configure GitHub Secrets for CI/CD:
   - VPS_HOST: Your server IP or domain
   - VPS_USER: deploy
   - VPS_SSH_KEY: Your private SSH key
   - VPS_PORT: 22

===========================================
"
