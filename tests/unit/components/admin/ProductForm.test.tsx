import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';

import { PRODUCTS } from '@/lib/products';

// ── React 19 hooks that don't behave in jsdom/happy-dom without a server ──
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: (_action: unknown, initial: unknown) => [initial, vi.fn(), false],
  };
});

vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    useFormStatus: () => ({ pending: false }),
  };
});

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockShowToast = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/components/admin/ImageUploader', () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

vi.mock('@/app/admin/products/actions', () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

// Import AFTER mocks
import { ProductForm } from '@/components/admin/ProductForm';

const peugeotFixture = PRODUCTS[0]; // 'Disque de frein avant', Peugeot 208, price 6500c, freinage, auto, 2 compat rows

describe('ProductForm — mode creation (sans initial)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShowToast.mockClear();
  });

  it('rend le bouton "Créer le produit"', () => {
    render(<ProductForm />);
    expect(screen.getByRole('button', { name: /Créer le produit/i })).toBeInTheDocument();
  });

  it('rend le label Nom', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
  });

  it('rend le label Référence', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Référence')).toBeInTheDocument();
  });

  it('rend le label Description', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('rend le label Description courte', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Description courte')).toBeInTheDocument();
  });

  it('rend le label Prix', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Prix (€)')).toBeInTheDocument();
  });

  it('rend le label Prix original (optionnel)', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Prix original (€)')).toBeInTheDocument();
  });

  it('rend le label Stock', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Stock')).toBeInTheDocument();
  });

  it('rend la checkbox Mis en avant', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Mis en avant')).toBeInTheDocument();
  });

  it('rend le select Catégorie avec ses 8 options', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Catégorie')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Freinage' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Moteur' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Transmission' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Éclairage' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Filtres' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Suspension' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Électronique' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Refroidissement' })).toBeInTheDocument();
  });

  it('rend le select Type de véhicule avec Auto et Moto', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText('Type de véhicule')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Auto' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Moto' })).toBeInTheDocument();
  });

  it('rend le composant ImageUploader', () => {
    render(<ProductForm />);
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
  });

  it('rend la section Compatibilité véhicule (legend)', () => {
    render(<ProductForm />);
    expect(screen.getByText('Compatibilité véhicule')).toBeInTheDocument();
  });

  it("rend une ligne compat vide par défaut (Marque/Modèle/Année placeholders)", () => {
    render(<ProductForm />);
    expect(screen.getByPlaceholderText('Marque')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Modèle')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Année début')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Année fin')).toBeInTheDocument();
  });

  it('le bouton "+ Ajouter compatibilité" est présent', () => {
    render(<ProductForm />);
    expect(screen.getByRole('button', { name: /\+ Ajouter compatibilité/i })).toBeInTheDocument();
  });

  it("ajout d'une ligne compat → 2 inputs Marque visibles", () => {
    render(<ProductForm />);
    expect(screen.getAllByPlaceholderText('Marque')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /\+ Ajouter compatibilité/i }));
    expect(screen.getAllByPlaceholderText('Marque')).toHaveLength(2);
  });

  it('le champ Nom est vide en création', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText<HTMLInputElement>('Nom').value).toBe('');
  });

  it('le select Catégorie a "freinage" comme valeur par défaut', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText<HTMLSelectElement>('Catégorie').value).toBe('freinage');
  });

  it('le select Type de véhicule a "auto" comme valeur par défaut', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText<HTMLSelectElement>('Type de véhicule').value).toBe('auto');
  });

  it('la checkbox Mis en avant est unchecked par défaut', () => {
    render(<ProductForm />);
    expect(screen.getByLabelText<HTMLInputElement>('Mis en avant').checked).toBe(false);
  });

  it("n'a PAS de champ caché clientUpdatedAt en création", () => {
    const { container } = render(<ProductForm />);
    expect(container.querySelector('input[name="clientUpdatedAt"]')).toBeNull();
  });

  it('contient un champ caché id en création (productId généré)', () => {
    const { container } = render(<ProductForm />);
    const hidden = container.querySelector<HTMLInputElement>('input[name="id"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.value).toMatch(/^product-/);
  });
});

