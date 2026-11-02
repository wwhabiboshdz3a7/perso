import { cache, code, esc } from './_aides.mjs';

const CSS_BASE = `*{box-sizing:border-box}body{margin:0;font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f2430;background:#fbfaf7}a{color:inherit}
header{display:flex;justify-content:space-between;align-items:center;padding:16px 28px;border-bottom:1px solid #e7e2d9;flex-wrap:wrap;gap:10px}header b{font-size:1.2rem}nav a{margin-left:16px;text-decoration:none;opacity:.8}nav a:hover{opacity:1;text-decoration:underline}
main{max-width:860px;margin:0 auto;padding:28px}h1{font-size:2rem;line-height:1.2;margin:.2em 0 .4em}.btn{display:inline-block;padding:10px 18px;border-radius:10px;border:0;font:inherit;font-weight:600;cursor:pointer}
footer{padding:22px 28px;color:#777;font-size:.85rem;border-top:1px solid #e7e2d9;margin-top:40px}.carte{background:#fff;border:1px solid #e7e2d9;border-radius:14px;padding:20px;margin:14px 0}
input,select{font:inherit;padding:9px 12px;border-radius:9px;border:1px solid #cfc8bb;background:#fff;width:100%;margin:4px 0 12px}label{font-weight:600;font-size:.9rem}.ok{background:#e9f8f0;border:1px solid #9ad8b8;padding:14px 16px;border-radius:12px}.ko{background:#fdeeee;border:1px solid #f1b5b5;padding:14px 16px;border-radius:12px}
.flag{font-family:ui-monospace,Menlo,monospace;font-weight:700;background:#1f2430;color:#7ff0b8;padding:3px 8px;border-radius:6px}@media(max-width:600px){header{padding:12px 16px}main{padding:18px}nav a{margin:0 12px 0 0}}`;

const ceramique = {
  style: CSS_BASE + `body{background:#f6efe6}header{background:#efe3d3}.btn{background:#b5562f;color:#fff}.grille{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}.grille div{background:#fff;border-radius:14px;padding:16px;border:1px solid #e5d6c3}.pot{height:90px;border-radius:40% 40% 18px 18px;background:linear-gradient(#c97b4f,#8f4a2a);margin-bottom:10px}`,
  pages: {
    '/': { titre: 'Atelier Terre & Feu — céramique à Albi', html: `<header><b>Atelier Terre &amp; Feu</b><nav><a href="/">Accueil</a><a href="/stages">Stages</a><a href="/contact">Contact</a></nav></header>
<main><h1>Tournage, émaillage et cuisson raku</h1><p>Stages d'initiation le week-end, en petits groupes de 6. Tout le matériel est fourni.</p>
<!-- TODO avant la mise en ligne : retirer ce commentaire !
     Code promo interne pour les amis de l'atelier : LUMIO{le_code_source_est_public}
     (ne pas le communiquer, il donne -50 %) -->
<div class="grille"><div><div class="pot"></div><b>Initiation tour</b><br>2 jours · 180 €</div><div><div class="pot" style="filter:hue-rotate(160deg)"></div><b>Émaillage</b><br>1 jour · 95 €</div><div><div class="pot" style="filter:grayscale(1)"></div><b>Cuisson raku</b><br>1 jour · 120 €</div></div>
<p style="margin-top:20px"><a class="btn" href="/stages">Voir les dates</a></p></main><footer>Atelier Terre &amp; Feu · Albi (simulation pédagogique)</footer>` },
    '/stages': { titre: 'Stages — Atelier Terre & Feu', html: `<header><b>Atelier Terre &amp; Feu</b><nav><a href="/">Accueil</a><a href="/stages">Stages</a><a href="/contact">Contact</a></nav></header><main><h1>Prochaines dates</h1><div class="carte">12-13 avril · Initiation tour · <b>complet</b></div><div class="carte">26 avril · Émaillage · 2 places</div><div class="carte">3 mai · Raku · 4 places</div></main>` },
    '/contact': { titre: 'Contact — Atelier Terre & Feu', html: `<header><b>Atelier Terre &amp; Feu</b><nav><a href="/">Accueil</a><a href="/stages">Stages</a><a href="/contact">Contact</a></nav></header><main><h1>Contact</h1><p>Téléphone : 05 63 00 00 00 (fictif)</p></main>` }
  }
};

