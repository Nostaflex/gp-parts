# Spec — Funnel location v2 (façon SIXT, option A ratifiée)

**Date** : 2026-07-31 · **Branche** : `feat/location-funnel-v2` (fondée sur
`feat/location-dispo-dates`, se dédoublonne au merge de #43).
**Arbitrage complet** : `reports/2026-07-31-funnel-location-sixt.html`.

## Décisions ratifiées (Djemil, 2026-07-31)

1. **Option A** — funnel légal SANS paiement en ligne.
2. Conducteur : **≥ 21 ans, ≥ 2 ans de permis** (défauts, configurables BO).
3. Surcharge jeune conducteur : **OFF v1**, réglage BO prêt (activation + €/jour).
4. Caution **annoncée en ligne** (L112-1), **prise au comptoir** (empreinte CB).
5. Montant caution **par voiture en BO**, défaut par catégorie (réglages).
6. LLD : **devis en ligne**, charnière **30 jours**, contrat hors ligne.
7. **Heure collectée, prix au jour** ; rotation même-jour toujours exclue.

## Contraintes juridiques encodées

- Info précontractuelle (C. conso L112-1) : prix TOTAL + caution + « franchise
  selon contrat » AFFICHÉS avant l'engagement (étape récap).
- CNIL : **zéro copie de permis** — n° + date d'obtention saisis, originaux
  vérifiés visuellement au comptoir.
- RGPD : mêmes TTL (12 mois) ; nouveaux champs couverts par le consentement.
- Ancien schéma : les réservations existantes n'ont pas les nouveaux champs →
  zod **optional** en lecture, toujours écrits en création.

## Surfaces

| #   | Fichier                                              | Rôle                                                                                                                                     |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `lib/location-settings.ts`                           | Type + défauts + normalize (âge 21, permis 2 ans, surcharge OFF, cautions par catégorie 800/1000/1200/1200 €)                            |
| 2   | `lib/server/location-settings.ts`                    | Lecture `meta/locationSettings` Admin SDK, fail-open défauts + WARN                                                                      |
| 3   | `lib/reservations.ts`                                | + heures, adresse, naissance, obtention permis, caution, cgl ; helpers purs `ageAtDate`, `yearsBetween`                                  |
| 4   | `lib/schemas/reservation.ts`                         | Nouveaux champs `.optional()` (lecture tolérante)                                                                                        |
| 5   | `lib/schemas/location-car.ts` + form + actions admin | `cautionEnCents` optionnel                                                                                                               |
| 6   | `app/location/actions.ts`                            | Gates âge/ancienneté/CGL + snapshot caution + heures ; action `submitDevisLLD`                                                           |
| 7   | `app/location/page.tsx` → `LocationClient`           | Passe settings (affichage conditions + caution)                                                                                          |
| 8   | `LocationClient.tsx`                                 | Step 0 + heures ; step 1 conducteur enrichi ; step 2 = récap juridique (prix total, caution, CGL ✓, RGPD ✓) ; ≥ 30 j → bascule devis LLD |
| 9   | `app/location/cgl/page.tsx`                          | CGL location (draft à valider par avocat)                                                                                                |
| 10  | `app/admin/(shell)/parametres`                       | `LocationSettingsForm` + action                                                                                                          |
| 11  | `lib/types.ts` demandes                              | `DemandeType` + `'location'` (devis LLD → boîte Demandes BO)                                                                             |
| 12  | Emails réservation                                   | + heures + caution annoncée                                                                                                              |

## Hors scope v1 (dit explicitement)

Paiement/empreinte en ligne (option B) · application de la surcharge au prix
(stockée, affichée « non appliquée » tant que OFF) · facturation au jour entamé ·
signature électronique · upload permis (écarté CNIL) · rotation même-jour.
