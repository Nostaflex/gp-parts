import type { Product } from './types';
import { productSlug } from './utils';

// GP Parts — Catalogue produits démo
// Pièces détachées auto & moto adaptées au marché guadeloupéen
// Prix en centimes d'euro. 10 produits répartis sur 6 catégories.

// Génère une date d'ajout fictive répartie sur les 3 derniers mois
// pour que le tri "Nouveautés" soit pertinent en démo.
function p(data: Omit<Product, 'slug' | 'createdAt'> & { brand: string; daysAgo?: number }): Product {
  const daysAgo = data.daysAgo ?? 30;
  const date = new Date('2026-04-01T00:00:00.000Z');
  date.setDate(date.getDate() - daysAgo);
  const { daysAgo: _drop, ...rest } = data;
  return {
    ...rest,
    slug: productSlug(data.name, data.brand),
    createdAt: date.toISOString(),
  };
}

export const PRODUCTS: Product[] = [
  p({
    id: 'prod-001',
    brand: 'Peugeot',
    name: 'Disque de frein avant',
    reference: 'PEU-208-DBF-001',
    description:
      "Disque de frein avant ventilé pour Peugeot 208 (2012-2021). Diamètre 266mm, épaisseur 22mm. Qualité origine constructeur, résistant à la chaleur tropicale et aux conditions humides de la Guadeloupe. Livré à l'unité.",
    shortDescription: 'Disque ventilé 266mm, qualité origine',
    price: 6500,
    images: ['/images/placeholder-disque.jpg'],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Peugeot', model: '208', yearFrom: 2012, yearTo: 2021 },
      { brand: 'Peugeot', model: '2008', yearFrom: 2013, yearTo: 2019 },
    ],
    stock: 12,
    isPromoted: false,
    daysAgo: 5,
  }),
  p({
    id: 'prod-002',
    brand: 'Renault',
    name: 'Plaquettes de frein avant',
    reference: 'REN-CLO4-PFA-002',
    description:
      "Jeu de 4 plaquettes de frein avant pour Renault Clio IV (2012-2019). Formulation haute performance, faible poussière, longue durée de vie. Testées en conditions tropicales.",
    shortDescription: 'Jeu de 4 plaquettes haute performance',
    price: 3200,
    priceOriginal: 3800,
    images: ['/images/placeholder-plaquettes.jpg'],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 }],
    stock: 3,
    isPromoted: true,
    daysAgo: 12,
  }),
  p({
    id: 'prod-003',
    brand: 'Yamaha',
    name: 'Chaîne de transmission',
    reference: 'YAM-MT07-CHN-003',
    description:
      "Chaîne de transmission renforcée 520x114 maillons pour Yamaha MT-07. Acier traité anti-corrosion, joints toriques pour longévité en climat tropical. Livrée avec attache rapide.",
    shortDescription: 'Chaîne 520x114, joints toriques',
    price: 8200,
    images: ['/images/placeholder-chaine.jpg'],
    category: 'transmission',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Yamaha', model: 'MT-07', yearFrom: 2014 },
      { brand: 'Yamaha', model: 'XSR700', yearFrom: 2016 },
    ],
    stock: 8,
    isPromoted: false,
    daysAgo: 2,
  }),
  p({
    id: 'prod-004',
    brand: 'Citroen',
    name: 'Kit embrayage complet',
    reference: 'CIT-C3-EMB-004',
    description:
      "Kit embrayage complet (disque, mécanisme, butée) pour Citroën C3 II essence. Qualité OEM. Remplacement recommandé tous les 150 000 km en conditions normales.",
    shortDescription: 'Disque + mécanisme + butée',
    price: 12900,
    images: ['/images/placeholder-embrayage.jpg'],
    category: 'transmission',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Citroën', model: 'C3 II', yearFrom: 2009, yearTo: 2016 }],
    stock: 5,
    isPromoted: false,
    daysAgo: 45,
  }),
  p({
    id: 'prod-005',
    brand: 'Toyota',
    name: 'Filtre à huile moteur',
    reference: 'TOY-YAR-FHU-005',
    description:
      "Filtre à huile pour Toyota Yaris III 1.0/1.3 essence. Papier filtrant micro-fibre, étanchéité renforcée, compatible huiles synthétiques. À remplacer à chaque vidange.",
    shortDescription: 'Filtre haute filtration, toutes huiles',
    price: 1800,
    images: ['/images/placeholder-filtre.jpg'],
    category: 'filtres',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Toyota', model: 'Yaris III', yearFrom: 2011, yearTo: 2020 },
      { brand: 'Toyota', model: 'Aygo II', yearFrom: 2014 },
    ],
    stock: 25,
    isPromoted: false,
    daysAgo: 60,
  }),
  p({
    id: 'prod-006',
    brand: 'Volkswagen',
    name: 'Amortisseur avant',
    reference: 'VW-GOL7-AMO-006',
    description:
      "Amortisseur avant à gaz pour Volkswagen Golf VII. Testé en conditions tropicales (routes de montagne Basse-Terre). Vendu à l'unité, remplacement par paire recommandé.",
    shortDescription: 'Amortisseur à gaz, testé tropical',
    price: 9400,
    images: ['/images/placeholder-amortisseur.jpg'],
    category: 'suspension',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Volkswagen', model: 'Golf VII', yearFrom: 2012, yearTo: 2020 }],
    stock: 7,
    isPromoted: false,
    daysAgo: 20,
  }),
  p({
    id: 'prod-007',
    brand: 'Honda',
    name: 'Ampoule LED H4',
    reference: 'HON-CB500-LED-007',
    description:
      "Ampoule LED H4 6000K ultra-lumineuse pour Honda CB500F. 30W, longue durée de vie, compatible avec le régulateur d'origine. Indispensable sur les routes non éclairées de Guadeloupe.",
    shortDescription: 'LED H4 6000K, ultra-lumineuse',
    price: 3500,
    priceOriginal: 4500,
    images: ['/images/placeholder-led.jpg'],
    category: 'eclairage',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Honda', model: 'CB500F', yearFrom: 2013 },
      { brand: 'Honda', model: 'CBR500R', yearFrom: 2013 },
    ],
    stock: 15,
    isPromoted: true,
    daysAgo: 8,
  }),
  p({
    id: 'prod-008',
    brand: 'Ford',
    name: 'Radiateur de refroidissement',
    reference: 'FOR-FIE6-RAD-008',
    description:
      "Radiateur de refroidissement aluminium pour Ford Fiesta VI. Conçu pour les fortes températures. Durite renforcée incluse.",
    shortDescription: 'Radiateur alu haute capacité',
    price: 11500,
    images: ['/images/placeholder-radiateur.jpg'],
    category: 'refroidissement',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Ford', model: 'Fiesta VI', yearFrom: 2008, yearTo: 2017 }],
    stock: 4,
    isPromoted: false,
    daysAgo: 75,
  }),
  p({
    id: 'prod-009',
    brand: 'Kawasaki',
    name: 'Filtre à air sport',
    reference: 'KAW-Z650-FAS-009',
    description:
      "Filtre à air haute performance pour Kawasaki Z650. Mousse lavable, gain de puissance, résistant à l'humidité tropicale. Entretien simple, lavable à l'eau tiède.",
    shortDescription: 'Filtre sport lavable, haute perf',
    price: 4200,
    images: ['/images/placeholder-filtre-air.jpg'],
    category: 'filtres',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Kawasaki', model: 'Z650', yearFrom: 2017 },
      { brand: 'Kawasaki', model: 'Ninja 650', yearFrom: 2017 },
    ],
    stock: 10,
    isPromoted: false,
    daysAgo: 35,
  }),
  p({
    id: 'prod-010',
    brand: 'Dacia',
    name: 'Batterie 12V 60Ah',
    reference: 'DAC-SAN-BAT-010',
    description:
      "Batterie 12V 60Ah 540A pour Dacia Sandero II. Technologie calcium, sans entretien, garantie 2 ans. Adaptée au démarrage sous climat chaud (>35°C).",
    shortDescription: 'Batterie 60Ah 540A, sans entretien',
    price: 8900,
    images: ['/images/placeholder-batterie.jpg'],
    category: 'electronique',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Dacia', model: 'Sandero II', yearFrom: 2012 },
      { brand: 'Dacia', model: 'Logan II', yearFrom: 2012 },
    ],
    stock: 0,
    isPromoted: false,
    daysAgo: 90,
  }),
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: string): Product[] {
  return PRODUCTS.filter((p) => p.category === category);
}

export function getPromotedProducts(): Product[] {
  return PRODUCTS.filter((p) => p.isPromoted);
}

export function getFeaturedProducts(limit: number = 4): Product[] {
  return PRODUCTS.filter((p) => p.stock > 0).slice(0, limit);
}
