/* =====================================================================
   CONFIGURATION DE LA FORMATION — le seul fichier à modifier.
   ---------------------------------------------------------------------
   Repère : toutes les valeurs à compléter sont marquées « À COMPLÉTER ».
   Une valeur laissée vide ('') est simplement masquée sur le site
   (photo, liens, chiffres…). Les pages légales affichent un repère
   jaune « à compléter » tant qu'une information obligatoire manque.
   Checklist complète : README.md, section « Avant la mise en vente ».
   ===================================================================== */
window.LEVIER_CONFIG = {

  produit: {
    nom: 'Levier',
    // Sous-titre descriptif : l'usage du nom « Claude » est purement descriptif.
    sousTitre: 'La formation complète pour gagner de l\'argent avec Claude et l\'automatisation vidéo',
    url: '',                      // À COMPLÉTER : https://votre-domaine.fr (balises de partage, certificats)
    langue: 'fr',
    devise: 'EUR',
    dureeAcces: 'Accès à vie à la formation et à ses mises à jour', // ou « Accès 12 mois », etc.
    miseAJour: 'novembre 2026'    // date de la dernière mise à jour du contenu
  },

  formateur: {
    prenom: 'Ibrahim',
    nom: '',                      // À COMPLÉTER : nom de famille (affiché sur la page et les certificats)
    titre: 'Fondateur de NEXORA',
    photo: '',                    // À COMPLÉTER : chemin d'une photo carrée, ex. 'assets/img/ibrahim.jpg' (sinon monogramme)
    // Faits vérifiés uniquement. N'ajoutez que des éléments exacts et démontrables.
    presentation: [
      'Fondateur de NEXORA, agence digitale full-service présente en France, en Algérie et à l\'international.',
      'Sites web, référencement (SEO), production vidéo, publicité Google et Meta, création d\'entreprise et automatisation par l\'IA.',
      'Plus de 150 projets accompagnés.',
      'Création de vidéos générées par IA.'
    ],
    parcours: '',                 // À COMPLÉTER (facultatif) : votre parcours en 2–4 phrases, à la première personne
    chiffres: [
      { valeur: '150+', libelle: 'projets accompagnés' }
      // À COMPLÉTER (facultatif) : ajoutez uniquement des chiffres vérifiables, ex. { valeur: '…', libelle: '…' }
    ],
    liens: {                      // À COMPLÉTER : URL complètes ; laisser '' pour masquer
      site: '', linkedin: '', instagram: '', tiktok: '', youtube: '', github: ''
    }
  },

  agence: { nom: 'NEXORA', url: '' }, // À COMPLÉTER : site de l'agence

  contact: {
    email: '',                    // À COMPLÉTER : email de support (affiché sur la page, les CGV et l'espace membre)
    delaiReponse: '48 h ouvrées'
  },

  /* Offres. `lienPaiement` : lien Stripe Payment Link, Lemon Squeezy (checkout) ou Gumroad.
     Tant qu'un lien est vide, le bouton propose de laisser son email (liste d'attente).
     `prixBarre` : à n'utiliser que pour une vraie réduction, par rapport au prix le plus bas
     pratiqué dans les 30 jours précédents (Code de la consommation). Sinon, laisser null. */
  offres: [
    {
      id: 'essentiel', nom: 'Essentiel', prix: 97, prixBarre: null,
      resume: 'Maîtriser Claude et vendre vos premières prestations.',
      inclus: [
        'Modules 0 à 3 : Claude de zéro, prompting pro, production',
        'Modules 7 et 8 : vendre, business et légal en France',
        'Bibliothèque de 100+ prompts métiers',
        'Modèles (proposition, contrat, emails) et checklists',
        'Certificats de fin de module'
      ],
      lienPaiement: ''            // À COMPLÉTER
    },
    {
      id: 'pro', nom: 'Pro', prix: 197, prixBarre: null, recommandee: true,
      resume: 'Tout le programme, avec Claude Code, l\'API et la chaîne vidéo automatisée.',
      inclus: [
        'Tout l\'Essentiel',
        'Module 4 : Claude Code et agents',
        'Module 5 : API et automatisations + 5 workflows n8n à importer',
        'Module 6 : automatisation vidéo IA (le plus complet), avec le workflow de la chaîne vidéo',
        'Scripts vidéo de chaque leçon',
        'Certificat de fin de formation'
      ],
      lienPaiement: ''            // À COMPLÉTER
    },
    {
      id: 'vip', nom: 'VIP', prix: 497, prixBarre: null,
      resume: 'Le programme Pro et un accompagnement personnalisé.',
      inclus: [
        'Tout le programme Pro',
        // À COMPLÉTER / AJUSTER : décrivez précisément ce que vous livrez réellement.
        '2 séances individuelles en visio (1 h) avec Ibrahim',
        'Revue de votre offre et de votre page de vente',
        'Questions par email pendant 60 jours'
      ],
      lienPaiement: ''            // À COMPLÉTER
    }
  ],
  prixTTC: true,                  // true : prix affichés TTC ; mettre false + mention si TVA non applicable
  mentionTVA: '',                 // ex. 'TVA non applicable, art. 293 B du CGI' (franchise en base)

  /* Garantie commerciale facultative (en plus des garanties légales). */
  garantie: {
    active: true,
    jours: 14,
    conditions: 'Si la formation ne vous convient pas, écrivez-nous dans les 14 jours suivant l\'achat : nous vous remboursons intégralement, sans justification. Un seul remboursement par personne.'
  },

  /* Témoignages : UNIQUEMENT des avis réels, recueillis avec l'accord écrit de leur auteur.
     Laisser la liste vide masque la section. Format :
     { nom: 'Prénom N.', role: 'Métier, ville', texte: '…', date: '2026-11', lien: '' } */
  temoignages: [],

  /* Aimant à prospects (Netlify Forms, formulaire « aimant »). */
  aimant: {
    titre: 'Le mini-guide : 7 services IA à proposer ce mois-ci',
    description: 'Le module 0 et le module 1 de la formation, plus un guide de 7 services concrets à vendre avec Claude, avec pour chacun le livrable, les outils et la façon de le livrer.'
  },

  /* Espace membre. */
  cours: {
    scriptsVideo: 'tous',         // 'tous' : encart visible par les élèves ; 'formateur' : visible avec ?formateur=1 ; 'masques'
    // Vidéos des leçons (YouTube, Vimeo ou Bunny Stream), par identifiant « module-leçon ». Ex. :
    // 'm0-1': 'https://www.youtube-nocookie.com/embed/XXXXXXXX'
    videos: {},
    communaute: ''                // facultatif : lien vers une communauté (Discord, Circle, groupe WhatsApp…)
  },

  /* Mentions légales et CGV. */
  legal: {
    raisonSociale: '',            // À COMPLÉTER : nom de l'entreprise ou « Prénom Nom (EI) »
    formeJuridique: '',           // À COMPLÉTER : EI (micro-entreprise), SASU, SAS…
    capital: '',                  // si société : « 1 000 € »
    adresse: '',                  // À COMPLÉTER : adresse du siège
    siret: '',                    // À COMPLÉTER
    rcs: '',                      // si société : « RCS Toulouse 000 000 000 » (sinon laisser vide)
    tvaIntra: '',                 // n° de TVA intracommunautaire, si assujetti
    directeurPublication: '',     // À COMPLÉTER : en général le dirigeant
    telephone: '',                // À COMPLÉTER : exigé pour l'éditeur (LCEN)
    mediateur: {                  // À COMPLÉTER : médiateur de la consommation (obligatoire pour vendre aux particuliers)
      nom: '', site: '', adresse: ''
    },
    hebergeur: {                  // vérifiez l'adresse en vigueur sur netlify.com
      nom: 'Netlify, Inc.',
      adresse: '101 2nd Street, Suite 575, San Francisco, CA 94105, États-Unis',
      site: 'https://www.netlify.com'
    },
    outilEmailing: '',            // ex. 'Brevo (Sendinblue SAS, France)' si vous exportez les contacts vers un outil
    prestatairesPaiement: 'Stripe, Lemon Squeezy ou Gumroad selon l\'offre choisie',
    villeTribunal: '',            // facultatif : ville du tribunal compétent pour les litiges entre professionnels
    // À AJUSTER : conditions de l'accompagnement VIP (réservation, délai, annulation).
    conditionsAccompagnement: 'Les séances individuelles de l\'offre VIP se réservent par email et doivent être utilisées dans les 6 mois suivant l\'achat. Une séance annulée moins de 24 h à l\'avance est due.'
  }
};
