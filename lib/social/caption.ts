import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';

function isMoto(item: Vehicule | Moto): item is Moto {
  return 'categorie' in item;
}

/**
 * Caption prête à publier (éditable ensuite par l'admin). Réutilise l'esprit
 * du générateur Leboncoin : titre + specs clés + accroche + hashtags 971.
 */
export function buildCaption(item: Vehicule | Moto): string {
  const prix = item.prix.toLocaleString('fr-FR');
  const lines: string[] = [];
  lines.push(`🚗 ${item.marque} ${item.modele} ${item.annee} — ${prix} €`);
  lines.push('');
  lines.push(`• ${item.km.toLocaleString('fr-FR')} km`);
  if (isMoto(item)) {
    lines.push(`• Catégorie : ${item.categorie}`);
    if (item.caracteristiques.permis) lines.push(`• Permis : ${item.caracteristiques.permis}`);
  } else {
    lines.push(`• ${item.energie} · ${item.transmission}`);
  }
  lines.push(`• Financement possible · Garantie incluse`);
  lines.push('');
  lines.push('📍 Car Performance — Guadeloupe (971). DM ou appel pour un essai.');
  lines.push('');
  const type = item.type === 'neuf' ? '#Neuf' : '#Occasion';
  const engin = isMoto(item) ? '#Moto' : '#Voiture';
  lines.push(
    `#Guadeloupe #971 #CarPerformance ${engin} ${type} ` +
      `#${item.marque.replace(/\s+/g, '')} #APVendre`
  );
  return lines.join('\n');
}
