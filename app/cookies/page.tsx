import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique cookies',
  description: 'Gestion des cookies et traceurs sur GP Parts.',
};

export default function CookiesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-overline uppercase text-basalt/50 mb-2">Traceurs</p>
      <h1 className="font-title text-h1 text-basalt mb-8">Politique cookies</h1>

      <div className="space-y-8 text-body text-basalt/80">
        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">
            Qu&apos;est-ce qu&apos;un cookie ?
          </h2>
          <p>
            Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite sur
            un site web. Il permet de mémoriser certaines informations pour faciliter votre
            navigation ou mesurer l&apos;audience.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Cookies essentiels</h2>
          <p>
            Ces cookies sont indispensables au fonctionnement du site : gestion du panier, session,
            sécurité. Ils ne peuvent pas être désactivés.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Cookies analytiques</h2>
          <p>
            Avec votre consentement, nous utilisons des outils d&apos;analyse anonymisée pour
            comprendre l&apos;usage du site et l&apos;améliorer.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Cookies marketing</h2>
          <p>
            Avec votre consentement, nous pouvons utiliser des cookies pour personnaliser nos offres
            et mesurer l&apos;efficacité de nos campagnes.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Gérer mes préférences</h2>
          <p>
            Vous pouvez à tout moment modifier vos préférences cookies en supprimant le cookie de
            consentement de votre navigateur ou en nous contactant directement.
          </p>
        </section>
      </div>
    </div>
  );
}
