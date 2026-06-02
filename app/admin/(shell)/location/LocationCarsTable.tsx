'use client';

import Link from 'next/link';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { formatPrice } from '@/lib/utils';

import type { LocationCar } from '@/lib/location-cars';

const columns: Column<LocationCar>[] = [
  {
    key: 'voiture',
    header: 'Voiture',
    sortValue: (c) => `${c.marque} ${c.modele}`.toLowerCase(),
    render: (c) => (
      <span className="font-medium text-[var(--text)]">
        {c.marque} {c.modele}
      </span>
    ),
  },
  {
    key: 'categorie',
    header: 'Catégorie',
    sortValue: (c) => c.categorie,
    render: (c) => c.categorie,
  },
  {
    key: 'prixJour',
    header: 'Prix / jour',
    align: 'right',
    sortValue: (c) => c.prixJourEnCents,
    render: (c) => formatPrice(c.prixJourEnCents),
  },
  {
    key: 'disponible',
    header: 'Statut',
    sortValue: (c) => String(c.disponible),
    render: (c) => (
      <StatusBadge tone={c.disponible ? ('success' as BadgeTone) : ('neutral' as BadgeTone)}>
        {c.disponible ? 'Disponible' : 'Indisponible'}
      </StatusBadge>
    ),
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    render: (c) => (
      <Link
        href={`/admin/location/${c.id}`}
        className="text-body-sm font-semibold"
        style={{ color: 'var(--blue)' }}
      >
        Éditer
      </Link>
    ),
  },
];

export function LocationCarsTable({ cars }: { cars: LocationCar[] }) {
  return (
    <DataTable
      rows={cars}
      columns={columns}
      getRowId={(c) => c.id}
      searchText={(c) => `${c.marque} ${c.modele} ${c.reference}`}
      searchPlaceholder="Rechercher une voiture…"
      emptyTitle="Aucune voiture"
      emptyDescription="Ajoutez votre première voiture de location avec le bouton ci-dessus."
    />
  );
}