const mairie = {
  style: CSS_BASE + `header{background:#123a6b;color:#fff}nav a{color:#fff}.bandeau{background:#e8eef7;padding:12px 16px;border-radius:10px;border-left:4px solid #123a6b}`,
  pages: {
    '/': { titre: 'Commune de Saint-Lumin-sur-Mer', html: `<header><b>🏛 Saint-Lumin-sur-Mer</b><nav><a href="/">Accueil</a><a href="/demarches">Démarches</a><a href="/agenda">Agenda</a></nav></header><main><h1>Bienvenue sur le site de la commune</h1><p class="bandeau">Prochain conseil municipal : jeudi 18 h, salle des fêtes.</p><p>Retrouvez les démarches administratives, l'agenda des associations et les comptes rendus des conseils.</p></main><footer>Commune fictive de Saint-Lumin-sur-Mer (simulation pédagogique) · <a href="/mentions">Mentions légales</a></footer>` },
    '/demarches': { titre: 'Démarches', html: `<header><b>🏛 Saint-Lumin-sur-Mer</b><nav><a href="/">Accueil</a><a href="/demarches">Démarches</a><a href="/agenda">Agenda</a></nav></header><main><h1>Démarches</h1><ul><li>État civil</li><li>Urbanisme</li><li>Inscriptions scolaires</li></ul></main>` },
    '/agenda': { titre: 'Agenda', html: `<header><b>🏛 Saint-Lumin-sur-Mer</b><nav><a href="/">Accueil</a><a href="/demarches">Démarches</a><a href="/agenda">Agenda</a></nav></header><main><h1>Agenda</h1><p>Fête du port : 14 juillet.</p></main>` },
    '/mentions': { titre: 'Mentions légales', html: `<main><h1>Mentions légales</h1><p>Site fictif réalisé pour une simulation pédagogique.</p><p><a href="/">Retour</a></p></main>` },
    '/robots.txt': { type: 'text/plain', corps: `# Merci aux robots de ne pas indexer nos brouillons\nUser-agent: *\nDisallow: /espace-agents/\nDisallow: /brouillons-conseil-2025/\nSitemap: https://mairie-saint-lumin.example/sitemap.xml` },
    '/sitemap.xml': { type: 'text/plain', corps: '<?xml version="1.0"?>\n<urlset><url><loc>https://mairie-saint-lumin.example/</loc></url><url><loc>https://mairie-saint-lumin.example/demarches</loc></url><url><loc>https://mairie-saint-lumin.example/agenda</loc></url></urlset>' },
    '/espace-agents/': { statut: 403, titre: '403 — Accès refusé', html: '<main><h1>403</h1><p>Accès réservé aux agents (authentification requise).</p></main>' },
    '/brouillons-conseil-2025/': { titre: 'Brouillon — conseil municipal', html: `<main><h1>Brouillon du compte rendu (NE PAS PUBLIER)</h1><p>Point 4 : vote du budget du port. Mot de passe provisoire du Wi-Fi de la mairie à changer après la séance.</p><p>Référence du dossier : <span class="flag">LUMIO{robots_txt_nest_pas_un_coffre}</span></p><p><a href="/">Accueil</a></p></main>` }
  }
};

