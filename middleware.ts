import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

/**
 * Protection SSR des routes /admin/*.
 *
 * Le middleware vérifie la présence du session cookie (__session) créé par
 * /api/sessionLogin après une authentification Firebase Auth réussie.
 *
 * Note : la vérification ici est une vérification de présence (Edge Runtime —
 * firebase-admin ne tourne pas en Edge). La vérification cryptographique du
 * cookie est faite dans /api/sessionLogin via Firebase Admin SDK.
 *
 * Phase 5 : remplacer par une vérification JWT complète (jose + clés publiques
 * Firebase) pour une protection cryptographique en Edge.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // La page de login est accessible sans session
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  const session = request.cookies.get('__session');

  if (!session?.value) {
    // Routes API → 401 JSON (pas de redirect, le client JS gère)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    // Pages admin → redirect login
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // emulator-login est exclu : c'est lui qui crée la session, pas besoin d'en avoir une
  matcher: ['/admin/:path*', '/api/admin/((?!emulator-login).*)'],
};
