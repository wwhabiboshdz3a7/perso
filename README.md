# Lumio — plateforme de formation

Lumio est une plateforme de formation web, en français, entièrement statique : aucun serveur, aucune étape de build, aucune inscription. Elle s'ouvre dans un navigateur et se publie telle quelle sur Netlify (ou n'importe quel hébergement de fichiers).

## Parcours

**Programmation & informatique** — Python, JavaScript, HTML, CSS, C, C++, Cybersécurité, IA & machine learning (4 modules × 4 leçons chacun, du débutant au projet final), Git & ligne de commande (2 modules).

**Création de contenu avec l'IA** — Vidéo IA & création de contenu (5 modules × 4 leçons) : images, vidéo, voix et lipsync, formats courts, publicité, UGC, montage, droit et éthique.

**Business digital** — Créer son business digital (1 module) : site, SEO local, Google Business Profile, publicité Google/Meta, automatisation et création d'entreprise en France.

Au total : 40 modules, 160 leçons, 160 exercices, 480 questions de quiz.

## Fonctionnalités

- Théorie illustrée d'exemples commentés, mini-quiz corrigé avec explications sur chaque leçon.
- Éditeur de code intégré (CodeMirror) avec coloration par langage.
- Exécution dans le navigateur : JavaScript (Worker isolé avec délai maximal), Python (Pyodide, chargé à la demande), HTML et CSS (aperçu en direct).
- Vérification automatique des exercices par des tests qui expliquent ce qui manque ; solution commentée disponible après deux essais.
- Pour C et C++ : exercices « sortie attendue » avec comparaison à la solution et question de vérification, textes à trous, commandes de compilation locale.
- Pour la cybersécurité : labs défensifs (analyse d'en-têtes HTTP, hachage et chiffrement avec Web Crypto, détection d'injections, journaux, mini-CTF).
- Pour l'IA : algorithmes codés en Python pur (régression, descente de gradient, k-NN, perceptron, k-means, arbres, régression logistique) et notions LLM, prompting, RAG, agents.
- Progression locale (localStorage) : leçons terminées, XP, série quotidienne, badges ; page profil avec export/import JSON ; certificat imprimable par parcours terminé.
- Recherche globale, glossaire, mode sombre/clair, tailles de texte, raccourcis clavier, interface responsive.

## Structure

```
index.html          page unique (SPA, routage par hash : #/parcours/python, #/cours/python/3, #/profil…)
app/                application : app.js (vues, routage), runner.js (exécution JS/Python/HTML), editor.js, progress.js, style.css
content/            un module JavaScript par parcours (python.js, javascript.js, …), index.js (registre), glossaire.js, _outils.js (aides pour les tests)
vendor/             CodeMirror 5 et Pyodide servis localement (fonctionne hors CDN)
outils/stats.mjs    vérifie le chargement de chaque parcours et compte leçons, exercices et quiz
netlify.toml        configuration de publication (dossier racine)
```

## Lancer en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
node outils/stats.mjs   # vérification du contenu
```

## Ajouter une leçon

Chaque fichier de `content/` exporte un objet `{ description, intro, modules: [{ titre, niveau, lecons: [{ titre, theorie, exercice, quiz }] }] }`. Un exercice a un `type` (`code`, `sortie`, `trous`, `qcm`, `texte`) ; les exercices `code` déclarent un `langage` et une liste de `tests` construits avec les aides de `content/_outils.js`.

## Licence

Contenu et code publiés pour un usage pédagogique.
