// Catalogue de la formation : modules, leçons et offre requise.
// Source unique utilisée par la page de vente (programme), l'espace membre (verrous)
// et les fonctions serveur (contrôle d'accès). Les titres doivent correspondre au contenu.

export const RANGS = { gratuit: 0, essentiel: 1, pro: 2, vip: 3 };
export const NOMS_OFFRES = { gratuit: 'Gratuit', essentiel: 'Essentiel', pro: 'Pro', vip: 'VIP' };

/** L'offre `detenue` donne-t-elle accès à un contenu qui exige `requise` ? */
export function offrePermet(detenue, requise) {
  return (RANGS[detenue] ?? -1) >= (RANGS[requise] ?? 99);
}

export const modules = [
  {
    id: 'm0', numero: 0, offre: 'gratuit', titre: 'Bienvenue',
    accroche: 'Comment tirer le maximum de la formation et votre plan d\'action sur 30 jours.',
    lecons: ['Comment suivre la formation', 'Votre plan d\'action 30 jours']
  },
  {
    id: 'm1', numero: 1, offre: 'gratuit', titre: 'Claude de zéro',
    accroche: 'Comptes et offres, interface, Projets, Artifacts, recherche, connecteurs, mémoire, styles et choix du modèle.',
    lecons: [
      'Comptes et offres : choisir sans se tromper',
      'L\'interface et les bons réflexes',
      'Les Projets : un espace par client',
      'Les Artifacts : produire des livrables',
      'Recherche web, recherche approfondie et connecteurs',
      'Mémoire, styles et confidentialité',
      'Quel modèle choisir, pour quelle tâche'
    ]
  },
  {
    id: 'm2', numero: 2, offre: 'essentiel', titre: 'Prompting professionnel',
    accroche: 'Structure, balises XML, exemples, rôles, chaînes de prompts et auto-évaluation. Avec la bibliothèque de 100+ prompts métiers.',
    lecons: [
      'Anatomie d\'un prompt professionnel',
      'Balises XML et documents longs',
      'Exemples et rôles',
      'Chaînes de prompts',
      'Auto-évaluation et itération',
      'Votre bibliothèque de prompts'
    ]
  },
  {
    id: 'm3', numero: 3, offre: 'essentiel', titre: 'Produire avec Claude',
    accroche: 'Rédaction et SEO, sites web, documents, présentations, analyse de données et service client.',
    lecons: [
      'Rédaction et SEO sans contenu creux',
      'Sites web : de l\'Artifact à la mise en ligne',
      'Documents et présentations',
      'Analyse de données',
      'Service client assisté',
      'Transformer une compétence en livrable vendable'
    ]
  },
  {
    id: 'm4', numero: 4, offre: 'pro', titre: 'Claude Code et agents',
    accroche: 'Installation, CLI, sessions cloud, CLAUDE.md, skills, connecteurs MCP, sous-agents, livraison client et Agent SDK.',
    lecons: [
      'Installer Claude Code',
      'La ligne de commande au quotidien',
      'Sessions cloud et multi-appareils',
      'CLAUDE.md : la mémoire du projet',
      'Skills et plugins',
      'Connecteurs MCP',
      'Sous-agents, hooks et workflows',
      'Livrer à un client et aller plus loin avec l\'Agent SDK'
    ]
  },
  {
    id: 'm5', numero: 5, offre: 'pro', titre: 'API et automatisations',
    accroche: 'API Messages (streaming, outils, cache, lots), n8n, Make, Zapier, webhooks et 5 automatisations complètes à importer.',
    lecons: [
      'Premiers pas avec l\'API Messages',
      'Streaming, outils et sorties structurées',
      'Cache de prompt et traitement par lots',
      'n8n, Make ou Zapier : brancher Claude',
      'Webhooks et fiabilité',
      'Plan 1 : qualification de prospects',
      'Plan 2 : réponses aux avis Google',
      'Plan 3 : devis automatiques',
      'Plan 4 : chatbot de site',
      'Plan 5 : veille automatisée'
    ]
  },
  {
    id: 'm6', numero: 6, offre: 'pro', titre: 'Automatisation vidéo IA',
    accroche: 'La chaîne complète : idée, script, voix, images et vidéos génératives, montage automatique, sous-titres, publication planifiée, business et légal.',
    lecons: [
      'La chaîne vidéo automatisée',
      'Idées et scripts avec Claude',
      'La voix avec ElevenLabs',
      'Images et vidéos génératives',
      'Montage automatique en HTML avec HyperFrames',
      'Remotion piloté par Claude Code, et les modèles CapCut',
      'Sous-titres et habillage',
      'Publication planifiée',
      'Piloter la chaîne depuis Claude avec les connecteurs MCP',
      'Modèles économiques : faceless, UGC, commerces locaux',
      'Légal : image, voix, deepfakes et AI Act'
    ]
  },
  {
    id: 'm7', numero: 7, offre: 'essentiel', titre: 'Vendre',
    accroche: 'Choisir son offre, fixer ses prix, prospecter, rédiger des propositions et des contrats, se construire un portfolio et des canaux d\'acquisition.',
    lecons: [
      'Choisir son offre',
      'Fixer ses prix',
      'Prospecter les commerces locaux : l\'exemple de Toulouse',
      'Des propositions commerciales qui signent',
      'Devis, contrats et CGV',
      'Portfolio et preuves honnêtes',
      'Acquisition : LinkedIn, TikTok et emailing conforme'
    ]
  },
  {
    id: 'm8', numero: 8, offre: 'essentiel', titre: 'Business et légal en France',
    accroche: 'Micro-entreprise ou SASU, facturation et TVA, RGPD avec l\'IA, et ce que l\'AI Act change pour vous.',
    lecons: [
      'Micro-entreprise ou SASU',
      'Facturation, TVA et facture électronique',
      'RGPD : les données clients avec l\'IA',
      'AI Act : ce qui vous concerne'
    ]
  }
];

export const bonus = {
  id: 'bonus', offre: 'essentiel', titre: 'Bonus',
  accroche: 'Bibliothèque de 100+ prompts métiers, modèles (proposition, contrat, emails) et checklists.',
  sections: ['Bibliothèque de prompts', 'Modèles prêts à adapter', 'Checklists']
};

/** Fichiers téléchargeables servis par la fonction `content` (chemins relatifs au dossier privé). */
export const fichiers = {
  'n8n/01-qualification-prospects.json': { module: 'm5', titre: 'Qualification de prospects' },
  'n8n/02-reponses-avis-google.json': { module: 'm5', titre: 'Réponses aux avis Google' },
  'n8n/03-devis-automatiques.json': { module: 'm5', titre: 'Devis automatiques' },
  'n8n/04-chatbot-site.json': { module: 'm5', titre: 'Chatbot de site' },
  'n8n/05-veille-automatisee.json': { module: 'm5', titre: 'Veille automatisée' }
};

export function trouverModule(id) {
  if (id === 'bonus') return bonus;
  return modules.find(m => m.id === id) || null;
}

export const totalLecons = modules.reduce((n, m) => n + m.lecons.length, 0);
