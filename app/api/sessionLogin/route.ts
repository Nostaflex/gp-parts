import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

// Durée de vie du session cookie : 5 jours (max Firebase : 14 jours)
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

const COOKIE_OPTIONS = {
  httpOnly: true,
  // secure uniquement en production réelle (HTTPS) — pas en local ni en CI (http://localhost)
  secure: process.env.NODE_ENV === 'production' && !process.env.FIREBASE_AUTH_EMULATOR_HOST,
  sameSite: 'lax' as const,
  maxAge: SESSION_DURATION_MS / 1000,
  path: '/',
};

export async function POST(request: NextRequest) {
  const { idToken } = (await request.json()) as { idToken: string };

  if (!idToken) {
    return NextResponse.json({ error: 'idToken manquant' }, { status: 400 });
  }

  try {
    let cookieValue: string;

    if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
      // Émulateur : createSessionCookie non supporté — on vérifie l'idToken
      // et on stocke le uid comme valeur de cookie (suffisant pour le middleware)
      const decoded = await getAdminAuth().verifyIdToken(idToken);
      cookieValue = decoded.uid;
    } else {
      // Production : session cookie opaque Firebase (JWT signé côté Google)
      cookieValue = await getAdminAuth().createSessionCookie(idToken, {
        expiresIn: SESSION_DURATION_MS,
      });
    }

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set('__session', cookieValue, COOKIE_OPTIONS);
    return response;
  } catch {
    return NextResponse.json({ error: 'ID token invalide' }, { status: 401 });
  }
}
