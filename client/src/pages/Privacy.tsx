import { motion } from 'framer-motion';
import { Shield, Database, Cookie, Share2, Lock, UserCheck, HardDrive, AlertTriangle, Mail, Calendar } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-600/20 mb-6">
              <Shield className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-4">Integritetspolicy</h1>
            <p className="text-gray-400">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-600/10 border border-green-600/20 rounded-lg text-sm text-green-400">
              <UserCheck className="w-4 h-4" />
              GDPR-kompatibel
            </div>
          </div>

          {/* Content */}
          <div className="card p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary-400" />
                1. Introduktion
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Sweden Vikings ("vi", "oss", "vår") respekterar din integritet och är engagerade i att skydda
                dina personuppgifter. Denna integritetspolicy förklarar hur vi samlar in, använder, lagrar och
                skyddar din information när du använder vår webbplats och tjänster.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Vi följer EU:s allmänna dataskyddsförordning (GDPR) och annan tillämplig dataskyddslagstiftning.
                Genom att använda våra tjänster samtycker du till denna policy.
              </p>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Database className="w-6 h-6 text-primary-400" />
                2. Vilken data vi samlar in
              </h2>

              <div className="space-y-4">
                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">2.1 Information från Steam</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    När du loggar in via Steam OpenID samlar vi in:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Steam ID (permanent identifierare)</li>
                    <li>Steam användarnamn</li>
                    <li>Profilbild från Steam</li>
                    <li>Offentlig profilinformation (om tillgänglig)</li>
                  </ul>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">2.2 Profilinformation</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Information du frivilligt tillhandahåller:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Användarnamn (kan ändras)</li>
                    <li>Bio/beskrivning</li>
                    <li>Profilbild och banner (om du laddar upp egna)</li>
                    <li>E-postadress (frivillig)</li>
                    <li>Discord-länkning (frivillig)</li>
                  </ul>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">2.3 Aktivitetsdata</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Vi loggar automatiskt:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Inloggnings- och aktivitetstidpunkter</li>
                    <li>IP-adress (för säkerhet och bedrägeribekämpning)</li>
                    <li>Enhetstyp och webbläsarinformation</li>
                    <li>Sidvisningar och klickbeteende</li>
                    <li>Spelarstatistik från Arma Reforger-servern</li>
                  </ul>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">2.4 Innehåll du skapar</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    När du använder våra funktioner:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Kommentarer på nyheter och events</li>
                    <li>Forum-inlägg och diskussioner</li>
                    <li>Support-ärenden och meddelanden</li>
                    <li>Clan-relaterat innehåll</li>
                    <li>Uppladdade bilder och filer</li>
                  </ul>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">2.5 Speldata</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Från våra Arma Reforger-servrar:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Speltid och sessioner</li>
                    <li>Prestationer och medaljer</li>
                    <li>Statistik (kills, deaths, score, etc.)</li>
                    <li>Progression och nivåer</li>
                    <li>Serveranslutningar</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Data */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <HardDrive className="w-6 h-6 text-primary-400" />
                3. Hur vi använder din data
              </h2>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Tillhandahålla våra tjänster</h4>
                    <p className="text-sm text-gray-400">
                      Skapa och hantera ditt konto, visa dina spelstatistik, leverera personaliserat innehåll
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Kommunikation</h4>
                    <p className="text-sm text-gray-400">
                      Skicka notifikationer om events, uppdateringar, svar på support-ärenden
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Säkerhet och bedrägeribekämpning</h4>
                    <p className="text-sm text-gray-400">
                      Upptäcka och förhindra missbruk, cheating, spam och olaglig aktivitet
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Förbättra tjänsten</h4>
                    <p className="text-sm text-gray-400">
                      Analysera användningsmönster för att förbättra funktioner och användarupplevelse
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary-400 mt-2 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium mb-1">Efterleva juridiska krav</h4>
                    <p className="text-sm text-gray-400">
                      Uppfylla rättsliga skyldigheter och hantera tvister
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary-600/10 border border-primary-600/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-300">
                  <strong>Rättslig grund (GDPR):</strong> Vi behandlar dina personuppgifter baserat på:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mt-2">
                  <li>Ditt samtycke (artikel 6.1.a)</li>
                  <li>Fullgörande av avtal (artikel 6.1.b)</li>
                  <li>Berättigat intresse för säkerhet och tjänsteförbättring (artikel 6.1.f)</li>
                </ul>
              </div>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Cookie className="w-6 h-6 text-primary-400" />
                4. Cookies och liknande teknologier
              </h2>

              <p className="text-gray-300 leading-relaxed mb-4">
                Vi använder cookies och liknande teknologier för att förbättra din upplevelse. Du kan
                hantera dina cookie-preferenser i{' '}
                <a href="/settings" className="text-primary-400 hover:underline">
                  inställningar
                </a>
                .
              </p>

              <div className="space-y-3">
                <div className="bg-background-darker p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Nödvändiga cookies</h3>
                    <span className="text-xs px-2 py-0.5 bg-green-600/20 text-green-400 rounded">
                      Krävs alltid
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Session-hantering, autentisering, säkerhet. Kan inte inaktiveras.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Funktionella cookies</h3>
                    <span className="text-xs px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded">
                      Kan inaktiveras
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Sparar dina preferenser (språk, tema, notifikationsinställningar).
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Analys-cookies</h3>
                    <span className="text-xs px-2 py-0.5 bg-primary-600/20 text-primary-400 rounded">
                      Kan inaktiveras
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Hjälper oss förstå hur du använder webbplatsen (sidvisningar, populärt innehåll).
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Share2 className="w-6 h-6 text-primary-400" />
                5. Delning av data
              </h2>

              <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">
                    <strong>Vi säljer ALDRIG din personliga information till tredje part.</strong>
                  </p>
                </div>
              </div>

              <p className="text-gray-300 leading-relaxed mb-4">
                Vi kan dela begränsad information i följande situationer:
              </p>

              <div className="space-y-3">
                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Med andra spelare</h3>
                  <p className="text-sm text-gray-400">
                    Din offentliga profilinformation (användarnamn, avatar, bio, statistik) visas för
                    andra användare. Du kan göra din profil privat i inställningar.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Tjänsteleverantörer</h3>
                  <p className="text-sm text-gray-400">
                    Vi använder betrodda leverantörer för hosting (VPS), databaser (PostgreSQL),
                    e-post-tjänster och CDN. De har endast tillgång till data som krävs för att
                    utföra sina tjänster.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Juridiska krav</h3>
                  <p className="text-sm text-gray-400">
                    Vi kan dela information om det krävs enligt lag, domstolsbeslut eller
                    myndighetskrav.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Säkerhet och efterlevnad</h3>
                  <p className="text-sm text-gray-400">
                    För att skydda mot bedrägeri, missbruk eller säkerhetshot kan vi dela
                    nödvändig information med behöriga myndigheter.
                  </p>
                </div>
              </div>
            </section>

            {/* User Rights (GDPR) */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <UserCheck className="w-6 h-6 text-primary-400" />
                6. Dina rättigheter (GDPR)
              </h2>

              <p className="text-gray-300 leading-relaxed mb-4">
                Enligt GDPR har du följande rättigheter:
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Rätt till tillgång (Artikel 15)</h4>
                    <p className="text-sm text-gray-400">
                      Du kan när som helst begära en kopia av all din data. Gå till{' '}
                      <a href="/settings" className="text-primary-400 hover:underline">
                        Inställningar → Integritet
                      </a>{' '}
                      och klicka på "Ladda ner min data".
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Rätt till rättelse (Artikel 16)</h4>
                    <p className="text-sm text-gray-400">
                      Du kan redigera din profilinformation i{' '}
                      <a href="/settings" className="text-primary-400 hover:underline">
                        Inställningar
                      </a>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Rätt till radering (Artikel 17)</h4>
                    <p className="text-sm text-gray-400">
                      Du kan permanent radera ditt konto och all associerad data i{' '}
                      <a href="/settings" className="text-primary-400 hover:underline">
                        Inställningar → Integritet → Radera konto
                      </a>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Rätt till dataportabilitet (Artikel 20)</h4>
                    <p className="text-sm text-gray-400">
                      Du kan exportera din data i ett maskinläsbart format (JSON).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Rätt att återkalla samtycke (Artikel 7)</h4>
                    <p className="text-sm text-gray-400">
                      Du kan när som helst återkalla cookie-samtycke och andra preferenser i{' '}
                      <a href="/settings" className="text-primary-400 hover:underline">
                        Inställningar
                      </a>
                      .
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">6</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Rätt att göra invändningar (Artikel 21)</h4>
                    <p className="text-sm text-gray-400">
                      Du kan invända mot viss databehandling, t.ex. marknadsföring eller profilering.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary-400">7</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Rätt att klaga (Artikel 77)</h4>
                    <p className="text-sm text-gray-400">
                      Du kan lämna in klagomål till Datainspektionen (
                      <a
                        href="https://www.imy.se"
                        className="text-primary-400 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        www.imy.se
                      </a>
                      ) om du anser att vi hanterar din data felaktigt.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Storage */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary-400" />
                7. Datalagring och retention
              </h2>

              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Vi lagrar din data endast så länge det är nödvändigt för att tillhandahålla våra
                  tjänster eller uppfylla juridiska krav:
                </p>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Aktiva konton</h3>
                  <p className="text-sm text-gray-400">
                    Din data lagras så länge ditt konto är aktivt.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Inaktiva konton</h3>
                  <p className="text-sm text-gray-400">
                    Om du inte loggar in på 3 år kan vi radera ditt konto efter förvarning via e-post
                    (om tillgänglig).
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Raderade konton</h3>
                  <p className="text-sm text-gray-400">
                    När du raderar ditt konto tas all personlig data bort inom 30 dagar. Viss
                    anonymiserad data (t.ex. statistik) kan behållas för analytiska ändamål.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Loggar och säkerhet</h3>
                  <p className="text-sm text-gray-400">
                    Säkerhetsloggar (IP-adresser, inloggningsförsök) sparas i 90 dagar.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Backup</h3>
                  <p className="text-sm text-gray-400">
                    Säkerhetskopior av databasen behålls i 30 dagar och raderas därefter automatiskt.
                  </p>
                </div>
              </div>

              <div className="bg-background-darker p-4 rounded-lg mt-4">
                <p className="text-sm text-gray-300">
                  <strong>Datalagring:</strong> All data lagras på säkra servrar inom EU (Sverige).
                  Vi överför inte data utanför EU/EES utan lämpliga skyddsåtgärder.
                </p>
              </div>
            </section>

            {/* Security */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-6 h-6 text-primary-400" />
                8. Datasäkerhet
              </h2>

              <p className="text-gray-300 leading-relaxed mb-4">
                Vi vidtar omfattande säkerhetsåtgärder för att skydda din data:
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">🔐 Kryptering</h3>
                  <p className="text-xs text-gray-400">
                    HTTPS/TLS för all kommunikation, krypterade lösenord med bcrypt
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">🛡️ Brandvägg</h3>
                  <p className="text-xs text-gray-400">
                    Serverbrandvägg (UFW) och DDoS-skydd
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">🔒 Åtkomstkontroll</h3>
                  <p className="text-xs text-gray-400">
                    Rollbaserade behörigheter, 2FA för admin-konton
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">💾 Backup</h3>
                  <p className="text-xs text-gray-400">
                    Dagliga automatiska säkerhetskopior med kryptering
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">📊 Övervakning</h3>
                  <p className="text-xs text-gray-400">
                    Realtidsövervakning av säkerhetshot och misstänkt aktivitet
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-sm">🔄 Uppdateringar</h3>
                  <p className="text-xs text-gray-400">
                    Regelbundna säkerhetsuppdateringar av all mjukvara
                  </p>
                </div>
              </div>

              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mt-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-300 mb-2">
                      <strong>Dataintrång:</strong> Om ett dataintrång skulle inträffa kommer vi:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                      <li>Omedelbart meddela berörda användare inom 72 timmar</li>
                      <li>Rapportera till Datainspektionen enligt GDPR-krav</li>
                      <li>Vidta åtgärder för att minimera skador</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Children */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                9. Barn och GDPR
              </h2>
              <div className="bg-background-darker p-4 rounded-lg">
                <p className="text-gray-300 leading-relaxed mb-3">
                  Vår tjänst är öppen för användare från 13 år och uppåt. Vi samlar inte medvetet
                  in information från barn under 13 år.
                </p>
                <p className="text-sm text-gray-400">
                  Om du är förälder och upptäcker att ditt barn under 13 år har skapat ett konto,
                  vänligen kontakta oss så raderar vi kontot omedelbart.
                </p>
              </div>
            </section>

            {/* Policy Changes */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                10. Ändringar av policyn
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Vi kan uppdatera denna integritetspolicy från tid till annan för att återspegla
                förändringar i vår praxis eller juridiska krav.
              </p>
              <div className="bg-background-darker p-4 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Vid väsentliga ändringar kommer vi att:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  <li>Meddela dig via e-post (om du har angett en)</li>
                  <li>Visa en notifikation på webbplatsen</li>
                  <li>Uppdatera "Senast uppdaterad"-datumet överst</li>
                  <li>Ge dig möjlighet att granska ändringarna innan de träder i kraft</li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary-400" />
                11. Kontakt och dataskyddsombud
              </h2>
              <div className="bg-background-darker p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  För frågor om integritet, GDPR-rättigheter eller datahantering, kontakta oss:
                </p>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <strong>E-post:</strong>{' '}
                    <a
                      href="mailto:privacy@swedenvikings.eu"
                      className="text-primary-400 hover:underline"
                    >
                      privacy@swedenvikings.eu
                    </a>
                  </p>
                  <p className="text-gray-300">
                    <strong>Support:</strong>{' '}
                    <a
                      href="mailto:support@swedenvikings.eu"
                      className="text-primary-400 hover:underline"
                    >
                      support@swedenvikings.eu
                    </a>
                  </p>
                  <p className="text-gray-300">
                    <strong>Discord:</strong>{' '}
                    <a
                      href="https://discord.gg/swedenvikings"
                      className="text-primary-400 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      discord.gg/swedenvikings
                    </a>
                  </p>
                </div>
                <p className="text-sm text-gray-400 mt-4">
                  Vi strävar efter att svara på alla förfrågningar inom 30 dagar enligt GDPR-krav.
                </p>
              </div>
            </section>

            {/* Summary Box */}
            <div className="bg-primary-600/10 border border-primary-600/20 rounded-lg p-6 mt-8">
              <h3 className="font-display text-lg font-semibold mb-4">Sammanfattning</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">✅ Vi GÖR:</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Skydda din data med kryptering</li>
                    <li>• Ge dig full kontroll över din data</li>
                    <li>• Följa GDPR till punkt och pricka</li>
                    <li>• Vara transparenta om vad vi gör</li>
                    <li>• Endast samla nödvändig data</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm">❌ Vi GÖR INTE:</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    <li>• Säljer din data till tredje part</li>
                    <li>• Delar data utan ditt samtycke</li>
                    <li>• Spåra dig över internet</li>
                    <li>• Samlar mer data än nödvändigt</li>
                    <li>• Döljer vår datahantering</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3 pt-6 border-t border-white/5">
              <a href="/settings" className="btn-primary text-sm">
                Hantera dina inställningar
              </a>
              <a href="/terms" className="btn-secondary text-sm">
                Läs användarvillkor
              </a>
              <a
                href="https://www.imy.se"
                className="btn-secondary text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Datainspektionen
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
