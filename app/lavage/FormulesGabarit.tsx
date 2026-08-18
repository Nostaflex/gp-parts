'use client';

import { useState } from 'react';
import { formatPrice, cn } from '@/lib/utils';
import type { LavageFormule } from '@/lib/lavage-settings';

/**
 * Formules avec sélecteur de gabarit unique en tête (handoff cp-v4, écran 2) :
 * un segmented Citadine / Gamme B / SUV… construit depuis les labels de tarifs
 * (données BO — jamais de liste en dur), et UNE ligne de prix par carte au lieu
 * du tableau complet. Formule sans tarif pour le gabarit → « Sur devis ·
 * vu en atelier ».
 */
export function FormulesGabarit({ formules }: { formules: LavageFormule[] }) {
  const gabarits = Array.from(new Set(formules.flatMap((f) => f.tarifs.map((t) => t.label))));
  const [gabarit, setGabarit] = useState(gabarits[0] ?? '');

  return (
    <div>
      {gabarits.length > 1 && (
        <div
          role="radiogroup"
          aria-label="Gabarit de votre véhicule"
          className="inline-flex flex-wrap gap-1 bg-white border border-[#E5DDD3] rounded-full p-1 mb-8"
        >
          {gabarits.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={g === gabarit}
              onClick={() => setGabarit(g)}
              className={cn(
                'cp-tap cp-mono text-xs tracking-wide px-5 rounded-full transition-colors',
                g === gabarit ? 'bg-cp-ink text-cp-cream' : 'text-cp-ink/60 hover:text-cp-ink'
              )}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {formules.map((f) => {
          const tarif = f.tarifs.find((t) => t.label === gabarit);
          return (
            <div
              key={f.nom}
              className="bg-white rounded-2xl border border-[#E5DDD3] p-8 flex flex-col"
            >
              <h3 className="cp-title font-black text-cp-ink text-3xl mb-2">
                {f.nom.toUpperCase()}
              </h3>
              <p className="text-cp-ink/55 text-sm leading-relaxed mb-5">{f.description}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
                {f.inclus.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-cp-ink/70">
                    <span className="text-[#52C88A] mt-0.5" aria-hidden="true">
                      ✓
                    </span>
                    {i}
                  </li>
                ))}
              </ul>
              <div className="mt-auto border-t border-[#F8F5F0] pt-4">
                {tarif ? (
                  <>
                    <p className="flex items-baseline gap-2">
                      <span className="cp-title font-black text-cp-lagon text-3xl">
                        {formatPrice(tarif.prixTTCEnCents)}
                      </span>
                      <span className="cp-mono text-cp-lab-l text-xs tracking-wide">
                        TTC · {tarif.label}
                      </span>
                    </p>
                    <p className="text-[0.7rem] text-cp-lab-l mt-1">Prix TTC — TVA 8,5 % incluse</p>
                  </>
                ) : (
                  <p className="cp-mono text-cp-mango text-sm tracking-wide">
                    Sur devis · vu en atelier
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
