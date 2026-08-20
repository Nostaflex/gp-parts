// Narration de la Splash Lane (lib/splash-lane.ts) — même contrat que la
// narration de Max (pitlane.test.ts), mais TOUS les textes sont administrables
// (BO lavage) : le choix le plus spécifique gagne, les gabarits {jour}
// {restants} {ferie} sont remplis, un champ vide retombe sur le défaut.
import { describe, expect, it } from 'vitest';
import {
  splashStory,
  splashSideNote,
  remplirNarration,
  gabaritsDisponibles,
} from '@/lib/splash-lane';
import { DEFAULT_LAVAGE_NARRATION, normalizeLavageSettings } from '@/lib/lavage-settings';

describe('remplirNarration', () => {
  it('remplit les gabarits connus et laisse les inconnus lisibles', () => {
    expect(
      remplirNarration('Reste {restants} le {jour} ({x})', { restants: '2', jour: 'mar.' })
    ).toBe('Reste 2 le mar. ({x})');
  });
});

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
    expect(s.text).toContain('2 créneau');
    expect(s.text).toContain('25 août');
  });

  it('étape 2 : jour complet (0 libre) ne déclenche PAS la rareté', () => {
    const s = splashStory({ step: 2, jourChoisi: '2026-08-25', libresJourChoisi: 0 });
    expect(s.text).toBe(DEFAULT_LAVAGE_NARRATION.etape2);
  });

  it('un texte BO personnalisé remplace le défaut, gabarits compris', () => {
    const s = splashStory(
      { step: 2, jourChoisi: '2026-08-25', libresJourChoisi: 1 },
      { ...DEFAULT_LAVAGE_NARRATION, etape2Rarete: 'Vite : {restants} place le {jour} !' }
    );
    expect(s.text).toBe('Vite : 1 place le mar. 25 août !');
  });
});

describe('splashSideNote', () => {
  it('prix à 0 centime = sur devis (le plus spécifique gagne)', () => {
    expect(splashSideNote({ prixEnCents: 0, gabarit: 'SUV' })).toBe(
      DEFAULT_LAVAGE_NARRATION.noteSurDevis
    );
  });

  it('gabarit contenant « SUV » : note dédiée', () => {
    expect(splashSideNote({ gabarit: 'SUV', prixEnCents: 9000 })).toBe(
      DEFAULT_LAVAGE_NARRATION.noteSuv
    );
  });

  it('défaut : note de réassurance', () => {
    expect(splashSideNote({})).toBe(DEFAULT_LAVAGE_NARRATION.noteDefaut);
  });
});

describe('gabaritsDisponibles', () => {
  it('union ordonnée des libellés des formules multi-tarifs, forfaits exclus', () => {
    const gabarits = gabaritsDisponibles([
      {
        tarifs: [{ label: 'Citadine' }, { label: 'SUV' }],
      },
      { tarifs: [{ label: 'Forfait' }] },
      { tarifs: [{ label: 'SUV' }, { label: 'Gamme B' }] },
    ]);
    expect(gabarits).toEqual(['Citadine', 'SUV', 'Gamme B']);
  });
});

describe('normalizeLavageSettings — narration', () => {
  it('sans doc : narration = défauts complets', () => {
    expect(normalizeLavageSettings(null).narration).toEqual(DEFAULT_LAVAGE_NARRATION);
  });

  it('champ personnalisé conservé, champ vide → défaut', () => {
    const s = normalizeLavageSettings({
      formules: [{ nom: 'X', tarifs: [{ label: 'SUV', prixTTCEnCents: 100 }] }],
      narration: { etape1: 'Bonjour !', etape2: '   ' },
    });
    expect(s.narration.etape1).toBe('Bonjour !');
    expect(s.narration.etape2).toBe(DEFAULT_LAVAGE_NARRATION.etape2);
    expect(s.narration.etape3).toBe(DEFAULT_LAVAGE_NARRATION.etape3);
  });
});
