import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const pathnameMock = vi.fn(() => '/');
vi.mock('next/navigation', () => ({ usePathname: () => pathnameMock() }));

import { CookieBanner } from '@/components/gdpr/CookieBanner';

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('demande le consentement sur le site public', async () => {
    pathnameMock.mockReturnValue('/');
    render(<CookieBanner />);
    expect(await screen.findByText('Ce site utilise des cookies')).toBeInTheDocument();
  });

  it("ne s'affiche pas dans le back-office", async () => {
    pathnameMock.mockReturnValue('/admin/dashboard');
    render(<CookieBanner />);
    // Laisse passer l'effet qui lit le consentement enregistré.
    await act(async () => {});
    expect(screen.queryByText('Ce site utilise des cookies')).toBeNull();
  });
});
