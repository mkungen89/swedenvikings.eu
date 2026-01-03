# TODO - Admin Settings Implementation

## Status: ✅ PHASE 1 KOMPLETT OCH TESTAD! 🎉

**Testdatum:** 2026-01-01
**Testrapport:** Se `PHASE1-TEST-REPORT.md` för fullständiga testresultat

### Phase 1 - KLART ✅

Alla admin-inställningar UI:er är implementerade i frontend:
- ✅ Säkerhetsinställningar (Security)
- ✅ Notifikationsinställningar (Notifications)
- ✅ Databasinställningar (Database)

Phase 1 Backend är klar och testad:
- ✅ Prisma schema uppdaterat med 45 nya fält
- ✅ TypeScript interfaces uppdaterade
- ✅ Backend validation uppdaterad i admin.routes.ts
- ✅ Database migration körda och verifierade
- ✅ Default-värden fungerar korrekt
- ✅ API endpoints testade och fungerar
- ✅ Frontend hooks implementerade

### Phase 2 - Backend Services ✅ KOMPLETT!

**Implementation Report:** Se `PHASE2-IMPLEMENTATION-REPORT.md`

Alla backend services är implementerade:
- ✅ Email Service (nodemailer, SMTP, templates)
- ✅ Discord Service (webhooks, rich embeds)
- ✅ Backup Service (PostgreSQL, scheduler)
- ✅ Optimization Service (VACUUM, cleanup, scheduler)
- ✅ Encryption utility (AES-256 för känslig data)
- ✅ 8 nya API endpoints
- ✅ 8 nya frontend hooks
- ✅ Schedulers integrerade i server startup

### Phase 3 - Integration ✅ KOMPLETT!

**Integration Report:** Se `PHASE3-INTEGRATION-REPORT.md`

Alla notifications integrerade i existerande routes:
- ✅ Auth routes - Ny användare (email + Discord)
- ✅ Ticket routes - Nytt ticket (email + Discord)
- ✅ News routes - Ny artikel (Discord)
- ✅ Event routes - Nytt event (Discord)
- ✅ Admin settings - Scheduler restart on update
- ✅ Admin settings - Email transporter reset on SMTP update

### Nästa steg: Testing & Production

---

## 1. Databas Schema (Prisma) - HÖGSTA PRIORITET

**Fil:** `server/prisma/schema.prisma`

### Uppgift:
Uppdatera `SiteSettings` modellen med alla nya fält.

**Nuvarande modell:**
```prisma
model SiteSettings {
  id                 String  @id @default("main")
  siteName           String  @default("Sweden Vikings")
  siteDescription    String?
  logo               String?
  favicon            String?
  maintenance        Boolean @default(false)
  maintenanceMessage String?
  primaryColor       String  @default("#6366f1")
  accentColor        String  @default("#06b6d4")
  discordInvite      String?
  twitterUrl         String?
  youtubeUrl         String?
  metaTitle          String?
  metaDescription    String?
  ogImage            String?
}
```

**Lägg till dessa fält:**

```prisma
  // Security Settings
  requireEmailVerification    Boolean @default(false)
  enableTwoFactor            Boolean @default(true)
  sessionTimeout             Int     @default(24)      // hours
  maxLoginAttempts           Int     @default(5)
  loginLockoutDuration       Int     @default(30)      // minutes
  passwordMinLength          Int     @default(8)
  passwordRequireUppercase   Boolean @default(true)
  passwordRequireLowercase   Boolean @default(true)
  passwordRequireNumbers     Boolean @default(true)
  passwordRequireSpecialChars Boolean @default(true)
  enableRateLimiting         Boolean @default(true)
  rateLimitRequests          Int     @default(100)
  rateLimitWindow            Int     @default(15)      // minutes
  enableCORS                 Boolean @default(true)
  allowedOrigins             String  @default("http://localhost:5173")
  enableCSRF                 Boolean @default(true)
  ipWhitelist                String  @default("")       // newline-separated IPs
  ipBlacklist                String  @default("")       // newline-separated IPs

  // Notification Settings
  enableEmailNotifications    Boolean @default(true)
  enableDiscordNotifications  Boolean @default(true)
  enablePushNotifications     Boolean @default(false)
  smtpHost                   String  @default("smtp.gmail.com")
  smtpPort                   Int     @default(587)
  smtpSecure                 Boolean @default(true)
  smtpUser                   String  @default("")
  smtpPassword               String  @default("")       // TODO: Encrypt this!
  emailFromAddress           String  @default("noreply@swedenvikings.eu")
  emailFromName              String  @default("Sweden Vikings")
  discordWebhookUrl          String  @default("")
  discordBotToken            String  @default("")       // TODO: Encrypt this!
  notifyOnNewUser            Boolean @default(true)
  notifyOnNewTicket          Boolean @default(true)
  notifyOnNewNews            Boolean @default(false)
  notifyOnNewEvent           Boolean @default(false)
  notifyOnServerDown         Boolean @default(true)
  adminEmailAddresses        String  @default("")       // newline-separated emails

  // Database Settings
  enableAutoBackup           Boolean @default(true)
  backupFrequency            String  @default("daily")  // hourly, daily, weekly, monthly
  backupRetentionDays        Int     @default(30)
  backupLocation             String  @default("/var/backups/swedenvikings")
  enableDatabaseOptimization Boolean @default(true)
  optimizationSchedule       String  @default("weekly") // daily, weekly, monthly
  maxDatabaseSize            Int     @default(10)       // GB
  enableQueryLogging         Boolean @default(false)
  slowQueryThreshold         Int     @default(1000)     // ms
```

