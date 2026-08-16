// GET /api/lavage/disponibilites?date=YYYY-MM-DD
//   → { bloques: string[] }  (créneaux pris d'UNE date)
// GET /api/lavage/disponibilites?from=YYYY-MM-DD&to=YYYY-MM-DD
//   → { dispos: { [date]: string[] } }  (créneaux pris de la plage — 1 requête
//     pour tout l'horizon du sélecteur Pit Lane)
// Libellés seulement, jamais la source ni l'id de demande (zéro PII en sortie).
import { NextResponse } from 'next/server';
import { DISPO_HORIZON_JOURS, isDateKey } from '@/lib/lavage-creneaux';
import { getPrisEffectifs } from '@/lib/server/lavage-dispos';

export const dynamic = 'force-dynamic';

const RANGE_MAX_MS = (DISPO_HORIZON_JOURS + 1) * 24 * 3600 * 1000;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const from = params.get('from');
  const to = params.get('to');

  try {
    if (from !== null || to !== null) {
      if (!from || !to || !isDateKey(from) || !isDateKey(to) || from > to) {
        return NextResponse.json(
          { error: 'Plage invalide (from ≤ to, YYYY-MM-DD attendu).' },
          { status: 400 }
        );
      }
      const span = new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime();
      if (span > RANGE_MAX_MS) {
        return NextResponse.json(
          { error: `Plage trop large (max ${DISPO_HORIZON_JOURS} jours).` },
          { status: 400 }
        );
      }
      const dates: string[] = [];
      const d = new Date(`${from}T00:00:00Z`);
      const fin = new Date(`${to}T00:00:00Z`);
      while (d.getTime() <= fin.getTime()) {
        dates.push(d.toISOString().slice(0, 10));
        d.setUTCDate(d.getUTCDate() + 1);
      }
      return NextResponse.json({ dispos: await getPrisEffectifs(dates) });
    }

    const date = params.get('date') ?? '';
    if (!isDateKey(date)) {
      return NextResponse.json({ error: 'Date invalide (YYYY-MM-DD attendu).' }, { status: 400 });
    }
    const effectifs = await getPrisEffectifs([date]);
    return NextResponse.json({ bloques: effectifs[date] ?? [] });
  } catch (err) {
    // Fail-open : le formulaire affiche tout disponible, la re-vérification
    // au submit reste la vraie garde. Jamais muet.
    console.warn('[disponibilites] lecture échouée (fail-open):', err);
    return NextResponse.json(from !== null ? { dispos: {} } : { bloques: [] });
  }
}
