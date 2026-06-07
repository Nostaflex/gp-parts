// lib/location-cars.ts
// Source de vérité du parc de location. Prix en CENTIMES (convention projet).
// Le seed reprend les voitures historiquement codées en dur dans
// app/location/LocationClient.tsx (à nettoyer avant le vrai lancement prod).

export type LocationCategorie = 'Citadine' | 'Berline' | 'SUV' | 'Utilitaire';

export type LocationCar = {
  id: string;
  marque: string;
  modele: string;
  categorie: LocationCategorie;
  places: number;
  transmission: string; // 'Auto' | 'Manuelle'
  carburant: string; // 'Essence' | 'Diesel' | 'Hybride'
  prixJourEnCents: number;
  prixSemaineEnCents: number;
  disponible: boolean; // dispo globale (le calendrier viendra en sous-projet C)
  image: string;
  reference: string;
  updatedAt: string; // ISO — optimistic lock + tri admin
};

export const LOCATION_CARS: LocationCar[] = [
  {
    id: 'clio-v',
    marque: 'Renault',
    modele: 'Clio V',
    categorie: 'Citadine',
    places: 5,
    transmission: 'Auto',
    carburant: 'Essence',
    prixJourEnCents: 4500,
    prixSemaineEnCents: 27000,
    disponible: true,
    image: '/images/location/clio-v.jpg',
    reference: 'LOC-CLIO-V',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'peugeot-308sw',
    marque: 'Peugeot',
    modele: '308 SW',
    categorie: 'Berline',
    places: 5,
    transmission: 'Auto',
    carburant: 'Diesel',
    prixJourEnCents: 6500,
    prixSemaineEnCents: 39000,
    disponible: true,
    image: '/images/location/peugeot-308sw.jpg',
    reference: 'LOC-308SW',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'citroen-c5',
    marque: 'Citroën',
    modele: 'C5 Aircross',
    categorie: 'SUV',
    places: 5,
    transmission: 'Auto',
    carburant: 'Hybride',
    prixJourEnCents: 8000,
    prixSemaineEnCents: 48000,
    disponible: true,
    image: '/images/location/citroen-c5.jpg',
    reference: 'LOC-C5',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'toyota-yaris',
    marque: 'Toyota',
    modele: 'Yaris Hybride',
    categorie: 'Citadine',
    places: 5,
    transmission: 'Auto',
    carburant: 'Hybride',
    prixJourEnCents: 5200,
    prixSemaineEnCents: 31200,
    disponible: true,
    image: '/images/location/toyota-yaris.jpg',
    reference: 'LOC-YARIS',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'vw-golf',
    marque: 'Volkswagen',
    modele: 'Golf VIII',
    categorie: 'Berline',
    places: 5,
    transmission: 'Auto',
    carburant: 'Essence',
    prixJourEnCents: 7200,
    prixSemaineEnCents: 43200,
    disponible: true,
    image: '/images/location/vw-golf.jpg',
    reference: 'LOC-GOLF',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
  {
    id: 'renault-trafic',
    marque: 'Renault',
    modele: 'Trafic',
    categorie: 'Utilitaire',
    places: 9,
    transmission: 'Manuelle',
    carburant: 'Diesel',
    prixJourEnCents: 9500,
    prixSemaineEnCents: 57000,
    disponible: false,
    image: '/images/location/renault-trafic.jpg',
    reference: 'LOC-TRAFIC',
    updatedAt: '2026-06-02T00:00:00.000Z',
  },
];
