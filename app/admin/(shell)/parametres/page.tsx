import { requireAdmin } from '@/lib/admin/auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeFeatureFlags } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';
import { normalizeContactInfo } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';
import { FeatureFlagsForm } from '@/components/admin/FeatureFlagsForm';
import { ContactInfoForm } from '@/components/admin/ContactInfoForm';

export const dynamic = 'force-dynamic';

export default async function ParametresPage() {
  await requireAdmin();
  const snap = await getAdminFirestore().doc('meta/featureFlags').get();
  const initial: FeatureFlags = normalizeFeatureFlags(
    snap.exists ? (snap.data() as Partial<FeatureFlags>) : null
  );
  const ciSnap = await getAdminFirestore().doc('meta/contactInfo').get();
  const contactInfo: ContactInfo = normalizeContactInfo(
    ciSnap.exists ? (ciSnap.data() as Partial<ContactInfo>) : null
  );

  return (
    <section className="flex flex-col gap-4 max-w-xl">
      <div>
        <h1 className="font-title text-h2" style={{ color: 'var(--text)' }}>
          Visibilité des sections
        </h1>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Activez ou désactivez les sections publiques du site. Effet immédiat, sans redéploiement.
          Vente véhicule reste toujours visible.
        </p>
      </div>
      <FeatureFlagsForm initial={initial} />

      <div className="pt-4">
        <h2 className="font-title text-h3" style={{ color: 'var(--text)' }}>
          Coordonnées
        </h2>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Téléphone, email, WhatsApp, adresse, horaires, GPS et réseaux affichés sur le site.
        </p>
      </div>
      <ContactInfoForm initial={contactInfo} />
    </section>
  );
}
