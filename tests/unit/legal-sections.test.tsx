import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LegalSections } from '../../app/mentions-legales/LegalSections';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';
import { DEFAULT_LEGAL_INFO } from '@/lib/legal-info';

describe('LegalSections — page légale cp-v6', () => {
  it('ne publie JAMAIS de zéros : les champs manquants disent « à fournir »', () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    expect(container.textContent).not.toContain('000 000 000');
    // TVA + médiateur absents au lancement (arbitrage A6) → nommés, en rouge.
    expect(screen.getAllByText(/à fournir/).length).toBeGreaterThanOrEqual(2);
  });

  it("l'identité publiée suit le Kbis du 11/09/2026 (siège transféré à Petit-Bourg)", () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    const texte = container.textContent;
    expect(texte).toContain('CAR PERFORMANCE');
    expect(texte).toContain('SAS à associé unique au capital de 1 500 €');
    // SIRET du siège actuel — le 00011 (Paris) est fermé depuis le 05/08/2026.
    expect(texte).toContain('102 854 023 00037');
    expect(texte).not.toContain('102 854 023 00011');
    expect(texte).toContain('Pointe-à-Pitre 102 854 023');
    expect(texte).toContain('615 chemin de Morne Bourg, 97170 Petit-Bourg');
    expect(texte).toContain('Stéphane Sophie, président');
  });

  it('le médiateur est publié avec son site internet (R616-1)', () => {
    const { container } = render(
      <LegalSections
        contactInfo={DEFAULT_CONTACT_INFO}
        legalInfo={{
          ...DEFAULT_LEGAL_INFO,
          mediateurNom: 'CM2C',
          mediateurUrl: 'https://www.cm2c.net',
        }}
      />
    );
    expect(container.textContent).toContain('CM2C — https://www.cm2c.net');
  });

  it('le registre RGPD déclare le permis de conduire (location) et la preuve de consentement', () => {
    const { container } = render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    expect(container.textContent).toContain('Permis de conduire');
    // Texte honnête (audit 2026-08-18) : le choix cookies vit dans le
    // navigateur — plus de promesse « 6 ans » non étayée.
    expect(container.textContent).toContain('Choix de cookies (horodaté)');
    expect(container.textContent).not.toContain('6 ans');
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

  it('les 5 droits ouvrent le formulaire BO (mailto en secours) + recours CNIL', () => {
    render(<LegalSections contactInfo={DEFAULT_CONTACT_INFO} />);
    const boutons = screen.getAllByRole('button', { name: 'Faire ma demande' });
    expect(boutons).toHaveLength(5);
    // Aucun formulaire tant qu'aucun droit n'est choisi.
    expect(screen.queryByRole('button', { name: /Envoyer ma demande/ })).toBeNull();
    fireEvent.click(boutons[0]);
    // Le formulaire s'ouvre : la demande partira au BO, l'email n'est qu'un secours.
    expect(screen.getByRole('button', { name: /Envoyer ma demande/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email utilisé chez nous/)).toBeInTheDocument();
    const secours = screen
      .getAllByRole('link')
      .find((a) => (a as HTMLAnchorElement).href.startsWith('mailto:'));
    expect(secours).toBeTruthy();
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
