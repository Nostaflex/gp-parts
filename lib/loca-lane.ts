// lib/loca-lane.ts
// Logique pure de la Loca Lane — « le planning d'abord » (spec gelée
// docs/architecture/2026-08-20-loca-lane.md). Aucune dépendance UI ni
// serveur : tout est testable en Vitest. Les plages occupées arrivent du
// serveur SANS PII ({locationCarId, dateDepart, dateRetour}) et toute la
// disponibilité se calcule ici, côté client, sans re-fetch.

import { addDaysISO } from './pitlane';
import { rangesOverlap } from './reservations';
import { remplirNarration } from './splash-lane';

import type { LocationNarration } from './location-settings';

/** Plage bloquante d'un véhicule — miroir client-safe de CarBusyRange. */
export type PlageOccupee = { locationCarId: string; dateDepart: string; dateRetour: string };

export type VehiculeLane = {
  id: string;
  categorie: string;
  prixJourEnCents: number;
};

/** Fenêtre de N jours à partir de fromISO (inclus). */
export function fenetreJours(fromISO: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDaysISO(fromISO, i));
}

/** Un séjour [dep, ret] entre en collision avec la plage b ? (bords inclusifs
 * — rangesOverlap v1 : bord commun = conflit, pas de rotation même-jour). */
function collision(dep: string, ret: string, b: PlageOccupee): boolean {
  return rangesOverlap(dep, ret, b.dateDepart, b.dateRetour);
}

/** Le véhicule est-il libre sur tout le séjour ? */
export function vehiculeLibre(
  plages: PlageOccupee[],
  carId: string,
  dep: string,
  ret: string
): boolean {
  return !plages.some((b) => b.locationCarId === carId && collision(dep, ret, b));
}

/** Nombre de véhicules du parc libres UN jour donné. */
export function libresLeJour(
  cars: readonly VehiculeLane[],
  plages: PlageOccupee[],
  jour: string
): number {
  return cars.filter((c) => vehiculeLibre(plages, c.id, jour, jour)).length;
}

/** Premier jour où le véhicule redevient libre après collision avec [dep, ret]
 * — '' si aucune collision (il est déjà libre). */
export function libreLe(plages: PlageOccupee[], carId: string, dep: string, ret: string): string {
  let max = '';
  for (const b of plages) {
    if (b.locationCarId === carId && collision(dep, ret, b) && b.dateRetour > max)
      max = b.dateRetour;
  }
  return max ? addDaysISO(max, 1) : '';
}

/** Plage morte : premier départ ≥ dep+1 (même durée) où AU MOINS un véhicule
 * suit — null si rien dans l'horizon de recherche. */
export function premierDepartPossible(
  cars: readonly VehiculeLane[],
  plages: PlageOccupee[],
  dep: string,
  nbJours: number,
  horizonRecherche = 60
): string | null {
  for (let i = 1; i <= horizonRecherche; i++) {
    const s = addDaysISO(dep, i);
    const r = addDaysISO(s, nbJours);
    if (cars.some((c) => vehiculeLibre(plages, c.id, s, r))) return s;
  }
  return null;
}

/** Le « second véhicule qui clôture le match » (spec R10) : libre sur LA
 * plage — même catégorie d'abord, sinon le prix le plus proche. */
export function meilleureAlternative(
  cars: readonly VehiculeLane[],
  plages: PlageOccupee[],
  wishId: string,
  dep: string,
  ret: string
): VehiculeLane | null {
  const wish = cars.find((c) => c.id === wishId);
  if (!wish) return null;
  const libres = cars.filter((c) => c.id !== wishId && vehiculeLibre(plages, c.id, dep, ret));
  if (libres.length === 0) return null;
  const memeCat = libres.filter((c) => c.categorie === wish.categorie);
  if (memeCat.length > 0) return memeCat[0];
  return [...libres].sort(
    (a, b) =>
      Math.abs(a.prixJourEnCents - wish.prixJourEnCents) -
      Math.abs(b.prixJourEnCents - wish.prixJourEnCents)
  )[0];
}

/** Jauge d'un jour du calendrier (spec R7) : vert « ça respire », OR « ça se
 * remplit » (≥ 60 % occupé), rouge complet — l'orange reste exclusif à la
 * fin de plage et à l'action. */
export function jaugeJour(libres: number, total: number): { pct: number; couleur: string } {
  if (total <= 0 || libres <= 0) return { pct: 100, couleur: '#D92627' };
  const pct = Math.round(((total - libres) / total) * 100);
  return { pct, couleur: pct >= 60 ? '#E9C46A' : '#52C88A' };
}

// ── Narration de Max — administrable (spec R12 : le dialogue est l'interface) ──

export type MaxRecitContext = {
  acte: 1 | 2 | 3;
  /** 'start' | 'end' | null — champ en cours d'édition (acte 1). */
  editing?: 'start' | 'end' | null;
  depart?: string; // libellé humain (« ven. 21 août »)
  retour?: string;
  nbJours?: number;
  /** Nom du véhicule vœu (« Dacia Duster »). */
  voeu?: string;
  /** Nom de la meilleure alternative libre sur la plage. */
  alternative?: string;
  /** Le vœu est pris sur la plage choisie. */
  voeuPris?: boolean;
  /** Aucun véhicule du parc ne couvre la plage. */
  plageMorte?: boolean;
  /** Véhicules libres sur la plage (acte 2). */
  dispo?: number;
};

/** Réplique de Max — le contexte le plus spécifique gagne (spec R10/R11).
 * Ordre acte 1 : correction > pas de départ > choix retour > plage morte >
 * carrefour > long séjour > complet. */
export function maxRecit(
  ctx: MaxRecitContext,
  n: LocationNarration
): { label: string; text: string } {
  const label = `Max · acte ${ctx.acte} sur 3`;
  const vars = {
    depart: ctx.depart ?? '',
    retour: ctx.retour ?? '',
    jours: String(ctx.nbJours ?? ''),
    vehicule: ctx.voeu ?? '',
    alternative: ctx.alternative ?? '',
    dispo: String(ctx.dispo ?? ''),
  };
  const t = (tpl: string) => ({ label, text: remplirNarration(tpl, vars) });

  if (ctx.acte === 1) {
    if (ctx.editing === 'start' && ctx.depart) return t(n.acte1CorrectionDepart);
    if (!ctx.depart) return t(ctx.voeu ? n.acte1VoeuSansDepart : n.acte1SansDepart);
    if (ctx.editing === 'end' || !ctx.nbJours) return t(n.acte1ChoixRetour);
    if (ctx.plageMorte) return t(n.acte1PlageMorte);
    if (ctx.voeuPris) return t(ctx.alternative ? n.acte1Carrefour : n.acte1CarrefourSansAlt);
    if ((ctx.nbJours ?? 0) >= 7) return t(n.acte1LongSejour);
    return t(n.acte1Complet);
  }
  if (ctx.acte === 2) {
    if (ctx.voeuPris && ctx.voeu) return t(n.acte2VoeuPris);
    if (ctx.dispo !== undefined && ctx.dispo <= 2 && ctx.dispo > 0) return t(n.acte2Rarete);
    return t(n.acte2);
  }
  return t(n.acte3);
}

export type MaxNoteContext = {
  categorie?: string;
  nbJours?: number;
};

/** Note latérale de Max (carte du récap) — le choix le plus spécifique gagne. */
export function maxNote(ctx: MaxNoteContext, n: LocationNarration): string {
  if (ctx.categorie === 'Utilitaire') return n.noteUtilitaire;
  if ((ctx.nbJours ?? 0) >= 5) return n.noteLongue;
  return n.noteDefaut;
}
