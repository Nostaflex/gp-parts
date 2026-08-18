import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CookiePrefsCenter } from '@/components/gdpr/CookiePrefsCenter';
import { STORAGE_KEYS } from '@/lib/config';

beforeEach(() => {
  localStorage.clear();
});

describe('CookiePrefsCenter — centre de préférences conforme CNIL', () => {
  it('interrupteurs role="switch" : essentiels verrouillés ON, autres OFF par défaut', () => {
    render(<CookiePrefsCenter />);
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(3);
    const [essentiels, analytics, marketing] = switches;
    expect(essentiels).toBeDisabled();
    expect(essentiels).toHaveAttribute('aria-checked', 'true');
    expect(analytics).toHaveAttribute('aria-checked', 'false');
    expect(marketing).toHaveAttribute('aria-checked', 'false');
  });

  it('enregistrer écrit le consentement HORODATÉ dans la clé partagée + affiche la date', () => {
    render(<CookiePrefsCenter />);
    fireEvent.click(screen.getAllByRole('switch')[1]); // analytics ON
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.cookieConsent)!);
    expect(saved.essential).toBe(true);
    expect(saved.analytics).toBe(true);
    expect(saved.marketing).toBe(false);
    expect(new Date(saved.timestamp).getTime()).not.toBeNaN();
    expect(screen.getByText(/Enregistré ·/)).toBeInTheDocument();
  });

  it('relit un consentement existant au montage (switches + horodatage affiché)', () => {
    localStorage.setItem(
      STORAGE_KEYS.cookieConsent,
      JSON.stringify({
        essential: true,
        analytics: true,
        marketing: false,
        timestamp: '2026-08-01T10:00:00.000Z',
      })
    );
    render(<CookiePrefsCenter />);
    expect(screen.getAllByRole('switch')[1]).toHaveAttribute('aria-checked', 'true');
    expect(screen.getAllByRole('switch')[2]).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText(/Enregistré ·/)).toBeInTheDocument();
  });

  it('« Tout refuser » enregistre analytics et marketing à false', () => {
    render(<CookiePrefsCenter />);
    fireEvent.click(screen.getByRole('button', { name: 'Tout refuser' }));
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.cookieConsent)!);
    expect(saved.analytics).toBe(false);
    expect(saved.marketing).toBe(false);
  });
});
