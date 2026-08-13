'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';

import { STORAGE_KEYS } from '@/lib/config';

/** Événement custom émis par CookieBanner à chaque choix de consentement —
 * permet d'activer la mesure dans le même onglet, sans rechargement. */
export const CONSENT_EVENT = 'gpparts-consent-change';

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cookieConsent);
    if (!raw) return false;
    return (JSON.parse(raw) as { analytics?: boolean }).analytics === true;
  } catch {
    return false;
  }
}

/**
 * Vercel Web Analytics, conditionné au consentement « analytics » déjà
 * collecté par CookieBanner (le toggle existait sans aucun consommateur).
 *
 * Volontairement SANS le package npm `@vercel/analytics` : le script officiel
 * est servi par notre propre déploiement (`/_vercel/insights/script.js`,
 * same-origin → passe la CSP `script-src 'self'` sans modification), et zéro
 * dépendance = zéro surface supply-chain (décision post-audit npm 2026-08-13).
 * Cookieless. Aucun rendu tant que le consentement est absent ou refusé.
 * En dev local le script 404 silencieusement — la mesure n'existe qu'en prod.
 */
export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const sync = () => setEnabled(hasAnalyticsConsent());
    sync();
    // Même onglet (CookieBanner) + autres onglets (event storage natif).
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Le back-office n'est pas du trafic : jamais mesuré (review C4).
  if (pathname.startsWith('/admin')) return null;
  if (!enabled) return null;
  return <Script defer src="/_vercel/insights/script.js" strategy="afterInteractive" />;
}
