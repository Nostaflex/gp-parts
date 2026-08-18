'use client';

// Centre de préférences cookies SUR le site (handoff cp-v6 — renvoyer aux
// réglages Chrome n'est pas conforme : le retrait du consentement doit être
// aussi simple que son recueil). Vrais interrupteurs role="switch",
// essentiels verrouillés, choix HORODATÉ (preuve CNIL). Même clé et même
// event que CookieBanner/AnalyticsGate — un renommage unilatéral tuerait la
// mesure en silence.

import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/lib/config';
import { CONSENT_EVENT } from '@/components/gdpr/AnalyticsGate';

type Prefs = { analytics: boolean; marketing: boolean };

function lireConsentement(): { prefs: Prefs; timestamp: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cookieConsent);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return {
      prefs: { analytics: Boolean(c.analytics), marketing: Boolean(c.marketing) },
      timestamp: typeof c.timestamp === 'string' ? c.timestamp : '',
    };
  } catch {
    return null;
  }
}

function Interrupteur({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="cp-tap relative w-14 shrink-0 rounded-full border-0 transition-colors disabled:cursor-not-allowed disabled:opacity-55"
      style={{ height: '32px', background: checked ? '#52C88A' : '#DCD3C4' }}
    >
      <span
        aria-hidden="true"
        className="absolute top-[3px] h-[26px] w-[26px] rounded-full bg-white shadow-[0_1px_4px_rgba(26,15,6,0.3)] transition-transform"
        style={{ left: '3px', transform: checked ? 'translateX(24px)' : 'none' }}
      />
    </button>
  );
}

const PREFS_META: {
  key: keyof Prefs | 'essential';
  titre: string;
  desc: string;
  duree: string;
}[] = [
  {
    key: 'essential',
    titre: 'Strictement nécessaires',
    desc: 'Panier, session, mémorisation de votre choix de cookies. Sans eux le site ne fonctionne pas.',
    duree: 'Session à 12 mois',
  },
  {
    key: 'analytics',
    titre: 'Mesure d’audience',
    desc: 'Pages vues, parcours, pannes. Données agrégées, jamais nominatives.',
    duree: '13 mois',
  },
  {
    key: 'marketing',
    titre: 'Marketing',
    desc: 'Mesurer si une publication Facebook ou Instagram a amené une commande.',
    duree: '6 mois',
  },
];

export function CookiePrefsCenter() {
  const [prefs, setPrefs] = useState<Prefs>({ analytics: false, marketing: false });
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = lireConsentement();
    if (saved) {
      setPrefs(saved.prefs);
      if (saved.timestamp) setSavedAt(saved.timestamp);
    }
  }, []);

  const enregistrer = (p: Prefs) => {
    const timestamp = new Date().toISOString();
    try {
      localStorage.setItem(
        STORAGE_KEYS.cookieConsent,
        JSON.stringify({ essential: true, ...p, timestamp })
      );
    } catch {
      // localStorage indisponible (navigation privée) : le choix vaut pour la session.
    }
    window.dispatchEvent(new Event(CONSENT_EVENT));
    setPrefs(p);
    setSavedAt(timestamp);
  };

  const horodatage = savedAt
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(
        new Date(savedAt)
      )
    : null;

  return (
    <div>
      <div className="grid gap-2.5">
        {PREFS_META.map((m) => {
          const locked = m.key === 'essential';
          const checked = locked ? true : prefs[m.key as keyof Prefs];
          return (
            <div
              key={m.key}
              className={`flex items-start gap-4 rounded-2xl border border-[#E5DDD3] p-4 ${locked ? 'bg-[#F8F5F0]' : 'bg-white'}`}
            >
              <div className="flex-1">
                <b className="block text-[0.92rem] text-cp-ink">{m.titre}</b>
                <p className="mt-0.5 text-[0.8rem] text-cp-ink/55">{m.desc}</p>
                <span className="cp-mono mt-2 inline-block rounded-full bg-cp-cream px-2.5 py-1 text-[0.66rem] text-cp-ink/55">
                  {m.duree}
                </span>
              </div>
              <Interrupteur
                checked={checked}
                disabled={locked}
                label={locked ? 'Cookies nécessaires — toujours actifs' : m.titre}
                onToggle={
                  locked
                    ? undefined
                    : () =>
                        setPrefs((p) => ({
                          ...p,
                          [m.key]: !p[m.key as keyof Prefs],
                        }))
                }
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => enregistrer(prefs)}
          className="cp-tap rounded-xl bg-cp-ink px-5 py-3 text-sm font-semibold text-cp-cream transition-colors hover:bg-cp-red"
        >
          Enregistrer mes préférences
        </button>
        <button
          type="button"
          onClick={() => enregistrer({ analytics: true, marketing: true })}
          className="cp-tap rounded-xl border border-[#E5DDD3] px-5 py-3 text-sm font-semibold text-cp-ink/60 transition-colors hover:border-cp-red hover:text-cp-mango"
        >
          Tout accepter
        </button>
        <button
          type="button"
          onClick={() => enregistrer({ analytics: false, marketing: false })}
          className="cp-tap rounded-xl border border-[#E5DDD3] px-5 py-3 text-sm font-semibold text-cp-ink/60 transition-colors hover:border-cp-red hover:text-cp-mango"
        >
          Tout refuser
        </button>
        {horodatage && (
          <span className="cp-mono text-[0.7rem] text-[#2A5C45]" aria-live="polite">
            Enregistré · {horodatage}
          </span>
        )}
      </div>

      <p className="mt-4 text-[0.8rem] text-cp-ink/55">
        Votre choix est horodaté et conservé 6 mois dans votre navigateur, puis nous vous reposons
        la question — le retrait est aussi simple que l&apos;accord.
      </p>
    </div>
  );
}
