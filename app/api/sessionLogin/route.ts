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
      const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
      const isLocal =
        emulatorHost === 'localhost' ||
        emulatorHost.startsWith('localhost:') ||
        emulatorHost === '127.0.0.1' ||
        emulatorHost.startsWith('127.0.0.1:');
      if (!isLocal) {
        console.error('[sessionLogin] FIREBASE_AUTH_EMULATOR_HOST invalide:', emulatorHost);
        return NextResponse.json({ error: 'Configuration invalide' }, { status: 500 });
      }
      // Émulateur : décoder le JWT sans vérification cryptographique.
      // Sécurisé : ce chemin n'est actif que lorsque FIREBASE_AUTH_EMULATOR_HOST est défini
      // et pointe vers un hôte local.
      const payloadBase64 = idToken.split('.')[1];
      if (!payloadBase64) throw new Error('idToken malformé');
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
      cookieValue = payload.sub ?? payload.user_id;
      if (!cookieValue) throw new Error('uid introuvable dans le token émulateur');
    } else {
      // Production : session cookie opaque Firebase (JWT signé côté Google)
      cookieValue = await getAdminAuth().createSessionCookie(idToken, {
        expiresIn: SESSION_DURATION_MS,
      });
    }

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set('__session', cookieValue, COOKIE_OPTIONS);
    return response;
  } catch (err) {
    console.error('[sessionLogin] Échec de traitement du token :', err);
    return NextResponse.json({ error: 'ID token invalide' }, { status: 401 });
  }
}
