import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/admin/(shell)/parametres/actions', () => ({
  updateContactInfo: vi.fn(),
  toggleFeatureFlags: vi.fn(),
}));

import { ContactInfoForm } from '@/components/admin/ContactInfoForm';
import { DEFAULT_CONTACT_INFO } from '@/lib/contact-info';

describe('ContactInfoForm', () => {
  it('pré-remplit les champs avec les valeurs initiales', () => {
    render(<ContactInfoForm initial={{ ...DEFAULT_CONTACT_INFO, email: 'pre@rempli.gp' }} />);
    expect(screen.getByLabelText(/email/i)).toHaveValue('pre@rempli.gp');
    expect(screen.getByLabelText(/ville/i)).toHaveValue(DEFAULT_CONTACT_INFO.address.city);
  });
});
