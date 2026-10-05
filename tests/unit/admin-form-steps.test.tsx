import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock('@/app/admin/vehicules/actions', () => ({
  createVehicule: vi.fn(),
  updateVehicule: vi.fn(),
}));

import { ToastProvider } from '@/components/ui/Toast';
import { VehiculeForm } from '@/components/admin/VehiculeForm';
import { VEHICULES } from '@/lib/vehicules';

const monter = (ui: React.ReactElement) => render(<ToastProvider>{ui}</ToastProvider>);
const remplir = (label: string, valeur: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: valeur } });

describe('fiches du BO par étapes', () => {
  it('création : une étape à la fois, « Créer » seulement à la dernière', () => {
    monter(<VehiculeForm />);
    expect(screen.getByText(/Étape 1 sur 3/)).toBeInTheDocument();
    expect(screen.getByLabelText('Marque')).toBeVisible();
    // Les champs des autres étapes restent dans le formulaire, mais cachés.
    expect(screen.getByLabelText('Prix (€)')).not.toBeVisible();
    expect(screen.queryByRole('button', { name: 'Créer le véhicule' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Précédent' })).toBeNull();
  });

  it('« Suivant » refuse d’avancer tant qu’un champ obligatoire de l’étape est vide', async () => {
    monter(<VehiculeForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText(/Étape 1 sur 3/)).toBeInTheDocument();
    expect(
      await screen.findByText('Complète les champs obligatoires de cette étape.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Marque')).toHaveFocus();
  });

  it('étapes remplies : Suivant avance jusqu’aux photos, Précédent revient', () => {
    monter(<VehiculeForm />);
    remplir('Marque', 'Peugeot');
    remplir('Modèle', '3008');
    remplir('Référence', 'VO-1');
    remplir('Année', '2022');
    remplir('Transmission', 'Automatique');
    remplir('Places', '5');
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText(/Étape 2 sur 3/)).toBeInTheDocument();
    expect(screen.getByLabelText('Prix (€)')).toBeVisible();
    expect(screen.getByLabelText('Marque')).not.toBeVisible();

    remplir('Description', 'Très bon état.');
    fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
    expect(screen.getByText(/Étape 3 sur 3/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer le véhicule' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Suivant' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Précédent' }));
    expect(screen.getByText(/Étape 2 sur 3/)).toBeInTheDocument();
  });

  it('modification : on saute à l’étape voulue et « Enregistrer » est partout', () => {
    monter(<VehiculeForm initial={VEHICULES[0]} />);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Étape 3 : Photos/ }));
    expect(screen.getByText(/Étape 3 sur 3/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument();
  });
});