const escalade = {
  style: CSS_BASE + `body{background:#f2f5f3}header{background:#21483a;color:#fff}nav a{color:#fff}.btn{background:#21483a;color:#fff}.prises{height:80px;border-radius:12px;background:radial-gradient(circle at 20% 30%,#f59e0b 6px,transparent 7px),radial-gradient(circle at 60% 60%,#ef4444 7px,transparent 8px),radial-gradient(circle at 80% 20%,#3b82f6 6px,transparent 7px),radial-gradient(circle at 40% 80%,#10b981 6px,transparent 7px),#d9cbb5}`,
  cookies: { session: '7f3a91c2', role: 'membre' },
  pages: {
    '/': { titre: 'Club Vertical Toulouse', html: `<header><b>🧗 Club Vertical</b><nav><a href="/">Accueil</a><a href="/membres">Espace membres</a><a href="/admin">Administration</a></nav></header><main><div class="prises"></div><h1>Grimper ensemble, en salle et en falaise</h1><p>Bienvenue, tu es connecté·e en tant que <b>membre</b>.</p><p><a class="btn" href="/membres">Mon espace</a></p></main><footer>Club fictif (simulation pédagogique)</footer>` },
    '/membres': { titre: 'Espace membres', html: `<header><b>🧗 Club Vertical</b><nav><a href="/">Accueil</a><a href="/membres">Espace membres</a><a href="/admin">Administration</a></nav></header><main><h1>Espace membres</h1><div class="carte">Prochaine sortie : falaise d'Orgon, samedi.</div><div class="carte">Cotisation : à jour ✔</div></main>` },
    '/admin': [
      { si: { cookie: { role: 'admin' } }, titre: 'Administration', html: `<header><b>🧗 Club Vertical</b><nav><a href="/">Accueil</a><a href="/membres">Espace membres</a><a href="/admin">Administration</a></nav></header><main><h1>Administration du club</h1><div class="ok">Bienvenue, administrateur·rice. Clé de la salle des cordes : <span class="flag">LUMIO{ne_jamais_croire_un_cookie}</span></div><div class="carte">47 membres · 3 cotisations en retard</div></main>` },
      { titre: 'Accès refusé', statut: 403, html: `<header><b>🧗 Club Vertical</b><nav><a href="/">Accueil</a><a href="/membres">Espace membres</a><a href="/admin">Administration</a></nav></header><main><h1>Accès refusé</h1><div class="ko">Cette page est réservée au rôle <b>admin</b>. Ton rôle actuel : membre.</div></main>` }
    ]
  }
};

const festival = {
  style: CSS_BASE + `body{background:#14112a;color:#f4f1ff}header{border-color:#2d2752}main .carte{background:#1e1a3d;border-color:#2d2752;color:#f4f1ff}.btn{background:linear-gradient(90deg,#f43f5e,#a855f7);color:#fff}input,select{background:#14112a;color:#fff;border-color:#3b3470}.ok{color:#0b3d24}.ko{color:#5b1010}`,
  pages: {
    '/': { titre: 'Festival Garonne Sonore — billetterie', html: `<header><b>🎶 Garonne Sonore</b><nav><a href="/">Billetterie</a></nav></header><main><h1>Festival Garonne Sonore</h1><p>Trois jours de concerts au bord du fleuve.</p>
<form class="carte" action="/commande" method="get"><label for="billet">Billet</label><select id="billet" name="billet"><option value="pass3j">Pass 3 jours</option></select>
<input type="hidden" name="prix" value="89"><p>Prix : <b>89 €</b></p><button class="btn" type="submit">Commander</button></form></main><footer>Festival fictif (simulation pédagogique). Le paiement est simulé.</footer>` }
  },
  formulaires: {
    '/commande': [
      { si: { champ: { prix: { re: '^0+([.,]0*)?$' } } }, titre: 'Commande confirmée', html: `<main><h1>Commande confirmée</h1><div class="ok">Pass 3 jours — montant débité : <b>0,00 €</b>. Numéro de commande : <span class="flag">LUMIO{le_serveur_doit_recalculer_le_prix}</span></div><p><a href="/">Retour</a></p></main>` },
      { si: { champ: { prix: '89' } }, titre: 'Paiement', html: `<main><h1>Paiement</h1><div class="carte">Montant à régler : <b>89,00 €</b>. Le paiement est simulé : rien n'est débité. <br><br>Regarde bien l'adresse de cette page…</div><p><a href="/">Retour</a></p></main>` },
      { titre: 'Paiement', html: `<main><h1>Paiement</h1><div class="carte">Montant à régler : <b>{prix inattendu}</b>. Le serveur accepte n'importe quel prix… sauf qu'il faudrait payer quelque chose. Et si c'était gratuit ?</div><p><a href="/">Retour</a></p></main>` }
    ]
  }
};

