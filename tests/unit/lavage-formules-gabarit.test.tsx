import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { FormulesGabarit } from '@/app/lavage/FormulesGabarit';

const FORMULES = [
  {
    nom: 'Premium Wash',
    description: 'Le complet.',
    inclus: ['Shampoing manuel'],
    tarifs: [
      { label: 'Citadine', prixTTCEnCents: 3000 },
      { label: 'SUV', prixTTCEnCents: 9000 },
    ],
  },
  {
    nom: 'Rénovation',
    description: 'Vu en atelier.',
    inclus: ['Polissage'],
    tarifs: [],
  },
];

describe('FormulesGabarit — sélecteur de gabarit unique (handoff cp-v4)', () => {
  it('construit le segmented depuis les labels des tarifs (data BO, pas de dur)', () => {
    render(<FormulesGabarit formules={FORMULES} />);
    expect(screen.getByRole('radio', { name: 'Citadine' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'SUV' })).toBeInTheDocument();
  });

  it('affiche le prix du gabarit sélectionné (premier par défaut) pour chaque formule', () => {
    render(<FormulesGabarit formules={FORMULES} />);
    expect(screen.getByRole('radio', { name: 'Citadine' })).toBeChecked();
    expect(screen.getByText(/30,00\s*€/)).toBeInTheDocument();
  });

  it('change les prix au clic sur un autre gabarit', () => {
    render(<FormulesGabarit formules={FORMULES} />);
    fireEvent.click(screen.getByRole('radio', { name: 'SUV' }));
    expect(screen.getByText(/90,00\s*€/)).toBeInTheDocument();
    expect(screen.queryByText(/30,00\s*€/)).toBeNull();
  });

  it('affiche « Sur devis · vu en atelier » quand la formule n’a pas de tarif', () => {
    render(<FormulesGabarit formules={FORMULES} />);
    expect(screen.getByText(/Sur devis · vu en atelier/)).toBeInTheDocument();
  });

  it('donne une zone tactile ≥ 48 px aux boutons du segmented (.cp-tap)', () => {
    render(<FormulesGabarit formules={FORMULES} />);
    expect(screen.getByRole('radio', { name: 'Citadine' }).className).toContain('cp-tap');
  });
});
