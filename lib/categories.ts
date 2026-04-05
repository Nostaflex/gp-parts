import type { ProductCategory } from './types';

export interface CategoryInfo {
  id: ProductCategory;
  label: string;
  icon: string; // Nom d'icône Lucide
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'freinage', label: 'Freinage', icon: 'CircleStop' },
  { id: 'moteur', label: 'Moteur', icon: 'Cog' },
  { id: 'transmission', label: 'Transmission', icon: 'Settings2' },
  { id: 'eclairage', label: 'Éclairage', icon: 'Lightbulb' },
  { id: 'filtres', label: 'Filtres', icon: 'Filter' },
  { id: 'suspension', label: 'Suspension', icon: 'Waves' },
  { id: 'electronique', label: 'Électronique', icon: 'Cpu' },
  { id: 'refroidissement', label: 'Refroidissement', icon: 'Snowflake' },
];

export function getCategoryLabel(id: ProductCategory): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
