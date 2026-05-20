'use client';

import Link from 'next/link';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';

import type { Product } from '@/lib/types';

function stockTone(stock: number): BadgeTone {
  if (stock <= 0) return 'danger';
  if (stock < 5) return 'warning';
  return 'success';
}

function stockLabel(stock: number): string {
  if (stock <= 0) return 'Rupture';
  if (stock < 5) return `Bas (${stock})`;
  return String(stock);
}

const columns: Column<Product>[] = [
  {
    key: 'product',
    header: 'Produit',
    sortValue: (p) => p.name.toLowerCase(),
    render: (p) => (
      <span className="flex flex-col">
        <span className="font-medium text-[var(--text)]">{p.name}</span>
        <span className="text-body-xs text-[var(--text-secondary)] font-mono">{p.reference}</span>
      </span>
    ),
  },
  {
    key: 'category',
    header: 'Catégorie',
    sortValue: (p) => p.category,
    render: (p) => p.category,
  },
  {
    key: 'price',
    header: 'Prix',
    align: 'right',
    sortValue: (p) => p.price,
    render: (p) => `${(p.price / 100).toLocaleString('fr-FR')} €`,
  },
  {
    key: 'stock',
    header: 'Stock',
    align: 'right',
    sortValue: (p) => p.stock,
    render: (p) => <StatusBadge tone={stockTone(p.stock)}>{stockLabel(p.stock)}</StatusBadge>,
  },
  {
    key: 'status',
    header: 'Statut',
    sortValue: (p) => (p.deletedAt ? 'supprime' : 'actif'),
    render: (p) =>
      p.deletedAt ? (
        <StatusBadge tone="neutral">Supprimé</StatusBadge>
      ) : (
        <StatusBadge tone="success">Actif</StatusBadge>
      ),
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (p) => (
      <Link
        href={`/admin/products/${p.slug}`}
        className="text-body-sm font-semibold"
        style={{ color: 'var(--blue)' }}
      >
        Éditer
      </Link>
    ),
  },
];

export function ProductsTable({ products }: { products: Product[] }) {
  return (
    <DataTable
      rows={products}
      columns={columns}
      getRowId={(p) => p.id}
      searchText={(p) => `${p.name} ${p.reference} ${p.category}`}
      searchPlaceholder="Rechercher un produit…"
      emptyTitle="Aucun produit"
      emptyDescription="Ajoutez votre premier produit avec le bouton ci-dessus."
    />
  );
}
