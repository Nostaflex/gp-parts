import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DispoRibbon } from '@/components/cp/DispoRibbon';
import { VenteVehiculeClient } from '../../app/vente-vehicule/VenteVehiculeClient';
import type { Vehicule } from '@/lib/vehicules';

function veh(id: string, disponibilite: Vehicule['disponibilite']): Vehicule {
  return {
    id,
    type: 'occasion',
    marque: 'Renault',
    modele: `Clio ${id}`,
    annee: 2022,
    km: 30000,
    energie: 'Essence',
    transmission: 'Manuelle',
    places: 5,
    options: ['Clim'],
    prix: 15990,
    mensualite: 199,
    image: '/images/vehicules/clio.webp',
    images: ['/images/vehicules/clio.webp'],
    description: 'Très bon état.',
    caracteristiques: { puissance: '90 ch', portes: 5, couleur: 'Gris' },
    reference: `REF-${id}`,
    disponibilite,
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as Vehicule;
}

describe('DispoRibbon', () => {
  it('vendu → ruban « Vendu » (décoratif, aria-hidden)', () => {
    const { container } = render(<DispoRibbon statut="vendu" />);
    expect(container.textContent).toContain('Vendu');
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reserve → ruban « Réservé »', () => {
    const { container } = render(<DispoRibbon statut="reserve" />);
    expect(container.textContent).toContain('Réservé');
  });
});

describe('VenteVehiculeClient — états des cartes', () => {
  const vehicules = [
    veh('v-vendu', 'vendu'),
    veh('v-dispo', 'disponible'),
    veh('v-res', 'reserve'),
  ];

  it('carte vendue : non cliquable, ruban + « A trouvé preneur » + lien contact', () => {
    render(<VenteVehiculeClient vehicules={vehicules} />);
    const article = screen.getByRole('article', { name: /vendu/i });
    expect(article.textContent).toContain('Vendu'); // ruban
    expect(article.textContent).toContain('A trouvé preneur');
    expect(article.querySelector('a[href^="/contact"]')).toBeTruthy();
    // pas de <a> vers la fiche du véhicule vendu
    expect(article.querySelector('a[href^="/vente-vehicule/"]')).toBeNull();
  });

  it('carte réservée : reste cliquable vers la fiche, ruban « Réservé »', () => {
    render(<VenteVehiculeClient vehicules={vehicules} />);
    const link = document.querySelector('a[href="/vente-vehicule/v-res"]');
    expect(link).toBeTruthy();
    expect(link!.textContent).toContain('Réservé');
    expect(link!.textContent).toContain('voir quand même');
  });

  it('tri : disponible avant réservé avant vendu', () => {
    render(<VenteVehiculeClient vehicules={vehicules} />);
    const cards = Array.from(document.querySelectorAll('a[href^="/vente-vehicule/"], article')).map(
      (el) => el.textContent ?? ''
    );
    const iDispo = cards.findIndex((t) => t.includes('Clio v-dispo'));
    const iRes = cards.findIndex((t) => t.includes('Clio v-res'));
    const iVendu = cards.findIndex((t) => t.includes('Clio v-vendu'));
    expect(iDispo).toBeLessThan(iRes);
    expect(iRes).toBeLessThan(iVendu);
  });
});
