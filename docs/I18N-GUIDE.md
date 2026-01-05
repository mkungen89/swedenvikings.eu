# 🌍 Flerspråkssystem - Sweden Vikings CMS

## Översikt

Sweden Vikings CMS har nu ett fullständigt flerspråkssystem med stöd för **Svenska (🇸🇪)** och **Engelska (🇬🇧)**.

---

## ✅ Vad har implementerats?

### 1. **i18next Integration**
- `i18next` - Översättningsramverk
- `react-i18next` - React-integration
- `i18next-browser-languagedetector` - Automatisk språkdetektering

### 2. **Översättningsfiler**
```
client/src/i18n/
├── config.ts           # i18n-konfiguration
└── locales/
    ├── sv.json        # Svenska översättningar
    └── en.json        # Engelska översättningar
```

### 3. **Språkväxlare**
- `client/src/components/common/LanguageSwitcher.tsx`
- Dropdown-meny i headern
- Visar flagga + språknamn
- Sparar valet i localStorage

### 4. **Översatta sektioner**
- ✅ Navigation (Header)
- ✅ Cookie Consent Banner
- ✅ Settings Page
- ✅ GDPR Settings
- ✅ Profile
- ✅ Common UI (knappar, meddelanden, etc.)

---

## 🚀 Hur du använder översättningar

### I React-komponenter:

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Översättningsnycklar:

Översättningar är organiserade i kategorier:

```json
{
  "common": { ... },      // Vanliga ord (save, cancel, etc.)
  "nav": { ... },         // Navigation
  "auth": { ... },        // Autentisering
  "profile": { ... },     // Profil
  "settings": { ... },    // Inställningar
  "gdpr": { ... },        // GDPR/Privacy
  "cookie": { ... },      // Cookie Consent
  "notifications": { ... } // Toast-meddelanden
}
```

### Exempel:

```typescript
// Vanlig översättning
<button>{t('common.save')}</button>
// Output: "Spara" (sv) eller "Save" (en)

// Navigation
<Link>{t('nav.home')}</Link>
// Output: "Hem" (sv) eller "Home" (en)

// Settings
<h1>{t('settings.title')}</h1>
// Output: "Inställningar" (sv) eller "Settings" (en)
```

---

## 📝 Lägga till nya översättningar

### Steg 1: Lägg till i både sv.json och en.json

**sv.json:**
```json
{
  "myPage": {
    "title": "Min Titel",
    "description": "Min beskrivning"
  }
}
```

**en.json:**
```json
{
  "myPage": {
    "title": "My Title",
    "description": "My description"
  }
}
```

### Steg 2: Använd i komponenten

```typescript
function MyPage() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('myPage.title')}</h1>
      <p>{t('myPage.description')}</p>
    </div>
  );
}
```

---

## 🔄 Byta språk programmatiskt

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { i18n } = useTranslation();

  const changeToEnglish = () => {
    i18n.changeLanguage('en');
  };

  const changeToSwedish = () => {
    i18n.changeLanguage('sv');
  };

  return (
    <div>
      <button onClick={changeToSwedish}>Svenska</button>
      <button onClick={changeToEnglish}>English</button>
    </div>
  );
}
```

---

## ⚙️ Konfiguration

### Standardspråk:
- **Fallback:** Svenska (`sv`)
- **Autodetektering:** Ja (baserat på webbläsare eller localStorage)

### Språkprioritet:
1. Användarens val (sparas i localStorage)
2. Webbläsarens språk
3. Fallback till Svenska

### Ändra standardspråk:

I `client/src/i18n/config.ts`:

```typescript
i18n.init({
  // ...
  fallbackLng: 'en',  // Ändra till English
  lng: 'en',          // Default till English
});
```

---

## 🎯 Tillgängliga översättningar

### Common (common.*)
- `loading`, `save`, `cancel`, `delete`, `edit`, `create`
- `search`, `filter`, `close`, `back`, `next`, `previous`
- `submit`, `confirm`, `yes`, `no`, `or`, `and`

### Navigation (nav.*)
- `home`, `news`, `events`, `rules`, `clans`
- `leaderboards`, `profile`, `settings`, `admin`
- `login`, `logout`

### Settings (settings.*)
- `title`, `profile`, `notifications`, `appearance`, `language`
- `avatar`, `banner`, `username`, `bio`
- `theme`, `saveChanges`, `saving`

### GDPR (gdpr.*)
- `cookieSettings`, `downloadData`, `deleteAccount`
- `privacyPolicy`, `termsOfService`
- Och många fler...

### Notifications (notifications.*)
- `profileUpdated`, `settingsSaved`
- `avatarUpdated`, `bannerUpdated`
- `errorSaving`, `errorUploading`

---

## 🌐 Lägga till fler språk

### Steg 1: Skapa översättningsfil

Skapa `client/src/i18n/locales/de.json` (för tyska):

```json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen"
  }
}
```

### Steg 2: Registrera språket

I `client/src/i18n/config.ts`:

```typescript
import de from './locales/de.json';

