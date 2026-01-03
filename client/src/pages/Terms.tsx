import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Ban, Shield } from 'lucide-react';

export default function Terms() {
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
              <FileText className="w-8 h-8 text-primary-400" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-4">Användarvillkor</h1>
            <p className="text-gray-400">
              Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}
            </p>
          </div>

          {/* Content */}
          <div className="card p-8 space-y-8">
            {/* Acceptance */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                1. Acceptans av villkor
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Genom att registrera ett konto, använda vår webbplats eller delta i våra
                tjänster accepterar du dessa användarvillkor. Om du inte accepterar villkoren,
                vänligen använd inte våra tjänster.
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">2. Våra tjänster</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Sweden Vikings tillhandahåller:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Gaming community-plattform</li>
                <li>Spelserverhantering (Arma Reforger)</li>
                <li>Forum och social interaktion</li>
                <li>Event-hantering</li>
                <li>Spelstatistik och prestationer</li>
                <li>Support-system</li>
              </ul>
            </section>

            {/* Account */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">3. Användarkonto</h2>
              <div className="space-y-4">
                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">3.1 Registrering</h3>
                  <p className="text-sm text-gray-400">
                    Du måste vara minst 13 år för att skapa ett konto. Du registrerar dig via
                    Steam OpenID och är ansvarig för att hålla din Steam-inloggning säker.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">3.2 Ansvar för konto</h3>
                  <p className="text-sm text-gray-400">
                    Du är ansvarig för all aktivitet som sker via ditt konto. Dela aldrig ditt
                    konto med andra. Meddela oss omedelbart om du misstänker obehörig åtkomst.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">3.3 Användarnamn och profil</h3>
                  <p className="text-sm text-gray-400">
                    Du får inte använda användarnamn eller profilinnehåll som är stötande,
                    rasistiskt, hotfullt eller kränkande.
                  </p>
                </div>
              </div>
            </section>

            {/* Code of Conduct */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary-400" />
                4. Uppförandekod
              </h2>
              <div className="bg-red-600/10 border border-red-600/20 rounded-lg p-4 mb-4">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-400 mb-2">Förbjudet beteende</h3>
                    <p className="text-sm text-gray-300 mb-3">
                      Följande beteenden är INTE tillåtna och kan leda till avstängning:
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Trakasserier och hat</h4>
                    <p className="text-sm text-gray-400">
                      Trakasserier, hotelser, rasism, sexism eller annan diskriminering
                      tolereras inte.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Fusk och exploits</h4>
                    <p className="text-sm text-gray-400">
                      Användning av cheats, hacks, exploits eller annan otillåten mjukvara är
                      förbjudet.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Spam och bedrägeri</h4>
                    <p className="text-sm text-gray-400">
                      Spam, phishing, scam eller andra bedrägliga aktiviteter är förbjudna.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Olagligt innehåll</h4>
                    <p className="text-sm text-gray-400">
                      Delning av olagligt material, piratkopierat innehåll eller material som
                      bryter mot upphovsrätt.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ban className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Sabotage</h4>
                    <p className="text-sm text-gray-400">
                      Försök att störa, sabotera eller överbelasta våra system eller tjänster.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Content */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                5. Användarskapat innehåll
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  När du laddar upp innehåll (bilder, text, kommentarer etc.):
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-2">
                  <li>Du behåller äganderätten till ditt innehåll</li>
                  <li>
                    Du ger oss rätt att visa och distribuera innehållet på vår plattform
                  </li>
                  <li>Du garanterar att du har rätt att dela innehållet</li>
                  <li>Du ansvarar för att innehållet inte bryter mot lagar eller rättigheter</li>
                  <li>Vi förbehåller oss rätten att ta bort olämpligt innehåll</li>
                </ul>
              </div>
            </section>

            {/* Moderation */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                6. Moderering och påföljder
              </h2>
              <div className="space-y-4">
                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Varningar</h3>
                  <p className="text-sm text-gray-400">
                    Första gången du bryter mot reglerna kan du få en varning.
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Temporär avstängning</h3>
                  <p className="text-sm text-gray-400">
                    Upprepad eller allvarlig regelbrytning kan leda till temporär avstängning
                    (1-30 dagar).
                  </p>
                </div>

                <div className="bg-background-darker p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Permanent ban</h3>
                  <p className="text-sm text-gray-400">
                    Grova överträdelser (hot, fusk, illegal aktivitet) kan leda till permanent
                    uteslutning.
                  </p>
                </div>

                <p className="text-sm text-gray-400 italic">
                  * Vi förbehåller oss rätten att vidta åtgärder efter eget gottfinnande för
                  att upprätthålla en säker och positiv community.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                7. Immateriella rättigheter
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Allt innehåll på Sweden Vikings (design, logotyper, kod, grafik) ägs av oss
                eller våra licensgivare och skyddas av upphovsrättslagar. Du får inte:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Kopiera eller reproducera vårt innehåll utan tillstånd</li>
                <li>Använda våra varumärken eller logotyper</li>
                <li>Reverse-engineera eller dekompilera vår mjukvara</li>
                <li>Skapa härledda verk baserade på vår plattform</li>
              </ul>
            </section>

            {/* Liability */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">8. Ansvarsbegränsning</h2>
              <div className="bg-yellow-600/10 border border-yellow-600/20 rounded-lg p-4">
                <p className="text-sm text-gray-300 leading-relaxed">
                  Sweden Vikings tillhandahålls "som den är" utan garantier av något slag. Vi
                  ansvarar inte för:
                </p>
                <ul className="list-disc list-inside text-gray-300 space-y-1 mt-3 text-sm">
                  <li>Förlust av data eller spelframsteg</li>
                  <li>Driftstopp eller tekniska problem</li>
                  <li>Åtgärder från andra användare</li>
                  <li>Indirekta skador eller följdskador</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">9. Avslut av tjänst</h2>
              <p className="text-gray-300 leading-relaxed">
                Du kan när som helst avsluta ditt konto genom att radera det i dina
                inställningar. Vi förbehåller oss rätten att stänga av eller ta bort konton
                som bryter mot dessa villkor, utan förvarning eller återbetalning.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">
                10. Ändringar av villkor
              </h2>
              <p className="text-gray-300 leading-relaxed">
                Vi kan uppdatera dessa villkor från tid till annan. Väsentliga ändringar
                meddelas via e-post eller notis på webbplatsen. Fortsatt användning efter
                ändringar innebär att du accepterar de nya villkoren.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">11. Tillämplig lag</h2>
              <p className="text-gray-300 leading-relaxed">
                Dessa villkor regleras av svensk lag. Eventuella tvister ska lösas i svensk
                domstol.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="font-display text-2xl font-semibold mb-4">12. Kontakt</h2>
              <div className="bg-background-darker p-6 rounded-lg">
                <p className="text-gray-300 mb-4">
                  Frågor om användarvillkoren? Kontakta oss:
                </p>
                <div className="space-y-2">
                  <p className="text-gray-300">
                    <strong>E-post:</strong>{' '}
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
              </div>
            </section>

            {/* Acceptance Notice */}
            <div className="bg-primary-600/10 border border-primary-600/20 rounded-lg p-6 mt-8">
              <p className="text-sm text-gray-300">
                <strong>Genom att använda Sweden Vikings bekräftar du att:</strong>
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-1 mt-3 text-sm">
                <li>Du har läst och förstått dessa användarvillkor</li>
                <li>Du accepterar att följa våra regler och riktlinjer</li>
                <li>Du är minst 13 år gammal</li>
                <li>
                  Du har läst vår{' '}
                  <a href="/privacy" className="text-primary-400 hover:underline">
                    integritetspolicy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
