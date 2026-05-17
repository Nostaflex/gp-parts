'use client';

import Link from 'next/link';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';

import type { Vehicule, Disponibilite } from '@/lib/vehicules';

const DISPO: Record<Disponibilite, { tone: BadgeTone; label: string }> = {
  disponible: { tone: 'success', label: 'Disponible' },
  reserve: { tone: 'warning', label: 'Réservé' },
  vendu: { tone: 'neutral', label: 'Vendu' },
};

const columns: Column<Vehicule>[] = [
  {
    key: 'vehicule',
    header: 'Véhicule',
    sortValue: (v) => `${v.marque} ${v.modele}`.toLowerCase(),
    render: (v) => (
      <span className="font-medium text-[var(--text)]">
        {v.marque} {v.modele}
      </span>
    ),
  },
  {
    key: 'annee',
    header: 'Année',
    align: 'right',
    sortValue: (v) => v.annee,
    render: (v) => v.annee,
  },
  {
    key: 'prix',
    header: 'Prix',
    align: 'right',
    sortValue: (v) => v.prix,
    render: (v) => `${v.prix.toLocaleString('fr-FR')} €`,
  },
  {
    key: 'disponibilite',
    header: 'Statut',
    sortValue: (v) => v.disponibilite,
    render: (v) => {
      const d = DISPO[v.disponibilite];
      return <StatusBadge tone={d.tone}>{d.label}</StatusBadge>;
    },
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (v) => (
      <Link
        href={`/admin/vehicules/${v.id}`}
        className="text-body-sm font-semibold"
        style={{ color: 'var(--blue)' }}
      >
        Éditer
      </Link>
    ),
  },
];

export function VehiculesTable({ vehicules }: { vehicules: Vehicule[] }) {
  return (
    <DataTable
      rows={vehicules}
      columns={columns}
      getRowId={(v) => v.id}
      searchText={(v) => `${v.marque} ${v.modele} ${v.reference}`}
      searchPlaceholder="Rechercher un véhicule…"
      emptyTitle="Aucun véhicule"
      emptyDescription="Ajoutez votre premier véhicule avec le bouton ci-dessus."
    />
  );
}
