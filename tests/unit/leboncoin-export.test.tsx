import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { LeboncoinExportClient } from '@/app/admin/(shell)/leboncoin/LeboncoinExportClient';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

// navigator.clipboard n'existe pas sous happy-dom : stub minimal.
vi.stubGlobal('navigator', {
  ...globalThis.navigator,
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

const vehicule: Vehicule = {
  id: 'live-veh-1',
  type: 'occasion',
  marque: 'LIVEMARQUE',
  modele: 'ModeleLive',
  annee: 2024,
  km: 4200,
  energie: 'Essence',
  transmission: 'Manuelle',
  places: 5,
  options: ['Clim'],
  prix: 1590000,
  mensualite: 249,
  image: '/x.jpg',
  images: ['/x.jpg'],
  description: 'Véhicule ajouté par Stéphane depuis le back-office.',
  caracteristiques: { garantie: '12 mois' },
  reference: 'GP-LIVE-1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const moto: Moto = {
  id: 'live-moto-1',
  type: 'occasion',
  marque: 'LIVEMOTO',
  modele: 'MotoLive',
  annee: 2023,
  km: 8000,
  categorie: 'Roadster',
  energie: 'Essence',
  options: ['ABS'],
  prix: 690000,
  mensualite: 99,
  image: '/m.jpg',
  images: ['/m.jpg'],
  description: 'Moto ajoutée par Stéphane depuis le back-office.',
  caracteristiques: { cylindree: '689 cm³' },
  reference: 'GP-LIVEM-1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('LeboncoinExportClient — source de données live', () => {
  it('liste les véhicules et motos passés en props (inventaire réel), pas le seed statique', () => {
    render(<LeboncoinExportClient vehicules={[vehicule]} motos={[moto]} />);

    expect(screen.getByText('LIVEMARQUE ModeleLive')).toBeTruthy();
    expect(screen.getByText('LIVEMOTO MotoLive')).toBeTruthy();
  });

  it('sans inventaire → aucune annonce générée (pas de crash)', () => {
    render(<LeboncoinExportClient vehicules={[]} motos={[]} />);
    // Le titre de page reste rendu, la preview affiche le placeholder '—'.
    expect(screen.getByText('Export Leboncoin')).toBeTruthy();
  });

  it('génère un titre depuis le premier item de props (véhicule live sélectionné par défaut)', () => {
    render(<LeboncoinExportClient vehicules={[vehicule]} motos={[]} />);
    // Titre annonce : "MARQUE MODELE · ANNÉE · XX XXX km"
    expect(screen.getByText(/LIVEMARQUE ModeleLive · 2024/)).toBeTruthy();
  });
});
