# Quick Start Guide - Two VPS Setup

Detta är en **snabb** guide för att sätta upp Sweden Vikings CMS på två separata VPS-servrar. För detaljerad information, se [TWO-VPS-DEPLOYMENT.md](./TWO-VPS-DEPLOYMENT.md).

## Förutsättningar

- **VPS 1 (Web Server):** Ubuntu 24.04, 2 CPU, 4GB RAM, 50GB NVMe
- **VPS 2 (Game Server):** Ubuntu 24.04, 4+ CPU, 16GB RAM, 50GB+ SSD
- Domännamn pekat till VPS 1 (A-record)
- Steam API Key: https://steamcommunity.com/dev/apikey
- Root SSH-access till båda servrarna

---

## Steg 1: Setup Game Server (VPS 2)

Logga in på **Game Server** som root:

```bash
# Ladda ner setup-script
wget https://raw.githubusercontent.com/YOUR_USERNAME/swedenvikings.eu/main/scripts/setup-gameserver.sh

# Kör script
sudo bash setup-gameserver.sh
```

Scriptet kommer:
1. Installera SteamCMD och Arma Reforger
2. Skapa `armaserver` användare
3. Fråga efter SSH public key från Web Server (lämna tom för tillfället)
4. Fråga efter Web Server IP (för brandvägg)
5. Konfigurera systemd service för Arma

**Efter installation:**
1. Kopiera IP-adressen för Game Server (behövs i nästa steg)
2. Lämna terminalen öppen (vi behöver lägga till SSH-nyckel senare)

---

## Steg 2: Setup Web Server (VPS 1)

Logga in på **Web Server** som root:

```bash
# Ladda ner setup-script
wget https://raw.githubusercontent.com/YOUR_USERNAME/swedenvikings.eu/main/scripts/setup-webserver.sh

# Kör script
sudo bash setup-webserver.sh
```

Scriptet kommer:
1. Installera PostgreSQL, Redis, Node.js, Nginx
2. Skapa `deploy` användare
3. Fråga efter databas-lösenord
4. Generera SSH-nyckel för Game Server
5. Visa publika nyckeln (kopiera denna!)

**Efter installation:**
```bash
# Visa SSH public key
cat /home/deploy/.ssh/gameserver_key.pub
```

Kopiera hela output (börjar med `ssh-ed25519 ...`)

---

## Steg 3: Koppla servrarna (SSH)

Gå tillbaka till **Game Server**-terminalen:

```bash
# Öppna authorized_keys
sudo nano /home/armaserver/.ssh/authorized_keys

# Klistra in SSH public key från Web Server (från Steg 2)
# Spara: Ctrl+O, Enter, Ctrl+X
```

På **Web Server**, testa anslutningen:

```bash
# Logga in som deploy
su - deploy

# Redigera SSH config
nano ~/.ssh/config
# Ersätt "GAME_SERVER_IP" med faktisk IP från Game Server

# Testa SSH-anslutning
ssh gameserver

# Om det fungerar, kommer du loggas in utan lösenord!
# Testa köra ett kommando:
systemctl status arma-reforger

# Logga ut
exit
```

---

## Steg 4: Deploy CMS (Web Server)

På **Web Server**, logga in som `deploy`:

```bash
su - deploy
cd /opt/swedenvikings

# Klona repository
git clone https://github.com/YOUR_USERNAME/swedenvikings.eu.git .

# Skapa .env.production
cp .env.example.production .env.production
nano .env.production
```

**Fyll i dessa värden:**

```env
# Database (använd lösenordet från Steg 2)
DATABASE_URL="postgresql://swedenvikings:DITT_DB_LÖSENORD@localhost:5432/swedenvikings"

# Session Secret (generera)
SESSION_SECRET="<kör: openssl rand -base64 64>"

# Steam API
STEAM_API_KEY="din_steam_api_key"
STEAM_REALM=https://yourdomain.com
STEAM_RETURN_URL=https://yourdomain.com/api/auth/steam/callback

# Domain
CLIENT_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Game Server SSH
GAME_SERVER_HOST=GAME_SERVER_IP
GAME_SERVER_PORT=22
GAME_SERVER_USER=armaserver
GAME_SERVER_SSH_KEY=/home/deploy/.ssh/gameserver_key
GAME_SERVER_INSTALL_PATH=/opt/arma-reforger-server
GAME_SERVER_STEAMCMD_PATH=/opt/steamcmd
SERVER_MANAGEMENT_MODE=ssh
```

