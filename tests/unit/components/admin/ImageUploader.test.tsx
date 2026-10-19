/**
 * ImageUploader — une case et un numéro par photo (analyse BO du 18/10, F2).
 *
 * Défaut reproduit : le numéro de case était calculé une fois pour toute la
 * sélection — plusieurs photos choisies ensemble visaient la même case et le
 * même fichier, les autres cases restaient « en chargement ». Une case en
 * erreur ne pouvait pas être retirée.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('browser-image-compression', () => ({ default: async (file: File) => file }));

const sent: FormData[] = [];

/** XHR minimal : répond 200 avec une URL propre à chaque envoi. */
class FakeXHR {
  upload: { onprogress: ((e: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  status = 0;
  responseText = '';
  open() {}
  send(fd: FormData) {
    sent.push(fd);
    const n = sent.length;
    setTimeout(() => {
      this.status = 200;
      this.responseText = JSON.stringify({ url: `https://storage.test/envoi-${n}` });
      this.onload?.();
    }, 0);
  }
}
vi.stubGlobal('XMLHttpRequest', FakeXHR);

import { ImageUploader } from '@/components/admin/ImageUploader';

function photo(name: string, type = 'image/jpeg') {
  return new File([new Uint8Array(16)], name, { type });
}

function choisir(container: HTMLElement, files: File[]) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  fireEvent.change(input, { target: { files } });
}

beforeEach(() => {
  sent.length = 0;
});

describe('ImageUploader — sélection de plusieurs photos', () => {
  it('chaque photo a sa case et son numéro ; aucune ne reste en chargement', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader folder="vehicules" entityId="vehicule-abc" value={[]} onChange={onChange} />
    );

    choisir(container, [photo('a.jpg'), photo('b.jpg')]);

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith([
        'https://storage.test/envoi-1',
        'https://storage.test/envoi-2',
      ])
    );
    expect(sent.map((fd) => fd.get('index'))).toEqual(['1', '2']);
    expect(screen.queryByText(/%$/)).toBeNull();
  });

  it('une photo refusée ne fait pas disparaître celle envoyée dans la même sélection', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader folder="vehicules" entityId="vehicule-abc" value={[]} onChange={onChange} />
    );

    choisir(container, [photo('a.jpg'), photo('b.gif', 'image/gif')]);

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(['https://storage.test/envoi-1'])
    );
    expect(screen.getByText(/b\.gif: format non supporté/)).toBeInTheDocument();
    expect(screen.getByAltText('Photo 1')).toBeInTheDocument();
  });

  it('une case en erreur se retire', async () => {
    const { container } = render(
      <ImageUploader folder="vehicules" entityId="vehicule-abc" value={[]} onChange={vi.fn()} />
    );

    choisir(container, [photo('b.gif', 'image/gif')]);
    fireEvent.click(await screen.findByRole('button', { name: /Retirer la photo 1 en erreur/ }));

    expect(screen.queryByText(/format non supporté/)).toBeNull();
  });
});
