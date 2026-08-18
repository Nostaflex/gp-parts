'use client';

// Page légale cp-v6 (handoff 2026-08-17, lot 6) : les quatre onglets de
// prose deviennent des sections ancrées avec sommaire collant. Chaque
// section ouvre sur un « En clair » de deux lignes avant le texte
// juridique. Les champs manquants sont NOMMÉS en rouge « — à fournir »,
// jamais remplis de zéros (plus risqué qu'une case vide).

import { useState, useEffect } from 'react';
import type { ContactInfo } from '@/lib/contact-info';
import { DEFAULT_LEGAL_INFO, type LegalInfo } from '@/lib/legal-info';
import { DROITS_RGPD, droitLabel, type DroitRgpd } from '@/lib/rgpd';
import { CookiePrefsCenter } from '@/components/gdpr/CookiePrefsCenter';
import { submitDemandeDroit } from './actions';

/** Date de mise à jour VERSIONNÉE — à incrémenter à chaque évolution du texte. */
export const LEGAL_UPDATED_AT = '18 août 2026';

const SECTIONS = [
  { id: 'editeur', num: '01', label: 'Qui édite ce site' },
  { id: 'cgv', num: '02', label: 'Ce que vous achetez' },
  { id: 'donnees', num: '03', label: 'Vos données' },
  { id: 'droits', num: '04', label: 'Exercer vos droits' },
  { id: 'cookies', num: '05', label: 'Vos cookies' },
] as const;

const k = 'cp-mono text-[0.66rem] uppercase tracking-[0.1em] text-cp-ink/55';
const thCls =
  'cp-mono text-left align-bottom border-b border-[#E5DDD3] px-3 py-2 text-[0.66rem] font-normal uppercase tracking-[0.1em] text-cp-ink/55';
const tdCls = 'align-top border-b border-[#F0E8D8] px-3 py-2.5 text-[0.84rem] text-cp-ink/80';
const mono = 'cp-mono text-[0.76rem] text-cp-ink';

function Tag({ tone, children }: { tone?: 'ok' | 'req'; children: React.ReactNode }) {
  const style =
    tone === 'ok'
      ? { background: 'rgba(82,200,138,0.18)', color: '#2A5C45' }
      : tone === 'req'
        ? { background: 'rgba(233,196,106,0.28)', color: '#6B4A10' }
        : { background: '#F4EDE0', color: '#1A0F06' };
  return (
    <span
      className="cp-mono inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.06em]"
      style={style}
    >
      {children}
    </span>
  );
}

function EnClair({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="my-4 flex gap-3 rounded-2xl border p-3.5"
      style={{ background: 'rgba(82,200,138,0.1)', borderColor: 'rgba(42,92,69,0.24)' }}
    >
      <span className="cp-mono shrink-0 pt-0.5 text-[0.62rem] uppercase tracking-[0.14em] text-[#2A5C45]">
        En clair
      </span>
      <p className="m-0 text-[0.88rem] leading-relaxed text-[#1D3B2C]">{children}</p>
    </div>
  );
}

