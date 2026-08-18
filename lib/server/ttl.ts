// lib/server/ttl.ts — écriture des champs TTL en Timestamp Firestore natif
// (Admin SDK). Voir lib/ttl.ts pour la lecture et le pourquoi.
import { Timestamp } from 'firebase-admin/firestore';

export function ttlTimestamp(unixMs: number): Timestamp {
  return Timestamp.fromMillis(unixMs);
}
