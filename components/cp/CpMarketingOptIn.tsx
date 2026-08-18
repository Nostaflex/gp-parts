'use client';

// Case marketing FACULTATIVE sous les formulaires (handoff cp-v6, lot 6) :
// jamais pré-cochée, distincte du consentement de traitement (obligatoire),
// et câblée bout-en-bout — le choix est écrit dans la demande/réservation et
// visible au BO. Une case décorative serait pire que pas de case.

import { useId } from 'react';

export function CpMarketingOptIn({
  checked,
  onChange,
  tone = 'light',
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  /** 'light' = fond clair (cream/blanc), 'dark' = section sombre (Pit Lane). */
  tone?: 'light' | 'dark';
}) {
  const inputId = useId();
  const label = tone === 'dark' ? 'text-cp-cream/60' : 'text-cp-ink/60';
  return (
    <div className="flex items-start gap-3">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-pointer accent-cp-mango"
      />
      <label htmlFor={inputId} className={`cursor-pointer text-xs leading-relaxed ${label}`}>
        Je souhaite recevoir les offres et actualités de Car Performance{' '}
        <span className={tone === 'dark' ? 'text-cp-cream/40' : 'text-cp-ink/40'}>
          (facultatif — retirable à tout moment)
        </span>
        .
      </label>
    </div>
  );
}