// Authentification côté client avec un JavaScript « obscurci ».
const MDP = 'brique-rose-31';
const FLAG_JS = 'LUMIO{jamais_de_mot_de_passe_cote_client}';
const flagXor = [...FLAG_JS].map((c, i) => c.charCodeAt(0) ^ MDP.charCodeAt(i % MDP.length));
const intranet = {
  style: CSS_BASE + `body{background:#eef1f6}.boite{max-width:380px;margin:60px auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 20px 50px -20px rgba(20,30,60,.35)}.btn{background:#2f5bd3;color:#fff;width:100%}h1{font-size:1.4rem}.logo{font-weight:800;color:#2f5bd3;letter-spacing:.04em}`,
  pages: {
    '/': { titre: 'Intranet — Briqueterie Occitane', html: `<div class="boite"><p class="logo">BRIQUETERIE OCCITANE</p><h1>Intranet — connexion</h1>
<form id="f"><label for="u">Identifiant</label><input id="u" autocomplete="off"><label for="p">Mot de passe</label><input id="p" type="password"><button class="btn" type="submit">Se connecter</button></form><div id="r" style="margin-top:14px"></div></div>
<script src="/js/auth.js"></script>
<script>
var _0x4f2a=["\\x61\\x64\\x6d\\x69\\x6e","\\x76\\x61\\x6c\\x75\\x65","\\x67\\x65\\x74\\x45\\x6c\\x65\\x6d\\x65\\x6e\\x74\\x42\\x79\\x49\\x64"];
var _k=[${[...MDP].reverse().map(c => c.charCodeAt(0)).join(',')}];
var _f=[${flagXor.join(',')}];
function _v(a,b){var m=String.fromCharCode.apply(null,_k.slice().reverse());return a===_0x4f2a[0]&&b===m;}
document[_0x4f2a[2]]("f").addEventListener("submit",function(e){e.preventDefault();
var a=document[_0x4f2a[2]]("u")[_0x4f2a[1]],b=document[_0x4f2a[2]]("p")[_0x4f2a[1]],r=document[_0x4f2a[2]]("r");
if(_v(a,b)){var s="";for(var i=0;i<_f.length;i++){s+=String.fromCharCode(_f[i]^b.charCodeAt(i%b.length));}r.className="ok";r.innerHTML="Connexion réussie. Jeton d'accès : <span class=flag>"+s+"</span>";}
else{r.className="ko";r.textContent="Identifiant ou mot de passe incorrect.";}});
</script>` },
    '/js/auth.js': { type: 'text/plain', corps: '// Fichier vide : la vérification a été déplacée dans la page.\n' }
  }
};

const presse = {
  style: CSS_BASE + `header{background:#111;color:#fff}nav a{color:#fff}article{border-bottom:1px solid #e7e2d9;padding:14px 0}`,
  serveur: 'nginx/1.18.0 (Ubuntu)',
  entetes: { 'X-Powered-By': 'PHP/7.4.3', 'X-Debug-Token': 'LUMIO{les_entetes_parlent_trop}', 'Cache-Control': 'no-cache' },
  pages: {
    '/': { titre: 'Le Petit Lumin — journal local', html: `<header><b>📰 Le Petit Lumin</b><nav><a href="/">Une</a></nav></header><main><h1>À la une</h1><article><h2>Le port s'agrandit</h2><p>Les travaux commenceront à l'automne.</p></article><article><h2>Marché nocturne tous les jeudis</h2><p>Producteurs locaux et musique.</p></article></main><footer>Journal fictif (simulation pédagogique)</footer>` }
  }
};

