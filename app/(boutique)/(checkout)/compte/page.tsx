import type { Metadata } from 'next';
import { User, Package, MapPin, Lock } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Mon compte',
  description: 'Espace client Car Performance — historique de commandes, adresses, préférences.',
};

const FEATURES = [
  {
    icon: Package,
    title: 'Historique de commandes',
    desc: 'Retrouvez toutes vos commandes et leur statut en temps réel.',
  },
  {
    icon: MapPin,
    title: 'Adresses enregistrées',
    desc: 'Livraison et facturation pré-remplies pour gagner du temps.',
  },
  {
    icon: Lock,
    title: 'Données sécurisées',
    desc: 'Vos informations sont chiffrées et conformes au RGPD.',
  },
];

export default function ComptePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-cp-ink/8 rounded-full mx-auto flex items-center justify-center mb-4">
          <User size={36} strokeWidth={1.5} className="text-cp-ink/40" />
        </div>
        <p className="cp-mono text-xs text-cp-mango uppercase tracking-widest mb-2">
          Espace client
        </p>
        <h1 className="cp-title font-black text-cp-ink text-4xl mb-3">BIENTÔT DISPONIBLE</h1>
        <p className="text-cp-ink/55 text-base max-w-xl mx-auto leading-relaxed">
          L&apos;espace client sera bientôt ouvert. En attendant, vous pouvez passer commande en
          tant qu&apos;invité — aucun compte requis.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bg-white rounded-2xl border border-[#E5DDD3] p-5 text-center"
            >
              <Icon size={24} strokeWidth={1.5} className="text-cp-mango mx-auto mb-3" />
              <h2 className="cp-title font-black text-cp-ink text-lg mb-1">{f.title}</h2>
              <p className="text-xs text-cp-ink/50 leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ButtonLink href="/pieces" variant="primary" size="md">
          Parcourir le catalogue
        </ButtonLink>
        <ButtonLink href="/" variant="outline" size="md">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
    </div>
  );
}
