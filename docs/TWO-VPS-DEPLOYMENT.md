# Two-VPS Deployment Guide - SSH Architecture

## Översikt

Detta är en guide för att sätta upp Sweden Vikings CMS på **två separata VPS-servrar** med SSH-kommunikation mellan dem:

### Server 1: Web Server (CMS)
**Specs:** CPU 2 cores, RAM 4GB, Storage 50GB NVMe
**OS:** Ubuntu 24.04 LTS
**Tjänster:**
- ✓ Node.js CMS (Frontend + Backend)
- ✓ PostgreSQL 16 (Databas)
- ✓ Redis 7 (Sessions/Cache)
- ✓ Nginx (Reverse Proxy + SSL)
- ✓ PM2 (Process Manager)

### Server 2: Game Server (Arma Reforger)
**Specs:** CPU 4+ cores, RAM 16GB+, Storage 50GB+ SSD
**OS:** Ubuntu 24.04 LTS
**Tjänster:**
- ✓ Arma Reforger Dedicated Server
- ✓ SteamCMD (för uppdateringar)
- ✓ SSH Server (för remote management)

## Arkitektur

```
┌─────────────────────────────┐          SSH          ┌──────────────────────────┐
│   VPS 1: Web Server         │ ◄─────────────────────► │  VPS 2: Game Server      │
│   (2 CPU, 4GB RAM)          │   Port 22 (secured)    │  (4+ CPU, 16GB+ RAM)     │
├─────────────────────────────┤                        ├──────────────────────────┤
│ ┌─────────────────────────┐ │                        │ ┌──────────────────────┐ │
│ │  Nginx (Port 80/443)    │ │                        │ │  Arma Reforger       │ │
│ │  - SSL Termination      │ │                        │ │  - Port 2001 (UDP)   │ │
│ │  - Reverse Proxy        │ │                        │ │  - Port 17777 (UDP)  │ │
│ └─────────────────────────┘ │                        │ └──────────────────────┘ │
│ ┌─────────────────────────┐ │                        │ ┌──────────────────────┐ │
│ │  Node.js CMS            │ │                        │ │  SteamCMD            │ │
│ │  - Express API          │ │                        │ │  - Server Updates    │ │
│ │  - React Frontend       │ │                        │ └──────────────────────┘ │
│ │  - Socket.io            │ │                        │ ┌──────────────────────┐ │
│ └─────────────────────────┘ │                        │ │  SSH Daemon          │ │
│ ┌─────────────────────────┐ │                        │ │  - Remote Access     │ │
│ │  PostgreSQL 16          │ │                        │ │  - Key-based Auth    │ │
│ └─────────────────────────┘ │                        │ └──────────────────────┘ │
│ ┌─────────────────────────┐ │                        └──────────────────────────┘
│ │  Redis 7                │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

## Varför två servrar?

### Web Server (Lägre specs)
- **Lättare last:** Node.js + PostgreSQL + Redis kräver mindre resurser
- **Kostnadseffektivt:** 2 CPU / 4GB RAM räcker gott
- **Stabilitet:** Web-tjänster är förutsägbara och skalerbara

### Game Server (Högre specs)
- **CPU-intensivt:** Arma Reforger kräver mycket processorkraft
- **RAM-hungrig:** 8-12GB endast för spelet + OS overhead
- **Isolering:** Spelservern påverkar inte webben vid hög belastning
- **Geografisk placering:** Kan välja datacenter närmre spelare

---

## Del 1: Setup SSH-kommunikation mellan servrarna

Detta måste göras **FÖRST** innan du installerar något annat.

### Steg 1: Skapa SSH-användare på Game Server

Logga in på **Game Server** som root:

```bash
# Skapa dedikerad användare för Arma-servern
sudo adduser armaserver

# Lägg till i sudo-gruppen (för att kunna starta/stoppa servern)
sudo usermod -aG sudo armaserver

# Skapa SSH-mapp
sudo -u armaserver mkdir -p /home/armaserver/.ssh
sudo -u armaserver chmod 700 /home/armaserver/.ssh
```

### Steg 2: Generera SSH-nycklar på Web Server

Logga in på **Web Server** och generera SSH-nyckelpar:

```bash
# Logga in som den användare som kör CMS (t.ex. deploy eller root)
# Generera ED25519 SSH-nyckel (säkrare än RSA)
ssh-keygen -t ed25519 -C "cms-to-gameserver" -f ~/.ssh/gameserver_key

