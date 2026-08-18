import { describe, it, expect } from 'vitest';
import {
  normalizeMaintenance,
  maintenanceFromRestDoc,
  DEFAULT_MAINTENANCE,
} from '@/lib/maintenance';

describe('maintenance — normalisation (BO + page)', () => {
  it('null/doc vide → OFF avec les textes par défaut (jamais un site cassé)', () => {
    expect(normalizeMaintenance(null)).toEqual(DEFAULT_MAINTENANCE);
    expect(normalizeMaintenance({}).enabled).toBe(false);
  });

  it('enabled doit être STRICTEMENT true (une string « true » ne suffit pas)', () => {
    expect(normalizeMaintenance({ enabled: 'true' }).enabled).toBe(false);
    expect(normalizeMaintenance({ enabled: 1 }).enabled).toBe(false);
    expect(normalizeMaintenance({ enabled: true }).enabled).toBe(true);
  });

  it('titre/message vides ou blancs → défauts ; renseignés → conservés (trim)', () => {
    expect(normalizeMaintenance({ titre: '  ' }).titre).toBe(DEFAULT_MAINTENANCE.titre);
    expect(normalizeMaintenance({ titre: ' Bientôt ! ' }).titre).toBe('Bientôt !');
  });
});

describe('maintenance — parse REST Firestore (middleware Edge)', () => {
  it('document REST activé → enabled true + textes', () => {
    const cfg = maintenanceFromRestDoc({
      fields: {
        enabled: { booleanValue: true },
        titre: { stringValue: 'Ouverture le 1er septembre' },
        message: { stringValue: 'Patience !' },
      },
    });
    expect(cfg.enabled).toBe(true);
    expect(cfg.titre).toBe('Ouverture le 1er septembre');
  });

  it('réponse sans fields (404/erreur) → OFF (fail-open)', () => {
    expect(maintenanceFromRestDoc({}).enabled).toBe(false);
    expect(maintenanceFromRestDoc(null).enabled).toBe(false);
  });
});