describe('ProductForm — mode édition (avec initial = PRODUCTS[0])', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShowToast.mockClear();
  });

  it('rend le bouton "Enregistrer" (pas "Créer le produit")', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByRole('button', { name: /Enregistrer/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Créer le produit/i })).not.toBeInTheDocument();
  });

  it('pré-remplit le Nom avec "Disque de frein avant"', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Nom').value).toBe('Disque de frein avant');
  });

  it('pré-remplit la Référence avec PEU-208-DBF-001', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Référence').value).toBe('PEU-208-DBF-001');
  });

  it('pré-remplit le Prix avec 65 (centimes 6500 → €)', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Prix (€)').value).toBe('65');
  });

  it('pré-remplit le Stock avec 12', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Stock').value).toBe('12');
  });

  it('sélectionne la Catégorie freinage', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLSelectElement>('Catégorie').value).toBe('freinage');
  });

  it('sélectionne le Type de véhicule auto', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLSelectElement>('Type de véhicule').value).toBe('auto');
  });

  it('checkbox Mis en avant suit la fixture (false ici)', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Mis en avant').checked).toBe(false);
  });

  it('contient un champ caché clientUpdatedAt avec updatedAt ISO de la fixture', () => {
    const { container } = render(<ProductForm initial={peugeotFixture} />);
    const hidden = container.querySelector<HTMLInputElement>('input[name="clientUpdatedAt"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.value).toBe(peugeotFixture.updatedAt);
  });

  it('contient un champ caché id égal au slug du produit', () => {
    const { container } = render(<ProductForm initial={peugeotFixture} />);
    const hidden = container.querySelector<HTMLInputElement>('input[name="id"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.value).toBe(peugeotFixture.slug);
  });

  it('pré-remplit la Description (contient "Disque de frein")', () => {
    render(<ProductForm initial={peugeotFixture} />);
    const textarea = screen.getByLabelText<HTMLTextAreaElement>('Description');
    expect(textarea.value).toContain('Disque de frein');
  });

  it('pré-remplit la Description courte', () => {
    render(<ProductForm initial={peugeotFixture} />);
    expect(screen.getByLabelText<HTMLTextAreaElement>('Description courte').value).toBe(
      'Disque ventilé 266mm, qualité origine'
    );
  });

  it('affiche 2 lignes compat (compat_0_brand + compat_1_brand)', () => {
    const { container } = render(<ProductForm initial={peugeotFixture} />);
    const compat0 = container.querySelector<HTMLInputElement>('input[name="compat_0_brand"]');
    const compat1 = container.querySelector<HTMLInputElement>('input[name="compat_1_brand"]');
    expect(compat0?.defaultValue).toBe('Peugeot');
    expect(compat1?.defaultValue).toBe('Peugeot');
  });

  it('compat row 0 a yearFrom=2012 et yearTo=2021', () => {
    const { container } = render(<ProductForm initial={peugeotFixture} />);
    const yf = container.querySelector<HTMLInputElement>('input[name="compat_0_yearFrom"]');
    const yt = container.querySelector<HTMLInputElement>('input[name="compat_0_yearTo"]');
    expect(yf?.defaultValue).toBe('2012');
    expect(yt?.defaultValue).toBe('2021');
  });

  it("suppression d'une ligne compat retire l'input correspondant", () => {
    const { container } = render(<ProductForm initial={peugeotFixture} />);
    // 2 lignes initiales
    expect(container.querySelectorAll('input[name^="compat_"][name$="_brand"]')).toHaveLength(2);
    const removeButtons = screen.getAllByRole('button', { name: /Supprimer la ligne/i });
    fireEvent.click(removeButtons[1]);
    expect(container.querySelectorAll('input[name^="compat_"][name$="_brand"]')).toHaveLength(1);
  });

  it('pré-remplit le Prix original si fixture en a un (sinon vide)', () => {
    render(<ProductForm initial={peugeotFixture} />);
    const priceOriginal = screen.getByLabelText<HTMLInputElement>('Prix original (€)');
    // PRODUCTS[0] n'a pas de priceOriginal → vide
    expect(priceOriginal.value).toBe('');
  });
});

describe('ProductForm — édition avec produit promo (PRODUCTS[1])', () => {
  it('pré-remplit le Prix original quand fixture a priceOriginal', () => {
    const promo = PRODUCTS[1]; // Renault, priceOriginal: 3800, isPromoted: true
    render(<ProductForm initial={promo} />);
    expect(screen.getByLabelText<HTMLInputElement>('Prix original (€)').value).toBe('38');
  });

  it('checkbox Mis en avant cochée quand isPromoted=true', () => {
    const promo = PRODUCTS[1];
    render(<ProductForm initial={promo} />);
    expect(screen.getByLabelText<HTMLInputElement>('Mis en avant').checked).toBe(true);
  });
});
