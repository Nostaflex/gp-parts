// GET /api/lavage/disponibilites?date=YYYY-MM-DD
// Créneaux indisponibles d'une date pour le formulaire public — libellés
// seulement, jamais la source ni l'id de demande (zéro PII en sortie).
import { NextResponse } from 'next/server';
import { isDateKey } from '@/lib/lavage-creneaux';
import { getBlocages } from '@/lib/server/lavage-dispos';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get('date') ?? '';
  if (!isDateKey(date)) {
    return NextResponse.json({ error: 'Date invalide (YYYY-MM-DD attendu).' }, { status: 400 });
  }
  try {
    const bloques = await getBlocages(date);
    return NextResponse.json({ bloques: bloques.map((b) => b.creneau) });
  } catch (err) {
    // Fail-open : le formulaire affiche tout disponible, la re-vérification
    // au submit reste la vraie garde. Jamais muet.
    console.warn('[disponibilites] lecture échouée (fail-open):', err);
    return NextResponse.json({ bloques: [] });
  }
}
