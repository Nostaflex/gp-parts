import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpFooter } from '@/components/cp/CpFooter';
import type { Vehicule } from '@/lib/vehicules';
import { getCachedVehicules } from '@/lib/data/vehicules-cache';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';
import type { ContactInfo } from '@/lib/contact-info';
import { FinancementSimulator } from './FinancementSimulator';
import { VehiculeGallery } from './VehiculeGallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { BUSINESS, absoluteUrl, breadcrumbJsonLd } from '@/lib/seo';

// Filet ISR : revalidateTag('vehicules') (Server Actions admin) prime sur
// mutation ; ce TTL n'est qu'un fallback de fraîcheur.
export const revalidate = 3600;

// Enumère les params au build. Les 7 ids sont déclarés à Next
// (route SSG, regex générée). En ISR, le HTML est matérialisé au
// 1er hit puis caché CDN, et régénéré sur revalidateTag('vehicules').
export async function generateStaticParams() {
  // Source DIRECTE (pas unstable_cache) : generateStaticParams s'exécute
  // hors contexte de requête/render — getCachedVehicules() y throw
  // "Invariant: incrementalCache missing". Le cache invalidable par tag
  // n'a de sens qu'au rendu de page (contexte requête).
  const { getAdapter } = await import('@/lib/data');
  const adapter = await getAdapter();
  const vehicules = await adapter.getVehicules();
  return vehicules.map((v) => ({ id: v.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const vehicules = await getCachedVehicules();
  const v = vehicules.find((veh) => veh.id === id);
  // Un véhicule vendu reste affiché (grisé) dans la liste mais sa fiche est 404.
  if (!v || v.disponibilite === 'vendu') {
    return { title: 'Véhicule introuvable' };
  }
  const ci = await getCachedContactInfo();
  return {
    title: `${v.marque} ${v.modele} ${v.annee} — ${v.prix.toLocaleString('fr-FR')} €`,
    description: `${v.marque} ${v.modele} ${v.annee}, ${v.km.toLocaleString('fr-FR')} km, ${v.energie} ${v.transmission}. Véhicule d'occasion contrôlé, garantie 12 mois incluse, financement disponible. Disponible à ${ci.address.city}.`,
    alternates: { canonical: `/vente-vehicule/${v.id}` },
    openGraph: {
      title: `${v.marque} ${v.modele} ${v.annee}`,
      description: `${v.km.toLocaleString('fr-FR')} km · ${v.energie} · ${v.prix.toLocaleString('fr-FR')} €`,
      images: [{ url: v.image }],
    },
  };
}

function vehicleJsonLd(v: Vehicule, ci: ContactInfo) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Car',
    name: `${v.marque} ${v.modele}`,
    brand: { '@type': 'Brand', name: v.marque },
    model: v.modele,
    vehicleModelDate: String(v.annee),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: v.km, unitCode: 'KMT' },
    fuelType: v.energie,
    vehicleTransmission: v.transmission,
    numberOfDoors: v.caracteristiques.portes,
    seatingCapacity: v.places,
    bodyType: v.caracteristiques.carrosserie,
    color: v.caracteristiques.couleur,
    image: v.images,
    sku: v.reference,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/vente-vehicule/${v.id}`),
      price: v.prix,
      priceCurrency: 'EUR',
      availability:
        v.disponibilite === 'disponible'
          ? 'https://schema.org/InStock'
          : v.disponibilite === 'reserve'
            ? 'https://schema.org/LimitedAvailability'
            : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'AutoDealer',
        name: BUSINESS.name,
        areaServed: 'Guadeloupe',
        address: {
          '@type': 'PostalAddress',
          addressLocality: ci.address.city,
          postalCode: ci.address.postalCode,
          addressRegion: ci.address.region,
          addressCountry: BUSINESS.address.country,
        },
      },
    },
  };
}

export default async function VehiculeDetailPage({ params }: Props) {
  const flags = await getCachedFeatureFlags();
  if (!flags.venteVehicule) notFound();
  const { id } = await params;
  const vehicules = await getCachedVehicules();
  const v = vehicules.find((veh) => veh.id === id);
  // find() undefined (supprimé entre build et requête) OU véhicule vendu :
  // 404. Les vendus restent visibles grisés dans la liste, mais leur fiche
  // n'est plus accessible (« sans interaction possible »).
  if (!v || v.disponibilite === 'vendu') notFound();

  const ci = await getCachedContactInfo();
  const contactHref = `/contact?sujet=${encodeURIComponent('Vente véhicule')}&vehicule=${encodeURIComponent(`${v.marque} ${v.modele}`)}&ref=${encodeURIComponent(v.id)}`;

  const dispoLabel =
    v.disponibilite === 'disponible'
      ? 'Disponible'
      : v.disponibilite === 'reserve'
        ? 'Réservé'
        : 'Vendu';
  const dispoColor =
    v.disponibilite === 'disponible'
      ? '#52C88A'
      : v.disponibilite === 'reserve'
        ? '#E9C46A'
        : '#C8392E';

  const caracEntries = Object.entries(v.caracteristiques).filter(([, val]) => val !== undefined);

  return (
    <>
      <JsonLd
        data={[
          vehicleJsonLd(v, ci),
          breadcrumbJsonLd([
            { name: 'Accueil', path: '/' },
            { name: 'Vente véhicule', path: '/vente-vehicule' },
            { name: `${v.marque} ${v.modele}`, path: `/vente-vehicule/${v.id}` },
          ]),
        ]}
      />
      <CpHeader />

      {/* HERO split: gallery + sticky panel */}
      <section className="pt-24 pb-16 px-6 bg-cp-cream">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-xs text-cp-ink/40 mb-8"
          >
            <Link href="/" className="hover:text-cp-mango transition-colors">
              Accueil
            </Link>
            <span aria-hidden="true">›</span>
            <Link href="/vente-vehicule" className="hover:text-cp-mango transition-colors">
              Vente véhicule
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-cp-ink/70">
              {v.marque} {v.modele}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
            {/* Gallery */}
            <VehiculeGallery images={v.images} alt={`${v.marque} ${v.modele}`} />

            {/* Sticky panel */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 shadow-sm">
                <span
                  className="cp-mono text-[0.65rem] tracking-widest uppercase mb-2 inline-block"
                  style={{ color: dispoColor }}
                >
                  ● {dispoLabel}
                </span>
                <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-wide uppercase mb-1">
                  {v.marque}
                </p>
                <h1 className="cp-title font-black text-cp-ink text-3xl leading-tight mb-2">
                  {v.modele}
                </h1>
                <p className="cp-mono text-xs text-cp-ink/50 tracking-wide mb-6">
                  Réf. {v.reference}
                </p>

                {/* Prix */}
                <div className="mb-6 pb-6 border-b border-[#F0E8DC]">
                  <p className="cp-title font-black text-cp-ink text-4xl leading-none">
                    {v.prix.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-sm text-cp-ink/50 mt-1">
                    ou <span className="font-semibold text-cp-ink/80">{v.mensualite} €/mois</span>{' '}
                    en financement
                  </p>
                </div>

                {/* Specs key */}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6 text-xs">
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Année
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">{v.annee}</dd>
                  </div>
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Kilométrage
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">
                      {v.km.toLocaleString('fr-FR')} km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Énergie
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">{v.energie}</dd>
                  </div>
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Boîte
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">{v.transmission}</dd>
                  </div>
                </dl>

                {/* Garantie badge */}
                <div className="flex items-center gap-2 mb-6 text-xs text-[#2A5C45] font-semibold">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Garantie 12 mois incluse · Contrôlé par nos techniciens
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3">
                  <Link
                    href={contactHref}
                    className="w-full inline-flex justify-center items-center gap-2 bg-cp-ink text-cp-cream text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-cp-red transition-colors"
                  >
                    Je suis intéressé
                  </Link>
                  <a
                    href={`tel:${ci.phone}`}
                    className="w-full inline-flex justify-center items-center gap-2 border border-[#E5DDD3] text-cp-ink text-sm font-semibold px-6 py-3 rounded-xl hover:border-cp-red hover:text-cp-mango transition-colors"
                  >
                    <svg
                      width="14"
                      height="14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3-8.59A2 2 0 012.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-.83a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                    </svg>
                    Appeler
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* DESCRIPTION + CARACTERISTIQUES */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-3">
              Présentation
            </p>
            <h2 className="cp-title font-black text-cp-ink text-3xl mb-6 leading-tight">
              Le coup d&apos;œil
            </h2>
            <p className="text-cp-ink/70 text-base leading-relaxed whitespace-pre-line">
              {v.description}
            </p>

            {v.options.length > 0 && (
              <div className="mt-8">
                <h3 className="cp-title font-black text-cp-ink text-lg mb-3">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {v.options.map((o) => (
                    <span
                      key={o}
                      className="bg-[#F8F5F0] text-cp-ink/70 text-xs px-3 py-1.5 rounded-full border border-[#E5DDD3]"
                    >
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-3">
              Caractéristiques
            </p>
            <h2 className="cp-title font-black text-cp-ink text-3xl mb-6 leading-tight">
              Fiche technique
            </h2>
            <dl className="divide-y divide-[#F0E8DC] border border-[#E5DDD3] rounded-xl overflow-hidden">
              {caracEntries.map(([key, val]) => (
                <div key={key} className="flex justify-between items-center px-4 py-3 text-sm">
                  <dt className="text-cp-ink/50 capitalize">
                    {key === 'critAir'
                      ? "Crit'Air"
                      : key === 'premiereCirculation'
                        ? '1ère mise en circulation'
                        : key === 'co2'
                          ? 'Émissions CO₂'
                          : key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </dt>
                  <dd className="font-semibold text-cp-ink">{val}</dd>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-3 text-sm">
                <dt className="text-cp-ink/50">Places</dt>
                <dd className="font-semibold text-cp-ink">{v.places}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* GARANTIES — bandeau slim */}
      <section className="px-6 py-12 bg-cp-cream">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Garantie 12 mois',
                desc: 'Toutes pièces mécaniques majeures couvertes.',
              },
              {
                title: 'Contrôlé par nos techniciens',
                desc: 'Inspection complète, distribution + freinage vérifiés.',
              },
              {
                title: 'Reprise possible',
                desc: 'Estimation gratuite de votre véhicule actuel.',
              },
            ].map((g) => (
              <div key={g.title} className="bg-white border border-[#E5DDD3] rounded-xl p-5">
                <p className="cp-title font-black text-cp-ink text-sm mb-2">{g.title}</p>
                <p className="text-xs text-cp-ink/60 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINANCEMENT intégré (#7 Stephane: "le financement à mettre directement dans la page détails avec les infos") */}
      <section className="px-6 py-20 bg-[#F8F5F0]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-3">
              Financement
            </p>
            <h2 className="cp-title font-black text-cp-ink text-3xl md:text-4xl leading-tight mb-3">
              Roulez maintenant,
              <br />
              <span className="text-cp-mango">payez à votre rythme</span>
            </h2>
            <p className="text-sm text-cp-ink/60 max-w-md mx-auto">
              Ajustez l&apos;apport et la durée. Calcul instantané sur ce véhicule précis.
            </p>
          </div>

          <FinancementSimulator
            prix={v.prix}
            marque={v.marque}
            modele={v.modele}
            vehiculeId={v.id}
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="px-6 py-16 bg-cp-cream">
        <div className="max-w-3xl mx-auto">
          <div className="bg-cp-ink rounded-2xl p-8 md:p-10 text-center">
            <p className="cp-title font-black text-cp-cream text-2xl md:text-3xl mb-3">
              Ce véhicule vous intéresse ?
            </p>
            <p className="text-cp-cream/60 text-sm mb-6 max-w-md mx-auto">
              Réservez un essai ou demandez plus d&apos;infos. Réponse sous 24h, souvent bien moins.
            </p>
            <Link
              href={contactHref}
              className="inline-flex items-center gap-2 bg-cp-red text-cp-cream font-semibold px-8 py-3.5 rounded-full hover:bg-cp-red-d transition-colors"
            >
              Je suis intéressé →
            </Link>
          </div>
        </div>
      </section>

      <CpFooter />
    </>
  );
}
