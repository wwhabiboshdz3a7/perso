# Démos de sites pour commerces toulousains

Collection de **23 sites de démonstration** destinés aux commerces, artisans et professions libérales de Toulouse. Chaque démo est un site complet (design sur mesure, version mobile, référencement local, avis, FAQ, plan d'accès, mentions légales) construit autour d'une **fonctionnalité métier réellement fonctionnelle** dans le navigateur : réservation, devis instantané, commande en ligne, suivi de dossier…

Toutes les entreprises sont fictives ; les quartiers (Carmes, Saint-Cyprien, Minimes, Rangueil, Compans-Caffarelli, Côte Pavée, Purpan, Blagnac, Colomiers…) sont réels.

## Structure

```
index.html            Hub de présentation (grille par secteur, recherche, fonctionnalité clé)
assets/base.css       Socle commun : reset, utilitaires, menu mobile, toasts, modales, formulaires
assets/base.js        Socle commun : apparition au défilement, menu, stockage local, envoi Netlify Forms
demos/<slug>/         Une démo par secteur (page autonome avec ses styles et son script)
netlify.toml          Configuration de publication (dossier racine)
```

## Les démos

| Slug | Secteur | Quartier | Fonctionnalité clé |
|---|---|---|---|
| `restaurant` | Restaurant bistronomique | Carmes | Réservation de table (calendrier, service, couverts, créneaux calculés), filtres allergènes |
| `pizzeria` | Pizzeria / fast-food | Jean-Jaurès | Commande click & collect : panier, options, heure de retrait, codes promo |
| `coiffeur` | Salon de coiffure | Saint-Cyprien | Prise de RDV : prestation, coiffeur, agenda hebdomadaire, rappel SMS simulé |
| `barbier` | Barbier | Saint-Michel | Réservation de créneau et carte de fidélité numérique |
| `institut` | Institut de beauté / onglerie | Capitole | RDV multi-prestations et carte cadeau en ligne |
| `garage` | Garage / carrosserie | Minimes | Devis instantané, RDV atelier, suivi de réparation par numéro de dossier |
| `plombier` | Plombier / chauffagiste / électricien | Lardenne | Demande d'intervention avec délai par quartier, comparateur avant/après |
| `boulangerie` | Boulangerie-pâtisserie | Côte Pavée | Précommande avec configurateur de gâteau, horaires de fournée en direct |
| `dentiste` | Cabinet dentaire / médical | Rangueil | RDV par praticien et motif, téléconsultation, espace « préparer sa visite » |
| `salle-de-sport` | Salle de sport / yoga | Purpan | Planning hebdomadaire, réservation avec jauge, essai gratuit, abonnements |
| `immobilier` | Agence immobilière | Compans-Caffarelli | Recherche filtrée, fiches, simulateur de mensualité, estimation en 4 étapes |
| `fleuriste` | Fleuriste | Saint-Aubin | Catalogue, livraison sur créneau avec carte-message, abonnement hebdomadaire |
| `auto-ecole` | Auto-école | Blagnac | Calcul de tarif, réservation de leçons, suivi des heures, quiz code |
| `photographe` | Photographe / vidéaste | Colomiers | Portfolio plein écran et masonry, devis dynamique, calendrier de disponibilités |
| `avocat` | Cabinet d'avocats | Place Wilson | Simulateur d'honoraires, RDV découverte, articles |
| `opticien` | Opticien | Saint-Georges | Montures filtrables, simulateur de reste à charge, RDV examen de vue |
| `boutique` | Boutique de vêtements | Carmes | E-shop vitrine : variantes, panier, code promo, retrait ou livraison |
| `hotel` | Chambres d'hôtes / hôtel | Saint-Cyprien | Disponibilités, tarif par séjour, réservation de chambre |
| `tatoueur` | Salon de tatouage | Arnaud-Bernard | Flashs uniques réservables, estimation de projet |
| `veterinaire` | Clinique vétérinaire | Croix-Daurade | Carnet de santé avec rappels de vaccins, prise de RDV |
| `traiteur` | Traiteur événementiel | Saint-Simon | Devis événementiel instantané, menus de saison |
| `pressing` | Pressing / blanchisserie | Patte d'Oie | Devis par article, collecte à domicile, suivi de commande |
| `ecole-de-musique` | École de musique | Busca | Simulateur de tarif, créneau hebdomadaire, cours d'essai |

## Fonctionnement

- Sites statiques, sans dépendance ni outil de build : HTML, CSS et JavaScript natifs.
- Les données saisies (réservations, paniers, carnets, simulations) sont conservées dans le `localStorage` du navigateur.
- Les formulaires finaux utilisent **Netlify Forms** (`data-netlify="true"`, champ `form-name`, pot de miel). En local, l'envoi est simulé.
- Les photos proviennent d'Unsplash ; un repli visuel (dégradé) s'affiche si une image ne charge pas.
- Les plans d'accès utilisent une carte OpenStreetMap intégrée, avec un lien Google Maps en secours.
- Chaque page embarque des données structurées `LocalBusiness` (adresse, horaires, téléphone).

## Publier sur Netlify

1. Nouveau site → « Import from Git » → ce dépôt, branche `demos-toulouse`.
2. Dossier de publication : `/` (défini dans `netlify.toml`), aucune commande de build.
3. Activer la détection des formulaires pour recevoir les envois.

## Développement local

```
python3 -m http.server 8080
```

puis ouvrir `http://localhost:8080/`.
