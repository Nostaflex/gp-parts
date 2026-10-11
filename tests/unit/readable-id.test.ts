import { describe, it, expect } from 'vitest';
import { isGeneratedId, readableId, uniqueReadableId } from '@/lib/readable-id';

/**
 * Lot 1 SEO : les fiches créées au back-office recevaient un identifiant
 * illisible (`vehicule-muzwihv3`). L'URL doit dire marque, modèle, année.
 */
describe('identifiants lisibles des fiches', () => {
  it('reconnaît un identifiant généré par le formulaire', () => {
    expect(isGeneratedId('vehicule-muzwihv3')).toBe(true);
    expect(isGeneratedId('moto-mg5x2k1a')).toBe(true);
    expect(isGeneratedId('bmw-x1-sdrive-18i-2023')).toBe(false);
    expect(isGeneratedId('renault-clio')).toBe(false);
  });

  it('compose marque-modele-annee en slug', () => {
    expect(readableId('BMW', 'X1 sDrive 18i U11', 2023)).toBe('bmw-x1-sdrive-18i-u11-2023');
    expect(readableId('Citroën', 'C3 Shine', 2021)).toBe('citroen-c3-shine-2021');
    expect(readableId('  Peugeot ', '308 SW GT Line', 2021)).toBe('peugeot-308-sw-gt-line-2021');
  });

  it('suffixe en cas de collision, sans toucher le premier libre', async () => {
    const taken = new Set(['bmw-x1-2023', 'bmw-x1-2023-2']);
    const exists = async (id: string) => taken.has(id);
    expect(await uniqueReadableId('bmw-x1-2023', exists)).toBe('bmw-x1-2023-3');
    expect(await uniqueReadableId('renault-clio-2020', exists)).toBe('renault-clio-2020');
  });
});
