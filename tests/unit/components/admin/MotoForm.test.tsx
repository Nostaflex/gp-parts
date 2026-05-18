import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MOTOS } from '@/lib/motos';

// ── React 19 hooks that don't behave in jsdom/happy-dom without a server ──
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: (_action: unknown, initial: unknown) => [initial, vi.fn(), false],
  };
});

// useFormStatus is called inside SubmitButton (child of a <form>)
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,
    useFormStatus: () => ({ pending: false }),
  };
});

// next/navigation — useRouter is called in MotoForm
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Toast — useToast is called inside FormShell
const mockShowToast = vi.fn();
vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

// ImageUploader — heavy Firebase dep; stub to a simple div
vi.mock('@/components/admin/ImageUploader', () => ({
  ImageUploader: () => <div data-testid="image-uploader" />,
}));

// Server actions — not called in render tests (wired via useActionState)
vi.mock('@/app/admin/motos/actions', () => ({
  createMoto: vi.fn(),
  updateMoto: vi.fn(),
}));

// Import AFTER mocks
import { MotoForm } from '@/components/admin/MotoForm';

// ─── fixture ────────────────────────────────────────────────────────────────
const yamahaFixture = MOTOS[0]; // yamaha-mt07, Yamaha MT-07, 2022, 6900 EUR

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MotoForm — mode creation (sans initial)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShowToast.mockClear();
  });

  it('rend le bouton "Creer la moto"', () => {
    render(<MotoForm />);
    expect(screen.getByRole('button', { name: /Créer la moto/i })).toBeInTheDocument();
  });

  it('rend le label Marque', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Marque')).toBeInTheDocument();
  });

  it('rend le label Modele', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Modèle')).toBeInTheDocument();
  });

  it('rend le label Prix', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Prix (€)')).toBeInTheDocument();
  });

  it('rend le label Annee', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Année')).toBeInTheDocument();
  });

  it('rend le label Kilometrage', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Kilométrage')).toBeInTheDocument();
  });

  it('rend le select Categorie avec ses options', () => {
    render(<MotoForm />);
    const select = screen.getByLabelText('Catégorie');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Roadster' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sport' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Trail' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Scooter' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Routière' })).toBeInTheDocument();
  });

  it('rend le select Energie avec Essence et Electrique', () => {
    render(<MotoForm />);
    const select = screen.getByLabelText('Énergie');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Essence' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Électrique' })).toBeInTheDocument();
  });

  it('rend le select Permis avec les options A1 A2 A AM', () => {
    render(<MotoForm />);
    const select = screen.getByLabelText('Permis');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'A' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'AM' })).toBeInTheDocument();
  });

  it('rend le select Disponibilite avec ses options', () => {
    render(<MotoForm />);
    const select = screen.getByLabelText('Disponibilité');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Disponible' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Réservé' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Vendu' })).toBeInTheDocument();
  });

  it('rend le select Type avec Occasion et Neuf', () => {
    render(<MotoForm />);
    expect(screen.getByRole('option', { name: 'Occasion' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Neuf' })).toBeInTheDocument();
  });

  it('rend les champs Details (Puissance Cylindree Couleur etc)', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Puissance')).toBeInTheDocument();
    expect(screen.getByLabelText('Cylindrée')).toBeInTheDocument();
    expect(screen.getByLabelText('Couleur')).toBeInTheDocument();
    expect(screen.getByLabelText('Consommation')).toBeInTheDocument();
    expect(screen.getByLabelText('Poids')).toBeInTheDocument();
    expect(screen.getByLabelText('Garantie')).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de propriétaires')).toBeInTheDocument();
  });

  it('rend le textarea Description', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('rend le textarea Options', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText('Options (une par ligne)')).toBeInTheDocument();
  });

  it('rend le composant ImageUploader', () => {
    render(<MotoForm />);
    expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
  });

  it('les champs Marque et Modele sont vides en creation', () => {
    render(<MotoForm />);
    expect(screen.getByLabelText<HTMLInputElement>('Marque').value).toBe('');
    expect(screen.getByLabelText<HTMLInputElement>('Modèle').value).toBe('');
  });

  it('le select Categorie a Roadster comme valeur par defaut', () => {
    render(<MotoForm />);
    const select = screen.getByLabelText<HTMLSelectElement>('Catégorie');
    expect(select.value).toBe('Roadster');
  });

  it('le select Energie a Essence comme valeur par defaut', () => {
    render(<MotoForm />);
    const select = screen.getByLabelText<HTMLSelectElement>('Énergie');
    expect(select.value).toBe('Essence');
  });

  it('le select Disponibilite a disponible comme valeur par defaut', () => {
    render(<MotoForm />);
    const select = screen.getByLabelText<HTMLSelectElement>('Disponibilité');
    expect(select.value).toBe('disponible');
  });
});

describe('MotoForm — mode edition (avec initial = yamaha-mt07)', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockShowToast.mockClear();
  });

  it('rend le bouton Enregistrer (pas Creer la moto)', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByRole('button', { name: /Enregistrer/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Créer la moto/i })).not.toBeInTheDocument();
  });

  it('pre-remplit le champ Marque avec Yamaha', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Marque').value).toBe('Yamaha');
  });

  it('pre-remplit le champ Modele avec MT-07', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Modèle').value).toBe('MT-07');
  });

  it('pre-remplit le champ Prix avec 6900', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Prix (€)').value).toBe('6900');
  });

  it('pre-remplit le champ Kilometrage avec 12500', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Kilométrage').value).toBe('12500');
  });

  it('pre-remplit le champ Annee avec 2022', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Année').value).toBe('2022');
  });

  it('selectionne la categorie Roadster depuis la fixture', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLSelectElement>('Catégorie').value).toBe('Roadster');
  });

  it("selectionne l'energie Essence depuis la fixture", () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLSelectElement>('Énergie').value).toBe('Essence');
  });

  it('pre-remplit le textarea Options avec les options jointes par newline', () => {
    render(<MotoForm initial={yamahaFixture} />);
    const textarea = screen.getByLabelText<HTMLTextAreaElement>('Options (une par ligne)');
    expect(textarea.value).toBe('ABS\nSelle confort\nSabot moteur');
  });

  it('pre-remplit le textarea Description', () => {
    render(<MotoForm initial={yamahaFixture} />);
    const textarea = screen.getByLabelText<HTMLTextAreaElement>('Description');
    expect(textarea.value).toContain('Yamaha MT-07');
  });

  it('pre-remplit la Puissance depuis les caracteristiques', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Puissance').value).toBe('73 ch');
  });

  it('pre-remplit la Cylindree depuis les caracteristiques', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLInputElement>('Cylindrée').value).toBe('689 cm³');
  });

  it('selectionne le Permis A2 depuis les caracteristiques', () => {
    render(<MotoForm initial={yamahaFixture} />);
    expect(screen.getByLabelText<HTMLSelectElement>('Permis').value).toBe('A2');
  });

  it('contient un champ cache updatedAt avec la valeur ISO de la fixture', () => {
    const { container } = render(<MotoForm initial={yamahaFixture} />);
    const hiddenUpdatedAt = container.querySelector<HTMLInputElement>('input[name="updatedAt"]');
    expect(hiddenUpdatedAt).not.toBeNull();
    expect(hiddenUpdatedAt!.value).toBe(yamahaFixture.updatedAt);
  });
});
