import { cache, code } from './_aides.mjs';

// Mini-Internet simulé de l'enquête : personnage, sites et comptes entièrement FICTIFS.
const IMG = 'assets/ctf/scenes/';
const img = (n, alt, extra = '') => `<img src="${IMG}${n}" alt="${alt}" loading="lazy" ${extra}>`;
const BASE = `*{box-sizing:border-box}body{margin:0;font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}a{color:inherit}img{max-width:100%;display:block}.fictif{font-size:12px;opacity:.65;text-align:center;padding:14px}`;

const pixelgram = {
  style: BASE + `body{background:#fafafa;color:#1b1b1f}.top{display:flex;align-items:center;gap:10px;padding:12px 20px;background:#fff;border-bottom:1px solid #e6e6ea;position:sticky;top:0}.logo{font-weight:800;font-size:20px;background:linear-gradient(90deg,#7c3aed,#f97316);-webkit-background-clip:text;background-clip:text;color:transparent}
.prof{max-width:760px;margin:0 auto;padding:24px 18px}.tete{display:flex;gap:24px;align-items:center;flex-wrap:wrap}.av{width:110px;height:110px;border-radius:50%;padding:3px;background:linear-gradient(45deg,#f97316,#7c3aed)}.av img{border-radius:50%;border:3px solid #fff;width:100%;height:100%;object-fit:cover}
.stats{display:flex;gap:18px;margin:6px 0}.bio{white-space:pre-line}.grille{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin-top:22px}.grille a{aspect-ratio:1;overflow:hidden;background:#ddd;display:block}.grille img{width:100%;height:100%;object-fit:cover}
.post{max-width:640px;margin:20px auto;background:#fff;border:1px solid #e6e6ea;border-radius:12px;overflow:hidden}.post .h{display:flex;gap:10px;align-items:center;padding:10px 14px}.post .h img{width:34px;height:34px;border-radius:50%}.post .c{padding:12px 14px}.com{padding:6px 14px;border-top:1px solid #f0f0f2;font-size:14px}.com b{margin-right:6px}`,
  pages: {
    '/ines.vldr': { titre: 'Inès V. (@ines.vldr) • Pixelgram', html: `<div class="top"><span class="logo">Pixelgram</span></div><div class="prof"><div class="tete"><div class="av">${img('osint-avatar.jpg', 'Photo de profil d\'Inès')}</div>
<div><h2 style="margin:0">ines.vldr</h2><div class="stats"><span><b>38</b> publications</span><span><b>412</b> abonnés</span><span><b>390</b> abonnements</span></div>
<div class="bio"><b>Inès V.</b>
Designer UX · ville rose 🧱
Vélo, cafés, escalade.
Ailleurs : même pseudo, avec un _ quand le point est interdit 😅
✉️ via mon blog : carnet-ines.example</div></div></div>
<div class="grille"><a href="/p/chat">${img('osint-chat.jpg', 'Un chat roux sur un canapé')}</a><a href="/p/lunettes">${img('osint-selfie.jpg', 'Selfie avec des lunettes de soleil')}</a><a href="/p/velo">${img('osint-velo.jpg', 'Un vélo devant un mur de brique')}</a></div></div><p class="fictif">Réseau social simulé — personnage fictif</p>` },
    '/p/chat': { titre: 'Publication • Pixelgram', html: `<div class="top"><span class="logo">Pixelgram</span></div><div class="post"><div class="h">${img('osint-avatar.jpg', '')}<a href="/ines.vldr"><b>ines.vldr</b></a></div>${img('osint-chat.jpg', 'Un chat roux endormi sur un canapé')}
<div class="c"><b>ines.vldr</b> Ma colocataire à quatre pattes 🐾 #chat #dimanche</div><div class="com"><b>lea.marty</b>Trop mignonne !! Elle s'appelle comment ?</div><div class="com"><b>ines.vldr</b>Je l'ai présentée sur Chirp il y a pas longtemps 😄</div><div class="com"><b>tom_fr</b>😍</div></div>` },
    '/p/lunettes': { titre: 'Publication • Pixelgram', html: `<div class="top"><span class="logo">Pixelgram</span></div><div class="post"><div class="h">${img('osint-avatar.jpg', '')}<a href="/ines.vldr"><b>ines.vldr</b></a></div>${img('osint-selfie.jpg', 'Selfie d\'Inès avec de grandes lunettes de soleil dans lesquelles se reflète une devanture')}
<div class="c"><b>ines.vldr</b> Nouvelles lunettes, petit-déj en terrasse, ma rue préférée ☀️ #toulouse #brunch</div><div class="com"><b>karim.dev</b>C'est où ce petit-déj ? Ça a l'air ouf</div><div class="com"><b>ines.vldr</b>Secret 🤫 (indice : regarde bien les lunettes 😎)</div></div>` },
    '/p/velo': { titre: 'Publication • Pixelgram', html: `<div class="top"><span class="logo">Pixelgram</span></div><div class="post"><div class="h">${img('osint-avatar.jpg', '')}<a href="/ines.vldr"><b>ines.vldr</b></a></div>${img('osint-velo.jpg', 'Un vélo jaune appuyé contre un mur de brique rose')}<div class="c"><b>ines.vldr</b> Nouveau vélo pour aller au studio 🚲</div></div>` }
  }
};

