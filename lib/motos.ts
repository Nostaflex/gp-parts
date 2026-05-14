// Source de vérité des motos vendues (occasion + neuf).
//
// Note: les images sont des placeholders Unsplash. À remplacer par les vraies
// photos des motos réelles de Stephane (5 angles par moto :
// face, profil G, profil D, arrière, tableau de bord).

export type EnergieMoto = 'Essence' | 'Électrique';
export type Disponibilite = 'disponible' | 'reserve' | 'vendu';
export type TypeMoto = 'occasion' | 'neuf';
export type CategorieMoto = 'Roadster' | 'Sport' | 'Trail' | 'Scooter' | 'Custom' | 'Routière';
export type Permis = 'A1' | 'A2' | 'A' | 'AM';

export type CaracteristiquesMoto = {
  puissance?: string;
  cylindree?: string;
  consommation?: string;
  poids?: string;
  couleur?: string;
  permis?: Permis;
  premiereCirculation?: string;
  proprietaires?: number;
  garantie?: string;
};

export type Moto = {
  id: string;
  type: TypeMoto;
  marque: string;
  modele: string;
  annee: number;
  km: number;
  categorie: CategorieMoto;
  energie: EnergieMoto;
  options: string[];
  prix: number;
  mensualite: number;
  image: string;
  images: string[];
  description: string;
  caracteristiques: CaracteristiquesMoto;
  reference: string;
  disponibilite: Disponibilite;
};