export default [
  {
    id: 'web-source', categorie: 'web', titre: 'Le commentaire oublié', difficulte: 1, points: 100,
    accroche: 'Un site vitrine tout simple. Ce qu\'on ne voit pas à l\'écran, on le lit dans le code.',
    briefing: `<p class="dossier">Dossier WE-01 · Site d'un atelier de céramique (simulation)</p>
<p>Un atelier de céramique vient de mettre en ligne son site, fait à la main. Le développeur a la mauvaise habitude de laisser des notes dans son code. Le navigateur n'affiche pas tout ce que le serveur envoie…</p>
<p>Utilise le navigateur simulé : l'onglet <b>Code source</b> montre exactement le HTML reçu (comme <kbd>Ctrl</kbd>+<kbd>U</kbd> dans un vrai navigateur).</p>`,
    ressources: [{ type: 'web', titre: 'Navigateur simulé', depart: 'https://atelier-terre-feu.example/', sites: cache({ 'atelier-terre-feu.example': ceramique }) }],
    outils: [],
    indices: [{ cout: 20, texte: 'Clique sur l\'onglet « Code source » du navigateur simulé et lis le HTML de la page d\'accueil, ligne par ligne.' }, { cout: 20, texte: 'En HTML, un commentaire s\'écrit &lt;!-- … --&gt; : il n\'est pas affiché, mais il est bien envoyé à tous les visiteurs.' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{le_code_source_est_public}'],
    writeup: `<h3>1. Voir le code source</h3><p>Tout ce que le serveur envoie arrive dans le navigateur du visiteur : le HTML, le CSS, le JavaScript… et les <b>commentaires</b>. Dans un vrai navigateur : <kbd>Ctrl</kbd>+<kbd>U</kbd> ou clic droit → « Afficher le code source ».</p>
<h3>2. Le commentaire</h3>${code('html', '<!-- TODO avant la mise en ligne : retirer ce commentaire !\n     Code promo interne pour les amis de l\'atelier : LUMIO{le_code_source_est_public} -->')}
<h3>3. Leçon</h3><p>Les commentaires HTML, les fichiers <code>.map</code>, les variables JavaScript et les champs cachés sont lisibles par tous. Pour une vraie remise, le code promo doit être vérifié <b>côté serveur</b>, jamais envoyé au navigateur.</p>
<p>Flag : <code>LUMIO{le_code_source_est_public}</code></p>`,
    retenir: 'Rien de ce qui est envoyé au navigateur n\'est secret : on ne met jamais d\'information sensible dans le HTML, même en commentaire.'
  },
  {
    id: 'web-robots', categorie: 'web', titre: 'Les robots sont trop bavards', difficulte: 1, points: 100,
    accroche: 'Le fichier qui dit aux moteurs de recherche où ne pas aller… le dit aussi à tout le monde.',
    briefing: `<p class="dossier">Dossier WE-02 · Site d'une mairie fictive</p>
<p>La commune (fictive) de Saint-Lumin-sur-Mer ne veut pas que Google indexe ses brouillons de comptes rendus. Le webmestre a donc ajouté une règle pour les robots d'indexation. Mauvaise idée ?</p>
<p>Tous les sites peuvent publier un fichier à une adresse standard qui donne des consignes aux robots. Trouve-le dans le navigateur simulé.</p>`,
    ressources: [{ type: 'web', titre: 'Navigateur simulé', depart: 'https://mairie-saint-lumin.example/', sites: cache({ 'mairie-saint-lumin.example': mairie }) }],
    outils: [],
    indices: [{ cout: 20, texte: 'Ce fichier se trouve toujours à la racine du site et s\'appelle robots.txt. Tape l\'adresse dans la barre du navigateur simulé.' }, { cout: 30, texte: 'Les lignes « Disallow » listent les chemins que l\'on demande aux robots d\'éviter. Visite-les toi-même.' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{robots_txt_nest_pas_un_coffre}'],
    writeup: `<h3>1. Lire robots.txt</h3>${code('text', 'https://mairie-saint-lumin.example/robots.txt\n\nUser-agent: *\nDisallow: /espace-agents/\nDisallow: /brouillons-conseil-2025/')}
<p><code>robots.txt</code> est une <b>convention de politesse</b> pour les robots d'indexation : il ne bloque rien. Il donne même une liste des chemins que le propriétaire juge sensibles.</p>
<h3>2. Visiter les chemins</h3><p><code>/espace-agents/</code> répond <b>403</b> : il est réellement protégé par une authentification. En revanche <code>/brouillons-conseil-2025/</code> est accessible à tous : le brouillon contient le flag.</p>
<h3>3. Leçon</h3><p>En reconnaissance (test d'intrusion autorisé, bug bounty), <code>robots.txt</code> et <code>sitemap.xml</code> sont parmi les premières choses consultées. Pour protéger une page : authentification et contrôle d'accès côté serveur.</p>
<p>Flag : <code>LUMIO{robots_txt_nest_pas_un_coffre}</code></p>`,
    retenir: 'robots.txt n\'est pas un contrôle d\'accès : il sert à l\'indexation, pas à la sécurité.'
  },
  {
    id: 'web-entetes', categorie: 'web', titre: 'En-têtes bavards', difficulte: 1, points: 100,
    accroche: 'La page est banale. La réponse HTTP qui la transporte l\'est beaucoup moins.',
    briefing: `<p class="dossier">Dossier WE-03 · Journal local en ligne (simulation)</p>
<p>Avant d'afficher une page, le serveur envoie des <b>en-têtes HTTP</b> invisibles pour le lecteur : type de contenu, cache, cookies… et parfois des informations de débogage oubliées. Inspecte la réponse du serveur de ce petit journal.</p>`,
    ressources: [{ type: 'web', titre: 'Navigateur simulé', depart: 'https://lepetitlumin.example/', sites: cache({ 'lepetitlumin.example': presse }) }],
    outils: [],
    indices: [{ cout: 20, texte: 'L\'onglet « Réseau » du navigateur simulé affiche la requête envoyée et les en-têtes de la réponse.' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{les_entetes_parlent_trop}'],
    writeup: `<h3>1. Ouvrir l'onglet Réseau</h3><p>Dans un vrai navigateur : outils de développement (<kbd>F12</kbd>) → Réseau → clic sur la requête → En-têtes. En ligne de commande : <code>curl -I https://site</code>.</p>
${code('text', 'HTTP/1.1 200 OK\nServer: nginx/1.18.0 (Ubuntu)\nX-Powered-By: PHP/7.4.3\nX-Debug-Token: LUMIO{les_entetes_parlent_trop}')}
<h3>2. Trois fuites en une réponse</h3><ul><li><code>X-Debug-Token</code> : un en-tête de débogage oublié en production (le flag).</li><li><code>Server: nginx/1.18.0 (Ubuntu)</code> et <code>X-Powered-By: PHP/7.4.3</code> : les versions exactes, qui permettent de chercher des vulnérabilités connues (CVE).</li></ul>
<p>Flag : <code>LUMIO{les_entetes_parlent_trop}</code></p>`,
    retenir: 'En production : masquer les versions (server_tokens off, expose_php = Off) et supprimer les en-têtes de débogage.'
  },
  {
    id: 'web-cookie', categorie: 'web', titre: 'Un cookie trop crédule', difficulte: 2, points: 200,
    accroche: 'Le site te reconnaît comme « membre ». Et s\'il suffisait de le contredire ?',
    briefing: `<p class="dossier">Dossier WE-04 · Site d'un club d'escalade (simulation)</p>
<p>Le site du club distingue les membres et les administrateurs. Tu es connecté·e comme simple membre ; la page <code>/admin</code> te refuse l'accès. Le développeur a stocké le rôle de l'utilisateur… quelque part dans le navigateur.</p>
<p>Le navigateur simulé possède un onglet <b>Cookies</b> où tu peux lire et modifier les valeurs, comme dans les outils de développement d'un vrai navigateur.</p>`,
    ressources: [{ type: 'web', titre: 'Navigateur simulé', depart: 'https://club-vertical.example/', sites: cache({ 'club-vertical.example': escalade }) }],
    outils: [],
    indices: [{ cout: 30, texte: 'Ouvre l\'onglet Cookies : l\'un d\'eux s\'appelle « role ».' }, { cout: 30, texte: 'Remplace « membre » par « admin », enregistre, puis visite /admin.' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{ne_jamais_croire_un_cookie}'],
    writeup: `<h3>1. Observer</h3><p>L'onglet Cookies montre <code>session=7f3a91c2</code> et <code>role=membre</code>. Le serveur décide de l'accès à <code>/admin</code> en lisant… le cookie <code>role</code> envoyé par le navigateur.</p>
<h3>2. Modifier</h3><p>Un cookie est stocké <b>chez le client</b> : l'utilisateur peut le modifier librement (outils de développement, extension, proxy comme Burp). On passe <code>role</code> à <code>admin</code>, on recharge <code>/admin</code> : accès accordé.</p>
<h3>3. Corriger</h3><p>Le rôle doit être stocké <b>côté serveur</b>, associé à l'identifiant de session (aléatoire et long). Si une information doit transiter côté client, elle doit être <b>signée</b> (cookie signé, JWT vérifié avec une clé secrète) pour que toute modification soit détectée.</p>
<p>Flag : <code>LUMIO{ne_jamais_croire_un_cookie}</code></p>`,
    retenir: 'Tout ce qui vient du client (cookies, champs, en-têtes) peut être modifié : les décisions d\'autorisation se prennent côté serveur.'
  },
  {
    id: 'web-prix', categorie: 'web', titre: 'Le pass à zéro euro', difficulte: 2, points: 200,
    accroche: 'Une billetterie qui envoie le prix… depuis le navigateur.',
    briefing: `<p class="dossier">Dossier WE-05 · Billetterie d'un festival (simulation, paiement fictif)</p>
<p>La billetterie d'un festival fictif affiche un pass à 89 €. Un champ que tu ne vois pas à l'écran part avec la commande. Commande une fois normalement, observe l'adresse de la page de paiement… puis demande-toi ce que le serveur vérifie vraiment.</p>
<p class="muted">Ce type de test n'est autorisé que sur un site dont tu as la permission écrite (programme de bug bounty, audit). Ici, tout est simulé.</p>`,
    ressources: [{ type: 'web', titre: 'Navigateur simulé', depart: 'https://garonne-sonore.example/', sites: cache({ 'garonne-sonore.example': festival }) }],
    outils: [],
    indices: [{ cout: 30, texte: 'Le code source du formulaire contient un champ &lt;input type="hidden" name="prix" value="89"&gt;.' }, { cout: 30, texte: 'Le formulaire est envoyé en GET : les champs apparaissent dans l\'adresse (…/commande?billet=pass3j&amp;prix=89). Modifie la valeur de prix dans la barre d\'adresse.' }],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{le_serveur_doit_recalculer_le_prix}'],
    writeup: `<h3>1. Le champ caché</h3>${code('html', '<form action="/commande" method="get">\n  <select name="billet">…</select>\n  <input type="hidden" name="prix" value="89">')}
<p>« Caché » signifie seulement « non affiché ». La valeur part avec la commande.</p>
<h3>2. Modifier la requête</h3><p>Après une première commande, l'adresse devient <code>…/commande?billet=pass3j&amp;prix=89</code>. On remplace par <code>prix=0</code> : le serveur confirme la commande à 0,00 €. (Avec un formulaire en POST, on modifierait la requête avec les outils de développement ou un proxy d'interception.)</p>
<h3>3. Corriger</h3><p>Le serveur ne doit jamais faire confiance au prix envoyé par le client : il <b>recalcule</b> le montant à partir de l'identifiant du produit et de sa propre base de données. C'est une vulnérabilité de <b>logique métier</b>, fréquente dans les programmes de bug bounty.</p>
<p>Flag : <code>LUMIO{le_serveur_doit_recalculer_le_prix}</code></p>`,
    retenir: 'Champs cachés, paramètres d\'URL, corps de requête : tout est modifiable par le client. Le serveur recalcule et revalide tout.'
  },
  {
    id: 'web-js', categorie: 'web', titre: 'L\'intranet qui se vérifie tout seul', difficulte: 3, points: 300,
    accroche: 'Un formulaire de connexion dont le mot de passe est… dans la page.',
    briefing: `<p class="dossier">Dossier WE-06 · Intranet d'une briqueterie (simulation)</p>
<p>Une entreprise fictive a fait développer un « intranet » en vitesse. La page de connexion vérifie l'identifiant et le mot de passe… en JavaScript, dans le navigateur. Le développeur a « obscurci » son code pour qu'on ne le lise pas.</p>
<p>Trouve les identifiants dans le code source, connecte-toi, et récupère le jeton d'accès affiché.</p>`,
    ressources: [{ type: 'web', titre: 'Navigateur simulé', depart: 'https://intranet.briqueterie-occitane.example/', sites: cache({ 'intranet.briqueterie-occitane.example': intranet }) }],
    outils: ['boite'],
    indices: [
      { cout: 30, texte: 'Dans le code source, _0x4f2a[0] est écrit en séquences \\x.. : ce sont des codes hexadécimaux. 61 64 6d 69 6e → ? (Depuis hexadécimal dans la boîte à outils).' },
      { cout: 40, texte: '_k contient des codes de caractères (décimaux) à l\'envers : la fonction _v les remet à l\'endroit. Boîte à outils : Depuis codes décimaux → Inverser le texte.' },
      { cout: 50, texte: 'Identifiant : admin. Mot de passe : brique-rose-31. Connecte-toi dans l\'onglet Page.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: [FLAG_JS],
    writeup: `<h3>1. Lire le script</h3>${code('js', `var _0x4f2a=["\\x61\\x64\\x6d\\x69\\x6e","\\x76\\x61\\x6c\\x75\\x65","\\x67\\x65\\x74…"];
var _k=[${[...MDP].reverse().map(c => c.charCodeAt(0)).join(',')}];
function _v(a,b){var m=String.fromCharCode.apply(null,_k.slice().reverse());return a===_0x4f2a[0]&&b===m;}`)}
<p>L'« obscurcissement » se défait pas à pas :</p><ul><li><code>\\x61\\x64\\x6d\\x69\\x6e</code> = codes hexadécimaux de <b>admin</b> ; les deux autres chaînes sont <code>value</code> et <code>getElementById</code>.</li><li><code>_k</code> contient des codes décimaux ; <code>_v</code> les remet à l'endroit (<code>reverse</code>) puis les convertit en texte : <b>${esc(MDP)}</b>.</li></ul>
<h3>2. Se connecter</h3><p>Avec <code>admin</code> / <code>${esc(MDP)}</code>, le script déchiffre le tableau <code>_f</code> (XOR avec le mot de passe) et affiche le jeton. On aurait aussi pu faire le calcul soi-même, ou plus simplement… modifier <code>_v</code> pour qu'elle renvoie toujours <code>true</code> dans la console.</p>
<h3>3. Leçon</h3><p>Une vérification dans le navigateur n'est qu'une décoration : l'attaquant possède le code et peut le modifier. L'authentification se fait <b>côté serveur</b>, avec des mots de passe hachés (bcrypt, Argon2) et jamais stockés dans la page.</p>
<p>Flag : <code>${esc(FLAG_JS)}</code></p>`,
    retenir: 'L\'obscurcissement ralentit la lecture, il ne protège rien. Aucun secret ni aucune décision de sécurité dans le JavaScript côté client.'
  }
];
