# Sweden Vikings CMS - Deployment Documentation

Detta är deployment-dokumentationen för Sweden Vikings CMS. Välj rätt guide baserat på din setup.

## Arkitektur

Vi rekommenderar en **två-VPS setup** för optimal prestanda:

### VPS 1: Web Server (CMS)
- **Specs:** 2 CPU, 4GB RAM, 50GB NVMe (~$12-20/mån)
- **Tjänster:** Node.js CMS, PostgreSQL, Redis, Nginx
- **Kostnad:** Låg - webbapplikationer kräver mindre resurser

### VPS 2: Game Server (Arma Reforger)
- **Specs:** 4-6 CPU, 16GB RAM, 50GB SSD (~$40-80/mån)
- **Tjänster:** Arma Reforger Dedicated Server, SteamCMD
- **Kostnad:** Högre - spelet är CPU och RAM-intensivt

### SSH-kommunikation
Web Server kontrollerar Game Server via säker SSH med nyckelbaserad autentisering:
- ✅ Start/stop/restart Arma-servern
- ✅ Uppdatera via SteamCMD
- ✅ Läsa serverloggar i realtid
- ✅ Hantera mods och konfiguration
- ✅ Ingen exponerad API - endast SSH port 22

**Total kostnad:** ~$52-100/mån beroende på provider

---

## Deployment Guides

### 🚀 Quick Start (Rekommenderad för nybörjare)
**[QUICK-START-TWO-VPS.md](./QUICK-START-TWO-VPS.md)**

Snabb, steg-för-steg guide för att sätta upp hela systemet på 30 minuter:
1. Setup Game Server (VPS 2)
2. Setup Web Server (VPS 1)
3. Koppla SSH mellan servrarna
4. Deploy CMS
5. Konfigurera Nginx & SSL
6. Starta Arma Server

**Bäst för:** Första gången du sätter upp systemet.

---

### 📚 Detaljerad Guide
**[TWO-VPS-DEPLOYMENT.md](./TWO-VPS-DEPLOYMENT.md)**

Omfattande guide med alla detaljer:
- Arkitekturdiagram
- Säkerhetsguide (SSH, UFW, certifikat)
- Steg-för-steg installation
- Monitoring och troubleshooting
- Backup och restore
- Performance-tuning

**Bäst för:**
- När du behöver förstå varje steg
- Troubleshooting
- Avancerad konfiguration
- Säkerhetsöversikt

---

## Setup Scripts

### Web Server Setup
```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/swedenvikings.eu/main/scripts/setup-webserver.sh
sudo bash setup-webserver.sh
```

**Installerar:**
- PostgreSQL 16
- Redis 7
- Node.js 20 LTS
- PM2
- Nginx
- Certbot (SSL)
- Skapar deploy-användare
- Genererar SSH-nycklar för Game Server

---

### Game Server Setup
```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/swedenvikings.eu/main/scripts/setup-gameserver.sh
sudo bash setup-gameserver.sh
```

**Installerar:**
- SteamCMD
- Arma Reforger Dedicated Server
- Systemd service för Arma
- SSH-konfiguration
- Brandvägg (UFW)
- Skapar armaserver-användare

---

## SSH Setup mellan servrar

### På Web Server
```bash
# Visa SSH public key
cat /home/deploy/.ssh/gameserver_key.pub
```

### På Game Server
```bash
# Lägg till public key
sudo nano /home/armaserver/.ssh/authorized_keys
# Klistra in nyckeln, spara (Ctrl+O, Enter, Ctrl+X)
```

### Testa anslutning (från Web Server)
```bash
ssh gameserver
systemctl status arma-reforger
exit
```

---

## Environment Configuration

Kopiera och konfigurera miljövariabler:

```bash
cd /opt/swedenvikings
cp .env.example.production .env.production
nano .env.production
```

**Viktiga variabler:**
```env
# Database
DATABASE_URL="postgresql://swedenvikings:PASSWORD@localhost:5432/swedenvikings"

# Session (generera: openssl rand -base64 64)
SESSION_SECRET="..."

# Steam
STEAM_API_KEY="..."

# Domain
CLIENT_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Game Server SSH
GAME_SERVER_HOST=GAME_SERVER_IP
GAME_SERVER_USER=armaserver
GAME_SERVER_SSH_KEY=/home/deploy/.ssh/gameserver_key
SERVER_MANAGEMENT_MODE=ssh
```

---

## Vanliga kommandon

### Web Server (CMS)

```bash
# PM2
pm2 status                    # Status
pm2 logs swedenvikings        # Logs (live)
pm2 restart swedenvikings     # Restart
pm2 monit                     # Monitoring

# Deploy uppdatering
cd /opt/swedenvikings
bash scripts/deploy.sh

# Backup databas
/home/deploy/backup-db.sh

# System
htop                          # Resources
df -h                         # Disk usage
```

