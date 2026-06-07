'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type Props = {
  prix: number;
  marque: string;
  modele: string;
  motoId: string;
};

const TAEG = 0.0499; // 4,99% taux fixe — cohérent simulateur véhicule

function calcMensualite(montant: number, dureeMois: number): number {
  if (montant <= 0 || dureeMois <= 0) return 0;
  const tauxMensuel = TAEG / 12;
  const m = (montant * tauxMensuel) / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
  return Math.round(m);
}

export function FinancementMotoSimulator({ prix, marque, modele, motoId }: Props) {
  const apportDefault = Math.floor((prix * 0.2) / 1000) * 1000;
  const [apport, setApport] = useState(apportDefault);
  const [duree, setDuree] = useState(36);

  const montantFinance = Math.max(0, prix - apport);
  const mensualite = useMemo(() => calcMensualite(montantFinance, duree), [montantFinance, duree]);
  const coutTotal = mensualite * duree;
  const interets = Math.max(0, coutTotal - montantFinance);

  const contactHref = `/contact?sujet=${encodeURIComponent('Vente moto')}&vehicule=${encodeURIComponent(`${marque} ${modele}`)}&ref=${encodeURIComponent(motoId)}&financement=1`;

  return (
    <div className="bg-white border border-[#E5DDD3] rounded-2xl p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-2">
            Simulateur sur mesure
          </p>
          <h3 className="cp-title font-black text-cp-ink text-2xl">Estimez votre mensualité</h3>
        </div>
        <span className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-widest uppercase whitespace-nowrap">
          TAEG fixe {(TAEG * 100).toFixed(2).replace('.', ',')}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor={`apport-${motoId}`} className="text-xs font-semibold text-cp-ink/70">
              Apport
            </label>
            <span className="cp-title font-black text-cp-ink text-lg">
              {apport.toLocaleString('fr-FR')} €
            </span>
          </div>
          <input
            id={`apport-${motoId}`}
            type="range"
            min={0}
            max={Math.floor(prix * 0.5)}
            step={500}
            value={apport}
            onChange={(e) => setApport(Number(e.target.value))}
            className="w-full accent-cp-mango"
            aria-label="Apport financier"
          />
          <div className="flex justify-between text-[0.65rem] cp-mono text-cp-ink/40 mt-1">
            <span>0 €</span>
            <span>{Math.floor((prix * 0.5) / 1000)} 000 €</span>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor={`duree-${motoId}`} className="text-xs font-semibold text-cp-ink/70">
              Durée
            </label>
            <span className="cp-title font-black text-cp-ink text-lg">{duree} mois</span>
          </div>
          <input
            id={`duree-${motoId}`}
            type="range"
            min={12}
            max={60}
            step={6}
            value={duree}
            onChange={(e) => setDuree(Number(e.target.value))}
            className="w-full accent-cp-mango"
            aria-label="Durée du financement"
          />
          <div className="flex justify-between text-[0.65rem] cp-mono text-cp-ink/40 mt-1">
            <span>12 mois</span>
            <span>60 mois</span>
          </div>
        </div>
      </div>

      <div className="bg-[#F8F5F0] rounded-xl p-5 mb-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="cp-mono text-[0.6rem] text-cp-ink/40 tracking-widest uppercase mb-1">
              Mensualité
            </p>
            <p className="cp-title font-black text-cp-mango text-2xl md:text-3xl leading-none">
              {mensualite} €
            </p>
            <p className="text-[0.65rem] text-cp-ink/40 mt-1">/ mois</p>
          </div>
          <div className="border-l border-r border-[#E5DDD3]">
            <p className="cp-mono text-[0.6rem] text-cp-ink/40 tracking-widest uppercase mb-1">
              Montant financé
            </p>
            <p className="cp-title font-black text-cp-ink text-xl md:text-2xl leading-none">
              {montantFinance.toLocaleString('fr-FR')} €
            </p>
            <p className="text-[0.65rem] text-cp-ink/40 mt-1">après apport</p>
          </div>
          <div>
            <p className="cp-mono text-[0.6rem] text-cp-ink/40 tracking-widest uppercase mb-1">
              Coût total
            </p>
            <p className="cp-title font-black text-cp-ink text-xl md:text-2xl leading-none">
              {coutTotal.toLocaleString('fr-FR')} €
            </p>
            <p className="text-[0.65rem] text-cp-ink/40 mt-1">
              dont {interets.toLocaleString('fr-FR')} € d&apos;intérêts
            </p>
          </div>
        </div>
      </div>

      <Link
        href={contactHref}
        className="w-full inline-flex justify-center items-center gap-2 bg-cp-ink text-cp-cream text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-cp-red transition-colors"
      >
        Demander un dossier de financement →
      </Link>

      <p className="text-[0.65rem] text-cp-ink/35 text-center leading-relaxed mt-3">
        Simulation non contractuelle. Offre soumise à acceptation après étude du dossier. Un crédit
        vous engage et doit être remboursé.
      </p>
    </div>
  );
}
