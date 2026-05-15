import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { DataTable, type Column } from '@/components/admin/DataTable';

type Row = { id: string; name: string; price: number };

const ROWS: Row[] = [
  { id: 'a', name: 'Filtre à huile', price: 1990 },
  { id: 'b', name: 'Plaquettes', price: 4590 },
  { id: 'c', name: 'Amortisseur', price: 8900 },
];

const COLUMNS: Column<Row>[] = [
  { key: 'name', header: 'Nom', sortValue: (r) => r.name },
  { key: 'price', header: 'Prix', sortValue: (r) => r.price, align: 'right' },
];

describe('DataTable', () => {
  it('affiche toutes les lignes', () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} />);
    expect(screen.getByText('Filtre à huile')).toBeInTheDocument();
    expect(screen.getByText('Plaquettes')).toBeInTheDocument();
    expect(screen.getByText('Amortisseur')).toBeInTheDocument();
  });

  it('filtre via la recherche plein-texte', () => {
    render(
      <DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} searchText={(r) => r.name} />
    );
    fireEvent.change(screen.getByLabelText('Rechercher dans le tableau'), {
      target: { value: 'plaqu' },
    });
    expect(screen.getByText('Plaquettes')).toBeInTheDocument();
    expect(screen.queryByText('Filtre à huile')).not.toBeInTheDocument();
  });

  it('trie en cliquant sur un en-tête triable', () => {
    render(<DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} />);
    fireEvent.click(screen.getByText('Nom'));
    const cells = screen.getAllByRole('cell').map((c) => c.textContent);
    // Tri asc alphabétique : Amortisseur en premier
    expect(cells[0]).toBe('Amortisseur');
  });

  it('déclenche onRowClick avec la ligne', () => {
    const onRowClick = vi.fn();
    render(
      <DataTable rows={ROWS} columns={COLUMNS} getRowId={(r) => r.id} onRowClick={onRowClick} />
    );
    fireEvent.click(screen.getByText('Filtre à huile'));
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it('affiche EmptyState quand 0 résultat', () => {
    render(
      <DataTable rows={[]} columns={COLUMNS} getRowId={(r) => r.id} emptyTitle="Aucune pièce" />
    );
    expect(screen.getByText('Aucune pièce')).toBeInTheDocument();
  });

  it('pagine au-delà de pageSize', () => {
    const many: Row[] = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      name: `Item ${i}`,
      price: i * 100,
    }));
    render(<DataTable rows={many} columns={COLUMNS} getRowId={(r) => r.id} pageSize={20} />);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.queryByText('Item 20')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Suivant'));
    expect(screen.getByText('Item 20')).toBeInTheDocument();
  });
});
