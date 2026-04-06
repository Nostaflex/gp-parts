import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'CGV de GP Parts, pièces détachées auto et moto en Guadeloupe.',
};

export default function CgvPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-overline uppercase text-basalt/50 mb-2">Conditions</p>
      <h1 className="font-title text-h1 text-basalt mb-8">Conditions générales de vente</h1>

      <div className="space-y-8 text-body text-basalt/80">
        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">1. Objet</h2>
          <p>
            Les présentes conditions régissent les ventes de pièces détachées réalisées par GP Parts
            auprès de ses clients en Guadeloupe.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">2. Commandes</h2>
          <p>
            Toute commande passée sur le site implique l&apos;acceptation sans réserve des présentes
            CGV. La validation finale de la commande par le client vaut engagement ferme.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">3. Prix et paiement</h2>
          <p>
            Les prix sont indiqués en euros TTC. Le paiement est effectué en ligne au moment de la
            commande. GP Parts accepte les cartes bancaires principales via une plateforme
            sécurisée.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">4. Livraison et retrait</h2>
          <p>
            Livraison en Guadeloupe sous 24 à 48h ouvrées (5 € forfaitaire), ou retrait gratuit en
            boutique à Baie-Mahault sous 24h.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">5. Droit de rétractation</h2>
          <p>
            Conformément à l&apos;article L221-18 du Code de la consommation, le client dispose
            d&apos;un délai de 14 jours à compter de la réception pour retourner un produit, sous
            réserve que celui-ci soit dans son état d&apos;origine.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">6. Garantie</h2>
          <p>
            Tous les produits bénéficient de la garantie légale de conformité (2 ans) et de la
            garantie des vices cachés.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">7. Litiges</h2>
          <p>
            En cas de litige, le client est invité à contacter GP Parts à l&apos;amiable. À défaut
            d&apos;accord, les tribunaux compétents seront ceux du ressort de Pointe-à-Pitre.
          </p>
        </section>
      </div>
    </div>
  );
}
