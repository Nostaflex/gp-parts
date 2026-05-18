'use client';

import Link from 'next/link';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';

import type { Moto, Disponibilite } from '@/lib/motos';

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
      <Link
        href={`/admin/motos/${m.id}`}
        className="text-body-sm font-semibold"
        style={{ color: 'var(--blue)' }}
      >
        Éditer
      </Link>
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
