import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment GP Parts collecte et protège vos données personnelles.',
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <p className="text-overline uppercase text-basalt/50 mb-2">RGPD</p>
      <h1 className="font-title text-h1 text-basalt mb-8">Politique de confidentialité</h1>

      <div className="space-y-8 text-body text-basalt/80">
        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Responsable du traitement</h2>
          <p>
            GP Parts SARL, Baie-Mahault (Guadeloupe), est responsable du traitement de vos données
            personnelles collectées sur ce site.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Données collectées</h2>
          <p>
            Nous collectons uniquement les données nécessaires à la gestion de vos commandes : nom,
            prénom, email, téléphone, adresse de livraison. Aucune donnée bancaire n&apos;est
            stockée sur nos serveurs.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Finalités</h2>
          <p>
            Vos données sont utilisées pour traiter vos commandes, vous livrer, assurer le service
            client, et — uniquement avec votre consentement explicite — vous envoyer nos offres
            commerciales.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Durée de conservation</h2>
          <p>
            Les données de commande sont conservées 5 ans à des fins comptables et légales. Les
            données marketing sont conservées 3 ans après le dernier contact, ou jusqu&apos;à votre
            opposition.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
            d&apos;effacement, de limitation, de portabilité et d&apos;opposition concernant vos
            données. Pour exercer ces droits, contactez-nous à privacy@gpparts.gp.
          </p>
        </section>

        <section>
          <h2 className="font-title text-h3 text-basalt mb-3">Cookies</h2>
          <p>
            Consultez notre{' '}
            <a href="/cookies" className="text-volcanic underline">
              politique cookies
            </a>{' '}
            pour plus de détails.
          </p>
        </section>
      </div>
    </div>
  );
}
