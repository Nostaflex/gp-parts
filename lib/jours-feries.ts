// Jours fériés de la Guadeloupe — calcul LOCAL, déterministe, zéro API
// (demande Djemil 2026-08-16 : indication automatique et sans coût).
// Fériés nationaux + Vendredi Saint, Abolition de l'esclavage (27 mai) et
// Fête Victor Schœlcher (21 juillet), fériés aux Antilles.

/** Dimanche de Pâques (algorithme de Meeus/Butcher — grégorien, exact). */
function paques(annee: number): Date {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31); // 3 = mars, 4 = avril
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(annee, mois - 1, jour));
}

function cle(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function plus(d: Date, jours: number): Date {
  return new Date(d.getTime() + jours * 24 * 3600 * 1000);
}

/** Fériés d'une année → { 'YYYY-MM-DD': libellé }. Pur calcul, cachable. */
export function joursFeriesGuadeloupe(annee: number): Record<string, string> {
  const p = paques(annee);
  const fixe = (mois: number, jour: number) => cle(new Date(Date.UTC(annee, mois - 1, jour)));
  return {
    [fixe(1, 1)]: 'Jour de l’an',
    [cle(plus(p, -2))]: 'Vendredi Saint',
    [cle(plus(p, 1))]: 'Lundi de Pâques',
    [fixe(5, 1)]: 'Fête du Travail',
    [fixe(5, 8)]: 'Victoire 1945',
    [cle(plus(p, 39))]: 'Ascension',
    [cle(plus(p, 50))]: 'Lundi de Pentecôte',
    [fixe(5, 27)]: 'Abolition de l’esclavage',
    [fixe(7, 14)]: 'Fête nationale',
    [fixe(7, 21)]: 'Fête Victor Schœlcher',
    [fixe(8, 15)]: 'Assomption',
    [fixe(11, 1)]: 'Toussaint',
    [fixe(11, 11)]: 'Armistice 1918',
    [fixe(12, 25)]: 'Noël',
  };
}

/** Fériés couvrant une liste de dates (horizon multi-années safe). */
export function feriesPourDates(dates: string[]): Record<string, string> {
  const annees = [...new Set(dates.map((d) => Number(d.slice(0, 4))))];
  const tous = Object.assign({}, ...annees.map(joursFeriesGuadeloupe)) as Record<string, string>;
  return Object.fromEntries(dates.filter((d) => d in tous).map((d) => [d, tous[d]]));
}
