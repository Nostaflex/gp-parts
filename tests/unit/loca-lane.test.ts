// Logique pure de la Loca Lane (lib/loca-lane.ts) — spec gelée
// docs/architecture/2026-08-20-loca-lane.md. Bords INCLUSIFS (rangesOverlap
// v1 : bord commun = conflit).
import { describe, expect, it } from 'vitest';
import {
  fenetreJours,
  vehiculeLibre,
  libresLeJour,
  libreLe,
  premierDepartPossible,
  meilleureAlternative,
  jaugeJour,
  maxRecit,
  maxNote,
} from '@/lib/loca-lane';
import { DEFAULT_LOCATION_NARRATION, normalizeLocationSettings } from '@/lib/location-settings';

import type { PlageOccupee, VehiculeLane } from '@/lib/loca-lane';

const CARS: VehiculeLane[] = [
  { id: 'yaris', categorie: 'Citadine', prixJourEnCents: 3500 },
  { id: 'clio', categorie: 'Citadine', prixJourEnCents: 3500 },
  { id: 'duster', categorie: 'SUV', prixJourEnCents: 5200 },
  { id: 'kangoo', categorie: 'Utilitaire', prixJourEnCents: 4800 },
];

const PLAGES: PlageOccupee[] = [
  { locationCarId: 'duster', dateDepart: '2026-08-21', dateRetour: '2026-08-23' },
  { locationCarId: 'duster', dateDepart: '2026-09-14', dateRetour: '2026-09-20' },
  { locationCarId: 'kangoo', dateDepart: '2026-08-20', dateRetour: '2026-08-24' },
];

describe('fenetreJours', () => {
  it('N jours depuis fromISO inclus, mois traversé', () => {
    const f = fenetreJours('2026-08-30', 4);
    expect(f).toEqual(['2026-08-30', '2026-08-31', '2026-09-01', '2026-09-02']);
  });
});

describe('vehiculeLibre / libresLeJour', () => {
  it('bord commun = conflit (v1)', () => {
    expect(vehiculeLibre(PLAGES, 'duster', '2026-08-23', '2026-08-25')).toBe(false);
    expect(vehiculeLibre(PLAGES, 'duster', '2026-08-24', '2026-08-26')).toBe(true);
  });
  it('compte les libres un jour donné', () => {
    expect(libresLeJour(CARS, PLAGES, '2026-08-22')).toBe(2); // duster + kangoo pris
    expect(libresLeJour(CARS, PLAGES, '2026-08-25')).toBe(4);
  });
});

describe('libreLe', () => {
  it('lendemain de la fin de la collision la plus tardive', () => {
    expect(libreLe(PLAGES, 'duster', '2026-08-22', '2026-08-25')).toBe('2026-08-24');
  });
  it("'' si déjà libre", () => {
    expect(libreLe(PLAGES, 'yaris', '2026-08-22', '2026-08-25')).toBe('');
  });
});

describe('premierDepartPossible (plage morte)', () => {
  it('trouve le premier départ où au moins un véhicule suit', () => {
    // Parc d'un seul véhicule pris jusqu'au 23 inclus → premier départ libre
    // (bords inclusifs) = le 24.
    const solo: VehiculeLane[] = [CARS[2]];
    const s = premierDepartPossible(solo, PLAGES, '2026-08-21', 2);
    expect(s).toBe('2026-08-24');
  });
  it('null si rien dans l’horizon', () => {
    const jamais: PlageOccupee[] = [
      { locationCarId: 'yaris', dateDepart: '2026-01-01', dateRetour: '2027-12-31' },
    ];
    expect(premierDepartPossible([CARS[0]], jamais, '2026-08-21', 2, 10)).toBeNull();
  });
});

