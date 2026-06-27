import { describe, it, expect, vi, beforeEach } from 'vitest';

const setMock = vi.fn(async () => undefined);
vi.mock('@/lib/admin/auth', () => ({
  requireAdmin: vi.fn(async () => ({ uid: 'u1', email: 'admin@test.gp' })),
}));
vi.mock('@/lib/admin/audit', () => ({ writeAuditLog: vi.fn(async () => undefined) }));
vi.mock('@/lib/firebase-admin', () => ({
  getAdminFirestore: vi.fn(() => ({ doc: () => ({ set: setMock }) })),
}));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn(), revalidatePath: vi.fn() }));

import { requireAdmin } from '@/lib/admin/auth';
import { revalidateTag } from 'next/cache';
import { updateContactInfo } from '@/app/admin/(shell)/parametres/actions';

function fd(values: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.append(k, v);
  return f;
}

const valid = {
  phone: '+590690112233',
  phoneDisplay: '0690 11 22 33',
  email: 'contact@car.gp',
  whatsappNumber: '590690112233',
  street: 'Rue A',
  postalCode: '97110',
  city: 'Pointe',
  region: 'Guadeloupe',
  weekdayOpen: '07:30',
  weekdayClose: '17:30',
  saturdayOpen: '08:00',
  saturdayClose: '13:00',
  lat: '16.2',
  lng: '-61.5',
  facebook: '',
  instagram: '',
  google: '',
};

describe('updateContactInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('écrit le doc + audit + revalide', async () => {
    const res = await updateContactInfo(null, fd(valid));
    expect(requireAdmin).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'contact@car.gp', updatedBy: 'admin@test.gp' }),
      { merge: true }
    );
    expect(revalidateTag).toHaveBeenCalledWith('contact-info');
    expect(res).toEqual({ ok: true, message: expect.any(String) });
  });

  it("payload invalide → erreurs, pas d'écriture", async () => {
    const res = await updateContactInfo(null, fd({ ...valid, email: 'pasunemail' }));
    expect(setMock).not.toHaveBeenCalled();
    expect(res).toHaveProperty('errors');
  });

  it('refuse sans admin', async () => {
    vi.mocked(requireAdmin).mockRejectedValueOnce(new Error('Non authentifié'));
    await expect(updateContactInfo(null, fd(valid))).rejects.toThrow('Non authentifié');
  });
});
