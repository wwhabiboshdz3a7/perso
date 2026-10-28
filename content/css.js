import { code, dom, codeContient, codeRegex } from './_outils.js';

const base = (corps, titre = 'Exercice') => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${titre}</title></head><body>
${corps}
</body></html>`;
const px = (win, el, prop) => parseFloat(win.getComputedStyle(el)[prop]);
const cs = (win, el, prop) => win.getComputedStyle(el)[prop];

export default {
  description: 'CSS donne forme au web : couleurs, typographie, mise en page, animations et adaptation à tous les écrans. Ce parcours va des sélecteurs à un design system complet, avec un aperçu en direct pour chaque exercice.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Tu écris le CSS dans l'éditeur ; il est appliqué à un HTML fourni, affiché dans l'aperçu. Les tests lisent les styles réellement calculés par le navigateur (<code>getComputedStyle</code>), exactement comme l'inspecteur. L'aperçu est étroit (~400 px) : c'est volontaire, pense « mobile d'abord ».</p>`,
  modules: [
    {
      titre: 'Les fondamentaux', niveau: 'Débutant', description: 'Sélecteurs, cascade, couleurs, typographie et modèle de boîte.',
      lecons: [
        {
          titre: 'Sélecteurs et cascade',
          theorie: `<p>Une règle CSS = un <strong>sélecteur</strong> (quels éléments) + un bloc de <strong>déclarations</strong> (propriété : valeur). Tout l'art de CSS consiste à cibler précisément sans sur-spécifier.</p>
${code('css', `h1 { color: navy; font-size: 2rem; }      /* type */
.carte { padding: 16px; }                  /* classe : réutilisable */
#menu { position: sticky; }                /* id : unique, forte priorité */
a:hover { text-decoration: underline; }    /* pseudo-classe : état */
p::first-line { font-weight: bold; }       /* pseudo-élément : partie */
input[type="email"] { border-color: teal; } /* attribut */`)}
<h2>Combiner</h2>
${code('css', `nav a { }           /* descendant : tout a dans nav, à n'importe quelle profondeur */
nav > a { }         /* enfant direct */
h2 + p { }          /* frère immédiat : le p juste après un h2 */
h2 ~ p { }          /* frères suivants : tous les p après un h2 */
.btn.primaire { }   /* les deux classes sur le même élément */
.a, .b { }          /* liste : l'un ou l'autre */
li:first-child, li:last-child, li:nth-child(2n), li:not(.actif) { }
.carte:has(img) { } /* parent qui contient : enfin possible */`)}
<h2>La cascade : qui gagne ?</h2>
<p>Quand plusieurs règles ciblent le même élément, le navigateur tranche dans cet ordre :</p>
<ol><li><strong>Origine et importance</strong> : <code>!important</code> &gt; styles de l'auteur (toi) &gt; styles du navigateur.</li>
<li><strong>Spécificité</strong> : compte (id, classes/attributs/pseudo-classes, éléments). <code>#menu a</code> = (1,0,1) bat <code>nav ul li a</code> = (0,0,4). Un id bat n'importe quel nombre de classes.</li>
<li><strong>Ordre</strong> : à spécificité égale, la dernière règle écrite gagne.</li></ol>
<p>Le style en ligne (<code>style="…"</code>) bat tout sauf <code>!important</code>. D'où la règle d'or : <em>spécificité basse et uniforme</em> (des classes), pas d'id pour le style, pas de <code>!important</code> sauf pour écraser une bibliothèque tierce.</p>
<h2>Héritage</h2>
<p>Les propriétés de texte (<code>color</code>, <code>font-*</code>, <code>line-height</code>, <code>text-align</code>) se transmettent des parents aux enfants : définir <code>body { font-family: … }</code> suffit. Les propriétés de boîte (<code>margin</code>, <code>padding</code>, <code>border</code>, <code>background</code>) ne s'héritent pas. Les valeurs <code>inherit</code>, <code>initial</code>, <code>unset</code> contrôlent ce comportement.</p>
<h2>Les couches (@layer)</h2>
${code('css', `@layer reset, base, composants, utilitaires;
@layer base { a { color: inherit; } }
@layer utilitaires { .text-center { text-align: center; } }   /* gagne sur base quelle que soit la spécificité */`)}
<p>Les couches ordonnent la cascade par <em>catégorie</em> avant la spécificité : une solution moderne au chaos des gros projets.</p>
<div class="callout info"><b>Déboguer la cascade</b>Dans l'inspecteur, l'onglet Styles liste les règles appliquées, les barre quand elles sont écrasées et indique la source. C'est l'outil à ouvrir dès qu'un style « ne marche pas ».</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Cibler sans id ni !important',
            html: base(`<nav class="menu"><a href="#" class="actif">Accueil</a><a href="#">Blog</a><a href="#">Contact</a></nav>
<article class="post"><h2>Titre</h2><p class="chapo">Premier paragraphe.</p><p>Deuxième paragraphe avec un <a href="#">lien</a>.</p><ul><li>un</li><li>deux</li><li>trois</li></ul></article>`),
            enonce: `<p>Sans utiliser d'id ni <code>!important</code> : les liens du <code>nav.menu</code> sont sans soulignement (<code>text-decoration: none</code>) et de couleur <code>rgb(0, 0, 128)</code> ; le lien <code>.actif</code> est en gras (<code>font-weight: 700</code>) ; le paragraphe <code>.chapo</code> a <code>font-size: 20px</code> ; les liens dans <code>.post</code> (mais pas ceux du menu) sont de couleur <code>rgb(220, 20, 60)</code> ; seul le deuxième <code>li</code> a un fond <code>rgb(255, 255, 0)</code>.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `.menu a {
  text-decoration: none;
  color: rgb(0, 0, 128);
}
.menu a.actif {
  font-weight: 700;
}
.chapo {
  font-size: 20px;
}
.post a {
  color: rgb(220, 20, 60);
}
.post li:nth-child(2) {
  background: rgb(255, 255, 0);
}`,
            tests: [dom('Liens du menu sans soulignement et bleu marine', (d, w) => [...d.querySelectorAll('.menu a')].every(a => cs(w, a, 'textDecorationLine') === 'none' && cs(w, a, 'color') === 'rgb(0, 0, 128)')), dom('Lien actif en gras (700)', (d, w) => cs(w, d.querySelector('.menu .actif'), 'fontWeight') === '700'), dom('.chapo en 20px', (d, w) => px(w, d.querySelector('.chapo'), 'fontSize') === 20), dom('Lien de l\'article en rouge, menu inchangé', (d, w) => cs(w, d.querySelector('.post a'), 'color') === 'rgb(220, 20, 60)' && cs(w, d.querySelector('.menu a'), 'color') === 'rgb(0, 0, 128)'), dom('Seul le deuxième li a un fond jaune', (d, w) => { const li = d.querySelectorAll('.post li'); return cs(w, li[1], 'backgroundColor') === 'rgb(255, 255, 0)' && cs(w, li[0], 'backgroundColor') !== 'rgb(255, 255, 0)' && cs(w, li[2], 'backgroundColor') !== 'rgb(255, 255, 0)'; }), { nom: 'Ni id ni !important', verif: ctx => /#\w|!important/.test(ctx.code) ? 'Utilise uniquement des classes, types et pseudo-classes.' : true }]
          },
          quiz: [
            { q: 'Laquelle de ces règles gagne sur <code>.menu a</code> ?', options: ['a', 'nav a', '#menu a'], bonne: 2, explication: 'Un id l\'emporte sur toute combinaison de classes et d\'éléments.' },
            { q: 'Que sélectionne <code>h2 + p</code> ?', options: ['Tous les p après un h2', 'Le p immédiatement après un h2', 'Les p dans un h2'], bonne: 1, explication: '+ est le combinateur de frère adjacent.' },
            { q: 'Quelle propriété s\'hérite des parents ?', options: ['margin', 'color', 'border'], bonne: 1, explication: 'Les propriétés de texte s\'héritent ; celles de boîte non.' }
          ]
        },
        {
          titre: 'Couleurs, typographie et unités',
          theorie: `<p>Trois décisions font 80 % de l'impression visuelle d'un site : la palette, la typographie, les espacements. CSS offre pour chacune des outils précis.</p>
<h2>Couleurs</h2>
${code('css', `color: #1e293b;                 /* hexadécimal */
color: rgb(30 41 59 / 80%);      /* rgb avec transparence (syntaxe moderne) */
color: hsl(220 40% 17%);         /* teinte, saturation, luminosité : facile à décliner */
color: oklch(60% 0.15 250);      /* perceptuellement uniforme, large gamut */
color: color-mix(in srgb, #6d5dfc 70%, white);   /* mélange */
background: linear-gradient(135deg, #6d5dfc, #22c1c3);`)}
<p>HSL et OKLCH facilitent les variantes : garder la teinte, changer la luminosité pour les survols. Vérifie toujours le contraste texte/fond (4,5:1).</p>
<h2>Typographie</h2>
${code('css', `body {
  font-family: "Inter", system-ui, sans-serif;   /* liste de repli */
  font-size: 1rem;              /* 16px par défaut : respecte le réglage utilisateur */
  line-height: 1.6;             /* sans unité : proportionnel à la taille */
  font-weight: 400;
}
h1 { font-size: clamp(1.8rem, 4vw + 1rem, 3rem); letter-spacing: -0.02em; line-height: 1.1; }
p { max-width: 65ch; }          /* 45 à 75 caractères par ligne : confort de lecture */
.mono { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; }
@font-face { font-family: "Inter"; src: url("inter.woff2") format("woff2"); font-display: swap; }`)}
<h2>Unités : laquelle choisir ?</h2>
<table><tr><th>Unité</th><th>Relative à</th><th>Usage</th></tr>
<tr><td><code>px</code></td><td>pixel CSS</td><td>bordures, ombres, petits détails</td></tr>
<tr><td><code>rem</code></td><td>taille de police de <code>html</code> (16px)</td><td>tailles de texte, espacements : respecte le zoom utilisateur</td></tr>
<tr><td><code>em</code></td><td>taille de police de l'élément</td><td>padding d'un bouton proportionnel à son texte</td></tr>
<tr><td><code>%</code></td><td>parent</td><td>largeurs</td></tr>
<tr><td><code>vw</code>, <code>vh</code>, <code>dvh</code></td><td>fenêtre</td><td>sections plein écran (<code>dvh</code> gère la barre mobile)</td></tr>
<tr><td><code>ch</code></td><td>largeur du « 0 »</td><td>largeur de texte (<code>65ch</code>)</td></tr></table>
<p>Règle simple : <code>rem</code> pour presque tout, <code>px</code> pour les traits, <code>%</code>/<code>fr</code> pour les layouts. Jamais <code>font-size</code> en <code>px</code> sur <code>html</code> (casse le zoom par préférences).</p>
<h2>Fonctions de calcul</h2>
${code('css', `width: calc(100% - 2rem);
font-size: clamp(1rem, 2.5vw, 1.5rem);     /* min, préféré, max : typographie fluide */
padding: min(5vw, 3rem);
gap: max(1rem, 2vw);`)}
<h2>Texte : les propriétés utiles</h2>
<p><code>text-align</code>, <code>text-transform: uppercase</code>, <code>text-decoration</code>, <code>text-wrap: balance</code> (titres équilibrés), <code>hyphens: auto</code> (césure, avec <code>lang</code>), <code>overflow-wrap: anywhere</code> (URL longues), <code>white-space: nowrap</code>.</p>
<div class="callout info"><b>Système typographique</b>Une échelle de tailles (1rem, 1.25rem, 1.563rem, 1.953rem, 2.441rem = ratio 1.25) et une échelle d'espacements (0.25rem, 0.5rem, 1rem, 1.5rem, 2rem, 3rem) donnent une cohérence immédiate. Stocke-les dans des variables CSS (leçon 3.2).</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Mise en forme d\'un article',
            html: base(`<article class="article"><h1>Le café de spécialité</h1><p class="meta">10 février 2026 · 5 min</p><p>Le café de spécialité désigne des grains notés au-dessus de 80 sur 100 par des dégustateurs certifiés, cultivés avec soin et torréfiés pour révéler leur profil aromatique.</p><p>Le café de spécialité désigne des grains notés au-dessus de 80 sur 100 par des dégustateurs certifiés, cultivés avec soin et torréfiés pour révéler leur profil aromatique.</p></article>`),
            enonce: `<p>Style l'article : <code>body</code> avec une pile <code>font-family</code> se terminant par <code>sans-serif</code>, <code>line-height: 1.6</code> et une couleur de texte <code>rgb(30, 41, 59)</code> ; <code>h1</code> en <code>2.5rem</code> (40px) avec <code>line-height: 1.1</code> ; <code>.meta</code> en majuscules (<code>text-transform</code>), <code>0.875rem</code> et couleur <code>rgb(100, 116, 139)</code> ; les paragraphes limités à <code>60ch</code> de largeur maximale. Utilise des <code>rem</code>, pas de <code>px</code> pour les tailles de police.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `body {
  font-family: "Inter", system-ui, sans-serif;
  line-height: 1.6;
  color: rgb(30, 41, 59);
}
h1 {
  font-size: 2.5rem;
  line-height: 1.1;
}
.meta {
  text-transform: uppercase;
  font-size: 0.875rem;
  color: rgb(100, 116, 139);
}
p {
  max-width: 60ch;
}`,
            tests: [dom('body : famille sans-serif, line-height 1.6, couleur', (d, w) => /sans-serif/.test(cs(w, d.body, 'fontFamily')) && Math.abs(px(w, d.body, 'lineHeight') / px(w, d.body, 'fontSize') - 1.6) < 0.05 && cs(w, d.body, 'color') === 'rgb(30, 41, 59)'), dom('h1 : 40px, line-height 1.1', (d, w) => px(w, d.querySelector('h1'), 'fontSize') === 40 && Math.abs(px(w, d.querySelector('h1'), 'lineHeight') - 44) < 1), dom('.meta : majuscules, 14px, gris', (d, w) => { const m = d.querySelector('.meta'); return cs(w, m, 'textTransform') === 'uppercase' && px(w, m, 'fontSize') === 14 && cs(w, m, 'color') === 'rgb(100, 116, 139)'; }), dom('Paragraphes limités à 60ch', (d, w) => { const p = d.querySelectorAll('p')[1]; const mw = cs(w, p, 'maxWidth'); return mw !== 'none' && px(w, p, 'width') < 600; }), { nom: 'Tailles de police en rem', verif: ctx => /font-size\s*:\s*\d+px/.test(ctx.code) ? 'Utilise des rem pour font-size (2.5rem, 0.875rem).' : true }]
          },
          quiz: [
            { q: 'À quoi 1rem est-il relatif ?', options: ['À la taille de police du parent', 'À la taille de police de l\'élément html', 'À la largeur de l\'écran'], bonne: 1, explication: 'rem = root em. Par défaut 16px, ajustable par l\'utilisateur.' },
            { q: 'Que fait <code>clamp(1rem, 2.5vw, 2rem)</code> ?', options: ['Choisit la plus petite valeur', 'Une taille fluide entre 1rem et 2rem', 'Arrondit à 2rem'], bonne: 1, explication: 'La valeur préférée (2.5vw) est bornée par un minimum et un maximum.' },
            { q: 'Pourquoi <code>line-height: 1.6</code> sans unité ?', options: ['C\'est obligatoire', 'La valeur reste proportionnelle à la taille de police des descendants', 'C\'est plus rapide'], bonne: 1, explication: 'Avec une unité (px, em), les enfants hériteraient d\'une valeur figée.' }
          ]
        },
        {
          titre: 'Le modèle de boîte',
          theorie: `<p>Chaque élément HTML est une boîte rectangulaire composée, de l'intérieur vers l'extérieur, du <strong>contenu</strong>, du <strong>padding</strong> (marge interne), de la <strong>bordure</strong> et de la <strong>margin</strong> (marge externe). Comprendre ce modèle, c'est comprendre pourquoi « ça dépasse ».</p>
${code('css', `.carte {
  width: 300px;
  padding: 20px;
  border: 2px solid #ccc;
  margin: 16px;
}
/* Largeur réelle par défaut (content-box) : 300 + 20×2 + 2×2 = 344px, plus 32px de marges */`)}
<h2>box-sizing : la première règle de tout projet</h2>
${code('css', `*, *::before, *::after { box-sizing: border-box; }
/* Désormais width: 300px inclut padding et bordure : la boîte fait 300px, point. */`)}
<h2>Raccourcis</h2>
${code('css', `margin: 10px;                 /* les 4 côtés */
margin: 10px 20px;            /* haut/bas, gauche/droite */
margin: 10px 20px 5px;        /* haut, gauche/droite, bas */
margin: 10px 20px 5px 0;      /* haut, droite, bas, gauche (sens horaire) */
margin-inline: auto;          /* gauche et droite : centre un bloc de largeur fixe */
padding-block: 1rem;          /* haut et bas (propriétés logiques) */
border: 1px solid currentColor;
border-radius: 12px;`)}
<p>Les propriétés logiques (<code>inline</code>/<code>block</code>) s'adaptent au sens d'écriture ; prends l'habitude de les utiliser.</p>
<h2>Fusion des marges</h2>
<p>Deux marges verticales qui se touchent <em>fusionnent</em> : un <code>h2</code> avec <code>margin-bottom: 24px</code> suivi d'un <code>p</code> avec <code>margin-top: 16px</code> donne 24px d'écart, pas 40. C'est voulu pour le texte, surprenant ailleurs. Flexbox et Grid ne fusionnent pas les marges de leurs enfants ; <code>gap</code> est souvent plus simple.</p>
<h2>display</h2>
<table><tr><th>Valeur</th><th>Comportement</th></tr>
<tr><td><code>block</code></td><td>toute la largeur, nouvelle ligne, width/height respectés</td></tr>
<tr><td><code>inline</code></td><td>dans le texte, width/height et marges verticales ignorés</td></tr>
<tr><td><code>inline-block</code></td><td>dans le texte mais dimensionnable (boutons)</td></tr>
<tr><td><code>flex</code>, <code>grid</code></td><td>conteneurs de mise en page (module 2)</td></tr>
<tr><td><code>none</code></td><td>retiré du rendu (et de l'accessibilité) ; <code>visibility: hidden</code> garde la place</td></tr></table>
<h2>Débordement</h2>
${code('css', `.zone { overflow: auto; }          /* barres de défilement si besoin */
.ligne { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }   /* « titre trop lo… » */
img { max-width: 100%; height: auto; display: block; }   /* images jamais plus larges que leur conteneur */`)}
<h2>Dimensions</h2>
<p><code>width</code>/<code>height</code> fixes sont rares ; préfère <code>max-width</code>, <code>min-height</code>, <code>aspect-ratio: 16/9</code>. La hauteur d'un bloc vient normalement de son contenu : forcer une hauteur crée des débordements sur mobile.</p>
<div class="callout info"><b>Inspecter</b>L'onglet « Calculé » de l'inspecteur dessine la boîte avec ses quatre couches et les valeurs réelles. En cas de doute, c'est là qu'il faut regarder.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Une carte bien dimensionnée',
            html: base(`<div class="carte"><h2>Abonnement Pro</h2><p>Tout le catalogue, sans engagement, avec une livraison offerte chaque mois.</p><a class="btn" href="#">Choisir</a></div>`),
            enonce: `<p>Applique <code>box-sizing: border-box</code> à tous les éléments. La <code>.carte</code> fait exactement <code>320px</code> de large (bordure et padding compris) avec <code>padding: 24px</code>, une bordure de <code>1px solid rgb(203, 213, 225)</code>, <code>border-radius: 12px</code>, et est centrée horizontalement (<code>margin-inline: auto</code>). Le <code>.btn</code> est en <code>display: inline-block</code> avec <code>padding: 10px 20px</code>, fond <code>rgb(109, 93, 252)</code>, texte blanc et sans soulignement. Le <code>h2</code> n'a pas de marge haute.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `*, *::before, *::after {
  box-sizing: border-box;
}
.carte {
  width: 320px;
  padding: 24px;
  border: 1px solid rgb(203, 213, 225);
  border-radius: 12px;
  margin-inline: auto;
}
.carte h2 {
  margin-top: 0;
}
.btn {
  display: inline-block;
  padding: 10px 20px;
  background: rgb(109, 93, 252);
  color: white;
  text-decoration: none;
  border-radius: 8px;
}`,
            tests: [dom('box-sizing border-box sur la carte', (d, w) => cs(w, d.querySelector('.carte'), 'boxSizing') === 'border-box'), dom('Carte de 320px au total avec padding 24px et bordure 1px', (d, w) => { const c = d.querySelector('.carte'); return c.getBoundingClientRect().width === 320 && px(w, c, 'paddingLeft') === 24 && px(w, c, 'borderLeftWidth') === 1; }), dom('Bordure grise arrondie 12px', (d, w) => { const c = d.querySelector('.carte'); return cs(w, c, 'borderLeftColor') === 'rgb(203, 213, 225)' && px(w, c, 'borderTopLeftRadius') === 12; }), dom('Carte centrée horizontalement', (d, w) => { const r = d.querySelector('.carte').getBoundingClientRect(); const b = d.body.getBoundingClientRect(); return Math.abs((r.left - b.left) - (b.right - r.right)) < 2 && r.left > 10; }), dom('h2 sans marge haute', (d, w) => px(w, d.querySelector('.carte h2'), 'marginTop') === 0), dom('Bouton inline-block, padding 10px 20px, fond violet, texte blanc sans soulignement', (d, w) => { const b = d.querySelector('.btn'); return cs(w, b, 'display') === 'inline-block' && px(w, b, 'paddingTop') === 10 && px(w, b, 'paddingLeft') === 20 && cs(w, b, 'backgroundColor') === 'rgb(109, 93, 252)' && cs(w, b, 'color') === 'rgb(255, 255, 255)' && cs(w, b, 'textDecorationLine') === 'none'; })]
          },
          quiz: [
            { q: 'Avec <code>box-sizing: content-box</code>, <code>width: 200px; padding: 10px</code> donne une boîte de :', options: ['200px', '220px', '210px'], bonne: 1, explication: 'Le padding s\'ajoute de chaque côté : 200 + 10 + 10.' },
            { q: 'Deux marges verticales de 20px et 30px qui se touchent donnent un écart de :', options: ['50px', '30px', '20px'], bonne: 1, explication: 'Fusion des marges : la plus grande l\'emporte.' },
            { q: 'Quelle valeur de display permet de dimensionner un élément tout en le gardant dans le flux du texte ?', options: ['inline', 'inline-block', 'block'], bonne: 1, explication: 'inline ignore width/height ; inline-block les respecte.' }
          ]
        },
        {
          titre: 'Fonds, bordures, ombres et images',
          theorie: `<p>Les détails visuels qui distinguent un site « fait maison » d'un site professionnel tiennent souvent à quelques propriétés : fonds subtils, bordures fines, ombres douces, images bien cadrées.</p>
<h2>Arrière-plans</h2>
${code('css', `.hero {
  background-color: #0f1117;
  background-image: url("hero.webp");
  background-size: cover;          /* couvre tout, recadre si besoin (contain : tout visible) */
  background-position: center;
  background-repeat: no-repeat;
}
.hero { background: url("hero.webp") center / cover no-repeat #0f1117; }   /* raccourci */

/* Plusieurs couches : voile sombre par-dessus la photo pour la lisibilité du texte */
.hero { background: linear-gradient(rgb(0 0 0 / 50%), rgb(0 0 0 / 50%)), url("hero.webp") center / cover; }`)}
<p>Une image de fond est décorative : si elle porte du sens, utilise <code>&lt;img&gt;</code> avec <code>alt</code>.</p>
<h2>Dégradés</h2>
${code('css', `background: linear-gradient(135deg, #6d5dfc 0%, #22c1c3 100%);
background: radial-gradient(circle at top left, #fff3, transparent 60%);
background: conic-gradient(from 0deg, red, yellow, green, red);   /* roues, camemberts */`)}
<h2>Bordures</h2>
${code('css', `border: 1px solid #e2e8f0;
border-bottom: 3px solid currentColor;        /* un seul côté */
border-radius: 12px;                          /* ou 50% pour un cercle */
border-radius: 12px 12px 0 0;                 /* coins haut uniquement */
outline: 2px solid #6d5dfc; outline-offset: 2px;   /* focus visible, hors du modèle de boîte */`)}
<h2>Ombres</h2>
${code('css', `box-shadow: 0 1px 2px rgb(0 0 0 / 8%);                        /* subtile : séparation */
box-shadow: 0 10px 30px -10px rgb(0 0 0 / 30%);               /* élévation : carte survolée */
box-shadow: inset 0 0 0 1px #e2e8f0;                          /* bordure intérieure */
box-shadow: 0 1px 2px rgb(0 0 0 / 6%), 0 8px 24px rgb(0 0 0 / 10%);   /* empilées : réalisme */
text-shadow: 0 1px 2px rgb(0 0 0 / 40%);
filter: drop-shadow(0 4px 8px rgb(0 0 0 / 30%));             /* suit la forme (PNG transparent) */`)}
<p>Règle d'une ombre réaliste : décalage vertical, flou large, faible opacité. Les ombres noires opaques datent de 2010.</p>
<h2>Images dans le flux</h2>
${code('css', `img { max-width: 100%; height: auto; display: block; }
.avatar { width: 64px; aspect-ratio: 1; object-fit: cover; border-radius: 50%; }   /* recadrage sans déformation */
.vignette { aspect-ratio: 3 / 2; object-fit: cover; object-position: top; }`)}
<p><code>object-fit: cover</code> est à <code>&lt;img&gt;</code> ce que <code>background-size: cover</code> est aux fonds : l'image remplit la boîte en se recadrant, jamais en s'écrasant.</p>
<h2>Filtres et modes de fusion</h2>
<p><code>filter: grayscale(1) blur(2px) brightness(1.1)</code>, <code>backdrop-filter: blur(12px)</code> (effet verre dépoli sur un fond semi-transparent), <code>mix-blend-mode: multiply</code>. À utiliser avec parcimonie : coût de rendu.</p>
<div class="callout info"><b>Cohérence</b>Choisis un rayon (8 ou 12px), une ombre et une couleur de bordure, et réutilise-les partout. L'uniformité fait le « fini » professionnel.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Carte produit avec image',
            html: base(`<article class="produit"><img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='%23cbd5e1'/><circle cx='300' cy='200' r='80' fill='%236d5dfc'/></svg>" alt="Sac de café"><div class="corps"><h2>Éthiopie Sidamo</h2><p>Notes de fruits rouges et de jasmin.</p></div></article>`),
            enonce: `<p>La <code>.produit</code> : fond blanc, <code>border-radius: 16px</code>, <code>overflow: hidden</code> (pour que l'image suive les coins), une ombre <code>box-shadow</code> non nulle, largeur maximale <code>360px</code>. L'image : <code>display: block</code>, largeur <code>100%</code>, hauteur <code>160px</code>, <code>object-fit: cover</code>. Le <code>.corps</code> : <code>padding: 20px</code>. Le <code>body</code> : fond <code>rgb(241, 245, 249)</code>.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `body {
  background: rgb(241, 245, 249);
}
.produit {
  max-width: 360px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px -12px rgb(0 0 0 / 30%);
}
.produit img {
  display: block;
  width: 100%;
  height: 160px;
  object-fit: cover;
}
.corps {
  padding: 20px;
}`,
            tests: [dom('body fond gris clair', (d, w) => cs(w, d.body, 'backgroundColor') === 'rgb(241, 245, 249)'), dom('.produit : blanc, rayon 16px, overflow hidden, max 360px', (d, w) => { const p = d.querySelector('.produit'); return cs(w, p, 'backgroundColor') === 'rgb(255, 255, 255)' && px(w, p, 'borderTopLeftRadius') === 16 && cs(w, p, 'overflow') === 'hidden' && p.getBoundingClientRect().width <= 360; }), dom('.produit a une ombre', (d, w) => cs(w, d.querySelector('.produit'), 'boxShadow') !== 'none'), dom('Image : block, 100 %, 160px, object-fit cover', (d, w) => { const i = d.querySelector('.produit img'); return cs(w, i, 'display') === 'block' && Math.abs(i.getBoundingClientRect().width - d.querySelector('.produit').getBoundingClientRect().width) < 1 && px(w, i, 'height') === 160 && cs(w, i, 'objectFit') === 'cover'; }), dom('.corps padding 20px', (d, w) => px(w, d.querySelector('.corps'), 'paddingTop') === 20)]
          },
          quiz: [
            { q: 'Quelle propriété recadre une <code>&lt;img&gt;</code> sans la déformer ?', options: ['background-size', 'object-fit: cover', 'resize'], bonne: 1, explication: 'object-fit s\'applique aux éléments remplacés (img, video).' },
            { q: 'Pourquoi <code>overflow: hidden</code> sur une carte arrondie ?', options: ['Pour masquer le texte', 'Pour que l\'image interne respecte les coins arrondis', 'Pour gagner en performance'], bonne: 1, explication: 'Sans lui, l\'image dépasse des coins du conteneur arrondi.' },
            { q: 'Quelle ombre paraît la plus réaliste ?', options: ['0 0 0 5px black', '0 8px 24px rgb(0 0 0 / 12%)', '10px 10px 0 red'], bonne: 1, explication: 'Décalage vertical, grand flou, faible opacité imitent une lumière naturelle.' }
          ]
        }
      ]
    },
    {
      titre: 'Mise en page', niveau: 'Intermédiaire', description: 'Flexbox, Grid, positionnement et design responsive.',
      lecons: [
        {
          titre: 'Flexbox',
          theorie: `<p>Flexbox aligne et distribue des éléments sur <strong>un axe</strong> (ligne ou colonne). C'est l'outil des barres de navigation, des groupes de boutons, des cartes à hauteur égale, du centrage.</p>
${code('css', `.conteneur {
  display: flex;                /* les enfants directs deviennent des « items » */
  flex-direction: row;          /* row (défaut) | column | row-reverse */
  justify-content: space-between;   /* axe principal : flex-start | center | space-between | space-around | space-evenly */
  align-items: center;          /* axe secondaire : stretch (défaut) | center | flex-start | flex-end | baseline */
  gap: 1rem;                    /* espace entre items, sans marges */
  flex-wrap: wrap;              /* passage à la ligne si manque de place */
}`)}
<h2>Les items</h2>
${code('css', `.item { flex: 1; }              /* grandit pour remplir l'espace (flex-grow: 1, shrink: 1, basis: 0) */
.item { flex: 0 0 200px; }      /* taille fixe de 200px, ne grandit ni ne rétrécit */
.item { flex: 1 1 250px; }      /* base 250px, puis s'adapte : grille fluide avec wrap */
.logo { margin-right: auto; }   /* pousse tout le reste à droite */
.item { align-self: flex-end; } /* alignement individuel */
.item { order: -1; }            /* réordonner visuellement (attention à l'ordre de lecture) */`)}
<h2>Recettes</h2>
${code('css', `/* Centrer parfaitement */
.centre { display: flex; justify-content: center; align-items: center; min-height: 100dvh; }

/* Barre de navigation : logo à gauche, liens à droite */
.nav { display: flex; align-items: center; gap: 1.5rem; }
.nav .logo { margin-right: auto; }

/* Pied de carte collé en bas, carte à hauteur égale dans une grille */
.carte { display: flex; flex-direction: column; }
.carte .corps { flex: 1; }

/* Étiquettes qui s'enroulent */
.tags { display: flex; flex-wrap: wrap; gap: .5rem; }

/* Mise en page « sainte » : en-tête, contenu extensible, pied */
body { display: flex; flex-direction: column; min-height: 100dvh; }
main { flex: 1; }`)}
<h2>Pièges courants</h2>
<ul><li>Un item flex a <code>min-width: auto</code> : un texte long ou une image refuse de rétrécir et déborde. Remède : <code>min-width: 0</code> sur l'item.</li>
<li><code>justify-content</code> agit sur l'axe principal : en <code>column</code>, c'est le vertical.</li>
<li>Les marges ne fusionnent pas entre items flex ; utilise <code>gap</code>.</li>
<li>Évite <code>order</code> pour autre chose que de légers ajustements visuels : les lecteurs d'écran et le clavier suivent l'ordre du HTML.</li></ul>
<h2>Flexbox ou Grid ?</h2>
<p>Flex : une dimension, contenu qui dicte la taille (navigation, boutons, listes de tags). Grid : deux dimensions, structure qui dicte le placement (page entière, galerie, formulaire complexe). Ils se combinent : une grille de cartes dont chaque carte est un flex en colonne.</p>
<div class="callout info"><b>Visualiser</b>L'inspecteur affiche un badge « flex » à côté du conteneur ; cliquer dessus dessine les axes et les espaces. Indispensable pour comprendre un alignement récalcitrant.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Barre de navigation et cartes',
            html: base(`<header class="nav"><a class="logo" href="#">Lumio</a><a href="#">Cours</a><a href="#">Blog</a><a class="btn" href="#">Connexion</a></header>
<section class="cartes"><article class="carte"><h2>Court</h2><p>Un texte.</p><a href="#">Lire</a></article><article class="carte"><h2>Long</h2><p>Un texte beaucoup plus long qui prend plusieurs lignes dans la carte pour tester l'alignement du pied.</p><a href="#">Lire</a></article><article class="carte"><h2>Moyen</h2><p>Deux lignes de texte environ ici.</p><a href="#">Lire</a></article></section>`),
            enonce: `<p>1) <code>.nav</code> est un conteneur flex avec <code>align-items: center</code>, <code>gap: 24px</code> ; le <code>.logo</code> pousse les autres liens à droite (<code>margin-right: auto</code>). 2) <code>.cartes</code> est un flex avec <code>flex-wrap: wrap</code> et <code>gap: 16px</code> ; chaque <code>.carte</code> a <code>flex: 1 1 160px</code>, est elle-même un flex en colonne, et son paragraphe prend l'espace restant (<code>flex: 1</code>) pour que les liens « Lire » soient alignés en bas. Ajoute une bordure de 1px aux cartes pour visualiser.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `.nav {
  display: flex;
  align-items: center;
  gap: 24px;
}
.nav .logo {
  margin-right: auto;
}
.cartes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 24px;
}
.carte {
  flex: 1 1 160px;
  display: flex;
  flex-direction: column;
  border: 1px solid #ccc;
  padding: 12px;
}
.carte p {
  flex: 1;
}`,
            tests: [dom('.nav en flex, centré verticalement, gap 24px', (d, w) => { const n = d.querySelector('.nav'); return cs(w, n, 'display') === 'flex' && cs(w, n, 'alignItems') === 'center' && px(w, n, 'columnGap') === 24; }), dom('Le logo pousse les liens à droite', (d, w) => { const links = d.querySelectorAll('.nav a'); const nav = d.querySelector('.nav').getBoundingClientRect(); const last = links[links.length - 1].getBoundingClientRect(); return cs(w, links[0], 'marginRight') === 'auto' || (nav.right - last.right) < 20; }), dom('.cartes en flex avec wrap et gap 16px', (d, w) => { const c = d.querySelector('.cartes'); return cs(w, c, 'display') === 'flex' && cs(w, c, 'flexWrap') === 'wrap' && px(w, c, 'columnGap') === 16; }), dom('Chaque carte : flex-basis 160px, grow 1, colonne', (d, w) => [...d.querySelectorAll('.carte')].every(c => cs(w, c, 'flexBasis') === '160px' && cs(w, c, 'flexGrow') === '1' && cs(w, c, 'display') === 'flex' && cs(w, c, 'flexDirection') === 'column')), dom('Les liens « Lire » des cartes d\'une même ligne sont alignés en bas', (d, w) => { const cartes = [...d.querySelectorAll('.carte')]; const bottoms = cartes.map(c => c.querySelector('a').getBoundingClientRect().bottom); const tops = cartes.map(c => c.getBoundingClientRect().top); const memeLigne = cartes.filter((c, i) => Math.abs(tops[i] - tops[0]) < 2); if (memeLigne.length < 2) return cs(w, cartes[0].querySelector('p'), 'flexGrow') === '1'; return memeLigne.every(c => Math.abs(c.querySelector('a').getBoundingClientRect().bottom - bottoms[0]) < 2); })]
          },
          quiz: [
            { q: 'Quelle propriété aligne les items sur l\'axe secondaire ?', options: ['justify-content', 'align-items', 'flex-direction'], bonne: 1, explication: 'justify-content gère l\'axe principal, align-items l\'axe perpendiculaire.' },
            { q: 'Que fait <code>flex: 1</code> sur un item ?', options: ['Le fixe à 1px', 'Lui fait occuper l\'espace disponible', 'Le place en premier'], bonne: 1, explication: 'flex: 1 = grow 1, shrink 1, basis 0 : partage égal de l\'espace.' },
            { q: 'Un item flex refuse de rétrécir et déborde. Remède ?', options: ['min-width: 0', 'overflow: visible', 'flex-wrap: nowrap'], bonne: 0, explication: 'La valeur par défaut min-width: auto empêche l\'item d\'être plus petit que son contenu.' }
          ]
        },
        {
          titre: 'CSS Grid',
          theorie: `<p>Grid est le système de mise en page bidimensionnel de CSS : on définit des lignes et des colonnes, puis on place les éléments dans les cellules. Il remplace les hacks de l'époque des flottants et simplifie énormément les layouts de page.</p>
${code('css', `.grille {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;      /* trois colonnes égales (fr = fraction de l'espace libre) */
  grid-template-columns: repeat(3, 1fr);   /* équivalent */
  grid-template-columns: 240px 1fr;        /* barre latérale fixe + contenu fluide */
  grid-template-rows: auto 1fr auto;       /* en-tête, contenu extensible, pied */
  gap: 1.5rem 1rem;                        /* lignes, colonnes */
}`)}
<h2>La grille responsive en une ligne</h2>
${code('css', `.cartes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.5rem;
}
/* Autant de colonnes de 260px minimum que possible, qui s'étirent pour remplir. Aucune media query. */`)}
<p><code>auto-fit</code> (au lieu de <code>auto-fill</code>) étire les items quand il y en a peu ; <code>auto-fill</code> garde des colonnes vides. Pour une grille de cartes, <code>auto-fill</code> évite des cartes géantes.</p>
<h2>Placer les éléments</h2>
${code('css', `.hero { grid-column: 1 / -1; }          /* de la première à la dernière ligne de colonne : pleine largeur */
.mise-en-avant { grid-column: span 2; grid-row: span 2; }   /* occupe 2×2 cellules */
.item { grid-area: 2 / 1 / 4 / 3; }     /* row-start / col-start / row-end / col-end */`)}
<h2>Zones nommées : la mise en page lisible</h2>
${code('css', `.page {
  display: grid;
  grid-template-areas:
    "entete entete"
    "nav    contenu"
    "pied   pied";
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
}
header { grid-area: entete; }
nav    { grid-area: nav; }
main   { grid-area: contenu; }
footer { grid-area: pied; }

@media (max-width: 700px) {
  .page { grid-template-areas: "entete" "nav" "contenu" "pied"; grid-template-columns: 1fr; }
}`)}
<p>On dessine littéralement la page. Changer la disposition sur mobile = redessiner les zones.</p>
<h2>Alignement</h2>
<p><code>justify-items</code>/<code>align-items</code> alignent le contenu dans les cellules ; <code>justify-content</code>/<code>align-content</code> alignent la grille dans le conteneur ; <code>place-items: center</code> centre tout. <code>align-self</code>/<code>justify-self</code> pour un item.</p>
<h2>Grille implicite</h2>
<p>Les items en surplus créent des lignes automatiquement : <code>grid-auto-rows: minmax(120px, auto)</code> contrôle leur hauteur ; <code>grid-auto-flow: dense</code> comble les trous.</p>
<h2>Subgrid</h2>
<p><code>grid-template-rows: subgrid</code> permet à une carte d'aligner ses titres, textes et boutons sur les lignes de la grille parente : les pieds de cartes alignés, sans flex interne.</p>
<div class="callout info"><b>Quand Grid n'est pas le bon outil</b>Pour centrer un seul élément, aligner des boutons ou une barre : Flexbox reste plus direct. Grid structure, Flex distribue.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Mise en page de tableau de bord',
            html: base(`<div class="page"><header>En-tête</header><nav>Menu</nav><main><div class="stats"><div class="stat">A</div><div class="stat">B</div><div class="stat">C</div><div class="stat">D</div><div class="stat">E</div><div class="stat">F</div></div></main><footer>Pied</footer></div>`),
            enonce: `<p>1) <code>.page</code> est une grille avec les zones nommées <code>entete</code> (pleine largeur), <code>nav</code> (colonne de <code>120px</code>) + <code>contenu</code>, et <code>pied</code> (pleine largeur) ; colonnes <code>120px 1fr</code>, lignes <code>auto 1fr auto</code>, <code>min-height: 100vh</code>, <code>gap: 8px</code>. Affecte <code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code> à ces zones. 2) <code>.stats</code> est une grille <code>repeat(auto-fill, minmax(90px, 1fr))</code> avec <code>gap: 8px</code>. Donne un fond gris clair aux zones pour visualiser.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `.page {
  display: grid;
  grid-template-areas:
    "entete entete"
    "nav contenu"
    "pied pied";
  grid-template-columns: 120px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
  gap: 8px;
}
header { grid-area: entete; }
nav { grid-area: nav; }
main { grid-area: contenu; }
footer { grid-area: pied; }
header, nav, footer, .stat {
  background: #e2e8f0;
  padding: 8px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
}`,
            tests: [dom('.page est une grille 120px 1fr avec gap 8px', (d, w) => { const p = d.querySelector('.page'); return cs(w, p, 'display') === 'grid' && /^120px \d/.test(cs(w, p, 'gridTemplateColumns')) && px(w, p, 'rowGap') === 8; }), dom('Zones nommées entete / nav contenu / pied', (d, w) => { const a = cs(w, d.querySelector('.page'), 'gridTemplateAreas').replace(/"/g, '').split(/\s+/); return a.join(' ') === 'entete entete nav contenu pied pied'; }), dom('header et footer occupent toute la largeur, nav à gauche de main', (d) => { const h = d.querySelector('header').getBoundingClientRect(), f = d.querySelector('footer').getBoundingClientRect(), n = d.querySelector('nav').getBoundingClientRect(), m = d.querySelector('main').getBoundingClientRect(); return h.width > m.width && f.width > m.width && n.right <= m.left && Math.abs(n.width - 120) < 1; }), dom('Hauteur minimale de la fenêtre et pied en bas', (d, w) => d.querySelector('.page').getBoundingClientRect().height >= w.innerHeight - 20), dom('.stats : grille auto-fill minmax(90px, 1fr) avec gap 8px', (d, w) => { const s = d.querySelector('.stats'); const cols = cs(w, s, 'gridTemplateColumns').split(' ').length; return cs(w, s, 'display') === 'grid' && cols >= 2 && px(w, s, 'columnGap') === 8 && /auto-fill|minmax/.test(d.defaultView.document.querySelector('style')?.textContent || ''); })]
          },
          quiz: [
            { q: 'Que signifie <code>1fr</code> ?', options: ['1 pixel', 'Une fraction de l\'espace libre', '1 % de la largeur'], bonne: 1, explication: 'fr répartit l\'espace restant après les tailles fixes.' },
            { q: 'Comment faire occuper à un élément toutes les colonnes ?', options: ['grid-column: 1 / -1', 'width: 100%', 'grid-row: all'], bonne: 0, explication: '-1 désigne la dernière ligne de grille, quelle que soit le nombre de colonnes.' },
            { q: '<code>repeat(auto-fill, minmax(200px, 1fr))</code> crée :', options: ['Exactement 200 colonnes', 'Autant de colonnes de 200px minimum que possible', 'Une colonne de 200px'], bonne: 1, explication: 'C\'est la grille fluide sans media query.' }
          ]
        },
        {
          titre: 'Positionnement et empilement',
          theorie: `<p>Par défaut, les éléments suivent le <em>flux</em> : les uns après les autres. <code>position</code> permet d'en sortir pour créer en-têtes fixes, badges, menus déroulants, infobulles, superpositions.</p>
<table><tr><th>Valeur</th><th>Comportement</th><th>Usage</th></tr>
<tr><td><code>static</code></td><td>défaut, dans le flux, <code>top/left</code> ignorés</td><td>—</td></tr>
<tr><td><code>relative</code></td><td>dans le flux, décalable, sert de référence aux enfants <code>absolute</code></td><td>conteneur d'un badge</td></tr>
<tr><td><code>absolute</code></td><td>hors flux, positionné par rapport au premier ancêtre positionné</td><td>badge, fermeture de modale, infobulle</td></tr>
<tr><td><code>fixed</code></td><td>hors flux, par rapport à la fenêtre, reste à l'écran au défilement</td><td>bouton flottant, bannière cookies</td></tr>
<tr><td><code>sticky</code></td><td>dans le flux puis « colle » quand on atteint son seuil</td><td>en-tête de page, en-tête de tableau</td></tr></table>
${code('css', `.carte { position: relative; }
.badge { position: absolute; top: 8px; right: 8px; }     /* coin de la carte */

.topbar { position: sticky; top: 0; z-index: 10; }       /* colle en haut au défilement */

.fab { position: fixed; bottom: 24px; right: 24px; }     /* bouton flottant */

.overlay { position: fixed; inset: 0; background: rgb(0 0 0 / 50%); }   /* inset: 0 = top/right/bottom/left: 0 */`)}
<h2>Centrer un élément absolu</h2>
${code('css', `.modale {
  position: fixed;
  inset: 0;
  margin: auto;            /* avec width/height définis : centré */
  width: min(90vw, 480px);
  height: fit-content;
}
/* Ou : top: 50%; left: 50%; transform: translate(-50%, -50%); */`)}
<h2>z-index et contextes d'empilement</h2>
<p><code>z-index</code> ne fonctionne que sur les éléments positionnés (ou items flex/grid). Un élément avec <code>z-index: 9999</code> peut rester <em>sous</em> un autre si son parent crée un contexte d'empilement (<code>position</code> + <code>z-index</code>, <code>opacity &lt; 1</code>, <code>transform</code>, <code>filter</code>…) de niveau inférieur. Quand un z-index « ne marche pas », cherche le contexte parent. Et utilise une échelle courte : 1, 10, 100 (menus, en-têtes, modales).</p>
<h2>sticky : les conditions</h2>
<p>L'élément colle à l'intérieur de son <em>parent</em> uniquement : si le parent est aussi haut que lui, rien ne se passe. Aucun ancêtre ne doit avoir <code>overflow: hidden</code> (ou <code>auto</code>) entre lui et le scroll. Indique toujours un seuil (<code>top: 0</code>).</p>
<h2>Transformations</h2>
<p><code>transform: translate() rotate() scale()</code> déplace visuellement sans affecter le flux ni déclencher de recalcul de mise en page : c'est la méthode la plus performante pour animer une position. <code>translate: 0 -2px;</code> (propriété individuelle) est désormais disponible.</p>
<div class="callout warn"><b>Modération</b>Le positionnement absolu casse le flux : les éléments ne se poussent plus les uns les autres. Pour la structure d'une page, Grid et Flex ; <code>position</code> pour les superpositions ponctuelles.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Badge, en-tête collant et bouton flottant',
            html: base(`<header class="topbar">Boutique</header><main><article class="carte"><span class="badge">-20 %</span><h2>Produit</h2><p>Description.</p></article><p style="height:1200px">Contenu long…</p></main><button class="fab" type="button">+</button>`),
            enonce: `<p><code>.topbar</code> : <code>position: sticky</code>, <code>top: 0</code>, fond blanc, <code>z-index: 10</code>. <code>.carte</code> : <code>position: relative</code>, bordure 1px, <code>padding: 16px</code>. <code>.badge</code> : <code>position: absolute</code>, <code>top: 8px</code>, <code>right: 8px</code>, fond <code>rgb(220, 20, 60)</code>, texte blanc. <code>.fab</code> : <code>position: fixed</code>, <code>bottom: 16px</code>, <code>right: 16px</code>, <code>width</code> et <code>height: 48px</code>, <code>border-radius: 50%</code>.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  padding: 12px;
  border-bottom: 1px solid #ddd;
}
.carte {
  position: relative;
  border: 1px solid #ccc;
  padding: 16px;
}
.badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgb(220, 20, 60);
  color: white;
  padding: 2px 8px;
  border-radius: 999px;
}
.fab {
  position: fixed;
  bottom: 16px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
}`,
            tests: [dom('.topbar sticky en haut avec z-index 10', (d, w) => { const t = d.querySelector('.topbar'); return cs(w, t, 'position') === 'sticky' && px(w, t, 'top') === 0 && cs(w, t, 'zIndex') === '10'; }), dom('.carte en position relative', (d, w) => cs(w, d.querySelector('.carte'), 'position') === 'relative'), dom('.badge absolu dans le coin haut droit de la carte', (d, w) => { const b = d.querySelector('.badge'), c = d.querySelector('.carte'); const rb = b.getBoundingClientRect(), rc = c.getBoundingClientRect(); return cs(w, b, 'position') === 'absolute' && Math.abs((rc.right - 1) - rb.right - 8) < 2 && Math.abs(rb.top - (rc.top + 1) - 8) < 2 && cs(w, b, 'backgroundColor') === 'rgb(220, 20, 60)'; }), dom('.fab fixé en bas à droite, rond de 48px', (d, w) => { const f = d.querySelector('.fab'); const r = f.getBoundingClientRect(); return cs(w, f, 'position') === 'fixed' && Math.abs(d.documentElement.clientHeight - r.bottom - 16) < 2 && Math.abs(d.documentElement.clientWidth - r.right - 16) < 2 && r.width === 48 && r.height === 48 && /^(50%|24px)$/.test(cs(w, f, 'borderTopLeftRadius')); }), dom('L\'en-tête reste visible après défilement', (d, w) => { w.scrollTo(0, 600); const r = d.querySelector('.topbar').getBoundingClientRect(); w.scrollTo(0, 0); return r.top === 0; })]
          },
          quiz: [
            { q: 'Par rapport à quoi se positionne un élément <code>absolute</code> ?', options: ['À la fenêtre', 'Au premier ancêtre positionné (non static)', 'À body toujours'], bonne: 1, explication: 'D\'où position: relative sur le conteneur, sans décalage, juste pour servir de référence.' },
            { q: 'Quelle différence entre <code>fixed</code> et <code>sticky</code> ?', options: ['Aucune', 'fixed est toujours hors flux ; sticky reste dans le flux puis colle à un seuil', 'sticky est plus rapide'], bonne: 1, explication: 'sticky garde sa place dans la page et ne colle que dans les limites de son parent.' },
            { q: 'Un z-index élevé ne passe pas au-dessus d\'un autre élément. Cause probable ?', options: ['Il faut un z-index négatif', 'Un parent crée un contexte d\'empilement inférieur', 'z-index est limité à 100'], bonne: 1, explication: 'Les z-index se comparent à l\'intérieur d\'un même contexte d\'empilement.' }
          ]
        },
        {
          titre: 'Responsive design',
          theorie: `<p>Plus de 60 % du trafic web est mobile. Le <em>responsive design</em> consiste à concevoir une mise en page qui s'adapte à toute largeur d'écran, de 320 px à 2 500 px, avec un seul code.</p>
<h2>Mobile first</h2>
<p>On écrit d'abord les styles pour petit écran (une colonne, simple), puis on <em>ajoute</em> de la complexité pour les grands écrans avec <code>min-width</code>. C'est plus simple que de retirer des styles, et plus performant pour les mobiles.</p>
${code('css', `/* Base : mobile */
.grille { display: grid; gap: 1rem; }

/* Tablette et plus */
@media (min-width: 640px) {
  .grille { grid-template-columns: repeat(2, 1fr); }
}
/* Ordinateur */
@media (min-width: 1024px) {
  .grille { grid-template-columns: repeat(3, 1fr); gap: 2rem; }
}`)}
<p>Points de rupture courants : 640, 768, 1024, 1280 px. Mais choisis-les selon <em>ton</em> contenu : là où la mise en page commence à mal fonctionner, pas selon un appareil précis.</p>
<h2>Le viewport</h2>
<p>Sans <code>&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code>, le mobile affiche la page comme un bureau réduit : rien ne fonctionne. C'est la première ligne à vérifier.</p>
<h2>Fluide avant les media queries</h2>
<p>Beaucoup d'adaptations se font <em>sans</em> media query :</p>
${code('css', `.cartes { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }   /* grille fluide */
.conteneur { width: min(100% - 2rem, 1100px); margin-inline: auto; }         /* largeur bornée, gouttières */
h1 { font-size: clamp(1.75rem, 1rem + 3vw, 3rem); }                           /* typographie fluide */
img { max-width: 100%; height: auto; }
.flex { display: flex; flex-wrap: wrap; gap: 1rem; }
.flex > * { flex: 1 1 250px; }                                                /* colonnes qui s'empilent */`)}
<h2>Container queries</h2>
<p>Au lieu de la largeur de l'écran, on réagit à la largeur du <em>conteneur</em> : un composant s'adapte selon l'espace qu'on lui donne, où qu'il soit placé.</p>
${code('css', `.carte-conteneur { container-type: inline-size; }
@container (min-width: 400px) {
  .carte { display: grid; grid-template-columns: 120px 1fr; }
}`)}
<h2>Autres requêtes utiles</h2>
${code('css', `@media (prefers-color-scheme: dark) { … }         /* thème sombre du système */
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
@media (hover: hover) { .btn:hover { … } }         /* seulement si un vrai survol existe (pas tactile) */
@media print { nav, .pub { display: none; } }
@media (orientation: landscape) { … }`)}
<h2>Tester</h2>
<p>Le mode appareil des DevTools (<kbd>Ctrl+Maj+M</kbd>) simule les tailles ; teste aussi en redimensionnant la fenêtre lentement de 320 à 1600 px et sur un vrai téléphone. Points de vigilance : débordements horizontaux (une image, un tableau, un mot long), textes trop petits (&lt; 16px), cibles tactiles trop petites (&lt; 44px).</p>
<div class="callout info"><b>Dans l'aperçu Lumio</b>L'iframe fait ~400 px de large : les règles mobiles s'appliquent. Les tests vérifient aussi la présence de tes media queries.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Mise en page mobile first',
            html: base(`<div class="conteneur"><h1>Nos formules</h1><div class="grille"><div class="item">Essentiel</div><div class="item">Pro</div><div class="item">Équipe</div></div><img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='%23cbd5e1'/><circle cx='300' cy='200' r='80' fill='%236d5dfc'/></svg>" alt="Bannière"></div>`),
            enonce: `<p>Mobile first : <code>.conteneur</code> de largeur <code>min(100% - 32px, 1000px)</code> centré ; <code>.grille</code> en grid à une colonne avec <code>gap: 16px</code> ; les <code>.item</code> ont un fond gris et <code>padding: 16px</code> ; l'image ne dépasse jamais (<code>max-width: 100%</code>, <code>height: auto</code>) ; le <code>h1</code> a une taille fluide via <code>clamp()</code>. Puis une media query <code>(min-width: 640px)</code> qui passe la grille à 3 colonnes, et une <code>(prefers-reduced-motion: reduce)</code> qui désactive les transitions.</p>`,
            depart: `/* Mobile d'abord */

/* Écrans larges */
`,
            solution: `.conteneur {
  width: min(100% - 32px, 1000px);
  margin-inline: auto;
}
h1 {
  font-size: clamp(1.5rem, 1rem + 3vw, 2.5rem);
}
.grille {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.item {
  background: #e2e8f0;
  padding: 16px;
  transition: transform .2s;
}
img {
  max-width: 100%;
  height: auto;
}
@media (min-width: 640px) {
  .grille {
    grid-template-columns: repeat(3, 1fr);
  }
}
@media (prefers-reduced-motion: reduce) {
  .item {
    transition: none;
  }
}`,
            tests: [dom('Conteneur centré avec gouttières de 16px', (d, w) => { const r = d.querySelector('.conteneur').getBoundingClientRect(); const b = d.body.getBoundingClientRect(); return Math.abs((r.left - b.left) - 16) < 2 && Math.abs((b.right - r.right) - 16) < 2; }), dom('Grille à une colonne sur mobile, gap 16px', (d, w) => { const g = d.querySelector('.grille'); return cs(w, g, 'display') === 'grid' && cs(w, g, 'gridTemplateColumns').split(' ').length === 1 && px(w, g, 'rowGap') === 16; }), dom('Items avec fond et padding 16px', (d, w) => [...d.querySelectorAll('.item')].every(i => cs(w, i, 'backgroundColor') !== 'rgba(0, 0, 0, 0)' && px(w, i, 'paddingTop') === 16)), dom('Image non débordante', (d, w) => d.querySelector('img').getBoundingClientRect().width <= d.querySelector('.conteneur').getBoundingClientRect().width + 1), codeRegex(/font-size\s*:\s*clamp\(/, 'h1 avec clamp()', 'Utilise font-size: clamp(min, préféré, max) pour le h1.'), codeRegex(/@media\s*\(\s*min-width\s*:\s*640px\s*\)[\s\S]*grid-template-columns\s*:\s*repeat\(\s*3/, 'Media query min-width 640px → 3 colonnes', 'Ajoute @media (min-width: 640px) { .grille { grid-template-columns: repeat(3, 1fr); } }.'), codeRegex(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/, 'Media query prefers-reduced-motion', 'Ajoute @media (prefers-reduced-motion: reduce) pour désactiver les transitions.')]
          },
          quiz: [
            { q: 'Que signifie « mobile first » ?', options: ['Ne concevoir que pour mobile', 'Écrire les styles mobiles en base et enrichir avec min-width', 'Utiliser max-width partout'], bonne: 1, explication: 'On ajoute de la complexité quand l\'écran grandit.' },
            { q: 'Quelle balise est indispensable au responsive ?', options: ['<meta name="viewport">', '<meta charset>', '<link rel="responsive">'], bonne: 0, explication: 'Sans elle, le mobile affiche une version bureau réduite.' },
            { q: 'Que permet <code>@container</code> ?', options: ['De réagir à la taille de l\'écran', 'De réagir à la taille du conteneur parent', 'De créer un conteneur'], bonne: 1, explication: 'Un composant s\'adapte à l\'espace qu\'on lui donne, pas à la fenêtre.' }
          ]
        }
      ]
    },
    {
      titre: 'CSS avancé', niveau: 'Avancé', description: 'Transitions et animations, variables et fonctions modernes, états et formulaires, architecture.',
      lecons: [
        {
          titre: 'Transitions et animations',
          theorie: `<p>Le mouvement guide l'attention et rend l'interface vivante, à condition d'être court, utile et désactivable. Deux outils : les <strong>transitions</strong> (d'un état à un autre) et les <strong>animations</strong> (séquences autonomes).</p>
<h2>Transitions</h2>
${code('css', `.btn {
  background: #6d5dfc;
  transition: background .2s ease, transform .15s ease;   /* propriété, durée, courbe */
}
.btn:hover { background: #5a4ae0; }
.btn:active { transform: scale(.97); }

.carte { transition: box-shadow .25s, translate .25s; }
.carte:hover { box-shadow: 0 12px 30px -12px rgb(0 0 0 / 35%); translate: 0 -3px; }`)}
<p>Durées : 100 à 200 ms pour un retour immédiat (bouton), 200 à 400 ms pour un déplacement, jamais au-delà de 500 ms pour une interaction. Courbes : <code>ease-out</code> pour ce qui apparaît (rapide puis doux), <code>ease-in</code> pour ce qui disparaît, <code>cubic-bezier()</code> pour des rebonds.</p>
<p>Évite <code>transition: all</code> : on anime sans le vouloir des propriétés coûteuses. Liste les propriétés.</p>
<h2>Animations</h2>
${code('css', `@keyframes apparition {
  from { opacity: 0; translate: 0 8px; }
  to   { opacity: 1; translate: 0 0; }
}
.toast { animation: apparition .3s ease-out both; }   /* both : garde l'état final */

@keyframes rotation { to { rotate: 360deg; } }
.spinner { animation: rotation .8s linear infinite; }

@keyframes pulse { 50% { opacity: .5; } }
.chargement { animation: pulse 1.5s ease-in-out infinite; }`)}
<p><code>animation: nom durée courbe délai itérations direction fill-mode</code>. <code>animation-play-state: paused</code> met en pause ; les événements JS <code>animationend</code> permettent d'enchaîner.</p>
<h2>Performance</h2>
<p>Seules <code>transform</code> (<code>translate</code>, <code>scale</code>, <code>rotate</code>) et <code>opacity</code> s'animent sur le GPU sans recalcul de mise en page. Animer <code>width</code>, <code>height</code>, <code>top</code>, <code>margin</code> provoque des <em>reflows</em> à chaque image : saccades sur mobile. Pour ouvrir un panneau, anime <code>grid-template-rows: 0fr → 1fr</code> ou <code>scale</code> plutôt que la hauteur.</p>
<h2>Accessibilité</h2>
${code('css', `@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}`)}
<p>Certaines personnes souffrent de vertiges ou de nausées face aux animations. Respecter cette préférence est une obligation, pas une option.</p>
<h2>Animations pilotées par le défilement</h2>
<p><code>animation-timeline: view()</code> fait progresser une animation selon la position dans la fenêtre (apparition au scroll), sans JavaScript. Support récent : prévois un repli sans animation.</p>
<div class="callout info"><b>Règle des trois questions</b>Cette animation aide-t-elle à comprendre (où vient l'élément, ce qui a changé) ? Est-elle plus courte que l'attention de l'utilisateur ? Peut-on la désactiver ? Trois oui, sinon on retire.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Bouton réactif et notification animée',
            html: base(`<button class="btn" type="button">Enregistrer</button><div class="toast">Enregistré !</div><div class="spinner" aria-label="Chargement"></div>`),
            enonce: `<p><code>.btn</code> : fond <code>rgb(109, 93, 252)</code>, une transition sur <code>background-color</code> et <code>transform</code> de <code>0.2s</code> (pas <code>all</code>), fond <code>rgb(90, 74, 224)</code> au survol, <code>transform: scale(0.97)</code> à l'état actif. <code>.toast</code> : animation <code>apparition</code> (de <code>opacity: 0</code> à <code>1</code>) de <code>0.4s</code> avec <code>animation-fill-mode: both</code>. <code>.spinner</code> : carré de 32px, bordure, animation <code>rotation</code> infinie et linéaire de <code>1s</code>. Ajoute une media query <code>prefers-reduced-motion</code> qui réduit les durées.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `.btn {
  background: rgb(109, 93, 252);
  color: white;
  border: 0;
  padding: 10px 18px;
  border-radius: 8px;
  transition: background-color 0.2s ease, transform 0.2s ease;
}
.btn:hover { background: rgb(90, 74, 224); }
.btn:active { transform: scale(0.97); }

@keyframes apparition {
  from { opacity: 0; translate: 0 8px; }
  to { opacity: 1; translate: 0 0; }
}
.toast {
  animation: apparition 0.4s ease-out both;
  margin-top: 16px;
}

@keyframes rotation {
  to { rotate: 360deg; }
}
.spinner {
  width: 32px;
  height: 32px;
  border: 4px solid #ddd;
  border-top-color: rgb(109, 93, 252);
  border-radius: 50%;
  animation: rotation 1s linear infinite;
  margin-top: 16px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}`,
            tests: [dom('Transition sur background-color et transform (0.2s), pas all', (d, w) => { const t = cs(w, d.querySelector('.btn'), 'transitionProperty'); return /background-color/.test(t) && /transform/.test(t) && !/all/.test(t) && /0\.2s/.test(cs(w, d.querySelector('.btn'), 'transitionDuration')); }), codeRegex(/\.btn:hover\s*\{[^}]*rgb\(90,\s*74,\s*224\)/, 'Couleur de survol définie', 'Ajoute .btn:hover { background: rgb(90, 74, 224); }'), codeRegex(/\.btn:active\s*\{[^}]*scale\(\s*0?\.97\s*\)/, 'scale(0.97) à l\'état actif', 'Ajoute .btn:active { transform: scale(0.97); }'), dom('.toast animée par « apparition » 0.4s avec fill-mode both', (d, w) => { const t = d.querySelector('.toast'); return cs(w, t, 'animationName') === 'apparition' && cs(w, t, 'animationDuration') === '0.4s' && cs(w, t, 'animationFillMode') === 'both'; }), codeRegex(/@keyframes\s+apparition[\s\S]*opacity\s*:\s*0[\s\S]*opacity\s*:\s*1/, '@keyframes apparition de opacity 0 à 1', 'Déclare @keyframes apparition { from { opacity: 0 } to { opacity: 1 } }.'), dom('.spinner : 32px, rotation infinie linéaire 1s', (d, w) => { const s = d.querySelector('.spinner'); return px(w, s, 'width') === 32 && cs(w, s, 'animationName') === 'rotation' && cs(w, s, 'animationIterationCount') === 'infinite' && cs(w, s, 'animationTimingFunction') === 'linear' && cs(w, s, 'animationDuration') === '1s'; }), codeRegex(/prefers-reduced-motion/, 'Media query prefers-reduced-motion présente', 'Respecte prefers-reduced-motion: reduce.')]
          },
          quiz: [
            { q: 'Quelles propriétés s\'animent sans recalcul de mise en page ?', options: ['width et height', 'transform et opacity', 'margin et padding'], bonne: 1, explication: 'Elles sont composées sur le GPU : fluides même sur mobile.' },
            { q: 'Pourquoi éviter <code>transition: all</code> ?', options: ['Ce n\'est pas valide', 'On anime des propriétés non voulues et coûteuses', 'C\'est trop lent à écrire'], bonne: 1, explication: 'Liste explicitement les propriétés à animer.' },
            { q: 'Que fait <code>animation-fill-mode: both</code> ?', options: ['Répète l\'animation', 'Applique le premier état avant et garde le dernier après', 'Inverse l\'animation'], bonne: 1, explication: 'Sans fill-mode, l\'élément revient à son style de base à la fin.' }
          ]
        },
        {
          titre: 'Variables, fonctions et CSS moderne',
          theorie: `<p>CSS a beaucoup évolué : variables, imbrication, fonctions de couleur, sélecteurs de parent. Ces fonctionnalités, longtemps réservées aux préprocesseurs (Sass), sont désormais natives.</p>
<h2>Propriétés personnalisées (variables)</h2>
${code('css', `:root {                       /* définies sur la racine : disponibles partout */
  --couleur-accent: #6d5dfc;
  --espace: 1rem;
  --rayon: 12px;
  --ombre: 0 8px 24px rgb(0 0 0 / 12%);
}
.btn { background: var(--couleur-accent); border-radius: var(--rayon); padding: var(--espace); }
.alerte { color: var(--couleur-alerte, crimson); }   /* valeur de repli */

.carte { --espace: 1.5rem; }    /* redéfinie localement : s'applique à la carte et ses descendants */
[data-theme="dark"] { --fond: #0f1117; --texte: #e8eaf1; }   /* thème : on change les variables, pas les règles */`)}
<p>Contrairement aux variables Sass, elles vivent dans le DOM : héritées, modifiables par JavaScript (<code>el.style.setProperty("--x", 10)</code>), réactives aux media queries. C'est la base des design tokens et des thèmes.</p>
<h2>Imbrication native</h2>
${code('css', `.carte {
  padding: var(--espace);
  & h2 { margin-top: 0; }           /* .carte h2 */
  &:hover { box-shadow: var(--ombre); }
  &.promo { border-color: gold; }   /* .carte.promo */
  @media (min-width: 640px) { display: grid; }
}`)}
<p>Limite l'imbrication à deux niveaux : au-delà, la spécificité grimpe et le code devient illisible.</p>
<h2>Sélecteurs modernes</h2>
${code('css', `.form:has(:invalid) .submit { opacity: .5; }        /* parent selon ses enfants */
.carte:has(> img) { padding-top: 0; }
:is(h1, h2, h3) a { color: inherit; }                /* groupe sans répéter */
:where(ul, ol) { margin: 0; }                        /* comme :is mais spécificité 0 : facile à écraser */
.liste > li:nth-child(odd of .visible) { … }
.champ:focus-visible { outline: 2px solid var(--couleur-accent); }   /* focus clavier seulement */
.a:not(.b, .c) { … }`)}
<h2>Fonctions utiles</h2>
${code('css', `width: calc(100% - var(--espace) * 2);
font-size: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
padding: max(1rem, env(safe-area-inset-left));    /* encoches des téléphones */
color: color-mix(in oklch, var(--couleur-accent) 80%, black);
background: light-dark(white, #0f1117);           /* selon color-scheme */
aspect-ratio: 16 / 9;
inset: 0;`)}
<h2>Et Sass ?</h2>
<p>Les préprocesseurs gardent des avantages (mixins, boucles, découpage en fichiers avec <code>@use</code>), mais pour la plupart des projets, le CSS natif suffit : variables, imbrication, <code>@layer</code>, et <code>@import</code> ou plusieurs <code>&lt;link&gt;</code> pour découper. Moins d'outillage, moins de dette.</p>
<h2>Compatibilité</h2>
<p>Vérifie le support sur <a href="https://caniuse.com" target="_blank" rel="noopener">caniuse.com</a> et prévois un repli avec <code>@supports</code> :</p>
${code('css', `@supports (container-type: inline-size) { … }
@supports not selector(:has(a)) { … }`)}
<div class="callout info"><b>Design tokens</b>Nomme tes variables par rôle (<code>--couleur-texte</code>, <code>--couleur-surface</code>) plutôt que par valeur (<code>--bleu</code>). Un thème sombre devient alors un simple bloc de redéfinitions.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Tokens et thème sombre',
            html: base(`<div class="app"><button class="theme" type="button">Thème</button><div class="carte"><h2>Carte</h2><p>Texte de la carte.</p><a class="btn" href="#">Action</a></div></div>
<script>document.querySelector('.theme').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark'});</script>`),
            enonce: `<p>Définis sur <code>:root</code> les variables <code>--surface</code> (<code>rgb(255, 255, 255)</code>), <code>--texte</code> (<code>rgb(23, 26, 36)</code>), <code>--accent</code> (<code>rgb(109, 93, 252)</code>), <code>--rayon</code> (<code>12px</code>) et <code>--espace</code> (<code>16px</code>). Sur <code>[data-theme="dark"]</code>, redéfinis <code>--surface</code> en <code>rgb(22, 26, 36)</code> et <code>--texte</code> en <code>rgb(232, 234, 241)</code>. <code>body</code> utilise <code>var(--surface)</code> et <code>var(--texte)</code> ; <code>.carte</code> utilise <code>var(--rayon)</code>, <code>var(--espace)</code> et une bordure ; <code>.btn</code> utilise <code>var(--accent)</code>. Utilise l'imbrication native pour styler <code>.carte h2</code> (<code>margin-top: 0</code>) et <code>.btn:hover</code> (couleur avec <code>color-mix</code>).</p>`,
            depart: `:root {
  /* tokens */
}

/* thème sombre */

/* composants */
`,
            solution: `:root {
  --surface: rgb(255, 255, 255);
  --texte: rgb(23, 26, 36);
  --accent: rgb(109, 93, 252);
  --rayon: 12px;
  --espace: 16px;
}
[data-theme="dark"] {
  --surface: rgb(22, 26, 36);
  --texte: rgb(232, 234, 241);
}
body {
  background: var(--surface);
  color: var(--texte);
  font-family: system-ui, sans-serif;
}
.carte {
  border: 1px solid color-mix(in srgb, var(--texte) 20%, transparent);
  border-radius: var(--rayon);
  padding: var(--espace);
  & h2 {
    margin-top: 0;
  }
}
.btn {
  display: inline-block;
  background: var(--accent);
  color: white;
  padding: 8px 16px;
  border-radius: var(--rayon);
  text-decoration: none;
  &:hover {
    background: color-mix(in srgb, var(--accent) 80%, black);
  }
}`,
            tests: [dom('Variables définies sur :root', (d, w) => { const r = w.getComputedStyle(d.documentElement); return r.getPropertyValue('--accent').trim() === 'rgb(109, 93, 252)' && r.getPropertyValue('--rayon').trim() === '12px' && r.getPropertyValue('--espace').trim() === '16px'; }), dom('body utilise surface et texte (clair)', (d, w) => cs(w, d.body, 'backgroundColor') === 'rgb(255, 255, 255)' && cs(w, d.body, 'color') === 'rgb(23, 26, 36)'), dom('Thème sombre : surface et texte redéfinis', (d, w) => { d.documentElement.dataset.theme = 'dark'; const ok = cs(w, d.body, 'backgroundColor') === 'rgb(22, 26, 36)' && cs(w, d.body, 'color') === 'rgb(232, 234, 241)'; delete d.documentElement.dataset.theme; return ok; }), dom('.carte : rayon 12px, padding 16px, bordure, h2 sans marge haute', (d, w) => { const c = d.querySelector('.carte'); return px(w, c, 'borderTopLeftRadius') === 12 && px(w, c, 'paddingTop') === 16 && px(w, c, 'borderTopWidth') >= 1 && px(w, d.querySelector('.carte h2'), 'marginTop') === 0; }), dom('.btn utilise --accent', (d, w) => cs(w, d.querySelector('.btn'), 'backgroundColor') === 'rgb(109, 93, 252)'), codeRegex(/var\(--(surface|texte|accent|rayon|espace)\)/g, 'Les composants utilisent var(--…)', 'Référence les variables avec var(--nom).'), codeRegex(/&\s*(h2|:hover)/, 'Imbrication native utilisée (& h2 ou &:hover)', 'Utilise l\'imbrication : .carte { & h2 { … } } et .btn { &:hover { … } }.'), codeRegex(/color-mix\(/, 'color-mix() utilisé', 'Utilise color-mix(in srgb, var(--accent) 80%, black) pour le survol.')]
          },
          quiz: [
            { q: 'Quelle différence majeure entre une variable CSS et une variable Sass ?', options: ['Aucune', 'La variable CSS vit dans le DOM : héritée, modifiable à l\'exécution', 'La variable Sass est plus rapide'], bonne: 1, explication: 'Les variables Sass disparaissent à la compilation ; les propriétés personnalisées restent dynamiques.' },
            { q: 'Que sélectionne <code>.form:has(:invalid)</code> ?', options: ['Les champs invalides', 'Le formulaire qui contient au moins un champ invalide', 'Les formulaires invalides en HTML'], bonne: 1, explication: ':has() permet de styler un parent selon ses descendants.' },
            { q: 'Pourquoi préférer <code>:where()</code> à <code>:is()</code> pour un reset ?', options: ['C\'est plus court', ':where a une spécificité nulle, donc facile à écraser', ':is n\'est pas supporté'], bonne: 1, explication: 'Un reset ne doit jamais gêner les styles de composants.' }
          ]
        },
        {
          titre: 'États, formulaires et composants',
          theorie: `<p>Un composant n'a pas qu'un état « normal » : survol, focus, actif, désactivé, coché, invalide, chargement. Les styler tous, c'est ce qui rend une interface compréhensible et accessible.</p>
<h2>Pseudo-classes d'interaction</h2>
${code('css', `.btn:hover { }                     /* souris au-dessus (pas sur tactile) */
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }   /* focus clavier */
.btn:focus:not(:focus-visible) { outline: none; }    /* pas d'outline au clic souris */
.btn:active { }                    /* pendant le clic */
.btn:disabled, .btn[aria-disabled="true"] { opacity: .5; cursor: not-allowed; }
.lien:visited { }`)}
<p>Ordre historique à respecter pour les liens : <code>:link</code>, <code>:visited</code>, <code>:hover</code>, <code>:active</code> (« LoVe HAte »).</p>
<h2>Formulaires</h2>
${code('css', `input, select, textarea {
  font: inherit;                    /* sinon les champs ignorent la police du site */
  padding: .6em .8em;
  border: 1px solid var(--bordure);
  border-radius: 8px;
  background: var(--surface);
  color: inherit;
  width: 100%;
}
input:focus-visible { border-color: var(--accent); outline: 2px solid color-mix(in srgb, var(--accent) 30%, transparent); }
input:user-invalid { border-color: crimson; }        /* invalide APRÈS interaction (pas au chargement) */
input:placeholder-shown { font-style: italic; }
input::placeholder { color: var(--texte-3); }
input:read-only { background: var(--fond-2); }
label:has(+ input:required)::after { content: " *"; color: crimson; }

input[type="checkbox"], input[type="radio"] { accent-color: var(--accent); width: 1.1em; height: 1.1em; }
select { appearance: none; background-image: url("chevron.svg"); background-repeat: no-repeat; background-position: right .8em center; }`)}
<p><code>:user-invalid</code> évite d'afficher toutes les erreurs en rouge dès l'ouverture de la page : il attend que l'utilisateur ait interagi.</p>
<h2>Pseudo-éléments</h2>
${code('css', `.badge::before { content: "●"; margin-right: .3em; }    /* content obligatoire, même vide */
.citation::before { content: open-quote; }
.lien-externe::after { content: " ↗"; }
.champ::placeholder { … }
::selection { background: var(--accent); color: white; }
li::marker { color: var(--accent); }
.separateur::after { content: ""; display: block; height: 1px; background: var(--bordure); }`)}
<p>Le contenu généré n'est pas lu de façon fiable par les lecteurs d'écran : réserve-le au décoratif.</p>
<h2>Composants natifs à styler</h2>
<ul><li><code>&lt;details&gt;/&lt;summary&gt;</code> : accordéon sans JS ; <code>summary::marker</code> ou <code>list-style: none</code> + icône.</li><li><code>&lt;dialog&gt;</code> : modale native ; <code>dialog::backdrop</code> pour le voile.</li><li><code>&lt;progress&gt;</code>, <code>&lt;meter&gt;</code>, <code>input[type=range]</code> : pseudo-éléments préfixés, ou <code>accent-color</code>.</li></ul>
<h2>Classes d'état vs attributs</h2>
<p>Préfère styler les attributs qui portent le sens : <code>[aria-expanded="true"]</code>, <code>[aria-current="page"]</code>, <code>[aria-pressed]</code>, <code>[hidden]</code>, <code>:checked</code>. Le JS met à jour l'attribut ARIA (nécessaire pour l'accessibilité) et le style suit automatiquement : une seule source de vérité.</p>
<div class="callout info"><b>Cibles tactiles</b>Boutons et liens d'au moins 44 × 44 px sur mobile (<code>min-height: 44px</code> ou padding suffisant), espacés d'au moins 8 px.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Formulaire soigné avec états',
            html: base(`<form class="f"><label for="email">Email</label><input id="email" type="email" required placeholder="vous@exemple.fr"><label for="msg">Message</label><textarea id="msg"></textarea><label><input type="checkbox" id="ok"> J'accepte</label><button type="submit" class="btn">Envoyer</button><button type="button" class="btn" disabled>Désactivé</button></form><nav><a href="#" aria-current="page">Accueil</a> <a href="#">Blog</a></nav>`),
            enonce: `<p>Champs (<code>input</code>, <code>textarea</code>) : <code>font: inherit</code>, <code>width: 100%</code>, <code>padding: 10px</code>, bordure <code>1px solid rgb(203, 213, 225)</code>, <code>border-radius: 8px</code>, <code>display: block</code>. Au <code>:focus-visible</code>, bordure <code>rgb(109, 93, 252)</code>. Les <code>label</code> en <code>display: block</code> avec <code>margin-top: 12px</code>. Case à cocher avec <code>accent-color: rgb(109, 93, 252)</code> (le label de la case reste <code>inline</code> ou flex, à toi de gérer). <code>.btn:disabled</code> : <code>opacity: 0.5</code> et <code>cursor: not-allowed</code>. Le lien <code>[aria-current="page"]</code> en gras avec un soulignement de 2px via <code>border-bottom</code>. Ajoute un <code>::after</code> avec <code>content: " *"</code> sur le label de l'email (sélecteur <code>label:has(+ input:required)</code>).</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `input:not([type="checkbox"]), textarea {
  font: inherit;
  display: block;
  width: 100%;
  padding: 10px;
  border: 1px solid rgb(203, 213, 225);
  border-radius: 8px;
  box-sizing: border-box;
}
input:focus-visible, textarea:focus-visible {
  border-color: rgb(109, 93, 252);
  outline: 2px solid rgb(109 93 252 / 30%);
}
label {
  display: block;
  margin-top: 12px;
}
label:has(+ input:required)::after {
  content: " *";
  color: crimson;
}
input[type="checkbox"] {
  accent-color: rgb(109, 93, 252);
  width: 1.1em;
  height: 1.1em;
}
.btn {
  margin-top: 12px;
  padding: 10px 16px;
  min-height: 44px;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
nav a[aria-current="page"] {
  font-weight: 700;
  border-bottom: 2px solid currentColor;
  text-decoration: none;
}`,
            tests: [dom('Champs : police héritée, 100 %, padding 10px, bordure grise arrondie', (d, w) => { const i = d.getElementById('email'), f = d.querySelector('.f'); return cs(w, i, 'fontFamily') === cs(w, d.body, 'fontFamily') && Math.abs(i.getBoundingClientRect().width - f.getBoundingClientRect().width) < 2 && px(w, i, 'paddingTop') === 10 && cs(w, i, 'borderTopColor') === 'rgb(203, 213, 225)' && px(w, i, 'borderTopLeftRadius') === 8 && cs(w, i, 'display') === 'block'; }), codeRegex(/:focus-visible\s*\{[^}]*rgb\(109,\s*93,\s*252\)/, 'Bordure violette au focus-visible', 'Ajoute input:focus-visible { border-color: rgb(109, 93, 252); }'), dom('Labels en bloc avec marge haute 12px', (d, w) => { const l = d.querySelector('label[for="email"]'); return cs(w, l, 'display') === 'block' && px(w, l, 'marginTop') === 12; }), dom('Astérisque générée après le label email', (d, w) => w.getComputedStyle(d.querySelector('label[for="email"]'), '::after').content.includes('*')), dom('Case à cocher avec accent-color violet', (d, w) => cs(w, d.getElementById('ok'), 'accentColor') === 'rgb(109, 93, 252)'), dom('Bouton désactivé atténué avec curseur not-allowed', (d, w) => { const b = d.querySelector('.btn:disabled'); return cs(w, b, 'opacity') === '0.5' && cs(w, b, 'cursor') === 'not-allowed'; }), dom('Lien courant en gras avec border-bottom 2px', (d, w) => { const a = d.querySelector('a[aria-current="page"]'); return cs(w, a, 'fontWeight') === '700' && px(w, a, 'borderBottomWidth') === 2; })]
          },
          quiz: [
            { q: 'Quelle pseudo-classe cible le focus clavier sans le focus souris ?', options: [':focus', ':focus-visible', ':active'], bonne: 1, explication: 'Elle permet un outline visible pour le clavier sans gêner les utilisateurs de souris.' },
            { q: 'Pourquoi <code>font: inherit</code> sur les champs ?', options: ['Pour les agrandir', 'Les champs ne reprennent pas la police du site par défaut', 'C\'est obligatoire'], bonne: 1, explication: 'Les navigateurs appliquent leur propre police aux contrôles de formulaire.' },
            { q: 'Quelle est la condition pour qu\'un <code>::before</code> s\'affiche ?', options: ['Un display: block', 'Une propriété content', 'Un z-index'], bonne: 1, explication: 'Sans content (même vide ""), le pseudo-élément n\'est pas généré.' }
          ]
        },
        {
          titre: 'Architecture CSS et design system',
          theorie: `<p>Sur un projet de 50 pages, le CSS peut devenir ingérable : règles qui s'écrasent, styles morts, peur de supprimer. L'architecture, c'est l'ensemble des conventions qui gardent le CSS prévisible quand il grossit.</p>
<h2>Organiser les fichiers et les couches</h2>
${code('css', `@layer reset, tokens, base, layout, composants, utilitaires;

@layer reset { *, *::before, *::after { box-sizing: border-box; margin: 0; } img { max-width: 100%; display: block; } }
@layer tokens { :root { --accent: …; --espace-2: .5rem; /* … */ } }
@layer base { body { font-family: …; line-height: 1.6; } a { color: var(--accent); } }
@layer layout { .conteneur { … } .grille { … } .pile > * + * { margin-top: var(--espace-3); } }
@layer composants { .btn { … } .carte { … } .alerte { … } }
@layer utilitaires { .sr-only { … } .text-center { text-align: center; } }`)}
<p>L'ordre des couches fixe la priorité : un utilitaire gagne toujours sur un composant, sans <code>!important</code> ni guerre de spécificité.</p>
<h2>Nommer : BEM ou utilitaires</h2>
${code('css', `/* BEM : composant autonome */
.carte { } .carte__titre { } .carte__pied { } .carte--promo { }

/* Utilitaires (approche Tailwind) : composition dans le HTML */
.flex { display: flex; } .gap-2 { gap: var(--espace-2); } .p-4 { padding: var(--espace-4); }`)}
<p>Les deux fonctionnent ; le pire est de les mélanger sans règle. Pour un site éditorial, des composants BEM ; pour une application dense, des utilitaires (ou Tailwind).</p>
<h2>Design tokens</h2>
<p>Un <strong>design system</strong> commence par des tokens : couleurs par rôle, échelle typographique, échelle d'espacement, rayons, ombres, durées. Chaque composant n'utilise que des tokens : changer la marque = changer vingt lignes.</p>
${code('css', `:root {
  --couleur-fond: #fff; --couleur-surface: #f6f7fb; --couleur-texte: #171a24; --couleur-texte-2: #4b5268;
  --couleur-accent: #6d5dfc; --couleur-ok: #3ddc97; --couleur-erreur: #ff6b6b;
  --fs-sm: .875rem; --fs-md: 1rem; --fs-lg: 1.25rem; --fs-xl: 1.563rem; --fs-2xl: 1.953rem;
  --espace-1: .25rem; --espace-2: .5rem; --espace-3: 1rem; --espace-4: 1.5rem; --espace-5: 2rem; --espace-6: 3rem;
  --rayon-sm: 6px; --rayon-md: 12px; --rayon-full: 999px;
  --duree-rapide: .15s; --duree-normale: .25s;
}`)}
<h2>Composants : états et variantes</h2>
${code('css', `.btn {
  display: inline-flex; align-items: center; gap: var(--espace-2);
  padding: var(--espace-2) var(--espace-4); min-height: 44px;
  border-radius: var(--rayon-md); border: 1px solid transparent; font-weight: 600;
  background: var(--couleur-surface); color: var(--couleur-texte);
  transition: background var(--duree-rapide), transform var(--duree-rapide);
  &:hover { filter: brightness(.95); }
  &:focus-visible { outline: 2px solid var(--couleur-accent); outline-offset: 2px; }
  &:disabled { opacity: .5; pointer-events: none; }
  &.btn--primaire { background: var(--couleur-accent); color: #fff; }
  &.btn--petit { padding: var(--espace-1) var(--espace-3); min-height: 36px; }
}`)}
<h2>Documenter</h2>
<p>Une page « styleguide » (ou Storybook) montre chaque composant dans tous ses états. Elle sert de contrat entre design et développement et de terrain de test visuel.</p>
<h2>Mesurer la dette</h2>
<p>Onglet Coverage des DevTools : pourcentage de CSS inutilisé. Au-dessus de 50 %, il est temps de nettoyer. Un linter (Stylelint) impose les conventions.</p>
<div class="callout info"><b>Lumio utilise cette approche</b>Un fichier CSS, des tokens sur <code>:root</code> redéfinis pour le thème sombre, des composants nommés par rôle, quelques utilitaires. Inspecte la page pour voir.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Mini design system en couches',
            html: base(`<button class="btn" type="button">Secondaire</button> <button class="btn btn--primaire" type="button">Primaire</button> <button class="btn btn--primaire text-center" type="button" style="">Utilitaire</button>
<div class="alerte alerte--erreur">Une erreur est survenue.</div>`),
            enonce: `<p>Déclare les couches <code>@layer tokens, base, composants, utilitaires;</code> dans cet ordre. Dans <code>tokens</code>, définis <code>--accent: rgb(109, 93, 252)</code>, <code>--erreur: rgb(255, 107, 107)</code>, <code>--espace-3: 16px</code>, <code>--rayon: 10px</code>. Dans <code>composants</code>, <code>.btn</code> (<code>padding: var(--espace-3)</code>, <code>border-radius: var(--rayon)</code>, <code>min-height: 44px</code>) avec la variante <code>.btn--primaire</code> (fond <code>var(--accent)</code>, texte blanc), et <code>.alerte--erreur</code> (bordure gauche de 4px couleur <code>var(--erreur)</code>). Dans <code>utilitaires</code>, <code>.text-center { text-align: center; }</code>. Aucun <code>!important</code>, aucun id.</p>`,
            depart: `@layer tokens, base, composants, utilitaires;

@layer tokens {
}

@layer composants {
}

@layer utilitaires {
}
`,
            solution: `@layer tokens, base, composants, utilitaires;

@layer tokens {
  :root {
    --accent: rgb(109, 93, 252);
    --erreur: rgb(255, 107, 107);
    --espace-3: 16px;
    --rayon: 10px;
  }
}

@layer base {
  body { font-family: system-ui, sans-serif; }
}

@layer composants {
  .btn {
    padding: var(--espace-3);
    border-radius: var(--rayon);
    min-height: 44px;
    border: 1px solid #ccc;
    background: #f1f3f9;
    font: inherit;
    &.btn--primaire {
      background: var(--accent);
      color: white;
      border-color: transparent;
    }
  }
  .alerte {
    padding: var(--espace-3);
    margin-top: var(--espace-3);
    &.alerte--erreur {
      border-left: 4px solid var(--erreur);
    }
  }
}

@layer utilitaires {
  .text-center { text-align: center; }
}`,
            tests: [codeRegex(/^\s*@layer\s+tokens\s*,\s*base\s*,\s*composants\s*,\s*utilitaires\s*;/, 'Déclaration des couches dans l\'ordre', 'Commence par @layer tokens, base, composants, utilitaires;'), dom('Tokens définis', (d, w) => { const r = w.getComputedStyle(d.documentElement); return r.getPropertyValue('--accent').trim() === 'rgb(109, 93, 252)' && r.getPropertyValue('--espace-3').trim() === '16px'; }), dom('.btn : padding 16px, rayon 10px, min-height 44px', (d, w) => { const b = d.querySelector('.btn'); return px(w, b, 'paddingTop') === 16 && px(w, b, 'borderTopLeftRadius') === 10 && px(w, b, 'minHeight') === 44; }), dom('.btn--primaire : fond accent, texte blanc', (d, w) => { const b = d.querySelector('.btn--primaire'); return cs(w, b, 'backgroundColor') === 'rgb(109, 93, 252)' && cs(w, b, 'color') === 'rgb(255, 255, 255)'; }), dom('.alerte--erreur : bordure gauche 4px rouge', (d, w) => { const a = d.querySelector('.alerte--erreur'); return px(w, a, 'borderLeftWidth') === 4 && cs(w, a, 'borderLeftColor') === 'rgb(255, 107, 107)'; }), dom('.text-center appliqué (couche utilitaires)', (d, w) => cs(w, d.querySelector('.text-center'), 'textAlign') === 'center'), { nom: 'Ni !important ni id', verif: ctx => /!important|#\w+\s*\{/.test(ctx.code) ? 'Les couches rendent !important et les id inutiles.' : true }]
          },
          quiz: [
            { q: 'Dans <code>@layer base, composants;</code>, quelle couche gagne en cas de conflit ?', options: ['base', 'composants', 'La plus spécifique'], bonne: 1, explication: 'La dernière couche déclarée a priorité, indépendamment de la spécificité.' },
            { q: 'Qu\'est-ce qu\'un design token ?', options: ['Une icône', 'Une valeur de design nommée et réutilisable (couleur, espace, rayon)', 'Un composant'], bonne: 1, explication: 'Les tokens sont la source unique de vérité du système visuel.' },
            { q: 'Quel outil mesure le CSS inutilisé ?', options: ['Lighthouse SEO', 'L\'onglet Coverage des DevTools', 'Le validateur W3C'], bonne: 1, explication: 'Coverage indique les règles jamais appliquées pendant la session.' }
          ]
        }
      ]
    },
    {
      titre: 'Projet final : landing page', niveau: 'Avancé', description: 'Une page d\'atterrissage complète : en-tête et hero, grille de fonctionnalités, tarifs, thème sombre et finitions.',
      lecons: [
        {
          titre: 'Projet (1/4) : en-tête et section hero',
          theorie: `<p>Projet final : la <strong>landing page</strong> d'une application fictive, « Brume », un outil de prise de notes. Une landing page vend : elle doit être claire, rapide, belle sur mobile et sur grand écran. On la construit section par section, avec les tokens et l'architecture vus précédemment.</p>
<h2>Le HTML de base (fourni dans les exercices)</h2>
${code('html', `<header class="site-header">
  <a class="logo" href="#">Brume</a>
  <nav class="nav"><a href="#fonctions">Fonctions</a><a href="#tarifs">Tarifs</a><a class="btn btn--primaire" href="#">Essayer</a></nav>
</header>
<section class="hero">
  <div class="hero__texte">
    <h1>Vos idées, enfin rangées.</h1>
    <p>Brume capture, organise et retrouve vos notes en une seconde, sur tous vos appareils.</p>
    <div class="hero__actions"><a class="btn btn--primaire" href="#">Commencer gratuitement</a><a class="btn" href="#">Voir la démo</a></div>
  </div>
  <img class="hero__image" src="app.webp" alt="Capture d'écran de Brume" width="600" height="420">
</section>`)}
<h2>En-tête : flex et collant</h2>
${code('css', `.site-header {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; justify-content: space-between; gap: var(--espace-4);
  padding: var(--espace-3) var(--espace-4);
  background: color-mix(in srgb, var(--couleur-fond) 85%, transparent);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--couleur-bordure);
}
.nav { display: flex; align-items: center; gap: var(--espace-4); }`)}
<p>Le fond semi-transparent flouté (<code>backdrop-filter</code>) est la signature des en-têtes modernes : le contenu défile derrière, l'en-tête reste lisible.</p>
<h2>Hero : grille responsive</h2>
${code('css', `.hero {
  display: grid;
  gap: var(--espace-5);
  align-items: center;
  padding: var(--espace-6) var(--espace-4);
  max-width: 1100px; margin-inline: auto;
}
@media (min-width: 800px) {
  .hero { grid-template-columns: 1.1fr 1fr; }
}
.hero h1 { font-size: clamp(2rem, 1.2rem + 3.5vw, 3.5rem); line-height: 1.1; letter-spacing: -.02em; text-wrap: balance; }
.hero p { font-size: var(--fs-lg); color: var(--couleur-texte-2); max-width: 50ch; }
.hero__actions { display: flex; flex-wrap: wrap; gap: var(--espace-3); margin-top: var(--espace-4); }
.hero__image { width: 100%; height: auto; border-radius: var(--rayon-md); box-shadow: var(--ombre-lg); }   /* width: 100% : une image dans une piste de grille garde sinon sa largeur intrinsèque */`)}
<p>Sur mobile, texte puis image empilés ; dès 800 px, deux colonnes. <code>text-wrap: balance</code> évite un mot orphelin sur la dernière ligne du titre.</p>
<h2>Hiérarchie visuelle</h2>
<ol><li>Le titre : le plus grand, le plus contrasté.</li><li>Le bouton principal : couleur d'accent, un seul par section.</li><li>Le texte secondaire : couleur atténuée.</li><li>Le bouton secondaire : neutre.</li></ol>
<p>Si tout crie, rien ne se fait entendre.</p>
<div class="callout info"><b>Logo</b>Un texte stylé (<code>font-weight: 700</code>, police de titre) suffit souvent mieux qu'un fichier image, et se met au thème sombre tout seul.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'En-tête collant et hero',
            html: base(`<header class="site-header"><a class="logo" href="#">Brume</a><nav class="nav"><a href="#fonctions">Fonctions</a><a href="#tarifs">Tarifs</a><a class="btn btn--primaire" href="#">Essayer</a></nav></header>
<section class="hero"><div class="hero__texte"><h1>Vos idées, enfin rangées.</h1><p>Brume capture, organise et retrouve vos notes en une seconde.</p><div class="hero__actions"><a class="btn btn--primaire" href="#">Commencer</a><a class="btn" href="#">Démo</a></div></div><img class="hero__image" src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400'><rect width='600' height='400' fill='%23cbd5e1'/><circle cx='300' cy='200' r='80' fill='%236d5dfc'/></svg>" alt="Capture d'écran" width="600" height="420"></section>
<div style="height:900px"></div>`),
            enonce: `<p><code>.site-header</code> : sticky en haut, <code>z-index: 10</code>, flex avec <code>justify-content: space-between</code> et <code>align-items: center</code>, <code>padding: 12px 24px</code>, fond blanc et bordure basse 1px. <code>.nav</code> : flex, <code>gap: 24px</code>, centré verticalement. <code>.hero</code> : grid avec <code>gap: 32px</code>, <code>padding: 48px 24px</code>, une colonne (l'aperçu est étroit) et une media query <code>min-width: 800px</code> passant à deux colonnes. <code>h1</code> avec <code>clamp()</code> et <code>line-height: 1.1</code>. <code>.hero__actions</code> : flex avec <code>gap: 12px</code> et <code>flex-wrap: wrap</code>. <code>.hero__image</code> : <code>width: 100%</code>, <code>height: auto</code>, <code>border-radius: 12px</code> (dans une grille, <code>max-width: 100%</code> ne suffit pas toujours : l'image impose sa largeur minimale à la piste). <code>.btn--primaire</code> : fond <code>rgb(109, 93, 252)</code>, texte blanc.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}
.logo { font-weight: 700; font-size: 1.25rem; text-decoration: none; color: inherit; }
.nav { display: flex; align-items: center; gap: 24px; }
.btn {
  display: inline-block;
  padding: 10px 18px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  border: 1px solid #e2e8f0;
}
.btn--primaire { background: rgb(109, 93, 252); color: white; border-color: transparent; }
.hero {
  display: grid;
  gap: 32px;
  align-items: center;
  padding: 48px 24px;
}
@media (min-width: 800px) {
  .hero { grid-template-columns: 1.1fr 1fr; }
}
.hero h1 { font-size: clamp(2rem, 1.2rem + 3.5vw, 3.5rem); line-height: 1.1; margin: 0 0 12px; }
.hero__actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.hero__image { width: 100%; height: auto; border-radius: 12px; }`,
            tests: [dom('En-tête sticky, flex space-between, z-index 10', (d, w) => { const h = d.querySelector('.site-header'); return cs(w, h, 'position') === 'sticky' && cs(w, h, 'display') === 'flex' && cs(w, h, 'justifyContent') === 'space-between' && cs(w, h, 'alignItems') === 'center' && cs(w, h, 'zIndex') === '10' && px(w, h, 'paddingLeft') === 24; }), dom('Navigation flex avec gap 24px', (d, w) => { const n = d.querySelector('.nav'); return cs(w, n, 'display') === 'flex' && px(w, n, 'columnGap') === 24; }), dom('Hero en grille, gap 32px, padding 48px 24px, une colonne', (d, w) => { const h = d.querySelector('.hero'); return cs(w, h, 'display') === 'grid' && px(w, h, 'rowGap') === 32 && px(w, h, 'paddingTop') === 48 && px(w, h, 'paddingLeft') === 24 && cs(w, h, 'gridTemplateColumns').split(' ').length === 1; }), codeRegex(/@media\s*\(\s*min-width\s*:\s*800px\s*\)[\s\S]*\.hero[\s\S]*grid-template-columns/, 'Deux colonnes dès 800px', 'Ajoute @media (min-width: 800px) { .hero { grid-template-columns: 1.1fr 1fr; } }.'), codeRegex(/h1[^{]*\{[^}]*clamp\(/, 'Titre fluide avec clamp()', 'Le h1 doit utiliser font-size: clamp(...).'), dom('Actions en flex wrap avec gap 12px', (d, w) => { const a = d.querySelector('.hero__actions'); return cs(w, a, 'display') === 'flex' && cs(w, a, 'flexWrap') === 'wrap' && px(w, a, 'columnGap') === 12; }), dom('Image responsive arrondie', (d, w) => { const i = d.querySelector('.hero__image'); return i.getBoundingClientRect().width <= d.querySelector('.hero').getBoundingClientRect().width && px(w, i, 'borderTopLeftRadius') === 12; }), dom('Bouton primaire violet sur blanc', (d, w) => { const b = d.querySelector('.hero .btn--primaire'); return cs(w, b, 'backgroundColor') === 'rgb(109, 93, 252)' && cs(w, b, 'color') === 'rgb(255, 255, 255)'; })]
          },
          quiz: [
            { q: 'Pourquoi <code>backdrop-filter: blur()</code> sur l\'en-tête ?', options: ['Pour la performance', 'Pour garder l\'en-tête lisible quand le contenu défile derrière', 'Pour cacher la navigation'], bonne: 1, explication: 'Le flou du fond semi-transparent assure le contraste.' },
            { q: 'Que fait <code>text-wrap: balance</code> ?', options: ['Centre le texte', 'Répartit les mots pour des lignes de longueur équilibrée', 'Justifie le texte'], bonne: 1, explication: 'Idéal pour les titres : évite un mot seul sur la dernière ligne.' },
            { q: 'Combien de boutons principaux (accent) par section ?', options: ['Autant que d\'actions', 'Un seul', 'Deux minimum'], bonne: 1, explication: 'Un appel à l\'action principal clair ; les autres sont secondaires.' }
          ]
        },
        {
          titre: 'Projet (2/4) : grille de fonctionnalités et tarifs',
          theorie: `<p>Après la promesse (hero), la preuve : ce que fait le produit (fonctionnalités) et ce qu'il coûte (tarifs). Deux grilles, deux composants « carte ».</p>
<h2>Section et conteneur</h2>
${code('css', `.section { padding-block: var(--espace-6); }
.section--alt { background: var(--couleur-surface); }
.conteneur { width: min(100% - 2rem, 1100px); margin-inline: auto; }
.section__titre { text-align: center; font-size: var(--fs-2xl); margin-bottom: var(--espace-2); }
.section__sous { text-align: center; color: var(--couleur-texte-2); max-width: 55ch; margin: 0 auto var(--espace-5); }`)}
<p>Alterner les fonds (<code>--alt</code>) sépare visuellement les sections sans traits ni bordures.</p>
<h2>Grille de fonctionnalités</h2>
${code('css', `.fonctions { display: grid; gap: var(--espace-4); grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
.fonction { padding: var(--espace-4); border: 1px solid var(--couleur-bordure); border-radius: var(--rayon-md); background: var(--couleur-fond); }
.fonction__icone {
  width: 44px; height: 44px; display: grid; place-items: center;
  border-radius: var(--rayon-sm); background: color-mix(in srgb, var(--couleur-accent) 15%, transparent); color: var(--couleur-accent);
  margin-bottom: var(--espace-3);
}
.fonction h3 { margin-bottom: var(--espace-1); }
.fonction p { color: var(--couleur-texte-2); font-size: var(--fs-sm); }`)}
<p>Une icône SVG inline dans un carré teinté, un titre court, deux lignes de texte. Trois à six cartes, pas plus.</p>
<h2>Tarifs : la carte mise en avant</h2>
${code('css', `.tarifs { display: grid; gap: var(--espace-4); grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
.tarif { display: flex; flex-direction: column; gap: var(--espace-3); padding: var(--espace-5); border: 1px solid var(--couleur-bordure); border-radius: var(--rayon-md); position: relative; }
.tarif--populaire { border-color: var(--couleur-accent); box-shadow: 0 0 0 1px var(--couleur-accent), var(--ombre-lg); }
.tarif--populaire::before {
  content: "Populaire"; position: absolute; top: -12px; left: 50%; translate: -50%;
  background: var(--couleur-accent); color: #fff; font-size: var(--fs-sm); padding: 2px 12px; border-radius: var(--rayon-full);
}
.tarif__prix { font-size: var(--fs-2xl); font-weight: 700; }
.tarif__prix small { font-size: var(--fs-sm); font-weight: 400; color: var(--couleur-texte-2); }
.tarif ul { list-style: none; padding: 0; display: grid; gap: var(--espace-2); }
.tarif li::before { content: "✓ "; color: var(--couleur-ok); }
.tarif .btn { margin-top: auto; }      /* bouton collé en bas : flex column + margin-top auto */`)}
<p><code>margin-top: auto</code> sur le dernier enfant d'un flex en colonne le pousse en bas : les boutons de toutes les cartes s'alignent même si les listes diffèrent.</p>
<h2>Micro-détails qui font pro</h2>
<ul><li>Nombres tabulaires dans les prix : <code>font-variant-numeric: tabular-nums</code>.</li><li>Survol des cartes : légère élévation (<code>translate: 0 -2px</code> + ombre), transition courte.</li><li>Un seul style de bordure et un seul rayon dans toute la page.</li></ul>
<div class="callout info"><b>auto-fit vs auto-fill ici</b>Pour trois cartes de tarifs qui doivent remplir la ligne, <code>auto-fit</code> ; pour une grille de six fonctionnalités où l'on veut garder des cartes de taille constante, <code>auto-fill</code>.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Fonctionnalités et tarifs',
            html: base(`<section class="section"><div class="conteneur"><h2 class="section__titre">Fonctions</h2><div class="fonctions"><article class="fonction"><div class="fonction__icone">★</div><h3>Rapide</h3><p>Recherche instantanée.</p></article><article class="fonction"><div class="fonction__icone">☁</div><h3>Synchro</h3><p>Partout.</p></article><article class="fonction"><div class="fonction__icone">🔒</div><h3>Privé</h3><p>Chiffré.</p></article></div></div></section>
<section class="section section--alt"><div class="conteneur"><h2 class="section__titre">Tarifs</h2><div class="tarifs"><article class="tarif"><h3>Gratuit</h3><p class="tarif__prix">0 €</p><ul><li>100 notes</li></ul><a class="btn" href="#">Choisir</a></article><article class="tarif tarif--populaire"><h3>Pro</h3><p class="tarif__prix">5 €</p><ul><li>Notes illimitées</li><li>Synchronisation</li><li>Partage</li></ul><a class="btn" href="#">Choisir</a></article></div></div></section>`),
            enonce: `<p><code>.section</code> : <code>padding-block: 48px</code> ; <code>.section--alt</code> : fond <code>rgb(246, 247, 251)</code>. <code>.conteneur</code> : <code>width: min(100% - 32px, 1100px)</code> centré. <code>.fonctions</code> : grid <code>repeat(auto-fill, minmax(140px, 1fr))</code>, <code>gap: 16px</code>. <code>.fonction</code> : bordure 1px, <code>border-radius: 12px</code>, <code>padding: 16px</code>. <code>.fonction__icone</code> : carré de <code>44px</code> en <code>display: grid</code> + <code>place-items: center</code>, fond teinté. <code>.tarifs</code> : grid <code>repeat(auto-fit, minmax(150px, 1fr))</code>, <code>gap: 16px</code>. <code>.tarif</code> : flex colonne, <code>position: relative</code>, bordure et rayon ; <code>.tarif .btn</code> avec <code>margin-top: auto</code>. <code>.tarif--populaire</code> : bordure couleur <code>rgb(109, 93, 252)</code> et un <code>::before</code> « Populaire » positionné en absolu en haut.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, sans-serif; }
.section { padding-block: 48px; }
.section--alt { background: rgb(246, 247, 251); }
.conteneur { width: min(100% - 32px, 1100px); margin-inline: auto; }
.section__titre { text-align: center; margin: 0 0 24px; }
.fonctions {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 16px;
}
.fonction {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
}
.fonction__icone {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: rgb(109 93 252 / 15%);
  color: rgb(109, 93, 252);
  margin-bottom: 12px;
}
.tarifs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}
.tarif {
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
}
.tarif .btn { margin-top: auto; }
.tarif--populaire { border-color: rgb(109, 93, 252); }
.tarif--populaire::before {
  content: "Populaire";
  position: absolute;
  top: -12px;
  left: 50%;
  translate: -50%;
  background: rgb(109, 93, 252);
  color: white;
  font-size: 0.8rem;
  padding: 2px 12px;
  border-radius: 999px;
}
.tarif__prix { font-size: 2rem; font-weight: 700; margin: 0; }
.tarif ul { list-style: none; padding: 0; margin: 0; }
.btn { display: inline-block; padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 10px; text-decoration: none; color: inherit; text-align: center; }`,
            tests: [dom('Sections : padding-block 48px, fond alterné', (d, w) => px(w, d.querySelector('.section'), 'paddingTop') === 48 && cs(w, d.querySelector('.section--alt'), 'backgroundColor') === 'rgb(246, 247, 251)'), dom('Conteneur centré avec 16px de gouttière', (d, w) => { const r = d.querySelector('.conteneur').getBoundingClientRect(); const b = d.body.getBoundingClientRect(); return Math.abs((r.left - b.left) - 16) < 2 && Math.abs((b.right - r.right) - 16) < 2; }), dom('.fonctions : grille auto-fill, gap 16px, au moins 2 colonnes', (d, w) => { const f = d.querySelector('.fonctions'); return cs(w, f, 'display') === 'grid' && px(w, f, 'columnGap') === 16 && cs(w, f, 'gridTemplateColumns').split(' ').length >= 2; }), dom('.fonction__icone : carré 44px centré en grid', (d, w) => { const i = d.querySelector('.fonction__icone'); return px(w, i, 'width') === 44 && px(w, i, 'height') === 44 && cs(w, i, 'display') === 'grid' && cs(w, i, 'placeItems').startsWith('center'); }), dom('.tarif : flex colonne relative, bouton en bas', (d, w) => { const t = d.querySelector('.tarif'); return cs(w, t, 'display') === 'flex' && cs(w, t, 'flexDirection') === 'column' && cs(w, t, 'position') === 'relative'; }), codeRegex(/\.tarif\s+\.btn\s*\{[^}]*margin-top\s*:\s*auto|\.tarif\s*\{[\s\S]*?\.btn\s*\{[^}]*margin-top\s*:\s*auto|&\s*\.btn\s*\{[^}]*margin-top\s*:\s*auto/, 'Bouton poussé en bas avec margin-top: auto', 'Ajoute .tarif .btn { margin-top: auto; }.'), dom('Boutons des tarifs alignés en bas', (d) => { const t = [...d.querySelectorAll('.tarif')]; const tops = t.map(x => x.getBoundingClientRect().top); if (Math.abs(tops[0] - tops[1]) > 2) return true; const b = t.map(x => x.querySelector('.btn').getBoundingClientRect().bottom); return Math.abs(b[0] - b[1]) < 2; }), dom('Tarif populaire : bordure violette et badge ::before « Populaire » absolu', (d, w) => { const t = d.querySelector('.tarif--populaire'); const b = w.getComputedStyle(t, '::before'); return cs(w, t, 'borderTopColor') === 'rgb(109, 93, 252)' && /Populaire/.test(b.content) && b.position === 'absolute'; })]
          },
          quiz: [
            { q: 'Comment pousser le bouton d\'une carte flex en colonne vers le bas ?', options: ['position: absolute; bottom: 0', 'margin-top: auto sur le bouton', 'align-items: flex-end'], bonne: 1, explication: 'Les marges auto absorbent l\'espace libre dans un conteneur flex.' },
            { q: 'Pourquoi <code>position: relative</code> sur <code>.tarif</code> ?', options: ['Pour l\'afficher', 'Pour que le badge ::before absolu se positionne par rapport à la carte', 'Pour le z-index'], bonne: 1, explication: 'Sans ancêtre positionné, le badge se placerait par rapport à la page.' },
            { q: 'Quelle valeur choisir pour que trois cartes de tarifs remplissent la ligne ?', options: ['auto-fill', 'auto-fit', 'span 3'], bonne: 1, explication: 'auto-fit étire les colonnes existantes au lieu de laisser des colonnes vides.' }
          ]
        },
        {
          titre: 'Projet (3/4) : thème sombre et accessibilité',
          theorie: `<p>Un thème sombre bien fait n'est pas une simple inversion de couleurs : c'est une seconde palette, définie par les mêmes tokens, qui respecte la préférence système et le choix de l'utilisateur.</p>
<h2>Les deux déclencheurs</h2>
${code('css', `:root {
  color-scheme: light dark;            /* formulaires et barres de défilement natifs suivent */
  --couleur-fond: #ffffff; --couleur-surface: #f6f7fb; --couleur-texte: #171a24;
  --couleur-texte-2: #4b5268; --couleur-bordure: #e2e8f0; --couleur-accent: #6d5dfc;
}
/* 1. Préférence système, si l'utilisateur n'a pas choisi explicitement */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --couleur-fond: #0f1117; --couleur-surface: #161a24; --couleur-texte: #e8eaf1;
    --couleur-texte-2: #a7adbf; --couleur-bordure: #2a3040;
  }
}
/* 2. Choix explicite (bouton), stocké en localStorage par JS */
:root[data-theme="dark"] {
  --couleur-fond: #0f1117; --couleur-surface: #161a24; --couleur-texte: #e8eaf1;
  --couleur-texte-2: #a7adbf; --couleur-bordure: #2a3040;
}`)}
<p>Les composants ne changent pas : ils utilisent déjà les tokens. Le bouton de thème pose <code>data-theme</code> sur <code>&lt;html&gt;</code>. Pour éviter un flash blanc au chargement, un script inline dans le <code>&lt;head&gt;</code> lit localStorage avant le rendu (c'est ce que fait Lumio).</p>
<h2>Adapter plus que les couleurs</h2>
<ul><li><strong>Ombres</strong> : presque invisibles sur fond sombre ; on les renforce ou on les remplace par une bordure subtile.</li><li><strong>Images</strong> : une capture d'écran claire éblouit ; prévois une version sombre (<code>&lt;picture&gt;</code> + <code>media="(prefers-color-scheme: dark)"</code>) ou réduis légèrement la luminosité (<code>filter: brightness(.9)</code>).</li><li><strong>Accent</strong> : une couleur saturée sur fond noir vibre ; éclaircis-la un peu.</li><li><strong>Blanc pur</strong> : <code>#fff</code> sur <code>#000</code> fatigue ; utilise des gris très clairs sur des gris très sombres.</li></ul>
<h2>Contraste : vérifier les deux thèmes</h2>
<p>Le texte secondaire est le point faible classique : <code>#a7adbf</code> sur <code>#0f1117</code> donne 7,6:1 (bon) ; <code>#727a90</code> sur le même fond tombe à 4,1:1 (insuffisant pour du texte courant). Vérifie chaque paire avec l'inspecteur.</p>
<h2>Accessibilité de la page complète</h2>
${code('css', `.skip-link { position: absolute; left: -999px; }
.skip-link:focus { left: 8px; top: 8px; z-index: 100; }
:focus-visible { outline: 2px solid var(--couleur-accent); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
@media (forced-colors: active) { .btn { border: 1px solid; } }   /* mode contraste élevé de Windows */`)}
<p><code>.sr-only</code> masque visuellement un texte tout en le laissant aux lecteurs d'écran (« nouvel onglet », « menu »). <code>forced-colors</code> : certains utilisateurs imposent leurs couleurs ; les bordures invisibles réapparaissent avec une bordure sans couleur.</p>
<h2>Test final</h2>
<p>Lighthouse Accessibilité ≥ 95 dans les deux thèmes, navigation clavier complète, zoom 200 % sans perte, et un passage de lecteur d'écran sur la section tarifs (le badge « Populaire » en <code>::before</code> est-il lu ? Sinon, ajoute un <code>.sr-only</code>).</p>
<div class="callout info"><b>Le thème est un token, pas un thème</b>Si tu dois écrire <code>.dark .carte { … }</code> pour chaque composant, le système est mal conçu : seuls les tokens changent.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Thème sombre par tokens',
            html: base(`<a class="skip-link" href="#main">Aller au contenu</a><header class="site-header"><span class="logo">Brume</span><button class="theme" type="button" aria-label="Changer de thème">◐</button></header><main id="main"><div class="carte"><h2>Carte</h2><p class="secondaire">Texte secondaire</p><a class="btn btn--primaire" href="#">Action <span class="sr-only">(nouvel onglet)</span></a></div></main>
<script>document.querySelector('.theme').addEventListener('click',()=>{const h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark'});</script>`),
            enonce: `<p>Définis les tokens clairs sur <code>:root</code> (<code>--fond: rgb(255, 255, 255)</code>, <code>--surface: rgb(246, 247, 251)</code>, <code>--texte: rgb(23, 26, 36)</code>, <code>--texte-2: rgb(75, 82, 104)</code>, <code>--bordure: rgb(226, 232, 240)</code>, <code>--accent: rgb(109, 93, 252)</code>) avec <code>color-scheme: light dark</code>. Redéfinis les tokens sombres (<code>--fond: rgb(15, 17, 23)</code>, <code>--surface: rgb(22, 26, 36)</code>, <code>--texte: rgb(232, 234, 241)</code>, <code>--texte-2: rgb(167, 173, 191)</code>, <code>--bordure: rgb(42, 48, 64)</code>) à la fois sous <code>@media (prefers-color-scheme: dark)</code> pour <code>:root:not([data-theme="light"])</code> et sous <code>:root[data-theme="dark"]</code>. <code>body</code>, <code>.carte</code>, <code>.secondaire</code> et <code>.btn--primaire</code> n'utilisent que des <code>var()</code>. Ajoute <code>.skip-link</code> (hors écran, visible au focus), <code>.sr-only</code> et un style <code>:focus-visible</code> global.</p>`,
            depart: `:root {
  color-scheme: light dark;
  /* tokens clairs */
}

/* tokens sombres : préférence système */

/* tokens sombres : choix explicite */

/* composants */
`,
            solution: `:root {
  color-scheme: light dark;
  --fond: rgb(255, 255, 255);
  --surface: rgb(246, 247, 251);
  --texte: rgb(23, 26, 36);
  --texte-2: rgb(75, 82, 104);
  --bordure: rgb(226, 232, 240);
  --accent: rgb(109, 93, 252);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --fond: rgb(15, 17, 23);
    --surface: rgb(22, 26, 36);
    --texte: rgb(232, 234, 241);
    --texte-2: rgb(167, 173, 191);
    --bordure: rgb(42, 48, 64);
  }
}
:root[data-theme="dark"] {
  --fond: rgb(15, 17, 23);
  --surface: rgb(22, 26, 36);
  --texte: rgb(232, 234, 241);
  --texte-2: rgb(167, 173, 191);
  --bordure: rgb(42, 48, 64);
}
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: var(--fond);
  color: var(--texte);
}
.site-header { display: flex; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--bordure); }
.carte {
  margin: 16px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--bordure);
  border-radius: 12px;
}
.secondaire { color: var(--texte-2); }
.btn--primaire { display: inline-block; padding: 8px 14px; border-radius: 8px; background: var(--accent); color: white; text-decoration: none; }
.skip-link { position: absolute; left: -999px; top: 8px; background: var(--accent); color: white; padding: 8px 12px; }
.skip-link:focus { left: 8px; z-index: 100; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`,
            tests: [dom('Tokens clairs et color-scheme', (d, w) => { const r = w.getComputedStyle(d.documentElement); return /light/.test(r.colorScheme) && r.getPropertyValue('--fond').trim() === 'rgb(255, 255, 255)' && r.getPropertyValue('--accent').trim() === 'rgb(109, 93, 252)'; }), dom('body, carte et texte secondaire en thème clair', (d, w) => cs(w, d.body, 'backgroundColor') === 'rgb(255, 255, 255)' && cs(w, d.querySelector('.carte'), 'backgroundColor') === 'rgb(246, 247, 251)' && cs(w, d.querySelector('.secondaire'), 'color') === 'rgb(75, 82, 104)'), dom('Thème sombre explicite via data-theme', (d, w) => { d.documentElement.dataset.theme = 'dark'; const ok = cs(w, d.body, 'backgroundColor') === 'rgb(15, 17, 23)' && cs(w, d.body, 'color') === 'rgb(232, 234, 241)' && cs(w, d.querySelector('.carte'), 'backgroundColor') === 'rgb(22, 26, 36)' && cs(w, d.querySelector('.carte'), 'borderTopColor') === 'rgb(42, 48, 64)'; delete d.documentElement.dataset.theme; return ok; }), codeRegex(/@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{[\s\S]*:root:not\(\[data-theme="light"\]\)/, 'Préférence système gérée avec :root:not([data-theme="light"])', 'Sous @media (prefers-color-scheme: dark), cible :root:not([data-theme="light"]).'), { nom: 'Les composants n\'utilisent que des var()', verif: ctx => { const comp = ctx.code.split(/:root\[data-theme="dark"\]\s*\{[^}]*\}/).pop() || ''; return /(background|color)\s*:\s*rgb\(/.test(comp.replace(/\.btn--primaire[^}]*color:\s*white/, '')) ? 'Dans body, .carte, .secondaire et .btn--primaire, utilise var(--…) plutôt que des couleurs en dur.' : true; } }, dom('Lien d\'évitement hors écran, visible au focus', (d, w) => { const s = d.querySelector('.skip-link'); const avant = s.getBoundingClientRect().right < 0 || s.getBoundingClientRect().left < 0; s.focus(); const apres = s.getBoundingClientRect().left >= 0; s.blur(); return avant && apres; }), dom('.sr-only masqué visuellement (1px)', (d, w) => { const e = d.querySelector('.sr-only'); return px(w, e, 'width') === 1 && cs(w, e, 'position') === 'absolute'; }), codeRegex(/:focus-visible\s*\{[^}]*outline/, 'Style :focus-visible global', 'Ajoute :focus-visible { outline: 2px solid var(--accent); }.')]
          },
          quiz: [
            { q: 'Pourquoi deux blocs de tokens sombres (media query et data-theme) ?', options: ['Pour doubler la sécurité', 'L\'un suit la préférence système, l\'autre le choix explicite de l\'utilisateur', 'Pour les anciens navigateurs'], bonne: 1, explication: 'Le choix explicite doit l\'emporter sur la préférence système, dans les deux sens.' },
            { q: 'Que fait <code>color-scheme: light dark</code> ?', options: ['Inverse les couleurs', 'Indique au navigateur que les contrôles natifs peuvent suivre le thème', 'Active le mode nuit'], bonne: 1, explication: 'Champs, barres de défilement et couleurs système s\'adaptent.' },
            { q: 'À quoi sert la classe <code>.sr-only</code> ?', options: ['À cacher un élément à tout le monde', 'À masquer visuellement un texte tout en le laissant aux lecteurs d\'écran', 'À imprimer'], bonne: 1, explication: 'display: none retirerait aussi le texte de l\'arbre d\'accessibilité.' }
          ]
        },
        {
          titre: 'Projet (4/4) : finitions, impression et livraison',
          theorie: `<p>La page fonctionne. Reste à la rendre irréprochable : pied de page, états vides, impression, performance CSS et livraison.</p>
<h2>Pied de page</h2>
${code('css', `.site-footer {
  margin-top: var(--espace-6); padding: var(--espace-5) var(--espace-4);
  border-top: 1px solid var(--couleur-bordure); font-size: var(--fs-sm); color: var(--couleur-texte-2);
}
.site-footer__grille { display: grid; gap: var(--espace-4); grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.site-footer a { color: inherit; }
.site-footer a:hover { color: var(--couleur-texte); }`)}
<h2>Feuille d'impression</h2>
${code('css', `@media print {
  .site-header, .site-footer, .hero__actions, .btn, video, iframe { display: none !important; }
  body { background: #fff; color: #000; font-size: 12pt; }
  a[href^="http"]::after { content: " (" attr(href) ")"; font-size: 90%; }   /* URL visibles */
  .tarif, .fonction { break-inside: avoid; border: 1px solid #999; }
  h2, h3 { break-after: avoid; }
  @page { margin: 2cm; }
}`)}
<p>Peu de gens impriment une landing page, mais beaucoup impriment une facture, un article ou un certificat. Le réflexe est le même : masquer l'interface, afficher les liens, éviter les coupures.</p>
<h2>Performance CSS</h2>
<ul><li>Un seul fichier CSS, minifié, servi avec compression (Netlify le fait) et cache long.</li><li>Pas de <code>@import</code> dans le CSS (requêtes en cascade) : plusieurs <code>&lt;link&gt;</code> ou un bundle.</li><li>Polices : deux fichiers WOFF2 maximum, <code>font-display: swap</code>, <code>preload</code> de la principale.</li><li>Évite les sélecteurs universels profonds (<code>.a * *</code>) et les <code>box-shadow</code>/<code>filter</code> animés sur de grandes zones.</li><li><code>content-visibility: auto</code> sur les sections sous la ligne de flottaison : le navigateur diffère leur rendu.</li></ul>
<h2>Checklist de livraison</h2>
<ol><li>Testé à 320, 375, 768, 1024, 1440 px et en zoom 200 %.</li><li>Deux thèmes vérifiés (contrastes, images, ombres).</li><li>Clavier : tout atteignable, focus visible, lien d'évitement.</li><li><code>prefers-reduced-motion</code> respecté.</li><li>Lighthouse : Performance ≥ 90, Accessibilité ≥ 95, Bonnes pratiques ≥ 95.</li><li>CSS validé (jigsaw.w3.org/css-validator) et sans règles mortes (Coverage).</li><li>Favicon, Open Graph, 404 (parcours HTML).</li></ol>
<h2>Aller plus loin</h2>
<ul><li><strong>View Transitions</strong> : animer les changements de page ou d'état (<code>document.startViewTransition</code>).</li><li><strong>Scroll-driven animations</strong> : parallaxe et apparitions pilotées par le défilement, sans JS.</li><li><strong>Container queries</strong> sur les cartes de tarifs pour un composant réellement autonome.</li><li><strong>Tailwind</strong> ou <strong>Open Props</strong> si tu veux un système de tokens prêt à l'emploi.</li></ul>
<div class="callout ok"><b>Parcours terminé</b>Tu maîtrises la cascade, les layouts modernes, les tokens, les états et l'accessibilité : tout ce qu'il faut pour implémenter n'importe quelle maquette, proprement.</div>`,
          exercice: {
            type: 'code', langage: 'css', titre: 'Pied de page, impression et finitions',
            html: base(`<header class="site-header">Brume</header><main><section class="section"><div class="tarif"><h3>Pro</h3><p>5 €</p><a class="btn" href="#">Choisir</a></div><p>Voir <a href="https://exemple.fr/docs">la documentation</a>.</p></section></main><footer class="site-footer"><div class="site-footer__grille"><div><h4>Produit</h4><a href="#">Fonctions</a></div><div><h4>Société</h4><a href="#">Contact</a></div><div><h4>Légal</h4><a href="#">CGU</a></div></div><p>© 2026 Brume</p></footer>`),
            enonce: `<p><code>.site-footer</code> : <code>margin-top: 48px</code>, <code>padding: 32px 24px</code>, bordure haute 1px, <code>font-size: 14px</code>, couleur <code>rgb(75, 82, 104)</code>. <code>.site-footer__grille</code> : grid <code>repeat(auto-fit, minmax(100px, 1fr))</code>, <code>gap: 24px</code>. Les liens du pied en <code>color: inherit</code>. Une règle <code>@media print</code> qui masque <code>.site-header</code>, <code>.site-footer</code> et <code>.btn</code>, affiche l'URL des liens externes via <code>a[href^="http"]::after { content: " (" attr(href) ")" }</code> et empêche la coupure des <code>.tarif</code> (<code>break-inside: avoid</code>). Enfin, <code>.section { content-visibility: auto; }</code>.</p>`,
            depart: `/* Ton CSS ici */
`,
            solution: `body { margin: 0; font-family: system-ui, sans-serif; }
.site-footer {
  margin-top: 48px;
  padding: 32px 24px;
  border-top: 1px solid #e2e8f0;
  font-size: 14px;
  color: rgb(75, 82, 104);
}
.site-footer__grille {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 24px;
}
.site-footer a { color: inherit; }
.section { content-visibility: auto; padding: 24px; }
.tarif { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
.btn { display: inline-block; padding: 8px 14px; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: inherit; }

@media print {
  .site-header, .site-footer, .btn { display: none !important; }
  body { background: #fff; color: #000; font-size: 12pt; }
  a[href^="http"]::after { content: " (" attr(href) ")"; }
  .tarif { break-inside: avoid; }
}`,
            tests: [dom('Pied de page : marges, bordure, taille et couleur', (d, w) => { const f = d.querySelector('.site-footer'); return px(w, f, 'marginTop') === 48 && px(w, f, 'paddingTop') === 32 && px(w, f, 'paddingLeft') === 24 && px(w, f, 'borderTopWidth') === 1 && px(w, f, 'fontSize') === 14 && cs(w, f, 'color') === 'rgb(75, 82, 104)'; }), dom('Grille du pied en auto-fit avec gap 24px', (d, w) => { const g = d.querySelector('.site-footer__grille'); return cs(w, g, 'display') === 'grid' && px(w, g, 'columnGap') === 24 && cs(w, g, 'gridTemplateColumns').split(' ').length >= 2; }), dom('Liens du pied héritent la couleur', (d, w) => cs(w, d.querySelector('.site-footer a'), 'color') === 'rgb(75, 82, 104)'), codeRegex(/@media\s+print\s*\{[\s\S]*\.site-header[\s\S]*display\s*:\s*none/, 'Impression : en-tête masqué', 'Dans @media print, masque .site-header, .site-footer et .btn.'), codeRegex(/@media\s+print\s*\{[\s\S]*a\[href\^="http"\]::after\s*\{[^}]*attr\(href\)/, 'Impression : URL des liens externes affichées', 'Ajoute a[href^="http"]::after { content: " (" attr(href) ")"; } dans @media print.'), codeRegex(/@media\s+print\s*\{[\s\S]*break-inside\s*:\s*avoid/, 'Impression : .tarif sans coupure', 'Ajoute .tarif { break-inside: avoid; } dans @media print.'), codeRegex(/\.section\s*\{[^}]*content-visibility\s*:\s*auto/, 'content-visibility: auto sur .section', 'Ajoute .section { content-visibility: auto; }.')]
          },
          quiz: [
            { q: 'Que fait <code>content-visibility: auto</code> ?', options: ['Cache le contenu', 'Diffère le rendu des sections hors écran', 'Anime le contenu'], bonne: 1, explication: 'Le navigateur ne calcule la mise en page qu\'à l\'approche de la section : gain au chargement.' },
            { q: 'Comment afficher l\'URL d\'un lien à l\'impression ?', options: ['Avec JavaScript', 'a::after { content: attr(href) }', 'Avec title'], bonne: 1, explication: 'attr() lit un attribut dans le contenu généré.' },
            { q: 'Pourquoi éviter <code>@import</code> dans un fichier CSS ?', options: ['C\'est interdit', 'Cela crée des requêtes en cascade qui retardent le rendu', 'Cela double la taille'], bonne: 1, explication: 'Le navigateur découvre le second fichier seulement après avoir chargé le premier.' }
          ]
        }
      ]
    }
  ]
};
