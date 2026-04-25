'use client';

import Link from 'next/link';
import { ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/pieces', label: 'Catalogue' },
  { href: '/pieces?type=auto', label: 'Auto' },
  { href: '/pieces?type=moto', label: 'Moto' },
  { href: '/pieces?promo=1', label: 'Promos' },
  { href: '/compte', label: 'Compte' },
];

export function Navbar() {
  const { totalItems, isReady } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-4 z-nav px-4">
      <nav
        className="max-w-7xl mx-auto bg-basalt text-cream rounded-pill shadow-medium px-6 py-3 flex items-center justify-between"
        role="navigation"
        aria-label="Navigation principale"
      >
        <Link
          href="/"
          className="font-title text-h4 tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volcanic focus-visible:ring-offset-2 focus-visible:ring-offset-basalt rounded"
        >
          <span className="text-volcanic">GP</span> PARTS
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm font-body text-cream/80 hover:text-cream transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volcanic focus-visible:ring-offset-2 focus-visible:ring-offset-basalt rounded px-1"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Cart + mobile toggle */}
        <div className="flex items-center gap-4">
          <Link
            href="/panier"
            className="relative p-2 hover:bg-white/10 rounded-full transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volcanic"
            aria-label={`Panier, ${isReady ? totalItems : 0} article${totalItems > 1 ? 's' : ''}`}
          >
            <ShoppingCart size={20} strokeWidth={1.75} />
            {isReady && totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-volcanic text-white text-caption font-medium rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volcanic"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden max-w-7xl mx-auto overflow-hidden transition-all duration-normal',
          mobileOpen ? 'max-h-96 mt-2' : 'max-h-0'
        )}
      >
        <div className="bg-white rounded-2xl shadow-elevated p-4 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-body font-body font-medium text-basalt py-3 px-4 rounded-lg hover:bg-volcanic/5 transition-colors duration-fast"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