const chirp = {
  style: BASE + `body{background:#0f1720;color:#e6edf3}.top{padding:12px 20px;border-bottom:1px solid #22303c;font-weight:800;color:#2dd4bf;font-size:20px}.col{max-width:620px;margin:0 auto;border-left:1px solid #22303c;border-right:1px solid #22303c;min-height:100vh}
.ban{height:120px;background:linear-gradient(120deg,#0d9488,#1e3a8a)}.pr{padding:0 16px 14px;border-bottom:1px solid #22303c}.pr img{width:84px;height:84px;border-radius:50%;border:4px solid #0f1720;margin-top:-42px}.mute{color:#8b98a5}
.ch{display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid #22303c}.ch>img{width:42px;height:42px;border-radius:50%}.ch .t{white-space:pre-line}.ch .ph img{border-radius:14px;margin-top:8px;border:1px solid #22303c}`,
  pages: {
    '/ines_vldr': { titre: 'Inès V. (@ines_vldr) / Chirp', html: `<div class="top">Chirp</div><div class="col"><div class="ban"></div><div class="pr">${img('osint-avatar.jpg', 'Photo de profil')}<h2 style="margin:6px 0 0">Inès V.</h2><div class="mute">@ines_vldr · Toulouse · design, vélo, grimpe</div></div>
<div class="ch">${img('osint-avatar.jpg', '')}<div><b>Inès V.</b> <span class="mute">@ines_vldr · 3 mars</span><div class="t">Pause café avec vue ☕ Je ne me lasse pas de ce clocher en briques.</div><div class="ph">${img('osint-vue-pause.jpg', 'Vue depuis une fenêtre de bureau sur un grand clocher octogonal en brique')}</div></div></div>
<div class="ch">${img('osint-avatar.jpg', '')}<div><b>Inès V.</b> <span class="mute">@ines_vldr · 26 févr.</span><div class="t">Présentation officielle : voici Pistache 🐈, terreur des claviers et des plantes vertes.</div></div></div>
<div class="ch">${img('osint-avatar.jpg', '')}<div><b>Inès V.</b> <span class="mute">@ines_vldr · 12 févr.</span><div class="t">Tous les mots de passe du studio changés après l'incident de la semaine dernière. Gestionnaire de mots de passe + double authentification pour tout le monde 💪</div></div></div>
<div class="ch">${img('osint-avatar.jpg', '')}<div><b>Inès V.</b> <span class="mute">@ines_vldr · 2 janv.</span><div class="t">Bonne année ! Objectif 2025 : moins de réunions, plus de croquis.</div></div></div>
<p class="fictif">Réseau social simulé — personnage fictif</p></div>` }
  }
};

const blog = {
  style: BASE + `body{background:#fbf7f2;color:#2b2420;font-family:Georgia,"Times New Roman",serif}header{padding:28px 20px;text-align:center;border-bottom:1px solid #eadfd2}header h1{margin:0;font-size:28px}nav a{margin:0 10px;font-family:system-ui;font-size:14px}main{max-width:680px;margin:0 auto;padding:24px 20px}article{margin-bottom:26px}.date{font-family:system-ui;font-size:13px;color:#8a7c70}`,
  pages: {
    '/': { titre: 'Le carnet d\'Inès', html: `<header><h1>Le carnet d'Inès</h1><nav><a href="/">Articles</a><a href="/a-propos">À propos</a><a href="/contact">Contact</a></nav></header><main>
<article><p class="date">15 janvier 2024</p><h2>Refaire son portfolio en une semaine</h2><p>Ce que j'ai appris en reprenant mon site de zéro : moins de projets, mieux racontés.</p></article>
<article><p class="date">8 octobre 2022</p><h2>Dessiner des interfaces pour le vélo</h2><p>Lisibilité en plein soleil, gros boutons, gants d'hiver : le design mobile au guidon.</p></article></main><p class="fictif">Blog simulé — personnage fictif</p>` },
    '/a-propos': { titre: 'À propos — Le carnet d\'Inès', html: `<header><h1>Le carnet d'Inès</h1><nav><a href="/">Articles</a><a href="/a-propos">À propos</a><a href="/contact">Contact</a></nav></header><main><h2>À propos</h2><p>Je suis designer UX dans un studio toulousain. J'aime les interfaces simples, le vélo et les cafés de quartier.</p><p><i>Page mise à jour en janvier 2024 : j'ai retiré les détails de mes anciens projets, certains étaient confidentiels.</i></p></main>` },
    '/contact': { titre: 'Contact — Le carnet d\'Inès', html: `<header><h1>Le carnet d'Inès</h1><nav><a href="/">Articles</a><a href="/a-propos">À propos</a><a href="/contact">Contact</a></nav></header><main><h2>Contact</h2><p>Pour un projet ou un café : <b>ines.valadier@courriel.example</b></p><p>Je réponds en général sous 48 h.</p></main>` }
  }
};

