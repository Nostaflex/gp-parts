import { describe, it, expect } from 'vitest';
import { generateSocialPost, fichePath, INSTAGRAM_HASHTAGS_MAX } from '@/lib/social-posts';
import type { SocialItem } from '@/lib/social-posts';
import { DEFAULT_SOCIAL_SETTINGS } from '@/lib/social-settings';
import { VEHICULES } from '@/lib/vehicules';
import { MOTOS } from '@/lib/motos';

const vehicule: SocialItem = { kind: 'vehicule', data: VEHICULES[0] };
const moto: SocialItem = { kind: 'moto', data: MOTOS[0] };

describe('social-posts', () => {
  it('fichePath pointe vers la bonne section', () => {
    expect(fichePath(vehicule)).toBe(`/vente-vehicule/${VEHICULES[0].id}`);
    expect(fichePath(moto)).toBe(`/vente-moto/${MOTOS[0].id}`);
  });

  it('instagram : hashtags + « lien dans la bio », jamais d’URL', () => {
    const post = generateSocialPost(vehicule, 'instagram', DEFAULT_SOCIAL_SETTINGS);
    expect(post.url).toBeNull();
    expect(post.caption).toContain('Lien dans la bio');
    expect(post.caption).not.toContain('https://');
    expect(post.caption).toContain('#CarPerformance');
    // Hashtags auto depuis la marque, sans espace ni caractère spécial.
    expect(post.caption).toContain(`#${VEHICULES[0].marque}`);
    expect(post.hashtagCount).toBeGreaterThan(0);
    expect(post.warnings).toEqual([]);
  });

  it('instagram : hashtags dédupliqués et alphanumériques', () => {
    const post = generateSocialPost(moto, 'instagram', {
      // #Yamaha déjà présent dans les défauts → pas de doublon avec l'auto.
      defaultHashtags: `#Yamaha #Moto971`,
      signature: '',
    });
    const tags = post.caption.split('\n').at(-1)!.split(' ');
    expect(new Set(tags).size).toBe(tags.length);
    for (const t of tags) expect(t).toMatch(/^#[a-zA-Z0-9]+$/);
  });

  it('instagram : dépassement des 30 hashtags → warning, jamais silencieux', () => {
    const many = Array.from({ length: 35 }, (_, i) => `#tag${i}`).join(' ');
    const post = generateSocialPost(vehicule, 'instagram', {
      defaultHashtags: many,
      signature: '',
    });
    expect(post.hashtagCount).toBeGreaterThan(INSTAGRAM_HASHTAGS_MAX);
    expect(post.warnings.length).toBeGreaterThan(0);
  });

  it('facebook : lien fiche présent, hashtags limités à 3', () => {
    const post = generateSocialPost(vehicule, 'facebook', DEFAULT_SOCIAL_SETTINGS);
    expect(post.url).toContain(`/vente-vehicule/${VEHICULES[0].id}`);
    expect(post.caption).toContain(post.url!);
    expect(post.hashtagCount).toBeLessThanOrEqual(3);
  });

  it('whatsapp : message court avec *gras*, prix et lien', () => {
    const post = generateSocialPost(moto, 'whatsapp', DEFAULT_SOCIAL_SETTINGS);
    expect(post.caption).toContain(`*${MOTOS[0].marque} ${MOTOS[0].modele}`);
    expect(post.caption).toContain('€');
    expect(post.caption).toContain(`/vente-moto/${MOTOS[0].id}`);
    expect(post.charCount).toBeLessThan(400);
  });

  it('mentionne NEUF pour un véhicule neuf', () => {
    const neuf = VEHICULES.find((v) => v.type === 'neuf');
    if (!neuf) return; // seed sans neuf : rien à vérifier
    const post = generateSocialPost(
      { kind: 'vehicule', data: neuf },
      'instagram',
      DEFAULT_SOCIAL_SETTINGS
    );
    expect(post.caption).toContain('NEUF');
  });
});
