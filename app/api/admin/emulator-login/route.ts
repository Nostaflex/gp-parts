import { NextRequest, NextResponse } from 'next/server';

const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // émulateur = HTTP local
  sameSite: 'lax' as const,
  maxAge: SESSION_DURATION_MS / 1000,
  path: '/',
};

export async function POST(request: NextRequest) {
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return NextResponse.json({ error: 'Non disponible hors émulateur' }, { status: 404 });
  }

  const { email, password } = (await request.json()) as { email: string; password: string };

  if (!email || !password) {
    return NextResponse.json({ error: 'email et password requis' }, { status: 400 });
  }

  const authHost = process.env.FIREBASE_AUTH_EMULATOR_HOST; // ex: 127.0.0.1:9099
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'demo-gp-parts';

  try {
    // Appel direct à l'API REST de l'émulateur Auth (endpoint v1 standard sans project ID)
    const authRes = await fetch(
      `http://${authHost}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    if (!authRes.ok) {
      const errBody = await authRes.text();
      console.error('[emulator-login] Auth emulator error:', authRes.status, errBody);
      return NextResponse.json({ error: 'Credentials invalides' }, { status: 401 });
    }

    const authData = (await authRes.json()) as { idToken: string; localId?: string };
    const { idToken, localId } = authData;

    // Extract UID: try JWT payload first, fall back to localId from response body.
    // The emulator JWT may use sub, user_id, or omit both — localId is always present.
    let cookieValue: string | undefined;
    try {
      const payloadBase64 = idToken.split('.')[1];
      if (payloadBase64) {
        const payload = JSON.parse(
          Buffer.from(payloadBase64, 'base64url').toString('utf8')
        ) as Record<string, unknown>;
        cookieValue = (payload.sub as string) || (payload.user_id as string) || undefined;
      }
    } catch {
      // JWT decode failed — fall through to localId
    }
    if (!cookieValue && localId) cookieValue = localId;
    if (!cookieValue) throw new Error('uid introuvable dans le token émulateur');

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set('__session', cookieValue, COOKIE_OPTIONS);
    console.log('[emulator-login] Session créée pour:', email, 'uid:', cookieValue);
    return response;
  } catch (err) {
    console.error('[emulator-login] Erreur:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