const ANCIEN_APROPOS = `<header><h1>Le carnet d'Inès</h1><nav><a href="/">Articles</a><a href="/a-propos">À propos</a></nav></header><main><h2>À propos</h2><p>Salut ! Je m'appelle Inès Valadier, je suis designer junior à l'Agence Ciel d'Autan, à Toulouse.</p><p>En ce moment je travaille sur un projet top secret dont je ne peux rien dire… à part son nom de code : <b>Opération Cassoulet</b> 🤫 (lancement prévu à l'automne).</p><p>En dehors du travail : escalade le mardi, vélo tous les jours.</p></main>`;
const banniere = date => `<div style="background:#1f2937;color:#e5e7eb;font:13px system-ui;padding:8px 14px;display:flex;gap:12px;flex-wrap:wrap;align-items:center"><b style="color:#fbbf24">ARCHIVE DU WEB</b><span>Capture du ${date} de carnet-ines.example/a-propos</span><a href="https://archive-du-web.example/web/carnet-ines.example" style="color:#93c5fd">← toutes les captures</a></div>`;
const archive = {
  style: BASE + `body{background:#f3f4f6;color:#111827}.top{background:#111827;color:#fbbf24;padding:12px 20px;font-weight:800;letter-spacing:.06em}main{max-width:720px;margin:0 auto;padding:24px 18px}form{display:flex;gap:8px}input{flex:1;padding:10px;border:1px solid #cbd5e1;border-radius:8px;font:inherit}button{padding:10px 16px;border:0;border-radius:8px;background:#111827;color:#fff;font:inherit}
.an{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-top:16px}.an a{display:block;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;text-decoration:none}.an a:hover{border-color:#111827}.an b{display:block;font-size:22px}`,
  pages: {
    '/': { titre: 'Archive du Web', html: `<div class="top">ARCHIVE DU WEB</div><main><h2>Remonter le temps</h2><p>Entre l'adresse d'une page pour voir ses anciennes versions.</p><form action="/recherche" method="get"><input name="url" placeholder="ex. carnet-ines.example" aria-label="Adresse"><button>Chercher</button></form><p class="fictif">Service d'archives simulé (sur le modèle de la Wayback Machine)</p></main>` },
    '/web/carnet-ines.example': { titre: 'Captures — carnet-ines.example', html: `<div class="top">ARCHIVE DU WEB</div><main><h2>carnet-ines.example</h2><p>Page « À propos » : 3 captures entre 2021 et 2024.</p><div class="an"><a href="/web/20210312/carnet-ines.example/a-propos"><b>2021</b>12 mars</a><a href="/web/20220930/carnet-ines.example/a-propos"><b>2022</b>30 septembre</a><a href="/web/20240115/carnet-ines.example/a-propos"><b>2024</b>15 janvier</a></div></main>` },
    '/web/20210312/carnet-ines.example/a-propos': { titre: 'Archive du 12 mars 2021', html: banniere('12 mars 2021') + ANCIEN_APROPOS },
    '/web/20220930/carnet-ines.example/a-propos': { titre: 'Archive du 30 septembre 2022', html: banniere('30 septembre 2022') + `<header><h1>Le carnet d'Inès</h1></header><main><h2>À propos</h2><p>Designer UX à Toulouse. Après trois belles années à l'Agence Ciel d'Autan, je rejoins un studio indépendant.</p></main>` },
    '/web/20240115/carnet-ines.example/a-propos': { titre: 'Archive du 15 janvier 2024', html: banniere('15 janvier 2024') + `<header><h1>Le carnet d'Inès</h1></header><main><h2>À propos</h2><p>Je suis designer UX dans un studio toulousain. J'aime les interfaces simples, le vélo et les cafés de quartier.</p></main>` }
  },
  formulaires: {
    '/recherche': [
      { si: { champ: { url: { re: 'carnet-ines' } } }, titre: 'Captures — carnet-ines.example', html: `<div class="top">ARCHIVE DU WEB</div><main><p>Résultats pour <b>carnet-ines.example</b> : <a href="/web/carnet-ines.example">voir les 3 captures</a></p></main>` },
      { titre: 'Aucune capture', html: `<div class="top">ARCHIVE DU WEB</div><main><p>Aucune capture pour cette adresse dans la simulation. Essaie le blog d'Inès.</p><p><a href="/">Nouvelle recherche</a></p></main>` }
    ]
  }
};

