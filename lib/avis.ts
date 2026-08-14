// Avis clients RÉELS — collectés sur le site, modérés au BO avant publication.
// Cadre légal (art. L121-4 + L111-7-2 C. conso, vérifié 2026-08-13) :
//  - JAMAIS de publication automatique : status 'nouveau' → décision admin ;
//  - le BO peut PUBLIER / REJETER / RÉPONDRE — jamais modifier le texte d'un
//    avis (la modification d'avis est une pratique commerciale trompeuse) ;
//  - la page publique affiche la date et la politique de modération.

export type AvisStatus = 'nouveau' | 'publie' | 'rejete';

export const AVIS_PRESTATIONS = ['reparation', 'lavage', 'location', 'achat', 'autre'] as const;
export type AvisPrestation = (typeof AVIS_PRESTATIONS)[number];

export const AVIS_PRESTATION_LABEL: Record<AvisPrestation, string> = {
  reparation: 'Réparation',
  lavage: 'Lavage',
  location: 'Location',
  achat: 'Achat (pièce ou véhicule)',
  autre: 'Autre',
};

export type Avis = {
  id: string;
  prenom: string; // seul le prénom est affiché publiquement (minimisation RGPD)
  note: number; // 1-5
  texte: string;
  prestation: AvisPrestation;
  status: AvisStatus;
  createdAt: string; // ISO — date de dépôt, affichée publiquement (L111-7-2)
  updatedAt: string;
  publishedAt: string | null;
  /** Réponse du garage, affichée sous l'avis — le seul texte que le BO écrit. */
  reponsePro: string;
};

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Fusion tolérante pour la lecture publique (fail-open, jamais de crash). */
export function normalizeAvisList(raw: unknown[]): Avis[] {
  const out: Avis[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const a = item as Record<string, unknown>;
    const prenom = str(a.prenom);
    const texte = str(a.texte);
    const note = typeof a.note === 'number' ? Math.min(5, Math.max(1, Math.round(a.note))) : 0;
    if (!prenom || !texte || note < 1) continue;
    out.push({
      id: str(a.id),
      prenom,
      note,
      texte,
      prestation: (AVIS_PRESTATIONS as readonly string[]).includes(str(a.prestation))
        ? (str(a.prestation) as AvisPrestation)
        : 'autre',
      status: a.status === 'publie' || a.status === 'rejete' ? a.status : 'nouveau',
      createdAt: str(a.createdAt),
      updatedAt: str(a.updatedAt),
      publishedAt: str(a.publishedAt) || null,
      reponsePro: str(a.reponsePro),
    });
  }
  return out;
}

/** Moyenne arrondie au dixième — null si aucun avis. */
export function noteMoyenne(avis: { note: number }[]): number | null {
  if (avis.length === 0) return null;
  return Math.round((avis.reduce((s, a) => s + a.note, 0) / avis.length) * 10) / 10;
}
