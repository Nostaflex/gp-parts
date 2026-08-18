// lib/ttl.ts — lecture des champs TTL (isomorphe client/serveur).
// Audit 2026-08-18 : Firestore n'expire que des champs `Timestamp` ; nos
// `expiresAt` étaient des nombres Unix → la purge RGPD promise ne se
// produisait jamais. L'ÉCRITURE convertit en Timestamp (lib/server/ttl.ts) ;
// la LECTURE re-normalise en millisecondes pour garder les types TS et la
// sérialisation RSC inchangés — et tolère les documents legacy en nombre.
export function ttlMillis(v: unknown): number {
  if (typeof v === 'number') return v; // document legacy pré-migration
  if (v && typeof (v as { toMillis?: () => number }).toMillis === 'function') {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}
