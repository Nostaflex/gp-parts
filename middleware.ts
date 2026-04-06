import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiter in-memory pour le middleware Edge Runtime.
 * Limite les tentatives d'auth échouées par IP.
 * Note : en serverless, chaque instance a sa propre Map.
 * Suffisant pour bloquer un brute-force basique.
 * Pour une protection avancée (multi-instance), utiliser un KV store (Phase 4+).
 */
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

function unauthorized(): NextResponse {
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Admin Area"',
    },
  });
}

export function middleware(request: NextRequest) {
  const url = new URL(request.url);

  // Only protect /admin routes
  if (!url.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // CRITICAL: env vars obligatoires en production — pas de fallback
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if (!adminUser || !adminPass) {
    // En dev sans env vars, on bloque l'accès avec un message clair
    // plutôt que d'utiliser un mot de passe par défaut.
    if (process.env.NODE_ENV === 'development') {
      return new NextResponse(
        'Admin: configurez ADMIN_USER et ADMIN_PASS dans .env.local\n\n' +
          'Créez le fichier .env.local à la racine du projet :\n' +
          'ADMIN_USER=votre_user\n' +
          'ADMIN_PASS=votre_mot_de_passe\n',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }
    // En production, bloquer complètement si les env vars manquent
    return new NextResponse('Service unavailable', { status: 503 });
  }

  // Rate limiting par IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests — réessayez dans 15 minutes', {
      status: 429,
      headers: {
        'Retry-After': '900',
      },
    });
  }

  // Basic auth check
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return unauthorized();
  }

  const providedAuth = authHeader.slice(6);
  const expectedAuth = btoa(`${adminUser}:${adminPass}`);

  if (providedAuth !== expectedAuth) {
    recordFailedAttempt(ip);
    return unauthorized();
  }

  // Auth réussie — reset le compteur
  clearFailedAttempts(ip);

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
