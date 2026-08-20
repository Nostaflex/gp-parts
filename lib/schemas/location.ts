import { z } from 'zod';

// Narration de Max (Loca Lane) — 16 textes libres saisis au BO Paramètres.
// Vide = texte par défaut côté public (normalizeLocationSettings), donc aucun
// champ requis ; champ absent (ancien formulaire en cache) = vide, jamais un
// refus. Messages FRANÇAIS actionnables (leçon 2026-08-16).
const texteNarration = (nom: string) =>
  z.string().trim().max(300, `« ${nom} » : texte trop long (300 caractères max)`).default('');

export const LocationNarrationSchema = z.object({
  acte1SansDepart: texteNarration('Acte 1 · sans départ'),
  acte1VoeuSansDepart: texteNarration('Acte 1 · vœu épinglé'),
  acte1ChoixRetour: texteNarration('Acte 1 · choix du retour'),
  acte1CorrectionDepart: texteNarration('Acte 1 · correction du départ'),
  acte1Complet: texteNarration('Acte 1 · plage posée'),
  acte1LongSejour: texteNarration('Acte 1 · long séjour'),
  acte1PlageMorte: texteNarration('Acte 1 · plage morte'),
  acte1Carrefour: texteNarration('Acte 1 · carrefour du vœu'),
  acte1CarrefourSansAlt: texteNarration('Acte 1 · carrefour sans alternative'),
  acte2: texteNarration('Acte 2 · général'),
  acte2Rarete: texteNarration('Acte 2 · rareté'),
  acte2VoeuPris: texteNarration('Acte 2 · vœu pris'),
  acte3: texteNarration('Acte 3'),
  noteDefaut: texteNarration('Note par défaut'),
  noteUtilitaire: texteNarration('Note utilitaire'),
  noteLongue: texteNarration('Note longue durée'),
});
