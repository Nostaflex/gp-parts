import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

const LEGAL_LINKS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/cgv', label: 'CGV' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/cookies', label: 'Cookies' },
];

const CATEGORIES = [
  { href: '/catalogue?category=freinage', label: 'Freinage' },
  { href: '/catalogue?category=moteur', label: 'Moteur' },
  { href: '/catalogue?category=transmission', label: 'Transmission' },
  { href: '/catalogue?category=filtres', label: 'Filtres' },
];

export function Footer() {
  return (
    <footer className="bg-basalt text-cream mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="font-title text-h3">
              <span className="text-volcanic">GP</span> PARTS
            </Link>
            <p className="text-body-sm text-cream/60 mt-4 leading-relaxed">
              Pièces détachées auto & moto en Guadeloupe. Qualité origine, livraison rapide sur
              toute l&apos;île.
            </p>
          </div>

          {/* Catalogue */}
          <div>
            <h3 className="text-overline uppercase text-cream/60 mb-4">Catalogue</h3>
            <ul className="flex flex-col gap-2">
              {CATEGORIES.map((cat) => (
                <li key={cat.href}>
                  <Link
                    href={cat.href}
                    className="text-body-sm text-cream/80 hover:text-volcanic transition-colors duration-fast"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-overline uppercase text-cream/60 mb-4">Informations légales</h3>
            <ul className="flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-cream/80 hover:text-volcanic transition-colors duration-fast"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-overline uppercase text-cream/60 mb-4">Contact</h3>
            <ul className="flex flex-col gap-3 text-body-sm text-cream/80">
              <li className="flex items-start gap-2">
                <MapPin
                  size={16}
                  strokeWidth={1.75}
                  className="mt-0.5 flex-shrink-0 text-volcanic"
                />
                <span>
                  Zone Industrielle
                  <br />
                  97122 Baie-Mahault
                  <br />
                  Guadeloupe
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} strokeWidth={1.75} className="flex-shrink-0 text-volcanic" />
                <a href="tel:+590590000000" className="hover:text-volcanic transition-colors">
                  +590 590 00 00 00
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} strokeWidth={1.75} className="flex-shrink-0 text-volcanic" />
                <a
                  href="mailto:contact@gpparts.gp"
                  className="hover:text-volcanic transition-colors"
                >
                  contact@gpparts.gp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-caption text-cream/50">
            © {new Date().getFullYear()} GP Parts — Tous droits réservés
          </p>
          <p className="text-caption text-cream/50">Fait avec soin en Guadeloupe 🌋</p>
        </div>
      </div>
    </footer>
  );
}
