# Sweden Vikings CMS - Claude CLI Init

## Projektöversikt

Detta är ett CMS för en Arma Reforger gaming community. Byggt med:
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Zustand, React Query, Socket.io-client
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, Socket.io
- **Autentisering**: Steam OpenID via Passport.js
- **Deployment**: Docker Desktop (PostgreSQL, Redis, pgAdmin, Mailhog)

## Projektstruktur

```
swedenvikings.eu/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React-komponenter
│   │   ├── hooks/          # Custom React hooks (useServer, useAuth, etc.)
│   │   ├── pages/          # Sidkomponenter
│   │   ├── services/       # API-tjänster
│   │   ├── store/          # Zustand stores
│   │   └── utils/          # Hjälpfunktioner
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Passport, etc.
│   │   ├── middleware/     # Auth, validation, rate limiting
│   │   ├── routes/         # API routes
│   │   ├── services/       # Tjänster (gameServer, etc.)
│   │   ├── socket/         # Socket.io setup
│   │   └── utils/          # Logger, Prisma, Redis
│   ├── prisma/
│   │   ├── schema.prisma   # Databasschema
│   │   └── seed.ts         # Seed-data
│   └── package.json
├── shared/                 # Delade typer mellan client/server
├── docker-compose.yml      # Docker-tjänster
└── package.json            # Root workspace
```

## Kommandon

```bash
# Starta utveckling (kör både frontend och backend)
npm run dev

# Databaskommandon
npm run db:push          # Synka Prisma schema till databas
npm run db:seed          # Seed databas med initial data
npm run db:studio        # Öppna Prisma Studio

# Docker
docker-compose up -d     # Starta PostgreSQL, Redis, pgAdmin, Mailhog
docker-compose down      # Stoppa Docker-tjänster
```

## Miljövariabler (.env)

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/swedenvikings"

# Redis
REDIS_URL="redis://localhost:6379"

# Session
SESSION_SECRET="your-session-secret"

# Steam API
STEAM_API_KEY="your-steam-api-key"

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Databasmodeller (Prisma)

Viktiga modeller:
- `User` - Användare (Steam-autentiserade)
- `Role` / `Permission` - Roller och behörigheter
- `News` / `Event` - Nyheter och events
- `Clan` / `ClanMember` - Clans
- `Ticket` / `TicketMessage` - Supportärenden
- `ServerConnection` - Arma Reforger serveranslutningar
- `ActivityLog` - Aktivitetslogg

## Server Management (Arma Reforger)

Hantering av Arma Reforger dedikerad server:
- **LocalExecutor** - Kör kommandon lokalt
- **SSHExecutor** - Kör kommandon via SSH på fjärrserver
- **SteamCMDService** - Installera/uppdatera server via SteamCMD
- **ArmaReforgerServer** - Hantera serverprocess (start/stop/restart)
- **GameServerQuery** - Fråga serverstatus (gamedig)
- **GameServerManager** - Orchestrerar allt ovan

Server config sparas i: `C:\arma-reforger-server\server.json`

## API Routes

```
/api/auth/*           - Steam autentisering
/api/users/*          - Användarhantering
/api/roles/*          - Roller och behörigheter
/api/news/*           - Nyheter
/api/events/*         - Events
/api/clans/*          - Clans
/api/tickets/*        - Supportärenden
/api/server/*         - Serverhantering
  - /connections      - Serveranslutningar
  - /status           - Serverstatus
  - /start            - Starta server
  - /stop             - Stoppa server
  - /restart          - Starta om server
  - /install          - Installera/uppdatera server
  - /config           - Serverkonfiguration
  - /logs             - Serverloggar (live)
  - /logs/dirs        - Lista loggmappar
  - /logs/files/:dir  - Lista loggfiler
  - /logs/file/:dir/:file - Läs loggfil
  - /mods             - Mod-hantering
  - /command          - RCON-kommandon
```

## Socket.io Events

```
server:status         - Serverstatus uppdatering
server:install-progress - Installationsframsteg
server:log            - Ny loggpost
server:player         - Spelaruppdatering
notification          - Användarnotifikation
```

## Frontend Routes

