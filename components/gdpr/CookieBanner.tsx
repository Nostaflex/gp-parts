'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface ConsentState {
  essential: true; // Toujours true (obligatoire)
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'gpparts-cookie-consent';

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
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-elevated border border-lin p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 id="cookie-title" className="font-title text-h4 text-basalt mb-2">
              Ce site utilise des cookies
            </h2>
            <p id="cookie-desc" className="text-body-sm text-basalt/70">
              Nous utilisons des cookies essentiels au fonctionnement du site. Avec votre accord,
              nous utilisons aussi des cookies analytiques pour améliorer votre expérience et
              marketing pour nos communications. Vous pouvez modifier vos préférences à tout moment.
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-basalt/40 hover:text-basalt transition-colors p-1 rounded-full flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volcanic"
            aria-label="Fermer (sans choisir — la bannière réapparaîtra à la prochaine visite)"
            title="Fermer sans choisir"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {showPrefs && (
          <div className="border-t border-lin pt-4 mb-4 space-y-3">
            <label className="flex items-start gap-3 cursor-not-allowed opacity-60">
              <input type="checkbox" checked disabled className="mt-1" />
              <div>
                <span className="text-body-sm font-medium text-basalt">
                  Essentiels (obligatoires)
                </span>
                <p className="text-caption text-basalt/60">
                  Nécessaires au fonctionnement du site (panier, session).
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) => setPrefs({ ...prefs, analytics: e.target.checked })}
                className="mt-1 accent-volcanic"
              />
              <div>
                <span className="text-body-sm font-medium text-basalt">Analytiques</span>
                <p className="text-caption text-basalt/60">
                  Nous aide à comprendre comment vous utilisez le site.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={prefs.marketing}
                onChange={(e) => setPrefs({ ...prefs, marketing: e.target.checked })}
                className="mt-1 accent-volcanic"
              />
              <div>
                <span className="text-body-sm font-medium text-basalt">Marketing</span>
                <p className="text-caption text-basalt/60">
                  Pour vous envoyer des promotions pertinentes.
                </p>
              </div>
            </label>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {!showPrefs ? (
            <>
              <Button variant="primary" size="sm" onClick={acceptAll}>
                Tout accepter
              </Button>
              <Button variant="outline" size="sm" onClick={rejectAll}>
                Tout refuser
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowPrefs(true)}>
                Paramétrer
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" size="sm" onClick={savePrefs}>
                Enregistrer mes préférences
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPrefs(false)}>
                Retour
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
