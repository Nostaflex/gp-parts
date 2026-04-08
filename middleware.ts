import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

/**
 * Phase 4 : l'authentification admin est gérée côté client par Firebase Auth
 * (voir app/admin/layout.tsx). Le middleware n'a plus besoin de Basic Auth.
 *
 * On garde le middleware pour de futures protections (CSP headers, redirects, etc.)
 */
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
