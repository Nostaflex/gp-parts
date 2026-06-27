import { describe, it, expect } from 'vitest';
import { StaticAdapter } from '@/lib/data/static';
import type { Demande } from '@/lib/types';

const sample: Omit<Demande, 'id'> = {
  type: 'vehicule',
  status: 'nouvelle',
  nom: 'Jean Test',
  email: 'jean@test.gp',
  telephone: '0690112233',
  message: 'Intéressé par la 308',
  createdAt: '2026-06-27T10:00:00.000Z',
  updatedAt: '2026-06-27T10:00:00.000Z',
  expiresAt: 1893456000000,
};

describe('StaticAdapter.createDemande', () => {
  it('renvoie un id (dev fallback, pas de throw)', async () => {
    const id = await new StaticAdapter().createDemande(sample);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
