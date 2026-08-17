import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { CpUniversCard } from '@/components/cp/CpUniversCard';

const BASE = {
  href: '/lavage',
  label: 'Lavage',
  tag: '02',
  desc: 'SPLASH, expert entretien.',
  accent: '#3CC5DE',
  bg: 'linear-gradient(to top, rgba(6,39,48,0.94) 0%, rgba(14,143,166,0.3) 100%)',
};

describe('CpUniversCard — carte univers (handoff 2026-08-17, fond univers sans photo)', () => {
  it('affiche tag, label en capitales et description', () => {
    render(<CpUniversCard univers={BASE} />);
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('LAVAGE')).toBeInTheDocument();
    expect(screen.getByText('SPLASH, expert entretien.')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/lavage');
  });

  it("peint le fond avec le dégradé d'univers, sans aucune photo", () => {
    const { container } = render(<CpUniversCard univers={BASE} />);
    expect(container.querySelector('img')).toBeNull();
    const link = screen.getByRole('link');
    expect(link.getAttribute('style')).toContain('linear-gradient');
  });

  it('affiche la mascotte détourée quand fournie, et réserve la place du texte', () => {
    render(
      <CpUniversCard
        univers={{
          ...BASE,
          mascotte: { src: '/images/mascottes/splash-gant.webp', alt: 'Splash, mascotte iguane' },
        }}
      />
    );
    expect(screen.getByAltText('Splash, mascotte iguane')).toBeInTheDocument();
    expect(screen.getByText('SPLASH, expert entretien.').parentElement?.className).toContain(
      'pr-[112px]'
    );
  });

  it("n'affiche aucune mascotte par défaut", () => {
    render(<CpUniversCard univers={BASE} />);
    expect(screen.queryByAltText(/mascotte/)).toBeNull();
  });
});
