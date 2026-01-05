# Cross-Platform Support Implementation Guide

## Översikt

Sweden Vikings CMS har nu stöd för spelare från **alla tre Arma Reforger-plattformar**:
- **PC (Steam)** - Steam ID 64
- **Xbox Series X|S** - Xbox User ID (XUID)
- **PlayStation 5** - PSN Account ID

Detta gör att:
1. Konsol-spelare kan länka sina gaming-konton till hemsidan
2. Statistik samlas från alla plattformar
3. Spelare kan logga in med Discord (eller Steam) på hemsidan
4. Arma Reforger-modden skickar data oavsett plattform

---

## Backend Implementation (Klart ✅)

### 1. Databasschema (Prisma)

#### Nya modeller:

**PlatformAccount**
```prisma
model PlatformAccount {
  id         String   @id @default(uuid())
  userId     String
  platform   String   // "steam", "xbox", "psn"
  platformId String   // Steam ID 64, XUID, or PSN Account ID

  platformUsername String?
  platformAvatar   String?

  isPrimary  Boolean  @default(false)
  linkedAt   DateTime @default(now())

  @@unique([platform, platformId])
  @@unique([userId, platform])
}
```

**LinkingCode**
```prisma
model LinkingCode {
  id         String   @id @default(uuid())
  code       String   @unique  // "VIKING-A7X9"
  platform   String   // "xbox", "psn", "steam"
  platformId String   // XUID, PSN Account ID, or Steam ID
  platformUsername String?

  userId     String?  // Null until linked
  expiresAt  DateTime // 24 hours validity
  usedAt     DateTime?
}
```

**PlayerStats** (uppdaterad)
```prisma
model PlayerStats {
  id                String   @id @default(uuid())
  userId            String?  @unique // Optional - linked when user links account

  // Cross-platform identity
  platform          String   @default("steam")
  platformId        String   @default("")
  platformUsername  String?

  // ... rest of stats ...

  @@unique([platform, platformId])
}
```

**User** (uppdaterad)
```prisma
model User {
  id        String  @id @default(uuid())
  steamId   String? @unique // Made optional
  discordId String? @unique // New Discord OAuth
  // ...
  platformAccounts PlatformAccount[]
}
```

### 2. Autentisering

#### Discord OAuth (Passport.js)
Filen: `server/src/config/passport.ts`

Nya miljövariabler:
```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_CALLBACK_URL=https://yourdomain.com/api/auth/discord/callback
```

#### Auth Routes
- `GET /api/auth/discord` - Starta Discord OAuth
- `GET /api/auth/discord/callback` - Discord callback
- `GET /api/auth/steam` - Starta Steam OAuth (existing)
- `GET /api/auth/steam/callback` - Steam callback (existing)
- `GET /api/auth/me` - Hämta inloggad användare (inkl. platformAccounts)

### 3. Platform Linking API

Filen: `server/src/routes/platform.routes.ts`

#### Endpoints:

**POST /api/platform/generate-code**
- Anropas av Arma Reforger-modden
- Genererar länkningskod för spelare
- Kräver `SERVER_API_KEY` autentisering

Request:
```json
{
  "serverApiKey": "YOUR_SERVER_API_KEY",
  "platform": "xbox",
  "platformId": "2535428746582745",
  "platformUsername": "XboxGamer123"
}
```

Response:
```json
{
  "code": "VIKING-A7X9",
  "expiresAt": "2024-01-16T12:00:00Z"
}
```

**POST /api/platform/link-code**
- Anropas av användare på hemsidan
- Länkar gaming-konto till webbkonto
- Kräver autentisering (Discord/Steam login)

Request:
```json
{
  "code": "VIKING-A7X9"
}
```

Response:
```json
{
  "message": "Account linked successfully",
  "platformAccount": {
    "id": "uuid",
    "platform": "xbox",
    "platformId": "2535428746582745",
    "platformUsername": "XboxGamer123",
    "isPrimary": true,
    "linkedAt": "2024-01-15T12:00:00Z"
  }
}
```

**GET /api/platform/accounts**
- Hämta alla länkade plattformar för inloggad användare

**PUT /api/platform/accounts/:id/primary**
- Sätt primär plattform

**DELETE /api/platform/accounts/:id**
- Ta bort länkad plattform

### 4. Battlelog API (Cross-Platform)

Filen: `server/src/routes/battlelog.routes.ts`

#### Nya endpoints:

**POST /api/battlelog/match**
- Tar emot match-resultat från Arma Reforger-modden
- Kräver `SERVER_API_KEY`
- Skapar/uppdaterar PlayerStats baserat på `platform` + `platformId`

