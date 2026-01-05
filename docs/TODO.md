# Sweden Vikings CMS - TODO

## Prioritet: Hög

### Community & Sociala funktioner
- [ ] Forum/Diskussionssystem - Plats för medlemmar att diskutera utanför Discord
- [ ] Kommentarssystem på nyheter och events
- [ ] Direktmeddelanden mellan användare
- [ ] Vänlista/följarsystem
- [ ] Notifikationscenter med historik

### Spelrelaterat
- [ ] Match/Event-registrering med bekräftelse och deltagarlistor
- [ ] Statistikspårning från Arma Reforger (kills, playtime, missions, etc.)
- [ ] Leaderboards för spelarprestationer
- [ ] Mod-röstningssystem - Låt communityn rösta på mods

### Administration
- [ ] Ban-system med historik och överklaganden
- [ ] Utökad audit trail för alla admin-åtgärder
- [ ] Health monitoring med Discord/email alerts vid servercrash
- [ ] Automatiska backups med notifiering vid misslyckande
- [ ] Admin-dashboard med systemstatistik (CPU, RAM, disk)

---

## Prioritet: Medium

### Användarupplevelse
- [ ] Tema-växlare (mörkt/ljust tema)
- [ ] PWA-stöd med push-notifikationer
- [ ] Granulära notifikationsinställningar per användare
- [ ] Internationalisering (i18n) - Engelska språkstöd
- [ ] Förbättrad mobilanpassning

### Säkerhet & Compliance
- [ ] GDPR-hantering - Exportera och radera användardata
- [ ] 2FA för administratörer
- [ ] Content Security Policy (CSP) headers
- [ ] Utökad rate limiting per endpoint
- [ ] Session-hantering med "logga ut från alla enheter"

### Media & Innehåll
- [ ] Screenshot/Replay galleri
- [ ] Video-embedding stöd (YouTube, Twitch clips)
- [ ] Filuppladdning för events och nyheter
- [ ] Bildoptimering och lazy loading

---

## Prioritet: Låg

### Integration
- [ ] Discord bot-integration (synka roller, announcements)
- [ ] Twitch-integration (visa live streams)
- [ ] Steam Workshop-integration för mods
- [ ] Webhooks för externa tjänster

### Avancerat
- [ ] API-dokumentation (Swagger/OpenAPI)
- [ ] GraphQL API som alternativ till REST
- [ ] Caching-strategi med Redis
- [ ] Sökfunktion med Elasticsearch/Meilisearch
- [ ] A/B-testning för nya features

### DevOps
- [ ] Staging-miljö
- [ ] Automatiserade E2E-tester (Playwright/Cypress)
- [ ] Performance monitoring (Application Performance Monitoring)
- [ ] Log aggregation (centraliserad logghantering)
- [ ] Database migrations automatisering i CI/CD

---

## Genomfört

- [x] Steam-autentisering
- [x] Användarhantering med roller och behörigheter
- [x] Nyheter och events
- [x] Clan-system
- [x] Support ticket-system
- [x] Arma Reforger serverhantering
- [x] Mod-hantering
- [x] RCON-integration
- [x] Live serverloggar via Socket.io
- [x] Docker-baserad utvecklingsmiljö
- [x] PM2 produktionsmiljö
- [x] Nginx reverse proxy setup
- [x] GitHub Actions CI/CD pipeline

---

## Anteckningar

- Prioritera community-funktioner för att öka engagemang
- GDPR är juridiskt krav - bör implementeras snarast
- Statistikspårning kräver integration med Arma Reforger server logs
- Discord-integration kan automatisera mycket manuellt arbete
