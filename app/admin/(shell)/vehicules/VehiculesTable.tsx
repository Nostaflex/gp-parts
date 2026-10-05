'use client';

import Link from 'next/link';

import { DataTable, type Column } from '@/components/admin/DataTable';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import {
  DeleteRowAction,
  RowAction,
  TrashTabs,
  trashColumns,
  useTrashView,
} from '@/components/admin/Trash';
import { deleteVehicule, markVehiculeVendu, restoreVehicule } from '@/app/admin/vehicules/actions';

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
      <>
        <Link
          href={`/admin/vehicules/${v.id}`}
          className="text-body-sm font-semibold"
          style={{ color: 'var(--blue)' }}
        >
          Éditer
        </Link>
        <RowAction
          label="Vendu"
          confirmation="Marquer ce véhicule comme vendu ? Il reste affiché sur le site, avec la mention « vendu »."
          action={markVehiculeVendu}
          id={v.id}
          updatedAt={v.updatedAt}
          color="var(--orange)"
          disabled={v.disponibilite === 'vendu'}
        />
        <DeleteRowAction
          name={`${v.marque} ${v.modele}`}
          id={v.id}
          updatedAt={v.updatedAt}
          deleteAction={deleteVehicule}
          restoreAction={restoreVehicule}
        />
      </>
    ),
  },
];

const corbeille = trashColumns<Vehicule>({
  header: 'Véhicule',
  name: (v) => `${v.marque} ${v.modele}`,
  detail: (v) => `était « ${DISPO[v.disponibilite].label} »`,
  editHref: (v) => `/admin/vehicules/${v.id}`,
  restoreAction: restoreVehicule,
});

export function VehiculesTable({ vehicules }: { vehicules: Vehicule[] }) {
  const { view, setView, live, trash } = useTrashView(vehicules);
  return (
    <>
      <TrashTabs view={view} onChange={setView} liveCount={live.length} trashCount={trash.length} />
      {view === 'live' ? (
        <DataTable
          key="live"
          rows={live}
          columns={columns}
          getRowId={(r) => r.id}
          searchText={(v) => `${v.marque} ${v.modele} ${v.reference}`}
          searchPlaceholder="Rechercher un véhicule…"
          emptyTitle="Aucun véhicule"
          emptyDescription="Ajoutez votre premier véhicule avec le bouton ci-dessus."
        />
      ) : (
        <DataTable
          key="trash"
          rows={trash}
          columns={corbeille}
          getRowId={(r) => r.id}
          searchText={(v) => `${v.marque} ${v.modele} ${v.reference}`}
          searchPlaceholder="Rechercher un véhicule…"
          emptyTitle="La corbeille est vide"
          emptyDescription="Les véhicules supprimés apparaissent ici : tu peux les modifier ou les restaurer."
        />
      )}
    </>
  );
}
