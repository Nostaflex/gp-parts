import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

// Durée de vie du session cookie : 5 jours (max Firebase : 14 jours)
const SESSION_DURATION_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const { idToken } = (await request.json()) as { idToken: string };

  if (!idToken) {
    return NextResponse.json({ error: 'idToken manquant' }, { status: 400 });
  }

  try {
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const response = NextResponse.json({ status: 'ok' });
    response.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'ID token invalide' }, { status: 401 });
  }
}
