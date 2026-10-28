// Registre des parcours. Chaque parcours est un module chargé à la demande.
const svg = {
  c: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 8a6 6 0 1 0 0 8"/></svg>',
  cpp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8a5 5 0 1 0 0 8M16 9v4M14 11h4M20 9v4M18 11h4"/></svg>',
  python: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6a2 2 0 0 1 2 2v4H9a2 2 0 0 0-2 2v2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4z"/><path d="M15 21H9a2 2 0 0 1-2-2v-4h8a2 2 0 0 0 2-2v-2h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4z"/></svg>',
  html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/></svg>',
  css: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l-1.5 14L12 20l-6.5-2z"/><path d="M8 9h8l-.4 5L12 15l-3.6-1-.2-2"/></svg>',
  javascript: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M10 9v6a2 2 0 0 1-3 1.7M14 16c0 1 3 1.5 3 0s-3-1.5-3-3 3-1.5 3-1"/></svg>',
  cyber: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
  ia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><circle cx="12" cy="12" r="2"/><path d="M7 12h3M14 11l3-4M14 13l3 4"/></svg>',
  git: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10 5-3v10l-5-3z"/><path d="M6 3h4M8 3v3"/></svg>',
  business: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18M5 20V9l7-5 7 5v11"/><path d="M9 20v-6h6v6"/></svg>'
};

export const parcours = [
  { slug: 'python', titre: 'Python', categorie: 'code', niveau: 'Débutant → avancé', couleur: '#3b82f6', icone: svg.python,
    description: 'Le langage idéal pour débuter : variables, fonctions, données, POO, et un projet final. Exercices exécutés dans ton navigateur.', charger: () => import('./python.js') },
  { slug: 'javascript', titre: 'JavaScript', categorie: 'code', niveau: 'Débutant → avancé', couleur: '#f59e0b', icone: svg.javascript,
    description: 'Le langage du web : DOM, événements, asynchrone, modules, et un projet d\'application complète.', charger: () => import('./javascript.js') },
  { slug: 'html', titre: 'HTML', categorie: 'code', niveau: 'Débutant → intermédiaire', couleur: '#ef4444', icone: svg.html,
    description: 'Structurer une page : balises, sémantique, formulaires, accessibilité et SEO. Aperçu en direct.', charger: () => import('./html.js') },
  { slug: 'css', titre: 'CSS', categorie: 'code', niveau: 'Débutant → avancé', couleur: '#8b5cf6', icone: svg.css,
    description: 'Mise en page moderne : sélecteurs, Flexbox, Grid, responsive, animations et design systems.', charger: () => import('./css.js') },
  { slug: 'c', titre: 'C', categorie: 'code', niveau: 'Débutant → avancé', couleur: '#64748b', icone: svg.c,
    description: 'Comprendre la machine : types, pointeurs, mémoire, fichiers, structures de données. Compilation locale avec gcc.', charger: () => import('./c.js') },
  { slug: 'cpp', titre: 'C++', categorie: 'code', niveau: 'Intermédiaire → avancé', couleur: '#0ea5e9', icone: svg.cpp,
    description: 'Du C au C++ moderne : classes, RAII, templates, STL, smart pointers et un projet orienté objet.', charger: () => import('./cpp.js') },
  { slug: 'cyber', titre: 'Cybersécurité', categorie: 'code', niveau: 'Débutant → avancé', couleur: '#10b981', icone: svg.cyber,
    description: 'Défense et bonnes pratiques : HTTP, chiffrement, injections, authentification, labs guidés et mini-CTF.', charger: () => import('./cyber.js') },
  { slug: 'ia', titre: 'IA & machine learning', categorie: 'code', niveau: 'Intermédiaire → avancé', couleur: '#ec4899', icone: svg.ia,
    description: 'Des maths au modèle : régression, perceptron, k-means codés à la main, puis LLM, prompts, RAG et agents.', charger: () => import('./ia.js') },
  { slug: 'git', titre: 'Git & ligne de commande', categorie: 'code', niveau: 'Débutant', couleur: '#f97316', icone: svg.git,
    description: 'Le terminal sans peur, puis Git : commits, branches, fusions, GitHub et travail en équipe.', charger: () => import('./git.js') },
  { slug: 'video-ia', titre: 'Vidéo IA & création de contenu', categorie: 'creation', niveau: 'Débutant → avancé', couleur: '#d946ef', icone: svg.video,
    description: 'Images et vidéos générées par IA, voix, montage, formats courts, publicité, UGC, workflow complet et éthique.', charger: () => import('./video-ia.js') },
  { slug: 'business', titre: 'Créer son business digital', categorie: 'business', niveau: 'Débutant', couleur: '#14b8a6', icone: svg.business,
    description: 'Site, SEO local, Google Business Profile, publicité Google/Meta, automatisation et création d\'entreprise en France.', charger: () => import('./business.js') }
];

export const categories = [
  { id: 'code', titre: 'Programmation & informatique', sous: 'Du premier programme au projet avancé' },
  { id: 'creation', titre: 'Création de contenu avec l\'IA', sous: 'Vidéo, image, voix, montage et diffusion' },
  { id: 'business', titre: 'Business digital', sous: 'Lancer et faire connaître son activité' }
];

const cache = {};
export async function chargerParcours(slug) {
  const p = parcours.find(x => x.slug === slug);
  if (!p) return null;
  if (!cache[slug]) cache[slug] = p.charger().then(m => {
    const d = m.default;
    d.lecons = [];
    d.modules.forEach((mod, mi) => mod.lecons.forEach((l, li) => { l.module = mi; l.indexModule = li; l.index = d.lecons.length + 1; d.lecons.push(l); }));
    return Object.assign(d, { slug: p.slug, titre: p.titre, couleur: p.couleur, icone: p.icone, categorie: p.categorie, niveau: p.niveau, description: d.description || p.description });
  });
  return cache[slug];
}
export function chargerTout() { return Promise.all(parcours.map(p => chargerParcours(p.slug))); }
