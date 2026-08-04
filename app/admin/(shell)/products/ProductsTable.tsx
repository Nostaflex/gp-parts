'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { deleteProduct, updateProductStock } from '@/app/admin/products/actions';

import type { Product } from '@/lib/types';

/** Bouton de suppression (soft-delete, lock optimiste via updatedAt). */
function DeleteProductButton({ product }: { product: Product }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (pending) return;
    if (!window.confirm(`Supprimer « ${product.name} » ? (soft-delete, restaurable)`)) return;
    startTransition(async () => {
      await deleteProduct(product.id, product.updatedAt);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      className="text-body-sm font-semibold ml-4 disabled:opacity-40"
      style={{ color: 'var(--red)' }}
    >
      {pending ? '…' : 'Supprimer'}
    </button>
  );
}

/** Édition stock inline −/+ : delta atomique côté serveur, pas de form. */
function StockStepper({ product }: { product: Product }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const bump = (delta: number) => {
    if (pending) return;
    startTransition(async () => {
      await updateProductStock(product.id, delta);
      router.refresh();
    });
  };

  const btn =
    'w-11 h-11 rounded-[10px] border text-base font-semibold text-[var(--text)] ' +
    'disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';

  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Retirer 1 du stock de ${product.name}`}
        onClick={() => bump(-1)}
        disabled={pending || product.stock <= 0}
        className={btn}
      >
        −
      </button>
      <StatusBadge tone={stockTone(product.stock)}>{stockLabel(product.stock)}</StatusBadge>
      <button
        type="button"
        aria-label={`Ajouter 1 au stock de ${product.name}`}
        onClick={() => bump(1)}
        disabled={pending}
        className={btn}
      >
        +
      </button>
    </span>
  );
}

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
    render: (p) =>
      p.deletedAt ? (
        <StatusBadge tone={stockTone(p.stock)}>{stockLabel(p.stock)}</StatusBadge>
      ) : (
        <StockStepper product={p} />
      ),
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
      <>
        <Link
          href={`/admin/products/${p.id}`}
          className="text-body-sm font-semibold"
          style={{ color: 'var(--blue)' }}
        >
          Éditer
        </Link>
        {!p.deletedAt && <DeleteProductButton product={p} />}
      </>
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
