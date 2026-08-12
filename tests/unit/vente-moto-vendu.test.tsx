import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { VenteMotoClient } from '@/app/vente-moto/VenteMotoClient';
import type { Moto } from '@/lib/motos';

const base: Moto = {
  id: 'm-dispo',
  type: 'occasion',
  marque: 'Yamaha',
  modele: 'DispoMoto',
  annee: 2022,
  km: 12000,
  categorie: 'Roadster',
  energie: 'Essence',
  options: [],
  prix: 6900,
  mensualite: 99,
  image: '/m.jpg',
  images: ['/m.jpg'],
  description: '',
  caracteristiques: { permis: 'A2' },
  reference: 'GP-M-DISPO',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};
const dispo: Moto = base;
const vendu: Moto = {
  ...base,
  id: 'm-vendu',
  modele: 'VenduMoto',
  reference: 'GP-M-VENDU',
  disponibilite: 'vendu',
};

describe('VenteMotoClient — motos vendues visibles mais non-interactives', () => {
  it('la moto disponible est un lien vers sa fiche', () => {
    render(<VenteMotoClient motos={[dispo]} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/vente-moto/m-dispo');
  });

  it('la moto vendue n’est PAS un lien et affiche le ruban « Vendu »', () => {
    render(<VenteMotoClient motos={[vendu]} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/vente-moto/m-vendu');
    expect(screen.getByText('Vendu')).toBeTruthy();
  });

  it('les vendues sont triées après les disponibles (ordre DOM)', () => {
    render(<VenteMotoClient motos={[vendu, dispo]} />);
    const dispoEl = screen.getByText('DispoMoto');
    const venduEl = screen.getByText('VenduMoto');
    expect(
      dispoEl.compareDocumentPosition(venduEl) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
