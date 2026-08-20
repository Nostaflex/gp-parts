import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../app/location/actions', () => ({
  validateReservation: vi.fn(async () => ({ success: true, errors: {}, reference: 'LOC-TEST' })),
  checkDispo: vi.fn(async () => ({ unavailableIds: [] })),
  submitDevisLLD: vi.fn(async () => ({ success: true, errors: {} })),
  getBusyRanges: vi.fn(async () => []),
}));

import { checkDispo } from '../../app/location/actions';
import { LocationClient } from '../../app/location/LocationClient';
import { DEFAULT_LOCATION_SETTINGS } from '@/lib/location-settings';
import type { LocationCar } from '@/lib/location-cars';

const cars: LocationCar[] = [
  {
    id: 'clio-v',
    marque: 'Renault',
    modele: 'Clio V',
    categorie: 'Citadine',
    places: 5,
    transmission: 'Manuelle',
    carburant: 'Essence',
    prixJourEnCents: 4500,
    prixSemaineEnCents: 27000,
    image: '/images/location/clio.webp',
    disponible: true,
    reference: 'LOC-CLIO-V',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkDispo).mockResolvedValue({ unavailableIds: [] });
});

describe('LocationClient — dispo par dates', () => {
  it('sans dates : aucun appel checkDispo, bouton Réserver actif', () => {
    render(<LocationClient cars={cars} settings={DEFAULT_LOCATION_SETTINGS} initialBusy={[]} />);
    expect(checkDispo).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Réserver' })).toBeEnabled();
  });

  it('dates choisies + véhicule occupé → badge « Indisponible à ces dates » + bouton désactivé', async () => {
    vi.mocked(checkDispo).mockResolvedValue({ unavailableIds: ['clio-v'] });
    const { container } = render(
      <LocationClient cars={cars} settings={DEFAULT_LOCATION_SETTINGS} initialBusy={[]} />
    );
    const dateInputs = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2099-07-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2099-07-05' } });

    await waitFor(() => {
      expect(screen.getByText('Indisponible à ces dates')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Réserver' })).toBeDisabled();
    expect(checkDispo).toHaveBeenCalledWith('2099-07-01', '2099-07-05');
  });

  it('dates choisies + véhicule libre → badge « Disponible », bouton actif', async () => {
    const { container } = render(
      <LocationClient cars={cars} settings={DEFAULT_LOCATION_SETTINGS} initialBusy={[]} />
    );
    const dateInputs = container.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: '2099-07-01' } });
    fireEvent.change(dateInputs[1], { target: { value: '2099-07-05' } });

    await waitFor(() => expect(checkDispo).toHaveBeenCalled());
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Réserver' })).toBeEnabled();
  });
});
