'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Vehicule, Disponibilite } from '@/lib/vehicules';
import { DispoRibbon } from '@/components/cp/DispoRibbon';
import { WHATSAPP_URL } from '@/lib/config';

// Tri des cartes : la vitrine montre d'abord ce qui s'achète encore.
const DISPO_ORDRE: Record<Disponibilite, number> = { disponible: 0, reserve: 1, vendu: 2 };

type Energie = 'Toutes' | 'Essence' | 'Diesel' | 'Hybride';
type BudgetMax = 15000 | 20000 | 30000 | 999999;
type TypeFiltre = 'Tous' | 'Occasion' | 'Neuf';

const TYPES: TypeFiltre[] = ['Tous', 'Occasion', 'Neuf'];
const ENERGIES: Energie[] = ['Toutes', 'Essence', 'Diesel', 'Hybride'];
const BUDGETS: { label: string; val: BudgetMax }[] = [
  { label: 'Tous budgets', val: 999999 },
  { label: '< 15 000 €', val: 15000 },
  { label: '< 20 000 €', val: 20000 },
  { label: '< 30 000 €', val: 30000 },
];

export function VenteVehiculeClient({ vehicules }: { vehicules: Vehicule[] }) {
  const [typeFiltre, setTypeFiltre] = useState<TypeFiltre>('Tous');
  const [energie, setEnergie] = useState<Energie>('Toutes');
  const [budget, setBudget] = useState<BudgetMax>(999999);

  // Simulateur financement
  const [simPrix, setSimPrix] = useState(15000);
  const [simApport, setSimApport] = useState(3000);
  const [simDuree, setSimDuree] = useState(48);

  const mensualiteSimulee = useMemo(() => {
    const montant = Math.max(0, simPrix - simApport);
    const tauxMensuel = 0.0499 / 12;
    if (montant <= 0) return 0;
    const m = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -simDuree));
    return Math.round(m);
  }, [simPrix, simApport, simDuree]);

  const vehiculesFiltres = useMemo(() => {
    const filtered = vehicules.filter((v) => {
      const matchType =
        typeFiltre === 'Tous' ||
        (typeFiltre === 'Occasion' && v.type === 'occasion') ||
        (typeFiltre === 'Neuf' && v.type === 'neuf');
      const matchEnergie = energie === 'Toutes' || v.energie === energie;
      const matchBudget = v.prix <= budget;
      return matchType && matchEnergie && matchBudget;
    });
    // Vendus repoussés en fin de grille — tri stable, ordre préservé par groupe.
    return filtered.sort(
      // disponibles d'abord, puis réservés (encore consultables), vendus en fin
      (a, b) => DISPO_ORDRE[a.disponibilite] - DISPO_ORDRE[b.disponibilite]
    );
  }, [vehicules, typeFiltre, energie, budget]);

  return (
    <>
      {/* ── FILTRES + CATALOGUE ─────────────── */}
      <section className="px-6 py-16 pt-32" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-3">
              Notre stock
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none"
              style={{ fontSize: 'clamp(2.5rem,4vw,3.5rem)' }}
            >
              Véhicules <em className="text-cp-mango not-italic">disponibles</em>
            </h2>
            <p className="text-sm text-cp-ink/55 mt-3 max-w-lg">
              Occasion contrôlée ou neuf à commander — toutes nos voitures sont garanties.
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
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${typeFiltre === t ? 'bg-cp-red border-cp-red text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-red hover:text-cp-mango'}`}
                  >
                    {t === 'Neuf' ? 'Neuf sur commande' : t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-2">
                Énergie
              </p>
              <div className="flex gap-2">
                {ENERGIES.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEnergie(e)}
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${energie === e ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-red hover:text-cp-mango'}`}
                  >
                    {e}
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
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${budget === b.val ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-red hover:text-cp-mango'}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="cp-mono text-xs text-cp-ink/35 ml-auto">
              {vehiculesFiltres.length} véhicule{vehiculesFiltres.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Grille */}
          {vehiculesFiltres.length === 0 ? (
            <div className="text-center py-20">
              <p className="cp-title font-black text-cp-ink/20 text-4xl mb-3">AUCUN RÉSULTAT</p>
              <p className="text-cp-ink/40 text-sm">
                Essayez d&apos;élargir vos critères de recherche.
              </p>
              <button
                onClick={() => {
                  setTypeFiltre('Tous');
                  setEnergie('Toutes');
                  setBudget(999999);
                }}
                className="mt-4 text-sm text-cp-mango hover:underline"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehiculesFiltres.map((v) =>
                v.disponibilite === 'vendu' ? (
                  <article
                    key={v.id}
                    aria-label={`${v.marque} ${v.modele} — vendu`}
                    className="bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden cursor-default"
                  >
                    <VehiculeCardBody v={v} statut="vendu" />
                  </article>
                ) : (
                  <Link
                    key={v.id}
                    href={`/vente-vehicule/${v.id}`}
                    className="group bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(26,15,6,0.10)] hover:border-cp-red/40 focus:outline-none focus:ring-2 focus:ring-cp-mango/50"
                  >
                    <VehiculeCardBody v={v} statut={v.disponibilite} />
                  </Link>
                )
              )}
            </div>
          )}

          {/* Bandeau contact — Max organise l'essai (handoff §5 : jamais de
              mascotte dans le hero vente, elle vit ici, au contact) */}
          <div className="relative mt-10 flex flex-wrap items-center gap-5 overflow-hidden rounded-2xl bg-cp-ink px-6 py-5 sm:flex-nowrap">
            <Image
              src="/images/mascottes/max-iso.webp"
              alt=""
              width={118}
              height={242}
              className="h-[118px] w-auto shrink-0 -my-9"
              style={{ filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.5))' }}
            />
            <p className="max-w-[52ch] text-[0.92rem] leading-relaxed text-cp-cream">
              «&nbsp;J&apos;ouvre le capot avec vous avant que vous signiez.&nbsp;» — Max Explorer
              organise l&apos;essai et répond sur WhatsApp.
            </p>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cp-tap shrink-0 rounded-xl bg-cp-red px-5 py-3 text-sm font-semibold text-cp-cream transition-colors hover:bg-[#B81F20] sm:ml-auto"
            >
              Écrire sur WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── REPRISE / ESTIMATION (#13 Stephane) ────────────── */}
      <section className="px-6 py-20" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-3">
                Reprise & estimation
              </p>
              <h2 className="cp-title font-black text-cp-ink leading-tight mb-4 text-3xl md:text-4xl">
                Vous avez un véhicule
                <br />
                <span className="text-cp-mango">à céder ?</span>
              </h2>
              <p className="text-cp-ink/65 text-base leading-relaxed mb-6 max-w-md">
                Nous estimons votre véhicule gratuitement et vous proposons une reprise au meilleur
                prix. La somme peut servir d&apos;apport pour votre nouvelle voiture, ou vous être
                versée directement.
              </p>

              <ul className="flex flex-col gap-3 mb-8">
                {[
                  'Estimation gratuite sous 48h ouvrées',
                  'Sans engagement de votre part',
                  'Reprise déduite du prix du nouveau véhicule',
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
                href={`/contact?sujet=${encodeURIComponent('Vente véhicule')}&reprise=1`}
                className="inline-flex items-center gap-2 bg-cp-ink text-cp-cream text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-cp-red transition-colors"
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
                    titre: 'On revient vers vous sous 48h (jours ouvrés)',
                    desc: 'Notre équipe étudie votre dossier et vous propose une fourchette de reprise.',
                  },
                  {
                    n: '03',
                    titre: 'Estimation sur place',
                    desc: "Vous passez à l'atelier de Pointe-à-Pitre. Inspection visuelle + essai routier.",
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
                L&apos;estimation prend en compte la cote Argus, l&apos;état du véhicule, le marché
                local et la demande. Reprise hors véhicules accidentés non roulants ou sans contrôle
                technique valide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── BRIDGE catalogue → financement ── */}
      <div
        className="relative z-10"
        style={{ marginTop: '-70px', marginBottom: '-70px', lineHeight: 0, pointerEvents: 'none' }}
      >
        <svg
          viewBox="0 0 1440 140"
          preserveAspectRatio="none"
          height="140"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%' }}
        >
          <defs>
            <linearGradient id="bVF" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F4EDE0" />
              <stop offset="100%" stopColor="#2C1A08" />
            </linearGradient>
            <radialGradient id="oVF" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E9C46A" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#E9C46A" stopOpacity="0" />
            </radialGradient>
            <filter id="blVF">
              <feGaussianBlur stdDeviation="20" />
            </filter>
          </defs>
          <rect width="1440" height="140" fill="url(#bVF)" />
          <path
            d="M0,40 Q360,110 720,70 Q1080,30 1440,90 L1440,140 L0,140 Z"
            fill="#2C1A08"
            opacity="0.5"
          />
          <path d="M0,75 Q400,130 720,95 Q1060,60 1440,115 L1440,140 L0,140 Z" fill="#2C1A08" />
          <ellipse cx="720" cy="88" rx="280" ry="48" fill="url(#oVF)" filter="url(#blVF)">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
          </ellipse>
        </svg>
      </div>

      {/* ── FINANCEMENT ─────────────────────── */}
      <section className="px-6 py-32" style={{ backgroundColor: '#2C1A08' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Info */}
          <div>
            <p
              className="cp-mono text-xs tracking-widest uppercase mb-4"
              style={{ color: '#E9C46A' }}
            >
              Financement sur mesure
            </p>
            <h2
              className="cp-title font-black leading-none mb-6"
              style={{ color: '#F8EDD8', fontSize: 'clamp(2rem,3.5vw,3rem)' }}
            >
              VOTRE BUDGET,
              <br />
              <em style={{ color: '#E9C46A' }} className="not-italic">
                NOS SOLUTIONS
              </em>
            </h2>
            <p
              className="text-sm leading-relaxed mb-8 max-w-sm"
              style={{ color: 'rgba(192,144,96,0.9)' }}
            >
              Nous vous accompagnons dans le financement de votre véhicule. Solutions adaptées à
              votre situation, réponse rapide.
            </p>

            {/* Options financement */}
            {[
              { title: 'Crédit auto classique', desc: 'De 12 à 72 mois, taux compétitif' },
              { title: 'LOA / LLD', desc: "Louer sans acheter, option d'achat possible" },
              {
                title: 'Reprise de votre véhicule',
                desc: 'Estimation gratuite, reprise au meilleur prix',
              },
            ].map((o) => (
              <div key={o.title} className="flex gap-3 items-start mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(233,196,106,0.10)',
                    border: '1px solid rgba(233,196,106,0.15)',
                  }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#E9C46A' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#F8EDD8' }}>
                    {o.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(128,96,64,0.9)' }}>
                    {o.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Simulateur */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
            <div className="px-6 py-4 bg-cp-ink">
              <p className="cp-title font-black text-cp-cream text-lg">Simulateur de financement</p>
              <p className="text-cp-cream/40 text-xs mt-0.5">
                Estimation indicative — taux 4,99% TAEG
              </p>
            </div>
            <div className="p-6 flex flex-col gap-5">
              {/* Prix */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider">
                    Prix du véhicule
                  </label>
                  <span className="cp-title font-black text-cp-mango text-sm">
                    {simPrix.toLocaleString('fr-FR')} €
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={30000}
                  step={500}
                  value={simPrix}
                  onChange={(e) => setSimPrix(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cp-mango"
                  style={{
                    background: `linear-gradient(to right, #E87200 ${((simPrix - 5000) / 25000) * 100}%, #E5DDD3 ${((simPrix - 5000) / 25000) * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-1 text-[0.65rem] text-cp-ink/30">
                  <span>5 000 €</span>
                  <span>30 000 €</span>
                </div>
              </div>

              {/* Apport */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider">
                    Apport personnel
                  </label>
                  <span className="cp-title font-black text-cp-ink text-sm">
                    {simApport.toLocaleString('fr-FR')} €
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.min(simPrix, 10000)}
                  step={500}
                  value={simApport}
                  onChange={(e) => setSimApport(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cp-mango"
                  style={{
                    background: `linear-gradient(to right, #1A0F06 ${(simApport / Math.min(simPrix, 10000)) * 100}%, #E5DDD3 ${(simApport / Math.min(simPrix, 10000)) * 100}%)`,
                  }}
                />
                <div className="flex justify-between mt-1 text-[0.65rem] text-cp-ink/30">
                  <span>0 €</span>
                  <span>{Math.min(simPrix, 10000).toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              {/* Durée */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider">
                    Durée
                  </label>
                  <span className="cp-title font-black text-cp-ink text-sm">{simDuree} mois</span>
                </div>
                <div className="flex gap-2">
                  {[24, 36, 48, 60, 72].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSimDuree(d)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${simDuree === d ? 'bg-cp-ink text-cp-cream' : 'border border-[#E5DDD3] text-cp-ink/50 hover:border-cp-red hover:text-cp-mango'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Résultat */}
              <div className="bg-[#F8F5F0] rounded-xl p-5 text-center">
                <p className="text-xs text-cp-ink/40 mb-1">Mensualité estimée</p>
                <p
                  className="cp-title font-black text-cp-mango"
                  style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
                >
                  {mensualiteSimulee} €
                  <span className="text-lg font-normal text-cp-ink/40">/mois</span>
                </p>
                <p className="text-xs text-cp-ink/35 mt-1">
                  Montant financé : {Math.max(0, simPrix - simApport).toLocaleString('fr-FR')} € ·{' '}
                  {simDuree} mois
                </p>
              </div>

              <a
                href={`/contact?sujet=${encodeURIComponent('Financement véhicule')}&financement=1`}
                className="w-full py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-red transition-colors text-center block"
              >
                Je suis intéressé par ce financement
              </a>
              <p className="text-[0.65rem] text-cp-ink/30 text-center leading-relaxed">
                Simulation non contractuelle. TAEG fixe 4,99%. Offre soumise à acceptation.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/**
 * Corps de carte véhicule (image + infos), partagé entre la carte cliquable
 * (disponible/réservé, enveloppée dans un <Link>) et la carte vendue
 * (enveloppée dans un <article> non-interactif).
 * Statuts : ruban de coin DispoRibbon (vendu = rouge, réservé = gold) —
 * la photo reste lisible, légèrement désaturée seulement quand c'est vendu.
 */
function VehiculeCardBody({ v, statut }: { v: Vehicule; statut: Disponibilite }) {
  const vendu = statut === 'vendu';
  const reserve = statut === 'reserve';
  return (
    <>
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#F8F5F0]">
        <Image
          src={v.image}
          alt={`${v.marque} ${v.modele}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={`object-cover transition-transform duration-500 ${
            vendu ? 'grayscale-[0.65] opacity-85' : 'group-hover:scale-105'
          }`}
        />
        {(vendu || reserve) && <DispoRibbon statut={statut} />}
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#1A0F06]/80 to-transparent">
          <p className="cp-title text-[0.75rem] font-bold text-[#E9C46A] tracking-widest uppercase">
            {v.marque}
          </p>
        </div>
        <span
          className={`absolute top-3 left-3 text-white cp-mono text-[0.6rem] px-2.5 py-1 rounded-full tracking-widest uppercase ${
            v.type === 'neuf' ? 'bg-cp-red/90' : 'bg-cp-ink/80'
          }`}
        >
          {v.type === 'neuf' ? 'Neuf' : 'Occasion'}
        </span>
        {!vendu && !reserve && (
          <span className="absolute top-3 right-3 bg-[#52C88A]/90 text-white cp-mono text-[0.6rem] px-2.5 py-1 rounded-full tracking-wide">
            ✓ {v.type === 'neuf' ? 'Garantie 3 ans' : 'Contrôlé'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        <p className="cp-title font-black text-cp-ink text-xl mb-1">{v.modele}</p>
        <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-wide mb-3">
          {v.annee} · {v.km.toLocaleString('fr-FR')} KM · {v.energie.toUpperCase()} ·{' '}
          {v.transmission}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {v.options.slice(0, 3).map((o) => (
            <span key={o} className="cp-mono text-[0.6rem] text-cp-ink/40 tracking-wide">
              {o}
            </span>
          ))}
        </div>

        {/* Garantie */}
        <div className="flex items-center gap-1.5 mb-4 text-xs text-[#2A5C45] font-semibold">
          <svg
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          GARANTIE 12 MOIS INCLUSE
        </div>

        <div className="flex items-end justify-between pt-4 border-t border-[#F8F5F0]">
          <div>
            <p className="cp-title font-black text-cp-ink text-2xl leading-none">
              {v.prix.toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-cp-ink/35 mt-0.5">ou {v.mensualite} €/mois</p>
          </div>
          {vendu ? (
            <span className="px-4 py-2 rounded-xl border border-cp-red/30 text-cp-red text-xs font-semibold bg-cp-red/[0.06]">
              A trouvé preneur
            </span>
          ) : reserve ? (
            <span className="px-4 py-2 rounded-xl border border-[#C8A040]/40 text-[#8A5A00] text-xs font-semibold bg-[#E9C46A]/15 group-hover:bg-[#E9C46A]/25 transition-colors">
              Réservé · voir quand même
            </span>
          ) : (
            <span className="px-4 py-2 rounded-xl bg-cp-ink text-cp-cream text-xs font-semibold group-hover:bg-cp-red transition-colors">
              Voir le véhicule →
            </span>
          )}
        </div>
        {vendu && (
          <p className="mt-3 text-[0.7rem] text-cp-ink/40 leading-snug">
            D&apos;autres arrivent régulièrement —{' '}
            <Link
              href="/contact?sujet=Vente+véhicule"
              className="text-cp-mango hover:underline pointer-events-auto"
            >
              contactez-nous
            </Link>{' '}
            pour être prévenu.
          </p>
        )}
      </div>
    </>
  );
}
