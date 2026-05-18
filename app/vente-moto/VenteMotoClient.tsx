'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Moto, CategorieMoto, Permis } from '@/lib/motos';

type TypeFiltre = 'Tous' | 'Occasion' | 'Neuf';
type CategorieFiltre = 'Toutes' | CategorieMoto;
type PermisFiltre = 'Tous' | Permis;
type BudgetMax = 5000 | 10000 | 15000 | 999999;

const TYPES: TypeFiltre[] = ['Tous', 'Occasion', 'Neuf'];
const CATEGORIES: CategorieFiltre[] = [
  'Toutes',
  'Roadster',
  'Sport',
  'Trail',
  'Scooter',
  'Routière',
  'Custom',
];
const PERMIS_OPTIONS: PermisFiltre[] = ['Tous', 'AM', 'A1', 'A2', 'A'];
const BUDGETS: { label: string; val: BudgetMax }[] = [
  { label: 'Tous budgets', val: 999999 },
  { label: '< 5 000 €', val: 5000 },
  { label: '< 10 000 €', val: 10000 },
  { label: '< 15 000 €', val: 15000 },
];

export function VenteMotoClient({ motos }: { motos: Moto[] }) {
  const [typeFiltre, setTypeFiltre] = useState<TypeFiltre>('Tous');
  const [categorie, setCategorie] = useState<CategorieFiltre>('Toutes');
  const [permis, setPermis] = useState<PermisFiltre>('Tous');
  const [budget, setBudget] = useState<BudgetMax>(999999);

  const motosFiltrees = useMemo(
    () =>
      motos.filter((m) => {
        const matchType =
          typeFiltre === 'Tous' ||
          (typeFiltre === 'Occasion' && m.type === 'occasion') ||
          (typeFiltre === 'Neuf' && m.type === 'neuf');
        const matchCat = categorie === 'Toutes' || m.categorie === categorie;
        const matchPermis = permis === 'Tous' || m.caracteristiques.permis === permis;
        const matchBudget = m.prix <= budget;
        return matchType && matchCat && matchPermis && matchBudget;
      }),
    [motos, typeFiltre, categorie, permis, budget]
  );

  return (
    <>
      {/* ── FILTRES + CATALOGUE ─────────────── */}
      <section className="px-6 py-16 pt-32" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-3">
              Notre stock
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none"
              style={{ fontSize: 'clamp(2.5rem,4vw,3.5rem)' }}
            >
              Motos <em className="text-cp-mango not-italic">disponibles</em>
            </h2>
            <p className="text-sm text-cp-ink/55 mt-3 max-w-lg">
              Occasion contrôlée ou neuf à commander — toutes nos motos sont garanties.
            </p>
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mb-8 items-end">
            <div>
              <p className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-2">
                Type
              </p>
              <div className="flex gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFiltre(t)}
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${typeFiltre === t ? 'bg-cp-mango border-cp-mango text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-2">
                Catégorie
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategorie(c)}
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${categorie === c ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-2">
                Permis
              </p>
              <div className="flex gap-2">
                {PERMIS_OPTIONS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPermis(p)}
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${permis === p ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-2">
                Budget
              </p>
              <div className="flex gap-2">
                {BUDGETS.map((b) => (
                  <button
                    key={b.val}
                    onClick={() => setBudget(b.val)}
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${budget === b.val ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="cp-mono text-xs text-cp-ink/35 ml-auto">
              {motosFiltrees.length} moto{motosFiltrees.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Grille */}
          {motosFiltrees.length === 0 ? (
            <div className="text-center py-20">
              <p className="cp-title font-black text-cp-ink/20 text-4xl mb-3">AUCUN RÉSULTAT</p>
              <p className="text-cp-ink/40 text-sm">
                Essayez d&apos;élargir vos critères de recherche.
              </p>
              <button
                onClick={() => {
                  setTypeFiltre('Tous');
                  setCategorie('Toutes');
                  setPermis('Tous');
                  setBudget(999999);
                }}
                className="mt-4 text-sm text-cp-mango hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {motosFiltrees.map((m) => (
                <Link
                  key={m.id}
                  href={`/vente-moto/${m.id}`}
                  className="group bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(26,15,6,0.10)] hover:border-cp-mango/40 focus:outline-none focus:ring-2 focus:ring-cp-mango/50"
                >
                  <div className="relative h-48 overflow-hidden bg-[#F8F5F0]">
                    <Image
                      src={m.image}
                      alt={`${m.marque} ${m.modele}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#1A0F06]/80 to-transparent">
                      <p className="cp-title text-[0.75rem] font-bold text-[#E9C46A] tracking-widest uppercase">
                        {m.marque}
                      </p>
                    </div>
                    <span
                      className={`absolute top-3 left-3 text-white cp-mono text-[0.6rem] px-2.5 py-1 rounded-full tracking-widest uppercase ${
                        m.type === 'neuf' ? 'bg-cp-mango/90' : 'bg-cp-ink/80'
                      }`}
                    >
                      {m.type === 'neuf' ? 'Neuf' : 'Occasion'}
                    </span>
                    <span className="absolute top-3 right-3 bg-[#52C88A]/90 text-white cp-mono text-[0.6rem] px-2.5 py-1 rounded-full tracking-wide">
                      ✓ {m.type === 'neuf' ? 'Garantie 2 ans' : 'Contrôlée'}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="cp-title font-black text-cp-ink text-xl mb-1">{m.modele}</p>
                    <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-wide mb-3">
                      {m.annee} · {m.km.toLocaleString('fr-FR')} KM · {m.categorie.toUpperCase()} ·{' '}
                      {m.caracteristiques.permis ?? '-'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {m.options.slice(0, 3).map((o) => (
                        <span
                          key={o}
                          className="cp-mono text-[0.6rem] text-cp-ink/40 tracking-wide"
                        >
                          {o}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 mb-4 text-xs text-[#2A5C45] font-semibold">
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {m.type === 'neuf'
                        ? 'GARANTIE 2 ANS CONSTRUCTEUR'
                        : 'CONTRÔLÉE PAR NOS TECHNICIENS'}
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-[#F8F5F0]">
                      <div>
                        <p className="cp-title font-black text-cp-ink text-2xl leading-none">
                          {m.prix.toLocaleString('fr-FR')} €
                        </p>
                        <p className="text-xs text-cp-ink/35 mt-0.5">ou {m.mensualite} €/mois</p>
                      </div>
                      <span className="px-4 py-2 rounded-xl bg-cp-ink text-cp-cream text-xs font-semibold group-hover:bg-cp-mango transition-colors">
                        Voir la moto →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── REPRISE / ESTIMATION ───────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-3">
                Reprise & estimation
              </p>
              <h2 className="cp-title font-black text-cp-ink leading-tight mb-4 text-3xl md:text-4xl">
                Vous avez une moto
                <br />
                <span className="text-cp-mango">à céder ?</span>
              </h2>
              <p className="text-cp-ink/65 text-base leading-relaxed mb-6 max-w-md">
                Nous estimons votre moto gratuitement et vous proposons une reprise au meilleur
                prix. La somme peut servir d&apos;apport pour votre nouvelle moto, ou vous être
                versée directement.
              </p>

              <ul className="flex flex-col gap-3 mb-8">
                {[
                  'Estimation gratuite sous 24h ouvrées',
                  'Sans engagement de votre part',
                  'Reprise déduite du prix de la nouvelle moto',
                  'Rachat ferme possible même sans achat',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-cp-ink/70">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="#2A5C45"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                      className="mt-0.5 flex-shrink-0"
                      aria-hidden="true"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href={`/contact?sujet=${encodeURIComponent('Vente moto')}&reprise=1`}
                className="inline-flex items-center gap-2 bg-cp-ink text-cp-cream text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-cp-mango transition-colors"
              >
                Demander une estimation gratuite →
              </a>
            </div>

            <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 md:p-8 shadow-sm">
              <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-widest uppercase mb-4">
                Comment ça marche
              </p>

              <ol className="flex flex-col gap-5">
                {[
                  {
                    n: '01',
                    titre: 'Envoyez-nous les infos',
                    desc: 'Marque, modèle, année, kilométrage, état général + 3-5 photos via le formulaire.',
                  },
                  {
                    n: '02',
                    titre: 'On revient vers vous sous 24h',
                    desc: 'Notre équipe étudie votre dossier et vous propose une fourchette de reprise.',
                  },
                  {
                    n: '03',
                    titre: 'Estimation sur place',
                    desc: "Vous passez à l'atelier de Pointe-à-Pitre. Inspection visuelle + essai si applicable.",
                  },
                  {
                    n: '04',
                    titre: 'Offre ferme + transaction',
                    desc: 'Si tout correspond, offre définitive sous 48h. Paiement immédiat ou déduction.',
                  },
                ].map((step) => (
                  <li key={step.n} className="flex gap-4">
                    <span className="cp-mono font-bold text-cp-mango text-sm flex-shrink-0 w-8">
                      {step.n}
                    </span>
                    <div>
                      <p className="cp-title font-black text-cp-ink text-sm mb-1">{step.titre}</p>
                      <p className="text-xs text-cp-ink/55 leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <p className="text-[0.65rem] text-cp-ink/35 leading-relaxed mt-6 pt-5 border-t border-[#F0E8DC]">
                L&apos;estimation prend en compte la cote Argus moto, l&apos;état, le kilométrage,
                et la demande locale. Reprise hors motos accidentées non roulantes ou sans contrôle
                technique valide.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
