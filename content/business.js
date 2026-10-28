import { code } from './_outils.js';

const motsMin = n => ({ label: `Au moins ${n} mots`, verif: t => t.trim().split(/\s+/).length >= n });

export default {
  description: 'Lancer une activité en France et la rendre visible en ligne : site efficace, référencement local et fiche Google Business Profile, publicité Google et Meta, automatisation, et les démarches de création d\'entreprise.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Un module court et concret, pensé pour un indépendant, un artisan, un commerce ou une petite agence. Chaque leçon se termine par un exercice de mise en situation (plan, fiche, campagne) évalué selon des critères, et un quiz. Les informations administratives correspondent au cadre français en vigueur en 2026 ; vérifie toujours les montants et seuils sur les sites officiels (service-public.fr, urssaf.fr, impots.gouv.fr) avant de t'engager.</p>`,
  modules: [
    {
      titre: 'Créer et faire connaître son activité', niveau: 'Débutant', description: 'Site, SEO local, publicité, automatisation et création d\'entreprise.',
      lecons: [
        {
          titre: 'Un site qui convertit, sans se ruiner',
          theorie: `<p>Pour une petite activité, le site n'est pas une plaquette : c'est un <strong>outil de conversion</strong>. Son but est simple : qu'un visiteur comprenne en cinq secondes ce que tu fais, pour qui, et comment te contacter. Tout le reste est secondaire.</p>
<h2>La page d'accueil qui fonctionne</h2>
<ol><li><strong>Titre</strong> : quoi + pour qui + où. « Plombier chauffagiste à Nantes, dépannage sous 24 h. »</li><li><strong>Appel à l'action</strong> visible sans défiler : bouton appel (<code>tel:</code>), formulaire court, prise de rendez-vous en ligne.</li><li><strong>Preuve</strong> : avis Google, photos réelles, chiffres (années, clients, réalisations).</li><li><strong>Offre</strong> : 3 à 5 prestations avec des prix ou des fourchettes (les prix affichés rassurent et filtrent).</li><li><strong>Zone</strong> : villes et quartiers desservis (indispensable pour le référencement local).</li><li><strong>Confiance</strong> : qui tu es (photo, parcours), assurances, mentions légales, horaires, adresse.</li></ol>
<h2>Les choix techniques</h2>
<table><tr><th>Solution</th><th>Pour qui</th><th>Coût</th></tr>
<tr><td>Site statique HTML/CSS (parcours Lumio) sur Netlify</td><td>à l'aise avec le code, besoin simple</td><td>0 € + domaine ~10 €/an</td></tr>
<tr><td>Constructeur (Webflow, Framer, Squarespace, Wix)</td><td>sans code, design soigné</td><td>15 à 40 €/mois</td></tr>
<tr><td>WordPress (hébergement mutualisé)</td><td>blog, évolutivité, écosystème</td><td>5 à 15 €/mois, maintenance à prévoir</td></tr>
<tr><td>Shopify / WooCommerce</td><td>vente en ligne</td><td>30 €/mois et plus</td></tr></table>
<p>Dans tous les cas : un <strong>nom de domaine</strong> à toi (jamais un sous-domaine gratuit), HTTPS, un site <strong>rapide sur mobile</strong> (60 à 70 % des visites locales), et un suivi des conversions.</p>
<h2>Les pages essentielles</h2>
<ul><li>Accueil ; une page par <strong>prestation</strong> (chacune cible une recherche : « débouchage canalisation Nantes ») ; À propos ; Avis ; Contact (téléphone, formulaire, carte, horaires) ; Mentions légales et politique de confidentialité (obligatoires).</li><li>Un <strong>blog</strong> seulement si tu peux publier régulièrement des réponses aux questions de tes clients (ce qui aide beaucoup le référencement).</li></ul>
<h2>Mesurer</h2>
<p>Installer un outil de statistiques respectueux de la vie privée (Plausible, Matomo, Umami, ou Google Analytics avec bannière de consentement) et surtout compter les <strong>conversions</strong> : clics sur le téléphone, formulaires envoyés, rendez-vous pris. Un site à 300 visites et 15 appels bat un site à 3 000 visites et 2 appels.</p>
<h2>Erreurs fréquentes</h2>
<ul><li>Slogan vague en titre (« Votre partenaire de confiance ») au lieu du métier et de la ville.</li><li>Pas de numéro de téléphone cliquable sur mobile.</li><li>Photos de banque d'images au lieu de vraies photos (les clients le sentent).</li><li>Un formulaire à douze champs ; trois suffisent (nom, contact, message).</li><li>Aucune mise à jour pendant deux ans (horaires, prix, photos).</li></ul>
<div class="callout info"><b>Le test des 5 secondes</b>Montre ta page d'accueil 5 secondes à quelqu'un qui ne connaît pas ton activité. Peut-il dire ce que tu fais, pour qui, où, et comment te contacter ? Sinon, réécris le haut de la page.</div>`,
          exercice: {
            type: 'texte', titre: 'Rédiger le haut de sa page d\'accueil',
            enonce: `<p>Pour une activité réelle ou fictive (artisan, thérapeute, coach, restaurant…), rédige le contenu du <strong>haut de page d'accueil</strong> : le titre (quoi + pour qui + où), un sous-titre d'une phrase, le texte du bouton d'action principal, un élément de preuve, les 3 prestations principales avec une fourchette de prix, et la zone desservie.</p>`,
            placeholder: 'Titre : …\nSous-titre : …\nBouton : …\nPreuve : …\nPrestations : 1. … (… €) 2. … 3. …\nZone : …',
            criteres: [
              { label: 'Titre avec le métier et une ville', re: /titre\s*:[^\n]*\b(à|a|sur|en)\b[^\n]*[A-ZÉ][a-zé]+/ },
              { label: 'Un bouton d\'action explicite (appeler, réserver, devis…)', re: /bouton\s*:[^\n]*(appel|r[ée]serv|devis|rendez-vous|contact|command)/i },
              { label: 'Une preuve (avis, note, années, clients)', re: /preuve\s*:[^\n]*(avis|\/5|[ée]toiles|ans|clients|r[ée]alisations|certifi)/i },
              { label: 'Trois prestations listées', verif: t => { const p = t.split(/prestations?\s*:/i)[1] || ''; return (p.match(/\d[.)]/g) || []).length >= 3; } },
              { label: 'Des prix ou fourchettes', re: /\d+\s?(€|euros)/i },
              { label: 'Zone desservie précisée', re: /zone\s*:[^\n]{5,}/i },
              motsMin(60)
            ],
            solution: `<p>Titre : Électricienne à Rennes — dépannage, rénovation et mise aux normes. Sous-titre : Intervention sous 48 h dans Rennes et sa métropole, devis gratuit et prix annoncés avant travaux. Bouton : Appeler maintenant (06 …) / Demander un devis. Preuve : 4,9/5 sur 120 avis Google, 12 ans d'expérience, assurance décennale. Prestations : 1. Dépannage électrique (à partir de 90 €) 2. Rénovation de tableau électrique (900 à 1 500 €) 3. Installation de bornes de recharge (1 200 à 2 000 € pose comprise). Zone : Rennes, Cesson-Sévigné, Saint-Grégoire, Bruz, Chantepie et toute la métropole.</p>`
          },
          quiz: [
            { q: 'Quel est l\'objectif premier du site d\'une petite activité ?', options: ['Impressionner', 'Convertir : faire comprendre l\'offre et déclencher un contact', 'Avoir beaucoup de pages'], bonne: 1, explication: 'Quoi, pour qui, où, comment contacter : en cinq secondes.' },
            { q: 'Pourquoi une page par prestation ?', options: ['Pour la décoration', 'Chaque page cible une recherche précise (SEO)', 'C\'est imposé par Google'], bonne: 1, explication: '« Débouchage canalisation Nantes » mérite sa page.' },
            { q: 'Quelle métrique compte le plus ?', options: ['Le nombre de visites', 'Les conversions (appels, formulaires, rendez-vous)', 'Le temps de chargement'], bonne: 1, explication: 'Des visites sans contact ne font pas vivre une activité.' }
          ]
        },
        {
          titre: 'SEO local et Google Business Profile',
          theorie: `<p>Quand quelqu'un cherche « coiffeur près de moi » ou « plombier Lyon 3 », Google affiche d'abord la <strong>carte</strong> avec trois établissements (le « pack local »), puis les sites. Être dans ce pack, c'est le levier gratuit le plus puissant pour une activité locale. Il repose sur la <strong>fiche Google Business Profile</strong> (GBP) et sur quelques signaux.</p>
<h2>Créer et optimiser sa fiche</h2>
<ol><li>Créer la fiche sur <em>business.google.com</em>, la <strong>vérifier</strong> (courrier, vidéo, téléphone selon les cas).</li><li><strong>Nom</strong> : le nom réel de l'entreprise, sans mots-clés ajoutés (interdit et pénalisé).</li><li><strong>Catégorie principale</strong> précise (« Plombier » plutôt que « Entreprise de services ») + catégories secondaires pertinentes.</li><li><strong>Adresse</strong> (ou zone desservie pour les activités à domicile), <strong>téléphone</strong>, <strong>site</strong>, <strong>horaires</strong> exacts et mis à jour (jours fériés).</li><li><strong>Description</strong> (750 caractères) : prestations, zone, ce qui te distingue.</li><li><strong>Prestations / produits</strong> avec prix ; <strong>attributs</strong> (accessibilité, paiement, etc.).</li><li><strong>Photos</strong> réelles et régulières : extérieur, intérieur, équipe, réalisations (les fiches avec photos reçoivent nettement plus de demandes d'itinéraire et d'appels).</li><li><strong>Posts</strong> hebdomadaires (actualités, offres, réalisations) et <strong>questions/réponses</strong> renseignées.</li></ol>
<h2>Les avis : le facteur n° 1</h2>
<ul><li>Demander un avis <strong>systématiquement</strong> après chaque prestation réussie : lien direct vers le formulaire d'avis (QR code sur la facture, SMS, email). Ne jamais acheter ou simuler des avis (illégal, détecté).</li><li><strong>Répondre à tous les avis</strong>, positifs (merci, personnalisé) et négatifs (calme, factuel, proposition de solution) : les prospects lisent les réponses.</li><li>Viser la régularité (quelques avis par mois) plus que le volume d'un coup.</li></ul>
<h2>Les signaux de classement local</h2>
<table><tr><th>Signal</th><th>Comment agir</th></tr>
<tr><td><strong>Pertinence</strong></td><td>catégories, description, prestations, site cohérent avec la fiche</td></tr>
<tr><td><strong>Distance</strong></td><td>non contrôlable, mais la zone desservie et les pages par ville aident</td></tr>
<tr><td><strong>Notoriété</strong></td><td>avis, mentions sur d'autres sites (annuaires : PagesJaunes, Yelp, annuaires de métier), presse locale, liens</td></tr></table>
<p><strong>NAP</strong> (Nom, Adresse, Téléphone) : exactement identiques partout (site, fiche, annuaires, réseaux). Les incohérences font baisser la confiance de Google.</p>
<h2>Le SEO local sur le site</h2>
<ul><li>Le métier et la ville dans le <code>&lt;title&gt;</code>, le <code>h1</code> et la description de la page d'accueil.</li><li>Une page par ville importante si tu interviens sur plusieurs communes (contenu réellement différent, pas de copier-coller).</li><li>Les données structurées <code>LocalBusiness</code> (vu au parcours HTML) : adresse, horaires, téléphone.</li><li>La fiche GBP liée au site, et le site liant la fiche (bouton « Nous trouver »).</li><li>Des contenus qui répondent aux questions locales (« faut-il un permis pour une pergola à Toulouse ? »).</li></ul>
<h2>Suivre</h2>
<p>Les statistiques de la fiche (recherches, appels, itinéraires, clics site) et Google Search Console (requêtes, positions). Objectif réaliste : entrer dans le pack local sur ses 3 à 5 requêtes principales en 3 à 6 mois avec une fiche complète, des avis réguliers et un site cohérent.</p>
<div class="callout warn"><b>Les pièges</b>Mots-clés dans le nom de la fiche, fausses adresses, avis achetés, plusieurs fiches pour la même activité : suspension de la fiche. Google vérifie, et les concurrents signalent.</div>`,
          exercice: {
            type: 'texte', titre: 'Optimiser une fiche Google Business Profile',
            enonce: `<p>Rédige le contenu d'une fiche GBP pour une activité locale : nom (réel, sans mots-clés), catégorie principale et deux secondaires, description (400 à 750 caractères : prestations, zone, différenciation), trois idées de posts pour le mois, le plan de collecte d'avis (quand, comment, lien/QR), et le modèle de réponse à un avis négatif.</p>`,
            placeholder: 'Nom : …\nCatégories : …\nDescription : …\nPosts : 1. … 2. … 3. …\nCollecte d\'avis : …\nRéponse à un avis négatif : « … »',
            criteres: [
              { label: 'Nom sans mots-clés ajoutés (pas de « meilleur », « pas cher », ville collée)', verif: t => { const m = t.match(/nom\s*:\s*([^\n]+)/i); return m && !/meilleur|pas cher|n[°o]\s?1|\bpro\b/i.test(m[1]) && m[1].split(/\s+/).length <= 6; } },
              { label: 'Catégorie principale + secondaires', re: /cat[ée]gories?\s*:[^\n]*,[^\n]*,/i },
              { label: 'Description de 400 à 750 caractères', verif: t => { const m = t.match(/description\s*:\s*([\s\S]*?)(\n\s*posts?|$)/i); const d = m ? m[1].trim() : ''; return d.length >= 400 && d.length <= 750; } },
              { label: 'Trois idées de posts', verif: t => { const p = t.split(/posts?\s*:/i)[1] || ''; return (p.match(/\d[.)]/g) || []).length >= 3; } },
              { label: 'Plan de collecte d\'avis (moment + moyen)', re: /avis[\s\S]*(apr[èe]s|fin de|[àa] la fin)[\s\S]*(sms|email|mail|qr|lien|facture)/i },
              { label: 'Réponse à un avis négatif : calme, factuelle, propose une solution', re: /n[ée]gatif[\s\S]*(d[ée]sol|regrett|navr)[\s\S]*(contact|appel|rappel|solution|proposer|rencontr)/i },
              motsMin(180)
            ],
            solution: `<p>Nom : Atelier Vélo Dubois. Catégories : Réparation de vélos (principale), Magasin de vélos, Location de vélos. Description : Atelier Vélo Dubois répare, entretient et équipe tous les vélos à Bordeaux Chartrons depuis 2015 : réglage et révision complète, freins et transmission, crevaisons réparées en 20 minutes sans rendez-vous, électrification et diagnostic de vélos à assistance électrique, pièces et accessoires en stock. Mécanicien certifié, devis annoncé avant toute intervention, pièces d'origine ou équivalent garanti. Nous proposons aussi la location de vélos de ville et cargo à la journée ou à la semaine. Ouvert du mardi au samedi, atelier accessible aux personnes à mobilité réduite, paiement par carte et chèques vacances. Posts : 1. « Révision de printemps : −15 % jusqu'au 30 avril » avec photo de l'atelier ; 2. Réalisation de la semaine : restauration d'un vélo des années 70, avant/après ; 3. Conseil : « Comment préparer son vélo pour l'hiver en 5 points ». Collecte d'avis : à la remise du vélo, carte avec QR code vers le lien d'avis + SMS le lendemain « Merci pour votre confiance, un avis nous aide beaucoup : [lien] » ; objectif 4 avis par mois. Réponse à un avis négatif : « Bonjour Madame Martin, nous sommes désolés que la réparation n'ait pas tenu. Ce n'est pas le niveau de qualité que nous visons. Pouvez-vous nous contacter au 05 … ou repasser à l'atelier ? Nous reprenons l'intervention sans frais et vérifions l'ensemble de la transmission. Merci de nous avoir signalé le problème. »</p>`
          },
          quiz: [
            { q: 'Quel est le facteur n° 1 du classement dans le pack local ?', options: ['Le nombre de photos', 'Les avis (quantité, régularité, réponses)', 'Le prix'], bonne: 1, explication: 'Avec la pertinence (catégories) et la cohérence des informations.' },
            { q: 'Que signifie NAP ?', options: ['Un outil Google', 'Nom, Adresse, Téléphone, identiques partout', 'Un type de post'], bonne: 1, explication: 'Les incohérences entre site, fiche et annuaires nuisent à la confiance.' },
            { q: 'Ajouter « meilleur plombier Lyon » au nom de la fiche est…', options: ['Une bonne optimisation', 'Interdit et pénalisé par Google', 'Obligatoire'], bonne: 1, explication: 'Le nom doit être le nom réel de l\'entreprise.' }
          ]
        },
        {
          titre: 'Publicité Google et Meta : démarrer sans gaspiller',
          theorie: `<p>La publicité en ligne permet d'obtenir des clients dès la première semaine, à condition de la piloter. Deux plateformes couvrent l'essentiel : <strong>Google Ads</strong> (capter une intention : quelqu'un cherche ton service maintenant) et <strong>Meta Ads</strong> (Facebook/Instagram : créer le besoin, toucher un profil, remarketing).</p>
<h2>Google Ads : la recherche</h2>
<ul><li><strong>Campagne Search</strong> : tes annonces apparaissent sur des requêtes que tu choisis (« dépannage chaudière Lille »). Facturation au clic (CPC), de 0,50 à 10 € selon le secteur.</li><li><strong>Mots-clés</strong> : commence par des requêtes précises avec intention d'achat (« prix », « devis », « urgence », ville) en correspondance <em>expression</em> ou <em>exacte</em> ; évite le « large » au début (dépenses sur des requêtes hors sujet).</li><li><strong>Mots-clés négatifs</strong> : « gratuit », « emploi », « formation », « définition »… à exclure dès le départ.</li><li><strong>Annonce</strong> : titres avec le service, la ville, un avantage (« sous 24 h », « devis gratuit ») ; extensions d'appel, de lieu, de liens annexes.</li><li><strong>Page de destination</strong> dédiée, cohérente avec l'annonce, avec un seul appel à l'action.</li><li><strong>Ciblage géographique</strong> strict (rayon ou villes) et <strong>horaires</strong> (quand tu peux répondre).</li><li><strong>Campagnes Local / Performance Max</strong> : automatisées, utiles après avoir des données de conversion.</li></ul>
<h2>Meta Ads : l'audience</h2>
<ul><li>Objectif de campagne aligné sur le but réel : prospects (formulaire), messages, trafic, ventes.</li><li>Ciblage : zone + âge + centres d'intérêt larges ; l'algorithme optimise mieux avec des audiences larges et de bonnes créations qu'avec un ciblage trop fin.</li><li><strong>Création</strong> : vidéos courtes verticales (le parcours Vidéo IA s'applique directement), 3 à 6 variantes testées, hook en 2 s, preuve, offre, CTA.</li><li><strong>Remarketing</strong> : recibler les visiteurs du site et les abonnés (pixel Meta installé, avec consentement) : c'est souvent la campagne la plus rentable.</li><li>Formulaires instantanés pour collecter des demandes sans quitter la plateforme.</li></ul>
<h2>Budget et pilotage</h2>
<ol><li>Définir la <strong>valeur d'un client</strong> (panier moyen × marge × récurrence) : elle fixe le coût par acquisition (CPA) acceptable.</li><li>Démarrer petit (10 à 20 €/jour), une campagne, un objectif, pendant 2 à 3 semaines sans toucher à tout chaque jour.</li><li><strong>Suivre les conversions</strong> (appels, formulaires) : sans suivi, impossible d'optimiser. Google Tag / pixel Meta + événements.</li><li>Chaque semaine : couper ce qui ne convertit pas, renforcer ce qui convertit, ajouter des négatifs, tester une nouvelle annonce.</li><li>Comparer au coût d'un client par d'autres canaux (SEO, bouche-à-oreille).</li></ol>
<table><tr><th>Indicateur</th><th>Signification</th><th>Réaction si mauvais</th></tr>
<tr><td>CTR (taux de clic)</td><td>l'annonce attire-t-elle ?</td><td>réécrire titres, préciser le ciblage</td></tr>
<tr><td>Taux de conversion de la page</td><td>la page convainc-elle ?</td><td>page dédiée, CTA clair, preuve, vitesse</td></tr>
<tr><td>CPA</td><td>coût d'un client</td><td>comparer à la valeur client ; couper les mots-clés chers sans conversion</td></tr>
<tr><td>Part d'impressions</td><td>visibilité sur les requêtes visées</td><td>budget ou enchères si rentable</td></tr></table>
<h2>Règles et mentions</h2>
<p>Publicité identifiée comme telle ; pas d'allégations trompeuses ; secteurs réglementés (santé, finance, alcool) soumis à des règles strictes ; consentement pour les traceurs (RGPD, bannière). Les plateformes rejettent les annonces non conformes.</p>
<div class="callout info"><b>Quand faire de la publicité</b>Quand le site convertit déjà (sinon on paie pour des visites perdues), quand on peut absorber les demandes, et quand la valeur client justifie le coût. La publicité amplifie ce qui marche ; elle ne répare pas ce qui ne marche pas.</div>`,
          exercice: {
            type: 'texte', titre: 'Planifier une première campagne',
            enonce: `<p>Conçois une première campagne Google Ads Search pour une activité locale : objectif et conversion suivie, valeur d'un client et CPA cible calculé, 5 mots-clés précis (avec ville et intention), 5 mots-clés négatifs, deux titres et une description d'annonce, la page de destination (contenu clé), le ciblage géographique et horaire, le budget quotidien et la durée du test, et les 3 indicateurs que tu suivras.</p>`,
            placeholder: 'Objectif / conversion : …\nValeur client : … → CPA cible : …\nMots-clés : …\nNégatifs : …\nAnnonce : titres « … » / « … », description « … »\nPage : …\nCiblage : …\nBudget : … €/jour pendant … semaines\nIndicateurs : …',
            criteres: [
              { label: 'Conversion suivie définie (appel, formulaire, rendez-vous)', re: /conversion[\s\S]{0,80}(appel|formulaire|rendez-vous|devis|message)/i },
              { label: 'Valeur client et CPA cible chiffrés', re: /valeur[^\n]*\d+\s?€[\s\S]*cpa[^\n]*\d+\s?€/i },
              { label: '5 mots-clés précis incluant une ville', verif: t => { const m = t.match(/mots?-cl[ée]s?\s*:\s*([^\n]+)/i); if (!m) return false; const liste = m[1].split(/,|;|\//).filter(x => x.trim()); return liste.length >= 5 && liste.filter(x => /[A-ZÉ][a-zé]{2,}/.test(x.trim())).length >= 3; } },
              { label: '5 mots-clés négatifs', verif: t => { const m = t.match(/n[ée]gatifs?\s*:\s*([^\n]+)/i); return m && m[1].split(/,|;|\//).filter(x => x.trim()).length >= 5; } },
              { label: 'Annonce : titres et description', re: /titres?[\s\S]*«[^»]+»[\s\S]*«[^»]+»[\s\S]*description/i },
              { label: 'Ciblage géographique et horaire', re: /ciblage[\s\S]*(rayon|km|villes?|commune)[\s\S]*(h\b|heures|horaires|lundi|jours)/i },
              { label: 'Budget quotidien et durée', re: /\d+\s?€\s?\/?\s?(jour|j)[\s\S]*\d+\s?(semaines?|jours)/i },
              { label: 'Trois indicateurs de suivi', re: /indicateurs?\s*:[^\n]*(ctr|cpa|conversion|co[ûu]t|clic|impressions)[^\n]*,[^\n]*,/i },
              motsMin(150)
            ],
            solution: `<p>Objectif / conversion : appels depuis l'annonce et formulaire de devis (suivi Google Tag + numéro de transfert). Valeur client : panier moyen 450 € × marge 40 % = 180 € → CPA cible : 45 € maximum. Mots-clés (expression) : « dépannage chaudière Lille », « chauffagiste urgence Lille », « réparation chaudière gaz Villeneuve-d'Ascq », « entretien chaudière Lille prix », « plombier chauffagiste Marcq-en-Barœul ». Négatifs : gratuit, emploi, formation, salaire, occasion, pièces détachées, vidéo. Annonce : titres « Chauffagiste à Lille – Dépannage 24 h » / « Devis gratuit, intervention rapide », description « Panne de chaudière ? Technicien certifié, pièces en stock, prix annoncé avant travaux. Appelez maintenant. » + extensions d'appel et de lieu. Page : page dédiée « Dépannage chaudière Lille » avec bouton d'appel en haut, 3 avis Google, délai d'intervention, zone, formulaire 3 champs. Ciblage : rayon de 15 km autour de Lille, du lundi au samedi de 7 h à 20 h (horaires de réponse). Budget : 20 €/jour pendant 3 semaines (420 €), sans modification les 7 premiers jours. Indicateurs : CTR (objectif > 5 %), taux de conversion de la page (> 8 %), CPA (< 45 €) ; revue hebdomadaire avec ajout de négatifs et pause des mots-clés sans conversion.</p>`
          },
          quiz: [
            { q: 'Quelle différence fondamentale entre Google Search et Meta Ads ?', options: ['Aucune', 'Google capte une intention de recherche ; Meta touche un profil et crée le besoin', 'Meta est gratuit'], bonne: 1, explication: 'Les deux se complètent : intention immédiate vs découverte et remarketing.' },
            { q: 'Pourquoi fixer un CPA cible avant de lancer ?', options: ['Pour la plateforme', 'Pour savoir si un client acquis par la pub est rentable', 'C\'est obligatoire'], bonne: 1, explication: 'Il découle de la valeur d\'un client (panier × marge × récurrence).' },
            { q: 'Que faire avant d\'investir en publicité ?', options: ['Rien', 'S\'assurer que le site convertit et que les conversions sont suivies', 'Augmenter le budget'], bonne: 1, explication: 'La publicité amplifie ; elle ne répare pas une page qui ne convainc pas.' }
          ]
        },
        {
          titre: 'Automatiser et créer son entreprise en France',
          theorie: `<p>Deux sujets pour finir : gagner du temps en <strong>automatisant</strong> les tâches répétitives, et choisir le bon <strong>cadre juridique</strong> pour démarrer en France.</p>
<h2>Automatiser sans développeur</h2>
<p>Les outils no-code (<strong>Make</strong>, <strong>Zapier</strong>, <strong>n8n</strong> — open source et auto-hébergeable) connectent tes applications : quand un événement survient (formulaire reçu, paiement, nouvel avis), ils déclenchent des actions (email, SMS, ligne dans un tableur, tâche, facture).</p>
<table><tr><th>Automatisation</th><th>Déclencheur → actions</th></tr>
<tr><td>Réponse immédiate aux demandes</td><td>formulaire site → email/SMS de confirmation au client + notification à toi + fiche dans le CRM</td></tr>
<tr><td>Collecte d'avis</td><td>facture payée (Stripe, logiciel de facturation) → SMS 24 h après avec le lien d'avis</td></tr>
<tr><td>Prise de rendez-vous</td><td>Calendly / Cal.com / Google Agenda → rappel automatique la veille (réduit les absences)</td></tr>
<tr><td>Suivi commercial</td><td>devis envoyé → relance automatique à J+5 si pas de réponse</td></tr>
<tr><td>Contenu</td><td>nouvelle réalisation photographiée → post GBP + réseaux programmés (Metricool, Buffer)</td></tr>
<tr><td>Comptabilité</td><td>paiements → export vers l'outil de facturation/compta ; relevés bancaires synchronisés</td></tr></table>
<p>Les assistants IA (ChatGPT, Claude, Gemini) rédigent les réponses types, trient les demandes, résument les appels, préparent les devis à partir de notes. Principe : garder un humain pour tout ce qui engage (devis définitif, réponse à une réclamation). Et ne jamais automatiser un processus avant de l'avoir fait proprement à la main quelques fois.</p>
<h2>Choisir son statut en France</h2>
<table><tr><th>Statut</th><th>Pour qui</th><th>Points clés</th></tr>
<tr><td><strong>Micro-entreprise</strong> (auto-entrepreneur)</td><td>démarrer seul, tester, activité de service ou commerce avec peu de charges</td><td>création gratuite en ligne (guichet unique), comptabilité ultra-simplifiée, cotisations = % du chiffre d'affaires (≈ 21-25 % services, ≈ 12 % vente), plafonds de CA (≈ 77 700 € services, 188 700 € vente), pas de TVA sous les seuils de franchise, pas de déduction des charges</td></tr>
<tr><td><strong>EI au régime réel</strong></td><td>charges réelles importantes</td><td>déduction des frais, comptabilité complète, pas de capital</td></tr>
<tr><td><strong>SASU</strong></td><td>projet à investir, embaucher, lever des fonds, image</td><td>président assimilé salarié (protection sociale complète, cotisations élevées), impôt sur les sociétés, dividendes, statuts et comptes annuels (expert-comptable conseillé)</td></tr>
<tr><td><strong>EURL</strong></td><td>alternative à la SASU</td><td>gérant TNS (cotisations plus faibles, protection moindre), option IR possible</td></tr></table>
<p>Pour la grande majorité des lancements : <strong>micro-entreprise</strong>, puis bascule vers une société quand le CA ou les charges le justifient. Les activités réglementées (bâtiment, santé, transport…) exigent diplômes, qualifications ou assurances spécifiques : vérifier avant.</p>
<h2>Les démarches</h2>
<ol><li>Vérifier le nom (INPI) et réserver le domaine.</li><li>Déclarer l'activité sur le <strong>guichet unique</strong> (formalites.entreprises.gouv.fr) : SIRET sous quelques jours.</li><li>Compte bancaire dédié (obligatoire au-delà de 10 000 € de CA deux ans de suite en micro ; conseillé dès le début).</li><li>Assurances : responsabilité civile professionnelle (souvent indispensable), décennale pour le bâtiment.</li><li>Facturation conforme (mentions obligatoires, numérotation continue) ; facturation électronique obligatoire progressivement à partir de 2026-2027 : choisir un logiciel compatible.</li><li>Déclarations : CA mensuel ou trimestriel à l'URSSAF (micro) ; TVA si concerné ; CFE (exonérée la première année).</li><li>Mentions légales et RGPD sur le site ; conditions générales de vente.</li></ol>
<h2>Les aides et accompagnements</h2>
<p><strong>ACRE</strong> (réduction de cotisations la première année sous conditions), <strong>ARCE / maintien de l'ARE</strong> pour les demandeurs d'emploi, prêts d'honneur (Initiative France, Réseau Entreprendre), accompagnement par les CCI, CMA, BGE, couveuses et coopératives d'activité (tester avec un statut salarié). France Travail et Bpifrance Création centralisent l'information.</p>
<div class="callout warn"><b>Vérifier les chiffres</b>Seuils, taux et obligations évoluent chaque année. Avant toute décision : service-public.fr, urssaf.fr, impots.gouv.fr, et un rendez-vous (souvent gratuit) avec la CCI/CMA ou un expert-comptable.</div>
<div class="callout ok"><b>Parcours terminé</b>Site qui convertit, visibilité locale, publicité pilotée, automatisation et cadre juridique : tu as la trousse de démarrage d'une activité. Combine avec les parcours techniques de Lumio (site, vidéo IA) pour tout produire toi-même, et avance par petites étapes mesurées.</div>`,
          exercice: {
            type: 'texte', titre: 'Plan de lancement sur 90 jours',
            enonce: `<p>Rédige ton plan de lancement sur 90 jours pour une activité (réelle ou fictive) : le statut choisi et pourquoi, les démarches des 30 premiers jours (déclaration, banque, assurance, facturation), le site et la fiche GBP (jours 15-45), les 3 automatisations prioritaires, le premier test publicitaire ou l'alternative gratuite (jours 45-90), et les 3 indicateurs que tu suivras à 90 jours. Indique au moins une aide ou un accompagnement que tu solliciteras.</p>`,
            placeholder: 'Activité : …\nStatut : … parce que …\nJours 1-30 : …\nJours 15-45 : …\nAutomatisations : 1. … 2. … 3. …\nJours 45-90 : …\nIndicateurs à 90 jours : …\nAide : …',
            criteres: [
              { label: 'Statut choisi et justifié', re: /statut\s*:[^\n]*(micro|auto-entrepreneur|sasu|eurl|ei\b)[^\n]*(parce que|car|pour)/i },
              { label: 'Démarches : déclaration/guichet unique, banque, assurance', verif: t => ['guichet|d[ée]clar|siret|immatricul', 'banque|compte', 'assurance|rc pro|d[ée]cennale'].every(r => new RegExp(r, 'i').test(t)) },
              { label: 'Site et fiche Google Business Profile planifiés', re: /site[\s\S]*(fiche|google business|gbp)|(fiche|google business|gbp)[\s\S]*site/i },
              { label: 'Trois automatisations', verif: t => { const a = t.split(/automatisations?\s*:/i)[1] || ''; return (a.match(/\d[.)]/g) || []).length >= 3; } },
              { label: 'Test publicitaire ou alternative gratuite (avis, bouche-à-oreille, réseaux, partenariats)', re: /google ads|meta|publicit|budget|avis|bouche|partenariat|r[ée]seaux|instagram|tiktok|flyers?/i },
              { label: 'Trois indicateurs à 90 jours', re: /indicateurs?[^\n]*:[^\n]*,[^\n]*,/i },
              { label: 'Une aide ou un accompagnement nommé', re: /acre|arce|are\b|cci|cma|bge|initiative|r[ée]seau entreprendre|couveuse|coop[ée]rative|bpifrance|pr[êe]t d.honneur|france travail/i },
              motsMin(170)
            ],
            solution: `<p>Activité : coach sportif à domicile, Montpellier. Statut : micro-entreprise parce que je démarre seul, sans investissement lourd, avec des charges faibles ; je basculerai en société si le CA approche le plafond. Jours 1-30 : vérification du nom à l'INPI et réservation du domaine ; déclaration sur le guichet unique (SIRET) ; demande d'ACRE ; compte bancaire dédié ; RC professionnelle et carte professionnelle d'éducateur sportif vérifiée ; logiciel de facturation conforme ; rendez-vous à la CCI pour l'accompagnement et le prêt d'honneur Initiative. Jours 15-45 : site d'une page (titre « Coach sportif à domicile à Montpellier », bouton d'appel, 3 formules avec prix, zone, avis) sur Netlify ; fiche Google Business Profile vérifiée, catégorie « Coach sportif personnel », 15 photos, description, posts hebdomadaires ; mentions légales et RGPD. Automatisations : 1. formulaire → SMS de confirmation + créneau Cal.com ; 2. séance payée → SMS d'avis à J+1 avec lien GBP ; 3. rappel automatique la veille de chaque séance. Jours 45-90 : collecte de 15 avis via les premiers clients (offre de séance d'essai) ; test Meta Ads 10 €/jour pendant 3 semaines sur un rayon de 10 km avec une vidéo courte « 3 erreurs du débutant » et formulaire instantané ; partenariat avec deux kinés du quartier. Indicateurs à 90 jours : nombre de demandes de contact par semaine (objectif 5), coût par demande (< 15 €), note et nombre d'avis (4,8 et 15 avis). Aide : ACRE la première année, accompagnement BGE pour le prévisionnel.</p>`
          },
          quiz: [
            { q: 'Quel statut pour tester une activité seul avec peu de charges ?', options: ['SASU', 'Micro-entreprise', 'SA'], bonne: 1, explication: 'Création gratuite, cotisations proportionnelles au CA, comptabilité simplifiée.' },
            { q: 'Où déclare-t-on la création de son entreprise en France ?', options: ['À la mairie', 'Sur le guichet unique des formalités d\'entreprises', 'Chez un notaire'], bonne: 1, explication: 'formalites.entreprises.gouv.fr centralise toutes les déclarations depuis 2023.' },
            { q: 'Quelle règle avant d\'automatiser un processus ?', options: ['L\'automatiser immédiatement', 'L\'avoir fait proprement à la main plusieurs fois', 'Le confier entièrement à une IA'], bonne: 1, explication: 'On automatise ce qui est stable et compris, en gardant l\'humain sur ce qui engage.' }
          ]
        }
      ]
    }
  ]
};