**Bygg och starta:**

```bash
# Installera dependencies
npm install

# Bygg frontend och backend
npm run build

# Kör migrations
cd server && npx prisma migrate deploy && cd ..

# (Optional) Seed initial data
cd server && npx prisma db seed && cd ..

# Starta med PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Kolla status
pm2 status
pm2 logs swedenvikings
```

---

## Steg 5: Konfigurera Nginx och SSL (Web Server)

```bash
# Kopiera Nginx config
sudo cp nginx/swedenvikings.conf /etc/nginx/sites-available/swedenvikings

# Redigera config
sudo nano /etc/nginx/sites-available/swedenvikings
# Ersätt alla "yourdomain.com" med din faktiska domän

# Aktivera site
sudo ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testa config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Skaffa SSL-certifikat
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Steg 6: Starta Arma Server (Game Server)

På **Game Server**:

```bash
# Redigera server config
sudo nano /opt/arma-reforger-server/server.json

# Ändra:
# - "adminPassword": "ditt_starka_lösenord"
# - "passwordAdmin": "ditt_starka_lösenord"
# - "name": "Ditt servernamn"
# Spara: Ctrl+O, Enter, Ctrl+X

# Starta servern
sudo systemctl start arma-reforger

# Kolla status
sudo systemctl status arma-reforger

# Följ logs
sudo journalctl -u arma-reforger -f
```

---

## Steg 7: Verifiera allt fungerar

### Testa SSH-kommunikation

På **Web Server**:
```bash
ssh gameserver "systemctl status arma-reforger"
ssh gameserver "ls -la /opt/arma-reforger-server"
```

### Testa hemsidan

1. Öppna `https://yourdomain.com` i browser
2. Logga in via Steam
3. Gå till `/admin/server`
4. Du borde se serverstatus!

### Testa serverhantering från CMS

1. I Admin Panel → Server
2. Tryck "Status" - borde visa server online/offline
3. Tryck "Stoppa Server" - servern borde stängas av
4. Tryck "Starta Server" - servern borde starta igen

---

## Felsökning

### SSH fungerar inte

```bash
# På Web Server
ssh -vvv -i /home/deploy/.ssh/gameserver_key armaserver@GAME_SERVER_IP

# På Game Server
sudo tail -f /var/log/auth.log
```

### CMS kan inte kontakta Game Server

```bash
# På Web Server, kolla PM2 logs
pm2 logs swedenvikings --lines 100

# Kolla .env.production
cat /opt/swedenvikings/.env.production | grep GAME_SERVER
```

### Arma servern startar inte

```bash
# På Game Server
sudo journalctl -u arma-reforger -n 100

# Kolla server.json syntax
cat /opt/arma-reforger-server/server.json | jq .
```

---

## Nästa steg

- [ ] Konfigurera automatiska backups (cron)
- [ ] Sätt upp Discord webhooks för notifieringar
- [ ] Installera mods på Arma-servern
- [ ] Konfigurera SMTP för email-notifieringar
- [ ] Sätt upp monitoring (Netdata, Grafana, etc.)

---

## Användbara kommandon

### Web Server

```bash
# PM2
pm2 status
pm2 logs swedenvikings
pm2 restart swedenvikings
pm2 monit

# Database backup
/home/deploy/backup-db.sh

# System status
htop
df -h
free -h
```

### Game Server

```bash
# Arma Server
sudo systemctl start arma-reforger
sudo systemctl stop arma-reforger
sudo systemctl restart arma-reforger
sudo systemctl status arma-reforger

# Logs
sudo journalctl -u arma-reforger -f

# Update Arma
sudo /opt/update-arma.sh
```

---

## Support

Om du stöter på problem, kolla:
1. [Detaljerad deployment-guide](./TWO-VPS-DEPLOYMENT.md)
2. PM2 logs: `pm2 logs swedenvikings`
3. Nginx logs: `sudo tail -f /var/log/nginx/swedenvikings_error.log`
4. Arma logs: `sudo journalctl -u arma-reforger -f`

**Gratulerar! Du har nu ett fullt fungerande CMS med två-server setup!** 🎉