**Kör sedan:**
```bash
cd server
npx prisma migrate dev --name add_admin_settings_fields
```

---

## 2. TypeScript Interface (Frontend)

**Fil:** `client/src/hooks/useAdmin.ts`

### Uppgift:
Uppdatera `SiteSettings` interfacet (rad 64-80) med alla nya fält.

**Lägg till:**
```typescript
interface SiteSettings {
  // Existing fields...
  id: string;
  siteName: string;
  siteDescription?: string;
  logo?: string;
  favicon?: string;
  maintenance: boolean;
  maintenanceMessage?: string;
  primaryColor: string;
  accentColor: string;
  discordInvite?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;

  // Security Settings
  requireEmailVerification?: boolean;
  enableTwoFactor?: boolean;
  sessionTimeout?: number;
  maxLoginAttempts?: number;
  loginLockoutDuration?: number;
  passwordMinLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSpecialChars?: boolean;
  enableRateLimiting?: boolean;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  enableCORS?: boolean;
  allowedOrigins?: string;
  enableCSRF?: boolean;
  ipWhitelist?: string;
  ipBlacklist?: string;

  // Notification Settings
  enableEmailNotifications?: boolean;
  enableDiscordNotifications?: boolean;
  enablePushNotifications?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  discordWebhookUrl?: string;
  discordBotToken?: string;
  notifyOnNewUser?: boolean;
  notifyOnNewTicket?: boolean;
  notifyOnNewNews?: boolean;
  notifyOnNewEvent?: boolean;
  notifyOnServerDown?: boolean;
  adminEmailAddresses?: string;

  // Database Settings
  enableAutoBackup?: boolean;
  backupFrequency?: string;
  backupRetentionDays?: number;
  backupLocation?: string;
  enableDatabaseOptimization?: boolean;
  optimizationSchedule?: string;
  maxDatabaseSize?: number;
  enableQueryLogging?: boolean;
  slowQueryThreshold?: number;
}
```

---

## 3. Backend Validering

**Fil:** `server/src/routes/admin.routes.ts`

### Uppgift:
Uppdatera PATCH `/settings` route (rad 503-537) med validering för nya fält.

