'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Package, TrendingUp, AlertTriangle, Euro, Search, Tag, Edit3, Eye } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { PRODUCTS } from '@/lib/products';
import { formatPrice, getStockStatus, getStockLabel, cn } from '@/lib/utils';
import { LOW_STOCK_THRESHOLD } from '@/lib/config';
import { getCategoryLabel } from '@/lib/categories';

export default function AdminDashboardPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'promo'>('all');
  const { showToast } = useToast();

  const notifyDemo = (label: string) =>
    showToast({
      type: 'info',
      message: `"${label}" disponible en v2 (Firestore). Mode démo en lecture seule.`,
    });

  // KPIs calculés sur les données statiques (memoized — invariant pour cette session)
  const { totalProducts, lowStockCount, outOfStockCount, promoCount, stockValue } = useMemo(() => {
    let low = 0;
    let out = 0;
    let promo = 0;
    let value = 0;
    for (const p of PRODUCTS) {
      if (p.stock === 0) out += 1;
      else if (p.stock <= LOW_STOCK_THRESHOLD) low += 1;
      if (p.isPromoted) promo += 1;
      value += p.price * p.stock;
    }
    return {
      totalProducts: PRODUCTS.length,
      lowStockCount: low,
      outOfStockCount: out,
      promoCount: promo,
      stockValue: value,
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
      // "Stock faible" = strictement faible (exclut rupture, qui a son propre état)
      const matchFilter =
        filter === 'all' ||
        (filter === 'low-stock' && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD) ||
        (filter === 'promo' && p.isPromoted);
      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  const kpis = [
    {
      label: 'Produits en catalogue',
      value: totalProducts,
      icon: Package,
      accent: 'text-volcanic',
    },
    {
      label: 'Stock faible',
      value: lowStockCount,
      icon: AlertTriangle,
      accent: 'text-warning',
    },
    {
      label: 'En promotion',
      value: promoCount,
      icon: Tag,
      accent: 'text-caribbean',
    },
    {
      label: 'Valeur du stock',
      value: formatPrice(stockValue),
      icon: Euro,
      accent: 'text-basalt',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-overline uppercase text-basalt/50 mb-1">Back office</p>
          <h1 className="font-title text-h1 text-basalt">Tableau de bord</h1>
          <p className="text-body text-basalt/60 mt-2">
            Gestion du stock et des promotions · Démo statique
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md" onClick={() => notifyDemo('Exporter')}>
            <TrendingUp size={18} strokeWidth={1.75} /> Exporter
          </Button>
          <Button variant="primary" size="md" onClick={() => notifyDemo('Nouveau produit')}>
            <Package size={18} strokeWidth={1.75} /> Nouveau produit
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-2xl p-5 shadow-subtle border border-lin/50"
            >
              <div className="flex items-start justify-between mb-3">
                <Icon size={22} strokeWidth={1.75} className={kpi.accent} />
              </div>
              <p className="font-title text-h2 text-basalt mb-1">{kpi.value}</p>
              <p className="text-caption text-basalt/60">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      {/* Alerte stock faible */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-8 flex items-start gap-3">
          <AlertTriangle
            size={20}
            strokeWidth={1.75}
            className="text-warning flex-shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="font-medium text-body-sm text-basalt">Attention au stock</p>
            <p className="text-caption text-basalt/70 mt-0.5">
              {outOfStockCount} produit{outOfStockCount > 1 ? 's' : ''} en rupture, {lowStockCount}{' '}
              produit{lowStockCount > 1 ? 's' : ''} en stock faible.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFilter('low-stock')}>
            Voir
          </Button>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-ivory rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par nom ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'low-stock', 'promo'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-4 h-11 rounded-pill text-body-sm font-medium transition-all',
                  filter === f
                    ? 'bg-basalt text-cream'
                    : 'bg-white text-basalt border border-lin hover:border-basalt/30'
                )}
              >
                {f === 'all' ? 'Tous' : f === 'low-stock' ? 'Stock faible' : 'Promotions'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table produits */}
      <div className="bg-white rounded-2xl shadow-subtle overflow-hidden border border-lin/50">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ivory border-b border-lin">
              <tr>
                <th className="text-left text-overline uppercase text-basalt/60 px-5 py-3">
                  Produit
                </th>
                <th className="text-left text-overline uppercase text-basalt/60 px-5 py-3">
                  Référence
                </th>
                <th className="text-left text-overline uppercase text-basalt/60 px-5 py-3">
                  Catégorie
                </th>
                <th className="text-right text-overline uppercase text-basalt/60 px-5 py-3">
                  Prix
                </th>
                <th className="text-center text-overline uppercase text-basalt/60 px-5 py-3">
                  Stock
                </th>
                <th className="text-right text-overline uppercase text-basalt/60 px-5 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const status = getStockStatus(product.stock);
                return (
                  <tr
                    key={product.id}
                    className="border-b border-lin/50 hover:bg-ivory/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-lin rounded-lg flex-shrink-0" />
                        <div>
                          <p className="font-medium text-body-sm text-basalt">{product.name}</p>
                          {product.isPromoted && (
                            <span className="text-caption text-volcanic font-medium">
                              En promotion
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="font-mono text-caption text-basalt/70">
                        {product.reference}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-body-sm text-basalt/70">
                        {getCategoryLabel(product.category)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-medium text-body-sm text-basalt">
                        {formatPrice(product.price)}
                      </div>
                      {product.priceOriginal && (
                        <div className="text-caption text-basalt/40 line-through">
                          {formatPrice(product.priceOriginal)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="font-medium text-body-sm text-basalt">
                          {product.stock}
                        </span>
                        <Badge variant={status}>{getStockLabel(product.stock)}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/catalogue/${product.slug}`}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-lin transition-colors"
                          aria-label="Voir"
                        >
                          <Eye size={16} strokeWidth={1.75} className="text-basalt/60" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => notifyDemo(`Modifier ${product.name}`)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-lin transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volcanic"
                          aria-label={`Modifier ${product.name}`}
                          title="Édition disponible en v2"
                        >
                          <Edit3 size={16} strokeWidth={1.75} className="text-basalt/60" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Search size={40} strokeWidth={1.5} className="text-basalt/20 mx-auto mb-3" />
            <p className="text-body text-basalt/60">Aucun produit trouvé</p>
          </div>
        )}
      </div>

      <p className="text-caption text-basalt/50 text-center mt-6">
        Mode démo — les modifications ne sont pas persistées. Dans la version production, les
        données seront gérées via Firebase / Firestore.
      </p>
    </div>
  );
}
