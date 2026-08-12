import type { Metadata } from 'next';

import { requireAdmin } from '@/lib/admin/auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { getAdapter } from '@/lib/data';
import { normalizeSocialSettings } from '@/lib/social-settings';
import type { SocialSettings } from '@/lib/social-settings';

import { SocialPostsClient } from './SocialPostsClient';

export const metadata: Metadata = {
  title: 'Posts sociaux — Admin',
  robots: { index: false, follow: false },
};

// Inventaire réel (Firestore) — jamais le seed statique figé. force-dynamic +
// getAdapter() : même chemin que /admin/leboncoin.
export const dynamic = 'force-dynamic';

export default async function PostsSociauxPage() {
  await requireAdmin();
  const adapter = await getAdapter();
  const [vehicules, motos, snap] = await Promise.all([
    adapter.getVehicules(),
    adapter.getMotos(),
    getAdminFirestore().doc('meta/socialSettings').get(),
  ]);
  const settings: SocialSettings = normalizeSocialSettings(
    snap.exists ? (snap.data() as Partial<SocialSettings>) : null
  );

  return <SocialPostsClient vehicules={vehicules} motos={motos} settings={settings} />;
}
