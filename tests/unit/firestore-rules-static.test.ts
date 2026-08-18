import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Garde STATIQUE des règles Firestore — leçon audit 2026-08-18 : le lot 6
// avait cloné le code de contactInfo sans sa règle, et la page légale
// tombait silencieusement sur les défauts. Ce test lit le fichier de règles
// et vérifie les invariants textuels ; le test Emulator complet (comportement
// réel) est planifié au lot S2. Fragile aux reformulations : si vous
// réorganisez firestore.rules, adaptez les assertions, ne les supprimez pas.
const rules = readFileSync(resolve(process.cwd(), 'firestore.rules'), 'utf-8');

function blocDe(chemin: string): string {
  const start = rules.indexOf(`match /${chemin}`);
  expect(start, `règle manquante pour ${chemin}`).toBeGreaterThan(-1);
  const end = rules.indexOf('match /', start + 1);
  return rules.slice(start, end === -1 ? undefined : end);
}

describe('firestore.rules — invariants (garde statique)', () => {
  it('meta/legalInfo : lecture publique dédiée, écriture admin (bug lot 6 fermé)', () => {
    const bloc = blocDe('meta/legalInfo');
    expect(bloc).toMatch(/allow read;/);
    expect(bloc).toMatch(/allow write: if isAdmin\(\)/);
  });

  it('meta/maintenance : lecture publique (middleware Edge), écriture admin', () => {
    const bloc = blocDe('meta/maintenance');
    expect(bloc).toMatch(/allow read;/);
    expect(bloc).toMatch(/allow write: if isAdmin\(\)/);
  });

  it('meta/contactInfo : même contrat que legalInfo', () => {
    const bloc = blocDe('meta/contactInfo');
    expect(bloc).toMatch(/allow read;/);
    expect(bloc).toMatch(/allow write: if isAdmin\(\)/);
  });

  it('demandes, avis, réservations : création client directe INTERDITE', () => {
    for (const c of ['demandes/{doc}', 'avis/{doc}']) {
      expect(blocDe(c)).toMatch(/allow create: if false/);
    }
    expect(rules).toMatch(/reservations[\s\S]{0,400}allow create: if false/);
  });

  it('orders : création client directe INTERDITE (Admin SDK seulement)', () => {
    expect(blocDe('orders/{doc}')).toMatch(/allow create: if false/);
  });

  it('audit_log : immuable même pour les admins', () => {
    expect(blocDe('audit_log/{doc}')).toMatch(/allow update, delete: if false/);
  });
});