Request exempel:
```json
{
  "serverApiKey": "YOUR_SERVER_API_KEY",
  "matchId": "550e8400-e29b-41d4-a716-446655440000",
  "serverId": "sv-vikings-1",
  "map": "Everon",
  "gameMode": "Conflict",
  "duration": 3847,
  "players": [
    {
      "platform": "steam",
      "platformId": "76561198012345678",
      "platformUsername": "VikingWarrior",
      "faction": "NATO",
      "kills": 15,
      "deaths": 3,
      "assists": 5,
      "headshots": 7,
      "score": 2500,
      "result": "win",
      "playTime": 3540,
      "weaponKills": {
        "AK-74": 8,
        "SVD": 5
      }
    },
    {
      "platform": "xbox",
      "platformId": "2535428746582745",
      "platformUsername": "ConsolePlayer",
      "faction": "RUS",
      "kills": 12,
      "deaths": 5,
      "result": "loss",
      "playTime": 3540
    }
  ]
}
```

**GET /api/battlelog/player/:platform/:platformId**
- Hämta spelarstatistik för specifik plattform + ID
- Publikt endpoint

---

## Frontend Implementation (✅ Klart)

### 1. Discord Login Button

Lägg till i login-sidan:
```tsx
<a href="/api/auth/discord" className="btn-discord">
  Login with Discord
</a>
```

### 2. Link Account Page

Skapa ny sida: `/link-account`

```tsx
function LinkAccountPage() {
  const [code, setCode] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/platform/link-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (res.ok) {
      alert('Account linked successfully!');
    }
  };

  return (
    <div>
      <h1>Länka ditt spelkonto</h1>
      <p>Ange koden du fick i spelet:</p>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="VIKING-XXXX"
      />
      <button onClick={handleSubmit}>Länka konto</button>
    </div>
  );
}
```

### 3. Settings Page - Linked Platforms

Uppdatera `client/src/pages/Settings.tsx`:

```tsx
function LinkedPlatforms() {
  const [platforms, setPlatforms] = useState([]);

  useEffect(() => {
    fetch('/api/platform/accounts')
      .then(res => res.json())
      .then(setPlatforms);
  }, []);

  return (
    <div>
      <h2>Länkade plattformar</h2>
      {platforms.map(p => (
        <div key={p.id}>
          <strong>{p.platform}</strong>: {p.platformUsername}
          {p.isPrimary && <span>(Primär)</span>}
          <button onClick={() => unlinkPlatform(p.id)}>Ta bort</button>
        </div>
      ))}
    </div>
  );
}
```

### 4. Profile Page - Show Platform Info

Visa länkar plattformar på användarens profil.

---

## Arma Reforger Mod Implementation (TODO 🎮)

Se `battlelog_todo.md` för fullständig guide.

### Flow:

1. **Spelare ansluter till servern**
   ```c
   string platform = GetPlayerPlatform(player);      // "steam", "xbox", "psn"
   string platformId = GetPlayerIdentityId(player);  // Steam ID, XUID, PSN ID
   string username = GetPlayerName(player);
   ```

2. **Kolla om länkat konto**
   ```c
   GET https://api.swedenvikings.eu/api/battlelog/player/{platform}/{platformId}
   ```

3. **Om inte länkat, generera kod**
   ```c
   POST https://api.swedenvikings.eu/api/platform/generate-code
   {
     "serverApiKey": "xxx",
     "platform": "xbox",
     "platformId": "2535428746582745",
     "platformUsername": "XboxGamer"
   }

   // Response: { "code": "VIKING-A7X9" }
   // Visa kod för spelaren: "Gå till swedenvikings.eu/link och ange kod: VIKING-A7X9"
   ```

4. **När match är slut, skicka stats**
   ```c
   POST https://api.swedenvikings.eu/api/battlelog/match
   {
     "serverApiKey": "xxx",
     "matchId": "uuid",
     "players": [
       {
         "platform": "xbox",
         "platformId": "2535428746582745",
         "kills": 10,
         "deaths": 5,
         ...
       }
     ]
   }
   ```

---

## Deployment Setup

### Miljövariabler (.env.production)

```env
# Discord OAuth
DISCORD_CLIENT_ID=your_discord_app_id
DISCORD_CLIENT_SECRET=your_discord_app_secret
DISCORD_CALLBACK_URL=https://yourdomain.com/api/auth/discord/callback

# Server API Key (för Arma mod)
SERVER_API_KEY=generate_with_openssl_rand_hex_32

# Steam (existing)
STEAM_API_KEY=your_steam_key
STEAM_RETURN_URL=https://yourdomain.com/api/auth/steam/callback
```

