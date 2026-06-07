import Image from 'next/image';
import Link from 'next/link';

export function CpFooter() {
  return (
    <footer className="py-16 px-6" style={{ backgroundColor: '#1A0F06' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Image
              src="/images/logo-carperformance.svg"
              alt="Car Performance"
              width={180}
              height={60}
              className="h-14 w-auto mb-3"
            />
            <span className="sr-only">Car Performance</span>
            <p className="text-cp-cream/40 text-sm leading-relaxed">
              Votre garage de confiance en Guadeloupe — passion, conseil technique, pièces de
              qualité.
            </p>
          </div>
          <div>
            <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">Services</p>
            <div className="flex flex-col gap-2">
              {[
                { href: '/reparation', label: 'Réparation' },
                { href: '/location', label: 'Location' },
                { href: '/vente-vehicule', label: 'Vente véhicule' },
                { href: '/vente-moto', label: 'Vente moto' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">
              Boutique pièces
            </p>
            <div className="flex flex-col gap-2">
              {[
                { href: '/pieces', label: 'Catalogue' },
                { href: '/pieces?type=auto', label: 'Auto' },
                { href: '/pieces?type=moto', label: 'Moto' },
                { href: '/pieces?promo=1', label: 'Promotions' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-cp-cream/30 text-xs uppercase tracking-widest mb-4">Informations</p>
            <div className="flex flex-col gap-2">
              {[
                { href: '/a-propos', label: 'À propos' },
                { href: '/contact', label: 'Contact' },
                { href: '/mentions-legales', label: 'Mentions légales' },
                { href: '/cgv', label: 'CGV' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-cp-cream/60 text-sm hover:text-cp-mango transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cp-cream/30 text-xs">
            © {new Date().getFullYear()} Car Performance Guadeloupe. Tous droits réservés.
          </p>
          <p className="cp-mono text-cp-cream/20 text-xs">Guadeloupe · 971</p>
        </div>
      </div>
    </footer>
  );
}
