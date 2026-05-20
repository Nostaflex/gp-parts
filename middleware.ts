import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

/**
 * Middleware combiné :
 *  1. CSP nonce par requête (Phase 5 §9.14) — retrait de `'unsafe-inline'` du
 *     script-src. Le nonce est posé en header `x-nonce` côté request (lu via
 *     `headers()` dans les Server Components pour les <script> JSON-LD) ET en
 *     header `Content-Security-Policy` côté response (avec `strict-dynamic`
 *     pour que les scripts framework Next propagent leur confiance).
 *  2. Protection SSR /admin/* (présence cookie __session). Vérification
 *     cryptographique faite dans /api/sessionLogin (firebase-admin) — Edge
 *     runtime ne peut pas vérifier le JWT ici.
 */

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' : tout script chargé par un script noncé hérite de la
    // confiance. Permet aux chunks Next.js de se charger sans nonce explicite.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // styles : 'unsafe-inline' conservé (hors scope Phase 5)
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://firebasestorage.googleapis.com https://res.cloudinary.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ');
}

function isAdminGated(pathname: string): boolean {
  if (pathname === '/admin/login') return false;
  if (pathname.startsWith('/api/admin/emulator-login')) return false;
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Auth gate /admin/* + /api/admin/* (sauf login / emulator-login) ──
  if (isAdminGated(pathname)) {
    const session = request.cookies.get('__session');
    if (!session?.value) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── CSP nonce par requête ──
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  // Propage le nonce aux Server Components via header request `x-nonce`
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Apply à toutes les routes pages/API SAUF assets statiques / images /
  // prefetches Next router (pas besoin de re-générer un nonce pour eux).
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
