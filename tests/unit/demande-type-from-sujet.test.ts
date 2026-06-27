import { describe, it, expect } from 'vitest';
import { demandeTypeFromSujet } from '@/lib/demandes';

describe('demandeTypeFromSujet', () => {
  it('mappe les sujets connus', () => {
    expect(demandeTypeFromSujet('Vente véhicule')).toBe('vehicule');
    expect(demandeTypeFromSujet('Vente moto')).toBe('moto');
    expect(demandeTypeFromSujet('Devis réparation')).toBe('reparation');
  });
  it('défaut = contact', () => {
    expect(demandeTypeFromSujet('Renseignement')).toBe('contact');
    expect(demandeTypeFromSujet('Location')).toBe('contact');
    expect(demandeTypeFromSujet('Autre')).toBe('contact');
    expect(demandeTypeFromSujet('')).toBe('contact');
  });
});
