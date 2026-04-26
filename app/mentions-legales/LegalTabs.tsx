'use client';

import { useState } from 'react';

type Tab = 'mentions' | 'cgv' | 'confidentialite' | 'cookies';

const TABS: { id: Tab; label: string }[] = [
  { id: 'mentions', label: 'Mentions légales' },
  { id: 'cgv', label: 'CGV' },
  { id: 'confidentialite', label: 'Confidentialité' },
  { id: 'cookies', label: 'Cookies' },
];

const prose =
  'prose prose-sm max-w-none text-cp-ink/70 [&_h2]:cp-title [&_h2]:font-black [&_h2]:text-cp-ink [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:font-semibold [&_h3]:text-cp-ink [&_h3]:mt-5 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1';

const CONTENT: Record<Tab, React.ReactNode> = {
  mentions: (
    <div className={prose}>
      <h2>Éditeur du site</h2>
      <p>
        <strong>Car Performance Guadeloupe</strong>
        <br />
        SARL au capital de 10 000 €<br />
        SIRET : 000 000 000 00000
        <br />
        RCS Pointe-à-Pitre
        <br />
        ZI de Jarry, 97122 Baie-Mahault, Guadeloupe
        <br />
        Tél. : 0590 00 00 00
        <br />
        Email : contact@car-performance.gp
      </p>

      <h2>Directeur de publication</h2>
      <p>Stéphane M., Gérant</p>

      <h2>Hébergement</h2>
      <p>
        Vercel Inc.
        <br />
        440 N Barranca Ave #4133
        <br />
        Covina, CA 91723, États-Unis
        <br />
        <a
          href="https://vercel.com"
          className="text-cp-mango hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          vercel.com
        </a>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble du contenu de ce site (textes, images, graphismes, logos) est la propriété
        exclusive de Car Performance Guadeloupe ou de ses partenaires. Toute reproduction, même
        partielle, est interdite sans autorisation préalable.
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        Car Performance Guadeloupe s&apos;efforce d&apos;assurer l&apos;exactitude et la mise à jour
        des informations diffusées sur ce site. Toutefois, nous ne pouvons garantir
        l&apos;exactitude, la complétude ou l&apos;actualité des informations publiées.
      </p>
    </div>
  ),

  cgv: (
    <div className={prose}>
      <h2>Conditions générales de vente</h2>
      <p>
        Les présentes conditions générales de vente s&apos;appliquent à toutes les commandes passées
        sur le site car-performance.gp ainsi qu&apos;aux prestations réalisées en atelier.
      </p>

      <h2>Commandes de pièces détachées</h2>
      <h3>Acceptation</h3>
      <p>
        Toute commande passée sur notre boutique en ligne implique l&apos;acceptation pleine et
        entière des présentes CGV. La commande est ferme à compter de la confirmation de paiement.
      </p>

      <h3>Prix</h3>
      <p>
        Les prix sont indiqués en euros TTC (TVA 8,5% applicable en Guadeloupe). Car Performance
        Guadeloupe se réserve le droit de modifier ses tarifs à tout moment.
      </p>

      <h3>Livraison</h3>
      <p>
        Livraison en Guadeloupe sous 24h pour les articles en stock. En cas de rupture, un délai
        sera communiqué par email.
      </p>

      <h2>Prestations atelier</h2>
      <h3>Devis</h3>
      <p>
        Tout devis est gratuit et valable 30 jours. Aucune intervention n&apos;est réalisée sans
        accord préalable écrit ou oral du client.
      </p>

      <h3>Garantie</h3>
      <p>
        Les pièces montées sont garanties 12 mois ou 20 000 km. La main-d&apos;œuvre est garantie 6
        mois.
      </p>

      <h2>Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-18 du Code de la consommation, vous disposez d&apos;un
        délai de 14 jours pour exercer votre droit de rétractation sur les achats en ligne, sauf
        pour les pièces commandées spécifiquement à votre demande.
      </p>

      <h2>Juridiction compétente</h2>
      <p>En cas de litige, le Tribunal de Commerce de Pointe-à-Pitre est seul compétent.</p>
    </div>
  ),

  confidentialite: (
    <div className={prose}>
      <h2>Politique de confidentialité</h2>
      <p>
        Car Performance Guadeloupe s&apos;engage à protéger vos données personnelles conformément au
        Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
      </p>

      <h2>Données collectées</h2>
      <p>Nous collectons les données suivantes :</p>
      <ul>
        <li>Données d&apos;identification : nom, prénom, email, téléphone</li>
        <li>Données de commande : adresse de livraison, historique d&apos;achats</li>
        <li>Données véhicule : marque, modèle, immatriculation (pour les RDV et expertises)</li>
        <li>Données de navigation : cookies techniques et analytiques</li>
      </ul>

      <h2>Finalités du traitement</h2>
      <p>Vos données sont utilisées pour :</p>
      <ul>
        <li>Traiter vos commandes et demandes de rendez-vous</li>
        <li>Vous contacter dans le cadre de votre demande</li>
        <li>Améliorer notre service (analytics anonymisés)</li>
        <li>Respecter nos obligations légales</li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Vos données sont conservées 3 ans à compter de votre dernier achat ou contact, puis
        archivées conformément aux obligations légales (10 ans pour les données comptables).
      </p>

      <h2>Vos droits</h2>
      <p>Conformément au RGPD, vous disposez des droits suivants :</p>
      <ul>
        <li>Droit d&apos;accès à vos données</li>
        <li>Droit de rectification</li>
        <li>Droit à l&apos;effacement (&laquo; droit à l&apos;oubli &raquo;)</li>
        <li>Droit à la portabilité</li>
        <li>Droit d&apos;opposition</li>
      </ul>
      <p>
        Pour exercer ces droits :{' '}
        <a href="mailto:contact@car-performance.gp" className="text-cp-mango hover:underline">
          contact@car-performance.gp
        </a>
      </p>

      <h2>Transfert de données</h2>
      <p>
        Vos données ne sont jamais vendues ni louées à des tiers. Elles peuvent être partagées avec
        nos prestataires techniques (hébergeur, système de paiement) dans le cadre strict de
        l&apos;exécution du service.
      </p>
    </div>
  ),

  cookies: (
    <div className={prose}>
      <h2>Politique cookies</h2>
      <p>Notre site utilise des cookies afin d&apos;améliorer votre expérience de navigation.</p>

      <h2>Qu&apos;est-ce qu&apos;un cookie ?</h2>
      <p>
        Un cookie est un petit fichier texte déposé sur votre appareil lors de la visite d&apos;un
        site. Il permet de mémoriser vos préférences et d&apos;analyser votre utilisation du site.
      </p>

      <h2>Types de cookies utilisés</h2>
      <h3>Cookies strictement nécessaires</h3>
      <p>
        Indispensables au fonctionnement du site (panier, session, préférences). Ils ne peuvent pas
        être désactivés. Durée : session.
      </p>

      <h3>Cookies analytiques</h3>
      <p>
        Nous utilisons des outils d&apos;analyse anonymisés pour comprendre comment le site est
        utilisé et l&apos;améliorer. Ces cookies ne collectent aucune donnée personnelle
        identifiable. Durée : 13 mois.
      </p>

      <h3>Cookies de préférence</h3>
      <p>
        Mémorisent vos préférences d&apos;affichage (consentement cookies, langue). Durée : 12 mois.
      </p>

      <h2>Gestion des cookies</h2>
      <p>
        Vous pouvez à tout moment modifier vos préférences cookies via les paramètres de votre
        navigateur :
      </p>
      <ul>
        <li>
          <strong>Chrome</strong> : Paramètres &gt; Confidentialité et sécurité &gt; Cookies
        </li>
        <li>
          <strong>Firefox</strong> : Options &gt; Vie privée et sécurité
        </li>
        <li>
          <strong>Safari</strong> : Préférences &gt; Confidentialité
        </li>
      </ul>
      <p>La désactivation de certains cookies peut affecter le fonctionnement du site.</p>

      <h2>Contact</h2>
      <p>
        Pour toute question relative à l&apos;utilisation de cookies :{' '}
        <a href="mailto:contact@car-performance.gp" className="text-cp-mango hover:underline">
          contact@car-performance.gp
        </a>
      </p>
    </div>
  ),
};

export function LegalTabs() {
  const [activeTab, setActiveTab] = useState<Tab>('mentions');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tabs sticky */}
      <div className="sticky top-[68px] z-20 bg-[#F8F5F0] pt-2 pb-4 mb-8">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-cp-ink text-cp-cream'
                  : 'text-cp-ink/50 hover:text-cp-mango hover:bg-cp-mango/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="h-px bg-[#E5DDD3] mt-4" />
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-2xl border border-[#E5DDD3] p-8 shadow-sm">
        {CONTENT[activeTab]}
      </div>
    </div>
  );
}
