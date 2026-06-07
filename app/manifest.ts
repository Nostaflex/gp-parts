import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Car Performance — Garage auto & moto Guadeloupe',
    short_name: 'Car Performance',
    description: 'Réparation, location et vente de véhicules en Guadeloupe.',
    start_url: '/',
    display: 'standalone',
    lang: 'fr',
    background_color: '#0D0905',
    theme_color: '#0D0905',
    icons: [
      { src: '/images/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/images/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
