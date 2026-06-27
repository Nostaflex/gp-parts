import { unstable_cache } from 'next/cache';
import { getAdapter } from '@/lib/data';
import type { ContactInfo } from '@/lib/contact-info';

/**
 * Coordonnées publiques, cachées et invalidables par tag.
 * `revalidateTag('contact-info')` (action BO) régénère footer/contact/fiches/JSON-LD.
 */
export const getCachedContactInfo = unstable_cache(
  async (): Promise<ContactInfo> => {
    const adapter = await getAdapter();
    return adapter.getContactInfo();
  },
  ['contact-info'],
  { tags: ['contact-info'] }
);
