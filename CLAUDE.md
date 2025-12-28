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

