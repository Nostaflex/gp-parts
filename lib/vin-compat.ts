// Matching pièce ⇄ véhicule décodé depuis un VIN.
//
// Le VIN est décodé via /api/vehicule/decode-vin (proxy NHTSA) qui renvoie
// marque / modèle / année. On filtre les pièces dont `compatibility[]` matche.
//
// Décision (importante) : on matche sur MARQUE (obligatoire) + ANNÉE (si connue,
// doit tomber dans [yearFrom, yearTo|∞]). Le MODÈLE n'est PAS bloquant : NHTSA
// renvoie souvent un code/libellé US ("208" ok, mais aussi des codes peu fiables
// vs nos libellés FR "Clio IV"). Bloquer sur le modèle ferait rater des pièces
// réellement compatibles. Le modèle reste utile pour le tri/affichage, pas pour
// exclure. Cf tests.

import type { Product } from '@/lib/types';

export type DecodedVehicle = {
  marque: string | null;
  modele: string | null;
  annee: number | null;
};

/** minuscule, sans accents, trim — pour comparaison robuste. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

/** Une pièce est-elle compatible avec le véhicule décodé ? */
export function isCompatibleWith(product: Product, v: DecodedVehicle): boolean {
  if (!v.marque) return false; // sans marque fiable, on ne peut rien affirmer
  const vMarque = norm(v.marque);

  return product.compatibility.some((c) => {
    const cBrand = norm(c.brand);
    // marque : tolérante dans les deux sens ("bmw" ⇄ "bmw motorrad", "vw" ⇄ "volkswagen" non géré ici)
    const brandMatch = cBrand.includes(vMarque) || vMarque.includes(cBrand);
    if (!brandMatch) return false;

    // année : si connue, doit être dans la plage de compatibilité
    if (v.annee != null) {
      if (v.annee < c.yearFrom) return false;
      if (c.yearTo != null && v.annee > c.yearTo) return false;
    }

    return true;
  });
}

/** Filtre les pièces compatibles avec le véhicule décodé. */
export function filterByVehicle(products: Product[], v: DecodedVehicle): Product[] {
  return products.filter((p) => isCompatibleWith(p, v));
}
