import { slugify } from '@/lib/utils';

/**
 * Identifiants lisibles pour les fiches véhicules et motos (SEO lot 1,
 * 2026-10-11). Les formulaires du BO proposent un identifiant technique
 * (`vehicule-<base36>`, `moto-<base36>`) ; à la création, l'action serveur le
 * remplace par `marque-modele-annee`, suffixé en cas de collision. Les fiches
 * existantes gardent leur identifiant : une URL publiée ne change jamais.
 */
const GENERATED = /^(vehicule|moto|product|location)-[a-z0-9]{6,}$/;

export function isGeneratedId(id: string): boolean {
  return GENERATED.test(id);
}

export function readableId(marque: string, modele: string, annee: number): string {
  return slugify(`${marque} ${modele} ${annee}`);
}

export async function uniqueReadableId(
  base: string,
  exists: (candidate: string) => Promise<boolean>
): Promise<string> {
  if (!(await exists(base))) return base;
  for (let n = 2; n < 100; n += 1) {
    const candidate = `${base}-${n}`;
    if (!(await exists(candidate))) return candidate;
  }
  // Au-delà de 99 collisions, on garde un suffixe horodaté plutôt que de boucler.
  return `${base}-${Date.now().toString(36)}`;
}
