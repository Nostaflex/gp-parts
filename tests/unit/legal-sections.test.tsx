import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalSections } from '../../app/mentions-legales/LegalSections';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';

describe('LegalSections — page légale cp-v6', () => {
  it('ne publie JAMAIS de zéros : les champs manquants disent « à fournir »', () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    expect(container.textContent).not.toContain('000 000 000');
    // TVA + médiateur absents au lancement (arbitrage A6) → nommés, en rouge.
    expect(screen.getAllByText(/à fournir/).length).toBeGreaterThanOrEqual(2);
  });

  it('le SIRET réel de Stéphane est publié', () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    expect(container.textContent).toContain('102 854 023 00011');
  });

  it('le registre RGPD déclare le permis de conduire (location) et la preuve de consentement', () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    expect(container.textContent).toContain('Permis de conduire');
    expect(container.textContent).toContain('Preuve de consentement');
    // Sous-traitants nommés (obligation de transparence).
    for (const st of ['Vercel', 'Firebase', 'Stripe', 'Resend', 'WhatsApp']) {
      expect(container.textContent).toContain(st);
    }
  });

  it('garantie légale 2 ans (L217-3) DISTINCTE de la garantie commerciale 12 mois', () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    expect(container.textContent).toContain('L217-3');
    expect(container.textContent).toContain('L221-18');
    expect(container.textContent).toContain('L111-4');
  });

  it('les 6 droits sont actionnables (5 mailto pré-remplis + recours CNIL)', () => {
    render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    const mailtos = screen
      .getAllByRole('link')
      .filter((a) => (a as HTMLAnchorElement).href.startsWith('mailto:'));
    expect(mailtos.length).toBeGreaterThanOrEqual(5);
    const cnil = screen
      .getAllByRole('link')
      .find((a) => (a as HTMLAnchorElement).href.includes('cnil.fr'));
    expect(cnil).toBeTruthy();
  });

  it('le formulaire de rétractation est téléchargeable', () => {
    render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    const dl = screen
      .getAllByRole('link')
      .find((a) => (a as HTMLAnchorElement).href.includes('formulaire-retractation'));
    expect(dl).toBeTruthy();
  });

  it('le tableau des cookies nomme les VRAIES clés du projet', () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    for (const k of ['gpparts-cart', 'gpparts-cookie-consent', 'gpparts-last-order']) {
      expect(container.textContent).toContain(k);
    }
  });
});