# Tryck Enter för att acceptera standardplatsen
# Tryck Enter två gånger för att skippa lösenord (vi använder key-based auth)
```

Detta skapar två filer:
- `~/.ssh/gameserver_key` - Privat nyckel (ALDRIG dela denna!)
- `~/.ssh/gameserver_key.pub` - Publik nyckel (kopieras till Game Server)

### Steg 3: Kopiera publik nyckel till Game Server

**Alternativ A: Manuellt (säkrast)**

På **Web Server**, visa publika nyckeln:
```bash
cat ~/.ssh/gameserver_key.pub
```

Kopiera outputen (börjar med `ssh-ed25519 ...`).

Logga in på **Game Server** och lägg till nyckeln:
```bash
sudo nano /home/armaserver/.ssh/authorized_keys
# Klistra in nyckeln, spara (Ctrl+O, Enter, Ctrl+X)

# Sätt rätt permissions
sudo chown armaserver:armaserver /home/armaserver/.ssh/authorized_keys
sudo chmod 600 /home/armaserver/.ssh/authorized_keys
```

**Alternativ B: Automatiskt (kräver lösenord)**

På **Web Server**:
```bash
ssh-copy-id -i ~/.ssh/gameserver_key.pub armaserver@GAME_SERVER_IP
```

### Steg 4: Konfigurera SSH på Game Server (säkerhet)

På **Game Server**, redigera SSH-konfiguration:

```bash
sudo nano /etc/ssh/sshd_config
```

Justera dessa inställningar:

```conf
# Grundläggande säkerhet
PermitRootLogin no                    # Neka root login
PasswordAuthentication no             # Endast SSH-nycklar
PubkeyAuthentication yes              # Tillåt public key auth
ChallengeResponseAuthentication no    # Inget challenge-response

# Tillåt endast armaserver användaren (optional)
AllowUsers armaserver

# SSH2 endast
Protocol 2

# Stängning vid inaktivitet (5 min)
ClientAliveInterval 300
ClientAliveCountMax 2
```

Spara och starta om SSH:

```bash
sudo systemctl restart sshd
```

### Steg 5: Testa SSH-anslutning

På **Web Server**, testa anslutningen:

```bash
# Test med SSH-nyckeln
ssh -i ~/.ssh/gameserver_key armaserver@GAME_SERVER_IP

# Om det funkar, ska du loggas in utan lösenord!
# Skriv 'exit' för att logga ut
```

Om du får problem:
```bash
# Kontrollera SSH-loggen på Game Server
sudo tail -f /var/log/auth.log

# Testa med verbose output
ssh -vvv -i ~/.ssh/gameserver_key armaserver@GAME_SERVER_IP
```

### Steg 6: Konfigurera SSH-config på Web Server

Skapa en SSH-config för enkel anslutning:

```bash
nano ~/.ssh/config
```

Lägg till:

```conf
Host gameserver
    HostName GAME_SERVER_IP_ELLER_DOMAIN
    User armaserver
    Port 22
    IdentityFile ~/.ssh/gameserver_key
    IdentitiesOnly yes
    StrictHostKeyChecking yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Spara och sätt rätt permissions:

```bash
chmod 600 ~/.ssh/config
```

Nu kan du ansluta med bara:
```bash
ssh gameserver
```

### Steg 7: Säkra Game Server brandväggen

På **Game Server**, konfigurera UFW:

```bash
# Installera UFW om det inte finns
sudo apt install ufw -y

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Tillåt SSH från WEB_SERVER_IP endast
sudo ufw allow from WEB_SERVER_IP to any port 22 proto tcp

# Arma Reforger game ports (från alla)
sudo ufw allow 2001/udp
sudo ufw allow 17777/udp

# Aktivera brandväggen
sudo ufw enable

# Kolla status
sudo ufw status verbose
```

**VIKTIGT:** Om du behöver SSH från din egen dator också:
```bash
# Lägg till din IP också
sudo ufw allow from YOUR_HOME_IP to any port 22 proto tcp
```

---

## Del 2: Installation - Web Server (VPS 1)

### Förberedelser

Du behöver:
- ✅ Ubuntu 24.04 VPS med root-access
- ✅ Domännamn pekat till serverns IP (A-record)
- ✅ Steam API-nyckel: https://steamcommunity.com/dev/apikey
- ✅ SSH-nyckel konfigurerad till Game Server (från Del 1)

### Steg 1: Initial setup

Logga in som root:

```bash
# Uppdatera systemet
apt update && apt upgrade -y

# Installera grundläggande verktyg
apt install -y curl wget git ufw nano

# Konfigurera brandvägg
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Steg 2: Skapa deploy-användare

```bash
# Skapa användare
adduser deploy
usermod -aG sudo deploy