**Lägg till i validering:**
```typescript
router.patch('/settings',
  hasPermission('admin.settings'),
  // Existing validation...
  body('siteName').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('siteDescription').optional().isString().trim().isLength({ max: 500 }),
  body('maintenance').optional().isBoolean(),
  body('maintenanceMessage').optional().isString().trim(),
  body('primaryColor').optional().isHexColor(),
  body('accentColor').optional().isHexColor(),

  // Security Settings
  body('requireEmailVerification').optional().isBoolean(),
  body('enableTwoFactor').optional().isBoolean(),
  body('sessionTimeout').optional().isInt({ min: 1, max: 168 }),
  body('maxLoginAttempts').optional().isInt({ min: 3, max: 10 }),
  body('loginLockoutDuration').optional().isInt({ min: 5, max: 1440 }),
  body('passwordMinLength').optional().isInt({ min: 6, max: 32 }),
  body('passwordRequireUppercase').optional().isBoolean(),
  body('passwordRequireLowercase').optional().isBoolean(),
  body('passwordRequireNumbers').optional().isBoolean(),
  body('passwordRequireSpecialChars').optional().isBoolean(),
  body('enableRateLimiting').optional().isBoolean(),
  body('rateLimitRequests').optional().isInt({ min: 10, max: 1000 }),
  body('rateLimitWindow').optional().isInt({ min: 1, max: 60 }),
  body('enableCORS').optional().isBoolean(),
  body('allowedOrigins').optional().isString(),
  body('enableCSRF').optional().isBoolean(),
  body('ipWhitelist').optional().isString(),
  body('ipBlacklist').optional().isString(),

  // Notification Settings
  body('enableEmailNotifications').optional().isBoolean(),
  body('enableDiscordNotifications').optional().isBoolean(),
  body('enablePushNotifications').optional().isBoolean(),
  body('smtpHost').optional().isString(),
  body('smtpPort').optional().isInt({ min: 1, max: 65535 }),
  body('smtpSecure').optional().isBoolean(),
  body('smtpUser').optional().isString(),
  body('smtpPassword').optional().isString(),
  body('emailFromAddress').optional().isEmail(),
  body('emailFromName').optional().isString(),
  body('discordWebhookUrl').optional().isString(),
  body('discordBotToken').optional().isString(),
  body('notifyOnNewUser').optional().isBoolean(),
  body('notifyOnNewTicket').optional().isBoolean(),
  body('notifyOnNewNews').optional().isBoolean(),
  body('notifyOnNewEvent').optional().isBoolean(),
  body('notifyOnServerDown').optional().isBoolean(),
  body('adminEmailAddresses').optional().isString(),

  // Database Settings
  body('enableAutoBackup').optional().isBoolean(),
  body('backupFrequency').optional().isIn(['hourly', 'daily', 'weekly', 'monthly']),
  body('backupRetentionDays').optional().isInt({ min: 1, max: 365 }),
  body('backupLocation').optional().isString(),
  body('enableDatabaseOptimization').optional().isBoolean(),
  body('optimizationSchedule').optional().isIn(['daily', 'weekly', 'monthly']),
  body('maxDatabaseSize').optional().isInt({ min: 1, max: 100 }),
  body('enableQueryLogging').optional().isBoolean(),
  body('slowQueryThreshold').optional().isInt({ min: 100, max: 10000 }),

  validate,
  async (req, res) => {
    // Existing implementation works fine since Prisma will accept all fields
  }
);
```

---

## 4. Backend Services (Framtida implementation)

Dessa services behöver skapas för att faktiskt använda inställningarna:

### 4.1 Email Service (SMTP)
**Ny fil:** `server/src/services/email.service.ts`

**Funktioner:**
- Läs SMTP-inställningar från SiteSettings
- Konfigurera nodemailer med SMTP-inställningar
- `sendEmail(to, subject, html)` - Skicka email
- `sendTestEmail()` - Test email funktion (för UI test-knapp)
- Email templates för olika händelser

**NPM-paket:**
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

### 4.2 Discord Notification Service
**Ny fil:** `server/src/services/discord.service.ts`

**Funktioner:**
- Läs Discord webhook URL från SiteSettings
- `sendDiscordNotification(message, embed)` - Skicka meddelande
- `sendTestDiscord()` - Test Discord meddelande (för UI test-knapp)
- Formatera meddelanden för olika händelser

**NPM-paket:**
```bash
npm install axios  # Använd för webhook requests
```

### 4.3 Database Backup Service
**Ny fil:** `server/src/services/backup.service.ts`

**Funktioner:**
- `createBackup()` - Skapa manuell backup (för UI "Skapa backup nu" knapp)
- `restoreBackup(filename)` - Återställ från backup (för UI "Återställ" knapp)
- `listBackups()` - Lista tillgängliga backups
- `deleteOldBackups()` - Radera backuper äldre än retention period
- Scheduler för automatiska backuper (använd `node-cron`)

**Använd:**
```bash
# PostgreSQL backup commands
pg_dump -U swedenvikings swedenvikings > backup.sql
psql -U swedenvikings swedenvikings < backup.sql
```

**NPM-paket:**
```bash
npm install node-cron
npm install --save-dev @types/node-cron
```

### 4.4 Database Optimization Service
**Ny fil:** `server/src/services/optimization.service.ts`

