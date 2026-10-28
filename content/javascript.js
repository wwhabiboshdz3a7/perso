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
    {
      titre: 'JavaScript moderne et asynchrone', niveau: 'Intermédiaire', description: 'Méthodes de tableaux, classes et modules, promesses et async/await, fetch et API.',
      lecons: [
        {
          titre: 'map, filter, reduce et compagnie',
          theorie: `<p>Les méthodes de tableaux transforment les données <em>sans boucle explicite</em> et <em>sans modifier</em> le tableau d'origine. Elles se lisent comme une phrase et s'enchaînent.</p>
${code('javascript', `const produits = [
  { nom: "Clavier", prix: 49, stock: 3 },
  { nom: "Souris", prix: 19, stock: 0 },
  { nom: "Écran", prix: 189, stock: 5 },
];

// map : transformer chaque élément → nouveau tableau de même longueur
const noms = produits.map(p => p.nom);                     // ["Clavier", "Souris", "Écran"]

// filter : garder ceux qui passent le test
const disponibles = produits.filter(p => p.stock > 0);

// reduce : réduire à une seule valeur (accumulateur, élément) → accumulateur
const valeurStock = produits.reduce((total, p) => total + p.prix * p.stock, 0);   // 1092

// enchaînement
const nomsChers = produits.filter(p => p.prix > 30).map(p => p.nom.toUpperCase());`)}
<h2>Les autres indispensables</h2>
${code('javascript', `produits.find(p => p.nom === "Souris");       // premier élément correspondant (ou undefined)
produits.findIndex(p => p.prix > 100);        // 2
produits.some(p => p.stock === 0);            // true : au moins un
produits.every(p => p.prix > 10);             // true : tous
produits.forEach(p => console.log(p.nom));    // effet de bord, pas de retour
[[1, 2], [3]].flat();                         // [1, 2, 3]
produits.flatMap(p => [p.nom, p.prix]);       // map + flat
[3, 1, 2].toSorted((a, b) => a - b);          // copie triée (sort modifie l'original)
Array.from({ length: 5 }, (_, i) => i * i);   // [0, 1, 4, 9, 16]`)}
<h2>reduce pour grouper et compter</h2>
${code('javascript', `const mots = ["a", "b", "a", "c", "a"];
const compte = mots.reduce((acc, m) => {
  acc[m] = (acc[m] ?? 0) + 1;
  return acc;
}, {});                                       // { a: 3, b: 1, c: 1 }

const parStock = Object.groupBy(produits, p => p.stock > 0 ? "dispo" : "rupture");`)}
<h2>Chaîner sans casser la lisibilité</h2>
<p>Une ligne par méthode, dans l'ordre logique : filtrer d'abord (moins d'éléments à transformer), puis transformer, puis agréger. Si une étape a besoin d'un nom, extrais une variable intermédiaire ou une fonction nommée.</p>
${code('javascript', `const chiffreAffaires = commandes
  .filter(c => c.payee)
  .map(c => c.montant)
  .reduce((a, b) => a + b, 0);`)}
<h2>Attention aux mutations</h2>
<p><code>sort</code>, <code>reverse</code>, <code>splice</code>, <code>push</code> modifient le tableau. <code>map</code>, <code>filter</code>, <code>slice</code>, <code>toSorted</code>, <code>toReversed</code>, le spread créent des copies. Dans du code partagé (état d'une application), préfère les copies.</p>
<div class="callout info"><b>Performance</b>Chaque méthode parcourt le tableau : trois méthodes enchaînées = trois passes. Pour des millions d'éléments, une seule boucle <code>for</code> peut être justifiée. Pour tout le reste, la lisibilité gagne.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Tableau de bord des ventes',
            enonce: `<p>À partir de <code>ventes</code>, écris sans boucle <code>for</code>/<code>while</code> : <code>chiffreAffaires(ventes)</code> (somme montant des ventes payées), <code>topProduits(ventes, n)</code> (les <code>n</code> noms de produits les plus vendus en quantité, par ordre décroissant), <code>parMois(ventes)</code> (objet <code>{ "2026-01": total, ... }</code>, toutes ventes confondues).</p>`,
            depart: `const ventes = [
  { produit: "Clavier", quantite: 2, montant: 98, payee: true, date: "2026-01-12" },
  { produit: "Souris", quantite: 5, montant: 95, payee: true, date: "2026-01-20" },
  { produit: "Écran", quantite: 1, montant: 189, payee: false, date: "2026-02-02" },
  { produit: "Souris", quantite: 3, montant: 57, payee: true, date: "2026-02-15" },
  { produit: "Clavier", quantite: 1, montant: 49, payee: true, date: "2026-02-20" },
];

const chiffreAffaires = ventes => {
  // ...
};

const topProduits = (ventes, n) => {
  // ...
};

const parMois = ventes => {
  // ...
};

console.log(chiffreAffaires(ventes), topProduits(ventes, 2), parMois(ventes));
`,
            solution: `const ventes = [
  { produit: "Clavier", quantite: 2, montant: 98, payee: true, date: "2026-01-12" },
  { produit: "Souris", quantite: 5, montant: 95, payee: true, date: "2026-01-20" },
  { produit: "Écran", quantite: 1, montant: 189, payee: false, date: "2026-02-02" },
  { produit: "Souris", quantite: 3, montant: 57, payee: true, date: "2026-02-15" },
  { produit: "Clavier", quantite: 1, montant: 49, payee: true, date: "2026-02-20" },
];

const chiffreAffaires = ventes =>
  ventes.filter(v => v.payee).reduce((total, v) => total + v.montant, 0);

const topProduits = (ventes, n) => {
  const quantites = ventes.reduce((acc, v) => {
    acc[v.produit] = (acc[v.produit] ?? 0) + v.quantite;
    return acc;
  }, {});
  return Object.entries(quantites)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([nom]) => nom);
};

const parMois = ventes =>
  ventes.reduce((acc, v) => {
    const mois = v.date.slice(0, 7);
    acc[mois] = (acc[mois] ?? 0) + v.montant;
    return acc;
  }, {});

console.log(chiffreAffaires(ventes), topProduits(ventes, 2), parMois(ventes));`,
            tests: [sansErreur(), expr('chiffreAffaires(ventes)', 299), expr('topProduits(ventes, 2)', ['Souris', 'Clavier']), expr('topProduits(ventes, 1)', ['Souris']), expr('parMois(ventes)', { '2026-01': 193, '2026-02': 295 }), codeRegex(/^(?!.*\b(for|while)\s*\().*$/s, 'Aucune boucle for/while', 'Utilise filter, map, reduce, sort… sans boucle explicite.'), codeContient('reduce', 'reduce est l\'outil naturel pour sommer ou grouper.')]
          },
          quiz: [
            { q: 'Quelle méthode renvoie un tableau de même longueur, transformé ?', options: ['filter', 'map', 'reduce'], bonne: 1, explication: 'map applique une fonction à chaque élément ; filter peut réduire la longueur ; reduce renvoie une seule valeur.' },
            { q: 'Que vaut <code>[1, 2, 3].reduce((a, b) =&gt; a + b, 10)</code> ?', options: ['6', '16', '[11, 12, 13]'], bonne: 1, explication: 'L\'accumulateur part de 10 puis ajoute 1, 2 et 3.' },
            { q: 'Laquelle de ces méthodes MODIFIE le tableau d\'origine ?', options: ['map', 'slice', 'sort'], bonne: 2, explication: 'sort trie en place. toSorted() renvoie une copie.' }
          ]
        },
        {
          titre: 'Classes, modules et organisation du code',
          theorie: `<p>Quand un script dépasse quelques dizaines de lignes, il faut l'organiser : des <strong>classes</strong> pour regrouper état et comportement, des <strong>modules</strong> pour découper en fichiers.</p>
<h2>Classes</h2>
${code('javascript', `class Compte {
  #solde = 0;                                  // champ privé (vraiment inaccessible)
  static nombreComptes = 0;                    // propriété de classe

  constructor(titulaire) {
    this.titulaire = titulaire;
    Compte.nombreComptes++;
  }
  deposer(montant) {
    if (montant <= 0) throw new RangeError("montant invalide");
    this.#solde += montant;
    return this;                               // permet le chaînage
  }
  get solde() { return this.#solde; }          // accesseur : compte.solde sans parenthèses
  toString() { return \`\${this.titulaire} : \${this.#solde} €\`; }
}

class CompteEpargne extends Compte {
  constructor(titulaire, taux) { super(titulaire); this.taux = taux; }
  capitaliser() { this.deposer(this.solde * this.taux); }
}
const c = new CompteEpargne("Ana", 0.03);
c.deposer(100).deposer(50);
c instanceof Compte;                           // true`)}
<p>Sous le capot, les classes reposent sur les <em>prototypes</em> : chaque objet a un lien vers un prototype dont il hérite les méthodes. La syntaxe <code>class</code> est une façade plus lisible.</p>
<h2>this : la subtilité</h2>
<p><code>this</code> dépend de <em>comment</em> une fonction est appelée. Passer une méthode en callback (<code>bouton.addEventListener("click", compte.deposer)</code>) perd le <code>this</code>. Solutions : une fonction fléchée <code>() =&gt; compte.deposer(10)</code>, ou <code>compte.deposer.bind(compte)</code>, ou déclarer la méthode comme champ fléché <code>deposer = (m) =&gt; { … }</code>.</p>
<h2>Modules ES</h2>
<p>Chaque fichier est un module avec sa portée propre : rien n'est global par défaut. On <strong>exporte</strong> ce qu'on partage, on <strong>importe</strong> ce dont on a besoin.</p>
${code('javascript', `// utils/format.js
export function euros(n) { return n.toFixed(2) + " €"; }
export const TVA = 0.2;
export default class Panier { /* ... */ }

// app.js
import Panier, { euros, TVA } from "./utils/format.js";
import * as format from "./utils/format.js";       // tout dans un espace de noms
const { euros: formaterEuros } = await import("./utils/format.js");   // import dynamique`)}
<p>Dans le navigateur : <code>&lt;script type="module" src="app.js"&gt;</code> (différé automatiquement, mode strict, chemins relatifs avec extension). Les modules sont chargés une seule fois et mis en cache : l'état d'un module est partagé par tous ses importateurs, ce qui en fait un singleton naturel.</p>
<h2>Organiser un projet</h2>
<ul><li><code>app.js</code> : point d'entrée, câblage.</li><li><code>modele/</code> : logique métier pure, sans DOM, testable.</li><li><code>vue/</code> ou <code>ui/</code> : fonctions de rendu et écouteurs.</li><li><code>services/</code> : accès réseau, stockage.</li></ul>
<p>Règle : la logique ne connaît pas le DOM, la vue ne calcule rien. C'est exactement l'architecture de Lumio (<code>content/</code> pour les données, <code>app/</code> pour l'interface).</p>
<div class="callout info"><b>Mode strict</b>Les modules et les classes sont automatiquement en mode strict : variables non déclarées interdites, <code>this</code> vaut <code>undefined</code> hors contexte au lieu de <code>window</code>. Autant d'erreurs silencieuses en moins.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'File d\'attente avec classe',
            enonce: `<p>Implémente une classe <code>FileAttente</code> avec un champ privé <code>#elements</code> (tableau), les méthodes <code>ajouter(x)</code> (renvoie <code>this</code> pour chaîner), <code>retirer()</code> (retire et renvoie le premier élément, ou <code>undefined</code> si vide), un getter <code>taille</code>, et une méthode statique <code>depuis(tableau)</code> qui crée une file contenant ces éléments. Puis une sous-classe <code>FileLimitee</code> dont le constructeur reçoit une capacité ; <code>ajouter</code> lève une <code>Error</code> si la capacité est atteinte.</p>`,
            depart: `class FileAttente {
  // ...
}

class FileLimitee extends FileAttente {
  // ...
}

const f = FileAttente.depuis([1, 2]);
f.ajouter(3).ajouter(4);
console.log(f.retirer(), f.taille);
`,
            solution: `class FileAttente {
  #elements = [];

  ajouter(x) {
    this.#elements.push(x);
    return this;
  }
  retirer() {
    return this.#elements.shift();
  }
  get taille() {
    return this.#elements.length;
  }
  static depuis(tableau) {
    const f = new this();
    for (const x of tableau) f.ajouter(x);
    return f;
  }
}

class FileLimitee extends FileAttente {
  constructor(capacite) {
    super();
    this.capacite = capacite;
  }
  ajouter(x) {
    if (this.taille >= this.capacite) throw new Error("file pleine");
    return super.ajouter(x);
  }
}

const f = FileAttente.depuis([1, 2]);
f.ajouter(3).ajouter(4);
console.log(f.retirer(), f.taille);`,
            tests: [sansErreur(), expr('(() => { const q = new FileAttente(); q.ajouter("a").ajouter("b"); return [q.retirer(), q.taille, q.retirer(), q.retirer()]; })()', ['a', 1, 'b', null], 'Ordre FIFO : le premier ajouté sort en premier ; undefined si vide.'), expr('FileAttente.depuis([5, 6]).taille', 2), expr('typeof new FileAttente().elements', 'undefined', 'Les éléments doivent être privés (#elements).'), expr('(() => { const q = new FileLimitee(2); q.ajouter(1).ajouter(2); return q.taille; })()', 2), leveJS('new FileLimitee(1).ajouter(1).ajouter(2)', 'Error'), expr('new FileLimitee(3) instanceof FileAttente', true), codeContient('#elements', 'Utilise un champ privé #elements.'), codeContient('static depuis', 'depuis doit être une méthode statique.')]
          },
          quiz: [
            { q: 'Que signifie <code>#solde</code> dans une classe ?', options: ['Un commentaire', 'Un champ privé inaccessible de l\'extérieur', 'Une propriété statique'], bonne: 1, explication: 'Le préfixe # rend le champ réellement privé, contrairement à la convention _ de Python.' },
            { q: 'Que fait <code>export default</code> ?', options: ['Exporte toutes les fonctions', 'Désigne l\'export principal du module, importé sans accolades', 'Rend le module global'], bonne: 1, explication: 'Un seul export default par module ; les autres sont des exports nommés.' },
            { q: 'Pourquoi passer <code>() =&gt; obj.methode()</code> plutôt que <code>obj.methode</code> en callback ?', options: ['Pour conserver le this de obj', 'C\'est plus court', 'Pour éviter une boucle infinie'], bonne: 0, explication: 'Détachée de son objet, la méthode perd son this.' }
          ]
        },
        {
          titre: 'Promesses et async/await',
          theorie: `<p>JavaScript s'exécute sur un seul fil : si une opération longue (réseau, timer, fichier) bloquait, la page se figerait. D'où le modèle <strong>asynchrone</strong> : on lance l'opération, on continue, et on est rappelé quand elle est terminée.</p>
<h2>La boucle d'événements</h2>
${code('javascript', `console.log("1");
setTimeout(() => console.log("3"), 0);    // placé dans la file, exécuté après
console.log("2");                          // affiche 1, 2, 3`)}
<p>Le code synchrone se termine d'abord ; les callbacks (timers, événements, réponses réseau) sont exécutés ensuite, un par un, par la <em>boucle d'événements</em>.</p>
<h2>Les promesses</h2>
<p>Une <strong>Promise</strong> représente une valeur future : en attente (<em>pending</em>), tenue (<em>fulfilled</em>) ou rompue (<em>rejected</em>).</p>
${code('javascript', `function attendre(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function chargerUtilisateur(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => id > 0 ? resolve({ id, nom: "Ana" }) : reject(new Error("id invalide")), 100);
  });
}

chargerUtilisateur(1)
  .then(u => { console.log(u.nom); return u.id; })   // chaque then renvoie une nouvelle promesse
  .then(id => console.log("id", id))
  .catch(err => console.error(err.message))            // une seule gestion d'erreur pour la chaîne
  .finally(() => console.log("terminé"));`)}
<h2>async / await : la même chose, lisible</h2>
${code('javascript', `async function afficherUtilisateur(id) {       // async : renvoie toujours une promesse
  try {
    const u = await chargerUtilisateur(id);         // await : attend sans bloquer le fil
    console.log(u.nom);
    await attendre(500);
    return u;
  } catch (err) {
    console.error("Échec :", err.message);
  }
}
afficherUtilisateur(1).then(u => console.log("fini", u));`)}
<p><code>await</code> ne s'utilise que dans une fonction <code>async</code> (ou au niveau racine d'un module). Pendant l'attente, le navigateur reste réactif.</p>
<h2>Paralléliser</h2>
${code('javascript', `// Séquentiel (lent) : 2 × 100 ms
const a = await chargerUtilisateur(1);
const b = await chargerUtilisateur(2);

// Parallèle : ~100 ms
const [a2, b2] = await Promise.all([chargerUtilisateur(1), chargerUtilisateur(2)]);

// Tolérant aux échecs individuels
const resultats = await Promise.allSettled([p1, p2]);   // [{status, value|reason}, ...]
const premier = await Promise.race([p1, timeoutApres(3000)]);   // le premier terminé`)}
<h2>Erreurs fréquentes</h2>
<ul><li>Oublier <code>await</code> : on manipule une promesse au lieu de sa valeur (<code>[object Promise]</code>).</li><li><code>forEach</code> avec <code>async</code> : les itérations ne sont pas attendues. Utilise <code>for…of</code> + <code>await</code>, ou <code>Promise.all(tableau.map(async …))</code>.</li><li>Promesse non gérée : toujours un <code>catch</code> (ou <code>try/catch</code>) quelque part.</li></ul>
<div class="callout info"><b>Dans l'éditeur Lumio</b>Le code de l'exercice est attendu s'il renvoie une promesse : écris ton programme dans une fonction <code>async principal()</code> et termine par <code>principal()</code>. Les timers fonctionnent (limite : 4 s).</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Chargement parallèle avec délai',
            enonce: `<p>Avec la fonction simulée <code>chargerProduit(id)</code> fournie (100 ms, rejette si l'id est 0) : écris <code>attendre(ms)</code> (promesse résolue après ms), <code>chargerTous(ids)</code> (async, charge tous les produits <em>en parallèle</em> et renvoie leurs noms), et <code>chargerSur(ids)</code> (async, renvoie <code>{ ok: [noms], erreurs: nombre }</code> sans jamais rejeter, grâce à <code>Promise.allSettled</code>). Le programme doit afficher le résultat de <code>chargerSur([1, 0, 2])</code>.</p>`,
            depart: `function chargerProduit(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === 0) reject(new Error("produit inconnu"));
      else resolve({ id, nom: "Produit " + id });
    }, 100);
  });
}

function attendre(ms) {
  // ...
}

async function chargerTous(ids) {
  // ...
}

async function chargerSur(ids) {
  // ...
}

async function principal() {
  console.log(await chargerSur([1, 0, 2]));
}
principal();
`,
            solution: `function chargerProduit(id) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === 0) reject(new Error("produit inconnu"));
      else resolve({ id, nom: "Produit " + id });
    }, 100);
  });
}

function attendre(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function chargerTous(ids) {
  const produits = await Promise.all(ids.map(id => chargerProduit(id)));
  return produits.map(p => p.nom);
}

async function chargerSur(ids) {
  const resultats = await Promise.allSettled(ids.map(id => chargerProduit(id)));
  return {
    ok: resultats.filter(r => r.status === "fulfilled").map(r => r.value.nom),
    erreurs: resultats.filter(r => r.status === "rejected").length,
  };
}

async function principal() {
  console.log(await chargerSur([1, 0, 2]));
}
principal();`,
            tests: [sansErreur(), sortieContient('"ok":["Produit 1","Produit 2"]', 'chargerSur([1, 0, 2]) doit renvoyer ok = ["Produit 1", "Produit 2"].'), sortieContient('"erreurs":1'), codeContient('Promise.all', 'chargerTous doit utiliser Promise.all pour paralléliser.'), codeContient('Promise.allSettled', 'chargerSur doit utiliser Promise.allSettled.'), codeRegex(/new Promise\(\s*(resolve|res)\s*=>\s*setTimeout\(/, 'attendre encapsule setTimeout dans une promesse', 'attendre(ms) = new Promise(resolve => setTimeout(resolve, ms)).'), { nom: 'chargerTous est parallèle (pas d\'await dans une boucle)', verif: ctx => /for\s*\([^)]*of[^)]*\)\s*\{?[^}]*await chargerProduit/s.test(ctx.code) ? 'Ne charge pas les produits un par un dans une boucle : utilise Promise.all(ids.map(...)).' : true }]
          },
          quiz: [
            { q: 'Que renvoie toujours une fonction <code>async</code> ?', options: ['undefined', 'Une promesse', 'La valeur directement'], bonne: 1, explication: 'Même si elle retourne 42, l\'appelant reçoit une promesse résolue avec 42.' },
            { q: 'Quelle est la sortie de : <code>console.log(1); setTimeout(() =&gt; console.log(2), 0); console.log(3);</code>', options: ['1 2 3', '1 3 2', '2 1 3'], bonne: 1, explication: 'Le callback du timer attend la fin du code synchrone, même avec un délai de 0.' },
            { q: 'Pour lancer trois requêtes simultanément et attendre toutes les réponses :', options: ['Trois await successifs', 'Promise.all', 'setTimeout'], bonne: 1, explication: 'Promise.all lance tout en parallèle et résout quand toutes sont terminées (ou rejette dès la première erreur).' }
          ]
        },
        {
          titre: 'Fetch, API et JSON',
          theorie: `<p>Le web moderne est fait d'<strong>API</strong> : des serveurs qui répondent en JSON à des requêtes HTTP. Depuis le navigateur, l'outil est <code>fetch()</code>, basé sur les promesses.</p>
<h2>Requête GET</h2>
${code('javascript', `async function chargerMeteo(ville) {
  const reponse = await fetch(\`https://api.exemple.com/meteo?ville=\${encodeURIComponent(ville)}\`);
  if (!reponse.ok) {                            // fetch ne rejette PAS pour un 404 ou un 500 !
    throw new Error(\`Erreur HTTP \${reponse.status}\`);
  }
  const donnees = await reponse.json();         // deuxième await : lecture du corps
  return donnees;
}`)}
<p>Deux pièges : <code>fetch</code> ne rejette que pour une erreur <em>réseau</em> (pas pour un statut 4xx/5xx), et la lecture du corps (<code>.json()</code>, <code>.text()</code>) est elle-même asynchrone.</p>
<h2>Envoyer des données : POST</h2>
${code('javascript', `const reponse = await fetch("/api/taches", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ titre: "Lire", fait: false }),
});
const creee = await reponse.json();`)}
<p>Autres méthodes : <code>PUT</code> (remplacer), <code>PATCH</code> (modifier partiellement), <code>DELETE</code>. Les codes de statut : 200 OK, 201 créé, 204 sans contenu, 400 requête invalide, 401 non authentifié, 403 interdit, 404 introuvable, 429 trop de requêtes, 500 erreur serveur.</p>
<h2>Robustesse</h2>
${code('javascript', `async function fetchJSON(url, options = {}, { timeout = 8000, essais = 2 } = {}) {
  for (let tentative = 0; tentative <= essais; tentative++) {
    const controleur = new AbortController();
    const timer = setTimeout(() => controleur.abort(), timeout);
    try {
      const r = await fetch(url, { ...options, signal: controleur.signal });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return await r.json();
    } catch (err) {
      if (tentative === essais) throw err;
      await new Promise(res => setTimeout(res, 300 * (tentative + 1)));   // attente croissante
    } finally {
      clearTimeout(timer);
    }
  }
}`)}
<h2>CORS</h2>
<p>Par sécurité, un navigateur refuse qu'une page de <code>monsite.fr</code> lise la réponse d'une API sur <code>autre.com</code> sauf si cette API l'autorise via l'en-tête <code>Access-Control-Allow-Origin</code>. L'erreur « CORS » vient donc du serveur distant, pas de ton code. Solutions : utiliser une API qui l'autorise, ou passer par ton propre serveur (proxy).</p>
<h2>Afficher les données</h2>
${code('javascript', `async function afficherArticles() {
  const zone = document.getElementById("articles");
  zone.textContent = "Chargement…";
  try {
    const articles = await fetchJSON("/api/articles");
    zone.replaceChildren(...articles.map(a => {
      const li = document.createElement("li");
      li.textContent = a.titre;
      return li;
    }));
  } catch (err) {
    zone.textContent = "Impossible de charger les articles.";
  }
}`)}
<p>Trois états à prévoir pour toute interface réseau : <em>chargement</em>, <em>succès</em>, <em>erreur</em>. Et un quatrième souvent oublié : <em>vide</em> (aucun résultat).</p>
<div class="callout info"><b>Dans l'éditeur Lumio</b>Le bac à sable n'a pas accès au réseau. L'exercice utilise un faux <code>fetch</code> qui simule un serveur, ce qui est aussi la technique standard pour tester du code réseau.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Client d\'API robuste',
            enonce: `<p>Un faux serveur est fourni : <code>fetch("/api/users/1")</code> renvoie un utilisateur, <code>/api/users/99</code> renvoie un statut 404, <code>/api/panne</code> rejette (erreur réseau). Écris <code>async function getJSON(url)</code> qui renvoie les données JSON ou lève <code>Error("HTTP 404")</code> pour un statut d'erreur, puis <code>async function chargerNoms(ids)</code> qui renvoie les noms des utilisateurs existants (ignore ceux qui échouent) et enfin affiche le résultat de <code>chargerNoms([1, 99, 2])</code> avec <code>console.log</code>.</p>`,
            depart: `// --- faux serveur (ne pas modifier) ---
const BASE = { 1: { id: 1, nom: "Ana" }, 2: { id: 2, nom: "Bob" } };
globalThis.fetch = (url) => new Promise((resolve, reject) => setTimeout(() => {
  if (url === "/api/panne") return reject(new TypeError("Failed to fetch"));
  const m = url.match(/^\\/api\\/users\\/(\\d+)$/);
  const u = m && BASE[m[1]];
  resolve({ ok: !!u, status: u ? 200 : 404, json: async () => u ?? { erreur: "introuvable" } });
}, 20));
// --- fin du faux serveur ---

async function getJSON(url) {
  // ...
}

async function chargerNoms(ids) {
  // ...
}

async function principal() {
  console.log(await chargerNoms([1, 99, 2]));
}
principal();
`,
            solution: `// --- faux serveur (ne pas modifier) ---
const BASE = { 1: { id: 1, nom: "Ana" }, 2: { id: 2, nom: "Bob" } };
globalThis.fetch = (url) => new Promise((resolve, reject) => setTimeout(() => {
  if (url === "/api/panne") return reject(new TypeError("Failed to fetch"));
  const m = url.match(/^\\/api\\/users\\/(\\d+)$/);
  const u = m && BASE[m[1]];
  resolve({ ok: !!u, status: u ? 200 : 404, json: async () => u ?? { erreur: "introuvable" } });
}, 20));
// --- fin du faux serveur ---

async function getJSON(url) {
  const reponse = await fetch(url);
  if (!reponse.ok) throw new Error("HTTP " + reponse.status);
  return await reponse.json();
}

async function chargerNoms(ids) {
  const resultats = await Promise.allSettled(ids.map(id => getJSON("/api/users/" + id)));
  return resultats.filter(r => r.status === "fulfilled").map(r => r.value.nom);
}

async function principal() {
  console.log(await chargerNoms([1, 99, 2]));
}
principal();`,
            tests: [sansErreur(), sortieContient('["Ana","Bob"]'), { nom: 'getJSON renvoie les données pour un statut 200', expr: 'getJSON("/api/users/1").then(d => d.nom)', verif: () => true }, codeRegex(/reponse\.ok|r\.ok|res\.ok|response\.ok|\.ok\b/, 'Le statut HTTP est vérifié avec .ok', 'fetch ne rejette pas sur un 404 : teste reponse.ok et lève une Error.'), codeRegex(/throw new Error\(\s*["'`]HTTP/, 'Erreur « HTTP 404 » levée', 'Lève new Error("HTTP " + reponse.status).'), codeRegex(/await\s+\w+\.json\(\)|\.json\(\)\.then|return\s+\w+\.json\(\)/, 'Le corps JSON est lu', 'Lis le corps avec await reponse.json().')]
          },
          quiz: [
            { q: 'Que fait <code>fetch</code> si le serveur répond 500 ?', options: ['La promesse est rejetée', 'La promesse est résolue avec ok = false', 'Une exception est levée immédiatement'], bonne: 1, explication: 'Seules les erreurs réseau rejettent. Vérifie toujours reponse.ok.' },
            { q: 'D\'où vient une erreur CORS ?', options: ['D\'une faute dans l\'URL', 'Du serveur distant qui n\'autorise pas ton origine', 'D\'un JSON mal formé'], bonne: 1, explication: 'C\'est une politique de sécurité du navigateur appliquée selon les en-têtes du serveur.' },
            { q: 'Pourquoi <code>await reponse.json()</code> ?', options: ['Parce que la lecture du corps est asynchrone', 'Pour convertir en chaîne', 'Ce n\'est pas nécessaire'], bonne: 0, explication: 'Le corps peut arriver en plusieurs morceaux ; sa lecture renvoie une promesse.' }
          ]
        }
      ]
    },
    {
      titre: 'Qualité et projet final', niveau: 'Avancé', description: 'Erreurs, tests et outillage, puis une application de notes complète avec recherche, filtres et persistance.',
      lecons: [
        {
          titre: 'Erreurs, débogage et tests',
          theorie: `<p>Un bon développeur n'écrit pas moins de bugs : il les trouve plus vite. Trois outils : la gestion d'erreurs, le débogueur et les tests automatisés.</p>
<h2>Gérer les erreurs</h2>
${code('javascript', `class ErreurValidation extends Error {
  constructor(message, champ) {
    super(message);
    this.name = "ErreurValidation";
    this.champ = champ;
  }
}

function valider(utilisateur) {
  if (!utilisateur.email?.includes("@")) throw new ErreurValidation("email invalide", "email");
}

try {
  valider({ email: "x" });
} catch (err) {
  if (err instanceof ErreurValidation) console.warn(err.champ, err.message);
  else throw err;                       // on relance ce qu'on ne sait pas gérer
} finally {
  // nettoyage
}`)}
<p>Erreurs natives : <code>TypeError</code> (<code>undefined is not a function</code>, <code>cannot read properties of undefined</code>), <code>ReferenceError</code> (variable inexistante), <code>RangeError</code>, <code>SyntaxError</code> (JSON invalide). Lis le message et la <em>pile d'appels</em> : la première ligne de ton code dans la pile est le coupable probable.</p>
<h2>Déboguer</h2>
<ul><li><code>console.log({ variable })</code> : les accolades affichent le nom et la valeur.</li><li><code>console.table(tableau)</code>, <code>console.group()</code>, <code>console.time("x") / timeEnd("x")</code>.</li><li><code>debugger;</code> met en pause dans les DevTools (F12 → Sources) : on inspecte les variables, on avance pas à pas.</li><li>Onglet Réseau pour les requêtes, Éléments pour le DOM, Application pour le stockage.</li></ul>
<h2>Tests automatisés</h2>
<p>Un test appelle une fonction et vérifie le résultat. Le framework le plus courant est <strong>Vitest</strong> (ou Jest) : <code>npm install -D vitest</code>, fichiers <code>*.test.js</code>, commande <code>npx vitest</code>.</p>
${code('javascript', `// panier.test.js
import { describe, it, expect } from "vitest";
import { total } from "./panier.js";

describe("total", () => {
  it("additionne les prix", () => {
    expect(total([{ prix: 2 }, { prix: 3 }])).toBe(5);
  });
  it("renvoie 0 pour un panier vide", () => {
    expect(total([])).toBe(0);
  });
  it("rejette une valeur négative", () => {
    expect(() => total([{ prix: -1 }])).toThrow(RangeError);
  });
});`)}
<p>Sans aucun outil, Node.js intègre <code>node:test</code> et <code>node:assert</code>. Et dans un script simple, une fonction <code>assert</code> maison suffit pour commencer :</p>
${code('javascript', `function assertEgal(obtenu, attendu, nom) {
  const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
  console.log((ok ? "✓ " : "✗ ") + nom + (ok ? "" : \` : obtenu \${JSON.stringify(obtenu)}\`));
  return ok;
}`)}
<h2>Quoi tester ?</h2>
<p>La logique métier (calculs, validations, transformations) en priorité : c'est là que sont les bugs coûteux. Les cas limites : vide, zéro, négatif, très grand, caractères spéciaux, null. Un bug corrigé = un test ajouté pour qu'il ne revienne jamais.</p>
<div class="callout info"><b>Outillage pro</b><strong>ESLint</strong> détecte les erreurs statiquement (variable inutilisée, <code>==</code>), <strong>Prettier</strong> formate automatiquement, <strong>TypeScript</strong> ajoute des types vérifiés à la compilation. Un projet sérieux utilise les trois.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Validation typée et suite de tests',
            enonce: `<p>Écris la classe <code>ErreurValidation extends Error</code> (propriété <code>champ</code>, <code>name</code> = « ErreurValidation ») et la fonction <code>validerCommande(c)</code> qui lève une ErreurValidation si <code>c.email</code> ne contient pas « @ » (champ « email »), si <code>c.quantite</code> n'est pas un entier ≥ 1 (champ « quantite »), et qui renvoie <code>true</code> sinon. Écris ensuite une mini-fonction <code>test(nom, fn)</code> qui exécute <code>fn</code>, affiche <code>✓ nom</code> ou <code>✗ nom</code> selon qu'elle lève ou non, et lance au moins 3 tests (dont un qui vérifie qu'une erreur est bien levée avec le bon champ).</p>`,
            depart: `class ErreurValidation extends Error {
  // ...
}

function validerCommande(c) {
  // ...
}

function test(nom, fn) {
  // ...
}

// tests
`,
            solution: `class ErreurValidation extends Error {
  constructor(message, champ) {
    super(message);
    this.name = "ErreurValidation";
    this.champ = champ;
  }
}

function validerCommande(c) {
  if (typeof c.email !== "string" || !c.email.includes("@")) {
    throw new ErreurValidation("email invalide", "email");
  }
  if (!Number.isInteger(c.quantite) || c.quantite < 1) {
    throw new ErreurValidation("quantité invalide", "quantite");
  }
  return true;
}

function test(nom, fn) {
  try {
    fn();
    console.log("✓ " + nom);
  } catch (err) {
    console.log("✗ " + nom + " : " + err.message);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || "assertion fausse");
}

test("commande valide", () => assert(validerCommande({ email: "a@b.fr", quantite: 2 }) === true));
test("email sans @ refusé", () => {
  let erreur = null;
  try { validerCommande({ email: "ab.fr", quantite: 1 }); } catch (e) { erreur = e; }
  assert(erreur instanceof ErreurValidation && erreur.champ === "email", "mauvaise erreur");
});
test("quantité 0 refusée", () => {
  let erreur = null;
  try { validerCommande({ email: "a@b.fr", quantite: 0 }); } catch (e) { erreur = e; }
  assert(erreur && erreur.champ === "quantite", "mauvaise erreur");
});`,
            tests: [sansErreur(), expr('validerCommande({ email: "a@b.fr", quantite: 1 })', true), leveJS('validerCommande({ email: "x", quantite: 1 })', 'ErreurValidation'), expr('(() => { try { validerCommande({ email: "a@b.fr", quantite: 1.5 }); } catch (e) { return e.champ; } })()', 'quantite', 'Une quantité non entière doit lever une ErreurValidation avec champ = "quantite".'), expr('(() => { try { validerCommande({ email: "x", quantite: 1 }); } catch (e) { return [e.name, e.champ, e instanceof Error]; } })()', ['ErreurValidation', 'email', true]), sortieRegex(/(✓ .*\n?){3,}/, 'Au moins trois tests affichent ✓', 'Lance au moins trois tests réussis avec test(nom, fn).'), sortieRegex(/^(?!.*✗)/s, 'Aucun test en échec', 'Un test affiche ✗ : corrige-le.')]
          },
          quiz: [
            { q: 'Que signifie « cannot read properties of undefined (reading \'nom\') » ?', options: ['La propriété nom n\'existe pas', 'On accède à .nom sur une valeur undefined', 'nom est réservé'], bonne: 1, explication: 'L\'objet avant .nom est undefined : vérifie la chaîne d\'accès (ou utilise ?.).' },
            { q: 'Que fait <code>debugger;</code> ?', options: ['Affiche la pile', 'Met le programme en pause si les DevTools sont ouverts', 'Corrige l\'erreur'], bonne: 1, explication: 'C\'est un point d\'arrêt dans le code.' },
            { q: 'Quel code tester en priorité ?', options: ['Les styles CSS', 'La logique métier et ses cas limites', 'Les console.log'], bonne: 1, explication: 'Calculs, validations et transformations concentrent les bugs coûteux.' }
          ]
        },
        {
          titre: 'Projet : application de notes (1/3) — le modèle',
          theorie: `<p>Projet final : une application de <strong>prise de notes</strong> dans le navigateur, avec création, édition, recherche, étiquettes, tri et sauvegarde locale. On la construit en trois temps : le modèle (logique pure), le rendu, puis les interactions et la persistance.</p>
<h2>Pourquoi commencer par le modèle</h2>
<p>Le modèle ne connaît ni le DOM ni localStorage. Il manipule un <em>état</em> (<code>{ notes: [], filtre: "", tri: "date" }</code>) et expose des fonctions pures qui renvoient un <em>nouvel</em> état. Avantages : testable dans ce bac à sable, réutilisable dans une autre interface, et aucun bug d'affichage mélangé aux bugs de logique.</p>
${code('javascript', `export function creerEtat() {
  return { notes: [], recherche: "", etiquette: null, tri: "modif" };
}

export function creerNote(etat, { titre, contenu = "", etiquettes = [] }) {
  if (!titre.trim()) throw new Error("titre requis");
  const note = {
    id: crypto.randomUUID(),           // identifiant unique fourni par le navigateur
    titre: titre.trim(), contenu, etiquettes,
    creeLe: Date.now(), modifieLe: Date.now(), epinglee: false,
  };
  return { ...etat, notes: [note, ...etat.notes] };        // nouvel état, note en tête
}

export function modifierNote(etat, id, modifications) {
  return {
    ...etat,
    notes: etat.notes.map(n => n.id === id ? { ...n, ...modifications, modifieLe: Date.now() } : n),
  };
}

export function supprimerNote(etat, id) {
  return { ...etat, notes: etat.notes.filter(n => n.id !== id) };
}`)}
<p>Chaque fonction reçoit l'état et renvoie un nouvel état : on ne mute jamais. Avec ce principe, « annuler » devient trivial (garder les états précédents dans une pile).</p>
<h2>Sélection : la vue dérivée</h2>
<p>Ce que l'écran affiche n'est pas l'état brut mais une <em>dérivation</em> : filtrée, triée.</p>
${code('javascript', `export function notesVisibles(etat) {
  const q = etat.recherche.trim().toLowerCase();
  return etat.notes
    .filter(n => !etat.etiquette || n.etiquettes.includes(etat.etiquette))
    .filter(n => !q || n.titre.toLowerCase().includes(q) || n.contenu.toLowerCase().includes(q))
    .sort((a, b) => {
      if (a.epinglee !== b.epinglee) return a.epinglee ? -1 : 1;      // épinglées d'abord
      if (etat.tri === "titre") return a.titre.localeCompare(b.titre, "fr");
      return b.modifieLe - a.modifieLe;                                 // plus récentes d'abord
    });
}

export function toutesEtiquettes(etat) {
  return [...new Set(etat.notes.flatMap(n => n.etiquettes))].sort();
}`)}
<p><code>localeCompare(..., "fr")</code> trie correctement les accents ; <code>Set</code> + <code>flatMap</code> dédoublonne les étiquettes.</p>
<h2>Tester le modèle</h2>
${code('javascript', `let e = creerEtat();
e = creerNote(e, { titre: "Courses", etiquettes: ["perso"] });
e = creerNote(e, { titre: "Réunion", etiquettes: ["travail"] });
console.assert(notesVisibles({ ...e, etiquette: "perso" }).length === 1);
console.assert(toutesEtiquettes(e).join() === "perso,travail");`)}
<div class="callout info"><b>Note sur l'identifiant</b><code>crypto.randomUUID()</code> est disponible dans les navigateurs modernes et dans le bac à sable. À défaut : <code>Date.now() + Math.random().toString(36).slice(2)</code>.</div>`,
          exercice: {
            type: 'code', langage: 'javascript', titre: 'Le modèle de l\'application',
            enonce: `<p>Implémente <code>creerEtat()</code>, <code>creerNote(etat, { titre, contenu, etiquettes })</code> (titre vide → <code>Error</code>), <code>modifierNote(etat, id, modifs)</code>, <code>supprimerNote(etat, id)</code>, <code>basculerEpingle(etat, id)</code>, <code>notesVisibles(etat)</code> (filtre étiquette + recherche insensible à la casse dans titre et contenu, épinglées d'abord, puis tri « titre » alphabétique ou « modif » décroissant) et <code>toutesEtiquettes(etat)</code> (triées, sans doublon). Aucune fonction ne doit modifier l'état reçu.</p>`,
            depart: `function creerEtat() {
  return { notes: [], recherche: "", etiquette: null, tri: "modif" };
}

function creerNote(etat, { titre, contenu = "", etiquettes = [] }) {
  // ...
}

function modifierNote(etat, id, modifs) {
  // ...
}

function supprimerNote(etat, id) {
  // ...
}

function basculerEpingle(etat, id) {
  // ...
}

function notesVisibles(etat) {
  // ...
}

function toutesEtiquettes(etat) {
  // ...
}

let e = creerEtat();
e = creerNote(e, { titre: "Courses", contenu: "pain, lait", etiquettes: ["perso"] });
e = creerNote(e, { titre: "Réunion", contenu: "ordre du jour", etiquettes: ["travail", "urgent"] });
console.log(notesVisibles({ ...e, recherche: "LAIT" }).map(n => n.titre));
`,
            solution: `function creerEtat() {
  return { notes: [], recherche: "", etiquette: null, tri: "modif" };
}

function creerNote(etat, { titre, contenu = "", etiquettes = [] }) {
  if (!titre || !titre.trim()) throw new Error("titre requis");
  const maintenant = Date.now();
  const note = {
    id: crypto.randomUUID(), titre: titre.trim(), contenu, etiquettes: [...etiquettes],
    creeLe: maintenant, modifieLe: maintenant, epinglee: false,
  };
  return { ...etat, notes: [note, ...etat.notes] };
}

function modifierNote(etat, id, modifs) {
  return { ...etat, notes: etat.notes.map(n => n.id === id ? { ...n, ...modifs, modifieLe: Date.now() } : n) };
}

function supprimerNote(etat, id) {
  return { ...etat, notes: etat.notes.filter(n => n.id !== id) };
}

function basculerEpingle(etat, id) {
  return { ...etat, notes: etat.notes.map(n => n.id === id ? { ...n, epinglee: !n.epinglee } : n) };
}

function notesVisibles(etat) {
  const q = etat.recherche.trim().toLowerCase();
  return etat.notes
    .filter(n => !etat.etiquette || n.etiquettes.includes(etat.etiquette))
    .filter(n => !q || n.titre.toLowerCase().includes(q) || n.contenu.toLowerCase().includes(q))
    .sort((a, b) => {
      if (a.epinglee !== b.epinglee) return a.epinglee ? -1 : 1;
      if (etat.tri === "titre") return a.titre.localeCompare(b.titre, "fr");
      return b.modifieLe - a.modifieLe;
    });
}

function toutesEtiquettes(etat) {
  return [...new Set(etat.notes.flatMap(n => n.etiquettes))].sort();
}

let e = creerEtat();
e = creerNote(e, { titre: "Courses", contenu: "pain, lait", etiquettes: ["perso"] });
e = creerNote(e, { titre: "Réunion", contenu: "ordre du jour", etiquettes: ["travail", "urgent"] });
console.log(notesVisibles({ ...e, recherche: "LAIT" }).map(n => n.titre));`,
            tests: [sansErreur(), sortieContient('["Courses"]'), expr('e.notes.length', 2), expr('toutesEtiquettes(e)', ['perso', 'travail', 'urgent']), expr('notesVisibles({ ...e, etiquette: "travail" }).map(n => n.titre)', ['Réunion']), expr('notesVisibles({ ...e, tri: "titre" }).map(n => n.titre)', ['Courses', 'Réunion']), expr('(() => { const id = e.notes[1].id; const e2 = basculerEpingle(e, id); return [notesVisibles(e2)[0].titre, e.notes[1].epinglee]; })()', ['Courses', false], 'Épingler place la note en tête et ne modifie pas l\'état d\'origine.'), expr('(() => { const e2 = supprimerNote(e, e.notes[0].id); return [e2.notes.length, e.notes.length]; })()', [1, 2]), expr('(() => { const e2 = modifierNote(e, e.notes[0].id, { titre: "X" }); return [e2.notes[0].titre, e.notes[0].titre]; })()', ['X', 'Réunion']), leveJS('creerNote(e, { titre: "  " })', 'Error')]
          },
          quiz: [
            { q: 'Pourquoi les fonctions du modèle renvoient-elles un nouvel état plutôt que de modifier l\'existant ?', options: ['C\'est plus rapide', 'Prévisibilité, tests faciles, annulation possible', 'JavaScript l\'impose'], bonne: 1, explication: 'L\'immutabilité évite les effets de bord et permet de comparer ou conserver des états.' },
            { q: 'Qu\'est-ce qu\'une « vue dérivée » ?', options: ['Une copie de l\'état', 'Le résultat d\'un calcul (filtre, tri) sur l\'état, non stocké', 'Un composant graphique'], bonne: 1, explication: 'On ne stocke pas la liste filtrée : on la recalcule à partir de l\'état et des critères.' },
            { q: 'À quoi sert <code>localeCompare(b, "fr")</code> ?', options: ['À comparer des nombres', 'À trier des chaînes en respectant les accents et la langue', 'À traduire'], bonne: 1, explication: 'Sans lui, "é" serait classé après "z".' }
          ]
        },
        {
          titre: 'Projet : application de notes (2/3) — le rendu',
          theorie: `<p>Le modèle est prêt. Maintenant, l'affichage. Principe : une fonction <code>rendre(etat)</code> <strong>reconstruit</strong> l'interface à partir de l'état, à chaque changement. Pas de mise à jour chirurgicale du DOM à la main : moins de code, zéro incohérence.</p>
<h2>Structure HTML</h2>
${code('html', `<header>
  <input id="recherche" type="search" placeholder="Rechercher…">
  <select id="tri"><option value="modif">Récentes</option><option value="titre">Titre</option></select>
  <button id="nouvelle">+ Note</button>
</header>
<nav id="etiquettes"></nav>
<main id="liste"></main>
<p id="vide" hidden>Aucune note.</p>`)}
<h2>La fonction de rendu</h2>
${code('javascript', `function rendre(etat) {
  const liste = document.getElementById("liste");
  const notes = notesVisibles(etat);
  document.getElementById("vide").hidden = notes.length > 0;

  liste.replaceChildren(...notes.map(n => carteNote(n)));   // remplace tout d'un coup

  const nav = document.getElementById("etiquettes");
  nav.replaceChildren(...toutesEtiquettes(etat).map(tag => {
    const b = document.createElement("button");
    b.textContent = "#" + tag;
    b.classList.toggle("actif", etat.etiquette === tag);
    b.dataset.tag = tag;
    return b;
  }));
}

function carteNote(n) {
  const article = document.createElement("article");
  article.className = "note" + (n.epinglee ? " epinglee" : "");
  article.dataset.id = n.id;                      // l'id voyage avec l'élément

  const h = document.createElement("h2");
  h.textContent = n.titre;
  const p = document.createElement("p");
  p.textContent = n.contenu;
  const meta = document.createElement("small");
  meta.textContent = new Date(n.modifieLe).toLocaleString("fr-FR") + "  " + n.etiquettes.map(t => "#" + t).join(" ");

  const actions = document.createElement("div");
  actions.innerHTML = \`<button data-action="epingler">📌</button>
    <button data-action="modifier">✏️</button>
    <button data-action="supprimer">🗑</button>\`;   // HTML statique sans donnée utilisateur : acceptable
  article.append(h, p, meta, actions);
  return article;
}`)}
<p><code>replaceChildren</code> vide et remplit en une opération. Les données utilisateur (titre, contenu) passent par <code>textContent</code> ; seul le squelette fixe des boutons utilise <code>innerHTML</code>.</p>
<h2>Les attributs data-*</h2>
<p><code>data-id</code> sur la carte et <code>data-action</code> sur les boutons permettent à un <em>seul</em> écouteur (délégation) de savoir quoi faire sur quelle note : <code>e.target.closest("[data-action]")</code> puis <code>e.target.closest(".note").dataset.id</code>.</p>
<h2>Performance</h2>
<p>Reconstruire 50 cartes à chaque frappe est instantané. À partir de plusieurs milliers d'éléments, on passerait à une mise à jour différentielle, ce que font les frameworks (React, Vue, Svelte) automatiquement. Tu comprends maintenant exactement le problème qu'ils résolvent.</p>
<h2>Échapper, toujours</h2>
<p>Si un jour tu génères du HTML par concaténation (templates), échappe les données : <code>s.replace(/[&amp;&lt;&gt;"']/g, c =&gt; ({ "&amp;": "&amp;amp;", "&lt;": "&amp;lt;", "&gt;": "&amp;gt;", '"': "&amp;quot;", "'": "&amp;#39;" })[c])</code>. Une note intitulée <code>&lt;img src=x onerror=alert(1)&gt;</code> ne doit jamais exécuter de script.</p>
<div class="callout info"><b>Accessibilité du rendu</b>Un <code>&lt;article&gt;</code> par note avec un vrai titre <code>&lt;h2&gt;</code>, des boutons avec <code>aria-label</code> quand ils n'ont qu'une icône, et <code>aria-pressed</code> sur le filtre actif.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Rendu des notes',
            enonce: `<p>Le modèle est fourni dans la page. Écris <code>carteNote(n)</code> (un <code>&lt;article class="note"&gt;</code> avec <code>data-id</code>, un <code>&lt;h2&gt;</code> titre, un <code>&lt;p&gt;</code> contenu via <code>textContent</code>, la classe <code>epinglee</code> si besoin, et trois boutons <code>data-action</code> = <code>epingler</code>, <code>modifier</code>, <code>supprimer</code>) et <code>rendre(etat)</code> qui remplit <code>#liste</code>, gère <code>#vide</code>, et crée un bouton par étiquette dans <code>#etiquettes</code> (texte <code>#tag</code>, classe <code>actif</code> si sélectionnée).</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.note{border:1px solid #ccc;padding:8px;margin:6px 0}.epinglee{border-color:orange}.actif{font-weight:bold}</style></head>
<body>
  <nav id="etiquettes"></nav>
  <main id="liste"></main>
  <p id="vide" hidden>Aucune note.</p>
  <script>
    // --- modèle (fourni) ---
    const notesVisibles = etat => etat.notes
      .filter(n => !etat.etiquette || n.etiquettes.includes(etat.etiquette))
      .sort((a, b) => (a.epinglee === b.epinglee ? b.modifieLe - a.modifieLe : a.epinglee ? -1 : 1));
    const toutesEtiquettes = etat => [...new Set(etat.notes.flatMap(n => n.etiquettes))].sort();
    let etat = { etiquette: null, notes: [
      { id: "a1", titre: "Courses", contenu: "pain <b>lait</b>", etiquettes: ["perso"], epinglee: false, modifieLe: 2 },
      { id: "b2", titre: "Réunion", contenu: "ordre du jour", etiquettes: ["travail"], epinglee: true, modifieLe: 1 },
    ] };
    // --- vue ---
    function carteNote(n) {
      // ...
    }
    function rendre(etat) {
      // ...
    }
    rendre(etat);
  </script>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.note{border:1px solid #ccc;padding:8px;margin:6px 0}.epinglee{border-color:orange}.actif{font-weight:bold}</style></head>
<body>
  <nav id="etiquettes"></nav>
  <main id="liste"></main>
  <p id="vide" hidden>Aucune note.</p>
  <script>
    // --- modèle (fourni) ---
    const notesVisibles = etat => etat.notes
      .filter(n => !etat.etiquette || n.etiquettes.includes(etat.etiquette))
      .sort((a, b) => (a.epinglee === b.epinglee ? b.modifieLe - a.modifieLe : a.epinglee ? -1 : 1));
    const toutesEtiquettes = etat => [...new Set(etat.notes.flatMap(n => n.etiquettes))].sort();
    let etat = { etiquette: null, notes: [
      { id: "a1", titre: "Courses", contenu: "pain <b>lait</b>", etiquettes: ["perso"], epinglee: false, modifieLe: 2 },
      { id: "b2", titre: "Réunion", contenu: "ordre du jour", etiquettes: ["travail"], epinglee: true, modifieLe: 1 },
    ] };
    // --- vue ---
    function carteNote(n) {
      const article = document.createElement("article");
      article.className = "note" + (n.epinglee ? " epinglee" : "");
      article.dataset.id = n.id;
      const h = document.createElement("h2");
      h.textContent = n.titre;
      const p = document.createElement("p");
      p.textContent = n.contenu;
      const actions = document.createElement("div");
      for (const [action, label] of [["epingler", "Épingler"], ["modifier", "Modifier"], ["supprimer", "Supprimer"]]) {
        const b = document.createElement("button");
        b.dataset.action = action;
        b.textContent = label;
        actions.append(b);
      }
      article.append(h, p, actions);
      return article;
    }
    function rendre(etat) {
      const notes = notesVisibles(etat);
      document.getElementById("liste").replaceChildren(...notes.map(carteNote));
      document.getElementById("vide").hidden = notes.length > 0;
      document.getElementById("etiquettes").replaceChildren(...toutesEtiquettes(etat).map(tag => {
        const b = document.createElement("button");
        b.textContent = "#" + tag;
        b.dataset.tag = tag;
        b.classList.toggle("actif", etat.etiquette === tag);
        return b;
      }));
    }
    rendre(etat);
  </script>
</body>
</html>`,
            tests: [
              dom('Deux articles .note rendus, épinglée en premier', d => { const a = d.querySelectorAll('#liste article.note'); return a.length === 2 && a[0].dataset.id === 'b2' && a[0].classList.contains('epinglee'); }),
              dom('Titre dans un h2 et contenu non interprété (pas de <b>)', d => { const a = d.querySelector('article[data-id="a1"]'); return a && a.querySelector('h2').textContent === 'Courses' && !a.querySelector('b') && a.textContent.includes('<b>lait</b>'); }),
              dom('Trois boutons data-action par note', d => { const a = d.querySelector('article[data-id="a1"]'); const acts = [...a.querySelectorAll('[data-action]')].map(b => b.dataset.action); return ['epingler', 'modifier', 'supprimer'].every(x => acts.includes(x)); }),
              dom('Boutons d\'étiquettes #perso et #travail', d => { const t = [...d.querySelectorAll('#etiquettes button')].map(b => b.textContent.trim()); return t.join() === '#perso,#travail'; }),
              dom('Filtre actif et message vide', d => { const notes = [{ id: 'a1', titre: 'Courses', contenu: 'x', etiquettes: ['perso'], epinglee: false, modifieLe: 2 }, { id: 'b2', titre: 'Réunion', contenu: 'y', etiquettes: ['travail'], epinglee: true, modifieLe: 1 }]; d.defaultView.rendre({ etiquette: 'travail', notes }); const ok1 = d.querySelectorAll('#liste article').length === 1 && d.querySelector('#etiquettes button.actif')?.textContent.trim() === '#travail'; d.defaultView.rendre({ etiquette: null, notes: [] }); const ok2 = !d.getElementById('vide').hidden && d.querySelectorAll('#liste article').length === 0; return ok1 && ok2; })
            ]
          },
          quiz: [
            { q: 'Quel est l\'avantage de « tout re-rendre » à chaque changement ?', options: ['La performance maximale', 'Un code simple et un affichage toujours cohérent avec l\'état', 'Moins de mémoire'], bonne: 1, explication: 'À petite échelle, la simplicité l\'emporte ; les frameworks optimisent ce schéma pour les grandes listes.' },
            { q: 'Pourquoi mettre <code>data-id</code> sur la carte ?', options: ['Pour le style', 'Pour que l\'écouteur délégué retrouve la note concernée', 'C\'est obligatoire pour article'], bonne: 1, explication: 'closest(".note").dataset.id relie l\'élément cliqué à la donnée.' },
            { q: 'Quelle méthode remplace tous les enfants d\'un élément en une fois ?', options: ['innerHTML = ""', 'replaceChildren', 'removeChild'], bonne: 1, explication: 'replaceChildren(...noeuds) vide puis insère, sans passer par du HTML.' }
          ]
        },
        {
          titre: 'Projet : application de notes (3/3) — interactions et persistance',
          theorie: `<p>Dernière étape : brancher les événements sur le modèle, sauvegarder, et polir. Le cœur du câblage tient dans une seule fonction : <code>dispatch</code>.</p>
<h2>Un point d'entrée unique pour les changements</h2>
${code('javascript', `let etat = charger() ?? creerEtat();

function dispatch(transformation) {
  etat = transformation(etat);        // nouvel état via le modèle
  sauvegarder(etat);
  rendre(etat);
}

function sauvegarder(etat) {
  try { localStorage.setItem("notes.v1", JSON.stringify({ notes: etat.notes })); } catch {}
}
function charger() {
  try {
    const brut = localStorage.getItem("notes.v1");
    return brut ? { ...creerEtat(), ...JSON.parse(brut) } : null;
  } catch { return null; }
}`)}
<p>On ne persiste que les <em>données</em> (les notes), pas l'état d'interface (recherche en cours). La clé versionnée <code>notes.v1</code> permettra une migration si le format change.</p>
<h2>Les écouteurs</h2>
${code('javascript', `document.getElementById("recherche").addEventListener("input", e => {
  dispatch(s => ({ ...s, recherche: e.target.value }));
});
document.getElementById("tri").addEventListener("change", e => dispatch(s => ({ ...s, tri: e.target.value })));

document.getElementById("nouvelle").addEventListener("click", () => {
  const titre = prompt("Titre de la note ?");
  if (titre) dispatch(s => creerNote(s, { titre }));
});

document.getElementById("etiquettes").addEventListener("click", e => {
  const b = e.target.closest("[data-tag]");
  if (b) dispatch(s => ({ ...s, etiquette: s.etiquette === b.dataset.tag ? null : b.dataset.tag }));
});

document.getElementById("liste").addEventListener("click", e => {
  const bouton = e.target.closest("[data-action]");
  if (!bouton) return;
  const id = e.target.closest(".note").dataset.id;
  const actions = {
    epingler: s => basculerEpingle(s, id),
    supprimer: s => confirm("Supprimer ?") ? supprimerNote(s, id) : s,
    modifier: s => {
      const note = s.notes.find(n => n.id === id);
      const contenu = prompt("Contenu :", note.contenu);
      return contenu === null ? s : modifierNote(s, id, { contenu });
    },
  };
  dispatch(actions[bouton.dataset.action]);
});
rendre(etat);`)}
<p>Chaque écouteur se contente de traduire un événement en transformation d'état. Le tableau <code>actions</code> remplace un <code>switch</code> et s'étend facilement.</p>
<h2>Améliorations typiques</h2>
<ul><li><strong>Édition en place</strong> : remplacer <code>prompt</code> par un <code>&lt;textarea&gt;</code> dans la carte, sauvegarde sur <code>blur</code> ou <code>Ctrl+Entrée</code>.</li>
<li><strong>Debounce</strong> de la recherche : attendre 150 ms après la dernière frappe avant de rendre, utile sur de grandes listes.</li>
<li><strong>Annuler</strong> : empiler les états précédents dans <code>dispatch</code> et dépiler sur <code>Ctrl+Z</code>.</li>
<li><strong>Export / import JSON</strong> : un <code>Blob</code> + lien de téléchargement, un <code>&lt;input type="file"&gt;</code> + <code>file.text()</code>.</li>
<li><strong>Markdown</strong> : afficher le contenu formaté avec une bibliothèque qui <em>assainit</em> le HTML (DOMPurify).</li>
<li><strong>Synchronisation</strong> : remplacer <code>sauvegarder</code> par un appel <code>fetch</code> vers une API : le reste du code ne change pas.</li></ul>
<h2>Ce que tu as appris</h2>
<p>Une architecture <em>état → transformation → rendu</em> avec un modèle pur, une vue qui reconstruit, des écouteurs minces et une persistance isolée. C'est, en miniature, le schéma de Redux, de Vue ou de SwiftUI. Les frameworks t'apporteront l'outillage ; les principes, tu les as déjà.</p>
<div class="callout ok"><b>Projet terminé</b>Tu peux déployer cette application telle quelle (un fichier HTML) sur Netlify ou GitHub Pages. Ajoute-la à ton portfolio.</div>`,
          exercice: {
            type: 'code', langage: 'html', titre: 'Câblage complet',
            enonce: `<p>Le modèle et la vue sont fournis. Écris <code>sauvegarder</code>, <code>charger</code> (clé <code>notes.v1</code>, protégés par try/catch), <code>dispatch</code> (état → sauvegarde → rendu), puis les écouteurs : saisie dans <code>#recherche</code> (filtre), envoi du formulaire <code>#ajout</code> (crée une note avec le titre du champ <code>#titre</code>, vide le champ), délégation sur <code>#liste</code> pour <code>epingler</code> et <code>supprimer</code>.</p>`,
            depart: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.note{border:1px solid #ccc;padding:6px;margin:4px 0}.epinglee{border-color:orange}</style></head>
<body>
  <form id="ajout"><input id="titre" placeholder="Titre"><button>Ajouter</button></form>
  <input id="recherche" type="search" placeholder="Rechercher">
  <main id="liste"></main>
  <script>
    // --- modèle et vue (fournis) ---
    const creerEtat = () => ({ notes: [], recherche: "" });
    const creerNote = (s, titre) => ({ ...s, notes: [{ id: String(Date.now() + Math.random()), titre: titre.trim(), epinglee: false }, ...s.notes] });
    const basculerEpingle = (s, id) => ({ ...s, notes: s.notes.map(n => n.id === id ? { ...n, epinglee: !n.epinglee } : n) });
    const supprimerNote = (s, id) => ({ ...s, notes: s.notes.filter(n => n.id !== id) });
    const notesVisibles = s => s.notes.filter(n => n.titre.toLowerCase().includes(s.recherche.toLowerCase())).sort((a, b) => a.epinglee === b.epinglee ? 0 : a.epinglee ? -1 : 1);
    function rendre(s) {
      document.getElementById("liste").replaceChildren(...notesVisibles(s).map(n => {
        const a = document.createElement("article"); a.className = "note" + (n.epinglee ? " epinglee" : ""); a.dataset.id = n.id;
        const h = document.createElement("h2"); h.textContent = n.titre;
        const b1 = document.createElement("button"); b1.dataset.action = "epingler"; b1.textContent = "Épingler";
        const b2 = document.createElement("button"); b2.dataset.action = "supprimer"; b2.textContent = "Supprimer";
        a.append(h, b1, b2); return a;
      }));
    }
    // --- à compléter ---
    function sauvegarder(s) {
      // ...
    }
    function charger() {
      // ...
    }
    let etat = charger() ?? creerEtat();
    function dispatch(transformation) {
      // ...
    }
    // écouteurs

    rendre(etat);
  </script>
</body>
</html>`,
            solution: `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><style>.note{border:1px solid #ccc;padding:6px;margin:4px 0}.epinglee{border-color:orange}</style></head>
<body>
  <form id="ajout"><input id="titre" placeholder="Titre"><button>Ajouter</button></form>
  <input id="recherche" type="search" placeholder="Rechercher">
  <main id="liste"></main>
  <script>
    // --- modèle et vue (fournis) ---
    const creerEtat = () => ({ notes: [], recherche: "" });
    const creerNote = (s, titre) => ({ ...s, notes: [{ id: String(Date.now() + Math.random()), titre: titre.trim(), epinglee: false }, ...s.notes] });
    const basculerEpingle = (s, id) => ({ ...s, notes: s.notes.map(n => n.id === id ? { ...n, epinglee: !n.epinglee } : n) });
    const supprimerNote = (s, id) => ({ ...s, notes: s.notes.filter(n => n.id !== id) });
    const notesVisibles = s => s.notes.filter(n => n.titre.toLowerCase().includes(s.recherche.toLowerCase())).sort((a, b) => a.epinglee === b.epinglee ? 0 : a.epinglee ? -1 : 1);
    function rendre(s) {
      document.getElementById("liste").replaceChildren(...notesVisibles(s).map(n => {
        const a = document.createElement("article"); a.className = "note" + (n.epinglee ? " epinglee" : ""); a.dataset.id = n.id;
        const h = document.createElement("h2"); h.textContent = n.titre;
        const b1 = document.createElement("button"); b1.dataset.action = "epingler"; b1.textContent = "Épingler";
        const b2 = document.createElement("button"); b2.dataset.action = "supprimer"; b2.textContent = "Supprimer";
        a.append(h, b1, b2); return a;
      }));
    }
    // --- à compléter ---
    function sauvegarder(s) {
      try { localStorage.setItem("notes.v1", JSON.stringify({ notes: s.notes })); } catch {}
    }
    function charger() {
      try {
        const brut = localStorage.getItem("notes.v1");
        return brut ? { ...creerEtat(), ...JSON.parse(brut) } : null;
      } catch { return null; }
    }
    let etat = charger() ?? creerEtat();
    function dispatch(transformation) {
      etat = transformation(etat);
      sauvegarder(etat);
      rendre(etat);
    }
    document.getElementById("recherche").addEventListener("input", e => dispatch(s => ({ ...s, recherche: e.target.value })));
    document.getElementById("ajout").addEventListener("submit", e => {
      e.preventDefault();
      const champ = document.getElementById("titre");
      if (!champ.value.trim()) return;
      dispatch(s => creerNote(s, champ.value));
      champ.value = "";
    });
    document.getElementById("liste").addEventListener("click", e => {
      const b = e.target.closest("[data-action]");
      if (!b) return;
      const id = e.target.closest(".note").dataset.id;
      if (b.dataset.action === "epingler") dispatch(s => basculerEpingle(s, id));
      if (b.dataset.action === "supprimer") dispatch(s => supprimerNote(s, id));
    });
    rendre(etat);
  </script>
</body>
</html>`,
            tests: [
              dom('Ajout de deux notes via le formulaire', d => { try { d.defaultView.localStorage.removeItem('notes.v1'); } catch {} const w = d.defaultView; const f = d.getElementById('ajout'); d.getElementById('titre').value = 'Alpha'; f.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); d.getElementById('titre').value = 'Beta'; f.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); return d.querySelectorAll('#liste article').length === 2 && d.getElementById('titre').value === ''; }),
              dom('Les notes sont sauvegardées dans localStorage (notes.v1)', d => { const o = JSON.parse(d.defaultView.localStorage.getItem('notes.v1')); return o && o.notes.length === 2; }),
              dom('La recherche filtre la liste', d => { const r = d.getElementById('recherche'); r.value = 'alp'; r.dispatchEvent(new d.defaultView.Event('input', { bubbles: true })); const ok = d.querySelectorAll('#liste article').length === 1; r.value = ''; r.dispatchEvent(new d.defaultView.Event('input', { bubbles: true })); return ok; }),
              dom('Épingler place la note en tête', d => { const beta = [...d.querySelectorAll('#liste article')].find(a => a.textContent.includes('Beta')); const alpha = [...d.querySelectorAll('#liste article')].find(a => a.textContent.includes('Alpha')); alpha.querySelector('[data-action=epingler]').click(); return d.querySelector('#liste article').textContent.includes('Alpha') && d.querySelector('#liste article').classList.contains('epinglee'); }),
              dom('Supprimer retire la note et met à jour la sauvegarde', d => { d.querySelector('#liste article [data-action=supprimer]').click(); const o = JSON.parse(d.defaultView.localStorage.getItem('notes.v1')); try { d.defaultView.localStorage.removeItem('notes.v1'); } catch {} return d.querySelectorAll('#liste article').length === 1 && o.notes.length === 1; }),
              { nom: 'dispatch enchaîne transformation, sauvegarde et rendu', verif: ctx => /function dispatch[\s\S]*sauvegarder\(etat\)[\s\S]*rendre\(etat\)/.test(ctx.code) ? true : 'dispatch doit appliquer la transformation, sauvegarder puis rendre.' }
            ]
          },
          quiz: [
            { q: 'Pourquoi ne persister que les notes et pas la recherche en cours ?', options: ['Par manque de place', 'L\'état d\'interface est transitoire ; seules les données comptent', 'localStorage ne stocke pas les chaînes'], bonne: 1, explication: 'Au rechargement, on veut retrouver ses notes, pas un filtre oublié.' },
            { q: 'Quel est le rôle de <code>dispatch</code> ?', options: ['Afficher une note', 'Centraliser chaque changement : transformer, sauvegarder, rendre', 'Envoyer un email'], bonne: 1, explication: 'Un point d\'entrée unique garantit que sauvegarde et affichage ne sont jamais oubliés.' },
            { q: 'Pour brancher cette application sur un serveur, que faut-il changer ?', options: ['Tout le code', 'Principalement sauvegarder/charger (fetch au lieu de localStorage)', 'La fonction rendre'], bonne: 1, explication: 'La persistance est isolée : le modèle et la vue restent identiques.' }
          ]
        }
      ]
    }
  ]
};
