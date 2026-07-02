'use server';

import { requireAdmin } from '@/lib/admin/auth';
import { getSocialConnection, clearSocialConnection, logSocialPost } from '@/lib/social/connection';
import { publishPost } from '@/lib/social/publish';
import type { PublishResult } from '@/lib/social/types';

export interface PublishActionInput {
  itemId: string;
  itemType: 'vehicule' | 'moto';
  imageUrls: string[];
  caption: string;
  toInstagram: boolean;
  toFacebook: boolean;
}

export async function publishSocialPost(
  input: PublishActionInput
): Promise<{ ok: boolean; result?: PublishResult; error?: string }> {
  await requireAdmin();
  const conn = await getSocialConnection();
  if (!conn)
    return { ok: false, error: 'Aucun compte connecté. Connecte Instagram + Facebook d’abord.' };
  if (!input.toInstagram && !input.toFacebook)
    return { ok: false, error: 'Choisis au moins une plateforme.' };

  const result = await publishPost(conn, {
    imageUrls: input.imageUrls,
    caption: input.caption,
    toInstagram: input.toInstagram,
    toFacebook: input.toFacebook,
  });

  const platforms: string[] = [];
  if (result.instagram) platforms.push('instagram');
  if (result.facebook) platforms.push('facebook');
  if (platforms.length > 0) {
    await logSocialPost({
      itemId: input.itemId,
      itemType: input.itemType,
      platforms,
      caption: input.caption,
      postedAt: new Date().toISOString(),
      igPermalink: result.instagram?.permalink,
      fbPostId: result.facebook?.postId,
    });
  }
  return { ok: result.errors.length === 0, result };
}

export async function disconnectSocial(): Promise<void> {
  await requireAdmin();
  await clearSocialConnection();
}
