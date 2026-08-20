// Narration de la Splash Lane (lib/splash-lane.ts) — même contrat que la
// narration de Max (pitlane.test.ts) : le choix le plus spécifique gagne.
import { describe, expect, it } from 'vitest';
import { splashStory, splashSideNote } from '@/lib/splash-lane';

describe('splashStory', () => {
  it('étiquette chaque étape « Splash · étape N sur 3 »', () => {
    expect(splashStory({ step: 1 }).label).toBe('Splash · étape 1 sur 3');
    expect(splashStory({ step: 2 }).label).toBe('Splash · étape 2 sur 3');
    expect(splashStory({ step: 3 }).label).toBe('Splash · étape 3 sur 3');
  });

  it('étape 2 : le férié du jour choisi passe avant tout', () => {
    const s = splashStory({
      step: 2,
      jourChoisi: '2026-11-02',
      ferieJourChoisi: 'la Toussaint des défunts',
      libresJourChoisi: 1,
    });
    expect(s.text).toContain('la Toussaint des défunts');
  });

  it('étape 2 : rareté (≤ 2 libres) mentionne le compte et le jour', () => {
    const s = splashStory({ step: 2, jourChoisi: '2026-08-25', libresJourChoisi: 2 });
    expect(s.text).toContain('2 créneaux');
    expect(s.text).toContain('25 août');
  });

  it('étape 2 : jour complet (0 libre) ne déclenche PAS la rareté', () => {
    const s = splashStory({ step: 2, jourChoisi: '2026-08-25', libresJourChoisi: 0 });
    expect(s.text).toContain('Les barres disent la vérité');
  });

  it('étape 2 sans choix : texte général de légende', () => {
    expect(splashStory({ step: 2 }).text).toContain('Les barres disent la vérité');
  });
});

describe('splashSideNote', () => {
  it('prix à 0 centime = sur devis (le plus spécifique gagne)', () => {
    expect(splashSideNote({ prixEnCents: 0, gabarit: 'SUV' })).toContain('devis');
  });

  it('gabarit SUV : note dédiée', () => {
    expect(splashSideNote({ gabarit: 'SUV', prixEnCents: 9000 })).toContain('SUV');
  });

  it('défaut : réassurance produits pro + aucun paiement en ligne', () => {
    expect(splashSideNote({})).toContain('Aucun paiement en ligne');
  });
});
