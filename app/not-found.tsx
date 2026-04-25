import { Home, Search } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <p className="font-title text-display text-volcanic mb-2">404</p>
      <h1 className="font-title text-h2 text-basalt mb-4">Page introuvable</h1>
      <p className="text-body text-basalt/70 mb-8">
        La page ou la pièce que vous cherchez n&apos;existe pas ou a été déplacée. Vérifiez
        l&apos;URL ou explorez notre catalogue.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <ButtonLink href="/" variant="primary" size="md">
          <Home size={18} strokeWidth={1.75} /> Retour à l&apos;accueil
        </ButtonLink>
        <ButtonLink href="/pieces" variant="outline" size="md">
          <Search size={18} strokeWidth={1.75} /> Parcourir le catalogue
        </ButtonLink>
      </div>
    </div>
  );
}
