import { NextResponse } from 'next/server';
import { requireAdmin, AdminError } from '@/lib/admin/auth';
import { buildAuthUrl } from '@/lib/social/oauth';

export const dynamic = 'force-dynamic';

function randomState(): string {
  // crypto global (Node 18+/edge) — 16 octets hex.
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const origin = new URL(request.url).origin;
  const state = randomState();
  const redirectUri = new URL('/api/admin/social/callback', origin).toString();
  const res = NextResponse.redirect(buildAuthUrl(redirectUri, state));
  res.cookies.set('social_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return res;
}
