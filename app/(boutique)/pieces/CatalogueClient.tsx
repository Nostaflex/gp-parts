'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { PRODUCTS } from '@/lib/products';
import { CATEGORIES } from '@/lib/categories';
import type { ProductCategory, VehicleType } from '@/lib/types';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'name-asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'name-asc', label: 'Nom (A-Z)' },
];

export function CatalogueClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialType = searchParams.get('type') as VehicleType | null;
  const initialCategory = searchParams.get('category') as ProductCategory | null;
  const initialQuery = searchParams.get('q') ?? '';
  const initialSort = (searchParams.get('sort') as SortKey | null) ?? 'relevance';
  const showPromoOnly = searchParams.get('promo') === '1';

  const [query, setQuery] = useState(initialQuery);
  const [vehicleType, setVehicleType] = useState<VehicleType | 'all'>(initialType ?? 'all');
  const [category, setCategory] = useState<ProductCategory | 'all'>(initialCategory ?? 'all');
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Bug #2 — ref pour distinguer nos propres router.replace des navigations externes
  const lastWrittenQs = useRef<string | null>(null);

  // Filtres → URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (vehicleType !== 'all') params.set('type', vehicleType);
    if (category !== 'all') params.set('category', category);
    if (sort !== 'relevance') params.set('sort', sort);
    if (showPromoOnly) params.set('promo', '1');
    const qs = params.toString();
    lastWrittenQs.current = qs;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [query, vehicleType, category, sort, showPromoOnly, pathname, router]);

  // URL → Filtres (navigation externe — Bug #2)
  useEffect(() => {
    const currentQs = searchParams.toString();
    if (currentQs === lastWrittenQs.current) return;
    setVehicleType((searchParams.get('type') as VehicleType | null) ?? 'all');
    setCategory((searchParams.get('category') as ProductCategory | null) ?? 'all');
    setQuery(searchParams.get('q') ?? '');
    setSort((searchParams.get('sort') as SortKey | null) ?? 'relevance');
  }, [searchParams]);

  const filtered = useMemo(() => {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const list = PRODUCTS.filter((p) => {
      if (showPromoOnly && !p.isPromoted) return false;
      if (vehicleType !== 'all' && p.vehicleType !== vehicleType) return false;
      if (category !== 'all' && p.category !== category) return false;
      if (tokens.length > 0) {
        const haystack = [
          p.name,
          p.reference,
          ...p.compatibility.flatMap((c) => [c.brand, c.model]),
        ]
          .join(' ')
          .toLowerCase();
        return tokens.every((t) => haystack.includes(t));
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sort === 'name-asc') return a.name.localeCompare(b.name, 'fr');
      if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
      if (a.stock > 0 !== b.stock > 0) return a.stock > 0 ? -1 : 1;
      return 0;
    });
  }, [query, vehicleType, category, showPromoOnly, sort]);

  const chip = (active: boolean, promo = false) =>
    [
      'px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150 cursor-pointer whitespace-nowrap',
      active
        ? promo
          ? 'bg-cp-mango border-cp-mango text-white'
          : 'bg-cp-ink border-cp-ink text-cp-cream'
        : promo
          ? 'border-cp-mango text-cp-mango hover:bg-cp-mango/10'
          : 'border-[#E5DDD3] bg-white text-cp-ink/60 hover:border-cp-mango hover:text-cp-mango',
    ].join(' ');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 pt-4">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="mb-8 text-xs text-cp-ink/40">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-cp-mango transition-colors">
              Accueil
            </Link>
          </li>
          <li className="text-cp-ink/20">/</li>
          <li className="text-cp-ink/60 font-medium">Pièces détachées</li>
        </ol>
      </nav>

      {/* Recherche */}
      <div className="relative mb-6">
        <Search
          size={18}
          strokeWidth={1.75}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-cp-ink/30"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, référence, marque, modèle…"
          aria-label="Rechercher dans le catalogue"
          className="w-full bg-white border border-[#E5DDD3] rounded-2xl pl-12 pr-5 py-4 text-[0.9375rem] text-cp-ink placeholder:text-cp-ink/30 outline-none transition-all focus:border-cp-mango focus:ring-2 focus:ring-cp-mango/10"
        />
      </div>

      {/* Chips type + promo */}
      <div className="flex flex-wrap gap-2 mb-8 items-center">
        <span className="text-[0.6875rem] text-cp-ink/35 uppercase tracking-widest mr-1">Type</span>
        <button onClick={() => setVehicleType('all')} className={chip(vehicleType === 'all')}>
          Tous
        </button>
        <button onClick={() => setVehicleType('auto')} className={chip(vehicleType === 'auto')}>
          Auto
        </button>
        <button onClick={() => setVehicleType('moto')} className={chip(vehicleType === 'moto')}>
          Moto
        </button>
        <div className="flex-1" />
        <Link href="/pieces?promo=1" className={chip(showPromoOnly, true)}>
          🔥 Promotions
        </Link>
      </div>

      {/* Layout sidebar + grille */}
      <div className="flex gap-8 items-start">
        {/* Sidebar filtres — desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0 bg-white rounded-2xl border border-[#E5DDD3] p-6 sticky top-24">
          <p className="cp-title font-bold text-xl text-cp-ink mb-6">Filtres</p>

          {/* Catégories */}
          <div className="mb-6">
            <p className="text-[0.6875rem] font-semibold text-cp-ink/30 uppercase tracking-widest mb-3">
              Catégorie
            </p>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => setCategory('all')}
                className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${category === 'all' ? 'bg-cp-ink text-cp-cream font-medium' : 'text-cp-ink/60 hover:bg-[#F8F5F0]'}`}
              >
                Toutes catégories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${category === cat.id ? 'bg-cp-ink text-cp-cream font-medium' : 'text-cp-ink/60 hover:bg-[#F8F5F0]'}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Disponibilité */}
          <div>
            <p className="text-[0.6875rem] font-semibold text-cp-ink/30 uppercase tracking-widest mb-3">
              Disponibilité
            </p>
            <label className="flex items-center gap-2 text-sm text-cp-ink/60 cursor-pointer">
              <input type="checkbox" className="accent-cp-mango" readOnly checked={showPromoOnly} />
              En promotion uniquement
            </label>
          </div>

          <button
            onClick={() => {
              setCategory('all');
              setVehicleType('all');
              setQuery('');
              setSort('relevance');
            }}
            className="mt-6 w-full py-2.5 rounded-full border border-[#E5DDD3] text-sm text-cp-ink/40 hover:border-cp-mango hover:text-cp-mango transition-colors"
          >
            Réinitialiser
          </button>
        </aside>

        {/* Grille */}
        <div className="flex-1 min-w-0">
          {/* Header résultats */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-cp-ink/50" aria-live="polite">
              <strong className="text-cp-ink">{filtered.length}</strong> pièce
              {filtered.length > 1 ? 's' : ''} trouvée{filtered.length > 1 ? 's' : ''}
              {showPromoOnly && ' en promotion'}
            </p>
            <div className="flex items-center gap-3">
              {/* Mobile filter toggle */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1.5 text-sm text-cp-ink/60 border border-[#E5DDD3] bg-white px-3 py-2 rounded-xl hover:border-cp-mango transition-colors"
                aria-expanded={sidebarOpen}
              >
                <SlidersHorizontal size={15} /> Filtres
              </button>
              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-cp-ink/30" aria-hidden="true" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-white border border-[#E5DDD3] rounded-xl px-3 py-2 text-sm text-cp-ink outline-none focus:border-cp-mango transition-colors"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Résultats */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5DDD3] p-16 text-center">
              <Search size={48} strokeWidth={1.25} className="mx-auto text-cp-ink/10 mb-4" />
              <h2 className="cp-title font-black text-2xl text-cp-ink mb-2">Aucun résultat</h2>
              <p className="text-sm text-cp-ink/50 max-w-xs mx-auto">
                Aucune pièce ne correspond à votre recherche. Ajustez les filtres ou élargissez
                votre recherche.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar mobile (overlay) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-cp-ink/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <p className="cp-title font-bold text-xl text-cp-ink">Filtres</p>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-cp-ink/40 hover:text-cp-ink"
                aria-label="Fermer les filtres"
              >
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-[0.6875rem] font-semibold text-cp-ink/30 uppercase tracking-widest mb-3">
                Catégorie
              </p>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => {
                    setCategory('all');
                    setSidebarOpen(false);
                  }}
                  className={`text-left px-3 py-2 rounded-xl text-sm ${category === 'all' ? 'bg-cp-ink text-cp-cream font-medium' : 'text-cp-ink/60'}`}
                >
                  Toutes
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setCategory(cat.id);
                      setSidebarOpen(false);
                    }}
                    className={`text-left px-3 py-2 rounded-xl text-sm ${category === cat.id ? 'bg-cp-ink text-cp-cream font-medium' : 'text-cp-ink/60'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setCategory('all');
                setVehicleType('all');
                setQuery('');
                setSort('relevance');
                setSidebarOpen(false);
              }}
              className="w-full py-2.5 rounded-full border border-[#E5DDD3] text-sm text-cp-ink/40 hover:border-cp-mango hover:text-cp-mango transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
