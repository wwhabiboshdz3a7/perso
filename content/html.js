import { code, dom, codeContient, codeRegex } from './_outils.js';

const page = (corps, head = '') => `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Exercice</title>${head ? '\n  ' + head : ''}
</head>
<body>
${corps}
</body>
</html>`;

export default {
  description: 'HTML décrit la structure et le sens d\'une page web. Ce parcours couvre les balises essentielles, la sémantique, les formulaires, les médias, l\'accessibilité et le référencement, avec un aperçu en direct pour chaque exercice.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Chaque exercice s'affiche en direct dans un aperçu à droite de l'éditeur. Les tests inspectent la page générée. Sur ton ordinateur : crée un fichier <code>index.html</code>, ouvre-le dans un navigateur, et utilise l'inspecteur (F12) pour explorer le résultat.</p>`,
  modules: [
    {
      titre: 'Fondations', niveau: 'Débutant', description: 'Structure d\'une page, texte, listes, liens, images et tableaux.',
      lecons: [
        {
          titre: 'Anatomie d\'une page HTML',
          theorie: `<p>HTML (<em>HyperText Markup Language</em>) n'est pas un langage de programmation : c'est un langage de <strong>balisage</strong>. On entoure du contenu de balises pour dire ce qu'il est : un titre, un paragraphe, un lien. Le navigateur en déduit l'affichage, les lecteurs d'écran la lecture, les moteurs de recherche le sens.</p>
<h2>Une balise</h2>
${code('html', `<p class="intro">Un paragraphe.</p>
<!-- balise ouvrante : <p>, contenu, balise fermante : </p>
     class="intro" est un attribut : nom="valeur" -->
<img src="photo.jpg" alt="Un chat roux">   <!-- balise « vide » : pas de fermante -->`)}
<p>Les noms de balises et d'attributs s'écrivent en minuscules. Les balises s'emboîtent sans se chevaucher : <code>&lt;p&gt;&lt;b&gt;ok&lt;/b&gt;&lt;/p&gt;</code>, jamais <code>&lt;p&gt;&lt;b&gt;&lt;/p&gt;&lt;/b&gt;</code>.</p>
<h2>Le squelette minimal</h2>
${code('html', `<!doctype html>                 <!-- mode standard du navigateur -->
<html lang="fr">                 <!-- langue : prononciation, traduction, césure -->
<head>
  <meta charset="utf-8">         <!-- encodage : accents corrects -->
  <meta name="viewport" content="width=device-width, initial-scale=1">  <!-- mobile -->
  <title>Ma page</title>         <!-- onglet, favoris, résultat Google -->
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Bienvenue</h1>
  <p>Contenu visible.</p>
  <script src="app.js" defer></script>
</body>
</html>`)}
<p><code>&lt;head&gt;</code> contient les métadonnées (invisibles), <code>&lt;body&gt;</code> le contenu affiché. Un seul <code>&lt;h1&gt;</code> par page, puis <code>&lt;h2&gt;</code>, <code>&lt;h3&gt;</code>… sans sauter de niveau : les titres forment le plan du document.</p>
<h2>Bloc et en ligne</h2>
<p>Les éléments de <strong>bloc</strong> (<code>p</code>, <code>h1</code>, <code>div</code>, <code>ul</code>, <code>section</code>) occupent toute la largeur et commencent sur une nouvelle ligne. Les éléments <strong>en ligne</strong> (<code>a</code>, <code>strong</code>, <code>em</code>, <code>span</code>, <code>img</code>) s'insèrent dans le texte. Un élément en ligne ne doit pas contenir de bloc.</p>
<h2>Commentaires et espaces</h2>
<p><code>&lt;!-- commentaire --&gt;</code> est ignoré. Les espaces et retours à la ligne multiples sont fusionnés en un seul espace : la mise en page vient du CSS, pas des espaces dans le code. Pour afficher des caractères spéciaux : <code>&amp;lt;</code> pour <code>&lt;</code>, <code>&amp;amp;</code> pour <code>&amp;</code>, <code>&amp;nbsp;</code> pour une espace insécable.</p>
<div class="callout info"><b>Valider son code</b>Le validateur du W3C (<a href="https://validator.w3.org" target="_blank" rel="noopener">validator.w3.org</a>) signale balises mal fermées, attributs inconnus et erreurs d'emboîtement. Prends l'habitude de l'utiliser.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Ma première page',
            enonce: `<p>Écris une page HTML complète et valide : doctype, <code>html lang="fr"</code>, <code>head</code> avec <code>meta charset</code>, viewport et un <code>title</code> « Mon carnet », puis un <code>body</code> contenant un <code>h1</code> « Carnet de voyage », un <code>h2</code> « Jour 1 » et au moins deux paragraphes sous ce titre.</p>`,
            depart: `<!doctype html>
<html>
  <!-- complète la page -->
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Mon carnet</title>
</head>
<body>
  <h1>Carnet de voyage</h1>
  <h2>Jour 1</h2>
  <p>Arrivée à Lisbonne sous le soleil. Premier café en terrasse.</p>
  <p>Promenade dans l'Alfama jusqu'au coucher du soleil.</p>
</body>
</html>`,
            tests: [dom('L\'attribut lang="fr" est présent sur html', d => d.documentElement.getAttribute('lang') === 'fr'), dom('meta charset utf-8', d => !!d.querySelector('meta[charset]') && d.querySelector('meta[charset]').getAttribute('charset').toLowerCase() === 'utf-8'), dom('meta viewport', d => !!d.querySelector('meta[name=viewport]')), dom('Le titre de l\'onglet est « Mon carnet »', d => d.title === 'Mon carnet'), dom('Un seul h1 « Carnet de voyage »', d => d.querySelectorAll('h1').length === 1 && d.querySelector('h1').textContent.trim() === 'Carnet de voyage'), dom('Un h2 « Jour 1 » suivi d\'au moins deux paragraphes', d => { const h = d.querySelector('h2'); if (!h || h.textContent.trim() !== 'Jour 1') return false; let n = 0, e = h.nextElementSibling; while (e) { if (e.tagName === 'P' && e.textContent.trim()) n++; e = e.nextElementSibling; } return n >= 2; }), codeRegex(/^\s*<!doctype html>/i, 'Le doctype est présent', 'Commence par <!doctype html>.')]
          },
          quiz: [
            { q: 'Où place-t-on la balise <code>&lt;title&gt;</code> ?', options: ['Dans body', 'Dans head', 'Avant html'], bonne: 1, explication: 'title est une métadonnée : elle va dans head et s\'affiche dans l\'onglet.' },
            { q: 'Combien de <code>&lt;h1&gt;</code> par page ?', options: ['Autant qu\'on veut', 'Un seul, le titre principal', 'Zéro, on utilise h2'], bonne: 1, explication: 'Un h1 unique structure le document pour l\'accessibilité et le référencement.' },
            { q: 'Quelle écriture est correcte ?', options: ['<p><em>texte</p></em>', '<p><em>texte</em></p>', '<em><p>texte</p></em>'], bonne: 1, explication: 'Les balises se ferment dans l\'ordre inverse de leur ouverture, et un élément en ligne (em) ne contient pas de bloc (p).' }
          ]
        },
        {
          titre: 'Texte, titres et listes',
          theorie: `<p>Le texte est le cœur du web. HTML fournit des balises pour en décrire la structure (titres, paragraphes, listes) et le sens (importance, emphase, citation, code).</p>
<h2>Titres et paragraphes</h2>
${code('html', `<h1>Guide du café</h1>
<p>Le café est une boisson <strong>stimulante</strong> appréciée <em>partout</em> dans le monde.</p>
<h2>Préparation</h2>
<h3>Espresso</h3>
<p>Extraction courte sous pression.<br>Temps : 25 à 30 secondes.</p>`)}
<p><code>&lt;strong&gt;</code> = importance (lu avec insistance par un lecteur d'écran), <code>&lt;em&gt;</code> = emphase. <code>&lt;b&gt;</code> et <code>&lt;i&gt;</code> existent mais sont purement visuels : préfère les versions sémantiques. <code>&lt;br&gt;</code> force un retour à la ligne (adresse, poème) ; ne l'utilise pas pour espacer des paragraphes.</p>
<h2>Listes</h2>
${code('html', `<ul>                         <!-- liste non ordonnée (puces) -->
  <li>Arabica</li>
  <li>Robusta</li>
</ul>
<ol start="1">               <!-- liste ordonnée (numéros) -->
  <li>Moudre</li>
  <li>Tasser</li>
  <li>Extraire
    <ul><li>25 s pour un simple</li></ul>   <!-- liste imbriquée : dans un li -->
  </li>
</ol>
<dl>                         <!-- liste de définitions -->
  <dt>Crema</dt>
  <dd>Mousse dorée à la surface d'un espresso.</dd>
</dl>`)}
<p>Règle : un <code>&lt;ul&gt;</code> ou <code>&lt;ol&gt;</code> ne contient <em>que</em> des <code>&lt;li&gt;</code>. Les menus de navigation sont des listes de liens.</p>
<h2>Citations et code</h2>
${code('html', `<blockquote cite="https://exemple.fr/source">
  <p>Le café doit être noir comme le diable et doux comme l'amour.</p>
</blockquote>
<p>Comme disait Talleyrand : <q>chaud comme l'enfer</q>.</p>
<p>Tapez <code>brew install</code> dans le terminal, puis <kbd>Entrée</kbd>.</p>
<pre>
  texte préformaté : espaces
      et retours conservés
</pre>`)}
<h2>Autres balises de texte utiles</h2>
<table><tr><th>Balise</th><th>Sens</th></tr>
<tr><td><code>&lt;small&gt;</code></td><td>mentions légales, notes</td></tr>
<tr><td><code>&lt;mark&gt;</code></td><td>surlignage (résultat de recherche)</td></tr>
<tr><td><code>&lt;abbr title="…"&gt;</code></td><td>abréviation avec sa signification</td></tr>
<tr><td><code>&lt;time datetime="2026-03-01"&gt;</code></td><td>date ou heure lisible par machine</td></tr>
<tr><td><code>&lt;sup&gt;</code>, <code>&lt;sub&gt;</code></td><td>exposant, indice</td></tr>
<tr><td><code>&lt;hr&gt;</code></td><td>changement de sujet (trait)</td></tr>
<tr><td><code>&lt;span&gt;</code></td><td>conteneur en ligne neutre (pour styler)</td></tr></table>
<div class="callout info"><b>Sens avant apparence</b>Choisis la balise pour ce que le contenu <em>est</em>, jamais pour l'aspect qu'elle donne. L'aspect se règle en CSS.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Une recette structurée',
            enonce: `<p>Dans le <code>body</code> : un <code>h1</code> « Pancakes », un paragraphe d'introduction contenant un mot en <code>strong</code>, un <code>h2</code> « Ingrédients » suivi d'une liste non ordonnée d'au moins 4 ingrédients, un <code>h2</code> « Étapes » suivi d'une liste ordonnée d'au moins 3 étapes, et une citation en <code>blockquote</code>.</p>`,
            depart: page(`  <!-- ta recette ici -->`),
            solution: page(`  <h1>Pancakes</h1>
  <p>Des pancakes <strong>moelleux</strong> en quinze minutes, parfaits pour le petit-déjeuner.</p>
  <h2>Ingrédients</h2>
  <ul>
    <li>200 g de farine</li>
    <li>2 œufs</li>
    <li>30 cl de lait</li>
    <li>1 sachet de levure</li>
  </ul>
  <h2>Étapes</h2>
  <ol>
    <li>Mélanger les ingrédients secs.</li>
    <li>Ajouter les œufs et le lait, fouetter.</li>
    <li>Cuire à la poêle une minute par face.</li>
  </ol>
  <blockquote><p>Le secret, c'est de ne pas trop mélanger la pâte.</p></blockquote>`),
            tests: [dom('h1 « Pancakes »', d => d.querySelector('h1')?.textContent.trim() === 'Pancakes'), dom('Un paragraphe avec un strong', d => !!d.querySelector('p strong')), dom('Liste non ordonnée de 4 ingrédients ou plus', d => [...d.querySelectorAll('ul')].some(u => u.querySelectorAll(':scope > li').length >= 4)), dom('Liste ordonnée de 3 étapes ou plus', d => [...d.querySelectorAll('ol')].some(o => o.querySelectorAll(':scope > li').length >= 3)), dom('Deux h2 : Ingrédients puis Étapes', d => { const t = [...d.querySelectorAll('h2')].map(h => h.textContent.trim()); return t.includes('Ingrédients') && t.includes('Étapes'); }), dom('Une citation blockquote', d => !!d.querySelector('blockquote') && d.querySelector('blockquote').textContent.trim().length > 5), dom('Les listes ne contiennent que des li', d => [...d.querySelectorAll('ul, ol')].every(l => [...l.children].every(c => c.tagName === 'LI')))]
          },
          quiz: [
            { q: 'Quelle balise indique qu\'un mot est important ?', options: ['<b>', '<strong>', '<span>'], bonne: 1, explication: 'strong porte un sens (importance) ; b est purement visuel.' },
            { q: 'Que peut contenir directement un <code>&lt;ul&gt;</code> ?', options: ['Des p', 'Uniquement des li', 'N\'importe quoi'], bonne: 1, explication: 'Les enfants directs d\'une liste sont des éléments de liste ; le reste va dans les li.' },
            { q: 'Comment écrire une liste imbriquée ?', options: ['Un ul à l\'intérieur d\'un li', 'Un ul après le ul', 'Deux ul côte à côte'], bonne: 0, explication: 'La sous-liste appartient à l\'élément parent : elle est placée dans son li.' }
          ]
        },
        {
          titre: 'Liens et images',
          theorie: `<p>Les liens font du web un <em>hypertexte</em> ; les images lui donnent sa richesse. Les deux balises ont des attributs importants pour l'accessibilité et la performance.</p>
<h2>Les liens</h2>
${code('html', `<a href="https://developer.mozilla.org">MDN</a>              <!-- absolu -->
<a href="contact.html">Contact</a>                           <!-- relatif au fichier courant -->
<a href="/produits/cafe.html">Café</a>                        <!-- relatif à la racine du site -->
<a href="#tarifs">Voir les tarifs</a>                         <!-- ancre vers id="tarifs" -->
<a href="mailto:bonjour@exemple.fr">Écrire</a>
<a href="tel:+33600000000">Appeler</a>
<a href="rapport.pdf" download>Télécharger le rapport</a>
<a href="https://autre.site" target="_blank" rel="noopener noreferrer">Nouvel onglet</a>`)}
<p>Texte du lien : explicite et lisible hors contexte. « Cliquez ici » n'aide personne ; « Consulter les horaires d'ouverture » si. <code>target="_blank"</code> s'accompagne toujours de <code>rel="noopener"</code> (sécurité et performance).</p>
<h2>Les images</h2>
${code('html', `<img src="images/chat.jpg" alt="Chat roux endormi sur un canapé" width="800" height="600" loading="lazy">`)}
<ul><li><code>alt</code> est <strong>obligatoire</strong> : description pour les lecteurs d'écran et si l'image ne charge pas. Décris ce que l'image apporte ; pour une image purement décorative : <code>alt=""</code> (vide, pas absent).</li>
<li><code>width</code> et <code>height</code> réservent l'espace et évitent que la page « saute » au chargement.</li>
<li><code>loading="lazy"</code> diffère le chargement des images hors écran.</li></ul>
<h2>Formats</h2>
<table><tr><th>Format</th><th>Usage</th></tr><tr><td>JPEG</td><td>photos, compression avec perte</td></tr><tr><td>PNG</td><td>transparence, captures, logos simples</td></tr><tr><td>WebP / AVIF</td><td>modernes, 30 à 50 % plus légers</td></tr><tr><td>SVG</td><td>vectoriel : icônes, logos, infiniment net</td></tr><tr><td>GIF</td><td>à éviter (lourd) ; préférer une vidéo</td></tr></table>
<h2>Images responsives</h2>
${code('html', `<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Vue du port au lever du soleil" width="1200" height="600">
</picture>

<img src="petit.jpg" srcset="petit.jpg 480w, moyen.jpg 960w, grand.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw" alt="…">`)}
<p>Le navigateur choisit le format supporté et la taille adaptée à l'écran.</p>
<h2>Légendes</h2>
${code('html', `<figure>
  <img src="graphique.png" alt="Courbe des ventes 2025, en hausse de 20 %">
  <figcaption>Figure 1 : évolution des ventes.</figcaption>
</figure>`)}
<div class="callout warn"><b>Droits</b>Une image trouvée sur le web n'est pas libre par défaut. Utilise tes propres images, des banques sous licence claire (Unsplash, Pexels) ou des images générées, et respecte les conditions.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Galerie et navigation',
            enonce: `<p>Crée : une navigation (<code>nav</code> contenant une liste <code>ul</code> de 3 liens vers des ancres <code>#accueil</code>, <code>#galerie</code>, <code>#contact</code>), trois sections avec ces <code>id</code>, dans la galerie une <code>figure</code> avec une <code>img</code> (src <code>data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23cbd5e1'/><circle cx='300' cy='200' r='80' fill='%236d5dfc'/></svg></code>, <code>alt</code> descriptif non vide, <code>width</code> et <code>height</code>, <code>loading="lazy"</code>) et une <code>figcaption</code>, et dans contact un lien <code>mailto:</code> ainsi qu'un lien externe en nouvel onglet avec <code>rel="noopener"</code>.</p>`,
            depart: page(`  <!-- navigation, sections, galerie, contact -->`),
            solution: page(`  <nav>
    <ul>
      <li><a href="#accueil">Accueil</a></li>
      <li><a href="#galerie">Galerie</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>
  <section id="accueil">
    <h1>Photographies de voyage</h1>
    <p>Quelques images rapportées de mes dernières escapades.</p>
  </section>
  <section id="galerie">
    <h2>Galerie</h2>
    <figure>
      <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='100%25' height='100%25' fill='%23cbd5e1'/><circle cx='300' cy='200' r='80' fill='%236d5dfc'/></svg>" alt="Paysage de montagne au lever du soleil" width="400" height="300" loading="lazy">
      <figcaption>Les Alpes, octobre 2025.</figcaption>
    </figure>
  </section>
  <section id="contact">
    <h2>Contact</h2>
    <p><a href="mailto:photo@exemple.fr">Écrire par email</a> ou visiter <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>.</p>
  </section>`),
            tests: [dom('nav > ul avec 3 liens vers des ancres', d => { const a = d.querySelectorAll('nav ul li a[href^="#"]'); return a.length === 3; }), dom('Sections #accueil, #galerie, #contact', d => ['accueil', 'galerie', 'contact'].every(id => d.getElementById(id))), dom('Image avec alt non vide, width, height et loading=lazy', d => { const i = d.querySelector('#galerie figure img'); return i && i.getAttribute('alt')?.trim().length > 3 && i.hasAttribute('width') && i.hasAttribute('height') && i.getAttribute('loading') === 'lazy'; }), dom('figcaption présente', d => !!d.querySelector('#galerie figure figcaption')), dom('Lien mailto dans #contact', d => !!d.querySelector('#contact a[href^="mailto:"]')), dom('Lien externe avec target=_blank et rel=noopener', d => { const a = d.querySelector('#contact a[target="_blank"]'); return a && /noopener/.test(a.getAttribute('rel') || ''); })]
          },
          quiz: [
            { q: 'Que mettre comme <code>alt</code> pour une image purement décorative ?', options: ['Rien (pas d\'attribut)', 'alt=""', 'alt="image"'], bonne: 1, explication: 'alt vide indique aux lecteurs d\'écran d\'ignorer l\'image ; sans attribut, ils lisent le nom du fichier.' },
            { q: 'Pourquoi ajouter <code>rel="noopener"</code> avec <code>target="_blank"</code> ?', options: ['Pour le style', 'Pour empêcher la page ouverte d\'accéder à window.opener', 'Pour ouvrir plus vite'], bonne: 1, explication: 'Sécurité : la nouvelle page ne peut pas manipuler la page d\'origine.' },
            { q: 'Quel format pour un logo qui doit rester net à toute taille ?', options: ['JPEG', 'PNG', 'SVG'], bonne: 2, explication: 'SVG est vectoriel : pas de pixels, donc aucune perte au redimensionnement.' }
          ]
        },
        {
          titre: 'Tableaux de données',
          theorie: `<p>Un tableau HTML sert à présenter des <strong>données tabulaires</strong> : horaires, prix, résultats. Jamais pour la mise en page (c'était le cas dans les années 2000 ; CSS Grid a pris le relais).</p>
<h2>Structure complète</h2>
${code('html', `<table>
  <caption>Tarifs 2026</caption>           <!-- titre du tableau -->
  <thead>
    <tr>
      <th scope="col">Formule</th>          <!-- en-tête de colonne -->
      <th scope="col">Prix mensuel</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Essentiel</th>        <!-- en-tête de ligne -->
      <td>9 €</td>
    </tr>
    <tr>
      <th scope="row">Pro</th>
      <td>29 €</td>
    </tr>
  </tbody>
  <tfoot>
    <tr><td>Total options</td><td>38 €</td></tr>
  </tfoot>
</table>`)}
<ul><li><code>&lt;tr&gt;</code> = ligne, <code>&lt;th&gt;</code> = cellule d'en-tête, <code>&lt;td&gt;</code> = cellule de données.</li>
<li><code>scope="col"</code> / <code>scope="row"</code> indique à quoi se rapporte l'en-tête : un lecteur d'écran annonce « Pro, Prix mensuel, 29 € ».</li>
<li><code>&lt;caption&gt;</code> est le titre accessible du tableau, placé juste après <code>&lt;table&gt;</code>.</li>
<li><code>thead</code>, <code>tbody</code>, <code>tfoot</code> regroupent les lignes ; ils permettent de figer l'en-tête au défilement en CSS.</li></ul>
<h2>Fusionner des cellules</h2>
${code('html', `<tr>
  <td colspan="2">Occupe deux colonnes</td>
</tr>
<tr>
  <td rowspan="2">Occupe deux lignes</td>
  <td>A</td>
</tr>
<tr>
  <td>B</td>
</tr>`)}
<p>Chaque ligne doit totaliser le même nombre de colonnes une fois les fusions comptées. Les tableaux fusionnés sont difficiles à lire pour les technologies d'assistance : limite-les.</p>
<h2>Tableaux et mobile</h2>
<p>Un tableau large déborde sur petit écran. Solutions : l'envelopper dans un conteneur à défilement horizontal (<code>overflow-x: auto</code>), masquer les colonnes secondaires, ou transformer chaque ligne en carte via CSS. Toujours garder la structure sémantique.</p>
<h2>Tri et interactivité</h2>
<p>HTML n'offre pas de tri natif. Avec JavaScript, on lit les <code>td</code>, on trie les <code>tr</code> et on les réinsère. Indique la colonne triée avec <code>aria-sort="ascending"</code> sur le <code>th</code>.</p>
<div class="callout info"><b>Bonnes pratiques</b>Alignement des nombres à droite (CSS), unités dans l'en-tête plutôt que dans chaque cellule, une colonne = une donnée. Et si le tableau ne contient qu'une liste de valeurs, c'est une liste, pas un tableau.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Tableau d\'horaires accessible',
            enonce: `<p>Construis un tableau avec une <code>caption</code> « Horaires d'ouverture », un <code>thead</code> dont les <code>th</code> ont <code>scope="col"</code> (Jour, Matin, Après-midi), un <code>tbody</code> d'au moins 3 lignes où la première cellule de chaque ligne est un <code>th scope="row"</code>, et une dernière ligne (dans <code>tbody</code> ou <code>tfoot</code>) où une cellule « Fermé le dimanche » utilise <code>colspan="2"</code>.</p>`,
            depart: page(`  <table>
    <!-- complète -->
  </table>`),
            solution: page(`  <table>
    <caption>Horaires d'ouverture</caption>
    <thead>
      <tr>
        <th scope="col">Jour</th>
        <th scope="col">Matin</th>
        <th scope="col">Après-midi</th>
      </tr>
    </thead>
    <tbody>
      <tr><th scope="row">Lundi</th><td>9h – 12h</td><td>14h – 18h</td></tr>
      <tr><th scope="row">Mardi</th><td>9h – 12h</td><td>14h – 18h</td></tr>
      <tr><th scope="row">Samedi</th><td>10h – 13h</td><td>Fermé</td></tr>
    </tbody>
    <tfoot>
      <tr><th scope="row">Dimanche</th><td colspan="2">Fermé le dimanche</td></tr>
    </tfoot>
  </table>`),
            tests: [dom('caption « Horaires d\'ouverture »', d => /Horaires d.ouverture/.test(d.querySelector('table caption')?.textContent || '')), dom('thead avec 3 th scope="col"', d => d.querySelectorAll('table thead th[scope="col"]').length === 3), dom('tbody avec au moins 3 lignes commençant par th scope="row"', d => { const rows = [...d.querySelectorAll('table tbody tr')].filter(r => r.firstElementChild?.tagName === 'TH' && r.firstElementChild.getAttribute('scope') === 'row'); return rows.length >= 3; }), dom('Une cellule colspan="2" contenant « Fermé le dimanche »', d => [...d.querySelectorAll('table td[colspan="2"]')].some(c => /Fermé le dimanche/i.test(c.textContent))), dom('Aucun tr directement dans table (thead/tbody/tfoot utilisés)', d => ![...d.querySelector('table').children].some(c => c.tagName === 'TR'))]
          },
          quiz: [
            { q: 'À quoi sert <code>scope="row"</code> sur un <code>th</code> ?', options: ['À le mettre en gras', 'À indiquer qu\'il est l\'en-tête de sa ligne', 'À fusionner la ligne'], bonne: 1, explication: 'Les lecteurs d\'écran associent chaque cellule à ses en-têtes de ligne et de colonne.' },
            { q: 'Quand utiliser un tableau HTML ?', options: ['Pour disposer les blocs d\'une page', 'Pour des données tabulaires', 'Pour les menus'], bonne: 1, explication: 'La mise en page est le rôle de CSS (Grid, Flexbox).' },
            { q: 'Que fait <code>colspan="3"</code> ?', options: ['Ajoute 3 colonnes', 'Étend la cellule sur 3 colonnes', 'Trie 3 colonnes'], bonne: 1, explication: 'La cellule occupe la place de trois cellules sur sa ligne.' }
          ]
        }
      ]
    },
    {
      titre: 'Sémantique, formulaires et médias', niveau: 'Débutant', description: 'Structurer avec des balises de sens, collecter des données, intégrer son, vidéo et contenus externes.',
      lecons: [
        {
          titre: 'Balises sémantiques et structure de page',
          theorie: `<p>Avant HTML5, une page était une pile de <code>&lt;div&gt;</code> anonymes. Les balises <strong>sémantiques</strong> nomment les régions : les lecteurs d'écran proposent de sauter directement au contenu principal, les moteurs identifient l'article, et ton code se lit sans commentaires.</p>
<h2>Les régions</h2>
${code('html', `<body>
  <header>                     <!-- en-tête du site : logo, navigation principale -->
    <a href="/" class="logo">Brûlerie Lumio</a>
    <nav aria-label="Navigation principale">
      <ul><li><a href="/cafes">Cafés</a></li><li><a href="/blog">Blog</a></li></ul>
    </nav>
  </header>

  <main>                       <!-- contenu principal, unique par page -->
    <article>                  <!-- contenu autonome : billet, fiche produit -->
      <header>
        <h1>Comment choisir sa mouture</h1>
        <p><time datetime="2026-02-10">10 février 2026</time> · par Léa</p>
      </header>
      <section>                <!-- partie thématique, avec son propre titre -->
        <h2>Pour l'espresso</h2>
        <p>…</p>
      </section>
      <aside>                  <!-- contenu lié mais secondaire -->
        <h2>À lire aussi</h2>
      </aside>
      <footer>Étiquettes : mouture, espresso</footer>
    </article>
  </main>

  <footer>                     <!-- pied de page du site -->
    <p>© 2026 Brûlerie Lumio · <a href="/mentions">Mentions légales</a></p>
  </footer>
</body>`)}
<h2>Choisir la bonne balise</h2>
<table><tr><th>Question</th><th>Balise</th></tr>
<tr><td>Le bloc a-t-il du sens seul, partagé hors contexte ?</td><td><code>&lt;article&gt;</code></td></tr>
<tr><td>Est-ce une partie thématique avec titre ?</td><td><code>&lt;section&gt;</code></td></tr>
<tr><td>Est-ce accessoire au contenu voisin ?</td><td><code>&lt;aside&gt;</code></td></tr>
<tr><td>Des liens de navigation majeurs ?</td><td><code>&lt;nav&gt;</code></td></tr>
<tr><td>Aucune des réponses, juste un conteneur pour CSS ?</td><td><code>&lt;div&gt;</code></td></tr></table>
<p><code>&lt;div&gt;</code> et <code>&lt;span&gt;</code> restent utiles : ce sont des conteneurs neutres pour le style ou le script. Ils ne sont pas « interdits », simplement sans sens.</p>
<h2>Plan de titres</h2>
<p>Chaque <code>section</code> et <code>article</code> commence idéalement par un titre. Les outils d'accessibilité (et l'extension HeadingsMap) affichent le plan : il doit se lire comme une table des matières logique, sans trou (h2 → h4).</p>
<h2>Points de repère (landmarks)</h2>
<p><code>header</code>, <code>nav</code>, <code>main</code>, <code>aside</code>, <code>footer</code> sont des <em>landmarks</em> : un utilisateur de lecteur d'écran navigue de l'un à l'autre. S'il y a plusieurs <code>nav</code>, différencie-les avec <code>aria-label</code>.</p>
<div class="callout info"><b>Un main, un seul</b><code>&lt;main&gt;</code> contient le contenu unique de la page, hors en-tête, navigation et pied de page répétés. Il ne doit apparaître qu'une fois.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Page de blog sémantique',
            enonce: `<p>Structure une page de blog sans aucun <code>div</code> : un <code>header</code> de site contenant un <code>nav</code> avec une liste de liens ; un <code>main</code> unique contenant un <code>article</code> avec un <code>h1</code>, un élément <code>time</code> muni de <code>datetime</code>, et au moins deux <code>section</code> ayant chacune un <code>h2</code> ; un <code>aside</code> ; et un <code>footer</code> de site. Le <code>nav</code> doit avoir un <code>aria-label</code>.</p>`,
            depart: page(`  <!-- header, main > article, aside, footer -->`),
            solution: page(`  <header>
    <p>Le blog du café</p>
    <nav aria-label="Navigation principale">
      <ul>
        <li><a href="/">Accueil</a></li>
        <li><a href="/articles">Articles</a></li>
        <li><a href="/contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <article>
      <h1>Choisir sa mouture</h1>
      <p>Publié le <time datetime="2026-02-10">10 février 2026</time></p>
      <section>
        <h2>Pour l'espresso</h2>
        <p>Une mouture fine, proche du sucre glace.</p>
      </section>
      <section>
        <h2>Pour la cafetière à piston</h2>
        <p>Une mouture grossière, comme du gros sel.</p>
      </section>
    </article>
    <aside>
      <h2>À lire aussi</h2>
      <ul><li><a href="/articles/eau">Quelle eau pour le café ?</a></li></ul>
    </aside>
  </main>
  <footer>
    <p>© 2026 Le blog du café</p>
  </footer>`),
            tests: [dom('Aucun div', d => d.querySelectorAll('div').length === 0), dom('header > nav[aria-label] avec une liste de liens', d => { const n = d.querySelector('body > header nav'); return n && n.getAttribute('aria-label') && n.querySelectorAll('ul li a').length >= 2; }), dom('Un seul main', d => d.querySelectorAll('main').length === 1), dom('main > article avec un h1', d => !!d.querySelector('main article h1')), dom('Élément time avec datetime', d => !!d.querySelector('article time[datetime]')), dom('Au moins deux section avec un h2 chacune', d => [...d.querySelectorAll('article section')].filter(s => s.querySelector('h2')).length >= 2), dom('aside et footer de site présents', d => !!d.querySelector('aside') && !!d.querySelector('body > footer'))]
          },
          quiz: [
            { q: 'Quelle balise pour un billet de blog partageable isolément ?', options: ['section', 'article', 'aside'], bonne: 1, explication: 'article désigne un contenu autonome qui garde son sens hors de la page.' },
            { q: 'Combien de <code>&lt;main&gt;</code> par page ?', options: ['Un', 'Un par section', 'Autant que nécessaire'], bonne: 0, explication: 'main identifie le contenu principal unique.' },
            { q: 'Quand utiliser <code>&lt;div&gt;</code> ?', options: ['Jamais', 'Quand aucune balise sémantique ne convient (conteneur de style)', 'Pour les titres'], bonne: 1, explication: 'div est un conteneur neutre ; il n\'est pas mauvais, il est juste sans sens.' }
          ]
        },
        {
          titre: 'Formulaires',
          theorie: `<p>Les formulaires sont le seul moyen natif pour l'utilisateur d'envoyer des données : inscription, recherche, commande. HTML offre des champs riches, une validation intégrée et une accessibilité automatique… à condition de bien les étiqueter.</p>
<h2>Le formulaire et ses champs</h2>
${code('html', `<form action="/inscription" method="post">
  <label for="email">Adresse email</label>
  <input id="email" name="email" type="email" required autocomplete="email">

  <label for="mdp">Mot de passe</label>
  <input id="mdp" name="mdp" type="password" minlength="8" required>

  <fieldset>
    <legend>Formule</legend>
    <label><input type="radio" name="formule" value="essentiel" checked> Essentiel</label>
    <label><input type="radio" name="formule" value="pro"> Pro</label>
  </fieldset>

  <label for="pays">Pays</label>
  <select id="pays" name="pays">
    <option value="">— Choisir —</option>
    <option value="fr" selected>France</option>
    <option value="be">Belgique</option>
  </select>

  <label for="msg">Message</label>
  <textarea id="msg" name="msg" rows="4" placeholder="Votre message"></textarea>

  <label><input type="checkbox" name="cgu" required> J'accepte les conditions</label>
  <button type="submit">S'inscrire</button>
</form>`)}
<h2>Les règles essentielles</h2>
<ul><li>Chaque champ a un <code>&lt;label&gt;</code> relié par <code>for</code>/<code>id</code> (ou qui l'enveloppe). Cliquer sur le label active le champ ; les lecteurs d'écran annoncent le nom. <code>placeholder</code> ne remplace pas un label : il disparaît à la saisie.</li>
<li><code>name</code> est le nom envoyé au serveur ; sans lui, la valeur n'est pas transmise.</li>
<li>Les boutons radio d'un même groupe partagent le même <code>name</code> ; un <code>fieldset</code> + <code>legend</code> nomme le groupe.</li>
<li><code>method="post"</code> pour envoyer des données qui modifient quelque chose ; <code>get</code> pour une recherche (paramètres visibles dans l'URL).</li></ul>
<h2>Types d'input</h2>
<p><code>text</code>, <code>email</code>, <code>password</code>, <code>number</code> (<code>min</code>, <code>max</code>, <code>step</code>), <code>tel</code>, <code>url</code>, <code>date</code>, <code>time</code>, <code>range</code>, <code>color</code>, <code>file</code> (<code>accept="image/*"</code>, <code>multiple</code>), <code>search</code>, <code>hidden</code>. Sur mobile, le type adapte le clavier (chiffres, @).</p>
<h2>Validation native</h2>
<p><code>required</code>, <code>minlength</code>/<code>maxlength</code>, <code>min</code>/<code>max</code>, <code>pattern="[0-9]{5}"</code>, et le type lui-même (<code>email</code>). Le navigateur bloque l'envoi et affiche un message. <code>autocomplete</code> (<code>name</code>, <code>email</code>, <code>postal-code</code>…) permet le remplissage automatique.</p>
<h2>Les boutons</h2>
<p><code>&lt;button type="submit"&gt;</code> envoie (type par défaut dans un form), <code>type="reset"</code> efface, <code>type="button"</code> ne fait rien sans JavaScript. Un bouton hors formulaire doit avoir <code>type="button"</code>.</p>
<div class="callout warn"><b>Erreur fréquente</b>Un <code>&lt;div&gt;</code> cliquable n'est pas un bouton : pas de focus clavier, pas d'annonce « bouton ». Utilise <code>&lt;button&gt;</code>.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Formulaire de réservation',
            enonce: `<p>Crée un formulaire (<code>method="post"</code>) avec : un champ texte « Nom » obligatoire, un champ <code>email</code> obligatoire, un champ <code>date</code>, un champ <code>number</code> « Personnes » avec <code>min="1"</code> et <code>max="8"</code>, un <code>select</code> « Service » avec au moins 2 options, un groupe de 2 boutons radio dans un <code>fieldset</code> avec <code>legend</code>, un <code>textarea</code>, et un bouton d'envoi. Chaque <code>input</code>, <code>select</code> et <code>textarea</code> doit avoir un <code>label</code> associé (via <code>for</code>/<code>id</code> ou enveloppant) et un attribut <code>name</code>.</p>`,
            depart: page(`  <form method="post">
    <!-- champs -->
  </form>`),
            solution: page(`  <form method="post">
    <p><label for="nom">Nom</label> <input id="nom" name="nom" type="text" required></p>
    <p><label for="email">Email</label> <input id="email" name="email" type="email" required></p>
    <p><label for="date">Date</label> <input id="date" name="date" type="date"></p>
    <p><label for="personnes">Personnes</label> <input id="personnes" name="personnes" type="number" min="1" max="8" value="2"></p>
    <p><label for="service">Service</label>
      <select id="service" name="service">
        <option value="midi">Midi</option>
        <option value="soir">Soir</option>
      </select></p>
    <fieldset>
      <legend>Emplacement</legend>
      <label><input type="radio" name="emplacement" value="salle" checked> Salle</label>
      <label><input type="radio" name="emplacement" value="terrasse"> Terrasse</label>
    </fieldset>
    <p><label for="message">Message</label><br><textarea id="message" name="message" rows="3"></textarea></p>
    <button type="submit">Réserver</button>
  </form>`),
            tests: [dom('form method="post"', d => (d.querySelector('form')?.getAttribute('method') || '').toLowerCase() === 'post'), dom('Champs text et email obligatoires', d => !!d.querySelector('form input[type="text"][required]') && !!d.querySelector('form input[type="email"][required]')), dom('Champ date et champ number min=1 max=8', d => !!d.querySelector('form input[type="date"]') && !!d.querySelector('form input[type="number"][min="1"][max="8"]')), dom('select avec au moins 2 options', d => d.querySelectorAll('form select option').length >= 2), dom('fieldset + legend avec 2 radios de même name', d => { const f = d.querySelector('form fieldset'); if (!f || !f.querySelector('legend')) return false; const r = [...f.querySelectorAll('input[type="radio"]')]; return r.length >= 2 && new Set(r.map(x => x.name)).size === 1 && r[0].name; }), dom('textarea et bouton submit', d => !!d.querySelector('form textarea') && (!!d.querySelector('form button[type="submit"]') || !!d.querySelector('form button:not([type])'))), dom('Tous les champs ont un name', d => [...d.querySelectorAll('form input, form select, form textarea')].every(c => c.name)), dom('Tous les champs ont un label associé', d => [...d.querySelectorAll('form input, form select, form textarea')].every(c => c.closest('label') || (c.id && d.querySelector(`label[for="${c.id}"]`))))]
          },
          quiz: [
            { q: 'Comment relier un label à son champ ?', options: ['label for="x" et input id="x"', 'label name="x"', 'Il suffit de les placer côte à côte'], bonne: 0, explication: 'for / id crée le lien (ou le label enveloppe le champ).' },
            { q: 'Sans attribut <code>name</code>, que se passe-t-il ?', options: ['Le champ est invisible', 'La valeur n\'est pas envoyée au serveur', 'Le champ est obligatoire'], bonne: 1, explication: 'name est la clé de la donnée dans la requête.' },
            { q: 'Quel type de bouton pour un bouton qui ne soumet pas le formulaire ?', options: ['submit', 'button', 'reset'], bonne: 1, explication: 'Dans un form, le type par défaut est submit : précise type="button".' }
          ]
        },
        {
          titre: 'Audio, vidéo et contenus intégrés',
          theorie: `<p>HTML5 lit nativement l'audio et la vidéo, sans plugin. Et <code>&lt;iframe&gt;</code> permet d'intégrer une page externe (carte, vidéo YouTube, formulaire).</p>
<h2>Vidéo</h2>
${code('html', `<video controls width="640" height="360" poster="apercu.jpg" preload="metadata">
  <source src="film.webm" type="video/webm">
  <source src="film.mp4" type="video/mp4">
  <track kind="subtitles" src="film.fr.vtt" srclang="fr" label="Français" default>
  <p>Votre navigateur ne lit pas la vidéo. <a href="film.mp4">Télécharger</a>.</p>
</video>`)}
<ul><li><code>controls</code> affiche lecture/pause/volume : obligatoire sauf cas particulier.</li>
<li>Plusieurs <code>&lt;source&gt;</code> : le navigateur prend le premier format qu'il sait lire (WebM plus léger, MP4/H.264 universel).</li>
<li><code>poster</code> : image avant lecture. <code>preload="metadata"</code> ne télécharge que la durée et les dimensions.</li>
<li><code>&lt;track&gt;</code> : sous-titres au format WebVTT, indispensables pour l'accessibilité et très utilisés (lecture sans son).</li>
<li><code>autoplay</code> ne fonctionne qu'avec <code>muted</code> (règle des navigateurs). <code>loop</code>, <code>playsinline</code> (iOS) complètent les vidéos d'ambiance.</li></ul>
<h2>Audio</h2>
${code('html', `<audio controls preload="none">
  <source src="episode.mp3" type="audio/mpeg">
  <source src="episode.ogg" type="audio/ogg">
</audio>`)}
<h2>iframe : intégrer une page</h2>
${code('html', `<iframe src="https://www.youtube-nocookie.com/embed/ID" width="560" height="315"
        title="Présentation du produit" loading="lazy"
        allow="fullscreen; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin"></iframe>

<iframe src="page-tierce.html" sandbox="allow-scripts" title="Widget"></iframe>`)}
<ul><li><code>title</code> est obligatoire pour l'accessibilité : il décrit le contenu intégré.</li>
<li><code>sandbox</code> restreint ce que la page intégrée peut faire (scripts, formulaires, pop-ups) ; ajoute uniquement les permissions nécessaires.</li>
<li>Les domaines <code>-nocookie</code> (YouTube) limitent le pistage ; pense au RGPD : un consentement peut être requis avant de charger des contenus tiers.</li></ul>
<h2>Autres intégrations</h2>
<p><code>&lt;svg&gt;</code> inline pour des icônes stylables en CSS, <code>&lt;canvas&gt;</code> pour dessiner en JavaScript (graphiques, jeux), <code>&lt;embed&gt;</code>/<code>&lt;object&gt;</code> pour un PDF. Les cartes (OpenStreetMap, Google Maps) s'intègrent en iframe ou via leur bibliothèque JS.</p>
<h2>Performance et poids</h2>
<p>La vidéo est l'élément le plus lourd d'une page. Compresse (HandBrake, ffmpeg), propose plusieurs résolutions, héberge sur un service dédié si le trafic est important, et n'utilise jamais une vidéo là où une image suffit.</p>
<div class="callout info"><b>Ratio et responsive</b>Pour qu'une vidéo ou une iframe garde ses proportions quand la largeur change : <code>aspect-ratio: 16 / 9; width: 100%; height: auto;</code> en CSS.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Page média',
            enonce: `<p>Intègre : une <code>video</code> avec <code>controls</code>, un attribut <code>poster</code>, deux <code>source</code> (webm puis mp4, avec <code>type</code>), une piste <code>track</code> de sous-titres en français (<code>kind="subtitles"</code>, <code>srclang="fr"</code>) et un texte de repli contenant un lien ; un <code>audio</code> avec <code>controls</code> et une <code>source</code> mp3 ; et une <code>iframe</code> avec <code>title</code>, <code>loading="lazy"</code> et un attribut <code>sandbox</code>.</p>`,
            depart: page(`  <h1>Médias</h1>
  <!-- video, audio, iframe -->`),
            solution: page(`  <h1>Médias</h1>
  <video controls width="640" height="360" poster="apercu.jpg" preload="metadata">
    <source src="film.webm" type="video/webm">
    <source src="film.mp4" type="video/mp4">
    <track kind="subtitles" src="film.fr.vtt" srclang="fr" label="Français" default>
    <p>Votre navigateur ne lit pas cette vidéo. <a href="film.mp4">Télécharger la vidéo</a>.</p>
  </video>
  <audio controls preload="none">
    <source src="episode.mp3" type="audio/mpeg">
  </audio>
  <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=4.83,45.75,4.86,45.77" width="600" height="400" title="Carte du quartier" loading="lazy" sandbox="allow-scripts allow-same-origin"></iframe>`),
            tests: [dom('video avec controls et poster', d => { const v = d.querySelector('video'); return v && v.hasAttribute('controls') && v.hasAttribute('poster'); }), dom('Deux sources vidéo typées : webm puis mp4', d => { const s = [...d.querySelectorAll('video source')].map(x => x.getAttribute('type')); return s[0] === 'video/webm' && s[1] === 'video/mp4'; }), dom('track de sous-titres en français', d => !!d.querySelector('video track[kind="subtitles"][srclang="fr"]')), dom('Texte de repli avec un lien dans la vidéo', d => !!d.querySelector('video a[href]')), dom('audio avec controls et source mp3', d => { const a = d.querySelector('audio'); return a && a.hasAttribute('controls') && !!a.querySelector('source[type="audio/mpeg"], source[src$=".mp3"]'); }), dom('iframe avec title, loading=lazy et sandbox', d => { const f = d.querySelector('iframe'); return f && f.getAttribute('title')?.trim() && f.getAttribute('loading') === 'lazy' && f.hasAttribute('sandbox'); })]
          },
          quiz: [
            { q: 'Pourquoi fournir plusieurs <code>&lt;source&gt;</code> ?', options: ['Pour lire deux vidéos', 'Pour que chaque navigateur trouve un format qu\'il supporte', 'Pour la qualité'], bonne: 1, explication: 'Le navigateur choisit la première source lisible.' },
            { q: 'Quelle condition pour que <code>autoplay</code> fonctionne ?', options: ['Aucune', 'La vidéo doit être muette (muted)', 'controls doit être absent'], bonne: 1, explication: 'Les navigateurs bloquent la lecture automatique avec son.' },
            { q: 'À quoi sert <code>sandbox</code> sur une iframe ?', options: ['À la mettre en plein écran', 'À restreindre les capacités de la page intégrée', 'À la charger plus vite'], bonne: 1, explication: 'Sans permission explicite, scripts, formulaires et pop-ups sont bloqués.' }
          ]
        },
        {
          titre: 'Le head : métadonnées, SEO et partage',
          theorie: `<p>Invisible pour le visiteur, le <code>&lt;head&gt;</code> parle aux navigateurs, aux moteurs de recherche et aux réseaux sociaux. Quelques lignes y font la différence entre une page bien référencée et une page ignorée.</p>
<h2>Le minimum vital</h2>
${code('html', `<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Torréfaction artisanale à Lyon — Brûlerie Lumio</title>
  <meta name="description" content="Cafés de spécialité torréfiés chaque semaine à Lyon. Boutique, abonnement et ateliers de dégustation.">
  <link rel="canonical" href="https://brulerie-lumio.fr/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/style.css">
</head>`)}
<ul><li><code>&lt;title&gt;</code> : 50 à 60 caractères, le mot-clé principal d'abord, le nom du site à la fin. C'est le titre bleu dans Google.</li>
<li><code>description</code> : 150 caractères environ, une phrase qui donne envie de cliquer. Elle n'influence pas le classement mais le taux de clic.</li>
<li><code>canonical</code> : l'URL officielle de la page, pour éviter le contenu dupliqué (http/https, avec ou sans <code>www</code>, paramètres).</li></ul>
<h2>Partage sur les réseaux : Open Graph</h2>
${code('html', `<meta property="og:title" content="Torréfaction artisanale à Lyon">
<meta property="og:description" content="Cafés de spécialité torréfiés chaque semaine.">
<meta property="og:image" content="https://brulerie-lumio.fr/images/partage.jpg">   <!-- 1200×630 -->
<meta property="og:url" content="https://brulerie-lumio.fr/">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">`)}
<p>Ces balises contrôlent l'aperçu quand on partage le lien sur Facebook, LinkedIn, WhatsApp, Slack… Sans elles, l'aperçu est aléatoire.</p>
<h2>Données structurées</h2>
<p>Un bloc JSON-LD décrit l'entité de la page (entreprise locale, recette, article, produit) à Google, qui peut afficher des « résultats enrichis » (étoiles, horaires, prix).</p>
${code('html', `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Brûlerie Lumio",
  "address": { "@type": "PostalAddress", "addressLocality": "Lyon", "postalCode": "69001" },
  "telephone": "+33 4 00 00 00 00",
  "openingHours": "Tu-Sa 09:00-19:00"
}
</script>`)}
<h2>Robots et indexation</h2>
<p><code>&lt;meta name="robots" content="noindex"&gt;</code> exclut la page des résultats (page de remerciement, brouillon). Le fichier <code>robots.txt</code> à la racine et un <code>sitemap.xml</code> guident les robots d'exploration.</p>
<h2>Performance dans le head</h2>
<ul><li>CSS critique dans le head, le reste en <code>&lt;link&gt;</code>.</li><li>Scripts en <code>defer</code> (ordre conservé, après l'analyse) ou <code>async</code> (indépendants).</li><li><code>&lt;link rel="preconnect" href="https://fonts.gstatic.com"&gt;</code> pour les domaines tiers, <code>rel="preload"</code> pour une police ou une image critique.</li></ul>
<div class="callout info"><b>Le SEO commence par le contenu</b>Les balises aident, mais rien ne remplace un contenu utile, un <code>h1</code> clair, des titres hiérarchisés, des textes alternatifs et un site rapide. Le parcours « Créer son business digital » approfondit le SEO local.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Un head complet',
            enonce: `<p>Complète le <code>head</code> d'une page de cabinet de kinésithérapie à Nantes : <code>title</code> entre 30 et 60 caractères contenant « Nantes », <code>meta description</code> de 80 à 160 caractères, <code>link canonical</code>, <code>link icon</code>, les balises Open Graph <code>og:title</code>, <code>og:description</code>, <code>og:image</code> et <code>og:url</code>, et un script JSON-LD <code>application/ld+json</code> de type <code>LocalBusiness</code> (ou <code>Physiotherapy</code>) avec un <code>name</code> et une <code>address</code>.</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- complète le head -->
</head>
<body>
  <h1>Cabinet Kiné Loire</h1>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Kinésithérapeute à Nantes — Cabinet Kiné Loire</title>
  <meta name="description" content="Cabinet de kinésithérapie à Nantes centre : rééducation, kiné du sport et prise en charge sans délai. Prenez rendez-vous en ligne.">
  <link rel="canonical" href="https://kine-loire.fr/">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta property="og:title" content="Kinésithérapeute à Nantes — Cabinet Kiné Loire">
  <meta property="og:description" content="Rééducation, kiné du sport et rendez-vous en ligne à Nantes centre.">
  <meta property="og:image" content="https://kine-loire.fr/images/partage.jpg">
  <meta property="og:url" content="https://kine-loire.fr/">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Physiotherapy",
    "name": "Cabinet Kiné Loire",
    "address": { "@type": "PostalAddress", "streetAddress": "12 rue de Strasbourg", "addressLocality": "Nantes", "postalCode": "44000" },
    "telephone": "+33 2 00 00 00 00"
  }
  </script>
</head>
<body>
  <h1>Cabinet Kiné Loire</h1>
</body>
</html>`,
            tests: [dom('title de 30 à 60 caractères contenant Nantes', d => d.title.length >= 30 && d.title.length <= 60 && /Nantes/.test(d.title)), dom('meta description de 80 à 160 caractères', d => { const c = d.querySelector('meta[name="description"]')?.getAttribute('content') || ''; return c.length >= 80 && c.length <= 160; }), dom('link canonical et link icon', d => !!d.querySelector('link[rel="canonical"][href]') && !!d.querySelector('link[rel~="icon"][href]')), dom('Balises Open Graph og:title, og:description, og:image, og:url', d => ['og:title', 'og:description', 'og:image', 'og:url'].every(p => d.querySelector(`meta[property="${p}"][content]`))), dom('JSON-LD valide de type LocalBusiness/Physiotherapy avec name et address', d => { const s = d.querySelector('script[type="application/ld+json"]'); if (!s) return false; try { const o = JSON.parse(s.textContent); return /LocalBusiness|Physiotherapy|MedicalBusiness/.test(o['@type']) && o.name && o.address; } catch { return false; } })]
          },
          quiz: [
            { q: 'Quel élément du head apparaît comme titre dans les résultats Google ?', options: ['h1', 'title', 'og:title'], bonne: 1, explication: 'title est le titre de la page pour les moteurs et l\'onglet ; h1 est le titre visible dans la page.' },
            { q: 'À quoi servent les balises Open Graph ?', options: ['Au référencement Google', 'À contrôler l\'aperçu lors du partage sur les réseaux', 'À la mise en page'], bonne: 1, explication: 'Elles définissent titre, description et image de la carte de partage.' },
            { q: 'Que fait <code>rel="canonical"</code> ?', options: ['Indique l\'URL de référence de la page', 'Interdit l\'indexation', 'Charge le CSS'], bonne: 0, explication: 'Cela évite que des variantes d\'URL soient vues comme du contenu dupliqué.' }
          ]
        }
      ]
    },
    {
      titre: 'Accessibilité et qualité', niveau: 'Intermédiaire', description: 'Rendre une page utilisable par tous, la structurer avec classes et id, l\'optimiser et la tester.',
      lecons: [
        {
          titre: 'Accessibilité : les fondamentaux',
          theorie: `<p>Un site accessible est utilisable par tout le monde : personnes aveugles ou malvoyantes (lecteur d'écran, zoom), personnes ne pouvant pas utiliser une souris (clavier, commande vocale), daltoniens, personnes sourdes (sous-titres), et… tout le monde dans de mauvaises conditions (soleil sur l'écran, bras cassé, connexion lente). En France, l'accessibilité est une obligation légale pour les services publics et de nombreuses entreprises (RGAA).</p>
<h2>Le HTML sémantique fait 80 % du travail</h2>
<ul><li>Titres hiérarchisés : navigation par titres au lecteur d'écran.</li><li>Landmarks (<code>main</code>, <code>nav</code>…) : saut direct aux régions.</li><li>Vrais boutons et liens : focus clavier, activation à Entrée/Espace, rôle annoncé.</li><li>Labels de formulaire reliés, <code>alt</code> sur les images.</li><li><code>lang</code> sur <code>html</code> (et sur un passage dans une autre langue).</li></ul>
<h2>Clavier</h2>
<p>Tout ce qui se fait à la souris doit se faire au clavier : <kbd>Tab</kbd> pour avancer, <kbd>Maj+Tab</kbd> pour reculer, <kbd>Entrée</kbd>/<kbd>Espace</kbd> pour activer. Le <strong>focus doit rester visible</strong> : ne supprime jamais <code>outline</code> sans le remplacer. L'ordre de tabulation suit l'ordre du HTML ; <code>tabindex="0"</code> rend un élément focusable, <code>tabindex="-1"</code> le rend focusable par script seulement. Évite les valeurs positives.</p>
<p>Un lien d'évitement en début de page permet de sauter la navigation :</p>
${code('html', `<a href="#contenu" class="skip-link">Aller au contenu</a>
…
<main id="contenu" tabindex="-1">`)}
<h2>ARIA : en complément, pas en remplacement</h2>
<p>Les attributs ARIA décrivent des composants que HTML ne sait pas exprimer (onglets, menus déroulants, alertes). Première règle d'ARIA : <em>ne pas utiliser ARIA si un élément HTML natif fait l'affaire</em>.</p>
${code('html', `<button aria-label="Fermer la fenêtre">✕</button>                 <!-- nom accessible d'une icône -->
<button aria-expanded="false" aria-controls="menu">Menu</button>  <!-- état d'un bouton de menu -->
<div role="alert">Formulaire envoyé.</div>                        <!-- annoncé immédiatement -->
<div aria-live="polite" id="statut"></div>                        <!-- annoncé quand l'utilisateur est libre -->
<img src="deco.png" alt="" role="presentation">
<nav aria-label="Pagination">…</nav>
<input aria-describedby="aide-mdp"> <small id="aide-mdp">8 caractères minimum</small>`)}
<h2>Couleurs et contrastes</h2>
<p>Ratio de contraste texte/fond d'au moins <strong>4,5:1</strong> (3:1 pour les grands textes). L'information ne doit pas reposer <em>uniquement</em> sur la couleur : un champ en erreur a aussi une icône ou un message. Outils : l'inspecteur du navigateur affiche le ratio ; l'extension axe ou Lighthouse auditent la page.</p>
<h2>Mouvement et temps</h2>
<p>Respecte <code>prefers-reduced-motion</code> en CSS, propose pause sur les carrousels, n'impose pas de limite de temps sans possibilité de la prolonger.</p>
<h2>Tester</h2>
<ol><li>Débranche la souris : parcours la page au clavier.</li><li>Lance Lighthouse (onglet Audits) ou axe DevTools.</li><li>Essaie un lecteur d'écran : NVDA (Windows, gratuit), VoiceOver (macOS/iOS, intégré), TalkBack (Android).</li><li>Zoome à 200 % : rien ne doit être coupé.</li></ol>
<div class="callout info"><b>Bénéfice collatéral</b>Un site accessible est aussi mieux référencé (structure claire) et plus robuste (fonctionne sans JS, sur de vieux appareils).</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Corriger une page inaccessible',
            enonce: `<p>La page de départ contient plusieurs problèmes d'accessibilité. Corrige-la : ajoute <code>lang</code>, remplace les <code>div</code> cliquables par de vrais <code>button</code>, donne un nom accessible (<code>aria-label</code> ou texte) au bouton de fermeture « ✕ », ajoute un <code>alt</code> à l'image, relie le <code>label</code> au champ, ajoute un lien d'évitement vers <code>#contenu</code> en premier dans <code>body</code>, remplace <code>&lt;div class="titre"&gt;</code> par un <code>h1</code>, et donne un <code>aria-live="polite"</code> à la zone de statut.</p>`,
            depart: `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Newsletter</title></head>
<body>
  <div class="titre">Newsletter</div>
  <img src="logo.png">
  <div onclick="envoyer()">Envoyer</div>
  <div onclick="fermer()">✕</div>
  <label>Email</label> <input id="email" type="email">
  <div id="statut"></div>
  <main id="contenu"><p>Recevez nos nouveautés chaque mois.</p></main>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Newsletter</title></head>
<body>
  <a href="#contenu" class="skip-link">Aller au contenu</a>
  <h1>Newsletter</h1>
  <img src="logo.png" alt="Logo de la Brûlerie Lumio">
  <button type="button" onclick="envoyer()">Envoyer</button>
  <button type="button" onclick="fermer()" aria-label="Fermer">✕</button>
  <label for="email">Email</label> <input id="email" type="email">
  <div id="statut" aria-live="polite"></div>
  <main id="contenu"><p>Recevez nos nouveautés chaque mois.</p></main>
</body>
</html>`,
            tests: [dom('html lang défini', d => !!d.documentElement.getAttribute('lang')), dom('Lien d\'évitement vers #contenu en premier dans body', d => { const f = d.body.firstElementChild; return f && f.tagName === 'A' && f.getAttribute('href') === '#contenu'; }), dom('Un h1 « Newsletter » (plus de div.titre)', d => d.querySelector('h1')?.textContent.trim() === 'Newsletter' && !d.querySelector('div.titre')), dom('Image avec alt', d => d.querySelector('img')?.hasAttribute('alt')), dom('Aucun div avec onclick ; deux boutons', d => !d.querySelector('div[onclick]') && d.querySelectorAll('button').length >= 2), dom('Le bouton ✕ a un nom accessible', d => [...d.querySelectorAll('button')].some(b => b.textContent.includes('✕') && (b.getAttribute('aria-label') || '').trim().length > 2)), dom('Label relié au champ email', d => !!d.querySelector('label[for="email"]') || !!d.querySelector('label input#email')), dom('Zone #statut avec aria-live', d => d.getElementById('statut')?.getAttribute('aria-live') === 'polite')]
          },
          quiz: [
            { q: 'Quelle est la première règle d\'ARIA ?', options: ['Toujours ajouter des rôles', 'Préférer un élément HTML natif quand il existe', 'Utiliser aria-label partout'], bonne: 1, explication: 'Un button natif est focusable et annoncé correctement sans aucun ARIA.' },
            { q: 'Quel ratio de contraste minimum pour du texte normal ?', options: ['2:1', '4,5:1', '10:1'], bonne: 1, explication: 'C\'est le niveau AA des WCAG ; 3:1 suffit pour les grands textes.' },
            { q: 'Pourquoi ne pas supprimer l\'outline de focus ?', options: ['C\'est impossible en CSS', 'Les utilisateurs clavier ne sauraient plus où ils sont', 'Cela ralentit la page'], bonne: 1, explication: 'Le focus visible est indispensable à la navigation clavier. On peut le restyler, pas le supprimer.' }
          ]
        },
        {
          titre: 'Classes, id et préparation au CSS',
          theorie: `<p>HTML décrit la structure ; CSS l'habille ; JavaScript l'anime. Pour que les trois dialoguent, HTML fournit des <strong>points d'accroche</strong> : les attributs <code>class</code>, <code>id</code> et <code>data-*</code>. Bien les choisir, c'est préparer un code maintenable.</p>
<h2>id : unique</h2>
<p>Un <code>id</code> identifie <em>un seul</em> élément de la page. Usages : cible d'ancre (<code>#tarifs</code>), lien label/champ, accès rapide en JS. Jamais deux fois le même id dans une page.</p>
<h2>class : réutilisable</h2>
<p>Une classe décrit un <em>type</em> d'élément et peut être appliquée à plusieurs ; un élément peut en porter plusieurs : <code>class="carte carte--promo"</code>. C'est le mécanisme principal du style.</p>
${code('html', `<article class="carte carte--promo" id="produit-42" data-prix="19.9" data-categorie="cafe">
  <h2 class="carte__titre">Éthiopie Sidamo</h2>
  <p class="carte__prix">19,90 €</p>
  <button class="btn btn--primaire" type="button">Ajouter</button>
</article>`)}
<h2>Nommer avec méthode</h2>
<p>Nomme d'après le <em>rôle</em>, pas l'apparence : <code>.alerte</code> plutôt que <code>.rouge</code> (que se passe-t-il quand l'alerte devient orange ?). La convention <strong>BEM</strong> (Bloc, Élément, Modificateur) rend la structure lisible :</p>
<ul><li><code>.carte</code> : le bloc (composant autonome) ;</li><li><code>.carte__titre</code> : un élément du bloc ;</li><li><code>.carte--promo</code> : une variante du bloc.</li></ul>
<p>Les classes utilitaires (<code>.mt-2</code>, <code>.text-center</code>, popularisées par Tailwind) sont une autre école : des classes atomiques composées dans le HTML. Les deux marchent ; l'important est la cohérence.</p>
<h2>data-* : des données pour JavaScript</h2>
<p>Les attributs <code>data-nom</code> stockent des informations que le script lit via <code>element.dataset.nom</code>. Ils évitent de parser le texte ou d'abuser des classes pour transporter de l'état. En CSS, on les cible aussi : <code>[data-categorie="cafe"]</code>.</p>
<h2>Conteneurs</h2>
<p>Il est normal d'ajouter des <code>div</code> pour grouper des éléments à styler ensemble (une grille, une colonne). Donne-leur une classe descriptive (<code>.grille-produits</code>) et évite les « divites » : cinq <code>div</code> imbriqués sans rôle signalent un problème de conception.</p>
<h2>Lier le CSS</h2>
${code('html', `<head>
  <link rel="stylesheet" href="css/style.css">        <!-- recommandé : fichier séparé, mis en cache -->
  <style>.critique { … }</style>                      <!-- CSS interne : petites pages, CSS critique -->
</head>
<p style="color: red">…</p>                           <!-- en ligne : à éviter (non réutilisable, priorité forte) -->`)}
<h2>Styles de l'agent utilisateur</h2>
<p>Sans CSS, le navigateur applique ses styles par défaut (marges des <code>h1</code>, puces des <code>ul</code>, bleu des liens). Les feuilles « reset » ou « normalize » harmonisent ces défauts entre navigateurs ; c'est souvent la première ligne d'un projet.</p>
<div class="callout info"><b>Préparer, pas styler</b>Au moment d'écrire le HTML, demande-toi : quels éléments auront besoin d'un style commun (classe) ? Lesquels sont uniques (id) ? Quelles données JS devront lire (data-*) ? Le CSS du parcours suivant s'appuiera dessus.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Cartes produits bien nommées',
            enonce: `<p>Crée un conteneur <code>&lt;section class="grille-produits"&gt;</code> contenant trois <code>article</code> de classe <code>carte</code>, chacun avec un <code>id</code> unique (<code>produit-1</code>, …), un attribut <code>data-prix</code> numérique, un <code>h2</code> de classe <code>carte__titre</code>, un <code>p</code> de classe <code>carte__prix</code> et un <code>button type="button"</code> de classe <code>btn</code>. Le deuxième article porte en plus la classe <code>carte--promo</code>. Aucun attribut <code>style</code> en ligne.</p>`,
            depart: page(`  <section class="grille-produits">
    <!-- trois cartes -->
  </section>`, `<link rel="stylesheet" href="style.css">`),
            solution: page(`  <section class="grille-produits">
    <article class="carte" id="produit-1" data-prix="12.5">
      <h2 class="carte__titre">Brésil Cerrado</h2>
      <p class="carte__prix">12,50 €</p>
      <button class="btn" type="button">Ajouter</button>
    </article>
    <article class="carte carte--promo" id="produit-2" data-prix="15.9">
      <h2 class="carte__titre">Éthiopie Sidamo</h2>
      <p class="carte__prix">15,90 €</p>
      <button class="btn" type="button">Ajouter</button>
    </article>
    <article class="carte" id="produit-3" data-prix="18">
      <h2 class="carte__titre">Colombie Huila</h2>
      <p class="carte__prix">18,00 €</p>
      <button class="btn" type="button">Ajouter</button>
    </article>
  </section>`, `<link rel="stylesheet" href="style.css">`),
            tests: [dom('section.grille-produits avec 3 article.carte', d => d.querySelectorAll('section.grille-produits > article.carte').length === 3), dom('Trois id uniques commençant par produit-', d => { const ids = [...d.querySelectorAll('article.carte')].map(a => a.id); return ids.every(i => /^produit-\d+$/.test(i)) && new Set(ids).size === 3; }), dom('data-prix numérique sur chaque carte', d => [...d.querySelectorAll('article.carte')].every(a => !isNaN(parseFloat(a.dataset.prix)))), dom('h2.carte__titre, p.carte__prix et button.btn[type=button] dans chaque carte', d => [...d.querySelectorAll('article.carte')].every(a => a.querySelector('h2.carte__titre') && a.querySelector('p.carte__prix') && a.querySelector('button.btn[type="button"]'))), dom('La deuxième carte a la classe carte--promo', d => d.querySelectorAll('article.carte')[1]?.classList.contains('carte--promo')), dom('Aucun style en ligne', d => d.querySelectorAll('[style]').length === 0)]
          },
          quiz: [
            { q: 'Combien de fois un même <code>id</code> peut-il apparaître dans une page ?', options: ['Une seule', 'Autant que de classes', 'Deux maximum'], bonne: 0, explication: 'L\'id est unique ; pour un style partagé, utilise une classe.' },
            { q: 'Quel nom de classe est le mieux choisi ?', options: ['.texte-rouge', '.message-erreur', '.div2'], bonne: 1, explication: 'Nommer d\'après le rôle survit aux changements d\'apparence.' },
            { q: 'Comment lire <code>data-prix="19.9"</code> en JavaScript ?', options: ['element.prix', 'element.dataset.prix', 'element.getData("prix")'], bonne: 1, explication: 'dataset expose les attributs data-* (en camelCase pour data-mon-attribut → dataset.monAttribut).' }
          ]
        },
        {
          titre: 'Performance et bonnes pratiques',
          theorie: `<p>Une page lente perd ses visiteurs : au-delà de 3 secondes sur mobile, plus de la moitié abandonnent. Google mesure la vitesse (Core Web Vitals) et en tient compte dans le classement. Beaucoup d'optimisations se décident dès le HTML.</p>
<h2>Les trois métriques à connaître</h2>
<ul><li><strong>LCP</strong> (Largest Contentful Paint) : délai d'affichage du plus gros élément visible. Objectif : &lt; 2,5 s.</li><li><strong>INP</strong> (Interaction to Next Paint) : réactivité aux interactions. Objectif : &lt; 200 ms.</li><li><strong>CLS</strong> (Cumulative Layout Shift) : stabilité visuelle, la page ne doit pas « sauter ». Objectif : &lt; 0,1.</li></ul>
<h2>Images : le premier levier</h2>
${code('html', `<img src="hero.webp" alt="…" width="1200" height="600" fetchpriority="high">   <!-- image principale : priorité -->
<img src="produit.webp" alt="…" width="400" height="400" loading="lazy" decoding="async">  <!-- hors écran : différée -->`)}
<p>Dimensions déclarées (évite le CLS), formats modernes (WebP/AVIF), <code>srcset</code> pour ne pas envoyer 2000 px à un téléphone, <code>loading="lazy"</code> pour tout ce qui est sous la ligne de flottaison, mais <em>jamais</em> sur l'image LCP.</p>
<h2>Scripts et styles</h2>
${code('html', `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/style.css">
<script src="/app.js" defer></script>          <!-- ne bloque pas l'analyse HTML -->
<script src="/analytics.js" async></script>    <!-- indépendant, dès que possible -->
<script type="module" src="/moderne.js"></script>   <!-- différé par défaut -->`)}
<p>Un <code>&lt;script&gt;</code> sans attribut bloque l'affichage jusqu'à son téléchargement et son exécution : c'est l'erreur la plus courante.</p>
<h2>Polices</h2>
<p>Chaque police est un fichier à télécharger. Limite à deux familles, charge seulement les graisses utilisées, utilise <code>font-display: swap</code> (texte visible immédiatement avec une police de repli) et préfère le format WOFF2.</p>
<h2>Contenus tiers</h2>
<p>Widgets, iframes, scripts de suivi : chacun coûte des centaines de millisecondes. Charge-les en <code>lazy</code>, après interaction, ou pas du tout. Mesure avec l'onglet Réseau avant d'ajouter quoi que ce soit.</p>
<h2>HTML propre</h2>
<ul><li>Valide (W3C) : les erreurs d'emboîtement ralentissent l'analyse et créent des bugs d'affichage.</li><li>Indenté de façon cohérente (2 espaces), attributs entre guillemets doubles.</li><li>Pas de HTML généré par copier-coller depuis Word (balises inutiles).</li><li>Commentaires courts pour les sections complexes ; pas de code mort commenté.</li></ul>
<h2>Mesurer</h2>
<p><strong>Lighthouse</strong> (DevTools → Lighthouse) note performance, accessibilité, SEO et bonnes pratiques avec des recommandations concrètes. <strong>PageSpeed Insights</strong> fait pareil depuis les serveurs de Google avec des données réelles d'utilisateurs. Teste en mode mobile et en connexion lente simulée.</p>
<div class="callout info"><b>Le poids idéal</b>Une page de contenu sous 1 Mo au total, moins de 50 requêtes, un seul fichier CSS, un seul JS principal. C'est atteignable sans framework, comme cette plateforme.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Optimiser le chargement',
            enonce: `<p>Corrige la page de départ : ajoute <code>width</code>/<code>height</code> et <code>alt</code> sur les deux images, mets <code>loading="lazy"</code> sur la seconde (galerie) mais pas sur la première (hero) qui reçoit <code>fetchpriority="high"</code>, ajoute <code>defer</code> au script principal, <code>async</code> au script d'analytics, un <code>link rel="preconnect"</code> vers <code>https://fonts.gstatic.com</code> et un <code>loading="lazy"</code> ainsi qu'un <code>title</code> sur l'iframe.</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Boutique</title>
  <link rel="stylesheet" href="style.css">
  <script src="app.js"></script>
  <script src="https://stats.exemple.com/analytics.js"></script>
</head>
<body>
  <img src="hero.webp">
  <h1>Nos cafés</h1>
  <img src="galerie.webp">
  <iframe src="https://www.youtube-nocookie.com/embed/xyz" width="560" height="315"></iframe>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Boutique</title>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="style.css">
  <script src="app.js" defer></script>
  <script src="https://stats.exemple.com/analytics.js" async></script>
</head>
<body>
  <img src="hero.webp" alt="Sacs de café fraîchement torréfiés" width="1200" height="600" fetchpriority="high">
  <h1>Nos cafés</h1>
  <img src="galerie.webp" alt="Tasse d'espresso sur le comptoir" width="800" height="600" loading="lazy">
  <iframe src="https://www.youtube-nocookie.com/embed/xyz" width="560" height="315" title="Présentation de la brûlerie" loading="lazy"></iframe>
</body>
</html>`,
            tests: [dom('Les deux images ont alt, width et height', d => [...d.querySelectorAll('img')].length === 2 && [...d.querySelectorAll('img')].every(i => i.hasAttribute('alt') && i.hasAttribute('width') && i.hasAttribute('height'))), dom('Image hero : fetchpriority=high, sans lazy', d => { const i = d.querySelector('img[src="hero.webp"]'); return i && i.getAttribute('fetchpriority') === 'high' && i.getAttribute('loading') !== 'lazy'; }), dom('Image galerie : loading=lazy', d => d.querySelector('img[src="galerie.webp"]')?.getAttribute('loading') === 'lazy'), dom('Script principal en defer, analytics en async', d => d.querySelector('script[src="app.js"]')?.hasAttribute('defer') && d.querySelector('script[src*="analytics"]')?.hasAttribute('async')), dom('preconnect vers fonts.gstatic.com', d => !!d.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]')), dom('iframe avec title et loading=lazy', d => { const f = d.querySelector('iframe'); return f && f.getAttribute('title')?.trim() && f.getAttribute('loading') === 'lazy'; })]
          },
          quiz: [
            { q: 'Que mesure le CLS ?', options: ['La vitesse du serveur', 'Les déplacements inattendus de la mise en page', 'Le nombre de clics'], bonne: 1, explication: 'Déclarer width/height sur les images et réserver l\'espace des publicités le réduit.' },
            { q: 'Quel attribut de script ne bloque pas l\'analyse HTML et conserve l\'ordre d\'exécution ?', options: ['async', 'defer', 'lazy'], bonne: 1, explication: 'defer exécute après l\'analyse, dans l\'ordre ; async exécute dès réception, sans ordre.' },
            { q: 'Faut-il mettre <code>loading="lazy"</code> sur l\'image principale visible en haut de page ?', options: ['Oui, toujours', 'Non, cela retarderait le LCP', 'Seulement sur mobile'], bonne: 1, explication: 'L\'image LCP doit être chargée en priorité (fetchpriority="high").' }
          ]
        },
        {
          titre: 'Outils, débogage et validation',
          theorie: `<p>Écrire du HTML, c'est aussi savoir l'inspecter, le corriger et le vérifier. Les outils sont gratuits et intégrés au navigateur.</p>
<h2>L'inspecteur (DevTools)</h2>
<p><kbd>F12</kbd> ou clic droit → « Inspecter ». L'onglet <strong>Éléments</strong> montre le DOM réel (tel que le navigateur l'a compris, corrections automatiques comprises), les styles appliqués, le modèle de boîte. Tu peux modifier le HTML en direct pour tester : rien n'est sauvegardé, c'est un bac à sable.</p>
<p>Astuces : <kbd>Ctrl+F</kbd> dans Éléments accepte un sélecteur CSS ; le bouton « sélectionner un élément » (flèche en haut à gauche) cible un élément en cliquant dessus ; le mode « appareil » simule un mobile.</p>
<h2>Ce que le navigateur corrige silencieusement</h2>
<p>Un <code>&lt;p&gt;</code> non fermé, une balise de bloc dans un <code>&lt;p&gt;</code>, un <code>&lt;li&gt;</code> hors liste : le navigateur répare au mieux, souvent pas comme tu l'imaginais. Résultat : un style qui « ne s'applique pas » ou une mise en page cassée. L'inspecteur révèle la structure réelle ; le validateur explique pourquoi.</p>
<h2>Le validateur W3C</h2>
<p><a href="https://validator.w3.org" target="_blank" rel="noopener">validator.w3.org</a> accepte une URL, un fichier ou du texte collé. Lis les erreurs de haut en bas : une erreur en entraîne souvent d'autres. Les messages fréquents :</p>
<table><tr><th>Message</th><th>Cause</th></tr>
<tr><td>Element <code>div</code> not allowed as child of element <code>p</code></td><td>Bloc dans un paragraphe</td></tr>
<tr><td>Duplicate ID</td><td>Même id deux fois</td></tr>
<tr><td>An <code>img</code> element must have an <code>alt</code> attribute</td><td>alt manquant</td></tr>
<tr><td>Stray end tag</td><td>Fermeture sans ouverture</td></tr>
<tr><td>Unclosed element</td><td>Ouverture sans fermeture</td></tr></table>
<h2>Éditeur de code</h2>
<p>VS Code (gratuit) avec Emmet intégré : tape <code>ul&gt;li*3&gt;a</code> puis <kbd>Tab</kbd> pour générer une liste de trois liens, <code>!</code> pour le squelette complet. Extensions utiles : Live Server (rechargement automatique), Prettier (formatage), HTMLHint (erreurs en direct).</p>
<h2>Déboguer méthodiquement</h2>
<ol><li>Reproduire le problème et isoler la zone (commenter des blocs).</li><li>Inspecter l'élément : la balise est-elle celle attendue ? Les classes sont-elles présentes ?</li><li>Valider le HTML.</li><li>Vérifier la console (onglet Console) : erreurs de chargement de ressources (404), erreurs JS.</li><li>Tester dans un autre navigateur.</li></ol>
<h2>Versionner et publier</h2>
<p>Git conserve l'historique (parcours « Git & ligne de commande »). Pour publier un site statique gratuitement : Netlify, GitHub Pages, Cloudflare Pages. Un simple glisser-déposer du dossier suffit sur Netlify.</p>
<div class="callout info"><b>Routine qualité</b>Avant de publier : validation W3C, Lighthouse ≥ 90 partout, test clavier, test mobile réel, liens vérifiés (aucun 404).</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Débogage : page cassée',
            enonce: `<p>La page de départ contient cinq erreurs de structure qu'un validateur signalerait : un <code>div</code> dans un <code>p</code>, un <code>id</code> dupliqué, un <code>li</code> hors liste, une balise fermante orpheline <code>&lt;/span&gt;</code> et une image sans <code>alt</code>. Corrige-les toutes sans changer le contenu visible : le résultat doit contenir deux <code>p</code>, une liste <code>ul</code> de trois <code>li</code>, deux <code>id</code> distincts et une image avec <code>alt</code>.</p>`,
            depart: page(`  <h1 id="titre">Atelier dégustation</h1>
  <p>Rejoignez-nous samedi <div>à 10h</div> pour découvrir trois origines.</p>
  <p id="titre">Au programme :</p>
  <ul>
    <li>Brésil</li>
    <li>Éthiopie</li>
  </ul>
  <li>Colombie</li>
  <p>Places limitées.</span></p>
  <img src="atelier.jpg">`),
            solution: page(`  <h1 id="titre">Atelier dégustation</h1>
  <p>Rejoignez-nous samedi à 10h pour découvrir trois origines.</p>
  <p id="programme">Au programme :</p>
  <ul>
    <li>Brésil</li>
    <li>Éthiopie</li>
    <li>Colombie</li>
  </ul>
  <p>Places limitées.</p>
  <img src="atelier.jpg" alt="Participants autour d'une table de dégustation">`),
            tests: [dom('Aucun div dans un p', d => !d.querySelector('p div') && !d.querySelector('div')), dom('Les id sont uniques', d => { const ids = [...d.querySelectorAll('[id]')].map(e => e.id); return new Set(ids).size === ids.length && ids.length >= 2; }), dom('Une ul contenant 3 li, aucun li orphelin', d => d.querySelectorAll('ul > li').length === 3 && [...d.querySelectorAll('li')].every(li => li.parentElement.tagName === 'UL')), dom('Le texte « Rejoignez-nous samedi à 10h » est dans un seul paragraphe', d => [...d.querySelectorAll('p')].some(p => /Rejoignez-nous samedi à 10h pour découvrir/.test(p.textContent.replace(/\s+/g, ' ')))), codeRegex(/^(?![\s\S]*<\/span>)/, 'Plus de </span> orphelin', 'Supprime la balise fermante </span> qui n\'a pas d\'ouvrante.'), dom('Image avec alt', d => d.querySelector('img')?.getAttribute('alt')?.trim().length > 0)]
          },
          quiz: [
            { q: 'L\'onglet Éléments des DevTools montre :', options: ['Le code source exact du fichier', 'Le DOM tel que le navigateur l\'a construit', 'Le CSS uniquement'], bonne: 1, explication: 'Les corrections automatiques et les modifications JS y apparaissent : c\'est la vérité du rendu.' },
            { q: 'Que signifie « Stray end tag » ?', options: ['Une balise fermante sans ouvrante', 'Une balise obsolète', 'Un attribut inconnu'], bonne: 0, explication: 'Il faut retrouver l\'ouverture manquante ou supprimer la fermeture.' },
            { q: 'Que génère l\'abréviation Emmet <code>ul&gt;li*3</code> ?', options: ['Trois listes', 'Une liste de trois éléments', 'Une erreur'], bonne: 1, explication: '> signifie « enfant », *3 répète l\'élément trois fois.' }
          ]
        }
      ]
    },
    {
      titre: 'Projet final : site portfolio', niveau: 'Intermédiaire', description: 'Construire un site de présentation complet : structure, contenu, formulaire de contact et publication.',
      lecons: [
        {
          titre: 'Projet (1/4) : structure et navigation',
          theorie: `<p>Projet final : un <strong>portfolio</strong> d'une page (<em>one-page</em>) présentant une personne ou une petite activité : accueil, à propos, réalisations, contact. C'est le site le plus demandé aux débutants, et le plus utile pour décrocher une mission ou un emploi.</p>
<h2>Cahier des charges</h2>
<ul><li>Une seule page <code>index.html</code>, navigation par ancres.</li><li>Quatre sections : <code>#accueil</code>, <code>#a-propos</code>, <code>#realisations</code>, <code>#contact</code>.</li><li>HTML sémantique, accessible, validé, avec un head complet (SEO et partage).</li><li>Un formulaire de contact fonctionnel (via un service de formulaires statiques ou <code>mailto:</code>).</li><li>Publié en ligne.</li></ul>
<h2>Arborescence</h2>
${code('bash', `portfolio/
├── index.html
├── css/style.css
├── images/
│   ├── portrait.webp
│   ├── projet-1.webp
│   └── partage.jpg
└── favicon.svg`)}
<h2>Squelette de la page</h2>
${code('html', `<body>
  <a href="#contenu" class="skip-link">Aller au contenu</a>
  <header class="site-header">
    <a href="#accueil" class="logo">Camille Dubois</a>
    <nav aria-label="Navigation principale">
      <ul>
        <li><a href="#a-propos">À propos</a></li>
        <li><a href="#realisations">Réalisations</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>

  <main id="contenu">
    <section id="accueil" aria-labelledby="titre-accueil">
      <h1 id="titre-accueil">Développeuse web à Bordeaux</h1>
      <p>Je conçois des sites rapides, accessibles et faciles à maintenir.</p>
      <a href="#contact" class="btn">Me contacter</a>
    </section>
    <section id="a-propos" aria-labelledby="titre-apropos">
      <h2 id="titre-apropos">À propos</h2>
    </section>
    <section id="realisations" aria-labelledby="titre-realisations">
      <h2 id="titre-realisations">Réalisations</h2>
    </section>
    <section id="contact" aria-labelledby="titre-contact">
      <h2 id="titre-contact">Contact</h2>
    </section>
  </main>

  <footer class="site-footer">
    <p>© 2026 Camille Dubois · <a href="mentions.html">Mentions légales</a></p>
  </footer>
</body>`)}
<p><code>aria-labelledby</code> relie chaque section à son titre : les lecteurs d'écran annoncent « région À propos ». Les ancres de navigation pointent vers les <code>id</code> des sections.</p>
<h2>Le menu sur mobile</h2>
<p>Un menu de trois ou quatre liens tient sur une ligne même sur mobile : pas besoin de « hamburger ». Si tu en ajoutes un plus tard, ce sera un <code>&lt;button aria-expanded&gt;</code> qui affiche la liste, jamais un <code>div</code>.</p>
<h2>Défilement doux et ancres</h2>
<p>En CSS, <code>html { scroll-behavior: smooth; }</code> anime le défilement vers les ancres, et <code>scroll-margin-top</code> sur les sections compense un en-tête fixe. Tout cela sans JavaScript.</p>
<div class="callout info"><b>Contenu d'abord</b>Écris de vrais textes dès maintenant (pas de « lorem ipsum ») : le vrai contenu révèle les vrais besoins de structure.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Squelette du portfolio',
            enonce: `<p>Construis le squelette : lien d'évitement vers <code>#contenu</code>, <code>header</code> avec un lien logo et un <code>nav aria-label</code> contenant une liste de 3 liens vers <code>#a-propos</code>, <code>#realisations</code>, <code>#contact</code> ; <code>main id="contenu"</code> contenant 4 <code>section</code> (<code>#accueil</code> avec le seul <code>h1</code>, puis trois sections avec un <code>h2</code>), chaque section reliée à son titre par <code>aria-labelledby</code> ; et un <code>footer</code>.</p>`,
            depart: page(`  <!-- lien d'évitement, header + nav, main avec 4 sections, footer -->`),
            solution: page(`  <a href="#contenu" class="skip-link">Aller au contenu</a>
  <header class="site-header">
    <a href="#accueil" class="logo">Camille Dubois</a>
    <nav aria-label="Navigation principale">
      <ul>
        <li><a href="#a-propos">À propos</a></li>
        <li><a href="#realisations">Réalisations</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  <main id="contenu">
    <section id="accueil" aria-labelledby="titre-accueil">
      <h1 id="titre-accueil">Développeuse web à Bordeaux</h1>
      <p>Je conçois des sites rapides, accessibles et faciles à maintenir.</p>
    </section>
    <section id="a-propos" aria-labelledby="titre-apropos">
      <h2 id="titre-apropos">À propos</h2>
      <p>Dix ans d'expérience en agence et en freelance.</p>
    </section>
    <section id="realisations" aria-labelledby="titre-realisations">
      <h2 id="titre-realisations">Réalisations</h2>
      <p>Sélection de projets récents.</p>
    </section>
    <section id="contact" aria-labelledby="titre-contact">
      <h2 id="titre-contact">Contact</h2>
      <p>Parlons de votre projet.</p>
    </section>
  </main>
  <footer class="site-footer">
    <p>© 2026 Camille Dubois</p>
  </footer>`),
            tests: [dom('Lien d\'évitement vers #contenu en premier', d => { const f = d.body.firstElementChild; return f?.tagName === 'A' && f.getAttribute('href') === '#contenu'; }), dom('header avec nav[aria-label] et 3 liens d\'ancre', d => { const links = [...d.querySelectorAll('header nav[aria-label] ul li a')].map(a => a.getAttribute('href')); return ['#a-propos', '#realisations', '#contact'].every(h => links.includes(h)); }), dom('main#contenu avec 4 sections aux bons id', d => ['accueil', 'a-propos', 'realisations', 'contact'].every(id => d.querySelector(`main#contenu > section#${CSS.escape(id)}`))), dom('Un seul h1 dans #accueil, un h2 dans les autres sections', d => d.querySelectorAll('h1').length === 1 && !!d.querySelector('#accueil h1') && ['a-propos', 'realisations', 'contact'].every(id => d.querySelector(`#${CSS.escape(id)} h2`))), dom('Chaque section a aria-labelledby pointant vers son titre', d => [...d.querySelectorAll('main section')].every(s => { const id = s.getAttribute('aria-labelledby'); return id && s.querySelector(`#${CSS.escape(id)}`); })), dom('footer présent', d => !!d.querySelector('body > footer'))]
          },
          quiz: [
            { q: 'À quoi sert <code>aria-labelledby</code> sur une section ?', options: ['À la styler', 'À lui donner le nom de son titre pour les technologies d\'assistance', 'À créer un lien'], bonne: 1, explication: 'La section devient une région nommée, navigable au lecteur d\'écran.' },
            { q: 'Comment un lien <code>href="#contact"</code> trouve-t-il sa cible ?', options: ['Par la classe contact', 'Par l\'élément dont l\'id est contact', 'Par le texte du lien'], bonne: 1, explication: 'Les ancres ciblent des id.' },
            { q: 'Quel élément pour un bouton de menu mobile ?', options: ['div onclick', 'button aria-expanded', 'a href="#"'], bonne: 1, explication: 'Un vrai bouton est focusable, et aria-expanded indique l\'état ouvert/fermé.' }
          ]
        },
        {
          titre: 'Projet (2/4) : contenu et réalisations',
          theorie: `<p>Le squelette en place, remplissons-le. Un bon portfolio raconte une histoire courte : qui tu es, ce que tu sais faire, la preuve par les projets, comment te joindre.</p>
<h2>Section accueil</h2>
<p>Un titre qui dit <em>quoi</em> et <em>pour qui</em> (« Développeuse web pour les artisans et commerçants »), une phrase de promesse, un bouton d'action principal. Pas de carrousel, pas de slogan vague.</p>
<h2>Section à propos</h2>
${code('html', `<section id="a-propos" aria-labelledby="titre-apropos">
  <h2 id="titre-apropos">À propos</h2>
  <img src="images/portrait.webp" alt="Portrait de Camille Dubois" width="320" height="320" loading="lazy">
  <p>Après dix ans en agence, j'accompagne les petites entreprises…</p>
  <h3>Compétences</h3>
  <ul class="competences">
    <li>HTML, CSS, JavaScript</li>
    <li>Accessibilité (RGAA)</li>
    <li>Performance et SEO</li>
  </ul>
  <p><a href="cv.pdf" download>Télécharger mon CV (PDF, 120 Ko)</a></p>
</section>`)}
<p>Indique le format et le poids d'un fichier téléchargeable : c'est une bonne pratique d'accessibilité.</p>
<h2>Section réalisations : une carte par projet</h2>
${code('html', `<ul class="projets">
  <li>
    <article class="projet" aria-labelledby="projet-1">
      <img src="images/projet-1.webp" alt="Page d'accueil du site de la boulangerie Martin" width="600" height="400" loading="lazy">
      <h3 id="projet-1">Boulangerie Martin</h3>
      <p>Site vitrine avec horaires, commande de gâteaux et fiche Google. Temps de chargement divisé par trois.</p>
      <p class="tags"><span>HTML</span> <span>CSS</span> <span>SEO local</span></p>
      <a href="https://boulangerie-martin.fr" target="_blank" rel="noopener">Voir le site <span class="visually-hidden">(nouvel onglet)</span></a>
    </article>
  </li>
</ul>`)}
<ul><li>Une liste <code>ul</code> de projets : le lecteur d'écran annonce « liste, 3 éléments ».</li><li>Chaque projet est un <code>article</code> avec son titre <code>h3</code> (on est sous le <code>h2</code> « Réalisations »).</li><li>La description répond à : <em>quel problème, quelle solution, quel résultat</em>.</li><li>Le texte de lien est explicite ; la mention « nouvel onglet » est fournie aux lecteurs d'écran via une classe <code>visually-hidden</code> (texte masqué visuellement en CSS).</li></ul>
<h2>Témoignages</h2>
${code('html', `<figure class="temoignage">
  <blockquote><p>Un site livré en deux semaines, et des clients qui nous trouvent enfin sur Google.</p></blockquote>
  <figcaption>— Sophie Martin, gérante</figcaption>
</figure>`)}
<p><code>figure</code> + <code>blockquote</code> + <code>figcaption</code> est la structure correcte pour une citation attribuée.</p>
<h2>Rédaction</h2>
<ul><li>Phrases courtes, voix active, chiffres concrets.</li><li>Un ton cohérent (tutoiement ou vouvoiement, pas les deux).</li><li>Relis à voix haute ; fais relire.</li><li>Pas de jargon pour un public non technique : « site rapide » plutôt que « LCP optimisé ».</li></ul>
<div class="callout info"><b>Images de projets</b>Capture d'écran recadrée au format 3:2, convertie en WebP (Squoosh.app), 600 px de large suffisent pour une carte.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Les réalisations',
            enonce: `<p>Complète la section <code>#realisations</code> : une <code>ul class="projets"</code> contenant 3 <code>li</code>, chacun avec un <code>article</code> relié par <code>aria-labelledby</code> à son <code>h3</code>, une image (<code>alt</code>, <code>width</code>, <code>height</code>, <code>loading="lazy"</code>), un paragraphe de description d'au moins 60 caractères, et un lien externe avec <code>rel="noopener"</code>. Ajoute aussi un témoignage structuré <code>figure &gt; blockquote + figcaption</code>.</p>`,
            depart: page(`  <main id="contenu">
    <section id="realisations" aria-labelledby="titre-realisations">
      <h2 id="titre-realisations">Réalisations</h2>
      <!-- liste de projets + témoignage -->
    </section>
  </main>`),
            solution: page(`  <main id="contenu">
    <section id="realisations" aria-labelledby="titre-realisations">
      <h2 id="titre-realisations">Réalisations</h2>
      <ul class="projets">
        <li>
          <article class="projet" aria-labelledby="projet-1">
            <img src="images/projet-1.webp" alt="Page d'accueil du site de la boulangerie Martin" width="600" height="400" loading="lazy">
            <h3 id="projet-1">Boulangerie Martin</h3>
            <p>Site vitrine avec horaires, commande de gâteaux en ligne et fiche Google optimisée. Temps de chargement divisé par trois.</p>
            <a href="https://boulangerie-martin.example" target="_blank" rel="noopener">Voir le site</a>
          </article>
        </li>
        <li>
          <article class="projet" aria-labelledby="projet-2">
            <img src="images/projet-2.webp" alt="Catalogue en ligne de la librairie Pages" width="600" height="400" loading="lazy">
            <h3 id="projet-2">Librairie Pages</h3>
            <p>Catalogue de 2 000 références avec recherche instantanée et réservation en boutique. Accessible RGAA.</p>
            <a href="https://librairie-pages.example" target="_blank" rel="noopener">Voir le site</a>
          </article>
        </li>
        <li>
          <article class="projet" aria-labelledby="projet-3">
            <img src="images/projet-3.webp" alt="Application de réservation du cabinet Kiné Loire" width="600" height="400" loading="lazy">
            <h3 id="projet-3">Cabinet Kiné Loire</h3>
            <p>Prise de rendez-vous en ligne et rappels automatiques par SMS. Quarante pour cent d'appels en moins au secrétariat.</p>
            <a href="https://kine-loire.example" target="_blank" rel="noopener">Voir le site</a>
          </article>
        </li>
      </ul>
      <figure class="temoignage">
        <blockquote><p>Un site livré en deux semaines, et des clients qui nous trouvent enfin sur Google.</p></blockquote>
        <figcaption>— Sophie Martin, gérante de la boulangerie Martin</figcaption>
      </figure>
    </section>
  </main>`),
            tests: [dom('ul.projets avec 3 li contenant chacun un article', d => d.querySelectorAll('ul.projets > li > article').length === 3), dom('Chaque article est relié à son h3 par aria-labelledby', d => [...d.querySelectorAll('ul.projets article')].every(a => { const id = a.getAttribute('aria-labelledby'); return id && a.querySelector(`h3#${CSS.escape(id)}`); })), dom('Images avec alt, width, height et lazy', d => [...d.querySelectorAll('ul.projets article img')].length === 3 && [...d.querySelectorAll('ul.projets article img')].every(i => i.getAttribute('alt')?.trim() && i.hasAttribute('width') && i.hasAttribute('height') && i.getAttribute('loading') === 'lazy')), dom('Descriptions d\'au moins 60 caractères', d => [...d.querySelectorAll('ul.projets article')].every(a => [...a.querySelectorAll('p')].some(p => p.textContent.trim().length >= 60))), dom('Liens externes avec rel=noopener', d => [...d.querySelectorAll('ul.projets article a[href^="http"]')].length === 3 && [...d.querySelectorAll('ul.projets article a[href^="http"]')].every(a => /noopener/.test(a.rel))), dom('Témoignage figure > blockquote + figcaption', d => { const f = d.querySelector('#realisations figure'); return f && f.querySelector('blockquote') && f.querySelector('figcaption'); })]
          },
          quiz: [
            { q: 'Quel niveau de titre pour un projet sous le h2 « Réalisations » ?', options: ['h1', 'h2', 'h3'], bonne: 2, explication: 'On descend d\'un niveau à chaque imbrication, sans sauter.' },
            { q: 'Quelle structure pour une citation attribuée ?', options: ['p + i', 'figure > blockquote + figcaption', 'q + span'], bonne: 1, explication: 'figcaption porte l\'attribution ; blockquote le texte cité.' },
            { q: 'Pourquoi mettre les projets dans une <code>ul</code> ?', options: ['Pour les puces', 'Pour annoncer une liste et son nombre d\'éléments aux lecteurs d\'écran', 'C\'est obligatoire pour article'], bonne: 1, explication: 'Les puces se retirent en CSS ; la sémantique de liste reste utile.' }
          ]
        },
        {
          titre: 'Projet (3/4) : formulaire de contact',
          theorie: `<p>Un site statique n'a pas de serveur pour recevoir un formulaire. Trois solutions, de la plus simple à la plus robuste.</p>
<h2>Option 1 : mailto</h2>
${code('html', `<a href="mailto:camille@exemple.fr?subject=Projet%20web">Écrivez-moi</a>`)}
<p>Ouvre le client mail de l'utilisateur. Simple, mais ne fonctionne pas si aucun client n'est configuré (fréquent sur ordinateur), et expose ton adresse aux robots spammeurs.</p>
<h2>Option 2 : service de formulaires statiques</h2>
<p>Netlify Forms, Formspree, Web3Forms, Basin… reçoivent les données et t'envoient un email. Avec Netlify, un seul attribut suffit :</p>
${code('html', `<form name="contact" method="post" data-netlify="true" netlify-honeypot="site-web">
  <p hidden><label>Ne pas remplir : <input name="site-web"></label></p>   <!-- piège à robots -->
  <label for="nom">Nom</label>
  <input id="nom" name="nom" type="text" required autocomplete="name">
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required autocomplete="email">
  <label for="sujet">Sujet</label>
  <select id="sujet" name="sujet">
    <option value="site">Création de site</option>
    <option value="refonte">Refonte</option>
    <option value="autre">Autre</option>
  </select>
  <label for="message">Message</label>
  <textarea id="message" name="message" rows="6" required minlength="20"></textarea>
  <label><input type="checkbox" name="rgpd" required> J'accepte que mes données servent à traiter ma demande.</label>
  <button type="submit">Envoyer</button>
</form>`)}
<p>Le <em>honeypot</em> est un champ invisible : un humain ne le remplit pas, un robot si. Le service rejette alors l'envoi.</p>
<h2>Option 3 : ton propre backend</h2>
<p>Une fonction serverless (Netlify Functions, Cloudflare Workers) ou une petite API Node/Python reçoit le POST, valide, envoie l'email via un service (Resend, Brevo). Nécessaire pour des traitements personnalisés.</p>
<h2>RGPD : les obligations</h2>
<ul><li>Dire <em>pourquoi</em> on collecte (traiter la demande) et <em>combien de temps</em> on conserve.</li><li>Une case de consentement non pré-cochée quand les données servent à autre chose que répondre (newsletter).</li><li>Un lien vers une politique de confidentialité et des mentions légales (obligatoires en France pour tout site professionnel : identité, hébergeur, contact).</li><li>Ne collecter que le nécessaire : pas de téléphone obligatoire pour une simple question.</li></ul>
<h2>Après l'envoi</h2>
<p>Redirige vers une page de remerciement (<code>action="/merci.html"</code>) ou affiche un message dans une zone <code>role="status"</code>. Précise le délai de réponse. Propose un canal alternatif (téléphone, réseaux).</p>
<h2>Accessibilité du formulaire</h2>
<p>Labels visibles (pas seulement placeholder), ordre logique, bouton explicite (« Envoyer ma demande »), messages d'erreur reliés au champ (<code>aria-describedby</code>), et un <code>autocomplete</code> correct pour accélérer la saisie.</p>
<div class="callout warn"><b>Spam</b>Même avec un honeypot, attends-toi à quelques envois indésirables. Les services proposent en option un reCAPTCHA/hCaptcha : à activer seulement si nécessaire, car il pénalise l'accessibilité.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Formulaire de contact complet',
            enonce: `<p>Dans la section contact, crée un formulaire <code>method="post"</code> avec <code>data-netlify="true"</code> et <code>netlify-honeypot</code> désignant un champ caché, les champs nom (obligatoire, <code>autocomplete="name"</code>), email (type email, obligatoire, <code>autocomplete="email"</code>), un <code>select</code> sujet d'au moins 3 options, un <code>textarea</code> obligatoire avec <code>minlength</code>, une case à cocher de consentement obligatoire et un bouton d'envoi explicite. Chaque champ a un label associé. Ajoute dans la section un lien vers <code>mentions.html</code>.</p>`,
            depart: page(`  <section id="contact" aria-labelledby="titre-contact">
    <h2 id="titre-contact">Contact</h2>
    <!-- formulaire -->
  </section>`),
            solution: page(`  <section id="contact" aria-labelledby="titre-contact">
    <h2 id="titre-contact">Contact</h2>
    <form name="contact" method="post" data-netlify="true" netlify-honeypot="site-web" action="/merci.html">
      <p hidden><label>Ne pas remplir : <input name="site-web"></label></p>
      <p><label for="nom">Nom</label> <input id="nom" name="nom" type="text" required autocomplete="name"></p>
      <p><label for="email">Email</label> <input id="email" name="email" type="email" required autocomplete="email"></p>
      <p><label for="sujet">Sujet</label>
        <select id="sujet" name="sujet">
          <option value="site">Création de site</option>
          <option value="refonte">Refonte</option>
          <option value="autre">Autre demande</option>
        </select></p>
      <p><label for="message">Message</label><br><textarea id="message" name="message" rows="6" required minlength="20"></textarea></p>
      <p><label><input type="checkbox" name="rgpd" required> J'accepte que mes données servent uniquement à traiter ma demande (conservées 12 mois).</label></p>
      <button type="submit">Envoyer ma demande</button>
    </form>
    <p>Vos données ne sont jamais transmises à des tiers. <a href="mentions.html">Mentions légales et confidentialité</a>.</p>
  </section>`),
            tests: [dom('form post avec data-netlify et honeypot vers un champ caché', d => { const f = d.querySelector('#contact form'); if (!f || (f.getAttribute('method') || '').toLowerCase() !== 'post' || !f.hasAttribute('data-netlify')) return false; const hp = f.getAttribute('netlify-honeypot'); const champ = hp && f.querySelector(`input[name="${hp}"]`); return champ && (champ.closest('[hidden]') || champ.hidden); }), dom('Champ nom obligatoire avec autocomplete=name', d => !!d.querySelector('#contact form input[name="nom"][required][autocomplete="name"]')), dom('Champ email type=email obligatoire avec autocomplete=email', d => !!d.querySelector('#contact form input[type="email"][required][autocomplete="email"]')), dom('select sujet avec 3 options ou plus', d => d.querySelectorAll('#contact form select option').length >= 3), dom('textarea obligatoire avec minlength', d => !!d.querySelector('#contact form textarea[required][minlength]')), dom('Case de consentement obligatoire', d => !!d.querySelector('#contact form input[type="checkbox"][required]')), dom('Tous les champs visibles ont un label associé', d => [...d.querySelectorAll('#contact form input:not([hidden]), #contact form select, #contact form textarea')].filter(c => !c.closest('[hidden]')).every(c => c.closest('label') || (c.id && d.querySelector(`label[for="${c.id}"]`)))), dom('Bouton submit et lien mentions.html', d => !!d.querySelector('#contact form button') && !!d.querySelector('#contact a[href="mentions.html"]'))]
          },
          quiz: [
            { q: 'Qu\'est-ce qu\'un honeypot dans un formulaire ?', options: ['Un champ caché que seuls les robots remplissent', 'Un captcha', 'Un champ obligatoire'], bonne: 0, explication: 'Si le champ caché est rempli, l\'envoi est rejeté comme spam.' },
            { q: 'Quel inconvénient majeur de <code>mailto:</code> ?', options: ['C\'est payant', 'Cela dépend d\'un client mail configuré et expose l\'adresse', 'Cela ne marche pas sur mobile'], bonne: 1, explication: 'Un service de formulaires est plus fiable.' },
            { q: 'Que doit indiquer un formulaire conforme au RGPD ?', options: ['La version du navigateur', 'La finalité et la durée de conservation des données', 'Le nom de l\'hébergeur uniquement'], bonne: 1, explication: 'Information claire, consentement si nécessaire, minimisation des données.' }
          ]
        },
        {
          titre: 'Projet (4/4) : finitions et mise en ligne',
          theorie: `<p>Dernière ligne droite : vérifier, optimiser, publier et faire connaître.</p>
<h2>Checklist avant publication</h2>
<ol><li><strong>Validation</strong> W3C : zéro erreur.</li>
<li><strong>Head</strong> complet : title, description, canonical, favicon, Open Graph avec image 1200×630.</li>
<li><strong>Accessibilité</strong> : parcours clavier, Lighthouse ≥ 95, contrastes, alt, labels.</li>
<li><strong>Performance</strong> : images WebP dimensionnées, lazy, scripts defer, Lighthouse ≥ 90 sur mobile.</li>
<li><strong>Liens</strong> : tous testés, aucun 404, liens externes en noopener.</li>
<li><strong>Mentions légales</strong> et politique de confidentialité.</li>
<li><strong>Page 404</strong> personnalisée (<code>404.html</code> sur Netlify) avec un lien vers l'accueil.</li>
<li><strong>Test réel</strong> sur un téléphone, en 4G, et sur deux navigateurs.</li></ol>
<h2>Publier sur Netlify</h2>
<ol><li>Crée un compte sur netlify.com.</li><li>« Add new site → Deploy manually » : glisse le dossier du projet. Le site est en ligne en quelques secondes sur une adresse <code>nom-aleatoire.netlify.app</code>.</li><li>Renomme le site (Site settings → Change site name).</li><li>Pour un nom de domaine personnel (<code>camille-dubois.fr</code>, ~10 €/an chez un registrar) : ajoute-le dans « Domain management » et configure les DNS indiqués. HTTPS est automatique.</li></ol>
<p>Alternative avec Git : connecte un dépôt GitHub ; chaque <code>git push</code> redéploie le site. Voir le parcours Git.</p>
<h2>Fichiers utiles à la racine</h2>
${code('bash', `robots.txt       # User-agent: *  /  Allow: /  /  Sitemap: https://site.fr/sitemap.xml
sitemap.xml      # liste des URL (une seule pour un one-page)
404.html         # page introuvable
_redirects       # Netlify : redirections (ancienne-url  nouvelle-url  301)
netlify.toml     # configuration (en-têtes de sécurité, cache)`)}
<h2>En-têtes de sécurité</h2>
${code('bash', `# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; img-src 'self' data:; style-src 'self'"`)}
<h2>Faire connaître le site</h2>
<ul><li>Déclare-le dans <strong>Google Search Console</strong> : indexation, erreurs, requêtes qui amènent des visites.</li><li>Ajoute le lien sur LinkedIn, GitHub, ta signature mail.</li><li>Un outil de statistiques respectueux de la vie privée (Plausible, Umami, ou les analytics Netlify) évite la bannière de cookies.</li></ul>
<h2>Maintenir</h2>
<p>Mets à jour les réalisations tous les trimestres, vérifie les liens, relance Lighthouse après chaque changement. Un portfolio vivant vaut mieux qu'un portfolio parfait.</p>
<div class="callout ok"><b>Projet terminé</b>Tu sais désormais structurer n'importe quelle page de façon sémantique, accessible et performante. Le parcours CSS lui donnera son apparence.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Page 404 et head de production',
            enonce: `<p>Crée la page <code>404.html</code> du portfolio : <code>html lang="fr"</code>, head avec charset, viewport, un <code>title</code> contenant « introuvable », <code>meta name="robots" content="noindex"</code>, un favicon ; dans le body un <code>main</code> avec un <code>h1</code>, un paragraphe explicatif et un lien vers <code>/</code> (l'accueil), plus une <code>nav aria-label</code> proposant au moins 2 liens vers les sections de l'accueil (<code>/#realisations</code>, <code>/#contact</code>).</p>`,
            depart: `<!doctype html>
<html>
<head>
</head>
<body>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page introuvable — Camille Dubois</title>
  <meta name="robots" content="noindex">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <main id="contenu">
    <h1>Oups, cette page n'existe pas</h1>
    <p>L'adresse a peut-être changé, ou le lien contenait une erreur.</p>
    <p><a href="/">Retour à l'accueil</a></p>
    <nav aria-label="Raccourcis">
      <ul>
        <li><a href="/#realisations">Voir mes réalisations</a></li>
        <li><a href="/#contact">Me contacter</a></li>
      </ul>
    </nav>
  </main>
</body>
</html>`,
            tests: [dom('lang, charset et viewport', d => d.documentElement.lang === 'fr' && !!d.querySelector('meta[charset]') && !!d.querySelector('meta[name="viewport"]')), dom('title contenant « introuvable »', d => /introuvable/i.test(d.title)), dom('meta robots noindex', d => /noindex/.test(d.querySelector('meta[name="robots"]')?.getAttribute('content') || '')), dom('Favicon', d => !!d.querySelector('link[rel~="icon"]')), dom('main avec h1, paragraphe et lien vers /', d => !!d.querySelector('main h1') && !!d.querySelector('main p') && !!d.querySelector('main a[href="/"]')), dom('nav aria-label avec 2 liens vers /#...', d => d.querySelectorAll('nav[aria-label] a[href^="/#"]').length >= 2)]
          },
          quiz: [
            { q: 'Pourquoi une page 404 porte-t-elle <code>noindex</code> ?', options: ['Pour la cacher aux utilisateurs', 'Pour éviter qu\'elle apparaisse dans les résultats de recherche', 'Pour la charger plus vite'], bonne: 1, explication: 'Une page d\'erreur n\'a pas vocation à être référencée.' },
            { q: 'Que fait Netlify quand on connecte un dépôt Git ?', options: ['Rien de plus', 'Il redéploie automatiquement à chaque push', 'Il supprime le site'], bonne: 1, explication: 'C\'est le déploiement continu : publier = pousser une version.' },
            { q: 'Quel outil de Google permet de suivre l\'indexation d\'un site ?', options: ['Google Ads', 'Search Console', 'Google Docs'], bonne: 1, explication: 'Search Console montre les pages indexées, les erreurs et les requêtes de recherche.' }
          ]
        }
      ]
    }
  ]
};
