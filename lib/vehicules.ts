// Source de vérité des véhicules d'occasion vendus.
//
// Note: les images sont des placeholders Unsplash. À remplacer par les vraies
// photos des véhicules réels de Stephane (idéalement 5 angles par véhicule :
// face, profil, arrière, intérieur tableau de bord, intérieur sièges).

export type Energie = 'Essence' | 'Diesel' | 'Hybride';
export type Disponibilite = 'disponible' | 'reserve' | 'vendu';
export type TypeVehicule = 'occasion' | 'neuf';

export type Caracteristiques = {
  puissance?: string;
  cylindree?: string;
  consommation?: string;
  co2?: string;
  couleur?: string;
  carrosserie?: string;
  portes?: number;
  critAir?: string;
  premiereCirculation?: string;
  proprietaires?: number;
  garantie?: string;
};

export type Vehicule = {
  id: string;
  type: TypeVehicule;
  marque: string;
  modele: string;
  annee: number;
  km: number;
  energie: Energie;
  transmission: string;
  places: number;
  options: string[];
  prix: number;
  mensualite: number;
  image: string; // image principale (compat retro pour les cards existantes)
  images: string[]; // 5 images max pour la fiche détail
  description: string;
  caracteristiques: Caracteristiques;
  reference: string;
  disponibilite: Disponibilite;
  updatedAt: string; // ISO date — optimistic lock + tri admin (Phase 4)
};

