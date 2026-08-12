import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureFlagsProvider, useFeatureFlags } from '@/components/cp/FeatureFlagsProvider';

function Probe() {
  const flags = useFeatureFlags();
  return <span>{flags.pieces ? 'pieces-on' : 'pieces-off'}</span>;
}

describe('FeatureFlagsProvider', () => {
  it('expose les flags fournis via useFeatureFlags', () => {
    render(
      <FeatureFlagsProvider
        value={{
          pieces: false,
          location: true,
          venteVehicule: true,
          venteMoto: true,
          reparation: true,
          lavage: true,
        }}
      >
        <Probe />
      </FeatureFlagsProvider>
    );
    expect(screen.getByText('pieces-off')).toBeInTheDocument();
  });

  it('défaut (hors provider) = tout visible', () => {
    render(<Probe />);
    expect(screen.getByText('pieces-on')).toBeInTheDocument();
  });
});
