import { getAdminFirestore } from '@/lib/firebase-admin';
import type { SocialConnection, SocialPostLog } from './types';

const CONNECTION_DOC = 'meta/social';
const POSTS_COLLECTION = 'social_posts';

export async function getSocialConnection(): Promise<SocialConnection | null> {
  const snap = await getAdminFirestore().doc(CONNECTION_DOC).get();
  return snap.exists ? (snap.data() as SocialConnection) : null;
}
export async function saveSocialConnection(c: SocialConnection): Promise<void> {
  await getAdminFirestore().doc(CONNECTION_DOC).set(c);
}
export async function clearSocialConnection(): Promise<void> {
  await getAdminFirestore().doc(CONNECTION_DOC).delete();
}
export async function logSocialPost(entry: SocialPostLog): Promise<void> {
  await getAdminFirestore().collection(POSTS_COLLECTION).add(entry);
}
export async function getRecentSocialPosts(): Promise<SocialPostLog[]> {
  const snap = await getAdminFirestore()
    .collection(POSTS_COLLECTION)
    .orderBy('postedAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map((d) => d.data() as SocialPostLog);
}