describe('meilleureAlternative', () => {
  it('même catégorie d’abord', () => {
    // Vœu yaris (Citadine) pris fictivement → clio (Citadine) avant tout autre
    const alt = meilleureAlternative(CARS, PLAGES, 'yaris', '2026-08-22', '2026-08-25');
    expect(alt?.id).toBe('clio');
  });
  it('sinon prix le plus proche', () => {
    // Vœu duster (SUV, 52 €) — kangoo (48 €) plus proche que les citadines (35 €)
    const sansKangooPris = PLAGES.filter((p) => p.locationCarId !== 'kangoo');
    const alt = meilleureAlternative(CARS, sansKangooPris, 'duster', '2026-08-22', '2026-08-23');
    expect(alt?.id).toBe('kangoo');
  });
  it('null si rien de libre', () => {
    const tousPris: PlageOccupee[] = CARS.map((c) => ({
      locationCarId: c.id,
      dateDepart: '2026-08-01',
      dateRetour: '2026-08-31',
    }));
    expect(meilleureAlternative(CARS, tousPris, 'duster', '2026-08-22', '2026-08-23')).toBeNull();
  });
});

describe('jaugeJour', () => {
  it('vert < 60 % occupé, OR ≥ 60 %, rouge complet (R7)', () => {
    expect(jaugeJour(4, 5).couleur).toBe('#52C88A');
    expect(jaugeJour(2, 5).couleur).toBe('#E9C46A');
    expect(jaugeJour(0, 5).couleur).toBe('#D92627');
  });
});

describe('maxRecit — priorités de la spec', () => {
  const n = DEFAULT_LOCATION_NARRATION;
  it('correction du départ prime sur tout', () => {
    const r = maxRecit(
      { acte: 1, editing: 'start', depart: 'ven. 21 août', nbJours: 3, plageMorte: true },
      n
    );
    expect(r.text).toBe(n.acte1CorrectionDepart);
  });
  it('plage morte prime sur le carrefour', () => {
    const r = maxRecit(
      { acte: 1, depart: 'a', retour: 'b', nbJours: 3, plageMorte: true, voeuPris: true },
      n
    );
    expect(r.text).toContain('tout le parc est pris');
  });
  it('carrefour : gabarits remplis', () => {
    const r = maxRecit(
      {
        acte: 1,
        depart: 'ven. 21 août',
        retour: 'dim. 23 août',
        nbJours: 2,
        voeuPris: true,
        voeu: 'Dacia Duster',
        alternative: 'Toyota Yaris',
      },
      n
    );
    expect(r.text).toContain('Dacia Duster');
    expect(r.text).toContain('Toyota Yaris');
    expect(r.text).toContain('ven. 21 août');
  });
  it('acte 2 : rareté à ≤ 2 dispo', () => {
    expect(maxRecit({ acte: 2, dispo: 2 }, n).text).toContain('2 véhicules');
    expect(maxRecit({ acte: 2, dispo: 0, depart: 'x' }, n).text).toBe(
      n.acte2.replace('{depart}', 'x')
    );
  });
  it('texte BO personnalisé remplace le défaut', () => {
    const r = maxRecit({ acte: 3 }, { ...n, acte3: 'Papiers, photos, quinze minutes chrono.' });
    expect(r.text).toBe('Papiers, photos, quinze minutes chrono.');
  });
});

describe('maxNote', () => {
  const n = DEFAULT_LOCATION_NARRATION;
  it('utilitaire > longue durée > défaut', () => {
    expect(maxNote({ categorie: 'Utilitaire', nbJours: 9 }, n)).toBe(n.noteUtilitaire);
    expect(maxNote({ nbJours: 6 }, n)).toBe(n.noteLongue);
    expect(maxNote({}, n)).toBe(n.noteDefaut);
  });
});

describe('normalizeLocationSettings — narration', () => {
  it('sans doc : défauts complets', () => {
    expect(normalizeLocationSettings(null).narration).toEqual(DEFAULT_LOCATION_NARRATION);
  });
  it('champ personnalisé conservé, vide → défaut', () => {
    const s = normalizeLocationSettings({ narration: { acte3: 'Salut !', acte2: '  ' } });
    expect(s.narration.acte3).toBe('Salut !');
    expect(s.narration.acte2).toBe(DEFAULT_LOCATION_NARRATION.acte2);
  });
});
