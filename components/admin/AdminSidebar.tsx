'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Car,
  Bike,
  CarFront,
  CalendarCheck,
  ClipboardList,
  MessageSquare,
  Wrench,
  Megaphone,
  Share2,
  ScrollText,
  SlidersHorizontal,
  Menu,
  X,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** false = route pas encore livrée (Phase 4+), affichée grisée non cliquable */
  enabled: boolean;
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

// Routes actives = livrées Phase 1. Grisées = roadmap CMS v3 Phase 4-7.
const SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/admin/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, enabled: true },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { href: '/admin/products', label: 'Pièces', icon: Package, enabled: true },
      { href: '/admin/vehicules', label: 'Véhicules', icon: Car, enabled: true },
      { href: '/admin/motos', label: 'Motos', icon: Bike, enabled: true },
      { href: '/admin/location', label: 'Location', icon: CarFront, enabled: true },
    ],
  },
  {
    title: 'Activité',
    items: [
      { href: '/admin/commandes', label: 'Commandes', icon: ClipboardList, enabled: true },
      { href: '/admin/reservations', label: 'Réservations', icon: CalendarCheck, enabled: true },
      { href: '/admin/demandes', label: 'Demandes', icon: MessageSquare, enabled: true },
    ],
  },
  {
    title: 'Outils',
    items: [
      { href: '/admin/estimation', label: 'Estimation reprise', icon: Wrench, enabled: true },
      { href: '/admin/leboncoin', label: 'Export Leboncoin', icon: Megaphone, enabled: true },
      { href: '/admin/reseaux-sociaux', label: 'Réseaux sociaux', icon: Share2, enabled: true },
    ],
  },
  {
    title: 'Système',
    items: [
      { href: '/admin/parametres', label: 'Paramètres', icon: SlidersHorizontal, enabled: true },
      { href: '/admin/audit', label: 'Journal audit', icon: ScrollText, enabled: false },
    ],
  },
];

const IOS = {
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  border: 'var(--border)',
  bg: 'var(--bg)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textSubtle: 'rgba(28, 28, 30, 0.45)',
  textGhost: 'rgba(28, 28, 30, 0.28)',
  blueBg: 'rgba(0, 122, 255, 0.1)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
} as const;

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  if (!item.enabled) {
    return (
      <span
        aria-disabled="true"
        title="Disponible dans une prochaine version"
        className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-body-sm cursor-not-allowed select-none"
        style={{ color: IOS.textGhost }}
      >
        <Icon size={18} strokeWidth={1.75} />
        <span className="truncate">{item.label}</span>
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
      style={active ? { background: IOS.blueBg, color: IOS.blue } : { color: IOS.text }}
    >
      <Icon size={18} strokeWidth={1.75} style={{ color: active ? IOS.blue : IOS.textMuted }} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavContent({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Navigation admin">
      {SECTIONS.map((section, i) => (
        <div key={section.title ?? `section-${i}`} className="flex flex-col gap-0.5">
          {section.title && (
            <p className="text-overline uppercase px-3 pt-4 pb-1" style={{ color: IOS.textSubtle }}>
              {section.title}
            </p>
          )}
          {section.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

/**
 * Sidebar navigation back-office (iOS Clarity).
 *
 * - Desktop ≥1024px : permanente 240px
 * - Mobile <1024px  : masquée + bouton hamburger → drawer slide-in gauche
 *
 * Le collapse tablet 60px (spec §7) est reporté : nécessite un mode icônes-only
 * avec tooltips, hors scope Phase 1 (aucune route ne le requiert encore).
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Bouton hamburger — mobile/tablet uniquement */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Ouvrir le menu"
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 flex items-center justify-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
        style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}`, color: IOS.text }}
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      {/* Sidebar permanente desktop */}
      <aside
        className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 overflow-y-auto"
        style={{ background: IOS.surface, borderRight: `1px solid ${IOS.borderFaint}` }}
      >
        <div
          className="px-5 h-16 flex items-center"
          style={{ borderBottom: `1px solid ${IOS.borderFaint}` }}
        >
          <span className="font-title text-h3" style={{ color: IOS.text }}>
            Car Performance
          </span>
        </div>
        <NavContent pathname={pathname} />
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.35)' }}
          />
          <aside
            className="relative w-64 max-w-[80vw] h-full flex flex-col overflow-y-auto animate-fade-in"
            style={{ background: IOS.surface }}
          >
            <div
              className="px-5 h-16 flex items-center justify-between"
              style={{ borderBottom: `1px solid ${IOS.borderFaint}` }}
            >
              <span className="font-title text-h3" style={{ color: IOS.text }}>
                Car Performance
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="w-9 h-9 flex items-center justify-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                style={{ color: IOS.textMuted }}
              >
                <X size={20} strokeWidth={1.75} />
              </button>
            </div>
            <div onClick={() => setMobileOpen(false)}>
              <NavContent pathname={pathname} />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
