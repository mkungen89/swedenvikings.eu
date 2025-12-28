# Sweden Vikings CMS

En modern CMS för Arma Reforger gaming community, byggd med React, Node.js och PostgreSQL.

## 🎮 Funktioner

### Användare
- Steam-autentisering
- Profilhantering (avatar, banner, bio)
- Rollbaserad behörighetskontroll (RBAC)
- Notifikationer i realtid
- Clan-system

### Admin Panel
- Dashboard med statistik
- Användarhantering (roller, ban)
- Nyhets- och eventhantering
- Serverhantering (start/stop/restart)
- Mod-hantering
- Ticket-system
- Aktivitetsloggar
- Sidoinställningar

### Content
- Nyhetsartiklar med kategorier
- Event-system med anmälan
- Regelsamling
- Bildgalleri
- Custom pages

### Server Integration
- Realtidsstatus via WebSocket
- Spelarlista med kick-funktion
- Serverkonsol
- Mod-hantering
- Loggövervakning

## 🛠 Teknikstack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Node.js, Express, TypeScript, Prisma ORM
- **Database:** PostgreSQL
- **Cache/Sessions:** Redis
- **Autentisering:** Passport.js med Steam OpenID
- **Realtid:** Socket.io

## 📦 Installation

### Förutsättningar

- Node.js 18+
- Docker Desktop
- Git

### 1. Klona projektet

```bash
git clone https://github.com/yourusername/swedenvikings.eu.git
cd swedenvikings.eu
```

### 2. Konfigurera miljövariabler

Byt namn på `env.example.txt` till `.env` och fyll i dina värden:

```env
# Viktiga att ändra:
SESSION_SECRET=din-super-hemliga-nyckel-här
STEAM_API_KEY=din-steam-api-nyckel
```

Hämta din Steam API-nyckel här: https://steamcommunity.com/dev/apikey

### 3. Starta Docker-tjänster

```bash
docker-compose up -d
```

Detta startar:
- PostgreSQL (port 5432)
- Redis (port 6379)
- pgAdmin (port 5050)
- Mailhog (port 8025)

### 4. Installera beroenden

```bash
npm install
```

### 5. Initiera databasen

```bash
npm run db:push
npm run db:seed
```

### 6. Starta utvecklingsservrar

```bash
npm run dev
```

Frontend körs på: http://localhost:5173
Backend körs på: http://localhost:3001
pgAdmin: http://localhost:5050 (admin@swedenvikings.eu / admin123)
Mailhog: http://localhost:8025

## 🚀 Produktion

### Bygg projektet

```bash
npm run build
```

### Starta i produktionsläge

```bash
npm run start
```

### SSL/HTTPS

För SSL, använd en reverse proxy som Nginx eller Caddy framför applikationen.

Exempel Nginx-konfiguration:

```nginx
server {
    listen 443 ssl http2;
    server_name swedenvikings.eu;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📁 Projektstruktur

```
swedenvikings.eu/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI-komponenter
│   │   ├── pages/          # Sidor
│   │   ├── store/          # Zustand stores
│   │   ├── services/       # API-klient
│   │   └── utils/          # Hjälpfunktioner
│   └── public/             # Statiska filer
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/         # API-routes
│   │   ├── middleware/     # Express middleware
│   │   ├── config/         # Konfiguration
│   │   ├── socket/         # Socket.io
│   │   └── utils/          # Hjälpfunktioner
│   └── prisma/             # Databasschema
├── shared/                 # Delade typer
├── uploads/                # Uppladdade filer
└── docker-compose.yml      # Docker-konfiguration
```

## 🔧 Kommandon

| Kommando | Beskrivning |
|----------|-------------|
| `npm run dev` | Startar utvecklingsservrar |
| `npm run build` | Bygger för produktion |
| `npm run start` | Startar produktionsserver |
| `npm run docker:up` | Startar Docker-tjänster |
| `npm run docker:down` | Stoppar Docker-tjänster |
| `npm run db:push` | Synkar databasschema |
| `npm run db:seed` | Seedar databasen |
| `npm run db:studio` | Öppnar Prisma Studio |

## 🔐 Standardroller

Efter seeding skapas följande roller:

| Roll | Behörigheter |
|------|--------------|
| Admin | Alla behörigheter |
| Moderator | Moderation, tickets, server-visning |
| Member | Grundläggande (standard för nya användare) |

## 📝 API-dokumentation

API:et följer REST-konventioner och returnerar JSON.

### Autentisering

```
GET  /api/auth/steam          # Starta Steam-inloggning
GET  /api/auth/me             # Hämta inloggad användare
POST /api/auth/logout         # Logga ut
```

### Användare

```
GET    /api/users/:id         # Hämta användarprofil
PATCH  /api/users/me          # Uppdatera egen profil
PATCH  /api/users/me/settings # Uppdatera inställningar
```

### Admin

```
GET    /api/admin/dashboard   # Dashboard-statistik
GET    /api/admin/users       # Lista användare
PATCH  /api/admin/users/:id   # Redigera användare
POST   /api/admin/users/:id/ban    # Banna användare
POST   /api/admin/users/:id/unban  # Ta bort ban
```

## 🤝 Bidra

1. Skapa en issue för diskussion
2. Forka projektet
3. Skapa en feature branch
4. Gör dina ändringar
5. Skicka en pull request

## 📄 Licens

MIT License

## 🙏 Credits

Inspirerad av [Flute CMS](https://flute-cms.com)

---

Made with ❤️ by Sweden Vikings

