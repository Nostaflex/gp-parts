# GP Parts — Document Produit

**Boutique en ligne de pièces détachées auto/moto en Guadeloupe (971)**
Propriétaire : Stéphane | Développeur : Djemil | Budget : zéro | Mantra : qualité avant rapidité

---

## 1. Vision produit

Mettre à disposition des Guadeloupéens les pièces auto/moto dont ils ont besoin **localement en stock** et les faire livrer ou retirer **sous 48 heures maximum**. Pour les pièces non disponibles localement, les commandes spéciales sont traitées en **8-15 jours ouvrés**, délais annoncés honnêtement.

Objectif : devenir la référence locale pour la transparence et la vitesse, en concurrence directe avec les sites nationaux et les réseaux de franchises.

---

## 2. Cible utilisateur — Version 1

**Mix 50/50 : particulier bricoleur + garage indépendant**

- **Particulier** : propriétaires de voitures/motos cherchant les pièces pour l'entretien ou réparation DIY
- **Garage indépendant** : petits ateliers mécaniques qui achètent au détail

Même flux d'achat v1 pour les deux. Distinction B2C/B2B introduite uniquement au checkout via case « Pro » (saisie SIRET + raison sociale pour génération de facture professionnelle).

---

## 3. Modèle d'approvisionnement — Scénario B (Hybride)

### Deux états produit

