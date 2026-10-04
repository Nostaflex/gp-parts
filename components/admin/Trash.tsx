'use client';

// Corbeille du BO (conception du 2026-10-04, docs/architecture) : un onglet
// « Corbeille » dans chaque liste du catalogue, « Supprimé · Annuler » sans
// fenêtre de confirmation, bandeau « Dans la corbeille » dans la fiche.
// Commun aux pièces, véhicules, motos et voitures de location.

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components/ui/Toast';

import type { Column } from '@/components/admin/DataTable';
import type { FormActionState } from '@/components/admin/FormShell';

export type TrashView = 'live' | 'trash';
type Trashable = { id: string; updatedAt: string; deletedAt?: string | null };
/** Action de ligne sous lock optimiste (Server Action). */
export type RowActionFn = (id: string, updatedAt: string) => Promise<FormActionState>;

/** Sépare une liste en « en ligne » et « corbeille » (suppression la plus récente d'abord). */
export function useTrashView<T extends Trashable>(rows: T[]) {
  const [view, setView] = useState<TrashView>('live');
  const { live, trash } = useMemo(
    () => ({
      live: rows.filter((r) => !r.deletedAt),
      trash: rows
        .filter((r) => r.deletedAt)
        .sort((a, b) => (b.deletedAt ?? '').localeCompare(a.deletedAt ?? '')),
    }),
    [rows]
  );
  return { view, setView, live, trash };
}

/** « Supprimé le 4 oct. » — la date lisible d'une mise à la corbeille. */
export function deletedOn(deletedAt: string | null | undefined): string {
  if (!deletedAt) return '';
  return new Date(deletedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function TrashTabs({
  view,
  onChange,
  liveCount,
  trashCount,
}: {
  view: TrashView;
  onChange: (view: TrashView) => void;
  liveCount: number;
  trashCount: number;
}) {
  const tab = (key: TrashView, label: string, count: number) => (
    <button
      type="button"
      role="tab"
      aria-selected={view === key}
      onClick={() => onChange(key)}
      className={`h-9 flex-1 rounded-[8px] px-4 text-body-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)] ${
        view === key
          ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
          : 'text-[var(--text-secondary)]'
      }`}
    >
      {label} · {count}
    </button>
  );
  return (
    <div
      role="tablist"
      aria-label="Éléments affichés"
      className="mb-3 flex max-w-sm gap-1 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] p-1"
    >
      {tab('live', 'En ligne', liveCount)}
      {tab('trash', 'Corbeille', trashCount)}
    </div>
  );
}

/** Bouton d'action de ligne : exécute, signale un refus, rafraîchit la liste. */
export function RowAction({
  label,
  action,
  id,
  updatedAt,
  color,
  confirmation,
  disabled = false,
  onDone,
}: {
  label: string;
  action: RowActionFn;
  id: string;
  updatedAt: string;
  color: string;
  /** Question posée avant d'agir. Absente = action immédiate. */
  confirmation?: string;
  disabled?: boolean;
  /** Appelé après un succès, avec le nouvel horodatage du document. */
  onDone?: (updatedAt: string | undefined) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (disabled || pending) return;
    if (confirmation && !window.confirm(confirmation)) return;
    startTransition(async () => {
      const res = await action(id, updatedAt);
      // Refus (conflit de lock optimiste, élément introuvable) : jamais silencieux.
      if (res && 'errors' in res) {
        showToast({ type: 'error', message: res.errors._form?.[0] ?? 'Action impossible.' });
      } else if (res && 'ok' in res) {
        onDone?.(res.updatedAt);
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || pending}
      className="text-body-sm font-semibold ml-4 disabled:opacity-40"
      style={{ color }}
    >
      {pending ? '…' : label}
    </button>
  );
}

/** « Supprimer » : part à la corbeille sans confirmation, avec « Annuler » quelques secondes. */
export function DeleteRowAction({
  name,
  id,
  updatedAt,
  deleteAction,
  restoreAction,
}: {
  name: string;
  id: string;
  updatedAt: string;
  deleteAction: RowActionFn;
  restoreAction: RowActionFn;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  const annuler = async (deletedUpdatedAt: string | undefined) => {
    if (!deletedUpdatedAt) return;
    const res = await restoreAction(id, deletedUpdatedAt);
    if (res && 'errors' in res) {
      showToast({ type: 'error', message: res.errors._form?.[0] ?? 'Restauration impossible.' });
    }
    router.refresh();
  };

  return (
    <RowAction
      label="Supprimer"
      action={deleteAction}
      id={id}
      updatedAt={updatedAt}
      color="var(--red)"
      onDone={(deletedUpdatedAt) =>
        showToast({
          type: 'info',
          message: `« ${name} » est dans la corbeille.`,
          action: { label: 'Annuler', onClick: () => void annuler(deletedUpdatedAt) },
        })
      }
    />
  );
}

/** Colonnes de l'onglet Corbeille : quoi, depuis quand, et les deux gestes de retour. */
export function trashColumns<T extends Trashable>({
  header,
  name,
  detail,
  editHref,
  restoreAction,
}: {
  header: string;
  name: (row: T) => string;
  /** Précision après la date : l'état qu'avait l'élément (« était « Vendu » »). */
  detail?: (row: T) => string;
  editHref: (row: T) => string;
  restoreAction: RowActionFn;
}): Column<T>[] {
  return [
    {
      key: 'element',
      header,
      sortValue: (row) => name(row).toLowerCase(),
      render: (row) => (
        <>
          <span className="block font-medium text-[var(--text)]">{name(row)}</span>
          <span className="block text-caption text-[var(--text-secondary)]">
            Supprimé le {deletedOn(row.deletedAt)}
            {detail ? ` · ${detail(row)}` : ''}
          </span>
        </>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <>
          <Link
            href={editHref(row)}
            className="text-body-sm font-semibold"
            style={{ color: 'var(--blue)' }}
          >
            Éditer
          </Link>
          <RowAction
            label="Restaurer"
            action={restoreAction}
            id={row.id}
            updatedAt={row.updatedAt}
            color="var(--green)"
          />
        </>
      ),
    },
  ];
}

/** Bandeau en tête de la fiche d'un élément supprimé. */
export function TrashBanner({
  id,
  updatedAt,
  restoreAction,
}: {
  id: string;
  updatedAt: string;
  restoreAction: RowActionFn;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  const restaurer = () => {
    if (pending) return;
    startTransition(async () => {
      const res = await restoreAction(id, updatedAt);
      if (res && 'errors' in res) {
        showToast({ type: 'error', message: res.errors._form?.[0] ?? 'Restauration impossible.' });
      } else {
        showToast({ type: 'success', message: 'Restauré : de nouveau visible sur le site.' });
      }
      router.refresh();
    });
  };

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[var(--orange)] bg-[var(--surface)] p-3"
    >
      <p className="text-body-sm text-[var(--text)]">
        <b className="block">Dans la corbeille</b>
        Invisible sur le site. Tu peux modifier cette fiche, puis la restaurer.
      </p>
      <button
        type="button"
        onClick={restaurer}
        disabled={pending}
        className="h-10 px-4 rounded-[10px] text-body-sm font-semibold text-white disabled:opacity-40"
        style={{ background: 'var(--blue)' }}
      >
        {pending ? '…' : 'Restaurer'}
      </button>
    </div>
  );
}
