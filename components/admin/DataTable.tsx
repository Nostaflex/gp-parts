'use client';

import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, Search, Inbox } from 'lucide-react';

import { EmptyState } from './EmptyState';

import type { ReactNode } from 'react';

const IOS = {
  surface: 'var(--surface)',
  bg: 'var(--bg)',
  text: 'var(--text)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
  bgHover: 'rgba(242, 242, 247, 0.8)',
} as const;

export type Column<T> = {
  key: string;
  header: string;
  /** Rendu cellule. Si absent, affiche String(row[key]). */
  render?: (row: T) => ReactNode;
  /** Valeur de tri. Si absent, colonne non triable. */
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
};

/**
 * Table générique back-office iOS Clarity : tri (clic header), recherche
 * plein-texte, pagination, clic ligne. Aucune logique métier — `searchText`
 * et `sortValue` sont fournis par l'appelant.
 */
export function DataTable<T>({
  rows,
  columns,
  getRowId,
  searchText,
  searchPlaceholder = 'Rechercher…',
  onRowClick,
  pageSize = 20,
  emptyTitle = 'Aucun résultat',
  emptyDescription,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !searchText) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const sv = col.sortValue;
    return [...filtered].sort((a, b) => {
      const va = sv(a);
      const vb = sv(b);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(col.key);
      setSortDir('asc');
    }
    setPage(0);
  }

  return (
    <div className="flex flex-col gap-4">
      {searchText && (
        <div className="relative">
          <Search
            size={18}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: IOS.textMuted }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            aria-label="Rechercher dans le tableau"
            className="w-full h-11 pl-10 pr-4 rounded-[10px] text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
            style={{
              background: IOS.surface,
              border: `1px solid ${IOS.borderFaint}`,
              color: IOS.text,
            }}
          />
        </div>
      )}

      {sorted.length === 0 ? (
        <div
          className="rounded-[14px]"
          style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}` }}
        >
          <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <div
          className="rounded-[14px] overflow-hidden"
          style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}` }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: IOS.bg, borderBottom: `1px solid ${IOS.borderFaint}` }}>
                <tr>
                  {columns.map((col) => {
                    const sortable = Boolean(col.sortValue);
                    const active = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        className={`text-overline uppercase px-5 py-3 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        } ${sortable ? 'cursor-pointer select-none' : ''}`}
                        style={{ color: IOS.textMuted }}
                        onClick={() => toggleSort(col)}
                        aria-sort={
                          active ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined
                        }
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.header}
                          {active &&
                            (sortDir === 'asc' ? (
                              <ChevronUp size={14} strokeWidth={2} />
                            ) : (
                              <ChevronDown size={14} strokeWidth={2} />
                            ))}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr
                    key={getRowId(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                    style={{ borderBottom: `1px solid ${IOS.borderFaint}` }}
                    onMouseEnter={(e) => {
                      if (onRowClick)
                        (e.currentTarget as HTMLElement).style.background = IOS.bgHover;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = '';
                    }}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-4 text-body-sm ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                        }`}
                        style={{ color: IOS.text }}
                      >
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderTop: `1px solid ${IOS.borderFaint}` }}
            >
              <span className="text-caption" style={{ color: IOS.textMuted }}>
                {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} sur{' '}
                {sorted.length}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  className="px-3 h-9 rounded-[10px] text-body-sm font-medium transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                  style={{ background: IOS.bg, color: IOS.text }}
                >
                  Précédent
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={safePage >= pageCount - 1}
                  className="px-3 h-9 rounded-[10px] text-body-sm font-medium transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
                  style={{ background: IOS.bg, color: IOS.text }}
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
