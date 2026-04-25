'use client';

import { useState, useMemo } from 'react';

type Energie = 'Toutes' | 'Essence' | 'Diesel' | 'Hybride';
type BudgetMax = 15000 | 20000 | 30000 | 999999;

type Vehicule = {
  id: string;
  marque: string;
  modele: string;
  annee: number;
  km: number;
  energie: 'Essence' | 'Diesel' | 'Hybride';
  transmission: string;
  places: number;
  options: string[];
  prix: number;
  mensualite: number;
  image: string;
};

const VEHICULES: Vehicule[] = [
  {
    id: 'peugeot-308sw',
    marque: 'Peugeot',
    modele: '308 SW GT Line',
    annee: 2021,
    km: 42000,
    energie: 'Diesel',
    transmission: 'BVA',
    places: 5,
    options: ['Climatisation', 'GPS'],
    prix: 18900,
    mensualite: 289,
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80&fit=crop',
  },
  {
    id: 'renault-clio',
    marque: 'Renault',
    modele: 'Clio V Intens',
    annee: 2022,
    km: 28000,
    energie: 'Essence',
    transmission: 'BVM',
    places: 5,
    options: ['Clim auto'],
    prix: 14500,
    mensualite: 219,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80&fit=crop',
  },
  {
    id: 'citroen-c3',
    marque: 'Citroën',
    modele: 'C3 Shine Pack',
    annee: 2020,
    km: 55000,
    energie: 'Essence',
    transmission: 'BVM',
    places: 5,
    options: ['Clim manuelle'],
    prix: 11200,
    mensualite: 169,
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80&fit=crop',
  },
  {
    id: 'vw-golf',
    marque: 'Volkswagen',
    modele: 'Golf VIII Life',
    annee: 2023,
    km: 15000,
    energie: 'Diesel',
    transmission: 'BVA',
    places: 5,
    options: ['Carplay', 'Régulateur'],
    prix: 24900,
    mensualite: 379,
    image: 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=600&q=80&fit=crop',
  },
  {
    id: 'toyota-yaris',
    marque: 'Toyota',
    modele: 'Yaris Cross',
    annee: 2022,
    km: 32000,
    energie: 'Hybride',
    transmission: 'BVA',
    places: 5,
    options: ['SUV compact', 'Hybride'],
    prix: 16800,
    mensualite: 255,
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&q=80&fit=crop',
  },
];

const ENERGIES: Energie[] = ['Toutes', 'Essence', 'Diesel', 'Hybride'];
const BUDGETS: { label: string; val: BudgetMax }[] = [
  { label: 'Tous budgets', val: 999999 },
  { label: '< 15 000 €', val: 15000 },
  { label: '< 20 000 €', val: 20000 },
  { label: '< 30 000 €', val: 30000 },
];

export function VenteVoClient() {
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

  const vehiculesFiltres = useMemo(
    () =>
      VEHICULES.filter((v) => (energie === 'Toutes' || v.energie === energie) && v.prix <= budget),
    [energie, budget]
  );

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
          </div>

          {/* Filtres */}
          <div className="flex flex-wrap gap-4 mb-8 items-end">
            <div>
              <p className="text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-2">
                Énergie
              </p>
              <div className="flex gap-2">
                {ENERGIES.map((e) => (
                  <button
                    key={e}
                    onClick={() => setEnergie(e)}
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${energie === e ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
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
                    className={`text-xs px-4 py-2 rounded-full border transition-all ${budget === b.val ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
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
              {vehiculesFiltres.map((v) => (
                <div
                  key={v.id}
                  className="bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(26,15,6,0.10)]"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-[#F8F5F0]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={v.image}
                      alt={`${v.marque} ${v.modele}`}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#1A0F06]/80 to-transparent">
                      <p className="cp-title text-[0.75rem] font-bold text-[#E9C46A] tracking-widest uppercase">
                        {v.marque}
                      </p>
                    </div>
                    <span className="absolute top-3 right-3 bg-[#52C88A]/90 text-white cp-mono text-[0.6rem] px-2.5 py-1 rounded-full tracking-wide">
                      ✓ Expertisé
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <p className="cp-title font-black text-cp-ink text-xl mb-1">{v.modele}</p>
                    <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-wide mb-3">
                      {v.annee} · {v.km.toLocaleString('fr-FR')} KM · {v.energie.toUpperCase()} ·{' '}
                      {v.transmission}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {v.options.map((o) => (
                        <span
                          key={o}
                          className="cp-mono text-[0.6rem] text-cp-ink/40 tracking-wide"
                        >
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
                      GARANTIE 6 MOIS INCLUSE
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-[#F8F5F0]">
                      <div>
                        <p className="cp-title font-black text-cp-ink text-2xl leading-none">
                          {v.prix.toLocaleString('fr-FR')} €
                        </p>
                        <p className="text-xs text-cp-ink/35 mt-0.5">ou {v.mensualite} €/mois</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href="/reparation"
                          className="px-4 py-2 rounded-xl bg-cp-ink text-cp-cream text-xs font-semibold hover:bg-cp-mango transition-colors"
                        >
                          Nous contacter
                        </a>
                        <a
                          href="tel:+590590000000"
                          className="w-9 h-9 rounded-xl border border-[#E5DDD3] flex items-center justify-center text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango transition-colors"
                          aria-label="Appeler"
                        >
                          <svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.5a19.79 19.79 0 01-3-8.59A2 2 0 012.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9.91a16 16 0 006.16 6.16l1.27-.83a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${simDuree === d ? 'bg-cp-ink text-cp-cream' : 'border border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
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
                href="/reparation"
                className="w-full py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-mango transition-colors text-center block"
              >
                Nous contacter pour financer
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
