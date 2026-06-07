import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpFooter } from '@/components/cp/CpFooter';
import type { Moto } from '@/lib/motos';
import { getCachedMotos } from '@/lib/data/motos-cache';
import { FinancementMotoSimulator } from './FinancementMotoSimulator';
import { MotoGallery } from './MotoGallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { BUSINESS, absoluteUrl, breadcrumbJsonLd } from '@/lib/seo';

// Filet ISR : revalidateTag('motos') (Server Actions admin) prime sur
// mutation ; ce TTL n'est qu'un fallback de fraîcheur.
export const revalidate = 3600;

// Enumère les params au build. Les 7 ids sont déclarés à Next
// (route SSG, regex générée). En ISR, le HTML est matérialisé au
// 1er hit puis caché CDN, et régénéré sur revalidateTag('motos').
export async function generateStaticParams() {
  // Source DIRECTE (pas unstable_cache) : generateStaticParams s'exécute
  // hors contexte de requête/render — getCachedMotos() y throw
  // "Invariant: incrementalCache missing". Le cache invalidable par tag
  // n'a de sens qu'au rendu de page (contexte requête).
  const { getAdapter } = await import('@/lib/data');
  const adapter = await getAdapter();
  const motos = await adapter.getMotos();
  return motos.map((m) => ({ id: m.id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const motos = await getCachedMotos();
  const m = motos.find((moto) => moto.id === id);
  if (!m) {
    return { title: 'Moto introuvable' };
  }
  return {
    title: `${m.marque} ${m.modele} ${m.annee} — ${m.prix.toLocaleString('fr-FR')} €`,
    description: `${m.marque} ${m.modele} ${m.annee}, ${m.km.toLocaleString('fr-FR')} km, ${m.categorie}, permis ${m.caracteristiques.permis ?? '—'}. Moto contrôlée, garantie incluse, financement disponible.`,
    alternates: { canonical: `/vente-moto/${m.id}` },
    openGraph: {
      title: `${m.marque} ${m.modele} ${m.annee}`,
      description: `${m.km.toLocaleString('fr-FR')} km · ${m.categorie} · ${m.prix.toLocaleString('fr-FR')} €`,
      images: [{ url: m.image }],
    },
  };
}

function motoJsonLd(m: Moto) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Motorcycle',
    name: `${m.marque} ${m.modele}`,
    brand: { '@type': 'Brand', name: m.marque },
    model: m.modele,
    vehicleModelDate: String(m.annee),
    mileageFromOdometer: { '@type': 'QuantitativeValue', value: m.km, unitCode: 'KMT' },
    fuelType: m.energie,
    bodyType: m.categorie,
    color: m.caracteristiques.couleur,
    image: m.images,
    sku: m.reference,
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/vente-moto/${m.id}`),
      price: m.prix,
      priceCurrency: 'EUR',
      availability:
        m.disponibilite === 'disponible'
          ? 'https://schema.org/InStock'
          : m.disponibilite === 'reserve'
            ? 'https://schema.org/LimitedAvailability'
            : 'https://schema.org/OutOfStock',
      itemCondition:
        m.type === 'neuf' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      seller: {
        '@type': 'AutoDealer',
        name: BUSINESS.name,
        areaServed: 'Guadeloupe',
        address: {
          '@type': 'PostalAddress',
          addressLocality: BUSINESS.address.city,
          postalCode: BUSINESS.address.postalCode,
          addressRegion: BUSINESS.address.region,
          addressCountry: BUSINESS.address.country,
        },
      },
    },
  };
}

export default async function MotoDetailPage({ params }: Props) {
  const { id } = await params;
  const motos = await getCachedMotos();
  const m = motos.find((moto) => moto.id === id);
  // Moto supprimée en live entre build (generateStaticParams) et requête :
  // find() → undefined → notFound() → 404 correct (pas d'erreur 500, ISR géré).
  if (!m) notFound();

  const contactHref = `/contact?sujet=${encodeURIComponent('Vente moto')}&vehicule=${encodeURIComponent(`${m.marque} ${m.modele}`)}&ref=${encodeURIComponent(m.id)}`;

  const dispoLabel =
    m.disponibilite === 'disponible'
      ? 'Disponible'
      : m.disponibilite === 'reserve'
        ? 'Réservée'
        : 'Vendue';
  const dispoColor =
    m.disponibilite === 'disponible'
      ? '#52C88A'
      : m.disponibilite === 'reserve'
        ? '#E9C46A'
        : '#C8392E';

  const caracEntries = Object.entries(m.caracteristiques).filter(([, val]) => val !== undefined);

  return (
    <>
      <JsonLd
        data={[
          motoJsonLd(m),
          breadcrumbJsonLd([
            { name: 'Accueil', path: '/' },
            { name: 'Vente moto', path: '/vente-moto' },
            { name: `${m.marque} ${m.modele}`, path: `/vente-moto/${m.id}` },
          ]),
        ]}
      />
      <CpHeader />

      <section className="pt-24 pb-16 px-6 bg-cp-cream">
        <div className="max-w-7xl mx-auto">
          <nav
            aria-label="Fil d'Ariane"
            className="flex items-center gap-2 text-xs text-cp-ink/40 mb-8"
          >
            <Link href="/" className="hover:text-cp-mango transition-colors">
              Accueil
            </Link>
            <span aria-hidden="true">›</span>
            <Link href="/vente-moto" className="hover:text-cp-mango transition-colors">
              Vente moto
            </Link>
            <span aria-hidden="true">›</span>
            <span className="text-cp-ink/70">
              {m.marque} {m.modele}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
            <MotoGallery images={m.images} alt={`${m.marque} ${m.modele}`} />

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 shadow-sm">
                <span
                  className="cp-mono text-[0.65rem] tracking-widest uppercase mb-2 inline-block"
                  style={{ color: dispoColor }}
                >
                  ● {dispoLabel}
                </span>
                <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-wide uppercase mb-1">
                  {m.marque} · {m.categorie}
                </p>
                <h1 className="cp-title font-black text-cp-ink text-3xl leading-tight mb-2">
                  {m.modele}
                </h1>
                <p className="cp-mono text-xs text-cp-ink/50 tracking-wide mb-6">
                  Réf. {m.reference}
                </p>

                <div className="mb-6 pb-6 border-b border-[#F0E8DC]">
                  <p className="cp-title font-black text-cp-ink text-4xl leading-none">
                    {m.prix.toLocaleString('fr-FR')} €
                  </p>
                  <p className="text-sm text-cp-ink/50 mt-1">
                    ou <span className="font-semibold text-cp-ink/80">{m.mensualite} €/mois</span>{' '}
                    en financement
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mb-6 text-xs">
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Année
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">{m.annee}</dd>
                  </div>
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Kilométrage
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">
                      {m.km.toLocaleString('fr-FR')} km
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Cylindrée
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">
                      {m.caracteristiques.cylindree ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-cp-ink/40 uppercase tracking-wide cp-mono text-[0.6rem]">
                      Permis
                    </dt>
                    <dd className="font-semibold text-cp-ink mt-0.5">
                      {m.caracteristiques.permis ?? '—'}
                    </dd>
                  </div>
                </dl>

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
                  {m.type === 'neuf'
                    ? 'Garantie 2 ans constructeur · Neuve'
                    : 'Garantie 6 mois · Contrôlée par nos techniciens'}
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href={contactHref}
                    className="w-full inline-flex justify-center items-center gap-2 bg-cp-ink text-cp-cream text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-cp-red transition-colors"
                  >
                    Je suis intéressé
                  </Link>
                  <a
                    href={`tel:${BUSINESS.phone}`}
                    className="w-full inline-flex justify-center items-center gap-2 border border-[#E5DDD3] text-cp-ink text-sm font-semibold px-6 py-3 rounded-xl hover:border-cp-red hover:text-cp-mango transition-colors"
                  >
                    Appeler
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

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
              {m.description}
            </p>

            {m.options.length > 0 && (
              <div className="mt-8">
                <h3 className="cp-title font-black text-cp-ink text-lg mb-3">Équipements</h3>
                <div className="flex flex-wrap gap-2">
                  {m.options.map((o) => (
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
                    {key === 'premiereCirculation'
                      ? '1ère mise en circulation'
                      : key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </dt>
                  <dd className="font-semibold text-cp-ink">{val}</dd>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-3 text-sm">
                <dt className="text-cp-ink/50">Catégorie</dt>
                <dd className="font-semibold text-cp-ink">{m.categorie}</dd>
              </div>
              <div className="flex justify-between items-center px-4 py-3 text-sm">
                <dt className="text-cp-ink/50">Énergie</dt>
                <dd className="font-semibold text-cp-ink">{m.energie}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 bg-cp-cream">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: m.type === 'neuf' ? 'Garantie 2 ans' : 'Garantie 6 mois',
                desc:
                  m.type === 'neuf'
                    ? 'Garantie constructeur complète.'
                    : 'Pièces mécaniques majeures couvertes.',
              },
              {
                title: 'Contrôlée par nos techniciens',
                desc: 'Inspection complète, freinage + transmission vérifiés.',
              },
              {
                title: 'Reprise possible',
                desc: 'Estimation gratuite de votre moto actuelle.',
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
              Ajustez l&apos;apport et la durée. Calcul instantané sur cette moto précise.
            </p>
          </div>

          <FinancementMotoSimulator
            prix={m.prix}
            marque={m.marque}
            modele={m.modele}
            motoId={m.id}
          />
        </div>
      </section>

      <section className="px-6 py-16 bg-cp-cream">
        <div className="max-w-3xl mx-auto">
          <div className="bg-cp-ink rounded-2xl p-8 md:p-10 text-center">
            <p className="cp-title font-black text-cp-cream text-2xl md:text-3xl mb-3">
              Cette moto vous intéresse ?
            </p>
            <p className="text-cp-cream/60 text-sm mb-6 max-w-md mx-auto">
              Réservez un essai ou demandez plus d&apos;infos. Réponse sous 24h.
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
