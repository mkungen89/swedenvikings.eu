# Scenario ID Management - TODO

> Implementation av scenario-hantering i Admin Panel med dropdown-val, mod-koppling och automatisk skanning.

---

## Fas 1: Databas

### Prisma Schema
- [ ] Skapa `Scenario` modell i `server/prisma/schema.prisma`
- [ ] Koppla Scenario till Mod (optional relation för vanilla scenarios)
- [ ] Köra `npx prisma migrate dev --name add_scenarios`

```prisma
model Scenario {
  id          String   @id @default(uuid())
  scenarioId  String   @unique  // "{ECC61978EDCC2B5A}Missions/23_Campaign.conf"
  name        String              // "Campaign 23"
  description String?
  modId       String?             // null = vanilla/base game
  mod         Mod?     @relation(fields: [modId], references: [id], onDelete: SetNull)
  isVanilla   Boolean  @default(false)
  imageUrl    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([modId])
}
```

---

## Fas 2: Backend API

### Fil: `server/src/routes/server.routes.ts`

- [ ] `GET /api/server/scenarios` - Lista alla scenarios (grupperade per mod)
- [ ] `POST /api/server/scenarios` - Lägg till scenario manuellt
- [ ] `PUT /api/server/scenarios/:id` - Uppdatera scenario
- [ ] `DELETE /api/server/scenarios/:id` - Ta bort scenario
- [ ] `POST /api/server/scenarios/scan` - Skanna installerade mods för scenarios

### Scenario Service (Ny fil)
- [ ] Skapa `server/src/services/gameServer/ScenarioService.ts`
- [ ] Implementera `scanModsForScenarios()` - söker efter `.conf` filer
- [ ] Implementera `parseScenarioConfig()` - extraherar namn från .conf fil

### Skanning Logic
```typescript
// Sökvägar för scenarios:
// - Vanilla: serverPath/Missions/*.conf
// - Mods: serverPath/addons/{workshopId}/Missions/*.conf

// Scenario ID format:
// {MOD_HEX_ID}Missions/ScenarioName.conf
```

---

## Fas 3: Frontend - Dropdown

### Fil: `client/src/pages/admin/Server.tsx`

- [ ] Skapa ny hook `useScenarios()` i `client/src/hooks/useServer.ts`
- [ ] Ersätt textfält för Scenario ID med dropdown
- [ ] Gruppera scenarios per mod i dropdown
- [ ] Visa mod-ikon/namn bredvid varje scenario

### Dropdown UI
```
+------------------------------------------+
| [Dropdown: Välj scenario...]             |
| +--------------------------------------+ |
| | 📦 Vanilla (Base Game)               | |
| |    └ Campaign 23                     | |
| |    └ Conflict - Everon               | |
| |    └ Game Master                     | |
| | 📦 Mike Forces Mod                   | |
| |    └ MF Campaign Alpha               | |
| |    └ MF Conflict                     | |
| | 📦 RHS                               | |
| |    └ RHS Cold War                    | |
| +--------------------------------------+ |
+------------------------------------------+
```

---

## Fas 4: Frontend - Scenario Management

### Ny sektion i Inställningar-fliken

- [ ] Lista alla sparade scenarios
- [ ] "Lägg till scenario" modal/formulär
  - [ ] Scenario ID (text input)
  - [ ] Namn (text input)
  - [ ] Beskrivning (textarea, optional)
  - [ ] Välj mod (dropdown, optional - tom = vanilla)
  - [ ] Bild-URL (text input, optional)
- [ ] "Skanna mods" knapp
  - [ ] Visa progress under skanning
  - [ ] Visa hittade scenarios med checkbox för val
  - [ ] Spara valda scenarios
- [ ] Redigera scenario
- [ ] Ta bort scenario

---

## Fas 5: Vanilla Scenarios (Seed Data)

- [ ] Skapa seed-fil med Arma Reforger vanilla scenarios
- [ ] Lägg till i `server/prisma/seed.ts`

### Vanilla Scenarios att inkludera:
```javascript
const vanillaScenarios = [
  { scenarioId: '{ECC61978EDCC2B5A}Missions/23_Campaign.conf', name: 'Campaign' },
  { scenarioId: '{59AD59368755F41A}Missions/21_GM_Eden.conf', name: 'Game Master - Eden' },
  { scenarioId: '{90F086877C27B6F6}Missions/17_Conflict.conf', name: 'Conflict - Everon' },
  // ... fler scenarios
];
```

---

## Testning

- [ ] Testa manuell tilläggning av scenario
- [ ] Testa skanning av mod-mappar
- [ ] Testa dropdown-val i serverinställningar
- [ ] Testa att servern startar med valt scenario
- [ ] Testa borttagning av scenario
- [ ] Testa att scenario förblir när mod tas bort (graceful handling)

---

## Filer att skapa/ändra

| Fil | Åtgärd |
|-----|--------|
| `server/prisma/schema.prisma` | Lägg till Scenario modell |
| `server/src/routes/server.routes.ts` | Lägg till CRUD routes |
| `server/src/services/gameServer/ScenarioService.ts` | **NY** - Skanning logic |
| `server/src/services/gameServer/index.ts` | Exportera ScenarioService |
| `client/src/hooks/useServer.ts` | Lägg till useScenarios hook |
| `client/src/pages/admin/Server.tsx` | Dropdown + management UI |
| `server/prisma/seed.ts` | Vanilla scenarios seed data |

---

## Noteringar

- Scenario ID är unikt för varje scenario
- Mod-ID i scenario-strängen (`{HEX_ID}`) matchar Workshop ID
- `.conf` filer innehåller scenario-metadata (namn, beskrivning, etc.)
- Om en mod avinstalleras, behåll scenariots data men markera som "orphaned"

---

*Skapad: 2026-01-03*

