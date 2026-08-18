// lib/legal-info.ts
// Fiche d'identité légale CONTRIBUABLE depuis le BO (arbitrage A6, lot 6) :
// les champs encore inconnus au lancement (TVA, médiateur, RC pro) restent
// VIDES — la page légale les affiche alors en rouge « — à fournir », jamais
// remplis de zéros. Doc Firestore : meta/legalInfo (pattern meta/contactInfo).
// SIRET/RCS/raison sociale restent des constantes du code : ils ne changent
// pas, et une fausse manipulation BO ne doit pas pouvoir les casser.

import { z } from 'zod';

export type LegalInfo = {
  /** N° TVA intracommunautaire — '' tant que non fourni. */
  tvaIntracom: string;
  /** Nom du médiateur de la consommation (L616-1) — '' tant que non adhéré. */
  mediateurNom: string;
  /** URL du médiateur — '' accepté. */
  mediateurUrl: string;
  /** Assureur + n° de police RC professionnelle — '' tant que non fourni. */
  rcPro: string;
};

export const DEFAULT_LEGAL_INFO: LegalInfo = {
  tvaIntracom: '',
  mediateurNom: '',
  mediateurUrl: '',
  rcPro: '',
};

const urlOrEmpty = z.string().refine((v) => v === '' || /^https?:\/\/.+/.test(v), {
  message: 'URL invalide',
});

export const LegalInfoSchema = z.object({
  tvaIntracom: z.string().max(20),
  mediateurNom: z.string().max(120),
  mediateurUrl: urlOrEmpty.and(z.string().max(200)),
  rcPro: z.string().max(160),
});

/** Fusion défauts + doc partiel — mêmes garanties que normalizeContactInfo. */
export function normalizeLegalInfo(raw: Partial<LegalInfo> | null | undefined): LegalInfo {
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    tvaIntracom: str(raw?.tvaIntracom),
    mediateurNom: str(raw?.mediateurNom),
    mediateurUrl: str(raw?.mediateurUrl),
    rcPro: str(raw?.rcPro),
  };
}
