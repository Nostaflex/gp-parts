import type { Metadata } from 'next';
import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-6 py-24"
      style={{ backgroundColor: '#F4EDE0' }}
    >
      <div className="max-w-xl mx-auto text-center">
        <p
          className="cp-title font-black text-cp-red leading-none mb-2"
          style={{ fontSize: 'clamp(4rem, 12vw, 9rem)' }}
        >
          404
        </p>
        <h1 className="cp-title font-black text-cp-ink text-3xl md:text-4xl mb-4">
          Page introuvable
        </h1>
        <p className="text-cp-ink/60 text-base leading-relaxed mb-8 max-w-md mx-auto">
          La page ou la pièce que vous cherchez n&apos;existe pas ou a été déplacée. Vérifiez
          l&apos;URL ou explorez notre catalogue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-cp-ink text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-red transition-colors"
          >
            <Home size={18} strokeWidth={1.75} /> Retour à l&apos;accueil
          </Link>
          <Link
            href="/pieces"
            className="inline-flex items-center justify-center gap-2 border border-cp-ink/15 text-cp-ink font-semibold px-6 py-3 rounded-full hover:border-cp-red hover:text-cp-mango transition-colors"
          >
            <Search size={18} strokeWidth={1.75} /> Parcourir le catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
