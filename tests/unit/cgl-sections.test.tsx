import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

import { CglSections } from '@/app/location/cgl/CglSections';
import { DEFAULT_LOCATION_SETTINGS } from '@/lib/location-settings';
import { DEFAULT_LEGAL_INFO } from '@/lib/legal-info';

describe('CGL location — rétractation et médiation (F2, F10 du 12/10/2026)', () => {
  it("énonce l'exclusion du droit de rétractation (L221-28 12°)", () => {
    const { container } = render(
      <CglSections settings={DEFAULT_LOCATION_SETTINGS} legalInfo={DEFAULT_LEGAL_INFO} />
    );
    const t = container.textContent ?? '';
    expect(t).toContain('L221-28');
    expect(t).toMatch(/rétractation/);
  });

  it('publie le médiateur du BO avec son site (R616-1), « à fournir » sinon', () => {
    const vide = render(
      <CglSections settings={DEFAULT_LOCATION_SETTINGS} legalInfo={DEFAULT_LEGAL_INFO} />
    );
    expect(vide.container.textContent).toContain('à fournir');
    vide.unmount();

    const rempli = render(
      <CglSections
        settings={DEFAULT_LOCATION_SETTINGS}
        legalInfo={{
          ...DEFAULT_LEGAL_INFO,
          mediateurNom: 'CM2C',
          mediateurUrl: 'https://www.cm2c.net',
        }}
      />
    );
    expect(rempli.container.textContent).toContain('CM2C — https://www.cm2c.net');
  });

  it('garde les clauses existantes (caution, conducteur, carburant)', () => {
    const { container } = render(
      <CglSections settings={DEFAULT_LOCATION_SETTINGS} legalInfo={DEFAULT_LEGAL_INFO} />
    );
    const t = container.textContent ?? '';
    for (const mot of ['Caution', 'conducteur', 'carburant', 'Longue durée'])
      expect(t).toContain(mot);
  });
});