# Byt till deploy
su - deploy
```

### Steg 3: Installera Node.js 20 LTS

```bash
# Installera Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verifiera
node --version  # v20.x.x
npm --version   # 10.x.x

# Installera PM2 globalt
sudo npm install -g pm2
```

### Steg 4: Installera PostgreSQL 16

```bash
# Lägg till PostgreSQL APT repository
sudo apt install -y postgresql-common
sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh -y

# Installera PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Verifiera
sudo systemctl status postgresql
```

**Konfigurera databas:**

```bash
# Byt till postgres-användare
sudo -u postgres psql

-- I PostgreSQL-konsolen:
CREATE USER swedenvikings WITH PASSWORD 'ditt_säkra_lösenord';
CREATE DATABASE swedenvikings OWNER swedenvikings;
GRANT ALL PRIVILEGES ON DATABASE swedenvikings TO swedenvikings;
\q
```

### Steg 5: Installera Redis 7

```bash
# Installera Redis
sudo apt install -y redis-server

# Konfigurera Redis
sudo nano /etc/redis/redis.conf
```

Ändra dessa rader:
```conf
supervised systemd
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Starta om Redis:
```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Testa
redis-cli ping  # PONG
```

### Steg 6: Installera Nginx

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Starta Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Steg 7: Klona projektet

```bash
# Skapa projektmapp
sudo mkdir -p /opt/swedenvikings
sudo chown deploy:deploy /opt/swedenvikings

# Klona repo
cd /opt/swedenvikings
git clone https://github.com/YOUR_USERNAME/swedenvikings.eu.git .
```

### Steg 8: Konfigurera miljövariabler

```bash
cp .env.example.production .env.production
nano .env.production
```

Fyll i dessa värden:

```env
# Database
DATABASE_URL="postgresql://swedenvikings:ditt_säkra_lösenord@localhost:5432/swedenvikings"

# Redis
REDIS_URL="redis://localhost:6379"

# Session (generera med: openssl rand -base64 64)
SESSION_SECRET="din_genererade_session_secret"

# Steam API
STEAM_API_KEY="din_steam_api_key"

# Server
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Domain
DOMAIN=yourdomain.com

# Game Server SSH Connection
GAME_SERVER_HOST=GAME_SERVER_IP
GAME_SERVER_PORT=22
GAME_SERVER_USER=armaserver
GAME_SERVER_SSH_KEY=/home/deploy/.ssh/gameserver_key
GAME_SERVER_INSTALL_PATH=/opt/arma-reforger-server
GAME_SERVER_STEAMCMD_PATH=/opt/steamcmd
```

### Steg 9: Bygg och kör applikationen

```bash
# Installera dependencies
npm install

# Bygg frontend och backend
npm run build

# Kör database migrations
cd server && npx prisma migrate deploy && cd ..

# (Optional) Seed initial data
cd server && npx prisma db seed && cd ..

# Starta med PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Följ instruktionerna för att aktivera autostart
```

### Steg 10: Konfigurera Nginx

Skapa Nginx-konfiguration:

```bash
sudo nano /etc/nginx/sites-available/swedenvikings
```

