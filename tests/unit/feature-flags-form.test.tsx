import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/admin/(shell)/parametres/actions', () => ({
  toggleFeatureFlags: vi.fn(),
}));

import { FeatureFlagsForm } from '@/components/admin/FeatureFlagsForm';

describe('FeatureFlagsForm', () => {
  it("rend un interrupteur par section avec l'état initial", () => {
    render(
      <FeatureFlagsForm
        initial={{
          pieces: false,
          location: true,
          venteVehicule: true,
          venteMoto: false,
          reparation: true,
        }}
      />
    );
    const pieces = screen.getByRole('checkbox', { name: /pièces/i });
    const location = screen.getByRole('checkbox', { name: /location/i });
    expect(pieces).not.toBeChecked();
    expect(location).toBeChecked();
  });
});
