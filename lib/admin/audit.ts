/**
 * Audit log immutable des mutations admin (Admin CMS v3 — Phase 3+).
 *
 * Chaque mutation (create/update/delete) en back-office écrit un doc dans
 * la collection Firestore `audit_log/`. Purge automatique après 12 mois via
 * TTL policy Firestore native sur le champ `expiresAt`.
 *
 * RGPD : pour `resourceType === 'demande'`, le `diff` (PII client : email,
 * téléphone, message) n'est JAMAIS écrit. On ne garde que la trace minimale
 * { actor, action, resourceId, timestamp }.
 *
 * Node.js runtime uniquement (Admin SDK). Ne pas importer côté client/Edge.
 */
import { getAdminFirestore } from '@/lib/firebase-admin';

const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 mois

export type AuditAction = 'create' | 'update' | 'delete' | 'restore' | 'denied';

export type AuditResourceType =
  | 'product'
  | 'vehicule'
  | 'moto'
  | 'order'
  | 'demande'
  | 'location-car'
  | 'reservation'
  | 'feature-flags'
  | 'contact-info'
  | 'location-settings'
  | 'lavage-settings'
  | 'lavage-dispos'
  | 'avis'
  | 'social-settings';

export interface AuditLogEntry {
  timestamp: number; // unix ms
  actor: string; // email admin authentifié
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  diff?: Record<string, { before: unknown; after: unknown }>;
  expiresAt: number; // unix ms — TTL Firestore native (+12 mois)
}

export interface WriteAuditLogInput {
  actor: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string;
  diff?: Record<string, { before: unknown; after: unknown }>;
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  const timestamp = Date.now();

  const entry: AuditLogEntry = {
    timestamp,
    actor: input.actor,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    expiresAt: timestamp + TTL_MS,
  };

  // RGPD : jamais de diff PII pour les demandes. Sinon, n'ajouter la clé
  // que si un diff est réellement fourni (create n'en a pas).
  if (input.resourceType !== 'demande' && input.diff !== undefined) {
    entry.diff = input.diff;
  }

  await getAdminFirestore().collection('audit_log').doc().set(entry);
}
