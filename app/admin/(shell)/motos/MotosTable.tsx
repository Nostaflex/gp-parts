'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { deleteMoto } from '@/app/admin/motos/actions';

import type { Moto, Disponibilite } from '@/lib/motos';

/** Bouton de suppression (soft-delete → « vendu », retiré du site public). */
function DeleteMotoButton({
  id,
  updatedAt,
  disabled,
}: {
  id: string;
  updatedAt: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    if (disabled || pending) return;
    if (!window.confirm('Retirer cette moto du site ? (elle sera marquée comme vendue)')) return;
    startTransition(async () => {
      const res = await deleteMoto(id, updatedAt);
      // Conflit de lock optimiste : jamais silencieux.
      if (res && 'errors' in res && res.errors._form?.[0]) window.alert(res.errors._form[0]);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={disabled || pending}
      className="text-body-sm font-semibold ml-4 disabled:opacity-40"
      style={{ color: 'var(--red)' }}
    >
      {pending ? '…' : 'Supprimer'}
    </button>
  );
}

const DISPO: Record<Disponibilite, { tone: BadgeTone; label: string }> = {
  disponible: { tone: 'success', label: 'Disponible' },
  reserve: { tone: 'warning', label: 'Réservé' },
  vendu: { tone: 'neutral', label: 'Vendu' },
};

const columns: Column<Moto>[] = [
  {
    key: 'moto',
    header: 'Moto',
    sortValue: (m) => `${m.marque} ${m.modele}`.toLowerCase(),
    render: (m) => (
      <span className="font-medium text-[var(--text)]">
        {m.marque} {m.modele}
      </span>
    ),
  },
  {
    key: 'categorie',
    header: 'Catégorie',
    sortValue: (m) => m.categorie,
    render: (m) => m.categorie,
  },
  {
    key: 'annee',
    header: 'Année',
    align: 'right',
    sortValue: (m) => m.annee,
    render: (m) => m.annee,
  },
  {
    key: 'prix',
    header: 'Prix',
    align: 'right',
    sortValue: (m) => m.prix,
    render: (m) => `${m.prix.toLocaleString('fr-FR')} €`,
  },
  {
    key: 'disponibilite',
    header: 'Statut',
    sortValue: (m) => m.disponibilite,
    render: (m) => {
      const d = DISPO[m.disponibilite];
      return <StatusBadge tone={d.tone}>{d.label}</StatusBadge>;
    },
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (m) => (
      <>
        <Link
          href={`/admin/motos/${m.id}`}
          className="text-body-sm font-semibold"
          style={{ color: 'var(--blue)' }}
        >
          Éditer
        </Link>
        <DeleteMotoButton
          id={m.id}
          updatedAt={m.updatedAt}
          disabled={m.disponibilite === 'vendu'}
        />
      </>
    ),
  },
];

export function MotosTable({ motos }: { motos: Moto[] }) {
  return (
    <DataTable
      rows={motos}
      columns={columns}
      getRowId={(m) => m.id}
      searchText={(m) => `${m.marque} ${m.modele} ${m.reference}`}
      searchPlaceholder="Rechercher une moto…"
      emptyTitle="Aucune moto"
      emptyDescription="Ajoutez votre première moto avec le bouton ci-dessus."
    />
  );
}
