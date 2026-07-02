import type { Metadata } from 'next';
import { getAdapter } from '@/lib/data';
import { getSocialConnection, getRecentSocialPosts } from '@/lib/social/connection';
import { buildCaption } from '@/lib/social/caption';
import { ReseauxSociauxClient, type SocialItem } from './ReseauxSociauxClient';

export const metadata: Metadata = {
  title: 'Réseaux sociaux — Admin',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function ReseauxSociauxPage() {
  const adapter = await getAdapter();
  const [vehicules, motos, connection, posts] = await Promise.all([
    adapter.getVehicules(),
    adapter.getMotos(),
    getSocialConnection(),
    getRecentSocialPosts(),
  ]);

  const items: SocialItem[] = [
    ...vehicules.map((v) => ({
      id: v.id,
      type: 'vehicule' as const,
      label: `${v.marque} ${v.modele} (${v.annee})`,
      images: v.images,
      defaultCaption: buildCaption(v),
    })),
    ...motos.map((m) => ({
      id: m.id,
      type: 'moto' as const,
      label: `${m.marque} ${m.modele} (${m.annee})`,
      images: m.images,
      defaultCaption: buildCaption(m),
    })),
  ];

  const posted: Record<string, string> = {};
  for (const p of posts) if (!posted[p.itemId]) posted[p.itemId] = p.postedAt;

  return (
    <ReseauxSociauxClient
      connection={
        connection ? { igUsername: connection.igUsername, pageName: connection.pageName } : null
      }
      items={items}
      posted={posted}
    />
  );
}
