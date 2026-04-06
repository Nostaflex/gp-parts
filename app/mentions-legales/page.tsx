import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de GP Parts, pièces détachées en Guadeloupe.',
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-overline uppercase text-basalt/50 mb-2">Informations légales</p>
      <h1 className="font-title text-h1 text-basalt mb-8">Mentions légales</h1>

      <div className="prose-custom space-y-8 text-body text-basalt/80">
        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Éditeur du site</h2>
          <p>
            GP Parts SARL — Pièces détachées auto et moto en Guadeloupe.
            <br />
            Adresse : Zone industrielle de Jarry, 97122 Baie-Mahault, Guadeloupe.
            <br />
            SIRET : 000 000 000 00000 (à compléter).
            <br />
            Email : contact@gpparts.gp — Téléphone : +590 590 00 00 00.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Directeur de la publication</h2>
          <p>Le représentant légal de GP Parts SARL.</p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Hébergement</h2>
          <p>Ce site est hébergé sur Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble du contenu du site (textes, images, logos, marques) est la propriété
            exclusive de GP Parts ou de ses partenaires. Toute reproduction sans autorisation
            préalable est interdite.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Données personnelles</h2>
          <p>
            Le traitement de vos données personnelles est décrit dans notre{' '}
            <a href="/confidentialite" className="text-volcanic underline">
              politique de confidentialité
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
