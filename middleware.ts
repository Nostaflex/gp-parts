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

  // Protéger toutes les autres routes /admin/*
  const session = request.cookies.get('__session');
  if (!session?.value) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
