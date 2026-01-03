# Sweden Vikings CMS - Deployment Guide

Snabbguide för att deploya Sweden Vikings CMS på Ubuntu VPS (Native - No Docker).

## Förutsättningar

- Ubuntu 24.04 LTS VPS
- Root access
- Domännamn pekat till serverns IP
- Steam API-nyckel: https://steamcommunity.com/dev/apikey

## 🚀 Quick Start (3 Steps)

### Step 1: Initial Server Setup (5-10 min)

SSH till din VPS som root och kör setup-scriptet:

```bash
# Ladda ner och kör setup-script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/swedenvikings.eu/main/scripts/setup-server.sh
sudo bash setup-server.sh
```

Detta installerar:
- PostgreSQL 16
- Redis 7
- Node.js 20 LTS
- PM2
- Nginx
- Certbot
- SteamCMD

**⏱️ Vänta tills scriptet är klart (ca 5-10 minuter)**

### Step 2: Deploy Application (5-10 min)

```bash
# Byt till deploy user
su - deploy

# Klona repository
cd /opt/swedenvikings
git clone https://github.com/YOUR_USERNAME/swedenvikings.eu.git .

# Installera och bygg
npm install
npm run build

# Konfigurera miljövariabler
cp .env.example.production .env.production
nano .env.production
```

**Viktig: Fyll i dessa värden i `.env.production`:**

```bash
# Generera session secret
openssl rand -base64 64

# Redigera .env.production:
SESSION_SECRET=<output från kommandot ovan>
STEAM_API_KEY=<din Steam API key>
DATABASE_URL="postgresql://swedenvikings:NYT_LÖSENORD@localhost:5432/swedenvikings"
CLIENT_URL=https://dindomän.com
STEAM_REALM=https://dindomän.com
STEAM_RETURN_URL=https://dindomän.com/api/auth/steam/callback
CORS_ORIGIN=https://dindomän.com
```

**Kör migrations och starta:**

```bash
npm run db:migrate:deploy
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Följ instruktionerna
```

### Step 3: Konfigurera Nginx & SSL (5 min)

```bash
# Kopiera Nginx config
sudo cp nginx/swedenvikings.conf /etc/nginx/sites-available/swedenvikings

# Redigera domännamn
sudo nano /etc/nginx/sites-available/swedenvikings
# Sök och ersätt 'yourdomain.com' med din faktiska domän

# Aktivera site
sudo ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testa och reload
sudo nginx -t
sudo systemctl reload nginx

# Skaffa SSL-certifikat (Let's Encrypt)
sudo certbot --nginx -d dindomän.com -d www.dindomän.com
```

## ✅ Verifiera Installation

```bash
# PM2 status
pm2 status
pm2 logs swedenvikings --lines 50

# Services
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server

# Test website
curl https://dindomän.com
```

## 📊 Hantera Applikationen

### PM2 Kommandon

```bash
# Status
pm2 status

# Logs (live)
pm2 logs swedenvikings

# Monitoring dashboard
pm2 monit

# Restart
pm2 restart swedenvikings

# Reload (zero-downtime)
pm2 reload swedenvikings

# Stop
pm2 stop swedenvikings

# Start
pm2 start ecosystem.config.js --env production
```

### Eller via npm scripts

```bash
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:reload
npm run pm2:logs
npm run pm2:monit
```

## 🔄 Uppdatera Applikationen

### Automatisk Deploy

```bash
cd /opt/swedenvikings
bash scripts/deploy.sh
```

### Manuell Deploy

```bash
cd /opt/swedenvikings
git pull origin main
npm install
npm run build
npm run db:migrate:deploy
pm2 reload ecosystem.config.js --env production
pm2 save
```

## 🛠 Troubleshooting

### Applikationen startar inte

```bash
# Kolla PM2 logs
pm2 logs swedenvikings --err --lines 100

# Kolla om port 3001 används
sudo netstat -tulpn | grep 3001

# Testa starta manuellt
cd /opt/swedenvikings
node server/dist/index.js
```

### Databas-problem

```bash
# Testa anslutning
psql -U swedenvikings -d swedenvikings -h localhost

# Kolla PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Visa logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Redis-problem

```bash
# Test ping
redis-cli ping

# Status
sudo systemctl status redis-server

# Restart
sudo systemctl restart redis-server
```

### Nginx-problem

```bash
# Test config
sudo nginx -t

# Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/swedenvikings_error.log

# Restart
sudo systemctl restart nginx
```

### SSL-certifikat

```bash
# Förnya certifikat
sudo certbot renew

# Test auto-renewal
sudo certbot renew --dry-run
```

## 💾 Backup & Restore

### Backup Databas

```bash
# Automatisk backup (via script)
cd /opt/swedenvikings
bash scripts/backup.sh

# Manuell backup
pg_dump -U swedenvikings swedenvikings > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Databas

```bash
# Via script
bash scripts/restore.sh backup_filename.sql

# Manuellt
psql -U swedenvikings -d swedenvikings < backup_filename.sql
```

### Automatisk Backup (Cron)

```bash
# Redigera crontab
crontab -e

# Lägg till (backup varje natt kl 02:00)
0 2 * * * cd /opt/swedenvikings && bash scripts/backup.sh
```

## 🔐 Säkerhet

### Ändra Database Password

```bash
# Som postgres user
sudo -u postgres psql
ALTER USER swedenvikings WITH PASSWORD 'nytt_starkt_lösenord';
\q

# Uppdatera .env.production
nano /opt/swedenvikings/.env.production
# Ändra DATABASE_URL

# Restart applikation
pm2 restart swedenvikings
```

### Firewall (UFW)

```bash
# Status
sudo ufw status

# Tillåt endast nödvändiga portar
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 2001/udp    # Arma Reforger
sudo ufw allow 17777/udp   # Arma Query
```

### SSH Säkerhet

```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Sätt: PermitRootLogin no
sudo systemctl restart sshd

# Använd endast SSH-nycklar
# Sätt: PasswordAuthentication no
```

## 📈 Monitoring

### System Resources

```bash
# CPU/RAM/Disk
htop

# Disk usage
df -h

# Memory
free -h

# Network
sudo netstat -tulpn
```

### Application Logs

```bash
# PM2 logs (live)
pm2 logs swedenvikings

# PM2 logs (senaste 200 rader)
pm2 logs swedenvikings --lines 200

# App-specifika logs
tail -f /var/log/swedenvikings/pm2-error.log
tail -f /var/log/swedenvikings/pm2-out.log
```

## 🎮 Arma Reforger Server

### Installera Arma Server

Arma servern installeras via CMS admin panel eller manuellt:

```bash
/opt/steamcmd/steamcmd.sh +force_install_dir /opt/arma-reforger-server +login anonymous +app_update 1874900 validate +quit
```

### Kontrollera Arma Status

```bash
# Via CMS API
curl http://localhost:3001/api/server/status

# Manuellt
ps aux | grep Arma
```

## 📞 Support

- GitHub Issues: https://github.com/YOUR_USERNAME/swedenvikings.eu/issues
- Discord: [Din Discord]

## 📚 Mer Information

Se `CLAUDE.md` för fullständig dokumentation.
