'use client';

import Link from 'next/link';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { DeleteRowAction, TrashTabs, trashColumns, useTrashView } from '@/components/admin/Trash';
import { deleteLocationCar, restoreLocationCar } from '@/app/admin/location/actions';
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
      <>
        <Link
          href={`/admin/location/${c.id}`}
          className="text-body-sm font-semibold"
          style={{ color: 'var(--blue)' }}
        >
          Éditer
        </Link>
        <DeleteRowAction
          name={`${c.marque} ${c.modele}`}
          id={c.id}
          updatedAt={c.updatedAt}
          deleteAction={deleteLocationCar}
          restoreAction={restoreLocationCar}
        />
      </>
    ),
  },
];

const corbeille = trashColumns<LocationCar>({
  header: 'Voiture',
  name: (c) => `${c.marque} ${c.modele}`,
  detail: (c) => c.categorie,
  editHref: (c) => `/admin/location/${c.id}`,
  restoreAction: restoreLocationCar,
});

export function LocationCarsTable({ cars }: { cars: LocationCar[] }) {
  const { view, setView, live, trash } = useTrashView(cars);
  return (
    <>
      <TrashTabs view={view} onChange={setView} liveCount={live.length} trashCount={trash.length} />
      {view === 'live' ? (
        <DataTable
          key="live"
          rows={live}
          columns={columns}
          getRowId={(r) => r.id}
          searchText={(c) => `${c.marque} ${c.modele} ${c.reference}`}
          searchPlaceholder="Rechercher une voiture…"
          emptyTitle="Aucune voiture"
          emptyDescription="Ajoutez votre première voiture de location avec le bouton ci-dessus."
        />
      ) : (
        <DataTable
          key="trash"
          rows={trash}
          columns={corbeille}
          getRowId={(r) => r.id}
          searchText={(c) => `${c.marque} ${c.modele} ${c.reference}`}
          searchPlaceholder="Rechercher une voiture…"
          emptyTitle="La corbeille est vide"
          emptyDescription="Les voitures supprimées apparaissent ici : tu peux les modifier ou les restaurer."
        />
      )}
    </>
  );
}
