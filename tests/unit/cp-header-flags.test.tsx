import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

import { CpHeader } from '@/components/cp/CpHeader';
import { FeatureFlagsProvider } from '@/components/cp/FeatureFlagsProvider';
import { CartProvider } from '@/components/cart/CartProvider';
import type { FeatureFlags } from '@/lib/feature-flags';

function renderHeader(flags: FeatureFlags) {
  return render(
    <CartProvider>
      <FeatureFlagsProvider value={flags}>
        <CpHeader />
      </FeatureFlagsProvider>
    </CartProvider>
  );
}

describe('CpHeader — filtrage par flags', () => {
  it('section OFF → lien absent, y compris vente-véhicule', () => {
    renderHeader({
      pieces: false,
      location: false,
      venteVehicule: false,
      venteMoto: false,
      reparation: false,
    });
    expect(screen.queryByRole('link', { name: 'Pièces' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Location' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Vente moto' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Réparation' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Vente véhicule' })).toBeNull();
  });

  it('section ON → lien présent', () => {
    renderHeader({
      pieces: true,
      location: true,
      venteVehicule: true,
      venteMoto: true,
      reparation: true,
    });
    expect(screen.getAllByRole('link', { name: 'Pièces' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Vente véhicule' }).length).toBeGreaterThan(0);
  });
});
