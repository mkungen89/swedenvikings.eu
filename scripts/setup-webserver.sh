#!/bin/bash
# ===========================================
# Sweden Vikings - Web Server Setup (VPS 1)
# ===========================================
# Run this script on Web Server (Ubuntu 24.04) as root
# Specs: 2 CPU, 4GB RAM, 50GB NVMe
# Usage: sudo bash setup-webserver.sh
#
# This installs:
# - PostgreSQL 16
# - Redis 7
# - Node.js 20 LTS
# - PM2 for process management
# - Nginx with SSL support
# ===========================================

set -e

echo "===========================================
Sweden Vikings - Web Server Setup
===========================================
"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (sudo bash setup-webserver.sh)"
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
apt install -y curl wget git build-essential ufw nano htop

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

    # Configure Redis for production
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
# Create Deploy User
# ===========================================
echo ">>> Creating deploy user..."
if ! id "deploy" &>/dev/null; then
    useradd -m -s /bin/bash deploy
    usermod -aG sudo deploy
    echo "deploy user created"
else
    echo "deploy user already exists"
fi

# ===========================================
# Create Directories
# ===========================================
echo ">>> Creating directories..."
mkdir -p /opt/swedenvikings
mkdir -p /var/log/swedenvikings
mkdir -p /home/deploy/backups

# ===========================================
# Setup PostgreSQL Database
# ===========================================
echo ">>> Setting up PostgreSQL database..."
echo "Enter a secure password for the database user:"
read -s DB_PASSWORD

sudo -u postgres psql -c "CREATE USER swedenvikings WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "CREATE DATABASE swedenvikings OWNER swedenvikings;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE swedenvikings TO swedenvikings;"

# Configure PostgreSQL to allow local connections
if ! grep -q "host.*swedenvikings.*swedenvikings" /etc/postgresql/16/main/pg_hba.conf; then
    echo "host    swedenvikings    swedenvikings    127.0.0.1/32    md5" >> /etc/postgresql/16/main/pg_hba.conf
    systemctl reload postgresql
fi

# ===========================================
# Set Permissions
# ===========================================
echo ">>> Setting permissions..."
chown -R deploy:deploy /opt/swedenvikings
chown -R deploy:deploy /var/log/swedenvikings
chown -R deploy:deploy /home/deploy/backups

# ===========================================
# Configure Firewall (UFW)
# ===========================================
echo ">>> Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS

# Don't enable yet if SSH is active (to prevent lockout)
if ! ufw status | grep -q "Status: active"; then
    echo "y" | ufw enable
fi

# ===========================================
# Setup SSH for Deploy User
# ===========================================
echo ">>> Setting up SSH for deploy user..."
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# ===========================================
# Setup SSH Keys for Game Server Connection
# ===========================================
echo ">>> Generating SSH key for Game Server connection..."
sudo -u deploy ssh-keygen -t ed25519 -C "webserver-to-gameserver" -f /home/deploy/.ssh/gameserver_key -N ""

echo "
SSH Public Key for Game Server:
================================"
cat /home/deploy/.ssh/gameserver_key.pub
echo "
================================
Copy the above key and add it to /home/armaserver/.ssh/authorized_keys on the Game Server
"

# Create SSH config for easy connection
cat > /home/deploy/.ssh/config << 'EOF'
Host gameserver
    HostName GAME_SERVER_IP
    User armaserver
    Port 22
    IdentityFile ~/.ssh/gameserver_key
    IdentitiesOnly yes
    StrictHostKeyChecking yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
EOF

chmod 600 /home/deploy/.ssh/config
chown deploy:deploy /home/deploy/.ssh/config

echo "Edit /home/deploy/.ssh/config and replace GAME_SERVER_IP with actual IP"

# ===========================================
# Optimize PostgreSQL for 4GB RAM
# ===========================================
echo ">>> Optimizing PostgreSQL..."
cat >> /etc/postgresql/16/main/postgresql.conf << EOF

# Optimized for 4GB RAM
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 5MB
min_wal_size = 1GB
max_wal_size = 4GB
max_worker_processes = 2
max_parallel_workers_per_gather = 1
max_parallel_workers = 2
EOF

systemctl restart postgresql

# ===========================================
# Create Backup Script
# ===========================================
echo ">>> Creating backup script..."
cat > /home/deploy/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U swedenvikings swedenvikings > "$BACKUP_DIR/backup_$DATE.sql"

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
EOF

chmod +x /home/deploy/backup-db.sh
chown deploy:deploy /home/deploy/backup-db.sh

# ===========================================
# Setup PM2 Startup
# ===========================================
echo ">>> Configuring PM2 startup..."
sudo -u deploy pm2 startup systemd -u deploy --hp /home/deploy | tail -n 1 | bash

# ===========================================
# Print Summary
# ===========================================
echo "
===========================================
Web Server Setup Complete!
===========================================

Installed services:
✓ PostgreSQL 16    - localhost:5432
✓ Redis 7          - localhost:6379
✓ Node.js $(node -v)
✓ PM2              - Process manager
✓ Nginx            - Web server
✓ Certbot          - SSL certificates

Database created:
  Name: swedenvikings
  User: swedenvikings
  Pass: <your entered password>

Deploy user created: deploy

SSH key for Game Server:
  Located at: /home/deploy/.ssh/gameserver_key.pub
  Add this to Game Server's /home/armaserver/.ssh/authorized_keys

Next steps:
===========

1. Copy SSH public key to Game Server (see above)

2. Update SSH config:
   sudo nano /home/deploy/.ssh/config
   (Replace GAME_SERVER_IP with actual IP)

3. Test SSH connection to Game Server:
   sudo -u deploy ssh gameserver

4. Clone repository as deploy user:
   sudo -u deploy git clone https://github.com/YOUR_USERNAME/swedenvikings.eu.git /opt/swedenvikings

5. Configure environment:
   cd /opt/swedenvikings
   cp .env.example.production .env.production
   nano .env.production

   Fill in:
   - DATABASE_URL=\"postgresql://swedenvikings:<password>@localhost:5432/swedenvikings\"
   - SESSION_SECRET (generate: openssl rand -base64 64)
   - STEAM_API_KEY
   - GAME_SERVER_HOST=<game server IP>
   - GAME_SERVER_SSH_KEY=/home/deploy/.ssh/gameserver_key
   - DOMAIN=yourdomain.com

6. Build and deploy:
   npm install
   npm run build
   cd server && npx prisma migrate deploy && cd ..
   pm2 start ecosystem.config.js --env production
   pm2 save

7. Configure Nginx:
   sudo cp nginx/swedenvikings.conf /etc/nginx/sites-available/swedenvikings
   sudo nano /etc/nginx/sites-available/swedenvikings  # Edit domain
   sudo ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl reload nginx

8. Get SSL certificate:
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

9. Setup automatic backups (cron):
   crontab -e
   Add: 0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/backup.log 2>&1

===========================================
"
