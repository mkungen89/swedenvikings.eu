# GDPR Compliance Documentation - Sweden Vikings CMS

**Senast uppdaterad:** 2026-01-02
**Version:** 1.0
**Status:** GDPR-kompatibel

---

## Innehållsförteckning

1. [Översikt över GDPR-efterlevnad](#1-översikt)
2. [Rättslig grund för behandling (Artikel 6)](#2-rättslig-grund)
3. [De 7 användarrättigheterna (Artiklar 15-21, 77)](#3-användarrättigheter)
4. [Cookie-samtycke (Artikel 7)](#4-cookie-samtycke)
5. [Dataskydd genom design (Artikel 25)](#5-dataskydd-design)
6. [Säkerhetsåtgärder (Artikel 32)](#6-säkerhet)
7. [Databehandlingsavtal (Artikel 28)](#7-dpa)
8. [Dataintrångsprocedurer (Artiklar 33-34)](#8-intrång)
9. [DPIA (Artikel 35)](#9-dpia)
10. [Transparenzkrav (Artiklar 13-14)](#10-transparens)
11. [Register över behandlingsaktiviteter (Artikel 30)](#11-register)
12. [GDPR-efterlevnadschecklista](#12-checklista)
13. [Kontakt och ansvar](#13-kontakt)
14. [Versionshistorik](#14-versionshistorik)

---

## 1. Översikt över GDPR-efterlevnad {#1-översikt}

### 1.1 Allmän beskrivning

Sweden Vikings CMS är en gaming community-plattform för Arma Reforger-spelarna med Steam-autentisering. Vi hanterar personuppgifter för användarprofilhantering, spelarstatistik, community-funktioner och sessionshantering.

### 1.2 Behörig organisation

- **Namn:** Sweden Vikings
- **Typ:** Gaming Community CMS
- **Dataskyddskontakt:** `privacy@swedenvikings.eu`

### 1.3 Tillämplig lagstiftning

- EU General Data Protection Regulation (GDPR) (EU 2016/679)
- Swedish Data Protection Act (Dataskyddslagen 2018:218)
- ePrivacy Directive (2002/58/EC)
- Swedish ePrivacy Act (Lag 2003:389)

### 1.4 Geografisk räckvidd

- **Lagring:** All data lagras i EU (PostgreSQL i Sverige)
- **Behandling:** Inom EU/EES
- **Överföring:** Ingen överföring utanför EU/EES utan lämpliga åtgärder

---

## 2. Rättslig grund för behandling (Artikel 6) {#2-rättslig-grund}

### 2.1 Lagliga grunder

Vi behandlar personuppgifter baserat på:

#### A. Samtycke (Artikel 6.1.a)
- Cookie-samtycke för non-essential cookies
- Marketing-cookies kräver explicit opt-in
- Analytics-cookies lagras med opt-in

#### B. Kontraktsuppfyllelse (Artikel 6.1.b)
- Tjänsteleverans (plattformen)
- Spelarstatistik-registrering
- Användarvillkor acceptans

#### C. Berättigat intresse (Artikel 6.1.f)
- Säkerhet och bedrägeribekämpning
- Tjänsteförbättring
- Gemenskapshälsa och moderering

#### D. Juridisk skyldighet (Artikel 6.1.d)
- Säkerhetsloggar (90 dagar)
- Myndighetskrav

### 2.2 Dokumentation av rättslig grund

| Datatyp | Rättslig grund | Behållningsperiod |
|---------|---|---|
| Steam-ID, användarnamn | Kontraktsuppfyllelse | Aktiv konto |
| E-postadress | Samtycke + Kontraktsuppfyllelse | Aktiv konto + 6 mån |
| Cookie-preferenser | Samtycke | 1 år |
| Spelarstatistik | Kontraktsuppfyllelse | Aktiv konto |
| IP-adress (login) | Berättigat intresse | 90 dagar |
| Aktivitetsloggar | Kontraktsuppfyllelse + Säkerhet | 1 år |

---

## 3. De 7 användarrättigheterna (Artiklar 15-21, 77) {#3-användarrättigheter}

### 3.1 Rätt till tillgång (Artikel 15)

**Användare kan begära all data vi behandlar om dem.**

- **API:** `POST /api/gdpr/export`
- **Gränssnitt:** `/settings` ’ Integritet ’ Ladda ner min data
- **Format:** JSON i ZIP-arkiv (48h giltighet)
- **Kod:** `/server/src/services/gdpr.service.ts:14-153`
- **Responstid:** Max 30 dagar enligt GDPR-krav

### 3.2 Rätt till rättelse (Artikel 16)

**Användare kan korrigera felaktig data.**

- Användarnamn, e-postadress, bio, tema, språk kan redigeras
- Ändringar loggas automatiskt i ActivityLog
- Gränssnitt: `/settings`
- Kod: `/client/src/pages/Settings.tsx` och `/server/src/routes/user.routes.ts`

### 3.3 Rätt till radering (Artikel 17)

**Användare kan begära att deras data tas bort.**

- **API:** `POST /api/gdpr/delete`
- **Verifiering:** E-post-verifikation
- **Grace period:** 30 dagar innan permanent radering
- **Cascade deletion:** Alla relaterade data raderas automatiskt
- **Kod:** `/server/src/services/gdpr.service.ts:331-460`

### 3.4 Rätt till dataporterbarhet (Artikel 20)

**Användare kan få sin data i maskinläsbar format.**

- **Format:** JSON-struktur i ZIP
- **Åtkomst:** Via `/api/gdpr/export` endpoint
- **Download-länk:** 48 timmar giltighet
- **Struktur:** Logisk organisation (profil, statistik, innehål, support, gaming, privacy)

### 3.5 Rätt att återkalla samtycke (Artikel 7)

**Användare kan ändra cookie-inställningar.**

- **API:** `POST /api/gdpr/consent`
- **Kategorier:** Nödvändiga, funktionella, analytics, marketing
- **UI:** Cookie banner + inställningssida
- **Lagring:** localStorage + CookieConsent-tabell
- **Kod:** `/client/src/components/gdpr/CookieConsent.tsx` och `/server/src/routes/gdpr.routes.ts:38-70`

### 3.6 Rätt att göra invändningar (Artikel 21)

**Användare kan invända mot viss behandling.**

- Marketing-e-post: `emailNotifications` flag
- Analytics: `analytics` cookie
- Discord-notifikat: `discordNotifications` flag
- Profil-synlighet: `isPrivate` flag

### 3.7 Rätt att klaga (Artikel 77)

**Användare kan klaga på GDPR-kränkningar.**

- **Datainspektionen:** https://www.imy.se
- **E-post:** imy@imy.se
- **Tel:** +46 (0)8-657 61 00
- Information publicerad på `/privacy`

---

## 4. Cookie-samtycke och implementering (Artikel 7) {#4-cookie-samtycke}

### 4.1 Cookie-kategorier

| Kategori | Påkrävet | Återkallbart | Syfte |
|----------|---|---|---|
| Nödvändiga | JA | NEJ | Session, autentisering, säkerhet |
| Funktionella | NEJ | JA | Tema, språk, preferenser |
| Analytics | NEJ | JA | Användarmönster, förbättring |
| Marketing | NEJ | JA | Marknadsföring, reklam |

### 4.2 Banner-implementering

- **Komponent:** `/client/src/components/gdpr/CookieConsent.tsx`
- **Triggers:** Vid första besöket (1000ms fördröjning)
- **Alternativ:** Acceptera alla, Avvisa alla, Anpassa
- **Beständighet:** localStorage + database (CookieConsent)

### 4.3 API-endpoints

```
POST /api/gdpr/consent    - Spara samtycke
GET /api/gdpr/consent/:userId - Hämta samtycke
```

**Kod:** `/server/src/routes/gdpr.routes.ts:20-70`

### 4.4 Lagring av samtyckesdata

**Databasmodell:**
```prisma
model CookieConsent {
  id              String   @id @default(uuid())
  userId          String?  @unique
  necessary       Boolean  @default(true)
  analytics       Boolean  @default(false)
  marketing       Boolean  @default(false)
  preferences     Boolean  @default(false)
  ipAddress       String?
  userAgent       String?
  consentVersion  String   @default("1.0")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## 5. Dataskydd genom design (Artikel 25) {#5-dataskydd-design}

### 5.1 Implementerade åtgärder

#### A. Dataminimering
- Samla bara nödvändig data
- Steam: Endast ID + användarnamn + avatar
- Ingen spårning av alla åtgärder

#### B. Pseudonymisering
- IP-adresser kan hashas
- Spelarstatistik anonymiseras efter radering
- Aktivitetsloggar kan anonymiseras

#### C. Åtkomstkontroll
- RBAC-system (Admin, Moderator, Staff, Member)
- Rollbaserad behörighet
- Säkerhetsövervakning av admin-åtgärder
- **Kod:** `/server/src/middleware/auth.ts:93-140`

#### D. Dataintegritet
- PostgreSQL constraints
- Foreign keys
- ACID-transaktioner
- Dagliga backups

#### E. Loggning & Audit Trail
- **ActivityLog-modell:** Spårar alla åtgärder
- **Retention:** 1 år
- **Säkerhet:** IP + User-Agent sparad

### 5.2 Kryptering

#### A. In Transit (HTTPS/TLS)
- TLS 1.2+
- Let's Encrypt SSL-certifikat
- HSTS headers

#### B. At Rest
- **Lösenord:** bcrypt-hashas
- **SSH-nycklar:** Krypterade
- **Tokens:** Hashade
- **Database:** PostgreSQL pgcrypto

#### C. Databasensäkerhet
- Starka PostgreSQL-lösenord
- SSL-connection till databas
- Connection pooling
- Regelbundna uppdateringar

### 5.3 Datalagringsperioder

- **Användardata:** Aktiv konto + 30 dagar efter radering
- **Aktivitetsloggar:** 1 år (normal), 90 dagar (säkerhet)
- **Sessions:** 24h standard (konfigurabel)
- **Backups:** 30 dagar retention

---

## 6. Säkerhetsåtgärder (Artikel 32) {#6-säkerhet}

### 6.1 Organisatoriska åtgärder

- **Åtkomstkontroll:** Rollbaserad behörighet
- **MFA:** Tvåfaktorsautentisering för admins
- **Personal:** GDPR-träning dokumenterad
- **NDA:** För alla med åtkomst
- **Incident-plan:** Dokumenterad process
- **DPO:** Utsedd (privacy@swedenvikings.eu)

### 6.2 Tekniska åtgärder

#### A. Kryptering
- HTTPS: TLS 1.2+
- SSH: Ed25519 keys
- Database: pgcrypto
- Backups: AES-256
- Cookies: Secure + SameSite=Strict

#### B. Firewalling
```
UFW-brandvägg:
- SSH (22/TCP): Begränsad
- HTTP (80/TCP): Öppen
- HTTPS (443/TCP): Öppen
- Arma (2001/UDP, 17777/UDP): Öppen
```

#### C. Rate Limiting
- Login: Max 5 försök på 30 min
- API: 100 requests per 15 min
- Comment: 1 per 5 sek
- Password reset: 1 per 1h

#### D. Input Validation
- **express-validator:** Server-side
- **TypeScript:** Typ-säkerhet
- **React:** XSS-protection
- **CORS:** Konfigurerad
- **CSRF:** Token-baserat

#### E. SQL Injection-skydd
- **Prisma ORM:** Parameteriserade queries
- **TypeScript:** Förhindrar sträng-baserade queries
- Inga raw SQL-queries utan kontroll

### 6.3 Övervakning

- **PM2:** Process-övervakning
- **Systemd:** Service-övervakning
- **Failed logins:** Loggas och räknas
- **Brute force:** Automated lockout
- **Regelbundna:** Security updates

---

## 7. Databehandlingsavtal (Artikel 28) {#7-dpa}

### 7.1 Underordnade behandlare

| Tjänst | Leverantör | DPA |
|--------|-----------|-----|
| VPS/Server | [Cloud Provider] | Krävs |
| PostgreSQL | Included | Included |
| Redis | Included | Included |
| SMTP | [Email service] | Krävs |
| CDN | [Optional] | Krävs om används |
| Google Analytics | [Optional] | Krävs om aktiverat |
| Discord | [Optional] | Krävs om länkat |

### 7.2 DPA-krav

- Artikel 28.3-krav (GDPR Appendix 1)
- Skriftlig avtal
- Säkerhetsåtgärder
- Sub-processors lista
- Dataöverföringar

### 7.3 Användarinformation

- Publicera lista på `/privacy`
- DPA-länkar på begäran
- Uppdatera vid nya processörer

---

## 8. Dataintrångsprocedurer (Artiklar 33-34) {#8-intrång}

### 8.1 Definition

En överträdelse av säkerheten som leder till oavsiktlig eller olaglig förstöring, förlust, ändring, obehörig utlämnande av eller obehörig åtkomst till personuppgifter.

### 8.2 Intrångsprocedur

#### Steg 1: Detektering & Bedömning (ASAP)
1. Säkra bevis/logs
2. Stoppa ongoing attack
3. Bedöm omfattning

#### Steg 2: Intern Notification (Inom 24h)
- Data Controller
- DPO (privacy@swedenvikings.eu)
- Relevant personal
- CEO/Board

#### Steg 3: Anmälan till Datainspektionen (Inom 72h)
- Till: imy@imy.se
- Format: Officiell anmälan
- Arkivering: 3 år

#### Steg 4: Användarnotifikation
- Format: E-post, webbplats, press-release
- Innehål: DPO-kontakt, beskrivning, följder, åtgärder
- Tidsram: Utan onödig dröjsmål

### 8.3 Post-Incident

- Rota certificates/keys
- Installera patches
- Audit logs (3 mån)
- RCA (Root Cause Analysis)
- Lagra dokumentation i 3 år

---

## 9. Dataskyddskonsekvensbedömning (Artikel 35) {#9-dpia}

### 9.1 DPIA-krav

Genomföras för behandling som:
1. Använder ny teknik
2. I stor skala
3. Systematisk övervakning
4. Automatiserad beslutsfattning
5. Känslig data

### 9.2 Behandlingar som KRÄVER DPIA

- Automatiserad moderering (AI/NLP)
- Spelarstatistik & Leaderboards
- Bedrägeribekämpning & Ban-system
- Aktivitetsövervakning (ActivityLog)
- Recruitment System (ansökningar)

---

## 10. Transparenzkrav (Artiklar 13-14) {#10-transparens}

### 10.1 Information vid datainsamling (Artikel 13)

**Måste innehål:**
1. Identitet på Controller
2. Syfte & rättslig grund
3. Mottagere av data
4. Behållningsperiod
5. Användar-rättigheter
6. Rätt att klaga
7. Källan för data
8. Automatiserad beslutsfattning
9. Påtvingning

### 10.2 Implementering

#### Plats 1: Privacy Policy
- Sida: `/privacy`
- Kod: `/client/src/pages/Privacy.tsx`
- Innehål: Fullständig transparens

#### Plats 2: Cookie Banner
- Komponent: `/client/src/components/gdpr/CookieConsent.tsx`
- Information: Var cookies används, typ, länk

#### Plats 3: Inställningar
- Sida: `/settings`
- Sektion: Integritet/Privacy
- Information: Cookie, export, radering

#### Plats 4: Terms of Service
- Sida: `/terms`
- Information: GDPR-villkor, datahanterings-villkor

---

## 11. Register över behandlingsaktiviteter (Artikel 30) {#11-register}

### 11.1 Behandlingsaktiviteter

#### A. Användarkontohantering
- Syfte: Skapa & hantera konton
- Grund: Art. 6.1.b
- Data: Steam ID, användarnamn, e-post, avatar, profil
- Behålltid: Aktiv konto + 30 dagar

#### B. Spelarstatistik-insamling
- Syfte: Prestationer, leaderboards
- Grund: Art. 6.1.b + 6.1.f
- Data: Spel-ID, kills, deaths, statistik
- Behålltid: Aktiv konto, anonymiserad efter radering

#### C. Aktivitetsloggning
- Syfte: Säkerhet, audit
- Grund: Art. 6.1.f
- Data: User ID, action, timestamp, IP, user-agent
- Behålltid: 1 år (normal), 90 dagar (säkerhet)

#### D. Cookie-hantering
- Syfte: Respektera preferenser
- Grund: Art. 6.1.a
- Data: User ID, IP, preferences
- Behålltid: 1 år

#### E. Data-export-förfrågningar
- Syfte: Rätt till tillgång (Art. 15)
- Grund: Art. 6.1.a + art. 15
- Data: All användardata
- Behålltid: 48h, sedan raderad

#### F. Data-borttagning-förfrågningar
- Syfte: Rätt till radering (Art. 17)
- Grund: Art. 6.1.a + art. 17
- Data: All användardata
- Behålltid: 30 dagar grace, sedan raderad

---

## 12. GDPR-efterlevnadschecklista {#12-checklista}

### 12.1 Implementerad

- [x] Privacy Policy - uppdaterad & tillgänglig
- [x] Cookie-banner - visas vid första besöket
- [x] Data-export (Art. 15) - funktionell
- [x] Profil-redigering (Art. 16) - möjlig
- [x] Konto-radering (Art. 17) - med verifikation
- [x] JSON-export (Art. 20) - tillgänglig
- [x] Cookie-inställningar (Art. 7) - ändbar
- [x] HTTPS/TLS - implementerad
- [x] Lösenord-hashing - bcrypt
- [x] Känslig data - krypterad
- [x] Backups - dagliga & krypterade
- [x] Rate limiting - aktiverad
- [x] Audit logs - lagras
- [x] Incident-plan - dokumenterad
- [x] DPO-kontakt - publicerad

### 12.2 Under implementering

- [ ] Sub-processor-övervakning (DPA-avtal)
- [ ] DPIA-genomförande för högrisk-behandlingar
- [ ] Personal-träning (formell dokumentation)
- [ ] Årlig GDPR-granskning

---

## 13. Kontakt och ansvar {#13-kontakt}

### 13.1 Roller

#### Data Controller
- Överallstrategi för dataskydd
- Godkännande av stora behandlingar
- Dataintrångs-hantering
- Datainspektionen-rapportering

#### Data Protection Officer (DPO)
- **E-post:** privacy@swedenvikings.eu
- Daglig GDPR-övervakning
- DPIA-genomförande
- Användar-förfrågningarna
- Datainspektionen-kommunikation
- Personal-träning

#### Developers & Administrators
- Säker kodning
- Åtkomstkontroll
- Backup & recovery
- Säkerhetstesting
- Incident-response

### 13.2 Kontaktkanaler

**För användar-förfrågningar:**
- E-post: privacy@swedenvikings.eu
- Support: support@swedenvikings.eu
- Discord: discord.gg/swedenvikings

**Svar-tidsramar:**
- Bekräftelse: 3 arbetsdagar
- Svar: 30 dagar (GDPR-krav)
- Komplext: 60 dagar med notifikation

### 13.3 Extern kontakt

**Datainspektionen** (Swedish DPA)
- Webbplats: https://www.imy.se
- E-post: imy@imy.se
- Tel: +46 (0)8-657 61 00
- Adress: Box 8114, 104 20 Stockholm

---

## 14. Versionshistorik {#14-versionshistorik}

### Version 1.0 (2026-01-02)
- **Status:** Initial release
- **Innehål:**
  - Fullständig GDPR-dokumentation
  - Alla 7 rättigheter implementerade
  - API-endpoints dokumenterade
  - Säkerhetsmätningar beskrivna
  - Kontakt & ansvar definierad

### Version 1.1 (Planerad - 2026-06-02)
- Årlig GDPR-granskning
- Uppdateringar baserat på användar-feedback
- Nya behandlingar (om tillämpligt)
- Säkerhetspatch-uppdateringar

---

**Skapningsdatum:** 2026-01-02
**Senast uppdaterad:** 2026-01-02
**Status:** GODKÄND
**Nästa granskning:** 2026-06-02