### Discord Application Setup

1. Gå till https://discord.com/developers/applications
2. Skapa ny application
3. Under OAuth2 → General:
   - Client ID (kopiera till .env)
   - Client Secret (kopiera till .env)
4. Under OAuth2 → Redirects:
   - Lägg till: `https://yourdomain.com/api/auth/discord/callback`
5. Under OAuth2 → Default Authorization Link:
   - Välj "In-app Authorization"
   - Scopes: `identify`, `email`

### Database Migration

```bash
cd server
npx prisma db push
npx prisma generate
```

---

## Testing Checklist

### Backend ✅
- [x] Discord OAuth fungerar
- [x] Steam OAuth fungerar (existing)
- [x] `/api/platform/generate-code` skapar kod
- [x] `/api/platform/link-code` länkar konto
- [x] `/api/platform/accounts` listar länkade konton
- [x] `/api/battlelog/match` tar emot cross-platform data
- [x] `/api/battlelog/player/:platform/:platformId` hämtar stats

### Frontend 🚧
- [ ] Discord login-knapp fungerar
- [ ] Link account-sida fungerar
- [ ] Settings visar länkade plattformar
- [ ] Profile visar plattformsinformation
- [ ] Battlelog visar cross-platform stats

### Arma Mod 🚧
- [ ] Plattformsdetektering (Steam/Xbox/PSN)
- [ ] Platform ID-hämtning
- [ ] Kod-generering och visning
- [ ] Match-data skickas korrekt
- [ ] Cross-platform spelare i samma match

---

## API Flow Diagram

```
┌─────────────┐                 ┌──────────────┐
│  Xbox/PSN   │                 │  PC (Steam)  │
│   Player    │                 │    Player    │
└──────┬──────┘                 └──────┬───────┘
       │                               │
       │ Joins Arma Server             │ Joins Arma Server
       │                               │
       ▼                               ▼
┌──────────────────────────────────────────────┐
│       Arma Reforger Server (Mod)             │
│                                              │
│  • Detects platform (xbox/psn/steam)        │
│  • Gets platform ID (XUID/PSN ID/Steam ID)  │
│  • Checks if account linked                 │
│  • Generates code if not linked             │
│  • Tracks match stats                       │
└──────────────┬───────────────────────────────┘
               │
               │ POST /api/platform/generate-code
               │ POST /api/battlelog/match
               │
               ▼
┌──────────────────────────────────────────────┐
│      Sweden Vikings Backend API              │
│                                              │
│  • Stores linking codes                     │
│  • Stores PlayerStats (platform + ID)       │
│  • Links to User when code verified         │
└──────────────┬───────────────────────────────┘
               │
               │ User logs in with Discord/Steam
               │ User enters linking code
               │
               ▼
┌──────────────────────────────────────────────┐
│      Sweden Vikings Website                  │
│                                              │
│  • Discord/Steam OAuth login                │
│  • Link account page (enter code)           │
│  • Settings (view linked platforms)         │
│  • Battlelog (view cross-platform stats)    │
└──────────────────────────────────────────────┘
```

---

## Nästa steg

1. **Frontend implementation** - Implementera UI för Discord login och kontolänkning
2. **Arma Reforger Mod** - Utveckla modden enligt battlelog_todo.md
3. **Testing** - Testa hela flödet end-to-end med alla tre plattformar
4. **Documentation** - Skapa användarguide för konsol-spelare

---

*Uppdaterad: 2026-01-03*
*Backend implementation: ✅ Klar*
*Frontend implementation: ✅ Klar*
*Arma Mod: 🚧 Nästa steg*

---

## ✅ Implementation Status

### Backend (100% ✅)
- ✅ Discord OAuth (Passport.js)
- ✅ Platform API (`/api/platform/*`)
- ✅ Battlelog cross-platform API
- ✅ Database schema (PlatformAccount, LinkingCode, PlayerStats)
- ✅ Miljövariabler konfigurerade

### Frontend (100% ✅)
- ✅ Discord login-knapp (`client/src/pages/Login.tsx`)
- ✅ Link Account-sida (`client/src/pages/LinkAccount.tsx`)
- ✅ Settings Spelkonton-tab (`client/src/pages/Settings.tsx`)
- ✅ usePlatform hooks (`client/src/hooks/usePlatform.ts`)
- ✅ Route registrerad (`/link-account`)

### Arma Reforger Mod (0% 🚧)
- Se `battlelog_todo.md` för fullständig guide
- Behöver implementera plattformsdetektering
- Behöver implementera kod-generering
- Behöver implementera stats-sändning
