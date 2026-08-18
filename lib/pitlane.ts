// lib/pitlane.ts
// Logique pure du Pit Lane (handoff design 2026-08-17, README §4 + maquette
// cp-v4). Aucune dépendance UI : tout est testable en Vitest. Les dates sont
// des "YYYY-MM-DD" manipulées en heure LOCALE (jamais Date.parse UTC — la
// Guadeloupe est en UTC−4, un parse UTC décale le jour de semaine).

export type PitLaneDuree = { jours: number; libelle: string };

/** Durées proposées à l'étape 2 (maquette cp-v4 : week-end → tour de l'île). */
export const PITLANE_DUREES: readonly PitLaneDuree[] = [
  { jours: 2, libelle: 'week-end' },
  { jours: 3, libelle: 'escapade' },
  { jours: 5, libelle: 'semaine' },
  { jours: 7, libelle: 'tour de l’île' },
] as const;

function parseISOLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toISO(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

/** Date retour = départ + durée. Le jour de semaine est CALCULÉ, jamais en dur. */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISOLocal(iso);
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** Nombre de jours facturés entre deux dates ISO (0 si plage invalide). */
export function nbJoursEntre(departISO: string, retourISO: string): number {
  if (!departISO || !retourISO) return 0;
  const diff = Math.ceil(
    (parseISOLocal(retourISO).getTime() - parseISOLocal(departISO).getTime()) / 86400000
  );
  return diff > 0 ? diff : 0;
}

/** « mar. 18 août » — format court fr pour la bande de jours et le ticket. */
export function formatJourCourt(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseISOLocal(iso));
}

/** Les 6 jours de la bande, à partir de la date donnée (J+1 côté appelant). */
export function joursBande(fromISO: string): string[] {
  return Array.from({ length: 6 }, (_, i) => addDaysISO(fromISO, i));
}

/**
 * Jauge de remplissage d'un jour : largeur = part du parc occupée, couleur
 * selon la légende maquette (vert « ça respire », mangue « ça se remplit »,
 * rouge « complet »). La couleur confirme, le texte informe (libelleLibres).
 */
export function jaugeRemplissage(libres: number, total: number): { pct: number; couleur: string } {
  if (total <= 0 || libres <= 0) return { pct: 100, couleur: '#D92627' };
  const pct = Math.round(((total - libres) / total) * 100);
  const couleur = pct <= 40 ? '#52C88A' : '#E87200';
  return { pct, couleur };
}

/** Disponibilité écrite, jamais couleur seule (règle transverse handoff). */
export function libelleLibres(libres: number): string {
  if (libres <= 0) return 'complet';
  return `${libres} libre${libres > 1 ? 's' : ''}`;
}

export type MaxStoryContext = {
  step: 1 | 2 | 3;
  /** Places libres sur le jour de départ choisi (étape 2). */
  libresJourChoisi?: number;
  /** Jour de départ choisi, ISO (étape 2). */
  jourChoisi?: string;
  /** Durée choisie en jours (étape 2). */
  dureeJours?: number;
};

/**
 * Narration de Max — change par étape ET par choix (README §4). C'est elle
 * qui remplace les libellés d'aide ; ordre de priorité à l'étape 2 :
 * durée 7 j > rareté (≤ 3 libres) > texte général.
 */
export function maxStory(ctx: MaxStoryContext): { label: string; text: string } {
  const label = `Max · étape ${ctx.step} sur 3`;
  if (ctx.step === 1) {
    return {
      label,
      text: 'Le parc est là, en entier. Prends celle qui te ressemble — les dates, on en parle après.',
    };
  }
  if (ctx.step === 2) {
    if (ctx.dureeJours === 7) {
      return {
        label,
        text: 'Sept jours : Basse-Terre, Grande-Terre, et il te reste du carburant pour la Pointe des Châteaux.',
      };
    }
    if (
      ctx.libresJourChoisi !== undefined &&
      ctx.libresJourChoisi <= 3 &&
      ctx.libresJourChoisi > 0 &&
      ctx.jourChoisi
    ) {
      return {
        label,
        text: `Il ne reste que ${ctx.libresJourChoisi} retraits le ${formatJourCourt(ctx.jourChoisi)}. Je ne te promets pas qu'ils seront encore là ce soir.`,
      };
    }
    return {
      label,
      text: 'Les barres disent la vérité sur la semaine. Un jour complet est complet — personne ne te fera croire le contraire.',
    };
  }
  return {
    label,
    text: 'Empreinte CB, état des lieux en photos, quinze minutes de paperasse. Je te confirme sur WhatsApp avant la fin de la journée.',
  };
}

export type MaxSideNoteContext = {
  /** Catégorie du véhicule choisi. */
  categorie?: string;
  /** Durée choisie en jours. */
  dureeJours?: number;
};

/** Note latérale de Max (carte du récap) — le choix le plus spécifique gagne. */
export function maxSideNote(ctx: MaxSideNoteContext): string {
  if (ctx.categorie === 'Utilitaire') {
    return 'Trois mètres cubes : un déménagement d’étudiant tient dedans.';
  }
  if (ctx.dureeJours !== undefined && ctx.dureeJours >= 5) {
    return 'Km illimité — c’est au bout de cinq jours qu’on comprend pourquoi.';
  }
  return 'Km illimité et assurance déjà comptés.';
}
