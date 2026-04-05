import type { Metadata } from 'next';
import { User, Package, MapPin, Lock } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Mon compte',
  description: "Espace client GP Parts — historique de commandes, adresses, préférences.",
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
        <div className="w-20 h-20 bg-volcanic/10 rounded-full mx-auto flex items-center justify-center mb-4">
          <User size={36} strokeWidth={1.5} className="text-volcanic" />
        </div>
        <p className="text-overline uppercase text-basalt/50 mb-2">Espace client</p>
        <h1 className="font-title text-h1 text-basalt mb-3">Bientôt disponible</h1>
        <p className="text-body-lg text-basalt/70 max-w-xl mx-auto">
          L&apos;espace client sera bientôt ouvert. En attendant, vous pouvez passer commande en
          tant qu&apos;invité — aucun compte requis.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="bg-ivory rounded-2xl p-5 text-center">
              <Icon size={24} strokeWidth={1.5} className="text-volcanic mx-auto mb-3" />
              <h2 className="font-title text-h4 text-basalt mb-1">{f.title}</h2>
              <p className="text-caption text-basalt/60">{f.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ButtonLink href="/catalogue" variant="primary" size="md">
          Parcourir le catalogue
        </ButtonLink>
        <ButtonLink href="/" variant="outline" size="md">
          Retour à l&apos;accueil
        </ButtonLink>
      </div>
    </div>
  );
}
