import { code, sortieContient, sortieRegex, codeContient, codeRegex } from './_outils.js';

// Simulateur de terminal simplifié pour vérifier les commandes saisies.
const normCmd = s => s.trim().replace(/\s+/g, ' ');

export default {
  description: 'Le terminal et Git sont les outils quotidiens de tout développeur. Ce parcours t\'apprend à te déplacer en ligne de commande sans peur, puis à versionner ton code avec Git : commits, branches, fusions, GitHub et travail en équipe.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Les exercices te demandent d'écrire les bonnes commandes (vérifiées dans la page) ou de répondre à des QCM. Pour pratiquer en vrai : ouvre un terminal (Terminal sur macOS/Linux, Git Bash ou WSL sur Windows) et installe Git depuis <a href="https://git-scm.com" target="_blank" rel="noopener">git-scm.com</a>. Les commandes sont les mêmes partout.</p>`,
  modules: [
    {
      titre: 'La ligne de commande', niveau: 'Débutant', description: 'Le terminal, naviguer, manipuler fichiers et dossiers, les outils essentiels.',
      lecons: [
        {
          titre: 'Apprivoiser le terminal',
          theorie: `<p>Le <strong>terminal</strong> (ou shell, ou ligne de commande) est une interface textuelle pour piloter l'ordinateur. Là où une interface graphique montre des icônes à cliquer, le terminal attend des <em>commandes</em> tapées. C'est plus rapide, automatisable, et indispensable pour le développement, les serveurs et Git.</p>
<h2>L'invite de commande</h2>
${code('bash', `utilisateur@machine:~/projets$ 
# utilisateur@machine : qui et où ; ~/projets : dossier courant ; $ : prêt (# pour root)`)}
<p>On tape une commande, on appuie sur <kbd>Entrée</kbd>, elle s'exécute, le résultat s'affiche, et l'invite revient. Le shell le plus courant est <strong>bash</strong> (ou <strong>zsh</strong> sur macOS) ; les commandes de base sont identiques.</p>
<h2>Anatomie d'une commande</h2>
${code('bash', `ls -l -a /home        # commande  options(-l -a)  argument(/home)
ls -la /home          # options groupées : équivalent`)}
<p><strong>Commande</strong> : le programme à lancer. <strong>Options</strong> (ou drapeaux) : modifient le comportement, précédées de <code>-</code> (court) ou <code>--</code> (long : <code>--all</code>). <strong>Arguments</strong> : ce sur quoi la commande agit.</p>
<h2>Les premières commandes</h2>
<table><tr><th>Commande</th><th>Rôle</th></tr>
<tr><td><code>pwd</code></td><td>affiche le dossier courant (<em>print working directory</em>)</td></tr>
<tr><td><code>ls</code></td><td>liste le contenu (<code>ls -la</code> : tout, en détail)</td></tr>
<tr><td><code>cd dossier</code></td><td>change de dossier (<em>change directory</em>)</td></tr>
<tr><td><code>clear</code></td><td>efface l'écran (<kbd>Ctrl</kbd>+<kbd>L</kbd>)</td></tr>
<tr><td><code>echo "texte"</code></td><td>affiche du texte</td></tr>
<tr><td><code>man ls</code></td><td>manuel d'une commande (<kbd>q</kbd> pour quitter)</td></tr>
<tr><td><code>ls --help</code></td><td>aide rapide</td></tr></table>
<h2>Les raccourcis qui changent tout</h2>
<ul><li><kbd>Tab</kbd> : <strong>complétion automatique</strong> des noms de fichiers et commandes. À utiliser constamment : moins de fautes, plus de vitesse.</li><li><kbd>↑</kbd> / <kbd>↓</kbd> : naviguer dans l'historique des commandes.</li><li><kbd>Ctrl</kbd>+<kbd>C</kbd> : interrompre la commande en cours.</li><li><kbd>Ctrl</kbd>+<kbd>R</kbd> : rechercher dans l'historique.</li><li><kbd>Ctrl</kbd>+<kbd>A</kbd> / <kbd>Ctrl</kbd>+<kbd>E</kbd> : début / fin de ligne.</li></ul>
<h2>Pourquoi ça vaut le coup</h2>
<p>Au début, taper semble plus lent que cliquer. Mais le terminal permet de : répéter une action instantanément (flèche haut), enchaîner des commandes, traiter des centaines de fichiers d'un coup, travailler sur une machine distante (serveur) sans interface graphique, et surtout utiliser Git, Docker, npm, les compilateurs… qui sont d'abord des outils en ligne de commande.</p>
<div class="callout info"><b>Sans danger</b>Naviguer et lister ne modifie rien. Les commandes qui créent, déplacent ou suppriment sont explicites (leçon suivante) ; tant que tu ne les utilises pas, tu explores en toute sécurité.</div>`,
          exercice: {
            type: 'qcm', titre: 'Décoder une commande',
            enonce: `<p>Dans la commande <code>ls -la /home/ana</code>, que représente <code>/home/ana</code> ?</p>`,
            options: ['La commande', 'Une option', 'Un argument (le dossier à lister)', 'Le nom de l\'utilisateur'],
            bonne: 2,
            explication: '<code>ls</code> est la commande, <code>-la</code> les options groupées (tout, format long), et <code>/home/ana</code> l\'argument : le dossier sur lequel la commande agit.'
          },
          quiz: [
            { q: 'Quelle commande affiche le dossier courant ?', options: ['ls', 'pwd', 'cd'], bonne: 1, explication: 'pwd = print working directory.' },
            { q: 'À quoi sert la touche <kbd>Tab</kbd> dans le terminal ?', options: ['À effacer', 'À compléter automatiquement les noms', 'À interrompre'], bonne: 1, explication: 'La complétion évite les fautes de frappe et accélère énormément.' },
            { q: 'Comment interrompre une commande qui tourne ?', options: ['Ctrl+C', 'Ctrl+V', 'Entrée'], bonne: 0, explication: 'Ctrl+C envoie un signal d\'arrêt au programme en cours.' }
          ]
        },
        {
          titre: 'Naviguer dans les fichiers',
          theorie: `<p>Le système de fichiers est un <strong>arbre</strong> de dossiers imbriqués. Savoir s'y déplacer et désigner un fichier par son chemin est la compétence de base du terminal.</p>
<h2>Chemins absolus et relatifs</h2>
<ul><li><strong>Absolu</strong> : part de la racine <code>/</code>. <code>/home/ana/projets/site</code> désigne toujours le même endroit, d'où qu'on parte.</li><li><strong>Relatif</strong> : part du dossier courant. Si tu es dans <code>/home/ana</code>, <code>projets/site</code> désigne le même dossier.</li></ul>
<table><tr><th>Symbole</th><th>Signifie</th></tr>
<tr><td><code>/</code></td><td>la racine du système</td></tr>
<tr><td><code>~</code></td><td>ton dossier personnel (<code>/home/ana</code>)</td></tr>
<tr><td><code>.</code></td><td>le dossier courant</td></tr>
<tr><td><code>..</code></td><td>le dossier parent</td></tr>
<tr><td><code>-</code></td><td>le dossier précédent (<code>cd -</code>)</td></tr></table>
<h2>Se déplacer</h2>
${code('bash', `cd projets           # entre dans projets (relatif)
cd ..                # remonte d'un niveau
cd ../..             # remonte de deux niveaux
cd ~/projets/site    # chemin absolu depuis le dossier perso
cd                   # retourne au dossier personnel
cd -                 # revient au dossier précédent
pwd                  # vérifie où tu es`)}
<h2>Lister et explorer</h2>
${code('bash', `ls                   # contenu du dossier courant
ls -l                # format détaillé (droits, taille, date)
ls -la               # + fichiers cachés (commençant par .)
ls -lh               # tailles lisibles (Ko, Mo)
ls -lt               # trié par date de modification
ls projets/          # contenu d'un sous-dossier sans y entrer
tree                 # arborescence (si installé)`)}
<p>Dans <code>ls -l</code>, la première colonne (<code>drwxr-xr-x</code>) indique le type (<code>d</code> = dossier, <code>-</code> = fichier) et les permissions.</p>
<h2>Les jokers (globbing)</h2>
${code('bash', `ls *.txt             # tous les fichiers finissant par .txt
ls photo?.jpg        # photo1.jpg, photoA.jpg... (? = un caractère)
ls projet*           # tout ce qui commence par projet
ls **/*.js           # tous les .js dans l'arborescence (si activé)`)}
<h2>Lire un fichier sans l'ouvrir</h2>
${code('bash', `cat fichier.txt      # affiche tout le contenu
less fichier.txt     # parcourt (flèches, q pour quitter) : pour les gros fichiers
head -20 fichier.txt # les 20 premières lignes
tail -20 fichier.txt # les 20 dernières
tail -f journal.log  # suit un fichier qui grossit en temps réel
wc -l fichier.txt    # compte les lignes`)}
<div class="callout info"><b>Perdu ?</b><code>pwd</code> dit toujours où tu es, <code>cd ~</code> te ramène à la maison, <code>ls</code> montre ce qui t'entoure. Avec ces trois commandes et <kbd>Tab</kbd>, tu ne peux pas être vraiment perdu.</div>`,
          exercice: {
            type: 'texte', titre: 'Écrire les commandes de navigation',
            enonce: `<p>Tu es dans <code>/home/ana/projets</code>. Écris, une par ligne, les commandes pour : (1) remonter au dossier <code>ana</code> ; (2) depuis là, entrer dans <code>projets/site/css</code> ; (3) afficher le chemin courant ; (4) lister tous les fichiers y compris cachés en format détaillé. Utilise les commandes et symboles vus dans la leçon.</p>`,
            placeholder: 'cd ...\ncd ...\n...\n...',
            verif: t => {
              const l = t.toLowerCase().replace(/\s+/g, ' ');
              const ok1 = /cd \.\.(?![/.])|cd ~|cd \/home\/ana\b/.test(t);
              const ok2 = /cd (projets\/site\/css|~\/projets\/site\/css|\/home\/ana\/projets\/site\/css)/.test(t) || /cd projets\b[\s\S]*cd site[\s\S]*cd css/i.test(t);
              const ok3 = /\bpwd\b/.test(t);
              const ok4 = /ls -la|ls -al|ls -l -a|ls -a -l/.test(t);
              if (!ok1) return 'Étape 1 : remonte au parent avec cd .. (ou cd ~).';
              if (!ok2) return 'Étape 2 : entre dans projets/site/css.';
              if (!ok3) return 'Étape 3 : affiche le chemin courant avec pwd.';
              if (!ok4) return 'Étape 4 : liste tout en détail avec ls -la.';
              return true;
            },
            solution: `<pre><code class="language-bash">cd ..
cd projets/site/css
pwd
ls -la</code></pre><p>On aurait aussi pu écrire <code>cd ~/projets/site/css</code> directement, ou <code>cd ..</code> puis trois <code>cd</code> successifs.</p>`
          },
          quiz: [
            { q: 'Que désigne <code>..</code> ?', options: ['Le dossier courant', 'Le dossier parent', 'La racine'], bonne: 1, explication: '. est le dossier courant, .. le parent.' },
            { q: 'Que fait <code>cd ~</code> ?', options: ['Remonte d\'un niveau', 'Va au dossier personnel', 'Liste les fichiers'], bonne: 1, explication: '~ est un raccourci vers /home/utilisateur.' },
            { q: 'Que liste <code>ls *.txt</code> ?', options: ['Tous les fichiers', 'Les fichiers finissant par .txt', 'Les dossiers'], bonne: 1, explication: 'Le joker * remplace n\'importe quelle suite de caractères.' }
          ]
        },
        {
          titre: 'Créer, copier, déplacer, supprimer',
          theorie: `<p>Maintenant les commandes qui <em>modifient</em> le système de fichiers. Elles sont rapides et, pour certaines, <strong>sans corbeille</strong> : ce qui est supprimé en ligne de commande ne se récupère pas facilement. Prudence et vérification.</p>
<h2>Créer</h2>
${code('bash', `mkdir projet              # crée un dossier
mkdir -p site/css/vendor  # crée toute l'arborescence d'un coup (-p)
touch index.html          # crée un fichier vide (ou met à jour sa date)
touch a.txt b.txt c.txt   # plusieurs d'un coup
echo "Bonjour" > note.txt # crée le fichier avec du contenu (> écrase)
echo "Ligne 2" >> note.txt # >> ajoute à la fin`)}
<h2>Copier</h2>
${code('bash', `cp source.txt copie.txt        # copie un fichier
cp index.html sauvegarde/      # copie dans un dossier
cp -r dossier/ copie_dossier/  # copie un dossier et son contenu (-r : récursif)
cp *.css styles/               # copie tous les .css`)}
<h2>Déplacer et renommer</h2>
${code('bash', `mv ancien.txt nouveau.txt      # renomme (déplacer vers le même dossier)
mv fichier.txt archives/       # déplace dans un dossier
mv projet/ ~/documents/        # déplace un dossier
mv *.log logs/                 # déplace tous les .log`)}
<p><code>mv</code> sert à la fois à déplacer et à renommer : renommer, c'est « déplacer vers le même endroit avec un autre nom ».</p>
<h2>Supprimer — avec prudence</h2>
${code('bash', `rm fichier.txt            # supprime un fichier (DÉFINITIF)
rm -i fichier.txt         # demande confirmation (-i : interactif)
rm *.tmp                  # supprime tous les .tmp
rmdir dossier_vide        # supprime un dossier VIDE
rm -r dossier/            # supprime un dossier et TOUT son contenu
# rm -rf : force sans confirmation — la commande la plus dangereuse`)}
<div class="callout warn"><b>La règle d'or de <code>rm</code></b>Vérifie toujours <em>ce que tu vas supprimer</em> avant : lance d'abord un <code>ls</code> avec le même motif. <code>rm -rf /</code> ou un espace mal placé (<code>rm -rf / tmp</code> au lieu de <code>/tmp</code>) peuvent effacer tout un système. En cas de doute, <code>rm -i</code>.</div>
<h2>Permissions (aperçu)</h2>
${code('bash', `chmod +x script.sh       # rend un fichier exécutable
chmod 644 fichier        # lecture/écriture pour le propriétaire, lecture pour les autres
sudo commande            # exécute en administrateur (mot de passe demandé)`)}
<p><code>sudo</code> donne les droits d'administrateur : à n'utiliser que quand c'est nécessaire (installation système), jamais par habitude.</p>
<h2>Enchaîner et rediriger</h2>
${code('bash', `mkdir site && cd site          # && : exécute la 2e seulement si la 1re réussit
ls > liste.txt                 # redirige la sortie vers un fichier
cat *.txt | grep "erreur"      # | (pipe) : la sortie de l'une alimente l'autre
command1 ; command2            # exécute l'une après l'autre quoi qu'il arrive`)}
<div class="callout info"><b>Le pipe, cœur de la philosophie Unix</b>Chaque outil fait une chose et se combine avec les autres via <code>|</code>. <code>ls -l | grep ".js" | wc -l</code> compte les fichiers .js. C'est ce qui rend le terminal si puissant.</div>`,
          exercice: {
            type: 'texte', titre: 'Mettre en place un projet',
            enonce: `<p>Écris les commandes pour : (1) créer d'un coup l'arborescence <code>monsite/css</code> et <code>monsite/js</code> ; (2) créer le fichier vide <code>monsite/index.html</code> ; (3) copier <code>index.html</code> vers <code>monsite/css</code>… non : (3) renommer <code>monsite/index.html</code> en <code>monsite/accueil.html</code> ; (4) supprimer le dossier <code>monsite/js</code> et son contenu. Une commande par ligne.</p>`,
            placeholder: 'mkdir -p ...\n...',
            verif: t => {
              const ok1 = /mkdir -p (monsite\/css|monsite\/\{?css).*\b(monsite\/js|js)/.test(t) || (/mkdir -p monsite\/css/.test(t) && /mkdir -p monsite\/js/.test(t)) || /mkdir -p monsite\/\{css,js\}/.test(t);
              const ok2 = /touch monsite\/index\.html/.test(t);
              const ok3 = /mv monsite\/index\.html monsite\/accueil\.html/.test(t);
              const ok4 = /rm -r ?f? ?monsite\/js/.test(t.replace(/\s+/g, ' '));
              if (!ok1) return 'Étape 1 : crée monsite/css et monsite/js (mkdir -p).';
              if (!ok2) return 'Étape 2 : touch monsite/index.html.';
              if (!ok3) return 'Étape 3 : renomme avec mv monsite/index.html monsite/accueil.html.';
              if (!ok4) return 'Étape 4 : supprime le dossier avec rm -r monsite/js.';
              return true;
            },
            solution: `<pre><code class="language-bash">mkdir -p monsite/css
mkdir -p monsite/js
touch monsite/index.html
mv monsite/index.html monsite/accueil.html
rm -r monsite/js</code></pre><p>On peut créer les deux dossiers d'un coup avec <code>mkdir -p monsite/{css,js}</code>.</p>`
          },
          quiz: [
            { q: 'Que fait <code>mkdir -p a/b/c</code> ?', options: ['Crée seulement c', 'Crée toute l\'arborescence a/b/c', 'Erreur si a n\'existe pas'], bonne: 1, explication: 'L\'option -p crée tous les dossiers intermédiaires.' },
            { q: 'Quelle commande renomme un fichier ?', options: ['rename', 'mv', 'cp'], bonne: 1, explication: 'mv ancien nouveau : déplacer vers le même dossier avec un autre nom.' },
            { q: 'Pourquoi <code>rm</code> est-il dangereux ?', options: ['Il est lent', 'La suppression est définitive, sans corbeille', 'Il demande toujours confirmation'], bonne: 1, explication: 'Vérifie toujours avec ls avant ; utilise rm -i en cas de doute.' }
          ]
        },
        {
          titre: 'Chercher, filtrer et automatiser',
          theorie: `<p>La vraie puissance du terminal apparaît quand on cherche dans des fichiers, qu'on filtre des sorties et qu'on automatise des tâches répétitives. Quelques outils couvrent 90 % des besoins.</p>
<h2>Chercher des fichiers : find</h2>
${code('bash', `find . -name "*.js"               # tous les .js sous le dossier courant
find . -type f -name "test*"      # fichiers (type f) commençant par test
find . -type d -name node_modules # dossiers nommés node_modules
find . -name "*.log" -delete      # trouve et supprime (prudence !)
find . -mtime -7                  # modifiés il y a moins de 7 jours
find . -size +10M                 # fichiers de plus de 10 Mo`)}
<h2>Chercher dans les fichiers : grep</h2>
${code('bash', `grep "erreur" journal.log         # lignes contenant "erreur"
grep -i "erreur" journal.log      # insensible à la casse
grep -n "TODO" *.py               # avec numéros de ligne, dans tous les .py
grep -r "fonction" src/           # récursif dans un dossier
grep -c "GET" acces.log           # compte les lignes correspondantes
grep -v "debug" journal.log       # lignes NE contenant PAS "debug"
grep -E "erreur|alerte" log       # expression régulière (ou)`)}
<p><code>grep</code> accepte les expressions régulières (voir le parcours concerné) : un outil de recherche extrêmement puissant.</p>
<h2>Transformer un flux : les pipes</h2>
${code('bash', `cat acces.log | grep "404" | wc -l          # nombre de 404
ls -l | grep "^d"                           # seulement les dossiers
cat noms.txt | sort | uniq                  # trie et déduplique
cat acces.log | grep "GET" | sort | uniq -c | sort -rn | head
# ↑ compte les lignes GET uniques, trie par fréquence décroissante, top 10
history | grep git                          # retrouve tes commandes git passées`)}
<p>Chaque outil fait une chose ; le pipe <code>|</code> les enchaîne. <code>sort</code> (trier), <code>uniq</code> (dédupliquer, <code>-c</code> compter), <code>cut</code> (extraire des colonnes), <code>awk</code>/<code>sed</code> (transformer) composent des traitements puissants en une ligne.</p>
<h2>Variables et environnement</h2>
${code('bash', `nom="Ana"                    # variable (pas d'espaces autour du =)
echo "Bonjour $nom"          # Bonjour Ana
echo $HOME $USER $PATH       # variables d'environnement
export CLE_API="xyz"         # variable disponible pour les programmes lancés
which python3                # où se trouve un programme`)}
<h2>Scripts : automatiser</h2>
${code('bash', `#!/bin/bash
# sauvegarde.sh : archive le dossier passé en argument
dossier="$1"                        # premier argument
date=$(date +%Y-%m-%d)              # substitution de commande
tar -czf "sauvegarde-$date.tar.gz" "$dossier"
echo "Sauvegarde de $dossier terminée"`)}
${code('bash', `chmod +x sauvegarde.sh       # rendre exécutable
./sauvegarde.sh mon_projet   # lancer`)}
<p>Un script est un fichier texte de commandes. <code>#!/bin/bash</code> (shebang) indique l'interpréteur. On y met des variables, des conditions (<code>if</code>), des boucles (<code>for</code>), des arguments (<code>$1</code>, <code>$2</code>). C'est la porte d'entrée de l'automatisation : tâches répétitives, déploiements, traitements par lots.</p>
${code('bash', `for f in *.jpg; do echo "Image : $f"; done     # boucle sur des fichiers
if [ -f config.txt ]; then echo "config présente"; fi   # condition`)}
<div class="callout info"><b>Alias et personnalisation</b>Dans <code>~/.bashrc</code> (ou <code>~/.zshrc</code>), des alias accélèrent le quotidien : <code>alias gs="git status"</code>, <code>alias ll="ls -la"</code>. Recharge avec <code>source ~/.bashrc</code>. Avec le temps, tu te construis un environnement sur mesure.</div>`,
          exercice: {
            type: 'texte', titre: 'Construire une commande de recherche',
            enonce: `<p>Écris une seule ligne (avec des pipes) qui : affiche le contenu de <code>acces.log</code>, garde les lignes contenant <code>"erreur"</code> sans tenir compte de la casse, et compte combien il y en a. Puis, sur une deuxième ligne, écris la commande qui trouve tous les fichiers <code>.tmp</code> sous le dossier courant.</p>`,
            placeholder: 'cat ... | grep ... | ...\nfind ...',
            verif: t => {
              const l1 = /grep -i (["']?erreur["']?)/i.test(t) && /wc -l/.test(t) && /(cat acces\.log|acces\.log).*\|/.test(t);
              const alt1 = /grep -ic (["']?erreur["']?) acces\.log/i.test(t);
              const l2 = /find \.? ?-name ["']?\*\.tmp["']?|find \. -type f -name ["']?\*\.tmp/.test(t);
              if (!(l1 || alt1)) return 'Ligne 1 : cat acces.log | grep -i erreur | wc -l (ou grep -ic).';
              if (!l2) return 'Ligne 2 : find . -name "*.tmp".';
              return true;
            },
            solution: `<pre><code class="language-bash">cat acces.log | grep -i "erreur" | wc -l
find . -name "*.tmp"</code></pre><p>Plus court pour la première : <code>grep -ic "erreur" acces.log</code> (le <code>-c</code> compte directement).</p>`
          },
          quiz: [
            { q: 'Quelle commande cherche un texte DANS des fichiers ?', options: ['find', 'grep', 'ls'], bonne: 1, explication: 'grep cherche dans le contenu ; find cherche des fichiers par nom/attributs.' },
            { q: 'Que fait le pipe <code>|</code> ?', options: ['Il copie un fichier', 'Il envoie la sortie d\'une commande à l\'entrée de la suivante', 'Il supprime'], bonne: 1, explication: 'C\'est la base de la composition d\'outils sous Unix.' },
            { q: 'À quoi sert <code>#!/bin/bash</code> en tête d\'un script ?', options: ['À commenter', 'À indiquer l\'interpréteur à utiliser (shebang)', 'À exécuter le script'], bonne: 1, explication: 'Le shebang dit au système quel programme doit lire le script.' }
          ]
        }
      ]
    },
    {
      titre: 'Git : versionner et collaborer', niveau: 'Débutant', description: 'Commits, branches, fusions, GitHub et travail en équipe.',
      lecons: [
        {
          titre: 'Premier dépôt et premiers commits',
          theorie: `<p><strong>Git</strong> est un système de gestion de versions : il enregistre l'historique complet d'un projet, permet de revenir en arrière, de travailler à plusieurs sans s'écraser, et de comprendre qui a changé quoi, quand et pourquoi. Créé en 2005 pour le noyau Linux, c'est aujourd'hui l'outil universel du développement.</p>
<h2>Les trois zones</h2>
<ul><li><strong>Répertoire de travail</strong> : tes fichiers, tels que tu les modifies.</li><li><strong>Index</strong> (staging area) : la sélection des modifications prêtes à être enregistrées.</li><li><strong>Dépôt</strong> (.git) : l'historique des commits.</li></ul>
<p>Le flux : modifier → <code>git add</code> (mettre dans l'index) → <code>git commit</code> (enregistrer un instantané). L'index permet de composer des commits précis : une modification logique par commit.</p>
${code('bash', `git config --global user.name "Ana Sow"         # une fois pour toutes
git config --global user.email "ana@exemple.fr"

mkdir monprojet && cd monprojet
git init                        # crée le dépôt (.git)
echo "# Mon projet" > README.md
git status                      # fichier non suivi (untracked)
git add README.md               # dans l'index
git commit -m "Ajoute le README"   # instantané enregistré
git log --oneline               # historique : abc1234 Ajoute le README`)}
<h2>Le cycle quotidien</h2>
${code('bash', `git status                 # qu'est-ce qui a changé ?
git diff                   # détail des modifications non indexées
git add fichier.js         # ou git add . pour tout (vérifie avec status avant)
git diff --staged          # ce qui va être commité
git commit -m "Corrige le calcul de la TVA"
git log --oneline --graph  # historique compact`)}
<h2>Un bon message de commit</h2>
<p>Un titre court à l'impératif ou au présent (≤ 50 caractères) qui dit <em>quoi</em> et, si besoin, un corps qui dit <em>pourquoi</em> : « Corrige l'arrondi de la TVA sur les montants négatifs ». Un commit = un changement cohérent. « wip », « fix », « modifs » n'aident personne, toi compris dans six mois.</p>
<h2>Ignorer des fichiers</h2>
${code('bash', `# .gitignore
node_modules/
.env              # secrets : JAMAIS dans Git
*.log
.DS_Store
dist/`)}
<p>Un secret commité reste dans l'historique même après suppression : il faut le considérer comme compromis et le changer.</p>
<h2>Revenir en arrière</h2>
${code('bash', `git restore fichier.js          # annule les modifications non indexées d'un fichier
git restore --staged fichier.js # retire de l'index (garde les modifications)
git commit --amend              # corrige le dernier commit (message ou fichiers oubliés), s'il n'est pas partagé
git revert abc1234              # crée un commit qui annule un commit : sûr, même partagé
git log -p fichier.js           # historique détaillé d'un fichier`)}
<div class="callout info"><b>Commit souvent</b>Chaque étape qui fonctionne mérite un commit. C'est gratuit, et cela transforme toute expérimentation en « je peux toujours revenir ». Les commits locaux ne sont visibles que de toi jusqu'au push.</div>`,
          exercice: {
            type: 'texte', titre: 'Les premières commandes Git',
            enonce: `<p>Écris la suite de commandes pour : (1) initialiser un dépôt dans le dossier courant ; (2) ajouter le fichier <code>index.html</code> à l'index ; (3) créer un commit avec le message « Ajoute la page d'accueil » ; (4) afficher l'historique en une ligne par commit. Une commande par ligne.</p>`,
            placeholder: 'git init\n...',
            verif: t => {
              if (!/git init/.test(t)) return 'Étape 1 : git init.';
              if (!/git add (index\.html|\.)/.test(t)) return 'Étape 2 : git add index.html.';
              if (!/git commit -m ["'].*accueil.*["']/i.test(t)) return 'Étape 3 : git commit -m "Ajoute la page d\'accueil".';
              if (!/git log --oneline/.test(t)) return 'Étape 4 : git log --oneline.';
              return true;
            },
            solution: `<pre><code class="language-bash">git init
git add index.html
git commit -m "Ajoute la page d'accueil"
git log --oneline</code></pre>`
          },
          quiz: [
            { q: 'Que fait <code>git add</code> ?', options: ['Enregistre un commit', 'Place des modifications dans l\'index, prêtes à être commitées', 'Envoie sur GitHub'], bonne: 1, explication: 'L\'index permet de choisir précisément ce qui entre dans le prochain commit.' },
            { q: 'Un fichier <code>.env</code> contenant un mot de passe a été commité puis supprimé. Le secret est-il en sécurité ?', options: ['Oui, il est supprimé', 'Non : il reste dans l\'historique, il faut le changer', 'Oui si on fait un push'], bonne: 1, explication: 'L\'historique Git conserve tout ; le secret est compromis.' },
            { q: 'Quelle commande annule un commit déjà partagé de façon sûre ?', options: ['git reset --hard', 'git revert', 'git rm'], bonne: 1, explication: 'revert crée un nouveau commit inverse sans réécrire l\'historique.' }
          ]
        },
        {
          titre: 'Branches et fusions',
          theorie: `<p>Une <strong>branche</strong> est une ligne de développement indépendante. On y travaille sur une fonctionnalité ou une correction sans toucher à la branche principale (<code>main</code>), puis on <strong>fusionne</strong> quand c'est prêt. C'est ce qui permet d'expérimenter sans risque et de travailler à plusieurs.</p>
${code('bash', `git branch                        # liste les branches (* = courante)
git switch -c ajout-panier        # crée et bascule sur une nouvelle branche
# ... modifications, commits ...
git switch main                   # retour sur main
git merge ajout-panier            # intègre les commits de la branche dans main
git branch -d ajout-panier        # supprime la branche fusionnée`)}
<p>Une branche n'est qu'un pointeur vers un commit : créer une branche est instantané et gratuit. <code>HEAD</code> désigne la branche (ou le commit) sur laquelle tu te trouves.</p>
<h2>Deux types de fusion</h2>
<ul><li><strong>Fast-forward</strong> : si <code>main</code> n'a pas bougé depuis la création de la branche, Git avance simplement le pointeur. Historique linéaire.</li><li><strong>Commit de fusion</strong> : si les deux branches ont divergé, Git crée un commit avec deux parents qui combine les deux histoires.</li></ul>
<h2>Les conflits</h2>
<p>Quand les deux branches ont modifié <em>les mêmes lignes</em>, Git ne peut pas décider : c'est un <strong>conflit</strong>. Il marque le fichier :</p>
${code('text', `<<<<<<< HEAD
const tva = 0.2;
=======
const tva = 0.055;
>>>>>>> ajout-panier`)}
<p>On édite le fichier pour garder la bonne version (ou une combinaison), on retire les marqueurs, puis <code>git add fichier</code> et <code>git commit</code> pour terminer la fusion. <code>git merge --abort</code> annule tout. Les conflits ne sont pas des erreurs : c'est Git qui demande une décision humaine. Des commits petits et des fusions fréquentes les rendent rares et simples.</p>
<h2>Rebase : réécrire pour linéariser</h2>
${code('bash', `git switch ajout-panier
git rebase main            # rejoue les commits de la branche par-dessus main : historique linéaire`)}
<p><code>rebase</code> réécrit les commits (nouveaux identifiants). Règle : <strong>ne jamais rebaser une branche déjà partagée</strong> avec d'autres. Sur ses branches locales, c'est propre et pratique ; <code>git rebase -i</code> permet de fusionner, réordonner ou renommer des commits avant de les partager.</p>
<h2>Explorer</h2>
${code('bash', `git log --oneline --graph --all     # vue d'ensemble des branches
git diff main..ajout-panier         # différences entre branches
git stash                           # met de côté des modifications en cours (git stash pop pour les reprendre)
git switch -c correctif abc1234     # branche à partir d'un commit précis
git tag v1.0.0                      # étiquette une version`)}
<h2>Conventions de nommage</h2>
<p><code>feature/panier</code>, <code>fix/arrondi-tva</code>, <code>docs/readme</code> : un préfixe par type, des mots en minuscules séparés par des tirets. Une branche par tâche, courte durée de vie.</p>
<div class="callout info"><b>Expérimenter sans peur</b>Une idée risquée ? <code>git switch -c essai</code>. Ça marche : on fusionne. Ça ne marche pas : <code>git switch main && git branch -D essai</code>, et il ne s'est rien passé.</div>`,
          exercice: {
            type: 'texte', titre: 'Cycle d\'une branche',
            enonce: `<p>Écris les commandes pour : (1) créer et basculer sur une branche <code>fix/arrondi</code> ; (2) après tes commits, revenir sur <code>main</code> ; (3) fusionner <code>fix/arrondi</code> dans <code>main</code> ; (4) supprimer la branche fusionnée. Une commande par ligne (utilise <code>git switch</code>).</p>`,
            placeholder: 'git switch -c ...\n...',
            verif: t => {
              if (!/git (switch -c|checkout -b) fix\/arrondi/.test(t)) return 'Étape 1 : git switch -c fix/arrondi.';
              if (!/git (switch|checkout) main/.test(t)) return 'Étape 2 : git switch main.';
              if (!/git merge fix\/arrondi/.test(t)) return 'Étape 3 : git merge fix/arrondi.';
              if (!/git branch -d fix\/arrondi/.test(t)) return 'Étape 4 : git branch -d fix/arrondi.';
              return true;
            },
            solution: `<pre><code class="language-bash">git switch -c fix/arrondi
git switch main
git merge fix/arrondi
git branch -d fix/arrondi</code></pre>`
          },
          quiz: [
            { q: 'Qu\'est-ce qu\'une branche Git ?', options: ['Une copie du projet', 'Un pointeur léger vers un commit', 'Un dossier'], bonne: 1, explication: 'Créer une branche est instantané : aucune copie de fichiers.' },
            { q: 'Que signifie un conflit de fusion ?', options: ['Git a planté', 'Les deux branches ont modifié les mêmes lignes : décision humaine requise', 'La branche est corrompue'], bonne: 1, explication: 'On édite, on retire les marqueurs, on add puis on commit.' },
            { q: 'Quand ne faut-il JAMAIS utiliser rebase ?', options: ['Sur une branche locale', 'Sur une branche déjà partagée avec d\'autres', 'Le matin'], bonne: 1, explication: 'Le rebase réécrit l\'historique ; les collaborateurs auraient des historiques incompatibles.' }
          ]
        },
        {
          titre: 'GitHub : dépôts distants, push et pull',
          theorie: `<p>Git est distribué : chaque clone contient tout l'historique. Un <strong>dépôt distant</strong> (sur GitHub, GitLab, Bitbucket ou un serveur) sert de point de synchronisation entre machines et personnes, de sauvegarde et de vitrine.</p>
<h2>Publier un projet existant</h2>
${code('bash', `# Sur GitHub : « New repository », sans README (le projet existe déjà). Puis :
git remote add origin git@github.com:ana/monprojet.git   # nomme le distant « origin »
git branch -M main
git push -u origin main         # envoie et lie la branche locale à la distante (-u : une fois)
git push                        # ensuite, simplement`)}
<h2>Récupérer un projet</h2>
${code('bash', `git clone git@github.com:ana/monprojet.git    # copie complète avec historique
cd monprojet
git pull                        # récupère et fusionne les nouveautés du distant
git fetch                       # récupère sans fusionner (pour regarder d'abord : git log origin/main)`)}
<h2>HTTPS ou SSH ?</h2>
<p><strong>SSH</strong> : une paire de clés (<code>ssh-keygen -t ed25519</code>), la publique ajoutée dans les réglages GitHub ; plus de mot de passe à taper. <strong>HTTPS</strong> : jeton d'accès personnel (PAT) à la place du mot de passe. SSH est le choix confortable sur sa machine ; HTTPS pratique sur une machine de passage.</p>
<h2>Le flux de synchronisation</h2>
${code('bash', `git pull                         # 1. récupérer le travail des autres AVANT de commencer
git switch -c feature/x          # 2. travailler sur une branche
git add . && git commit -m "..."  # 3. commiter
git push -u origin feature/x     # 4. publier la branche
# 5. ouvrir une Pull Request sur GitHub (leçon suivante)`)}
<p>Si <code>git push</code> est refusé (« rejected »), c'est que le distant a avancé : <code>git pull</code> d'abord (fusion ou <code>git pull --rebase</code>), résous les éventuels conflits, puis <code>push</code>. Ne jamais <code>push --force</code> sur une branche partagée.</p>
<h2>Ce que GitHub ajoute</h2>
<ul><li><strong>Issues</strong> : suivi des bugs et idées, discussion.</li><li><strong>Pull Requests</strong> : revue de code avant fusion.</li><li><strong>Actions</strong> : intégration continue (tests, déploiement automatiques).</li><li><strong>Pages</strong> : hébergement gratuit de sites statiques.</li><li><strong>Releases</strong>, wiki, projets (kanban), sécurité (Dependabot).</li></ul>
<h2>README et licence</h2>
<p>Un <code>README.md</code> explique ce qu'est le projet, comment l'installer et l'utiliser ; c'est la première chose qu'on voit. Une <code>LICENSE</code> (MIT, Apache 2.0, GPL…) dit ce que les autres ont le droit de faire ; sans licence, personne n'a légalement le droit de réutiliser ton code.</p>
<div class="callout warn"><b>Public ou privé</b>Un dépôt public est visible de tous, y compris son historique complet. Vérifie l'absence de secrets avant de publier, et utilise <code>.gitignore</code> dès le premier commit.</div>`,
          exercice: {
            type: 'texte', titre: 'Publier et synchroniser',
            enonce: `<p>Écris les commandes pour : (1) ajouter un distant nommé <code>origin</code> à l'adresse <code>git@github.com:ana/site.git</code> ; (2) pousser la branche <code>main</code> en la liant au distant ; (3) plus tard, récupérer et fusionner les nouveautés du distant ; (4) cloner le dépôt <code>git@github.com:ana/outils.git</code> sur une autre machine.</p>`,
            placeholder: 'git remote add ...\n...',
            verif: t => {
              if (!/git remote add origin git@github\.com:ana\/site\.git/.test(t)) return 'Étape 1 : git remote add origin git@github.com:ana/site.git.';
              if (!/git push -u origin main|git push --set-upstream origin main/.test(t)) return 'Étape 2 : git push -u origin main.';
              if (!/git pull/.test(t)) return 'Étape 3 : git pull.';
              if (!/git clone git@github\.com:ana\/outils\.git/.test(t)) return 'Étape 4 : git clone git@github.com:ana/outils.git.';
              return true;
            },
            solution: `<pre><code class="language-bash">git remote add origin git@github.com:ana/site.git
git push -u origin main
git pull
git clone git@github.com:ana/outils.git</code></pre>`
          },
          quiz: [
            { q: 'Que fait <code>git clone</code> ?', options: ['Copie un seul fichier', 'Copie le dépôt complet avec tout son historique', 'Crée une branche'], bonne: 1, explication: 'Chaque clone est un dépôt Git entier.' },
            { q: 'Quelle différence entre <code>fetch</code> et <code>pull</code> ?', options: ['Aucune', 'fetch récupère sans fusionner, pull récupère et fusionne', 'pull est plus ancien'], bonne: 1, explication: 'fetch permet d\'inspecter avant d\'intégrer.' },
            { q: 'Un push est refusé (« rejected »). Que faire ?', options: ['git push --force', 'git pull, résoudre, puis push', 'Supprimer le dépôt'], bonne: 1, explication: 'Le distant a avancé : il faut intégrer son travail d\'abord. Jamais de force sur une branche partagée.' }
          ]
        },
        {
          titre: 'Travailler en équipe : Pull Requests et bonnes pratiques',
          theorie: `<p>À plusieurs, Git seul ne suffit pas : il faut un <strong>processus</strong>. Le plus répandu est le flux par <strong>Pull Request</strong> (ou Merge Request) : chaque changement passe par une branche, une revue et une intégration contrôlée.</p>
<h2>Le flux de travail standard</h2>
<ol><li><code>git pull</code> sur <code>main</code> pour partir à jour.</li><li>Créer une branche descriptive : <code>feature/export-csv</code>.</li><li>Commiter par petites étapes cohérentes.</li><li>Pousser la branche et ouvrir une <strong>Pull Request</strong> : titre clair, description (quoi, pourquoi, comment tester), captures si interface.</li><li>L'intégration continue lance tests et linters automatiquement.</li><li>Un collègue <strong>relit</strong> : commentaires, suggestions, approbation.</li><li>Corrections éventuelles (nouveaux commits sur la branche).</li><li>Fusion dans <code>main</code> (merge, squash ou rebase selon la convention de l'équipe), suppression de la branche.</li></ol>
<h2>Bien relire, bien se faire relire</h2>
<ul><li>Petites PR (&lt; 400 lignes) : relues vite et bien. Une grosse PR est approuvée sans être lue.</li><li>Relire pour : correction, lisibilité, tests, sécurité, cohérence avec le reste. Pas pour le style, qu'un formateur automatique impose.</li><li>Commentaires bienveillants et précis : « et si on extrayait cette logique dans une fonction ? » plutôt que « c'est mal fait ».</li><li>L'auteur ne fusionne pas sans approbation ; la branche <code>main</code> est protégée (pas de push direct, CI verte obligatoire).</li></ul>
<h2>Commits conventionnels</h2>
<p>Beaucoup d'équipes préfixent les messages : <code>feat:</code>, <code>fix:</code>, <code>docs:</code>, <code>refactor:</code>, <code>test:</code>, <code>chore:</code>. Cela permet de générer automatiquement un journal des changements et des numéros de version (<em>semantic versioning</em> : MAJEUR.MINEUR.CORRECTIF).</p>
<h2>Forker un projet open source</h2>
<p>Sans droit d'écriture sur un dépôt : on le <strong>forke</strong> (copie sur son compte), on clone son fork, on crée une branche, on pousse sur son fork, puis on ouvre une PR vers le dépôt d'origine. Pour garder le fork à jour : <code>git remote add upstream URL_origine</code> puis <code>git fetch upstream && git merge upstream/main</code>. Lis d'abord le fichier <code>CONTRIBUTING.md</code> du projet.</p>
<h2>Se sortir des situations courantes</h2>
<table><tr><th>Situation</th><th>Solution</th></tr>
<tr><td>Commité sur <code>main</code> au lieu d'une branche</td><td><code>git switch -c ma-branche</code> (emporte le commit), puis <code>git switch main && git reset --hard origin/main</code></td></tr>
<tr><td>Message de commit raté (non poussé)</td><td><code>git commit --amend</code></td></tr>
<tr><td>Fichier oublié dans le dernier commit (non poussé)</td><td><code>git add fichier && git commit --amend --no-edit</code></td></tr>
<tr><td>Tout casser localement, revenir au distant</td><td><code>git fetch && git reset --hard origin/main</code> (perd les modifications locales !)</td></tr>
<tr><td>Retrouver un commit « perdu »</td><td><code>git reflog</code> : journal de tout ce que HEAD a pointé</td></tr>
<tr><td>Savoir qui a écrit une ligne</td><td><code>git blame fichier</code></td></tr>
<tr><td>Trouver le commit qui a introduit un bug</td><td><code>git bisect</code> : recherche dichotomique dans l'historique</td></tr></table>
<div class="callout ok"><b>Parcours terminé</b>Terminal, fichiers, pipes et scripts ; dépôts, commits, branches, distants et Pull Requests : tu as l'outillage de base de tout développeur. Les autres parcours de Lumio s'appuient dessus : versionne tes projets dès maintenant, même seul — c'est l'habitude la plus rentable du métier.</div>`,
          exercice: {
            type: 'qcm', titre: 'Bonnes pratiques en équipe',
            enonce: `<p>Quelles pratiques sont recommandées dans un flux par Pull Request ? (plusieurs réponses)</p>`,
            options: ['Pousser directement sur main pour gagner du temps', 'Travailler sur une branche par tâche, courte', 'Faire une grosse PR par mois pour limiter les revues', 'Décrire dans la PR le quoi, le pourquoi et comment tester', 'Utiliser git push --force sur une branche partagée en cas de conflit', 'Protéger main : revue et CI verte obligatoires avant fusion'],
            bonne: [1, 3, 5], multiple: true,
            explication: 'Branches courtes, PR petites et bien décrites, main protégée. Le push direct sur main et le force push sur une branche partagée sont à proscrire.'
          },
          quiz: [
            { q: 'Qu\'est-ce qu\'une Pull Request ?', options: ['Une commande Git', 'Une demande d\'intégration d\'une branche, avec revue de code', 'Une sauvegarde'], bonne: 1, explication: 'C\'est une fonctionnalité des plateformes (GitHub, GitLab) autour de Git.' },
            { q: 'Pourquoi préférer de petites PR ?', options: ['Pour faire plus de commits', 'Parce qu\'elles sont relues vite et réellement', 'C\'est imposé par Git'], bonne: 1, explication: 'Une PR de 2 000 lignes est approuvée sans être lue.' },
            { q: 'Quelle commande retrouve un commit apparemment perdu ?', options: ['git lost', 'git reflog', 'git find'], bonne: 1, explication: 'reflog journalise tout ce que HEAD a pointé : rien n\'est vraiment perdu tant que le dépôt existe.' }
          ]
        }
      ]
    }
  ]
};