const res = (titre, url, extrait) => `<div class="r"><a href="https://${url}"><span class="u">${url}</span><b>${titre}</b></a><p>${extrait}</p></div>`;
const trouvetout = {
  style: BASE + `body{background:#fff;color:#202124}.top{display:flex;gap:16px;align-items:center;padding:14px 20px;border-bottom:1px solid #ececec;flex-wrap:wrap}.logo{font-weight:800;font-size:22px;color:#2563eb}.logo span{color:#f59e0b}form{display:flex;flex:1;min-width:220px;max-width:560px}input{flex:1;padding:10px 16px;border:1px solid #dadce0;border-radius:24px 0 0 24px;font:inherit}button{padding:10px 16px;border:1px solid #dadce0;border-left:0;border-radius:0 24px 24px 0;background:#f8f9fa;font:inherit}
main{max-width:680px;padding:18px 20px}.r{margin-bottom:22px}.r a{text-decoration:none}.r .u{display:block;font-size:13px;color:#4d5156}.r b{font-size:19px;color:#1a0dab;font-weight:500}.r p{margin:4px 0 0;color:#4d5156;font-size:14px}`,
  pages: {
    '/': { titre: 'Trouvetout', html: `<div class="top"><span class="logo">Trouve<span>tout</span></span><form action="/recherche" method="get"><input name="q" placeholder="Rechercher sur le Web simulé" aria-label="Recherche"><button>🔍</button></form></div><main><p>Astuce : cherche un nom entre guillemets, un pseudo ou une adresse e-mail.</p><p class="fictif">Moteur de recherche simulé : il n'indexe que les sites fictifs de l'enquête.</p></main>` }
  },
  formulaires: {
    '/recherche': [
      { si: { champ: { q: { re: 'courriel\\.example|valadier@|ines\\.valadier' } } }, titre: 'Résultats — Trouvetout', html: `<div class="top"><span class="logo">Trouve<span>tout</span></span></div><main><p style="color:#70757a">2 résultats</p>
${res('notes 03/03 — CollePad', 'collepad.example/n8Qe2', 'Collé le 3 mars par un anonyme… ines.valadier@courriel.example … à faire : relancer le client, maquettes v3…')}
${res('Contact — Le carnet d\'Inès', 'carnet-ines.example/contact', 'Pour un projet ou un café : ines.valadier@courriel.example')}</main>` },
      { si: { champ: { q: { re: 'pistache' } } }, titre: 'Résultats — Trouvetout', html: `<div class="top"><span class="logo">Trouve<span>tout</span></span></div><main>${res('Inès V. (@ines_vldr) / Chirp', 'chirp.example/ines_vldr', 'Présentation officielle : voici Pistache 🐈, terreur des claviers…')}</main>` },
      { si: { champ: { q: { re: 'z[ée]phyr' } } }, titre: 'Résultats — Trouvetout', html: `<div class="top"><span class="logo">Trouve<span>tout</span></span></div><main>${res('Café Zéphyr — brunch et torréfaction (fictif)', 'trouvetout.example/', 'Petit-déjeuner, cafés de spécialité, terrasse en face d\'une boutique de lunettes. Établissement fictif de la simulation.')}</main>` },
      { si: { champ: { q: { re: 'valadier|in[eè]s|vldr' } } }, titre: 'Résultats — Trouvetout', html: `<div class="top"><span class="logo">Trouve<span>tout</span></span></div><main><p style="color:#70757a">3 résultats</p>
${res('Inès V. (@ines.vldr) • Pixelgram', 'pixelgram.example/ines.vldr', 'Designer UX · ville rose 🧱 Vélo, cafés, escalade…')}
${res('Le carnet d\'Inès', 'carnet-ines.example/', 'Refaire son portfolio en une semaine · Dessiner des interfaces pour le vélo…')}
${res('Inès V. (@ines_vldr) / Chirp', 'chirp.example/ines_vldr', 'Toulouse · design, vélo, grimpe')}</main>` },
      { titre: 'Résultats — Trouvetout', html: `<div class="top"><span class="logo">Trouve<span>tout</span></span></div><main><p>Aucun résultat pertinent dans le Web simulé. Essaie un nom, un pseudo ou une adresse e-mail trouvés pendant l'enquête.</p><p><a href="/">Nouvelle recherche</a></p></main>` }
    ]
  }
};

