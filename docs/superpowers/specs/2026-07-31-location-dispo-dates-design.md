# Spec — Disponibilité par dates sur /location

**Date** : 2026-07-31 · **Branche** : `feat/location-dispo-dates`

## Problème

`validateReservation` ne vérifie que `car.disponible` (toggle global).
Deux clients peuvent réserver la même voiture sur des dates qui se
chevauchent — aucun contrôle, ni serveur ni UI.

## Décisions

| Sujet                         | Décision                                                                                                                              | Pourquoi                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Statuts bloquants             | `nouvelle`, `confirmee`, `en_cours`                                                                                                   | `terminee`/`annulee` libèrent la voiture                                                |
| Chevauchement                 | Inclusif : `aDep <= bRet && bDep <= aRet` (comparaison de chaînes ISO)                                                                | Pas de rotation même-jour en v1 — prudent, simple                                       |
| Lecture des réservations      | **Admin SDK** (`lib/server/availability.ts`)                                                                                          | Rules = `read: if isAdmin()` ; le SDK client serait rejeté (leçon prod #41)             |
| Données exposées au client    | Uniquement des IDs de voitures indisponibles / plages `{dateDepart, dateRetour}`                                                      | Zéro PII sortante                                                                       |
| Requêtes Firestore            | Égalité simple + filtre chevauchement en mémoire                                                                                      | Évite les index composites ; volume minuscule                                           |
| Posture d'échec               | **Fail-open + `console.warn`** : si la lecture dispo échoue, la réservation passe (Stéphane confirme manuellement chaque réservation) | La dispo est un pré-filtre best-effort, pas un contrat ; jamais muet                    |
| Course (2 clients simultanés) | Non traitée en v1                                                                                                                     | La confirmation humaine par Stéphane est la vraie barrière ; transaction = v2 si besoin |

## Surfaces

1. `lib/reservations.ts` — `BLOCKING_STATUSES`, `rangesOverlap()` (pur, testable).
2. `lib/server/availability.ts` — `getBusyRangesForCar(carId)`,
   `getUnavailableCarIds(dateDepart, dateRetour)` via `getAdminFirestore()`.
3. `app/location/actions.ts` — garde serveur dans `validateReservation`
   (erreur `_form` : « Ce véhicule est déjà réservé sur ces dates ») +
   action `checkDispo(dateDepart, dateRetour)` pour l'UI.
4. `app/location/LocationClient.tsx` — dates choisies → `checkDispo` →
   badge « Indisponible à ces dates » + bouton Réserver désactivé.

## Tests (TDD)

- `reservation-overlap.test.ts` — cas purs : disjoint, inclus, bord commun, inversé.
- `availability-server.test.ts` — Admin SDK mocké : plages, filtre statuts, fail-open WARN.
- `reservation-action.test.ts` — rejet chevauchement + passage si dates libres.
- `location-client-dispo.test.tsx` — badge + bouton désactivé quand `checkDispo` renvoie l'ID.
