import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdmin, AdminError } from '@/lib/admin/auth';
import { exchangeCodeForConnection } from '@/lib/social/oauth';
import { saveSocialConnection } from '@/lib/social/connection';

export const dynamic = 'force-dynamic';

const DEST = '/admin/reseaux-sociaux';

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AdminError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  // `Cookie` étant un header interdit sur Request (Fetch), on lit via
  // next/headers (comme requireAdmin), pas via request.headers.
  const cookieState = (await cookies()).get('social_oauth_state')?.value;

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL(`${DEST}?error=state`, origin));
  }
  try {
    const redirectUri = new URL('/api/admin/social/callback', origin).toString();
    const conn = await exchangeCodeForConnection(code, redirectUri, new Date().toISOString());
    await saveSocialConnection(conn);
    const res = NextResponse.redirect(new URL(`${DEST}?connected=1`, origin));
    res.cookies.delete('social_oauth_state');
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'échec';
    return NextResponse.redirect(new URL(`${DEST}?error=${encodeURIComponent(msg)}`, origin));
  }
}
