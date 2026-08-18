'use server';

import { generateReservationReference } from '@/lib/utils';
import { getAdapter } from '@/lib/data';
import { createReservationIntake, createDemandeIntake } from '@/lib/server/intake';
import {
  getBusyRangesForCar,
  getUnavailableCarIds,
  getAllBusyRanges,
} from '@/lib/server/availability';
import { getLocationSettings } from '@/lib/server/location-settings';
import { cautionPourVoiture } from '@/lib/location-settings';
import { sendReservationEmails } from '@/lib/emails/send';
import { rangesOverlap, ageAtDate, yearsBetween, LLD_SEUIL_JOURS } from '@/lib/reservations';
import { joursBande } from '@/lib/pitlane';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { demandeExpiry } from '@/lib/demandes';
import type { Reservation } from '@/lib/reservations';

export interface ReservationValidationResult {
  success: boolean;
  errors: Record<string, string>;
  reference?: string;
}

const FIELD_LIMITS = { prenom: 50, nom: 50, email: 100, telephone: 20, permis: 40 } as const;
const TTL_MS = 365 * 24 * 60 * 60 * 1000; // 12 mois (RGPD)
const DAY_MS = 24 * 60 * 60 * 1000;

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export async function validateReservation(input: {
  locationCarId: string;
  dateDepart: string;
  dateRetour: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  permis: string;
  consent: boolean;
  website?: string;
  // Funnel v2 — nouveaux champs (optionnels pour compat ; exigés si fournis par l'UI v2)
  heureDepart?: string;
  heureRetour?: string;
  dateNaissance?: string;
  dateObtentionPermis?: string;
  adresseRue?: string;
  adresseCodePostal?: string;
  adresseVille?: string;
  cgl?: boolean;
  marketingOptIn?: boolean;
}): Promise<ReservationValidationResult> {
  const rl = await checkRateLimit('reservation');
  if (!rl.ok) return { success: false, errors: { _form: rl.message } };
  // Honeypot : un humain ne remplit jamais ce champ → succès factice, rien créé.
  if (input.website && input.website.trim() !== '') {
    return { success: true, errors: {} };
  }
  const errors: Record<string, string> = {};

  const prenom = sanitize(input.prenom);
  const nom = sanitize(input.nom);
  const email = sanitize(input.email);
  const telephone = sanitize(input.telephone);
  const permis = sanitize(input.permis);
  const locationCarId = sanitize(input.locationCarId);
  const dateDepart = sanitize(input.dateDepart);
  const dateRetour = sanitize(input.dateRetour);

  if (!prenom || prenom.length > FIELD_LIMITS.prenom) errors.prenom = 'Prénom requis';
  if (!nom || nom.length > FIELD_LIMITS.nom) errors.nom = 'Nom requis';
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || email.length > FIELD_LIMITS.email || !emailRe.test(email) || /[<>"']/.test(email)) {
    errors.email = 'Email invalide';
  }
  if (!/^[0-9+\s().-]{8,20}$/.test(telephone)) errors.telephone = 'Téléphone invalide';
  if (!permis || permis.length > FIELD_LIMITS.permis) errors.permis = 'Numéro de permis requis';

  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const depMs = Date.parse(dateDepart);
  const retMs = Date.parse(dateRetour);
  if (!dateRe.test(dateDepart) || Number.isNaN(depMs)) {
    errors.dateDepart = 'Date de départ invalide';
  } else if (depMs < Date.now() - DAY_MS) {
    errors.dateDepart = 'La date de départ est passée';
  }
  if (!dateRe.test(dateRetour) || Number.isNaN(retMs)) {
    errors.dateRetour = 'Date de retour invalide';
  } else if (!Number.isNaN(depMs) && retMs <= depMs) {
    errors.dateRetour = 'Le retour doit être après le départ';
  }

  if (input.consent !== true) errors.consent = 'Consentement requis';
  if (input.cgl !== true) errors.cgl = 'Acceptation des conditions de location requise';

  // ── Funnel v2 : conducteur (gates légales/assurance, réglages BO) ────────
  const settings = await getLocationSettings();
  const dateNaissance = sanitize(input.dateNaissance);
  const dateObtentionPermis = sanitize(input.dateObtentionPermis);
  const adresseRue = sanitize(input.adresseRue);
  const adresseCodePostal = sanitize(input.adresseCodePostal);
  const adresseVille = sanitize(input.adresseVille);
  const heureDepart = sanitize(input.heureDepart);
  const heureRetour = sanitize(input.heureRetour);
  const heureRe = /^\d{2}:\d{2}$/;

  if (!dateRe.test(dateNaissance)) {
    errors.dateNaissance = 'Date de naissance requise';
  } else if (!Number.isNaN(depMs) && ageAtDate(dateNaissance, dateDepart) < settings.ageMinimum) {
    errors.dateNaissance = `Âge minimum : ${settings.ageMinimum} ans à la date de départ`;
  }
  if (!dateRe.test(dateObtentionPermis)) {
    errors.dateObtentionPermis = 'Date d’obtention du permis requise';
  } else if (
    !Number.isNaN(depMs) &&
    yearsBetween(dateObtentionPermis, dateDepart) < settings.permisAncienneteMinAnnees
  ) {
    errors.dateObtentionPermis = `Permis requis depuis au moins ${settings.permisAncienneteMinAnnees} an(s)`;
  }
  if (!adresseRue || adresseRue.length > 120) errors.adresseRue = 'Adresse requise';
  if (!/^[0-9A-Za-z\s-]{4,10}$/.test(adresseCodePostal))
    errors.adresseCodePostal = 'Code postal requis';
  if (!adresseVille || adresseVille.length > 80) errors.adresseVille = 'Ville requise';
  if (heureDepart && !heureRe.test(heureDepart)) errors.heureDepart = 'Heure invalide';
  if (heureRetour && !heureRe.test(heureRetour)) errors.heureRetour = 'Heure invalide';

  // Charnière LLD : au-delà du seuil, la résa en ligne s'efface devant le devis.
  if (!Number.isNaN(depMs) && !Number.isNaN(retMs)) {
    const jours = Math.ceil((retMs - depMs) / DAY_MS);
    if (jours >= LLD_SEUIL_JOURS) {
      errors._form = `Au-delà de ${LLD_SEUIL_JOURS} jours, utilisez la demande de devis longue durée.`;
    }
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const adapter = await getAdapter();
  const car = await adapter.getLocationCarById(locationCarId);
  if (!car) return { success: false, errors: { _form: 'Voiture introuvable.' } };
  if (!car.disponible) return { success: false, errors: { _form: 'Voiture indisponible.' } };

  const busy = await getBusyRangesForCar(car.id);
  if (busy.some((r) => rangesOverlap(dateDepart, dateRetour, r.dateDepart, r.dateRetour))) {
    return {
      success: false,
      errors: { _form: 'Ce véhicule est déjà réservé sur ces dates. Choisissez d’autres dates.' },
    };
  }

  const nbJours = Math.max(1, Math.ceil((retMs - depMs) / DAY_MS));
  const totalEnCents = nbJours * car.prixJourEnCents;
  const cautionEnCents = cautionPourVoiture(settings, car);
  const now = new Date().toISOString();
  const reference = generateReservationReference();

  const data: Omit<Reservation, 'id'> = {
    reference,
    status: 'nouvelle',
    locationCarId: car.id,
    carLabel: `${car.marque} ${car.modele}`,
    dateDepart,
    dateRetour,
    nbJours,
    prixJourEnCents: car.prixJourEnCents,
    totalEnCents,
    customer: {
      prenom,
      nom,
      email,
      telephone,
      permis,
      dateNaissance,
      dateObtentionPermis,
      adresse: { rue: adresseRue, codePostal: adresseCodePostal, ville: adresseVille },
    },
    ...(heureDepart ? { heureDepart } : {}),
    ...(heureRetour ? { heureRetour } : {}),
    cautionEnCents,
    cglAcceptedAt: now,
    marketingOptIn: Boolean(input.marketingOptIn),
    createdAt: now,
    updatedAt: now,
    expiresAt: Date.now() + TTL_MS,
  };

  const id = await createReservationIntake(data);
  sendReservationEmails({ ...data, id });

  return { success: true, errors: {}, reference };
}

// ── Devis longue durée (≥ 30 jours) — décision ratifiée : devis en ligne,
// contrat LLD signé en agence (mentions obligatoires hors ligne). La demande
// atterrit dans la boîte Demandes du BO (type 'location').
export async function submitDevisLLD(input: {
  dureeMois: string;
  kmParMois: string;
  categorie: string;
  budgetMensuel: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  consent: boolean;
  website?: string;
  marketingOptIn?: boolean;
}): Promise<{ success: boolean; errors: Record<string, string> }> {
  const rl = await checkRateLimit('devis-lld');
  if (!rl.ok) return { success: false, errors: { _form: rl.message } };
  if (input.website && input.website.trim() !== '') return { success: true, errors: {} };

  const errors: Record<string, string> = {};
  const prenom = sanitize(input.prenom);
  const nom = sanitize(input.nom);
  const email = sanitize(input.email);
  const telephone = sanitize(input.telephone);
  const dureeMois = sanitize(input.dureeMois);
  const kmParMois = sanitize(input.kmParMois);
  const categorie = sanitize(input.categorie);
  const budgetMensuel = sanitize(input.budgetMensuel);

  if (!prenom || prenom.length > 50) errors.prenom = 'Prénom requis';
  if (!nom || nom.length > 50) errors.nom = 'Nom requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100)
    errors.email = 'Email invalide';
  if (!/^[0-9+\s().-]{8,20}$/.test(telephone)) errors.telephone = 'Téléphone invalide';
  if (!dureeMois) errors.dureeMois = 'Durée souhaitée requise';
  if (input.consent !== true) errors.consent = 'Consentement requis';
  if (Object.keys(errors).length > 0) return { success: false, errors };

  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  await createDemandeIntake({
    type: 'location',
    status: 'nouvelle',
    nom: `${prenom} ${nom}`,
    email,
    telephone,
    message:
      `[Devis LLD] Durée : ${dureeMois} mois` +
      (kmParMois ? ` · Km/mois : ${kmParMois}` : '') +
      (categorie ? ` · Catégorie : ${categorie}` : '') +
      (budgetMensuel ? ` · Budget : ${budgetMensuel} €/mois` : ''),
    marketingOptIn: Boolean(input.marketingOptIn),
    createdAt: nowIso,
    updatedAt: nowIso,
    expiresAt: demandeExpiry(nowMs),
  });
  return { success: true, errors: {} };
}

// ── Pit Lane : disponibilité par jour (bande de 6 jours, étape 2) ─────────
// Une seule lecture Firestore pour les 6 jours. Sortie sans PII : des
// comptes. Best-effort comme checkDispo — la garde finale reste serveur
// au moment de la réservation.
export type DispoJour = { jour: string; libres: number; total: number };

export async function getDispoParJour(fromDate: string): Promise<DispoJour[]> {
  const from = sanitize(fromDate);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || Number.isNaN(Date.parse(from))) return [];

  const adapter = await getAdapter();
  const cars = (await adapter.getLocationCars()).filter((c) => c.disponible);
  const busy = await getAllBusyRanges();

  return joursBande(from).map((jour) => {
    const libres = cars.filter(
      (c) =>
        !busy.some(
          (r) => r.locationCarId === c.id && rangesOverlap(jour, jour, r.dateDepart, r.dateRetour)
        )
    ).length;
    return { jour, libres, total: cars.length };
  });
}

// Pré-filtre UI : IDs des voitures indisponibles sur la plage demandée.
export async function checkDispo(
  dateDepart: string,
  dateRetour: string
): Promise<{ unavailableIds: string[] }> {
  const dateRe = /^\d{4}-\d{2}-\d{2}$/;
  const dep = sanitize(dateDepart);
  const ret = sanitize(dateRetour);
  if (!dateRe.test(dep) || !dateRe.test(ret) || ret < dep) return { unavailableIds: [] };
  return { unavailableIds: await getUnavailableCarIds(dep, ret) };
}
