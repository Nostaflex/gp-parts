import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpFooter } from '@/components/cp/CpFooter';
import { getLocationSettings } from '@/lib/server/location-settings';
import { getAdapter } from '@/lib/data';
import { CglSections } from './CglSections';

export const metadata: Metadata = {
  title: 'Conditions générales de location',
  alternates: { canonical: '/location/cgl' },
  description:
    'Conditions générales de location courte durée des véhicules Car Performance en Guadeloupe.',
};

export const dynamic = 'force-dynamic';

export default async function CglPage() {
  const adapter = await getAdapter();
  const [s, legalInfo] = await Promise.all([getLocationSettings(), adapter.getLegalInfo()]);
  return (
    <>
      <CpHeader darkSectionIds={[]} />
      <div style={{ backgroundColor: '#F8F5F0', minHeight: '60vh' }} className="pt-28 pb-16 px-6">
        <CglSections settings={s} legalInfo={legalInfo} />
      </div>
      <CpFooter />
    </>
  );
}
