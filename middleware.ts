import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';
import { maintenanceFromRestDoc, DEFAULT_MAINTENANCE } from '@/lib/maintenance';

/**
 * Middleware Edge — deux responsabilités :
 *
 * 1. Protection SSR des routes /admin/* (présence du session cookie ;
 *    la vérification cryptographique vit dans /api/sessionLogin, Admin SDK).
 * 2. MODE MAINTENANCE (configurable au BO, doc meta/maintenance) : quand il
 *    est actif, toutes les pages PUBLIQUES sont réécrites vers /maintenance.
 *    Le BO (/admin), les APIs (webhook Stripe !) et les assets restent
 *    accessibles — Stéphane ne peut jamais s'enfermer dehors.
 */

// Cache in-memory par instance Edge : une lecture Firestore REST toutes les
// 30 s maximum, pas une par requête.
const MAINTENANCE_TTL_MS = 30_000;
let maintenanceCache: { enabled: boolean; ts: number } | null = null;
let warnedMaintenance = false;

async function isMaintenanceEnabled(): Promise<boolean> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.ts < MAINTENANCE_TTL_MS) {
    return maintenanceCache.enabled;
  }
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!projectId || !apiKey) return false; // pas de Firebase configuré (dev statique)
  try {
    // Lecture REST non authentifiée : passe par les Security Rules
    // (meta/maintenance est en lecture publique).
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/meta/maintenance?key=${apiKey}`,
      { signal: AbortSignal.timeout(2500) }
    );
    let enabled = DEFAULT_MAINTENANCE.enabled;
    if (res.ok) {
      enabled = maintenanceFromRestDoc(await res.json()).enabled;
    } else if (res.status !== 404 && !warnedMaintenance) {
      // 404 = doc jamais créé → OFF légitime. Tout AUTRE statut (403 = règle
      // non déployée !) est une anomalie : fail-open, mais JAMAIS muet.
      warnedMaintenance = true;
      console.warn(
        `[middleware] meta/maintenance illisible (HTTP ${res.status}) — règle Firestore déployée ?`
      );
    }
    maintenanceCache = { enabled, ts: now };
    return enabled;
  } catch (err) {
    // Fail-open JAMAIS muet : le site reste servi, on le dit une fois.
    if (!warnedMaintenance) {
      warnedMaintenance = true;
      console.warn('[middleware] lecture meta/maintenance échouée (fail-open, site servi):', err);
    }
    maintenanceCache = { enabled: false, ts: now };
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Protection /admin + /api/admin (inchangée) ──────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }
    const session = request.cookies.get('__session');
    if (!session?.value) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 2. Mode maintenance sur le public ──────────────────────────────
  if (await isMaintenanceEnabled()) {
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    // Rewrite (pas redirect) : l'URL demandée reste dans la barre, et un
    // retour à la normale re-sert la page attendue sans redirection cassée.
    return NextResponse.rewrite(url, { status: 503, headers: { 'Retry-After': '3600' } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin (emulator-login exclu : c'est lui qui crée la session)
    '/admin/:path*',
    '/api/admin/((?!emulator-login).*)',
    // Public : tout SAUF api (webhooks !), assets Next, fichiers statiques
    // (images, robots.txt, sitemap, security.txt…) et /maintenance elle-même.
    '/((?!api|_next|maintenance|favicon\\.ico|robots\\.txt|sitemap|\\.well-known|images|documents|.*\\.[a-zA-Z0-9]+$).*)',
  ],
};