function IdRow({ label, value, aFournir }: { label: string; value?: string; aFournir?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[#E5DDD3] px-4 py-3 odd:sm:border-r">
      <span className={k}>{label}</span>
      {aFournir ? (
        <span className="text-[0.9rem] font-semibold text-[#B81F20]">
          {value}
          <span className="text-[0.76rem] font-normal text-cp-ink/55"> — à fournir</span>
        </span>
      ) : (
        <span className="text-[0.9rem] font-semibold text-cp-ink">{value}</span>
      )}
    </div>
  );
}

function Bloc({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 rounded-2xl border border-[#E5DDD3] bg-white p-6">{children}</div>;
}

function TitreSection({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <>
      <p className="cp-mono mb-1 text-xs uppercase tracking-widest text-cp-ink/40">Section {num}</p>
      <h2 className="cp-title mb-1 text-2xl font-black uppercase text-cp-ink">{children}</h2>
    </>
  );
}

export function LegalSections({
  contactInfo,
  legalInfo = DEFAULT_LEGAL_INFO,
}: {
  contactInfo: ContactInfo;
  /** Fiche contribuable BO (meta/legalInfo) — champs vides = « à fournir ». */
  legalInfo?: LegalInfo;
}) {
  const [active, setActive] = useState<string>('editeur');

  // Formulaire d'exercice de droits (section 04) — la demande part au BO.
  const [droitChoisi, setDroitChoisi] = useState<DroitRgpd | null>(null);
  const [droitForm, setDroitForm] = useState({ nom: '', email: '', telephone: '', message: '' });
  const [droitWebsite, setDroitWebsite] = useState(''); // honeypot anti-spam
  const [droitErrors, setDroitErrors] = useState<Record<string, string>>({});
  const [droitEnvoye, setDroitEnvoye] = useState(false);
  const [droitEnvoiEnCours, setDroitEnvoiEnCours] = useState(false);

  // Scroll-spy : la section la plus visible allume son entrée de sommaire.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id);
        }
      },
      { rootMargin: '-25% 0px -65% 0px' }
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, []);

  const email = contactInfo.email;
  const adresse = contactInfo.address.street
    ? `${contactInfo.address.street}, ${contactInfo.address.postalCode} ${contactInfo.address.city}`
    : '';
  const mailto = (sujet: string, corps: string) =>
    `mailto:${email}?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-7 md:grid-cols-[236px_1fr]">
      {/* ── Sommaire collant ── */}
      <nav aria-label="Sommaire" className="self-start md:sticky md:top-24">
        <p className="cp-mono mb-2.5 text-[0.66rem] uppercase tracking-[0.14em] text-cp-ink/55">
          Sommaire
        </p>
        <div className="flex flex-row flex-wrap gap-1 md:flex-col">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`cp-tap flex items-center gap-2 rounded-xl px-3 py-2 text-[0.84rem] transition-colors ${
                active === s.id
                  ? 'bg-cp-ink text-cp-cream'
                  : 'text-cp-ink hover:bg-cp-red/5 hover:text-cp-mango'
              }`}
            >
              <i
                className={`cp-mono text-[0.62rem] not-italic ${active === s.id ? 'text-cp-cream/60' : 'text-cp-ink/45'}`}
              >
                {s.num}
              </i>
              {s.label}
            </a>
          ))}
        </div>
        <div className="mt-3.5 hidden rounded-xl border border-dashed border-[#E5DDD3] p-3 text-[0.74rem] text-cp-ink/55 md:block">
          <b className="block text-[0.8rem] text-cp-ink">Dernière mise à jour</b>
          {LEGAL_UPDATED_AT}
        </div>
      </nav>

      <div className="min-w-0">
        {/* ══ 01 · ÉDITEUR ══ */}
        <section id="editeur" className="scroll-mt-24">
          <Bloc>
            <TitreSection num="01">Qui édite ce site</TitreSection>
            <EnClair>
              Car Performance Guadeloupe, garage établi en Guadeloupe. Une vraie société, un vrai
              numéro : tout est ci-dessous — et ce qui manque encore est nommé, pas maquillé.
            </EnClair>
            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-[#E5DDD3] sm:grid-cols-2">
              <IdRow label="Raison sociale" value="Car Performance Guadeloupe" />
              <IdRow label="Forme & capital" value="SARL au capital de 1 500 €" />
              {/* SIRET réel fourni par Stéphane le 2026-08-16 (réponse S4). */}
              <IdRow label="SIRET" value="102 854 023 00011" />
              <IdRow label="RCS" value="102 854 023" />
              <IdRow
                label="TVA intracommunautaire"
                value={legalInfo.tvaIntracom || 'N° TVA'}
                aFournir={!legalInfo.tvaIntracom}
              />
              <IdRow
                label="Siège social"
                value={adresse || 'Adresse complète'}
                aFournir={!adresse}
              />
              <IdRow label="Téléphone" value={contactInfo.phoneDisplay} />
              <IdRow label="Email" value={email} />
              <IdRow label="Directeur de la publication" value="Stéphane M., gérant" />
              <IdRow label="Hébergeur" value="Vercel Inc. — Covina, CA, États-Unis" />
              <IdRow
                label="Médiateur de la consommation"
                value={legalInfo.mediateurNom || 'Adhésion'}
                aFournir={!legalInfo.mediateurNom}
              />
              <IdRow
                label="Assurance RC professionnelle"
                value={legalInfo.rcPro || 'Assureur & police'}
                aFournir={!legalInfo.rcPro}
              />
            </div>
            <div className="mt-4">
              <h4 className="mb-1.5 text-[0.92rem] font-semibold text-cp-ink">
                Propriété intellectuelle
              </h4>
              <p className="max-w-[74ch] text-[0.88rem] leading-relaxed text-cp-ink/75">
                L&apos;ensemble du contenu de ce site — textes, photographies, mascottes Max
                Explorer et Splash, logos — est la propriété exclusive de Car Performance
                Guadeloupe. Toute reproduction, même partielle, est interdite sans autorisation
                écrite.
              </p>
            </div>
          </Bloc>
        </section>

        {/* ══ 02 · CGV ══ */}
        <section id="cgv" className="scroll-mt-24">
          <Bloc>
            <TitreSection num="02">Ce que vous achetez</TitreSection>
            <EnClair>
              Prix TTC avec TVA 8,5 %. 14 jours pour changer d&apos;avis sur une commande en ligne,
              sauf pièce commandée spécialement pour vous. Garantie légale de 2 ans en plus de notre
              garantie commerciale.
            </EnClair>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Engagement</th>
                    <th className={thCls}>Ce que ça veut dire</th>
                    <th className={thCls}>Référence</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdCls}>Garantie légale de conformité</td>
                    <td className={tdCls}>
                      2 ans à compter de la livraison, sans frais. Elle s&apos;ajoute à notre
                      garantie commerciale de 12 mois — elle ne la remplace pas.
                    </td>
                    <td className={tdCls}>
                      <span className={mono}>L217-3 conso</span>
                    </td>
                  </tr>
                  <tr>
                    <td className={tdCls}>Garantie des vices cachés</td>
                    <td className={tdCls}>2 ans à compter de la découverte du défaut.</td>
                    <td className={tdCls}>
                      <span className={mono}>1641 civil</span>
                    </td>
                  </tr>
                  <tr>
                    <td className={tdCls}>Droit de rétractation</td>
                    <td className={tdCls}>
                      14 jours après réception, sans motif. Formulaire type fourni ci-dessous. Exclu
                      pour les pièces commandées sur mesure.
                    </td>
                    <td className={tdCls}>
                      <span className={mono}>L221-18 conso</span>
                    </td>
                  </tr>
                  <tr>
                    <td className={tdCls}>Disponibilité des pièces détachées</td>
                    <td className={tdCls}>
                      Nous indiquons, quand le fabricant la communique, la période pendant laquelle
                      la pièce reste disponible.
                    </td>
                    <td className={tdCls}>
                      <span className={mono}>L111-4 conso</span>
                    </td>
                  </tr>
                  <tr>
                    <td className={tdCls}>Garantie atelier</td>
                    <td className={tdCls}>
                      Pièces montées garanties 12 mois ou 20 000 km ; main-d&apos;œuvre garantie 6
                      mois.
                    </td>
                    <td className={tdCls}>
                      <Tag>Engagement maison</Tag>
                    </td>
                  </tr>
                  <tr>
                    <td className={tdCls}>Devis atelier</td>
                    <td className={tdCls}>
                      Gratuit, valable 30 jours. Aucune intervention sans votre accord écrit ou
                      oral.
                    </td>
                    <td className={tdCls}>
                      <Tag>Engagement maison</Tag>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 max-w-[74ch] text-[0.88rem] leading-relaxed text-cp-ink/75">
              <p className="mb-3">
                Les prix sont indiqués en euros TTC (TVA 8,5 % applicable en Guadeloupe). Livraison
                en Guadeloupe sous 24 h pour les articles en stock ; en cas de rupture, un délai est
                communiqué par email. En cas de litige, et après échec de la médiation, le Tribunal
                de Commerce de Pointe-à-Pitre est compétent.
              </p>
              <h4 className="mb-1.5 mt-4 text-[0.92rem] font-semibold text-cp-ink">
                Formulaire de rétractation
              </h4>
              <p className="mb-3">
                Téléchargeable en un clic, pré-rempli avec nos coordonnées — c&apos;est une
                obligation légale, et c&apos;est aussi ce qui évite dix allers-retours WhatsApp.
              </p>
              <a
                href="/documents/formulaire-retractation.html"
                download="formulaire-retractation-car-performance.html"
                className="cp-tap inline-flex items-center rounded-xl border border-[#E5DDD3] px-5 py-3 text-sm font-semibold text-cp-ink transition-colors hover:border-cp-red hover:text-cp-mango"
              >
                Télécharger le formulaire de rétractation
              </a>
            </div>
          </Bloc>
        </section>

        {/* ══ 03 · DONNÉES ══ */}
        <section id="donnees" className="scroll-mt-24">
          <Bloc>
            <TitreSection num="03">Vos données, en détail</TitreSection>
            <EnClair>
              Nous collectons ce qu&apos;il faut pour vous rappeler et livrer votre commande. Rien
              n&apos;est vendu ni loué. Vous pouvez tout récupérer ou tout faire effacer, par un
              message.
            </EnClair>
            <h3 className="mb-2 text-[0.95rem] font-semibold text-cp-ink">
              Registre des traitements
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Donnée</th>
                    <th className={thCls}>Pourquoi</th>
                    <th className={thCls}>Base légale</th>
                    <th className={thCls}>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      [
                        'Nom, prénom, téléphone, email',
                        'Vous rappeler, confirmer un RDV ou une commande',
                        <Tag key="t">Contrat</Tag>,
                        '3 ans après le dernier contact',
                      ],
                      [
                        'Adresse de livraison',
                        'Livrer la commande',
                        <Tag key="t">Contrat</Tag>,
                        '3 ans',
                      ],
                      [
                        'Facture, historique d’achat',
                        'Comptabilité et garantie',
                        <Tag key="t" tone="req">
                          Obligation légale
                        </Tag>,
                        '10 ans',
                      ],
                      [
                        'Véhicule : marque, modèle, immatriculation',
                        'Trouver la bonne pièce, préparer l’intervention',
                        <Tag key="t">Contrat</Tag>,
                        '3 ans',
                      ],
                      [
                        'Assurance : compagnie, n° d’assuré (devis carrosserie sinistre)',
                        'Monter le dossier de prise en charge',
                        <Tag key="t">Contrat</Tag>,
                        '3 ans',
                      ],
                      [
                        'Permis de conduire (location)',
                        'Vérifier l’éligibilité au contrat de location',
                        <Tag key="t" tone="req">
                          Obligation légale
                        </Tag>,
                        'Durée du contrat + 1 an',
                      ],
                      [
                        'Mesure d’audience anonymisée',
                        'Comprendre quelles pages servent',
                        <Tag key="t" tone="ok">
                          Consentement
                        </Tag>,
                        '13 mois',
                      ],
                      [
                        'Préférence offres marketing (case facultative)',
                        'Vous envoyer nos offres si vous l’avez demandé',
                        <Tag key="t" tone="ok">
                          Consentement
                        </Tag>,
                        'jusqu’au retrait',
                      ],
                      [
                        'Preuve de consentement cookies',
                        'Prouver que vous avez choisi',
                        <Tag key="t" tone="req">
                          Obligation légale
                        </Tag>,
                        '6 ans',
                      ],
                    ] as const
                  ).map(([donnee, pourquoi, base, duree]) => (
                    <tr key={donnee as string}>
                      <td className={tdCls}>{donnee}</td>
                      <td className={tdCls}>{pourquoi}</td>
                      <td className={tdCls}>{base}</td>
                      <td className={tdCls}>
                        <span className={mono}>{duree}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-[0.8rem] leading-relaxed text-cp-ink/55">
              Sous-traitants : Vercel (hébergement, États-Unis — clauses contractuelles types),
              Firebase / Google Cloud (base de données, UE), Stripe (paiement), Resend (emails),
              WhatsApp Business (notifications). Aucun transfert à des fins publicitaires ; vos
              données ne sont jamais vendues ni louées.
            </p>
          </Bloc>
        </section>

        {/* ══ 04 · DROITS ══ */}
        <section id="droits" className="scroll-mt-24">
          <Bloc>
            <TitreSection num="04">Exercer vos droits</TitreSection>
            <p className="mb-4 text-[0.86rem] text-cp-ink/55">
              Choisissez un droit : votre demande arrive directement dans notre outil de suivi — pas
              dans une boîte mail perdue. Nous répondons sous 30 jours, c&apos;est le délai légal,
              et nous le tenons.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DROITS_RGPD.map((d, i) => (
                <div
                  key={d.key}
                  className={`flex flex-col gap-1.5 rounded-2xl border bg-white p-4 transition-colors ${droitChoisi === d.key ? 'border-cp-red' : 'border-[#E5DDD3]'}`}
                >
                  <span className="cp-mono text-[0.64rem] uppercase tracking-[0.14em] text-cp-ink/45">
                    Droit 0{i + 1}
                  </span>
                  <h4 className="cp-title text-lg font-black uppercase leading-none text-cp-ink">
                    {d.label}
                  </h4>
                  <p className="text-[0.8rem] text-cp-ink/55">{d.description}</p>
                  <button
                    type="button"
                    aria-pressed={droitChoisi === d.key}
                    onClick={() => {
                      setDroitChoisi(d.key);
                      setDroitEnvoye(false);
                      document
                        .getElementById('form-droit')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`cp-tap mt-auto inline-flex items-center self-start rounded-xl px-4 py-2.5 text-[0.78rem] font-semibold transition-colors ${droitChoisi === d.key ? 'bg-cp-ink text-cp-cream' : 'border border-[#E5DDD3] text-cp-ink hover:border-cp-red hover:text-cp-mango'}`}
                  >
                    Faire ma demande
                  </button>
                </div>
              ))}
              <div className="flex flex-col gap-1.5 rounded-2xl border border-dashed border-[#E5DDD3] bg-cp-cream p-4">
                <span className="cp-mono text-[0.64rem] uppercase tracking-[0.14em] text-cp-ink/45">
                  Recours
                </span>
                <h4 className="cp-title text-lg font-black uppercase leading-none text-cp-ink">
                  CNIL
                </h4>
                <p className="text-[0.8rem] text-cp-ink/55">
                  Si notre réponse ne vous satisfait pas, vous pouvez saisir la CNIL.
                </p>
                <a
                  href="https://www.cnil.fr/fr/plaintes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cp-tap mt-auto inline-flex items-center self-start rounded-xl bg-cp-ink px-4 py-2.5 text-[0.78rem] font-semibold text-cp-cream transition-colors hover:bg-cp-red"
                >
                  cnil.fr/plaintes →
                </a>
              </div>
            </div>

            {/* Formulaire d'exercice — la demande devient une Demande BO */}
            <div id="form-droit" className="mt-5 scroll-mt-24">
              {droitEnvoye ? (
                <div
                  className="rounded-2xl border p-4"
                  style={{ background: 'rgba(82,200,138,0.1)', borderColor: 'rgba(42,92,69,0.24)' }}
                  role="status"
                >
                  <b className="block text-[0.92rem] text-[#1D3B2C]">Demande envoyée.</b>
                  <p className="m-0 mt-1 text-[0.84rem] text-[#1D3B2C]">
                    Elle est datée et suivie ; nous vous répondons à l&apos;adresse indiquée sous 30
                    jours. Pour un droit d&apos;accès ou d&apos;effacement, nous vérifierons
                    d&apos;abord votre identité.
                  </p>
                </div>
              ) : droitChoisi ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (droitEnvoiEnCours) return;
                    setDroitEnvoiEnCours(true);
                    const res = await submitDemandeDroit({
                      droit: droitChoisi,
                      nom: droitForm.nom,
                      email: droitForm.email,
                      telephone: droitForm.telephone,
                      message: droitForm.message,
                      website: droitWebsite,
                    });
                    setDroitEnvoiEnCours(false);
                    if (!res.success) {
                      setDroitErrors(res.errors);
                      return;
                    }
                    setDroitErrors({});
                    setDroitEnvoye(true);
                  }}
                  className="rounded-2xl border border-[#E5DDD3] bg-white p-4"
                >
                  <p className="cp-mono mb-3 text-[0.62rem] uppercase tracking-[0.14em] text-cp-ink/55">
                    Demande · droit {droitLabel(droitChoisi)}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="droit-nom" className={k}>
                        Nom, prénom *
                      </label>
                      <input
                        id="droit-nom"
                        type="text"
                        autoComplete="name"
                        value={droitForm.nom}
                        onChange={(e) => setDroitForm((f) => ({ ...f, nom: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[#E5DDD3] px-3.5 py-2.5 text-sm text-cp-ink outline-none transition-colors focus:border-cp-red"
                      />
                      {droitErrors.nom && (
                        <p className="mt-1 text-[0.75rem] text-[#B81F20]">{droitErrors.nom}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="droit-email" className={k}>
                        Email utilisé chez nous *
                      </label>
                      <input
                        id="droit-email"
                        type="email"
                        autoComplete="email"
                        value={droitForm.email}
                        onChange={(e) => setDroitForm((f) => ({ ...f, email: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[#E5DDD3] px-3.5 py-2.5 text-sm text-cp-ink outline-none transition-colors focus:border-cp-red"
                      />
                      {droitErrors.email && (
                        <p className="mt-1 text-[0.75rem] text-[#B81F20]">{droitErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="droit-tel" className={k}>
                        Téléphone (facultatif)
                      </label>
                      <input
                        id="droit-tel"
                        type="tel"
                        autoComplete="tel"
                        value={droitForm.telephone}
                        onChange={(e) => setDroitForm((f) => ({ ...f, telephone: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[#E5DDD3] px-3.5 py-2.5 text-sm text-cp-ink outline-none transition-colors focus:border-cp-red"
                      />
                      {droitErrors.telephone && (
                        <p className="mt-1 text-[0.75rem] text-[#B81F20]">
                          {droitErrors.telephone}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="droit-message" className={k}>
                        Précisions (facultatif)
                      </label>
                      <textarea
                        id="droit-message"
                        rows={3}
                        value={droitForm.message}
                        onChange={(e) => setDroitForm((f) => ({ ...f, message: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-[#E5DDD3] px-3.5 py-2.5 text-sm text-cp-ink outline-none transition-colors focus:border-cp-red"
                      />
                    </div>
                  </div>
                  {/* Honeypot anti-spam : invisible pour un humain. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    value={droitWebsite}
                    onChange={(e) => setDroitWebsite(e.target.value)}
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      width: '1px',
                      height: '1px',
                      opacity: 0,
                    }}
                  />
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={droitEnvoiEnCours}
                      className="cp-tap rounded-xl bg-cp-ink px-5 py-3 text-sm font-semibold text-cp-cream transition-colors hover:bg-cp-red disabled:opacity-60"
                    >
                      {droitEnvoiEnCours ? 'Envoi…' : 'Envoyer ma demande'}
                    </button>
                    <a
                      href={mailto(
                        `[RGPD] ${droitLabel(droitChoisi)}`,
                        'Bonjour,\n\nJe souhaite exercer ce droit sur mes données personnelles.\n\nNom, prénom :\nEmail ou téléphone utilisé chez vous :\n\nMerci.'
                      )}
                      className="text-[0.78rem] text-cp-ink/50 underline underline-offset-4 transition-colors hover:text-cp-mango"
                    >
                      ou par email
                    </a>
                  </div>
                  <p className="mt-3 text-[0.7rem] leading-relaxed text-cp-ink/45">
                    Ces informations servent uniquement à traiter votre demande (conservées 13
                    mois). Pour un droit d&apos;accès, d&apos;effacement ou de portabilité, nous
                    vérifions votre identité avant de répondre.
                  </p>
                </form>
              ) : (
                <p className="text-[0.8rem] text-cp-ink/45">
                  Sélectionnez un droit ci-dessus pour ouvrir le formulaire.
                </p>
              )}
            </div>
          </Bloc>
        </section>

        {/* ══ 05 · COOKIES ══ */}
        <section id="cookies" className="scroll-mt-24">
          <Bloc>
            <TitreSection num="05">Vos préférences cookies</TitreSection>
            <EnClair>
              Deux interrupteurs. Vous pouvez revenir les changer quand vous voulez, et votre choix
              est daté.
            </EnClair>
            <CookiePrefsCenter />
          </Bloc>
          <Bloc>
            <h3 className="mb-2 text-[0.95rem] font-semibold text-cp-ink">
              Ce qui est réellement déposé
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Nom</th>
                    <th className={thCls}>Rôle</th>
                    <th className={thCls}>Catégorie</th>
                    <th className={thCls}>Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      [
                        'gpparts-cart',
                        'Contenu du panier entre deux visites',
                        <Tag key="t">Nécessaire</Tag>,
                        '12 mois',
                      ],
                      [
                        'gpparts-cookie-consent',
                        'Votre choix de cookies et sa date',
                        <Tag key="t">Nécessaire</Tag>,
                        '6 mois',
                      ],
                      [
                        'gpparts-last-order',
                        'Afficher la confirmation de commande',
                        <Tag key="t">Nécessaire</Tag>,
                        'Session',
                      ],
                      [
                        '_ga · _ga_*',
                        'Mesure d’audience agrégée',
                        <Tag key="t" tone="ok">
                          Consentement
                        </Tag>,
                        '13 mois',
                      ],
                    ] as const
                  ).map(([nom, role, cat, duree]) => (
                    <tr key={nom as string}>
                      <td className={tdCls}>
                        <span className={mono}>{nom}</span>
                      </td>
                      <td className={tdCls}>{role}</td>
                      <td className={tdCls}>{cat}</td>
                      <td className={tdCls}>
                        <span className={mono}>{duree}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bloc>
        </section>
      </div>
    </div>
  );
}