export const VEHICULES: Vehicule[] = [
  {
    id: 'peugeot-308sw',
    type: 'occasion',
    marque: 'Peugeot',
    modele: '308 SW GT Line',
    annee: 2021,
    km: 42000,
    energie: 'Diesel',
    transmission: 'BVA',
    places: 5,
    options: ['Climatisation', 'GPS', 'Caméra recul', 'Régulateur adaptatif'],
    prix: 18900,
    mensualite: 289,
    image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=85&fit=crop',
    ],
    description:
      'Peugeot 308 SW GT Line de 2021 en excellent état. Break familial polyvalent avec un grand coffre, idéal pour les longs trajets en Guadeloupe. Moteur diesel 1.5 BlueHDi 130 ch BVA8 réactif et économique. Finition GT Line avec sellerie cuir/tissu, sièges chauffants, conduite assistée niveau 2. Entretien complet à jour, distribution faite récemment, contrôle technique vierge.',
    caracteristiques: {
      puissance: '130 ch',
      cylindree: '1.5 BlueHDi',
      consommation: '4.8 L/100km',
      co2: '125 g/km',
      couleur: 'Gris hurricane',
      carrosserie: 'Break',
      portes: 5,
      critAir: "Crit'Air 2",
      premiereCirculation: '03/2021',
      proprietaires: 1,
      garantie: '12 mois Car Performance',
    },
    reference: 'GP-V-308SW-001',
    disponibilite: 'disponible',
    updatedAt: '2026-04-15T00:00:00.000Z',
  },
  {
    id: 'renault-clio',
    type: 'occasion',
    marque: 'Renault',
    modele: 'Clio V Intens',
    annee: 2022,
    km: 28000,
    energie: 'Essence',
    transmission: 'BVM',
    places: 5,
    options: ['Clim auto', 'GPS', 'Bluetooth', 'Capteurs recul'],
    prix: 14500,
    mensualite: 219,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=85&fit=crop',
    ],
    description:
      'Renault Clio V Intens de 2022, citadine moderne et économique. Petit kilométrage (28 000 km), parfaite pour la ville et les trajets quotidiens en Guadeloupe. Moteur essence 1.0 TCe 100 ch sobre et silencieux. Finition Intens : écran tactile 7", aide au stationnement avant/arrière, régulateur de vitesse, jantes alliage 16". Première main, carnet d\'entretien complet.',
    caracteristiques: {
      puissance: '100 ch',
      cylindree: '1.0 TCe',
      consommation: '5.5 L/100km',
      co2: '124 g/km',
      couleur: 'Bleu iron',
      carrosserie: 'Citadine',
      portes: 5,
      critAir: "Crit'Air 1",
      premiereCirculation: '06/2022',
      proprietaires: 1,
      garantie: '12 mois Car Performance',
    },
    reference: 'GP-V-CLIO-002',
    disponibilite: 'disponible',
    updatedAt: '2026-04-20T00:00:00.000Z',
  },
  {
    id: 'citroen-c3',
    type: 'occasion',
    marque: 'Citroën',
    modele: 'C3 Shine Pack',
    annee: 2020,
    km: 55000,
    energie: 'Essence',
    transmission: 'BVM',
    places: 5,
    options: ['Clim manuelle', 'Bluetooth', 'Apple CarPlay'],
    prix: 11200,
    mensualite: 169,
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=85&fit=crop',
    ],
    description:
      'Citroën C3 Shine Pack de 2020, citadine confortable au look distinctif avec son Airbump caractéristique. Moteur PureTech 82 ch fiable et économique. Idéale pour une première voiture ou un usage urbain. Habitacle accueillant avec écran tactile 7", connectivité Apple CarPlay/Android Auto. Bon état général, entretien suivi, prête à rouler.',
    caracteristiques: {
      puissance: '82 ch',
      cylindree: '1.2 PureTech',
      consommation: '5.7 L/100km',
      co2: '129 g/km',
      couleur: 'Blanc banquise',
      carrosserie: 'Citadine',
      portes: 5,
      critAir: "Crit'Air 1",
      premiereCirculation: '09/2020',
      proprietaires: 2,
      garantie: '12 mois Car Performance',
    },
    reference: 'GP-V-C3-003',
    disponibilite: 'disponible',
    updatedAt: '2026-04-25T00:00:00.000Z',
  },
  {
    id: 'vw-golf',
    type: 'occasion',
    marque: 'Volkswagen',
    modele: 'Golf VIII Life',
    annee: 2023,
    km: 15000,
    energie: 'Diesel',
    transmission: 'BVA',
    places: 5,
    options: ['Carplay', 'Régulateur adaptatif', 'LED matrix', 'Cockpit digital'],
    prix: 24900,
    mensualite: 379,
    image: 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=85&fit=crop',
    ],
    description:
      'Volkswagen Golf VIII Life de 2023, à peine rodée (15 000 km). La référence des compactes premium : qualité de finition irréprochable, boîte DSG7 fluide, et moteur 2.0 TDI 115 ch sobre et performant. Équipée du cockpit numérique 10.25", régulateur adaptatif, phares LED Matrix. Première main, garantie constructeur encore valable. Idéale pour rouler sereinement.',
    caracteristiques: {
      puissance: '115 ch',
      cylindree: '2.0 TDI',
      consommation: '4.5 L/100km',
      co2: '118 g/km',
      couleur: 'Gris pure',
      carrosserie: 'Compacte',
      portes: 5,
      critAir: "Crit'Air 2",
      premiereCirculation: '01/2023',
      proprietaires: 1,
      garantie: '12 mois Car Performance + reste constructeur',
    },
    reference: 'GP-V-GOLF-004',
    disponibilite: 'disponible',
    updatedAt: '2026-04-30T00:00:00.000Z',
  },
  {
    id: 'toyota-yaris',
    type: 'occasion',
    marque: 'Toyota',
    modele: 'Yaris Cross',
    annee: 2022,
    km: 32000,
    energie: 'Hybride',
    transmission: 'BVA',
    places: 5,
    options: ['SUV compact', 'Hybride', 'Caméra recul', 'Capteurs'],
    prix: 16800,
    mensualite: 255,
    image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1568844293986-8d0400bd4745?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&q=85&fit=crop',
    ],
    description:
      'Toyota Yaris Cross Hybride de 2022, SUV compact au gabarit idéal pour la Guadeloupe. Motorisation full hybride 1.5 116 ch : consommation très basse (3.8 L/100km mixte), démarrage 100% électrique, zéro stress carburant. Position de conduite surélevée, espace généreux malgré le format. Fiabilité légendaire Toyota, parfaite pour les routes vallonnées.',
    caracteristiques: {
      puissance: '116 ch',
      cylindree: '1.5 Hybrid',
      consommation: '3.8 L/100km',
      co2: '88 g/km',
      couleur: 'Bronze caramel',
      carrosserie: 'SUV compact',
      portes: 5,
      critAir: "Crit'Air 1",
      premiereCirculation: '04/2022',
      proprietaires: 1,
      garantie: '12 mois Car Performance + reste hybride 8 ans',
    },
    reference: 'GP-V-YARIS-005',
    disponibilite: 'disponible',
    updatedAt: '2026-05-02T00:00:00.000Z',
  },

  // ─────────── NEUF ───────────
  {
    id: 'dacia-sandero-neuf',
    type: 'neuf',
    marque: 'Dacia',
    modele: 'Sandero Essential',
    annee: 2026,
    km: 0,
    energie: 'Essence',
    transmission: 'BVM',
    places: 5,
    options: ['Clim manuelle', 'Bluetooth', 'Radio DAB'],
    prix: 12990,
    mensualite: 199,
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=85&fit=crop',
    ],
    description:
      'Dacia Sandero Essential neuve, modèle 2026. La citadine la plus abordable du marché, parfaite pour démarrer ou comme deuxième véhicule. Moteur essence SCe 65 ch sobre et fiable. Équipement essentiel inclus : climatisation, Bluetooth, radio numérique. Garantie constructeur 3 ans / 100 000 km. Livraison sous 4-6 semaines en Guadeloupe.',
    caracteristiques: {
      puissance: '65 ch',
      cylindree: '1.0 SCe',
      consommation: '5.4 L/100km',
      co2: '121 g/km',
      couleur: 'Au choix',
      carrosserie: 'Citadine',
      portes: 5,
      critAir: "Crit'Air 1",
      premiereCirculation: 'À immatriculer',
      proprietaires: 0,
      garantie: '3 ans / 100 000 km constructeur',
    },
    reference: 'GP-N-SANDERO-001',
    disponibilite: 'disponible',
    updatedAt: '2026-05-05T00:00:00.000Z',
  },
  {
    id: 'peugeot-208-neuf',
    type: 'neuf',
    marque: 'Peugeot',
    modele: '208 Allure',
    annee: 2026,
    km: 0,
    energie: 'Essence',
    transmission: 'BVA',
    places: 5,
    options: ['i-Cockpit 3D', 'Carplay sans fil', 'Caméra recul', 'Régulateur adaptatif'],
    prix: 22500,
    mensualite: 339,
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=80&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=1200&q=85&fit=crop',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&q=85&fit=crop',
    ],
    description:
      "Peugeot 208 Allure neuve, modèle 2026. Design distinctif, finition soignée, technologies de pointe avec l'i-Cockpit 3D et la connectivité Apple CarPlay sans fil. Moteur essence PureTech 100 ch boîte EAT8 réactive. Idéal pour la ville et les escapades en Guadeloupe. Garantie constructeur 2 ans + extension possible. Livraison sous 6-8 semaines.",
    caracteristiques: {
      puissance: '100 ch',
      cylindree: '1.2 PureTech',
      consommation: '5.4 L/100km',
      co2: '122 g/km',
      couleur: 'Au choix',
      carrosserie: 'Citadine',
      portes: 5,
      critAir: "Crit'Air 1",
      premiereCirculation: 'À immatriculer',
      proprietaires: 0,
      garantie: '2 ans constructeur + extension Car Performance',
    },
    reference: 'GP-N-208-002',
    disponibilite: 'disponible',
    updatedAt: '2026-05-08T00:00:00.000Z',
  },
];

export function getVehiculeById(id: string): Vehicule | undefined {
  return VEHICULES.find((v) => v.id === id);
}

export function getAllVehiculeIds(): string[] {
  return VEHICULES.map((v) => v.id);
}

export function getVehiculesByType(type: TypeVehicule): Vehicule[] {
  return VEHICULES.filter((v) => v.type === type);
}
