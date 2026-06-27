import type { DemandeType } from '@/lib/types';

/** Mappe le sujet du formulaire contact vers un DemandeType. */
export function demandeTypeFromSujet(sujet: string): DemandeType {
  switch (sujet) {
    case 'Vente véhicule':
      return 'vehicule';
    case 'Vente moto':
      return 'moto';
    case 'Devis réparation':
      return 'reparation';
    default:
      return 'contact';
  }
}

/** TTL RGPD : 13 mois après création (unix ms). */
export function demandeExpiry(nowMs: number): number {
  const d = new Date(nowMs);
  d.setMonth(d.getMonth() + 13);
  return d.getTime();
}
