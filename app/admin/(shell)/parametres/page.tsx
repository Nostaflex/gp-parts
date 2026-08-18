import { requireAdmin } from '@/lib/admin/auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeFeatureFlags } from '@/lib/feature-flags';
import type { FeatureFlags } from '@/lib/feature-flags';
import { normalizeContactInfo } from '@/lib/contact-info';
import type { ContactInfo } from '@/lib/contact-info';
import { normalizeLocationSettings } from '@/lib/location-settings';
import type { LocationSettings } from '@/lib/location-settings';
import { normalizeLegalInfo } from '@/lib/legal-info';
import type { LegalInfo } from '@/lib/legal-info';
import { FeatureFlagsForm } from '@/components/admin/FeatureFlagsForm';
import { ContactInfoForm } from '@/components/admin/ContactInfoForm';
import { LocationSettingsForm } from '@/components/admin/LocationSettingsForm';
import { LegalInfoForm } from '@/components/admin/LegalInfoForm';

export const dynamic = 'force-dynamic';

export default async function ParametresPage() {
  await requireAdmin();
  // Les 3 lectures meta/* sont indépendantes : Promise.all évite 3 allers-
  // retours Firestore séquentiels (~150-350 ms) sur chaque ouverture.
  const db = getAdminFirestore();
  const [snap, ciSnap, lsSnap, liSnap] = await Promise.all([
    db.doc('meta/featureFlags').get(),
    db.doc('meta/contactInfo').get(),
    db.doc('meta/locationSettings').get(),
    db.doc('meta/legalInfo').get(),
  ]);
  const initial: FeatureFlags = normalizeFeatureFlags(
    snap.exists ? (snap.data() as Partial<FeatureFlags>) : null
  );
  const contactInfo: ContactInfo = normalizeContactInfo(
    ciSnap.exists ? (ciSnap.data() as Partial<ContactInfo>) : null
  );
  const locationSettings: LocationSettings = normalizeLocationSettings(
    lsSnap.exists ? lsSnap.data() : null
  );
  const legalInfo: LegalInfo = normalizeLegalInfo(
    liSnap.exists ? (liSnap.data() as Partial<LegalInfo>) : null
  );

  return (
    <section className="flex flex-col gap-4 max-w-xl">
      <div>
        <h1 className="font-title text-h2" style={{ color: 'var(--text)' }}>
          Visibilité des sections
        </h1>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Activez ou désactivez les sections publiques du site. Effet immédiat, sans redéploiement.
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

      <div className="pt-4">
        <h2 className="font-title text-h3" style={{ color: 'var(--text)' }}>
          Location — conditions & cautions
        </h2>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          Conditions conducteur (âge, ancienneté de permis), surcharge jeune conducteur et cautions
          par défaut annoncées dans le funnel de réservation.
        </p>
      </div>
      <LocationSettingsForm initial={locationSettings} />

      <div className="pt-4">
        <h2 className="font-title text-h3" style={{ color: 'var(--text)' }}>
          Identité légale
        </h2>
        <p className="text-body-sm" style={{ color: 'rgba(28, 28, 30, 0.6)' }}>
          TVA intracommunautaire, médiateur de la consommation et RC pro — publiés sur la page
          mentions légales dès qu&apos;ils sont renseignés.
        </p>
      </div>
      <LegalInfoForm initial={legalInfo} />
    </section>
  );
}
