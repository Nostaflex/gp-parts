// lib/splash-lane.ts
// Logique pure de la Splash Lane — le Pit Lane de l'esthétique (maquette
// cp-v4-univers-standalone §2 : « même composant, accent bleu »). Narration
// de Splash par étape ET par choix, comme maxStory pour la location
// (lib/pitlane.ts) — mais ici TOUS les textes sont administrables au BO
// (décision Djemil 2026-08-20) : ils arrivent via LavageNarration, déjà
// complétés par les défauts (normalizeLavageSettings). Aucune dépendance UI.

import { formatJourCourt } from './pitlane';
import { DEFAULT_LAVAGE_NARRATION } from './lavage-settings';

import type { LavageNarration } from './lavage-settings';

/** Remplace les gabarits {jour}, {restants}, {ferie}… d'un texte BO.
 * Gabarit inconnu = laissé tel quel (le texte reste lisible, jamais un trou). */
export function remplirNarration(texte: string, vars: Record<string, string>): string {
  return texte.replace(/\{(\w+)\}/g, (tout, k: string) => vars[k] ?? tout);
}

export type SplashStoryContext = {
  step: 1 | 2 | 3;
  /** Créneaux libres sur le jour choisi (étape 2). */
  libresJourChoisi?: number;
  /** Jour choisi, ISO (étape 2). */
  jourChoisi?: string;
  /** Libellé du férié du jour choisi (étape 2) — indication, pas blocage. */
  ferieJourChoisi?: string;
};

/**
 * Narration de Splash — remplace les libellés d'aide (même rôle que Max sur
 * la location). Ordre de priorité à l'étape 2 : férié > rareté (≤ 2 libres)
 * > texte général.
 */
export function splashStory(
  ctx: SplashStoryContext,
  narration: LavageNarration = DEFAULT_LAVAGE_NARRATION
): { label: string; text: string } {
  const label = `Splash · étape ${ctx.step} sur 3`;
  if (ctx.step === 1) return { label, text: narration.etape1 };
  if (ctx.step === 2) {
    if (ctx.ferieJourChoisi && ctx.jourChoisi) {
      return {
        label,
        text: remplirNarration(narration.etape2Ferie, {
          jour: formatJourCourt(ctx.jourChoisi),
          ferie: ctx.ferieJourChoisi,
        }),
      };
    }
    if (
      ctx.libresJourChoisi !== undefined &&
      ctx.libresJourChoisi <= 2 &&
      ctx.libresJourChoisi > 0 &&
      ctx.jourChoisi
    ) {
      return {
        label,
        text: remplirNarration(narration.etape2Rarete, {
          restants: String(ctx.libresJourChoisi),
          jour: formatJourCourt(ctx.jourChoisi),
        }),
      };
    }
    return { label, text: narration.etape2 };
  }
  return { label, text: narration.etape3 };
}

export type SplashSideNoteContext = {
  /** Gabarit choisi (libellé de tarif BO : Citadine / Gamme B / SUV…). */
  gabarit?: string;
  /** Prix TTC connu en centimes (0 = sur devis). */
  prixEnCents?: number;
};

/** Note latérale de Splash (carte du récap) — le choix le plus spécifique gagne. */
export function splashSideNote(
  ctx: SplashSideNoteContext,
  narration: LavageNarration = DEFAULT_LAVAGE_NARRATION
): string {
  if (ctx.prixEnCents === 0) return narration.noteSurDevis;
  if (ctx.gabarit && /suv/i.test(ctx.gabarit)) return narration.noteSuv;
  return narration.noteDefaut;
}

/** Gabarits proposés à l'étape 1 : union ordonnée des libellés de tarifs des
 * formules multi-tarifs (les formules à tarif unique — forfaits — ne posent
 * pas de question de gabarit). */
export function gabaritsDisponibles(formules: { tarifs: { label: string }[] }[]): string[] {
  const out: string[] = [];
  for (const f of formules) {
    if (f.tarifs.length <= 1) continue;
    for (const t of f.tarifs) {
      if (!out.includes(t.label)) out.push(t.label);
    }
  }
  return out;
}
