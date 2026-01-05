# Battlelog Mod - Arma Reforger
## Utvecklings-TODO för Sweden Vikings Battlelog Integration

---

## 📋 Översikt

Denna mod ska samla in spelarstatistik från Arma Reforger-servrar och skicka data till Sweden Vikings webbplattform via REST API. Modden behöver tracka kills, deaths, objektiv, fordon, vapen och mer.

---

## 🔗 API Integration

### Endpoint Bas-URL
```
https://api.swedenvikings.eu/battlelog
```

### Autentisering
- [ ] Implementera API-nyckel autentisering (server-side nyckel)
- [ ] Hantera JWT-tokens för säker kommunikation
- [ ] Rate limiting-hantering (max 60 requests/minut)

### API Endpoints att använda

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| POST | `/api/battlelog/match` | Skicka match-resultat |
| POST | `/api/battlelog/player-stats` | Uppdatera spelarstatistik |
| POST | `/api/battlelog/kills` | Registrera kills med vapen/fordon |
| POST | `/api/battlelog/events` | Skicka spelhändelser i realtid |
| GET | `/api/battlelog/player/{platform}/{platformId}` | Hämta spelarinfo |
| POST | `/api/battlelog/link-account` | Länka Xbox-konto till webbkonto |

---

## 🎮 Cross-Platform Stöd (PC, Xbox & PlayStation)

> **Arma Reforger finns på:**
> - **PC (Steam)** - Sedan maj 2022
> - **Xbox Series X|S** - Sedan maj 2022
> - **PlayStation 5** - Sedan 12 december 2024

### Plattformsidentifiering

| Plattform | Identifierare | Format |
|-----------|---------------|--------|
| PC (Steam) | Steam ID 64 | `76561198012345678` |
| Xbox | Xbox User ID (XUID) | `2535428746582745` |
| PlayStation | PSN Account ID | `1234567890123456789` |

### Implementation
- [ ] Detektera spelarens plattform automatiskt
- [ ] Hämta korrekt plattforms-ID (Steam ID, XUID eller PSN Account ID)
- [ ] Skicka plattformsinformation med all data
- [ ] Stödja cross-play matchmaking (alla 3 plattformar)

### Enforce Script - Plattformsdetektering
```c
// Hämta spelarens plattform och ID
class PlatformIdentifier
{
    // Plattformskonstanter
    static const string PLATFORM_STEAM = "steam";
    static const string PLATFORM_XBOX = "xbox";
    static const string PLATFORM_PSN = "psn";
    
    static string GetPlatformType(IEntity player)
    {
        // Arma Reforger Backend API
        BackendApi backend = GetGame().GetBackendApi();
        // Returnerar "steam", "xbox" eller "psn" baserat på plattform
        return backend.GetPlayerPlatform(player);
    }
    
    static string GetPlatformId(IEntity player)
    {
        BackendApi backend = GetGame().GetBackendApi();
        // Returnerar:
        // - Steam ID 64 på PC
        // - XUID på Xbox
        // - PSN Account ID på PlayStation
        return backend.GetPlayerIdentityId(player);
    }
}
```

### Webbplatslänkning för konsol-spelare
Eftersom Xbox/PlayStation-spelare inte kan logga in med Steam behöver vi:
- [ ] **Alternativ 1:** Xbox Live / PSN inloggning på hemsidan
- [ ] **Alternativ 2:** Manuell länkning via verifieringskod
  - Spelare får en kod i spelet (t.ex. `VIKING-A7X9`)
  - Anger koden på hemsidan för att länka kontot
- [ ] **Alternativ 3:** Discord OAuth + manuell ID-inmatning

