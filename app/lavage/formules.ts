// Formules lavage — partagées entre la page (cartes) et le formulaire (chips).
// TODO(Stéphane): prix et contenus réels à confirmer (question S3 du
// 2026-08-12) — d'ici là, tout est affiché « Sur devis ».

export type Formule = {
  nom: string;
  desc: string;
  inclus: string[];
  prix: string;
};

export const FORMULES: Formule[] = [
  {
    nom: 'Extérieur',
    desc: 'Carrosserie propre, jantes et vitres impeccables.',
    inclus: [
      'Prélavage + lavage main',
      'Jantes & pneus',
      'Vitres extérieures',
      'Séchage microfibre',
    ],
    prix: 'Sur devis',
  },
  {
    nom: 'Intérieur',
    desc: 'Habitacle aspiré, plastiques et vitres nettoyés.',
    inclus: ['Aspiration complète', 'Plastiques & tableau de bord', 'Vitres intérieures', 'Tapis'],
    prix: 'Sur devis',
  },
  {
    nom: 'Complet',
    desc: 'Extérieur + intérieur, le véhicule comme neuf.',
    inclus: ['Formule Extérieur', 'Formule Intérieur', 'Finitions & détails'],
    prix: 'Sur devis',
  },
  {
    nom: 'Rénovation',
    desc: 'Traitement en profondeur pour redonner de l’éclat.',
    inclus: ['Décontamination carrosserie', 'Polissage / lustrage', 'Shampoing sièges & moquettes'],
    prix: 'Sur devis',
  },
];
