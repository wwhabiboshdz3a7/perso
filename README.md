# Levier : la formation « Gagner de l'argent avec Claude »

Produit numérique prêt à vendre, en français : une formation complète pour maîtriser Claude (l'assistant d'Anthropic), produire des livrables vendables, **automatiser la production vidéo** et vendre des prestations IA en France, en règle. Le projet comprend la page de vente, l'espace membre, l'accès payant réel par fonctions Netlify, les pages légales, et un guide de lancement pour le propriétaire ([VENTE.md](VENTE.md)).

> Formation indépendante, non affiliée à Anthropic. Claude est une marque d'Anthropic.

## Le nom

Trois noms ont été étudiés ; aucun ne doit laisser croire à un produit officiel (pas de « Claude » dans le nom, l'usage du mot reste descriptif dans le sous-titre) :

| Nom | Pour | Contre |
|---|---|---|
| **Levier** (retenu) | Court, mémorable, dit exactement la promesse (l'IA comme effet de levier), se décline en identité visuelle (le levier et son pivot) | Mot courant : se protège par l'association nom + logo |
| Atelier Prompt & Profit | Explicite | Long, sonne « argent facile », risqué au regard des règles publicitaires |
| Cap IA | Simple | Générique, déjà très utilisé |

## Fonctionnalités

**Page de vente** (`public/index.html`)
- Promesse, constat, méthode, pour qui / pas pour qui, programme détaillé module par module (généré depuis le catalogue), focus sur la chaîne vidéo, contenus fournis, formateur, offres, garantie, FAQ, appel à l'action.
- Offres Essentiel / Pro / VIP, prix et liens de paiement (Stripe Payment Links, Lemon Squeezy, Gumroad) dans `config.js`. Sans lien, le bouton ouvre une **liste d'attente** (Netlify Forms).
- **Aimant à prospects** : module gratuit + mini-guide « 7 services IA à proposer ce mois-ci » contre un email (Netlify Forms, consentement explicite, piège à robots), puis page `/merci/` avec le guide complet.
- Mention d'indépendance bien visible, avertissement sur les revenus, **aucun faux témoignage, compte à rebours ou stock** : la section témoignages est vide par défaut, donc masquée.
- Identité forte (papier, encre, cobalt, citron ; Bricolage Grotesque, Instrument Serif, JetBrains Mono, servies localement), responsive jusqu'à 390 px, accessible (contrastes AA, clavier, focus visible, libellés), `prefers-reduced-motion` respecté, aucune dépendance externe.

**Espace membre** (`public/cours/`, moteur dérivé de la plateforme Lumio)
- Tableau de bord, modules, leçons (théorie, pas-à-pas, exercice corrigé selon des critères, QCM ou checklist, quiz expliqué, encart « Script vidéo »), progression, XP et badges, certificats imprimables, recherche, thème clair/sombre, export et import de la progression.
- Bonus : bibliothèque de **112 prompts métiers** cherchable et filtrable, 12 modèles (proposition, contrat avec clause IA, CGV, autorisation image et voix, sous-traitance RGPD, emails…), 8 checklists.
- 6 **workflows n8n** téléchargeables (qualification de prospects, réponses aux avis Google, devis automatiques, chatbot de site, veille, chaîne vidéo), générés et validés contre les définitions officielles des nœuds.
- Page « Scripts vidéo » regroupant les scripts de toutes les leçons accessibles, pour le tournage.

**Contenu** : 9 modules, 61 leçons (M0 et M1 gratuits) ; voir le programme sur la page de vente. Les informations sur les modèles et l'API Claude, les outils vidéo, les seuils fiscaux et le droit (AI Act, loi SREN, loi sur l'influence commerciale, facture électronique) ont été vérifiées en novembre 2026, et chaque leçon renvoie aux sources officielles.

**Accès payant réel**
- Les modules payants (M2 à M8, bonus, workflows) ne sont **pas** dans le dossier publié : ils vivent dans `prive/` et ne sont servis que par la fonction `content`, qui les embarque via `included_files`.
- `netlify/functions/access.mjs` vérifie un **code d'accès** (hachage SHA-256 dans `ACCESS_CODE_HASHES` ou `prive/codes-acces.txt`), une **licence Gumroad**, une **licence Lemon Squeezy** ou une **session Stripe** (lien de paiement), puis renvoie un jeton signé HMAC (`TOKEN_SECRET`). Limitation des essais par IP.
- `netlify/functions/content.mjs` renvoie un module ou un fichier si le jeton est valide et si l'offre le permet (Essentiel < Pro < VIP).

## Structure

```
public/                    dossier publié (aucun contenu payant)
  index.html               page de vente
  config.js                LE fichier à personnaliser
  cours/                   espace membre (app/ : moteur ; content/ : catalogue + modules gratuits M0 et M1)
  merci/                   remerciement + mini-guide, liste d'attente, activation après achat
  legal/                   mentions légales, CGV, confidentialité (remplies depuis config.js)
  assets/                  css, js, polices (licence OFL), image de partage
  vendor/codemirror/       coloration syntaxique (licence MIT)
prive/                     contenu payant (jamais publié)
  modules/                 m2.mjs … m8.mjs, bonus.mjs
  n8n/                     01 à 06 : workflows à importer
netlify/functions/         access.mjs, content.mjs
netlify/lib/               jetons HMAC, vérificateurs de licences, lecture du contenu privé
outils/                    serveur local, générateurs (codes, programme, workflows n8n), vérification du contenu
tests/                     tests unitaires des fonctions, tests du contenu, tests de bout en bout (Playwright)
VENTE.md                   guide de lancement pour le propriétaire
```

## Démarrer en local

Prérequis : Node.js 20 ou plus récent. Aucune dépendance à installer pour le site et les fonctions.

```bash
# 1. Un secret et un code d'accès de test
export TOKEN_SECRET=$(openssl rand -hex 32)
node outils/generer-codes.mjs pro 1          # affiche un code et la valeur ACCESS_CODE_HASHES
export ACCESS_CODE_HASHES="pro:…"            # la valeur affichée

# 2. Le serveur local : sert public/, émule /.netlify/functions/* et Netlify Forms
node outils/serveur-local.mjs --port 9540     # http://localhost:9540
```

Les variables peuvent aussi être placées dans un fichier `.env` à la racine (ignoré par Git). Les soumissions de formulaires reçues en local sont visibles sur `/__formulaires`.

## Tests

```bash
npm test          # fonctions (appels simulés à Gumroad, Lemon Squeezy, Stripe) + contenu
npm run verifier  # contrôle du contenu : leçons, exercices, bonus, workflows, dossier publié
npm run e2e       # Playwright, ordinateur 1440 px et mobile 390 px
```

Les tests de bout en bout démarrent le serveur local et vérifient : page de vente, liste d'attente, aimant à prospects jusqu'au mini-guide, module gratuit (exercice, quiz, validation automatique), progression et certificat, refus d'un code invalide, offre Essentiel puis Pro, contenu payant introuvable dans le dossier publié (404) et refusé sans jeton (401), téléchargement d'un workflow n8n, bonus, recherche, activation après achat, pages légales, absence de défilement horizontal et **zéro erreur dans la console**. Playwright doit être disponible (`require('playwright')`).

## Déployer sur Netlify

1. Nouveau site → « Import from Git » → ce dépôt, branche `masterclass-ia`. Aucune commande de build.
2. Le fichier `netlify.toml` fixe le dossier publié (`public`, et non la racine : c'est ce qui garde le contenu payant hors ligne), le dossier des fonctions et `included_files = ["prive/**"]`, ainsi que les en-têtes de sécurité (CSP stricte, `noindex` sur l'espace membre).
3. **Variables d'environnement** (Site configuration → Environment variables) :

| Variable | Rôle |
|---|---|
| `TOKEN_SECRET` | Obligatoire. 32 caractères minimum (`openssl rand -hex 32`). Le changer invalide tous les accès en cours. |
| `ACCESS_CODE_HASHES` | Codes d'accès : `offre:hachage` séparés par des virgules (sortie de `outils/generer-codes.mjs`). Pour de nombreux codes, utilisez `--fichier` (ils vont dans `prive/codes-acces.txt`). |
| `GUMROAD_PRODUCT_IDS` | `essentiel:ID,pro:ID,vip:ID` (identifiant produit Gumroad, licences activées). |
| `LEMONSQUEEZY_STORE_ID` et `LEMONSQUEEZY_PRODUITS` | Identifiant de la boutique, puis `essentiel:ID,pro:ID,vip:ID` (variante ou produit, licences activées). |
| `STRIPE_SECRET_KEY` et `STRIPE_LIENS` | Clé restreinte en lecture des sessions Checkout, puis `essentiel:plink_…,pro:plink_…,vip:plink_…`. |
| `TOKEN_TTL_DAYS` | Facultatif : durée de validité d'un jeton sur un appareil (180 jours par défaut ; l'élève ressaisit sa clé ensuite). |