**Funktioner:**
- `optimizeDatabase()` - Kör VACUUM ANALYZE (för UI "Optimera databas" knapp)
- `getDatabaseStats()` - Hämta storlek, antal tabeller etc. (för UI status cards)
- `cleanOldData()` - Rensa gamla aktivitetsloggar etc. (för UI "Rensa gamla data" knapp)
- Scheduler för automatisk optimering (använd `node-cron`)

**SQL kommandon:**
```sql
-- Get database size
SELECT pg_size_pretty(pg_database_size('swedenvikings'));

-- Get table count
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Optimize
VACUUM ANALYZE;
```

### 4.5 Slow Query Logger
**Ny fil:** `server/src/middleware/queryLogger.ts`

**Funktioner:**
- Prisma middleware för att logga långsamma queries
- Kolla threshold från SiteSettings
- Spara till ActivityLog eller separat SlowQuery tabell

**Implementering:**
```typescript
// I server/src/utils/prisma.ts
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  const duration = after - before;

  const settings = await getSiteSettings();
  if (settings.enableQueryLogging && duration > settings.slowQueryThreshold) {
    // Log slow query
    console.warn(`Slow query (${duration}ms):`, params);
  }

  return result;
});
```

### 4.6 Security Middleware Updates
**Filer att uppdatera:**
- `server/src/middleware/auth.ts` - Använd sessionTimeout, maxLoginAttempts etc.
- `server/src/middleware/rateLimit.ts` - Använd rateLimitRequests och rateLimitWindow
- `server/src/app.ts` - Använd CORS allowedOrigins från settings

---

## 5. API Endpoints för manuella åtgärder

**Fil:** `server/src/routes/admin.routes.ts`

Lägg till dessa routes:

```typescript
// Test Email
router.post('/settings/test-email',
  hasPermission('admin.settings'),
  async (req, res) => {
    try {
      const emailService = new EmailService();
      await emailService.sendTestEmail();
      sendSuccess(res, { message: 'Test email sent' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Test Discord
router.post('/settings/test-discord',
  hasPermission('admin.settings'),
  async (req, res) => {
    try {
      const discordService = new DiscordService();
      await discordService.sendTestNotification();
      sendSuccess(res, { message: 'Test Discord message sent' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Create Backup
router.post('/settings/backup',
  hasPermission('admin.settings'),
  async (req, res) => {
    try {
      const backupService = new BackupService();
      const filename = await backupService.createBackup();
      sendSuccess(res, { filename });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Restore Backup
router.post('/settings/restore',
  hasPermission('admin.settings'),
  body('filename').isString(),
  validate,
  async (req, res) => {
    try {
      const backupService = new BackupService();
      await backupService.restoreBackup(req.body.filename);
      sendSuccess(res, { message: 'Backup restored' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Optimize Database
router.post('/settings/optimize',
  hasPermission('admin.settings'),
  async (req, res) => {
    try {
      const optimizationService = new OptimizationService();
      await optimizationService.optimizeDatabase();
      sendSuccess(res, { message: 'Database optimized' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Clean Old Data
router.post('/settings/clean',
  hasPermission('admin.settings'),
  async (req, res) => {
    try {
      const optimizationService = new OptimizationService();
      await optimizationService.cleanOldData();
      sendSuccess(res, { message: 'Old data cleaned' });
    } catch (error) {
      errors.serverError(res);
    }
  }
);

// Get Database Stats (för status cards)
router.get('/settings/database-stats',
  hasPermission('admin.settings'),
  async (req, res) => {
    try {
      const optimizationService = new OptimizationService();
      const stats = await optimizationService.getDatabaseStats();
      sendSuccess(res, stats);
    } catch (error) {
      errors.serverError(res);
    }
  }
);
```

---

## 6. Frontend Hook Updates

**Fil:** `client/src/hooks/useAdmin.ts`

Lägg till hooks för manuella åtgärder:

```typescript
// Test Email
export function useTestEmail() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/test-email');
      return response.data;
    },
  });
}

// Test Discord
export function useTestDiscord() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/test-discord');
      return response.data;
    },
  });
}

// Create Backup
export function useCreateBackup() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/backup');
      return response.data;
    },
  });
}

// Optimize Database
export function useOptimizeDatabase() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/admin/settings/optimize');
      return response.data;
    },
  });
}

// Get Database Stats
export function useDatabaseStats() {
  return useQuery({
    queryKey: ['admin', 'database-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/database-stats');
      return response.data.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
```

**Uppdatera:** `client/src/pages/admin/Settings.tsx` för att koppla knapparna till dessa hooks.