const ligne = (site, ok, url, note = '') => `<li class="${ok ? 'ok' : 'ko'}"><span>${ok ? '[+]' : '[-]'}</span> ${site} ${ok ? `<a href="https://${url}">${url}</a>` : `<i>${note || 'introuvable'}</i>`}</li>`;
const pseudoscan = {
  style: BASE + `body{background:#0b0f14;color:#c9d1d9;font-family:ui-monospace,Menlo,monospace}main{max-width:700px;margin:0 auto;padding:24px 18px}h1{color:#3ddc97;font-size:22px}form{display:flex;gap:8px}input{flex:1;background:#0b0f14;color:#fff;border:1px solid #30363d;border-radius:8px;padding:10px;font:inherit}button{background:#3ddc97;color:#06251a;border:0;border-radius:8px;padding:10px 14px;font:inherit;font-weight:700}
ul{list-style:none;padding:0}li{padding:4px 0}.ok span{color:#3ddc97}.ko{opacity:.55}.ko span{color:#ff6b6b}a{color:#79c0ff}`,
  pages: {
    '/': { titre: 'PseudoScan', html: `<main><h1>$ pseudoscan</h1><p>Vérifie si un pseudo existe sur les réseaux du Web simulé (sur le modèle de l'outil libre Sherlock).</p><form action="/scan" method="get"><input name="pseudo" placeholder="pseudo" aria-label="Pseudo"><button>Scanner</button></form><p class="fictif">Outil simulé</p></main>` }
  },
  formulaires: {
    '/scan': [
      { si: { champ: { pseudo: { re: '^\\s*@?ines\\.vldr\\s*$' } } }, titre: 'PseudoScan — ines.vldr', html: `<main><h1>$ pseudoscan ines.vldr</h1><ul>${ligne('Pixelgram', true, 'pixelgram.example/ines.vldr')}${ligne('Chirp', false, '', 'pseudo invalide : le point est interdit sur Chirp')}${ligne('CodeHub', false)}${ligne('Forum Grimpe Occitanie', false)}${ligne('VidéoTube', false)}</ul><p><a href="/">← nouveau scan</a></p></main>` },
      { si: { champ: { pseudo: { re: '^\\s*@?ines_vldr\\s*$' } } }, titre: 'PseudoScan — ines_vldr', html: `<main><h1>$ pseudoscan ines_vldr</h1><ul>${ligne('Pixelgram', false)}${ligne('Chirp', true, 'chirp.example/ines_vldr')}${ligne('CodeHub', false)}${ligne('Forum Grimpe Occitanie', true, 'pseudoscan.example/forum-grimpe', '')}${ligne('VidéoTube', false)}</ul><p><a href="/">← nouveau scan</a></p></main>` },
      { titre: 'PseudoScan', html: `<main><h1>$ pseudoscan</h1><p>Aucun compte trouvé pour ce pseudo. Pense aux variantes : point, tiret bas, chiffres.</p><p><a href="/">← nouveau scan</a></p></main>` }
    ]
  }
};
pseudoscan.pages['/forum-grimpe'] = { titre: 'Forum Grimpe Occitanie — ines_vldr', html: `<main><h1>Forum Grimpe Occitanie</h1><p><b>ines_vldr</b> — membre depuis 2019 · 42 messages</p><p>Dernier message : « Quelqu'un pour une sortie à Orgon samedi ? »</p><p class="fictif">Page simulée</p></main>` };

const collepad = {
  style: BASE + `body{background:#1e1e1e;color:#ddd;font-family:ui-monospace,Menlo,monospace}.top{background:#2d2d2d;padding:10px 18px;color:#f59e0b;font-weight:700}main{max-width:760px;margin:0 auto;padding:20px}pre{background:#111;border:1px solid #333;border-radius:8px;padding:14px;white-space:pre-wrap}.meta{color:#999;font-size:13px}`,
  pages: {
    '/n8Qe2': { titre: 'notes 03/03 — CollePad', html: `<div class="top">CollePad</div><main><h2>notes 03/03</h2><p class="meta">Collé par : Anonyme · 3 mars · Visibilité : PUBLIC · 1 027 vues</p><pre>À FAIRE
- relancer le client pour les retours (ines.valadier@courriel.example en copie)
- maquettes v3 de « Garonne Vélo » (refonte de l'appli de location) → livraison 14/03
- réserver la salle pour la démo
- mdp provisoire de la démo : ************ (à changer !!)
- acheter croquettes Pistache</pre><p class="meta">⚠ Ce paste est public : toute personne disposant du lien peut le lire.</p><p class="fictif">Service simulé — contenu fictif</p></main>` }
  }
};

