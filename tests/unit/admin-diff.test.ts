import { describe, it, expect } from 'vitest';
import { computeDiff, computePatchDiff } from '@/lib/admin/diff';

describe('computeDiff', () => {
  it('retourne les champs changés avec before/after', () => {
    const d = computeDiff({ prix: 18900, km: 42000 }, { prix: 17900, km: 42000 });
    expect(d).toEqual({ prix: { before: 18900, after: 17900 } });
  });

  it('ignore les champs inchangés', () => {
    const d = computeDiff({ a: 1, b: 2 }, { a: 1, b: 2 });
    expect(d).toEqual({});
  });

  it('détecte un changement dans un objet imbriqué (égalité profonde)', () => {
    const d = computeDiff(
      { caracteristiques: { puissance: '130 ch' } },
      { caracteristiques: { puissance: '150 ch' } }
    );
    expect(d).toEqual({
      caracteristiques: {
        before: { puissance: '130 ch' },
        after: { puissance: '150 ch' },
      },
    });
  });

  it('détecte un changement dans un tableau', () => {
    const d = computeDiff({ options: ['ABS'] }, { options: ['ABS', 'GPS'] });
    expect(d).toEqual({ options: { before: ['ABS'], after: ['ABS', 'GPS'] } });
  });

  it('inclut les nouvelles clés présentes uniquement dans after', () => {
    const d = computeDiff({ a: 1 }, { a: 1, b: 2 });
    expect(d).toEqual({ b: { before: undefined, after: 2 } });
  });

  it('inclut les clés présentes uniquement dans before (champ supprimé)', () => {
    const d = computeDiff({ a: 1, b: 2 }, { a: 1 });
    expect(d).toEqual({ b: { before: 2, after: undefined } });
  });
});

describe('computePatchDiff — mise à jour partielle (tx.update = fusion)', () => {
  it('ignore les champs du document absents du formulaire (deletedAt, createdAt…)', () => {
    const before = { prix: 18900, deletedAt: '2026-10-04T10:00:00.000Z', createdAt: 'x' };
    expect(computePatchDiff(before, { prix: 17900 })).toEqual({
      prix: { before: 18900, after: 17900 },
    });
  });

  it('garde une clé nouvelle apportée par le patch', () => {
    expect(computePatchDiff({ a: 1 }, { a: 1, b: 2 })).toEqual({
      b: { before: undefined, after: 2 },
    });
  });
});