4. **Formulaires** : activez la détection des formulaires (Forms → Enable form detection), puis redéployez. Les formulaires `aimant` et `liste-attente` apparaissent ; branchez une notification ou un export vers votre outil d'emailing.
5. **Domaine** : ajoutez votre domaine, HTTPS est automatique.

### Brancher le paiement

- **Stripe (Payment Links)** : un lien par offre. Dans « Après le paiement », choisissez la redirection vers votre site : `https://votre-domaine.fr/merci/achat.html?session_id={CHECKOUT_SESSION_ID}`. L'élève active son accès en un clic ; sa clé `cs_…` lui sert ensuite sur ses autres appareils. Activez l'acceptation des conditions (lien vers vos CGV).
- **Gumroad** : activez la génération d'une clé de licence unique par vente sur chaque produit ; l'acheteur colle sa clé dans l'espace membre.
- **Lemon Squeezy** : activez les clés de licence sur chaque variante ; l'acheteur colle sa clé.
- **Codes manuels** (virement, offre entreprise, partenaire) : `node outils/generer-codes.mjs vip 5`.

**Renonciation au droit de rétractation** : pour un contenu numérique fourni immédiatement, le client doit demander l'accès immédiat et renoncer expressément à son droit de rétractation **avant** le paiement (case à cocher ou mention acceptée sur la page de paiement), et cette renonciation doit être confirmée dans l'email de confirmation. Configurez-le chez votre prestataire (acceptation des conditions sur Stripe, texte du produit et email de confirmation sur Gumroad et Lemon Squeezy).