### Plattforms-specifika OAuth-integrationer
| Plattform | OAuth Provider | Dokumentation |
|-----------|----------------|---------------|
| Steam | Steam OpenID | [Steamworks Auth](https://partner.steamgames.com/doc/features/auth) |
| Xbox | Microsoft/Xbox Live | [Xbox Identity](https://docs.microsoft.com/gaming/xbox-live/) |
| PlayStation | PSN | [PlayStation Partners](https://partners.playstation.com/) |

### Databasändringar (Backend)
```prisma
model PlayerStats {
  // Ändra från bara steamId till:
  platform    String   // "steam" | "xbox" | "psn"
  platformId  String   // Steam ID 64, XUID, eller PSN Account ID
  
  @@unique([platform, platformId])
}
```

---

## 📊 Data som ska samlas in

### 1. Spelaridentifikation
- [ ] **Platform** - "steam" eller "xbox"
- [ ] **Platform ID** - Steam ID 64 eller Xbox XUID
- [ ] **Spelarnamn** - In-game namn
- [ ] **Fraktion** - NATO / RUS / Civilian
- [ ] **Trupp/Squad** - Vilken grupp spelaren tillhör

### 2. Match-data (Per spelomgång)

```json
{
  "matchId": "uuid",
  "map": "Everon",
  "gameMode": "Conflict",
  "duration": 3600,
  "result": "win|loss|draw",
  "startTime": "ISO-8601",
  "endTime": "ISO-8601",
  "serverName": "Sweden Vikings #1",
  "players": []
}
```

#### Implementera:
- [ ] Generera unikt match-ID vid spelstart
- [ ] Spåra vilken karta som spelas
- [ ] Detektera spelläge (Conflict, GameMaster, etc.)
- [ ] Mäta match-längd i sekunder
- [ ] Detektera matchresultat för varje spelare/lag

### 3. Spelarprestanda (Per spelare per match)

```json
{
  "platform": "steam",
  "platformId": "76561198012345678",
  "playerName": "VikingWarrior",
  "faction": "NATO",
  "kills": 15,
  "deaths": 3,
  "assists": 5,
  "headshots": 7,
  "score": 2500,
  "pointsCaptured": 2,
  "pointsDefended": 1,
  "suppliesDelivered": 3,
  "vehiclesDestroyed": 1,
  "revives": 4,
  "teamKills": 0,
  "distanceTraveled": 5.2,
  "playTime": 3540
}
```

#### Implementera:
- [ ] **Kills** - Totala dödade fiender
- [ ] **Deaths** - Antal gånger spelaren dött
- [ ] **Assists** - Assisterade kills
- [ ] **Headshots** - Skott i huvudet
- [ ] **Score** - Spelpoäng
- [ ] **Points Captured** - Erövrade kontrollpunkter
- [ ] **Points Defended** - Försvarade kontrollpunkter
- [ ] **Supplies Delivered** - Levererade förnödenheter
- [ ] **Vehicles Destroyed** - Förstörda fiendefordon
- [ ] **Revives** - Upplivade medspelare
- [ ] **Team Kills** - Dödade lagkamrater (negativt)
- [ ] **Distance Traveled** - Rest sträcka i kilometer
- [ ] **Play Time** - Speltid i sekunder

### 4. Kill-data (Per kill)

```json
{
  "killerPlatform": "steam",
  "killerId": "76561198012345678",
  "victimPlatform": "xbox",
  "victimId": "2535428746582745",
  "weaponName": "M16A4",
  "weaponClass": "ASSAULT_RIFLE",
  "vehicleName": null,
  "distance": 150.5,
  "isHeadshot": true,
  "isVehicleKill": false,
  "timestamp": "ISO-8601",
  "killerPosition": { "x": 1000, "y": 50, "z": 2000 },
  "victimPosition": { "x": 1150, "y": 48, "z": 2000 }
}
```

#### Implementera:
- [ ] **Killer Platform** - "steam" eller "xbox"
- [ ] **Killer Platform ID** - Vem som dödade (Steam ID / XUID)
- [ ] **Victim Platform** - "steam" eller "xbox"
- [ ] **Victim Platform ID** - Vem som dog (Steam ID / XUID)
- [ ] **Weapon Name** - Exakt vapennamn (för matchning mot databasen)
- [ ] **Weapon Class** - Vapentyp (se lista nedan)
- [ ] **Vehicle Name** - Om kill gjordes från fordon
- [ ] **Distance** - Avstånd i meter mellan skytt och offer
- [ ] **Is Headshot** - Om det var headshot
- [ ] **Is Vehicle Kill** - Om offret var i fordon
- [ ] **Timestamp** - Exakt tidpunkt
- [ ] **Positions** - Koordinater för heatmaps (valfritt)

### 5. Vapen-tracking

#### Vapentyper att spåra:
```
ASSAULT_RIFLE    - AK-74, M16, etc.
SNIPER_RIFLE     - SVD, M24, etc.
MACHINE_GUN      - PKM, M249, etc.
SUBMACHINE_GUN   - PP-19, MP5, etc.
PISTOL           - PM, M9, etc.
SHOTGUN          - Hagelgevär
GRENADE_LAUNCHER - GP-25, M203
ROCKET_LAUNCHER  - RPG-7, Carl Gustaf
MELEE            - Kniv, knytnäve
EXPLOSIVE        - Granater, minor
```

#### Implementera per vapen:
- [ ] Kills med vapnet
- [ ] Deaths medan man håller vapnet
- [ ] Headshots
- [ ] Skott avfyrade
- [ ] Träffar
- [ ] Tid vapnet använts (sekunder)

```json
{
  "platform": "steam",
  "platformId": "76561198012345678",
  "weaponName": "AK-74",
  "kills": 25,
  "deaths": 8,
  "headshots": 12,
  "shotsFired": 450,
  "shotsHit": 85,
  "timeUsed": 7200
}
```

### 6. Fordon-tracking

#### Fordonstyper att spåra:
```
TANK             - T-72, M1A2
APC              - BTR-70, M2A3
IFV              - BMP-2, Bradley
TRANSPORT        - UAZ, HMMWV
HELICOPTER       - Mi-8, UH-60
PLANE            - (om tillämpligt)
BOAT             - Stridsbåtar
TRUCK            - Lastbilar
MOTORCYCLE       - Motorcyklar
```

#### Implementera per fordon:
- [ ] Kills från fordonet
- [ ] Deaths i fordonet
- [ ] Gånger fordonet förstörts
- [ ] Tid i fordonet (sekunder)
- [ ] Körd sträcka (meter)

```json
{
  "platform": "psn",
  "platformId": "1234567890123456789",
  "vehicleName": "T-72B3",
  "kills": 15,
  "deaths": 2,
  "destroyed": 3,
  "timeUsed": 3600,
  "distanceTraveled": 12500
}
```

---

## ⚡ Realtidshändelser (WebSocket/Polling)

### Event-typer att skicka i realtid:
- [ ] **player_connected** - Spelare anslöt
- [ ] **player_disconnected** - Spelare lämnade
- [ ] **kill** - Kill inträffade
- [ ] **objective_captured** - Punkt erövrad
- [ ] **objective_lost** - Punkt förlorad
- [ ] **vehicle_destroyed** - Fordon förstört
- [ ] **match_started** - Match startade
- [ ] **match_ended** - Match avslutad

```json
{
  "eventType": "kill",
  "serverId": "sv-vikings-1",
  "timestamp": "ISO-8601",
  "data": {
    "killer": "PlayerName",
    "victim": "EnemyName",
    "weapon": "AK-74"
  }
}
```

---

## 🎯 Kill Streak & Achievements

### Tracka i realtid:
- [ ] **Current Kill Streak** - Nuvarande kills utan att dö
- [ ] **Longest Kill Streak** - Längsta serien (per match & totalt)
- [ ] **Multi-kills** - Dubbel, Trippel, etc.
- [ ] **Longest Shot** - Längsta kill-avstånd

### Achievement-triggers:
```
first_blood       - Första kill i matchen
double_kill       - 2 kills inom 4 sekunder
triple_kill       - 3 kills inom 4 sekunder
headshot_master   - 5 headshots i rad
tank_destroyer    - Förstör stridsvagn
ace_pilot         - 5 kills från helikopter
medic_hero        - 10 revives i en match
marathon_man      - Gå 10 km i en match
objective_master  - Erövra 5 punkter
```

---

## 🔧 Teknisk Implementation

### Arkitektur
```
┌──────────────────────┐
│  Arma Reforger Mod   │
│  (Enforce Script)    │
└──────────┬───────────┘
           │ HTTP POST
           ▼
┌──────────────────────┐
│   Sweden Vikings     │
│   Backend API        │
│   (Node.js/Express)  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│    PostgreSQL DB     │
│    (Battlelog data)  │
└──────────────────────┘
```

### Enforce Script Komponenter

#### 1. BattlelogManager.c
```c
// Huvudklass för att samla och skicka data
class BattlelogManager
{
    // Spelar-tracking
    ref map<string, ref PlayerData> m_Players;
    
    // Match-data
    string m_MatchId;
    float m_MatchStartTime;
    
    // API-konfiguration
    string m_ApiUrl;
    string m_ApiKey;
    
    void OnPlayerKilled(IEntity victim, IEntity killer, ...);
    void OnObjectiveCaptured(...);
    void OnMatchEnd();
    void SendToApi(string endpoint, string jsonData);
}
```

#### 2. PlayerTracker.c
```c
// Tracka individuell spelare
class PlayerData
{
    string platform;      // "steam" eller "xbox"
    string platformId;    // Steam ID 64 eller XUID
    string playerName;
    int kills, deaths, assists;
    int headshots;
    // etc...
    
    ref array<ref KillData> killHistory;
    ref map<string, ref WeaponData> weaponStats;
    ref map<string, ref VehicleData> vehicleStats;
}
```

#### 3. EventDispatcher.c
```c
// Skicka events till API
class EventDispatcher
{
    void SendKillEvent(...);
    void SendObjectiveEvent(...);
    void SendMatchEvent(...);
    
    // Buffra events och skicka i batch
    ref array<ref GameEvent> m_EventBuffer;
    void FlushEvents();
}
```

### HTTP-kommunikation
- [ ] Implementera RestContext för HTTP POST
- [ ] JSON-serialisering av data
- [ ] Felhantering vid nätverksfel
- [ ] Retry-logik för misslyckade requests
- [ ] Buffring av data vid offline

---

## 📁 Filstruktur för Modden

```
SwedenVikingsBattlelog/
├── Addons/
│   └── SV_Battlelog/
│       ├── config.cpp
│       ├── $PBOPREFIX$
│       ├── Scripts/
│       │   ├── Game/
│       │   │   ├── BattlelogManager.c
│       │   │   ├── PlayerTracker.c
│       │   │   ├── KillTracker.c
│       │   │   ├── ObjectiveTracker.c
│       │   │   ├── VehicleTracker.c
│       │   │   └── WeaponTracker.c
│       │   ├── GameMode/
│       │   │   └── BattlelogGameMode.c
│       │   └── Network/
│       │       ├── EventDispatcher.c
│       │       └── ApiClient.c
│       └── Config/
│           └── battlelog_config.json
├── README.md
└── LICENSE
```

---

## ⚙️ Konfiguration

### Server-side Config (battlelog_config.json)
```json
{
  "apiUrl": "https://api.swedenvikings.eu",
  "apiKey": "SERVER_API_KEY_HERE",
  "serverId": "sv-vikings-1",
  "serverName": "Sweden Vikings Official #1",
  
  "tracking": {
    "kills": true,
    "weapons": true,
    "vehicles": true,
    "objectives": true,
    "positions": false,
    "realtime": true
  },
  
  "intervals": {
    "statsUpdate": 60,
    "eventFlush": 10,
    "heartbeat": 30
  }
}
```

---

## ✅ Checklistor

### Fas 1: Grundläggande (MVP)
- [ ] Plattformsdetektering (Steam/Xbox/PSN)
- [ ] Platform ID-hämtning (Steam ID 64 / XUID / PSN Account ID)
- [ ] Kill/Death tracking
- [ ] Match start/slut detection
- [ ] API-anslutning och autentisering
- [ ] Skicka match-resultat vid match-slut

### Fas 2: Utökad Tracking
- [ ] Vapen-specifik statistik
- [ ] Fordon-statistik
- [ ] Objektiv-tracking (points)
- [ ] Headshot-detection
- [ ] Kill-avstånd beräkning

### Fas 3: Realtidsdata
- [ ] WebSocket-anslutning
- [ ] Live kill-feed
- [ ] Server status updates
- [ ] Spelare online-lista

### Fas 4: Avancerat
- [ ] Kill streak tracking
- [ ] Achievement triggers
- [ ] Heatmap-data (positioner)
- [ ] Anti-cheat integration
- [ ] Mod-specifik vapen/fordon-support (WCS, RHS, etc.)

---

## 🔐 Säkerhet

- [ ] Validera all data server-side
- [ ] Kryptera API-nycklar
- [ ] Rate limiting för att förhindra spam
- [ ] Verifiera Steam ID mot Steam Web API
- [ ] Verifiera Xbox XUID mot Xbox Live API
- [ ] Verifiera PSN Account ID mot PlayStation Network API
- [ ] Cross-platform ID-validering (PC/Xbox/PS5)
- [ ] Logga misstänkt aktivitet

---

## 📝 API Request Exempel

### Skicka Match-resultat
```http
POST /api/battlelog/match HTTP/1.1
Host: api.swedenvikings.eu
Authorization: Bearer SERVER_API_KEY
Content-Type: application/json

{
  "matchId": "550e8400-e29b-41d4-a716-446655440000",
  "serverId": "sv-vikings-1",
  "map": "Everon",
  "gameMode": "Conflict",
  "duration": 3847,
  "endTime": "2024-01-15T18:45:00Z",
  "winner": "NATO",
  "players": [
    {
      "platform": "steam",
      "platformId": "76561198012345678",
      "playerName": "VikingWarrior",
      "faction": "NATO",
      "kills": 15,
      "deaths": 3,
      "assists": 5,
      "headshots": 7,
      "score": 2500,
      "pointsCaptured": 2,
      "pointsDefended": 1,
      "suppliesDelivered": 3,
      "vehiclesDestroyed": 1,
      "revives": 4,
      "teamKills": 0,
      "distanceTraveled": 5234,
      "playTime": 3540,
      "weaponKills": {
        "AK-74": 8,
        "SVD": 5,
        "RPG-7": 2
      },
      "vehicleKills": {
        "BTR-70": 3
      }
    }
  ]
}
```

---

## 📚 Resurser

- [Arma Reforger Modding Docs](https://community.bistudio.com/wiki/Arma_Reforger:Modding)
- [Enforce Script Reference](https://community.bistudio.com/wiki/Arma_Reforger:Scripting)
- [Sweden Vikings API Docs](https://docs.swedenvikings.eu/api)

---

## 🚀 Nästa Steg

1. Skapa grundläggande mod-struktur
2. Implementera plattformsdetektering (Steam/Xbox/PSN)
3. Implementera Platform ID-hämtning för alla 3 plattformar
4. Bygga kill-tracking system
5. Testa API-integration (cross-platform)
6. Lägga till vapen/fordon-tracking
7. Implementera realtids-events
8. Bygga kontolänkning för Xbox & PlayStation på hemsidan
9. Betatesta på privat server (mixed PC/Xbox/PS5)
10. Release på Workshop (alla plattformar)

---

*Senast uppdaterad: 2026-01-03*
*Cross-platform support (Xbox + PlayStation 5) tillagt: 2026-01-03*

