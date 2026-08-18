// Ledger d'events Stripe (audit 2026-08-18) : Stripe peut livrer le même
// event plusieurs fois, y compris en concurrence sur deux instances. Le doc
// id = event.id : un `create()` ne gagne qu'une fois — le perdant sait que
// l'event est déjà pris en charge et ne retraite rien.
import { getAdminFirestore } from '@/lib/firebase-admin';
import { ttlTimestamp } from '@/lib/server/ttl';

const LEDGER_TTL_MS = 13 * 30 * 24 * 60 * 60 * 1000; // ~13 mois

/** true = event revendiqué (premier arrivé) ; false = déjà traité. */
export async function claimStripeEvent(eventId: string, type: string): Promise<boolean> {
  const ref = getAdminFirestore().collection('stripe_events').doc(eventId);
  try {
    await ref.create({
      type,
      receivedAt: new Date().toISOString(),
      expiresAt: ttlTimestamp(Date.now() + LEDGER_TTL_MS),
    });
    return true;
  } catch (err) {
    if ((err as { code?: number }).code === 6) return false; // ALREADY_EXISTS
    throw err;
  }
}