## Configurer : `public/config.js`

Tout ce qui est propre au propriétaire est dans ce seul fichier : formateur, offres et liens de paiement, garantie, témoignages, aimant, vidéos des leçons, informations légales. Une valeur vide est masquée sur le site ; une information légale obligatoire manquante apparaît en **jaune « À compléter »** dans les pages légales.

Pour modifier le contenu : modules gratuits dans `public/cours/content/`, payants dans `prive/modules/`, titres et offres dans `public/cours/content/catalogue.js`. Ensuite :

```bash
npm run programme   # met à jour le programme et les chiffres de la page de vente
npm run n8n         # régénère les workflows n8n (si vous les modifiez)
npm test && npm run verifier
```

Pour ajouter les vidéos des leçons : `cours.videos` dans `config.js` (`'m6-5': 'https://www.youtube-nocookie.com/embed/…'`, Vimeo ou Bunny Stream).

## Avant la mise en vente (checklist)

- [ ] `config.js` → `formateur.nom` (nom de famille), `formateur.photo` (photo carrée dans `public/assets/img/`), `parcours`, `liens` (site, LinkedIn, Instagram, TikTok, YouTube), `agence.url`.
- [ ] `formateur.chiffres` : uniquement des chiffres vérifiables (aujourd'hui : « 150+ projets accompagnés »).
- [ ] `contact.email` (support), `produit.url`.
- [ ] `offres` : prix définitifs, contenu exact du VIP, `lienPaiement` de chaque offre ; `prixTTC` et `mentionTVA` selon votre régime de TVA.
- [ ] `garantie` : active ou non, durée et conditions.
- [ ] `legal` : raison sociale, forme, adresse, SIRET, RCS ou capital si société, TVA intracommunautaire, directeur de publication, téléphone, **médiateur de la consommation**, outil d'emailing, conditions de l'accompagnement VIP. Vérifiez l'adresse de l'hébergeur.
- [ ] Faire relire les CGV, les mentions légales et la politique de confidentialité par un professionnel.
- [ ] Variables d'environnement Netlify, puis un **achat test** sur chaque offre (mode test du prestataire) jusqu'à l'activation.
- [ ] Case de renonciation au droit de rétractation et email de confirmation chez le prestataire de paiement.
- [ ] Formulaires Netlify détectés, notifications ou export vers l'outil d'emailing, double opt-in conseillé.
- [ ] `temoignages` : ne rien ajouter tant que vous n'avez pas d'avis réels avec accord écrit.
- [ ] Mettre à jour `produit.miseAJour` à chaque révision du contenu.

## Sécurité et limites connues

- Le jeton d'accès est conservé dans le navigateur de l'élève ; un même code peut être saisi sur plusieurs appareils. Pour limiter le partage, préférez les licences Gumroad ou Lemon Squeezy (révocables, remboursements refusés automatiquement) et désactivez un code partagé en retirant son hachage.
- La limitation des essais est faite par instance de fonction (en mémoire) : suffisante contre les essais manuels, ce n'est pas un pare-feu.
- La progression est stockée localement (pas de compte élève) : l'élève l'exporte et l'importe depuis son profil pour changer d'appareil.
- Les tarifs et fonctionnalités des outils tiers évoluent vite : prévoyez une révision du contenu tous les trois mois.

## Licences

Polices : SIL Open Font License (`public/assets/fonts/LICENCES-OFL.txt`). CodeMirror : MIT (`public/vendor/codemirror/LICENSE`). Contenu de la formation : tous droits réservés au propriétaire.
