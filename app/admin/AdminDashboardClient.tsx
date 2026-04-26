'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, TrendingUp, AlertTriangle, Euro, Search, Tag, Edit3, Eye } from 'lucide-react';
import { adminSignOut } from '@/lib/auth';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatPrice, getStockStatus, getStockLabel } from '@/lib/utils';
import { LOW_STOCK_THRESHOLD } from '@/lib/config';
import { getCategoryLabel } from '@/lib/categories';
import type { Product } from '@/lib/types';

// iOS Clarity — palette du back-office (var(--*) définis dans globals.css)
const IOS = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  border: 'var(--border)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textSubtle: 'rgba(28, 28, 30, 0.5)',
  textGhost: 'rgba(28, 28, 30, 0.2)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
  bgHover: 'rgba(242, 242, 247, 0.8)',
  // Couleurs sémantiques équivalentes iOS
  warning: '#FF9500',
  warningBg: 'rgba(255, 149, 0, 0.1)',
  warningBorder: 'rgba(255, 149, 0, 0.3)',
  success: '#34C759',
} as const;

export function AdminDashboardClient() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low-stock' | 'promo'>('all');
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<Product[]>;
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[AdminDashboard] getProducts failed:', err);
        setLoading(false);
      });
  }, []);

  const notifyDemo = (label: string) =>
    showToast({
      type: 'info',
      message: `"${label}" disponible en v2 (Firestore). Mode démo en lecture seule.`,
    });

  // KPIs calculés côté client à partir des données Firestore
  const { totalProducts, lowStockCount, outOfStockCount, promoCount, stockValue } = useMemo(() => {
    let low = 0;
    let out = 0;
    let promo = 0;
    let value = 0;
    for (const p of products) {
      if (p.stock === 0) out += 1;
      else if (p.stock <= LOW_STOCK_THRESHOLD) low += 1;
      if (p.isPromoted) promo += 1;
      value += p.price * p.stock;
    }
    return {
      totalProducts: products.length,
      lowStockCount: low,
      outOfStockCount: out,
      promoCount: promo,
      stockValue: value,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
      const matchFilter =
        filter === 'all' ||
        (filter === 'low-stock' && p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD) ||
        (filter === 'promo' && p.isPromoted);
      return matchSearch && matchFilter;
    });
  }, [products, search, filter]);

  const kpis = [
    { label: 'Produits en catalogue', value: totalProducts, icon: Package, accentColor: IOS.blue },
    { label: 'Stock faible', value: lowStockCount, icon: AlertTriangle, accentColor: IOS.warning },
    { label: 'En promotion', value: promoCount, icon: Tag, accentColor: IOS.success },
    { label: 'Valeur du stock', value: formatPrice(stockValue), icon: Euro, accentColor: IOS.text },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-body" style={{ color: IOS.textMuted }}>
          Chargement du catalogue...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="text-overline uppercase mb-1" style={{ color: IOS.textSubtle }}>
            Back office
          </p>
          <h1 className="font-title text-h1" style={{ color: IOS.text }}>
            Tableau de bord
          </h1>
          <p className="text-body mt-2" style={{ color: IOS.textMuted }}>
            Gestion du stock et des promotions
          </p>
          <div className="flex gap-3 mt-3">
            <Link
              href="/admin"
              className="text-sm font-semibold underline-offset-2"
              style={{ color: IOS.blue }}
            >
              Produits
            </Link>
            <Link
              href="/admin/commandes"
              className="text-sm font-semibold underline-offset-2"
              style={{ color: IOS.blue }}
            >
              Commandes
            </Link>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={async () => {
              await adminSignOut();
              router.push('/admin/login');
            }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              color: 'var(--text)',
            }}
          >
            Déconnexion
          </button>
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
              className="rounded-2xl p-5 shadow-subtle"
              style={{
                background: IOS.surface,
                border: `1px solid ${IOS.borderFaint}`,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <Icon size={22} strokeWidth={1.75} style={{ color: kpi.accentColor }} />
              </div>
              <p className="font-title text-h2 mb-1" style={{ color: IOS.text }}>
                {kpi.value}
              </p>
              <p className="text-caption" style={{ color: IOS.textMuted }}>
                {kpi.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Alerte stock faible */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div
          className="rounded-xl p-4 mb-8 flex items-start gap-3"
          style={{
            background: IOS.warningBg,
            border: `1px solid ${IOS.warningBorder}`,
          }}
        >
          <AlertTriangle
            size={20}
            strokeWidth={1.75}
            className="flex-shrink-0 mt-0.5"
            style={{ color: IOS.warning }}
          />
          <div className="flex-1">
            <p className="font-medium text-body-sm" style={{ color: IOS.text }}>
              Attention au stock
            </p>
            <p className="text-caption mt-0.5" style={{ color: IOS.textMuted }}>
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
      <div className="rounded-2xl p-5 mb-6" style={{ background: IOS.bg }}>
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
                className="px-4 h-11 rounded-pill text-body-sm font-medium transition-all"
                style={
                  filter === f
                    ? { background: IOS.text, color: IOS.surface }
                    : {
                        background: IOS.surface,
                        color: IOS.text,
                        border: `1px solid ${IOS.border}`,
                      }
                }
              >
                {f === 'all' ? 'Tous' : f === 'low-stock' ? 'Stock faible' : 'Promotions'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table produits */}
      <div
        className="rounded-2xl shadow-subtle overflow-hidden"
        style={{
          background: IOS.surface,
          border: `1px solid ${IOS.borderFaint}`,
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ background: IOS.bg, borderBottom: `1px solid ${IOS.border}` }}>
              <tr>
                <th
                  className="text-left text-overline uppercase px-5 py-3"
                  style={{ color: IOS.textMuted }}
                >
                  Produit
                </th>
                <th
                  className="text-left text-overline uppercase px-5 py-3"
                  style={{ color: IOS.textMuted }}
                >
                  Référence
                </th>
                <th
                  className="text-left text-overline uppercase px-5 py-3"
                  style={{ color: IOS.textMuted }}
                >
                  Catégorie
                </th>
                <th
                  className="text-right text-overline uppercase px-5 py-3"
                  style={{ color: IOS.textMuted }}
                >
                  Prix
                </th>
                <th
                  className="text-center text-overline uppercase px-5 py-3"
                  style={{ color: IOS.textMuted }}
                >
                  Stock
                </th>
                <th
                  className="text-right text-overline uppercase px-5 py-3"
                  style={{ color: IOS.textMuted }}
                >
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
                    className="transition-colors"
                    style={{ borderBottom: `1px solid ${IOS.borderFaint}` }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = IOS.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '';
                    }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0"
                          style={{ background: IOS.border }}
                        />
                        <div>
                          <p className="font-medium text-body-sm" style={{ color: IOS.text }}>
                            {product.name}
                          </p>
                          {product.isPromoted && (
                            <span className="text-caption font-medium" style={{ color: IOS.blue }}>
                              En promotion
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="font-mono text-caption" style={{ color: IOS.textMuted }}>
                        {product.reference}
                      </code>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-body-sm" style={{ color: IOS.textMuted }}>
                        {getCategoryLabel(product.category)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="font-medium text-body-sm" style={{ color: IOS.text }}>
                        {formatPrice(product.price)}
                      </div>
                      {product.priceOriginal && (
                        <div className="text-caption line-through" style={{ color: IOS.textGhost }}>
                          {formatPrice(product.priceOriginal)}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="font-medium text-body-sm" style={{ color: IOS.text }}>
                          {product.stock}
                        </span>
                        <Badge variant={status}>{getStockLabel(product.stock)}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/pieces/${product.slug}`}
                          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                          aria-label="Voir"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = IOS.bg;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = '';
                          }}
                        >
                          <Eye size={16} strokeWidth={1.75} style={{ color: IOS.textMuted }} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => notifyDemo(`Modifier ${product.name}`)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] focus-visible:ring-offset-2"
                          aria-label={`Modifier ${product.name}`}
                          title="Édition disponible en v2"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = IOS.bg;
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = '';
                          }}
                        >
                          <Edit3 size={16} strokeWidth={1.75} style={{ color: IOS.textMuted }} />
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
            <Search
              size={40}
              strokeWidth={1.5}
              className="mx-auto mb-3"
              style={{ color: IOS.textGhost }}
            />
            <p className="text-body" style={{ color: IOS.textMuted }}>
              Aucun produit trouvé
            </p>
          </div>
        )}
      </div>

      <p className="text-caption text-center mt-6" style={{ color: IOS.textSubtle }}>
        Les données proviennent de {products.length > 0 ? 'Firestore' : 'la base statique'}.
      </p>
    </div>
  );
}
