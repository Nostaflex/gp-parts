import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { getDemandesAdmin } from '@/lib/admin/demandes-server';
import { normalizeLegalInfo } from '@/lib/legal-info';
import type { LegalInfo } from '@/lib/legal-info';
import { RGPD_DELAI_JOURS } from '@/lib/rgpd';
import { DemandesClient } from '@/components/admin/DemandesClient';
import { LegalInfoForm } from '@/components/admin/LegalInfoForm';

export const dynamic = 'force-dynamic';

// Page BO « Légal » (décision Djemil 2026-08-18) : tout ce qui touche la
// conformité au même endroit — les exercices de droits RGPD reçus depuis le
// site ET la fiche d'identité légale contribuable. Zéro détour par Firestore.
export default async function LegalAdminPage() {
  await requireAdmin();

  // Filtre en mémoire plutôt que where('type','==','rgpd') + orderBy :
  // évite d'exiger un index composite Firestore pour une liste courte.
  const [toutes, liSnap] = await Promise.all([
    getDemandesAdmin({ limit: 200 }),
    getAdminFirestore().doc('meta/legalInfo').get(),
  ]);
  const demandesRgpd = toutes.filter((d) => d.type === 'rgpd');
  const nouvelles = demandesRgpd.filter((d) => d.status === 'nouvelle').length;
  const legalInfo: LegalInfo = normalizeLegalInfo(
    liSnap.exists ? (liSnap.data() as Partial<LegalInfo>) : null
  );

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="font-title text-h2" style={{ color: 'var(--text)' }}>
          Légal & RGPD
        </h1>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Les demandes d&apos;exercice de droits déposées sur{' '}
          <Link href="/mentions-legales" target="_blank" style={{ color: 'var(--blue)' }}>
            la page mentions légales
          </Link>{' '}
          arrivent ici. Délai légal de réponse : {RGPD_DELAI_JOURS} jours — l&apos;échéance est
          affichée sur chaque demande.
        </p>
      </div>

      <div
        className="rounded-[14px] p-4 text-body-sm"
        style={{
          background: nouvelles > 0 ? 'rgba(0,122,255,0.08)' : 'var(--surface)',
          border: '1px solid rgba(198,198,200,0.5)',
          color: 'var(--text)',
        }}
      >
        {demandesRgpd.length === 0
          ? 'Aucune demande d’exercice de droits pour le moment.'
          : `${demandesRgpd.length} demande${demandesRgpd.length > 1 ? 's' : ''} au total · ${nouvelles} nouvelle${nouvelles > 1 ? 's' : ''} à traiter.`}
        <span className="block" style={{ color: 'rgba(28,28,30,0.6)' }}>
          Avant de répondre à un droit d&apos;accès, d&apos;effacement ou de portabilité : vérifier
          l&apos;identité du demandeur (répondre à l&apos;email utilisé chez nous).
        </span>
      </div>

      {demandesRgpd.length > 0 && <DemandesClient demandes={demandesRgpd} />}

      <div className="pt-4">
        <h2 className="font-title text-h3" style={{ color: 'var(--text)' }}>
          Fiche d&apos;identité légale
        </h2>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          TVA intracommunautaire, médiateur de la consommation et RC pro — publiés sur la page
          mentions légales dès qu&apos;ils sont renseignés. Champ vide = « — à fournir ».
        </p>
      </div>
      <LegalInfoForm initial={legalInfo} />
    </section>
  );
}
