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

## Deployment - Två VPS Setup (Rekommenderad)

Vi kör **två separata Ubuntu-servrar** för optimal prestanda:

### VPS 1: Web Server (CMS)
**Specs:** 2 CPU, 4GB RAM, 50GB NVMe
- PostgreSQL 16 (databas)
- Redis 7 (sessions/cache)
- Node.js 20 LTS (CMS)
- PM2 (processhantering)
- Nginx (reverse proxy + SSL)

### VPS 2: Game Server (Arma Reforger)
**Specs:** 4+ CPU, 16GB+ RAM, 50GB+ SSD
- Arma Reforger Dedicated Server
- SteamCMD (uppdateringar)
- SSH Server (remote management)

### SSH-kommunikation
Web Server kontrollerar Game Server via SSH med nyckelbaserad autentisering:
- Start/stop/restart Arma-servern
- Uppdatera via SteamCMD
- Läsa serverloggar
- Hantera mods och konfiguration

### Deployment-filer

```
.env.example.production         # Production miljövariabler
ecosystem.config.js             # PM2 process manager config
nginx/swedenvikings.conf        # Nginx reverse proxy

scripts/
  setup-webserver.sh            # Setup Web Server (VPS 1) - Kör EN gång
  setup-gameserver.sh           # Setup Game Server (VPS 2) - Kör EN gång
  deploy.sh                     # Deploy/uppdatera CMS
  backup.sh                     # Databas backup
  restore.sh                    # Databas restore
  logs.sh                       # Visa PM2 logs

docs/
  TWO-VPS-DEPLOYMENT.md         # Detaljerad deployment-guide
  QUICK-START-TWO-VPS.md        # Snabb setup-guide
```

### GitHub Secrets för CI/CD

Konfigurera dessa i GitHub repository settings:
- `WEBSERVER_HOST` - IP eller domän till Web Server
- `WEBSERVER_USER` - `deploy`
- `WEBSERVER_SSH_KEY` - Privat SSH-nyckel för Web Server
- `WEBSERVER_PORT` - `22`
- `DISCORD_WEBHOOK_ADMIN` - Discord webhook för deploy-notifieringar (optional)

### Quick Start Deployment

**Se:** [docs/QUICK-START-TWO-VPS.md](docs/QUICK-START-TWO-VPS.md) för steg-för-steg guide

**Sammanfattning:**

#### Steg 1: Setup Game Server (VPS 2)
```bash
wget https://raw.githubusercontent.com/YOUR_USER/swedenvikings.eu/main/scripts/setup-gameserver.sh
sudo bash setup-gameserver.sh
```

#### Steg 2: Setup Web Server (VPS 1)
```bash
wget https://raw.githubusercontent.com/YOUR_USER/swedenvikings.eu/main/scripts/setup-webserver.sh
sudo bash setup-webserver.sh
```

#### Steg 3: Koppla SSH mellan servrarna
- Kopiera SSH public key från Web Server
- Lägg till i Game Server's `/home/armaserver/.ssh/authorized_keys`
- Testa: `ssh gameserver`

#### Steg 4: Deploy CMS (på Web Server)
```bash
su - deploy
cd /opt/swedenvikings
git clone https://github.com/YOUR_USER/swedenvikings.eu.git .
cp .env.example.production .env.production
nano .env.production  # Fyll i alla värden!
npm install && npm run build
cd server && npx prisma migrate deploy && cd ..
pm2 start ecosystem.config.js --env production
pm2 save
```

#### Steg 5: Konfigurera Nginx & SSL
```bash
sudo cp nginx/swedenvikings.conf /etc/nginx/sites-available/swedenvikings
sudo nano /etc/nginx/sites-available/swedenvikings  # Ändra domän
sudo ln -s /etc/nginx/sites-available/swedenvikings /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### Steg 6: Starta Arma Server (på Game Server)
```bash
sudo nano /opt/arma-reforger-server/server.json  # Ändra lösenord
sudo systemctl start arma-reforger
sudo systemctl status arma-reforger
```

### Hantera Applikationen

**Web Server (CMS):**
```bash
pm2 status                    # Status
pm2 logs swedenvikings        # Logs (live)
pm2 restart swedenvikings     # Restart
pm2 monit                     # Monitoring
```

**Game Server (Arma):**
```bash
sudo systemctl status arma-reforger        # Status
sudo systemctl restart arma-reforger       # Restart
sudo journalctl -u arma-reforger -f        # Logs
sudo /opt/update-arma.sh                   # Update
```

### Uppdatera CMS

```bash
cd /opt/swedenvikings
bash scripts/deploy.sh
```

### Server Paths

**Web Server:**
```
/opt/swedenvikings/           # CMS projekt
/var/log/swedenvikings/       # Loggar
/home/deploy/backups/         # Databas backups
/home/deploy/.ssh/            # SSH-nycklar
```

**Game Server:**
```
/opt/arma-reforger-server/    # Arma server
/opt/steamcmd/                # SteamCMD
/home/armaserver/.ssh/        # SSH authorized keys
```

### Brandväggsregler (UFW)

**Web Server:**
```bash
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
```

**Game Server:**
```bash
ufw allow from WEB_SERVER_IP to any port 22 proto tcp  # SSH från Web Server
ufw allow 2001/udp    # Arma Reforger game
ufw allow 17777/udp   # Arma Reforger query
```

### Rekommenderade VPS Specs

**Web Server (VPS 1):**
- **CPU:** 2 cores
- **RAM:** 4GB
- **Disk:** 50GB NVMe
- **OS:** Ubuntu 24.04 LTS
- **Kostnad:** ~$12-20/mån

**Game Server (VPS 2):**
- **CPU:** 4-6 cores (Arma är CPU-intensiv)
- **RAM:** 16GB+ (8-12GB för Arma + OS)
- **Disk:** 50GB+ SSD
- **OS:** Ubuntu 24.04 LTS
- **Network:** 100 Mbps+ (för multiplayer)
- **Kostnad:** ~$40-80/mån

**Total kostnad:** ~$52-100/mån

### Monitoring & Troubleshooting

**Web Server:**
```bash
pm2 monit                    # PM2 dashboard
pm2 logs --lines 200         # CMS logs
htop                         # System resources
df -h                        # Disk usage
sudo tail -f /var/log/nginx/swedenvikings_error.log  # Nginx errors
redis-cli ping               # Redis status
```

**Game Server:**
```bash
sudo systemctl status arma-reforger     # Server status
sudo journalctl -u arma-reforger -f     # Server logs
htop                                     # System resources
ps aux | grep Arma                       # Server process
```

**Test SSH-kommunikation:**
```bash
# På Web Server
ssh gameserver "systemctl status arma-reforger"
ssh gameserver "ls -la /opt/arma-reforger-server"
```

### Backup & Restore (Web Server)

```bash
# Automatisk backup (redan setup via setup-webserver.sh)
/home/deploy/backup-db.sh

# Restore
bash scripts/restore.sh backup_filename.sql

# Setup automatisk backup (cron)
crontab -e
# Lägg till: 0 2 * * * /home/deploy/backup-db.sh >> /home/deploy/backup.log 2>&1
```

