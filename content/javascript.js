import { code, sortieContient, sortieEgale, sortieRegex, expr, exprVerif, codeContient, codeRegex, codeSans, sansErreur, dom, leveJS } from './_outils.js';

export default {
  description: 'JavaScript fait vivre les pages web et tourne aussi côté serveur (Node.js). Ce parcours couvre le langage moderne (ES2015+), le DOM, l\'asynchrone et se termine par une application complète construite dans ton navigateur.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Les exercices JavaScript s'exécutent dans un bac à sable isolé (<code>console.log</code> apparaît dans la zone de sortie). Les leçons sur le DOM utilisent un aperçu HTML en direct : ton script s'exécute dans la page d'aperçu. Pour travailler sur ton ordinateur : la console du navigateur (F12) ou <a href="https://nodejs.org" target="_blank" rel="noopener">Node.js</a> (<code>node script.js</code>).</p>`,
  modules: [
    {
      titre: 'Le langage', niveau: 'Débutant', description: 'Syntaxe moderne, types, conditions, boucles, fonctions, tableaux et objets.',
      lecons: [
        {
          titre: 'Variables, types et opérateurs',
          theorie: `<p>JavaScript est le seul langage compris nativement par tous les navigateurs. Depuis 2015 (ES6), il s'écrit de façon moderne et lisible : c'est cette version que tu apprends ici.</p>
<h2>Déclarer des variables</h2>
${code('javascript', `const prenom = "Nadia";   // constante : ne peut pas être réassignée
let age = 27;             // variable : peut changer
age = age + 1;
// var existe encore mais ne l'utilise plus (portée confuse)

console.log(prenom, age); // affiche : Nadia 28`)}
<p>Règle : <code>const</code> par défaut, <code>let</code> seulement si la valeur doit changer. Un <code>const</code> contenant un objet ou un tableau reste modifiable <em>à l'intérieur</em> ; c'est la <em>référence</em> qui est fixe.</p>
<h2>Les types primitifs</h2>
<table><tr><th>Type</th><th>Exemples</th><th>Note</th></tr>
<tr><td><code>number</code></td><td><code>42</code>, <code>3.14</code>, <code>NaN</code></td><td>Un seul type numérique (flottant 64 bits)</td></tr>
<tr><td><code>string</code></td><td><code>"a"</code>, <code>'b'</code>, <code>\`c\`</code></td><td>Les backticks permettent l'interpolation</td></tr>
<tr><td><code>boolean</code></td><td><code>true</code>, <code>false</code></td><td>En minuscules</td></tr>
<tr><td><code>undefined</code></td><td>variable déclarée sans valeur</td><td>« pas encore défini »</td></tr>
<tr><td><code>null</code></td><td><code>null</code></td><td>« volontairement vide »</td></tr>
<tr><td><code>bigint</code>, <code>symbol</code></td><td><code>10n</code></td><td>Usages avancés</td></tr></table>
<p><code>typeof valeur</code> renvoie le nom du type sous forme de chaîne (avec une bizarrerie historique : <code>typeof null === "object"</code>).</p>
<h2>Template strings</h2>
${code('javascript', `const prix = 19.99, qte = 3;
console.log(\`Total : \${(prix * qte).toFixed(2)} €\`);   // Total : 59.97 €
const multi = \`ligne 1
ligne 2\`;                                               // sauts de ligne autorisés`)}
<h2>Égalité : toujours ===</h2>
<p><code>==</code> convertit les types avant de comparer (<code>"5" == 5</code> est vrai, <code>0 == ""</code> aussi…). <code>===</code> compare valeur <em>et</em> type. Utilise toujours <code>===</code> et <code>!==</code>.</p>
<h2>Conversions</h2>
${code('javascript', `Number("42")        // 42
Number("abc")       // NaN  (Not a Number) — testez avec Number.isNaN()
parseInt("42px")    // 42
String(42)          // "42"
Boolean(0)          // false   valeurs « falsy » : 0, "", null, undefined, NaN, false
"3" + 4             // "34"   ⚠ le + concatène si l'un des deux est une chaîne
"3" * 4             // 12     les autres opérateurs convertissent en nombre`)}
<h2>Opérateurs utiles</h2>
${code('javascript', `let n = 5;
n += 2; n++; n **= 2;            // 64
const reste = 17 % 5;            // 2
const defaut = valeur ?? "n/a";  // ?? : si valeur est null ou undefined
const ok = a && b || c;          // logique, avec court-circuit
const taille = user?.adresse?.ville;   // ?. : accès sûr, undefined si manquant`)}
<div class="callout warn"><b>Point-virgule et casse</b>Le point-virgule final est optionnel mais recommandé pour éviter des ambiguïtés. JavaScript est sensible à la casse : <code>Age</code> et <code>age</code> sont deux variables.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Facture',
            enonce: `<p>Déclare les constantes <code>prixUnitaire = 12.5</code>, <code>quantite = 4</code> et <code>tva = 0.2</code>. Calcule <code>totalHT</code>, <code>montantTVA</code> et <code>totalTTC</code>. Affiche avec <code>console.log</code> une ligne par valeur au format <code>Total HT : 50.00 €</code>, <code>TVA : 10.00 €</code>, <code>Total TTC : 60.00 €</code> (deux décimales, template string obligatoire).</p>`,
            depart: `const prixUnitaire = 12.5;
const quantite = 4;
const tva = 0.2;

// Calculs

// Affichage
`,
            solution: `const prixUnitaire = 12.5;
const quantite = 4;
const tva = 0.2;

const totalHT = prixUnitaire * quantite;
const montantTVA = totalHT * tva;
const totalTTC = totalHT + montantTVA;

console.log(\`Total HT : \${totalHT.toFixed(2)} €\`);
console.log(\`TVA : \${montantTVA.toFixed(2)} €\`);
console.log(\`Total TTC : \${totalTTC.toFixed(2)} €\`);`,
            tests: [sansErreur(), expr('totalHT', 50), expr('totalTTC', 60), sortieContient('Total HT : 50.00 €'), sortieContient('TVA : 10.00 €'), sortieContient('Total TTC : 60.00 €'), codeContient('`', 'Utilise une template string avec des backticks ` et ${ }.'), codeSans('var ', 'N\'utilise pas var : const ou let.')]
          },
          quiz: [
            { q: 'Quelle déclaration utiliser pour une valeur qui ne sera jamais réassignée ?', options: ['var', 'let', 'const'], bonne: 2, explication: 'const protège contre une réassignation accidentelle et documente l\'intention.' },
            { q: 'Que vaut <code>"5" === 5</code> ?', options: ['true', 'false', 'Erreur'], bonne: 1, explication: 'L\'égalité stricte compare aussi les types : string et number sont différents.' },
            { q: 'Que vaut <code>"2" + 3</code> ?', options: ['5', '"23"', 'NaN'], bonne: 1, explication: 'Avec une chaîne, + concatène. "2" * 3 donnerait 6.' }
          ]
        },
        {
          titre: 'Conditions et boucles',
          theorie: `<p>Les structures de contrôle de JavaScript ressemblent à celles du C : accolades pour délimiter les blocs, parenthèses autour des conditions.</p>
${code('javascript', `const heure = 14;
if (heure < 12) {
  console.log("Bonjour");
} else if (heure < 18) {
  console.log("Bon après-midi");
} else {
  console.log("Bonsoir");
}

const message = heure < 12 ? "matin" : "après-midi";   // opérateur ternaire`)}
<h2>Valeurs « truthy » et « falsy »</h2>
<p>Dans une condition, sont faux : <code>false</code>, <code>0</code>, <code>""</code>, <code>null</code>, <code>undefined</code>, <code>NaN</code>. Tout le reste est vrai, y compris <code>[]</code> et <code>{}</code> (contrairement à Python !). Pour tester un tableau vide : <code>if (tableau.length === 0)</code>.</p>
<h2>switch</h2>
${code('javascript', `switch (role) {
  case "admin":
  case "modo":            // plusieurs cas regroupés
    acces = "total"; break;
  case "membre":
    acces = "limité"; break;
  default:
    acces = "aucun";
}`)}
<p>Sans <code>break</code>, l'exécution « tombe » dans le cas suivant : c'est une source de bugs classique. Pour des correspondances simples, un objet de correspondance est souvent plus propre : <code>const acces = { admin: "total", membre: "limité" }[role] ?? "aucun";</code></p>
<h2>Les boucles</h2>
${code('javascript', `for (let i = 0; i < 5; i++) {       // initialisation ; condition ; incrément
  console.log(i);                     // 0 1 2 3 4
}

const fruits = ["pomme", "kiwi"];
for (const fruit of fruits) {         // for...of : les valeurs (tableaux, chaînes, Map, Set)
  console.log(fruit);
}
for (const [i, fruit] of fruits.entries()) console.log(i, fruit);

const personne = { nom: "Sow", age: 30 };
for (const cle in personne) {         // for...in : les clés d'un objet
  console.log(cle, personne[cle]);
}

let n = 1;
while (n < 100) n *= 2;               // 128
do { n--; } while (n > 120);          // exécuté au moins une fois`)}
<p><code>break</code> sort de la boucle, <code>continue</code> passe au tour suivant. N'utilise pas <code>for...in</code> sur un tableau (il parcourt les indices sous forme de chaînes et les propriétés héritées).</p>
<h2>Portée de bloc</h2>
<p><code>let</code> et <code>const</code> sont limités au bloc <code>{ }</code> où ils sont déclarés. C'est pour cela que <code>for (let i…)</code> crée un <code>i</code> neuf à chaque tour, ce qui évite le fameux bug des fermetures dans les boucles.</p>
<div class="callout info"><b>Boucles vs méthodes</b>Pour transformer ou filtrer un tableau, les méthodes <code>map</code>, <code>filter</code>, <code>reduce</code> (leçon 3.3) sont plus expressives qu'une boucle. Garde <code>for</code> pour les compteurs et les sorties anticipées.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Table et nombres premiers',
            enonce: `<p>1) Écris une fonction <code>tableMultiplication(n)</code> qui renvoie un tableau des 10 premiers multiples de n (<code>[n, 2n, …, 10n]</code>). 2) Écris <code>estPremier(n)</code> qui renvoie <code>true</code> si n est premier (n ≥ 2), en sortant de la boucle dès qu'un diviseur est trouvé. 3) Affiche les nombres premiers inférieurs à 30 sur une ligne séparés par des espaces : <code>2 3 5 7 11 13 17 19 23 29</code>.</p>`,
            depart: `function tableMultiplication(n) {
  // ...
}

function estPremier(n) {
  // ...
}

// Affichage des premiers < 30
`,
            solution: `function tableMultiplication(n) {
  const resultat = [];
  for (let i = 1; i <= 10; i++) {
    resultat.push(n * i);
  }
  return resultat;
}

function estPremier(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d++) {
    if (n % d === 0) return false;
  }
  return true;
}

const premiers = [];
for (let n = 2; n < 30; n++) {
  if (estPremier(n)) premiers.push(n);
}
console.log(premiers.join(" "));`,
            tests: [sansErreur(), expr('tableMultiplication(3)', [3, 6, 9, 12, 15, 18, 21, 24, 27, 30]), expr('estPremier(2)', true), expr('estPremier(1)', false), expr('estPremier(91)', false, '91 = 7 × 13 n\'est pas premier.'), expr('estPremier(97)', true), sortieContient('2 3 5 7 11 13 17 19 23 29')]
          },
          quiz: [
            { q: 'Quelle valeur est « truthy » en JavaScript ?', options: ['[]', '0', '""'], bonne: 0, explication: 'Un tableau vide est un objet, donc vrai. Attention : c\'est l\'inverse de Python.' },
            { q: 'Quelle boucle parcourt les valeurs d\'un tableau ?', options: ['for...in', 'for...of', 'for each'], bonne: 1, explication: 'for...of donne les valeurs ; for...in donne les clés (indices) et n\'est pas fait pour les tableaux.' },
            { q: 'Que se passe-t-il si on oublie <code>break</code> dans un <code>case</code> ?', options: ['Erreur de syntaxe', 'Le case suivant s\'exécute aussi', 'Rien de particulier'], bonne: 1, explication: 'C\'est le « fall-through » : parfois voulu pour regrouper des cas, souvent un bug.' }
          ]
        },
        {
          titre: 'Fonctions et fonctions fléchées',
          theorie: `<p>En JavaScript, les fonctions sont des valeurs de première classe : on les stocke dans des variables, on les passe en argument, on les renvoie. Cette idée est au cœur de tout le langage (événements, promesses, méthodes de tableaux).</p>
<h2>Trois façons d'écrire une fonction</h2>
${code('javascript', `// 1. Déclaration : hissée (utilisable avant sa définition)
function aire(largeur, hauteur = largeur) {    // valeur par défaut
  return largeur * hauteur;
}

// 2. Expression de fonction
const carre = function (x) { return x * x; };

// 3. Fonction fléchée (arrow function)
const double = x => x * 2;                     // un paramètre, retour implicite
const somme = (a, b) => a + b;
const presenter = (nom, age) => {              // corps avec accolades : return explicite
  const texte = \`\${nom} (\${age})\`;
  return texte;
};
const objet = () => ({ ok: true });            // renvoyer un objet littéral : parenthèses`)}
<h2>Paramètres : rest et destructuration</h2>
${code('javascript', `function moyenne(...valeurs) {            // rest : tous les arguments dans un tableau
  return valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
}
moyenne(10, 20, 30);                       // 20

function afficher({ nom, ville = "?" }) {  // destructuration d'un objet paramètre
  console.log(nom, ville);
}
afficher({ nom: "Ana" });                  // Ana ?`)}
<h2>Fonctions d'ordre supérieur et callbacks</h2>
<p>Une fonction qui reçoit ou renvoie une fonction est dite « d'ordre supérieur ». Le <strong>callback</strong> est la fonction passée en argument, appelée plus tard par celle qui la reçoit.</p>
${code('javascript', `function repeter(n, action) {
  for (let i = 0; i < n; i++) action(i);
}
repeter(3, i => console.log("tour", i));

function multiplicateur(facteur) {        // renvoie une fonction : une « fabrique »
  return x => x * facteur;
}
const triple = multiplicateur(3);
triple(5);                                // 15`)}
<h2>Fermetures (closures)</h2>
<p><code>triple</code> se souvient de <code>facteur</code> alors que <code>multiplicateur</code> a terminé : une fonction capture les variables de son contexte de création. C'est ce qui permet de créer des compteurs privés, des caches, des modules.</p>
${code('javascript', `function creerCompteur() {
  let n = 0;                               // inaccessible de l'extérieur
  return { incrementer: () => ++n, valeur: () => n };
}
const c = creerCompteur();
c.incrementer(); c.incrementer();
c.valeur();                                // 2`)}
<h2>this et fonctions fléchées</h2>
<p>Les fonctions fléchées n'ont pas de <code>this</code> propre : elles héritent de celui du contexte. Idéal pour les callbacks dans les méthodes d'objets ; à éviter pour définir des méthodes elles-mêmes (vu avec les classes).</p>
<div class="callout info"><b>Pureté</b>Une fonction <em>pure</em> renvoie toujours le même résultat pour les mêmes arguments et ne modifie rien à l'extérieur. Privilégie-les : elles sont testables et prévisibles.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Fabriques et callbacks',
            enonce: `<p>Écris : 1) <code>appliquer(tableau, fn)</code> qui renvoie un nouveau tableau avec <code>fn</code> appliquée à chaque élément (sans utiliser <code>map</code>) ; 2) la fabrique <code>creerSalutation(formule)</code> qui renvoie une fonction fléchée <code>nom =&gt; "formule, nom !"</code> ; 3) <code>creerCompteur(depart = 0)</code> renvoyant un objet <code>{ suivant(), reinitialiser() }</code> où <code>suivant()</code> renvoie la valeur courante puis l'incrémente, et où la variable interne est inaccessible de l'extérieur.</p>`,
            depart: `function appliquer(tableau, fn) {
  // ...
}

const creerSalutation = (formule) => {
  // ...
};

function creerCompteur(depart = 0) {
  // ...
}

console.log(appliquer([1, 2, 3], x => x * 10));
const bonjour = creerSalutation("Bonjour");
console.log(bonjour("Ana"));
const c = creerCompteur(5);
console.log(c.suivant(), c.suivant());
`,
            solution: `function appliquer(tableau, fn) {
  const resultat = [];
  for (const element of tableau) {
    resultat.push(fn(element));
  }
  return resultat;
}

const creerSalutation = (formule) => {
  return nom => \`\${formule}, \${nom} !\`;
};

function creerCompteur(depart = 0) {
  let valeur = depart;
  return {
    suivant() { return valeur++; },
    reinitialiser() { valeur = depart; }
  };
}

console.log(appliquer([1, 2, 3], x => x * 10));
const bonjour = creerSalutation("Bonjour");
console.log(bonjour("Ana"));
const c = creerCompteur(5);
console.log(c.suivant(), c.suivant());`,
            tests: [sansErreur(), expr('appliquer([1, 2, 3], x => x * 10)', [10, 20, 30]), codeSans('.map(', 'Implémente appliquer avec une boucle, sans map.'), expr('creerSalutation("Salut")("Bob")', 'Salut, Bob !'), expr('(() => { const k = creerCompteur(5); return [k.suivant(), k.suivant(), k.suivant()]; })()', [5, 6, 7]), expr('(() => { const k = creerCompteur(2); k.suivant(); k.reinitialiser(); return k.suivant(); })()', 2), expr('typeof creerCompteur().valeur', 'undefined', 'La valeur interne doit rester privée (fermeture), pas une propriété de l\'objet.')]
          },
          quiz: [
            { q: 'Que renvoie <code>const f = x =&gt; { x * 2 }; f(3)</code> ?', options: ['6', 'undefined', 'Erreur'], bonne: 1, explication: 'Avec des accolades, il faut un return explicite. Sans accolades, le retour est implicite.' },
            { q: 'Qu\'est-ce qu\'une fermeture (closure) ?', options: ['Une fonction sans paramètres', 'Une fonction qui capture les variables de son contexte de création', 'Une fonction qui se termine par return'], bonne: 1, explication: 'La fonction interne conserve l\'accès aux variables de la fonction externe, même après la fin de celle-ci.' },
            { q: 'Que signifie <code>...valeurs</code> dans une liste de paramètres ?', options: ['Les paramètres sont optionnels', 'Tous les arguments restants sont rassemblés dans un tableau', 'La fonction est asynchrone'], bonne: 1, explication: 'C\'est le paramètre rest.' }
          ]
        },
        {
          titre: 'Tableaux et objets',
          theorie: `<p>Les deux structures de données fondamentales de JavaScript : le <strong>tableau</strong> (liste ordonnée) et l'<strong>objet</strong> (dictionnaire clé → valeur). Tout le JSON du web est fait de ces deux briques.</p>
<h2>Tableaux</h2>
${code('javascript', `const courses = ["pain", "lait"];
courses.push("œufs");           // ajoute à la fin  → ["pain", "lait", "œufs"]
courses.unshift("thé");         // ajoute au début
const dernier = courses.pop();  // retire le dernier
courses.length;                 // 3
courses[0];                     // "thé"
courses.at(-1);                 // dernier élément
courses.includes("lait");       // true
courses.indexOf("lait");        // 2
courses.slice(1, 3);            // copie partielle (fin exclue), ne modifie pas
courses.splice(1, 1);           // retire 1 élément à l'indice 1 (modifie !)
[3, 1, 2].sort((a, b) => a - b);  // tri numérique : sans comparateur, tri alphabétique !
["a", "b"].join("-");           // "a-b"
"a,b".split(",");               // ["a", "b"]`)}
<h2>Objets</h2>
${code('javascript', `const contact = { nom: "Sow", email: "a@b.fr", age: 34 };
contact.tel = "06…";                 // ajout
contact["email"];                    // accès par crochets (clé dynamique)
delete contact.age;
"nom" in contact;                    // true
Object.keys(contact);                // ["nom", "email", "tel"]
Object.entries(contact);             // [["nom", "Sow"], ...]
const cle = "ville";
const o = { [cle]: "Lyon", nom };    // clé calculée ; raccourci { nom: nom }`)}
<h2>Destructuration et spread</h2>
${code('javascript', `const { nom, email, ...reste } = contact;        // extraire des propriétés
const [premier, , troisieme] = [1, 2, 3];          // par position
const copie = { ...contact, age: 35 };             // copie superficielle + modification
const fusion = [...courses, "riz"];                // nouveau tableau`)}
<p>Le <em>spread</em> <code>...</code> crée des copies <strong>superficielles</strong> : les objets imbriqués restent partagés. Pour une copie profonde : <code>structuredClone(obj)</code>.</p>
<h2>Références et égalité</h2>
${code('javascript', `const a = [1, 2];
const b = a;            // même tableau
b.push(3);              // a vaut aussi [1, 2, 3]
[1] === [1];            // false : deux objets différents
JSON.stringify(x) === JSON.stringify(y);   // comparaison de contenu simple`)}
<h2>Map et Set</h2>
<p><code>Map</code> est un dictionnaire dont les clés peuvent être de n'importe quel type et qui conserve l'ordre d'insertion ; <code>Set</code> est un ensemble sans doublons.</p>
${code('javascript', `const stock = new Map([["pomme", 3]]);
stock.set("kiwi", 5); stock.get("pomme"); stock.has("kiwi"); stock.size;
const uniques = [...new Set([1, 1, 2])];   // [1, 2]`)}
<div class="callout info"><b>Immutabilité</b>Les frameworks modernes (React…) préfèrent créer de nouveaux objets plutôt que de modifier les existants : <code>{ ...etat, compteur: etat.compteur + 1 }</code>. Prends l'habitude tôt.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Carnet de contacts',
            enonce: `<p>Écris : <code>ajouterContact(carnet, contact)</code> qui renvoie un <em>nouveau</em> tableau (sans modifier <code>carnet</code>) avec le contact ajouté ; <code>parVille(carnet)</code> qui renvoie un objet <code>{ ville: [noms…] }</code> ; <code>fusionner(c1, c2)</code> qui renvoie un nouvel objet contact où les propriétés de <code>c2</code> écrasent celles de <code>c1</code> (spread).</p>`,
            depart: `const carnet = [
  { nom: "Ana", ville: "Lyon" },
  { nom: "Bob", ville: "Paris" },
  { nom: "Chloé", ville: "Lyon" },
];

function ajouterContact(carnet, contact) {
  // ...
}

function parVille(carnet) {
  // ...
}

function fusionner(c1, c2) {
  // ...
}

console.log(parVille(carnet));
`,
            solution: `const carnet = [
  { nom: "Ana", ville: "Lyon" },
  { nom: "Bob", ville: "Paris" },
  { nom: "Chloé", ville: "Lyon" },
];

function ajouterContact(carnet, contact) {
  return [...carnet, contact];
}

function parVille(carnet) {
  const groupes = {};
  for (const { nom, ville } of carnet) {
    if (!(ville in groupes)) groupes[ville] = [];
    groupes[ville].push(nom);
  }
  return groupes;
}

function fusionner(c1, c2) {
  return { ...c1, ...c2 };
}

console.log(parVille(carnet));`,
            tests: [sansErreur(), expr('ajouterContact(carnet, { nom: "Dan", ville: "Nice" }).length', 4), expr('carnet.length', 3, 'ajouterContact ne doit pas modifier le carnet d\'origine : utilise le spread ou concat.'), expr('parVille(carnet)', { Lyon: ['Ana', 'Chloé'], Paris: ['Bob'] }), expr('fusionner({ nom: "A", ville: "X" }, { ville: "Y", tel: "1" })', { nom: 'A', ville: 'Y', tel: '1' }), codeContient('...', 'Utilise l\'opérateur spread (...).')]
          },
          quiz: [
            { q: 'Que donne <code>[10, 9, 1].sort()</code> ?', options: ['[1, 9, 10]', '[1, 10, 9]', '[10, 9, 1]'], bonne: 1, explication: 'Sans comparateur, sort trie par ordre alphabétique des chaînes : "1" < "10" < "9".' },
            { q: 'Que vaut <code>{ a: 1 } === { a: 1 }</code> ?', options: ['true', 'false', 'Erreur'], bonne: 1, explication: 'Deux objets distincts, même contenu : l\'égalité compare les références.' },
            { q: 'Que fait <code>const { x, ...autres } = obj</code> ?', options: ['Copie obj', 'Extrait x et met les autres propriétés dans un nouvel objet', 'Supprime x de obj'], bonne: 1, explication: 'Destructuration avec rest : autres contient tout sauf x.' }
          ]
        }
      ]
    },
    {
      titre: 'Le DOM et les événements', niveau: 'Débutant', description: 'Manipuler la page, réagir aux clics, valider des formulaires, stocker des données localement.',
      lecons: [
        {
          titre: 'Sélectionner et modifier le DOM',
          theorie: `<p>Le navigateur transforme le HTML en un arbre d'objets : le <strong>DOM</strong> (Document Object Model). JavaScript peut lire et modifier cet arbre, et la page se met à jour instantanément.</p>
<h2>Sélectionner</h2>
${code('javascript', `const titre = document.querySelector("h1");            // premier élément correspondant
const boutons = document.querySelectorAll(".btn");     // tous (NodeList, itérable)
const zone = document.getElementById("resultat");     // par id, très rapide
const carte = titre.closest(".carte");                 // ancêtre le plus proche`)}
<p>Les sélecteurs sont ceux du CSS : <code>"nav a"</code>, <code>"#id"</code>, <code>".classe"</code>, <code>"input[type=email]"</code>, <code>"li:first-child"</code>.</p>
<h2>Lire et modifier</h2>
${code('javascript', `titre.textContent = "Nouveau titre";       // texte brut (sûr)
zone.innerHTML = "<b>gras</b>";            // HTML interprété — jamais avec des données utilisateur !
titre.classList.add("actif");              // classes : add, remove, toggle, contains
titre.style.color = "crimson";             // style en ligne (préférer les classes)
titre.setAttribute("title", "info"); titre.dataset.id = "42";   // attributs et data-*
const champ = document.querySelector("input"); champ.value;    // valeur d'un champ`)}
<h2>Créer et insérer</h2>
${code('javascript', `const li = document.createElement("li");
li.textContent = "Nouvel élément";
li.className = "item";
document.querySelector("ul").append(li);     // à la fin (prepend : au début)
li.remove();                                 // suppression
ul.insertAdjacentHTML("beforeend", "<li>x</li>");`)}
<h2>Parcourir</h2>
<p><code>el.parentElement</code>, <code>el.children</code>, <code>el.nextElementSibling</code>, <code>el.firstElementChild</code>.</p>
<h2>Exemple complet</h2>
${code('html', `<ul id="liste"></ul>
<script>
  const taches = ["Lire", "Coder", "Dormir"];
  const ul = document.getElementById("liste");
  for (const t of taches) {
    const li = document.createElement("li");
    li.textContent = t;
    ul.append(li);
  }
</script>`)}
<h2>Quand le script s'exécute-t-il ?</h2>
<p>Un script placé avant les éléments qu'il cible ne les trouve pas (<code>null</code>). Solutions : placer le <code>&lt;script&gt;</code> en fin de <code>&lt;body&gt;</code>, ou utiliser <code>&lt;script defer src="app.js"&gt;</code> dans le <code>&lt;head&gt;</code>, ou attendre <code>DOMContentLoaded</code>.</p>
<div class="callout warn"><b>Sécurité : innerHTML</b>Insérer du texte saisi par un utilisateur via <code>innerHTML</code> ouvre la porte aux attaques XSS. Utilise <code>textContent</code> pour le texte, <code>createElement</code> pour la structure.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Générer une liste depuis des données',
            enonce: `<p>Dans le script de la page, à partir du tableau <code>produits</code>, génère un <code>&lt;li&gt;</code> par produit dans <code>#liste</code> avec le texte <code>Nom — prix €</code> et la classe <code>promo</code> si <code>promo</code> est vrai. Mets aussi à jour <code>#total</code> avec le nombre de produits : <code>3 produits</code>. Utilise <code>textContent</code>, pas <code>innerHTML</code>.</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.promo { color: crimson; font-weight: bold; }</style></head>
<body>
  <h1>Catalogue</h1>
  <ul id="liste"></ul>
  <p id="total"></p>
  <script>
    const produits = [
      { nom: "Clavier", prix: 49, promo: false },
      { nom: "Souris", prix: 19, promo: true },
      { nom: "Écran", prix: 189, promo: false },
    ];
    // Ton code ici
  </script>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.promo { color: crimson; font-weight: bold; }</style></head>
<body>
  <h1>Catalogue</h1>
  <ul id="liste"></ul>
  <p id="total"></p>
  <script>
    const produits = [
      { nom: "Clavier", prix: 49, promo: false },
      { nom: "Souris", prix: 19, promo: true },
      { nom: "Écran", prix: 189, promo: false },
    ];
    const ul = document.getElementById("liste");
    for (const p of produits) {
      const li = document.createElement("li");
      li.textContent = p.nom + " — " + p.prix + " €";
      if (p.promo) li.classList.add("promo");
      ul.append(li);
    }
    document.getElementById("total").textContent = produits.length + " produits";
  </script>
</body>
</html>`,
            tests: [dom('Trois <li> dans #liste', d => d.querySelectorAll('#liste li').length === 3), dom('Le premier li contient « Clavier — 49 € »', d => d.querySelector('#liste li').textContent.includes('Clavier — 49 €')), dom('La souris a la classe promo', d => [...d.querySelectorAll('#liste li')].some(li => li.textContent.includes('Souris') && li.classList.contains('promo'))), dom('#total affiche « 3 produits »', d => d.getElementById('total').textContent.trim() === '3 produits'), { nom: 'Pas d\'innerHTML', verif: ctx => ctx.code.includes('innerHTML') ? 'Utilise textContent et createElement plutôt qu\'innerHTML.' : true }]
          },
          quiz: [
            { q: 'Quelle méthode renvoie TOUS les éléments correspondant à un sélecteur ?', options: ['querySelector', 'querySelectorAll', 'getElement'], bonne: 1, explication: 'querySelector renvoie le premier, querySelectorAll une NodeList de tous.' },
            { q: 'Pourquoi préférer <code>textContent</code> à <code>innerHTML</code> pour du texte saisi ?', options: ['C\'est plus rapide', 'innerHTML interprète le HTML : risque XSS', 'textContent accepte les balises'], bonne: 1, explication: 'textContent insère le texte tel quel, sans l\'interpréter.' },
            { q: 'Pourquoi <code>document.querySelector("#x")</code> peut-il renvoyer null ?', options: ['Le script s\'exécute avant que l\'élément existe', 'Les id ne sont pas supportés', 'Il faut utiliser getElementById'], bonne: 0, explication: 'Place le script en fin de body ou utilise defer.' }
          ]
        },
        {
          titre: 'Événements',
          theorie: `<p>Une page interactive <em>réagit</em> : clics, saisie, survol, défilement, touches. Le mécanisme est toujours le même : on <strong>écoute</strong> un événement sur un élément avec une fonction de rappel.</p>
${code('javascript', `const bouton = document.querySelector("#ok");
bouton.addEventListener("click", (event) => {
  console.log("cliqué !", event.target);   // event.target : l'élément à l'origine
});`)}
<p>Évite les attributs <code>onclick="…"</code> dans le HTML : mélanger structure et comportement rend le code difficile à maintenir.</p>
<h2>Événements courants</h2>
<table><tr><th>Événement</th><th>Déclenché quand</th></tr>
<tr><td><code>click</code>, <code>dblclick</code></td><td>Clic (souris, clavier Entrée/Espace sur un bouton, toucher)</td></tr>
<tr><td><code>input</code></td><td>À chaque modification d'un champ (temps réel)</td></tr>
<tr><td><code>change</code></td><td>Quand la modification est validée (perte de focus, sélection)</td></tr>
<tr><td><code>submit</code></td><td>Envoi d'un formulaire (sur le <code>&lt;form&gt;</code>)</td></tr>
<tr><td><code>keydown</code>, <code>keyup</code></td><td>Touche enfoncée / relâchée (<code>event.key</code>)</td></tr>
<tr><td><code>mouseenter</code>, <code>mouseleave</code></td><td>Survol</td></tr>
<tr><td><code>scroll</code>, <code>resize</code></td><td>Défilement, redimensionnement (sur <code>window</code>)</td></tr>
<tr><td><code>DOMContentLoaded</code></td><td>HTML entièrement analysé</td></tr></table>
<h2>L'objet event</h2>
${code('javascript', `form.addEventListener("submit", e => {
  e.preventDefault();          // empêche le rechargement de la page
  const donnees = new FormData(form);
  console.log(donnees.get("email"));
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape") fermer();
  if (e.ctrlKey && e.key === "s") { e.preventDefault(); sauvegarder(); }
});`)}
<h2>Propagation et délégation</h2>
<p>Un événement « remonte » (bubbling) de l'élément cible vers ses ancêtres jusqu'à <code>document</code>. On peut donc écouter sur un parent et identifier la cible : c'est la <strong>délégation</strong>, indispensable pour des éléments créés dynamiquement.</p>
${code('javascript', `document.querySelector("#liste").addEventListener("click", e => {
  const li = e.target.closest("li");      // quel li a été cliqué ?
  if (!li) return;
  li.classList.toggle("fait");
});
// e.stopPropagation() arrête la remontée (rarement nécessaire)`)}
<h2>Retirer un écouteur</h2>
<p><code>removeEventListener</code> exige la <em>même</em> référence de fonction : stocke-la dans une variable. Ou passe <code>{ once: true }</code> pour un écouteur à usage unique.</p>
<h2>Exemple : compteur</h2>
${code('html', `<button id="plus">+</button> <span id="valeur">0</span>
<script>
  let n = 0;
  const affichage = document.getElementById("valeur");
  document.getElementById("plus").addEventListener("click", () => {
    n++;
    affichage.textContent = n;      // l'état vit en JS, le DOM reflète l'état
  });
</script>`)}
<div class="callout info"><b>État puis rendu</b>Bonne pratique : modifier d'abord tes données (<code>n++</code>), puis mettre à jour l'affichage à partir d'elles. Ne lis jamais l'état dans le DOM (« parseInt du texte du span ») : c'est fragile.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Liste de tâches interactive',
            enonce: `<p>Complète le script : à l'envoi du formulaire, ajoute un <code>&lt;li&gt;</code> contenant le texte du champ (ignorer les textes vides), vide le champ, et empêche le rechargement. Par délégation sur <code>#taches</code>, un clic sur un <code>li</code> bascule la classe <code>fait</code>. Le compteur <code>#reste</code> affiche le nombre de tâches sans la classe <code>fait</code>.</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.fait { text-decoration: line-through; opacity: .6; }</style></head>
<body>
  <form id="ajout"><input id="texte" placeholder="Nouvelle tâche"><button>Ajouter</button></form>
  <ul id="taches"></ul>
  <p>Restantes : <span id="reste">0</span></p>
  <script>
    const form = document.getElementById("ajout");
    const champ = document.getElementById("texte");
    const liste = document.getElementById("taches");
    const reste = document.getElementById("reste");

    function majCompteur() {
      // ...
    }

    // form submit → ajouter un li

    // délégation : clic sur un li → toggle "fait"
  </script>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.fait { text-decoration: line-through; opacity: .6; }</style></head>
<body>
  <form id="ajout"><input id="texte" placeholder="Nouvelle tâche"><button>Ajouter</button></form>
  <ul id="taches"></ul>
  <p>Restantes : <span id="reste">0</span></p>
  <script>
    const form = document.getElementById("ajout");
    const champ = document.getElementById("texte");
    const liste = document.getElementById("taches");
    const reste = document.getElementById("reste");

    function majCompteur() {
      reste.textContent = liste.querySelectorAll("li:not(.fait)").length;
    }

    form.addEventListener("submit", e => {
      e.preventDefault();
      const texte = champ.value.trim();
      if (!texte) return;
      const li = document.createElement("li");
      li.textContent = texte;
      liste.append(li);
      champ.value = "";
      majCompteur();
    });

    liste.addEventListener("click", e => {
      const li = e.target.closest("li");
      if (!li) return;
      li.classList.toggle("fait");
      majCompteur();
    });
  </script>
</body>
</html>`,
            tests: [
              dom('Soumettre le formulaire ajoute un li', (d) => { d.getElementById('texte').value = 'Tâche A'; d.getElementById('ajout').dispatchEvent(new d.defaultView.Event('submit', { bubbles: true, cancelable: true })); return d.querySelectorAll('#taches li').length === 1 && d.querySelector('#taches li').textContent === 'Tâche A'; }),
              dom('Le champ est vidé après ajout', d => d.getElementById('texte').value === ''),
              dom('Un texte vide est ignoré', d => { d.getElementById('texte').value = '   '; d.getElementById('ajout').dispatchEvent(new d.defaultView.Event('submit', { bubbles: true, cancelable: true })); return d.querySelectorAll('#taches li').length === 1; }),
              dom('Le compteur vaut 1', d => d.getElementById('reste').textContent.trim() === '1'),
              dom('Cliquer sur un li bascule la classe fait et met à jour le compteur', d => { d.querySelector('#taches li').click(); return d.querySelector('#taches li').classList.contains('fait') && d.getElementById('reste').textContent.trim() === '0'; }),
              { nom: 'Le rechargement est empêché (preventDefault)', verif: ctx => ctx.code.includes('preventDefault') ? true : 'Appelle e.preventDefault() dans l\'écouteur submit.' },
              { nom: 'Délégation : écouteur posé sur #taches ou la variable liste', verif: ctx => /liste\.addEventListener\(\s*["']click["']|getElementById\(["']taches["']\)\.addEventListener/.test(ctx.code) ? true : 'Écoute le clic sur la liste (délégation), pas sur chaque li.' }
            ]
          },
          quiz: [
            { q: 'À quoi sert <code>event.preventDefault()</code> sur un submit ?', options: ['À valider le formulaire', 'À empêcher le comportement par défaut (rechargement)', 'À envoyer les données en AJAX'], bonne: 1, explication: 'Sans lui, le navigateur recharge la page en soumettant le formulaire.' },
            { q: 'Pourquoi écouter sur le parent plutôt que sur chaque enfant ?', options: ['C\'est obligatoire', 'Les éléments ajoutés plus tard sont automatiquement gérés', 'Les enfants ne reçoivent pas les clics'], bonne: 1, explication: 'La délégation profite de la remontée (bubbling) des événements.' },
            { q: 'Quel événement se déclenche à chaque frappe dans un champ ?', options: ['change', 'input', 'submit'], bonne: 1, explication: 'input est immédiat ; change attend la validation (perte de focus).' }
          ]
        },
        {
          titre: 'Formulaires et validation',
          theorie: `<p>Les formulaires sont la porte d'entrée des données utilisateur. Deux niveaux de validation se complètent : celle du <strong>navigateur</strong> (attributs HTML) et celle de ton <strong>JavaScript</strong> (règles métier, messages personnalisés). Et toujours une validation côté serveur, car le client peut être contourné.</p>
<h2>Validation HTML native</h2>
${code('html', `<form id="inscription" novalidate>
  <input name="email" type="email" required>
  <input name="age" type="number" min="18" max="120">
  <input name="pseudo" pattern="[a-z0-9_]{3,15}" title="3 à 15 caractères : minuscules, chiffres, _">
  <button>Envoyer</button>
</form>`)}
<p><code>novalidate</code> désactive les bulles natives pour reprendre la main en JS, tout en conservant l'API : <code>champ.validity.valid</code>, <code>champ.validity.valueMissing</code>, <code>champ.validity.typeMismatch</code>, <code>form.checkValidity()</code>.</p>
<h2>Lire les valeurs</h2>
${code('javascript', `const form = document.getElementById("inscription");
form.addEventListener("submit", e => {
  e.preventDefault();
  const donnees = Object.fromEntries(new FormData(form));   // { email: "...", age: "18", ... }
  // ⚠ tout est chaîne : Number(donnees.age)
});
const caseCochee = form.elements.newsletter.checked;        // accès par name
const choix = form.elements.couleur.value;                   // select / radio`)}
<h2>Valider et afficher les erreurs</h2>
${code('javascript', `function validerEmail(email) {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);     // regex simple et suffisante
}

function afficherErreur(champ, message) {
  const zone = champ.nextElementSibling;             // <small class="erreur"> après le champ
  zone.textContent = message;
  champ.classList.toggle("invalide", !!message);
  champ.setAttribute("aria-invalid", message ? "true" : "false");
}

form.addEventListener("submit", e => {
  e.preventDefault();
  let ok = true;
  const email = form.elements.email;
  if (!validerEmail(email.value)) { afficherErreur(email, "Adresse invalide"); ok = false; }
  else afficherErreur(email, "");
  if (ok) form.reset();
});`)}
<h2>Validation en temps réel</h2>
<p>Valide à la frappe (<code>input</code>) uniquement <em>après</em> une première tentative d'envoi ou une perte de focus (<code>blur</code>), sinon l'utilisateur voit des erreurs avant d'avoir fini de taper.</p>
<h2>Accessibilité</h2>
<ul><li>Chaque champ a un <code>&lt;label for="id"&gt;</code>.</li><li>Les messages d'erreur sont liés par <code>aria-describedby</code> ou placés dans une zone <code>aria-live="polite"</code>.</li><li>Ne désactive pas le bouton d'envoi : laisse l'utilisateur soumettre et montre les erreurs.</li></ul>
<div class="callout warn"><b>Ne fais jamais confiance au client</b>Un attaquant peut envoyer n'importe quoi directement au serveur. La validation JS améliore l'expérience ; la validation serveur garantit la sécurité.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Formulaire d\'inscription validé',
            enonce: `<p>Complète le script : à l'envoi, vérifie que l'email est valide (regex), que le mot de passe fait au moins 8 caractères et contient un chiffre, et que la confirmation est identique. Affiche le message d'erreur dans le <code>&lt;small&gt;</code> qui suit chaque champ (vide s'il n'y a pas d'erreur). Si tout est valide, affiche <code>Inscription réussie</code> dans <code>#statut</code>.</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>small { color: crimson; display: block; } label { display: block; margin-top: 8px; }</style></head>
<body>
  <form id="f" novalidate>
    <label>Email <input name="email" id="email"><small></small></label>
    <label>Mot de passe <input name="mdp" id="mdp" type="password"><small></small></label>
    <label>Confirmation <input name="confirm" id="confirm" type="password"><small></small></label>
    <button>S'inscrire</button>
  </form>
  <p id="statut"></p>
  <script>
    const form = document.getElementById("f");
    function erreur(champ, message) {
      champ.nextElementSibling.textContent = message;
    }
    form.addEventListener("submit", e => {
      e.preventDefault();
      // ...
    });
  </script>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>small { color: crimson; display: block; } label { display: block; margin-top: 8px; }</style></head>
<body>
  <form id="f" novalidate>
    <label>Email <input name="email" id="email"><small></small></label>
    <label>Mot de passe <input name="mdp" id="mdp" type="password"><small></small></label>
    <label>Confirmation <input name="confirm" id="confirm" type="password"><small></small></label>
    <button>S'inscrire</button>
  </form>
  <p id="statut"></p>
  <script>
    const form = document.getElementById("f");
    function erreur(champ, message) {
      champ.nextElementSibling.textContent = message;
    }
    form.addEventListener("submit", e => {
      e.preventDefault();
      const { email, mdp, confirm } = form.elements;
      let ok = true;
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.value)) { erreur(email, "Adresse email invalide"); ok = false; } else erreur(email, "");
      if (mdp.value.length < 8 || !/\\d/.test(mdp.value)) { erreur(mdp, "8 caractères minimum dont un chiffre"); ok = false; } else erreur(mdp, "");
      if (confirm.value !== mdp.value) { erreur(confirm, "Les mots de passe diffèrent"); ok = false; } else erreur(confirm, "");
      document.getElementById("statut").textContent = ok ? "Inscription réussie" : "";
    });
  </script>
</body>
</html>`,
            tests: [
              dom('Email invalide → message dans le small', d => { const f = d.getElementById('f'); d.getElementById('email').value = 'pasunemail'; d.getElementById('mdp').value = 'abcdefg1'; d.getElementById('confirm').value = 'abcdefg1'; f.dispatchEvent(new d.defaultView.Event('submit', { bubbles: true, cancelable: true })); return d.getElementById('email').nextElementSibling.textContent.trim().length > 0 && d.getElementById('statut').textContent.trim() === ''; }),
              dom('Mot de passe sans chiffre → erreur', d => { const f = d.getElementById('f'); d.getElementById('email').value = 'a@b.fr'; d.getElementById('mdp').value = 'abcdefghij'; d.getElementById('confirm').value = 'abcdefghij'; f.dispatchEvent(new d.defaultView.Event('submit', { bubbles: true, cancelable: true })); return d.getElementById('mdp').nextElementSibling.textContent.trim().length > 0 && d.getElementById('email').nextElementSibling.textContent.trim() === ''; }),
              dom('Confirmation différente → erreur', d => { const f = d.getElementById('f'); d.getElementById('mdp').value = 'abcdefg1'; d.getElementById('confirm').value = 'abcdefg2'; f.dispatchEvent(new d.defaultView.Event('submit', { bubbles: true, cancelable: true })); return d.getElementById('confirm').nextElementSibling.textContent.trim().length > 0 && d.getElementById('mdp').nextElementSibling.textContent.trim() === ''; }),
              dom('Formulaire valide → « Inscription réussie »', d => { const f = d.getElementById('f'); d.getElementById('confirm').value = 'abcdefg1'; f.dispatchEvent(new d.defaultView.Event('submit', { bubbles: true, cancelable: true })); return d.getElementById('statut').textContent.trim() === 'Inscription réussie' && [...d.querySelectorAll('small')].every(s => s.textContent.trim() === ''); })
            ]
          },
          quiz: [
            { q: 'Que renvoie <code>new FormData(form)</code> converti avec <code>Object.fromEntries</code> ?', options: ['Un objet dont toutes les valeurs sont des chaînes', 'Un objet typé (nombres, booléens)', 'Un tableau'], bonne: 0, explication: 'Les champs de formulaire sont toujours textuels : convertis avec Number() si besoin.' },
            { q: 'Pourquoi valider aussi côté serveur ?', options: ['Pour la performance', 'Parce que le client peut être contourné', 'Pour éviter le JavaScript'], bonne: 1, explication: 'N\'importe qui peut envoyer une requête forgée sans passer par ton formulaire.' },
            { q: 'Quel attribut désactive les bulles de validation natives ?', options: ['disabled', 'novalidate', 'nocheck'], bonne: 1, explication: 'novalidate sur le form laisse ton JS gérer l\'affichage, tout en gardant l\'API validity.' }
          ]
        },
        {
          titre: 'Stockage local et JSON',
          theorie: `<p>Une page web oublie tout au rechargement… sauf si tu sauvegardes. Le navigateur offre plusieurs mécanismes de stockage côté client, dont le plus simple est <strong>localStorage</strong>. C'est d'ailleurs ce qu'utilise Lumio pour ta progression.</p>
<h2>localStorage</h2>
${code('javascript', `localStorage.setItem("theme", "sombre");   // écrire (clé et valeur : chaînes)
localStorage.getItem("theme");              // "sombre", ou null si absent
localStorage.removeItem("theme");
localStorage.clear();                       // tout effacer pour ce site`)}
<p>Caractéristiques : ~5 Mo par origine (domaine), persistant sans date d'expiration, synchrone (ne pas y faire des milliers d'accès dans une boucle), accessible uniquement par les pages du même domaine. <code>sessionStorage</code> a la même API mais s'efface à la fermeture de l'onglet.</p>
<h2>Stocker des objets : JSON</h2>
<p>localStorage ne stocke que des chaînes. Pour un objet ou un tableau, on le <em>sérialise</em> en JSON.</p>
${code('javascript', `const taches = [{ titre: "Lire", fait: false }];
localStorage.setItem("taches", JSON.stringify(taches));

const relu = JSON.parse(localStorage.getItem("taches") ?? "[]");   // repli si absent`)}
<p><code>JSON.stringify(obj, null, 2)</code> produit une version indentée lisible. JSON ne connaît pas <code>undefined</code>, les fonctions, les dates (converties en chaînes) ni <code>Map</code>/<code>Set</code> : convertis-les avant.</p>
<h2>Toujours protéger les accès</h2>
<p>En navigation privée, avec des cookies bloqués, ou si les données sont corrompues, les appels peuvent lever une exception. Encapsule-les :</p>
${code('javascript', `const stockage = {
  lire(cle, defaut) {
    try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; }
    catch { return defaut; }
  },
  ecrire(cle, valeur) {
    try { localStorage.setItem(cle, JSON.stringify(valeur)); return true; }
    catch { return false; }        // quota dépassé ou stockage bloqué
  }
};`)}
<h2>Motif « état → stockage → rendu »</h2>
${code('javascript', `let etat = stockage.lire("app", { compteur: 0 });
function rendre() { document.getElementById("c").textContent = etat.compteur; }
function modifier(fn) { fn(etat); stockage.ecrire("app", etat); rendre(); }
document.getElementById("plus").onclick = () => modifier(s => s.compteur++);
rendre();`)}
<p>Chaque modification passe par une seule fonction qui sauvegarde et réaffiche : impossible d'oublier l'un ou l'autre.</p>
<h2>Les autres stockages</h2>
<ul><li><strong>Cookies</strong> : petits (4 Ko), envoyés au serveur à chaque requête ; réservés à la session/authentification.</li><li><strong>IndexedDB</strong> : base de données asynchrone pour de gros volumes (fichiers, cache hors ligne).</li><li><strong>Cache API</strong> : utilisée par les service workers pour le mode hors ligne.</li></ul>
<div class="callout warn"><b>Jamais de secret</b>localStorage est lisible par tout script de la page (y compris un script malveillant injecté). N'y mets ni mot de passe ni jeton sensible de longue durée.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Préférences persistantes',
            enonce: `<p>Complète le script : l'objet <code>prefs</code> (<code>{ theme, taille }</code>) est chargé depuis <code>localStorage</code> sous la clé <code>prefs</code> (valeurs par défaut <code>"clair"</code> et <code>16</code>, et aucun plantage si le JSON est invalide). Le bouton <code>#theme</code> bascule <code>clair</code>/<code>sombre</code>, <code>#plus</code> augmente la taille de 2. Chaque modification est sauvegardée et affichée dans <code>#etat</code> au format <code>sombre / 18px</code>, et <code>body</code> reçoit la classe <code>sombre</code> si nécessaire.</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>body.sombre { background: #222; color: #eee; }</style></head>
<body>
  <button id="theme">Thème</button> <button id="plus">A+</button>
  <p id="etat"></p>
  <script>
    const DEFAUT = { theme: "clair", taille: 16 };
    function charger() {
      // ...
    }
    function sauvegarder(prefs) {
      // ...
    }
    let prefs = charger();
    function rendre() {
      // ...
    }
    // écouteurs
    rendre();
  </script>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>body.sombre { background: #222; color: #eee; }</style></head>
<body>
  <button id="theme">Thème</button> <button id="plus">A+</button>
  <p id="etat"></p>
  <script>
    const DEFAUT = { theme: "clair", taille: 16 };
    function charger() {
      try {
        const brut = localStorage.getItem("prefs");
        return brut ? { ...DEFAUT, ...JSON.parse(brut) } : { ...DEFAUT };
      } catch {
        return { ...DEFAUT };
      }
    }
    function sauvegarder(prefs) {
      try { localStorage.setItem("prefs", JSON.stringify(prefs)); } catch {}
    }
    let prefs = charger();
    function rendre() {
      document.getElementById("etat").textContent = prefs.theme + " / " + prefs.taille + "px";
      document.body.classList.toggle("sombre", prefs.theme === "sombre");
      document.body.style.fontSize = prefs.taille + "px";
    }
    function modifier(fn) { fn(prefs); sauvegarder(prefs); rendre(); }
    document.getElementById("theme").addEventListener("click", () => modifier(p => { p.theme = p.theme === "clair" ? "sombre" : "clair"; }));
    document.getElementById("plus").addEventListener("click", () => modifier(p => { p.taille += 2; }));
    rendre();
  </script>
</body>
</html>`,
            tests: [
              dom('Affichage initial « clair / 16px »', d => { try { d.defaultView.localStorage.removeItem('prefs'); } catch {} return /clair \/ 16px/.test(d.getElementById('etat').textContent) || true; }),
              dom('Clic sur #theme → « sombre » et classe body.sombre', d => { d.getElementById('theme').click(); return d.getElementById('etat').textContent.includes('sombre') && d.body.classList.contains('sombre'); }),
              dom('Clic sur #plus → taille +2', d => { const avant = parseInt(d.getElementById('etat').textContent.match(/(\d+)px/)[1]); d.getElementById('plus').click(); return parseInt(d.getElementById('etat').textContent.match(/(\d+)px/)[1]) === avant + 2; }),
              dom('Les préférences sont sauvegardées en JSON dans localStorage', d => { const b = d.defaultView.localStorage.getItem('prefs'); const o = JSON.parse(b); d.defaultView.localStorage.removeItem('prefs'); return o && o.theme === 'sombre' && typeof o.taille === 'number'; }),
              { nom: 'Le chargement est protégé par try/catch', verif: ctx => /try\s*\{/.test(ctx.code) && /JSON\.parse/.test(ctx.code) ? true : 'Entoure JSON.parse / localStorage d\'un try/catch avec valeur par défaut.' }
            ]
          },
          quiz: [
            { q: 'Que stocke localStorage ?', options: ['Des objets JavaScript', 'Uniquement des chaînes de caractères', 'Des fichiers'], bonne: 1, explication: 'D\'où la sérialisation JSON pour les objets.' },
            { q: 'Quelle différence entre localStorage et sessionStorage ?', options: ['La taille', 'sessionStorage est effacé à la fermeture de l\'onglet', 'localStorage est envoyé au serveur'], bonne: 1, explication: 'Même API, durée de vie différente. Aucun des deux n\'est envoyé au serveur (contrairement aux cookies).' },
            { q: 'Pourquoi ne pas stocker un jeton sensible dans localStorage ?', options: ['Trop petit', 'Tout script de la page peut le lire (XSS)', 'Il expire trop vite'], bonne: 1, explication: 'Un cookie HttpOnly est inaccessible à JavaScript, pas localStorage.' }
          ]
        }
      ]
    },
