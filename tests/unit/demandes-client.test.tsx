import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/admin/(shell)/demandes/actions', () => ({
  updateDemandeStatus: vi.fn(),
  saveDemandeNote: vi.fn(),
}));

import { DemandesClient } from '@/components/admin/DemandesClient';
import type { Demande } from '@/lib/types';

const demandes: Demande[] = [
  {
    id: 'd1',
    type: 'vehicule',
    status: 'nouvelle',
    nom: 'Jean Test',
    email: 'jean@test.gp',
    telephone: '0690112233',
    message: 'Intéressé par la 308',
    createdAt: '2026-06-27T10:00:00.000Z',
    updatedAt: '2026-06-27T10:00:00.000Z',
    expiresAt: 1893456000000,
  },
];

describe('DemandesClient', () => {
  it('affiche les demandes', () => {
    render(<DemandesClient demandes={demandes} />);
    expect(screen.getByText('Jean Test')).toBeInTheDocument();
  });
});