```
/                     - Startsida
/news                 - Nyheter
/events               - Events
/rules                - Regler
/clans                - Clans
/profile/:id          - Användarprofil
/settings             - Användarinställningar
/tickets              - Mina supportärenden
/admin                - Admin dashboard
/admin/users          - Användarhantering
/admin/roles          - Rollhantering
/admin/news           - Nyhetshantering
/admin/events         - Eventhantering
/admin/server         - Serverhantering (Status, Inställningar, Mods, Anslutningar, Konsol, Loggfiler)
/admin/logs           - Aktivitetsloggar
/admin/tickets        - Alla supportärenden
/admin/settings       - Webbplatsinställningar
```

## Kodstil

- TypeScript överallt
- Funktionella React-komponenter med hooks
- Tailwind CSS för styling
- Svenska för UI-texter
- Engelska för kod och kommentarer
- Prisma för databasaccess
- Zustand för global state
- React Query för server state

## Viktiga filer att känna till

- `client/src/pages/admin/Server.tsx` - Serverhantering UI
- `client/src/hooks/useServer.ts` - Server-relaterade hooks
- `server/src/services/gameServer/` - Serverhanteringslogik
- `server/src/routes/server.routes.ts` - Server API routes
- `server/prisma/schema.prisma` - Databasschema

## Tips för utveckling

1. Starta Docker först: `docker-compose up -d`
2. Kör `npm run dev` för att starta båda servrarna
3. Frontend: http://localhost:5173
4. Backend: http://localhost:3001
5. pgAdmin: http://localhost:5050 (admin@admin.com / admin)
6. Mailhog: http://localhost:8025

## Arma Reforger Server Paths (Windows)

- Server: `C:\arma-reforger-server\`
- SteamCMD: `C:\steamcmd\`
- Server config: `C:\arma-reforger-server\server.json`
- Loggar: `C:\arma-reforger-server\profile\logs\`

---

## Deployment till Ubuntu VPS (Native - No Docker)

Vi kör **allt direkt på Ubuntu** utan Docker i produktion:
- PostgreSQL 16 (native)
- Redis 7 (native)
- Node.js 20 LTS (native)
- PM2 för processhantering
- Nginx reverse proxy
- Arma Reforger server direkt på systemet

### Filer för deployment

```
.env.example.production         # Production miljövariabler mall
ecosystem.config.js             # PM2 process manager config
nginx/swedenvikings.conf        # Nginx reverse proxy
scripts/
  setup-server.sh               # Installera allt på Ubuntu (kör EN gång)
  deploy.sh                     # Deploy/uppdatera applikation
  backup.sh                     # Databas backup
  restore.sh                    # Databas restore
  logs.sh                       # Visa PM2 logs
  update-arma.sh                # Uppdatera Arma server
  swedenvikings.service         # Systemd service (backup till PM2)
```

### GitHub Secrets för CI/CD

Konfigurera dessa i GitHub repository settings:
- `VPS_HOST` - IP eller domän till VPS
- `VPS_USER` - `deploy`
- `VPS_SSH_KEY` - Privat SSH-nyckel
- `VPS_PORT` - `22`
- `DISCORD_WEBHOOK_ADMIN` - Discord webhook för deploy-notifieringar (optional)

### Quick Start Deployment

#### Steg 1: Initial Server Setup (EN GÅNG)

```bash
# Kör som root på ny Ubuntu 24.04 VPS
curl -O https://raw.githubusercontent.com/YOUR_USER/swedenvikings.eu/main/scripts/setup-server.sh
sudo bash setup-server.sh
```

Detta installerar:
- ✓ PostgreSQL 16
- ✓ Redis 7
- ✓ Node.js 20 LTS
- ✓ PM2 processhanterare
- ✓ Nginx web server
- ✓ Certbot för SSL
- ✓ SteamCMD för Arma Reforger

#### Steg 2: Deploy Application

```bash
# Logga in som deploy user
su - deploy

# Klona repo
cd /opt/swedenvikings
git clone https://github.com/YOUR_USER/swedenvikings.eu.git .

# Installera dependencies och bygg
npm install
npm run build

# Kopiera och konfigurera miljövariabler
cp .env.example.production .env.production
nano .env.production  # Fyll i:
  # - SESSION_SECRET (generera: openssl rand -base64 64)
  # - STEAM_API_KEY
  # - Database password
  # - Din domän