1. **En stock Guadeloupe** (30-50 références héros)
   - Retrait gratuit au local de Stéphane (24h d'attente)
   - Livraison domicile (48h, frais 5€)

2. **Sur commande** (reste du catalogue)
   - Délai 8-15 jours ouvrés
   - Livraison domicile ou retrait selon disponibilité

### Identification des références héros

Les 30-50 pièces les plus demandées **ne sont pas encore identifiées** → **Chantier produit P1 bloquant**.

Critères : pièces d'usure rapide, fréquence d'achat élevée, parc auto dominant en Guadeloupe.

---

## 4. Catégories produits

- **Freinage** : plaquettes, disques, liquide de frein, câbles
- **Moteur** : air filter, oil filter, spark plugs, courroie de distribution
- **Transmission** : courroie serpentin, joints
- **Éclairage** : ampoules H7/H4, feux arrière, feux de brouillard
- **Filtres** : air, huile, habitacle, carburant
- **Suspension** : amortisseurs, ressorts, barres stabilisatrices
- **Électronique** : batteries, alternateurs, démarreurs
- **Refroidissement** : liquide de refroidissement, thermostat

### Parc automobile dominant en Guadeloupe

**Voitures** :

- Peugeot 208 / 308
- Renault Clio / Captur
- Dacia Sandero / Duster
- Toyota Yaris

**Motos** :

- Yamaha MT-07
- Honda CB500
- Kawasaki Z650

---

## 5. Proposition de valeur vs concurrence

### vs Oscaro / Mister-Auto (e-commerce national)

- **Livraison 48h** vs 8-15 jours
- **Retrait gratuit** au local
- Catalogue mis à jour en temps réel

### vs Feu Vert / Norauto Jarry (réseau physique)

- **Prix compétitifs** (pas de marge réseau abusive)
- **Commande en ligne** 24/7
- **Livraison à domicile** incluse
- Transparence totale sur le stock

### vs Garages indépendants (fournisseurs locaux)

- **Prix visibles** et comparables
- **Choix plus large** (plus de références)
- **Commande en ligne** pratique

---

## 6. Logistique — Version 1

### Retrait local

- **Gratuit**
- Au local de Stéphane (adresse à confirmer)
- Délai : 24h après confirmation de commande

### Livraison Guadeloupe continentale

- **Zones couvertes** : Basse-Terre + Grande-Terre
- **Transport** : véhicule personnel de Stéphane
- **Délai** : 48h après confirmation de commande
- **Frais** : 5€ (configurable dans `lib/config.ts`)

### Îles (Saintes, Marie-Galante, La Désirade, Petite-Terre)

- **v1** : retrait local uniquement
- Livraison inter-îles en v2

### Seuil de viabilité

Modèle durable jusqu'à **5-10 commandes/jour max**. Au-delà, externalisation logistique requise.

---

## 7. Paiement — Version 1

- **Processus** : Stripe Checkout
- **Moyen** : carte bancaire uniquement
- **Timing** : paiement immédiat (pas de paiement à la livraison en v1)
- **Sécurité** : PCI-DSS via Stripe, aucune donnée sensible stockée localement

Paiement fractionné et espèces = v2+

---

## 8. Parcours utilisateur — Version 1

```
Home → Catalogue → Fiche produit → Panier → Checkout (+ Stripe) → Email de confirmation
```

### Trois points d'entrée au catalogue

1. **Par catégorie** (grille sur la page d'accueil)
   - 8 cases avec icônes + noms
   - Mène à liste filtrée produits

2. **Par véhicule** (sélecteur intelligent)
   - Marque → Modèle → Année
   - Affiche pièces compatibles
   - UX : select dropdowns ou boutons selon mobile/desktop

3. **Par recherche texte** (barre navbar)
   - Full-text sur nom, SKU, OEM
   - Facettes : catégorie, disponibilité, prix

---

## 9. Fiche produit

### Éléments affichés

- **Nom produit** et catégorie
- **Description** claire (1-3 phrases)
- **Photos** : 1-3 images (optim pour mobile)
- **Référence OEM** (ex: FCP-45H3)
- **SKU interne**
- **Prix TTC** (TVA 8,5% en Guadeloupe)
- **État stock** : « En stock Guadeloupe » / « Sur commande »
- **Compatibilité véhicules** : liste des marques/modèles/années
- **Catégorie** et tags
- **Bouton Ajouter au panier**
- **Bouton WhatsApp** (pour questions après achat)

### Pas en v1

- Avis clients
- Photos 360°
- Variantes (couleur, taille)
- Stock réel affiché au public

---

## 10. Checkout — Version 1

### Étapes

1. **Coordonnées client** : nom, email, téléphone
2. **Mode livraison** : retrait / livraison domicile
3. **Adresse** : affichée si livraison domicile choisie
4. **Case Pro** : SIRET + raison sociale (optionnel pour facture B2B)
5. **Récapitulatif panier** : avec frais livraison
6. **Paiement Stripe** : intégré inline

### Sécurité & validation

- **Client-side** : validation HTML5 + JS (UX rapide)
- **Serveur** : Server Action `validateCheckout()` pour vérifier stock en temps réel avant paiement
- **Email** : masqué dans `sessionStorage` après paiement (pas de localStorage)
- **Session** : nettoyée après commande

### Après paiement

- Email de confirmation immédiate (contenu envoyé par Stéphane via WhatsApp ou email)
- Commande créée avec statut « Nouvelle »
- Rédirection vers page de succès avec numéro de suivi

---

## 11. Communication client — Version 1

### Canaux activés

- **WhatsApp** : bouton flottant en bas à droite (`wa.me/`) pour questions avant et après achat
- **Téléphone** : numéro de Stéphane affiché navbar + footer

### Pas en v1

- Formulaire de contact
- Chat en direct
- Email support automatisé
- Newsletter / SMS marketing

---

## 12. Back-office Stéphane

### Design système

- **Thème** : iOS Clarity (séparé du storefront)
- **Responsive** : mobile-first (Stéphane gère depuis son téléphone), adapté desktop

### KPI en dashboard

1. **Commandes du jour** (comte)
2. **Nouvelles à traiter** (alertes non lues)
3. **Alertes stock** (références < seuil)
4. **CA du mois** (cumulé TTC)

### Gestion des commandes

**6 statuts** :

- **Nouvelle** : commande créée, paiement reçu, attente traitement Stéphane
- **Confirmée** : Stéphane a vérifié stock et confirmé auprès du client
- **En préparation** : pièces préparées, emballage en cours
- **Expédiée** : pièces remises à livraison ou client, notification envoyée
- **Livrée** : confirmée par client ou Stéphane
- **Annulée** : remboursement effectué, motif saisi

### Notifications

- **WhatsApp Business Cloud API** pour alertes temps réel
- Client notifié lors de changement de statut

---

## 13. Roadmap produit

| #      | Chantier                          | Statut        | Description                                                                                  | Bloquant pour                      |
| ------ | --------------------------------- | ------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| **P1** | Sélection 30-50 références héros  | 🔴 BLOQUANT   | Identifier pièces prioritaires en stock local par catégorie, basées sur parc auto Guadeloupe | Phase 4 tech (import catalogue)    |
| **P2** | Décisions logistique finales      | ⏳ En attente | Frais livraison, zones couvertes, partenaire retrait si nécessaire                           | Phase 6 tech (checkout logistique) |
| **P3** | Compte Stripe (test + production) | ⏳ En attente | Créer compte Stripe, tester Checkout, configurer webhook confirmations                       | Phase 6 tech (paiement)            |
| **P4** | Contenu éditorial                 | ⏳ En attente | Rédiger hero section, CGV, FAQ, mentions légales                                             | Lancement                          |
| **P5** | Photos produit (30-50 héros)      | ⏳ En attente | Shooting ou sourcing images avec fonds cohérents pour les références prioritaires            | Phase 4 tech (affichage)           |

---

## 14. Périmètre exclu de la v1

- ❌ Compte client / historique commandes
- ❌ Avis et notations
- ❌ Programme fidélité / points
- ❌ Paiement fractionné (4x, etc.)
- ❌ Paiement à la livraison / espèces
- ❌ Livraison aux îles
- ❌ Intégration TecDoc / base données OEM
- ❌ Multi-langue (français uniquement)
- ❌ App mobile native (responsive web suffisant)
- ❌ Chat support en direct
- ❌ Newsletter / SMS marketing
- ❌ SEO structured data avancé
- ❌ Domaine custom (notion.site ou vercel.app temporaire)

---

## 15. Règles produit cardinales

### 1. En cas de doute, simplifier

Chaque fonctionnalité demande : « Stéphane peut-il la gérer depuis son téléphone ? » Si non, elle attend v2.

### 2. Le délai 48h est une promesse sacrée

Jamais dépasser 48h pour le retrait ou livraison en stock local. Mieux vaut dire « sur commande 10j » qu'accepter une commande qu'on ne peut pas tenir.

### 3. WhatsApp avant tout

Le bouton WhatsApp est le canal de secours pour chaque question ambiguë. Le client appelle, Stéphane répond. Point.

### 4. Mobile-first

Stéphane utilise l'app depuis son téléphone (matin, en magasin, en livraison). Chaque écran testé sur petit écran d'abord.

### 5. Pas de promesse qu'on ne peut pas tenir

Stock incertain ? Afficher « Sur commande ». Logistique floue ? Ne pas afficher la zone. Mieux vaut perdre une vente qu'avoir un client fâché.

---

## Annexe : Configuration technique clé

**Frais livraison par défaut** : `lib/config.ts` → `DELIVERY_FEE = 5` (€)

**Zones éligibles** : `lib/config.ts` → `ELIGIBLE_ZONES = ['Basse-Terre', 'Grande-Terre']`

**Stock local seuil** : au-delà de 5-10 commandes/jour, externalisation requise

**Délai confirmation** : paiement Stripe immédiat → commande « Nouvelle » → notification Stéphane WhatsApp → confirmation Stéphane + client (24-48h)

---

**Dernière mise à jour** : Avril 2026
**Propriétaire document** : Djemil (développeur)
**Approbation produit** : Stéphane (propriétaire)
