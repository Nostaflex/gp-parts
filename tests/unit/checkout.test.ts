import { describe, it, expect, vi } from 'vitest';

// Mock Stripe : le chemin carte ne doit pas toucher le réseau réel en test.
vi.mock('@/lib/server/intake', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/server/intake')>()),
  createOrderIntake: vi.fn(async () => ({ id: 'mock-id', existed: false })),
}));
vi.mock('@/lib/emails/send', () => ({ sendOrderEmails: vi.fn() }));

vi.mock('@/lib/stripe', () => ({
  createOrderPaymentIntent: vi.fn(async () => ({
    clientSecret: 'pi_test_secret_xyz',
    paymentIntentId: 'pi_test_xyz',
  })),
}));

import { validateCheckout } from '../../app/(boutique)/(checkout)/commande/actions';

import type { CartItem } from '@/lib/types';

// Panier minimal valide : prod-001 existe dans le StaticAdapter (défaut en test)
const validItems: CartItem[] = [
  {
    productId: 'prod-001',
    slug: 'placeholder',
    name: 'Placeholder',
    reference: 'REF-001',
    priceInCents: 1000,
    quantity: 1,
    image: '',
  } as unknown as CartItem,
];

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
  items: validItems,
  subtotalInCents: 1000,
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

// ─── Paiement (Phase 6) ──────────────────────────────────────────────
describe('validateCheckout — paiement', () => {
  it('chemin sur place : succès avec orderNumber, sans clientSecret', async () => {
    const result = await validateCheckout({ ...validData, paymentMethod: 'on_site' });
    expect(result.success).toBe(true);
    expect(result.orderNumber).toMatch(/^GP-/);
    expect(result.clientSecret).toBeUndefined();
  });

  it('chemin carte : renvoie clientSecret et orderId', async () => {
    const result = await validateCheckout({ ...validData, paymentMethod: 'card' });
    expect(result.success).toBe(true);
    expect(result.clientSecret).toBe('pi_test_secret_xyz');
    expect(result.orderId).toBeDefined();
  });

  it('paymentMethod absent : défaut sur place (rétro-compat)', async () => {
    const result = await validateCheckout(validData);
    expect(result.success).toBe(true);
    expect(result.clientSecret).toBeUndefined();
  });

  it('rejette un paymentMethod invalide', async () => {
    const result = await validateCheckout({
      ...validData,
      paymentMethod: 'bitcoin' as never,
    });
    expect(result.success).toBe(false);
    expect(result.errors.paymentMethod).toBeDefined();
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

// ─── Idempotence (audit 2026-08-18) ──────────────────────────────────
import { createOrderIntake } from '@/lib/server/intake';
import { sendOrderEmails } from '@/lib/emails/send';

describe('validateCheckout — idempotence', () => {
  it('clé déjà vue → commande existante renvoyée, AUCUN nouvel email', async () => {
    vi.mocked(createOrderIntake).mockResolvedValueOnce({
      id: 'mock-id',
      existed: true,
      existingOrderNumber: 'GP-EXISTANTE',
    });
    vi.mocked(sendOrderEmails).mockClear();
    const result = await validateCheckout({
      ...validData,
      idempotencyKey: '3f2b8c1e-aaaa-bbbb-cccc-1234567890ab',
    });
    expect(result.success).toBe(true);
    expect(result.orderNumber).toBe('GP-EXISTANTE');
    expect(sendOrderEmails).not.toHaveBeenCalled();
  });

  it('la clé du client est transmise à l’intake (doc id = clé)', async () => {
    vi.mocked(createOrderIntake).mockClear();
    await validateCheckout({
      ...validData,
      idempotencyKey: '3f2b8c1e-aaaa-bbbb-cccc-1234567890ab',
    });
    expect(vi.mocked(createOrderIntake).mock.calls[0][1]).toBe(
      '3f2b8c1e-aaaa-bbbb-cccc-1234567890ab'
    );
  });

  it('clé malformée → ignorée (fallback add), la commande passe quand même', async () => {
    vi.mocked(createOrderIntake).mockClear();
    const result = await validateCheckout({ ...validData, idempotencyKey: '<script>' });
    expect(result.success).toBe(true);
    expect(vi.mocked(createOrderIntake).mock.calls[0][1]).toBeUndefined();
  });
});

describe('validateCheckout — stock (audit S2-3)', () => {
  it('rupture de stock → refus EXPLICITE, plus de quantité forcée à 1', async () => {
    // prod-001 du StaticAdapter a du stock ; on demande plus que disponible.
    const result = await validateCheckout({
      ...validData,
      items: [{ ...validItems[0], quantity: 9999 }],
    });
    expect(result.success).toBe(false);
    expect(result.errors._items).toMatch(/stock/i);
  });

  it('doublons consolidés : deux lignes du même produit = une seule ligne sommée', async () => {
    vi.mocked(createOrderIntake).mockClear();
    const result = await validateCheckout({
      ...validData,
      items: [
        { ...validItems[0], quantity: 1 },
        { ...validItems[0], quantity: 1 },
      ],
    });
    expect(result.success).toBe(true);
    const written = vi.mocked(createOrderIntake).mock.calls[0][0];
    expect(written.items).toHaveLength(1);
    expect(written.items[0].quantity).toBe(2);
  });

  it('course perdue (StockInsuffisantError dans la transaction) → erreur propre', async () => {
    const { StockInsuffisantError } =
      await vi.importActual<typeof import('@/lib/server/intake')>('@/lib/server/intake');
    vi.mocked(createOrderIntake).mockRejectedValueOnce(new StockInsuffisantError('prod-001', 0));
    const result = await validateCheckout({ ...validData });
    expect(result.success).toBe(false);
    expect(result.errors._items).toMatch(/stock/i);
  });
});
