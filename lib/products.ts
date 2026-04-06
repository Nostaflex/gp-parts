import type { Product } from './types';
import { productSlug } from './utils';

// GP Parts — Catalogue produits démo réaliste
// 40 pièces détachées auto & moto adaptées au parc guadeloupéen
// Prix en centimes d'euro. 8 catégories, mix auto/moto ~70/30.

// Image SVG par catégorie — illustrations vectorielles sans licence
const CATEGORY_IMAGE: Record<string, string> = {
  freinage: '/images/categories/freinage.svg',
  moteur: '/images/categories/moteur.svg',
  transmission: '/images/categories/transmission.svg',
  eclairage: '/images/categories/eclairage.svg',
  filtres: '/images/categories/filtres.svg',
  suspension: '/images/categories/suspension.svg',
  electronique: '/images/categories/electronique.svg',
  refroidissement: '/images/categories/refroidissement.svg',
};

// Génère une date d'ajout fictive répartie sur les 3 derniers mois
// pour que le tri "Nouveautés" soit pertinent en démo.
function p(
  data: Omit<Product, 'slug' | 'createdAt'> & { brand: string; daysAgo?: number }
): Product {
  const daysAgo = data.daysAgo ?? 30;
  const date = new Date('2026-04-01T00:00:00.000Z');
  date.setDate(date.getDate() - daysAgo);
  const { daysAgo: _drop, ...rest } = data;
  // Assigne l'image SVG de la catégorie si placeholder
  const images = rest.images.some((img) => img.includes('placeholder'))
    ? [CATEGORY_IMAGE[rest.category] || rest.images[0]]
    : rest.images;
  return {
    ...rest,
    images,
    slug: productSlug(data.name, data.brand),
    createdAt: date.toISOString(),
  };
}

