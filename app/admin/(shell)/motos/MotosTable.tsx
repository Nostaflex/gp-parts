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
import { deleteMoto, markMotoVendu, restoreMoto } from '@/app/admin/motos/actions';

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
      <>
        <Link
          href={`/admin/motos/${m.id}`}
          className="text-body-sm font-semibold"
          style={{ color: 'var(--blue)' }}
        >
          Éditer
        </Link>
        <RowAction
          label="Vendu"
          confirmation="Marquer cette moto comme vendue ? Elle reste affichée sur le site, avec la mention « vendu »."
          action={markMotoVendu}
          id={m.id}
          updatedAt={m.updatedAt}
          color="var(--orange)"
          disabled={m.disponibilite === 'vendu'}
        />
        <DeleteRowAction
          name={`${m.marque} ${m.modele}`}
          id={m.id}
          updatedAt={m.updatedAt}
          deleteAction={deleteMoto}
          restoreAction={restoreMoto}
        />
      </>
    ),
  },
];

const corbeille = trashColumns<Moto>({
  header: 'Moto',
  name: (m) => `${m.marque} ${m.modele}`,
  detail: (m) => `était « ${DISPO[m.disponibilite].label} »`,
  editHref: (m) => `/admin/motos/${m.id}`,
  restoreAction: restoreMoto,
});

export function MotosTable({ motos }: { motos: Moto[] }) {
  const { view, setView, live, trash } = useTrashView(motos);
  return (
    <>
      <TrashTabs view={view} onChange={setView} liveCount={live.length} trashCount={trash.length} />
      {view === 'live' ? (
        <DataTable
          key="live"
          rows={live}
          columns={columns}
          getRowId={(r) => r.id}
          searchText={(m) => `${m.marque} ${m.modele} ${m.reference}`}
          searchPlaceholder="Rechercher une moto…"
          emptyTitle="Aucune moto"
          emptyDescription="Ajoutez votre première moto avec le bouton ci-dessus."
        />
      ) : (
        <DataTable
          key="trash"
          rows={trash}
          columns={corbeille}
          getRowId={(r) => r.id}
          searchText={(m) => `${m.marque} ${m.modele} ${m.reference}`}
          searchPlaceholder="Rechercher une moto…"
          emptyTitle="La corbeille est vide"
          emptyDescription="Les motos supprimées apparaissent ici : tu peux les modifier ou les restaurer."
        />
      )}
    </>
  );
}
