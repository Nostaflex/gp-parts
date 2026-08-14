import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpFooter } from '@/components/cp/CpFooter';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { AvisForm } from './AvisForm';

export const metadata: Metadata = {
  title: 'Laisser un avis',
  description:
    'Partagez votre expérience Car Performance : réparation, lavage, location ou achat. Votre avis est lu et modéré avant publication.',
  alternates: { canonical: '/avis' },
};

export default async function AvisPage() {
  const flags = await getCachedFeatureFlags();
  if (!flags.avis) notFound();

  return (
    <>
      <CpHeader />
      <section className="pt-28 pb-24 px-6" style={{ backgroundColor: '#F8F5F0' }}>
        <div className="max-w-2xl mx-auto">
          <p className="cp-mono text-cp-ink/35 text-xs tracking-widest uppercase mb-4">
            Votre expérience compte
          </p>
          <h1
            className="cp-title font-black text-cp-ink leading-none mb-6"
            style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}
          >
            LAISSER UN AVIS
          </h1>
          <p className="text-cp-ink/60 text-sm leading-relaxed mb-10 max-w-xl">
            Chaque avis est lu par notre équipe et publié après modération, sans contrepartie. Nous
            ne modifions jamais le contenu d&apos;un avis : il est publié tel quel, ou ne l&apos;est
            pas.
          </p>
          <AvisForm />
        </div>
      </section>
      <CpFooter />
    </>
  );
}
