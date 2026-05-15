import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { Drawer } from '@/components/admin/Drawer';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Drawer', () => {
  it('ne rend rien quand open=false', () => {
    const { container } = render(
      <Drawer open={false} onClose={() => {}} title="Demande">
        contenu
      </Drawer>
    );
    expect(container.firstChild).toBeNull();
  });

  it('rend le titre et le contenu quand open', () => {
    render(
      <Drawer open onClose={() => {}} title="Demande #42">
        <p>corps du drawer</p>
      </Drawer>
    );
    expect(screen.getByRole('dialog', { name: 'Demande #42' })).toBeInTheDocument();
    expect(screen.getByText('corps du drawer')).toBeInTheDocument();
  });

  it('ferme directement si non-dirty (clic overlay)', () => {
    const onClose = vi.fn();
    render(
      <Drawer open onClose={onClose} title="T">
        x
      </Drawer>
    );
    fireEvent.click(screen.getByLabelText('Fermer le panneau'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dirty-check : confirm accepté → ferme', () => {
    const onClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(
      <Drawer open onClose={onClose} title="T" isDirty>
        x
      </Drawer>
    );
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(window.confirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dirty-check : confirm refusé → ne ferme PAS', () => {
    const onClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <Drawer open onClose={onClose} title="T" isDirty>
        x
      </Drawer>
    );
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(window.confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('Escape déclenche la fermeture (avec dirty-check)', () => {
    const onClose = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <Drawer open onClose={onClose} title="T" isDirty>
        x
      </Drawer>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(window.confirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
