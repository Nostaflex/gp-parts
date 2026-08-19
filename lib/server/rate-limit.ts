// Rate limiting DURABLE (audit 2026-08-18, décision Djemil : Upstash Redis).
// Le honeypot seul est contournable ; l'in-memory v1 ne survivait pas aux
// instances serverless. Ici : sliding window partagé entre instances,
// par IP + par formulaire (bucket).
//
// FAIL-OPEN mais JAMAIS muet (doctrine) : sans credentials Redis, les
// soumissions passent et un WARN est émis une fois par process — le site ne
// casse pas pendant que les clés se créent.
//
// Credentials : UPSTASH_REDIS_REST_URL/TOKEN d'abord, sinon KV_REST_API_URL/
// TOKEN — les noms qu'injecte (et fait tourner) le marketplace Vercel. Sans
// ce fallback, une rotation Upstash rendrait les miroirs UPSTASH_* obsolètes
// et éteindrait le rate limiting en silence.
import { headers } from 'next/headers';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const WINDOW = '10 m';
/** Requêtes autorisées par IP et par bucket sur la fenêtre. */
const LIMITS: Record<string, number> = {
  checkout: 10,
  contact: 8,
  reparation: 8,
  lavage: 8,
  reservation: 8,
  'devis-lld': 8,
  rgpd: 8,
  // Proxy NHTSA : quelques essais légitimes par formulaire, jamais un tunnel.
  'decode-vin': 20,
};
const DEFAULT_LIMIT = 8;

let warned = false;
const limiters = new Map<string, Ratelimit>();

function redisCredentials(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

function getLimiter(bucket: string): Ratelimit | null {
  const credentials = redisCredentials();
  if (!credentials) {
    if (!warned) {
      warned = true;
      console.warn(
        '[rate-limit] Credentials Redis absents (ni UPSTASH_REDIS_REST_URL/' +
          'TOKEN ni KV_REST_API_URL/TOKEN) : rate limiting INACTIF (fail-open). ' +
          'Créer la base Upstash et poser les env vars.'
      );
    }
    return null;
  }
  let limiter = limiters.get(bucket);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis(credentials),
      limiter: Ratelimit.slidingWindow(LIMITS[bucket] ?? DEFAULT_LIMIT, WINDOW),
      prefix: `rl:${bucket}`,
    });
    limiters.set(bucket, limiter);
  }
  return limiter;
}

async function clientIp(): Promise<string> {
  const h = await headers();
  // Vercel pose x-forwarded-for (première IP = client réel).
  const fwd = h.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
}

export type RateLimitVerdict = { ok: true } | { ok: false; message: string };

/**
 * À appeler en tête de chaque server action publique. Verdict, jamais de
 * throw : l'action renvoie l'erreur dans son format habituel.
 */
export async function checkRateLimit(bucket: string): Promise<RateLimitVerdict> {
  const limiter = getLimiter(bucket);
  if (!limiter) return { ok: true }; // fail-open (WARN émis ci-dessus)
  try {
    const ip = await clientIp();
    const { success } = await limiter.limit(ip);
    if (success) return { ok: true };
    return {
      ok: false,
      message: 'Trop de tentatives depuis votre connexion — réessayez dans quelques minutes.',
    };
  } catch (err) {
    // Redis injoignable : on ne bloque pas les clients légitimes.
    console.warn('[rate-limit] vérification échouée (fail-open):', err);
    return { ok: true };
  }
}
