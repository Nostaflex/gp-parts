'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ConsentState {
  essential: true; // Toujours true (obligatoire)
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'gpparts-cookie-consent';

// Boutons alignés sur le design system storefront (cp-), pas les tokens legacy.
const BTN_PRIMARY =
  'bg-cp-ink text-cp-cream text-sm font-semibold px-4 py-2 rounded-full hover:bg-cp-red transition-colors';
const BTN_OUTLINE =
  'border border-cp-ink/15 text-cp-ink text-sm font-semibold px-4 py-2 rounded-full hover:border-cp-red hover:text-cp-mango transition-colors';
const BTN_GHOST =
  'text-cp-ink/60 text-sm font-semibold px-4 py-2 rounded-full hover:text-cp-mango transition-colors';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (consent: Omit<ConsentState, 'timestamp' | 'essential'>) => {
    const fullConsent: ConsentState = {
      essential: true,
      ...consent,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullConsent));
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const acceptAll = () => saveConsent({ analytics: true, marketing: true });
  const rejectAll = () => saveConsent({ analytics: false, marketing: false });
  const savePrefs = () => saveConsent(prefs);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-cookie-banner animate-slide-up"
      role="dialog"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-[0_20px_60px_rgba(26,15,6,0.14)] border border-[#E5DDD3] p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="cookie-title" className="cp-title font-black text-cp-ink text-xl mb-2">
              Ce site utilise des cookies
            </h2>
            <p id="cookie-desc" className="text-sm text-cp-ink/65 leading-relaxed">
              Nous utilisons des cookies essentiels au fonctionnement du site. Avec votre accord,
              nous utilisons aussi des cookies analytiques pour améliorer votre expérience et
              marketing pour nos communications. Vous pouvez modifier vos préférences à tout moment.
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-cp-ink/40 hover:text-cp-ink transition-colors p-1 rounded-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cp-mango/40"
            aria-label="Fermer (sans choisir — la bannière réapparaîtra à la prochaine visite)"
            title="Fermer sans choisir"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {showPrefs && (
          <div className="border-t border-[#E5DDD3] pt-4 mb-4 space-y-3">
            <label className="flex items-start gap-3 cursor-not-allowed opacity-60">
              <input type="checkbox" checked disabled className="mt-1" />
              <div>
                <span className="text-sm font-medium text-cp-ink">Essentiels (obligatoires)</span>
                <p className="text-xs text-cp-ink/55">
                  Nécessaires au fonctionnement du site (panier, session).
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                className="mt-1 accent-cp-red"
              />
              <div>
                <span className="text-sm font-medium text-cp-ink">Analytiques</span>
                <p className="text-xs text-cp-ink/55">
                  Nous aide à comprendre comment vous utilisez le site.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                className="mt-1 accent-cp-red"
              />
              <div>
                <span className="text-sm font-medium text-cp-ink">Marketing</span>
                <p className="text-xs text-cp-ink/55">
                  Pour vous envoyer des promotions pertinentes.
                </p>
              </div>
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!showPrefs ? (
            <>
              <button type="button" className={BTN_PRIMARY} onClick={acceptAll}>
                Tout accepter
              </button>
              <button type="button" className={BTN_OUTLINE} onClick={rejectAll}>
                Tout refuser
              </button>
              <button type="button" className={BTN_GHOST} onClick={() => setShowPrefs(true)}>
                Paramétrer
              </button>
            </>
          ) : (
            <>
              <button type="button" className={BTN_PRIMARY} onClick={savePrefs}>
                Enregistrer mes préférences
              </button>
              <button type="button" className={BTN_OUTLINE} onClick={() => setShowPrefs(false)}>
                Retour
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
