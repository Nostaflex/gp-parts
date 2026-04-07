import { describe, it, expect } from 'vitest';
import { validateCheckout } from '../../app/commande/actions';

// ─── Données de test valides ─────────────────────────────────────────
const validData = {
  firstName: 'Stéphane',
  lastName: 'Duval',
  email: 'stephane@example.com',
  phone: '0590 12 34 56',
  address: '12 Rue de la Liberté',
  city: 'Pointe-à-Pitre',
  postalCode: '97110',
  deliveryOption: 'island-delivery',
  acceptsCgv: true,
};

// ─── Cas nominal ─────────────────────────────────────────────────────
describe('validateCheckout — cas nominal', () => {
  it('valide un formulaire complet pour livraison en Guadeloupe', async () => {
    const result = await validateCheckout(validData);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.orderNumber).toMatch(/^GP-/);
  });

  it('valide un retrait en magasin sans adresse', async () => {
    const result = await validateCheckout({
      ...validData,
      deliveryOption: 'store-pickup',
      address: '',
      city: '',
      postalCode: '',
    });
    expect(result.success).toBe(true);
    expect(result.orderNumber).toBeDefined();
  });
});

// ─── Champs requis ───────────────────────────────────────────────────
describe('validateCheckout — champs requis', () => {
  it('rejette un prénom vide', async () => {
    const result = await validateCheckout({ ...validData, firstName: '' });
    expect(result.success).toBe(false);
    expect(result.errors.firstName).toBeDefined();
  });

  it('rejette un nom vide', async () => {
    const result = await validateCheckout({ ...validData, lastName: '' });
    expect(result.success).toBe(false);
    expect(result.errors.lastName).toBeDefined();
  });

  it('rejette un email invalide', async () => {
    const result = await validateCheckout({ ...validData, email: 'pas-un-email' });
    expect(result.success).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  it('rejette un téléphone trop court', async () => {
    const result = await validateCheckout({ ...validData, phone: '123' });
    expect(result.success).toBe(false);
    expect(result.errors.phone).toBeDefined();
  });

  it('rejette sans acceptation des CGV', async () => {
    const result = await validateCheckout({ ...validData, acceptsCgv: false });
    expect(result.success).toBe(false);
    expect(result.errors.acceptsCgv).toBeDefined();
  });
});

// ─── Validation adresse livraison ────────────────────────────────────
describe('validateCheckout — adresse livraison', () => {
  it('exige une adresse pour island-delivery', async () => {
    const result = await validateCheckout({ ...validData, address: '' });
    expect(result.success).toBe(false);
    expect(result.errors.address).toBeDefined();
  });

  it('exige une ville pour island-delivery', async () => {
    const result = await validateCheckout({ ...validData, city: '' });
    expect(result.success).toBe(false);
    expect(result.errors.city).toBeDefined();
  });

  it('exige un code postal Guadeloupe (971xx)', async () => {
    const result = await validateCheckout({ ...validData, postalCode: '75001' });
    expect(result.success).toBe(false);
    expect(result.errors.postalCode).toBeDefined();
  });

  it('accepte un code postal 971xx valide', async () => {
    const result = await validateCheckout({ ...validData, postalCode: '97100' });
    expect(result.success).toBe(true);
  });
});

// ─── Mode de livraison ───────────────────────────────────────────────
describe('validateCheckout — delivery option', () => {
  it('rejette un mode de livraison invalide', async () => {
    const result = await validateCheckout({ ...validData, deliveryOption: 'drone' });
    expect(result.success).toBe(false);
    expect(result.errors.deliveryOption).toBeDefined();
  });
});

// ─── Sanitization ────────────────────────────────────────────────────
describe('validateCheckout — sanitization', () => {
  it('trim les espaces', async () => {
    const result = await validateCheckout({
      ...validData,
      firstName: '  Stéphane  ',
      lastName: '  Duval  ',
    });
    expect(result.success).toBe(true);
  });

  it('rejette les champs dépassant la limite de caractères', async () => {
    const result = await validateCheckout({
      ...validData,
      firstName: 'A'.repeat(51),
    });
    expect(result.success).toBe(false);
    expect(result.errors.firstName).toBeDefined();
  });
});

// ─── Numéro de commande ─────────────────────────────────────────────
describe('validateCheckout — numéro de commande', () => {
  it('génère un numéro unique à chaque appel', async () => {
    const r1 = await validateCheckout(validData);
    const r2 = await validateCheckout(validData);
    expect(r1.orderNumber).not.toBe(r2.orderNumber);
  });
});
