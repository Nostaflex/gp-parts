import { it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompatibilityFields } from '@/components/admin/CompatibilityFields';

it('rend 1 ligne vide par défaut, ajoute/supprime, names indexés denses, cap 50', () => {
  render(<CompatibilityFields initial={[]} />);
  fireEvent.click(screen.getByRole('button', { name: /ajouter compatibilité/i }));
  expect(screen.getAllByPlaceholderText(/marque/i).length).toBe(2);
  // names compat_0_brand, compat_1_brand présents
  expect(document.querySelector('input[name="compat_1_brand"]')).toBeTruthy();
  fireEvent.click(screen.getAllByRole('button', { name: /supprimer/i })[0]);
  expect(document.querySelector('input[name="compat_1_brand"]')).toBeFalsy(); // re-densifié
});
it('initial pré-remplit les lignes', () => {
  render(
    <CompatibilityFields
      initial={[{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }]}
    />
  );
  expect((document.querySelector('input[name="compat_0_brand"]') as HTMLInputElement).value).toBe(
    'Renault'
  );
});
