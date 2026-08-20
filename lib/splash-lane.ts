// lib/splash-lane.ts
// Logique pure de la Splash Lane — le Pit Lane de l'esthétique (maquette
// cp-v4-univers-standalone §2 : « même composant, accent bleu »). Narration
// de Splash par étape ET par choix, comme maxStory pour la location
// (lib/pitlane.ts). Aucune dépendance UI : tout est testable en Vitest.

import { formatJourCourt } from './pitlane';

export type SplashStoryContext = {
  step: 1 | 2 | 3;
  /** Formule choisie (étape 1) — libellé BO, jamais en dur. */
  formule?: string;
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
export function splashStory(ctx: SplashStoryContext): { label: string; text: string } {
  const label = `Splash · étape ${ctx.step} sur 3`;
  if (ctx.step === 1) {
    return {
      label,
      text: 'Choisis ta formule — le gabarit compte : un SUV, c’est plus de tôle à faire briller.',
    };
  }
  if (ctx.step === 2) {
    if (ctx.ferieJourChoisi && ctx.jourChoisi) {
      return {
        label,
        text: `Le ${formatJourCourt(ctx.jourChoisi)} c’est ${ctx.ferieJourChoisi} — si le créneau est ouvert, c’est que l’atelier tourne.`,
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
        text: `Il ne reste que ${ctx.libresJourChoisi} créneau${ctx.libresJourChoisi > 1 ? 'x' : ''} le ${formatJourCourt(ctx.jourChoisi)}. L’eau n’attend pas.`,
      };
    }
    return {
      label,
      text: 'Les barres disent la vérité sur la semaine. Bleu, ça respire ; orange, ça se remplit ; rouge, c’est complet.',
    };
  }
  return {
    label,
    text: 'De quoi te rappeler, et c’est tout — je te confirme le tarif exact sous 24 h en jours ouvrés. On ti splash, lave’y fè’y kléré !',
  };
}

export type SplashSideNoteContext = {
  /** Gabarit choisi (libellé de tarif BO : Citadine / Gamme B / SUV…). */
  gabarit?: string;
  /** Prix TTC connu en centimes (0 = sur devis). */
  prixEnCents?: number;
};

/** Note latérale de Splash (carte du récap) — le choix le plus spécifique gagne. */
export function splashSideNote(ctx: SplashSideNoteContext): string {
  if (ctx.prixEnCents === 0) {
    return 'Sur devis : on regarde le véhicule ensemble avant de donner un chiffre.';
  }
  if (ctx.gabarit && /suv/i.test(ctx.gabarit)) {
    return 'Un SUV, c’est plus de surface — le tarif le dit, le résultat aussi.';
  }
  return 'Produits professionnels, lavage manuel. Aucun paiement en ligne.';
}