# Kör database migrations
cd server && npx prisma migrate deploy && cd ..

# Starta med PM2
pm2 start ecosystem.config.js --env production
pm2 save
```

#### Steg 3: Konfigurera Nginx & SSL

```bash
# Kopiera Nginx config
sudo cp nginx/swedenvikings.conf /etc/nginx/sites-available/swedenvikings

# Redigera domännamn
sudo nano /etc/nginx/sites-available/swedenvikings
# Ersätt 'yourdomain.com' med din domän

# Aktivera site
sudo ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Skaffa SSL-certifikat
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Steg 4: Verifiera

```bash
# Kolla PM2 status
pm2 status
pm2 logs swedenvikings

# Kolla Nginx
sudo systemctl status nginx

# Kolla PostgreSQL
sudo systemctl status postgresql

# Kolla Redis
sudo systemctl status redis-server

# Test hemsida
curl https://yourdomain.com
```

### Hantera Applikationen

```bash
# Starta
pm2 start ecosystem.config.js --env production

# Stoppa
pm2 stop swedenvikings

# Starta om
pm2 restart swedenvikings

# Reload (zero-downtime)
pm2 reload swedenvikings

# Logs (live)
pm2 logs swedenvikings

# Logs (senaste 100 rader)
pm2 logs swedenvikings --lines 100

# Monitoring
pm2 monit

# Status
pm2 status

# Spara PM2 config (körs vid boot)
pm2 save
```

### Uppdatera Applikationen

```bash
# Automatisk deploy script
cd /opt/swedenvikings
bash scripts/deploy.sh

# Eller manuellt:
git pull origin main
npm install
npm run build
cd server && npx prisma migrate deploy && cd ..
pm2 reload ecosystem.config.js --env production
pm2 save
```

### Linux server paths

```
/opt/swedenvikings/           # CMS projekt
/opt/arma-reforger-server/    # Arma server
/opt/steamcmd/                # SteamCMD
/var/log/swedenvikings/       # Applikationsloggar
```

### Systemd Service (Alternativ till PM2)

Om du föredrar systemd istället för PM2:

```bash
# Kopiera service file
sudo cp scripts/swedenvikings.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Aktivera service
sudo systemctl enable swedenvikings

# Starta service
sudo systemctl start swedenvikings

# Status
sudo systemctl status swedenvikings

# Logs
sudo journalctl -u swedenvikings -f
```

### Brandväggsregler (UFW)

```bash
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 2001/udp    # Arma Reforger game
ufw allow 17777/udp   # Arma Reforger query
```

### VPS Rekommenderade specs

- **CPU:** 4+ cores (Arma är CPU-intensiv)
- **RAM:** 16GB+ (8GB Arma, 4GB CMS/DB, 2GB system, 2GB buffer)
- **Disk:** 50GB+ SSD (20GB OS, 15GB Arma, 10GB CMS, 5GB logs/backups)
- **OS:** Ubuntu 24.04 LTS
- **Network:** 100 Mbps+ (för multiplayer)

### Monitoring & Troubleshooting

```bash
# PM2 Monitoring
pm2 monit                    # Live monitoring dashboard
pm2 logs --lines 200         # Senaste loggarna
pm2 restart all              # Restart alla processer

# System Resources
htop                         # CPU/RAM usage
df -h                        # Disk usage
free -h                      # Memory usage

# Nginx
sudo nginx -t                # Test config
sudo systemctl status nginx
sudo tail -f /var/log/nginx/swedenvikings_error.log

# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -d swedenvikings -c "SELECT version();"

# Redis
redis-cli ping
redis-cli info stats

# Arma Reforger Server
ps aux | grep Arma           # Kolla om processen körs
```

### Backup & Restore

```bash
# Backup databas
bash scripts/backup.sh

# Restore databas
bash scripts/restore.sh backup_filename.sql

# Manuell backup
pg_dump -U swedenvikings swedenvikings > backup_$(date +%Y%m%d).sql

# Automatisk backup (cron)
# Lägg till i crontab: crontab -e
0 2 * * * cd /opt/swedenvikings && bash scripts/backup.sh
```