---

## 7. Säkerhet

### VIKTIGT - Kryptera känslig data!

**Problem:** SMTP lösenord och Discord tokens sparas i klartext i databasen.

**Lösning:** Kryptera dessa fält innan de sparas.

**Implementering:**
1. Skapa `server/src/utils/encryption.ts`:
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-me';
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

2. Lägg till i `.env`:
```bash
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

3. Använd i admin.routes.ts PATCH /settings:
```typescript
// Before saving
if (req.body.smtpPassword) {
  req.body.smtpPassword = encrypt(req.body.smtpPassword);
}
if (req.body.discordBotToken) {
  req.body.discordBotToken = encrypt(req.body.discordBotToken);
}
```

4. Dekryptera när du läser:
```typescript
// In email.service.ts
const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
const password = decrypt(settings.smtpPassword);
```

---

## 8. Notifikationssystem Integration

När services är klara, integrera dem på relevanta ställen:

### 8.1 Ny användare registrerad
**Fil:** `server/src/routes/auth.routes.ts` - Efter Steam callback

```typescript
if (settings.notifyOnNewUser) {
  if (settings.enableEmailNotifications) {
    await emailService.sendNewUserNotification(user);
  }
  if (settings.enableDiscordNotifications) {
    await discordService.sendNewUserNotification(user);
  }
}
```

### 8.2 Nytt support-ärende
**Fil:** `server/src/routes/ticket.routes.ts` - POST /tickets

```typescript
if (settings.notifyOnNewTicket) {
  await notificationService.sendNewTicketNotification(ticket);
}
```

### 8.3 Ny nyhet publicerad
**Fil:** `server/src/routes/news.routes.ts` - POST /news

```typescript
if (settings.notifyOnNewNews && newsData.isPublished) {
  await notificationService.sendNewNewsNotification(news);
}
```

### 8.4 Nytt event skapat
**Fil:** `server/src/routes/event.routes.ts` - POST /events

```typescript
if (settings.notifyOnNewEvent && eventData.isPublished) {
  await notificationService.sendNewEventNotification(event);
}
```

### 8.5 Server nere
**Fil:** `server/src/services/gameServer/GameServerManager.ts` - Vid status check

```typescript
if (serverStatus === 'offline' && settings.notifyOnServerDown) {
  await notificationService.sendServerDownNotification();
}
```

---

## Prioritering

### Fas 1 - Grundläggande (GÖR FÖRST)
1. ✅ Uppdatera Prisma schema
2. ✅ Uppdatera TypeScript interface
3. ✅ Uppdatera backend validering
4. ✅ Testa att spara/läsa settings fungerar

### Fas 2 - Email & Discord
5. Skapa Email Service
6. Skapa Discord Service
7. Lägg till test-endpoints
8. Koppla test-knappar i UI

### Fas 3 - Databas
9. Skapa Backup Service
10. Skapa Optimization Service
11. Lägg till manual action endpoints
12. Koppla knappar i UI
13. Implementera schedulers

### Fas 4 - Integration
14. Integrera notifikationer på alla relevanta ställen
15. Implementera säkerhetsinställningar (session timeout, rate limiting, etc.)
16. Implementera slow query logging

### Fas 5 - Säkerhet & Polish
17. Kryptera känslig data
18. Testa allt grundligt
19. Dokumentera

---

## Testning

Efter varje fas, testa:

1. **Fas 1:**
   - Kan spara inställningar via UI
   - Kan läsa inställningar från backend
   - Default-värden fungerar

2. **Fas 2:**
   - Test email skickas korrekt
   - Test Discord meddelande skickas
   - SMTP-konfiguration fungerar

3. **Fas 3:**
   - Manuell backup skapas
   - Backup kan återställas
   - Optimering körs utan fel
   - Stats visas korrekt i UI

4. **Fas 4:**
   - Notifikationer skickas vid rätt händelser
   - Session timeout fungerar
   - Rate limiting aktiveras/deaktiveras

5. **Fas 5:**
   - Känslig data är krypterad i DB
   - Inga lösenord i klartext
   - Allt fungerar end-to-end

---

## Framtida förbättringar

- [ ] Backup till S3/cloud storage
- [ ] Email preview innan sändning
- [ ] Discord embed customization
- [ ] Grafiska statistik för databas-användning
- [ ] Automated tests för alla services
- [ ] Health check endpoint
- [ ] Metrics dashboard (Prometheus/Grafana)