export const PRODUCTS: Product[] = [
  // ═══════════════════════════════════════════
  // FREINAGE (6 produits)
  // ═══════════════════════════════════════════
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
      'Jeu de 4 plaquettes de frein avant pour Renault Clio IV (2012-2019). Formulation haute performance, faible poussière, longue durée de vie. Testées en conditions tropicales.',
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
    brand: 'Toyota',
    name: 'Disque de frein arrière',
    reference: 'TOY-YAR-DFA-003',
    description:
      'Disque de frein arrière plein pour Toyota Yaris III (2011-2020). Diamètre 258mm. Fonte de haute qualité, traitement anti-corrosion pour climat tropical.',
    shortDescription: 'Disque arrière 258mm, fonte traitée',
    price: 4800,
    images: ['/images/placeholder-disque-arr.jpg'],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Toyota', model: 'Yaris III', yearFrom: 2011, yearTo: 2020 }],
    stock: 8,
    isPromoted: false,
    daysAgo: 18,
  }),
  p({
    id: 'prod-004',
    brand: 'Dacia',
    name: 'Kit frein arrière à tambour',
    reference: 'DAC-SAN-KFT-004',
    description:
      'Kit frein arrière complet (mâchoires + cylindres + ressorts) pour Dacia Sandero II. Remplacement simplifié, qualité équivalente origine.',
    shortDescription: 'Kit complet tambour arrière',
    price: 5400,
    images: ['/images/placeholder-tambour.jpg'],
    category: 'freinage',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Dacia', model: 'Sandero II', yearFrom: 2012 },
      { brand: 'Dacia', model: 'Logan II', yearFrom: 2012 },
    ],
    stock: 6,
    isPromoted: false,
    daysAgo: 40,
  }),
  p({
    id: 'prod-005',
    brand: 'Yamaha',
    name: 'Plaquettes de frein avant moto',
    reference: 'YAM-MT07-PFM-005',
    description:
      'Plaquettes de frein avant semi-métalliques pour Yamaha MT-07 (2014+). Mordant progressif, résistance au fading sous chaleur intense. Jeu pour un étrier.',
    shortDescription: 'Semi-métalliques, anti-fading',
    price: 2800,
    images: ['/images/placeholder-plaquettes-moto.jpg'],
    category: 'freinage',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Yamaha', model: 'MT-07', yearFrom: 2014 },
      { brand: 'Yamaha', model: 'XSR700', yearFrom: 2016 },
    ],
    stock: 14,
    isPromoted: false,
    daysAgo: 7,
  }),
  p({
    id: 'prod-006',
    brand: 'Honda',
    name: 'Disque de frein avant moto',
    reference: 'HON-CB500-DBM-006',
    description:
      'Disque de frein avant flottant pour Honda CB500F/X (2013+). Diamètre 320mm, épaisseur 4.5mm. Acier inoxydable, excellente dissipation thermique.',
    shortDescription: 'Disque flottant 320mm, inox',
    price: 8500,
    priceOriginal: 9900,
    images: ['/images/placeholder-disque-moto.jpg'],
    category: 'freinage',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Honda', model: 'CB500F', yearFrom: 2013 },
      { brand: 'Honda', model: 'CB500X', yearFrom: 2013 },
    ],
    stock: 4,
    isPromoted: true,
    daysAgo: 3,
  }),

  // ═══════════════════════════════════════════
  // MOTEUR (5 produits)
  // ═══════════════════════════════════════════
  p({
    id: 'prod-007',
    brand: 'Renault',
    name: 'Courroie de distribution',
    reference: 'REN-CLO4-CDD-007',
    description:
      'Courroie de distribution pour Renault Clio IV 1.5 dCi. Matériau HNBR renforcé, durée de vie 120 000 km. Remplacement préventif recommandé tous les 5 ans en climat tropical.',
    shortDescription: 'HNBR renforcé, 120 000 km',
    price: 4500,
    images: ['/images/placeholder-courroie.jpg'],
    category: 'moteur',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 },
      { brand: 'Renault', model: 'Captur', yearFrom: 2013, yearTo: 2019 },
    ],
    stock: 7,
    isPromoted: false,
    daysAgo: 25,
  }),
  p({
    id: 'prod-008',
    brand: 'Peugeot',
    name: 'Pompe à eau',
    reference: 'PEU-308-PAE-008',
    description:
      'Pompe à eau pour Peugeot 308 1.6 HDi (2007-2013). Turbine en aluminium, roulement céramique étanche. Idéale pour climat chaud — résiste à des températures de liquide supérieures à 120°C.',
    shortDescription: 'Turbine alu, roulement céramique',
    price: 7200,
    images: ['/images/placeholder-pompe-eau.jpg'],
    category: 'moteur',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Peugeot', model: '308', yearFrom: 2007, yearTo: 2013 },
      { brand: 'Citroën', model: 'C4', yearFrom: 2004, yearTo: 2010 },
    ],
    stock: 3,
    isPromoted: false,
    daysAgo: 50,
  }),
  p({
    id: 'prod-009',
    brand: 'Volkswagen',
    name: 'Kit distribution complet',
    reference: 'VW-POL-KDC-009',
    description:
      'Kit distribution complet (courroie + galet tendeur + galet enrouleur + pompe à eau) pour Volkswagen Polo V 1.2 TDi. Remplacement recommandé par kit pour éviter les retours atelier.',
    shortDescription: 'Kit complet courroie + galets + pompe',
    price: 18500,
    priceOriginal: 22000,
    images: ['/images/placeholder-kit-distrib.jpg'],
    category: 'moteur',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Volkswagen', model: 'Polo V', yearFrom: 2009, yearTo: 2017 }],
    stock: 2,
    isPromoted: true,
    daysAgo: 10,
  }),
  p({
    id: 'prod-010',
    brand: 'Hyundai',
    name: 'Joint de culasse',
    reference: 'HYU-I20-JDC-010',
    description:
      'Joint de culasse multicouche acier pour Hyundai i20 1.2 essence (2008-2014). Épaisseur 0.95mm. Résiste aux pressions et températures élevées en climat tropical.',
    shortDescription: 'Multicouche acier, résistant chaleur',
    price: 5800,
    images: ['/images/placeholder-joint-culasse.jpg'],
    category: 'moteur',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Hyundai', model: 'i20', yearFrom: 2008, yearTo: 2014 }],
    stock: 5,
    isPromoted: false,
    daysAgo: 65,
  }),
  p({
    id: 'prod-011',
    brand: 'Kawasaki',
    name: 'Kit joints moteur',
    reference: 'KAW-Z650-KJM-011',
    description:
      'Kit joints moteur complet pour Kawasaki Z650 (2017+). Inclut joints de culasse, carter, couvercle de soupapes. Matériau composite haute température.',
    shortDescription: 'Kit complet joints, haute température',
    price: 9800,
    images: ['/images/placeholder-joints-moto.jpg'],
    category: 'moteur',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Kawasaki', model: 'Z650', yearFrom: 2017 },
      { brand: 'Kawasaki', model: 'Ninja 650', yearFrom: 2017 },
    ],
    stock: 3,
    isPromoted: false,
    daysAgo: 30,
  }),

  // ═══════════════════════════════════════════
  // TRANSMISSION (5 produits)
  // ═══════════════════════════════════════════
  p({
    id: 'prod-012',
    brand: 'Yamaha',
    name: 'Chaîne de transmission',
    reference: 'YAM-MT07-CHN-012',
    description:
      'Chaîne de transmission renforcée 520x114 maillons pour Yamaha MT-07. Acier traité anti-corrosion, joints toriques pour longévité en climat tropical. Livrée avec attache rapide.',
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
    id: 'prod-013',
    brand: 'Citroen',
    name: 'Kit embrayage complet',
    reference: 'CIT-C3-EMB-013',
    description:
      'Kit embrayage complet (disque, mécanisme, butée) pour Citroën C3 II essence. Qualité OEM. Remplacement recommandé tous les 150 000 km en conditions normales.',
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
    id: 'prod-014',
    brand: 'Renault',
    name: 'Cardan gauche',
    reference: 'REN-MEG3-CRG-014',
    description:
      'Cardan transmission gauche (côté boîte) pour Renault Mégane III 1.5 dCi. Joint homocinétique neuf, soufflet intégré, graisse longue durée.',
    shortDescription: 'Cardan côté boîte, joint neuf',
    price: 14500,
    images: ['/images/placeholder-cardan.jpg'],
    category: 'transmission',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Renault', model: 'Mégane III', yearFrom: 2008, yearTo: 2016 }],
    stock: 2,
    isPromoted: false,
    daysAgo: 55,
  }),
  p({
    id: 'prod-015',
    brand: 'Honda',
    name: 'Kit chaîne complet',
    reference: 'HON-CB500-KCC-015',
    description:
      'Kit chaîne complet (chaîne 520x112 + pignon 15 dents + couronne 41 dents) pour Honda CB500F/X. Acier traité, kit économique et fiable.',
    shortDescription: 'Chaîne + pignon + couronne',
    price: 11500,
    priceOriginal: 13500,
    images: ['/images/placeholder-kit-chaine.jpg'],
    category: 'transmission',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Honda', model: 'CB500F', yearFrom: 2013 },
      { brand: 'Honda', model: 'CB500X', yearFrom: 2013 },
      { brand: 'Honda', model: 'CBR500R', yearFrom: 2013 },
    ],
    stock: 6,
    isPromoted: true,
    daysAgo: 8,
  }),
  p({
    id: 'prod-016',
    brand: 'Ford',
    name: 'Soufflet de cardan',
    reference: 'FOR-FIE6-SDC-016',
    description:
      'Soufflet de cardan côté roue pour Ford Fiesta VI. Néoprène renforcé, résistant à la chaleur et aux projections de sel (environnement maritime Guadeloupe).',
    shortDescription: 'Néoprène renforcé, côté roue',
    price: 2200,
    images: ['/images/placeholder-soufflet.jpg'],
    category: 'transmission',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Ford', model: 'Fiesta VI', yearFrom: 2008, yearTo: 2017 }],
    stock: 15,
    isPromoted: false,
    daysAgo: 70,
  }),

  // ═══════════════════════════════════════════
  // ÉCLAIRAGE (5 produits)
  // ═══════════════════════════════════════════
  p({
    id: 'prod-017',
    brand: 'Honda',
    name: 'Ampoule LED H4 moto',
    reference: 'HON-CB500-LED-017',
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
    id: 'prod-018',
    brand: 'Peugeot',
    name: 'Phare avant gauche',
    reference: 'PEU-208-PAG-018',
    description:
      'Bloc optique avant gauche (conducteur) pour Peugeot 208 phase 1 (2012-2015). Halogène H7/H1, réglage électrique inclus. Qualité équivalente origine.',
    shortDescription: 'Bloc optique H7/H1, réglage élec.',
    price: 9500,
    images: ['/images/placeholder-phare.jpg'],
    category: 'eclairage',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Peugeot', model: '208', yearFrom: 2012, yearTo: 2015 }],
    stock: 2,
    isPromoted: false,
    daysAgo: 22,
  }),
  p({
    id: 'prod-019',
    brand: 'Renault',
    name: 'Feu arrière droit',
    reference: 'REN-CLO4-FAD-019',
    description:
      'Feu arrière droit (passager) pour Renault Clio IV (2012-2016). Avec porte-lampe, câblage intégré. Montage direct sans modification.',
    shortDescription: 'Feu arrière complet, montage direct',
    price: 6800,
    images: ['/images/placeholder-feu-arriere.jpg'],
    category: 'eclairage',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2016 }],
    stock: 4,
    isPromoted: false,
    daysAgo: 35,
  }),
  p({
    id: 'prod-020',
    brand: 'Toyota',
    name: 'Kit ampoules H7 longue durée',
    reference: 'TOY-YAR-KAH-020',
    description:
      "Paire d'ampoules H7 55W longue durée pour Toyota Yaris. Lumière blanche 4300K, durée de vie 3x supérieure aux ampoules standard. Homologuées route.",
    shortDescription: 'Paire H7, longue durée, homologuées',
    price: 1900,
    images: ['/images/placeholder-ampoules-h7.jpg'],
    category: 'eclairage',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Toyota', model: 'Yaris III', yearFrom: 2011, yearTo: 2020 },
      { brand: 'Toyota', model: 'Aygo II', yearFrom: 2014 },
    ],
    stock: 22,
    isPromoted: false,
    daysAgo: 15,
  }),
  p({
    id: 'prod-021',
    brand: 'Suzuki',
    name: 'Clignotants LED universels moto',
    reference: 'SUZ-GSX-CLU-021',
    description:
      "Paire de clignotants LED séquentiels universels pour motos. Homologués CE, résistants à l'eau. Montage en M10. Compatibles avec la plupart des motos japonaises.",
    shortDescription: 'LED séquentiels, homologués CE',
    price: 2400,
    images: ['/images/placeholder-clignotants.jpg'],
    category: 'eclairage',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Suzuki', model: 'GSX-S750', yearFrom: 2017 },
      { brand: 'Yamaha', model: 'MT-07', yearFrom: 2014 },
      { brand: 'Kawasaki', model: 'Z650', yearFrom: 2017 },
    ],
    stock: 20,
    isPromoted: false,
    daysAgo: 6,
  }),

  // ═══════════════════════════════════════════
  // FILTRES (5 produits)
  // ═══════════════════════════════════════════
  p({
    id: 'prod-022',
    brand: 'Toyota',
    name: 'Filtre à huile moteur',
    reference: 'TOY-YAR-FHU-022',
    description:
      'Filtre à huile pour Toyota Yaris III 1.0/1.3 essence. Papier filtrant micro-fibre, étanchéité renforcée, compatible huiles synthétiques. À remplacer à chaque vidange.',
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
    id: 'prod-023',
    brand: 'Kawasaki',
    name: 'Filtre à air sport moto',
    reference: 'KAW-Z650-FAS-023',
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
    id: 'prod-024',
    brand: 'Peugeot',
    name: 'Filtre habitacle charbon actif',
    reference: 'PEU-308-FHA-024',
    description:
      "Filtre d'habitacle à charbon actif pour Peugeot 308 (2007-2013). Filtration des pollens, poussières et odeurs. Recommandé tous les 15 000 km, surtout en zone tropicale humide.",
    shortDescription: 'Charbon actif, anti-pollens',
    price: 2200,
    images: ['/images/placeholder-filtre-habitacle.jpg'],
    category: 'filtres',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Peugeot', model: '308', yearFrom: 2007, yearTo: 2013 },
      { brand: 'Peugeot', model: '3008', yearFrom: 2009, yearTo: 2016 },
    ],
    stock: 18,
    isPromoted: false,
    daysAgo: 42,
  }),
  p({
    id: 'prod-025',
    brand: 'Renault',
    name: 'Filtre à gasoil',
    reference: 'REN-MEG3-FAG-025',
    description:
      "Filtre à gasoil avec séparateur d'eau pour Renault Mégane III 1.5 dCi. Filtration 5 microns, protège les injecteurs common rail. Remplacement tous les 30 000 km.",
    shortDescription: 'Séparateur eau, 5 microns',
    price: 2800,
    images: ['/images/placeholder-filtre-gasoil.jpg'],
    category: 'filtres',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Renault', model: 'Mégane III', yearFrom: 2008, yearTo: 2016 },
      { brand: 'Renault', model: 'Scénic III', yearFrom: 2009, yearTo: 2016 },
    ],
    stock: 12,
    isPromoted: false,
    daysAgo: 28,
  }),
  p({
    id: 'prod-026',
    brand: 'Dacia',
    name: 'Kit filtration complet vidange',
    reference: 'DAC-DUS-KFV-026',
    description:
      'Kit complet vidange pour Dacia Duster 1.5 dCi : filtre à huile + filtre à air + filtre habitacle + filtre gasoil. Économie de 20% vs achat séparé.',
    shortDescription: 'Kit 4 filtres, économie 20%',
    price: 5500,
    priceOriginal: 6900,
    images: ['/images/placeholder-kit-filtres.jpg'],
    category: 'filtres',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Dacia', model: 'Duster', yearFrom: 2010, yearTo: 2018 }],
    stock: 7,
    isPromoted: true,
    daysAgo: 4,
  }),

  // ═══════════════════════════════════════════
  // SUSPENSION (5 produits)
  // ═══════════════════════════════════════════
  p({
    id: 'prod-027',
    brand: 'Volkswagen',
    name: 'Amortisseur avant',
    reference: 'VW-GOL7-AMO-027',
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
    id: 'prod-028',
    brand: 'Peugeot',
    name: 'Ressort de suspension avant',
    reference: 'PEU-208-RSA-028',
    description:
      "Ressort hélicoïdal de suspension avant pour Peugeot 208 (2012-2021). Acier traité anti-corrosion, raideur d'origine. Vendu à l'unité.",
    shortDescription: 'Ressort hélicoïdal, raideur origine',
    price: 4200,
    images: ['/images/placeholder-ressort.jpg'],
    category: 'suspension',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Peugeot', model: '208', yearFrom: 2012, yearTo: 2021 }],
    stock: 4,
    isPromoted: false,
    daysAgo: 38,
  }),
  p({
    id: 'prod-029',
    brand: 'Renault',
    name: 'Rotule de direction',
    reference: 'REN-CLO4-ROD-029',
    description:
      'Rotule de direction avant pour Renault Clio IV. Soufflet néoprène, graissage à vie. Contrôle géométrie recommandé après remplacement.',
    shortDescription: 'Rotule avant, graissage à vie',
    price: 3100,
    images: ['/images/placeholder-rotule.jpg'],
    category: 'suspension',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 },
      { brand: 'Renault', model: 'Captur', yearFrom: 2013, yearTo: 2019 },
    ],
    stock: 10,
    isPromoted: false,
    daysAgo: 14,
  }),
  p({
    id: 'prod-030',
    brand: 'Hyundai',
    name: 'Kit bras de suspension avant',
    reference: 'HYU-TUC-KBS-030',
    description:
      'Kit bras de suspension avant complet (bras + silentblocs + rotule) pour Hyundai Tucson II (2015+). Montage côté gauche ou droit. Acier forgé.',
    shortDescription: 'Kit complet bras + silentblocs',
    price: 11200,
    images: ['/images/placeholder-bras-susp.jpg'],
    category: 'suspension',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Hyundai', model: 'Tucson II', yearFrom: 2015 }],
    stock: 3,
    isPromoted: false,
    daysAgo: 48,
  }),
  p({
    id: 'prod-031',
    brand: 'Suzuki',
    name: 'Huile de fourche moto 10W',
    reference: 'SUZ-GSX-HFM-031',
    description:
      'Huile de fourche synthétique 10W pour motos sportives. Bidon 1L. Excellente stabilité thermique en climat tropical, anticorrosion. Compatible Suzuki, Honda, Yamaha, Kawasaki.',
    shortDescription: 'Synthétique 10W, 1L, multi-marques',
    price: 1600,
    images: ['/images/placeholder-huile-fourche.jpg'],
    category: 'suspension',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Suzuki', model: 'GSX-S750', yearFrom: 2017 },
      { brand: 'Yamaha', model: 'MT-07', yearFrom: 2014 },
      { brand: 'Honda', model: 'CB500F', yearFrom: 2013 },
    ],
    stock: 30,
    isPromoted: false,
    daysAgo: 11,
  }),

  // ═══════════════════════════════════════════
  // ÉLECTRONIQUE (5 produits)
  // ═══════════════════════════════════════════
  p({
    id: 'prod-032',
    brand: 'Dacia',
    name: 'Batterie 12V 60Ah',
    reference: 'DAC-SAN-BAT-032',
    description:
      'Batterie 12V 60Ah 540A pour Dacia Sandero II. Technologie calcium, sans entretien, garantie 2 ans. Adaptée au démarrage sous climat chaud (>35°C).',
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
  p({
    id: 'prod-033',
    brand: 'Toyota',
    name: 'Alternateur reconditionné',
    reference: 'TOY-YAR-ALT-033',
    description:
      'Alternateur 90A reconditionné pour Toyota Yaris III 1.0 VVT-i. Roulements neufs, régulateur neuf, test de charge validé. Garantie 1 an.',
    shortDescription: 'Alternateur 90A, reconditionné garanti',
    price: 15500,
    images: ['/images/placeholder-alternateur.jpg'],
    category: 'electronique',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Toyota', model: 'Yaris III', yearFrom: 2011, yearTo: 2020 }],
    stock: 1,
    isPromoted: false,
    daysAgo: 58,
  }),
  p({
    id: 'prod-034',
    brand: 'Ford',
    name: 'Démarreur',
    reference: 'FOR-FIE6-DEM-034',
    description:
      'Démarreur 1.1kW pour Ford Fiesta VI 1.25 essence. Neuf, pas reconditionné. Pignon 10 dents, sens de rotation horaire. Montage direct.',
    shortDescription: 'Démarreur 1.1kW neuf, montage direct',
    price: 12800,
    images: ['/images/placeholder-demarreur.jpg'],
    category: 'electronique',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Ford', model: 'Fiesta VI', yearFrom: 2008, yearTo: 2017 }],
    stock: 2,
    isPromoted: false,
    daysAgo: 72,
  }),
  p({
    id: 'prod-035',
    brand: 'Yamaha',
    name: 'Régulateur de tension moto',
    reference: 'YAM-MT07-RDT-035',
    description:
      'Régulateur de tension / redresseur pour Yamaha MT-07 (2014+). MOSFET, dissipation thermique améliorée. Évite la surcharge batterie fréquente en climat chaud.',
    shortDescription: 'MOSFET, anti-surcharge thermique',
    price: 6200,
    images: ['/images/placeholder-regulateur.jpg'],
    category: 'electronique',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Yamaha', model: 'MT-07', yearFrom: 2014 },
      { brand: 'Yamaha', model: 'XSR700', yearFrom: 2016 },
    ],
    stock: 5,
    isPromoted: false,
    daysAgo: 16,
  }),
  p({
    id: 'prod-036',
    brand: 'Citroen',
    name: 'Capteur ABS avant',
    reference: 'CIT-C3-CAB-036',
    description:
      "Capteur ABS avant droit pour Citroën C3 II (2009-2016). Capteur magnétique, câble avec connecteur d'origine. Remplace la réf. OEM 4545.K6.",
    shortDescription: 'Capteur magnétique, connecteur OEM',
    price: 3800,
    images: ['/images/placeholder-capteur-abs.jpg'],
    category: 'electronique',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Citroën', model: 'C3 II', yearFrom: 2009, yearTo: 2016 }],
    stock: 6,
    isPromoted: false,
    daysAgo: 33,
  }),

  // ═══════════════════════════════════════════
  // REFROIDISSEMENT (4 produits)
  // ═══════════════════════════════════════════
  p({
    id: 'prod-037',
    brand: 'Ford',
    name: 'Radiateur de refroidissement',
    reference: 'FOR-FIE6-RAD-037',
    description:
      'Radiateur de refroidissement aluminium pour Ford Fiesta VI. Conçu pour les fortes températures. Durite renforcée incluse.',
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
    id: 'prod-038',
    brand: 'Renault',
    name: 'Thermostat eau',
    reference: 'REN-CLO4-THE-038',
    description:
      "Thermostat d'eau 89°C pour Renault Clio IV 0.9/1.2 TCe. Calorstat avec joint intégré. Ouverture précise pour un refroidissement optimal en climat chaud.",
    shortDescription: 'Thermostat 89°C, joint intégré',
    price: 2400,
    images: ['/images/placeholder-thermostat.jpg'],
    category: 'refroidissement',
    vehicleType: 'auto',
    compatibility: [
      { brand: 'Renault', model: 'Clio IV', yearFrom: 2012, yearTo: 2019 },
      { brand: 'Renault', model: 'Captur', yearFrom: 2013, yearTo: 2019 },
    ],
    stock: 9,
    isPromoted: false,
    daysAgo: 19,
  }),
  p({
    id: 'prod-039',
    brand: 'Volkswagen',
    name: 'Ventilateur de radiateur',
    reference: 'VW-POL-VDR-039',
    description:
      'Moto-ventilateur de radiateur pour Volkswagen Polo V. 300W, 2 vitesses. Essentiel en Guadeloupe où les embouteillages par chaleur mettent le refroidissement à rude épreuve.',
    shortDescription: 'Ventilateur 300W, 2 vitesses',
    price: 13500,
    images: ['/images/placeholder-ventilateur.jpg'],
    category: 'refroidissement',
    vehicleType: 'auto',
    compatibility: [{ brand: 'Volkswagen', model: 'Polo V', yearFrom: 2009, yearTo: 2017 }],
    stock: 1,
    isPromoted: false,
    daysAgo: 82,
  }),
  p({
    id: 'prod-040',
    brand: 'Kawasaki',
    name: 'Liquide de refroidissement moto',
    reference: 'KAW-UNI-LRM-040',
    description:
      'Liquide de refroidissement haute performance pour motos. Bidon 1L. Protection -25°C à +135°C, anticorrosion alu/cuivre. Compatible tous circuits. Idéal climat tropical.',
    shortDescription: 'Liquide -25/+135°C, 1L, multi-marques',
    price: 1400,
    images: ['/images/placeholder-liquide-refroid.jpg'],
    category: 'refroidissement',
    vehicleType: 'moto',
    compatibility: [
      { brand: 'Kawasaki', model: 'Z650', yearFrom: 2017 },
      { brand: 'Honda', model: 'CB500F', yearFrom: 2013 },
      { brand: 'Yamaha', model: 'MT-07', yearFrom: 2014 },
    ],
    stock: 35,
    isPromoted: false,
    daysAgo: 9,
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
