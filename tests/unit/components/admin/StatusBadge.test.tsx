import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { StatusBadge } from '@/components/admin/StatusBadge';

describe('StatusBadge', () => {
  it('rend le contenu enfant', () => {
    render(<StatusBadge tone="success">Livrée</StatusBadge>);
    expect(screen.getByText('Livrée')).toBeInTheDocument();
  });

  it('applique la couleur du tone success', () => {
    const { container } = render(<StatusBadge tone="success">OK</StatusBadge>);
    const span = container.querySelector('span');
    expect(span?.getAttribute('style')).toContain('#248A3D');
  });

  it('applique le tone danger', () => {
    const { container } = render(<StatusBadge tone="danger">Annulée</StatusBadge>);
    const span = container.querySelector('span');
    expect(span?.getAttribute('style')).toContain('#C0271F');
  });

  it('utilise neutral par défaut', () => {
    const { container } = render(<StatusBadge>Brouillon</StatusBadge>);
    const span = container.querySelector('span');
    expect(span?.getAttribute('style')).toContain('rgba(28, 28, 30, 0.6)');
  });
});