Lägg till:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS (kommer aktiveras efter Certbot)
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (hanteras av Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.io WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Client max body size (för uploads)
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

Aktivera site:

```bash
# Länka config
sudo ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/

# Ta bort default site
sudo rm -f /etc/nginx/sites-enabled/default

# Testa config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Steg 11: Skaffa SSL-certifikat

```bash
# Kör Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Följ prompten:
# - Ange din email
# - Godkänn ToS
# - (Optional) Dela email med EFF
# - Välj att redirecta HTTP till HTTPS

# Testa auto-renewal
sudo certbot renew --dry-run
```

### Steg 12: Verifiera installation

```bash
# Kolla PM2
pm2 status
pm2 logs swedenvikings --lines 50

# Kolla Nginx
sudo systemctl status nginx

# Testa hemsidan
curl https://yourdomain.com

# Kolla SSL
curl -I https://yourdomain.com
```

---

## Del 3: Installation - Game Server (VPS 2)

### Förberedelser

- ✅ Ubuntu 24.04 VPS med root-access
- ✅ SSH-nyckel från Web Server konfigurerad (från Del 1)
- ✅ Minst 4 CPU cores, 16GB RAM

### Steg 1: Initial setup

```bash
# Uppdatera systemet
apt update && apt upgrade -y

# Installera grundläggande verktyg
apt install -y curl wget git ufw nano lib32gcc-s1

# Brandvägg (redan konfigurerad i Del 1, men dubbelkolla)
ufw status verbose
```

### Steg 2: Installera SteamCMD

```bash
# Lägg till 32-bit arkitektur (SteamCMD kräver detta)
sudo dpkg --add-architecture i386
sudo apt update

# Installera dependencies
sudo apt install -y lib32gcc-s1 lib32stdc++6 steamcmd

# Alternativt: Installera manuellt om steamcmd-paketet inte finns
sudo mkdir -p /opt/steamcmd
cd /opt/steamcmd
wget https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz
tar -xvzf steamcmd_linux.tar.gz
rm steamcmd_linux.tar.gz

# Testa SteamCMD
/opt/steamcmd/steamcmd.sh +quit
```

### Steg 3: Installera Arma Reforger Server

```bash
# Skapa server-mapp
sudo mkdir -p /opt/arma-reforger-server
sudo chown armaserver:armaserver /opt/arma-reforger-server

# Logga in som armaserver
sudo -u armaserver bash

# Installera servern via SteamCMD
/opt/steamcmd/steamcmd.sh \
  +force_install_dir /opt/arma-reforger-server \
  +login anonymous \
  +app_update 1874900 validate \
  +quit

# Detta tar 10-20 minuter beroende på internet
```

### Steg 4: Konfigurera Arma Reforger Server

Skapa grundläggande server config:

```bash
nano /opt/arma-reforger-server/server.json
```

Exempel config:

```json
{
  "dedicatedServerId": "",
  "region": "Europe",
  "gameHostBindAddress": "0.0.0.0",
  "gameHostBindPort": 2001,
  "gameHostRegisterBindAddress": "",
  "gameHostRegisterPort": 2001,
  "adminPassword": "ditt_admin_lösenord",
  "game": {
    "name": "Sweden Vikings - Arma Reforger",
    "password": "",
    "passwordAdmin": "admin_password",
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
```

### Steg 5: Skapa systemd service för Arma

```bash
sudo nano /etc/systemd/system/arma-reforger.service
```

Lägg till:

```ini
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
```

Aktivera service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable arma-reforger
sudo systemctl start arma-reforger

# Kolla status
sudo systemctl status arma-reforger

# Kolla logs
sudo journalctl -u arma-reforger -f
```

### Steg 6: Testa SSH från Web Server

På **Web Server**, testa att köra kommandon:

```bash
# Testa basic command
ssh gameserver "ls -la /opt/arma-reforger-server"

# Testa server status
ssh gameserver "systemctl status arma-reforger"

# Testa starta/stoppa
ssh gameserver "sudo systemctl stop arma-reforger"
ssh gameserver "sudo systemctl start arma-reforger"
```

Om du får "permission denied" för sudo:

```bash
# På Game Server, ge armaserver sudo utan lösenord för vissa kommandon
sudo visudo
```

Lägg till i slutet:

```
# Allow armaserver to manage Arma service without password
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl start arma-reforger
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl stop arma-reforger
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl restart arma-reforger
armaserver ALL=(ALL) NOPASSWD: /bin/systemctl status arma-reforger
armaserver ALL=(ALL) NOPASSWD: /opt/steamcmd/steamcmd.sh
```

---

## Del 4: Testa kommunikationen

### Test 1: Manuellt SSH-test från Web Server

```bash
# Logga in på Web Server som deploy
ssh gameserver

# När du är inne, testa:
systemctl status arma-reforger
ls -la /opt/arma-reforger-server
exit
```

### Test 2: Testa via CMS Admin Panel

1. Logga in på `https://yourdomain.com`
2. Gå till `/admin/server`
3. Tryck på "Status"-knappen
4. Du borde se serverns status (online/offline, spelare, etc.)
5. Testa "Starta Server", "Stoppa Server"

### Test 3: Kolla loggar

**På Web Server:**
```bash
pm2 logs swedenvikings --lines 100
```

**På Game Server:**
```bash
sudo journalctl -u arma-reforger -f
```

---

## Underhåll och Monitoring

### Automatiska backups (Web Server)

```bash
# Skapa backup-script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/deploy/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

pg_dump -U swedenvikings swedenvikings > "$BACKUP_DIR/backup_$DATE.sql"

# Behåll bara senaste 7 dagarna
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql"
```

Gör körbar och lägg till i cron:

```bash
chmod +x ~/backup-db.sh

# Lägg till cron job (varje dag kl 02:00)
crontab -e
```

Lägg till:
```
0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/backup.log 2>&1
```

### Automatiska Arma-uppdateringar (Game Server)

```bash
# Skapa update-script
sudo nano /opt/update-arma.sh
```

```bash
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
```

```bash
chmod +x /opt/update-arma.sh

# Test
sudo /opt/update-arma.sh
```

### Monitoring med Netdata (Optional)

På **båda servrarna**:

```bash
# Installera Netdata
bash <(curl -Ss https://get.netdata.cloud/kickstart.sh) --claim-token YOUR_CLAIM_TOKEN

# Åtkomst:
# Web Server: https://yourdomain.com:19999
# Game Server: http://GAME_SERVER_IP:19999
```

---

## Troubleshooting

### Problem: SSH-anslutning nekas

```bash
# På Web Server, testa verbose
ssh -vvv -i ~/.ssh/gameserver_key armaserver@GAME_SERVER_IP

# Kolla permissions
ls -la ~/.ssh/gameserver_key  # Should be 600
ls -la ~/.ssh/config          # Should be 600

# På Game Server, kolla auth log
sudo tail -f /var/log/auth.log
```

### Problem: CMS kan inte starta Arma-servern

```bash
# På Game Server, verifiera sudo-permissions
sudo -l -U armaserver

# Borde visa:
# armaserver ALL=(ALL) NOPASSWD: /bin/systemctl start arma-reforger
# osv...

# Testa manuellt från Web Server
ssh gameserver "sudo systemctl status arma-reforger"
```

### Problem: Arma-servern startar inte

```bash
# På Game Server, kolla logs
sudo journalctl -u arma-reforger -n 100

# Kolla om servern körs
ps aux | grep Arma

# Kolla server config
cat /opt/arma-reforger-server/server.json

# Testa starta manuellt
cd /opt/arma-reforger-server
./ArmaReforgerServer -config server.json -profile profile -logLevel normal
```

### Problem: Högt RAM-användning på Web Server

```bash
# Kolla PM2 memory
pm2 monit

# Restart PM2-processer
pm2 restart all

# Kolla PostgreSQL
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('swedenvikings'));"

# Optimera PostgreSQL om nödvändigt
sudo nano /etc/postgresql/16/main/postgresql.conf
# shared_buffers = 512MB (ca 1/4 av RAM)
# effective_cache_size = 2GB (ca 1/2 av RAM)
```

---

## Säkerhet Checklist

- [ ] **Web Server:**
  - [ ] UFW aktiverad (endast 22, 80, 443)
  - [ ] SSH root login disabled
  - [ ] SSH password auth disabled
  - [ ] SSL/TLS certifikat aktivt
  - [ ] Automatiska säkerhetsuppdateringar
  - [ ] Fail2ban installerad (optional)

- [ ] **Game Server:**
  - [ ] UFW aktiverad (endast 22 från Web IP, 2001/17777 UDP)
  - [ ] SSH root login disabled
  - [ ] SSH password auth disabled
  - [ ] Endast key-based auth
  - [ ] Sudo limited för armaserver-användare
  - [ ] Automatiska säkerhetsuppdateringar

- [ ] **SSH-kommunikation:**
  - [ ] SSH-nycklar genererade (ED25519)
  - [ ] Privat nyckel permissions 600
  - [ ] Public key i authorized_keys
  - [ ] SSH config korrekt konfigurerad
  - [ ] Anslutning testad och fungerande

---

## Kostnadsuppskattning

### VPS 1: Web Server
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 50GB NVMe
- **Kostnad:** ~$12-20/månad (Hetzner, DigitalOcean, Linode)

### VPS 2: Game Server
- **CPU:** 4-6 cores
- **RAM:** 16GB
- **Storage:** 50GB SSD
- **Kostnad:** ~$40-80/månad (Hetzner, OVH, Contabo)

**Total:** ~$52-100/månad beroende på provider

**Rekommenderade providers:**
- **Hetzner:** Bäst pris/prestanda
- **OVH:** Bra för game servers
- **Contabo:** Billig men blandad kvalitet
- **DigitalOcean/Linode:** Dyrare men pålitliga

---

## Sammanfattning

Du har nu:

1. ✅ **Web Server (VPS 1)** med CMS, databas, Redis, Nginx
2. ✅ **Game Server (VPS 2)** med Arma Reforger
3. ✅ **SSH-kommunikation** mellan servrarna (säkert med nycklar)
4. ✅ **Automatisk deployment** via PM2
5. ✅ **SSL/TLS** via Let's Encrypt
6. ✅ **Monitoring och logging**
7. ✅ **Backup-system** för databas

Din CMS kan nu hantera Arma-servern via SSH - starta, stoppa, uppdatera, läsa loggar, allt från webbgränssnittet!

**Nästa steg:**
- Konfigurera DNS för din domän
- Skapa första admin-användaren via Steam login
- Testa alla funktioner i Admin Panel
- Sätt upp automatiska backups
- (Optional) Konfigurera monitoring med Netdata/Grafana

Lycka till! 🚀