export const MOTOS: Moto[] = [
  // ─────────── OCCASION ───────────
  {
    id: 'yamaha-mt07',
    type: 'occasion',
    marque: 'Yamaha',
    modele: 'MT-07',
    annee: 2022,
    km: 12500,
    categorie: 'Roadster',
    energie: 'Essence',
    options: ['ABS', 'Selle confort', 'Sabot moteur'],
    prix: 6900,
    mensualite: 109,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=1200&q=85&fit=crop',
    ],
    description:
      'Yamaha MT-07 de 2022, le roadster polyvalent référent. Moteur bicylindre CP2 de 689 cm³, 73 ch, couple généreux et accessible. Position de conduite droite confortable, idéale pour la ville comme pour les sorties week-end en Guadeloupe. Bel état général, entretien suivi, pneus récents. Permis A2 bridable disponible.',
    caracteristiques: {
      puissance: '73 ch',
      cylindree: '689 cm³',
      consommation: '4.2 L/100km',
      poids: '184 kg',
      couleur: 'Ice Fluo',
      permis: 'A2',
      premiereCirculation: '04/2022',
      proprietaires: 1,
      garantie: '6 mois Car Performance',
    },
    reference: 'GP-M-MT07-001',
    disponibilite: 'disponible',
  },
  {
    id: 'honda-cb500x',
    type: 'occasion',
    marque: 'Honda',
    modele: 'CB500X',
    annee: 2021,
    km: 18200,
    categorie: 'Trail',
    energie: 'Essence',
    options: ['ABS', 'Top-case Givi', 'Pare-brise haut'],
    prix: 5800,
    mensualite: 89,
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=1200&q=85&fit=crop',
    ],
    description:
      'Honda CB500X de 2021, trail accessible parfait pour découvrir la moto sur les routes de Guadeloupe. Moteur bicylindre 471 cm³ de 47 ch (permis A2), réputé pour sa fiabilité. Position de conduite haute et droite, suspension longue débattement, idéal pour les pistes mixtes. Top-case Givi inclus, pare-brise haut anti-vent.',
    caracteristiques: {
      puissance: '47 ch',
      cylindree: '471 cm³',
      consommation: '3.5 L/100km',
      poids: '197 kg',
      couleur: 'Rouge',
      permis: 'A2',
      premiereCirculation: '08/2021',
      proprietaires: 1,
      garantie: '6 mois Car Performance',
    },
    reference: 'GP-M-CB500X-002',
    disponibilite: 'disponible',
  },
  {
    id: 'kawasaki-z900',
    type: 'occasion',
    marque: 'Kawasaki',
    modele: 'Z900',
    annee: 2023,
    km: 8400,
    categorie: 'Roadster',
    energie: 'Essence',
    options: ['ABS', 'Quickshifter', 'Échappement Akrapovic'],
    prix: 9500,
    mensualite: 149,
    image: 'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=1200&q=85&fit=crop',
    ],
    description:
      "Kawasaki Z900 de 2023, le roadster japonais nerveux. Moteur 4 cylindres en ligne 948 cm³, 125 ch, sonorité rauque grâce à l'échappement Akrapovic. Quickshifter pour des passages de rapport fluides. Position sportive mais confortable. Faible kilométrage, entretien à jour, idéal pour les amateurs de sensations sur les routes guadeloupéennes.",
    caracteristiques: {
      puissance: '125 ch',
      cylindree: '948 cm³',
      consommation: '5.5 L/100km',
      poids: '210 kg',
      couleur: 'Vert Lime',
      permis: 'A',
      premiereCirculation: '02/2023',
      proprietaires: 1,
      garantie: '6 mois Car Performance',
    },
    reference: 'GP-M-Z900-003',
    disponibilite: 'disponible',
  },
  {
    id: 'piaggio-mp3-500',
    type: 'occasion',
    marque: 'Piaggio',
    modele: 'MP3 500 HPE',
    annee: 2021,
    km: 22000,
    categorie: 'Scooter',
    energie: 'Essence',
    options: ['ABS', 'ASR', 'Démarrage sans clé', 'Top-case 50L'],
    prix: 7900,
    mensualite: 119,
    image: 'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85&fit=crop',
    ],
    description:
      'Piaggio MP3 500 HPE de 2021, le scooter 3 roues iconique. Conduite stable et sécurisante grâce à ses 2 roues avant, parfait pour les trajets urbains et périurbains. Moteur 500 cm³ HPE de 44 ch, accessible avec permis B après 3 ans (équivalence) ou permis moto. Top-case 50L pour les courses, démarrage sans clé.',
    caracteristiques: {
      puissance: '44 ch',
      cylindree: '493 cm³',
      consommation: '4.8 L/100km',
      poids: '258 kg',
      couleur: 'Blanc',
      permis: 'A2',
      premiereCirculation: '06/2021',
      proprietaires: 1,
      garantie: '6 mois Car Performance',
    },
    reference: 'GP-M-MP3-004',
    disponibilite: 'disponible',
  },
  {
    id: 'bmw-r1250gs',
    type: 'occasion',
    marque: 'BMW',
    modele: 'R 1250 GS Adventure',
    annee: 2022,
    km: 15800,
    categorie: 'Trail',
    energie: 'Essence',
    options: ['ABS Pro', 'Cruise control', 'Modes pilotage', 'Valises latérales'],
    prix: 18900,
    mensualite: 289,
    image: 'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85&fit=crop',
    ],
    description:
      'BMW R 1250 GS Adventure de 2022, la référence des grands trails. Bicylindre Boxer 1254 cm³ de 136 ch, couple massif à bas régime. Réservoir 30L pour une autonomie record. Valises latérales aluminium incluses. Idéale pour les longs raids, les pistes, et la conduite quotidienne. Modes de pilotage Rain/Road/Dynamic/Enduro/Enduro Pro.',
    caracteristiques: {
      puissance: '136 ch',
      cylindree: '1254 cm³',
      consommation: '5.4 L/100km',
      poids: '268 kg',
      couleur: 'Triple Black',
      permis: 'A',
      premiereCirculation: '03/2022',
      proprietaires: 1,
      garantie: '6 mois Car Performance + reste constructeur',
    },
    reference: 'GP-M-R1250-005',
    disponibilite: 'disponible',
  },

  // ─────────── NEUF ───────────
  {
    id: 'honda-pcx-125-neuf',
    type: 'neuf',
    marque: 'Honda',
    modele: 'PCX 125',
    annee: 2026,
    km: 0,
    categorie: 'Scooter',
    energie: 'Essence',
    options: ['ABS', 'Démarrage Idle Stop', 'Top-case option'],
    prix: 3990,
    mensualite: 65,
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&q=85&fit=crop',
    ],
    description:
      'Honda PCX 125 neuve, modèle 2026. Le scooter urbain le plus vendu en Europe, parfait pour la ville en Guadeloupe. Moteur eSP+ injection 125 cm³ très sobre (Idle Stop), accessible avec permis A1, AM ou B après formation. Coffre sous selle généreux, écran LCD, freinage ABS. Disponible en plusieurs coloris.',
    caracteristiques: {
      puissance: '12.4 ch',
      cylindree: '125 cm³',
      consommation: '2.0 L/100km',
      poids: '130 kg',
      couleur: 'Au choix',
      permis: 'A1',
      premiereCirculation: 'À immatriculer',
      proprietaires: 0,
      garantie: '2 ans constructeur Honda',
    },
    reference: 'GP-MN-PCX125-001',
    disponibilite: 'disponible',
  },
  {
    id: 'yamaha-tracer-9-neuf',
    type: 'neuf',
    marque: 'Yamaha',
    modele: 'Tracer 9 GT',
    annee: 2026,
    km: 0,
    categorie: 'Routière',
    energie: 'Essence',
    options: ['ABS cornering', 'Quickshifter', 'Cruise control adaptatif', 'Valises latérales'],
    prix: 13500,
    mensualite: 209,
    image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1558981852-426c6c22a060?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1591736648534-fbc6bf2c5e51?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1611241443322-b5c0c5e80f1c?w=1200&q=85&fit=crop',
    ],
    description:
      'Yamaha Tracer 9 GT neuve, modèle 2026. La routière sportive ultime : moteur CP3 trois cylindres 890 cm³, 119 ch, technologie embarquée premium (radar cruise adaptatif, ABS cornering, modes de pilotage). Valises latérales rigides incluses, écran TFT 7", chauffage poignées. Confort exceptionnel sur longs trajets.',
    caracteristiques: {
      puissance: '119 ch',
      cylindree: '890 cm³',
      consommation: '5.1 L/100km',
      poids: '220 kg',
      couleur: 'Au choix',
      permis: 'A',
      premiereCirculation: 'À immatriculer',
      proprietaires: 0,
      garantie: '2 ans constructeur Yamaha + extension Car Performance',
    },
    reference: 'GP-MN-TRACER9-002',
    disponibilite: 'disponible',
  },
];

export function getMotoById(id: string): Moto | undefined {
  return MOTOS.find((m) => m.id === id);
}

export function getAllMotoIds(): string[] {
  return MOTOS.map((m) => m.id);
}

export function getMotosByType(type: TypeMoto): Moto[] {
  return MOTOS.filter((m) => m.type === type);
}
