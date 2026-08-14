import { describe, it, expect } from 'vitest';
import { DEFAULT_SOCIAL_SETTINGS, normalizeSocialSettings } from '@/lib/social-settings';

describe('social-settings', () => {
  it('normalize gère null/undefined → défauts', () => {
    expect(normalizeSocialSettings(null)).toEqual(DEFAULT_SOCIAL_SETTINGS);
    expect(normalizeSocialSettings(undefined)).toEqual(DEFAULT_SOCIAL_SETTINGS);
  });

  it('normalize merge un doc partiel sur les défauts', () => {
    expect(normalizeSocialSettings({ signature: 'CP' })).toEqual({
      defaultHashtags: DEFAULT_SOCIAL_SETTINGS.defaultHashtags,
      signature: 'CP',
    });
  });

  it('normalize ignore les types invalides et les clés inconnues', () => {
    expect(normalizeSocialSettings({ defaultHashtags: 42, foo: true } as never)).toEqual(
      DEFAULT_SOCIAL_SETTINGS
    );
  });
});
