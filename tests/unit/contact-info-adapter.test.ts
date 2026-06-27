import { describe, it, expect } from 'vitest';
import { StaticAdapter } from '@/lib/data/static';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';

describe('StaticAdapter.getContactInfo', () => {
  it('renvoie les défauts', async () => {
    await expect(new StaticAdapter().getContactInfo()).resolves.toEqual(DEFAULT_CONTACT_INFO);
  });
});