### Game Server (Arma)

```bash
# Arma Server
sudo systemctl start arma-reforger
sudo systemctl stop arma-reforger
sudo systemctl restart arma-reforger
sudo systemctl status arma-reforger

# Logs
sudo journalctl -u arma-reforger -f

# Update server
sudo /opt/update-arma.sh

# System
htop
ps aux | grep Arma
```

### Test SSH från Web Server

```bash
ssh gameserver "systemctl status arma-reforger"
ssh gameserver "ls -la /opt/arma-reforger-server"
ssh gameserver "cat /opt/arma-reforger-server/server.json"
```

---

## Troubleshooting

### SSH-anslutning fungerar inte

**På Web Server:**
```bash
# Test verbose
ssh -vvv -i /home/deploy/.ssh/gameserver_key armaserver@GAME_SERVER_IP

# Kolla permissions
ls -la /home/deploy/.ssh/gameserver_key  # Should be 600
```

**På Game Server:**
```bash
# Kolla auth log
sudo tail -f /var/log/auth.log

# Kolla permissions
ls -la /home/armaserver/.ssh/authorized_keys  # Should be 600
```

---

### CMS kan inte nå Game Server

```bash
# Kolla environment
cat /opt/swedenvikings/.env.production | grep GAME_SERVER

# Kolla PM2 logs
pm2 logs swedenvikings --lines 100

# Test manuell SSH
ssh gameserver "echo test"
```

---

### Arma Server startar inte

```bash
# Kolla logs
sudo journalctl -u arma-reforger -n 100

# Test manuell start
cd /opt/arma-reforger-server
./ArmaReforgerServer -config server.json -profile profile -logLevel normal

# Kolla config syntax
cat /opt/arma-reforger-server/server.json | jq .
```

---

## Säkerhet Checklist

### Web Server
- [ ] UFW aktiverad (endast 22, 80, 443)
- [ ] SSH root login disabled
- [ ] SSH password auth disabled
- [ ] SSL/TLS certifikat aktivt (Let's Encrypt)
- [ ] Databas lösenord ändrat från default
- [ ] SESSION_SECRET randomiserad
- [ ] Fail2ban installerad (optional)

### Game Server
- [ ] UFW aktiverad (SSH endast från Web Server IP)
- [ ] SSH root login disabled
- [ ] SSH password auth disabled
- [ ] Endast key-based SSH auth
- [ ] Sudo begränsad för armaserver
- [ ] Arma admin lösenord ändrat

### SSH-kommunikation
- [ ] ED25519 nycklar genererade
- [ ] Privat nyckel permissions 600
- [ ] Public key i authorized_keys
- [ ] SSH config korrekt
- [ ] Test-anslutning fungerar

---

## Monitoring (Optional)

### Netdata (Real-time monitoring)

**På båda servrarna:**
```bash
bash <(curl -Ss https://get.netdata.cloud/kickstart.sh)
```

**Access:**
- Web Server: `https://yourdomain.com:19999`
- Game Server: `http://GAME_SERVER_IP:19999`

### Grafana + Prometheus (Avancerad)

Se [TWO-VPS-DEPLOYMENT.md](./TWO-VPS-DEPLOYMENT.md) för setup.

---

## Backup Strategy

### Automatisk databas backup (Web Server)

Setup via cron (redan inkluderad i setup-webserver.sh):

```bash
crontab -e
# Lägg till:
0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/backup.log 2>&1
```

Backups sparas i: `/home/deploy/backups/`

Retention: 7 dagar (konfigureras i backup-script)

### Restore databas

```bash
cd /opt/swedenvikings
bash scripts/restore.sh /home/deploy/backups/backup_YYYYMMDD_HHMMSS.sql
```

---

## Kostnadsuppskattning

### Rekommenderade providers

**Budget-vänliga:**
- **Hetzner:** Bäst pris/prestanda (~€4.5 för Web, ~€30 för Game)
- **Contabo:** Billigast men blandad kvalitet

**Premium:**
- **DigitalOcean:** Pålitlig men dyrare
- **Linode/Akamai:** Bra nätverk
- **OVH:** Specialiserade på gaming

### Månadskostnad

| Server | Specs | Hetzner | DigitalOcean | OVH |
|--------|-------|---------|--------------|-----|
| Web Server | 2 CPU, 4GB | €4.5 | $24 | €8 |
| Game Server | 4 CPU, 16GB | €30 | $84 | $48 |
| **Total** | | **€34.5** | **$108** | **€56** |

---

## Support & Bidrag

- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/swedenvikings.eu/issues)
- **Dokumentation:** [docs/](.)
- **Discord:** [Sweden Vikings Discord](#)

---

## Licens

Se [LICENSE](../LICENSE) för detaljer.

---

**Lycka till med deploymentet! 🚀**

Om du följer Quick Start-guiden borde du ha ett fungerande system inom 30-45 minuter.
