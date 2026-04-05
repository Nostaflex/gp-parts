'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, ArrowUpDown } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { PRODUCTS } from '@/lib/products';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';
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

  // Ref tracking the last querystring *we* wrote, used to distinguish
  // our own router.replace from external URL changes (navbar clicks).
  const lastWrittenQs = useRef<string | null>(null);

  // Sync filtres → URL (partage + bouton retour) — sans scroll
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

  // Sync URL → filtres (Bug #2) : quand l'utilisateur clique sur un lien navbar
  // vers /catalogue?type=moto alors qu'il est déjà sur /catalogue, les filtres
  // doivent refléter la nouvelle URL. On ignore les changements déclenchés par
  // notre propre router.replace ci-dessus.
  useEffect(() => {
    const currentQs = searchParams.toString();
    if (currentQs === lastWrittenQs.current) return;

    const urlType = (searchParams.get('type') as VehicleType | null) ?? 'all';
    const urlCategory = (searchParams.get('category') as ProductCategory | null) ?? 'all';
    const urlQuery = searchParams.get('q') ?? '';
    const urlSort = (searchParams.get('sort') as SortKey | null) ?? 'relevance';

    setVehicleType(urlType);
    setCategory(urlCategory);
    setQuery(urlQuery);
    setSort(urlSort);
  }, [searchParams]);

  const filtered = useMemo(() => {
    // Recherche tokenisée : tous les mots doivent correspondre à un champ
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

    const sorted = [...list];
    switch (sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        break;
      case 'relevance':
      default:
        // Promus d'abord, puis en stock, puis rupture
        sorted.sort((a, b) => {
          if (a.isPromoted !== b.isPromoted) return a.isPromoted ? -1 : 1;
          if ((a.stock > 0) !== (b.stock > 0)) return a.stock > 0 ? -1 : 1;
          return 0;
        });
    }
    return sorted;
  }, [query, vehicleType, category, showPromoOnly, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="mb-6 text-body-sm text-basalt/60">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-volcanic transition-colors">Accueil</Link>
          </li>
          <li className="text-basalt/30">/</li>
          <li className="text-basalt font-medium">Catalogue</li>
        </ol>
      </nav>

      <header className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-title text-h1 text-basalt mb-2">CATALOGUE</h1>
          <p className="text-body text-basalt/70" aria-live="polite">
            {filtered.length} pièce{filtered.length > 1 ? 's' : ''} disponible
            {filtered.length > 1 ? 's' : ''}
            {showPromoOnly && ' en promotion'}
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-body-sm text-basalt/60 flex items-center gap-1">
            <ArrowUpDown size={14} strokeWidth={1.75} />
            Trier
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-white border border-lin rounded-lg px-3 py-2 text-body-sm font-body text-basalt focus-visible:outline-none focus-visible:border-volcanic focus-visible:ring-2 focus-visible:ring-volcanic/20 transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Search bar */}
      <div className="relative mb-6">
        <Search
          size={20}
          strokeWidth={1.75}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-basalt/40"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, référence, marque, modèle..."
          aria-label="Rechercher dans le catalogue"
          className="w-full bg-white border border-lin rounded-pill pl-12 pr-4 py-3 text-body font-body placeholder:text-basalt/40 focus-visible:outline-none focus-visible:border-volcanic focus-visible:ring-2 focus-visible:ring-volcanic/20 transition-colors"
        />
      </div>

      {/* Vehicle type toggle */}
      <div className="flex gap-2 mb-4">
        {(['all', 'auto', 'moto'] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setVehicleType(type)}
            className={cn(
              'px-5 py-2 rounded-pill text-body-sm font-medium transition-all duration-fast',
              vehicleType === type
                ? 'bg-basalt text-cream'
                : 'bg-ivory text-basalt hover:bg-lin'
            )}
          >
            {type === 'all' ? 'Tous' : type === 'auto' ? 'Auto' : 'Moto'}
          </button>
        ))}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cn(
            'px-4 py-1.5 rounded-pill text-body-sm transition-all duration-fast',
            category === 'all'
              ? 'bg-volcanic text-white'
              : 'bg-ivory text-basalt/70 hover:bg-lin'
          )}
        >
          Toutes catégories
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-4 py-1.5 rounded-pill text-body-sm transition-all duration-fast',
              category === cat.id
                ? 'bg-volcanic text-white'
                : 'bg-ivory text-basalt/70 hover:bg-lin'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="bg-ivory rounded-2xl p-12 text-center">
          <Search size={48} strokeWidth={1.5} className="mx-auto text-basalt/20 mb-4" />
          <h2 className="font-title text-h3 text-basalt mb-2">Aucun résultat</h2>
          <p className="text-body text-basalt/60">
            Aucune pièce ne correspond à votre recherche. Essayez d&apos;ajuster les filtres.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
