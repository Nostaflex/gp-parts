import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { PARSE_FR } from '@/lib/admin/form-errors';

const Schema = z.object({
  marque: z.string().min(1),
  reference: z.string().min(3).max(5),
  annee: z.number().int().min(1990).max(2027),
  energie: z.enum(['Essence', 'Diesel']),
  email: z.string().email(),
  lien: z.string().url(),
  image: z.string().regex(/^https:\/\//, 'URL ou chemin local requis'),
  images: z.array(z.string()).min(1).max(2),
});

const valide = {
  marque: 'Peugeot',
  reference: 'REF1',
  annee: 2022,
  energie: 'Diesel',
  email: 'a@b.fr',
  lien: 'https://a.fr',
  image: 'https://a.fr/x.webp',
  images: ['https://a.fr/x.webp'],
};

function erreurs(input: Record<string, unknown>) {
  const res = Schema.safeParse({ ...valide, ...input }, PARSE_FR);
  return res.success ? {} : res.error.flatten().fieldErrors;
}

describe('PARSE_FR — erreurs de formulaire BO lisibles', () => {
  it('champ texte vide ou absent → « Champ obligatoire. »', () => {
    expect(erreurs({ marque: '' }).marque).toEqual(['Champ obligatoire.']);
    expect(erreurs({ marque: undefined }).marque).toEqual(['Champ obligatoire.']);
  });

  it('aucune photo → message qui dit quoi faire', () => {
    expect(erreurs({ images: [] }).images).toEqual(['Ajoute au moins une photo.']);
  });

  it('bornes : nombres et longueurs', () => {
    expect(erreurs({ annee: 0 }).annee).toEqual(['Minimum : 1990.']);
    expect(erreurs({ annee: 2090 }).annee).toEqual(['Maximum : 2027.']);
    expect(erreurs({ reference: 'A' }).reference).toEqual(['3 caractères minimum.']);
    expect(erreurs({ reference: 'ABCDEFG' }).reference).toEqual(['5 caractères maximum.']);
    expect(erreurs({ images: ['a', 'b', 'c'] }).images).toEqual(['2 éléments maximum.']);
  });

  it('nombre illisible, choix hors liste, formats', () => {
    expect(erreurs({ annee: NaN }).annee).toEqual(['Entre un nombre.']);
    expect(erreurs({ annee: 2022.5 }).annee).toEqual(['Entre un nombre entier.']);
    expect(erreurs({ energie: 'Vapeur' }).energie).toEqual(['Choix invalide.']);
    expect(erreurs({ email: 'pas-un-email' }).email).toEqual(['Adresse email invalide.']);
    expect(erreurs({ lien: 'pas-un-lien' }).lien).toEqual([
      'Lien invalide : il doit commencer par https://',
    ]);
  });

  it('un message déjà écrit dans le schéma est conservé', () => {
    expect(erreurs({ image: 'x' }).image).toEqual(['URL ou chemin local requis']);
  });

  it('plus aucun message par défaut en anglais sur une saisie vide', () => {
    const tout = erreurs({
      marque: '',
      reference: '',
      annee: 0,
      energie: '',
      email: '',
      lien: '',
      images: [],
    });
    const messages = Object.values(tout).flat().join(' | ');
    expect(messages).not.toMatch(/Too small|Too big|Invalid|expected/);
  });
});
