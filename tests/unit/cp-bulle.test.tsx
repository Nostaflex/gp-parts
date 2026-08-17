import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CpBulle } from '@/components/cp/CpBulle';

const ROLE_SPLASH = "L'expert de l'entretien auto";
const REPLIQUE_SPLASH = "On ti splash, lave'y fè'y kléré !";

describe('CpBulle — bulle de dialogue mascotte (handoff 2026-08-17)', () => {
  it('affiche le nom, le rôle et la réplique entre guillemets français', () => {
    render(<CpBulle nom="Splash" role={ROLE_SPLASH} replique={REPLIQUE_SPLASH} />);
    expect(screen.getByText('Splash')).toBeInTheDocument();
    expect(screen.getByText(ROLE_SPLASH)).toBeInTheDocument();
    expect(screen.getByText(`« ${REPLIQUE_SPLASH} »`)).toBeInTheDocument();
  });

  it("accepte une classe additionnelle sans perdre les siennes (positionnement par l'appelant)", () => {
    const { container } = render(
      <CpBulle
        nom="Max"
        role="L'expert de la mobilité"
        replique="Deux dates, une clé."
        className="mb-6"
      />
    );
    const bulle = container.firstElementChild as HTMLElement;
    expect(bulle.className).toContain('mb-6');
    expect(bulle.className).toContain('bg-white');
  });
});