const INTERNET = { 'pixelgram.example': pixelgram, 'chirp.example': chirp, 'carnet-ines.example': blog, 'archive-du-web.example': archive, 'trouvetout.example': trouvetout, 'pseudoscan.example': pseudoscan, 'collepad.example': collepad };
const web = (depart, titre = 'Navigateur d\'enquête (Web simulé)') => ({ type: 'web', titre, depart, sites: cache(INTERNET), description: 'Sites disponibles : <code>pixelgram.example</code>, <code>chirp.example</code>, <code>carnet-ines.example</code>, <code>archive-du-web.example</code>, <code>trouvetout.example</code> (moteur de recherche), <code>pseudoscan.example</code> (recherche de pseudo), <code>collepad.example</code>. Tape une adresse dans la barre.' });
const MANDAT = '<p><b>Cadre :</b> Inès Valadier (personnage fictif) a demandé un <b>audit de son exposition en ligne</b> et donné son accord écrit. Le but : lui montrer ce qu\'un inconnu peut apprendre sur elle, pour qu\'elle puisse corriger.</p>';

export default [
  {
    id: 'osint-pseudo', categorie: 'osint', titre: 'Le pseudo voyageur', difficulte: 1, points: 100,
    accroche: 'Un pseudo réutilisé d\'un réseau à l\'autre suffit à relier deux profils.',
    briefing: `<p class="dossier">Dossier OI-01 · Audit d'exposition en ligne</p>${MANDAT}
<p>Point de départ : son profil Pixelgram. Les questions de sécurité des banques demandent souvent… le nom d'un animal de compagnie. <b>Comment s'appelle le chat d'Inès ?</b></p>`,
    ressources: [web('https://pixelgram.example/ines.vldr')],
    outils: [],
    indices: [{ cout: 20, texte: 'Lis la bio Pixelgram et les commentaires sous la photo du chat : la réponse est sur un autre réseau.' }, { cout: 30, texte: 'Sur Chirp, le point est interdit dans les pseudos. Essaie ines_vldr dans pseudoscan.example, ou va directement sur chirp.example/ines_vldr.' }],
    validation: 'flag', format: 'Format : LUMIO{prenom_du_chat}',
    flags: ['LUMIO{pistache}'],
    writeup: `<h3>1. Lire le profil de départ</h3><p>La bio annonce : « Ailleurs : même pseudo, avec un _ quand le point est interdit ». Sous la photo du chat, Inès répond qu'elle l'a « présentée sur Chirp ».</p>
<h3>2. Pivoter sur le pseudo</h3><p>Un outil comme <b>Sherlock</b> (ici PseudoScan) teste un pseudo sur des centaines de sites. <code>ines.vldr</code> ne donne que Pixelgram ; la variante <code>ines_vldr</code> trouve Chirp (et un forum d'escalade).</p>
<h3>3. Trouver l'information</h3><p>Sur <code>chirp.example/ines_vldr</code>, le message du 26 février : « voici <b>Pistache</b> 🐈 ».</p>
<h3>Pour l'audit</h3><p>Le nom d'un animal est une réponse classique aux « questions secrètes » : à éviter comme protection. Conseil à Inès : des pseudos différents selon les usages, et pas de réponses réelles aux questions de sécurité.</p>
<p>Flag : <code>LUMIO{pistache}</code></p>`,
    retenir: 'Un pseudo identique (ou presque) sur plusieurs plateformes relie des identités : c\'est le pivot OSINT le plus courant.'
  },
  {
    id: 'osint-reflet', categorie: 'osint', titre: 'Dans les verres fumés', difficulte: 2, points: 200,
    accroche: 'Un selfie anodin… et une devanture qui se reflète, à l\'envers, dans les lunettes.',
    briefing: `<p class="dossier">Dossier OI-02 · Audit d'exposition en ligne</p>${MANDAT}
<p>Inès poste souvent depuis le même café, près de chez elle. Elle pense que ce selfie ne révèle rien (« Secret 🤫 »). Quel est le <b>nom de l'établissement</b> où elle prend son petit-déjeuner ?</p>`,
    ressources: [
      { type: 'image', titre: 'Selfie publié sur Pixelgram', src: IMG + 'osint-selfie.jpg', alt: 'Selfie d\'une femme avec de grandes lunettes de soleil ; un reflet est visible dans les verres', outils: ['image'], legende: 'Agrandis l\'image et utilise le bouton « Miroir ».' },
      web('https://pixelgram.example/p/lunettes')
    ],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'Le reflet dans un miroir (ou des lunettes) inverse la gauche et la droite : le texte se lit à l\'envers. Agrandis puis clique sur « Miroir ».' }, { cout: 40, texte: 'Le texte reflété est l\'enseigne du café d\'en face, au-dessus de la terrasse. Cherche ce nom dans trouvetout.example pour confirmer.' }],
    validation: 'flag', format: 'Format : LUMIO{nom_du_cafe}',
    flags: ['LUMIO{cafe_zephyr}', 'LUMIO{zephyr}', 'LUMIO{le_cafe_zephyr}'],
    writeup: `<h3>1. Repérer le reflet</h3><p>Les verres de lunettes de soleil, les vitrines, les écrans éteints et même les pupilles agissent comme des miroirs. Dans les verres, on distingue une enseigne et un store.</p>
<h3>2. Redresser</h3><p>Un reflet est inversé gauche-droite : on retourne l'image (bouton « Miroir » de la visionneuse, ou du labo image) et on zoome. L'enseigne se lit : <b>CAFÉ ZÉPHYR</b>.</p>
<h3>3. Confirmer</h3><p>Une recherche (ici dans Trouvetout) confirme qu'un établissement porte ce nom, avec une terrasse. En vrai, on recouperait avec une carte (Google Maps, OpenStreetMap) et des vues de rue (Mapillary, Street View).</p>
<h3>Pour l'audit</h3><p>Montrer à Inès ce reflet : associé à « ma rue préférée » et à « près de chez moi », il révèle son quartier et ses habitudes. Conseil : vérifier les reflets avant de publier, éviter de poster en direct depuis un lieu habituel.</p>
<p>Flag : <code>LUMIO{cafe_zephyr}</code> (Café Zéphyr est fictif.)</p>`,
    retenir: 'Reflets, vitres, écrans, objets en arrière-plan : une photo en dit plus que son sujet. On examine toujours l\'image en grand, et dans les deux sens.'
  },
  {
    id: 'osint-archive', categorie: 'osint', titre: 'Ce que la page disait avant', difficulte: 2, points: 200,
    accroche: 'Une page « À propos » nettoyée en 2024. Internet, lui, a gardé les anciennes versions.',
    briefing: `<p class="dossier">Dossier OI-03 · Audit d'exposition en ligne</p>${MANDAT}
<p>En 2024, Inès a retiré de son blog « les détails de ses anciens projets, certains confidentiels ». Les services d'archives du Web conservent pourtant des captures des pages publiques. Quel était le <b>nom de code du projet secret</b> mentionné autrefois ?</p>`,
    ressources: [web('https://carnet-ines.example/a-propos')],
    outils: [],
    indices: [{ cout: 30, texte: 'Va sur archive-du-web.example et cherche « carnet-ines.example ».' }, { cout: 30, texte: 'Compare les trois captures de la page À propos : la plus ancienne (2021) est la plus bavarde.' }],
    validation: 'flag', format: 'Format : LUMIO{nom_de_code}',
    flags: ['LUMIO{operation_cassoulet}', 'LUMIO{cassoulet}'],
    writeup: `<h3>1. Les archives du Web</h3><p>La <b>Wayback Machine</b> d'Internet Archive (web.archive.org), archive.today ou le cache des moteurs conservent des copies datées de pages publiques. Ici, l'« Archive du Web » simulée en propose trois pour la page À propos.</p>
<h3>2. Comparer les versions</h3><ul><li>15/01/2024 : version actuelle, nettoyée.</li><li>30/09/2022 : mentionne le départ de l'Agence Ciel d'Autan.</li><li><b>12/03/2021</b> : « je travaille sur un projet top secret… nom de code : <b>Opération Cassoulet</b> ».</li></ul>
<h3>Pour l'audit</h3><p>Supprimer une information ne la fait pas disparaître : il faut demander le retrait des captures (Internet Archive accepte les demandes du propriétaire du site) et, surtout, ne pas publier ce qui est confidentiel.</p>
<p>Flag : <code>LUMIO{operation_cassoulet}</code></p>`,
    retenir: 'Toujours consulter les anciennes versions d\'une page : ce qui a été retiré est souvent ce qui compte.'
  },
  {
    id: 'osint-fuite', categorie: 'osint', titre: 'Collé par erreur', difficulte: 3, points: 300,
    accroche: 'Une adresse e-mail, un moteur de recherche… et une note publique qui n\'aurait jamais dû l\'être.',
    briefing: `<p class="dossier">Dossier OI-04 · Audit d'exposition en ligne</p>${MANDAT}
<p>Inès craint d'avoir publié par erreur, sur un site de partage de texte, une note de travail. Elle ne se souvient plus du lien. Pars de son <b>adresse e-mail</b> (sur son blog) et retrouve la note. Quel est le <b>nom du projet client</b> qu'elle y mentionne ?</p>
<p class="muted">Règle d'or : si une note contient un mot de passe ou un code, on ne s'en sert jamais. On le signale à la personne concernée.</p>`,
    ressources: [web('https://carnet-ines.example/contact')],
    outils: [],
    indices: [{ cout: 30, texte: 'L\'adresse est sur la page Contact. Cherche-la, telle quelle, dans trouvetout.example.' }, { cout: 40, texte: 'Un résultat pointe vers collepad.example : ouvre-le et lis la liste de tâches.' }],
    validation: 'flag', format: 'Format : LUMIO{nom_du_projet}',
    flags: ['LUMIO{garonne_velo}'],
    writeup: `<h3>1. Pivot sur l'adresse e-mail</h3><p>Une adresse e-mail est un identifiant unique et stable : on la cherche entre guillemets dans les moteurs, dans les services de vérification de fuites (Have I Been Pwned, avec l'accord de la personne) et sur les sites de « paste ».</p>
<h3>2. La note</h3><p>Trouvetout renvoie vers <code>collepad.example/n8Qe2</code> : une note publique (1 027 vues) contenant le nom du projet <b>« Garonne Vélo »</b>, une date de livraison, et la mention d'un mot de passe (masqué ici).</p>
<h3>3. Conduite à tenir</h3><ul><li>Prévenir Inès : supprimer la note, changer le mot de passe mentionné, informer le client si nécessaire.</li><li>Ne jamais tenter d'utiliser un identifiant trouvé : c'est un accès frauduleux (art. 323-1 du Code pénal), même « pour vérifier ».</li></ul>
<p>Flag : <code>LUMIO{garonne_velo}</code></p>`,
    retenir: 'E-mail → moteurs, pastes, fuites : un identifiant unique ouvre de nombreuses pistes. Ce qu\'on y trouve se signale, ne s\'utilise pas.'
  },
  {
    id: 'osint-geo', categorie: 'osint', titre: 'La pause café avec vue', difficulte: 3, points: 300, sensibles: ['Saint-Sernin'],
    accroche: 'Une photo depuis la fenêtre du bureau. Un clocher très reconnaissable…',
    briefing: `<p class="dossier">Dossier OI-05 · Audit d'exposition en ligne</p>${MANDAT}
<p>Sur Chirp, Inès a publié la vue depuis la fenêtre de son bureau. Elle pense qu'on ne peut pas savoir où elle travaille. Montre-lui le contraire : <b>place ton repère sur le monument visible</b> au centre de la photo (le bureau est juste à côté).</p>`,
    ressources: [
      { type: 'image', titre: 'Photo publiée sur Chirp', src: IMG + 'osint-vue-pause.jpg', alt: 'Vue depuis une fenêtre : toits de tuiles et un grand clocher octogonal en brique à plusieurs étages d\'arcades, surmonté d\'une flèche', outils: ['image'] },
      web('https://chirp.example/ines_vldr')
    ],
    outils: ['image'],
    indices: [{ cout: 30, texte: 'Brique rose, clocher octogonal à étages d\'arcades : style toulousain (gothique méridional / roman). Inès précise d\'ailleurs « ville rose » dans sa bio.' }, { cout: 40, texte: 'C\'est le clocher de la plus grande église romane conservée d\'Europe, au nord du centre de Toulouse.' }, { cout: 50, texte: 'Basilique Saint-Sernin, Toulouse.' }],
    validation: 'carte', vue: [46.5, 2.5, 5],
    cible: { lieu: 'Basilique Saint-Sernin, Toulouse', points: [{ lat: 43.6084, lon: 1.4421 }], anneaux: [{ r: 300, part: 1 }, { r: 1500, part: 0.5 }, { r: 30000, part: 0 }] },
    writeup: `<h3>1. Réduire la zone</h3><p>La bio Pixelgram dit « ville rose » : Toulouse. Les toits de tuiles canal et la brique confirment le Sud-Ouest.</p>
<h3>2. Identifier le monument</h3><p>Le clocher est <b>octogonal</b>, en brique, avec cinq étages d'arcades (les trois premiers en plein cintre, romans, les deux derniers en arcs en mitre, typiques du gothique toulousain) et une flèche : c'est le clocher de la <b>basilique Saint-Sernin</b>, l'une des plus grandes églises romanes d'Europe, inscrite au patrimoine mondial de l'UNESCO (chemins de Compostelle). Une recherche « clocher octogonal brique Toulouse » ou une recherche d'image inversée le confirme.</p>
<h3>3. Placer</h3><p>La photo est prise depuis un étage élevé, à faible distance : le bureau d'Inès est dans le quartier Saint-Sernin / Arnaud-Bernard.</p>
<h3>Pour l'audit</h3><p>Combinée à « je vais au studio à vélo » et aux horaires des publications, cette photo permet de deviner où et quand trouver Inès. Conseil : éviter les vues identifiables depuis le lieu de travail ou le domicile, ou publier en différé.</p>`,
    retenir: 'Un monument célèbre dans le cadre suffit à géolocaliser à quelques centaines de mètres : la photo de « la vue » est l\'une des plus révélatrices.'
  }
];
void code;