const resources = {
  sv: { translation: sv },
  en: { translation: en },
  de: { translation: de },  // Lägg till här
};
```

### Steg 3: Uppdatera LanguageSwitcher

I `client/src/components/common/LanguageSwitcher.tsx`:

```typescript
const languages: Language[] = [
  { code: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },  // Lägg till här
];
```

---

## 🔗 Integration med användarinställningar

Språkvalet sparas automatiskt i **localStorage** och synkas med i18n.

För att senare koppla ihop med användarens databasprofil:

```typescript
// När användaren ändrar språk i Settings
const handleLanguageChange = async (language: string) => {
  // Uppdatera i18n
  i18n.changeLanguage(language);

  // Uppdatera i databas
  await updateSettings.mutateAsync({ language });
};

// Vid inloggning, sätt användarens sparade språk
useEffect(() => {
  if (user?.language) {
    i18n.changeLanguage(user.language);
  }
}, [user]);
```

---

## 📋 Best Practices

1. **Använd tydliga nycklar**
   ```typescript
   // Bra
   t('settings.profile.avatar.change')

   // Undvik
   t('btn1')
   ```

2. **Gruppera logiskt**
   ```json
   {
     "profile": {
       "general": { ... },
       "privacy": { ... },
       "security": { ... }
     }
   }
   ```

3. **Håll översättningar synkade**
   - Alla nycklar i `sv.json` ska finnas i `en.json`
   - Använd samma struktur i alla språkfiler

4. **Testning**
   - Testa båda språken regelbundet
   - Kontrollera att alla texter översätts korrekt

---

## 🐛 Troubleshooting

### Översättning visas inte?
```typescript
// Kontrollera att nyckeln finns
console.log(t('myKey')); // Visar nyckeln om den inte finns

// Kontrollera aktuellt språk
console.log(i18n.language); // Visar "sv" eller "en"
```

### Språkbytet fungerar inte?
```typescript
// Verifiera att localStorage uppdateras
localStorage.getItem('i18nextLng'); // Ska vara "sv" eller "en"

// Forced språkbyte
i18n.changeLanguage('sv', () => {
  console.log('Language changed to Swedish');
});
```

### Översättning laddas inte i komponenten?
```typescript
// Se till att du använder useTranslation hook
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  // Nu fungerar t() och i18n
}
```

---

## 📊 Status

**Implementerat:**
- ✅ i18next setup
- ✅ Svenska översättningar
- ✅ Engelska översättningar
- ✅ Språkväxlare i header
- ✅ localStorage persistence
- ✅ Automatisk språkdetektering
- ✅ Navigation översatt
- ✅ Cookie Consent översatt
- ✅ Settings översatt
- ✅ GDPR Settings översatt

**Att göra (valfritt):**
- [ ] Översätt alla sidor (News, Events, etc.)
- [ ] Synka med användarprofil i databas
- [ ] Lägg till fler språk (tyska, franska, etc.)
- [ ] RTL-stöd (arabiska, hebreiska)
- [ ] Pluralisering (`t('items', { count: 5 })`)

---

## 🎉 Användning

Öppna http://localhost:5174 och:
1. Klicka på flaggan/globen i headern
2. Välj språk
3. Hela sidan uppdateras direkt!

**Språket sparas** och kommer ihåg nästa gång du besöker sidan.

---

**Utvecklare:** Claude Sonnet 4.5 🤖
**Datum:** 2025-12-31
