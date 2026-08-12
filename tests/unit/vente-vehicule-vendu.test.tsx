import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { VenteVehiculeClient } from '@/app/vente-vehicule/VenteVehiculeClient';
import type { Vehicule } from '@/lib/vehicules';

const base: Vehicule = {
  id: 'v-dispo',
  type: 'occasion',
  marque: 'Peugeot',
  modele: 'DispoModele',
  annee: 2021,
  km: 30000,
  energie: 'Essence',
  transmission: 'Manuelle',
  places: 5,
  options: [],
  prix: 12900,
  mensualite: 199,
  image: '/x.jpg',
  images: ['/x.jpg'],
  description: '',
  caracteristiques: {},
  reference: 'GP-V-DISPO',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};
const dispo: Vehicule = base;
const vendu: Vehicule = {
  ...base,
  id: 'v-vendu',
  modele: 'VenduModele',
  reference: 'GP-V-VENDU',
  disponibilite: 'vendu',
};

describe('VenteVehiculeClient — véhicules vendus visibles mais non-interactifs', () => {
  it('le véhicule disponible est un lien vers sa fiche', () => {
    render(<VenteVehiculeClient vehicules={[dispo]} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/vente-vehicule/v-dispo');
  });

  it('le véhicule vendu n’est PAS un lien et affiche le ruban « Vendu »', () => {
    render(<VenteVehiculeClient vehicules={[vendu]} />);
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    expect(hrefs).not.toContain('/vente-vehicule/v-vendu');
    expect(screen.getByText('Vendu')).toBeTruthy();
  });

  it('les vendus sont triés après les disponibles (ordre DOM)', () => {
    // Entrée volontairement vendu-d’abord : sans tri il serait en tête.
    render(<VenteVehiculeClient vehicules={[vendu, dispo]} />);
    const dispoEl = screen.getByText('DispoModele');
    const venduEl = screen.getByText('VenduModele');
    // DOCUMENT_POSITION_FOLLOWING : venduEl vient APRÈS dispoEl.
    expect(
      dispoEl.compareDocumentPosition(venduEl) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
