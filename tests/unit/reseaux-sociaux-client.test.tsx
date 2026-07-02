import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/admin/reseaux-sociaux/actions', () => ({
  publishSocialPost: vi.fn(),
  disconnectSocial: vi.fn(),
}));

import { ReseauxSociauxClient } from '@/app/admin/(shell)/reseaux-sociaux/ReseauxSociauxClient';

const items = [
  {
    id: 'v1',
    type: 'vehicule' as const,
    label: 'Peugeot 208 (2021)',
    images: ['/a.jpg'],
    defaultCaption: 'cap',
  },
];

describe('ReseauxSociauxClient', () => {
  it('non connecté → invite à connecter', () => {
    render(<ReseauxSociauxClient connection={null} items={items} posted={{}} />);
    expect(screen.getByText(/Connecter/i)).toBeTruthy();
  });
  it('connecté → affiche le compte et la liste des véhicules', () => {
    render(
      <ReseauxSociauxClient
        connection={{ igUsername: 'carperf', pageName: 'Car Performance' }}
        items={items}
        posted={{}}
      />
    );
    expect(screen.getByText(/carperf/)).toBeTruthy();
    expect(screen.getByText('Peugeot 208 (2021)')).toBeTruthy();
  });
});
