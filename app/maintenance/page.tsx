import type { Metadata } from 'next';
import Image from 'next/image';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeMaintenance, DEFAULT_MAINTENANCE } from '@/lib/maintenance';
import type { MaintenanceConfig } from '@/lib/maintenance';

// Le middleware réécrit tout le public ici quand meta/maintenance.enabled.
// Toujours dynamique : le titre/message viennent du BO, effet immédiat.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ouverture imminente — Car Performance',
  // Les robots ne doivent PAS indexer l'écran d'attente (le middleware sert
  // aussi un 503 + Retry-After, la double ceinture).
  robots: { index: false, follow: false },
};

async function getConfig(): Promise<MaintenanceConfig> {
  try {
    const snap = await getAdminFirestore().doc('meta/maintenance').get();
    return normalizeMaintenance(snap.exists ? snap.data() : null);
  } catch (err) {
    console.warn('[maintenance] lecture meta/maintenance échouée, défauts:', err);
    return { ...DEFAULT_MAINTENANCE };
  }
}

export default async function MaintenancePage() {
  const config = await getConfig();
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
      style={{ backgroundColor: '#0D0905' }}
    >
      {/* Orbe mangue qui respire — l'atelier n'est pas éteint, il prépare */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full"
        style={{
          width: '640px',
          height: '640px',
          top: '58%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'radial-gradient(circle, rgba(232,114,0,0.14) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex max-w-xl flex-col items-center">
        <p className="cp-mono mb-4 text-xs uppercase tracking-[0.2em] text-cp-mango">
          Car Performance · Guadeloupe
        </p>
        <h1
          className="cp-title font-black uppercase leading-none text-cp-cream"
          style={{ fontSize: 'clamp(2.4rem, 7vw, 4.5rem)', textWrap: 'balance' }}
        >
          {config.titre}
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-cp-cream/60">{config.message}</p>

        {/* Les deux mascottes attendent avec le visiteur */}
        <div className="mt-10 flex items-end gap-8">
          <Image
            src="/images/mascottes/splash-gant.webp"
            alt=""
            width={120}
            height={180}
            className="h-[140px] w-auto"
            style={{ filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.5))' }}
            priority
          />
          <Image
            src="/images/mascottes/max.webp"
            alt=""
            width={90}
            height={185}
            className="h-[150px] w-auto"
            style={{ filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.5))' }}
            priority
          />
        </div>

        <p className="cp-mono mt-10 text-[0.66rem] uppercase tracking-[0.14em] text-cp-cream/30">
          Zone industrielle de Jarry · Baie-Mahault
        </p>
      </div>
    </main>
  );
}
