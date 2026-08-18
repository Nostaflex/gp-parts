import { describe, it, expect } from 'vitest';
import {
  PITLANE_DUREES,
  addDaysISO,
  formatJourCourt,
  joursBande,
  jaugeRemplissage,
  libelleLibres,
  maxStory,
  maxSideNote,
} from '@/lib/pitlane';

describe('addDaysISO — retour calculé, jamais de libellé en dur', () => {
  it('ajoute des jours dans le même mois', () => {
    expect(addDaysISO('2026-08-18', 2)).toBe('2026-08-20');
  });
  it('franchit la fin de mois', () => {
    expect(addDaysISO('2026-08-30', 3)).toBe('2026-09-02');
  });
  it('franchit la fin d’année', () => {
    expect(addDaysISO('2026-12-30', 5)).toBe('2027-01-04');
  });
  it('franchit le 29 février (année bissextile)', () => {
    expect(addDaysISO('2028-02-28', 2)).toBe('2028-03-01');
  });
});

describe('nbJoursEntre — durée facturée', () => {
  it('2 jours entre le 18 et le 20', async () => {
    const { nbJoursEntre } = await import('@/lib/pitlane');
    expect(nbJoursEntre('2026-08-18', '2026-08-20')).toBe(2);
  });
  it('plage inversée ou vide → 0', async () => {
    const { nbJoursEntre } = await import('@/lib/pitlane');
    expect(nbJoursEntre('2026-08-20', '2026-08-18')).toBe(0);
    expect(nbJoursEntre('', '2026-08-18')).toBe(0);
  });
});

describe('formatJourCourt — jour de semaine CALCULÉ (fr)', () => {
  it('formate « mar. 18 août »', () => {
    // 2026-08-18 est un mardi.
    expect(formatJourCourt('2026-08-18')).toBe('mar. 18 août');
  });
  it('formate un jour de janvier', () => {
    // 2027-01-04 est un lundi.
    expect(formatJourCourt('2027-01-04')).toBe('lun. 4 janv.');
  });
});

describe('joursBande — 6 jours à partir de demain', () => {
  it('retourne 6 jours consécutifs depuis la date donnée', () => {
    expect(joursBande('2026-08-18')).toEqual([
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
      '2026-08-21',
      '2026-08-22',
      '2026-08-23',
    ]);
  });
});

describe('jaugeRemplissage — couleur + largeur, le texte informe, la couleur confirme', () => {
  it('parc qui respire (≤ 40 % occupé) → vert', () => {
    expect(jaugeRemplissage(5, 6)).toEqual({ pct: 17, couleur: '#52C88A' });
  });
  it('ça se remplit → mangue', () => {
    expect(jaugeRemplissage(3, 6)).toEqual({ pct: 50, couleur: '#E87200' });
  });
  it('complet → rouge, jauge pleine', () => {
    expect(jaugeRemplissage(0, 6)).toEqual({ pct: 100, couleur: '#D92627' });
  });
  it('parc vide (total 0) → complet, jamais de division par zéro', () => {
    expect(jaugeRemplissage(0, 0)).toEqual({ pct: 100, couleur: '#D92627' });
  });
});

describe('libelleLibres — disponibilité écrite, jamais couleur seule', () => {
  it('pluriel', () => expect(libelleLibres(3)).toBe('3 libres'));
  it('singulier', () => expect(libelleLibres(1)).toBe('1 libre'));
  it('complet', () => expect(libelleLibres(0)).toBe('complet'));
});

describe('maxStory — narration par étape ET par choix', () => {
  it('étape 1 : le parc en entier', () => {
    const s = maxStory({ step: 1 });
    expect(s.label).toBe('Max · étape 1 sur 3');
    expect(s.text).toContain('Le parc est là');
  });
  it('étape 2 sans urgence : les barres disent la vérité', () => {
    const s = maxStory({ step: 2, libresJourChoisi: 5 });
    expect(s.text).toContain('Les barres disent la vérité');
  });
  it('étape 2, ≤ 3 libres sur le jour choisi : rareté nommée', () => {
    const s = maxStory({
      step: 2,
      libresJourChoisi: 2,
      jourChoisi: '2026-08-20',
    });
    expect(s.text).toContain('2 retraits');
    expect(s.text).toContain('jeu. 20 août');
  });
  it('étape 2, durée 7 jours : le tour de l’île l’emporte', () => {
    const s = maxStory({ step: 2, libresJourChoisi: 5, dureeJours: 7 });
    expect(s.text).toContain('Sept jours');
  });
  it('étape 3 : la paperasse en quinze minutes', () => {
    const s = maxStory({ step: 3 });
    expect(s.label).toBe('Max · étape 3 sur 3');
    expect(s.text).toContain('WhatsApp');
  });
});

describe('maxSideNote — notes latérales par choix', () => {
  it('utilitaire choisi → les trois mètres cubes', () => {
    expect(maxSideNote({ categorie: 'Utilitaire' })).toContain('mètres cubes');
  });
  it('≥ 5 jours → km illimité', () => {
    expect(maxSideNote({ dureeJours: 5 })).toContain('Km illimité');
  });
  it('défaut : assurance déjà comptée', () => {
    expect(maxSideNote({})).toContain('assurance');
  });
  it('l’utilitaire l’emporte sur la durée (choix le plus spécifique)', () => {
    expect(maxSideNote({ categorie: 'Utilitaire', dureeJours: 7 })).toContain('mètres cubes');
  });
});

describe('PITLANE_DUREES — presets du handoff', () => {
  it('2 / 3 / 5 / 7 jours avec leurs libellés', () => {
    expect(PITLANE_DUREES.map((d) => d.jours)).toEqual([2, 3, 5, 7]);
    expect(PITLANE_DUREES.map((d) => d.libelle)).toEqual([
      'week-end',
      'escapade',
      'semaine',
      'tour de l’île',
    ]);
  });
});
