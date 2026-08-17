import { requireAdminPage } from '@/lib/admin/auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { feriesPourDates } from '@/lib/jours-feries';
import { normalizeLavageSettings } from '@/lib/lavage-settings';
import { getBlocagesRange, getSemaineType } from '@/lib/server/lavage-dispos';
import { localDateISO } from '@/lib/utils';
import type { LavageSettings } from '@/lib/lavage-settings';
import { LavageSettingsForm } from './LavageSettingsForm';
import { LavageDisposGrid } from './LavageDisposGrid';
import { SemaineTypeForm } from './SemaineTypeForm';

import type { Metadata } from 'next';

// Fenêtre affichée par la grille de disponibilités (l'horizon d'écriture des
// actions est DISPO_HORIZON_JOURS — plus large, volontairement).
const GRILLE_JOURS = 30;

export const metadata: Metadata = {
  title: 'Lavage — Admin',
  robots: { index: false, follow: false },
};

// Source directe (Admin SDK) — l'admin voit sa modif immédiatement.
export const dynamic = 'force-dynamic';

export default async function AdminLavagePage() {
  await requireAdminPage();
  const snap = await getAdminFirestore().doc('meta/lavageSettings').get();
  const settings: LavageSettings = normalizeLavageSettings(snap.exists ? snap.data() : null);

  const dates = Array.from({ length: GRILLE_JOURS }, (_, i) => localDateISO(i));
  const [dispos, semaine] = await Promise.all([
    getBlocagesRange(dates[0], dates[dates.length - 1]),
    getSemaineType(),
  ]);
  const feries = feriesPourDates(dates);

  return (
    <section className="flex flex-col gap-4 p-4">
      <LavageDisposGrid dates={dates} initial={dispos} feries={feries} semaine={semaine} />
      <SemaineTypeForm initial={semaine} />
      <div>
        <h1 className="text-title" style={{ color: 'var(--text)' }}>
          Lavage — formules & tarifs
        </h1>
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Crée tes offres et packs, avec un tarif par gabarit (Citadine, Gamme B, SUV…) — sans
          tarif, la formule s&apos;affiche « Sur devis ». Effet immédiat sur la page /lavage, sans
          redéploiement.
        </p>
      </div>
      <LavageSettingsForm initial={settings} />
    </section>
  );
}
