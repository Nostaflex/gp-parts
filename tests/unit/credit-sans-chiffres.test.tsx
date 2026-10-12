import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';

import { VenteVehiculeClient } from '@/app/vente-vehicule/VenteVehiculeClient';
import { VenteMotoClient } from '@/app/vente-moto/VenteMotoClient';
import { LeboncoinExportClient } from '@/app/admin/(shell)/leboncoin/LeboncoinExportClient';
import { CpFinancementInfo } from '@/components/cp/CpFinancementInfo';
import { generateSocialPost } from '@/lib/social-posts';
import { DEFAULT_SOCIAL_SETTINGS } from '@/lib/social-settings';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

// Audit de conformité du 12/10/2026 (F6) : un taux ou une mensualité affichés
// sont une publicité de crédit (C. conso L312-5 à L312-8 : exemple représentatif,
// TAEG, montant total dû, mention légale, identité du prêteur) et supposent un
// statut d'intermédiaire (ORIAS). Décision Djemil : aucun chiffre de crédit sur
// le site tant qu'un partenaire financier n'est pas nommé.
const CHIFFRES_DE_CREDIT = [/TAEG/, /€\s?\/\s?mois/, /0\.0499/, /4,99\s?%/];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p;
  });
}

const SOURCES_PUBLIQUES = [
  'app/page.tsx',
  ...walk('app/vente-vehicule'),
  ...walk('app/vente-moto'),
  ...walk('components/cp'),
  'lib/social-posts.ts',
  // Texte d'annonce Leboncoin : public une fois collé.
  'app/admin/(shell)/leboncoin/LeboncoinExportClient.tsx',
].filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f));

const vehicule: Vehicule = {
  id: 'v-1',
  type: 'occasion',
  marque: 'Peugeot',
  modele: 'TestModele',
  annee: 2021,
  km: 30000,
  energie: 'Essence',
  transmission: 'Manuelle',
  places: 5,
  options: [],
  prix: 12900,
  mensualite: 199,
  image: '/x.jpg',
  images: ['/x.jpg'],
  description: '',
  caracteristiques: {},
  reference: 'GP-V-1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const moto: Moto = {
  id: 'm-1',
  type: 'occasion',
  marque: 'Yamaha',
  modele: 'TestMoto',
  annee: 2022,
  km: 12000,
  categorie: 'Roadster',
  energie: 'Essence',
  options: [],
  prix: 6900,
  mensualite: 99,
  image: '/m.jpg',
  images: ['/m.jpg'],
  description: '',
  caracteristiques: { permis: 'A2' },
  reference: 'GP-M-1',
  disponibilite: 'disponible',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

describe('aucun chiffre de crédit sur le site public (F6, 12/10/2026)', () => {
  it('les sources publiques ne contiennent ni TAEG, ni mensualité, ni taux (hors commentaires)', () => {
    for (const fichier of SOURCES_PUBLIQUES) {
      const fautives = readFileSync(fichier, 'utf8')
        .split('\n')
        .filter((ligne) => !/^\s*(\/\/|\*|\/\*|\{\/\*)/.test(ligne))
        .filter((ligne) => CHIFFRES_DE_CREDIT.some((re) => re.test(ligne)));
      expect(fautives, fichier).toEqual([]);
    }
  });

  it('catalogue véhicules : prix TTC, aucune mensualité, aucun simulateur', () => {
    const { container } = render(
      <VenteVehiculeClient vehicules={[vehicule]} whatsappHref="https://wa.me/590690684307" />
    );
    const t = container.textContent ?? '';
    expect(t).toContain('TTC');
    expect(t).not.toMatch(/€\s?\/\s?mois/);
    expect(t).not.toContain('TAEG');
    expect(t).not.toContain('Simulateur');
  });

  it('catalogue motos : prix TTC, aucune mensualité', () => {
    const { container } = render(<VenteMotoClient motos={[moto]} />);
    const t = container.textContent ?? '';
    expect(t).toContain('TTC');
    expect(t).not.toMatch(/€\s?\/\s?mois/);
    expect(t).not.toContain('TAEG');
  });

  it('annonce Leboncoin générée sans TAEG', () => {
    render(<LeboncoinExportClient vehicules={[vehicule]} motos={[]} />);
    expect(document.body.innerHTML).not.toContain('TAEG');
  });

  it('post social : le prix seul, jamais « ou X €/mois »', () => {
    for (const reseau of ['instagram', 'facebook', 'whatsapp'] as const) {
      const post = generateSocialPost(
        { kind: 'vehicule', data: vehicule },
        reseau,
        DEFAULT_SOCIAL_SETTINGS
      );
      expect(post.caption).not.toMatch(/€\s?\/\s?mois/);
      // toLocaleString('fr-FR') sépare les milliers par une espace fine insécable.
      expect(post.caption).toMatch(/12\s900\s€ TTC/);
    }
  });

  it('bloc financement : sur dossier, lien contact pré-rempli, aucun chiffre', () => {
    const { container } = render(
      <CpFinancementInfo
        sujet="Vente véhicule"
        designation="Peugeot TestModele"
        reference="GP-V-1"
      />
    );
    const t = container.textContent ?? '';
    expect(t).toContain('dossier');
    expect(t).not.toMatch(/\d\s?%/);
    const a = container.querySelector('a[href^="/contact?"]');
    expect(a?.getAttribute('href')).toContain('sujet=Vente%20v%C3%A9hicule');
    expect(a?.getAttribute('href')).toContain('ref=GP-V-1');
  });
});
