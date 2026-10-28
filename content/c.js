import { code } from './_outils.js';

export default {
  description: 'Le C est le langage des systèmes d\'exploitation, des microcontrôleurs et des bibliothèques qui font tourner le monde. L\'apprendre, c\'est comprendre la mémoire, les pointeurs et ce que font vraiment les langages de plus haut niveau.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Le C se compile sur ton ordinateur : installe <strong>gcc</strong> (Linux : <code>sudo apt install build-essential</code> ; macOS : <code>xcode-select --install</code> ; Windows : <a href="https://www.msys2.org" target="_blank" rel="noopener">MSYS2</a> ou WSL). Chaque exercice te demande d'écrire un programme dans l'éditeur, de le compiler chez toi avec la commande indiquée, puis de comparer ta version à la solution de référence et de répondre à une question de vérification. Les exercices à trous et les QCM se corrigent directement dans la page.</p><p class="muted">Compilation recommandée : <code>gcc -std=c11 -Wall -Wextra -o prog prog.c</code>. Les avertissements (<code>-Wall -Wextra</code>) sont tes meilleurs alliés.</p>`,
  modules: [
    {
      titre: 'Les bases du C', niveau: 'Débutant', description: 'Compilation, types, opérateurs, structures de contrôle et fonctions.',
      lecons: [
        {
          titre: 'Premier programme et compilation',
          theorie: `<p>Le C a été créé en 1972 pour écrire UNIX. Cinquante ans plus tard, Linux, Windows, Python, les bases de données et presque tous les systèmes embarqués sont écrits en C. C'est un langage <strong>compilé</strong> : un compilateur transforme ton code source en instructions machine, exécutées directement par le processeur, sans interpréteur.</p>
${code('c', `#include <stdio.h>          /* déclare printf : entrée/sortie standard */

int main(void)              /* point d'entrée : le programme commence ici */
{
    printf("Bonjour, Lumio !\\n");   /* \\n = retour à la ligne */
    return 0;               /* 0 = succès, renvoyé au système */
}`)}
<h2>Compiler et exécuter</h2>
${code('bash', `gcc -std=c11 -Wall -Wextra -o bonjour bonjour.c   # compile bonjour.c en exécutable « bonjour »
./bonjour                                           # exécute (Windows : bonjour.exe)
echo $?                                             # affiche le code de retour (0)`)}
<p><code>-std=c11</code> : version du langage ; <code>-Wall -Wextra</code> : active les avertissements (lis-les tous, ils signalent de vrais bugs) ; <code>-o</code> : nom du fichier produit. Ajoute <code>-g</code> pour déboguer et <code>-O2</code> pour optimiser.</p>
<h2>Les étapes de la compilation</h2>
<ol><li><strong>Préprocesseur</strong> : traite les <code>#include</code> et <code>#define</code> (copie textuelle).</li><li><strong>Compilation</strong> : traduit le C en assembleur, puis en code objet (<code>.o</code>).</li><li><strong>Édition de liens</strong> : assemble les fichiers objets et les bibliothèques (<code>printf</code> vient de la libc) en un exécutable.</li></ol>
<p><code>gcc -c fichier.c</code> s'arrête à l'étape 2 ; utile pour les projets à plusieurs fichiers.</p>
<h2>Anatomie du programme</h2>
<ul><li><code>#include &lt;stdio.h&gt;</code> : inclut l'<em>en-tête</em> qui déclare <code>printf</code>. Sans lui, le compilateur ne connaît pas la fonction.</li><li><code>int main(void)</code> : la fonction principale renvoie un entier ; <code>void</code> indique qu'elle ne prend pas d'arguments (la version <code>int main(int argc, char *argv[])</code> reçoit la ligne de commande).</li><li>Les accolades délimitent les blocs ; chaque instruction se termine par un point-virgule.</li><li>Les commentaires : <code>/* … */</code> ou <code>//</code> en fin de ligne.</li></ul>
<h2>printf : afficher</h2>
${code('c', `int age = 27;
double taille = 1.68;
char initiale = 'N';
printf("Age : %d, taille : %.2f m, initiale : %c\\n", age, taille, initiale);
/* %d entier, %f réel (%.2f = 2 décimales), %c caractère, %s chaîne, %u non signé, %x hexadécimal, %% le signe % */`)}
<p>Le nombre et le type des <em>spécificateurs</em> doivent correspondre aux arguments : <code>printf("%d", 3.5)</code> compile (avec un avertissement) mais affiche n'importe quoi. C'est le C : il te fait confiance.</p>
<h2>Erreurs de compilation</h2>
<p>Lis la <em>première</em> erreur, avec son numéro de ligne : les suivantes en découlent souvent. Les classiques : point-virgule oublié (<code>expected ';' before</code>), en-tête manquant (<code>implicit declaration of function</code>), variable non déclarée (<code>undeclared</code>), guillemets ou accolade non fermés.</p>
<div class="callout info"><b>Philosophie du C</b>Le C ne fait rien dans ton dos : pas de ramasse-miettes, pas de vérification des indices de tableau, pas d'exceptions. En échange, tu sais exactement ce que fait chaque ligne et ce qu'elle coûte.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Fiche d\'identité formatée',
            enonce: `<p>Écris un programme qui déclare un entier <code>annee</code> (2026), un réel <code>prix</code> (19.99) et un caractère <code>categorie</code> ('B'), puis affiche exactement les trois lignes de la sortie attendue avec <code>printf</code> et les bons spécificateurs. Compile avec gcc, vérifie la sortie, puis compare avec la solution.</p>`,
            depart: `#include <stdio.h>

int main(void)
{
    /* déclarations */

    /* affichage */
    return 0;
}`,
            solution: `#include <stdio.h>

int main(void)
{
    int annee = 2026;
    double prix = 19.99;
    char categorie = 'B';

    printf("Annee : %d\\n", annee);
    printf("Prix : %.2f EUR\\n", prix);
    printf("Categorie : %c (%d%%)\\n", categorie, 100);
    return 0;
}`,
            sortieAttendue: `Annee : 2026
Prix : 19.99 EUR
Categorie : B (100%)`,
            explication: `<p>Chaque spécificateur correspond au type de l'argument : <code>%d</code> pour l'entier, <code>%.2f</code> pour le réel avec deux décimales, <code>%c</code> pour le caractère. Pour afficher un signe <code>%</code> littéral, on écrit <code>%%</code>.</p>`,
            verification: { question: 'Que se passe-t-il si on écrit <code>printf("%d\\n", prix);</code> avec <code>prix</code> de type <code>double</code> ?', options: ['Le compilateur refuse de compiler', 'Le programme affiche 19', 'Le programme compile (avec un avertissement) et affiche une valeur imprévisible'], bonne: 2, explication: 'printf lit un entier là où un double a été passé : comportement indéfini. Avec -Wall, gcc prévient (format \'%d\' expects argument of type \'int\').' }
          },
          quiz: [
            { q: 'Que fait l\'option <code>-Wall</code> de gcc ?', options: ['Optimise le code', 'Active les avertissements courants', 'Compile pour Windows'], bonne: 1, explication: 'Avec -Wextra, elle signale la plupart des erreurs classiques avant même l\'exécution.' },
            { q: 'Quel spécificateur printf pour un <code>double</code> ?', options: ['%d', '%f', '%s'], bonne: 1, explication: '%d est réservé aux entiers, %s aux chaînes.' },
            { q: 'Que signifie <code>return 0;</code> dans main ?', options: ['Le programme a échoué', 'Le programme s\'est terminé avec succès', 'Rien, c\'est optionnel'], bonne: 1, explication: 'Le code de retour est lu par le système ou les scripts ; 0 signifie succès par convention.' }
          ]
        },
        {
          titre: 'Types, variables et opérateurs',
          theorie: `<p>En C, chaque variable a un type <strong>fixé à la déclaration</strong> qui détermine sa taille en mémoire et les opérations possibles. Le compilateur s'en sert pour générer du code efficace ; en contrepartie, c'est à toi de choisir juste.</p>
<h2>Les types fondamentaux</h2>
<table><tr><th>Type</th><th>Taille typique</th><th>Plage / usage</th></tr>
<tr><td><code>char</code></td><td>1 octet</td><td>un caractère ou un petit entier (-128 à 127)</td></tr>
<tr><td><code>int</code></td><td>4 octets</td><td>entier (−2 147 483 648 à 2 147 483 647)</td></tr>
<tr><td><code>long</code>, <code>long long</code></td><td>8 octets</td><td>grands entiers</td></tr>
<tr><td><code>unsigned int</code></td><td>4 octets</td><td>0 à 4 294 967 295 (jamais négatif)</td></tr>
<tr><td><code>float</code></td><td>4 octets</td><td>réel, ~7 chiffres significatifs</td></tr>
<tr><td><code>double</code></td><td>8 octets</td><td>réel, ~15 chiffres (par défaut pour les calculs)</td></tr>
<tr><td><code>_Bool</code> / <code>bool</code></td><td>1 octet</td><td>vrai/faux (avec <code>#include &lt;stdbool.h&gt;</code>)</td></tr></table>
<p>Les tailles dépendent de la plateforme : <code>sizeof(int)</code> donne la taille réelle. Pour des tailles garanties, <code>&lt;stdint.h&gt;</code> fournit <code>int32_t</code>, <code>uint8_t</code>, <code>int64_t</code>…</p>
${code('c', `#include <stdio.h>
#include <stdbool.h>
#include <stdint.h>

int main(void)
{
    int compteur = 0;              /* toujours initialiser : une variable non initialisée contient n'importe quoi */
    const double TVA = 0.2;        /* const : non modifiable */
    unsigned int octets = 4096u;
    uint8_t octet = 255;           /* 255 + 1 revient à 0 : dépassement défini pour les non signés */
    bool actif = true;
    char lettre = 'A';             /* 'A' vaut 65 : un char est un nombre */
    printf("%zu %zu %zu\\n", sizeof(int), sizeof(double), sizeof lettre);   /* %zu pour size_t */
    return 0;
}`)}
<h2>Opérateurs</h2>
${code('c', `int a = 7, b = 2;
a / b        /* 3 : division ENTIÈRE entre entiers */
a % b        /* 1 : reste */
(double)a / b   /* 3.5 : conversion explicite (cast) d'un opérande */
a++; ++a; a += 3; a *= 2;
a == b, a != b, a < b, a >= b      /* comparaisons : résultat 0 ou 1 */
a && b, a || b, !a                 /* logique : 0 = faux, tout le reste = vrai */
a & b, a | b, a ^ b, ~a, a << 2    /* bit à bit : masques, drapeaux, optimisation */`)}
<p>Deux pièges majeurs : la division entière (<code>7 / 2 == 3</code>) et le <strong>dépassement</strong> d'un entier signé (<code>INT_MAX + 1</code>), qui est un comportement indéfini : le programme peut faire n'importe quoi.</p>
<h2>Conversions implicites</h2>
<p>Dans <code>int + double</code>, l'entier est converti en double. Dans <code>int i = 3.9;</code>, le réel est tronqué à 3. Comparer un <code>int</code> négatif à un <code>unsigned</code> convertit le négatif en un très grand nombre : <code>-1 &gt; 1u</code> est vrai ! Active <code>-Wsign-compare</code> (inclus dans <code>-Wextra</code>).</p>
<h2>Lire une entrée</h2>
${code('c', `int n;
if (scanf("%d", &n) == 1) {      /* & : adresse de n (scanf doit écrire dedans) ; vérifier le retour ! */
    printf("Vous avez saisi %d\\n", n);
}`)}
<p>Nous verrons l'opérateur <code>&amp;</code> en détail avec les pointeurs. Retiens que <code>scanf</code> renvoie le nombre de valeurs lues : toujours le vérifier.</p>
<div class="callout warn"><b>Variables non initialisées</b><code>int total;</code> puis <code>total += 5;</code> : le résultat est imprévisible. Le C ne met pas les variables locales à zéro. Initialise toujours.</div>`,
          exercice: {
            type: 'trous', langage: 'c', titre: 'Division, cast et modulo',
            enonce: `<p>Complète le programme pour qu'il affiche <code>Quotient : 3</code>, <code>Reste : 1</code>, <code>Moyenne : 3.50</code> et <code>Octets : 4</code>.</p>`,
            code: `#include <stdio.h>

int main(void)
{
    int a = 7, b = 2;
    int quotient = a ___ b;
    int reste = a ___ b;
    double moyenne = (___)a / b;
    printf("Quotient : %d\\n", quotient);
    printf("Reste : %d\\n", reste);
    printf("Moyenne : %___\\n", moyenne);
    printf("Octets : %zu\\n", ___(int));
    return 0;
}`,
            reponses: [['/'], ['%'], ['double', 'float'], ['.2f'], ['sizeof']],
            aides: ['L\'opérateur de division entre deux entiers.', 'L\'opérateur qui donne le reste de la division.', 'Un cast vers un type réel pour obtenir 3.5.', 'Un réel avec deux décimales : .2f', 'L\'opérateur qui donne la taille d\'un type en octets.']
          },
          quiz: [
            { q: 'Que vaut <code>9 / 4</code> en C (deux int) ?', options: ['2.25', '2', '3'], bonne: 1, explication: 'Division entière : le résultat est tronqué.' },
            { q: 'Que contient une variable locale non initialisée ?', options: ['0', 'NULL', 'Une valeur imprévisible'], bonne: 2, explication: 'Le C n\'initialise pas les variables locales : il faut le faire soi-même.' },
            { q: 'Quel en-tête fournit <code>int32_t</code> et <code>uint8_t</code> ?', options: ['stdio.h', 'stdint.h', 'stdlib.h'], bonne: 1, explication: 'stdint.h définit les entiers à largeur fixe, portables.' }
          ]
        },
        {
          titre: 'Conditions et boucles',
          theorie: `<p>Les structures de contrôle du C sont celles que JavaScript, Java, C++ et bien d'autres ont copiées. Si tu connais l'une, tu connais les autres ; ici, on insiste sur les détails propres au C.</p>
${code('c', `#include <stdio.h>

int main(void)
{
    int note = 14;
    if (note >= 16) {
        printf("Tres bien\\n");
    } else if (note >= 10) {
        printf("Admis\\n");
    } else {
        printf("Echec\\n");
    }

    const char *mention = note >= 10 ? "admis" : "refuse";   /* opérateur ternaire */

    switch (note / 5) {               /* switch : entiers ou char uniquement */
        case 4: case 3: printf("haut\\n"); break;
        case 2:         printf("milieu\\n"); break;
        default:        printf("bas\\n");
    }
    return 0;
}`)}
<p>En C, <strong>0 est faux, tout le reste est vrai</strong>. <code>if (x = 5)</code> (affectation au lieu de comparaison) est valide et toujours vrai : gcc prévient avec <code>-Wall</code> (<em>suggest parentheses</em>). Mets toujours des accolades, même pour une seule instruction : cela évite le bug classique de la deuxième ligne « indentée » mais hors du <code>if</code>.</p>
<h2>Boucles</h2>
${code('c', `for (int i = 0; i < 10; i++) {        /* i n'existe que dans la boucle (C99+) */
    if (i % 2 == 0) continue;         /* passe au tour suivant */
    if (i > 7) break;                 /* sort de la boucle */
    printf("%d ", i);                 /* 1 3 5 7 */
}

int n = 1;
while (n < 1000) {
    n *= 2;
}

int c;
do {
    c = getchar();                    /* lit un caractère ; exécuté au moins une fois */
} while (c != '\\n' && c != EOF);`)}
<h2>Boucles imbriquées et tableaux 2D</h2>
${code('c', `for (int ligne = 1; ligne <= 3; ligne++) {
    for (int col = 1; col <= 3; col++) {
        printf("%3d", ligne * col);   /* %3d : largeur 3, aligné à droite */
    }
    printf("\\n");
}`)}
<h2>Erreurs classiques</h2>
<ul><li><strong>Off-by-one</strong> : <code>for (i = 0; i &lt;= n; i++)</code> fait n+1 tours. Les indices vont de 0 à n−1.</li>
<li><strong>Boucle infinie</strong> sur un <code>unsigned</code> : <code>for (unsigned i = 10; i &gt;= 0; i--)</code> ne s'arrête jamais (i ne devient jamais négatif).</li>
<li><strong>Point-virgule parasite</strong> : <code>while (x &lt; 10);</code> boucle à vide pour toujours.</li>
<li><code>break</code> ne sort que de la boucle la plus interne ; pour sortir de deux boucles, utilise un drapeau ou une fonction avec <code>return</code>.</li></ul>
<h2>goto</h2>
<p>Il existe. Son seul usage acceptable en C moderne : sauter vers un bloc de nettoyage en fin de fonction (<code>goto cleanup;</code>) quand plusieurs ressources ont été allouées. Le noyau Linux l'utilise ainsi ; nulle part ailleurs.</p>
<div class="callout info"><b>Lisibilité</b>Une boucle doit tenir à l'écran. Si le corps dépasse vingt lignes, extrais une fonction.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Table de multiplication et nombres premiers',
            enonce: `<p>Écris un programme qui affiche la table de multiplication de 7 (de 1 à 5, format <code>7 x 1 = 7</code>), puis la liste des nombres premiers inférieurs à 30 séparés par des espaces, avec une fonction ou une boucle imbriquée utilisant <code>break</code>.</p>`,
            depart: `#include <stdio.h>

int main(void)
{
    /* table de 7 */

    /* premiers < 30 */

    return 0;
}`,
            solution: `#include <stdio.h>

int main(void)
{
    for (int i = 1; i <= 5; i++) {
        printf("7 x %d = %d\\n", i, 7 * i);
    }

    for (int n = 2; n < 30; n++) {
        int premier = 1;
        for (int d = 2; d * d <= n; d++) {
            if (n % d == 0) {
                premier = 0;
                break;
            }
        }
        if (premier) {
            printf("%d ", n);
        }
    }
    printf("\\n");
    return 0;
}`,
            sortieAttendue: `7 x 1 = 7
7 x 2 = 14
7 x 3 = 21
7 x 4 = 28
7 x 5 = 35
2 3 5 7 11 13 17 19 23 29 `,
            explication: `<p>Le drapeau <code>premier</code> vaut 1 tant qu'aucun diviseur n'est trouvé ; <code>break</code> évite de tester les diviseurs suivants. La condition <code>d * d &lt;= n</code> suffit : un diviseur plus grand que √n aurait un complément plus petit, déjà testé.</p>`,
            verification: { question: 'Pourquoi la boucle interne s\'arrête-t-elle à <code>d * d &lt;= n</code> plutôt qu\'à <code>d &lt; n</code> ?', options: ['Pour éviter un dépassement d\'entier', 'Parce qu\'un diviseur supérieur à √n implique un diviseur inférieur à √n, déjà testé', 'Parce que les nombres premiers sont tous impairs'], bonne: 1, explication: 'Si n = a × b avec a ≤ b, alors a ≤ √n. Tester jusqu\'à √n suffit et réduit énormément le nombre d\'itérations.' }
          },
          quiz: [
            { q: 'Que fait <code>if (x = 0)</code> ?', options: ['Compare x à 0', 'Affecte 0 à x et la condition est toujours fausse', 'Erreur de compilation'], bonne: 1, explication: 'L\'affectation renvoie la valeur affectée (0 = faux). gcc -Wall prévient.' },
            { q: 'Combien de tours fait <code>for (int i = 0; i &lt;= 5; i++)</code> ?', options: ['5', '6', '4'], bonne: 1, explication: 'i prend les valeurs 0, 1, 2, 3, 4, 5.' },
            { q: 'Que se passe-t-il avec <code>for (unsigned i = 3; i &gt;= 0; i--)</code> ?', options: ['3 tours', 'Boucle infinie', 'Erreur'], bonne: 1, explication: 'Un unsigned n\'est jamais négatif : i >= 0 est toujours vrai (après 0, i revient à 4 294 967 295).' }
          ]
        },
        {
          titre: 'Fonctions et portée',
          theorie: `<p>Une fonction C a une signature stricte : type de retour, nom, types des paramètres. Le compilateur doit la connaître <em>avant</em> son utilisation : d'où les <strong>prototypes</strong>.</p>
${code('c', `#include <stdio.h>

/* Prototype : déclare la fonction avant main (ou dans un .h) */
double moyenne(const double valeurs[], int n);
int est_pair(int x);
void afficher_ligne(void);

int main(void)
{
    double notes[] = {12.5, 15, 9};
    printf("Moyenne : %.2f\\n", moyenne(notes, 3));
    afficher_ligne();
    return 0;
}

double moyenne(const double valeurs[], int n)     /* définition */
{
    double somme = 0;
    for (int i = 0; i < n; i++) {
        somme += valeurs[i];
    }
    return n > 0 ? somme / n : 0;
}

int est_pair(int x) { return x % 2 == 0; }

void afficher_ligne(void) { printf("----------\\n"); }   /* void : ne renvoie rien */`)}
<h2>Passage par valeur</h2>
<p>En C, les arguments sont <strong>copiés</strong>. Modifier un paramètre dans la fonction ne change pas la variable de l'appelant :</p>
${code('c', `void doubler(int x) { x *= 2; }        /* modifie la copie */
int n = 5; doubler(n);                  /* n vaut toujours 5 */

void doubler_vraiment(int *x) { *x *= 2; }   /* reçoit l'adresse : modifie l'original */
doubler_vraiment(&n);                   /* n vaut 10 : c'est l'objet de la leçon sur les pointeurs */`)}
<p>Exception apparente : les tableaux. Un tableau passé à une fonction se « dégrade » en pointeur vers son premier élément ; la fonction travaille donc sur l'original, et ne connaît pas sa taille (on la passe en paramètre).</p>
<h2>Portée et durée de vie</h2>
<ul><li><strong>Locale</strong> : déclarée dans un bloc, détruite à la sortie. Ne renvoie jamais l'adresse d'une variable locale.</li><li><strong>Globale</strong> : déclarée hors de toute fonction, visible partout, vit toute l'exécution. À limiter : rend le code difficile à tester.</li><li><strong><code>static</code> locale</strong> : conserve sa valeur entre les appels (compteur d'appels).</li><li><strong><code>static</code> globale/fonction</strong> : visible seulement dans ce fichier (encapsulation).</li></ul>
${code('c', `int compteur(void)
{
    static int n = 0;    /* initialisée une seule fois */
    return ++n;          /* 1, 2, 3, ... à chaque appel */
}`)}
<h2>Récursivité</h2>
${code('c', `unsigned long factorielle(unsigned n)
{
    if (n <= 1) return 1;              /* cas de base : indispensable */
    return n * factorielle(n - 1);
}`)}
<p>Chaque appel consomme de la pile (quelques dizaines d'octets) ; une récursion de plusieurs centaines de milliers de niveaux provoque un <em>stack overflow</em>. Pour un parcours linéaire, préfère une boucle.</p>
<h2>Conventions</h2>
<ul><li>Noms en <code>snake_case</code>, verbes pour les fonctions : <code>calculer_total</code>, <code>est_valide</code>.</li><li>Paramètres non modifiés marqués <code>const</code> : documentation et sécurité.</li><li>Une fonction, une responsabilité, moins de 50 lignes.</li><li>Les valeurs de retour d'erreur : <code>-1</code>, <code>NULL</code> ou un code, documenté en commentaire.</li></ul>
<div class="callout info"><b>Déclaration implicite</b>Appeler une fonction sans prototype est une erreur depuis C99 (gcc : <code>implicit declaration of function</code>). Inclus le bon en-tête ou écris le prototype.</div>`,
          exercice: {
            type: 'trous', langage: 'c', titre: 'Prototypes, static et récursion',
            enonce: `<p>Complète ce programme qui calcule une puissance par récursion et compte les appels avec une variable <code>static</code>. Sortie attendue : <code>2^10 = 1024</code> puis <code>Appels : 11</code>.</p>`,
            code: `#include <stdio.h>

long puissance(int base, int exposant);
int nb_appels(___);

int main(void)
{
    printf("2^10 = %ld\\n", puissance(2, 10));
    printf("Appels : %d\\n", nb_appels());
    return 0;
}

long puissance(int base, int exposant)
{
    nb_appels();
    if (exposant == 0) {
        ___ 1;
    }
    return base * puissance(base, exposant ___ 1);
}

int nb_appels(void)
{
    ___ int n = 0;
    return ___;
}`,
            reponses: [['void'], ['return'], ['-'], ['static'], ['++n', 'n++ + 1', 'n = n + 1']],
            aides: ['Une fonction sans paramètre se déclare avec void entre les parenthèses.', 'Le mot-clé qui renvoie une valeur et termine la fonction.', 'L\'exposant diminue à chaque appel récursif.', 'Le mot-clé qui conserve la valeur entre deux appels.', 'Incrémente puis renvoie : ++n (le compteur doit valoir 11 au dernier appel).']
          },
          quiz: [
            { q: 'Que vaut <code>n</code> après <code>int n = 5; doubler(n);</code> si <code>doubler</code> fait <code>x *= 2</code> sur son paramètre ?', options: ['10', '5', 'Indéfini'], bonne: 1, explication: 'Passage par valeur : la fonction travaille sur une copie.' },
            { q: 'Que fait <code>static</code> sur une variable locale ?', options: ['La rend globale', 'Conserve sa valeur entre les appels', 'La rend constante'], bonne: 1, explication: 'Elle est initialisée une fois et survit à la fin de la fonction.' },
            { q: 'Pourquoi écrire un prototype avant main ?', options: ['Pour la documentation uniquement', 'Pour que le compilateur connaisse la signature avant l\'appel', 'C\'est interdit après main'], bonne: 1, explication: 'Sans prototype, l\'appel est une erreur (déclaration implicite) ou une source de bugs de types.' }
          ]
        }
      ]
    },
    {
      titre: 'Mémoire et pointeurs', niveau: 'Intermédiaire', description: 'Tableaux, chaînes, pointeurs, allocation dynamique et structures : le cœur du C.',
      lecons: [
        {
          titre: 'Tableaux et chaînes de caractères',
          theorie: `<p>Un tableau C est une suite d'éléments du même type, <strong>contigus</strong> en mémoire, de taille fixe. Aucune vérification d'indice : écrire <code>t[10]</code> dans un tableau de 10 éléments écrase ce qui suit en mémoire. C'est la première cause de bugs et de failles en C.</p>
${code('c', `int notes[5] = {12, 15, 9, 18, 11};      /* taille 5, indices 0 à 4 */
int zeros[100] = {0};                     /* tout à zéro */
double t[] = {1.5, 2.5};                  /* taille déduite : 2 */
notes[2] = 10;
int taille = sizeof notes / sizeof notes[0];   /* 5 : nombre d'éléments (seulement là où le tableau est déclaré) */

for (int i = 0; i < taille; i++) {
    printf("%d ", notes[i]);
}

int grille[3][4] = {{0}};                 /* 2D : 3 lignes de 4 colonnes */
grille[1][2] = 7;`)}
<h2>Tableaux et fonctions</h2>
<p>Passé à une fonction, un tableau devient un pointeur vers son premier élément : <code>sizeof</code> ne donne plus que la taille du pointeur. On passe donc toujours la taille :</p>
${code('c', `int somme(const int t[], int n)      /* équivalent à const int *t */
{
    int s = 0;
    for (int i = 0; i < n; i++) s += t[i];
    return s;
}
/* appel : somme(notes, 5) */`)}
<h2>Chaînes de caractères</h2>
<p>Le C n'a pas de type « chaîne » : une chaîne est un tableau de <code>char</code> terminé par le caractère nul <code>'\\0'</code>. Ce terminateur est tout : sans lui, les fonctions lisent la mémoire jusqu'à trouver un zéro par hasard.</p>
${code('c', `#include <string.h>

char nom[20] = "Lumio";         /* 6 octets utilisés : L u m i o \\0 */
char copie[20];
strlen(nom);                    /* 5 : longueur sans le \\0 */
strcpy(copie, nom);             /* copie (le tableau destination doit être assez grand !) */
strcat(copie, " Academy");      /* concatène : "Lumio Academy" */
strcmp(nom, "Lumio") == 0;      /* comparaison : 0 si égales (== entre chaînes compare les adresses !) */
nom[0] = 'l';                   /* modifiable : c'est un tableau */

const char *litteral = "texte";   /* pointeur vers une chaîne littérale : NON modifiable */`)}
<h2>Les versions sûres</h2>
${code('c', `char dest[16];
snprintf(dest, sizeof dest, "%s-%d", nom, 42);   /* n'écrit jamais plus de 16 octets, termine toujours par \\0 */
strncpy(dest, source, sizeof dest - 1); dest[sizeof dest - 1] = '\\0';   /* strncpy ne termine pas toujours */
fgets(ligne, sizeof ligne, stdin);               /* lecture d'une ligne, bornée (jamais gets !) */`)}
<p><code>gets</code>, <code>strcpy</code> et <code>sprintf</code> sans contrôle de taille ont causé des décennies de failles (<em>buffer overflow</em>). Utilise systématiquement les versions bornées.</p>
<h2>Parcourir une chaîne</h2>
${code('c', `int compter_voyelles(const char *s)
{
    int n = 0;
    for (int i = 0; s[i] != '\\0'; i++) {
        if (strchr("aeiouy", s[i])) n++;     /* strchr : cherche un caractère */
    }
    return n;
}
/* Conversion : atoi("42") → 42 ; strtol("42", NULL, 10) avec contrôle d'erreur ; toupper(c) de <ctype.h> */`)}
<div class="callout warn"><b>Règle d'or</b>Chaque fois que tu écris dans un tableau, demande-toi : combien d'octets la destination peut-elle contenir, et qui garantit que je n'écris pas plus ?</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Statistiques et inversion de chaîne',
            enonce: `<p>Écris une fonction <code>int maximum(const int t[], int n)</code>, une fonction <code>void inverser(char *s)</code> qui inverse une chaîne en place (sans tableau auxiliaire), et un <code>main</code> qui les teste sur <code>{4, 17, 9, 2}</code> et <code>"lumio"</code>, en affichant aussi la longueur avec <code>strlen</code>.</p>`,
            depart: `#include <stdio.h>
#include <string.h>

int maximum(const int t[], int n)
{
    /* ... */
}

void inverser(char *s)
{
    /* ... */
}

int main(void)
{
    int valeurs[] = {4, 17, 9, 2};
    char mot[] = "lumio";
    /* ... */
    return 0;
}`,
            solution: `#include <stdio.h>
#include <string.h>

int maximum(const int t[], int n)
{
    int max = t[0];
    for (int i = 1; i < n; i++) {
        if (t[i] > max) max = t[i];
    }
    return max;
}

void inverser(char *s)
{
    size_t gauche = 0, droite = strlen(s);
    if (droite == 0) return;
    droite--;
    while (gauche < droite) {
        char tmp = s[gauche];
        s[gauche] = s[droite];
        s[droite] = tmp;
        gauche++;
        droite--;
    }
}

int main(void)
{
    int valeurs[] = {4, 17, 9, 2};
    char mot[] = "lumio";
    printf("Maximum : %d\\n", maximum(valeurs, 4));
    printf("Longueur : %zu\\n", strlen(mot));
    inverser(mot);
    printf("Inverse : %s\\n", mot);
    return 0;
}`,
            sortieAttendue: `Maximum : 17
Longueur : 5
Inverse : oimul`,
            explication: `<p><code>inverser</code> échange les caractères des deux extrémités en se rapprochant du centre. Le test <code>droite == 0</code> protège le cas de la chaîne vide (sinon <code>droite--</code> sur un <code>size_t</code> à 0 donnerait un nombre énorme).</p>`,
            verification: { question: 'Pourquoi <code>char mot[] = "lumio";</code> peut-il être inversé en place alors que <code>char *mot = "lumio";</code> provoquerait un plantage ?', options: ['Parce que le tableau est plus grand', 'Parce que le tableau est une copie modifiable, alors que le littéral est en mémoire en lecture seule', 'Parce que le pointeur ne connaît pas strlen'], bonne: 1, explication: 'Un littéral de chaîne est stocké dans une zone non modifiable ; écrire dedans est un comportement indéfini (souvent une erreur de segmentation).' }
          },
          quiz: [
            { q: 'Combien d\'octets occupe <code>char s[] = "abc";</code> ?', options: ['3', '4', '8'], bonne: 1, explication: 'Trois caractères plus le terminateur \'\\0\'.' },
            { q: 'Comment comparer deux chaînes en C ?', options: ['s1 == s2', 'strcmp(s1, s2) == 0', 's1.equals(s2)'], bonne: 1, explication: '== compare les adresses, pas le contenu.' },
            { q: 'Quelle fonction faut-il bannir ?', options: ['fgets', 'snprintf', 'gets'], bonne: 2, explication: 'gets ne limite pas la taille lue : dépassement de tampon garanti. Elle a été retirée du standard C11.' }
          ]
        },
        {
          titre: 'Les pointeurs',
          theorie: `<p>Un <strong>pointeur</strong> est une variable qui contient une <em>adresse mémoire</em>. C'est le concept qui fait la réputation du C : indispensable pour modifier une variable depuis une fonction, parcourir des tableaux, gérer la mémoire dynamique et construire des structures de données.</p>
${code('c', `int n = 42;
int *p = &n;        /* p contient l'adresse de n  (& : « adresse de ») */
printf("%d\\n", *p); /* 42 : *p lit la valeur à l'adresse (* : « contenu de », déréférencement) */
*p = 7;             /* écrit 7 dans n via le pointeur */
printf("%d\\n", n);  /* 7 */
printf("%p\\n", (void *)p);   /* affiche l'adresse (ex. 0x7ffd3a2b1c4c) */`)}
<p>Le type du pointeur (<code>int *</code>) indique ce qu'il y a à l'adresse : c'est ce qui permet à <code>*p</code> de lire 4 octets et à <code>p + 1</code> d'avancer de 4 octets.</p>
<h2>Pointeurs et fonctions</h2>
${code('c', `void echanger(int *a, int *b)
{
    int tmp = *a;
    *a = *b;
    *b = tmp;
}
int x = 1, y = 2;
echanger(&x, &y);    /* x = 2, y = 1 : la fonction a modifié les originaux */

/* Renvoyer plusieurs résultats */
int diviser(int a, int b, int *quotient, int *reste)
{
    if (b == 0) return -1;              /* code d'erreur */
    *quotient = a / b;
    *reste = a % b;
    return 0;
}`)}
<h2>Pointeurs et tableaux</h2>
${code('c', `int t[4] = {10, 20, 30, 40};
int *p = t;              /* le nom d'un tableau « vaut » l'adresse de son premier élément */
*(p + 2) == t[2];        /* 30 : arithmétique de pointeurs ; t[i] est défini comme *(t + i) */
p++;                     /* p pointe maintenant sur t[1] */

for (int *q = t; q < t + 4; q++) {   /* parcours par pointeur */
    printf("%d ", *q);
}`)}
<h2>NULL et sécurité</h2>
${code('c', `int *p = NULL;          /* pointeur qui ne pointe sur rien : toujours initialiser */
if (p != NULL) {        /* vérifier avant de déréférencer */
    *p = 1;             /* sinon : erreur de segmentation */
}`)}
<p>Trois fautes mortelles : déréférencer <code>NULL</code>, déréférencer un pointeur non initialisé (adresse aléatoire), utiliser un pointeur vers une variable locale après la fin de sa fonction (<em>dangling pointer</em>).</p>
<h2>const et pointeurs</h2>
${code('c', `const int *p1;        /* pointeur vers un int constant : *p1 = 3 interdit, p1 = &autre autorisé */
int *const p2 = &n;   /* pointeur constant : p2 = &autre interdit, *p2 = 3 autorisé */
const char *s = "x";  /* le cas le plus courant : chaîne en lecture seule */`)}
<p>Lis de droite à gauche : « p1 est un pointeur vers un int const ».</p>
<h2>Pointeurs de fonctions</h2>
${code('c', `int comparer(const void *a, const void *b) { return *(const int *)a - *(const int *)b; }
qsort(t, 4, sizeof t[0], comparer);     /* tri de la bibliothèque standard : prend une fonction en paramètre */

int (*operation)(int, int) = &additionner;   /* variable contenant une fonction */
operation(2, 3);`)}
<p>Les pointeurs de fonctions permettent les callbacks, les tables de dispatch et le polymorphisme « à la main » : c'est ainsi que sont écrits les pilotes et les interpréteurs.</p>
<div class="callout info"><b>Visualiser</b>Dessine la mémoire : des cases avec une adresse et une valeur ; un pointeur est une case dont la valeur est l'adresse d'une autre case. Chaque <code>*</code> « suit la flèche ».</div>`,
          exercice: {
            type: 'trous', langage: 'c', titre: 'Échange, parcours et résultat multiple',
            enonce: `<p>Complète le programme : <code>echanger</code> permute deux entiers via leurs adresses, <code>min_max</code> renvoie deux résultats par pointeurs, et le <code>main</code> parcourt le tableau avec un pointeur. Sortie attendue : <code>x = 2, y = 1</code>, <code>min = 3, max = 9</code>, <code>3 9 5</code>.</p>`,
            code: `#include <stdio.h>

void echanger(int *a, int *b)
{
    int tmp = ___a;
    *a = *b;
    *b = ___;
}

void min_max(const int t[], int n, int *min, int *max)
{
    *min = *max = t[0];
    for (int i = 1; i < n; i++) {
        if (t[i] < *min) ___ = t[i];
        if (t[i] > *max) *max = t[i];
    }
}

int main(void)
{
    int x = 1, y = 2;
    echanger(___, &y);
    printf("x = %d, y = %d\\n", x, y);

    int t[] = {3, 9, 5};
    int mn, mx;
    min_max(t, 3, &mn, ___);
    printf("min = %d, max = %d\\n", mn, mx);

    for (int *p = t; p < t ___ 3; p++) {
        printf("%d ", ___);
    }
    printf("\\n");
    return 0;
}`,
            reponses: [['*'], ['tmp'], ['*min'], ['&x'], ['&mx'], ['+'], ['*p']],
            aides: ['Déréférence a pour lire sa valeur.', 'La valeur sauvegardée au début.', 'Écrit dans l\'entier pointé par min.', 'L\'adresse de x.', 'L\'adresse de mx.', 'Arithmétique de pointeurs : t + 3 est l\'adresse juste après le dernier élément.', 'La valeur pointée par p.']
          },
          quiz: [
            { q: 'Que représente <code>&n</code> ?', options: ['La valeur de n', 'L\'adresse de n', 'Une copie de n'], bonne: 1, explication: '& est l\'opérateur « adresse de ».' },
            { q: 'Si <code>int *p</code> pointe sur <code>t[0]</code>, que désigne <code>*(p + 2)</code> ?', options: ['t[2]', 'L\'adresse de t[2]', 'p + 2 octets'], bonne: 0, explication: 'L\'arithmétique de pointeurs avance par éléments ; t[i] équivaut à *(t + i).' },
            { q: 'Que se passe-t-il si on déréférence un pointeur NULL ?', options: ['On lit 0', 'Erreur de segmentation (plantage)', 'Le compilateur refuse'], bonne: 1, explication: 'L\'adresse 0 n\'est pas accessible : le système tue le programme.' }
          ]
        },
        {
          titre: 'Allocation dynamique : malloc et free',
          theorie: `<p>Les tableaux ont une taille fixée à la compilation. Pour des données dont la taille n'est connue qu'à l'exécution (fichier, saisie, réseau), on demande de la mémoire au système sur le <strong>tas</strong> (heap) avec <code>malloc</code>, et on la rend avec <code>free</code>. En C, personne ne le fera à ta place.</p>
${code('c', `#include <stdlib.h>

int n = 1000;
int *t = malloc(n * sizeof *t);     /* n entiers ; sizeof *t s'adapte si le type change */
if (t == NULL) {                    /* l'allocation peut échouer : toujours vérifier */
    fprintf(stderr, "Memoire insuffisante\\n");
    return 1;
}
for (int i = 0; i < n; i++) t[i] = i * i;
/* ... utilisation ... */
free(t);                            /* libération : obligatoire, une seule fois */
t = NULL;                           /* évite une réutilisation accidentelle */`)}
<h2>Les trois fonctions</h2>
<table><tr><th>Fonction</th><th>Rôle</th></tr>
<tr><td><code>malloc(taille)</code></td><td>alloue <code>taille</code> octets, contenu indéterminé</td></tr>
<tr><td><code>calloc(nb, taille)</code></td><td>alloue et met à zéro</td></tr>
<tr><td><code>realloc(p, nouvelle_taille)</code></td><td>agrandit ou réduit un bloc existant (peut le déplacer : utiliser la valeur renvoyée)</td></tr>
<tr><td><code>free(p)</code></td><td>libère ; <code>free(NULL)</code> est sans effet</td></tr></table>
<h2>Un tableau dynamique qui grandit</h2>
${code('c', `typedef struct {
    int *donnees;
    size_t taille, capacite;
} Vecteur;

int vecteur_ajouter(Vecteur *v, int valeur)
{
    if (v->taille == v->capacite) {
        size_t nouvelle = v->capacite ? v->capacite * 2 : 8;     /* doublement : amortissement O(1) */
        int *tmp = realloc(v->donnees, nouvelle * sizeof *tmp);
        if (tmp == NULL) return -1;        /* l'ancien bloc est toujours valide */
        v->donnees = tmp;
        v->capacite = nouvelle;
    }
    v->donnees[v->taille++] = valeur;
    return 0;
}
void vecteur_liberer(Vecteur *v) { free(v->donnees); v->donnees = NULL; v->taille = v->capacite = 0; }`)}
<p>Ne fais jamais <code>p = realloc(p, …)</code> directement : en cas d'échec, <code>realloc</code> renvoie <code>NULL</code> et tu perds l'adresse de l'ancien bloc (fuite).</p>
<h2>Les erreurs mémoire</h2>
<ul><li><strong>Fuite</strong> (leak) : bloc jamais libéré. Le programme grossit jusqu'à épuiser la mémoire.</li><li><strong>Double free</strong> : libérer deux fois : corruption du tas, exploitable.</li><li><strong>Use after free</strong> : utiliser un bloc libéré : données corrompues, failles.</li><li><strong>Débordement</strong> : écrire au-delà du bloc alloué.</li></ul>
<p>Outils : <code>valgrind ./prog</code> (Linux) détecte tout cela ; <code>gcc -fsanitize=address -g</code> (AddressSanitizer) intègre la détection dans l'exécutable, avec un rapport précis ligne par ligne. Utilise l'un des deux à chaque test.</p>
<h2>Chaînes dynamiques</h2>
${code('c', `char *dupliquer(const char *s)
{
    size_t n = strlen(s) + 1;          /* +1 pour le \\0 */
    char *copie = malloc(n);
    if (copie) memcpy(copie, s, n);
    return copie;                      /* l'appelant doit free() : à documenter ! */
}`)}
<h2>Règles de propriété</h2>
<p>Pour chaque bloc, une seule « propriétaire » responsable du <code>free</code>. Documente qui libère (« la valeur renvoyée doit être libérée par l'appelant »). Libère dans l'ordre inverse de l'allocation. Une fonction qui alloue plusieurs ressources utilise un bloc de nettoyage unique (<code>goto cleanup</code>).</p>
<div class="callout warn"><b>Pile vs tas</b>Les variables locales (pile) sont rapides et automatiques mais limitées (quelques Mo) et meurent avec la fonction. Le tas est vaste et persistant mais manuel. Un gros tableau local (<code>int t[1000000]</code>) fait déborder la pile : alloue-le.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Lecture de nombres en quantité inconnue',
            enonce: `<p>Écris un programme qui lit des entiers sur l'entrée standard (jusqu'à EOF, avec <code>scanf</code>) dans un tableau dynamique qui double de capacité quand il est plein (<code>realloc</code> avec variable temporaire), puis affiche le nombre de valeurs lues, leur somme et libère la mémoire. Teste avec <code>printf "3 5 8 13\\n" | ./prog</code> et vérifie avec <code>valgrind</code> ou <code>-fsanitize=address</code> qu'il n'y a aucune fuite.</p>`,
            depart: `#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *valeurs = NULL;
    size_t taille = 0, capacite = 0;
    int x;
    while (scanf("%d", &x) == 1) {
        /* agrandir si nécessaire, puis stocker */
    }
    /* afficher, libérer */
    return 0;
}`,
            solution: `#include <stdio.h>
#include <stdlib.h>

int main(void)
{
    int *valeurs = NULL;
    size_t taille = 0, capacite = 0;
    int x;
    while (scanf("%d", &x) == 1) {
        if (taille == capacite) {
            size_t nouvelle = capacite ? capacite * 2 : 4;
            int *tmp = realloc(valeurs, nouvelle * sizeof *tmp);
            if (tmp == NULL) {
                fprintf(stderr, "Memoire insuffisante\\n");
                free(valeurs);
                return 1;
            }
            valeurs = tmp;
            capacite = nouvelle;
        }
        valeurs[taille++] = x;
    }
    long somme = 0;
    for (size_t i = 0; i < taille; i++) somme += valeurs[i];
    printf("Lu : %zu valeurs\\n", taille);
    printf("Somme : %ld\\n", somme);
    free(valeurs);
    return 0;
}`,
            sortieAttendue: `Lu : 4 valeurs
Somme : 29`,
            explication: `<p>Le doublement de capacité limite le nombre de <code>realloc</code> à log₂(n). La variable temporaire <code>tmp</code> protège l'ancien bloc en cas d'échec. Un seul <code>free</code> à la fin : valgrind doit afficher « All heap blocks were freed ».</p>`,
            verification: { question: 'Pourquoi ne pas écrire directement <code>valeurs = realloc(valeurs, …)</code> ?', options: ['C\'est plus lent', 'Si realloc échoue et renvoie NULL, on perd l\'adresse de l\'ancien bloc : fuite mémoire', 'realloc n\'accepte pas la même variable'], bonne: 1, explication: 'En cas d\'échec, l\'ancien bloc reste alloué mais inaccessible. La variable temporaire permet de le libérer proprement.' }
          },
          quiz: [
            { q: 'Que renvoie <code>malloc</code> en cas d\'échec ?', options: ['0 octet', 'NULL', 'Une exception'], bonne: 1, explication: 'Toujours tester le résultat avant utilisation.' },
            { q: 'Que fait <code>calloc</code> de plus que <code>malloc</code> ?', options: ['Il met la mémoire à zéro', 'Il est plus rapide', 'Il libère automatiquement'], bonne: 0, explication: 'calloc initialise tous les octets à 0.' },
            { q: 'Qu\'est-ce qu\'un « use after free » ?', options: ['Appeler free deux fois', 'Utiliser un bloc après l\'avoir libéré', 'Oublier free'], bonne: 1, explication: 'Le bloc peut avoir été réattribué : corruption silencieuse et failles de sécurité.' }
          ]
        },
        {
          titre: 'Structures et types personnalisés',
          theorie: `<p>Une <strong>structure</strong> regroupe des données de types différents sous un seul nom : un contact (nom, téléphone), un point (x, y), un enregistrement de fichier. C'est l'outil de modélisation du C, et la base de la programmation orientée objet « à la main ».</p>
${code('c', `#include <stdio.h>
#include <string.h>

struct Point { double x, y; };

typedef struct {               /* typedef : plus besoin d'écrire « struct » */
    char nom[32];
    int quantite;
    double prix;
} Produit;

int main(void)
{
    struct Point p = {1.5, 2.0};
    Produit stylo = {"Stylo bleu", 12, 1.5};
    Produit cahier = {.nom = "Cahier", .prix = 2.2};    /* initialisation désignée (C99) : quantite = 0 */
    stylo.quantite -= 2;                                /* accès par . */
    strcpy(cahier.nom, "Cahier A4");                    /* un tableau membre se copie avec strcpy */
    printf("%s : %d x %.2f\\n", stylo.nom, stylo.quantite, stylo.prix);

    Produit copie = stylo;      /* copie complète (membre à membre), contrairement aux tableaux */
    return 0;
}`)}
<h2>Pointeurs vers structures</h2>
${code('c', `void remise(Produit *p, double pourcentage)
{
    p->prix *= 1 - pourcentage / 100;     /* -> équivaut à (*p).prix */
}
remise(&stylo, 10);

double valeur_stock(const Produit *p)      /* const : lecture seule, et pas de copie des 48 octets */
{
    return p->quantite * p->prix;
}`)}
<p>Passer une structure par valeur la copie entièrement ; pour les grosses structures ou pour la modifier, passe un pointeur (<code>const</code> si lecture seule).</p>
<h2>Tableaux de structures et structures imbriquées</h2>
${code('c', `typedef struct { int jour, mois, annee; } Date;
typedef struct {
    char titre[64];
    Date echeance;
    Produit *lignes;        /* tableau dynamique de produits */
    size_t nb_lignes;
} Commande;

Commande commandes[100];
commandes[0].echeance.annee = 2026;
commandes[0].lignes = malloc(10 * sizeof(Produit));`)}
<h2>Énumérations et unions</h2>
${code('c', `typedef enum { EN_ATTENTE, PAYEE, EXPEDIEE, ANNULEE } Statut;   /* constantes 0, 1, 2, 3 */
Statut s = PAYEE;
switch (s) { case PAYEE: /* ... */ break; default: break; }

typedef union { int entier; double reel; } Valeur;   /* les membres partagent la même mémoire */`)}
<p>Une <code>enum</code> rend le code lisible (<code>PAYEE</code> plutôt que <code>1</code>) ; associée à un <code>switch</code>, gcc avertit si un cas manque (<code>-Wswitch</code>).</p>
<h2>Taille et alignement</h2>
<p><code>sizeof(Produit)</code> peut dépasser la somme des membres : le compilateur insère du <em>remplissage</em> pour aligner les champs (un <code>double</code> sur 8 octets). Ordonne les membres du plus grand au plus petit pour réduire la taille ; ne compte jamais sur une taille calculée à la main, utilise <code>sizeof</code>.</p>
<h2>Modéliser comme en POO</h2>
<p>Un « objet » en C = une structure + des fonctions qui prennent un pointeur vers elle en premier paramètre : <code>produit_creer</code>, <code>produit_afficher</code>, <code>produit_detruire</code>. Le préfixe commun tient lieu d'espace de noms. Cacher la définition de la structure dans le <code>.c</code> et n'exposer qu'un pointeur dans le <code>.h</code> (type opaque) donne une encapsulation stricte.</p>
<div class="callout info"><b>Comparer deux structures</b><code>==</code> ne fonctionne pas sur les structures. Compare membre à membre ; <code>memcmp</code> est piégeux à cause du remplissage.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Fiches produits',
            enonce: `<p>Définis une structure <code>Produit</code> (nom, quantité, prix) et une <code>enum Categorie</code> (<code>ALIMENTAIRE</code>, <code>PAPETERIE</code>) incluse dans la structure. Écris <code>double valeur(const Produit *p)</code>, <code>void appliquer_remise(Produit *p, double pct)</code> et <code>const char *nom_categorie(Categorie c)</code>. Dans <code>main</code>, crée un tableau de deux produits, applique 10 % de remise au second, affiche chaque produit sur une ligne et la valeur totale du stock.</p>`,
            depart: `#include <stdio.h>

typedef enum { ALIMENTAIRE, PAPETERIE } Categorie;

typedef struct {
    /* ... */
} Produit;

int main(void)
{
    return 0;
}`,
            solution: `#include <stdio.h>

typedef enum { ALIMENTAIRE, PAPETERIE } Categorie;

typedef struct {
    char nom[32];
    int quantite;
    double prix;
    Categorie categorie;
} Produit;

double valeur(const Produit *p)
{
    return p->quantite * p->prix;
}

void appliquer_remise(Produit *p, double pct)
{
    p->prix *= 1 - pct / 100;
}

const char *nom_categorie(Categorie c)
{
    switch (c) {
        case ALIMENTAIRE: return "alimentaire";
        case PAPETERIE:   return "papeterie";
    }
    return "inconnue";
}

int main(void)
{
    Produit stock[2] = {
        {"Cafe moulu", 10, 6.5, ALIMENTAIRE},
        {"Cahier A4", 20, 2.0, PAPETERIE},
    };
    appliquer_remise(&stock[1], 10);

    double total = 0;
    for (int i = 0; i < 2; i++) {
        printf("%-12s %3d x %5.2f EUR (%s)\\n", stock[i].nom, stock[i].quantite, stock[i].prix, nom_categorie(stock[i].categorie));
        total += valeur(&stock[i]);
    }
    printf("Total : %.2f EUR\\n", total);
    return 0;
}`,
            sortieAttendue: `Cafe moulu    10 x  6.50 EUR (alimentaire)
Cahier A4     20 x  1.80 EUR (papeterie)
Total : 101.00 EUR`,
            explication: `<p><code>%-12s</code> aligne le nom à gauche sur 12 caractères, <code>%5.2f</code> le prix à droite sur 5. Les fonctions reçoivent un pointeur : <code>const</code> pour la lecture (<code>valeur</code>), non const pour la modification (<code>appliquer_remise</code>).</p>`,
            verification: { question: 'Que signifie <code>p-&gt;prix</code> ?', options: ['Le prix moyen', 'Le membre prix de la structure pointée par p, soit (*p).prix', 'Un pointeur vers prix'], bonne: 1, explication: 'La flèche déréférence le pointeur puis accède au membre.' }
          },
          quiz: [
            { q: 'Que permet <code>typedef struct { … } Produit;</code> ?', options: ['De créer un objet', 'D\'utiliser Produit comme nom de type sans écrire struct', 'D\'hériter'], bonne: 1, explication: 'typedef crée un alias de type.' },
            { q: 'Pourquoi passer une structure par pointeur à une fonction ?', options: ['C\'est obligatoire', 'Pour éviter la copie et pouvoir la modifier', 'Pour la rendre constante'], bonne: 1, explication: 'Par valeur, la structure entière est copiée et les modifications sont perdues.' },
            { q: 'Pourquoi <code>sizeof</code> d\'une structure peut-il dépasser la somme de ses membres ?', options: ['À cause du remplissage d\'alignement', 'À cause du typedef', 'C\'est un bug du compilateur'], bonne: 0, explication: 'Le compilateur aligne les membres sur des adresses multiples de leur taille.' }
          ]
        }
      ]
    },
    {
      titre: 'C avancé', niveau: 'Avancé', description: 'Fichiers, préprocesseur et projets multi-fichiers, structures de données, débogage et comportements indéfinis.',
      lecons: [
        {
          titre: 'Fichiers et entrées/sorties',
          theorie: `<p>En C, un fichier est un flux (<code>FILE *</code>) manipulé par les fonctions de <code>&lt;stdio.h&gt;</code>. <code>stdin</code>, <code>stdout</code> et <code>stderr</code> sont trois flux déjà ouverts : la console suit exactement les mêmes règles qu'un fichier.</p>
${code('c', `#include <stdio.h>

int main(void)
{
    FILE *f = fopen("notes.txt", "w");          /* "r" lecture, "w" écriture (écrase), "a" ajout, "rb"/"wb" binaire */
    if (f == NULL) {
        perror("fopen");                        /* affiche la cause système : No such file or directory... */
        return 1;
    }
    fprintf(f, "%s;%d\\n", "Ana", 15);           /* comme printf, vers un flux */
    fputs("Bob;12\\n", f);
    fclose(f);                                  /* vide le tampon et libère : obligatoire */
    return 0;
}`)}
<h2>Lire ligne par ligne</h2>
${code('c', `FILE *f = fopen("notes.txt", "r");
if (!f) { perror("fopen"); return 1; }

char ligne[256];
while (fgets(ligne, sizeof ligne, f) != NULL) {     /* lit jusqu'au \\n inclus, ou 255 caractères */
    char nom[64]; int note;
    if (sscanf(ligne, "%63[^;];%d", nom, &note) == 2) {   /* %63[^;] : jusqu'à 63 caractères sauf ';' */
        printf("%s a %d\\n", nom, note);
    } else {
        fprintf(stderr, "Ligne invalide : %s", ligne);
    }
}
if (ferror(f)) perror("lecture");
fclose(f);`)}
<p><code>fgets</code> + <code>sscanf</code> est le duo robuste : on lit une ligne bornée, puis on l'analyse. <code>fscanf</code> directement sur le fichier désynchronise facilement sur une ligne mal formée.</p>
<h2>Lecture caractère par caractère et binaire</h2>
${code('c', `int c;
while ((c = fgetc(f)) != EOF) { /* c est un int pour pouvoir contenir EOF (-1) */ }

/* Binaire : écrire/lire des structures telles quelles (non portable entre machines différentes) */
Produit p = {"Stylo", 3, 1.5};
fwrite(&p, sizeof p, 1, f);
fread(&p, sizeof p, 1, f);
fseek(f, 0, SEEK_END); long taille = ftell(f); rewind(f);   /* taille d'un fichier */`)}
<h2>Tampons et erreurs</h2>
<ul><li>Les écritures passent par un tampon : sans <code>fclose</code> ou <code>fflush</code>, elles peuvent être perdues si le programme plante.</li><li><code>stderr</code> n'est pas tamponné : les messages d'erreur y apparaissent immédiatement et ne polluent pas la sortie utile (<code>./prog &gt; resultat.txt</code> garde les erreurs à l'écran).</li><li>Teste toujours <code>fopen</code>, <code>fgets</code>, <code>fread</code>, <code>fclose</code> : le disque peut être plein, le fichier absent, les droits insuffisants.</li></ul>
<h2>Arguments de la ligne de commande</h2>
${code('c', `int main(int argc, char *argv[])
{
    if (argc < 2) {
        fprintf(stderr, "Usage : %s fichier\\n", argv[0]);   /* argv[0] : nom du programme */
        return 2;
    }
    const char *chemin = argv[1];
    /* ... */
}`)}
<h2>Variables d'environnement et sortie</h2>
<p><code>getenv("HOME")</code> lit l'environnement ; <code>exit(code)</code> termine immédiatement (en vidant les tampons) ; <code>EXIT_SUCCESS</code>/<code>EXIT_FAILURE</code> de <code>&lt;stdlib.h&gt;</code> sont les codes portables.</p>
<div class="callout info"><b>Chemins</b>Un chemin relatif dépend du dossier d'où le programme est lancé, pas de l'emplacement de l'exécutable. Pour les fichiers de configuration, construis le chemin à partir de <code>argv[0]</code> ou de <code>HOME</code>.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Compteur de lignes et de mots',
            enonce: `<p>Écris un programme <code>wc_lite</code> qui reçoit un chemin en argument, lit le fichier ligne par ligne avec <code>fgets</code>, compte les lignes, les mots (séquences de caractères non blancs, utilise <code>isspace</code> de <code>&lt;ctype.h&gt;</code>) et les caractères, puis affiche les trois nombres. En cas d'erreur d'ouverture, affiche un message via <code>perror</code> sur <code>stderr</code> et renvoie 1. Teste avec un fichier contenant <code>le chat dort</code> et <code>sur le canape</code> sur deux lignes.</p>`,
            depart: `#include <stdio.h>
#include <ctype.h>

int main(int argc, char *argv[])
{
    if (argc < 2) {
        fprintf(stderr, "Usage : %s fichier\\n", argv[0]);
        return 2;
    }
    /* ... */
    return 0;
}`,
            solution: `#include <stdio.h>
#include <ctype.h>

int main(int argc, char *argv[])
{
    if (argc < 2) {
        fprintf(stderr, "Usage : %s fichier\\n", argv[0]);
        return 2;
    }
    FILE *f = fopen(argv[1], "r");
    if (f == NULL) {
        perror(argv[1]);
        return 1;
    }
    long lignes = 0, mots = 0, caracteres = 0;
    char ligne[1024];
    while (fgets(ligne, sizeof ligne, f) != NULL) {
        int dans_mot = 0;
        for (int i = 0; ligne[i] != '\\0'; i++) {
            caracteres++;
            if (ligne[i] == '\\n') lignes++;
            if (isspace((unsigned char)ligne[i])) {
                dans_mot = 0;
            } else if (!dans_mot) {
                dans_mot = 1;
                mots++;
            }
        }
    }
    fclose(f);
    printf("Lignes : %ld\\nMots : %ld\\nCaracteres : %ld\\n", lignes, mots, caracteres);
    return 0;
}`,
            sortieAttendue: `Lignes : 2
Mots : 6
Caracteres : 27`,
            explication: `<p>Le drapeau <code>dans_mot</code> détecte le début de chaque mot (passage d'un blanc à un non-blanc). Le cast <code>(unsigned char)</code> avant <code>isspace</code> évite un comportement indéfini avec les caractères accentués (valeurs négatives d'un <code>char</code> signé).</p>`,
            verification: { question: 'Pourquoi passer <code>(unsigned char)ligne[i]</code> à <code>isspace</code> ?', options: ['Pour accélérer', 'Parce que les fonctions de ctype attendent une valeur entre 0 et 255 ou EOF : un char signé négatif (accent) serait un comportement indéfini', 'Parce que isspace renvoie un unsigned'], bonne: 1, explication: 'Avec un char signé, « é » (0xE9) vaut -23 : hors du domaine des fonctions ctype.' }
          },
          quiz: [
            { q: 'Que renvoie <code>fopen</code> en cas d\'échec ?', options: ['-1', 'NULL', 'Un fichier vide'], bonne: 1, explication: 'perror affiche alors la raison fournie par le système.' },
            { q: 'Pourquoi <code>fgetc</code> renvoie-t-il un <code>int</code> et non un <code>char</code> ?', options: ['Pour la vitesse', 'Pour pouvoir représenter EOF en plus des 256 valeurs d\'un octet', 'Par tradition'], bonne: 1, explication: 'EOF vaut -1 : il doit se distinguer de tous les caractères possibles.' },
            { q: 'Que risque-t-on sans <code>fclose</code> après des écritures ?', options: ['Rien', 'Perdre les données encore dans le tampon', 'Une erreur de compilation'], bonne: 1, explication: 'fclose vide le tampon vers le disque et libère le descripteur.' }
          ]
        },
        {
          titre: 'Préprocesseur, en-têtes et projets multi-fichiers',
          theorie: `<p>Un vrai programme C est découpé en plusieurs fichiers : des <code>.c</code> (implémentations) et des <code>.h</code> (interfaces). Le <strong>préprocesseur</strong> assemble tout cela par substitution de texte avant la compilation.</p>
<h2>Directives essentielles</h2>
${code('c', `#include <stdio.h>        /* en-tête système : cherché dans les dossiers standard */
#include "produit.h"      /* en-tête du projet : cherché d'abord dans le dossier courant */

#define TAILLE_MAX 100                  /* constante symbolique (substitution textuelle) */
#define CARRE(x) ((x) * (x))            /* macro : parenthèses OBLIGATOIRES, sinon CARRE(a+1) = a+1*a+1 */
#define MIN(a, b) ((a) < (b) ? (a) : (b))   /* attention : MIN(i++, j) incrémente deux fois */

#ifdef DEBUG
#define LOG(fmt, ...) fprintf(stderr, "[%s:%d] " fmt "\\n", __FILE__, __LINE__, __VA_ARGS__)
#else
#define LOG(fmt, ...) ((void)0)
#endif
/* gcc -DDEBUG prog.c active les logs ; sans, ils disparaissent du binaire */`)}
<p>Préfère <code>const int TAILLE_MAX = 100;</code> ou une <code>enum</code> aux <code>#define</code> pour les constantes (typées, visibles au débogueur), et les fonctions <code>static inline</code> aux macros pour les petits calculs.</p>
<h2>Un module : .h + .c</h2>
${code('c', `/* produit.h : interface, ce que les autres fichiers ont le droit de connaître */
#ifndef PRODUIT_H              /* garde d'inclusion : évite la double inclusion */
#define PRODUIT_H

#include <stddef.h>

typedef struct {
    char nom[32];
    int quantite;
    double prix;
} Produit;

double produit_valeur(const Produit *p);
int produit_depuis_ligne(const char *ligne, Produit *p);   /* 0 si succès */

#endif`)}
${code('c', `/* produit.c : implémentation */
#include "produit.h"
#include <stdio.h>

static int valider(const Produit *p)     /* static : privé à ce fichier */
{
    return p->quantite >= 0 && p->prix >= 0;
}

double produit_valeur(const Produit *p) { return p->quantite * p->prix; }

int produit_depuis_ligne(const char *ligne, Produit *p)
{
    if (sscanf(ligne, "%31[^;];%d;%lf", p->nom, &p->quantite, &p->prix) != 3) return -1;
    return valider(p) ? 0 : -1;
}`)}
<p>Règles : un <code>.h</code> ne contient que des déclarations (prototypes, types, <code>extern</code>), jamais de définitions de variables ou de fonctions (sinon erreur « multiple definition » à l'édition de liens). Chaque <code>.c</code> inclut son propre <code>.h</code> en premier pour vérifier la cohérence.</p>
<h2>Compiler plusieurs fichiers</h2>
${code('bash', `gcc -std=c11 -Wall -Wextra -c produit.c      # → produit.o
gcc -std=c11 -Wall -Wextra -c main.c         # → main.o
gcc -o inventaire main.o produit.o           # édition de liens
# ou en une fois : gcc -std=c11 -Wall -Wextra -o inventaire main.c produit.c
# bibliothèque mathématique : ajouter -lm`)}
<h2>Makefile minimal</h2>
${code('bash', `CC = gcc
CFLAGS = -std=c11 -Wall -Wextra -g
OBJ = main.o produit.o

inventaire: $(OBJ)
	$(CC) -o $@ $(OBJ)

%.o: %.c produit.h
	$(CC) $(CFLAGS) -c $<

clean:
	rm -f $(OBJ) inventaire`)}
<p><code>make</code> ne recompile que les fichiers modifiés (il compare les dates). Attention : les lignes de commande commencent par une <strong>tabulation</strong>, pas des espaces. Pour les projets plus grands : CMake.</p>
<h2>Macros prédéfinies et portabilité</h2>
<p><code>__FILE__</code>, <code>__LINE__</code>, <code>__func__</code> pour les messages de débogage ; <code>#if defined(_WIN32)</code> / <code>#elif defined(__linux__)</code> pour le code spécifique à une plateforme ; <code>#pragma once</code> en alternative aux gardes (supporté partout en pratique).</p>
<div class="callout info"><b>Voir le résultat du préprocesseur</b><code>gcc -E main.c</code> affiche le code après substitution : utile pour comprendre une macro récalcitrante.</div>`,
          exercice: {
            type: 'trous', langage: 'c', titre: 'Un en-tête correct',
            enonce: `<p>Complète l'en-tête <code>pile.h</code> d'un module de pile d'entiers et le début de son implémentation. Les trous portent sur la garde d'inclusion, le mot-clé rendant une fonction privée, la macro de taille avec parenthèses et la compilation.</p>`,
            code: `/* pile.h */
#ifndef PILE_H
#___ PILE_H

#define CAPACITE_MAX 64
#define EST_VIDE(p) ((p)->taille ___ 0)

typedef struct {
    int donnees[CAPACITE_MAX];
    int taille;
} Pile;

void pile_init(Pile *p);
int  pile_push(Pile *p, int valeur);   /* 0 si succès, -1 si pleine */
int  pile_pop(Pile *p, int *valeur);   /* 0 si succès, -1 si vide */

#___ /* PILE_H */

/* pile.c */
#include "___"

___ int est_pleine(const Pile *p)   /* privée au fichier */
{
    return p->taille == CAPACITE_MAX;
}

void pile_init(Pile *p) { p->taille = 0; }

/* Compilation : gcc -std=c11 -Wall -Wextra -o demo main.c ___ */`,
            reponses: [['define'], ['=='], ['endif'], ['pile.h'], ['static'], ['pile.c']],
            aides: ['La directive qui définit le symbole de garde.', 'L\'opérateur de comparaison d\'égalité.', 'La directive qui ferme le #ifndef.', 'Le fichier d\'en-tête du module, entre guillemets.', 'Le mot-clé qui limite la visibilité d\'une fonction à son fichier.', 'Le fichier source du module à compiler avec main.c.']
          },
          quiz: [
            { q: 'À quoi sert <code>#ifndef X / #define X / #endif</code> dans un .h ?', options: ['À définir une constante', 'À empêcher l\'inclusion multiple du même en-tête', 'À activer le débogage'], bonne: 1, explication: 'Sans garde, inclure deux fois le .h redéfinirait les types : erreur.' },
            { q: 'Pourquoi <code>#define CARRE(x) x * x</code> est-il faux ?', options: ['Il manque un point-virgule', 'CARRE(a + 1) devient a + 1 * a + 1', 'Les macros ne prennent pas d\'arguments'], bonne: 1, explication: 'Substitution textuelle : il faut parenthéser ((x) * (x)).' },
            { q: 'Que fait <code>gcc -c fichier.c</code> ?', options: ['Compile et lie', 'Produit un fichier objet .o sans édition de liens', 'Vérifie la syntaxe seulement'], bonne: 1, explication: 'Les .o sont ensuite liés ensemble en un exécutable.' }
          ]
        },
        {
          titre: 'Structures de données : liste chaînée et table de hachage',
          theorie: `<p>Avec les structures, les pointeurs et <code>malloc</code>, tu peux construire toutes les structures de données classiques. La <strong>liste chaînée</strong> est la première : chaque élément (nœud) contient une valeur et l'adresse du suivant.</p>
${code('c', `typedef struct Noeud {          /* le nom « struct Noeud » est nécessaire pour l'auto-référence */
    int valeur;
    struct Noeud *suivant;
} Noeud;

Noeud *inserer_tete(Noeud *tete, int valeur)
{
    Noeud *n = malloc(sizeof *n);
    if (n == NULL) return tete;           /* à améliorer : signaler l'erreur */
    n->valeur = valeur;
    n->suivant = tete;
    return n;                             /* la nouvelle tête */
}

void afficher(const Noeud *n)
{
    for (; n != NULL; n = n->suivant) printf("%d -> ", n->valeur);
    printf("NULL\\n");
}

void liberer(Noeud *n)
{
    while (n != NULL) {
        Noeud *suivant = n->suivant;      /* sauvegarder AVANT de libérer */
        free(n);
        n = suivant;
    }
}`)}
<h2>Supprimer un élément</h2>
${code('c', `Noeud *supprimer(Noeud *tete, int valeur)
{
    Noeud **pp = &tete;                    /* pointeur sur le pointeur courant : élégant, sans cas spécial pour la tête */
    while (*pp != NULL && (*pp)->valeur != valeur) {
        pp = &(*pp)->suivant;
    }
    if (*pp != NULL) {
        Noeud *a_supprimer = *pp;
        *pp = a_supprimer->suivant;
        free(a_supprimer);
    }
    return tete;
}`)}
<p>Le double pointeur <code>Noeud **</code> désigne « l'endroit où est stockée l'adresse du nœud courant » : la variable <code>tete</code> ou le champ <code>suivant</code> du précédent. C'est l'idiome qui évite de traiter la tête à part.</p>
<h2>Liste vs tableau</h2>
<table><tr><th></th><th>Tableau dynamique</th><th>Liste chaînée</th></tr>
<tr><td>Accès au i-ème</td><td>O(1)</td><td>O(n)</td></tr>
<tr><td>Insertion en tête</td><td>O(n) (décalage)</td><td>O(1)</td></tr>
<tr><td>Mémoire</td><td>contiguë, cache-friendly</td><td>un bloc par nœud + pointeur</td></tr>
<tr><td>Usage</td><td>presque toujours</td><td>files, insertions fréquentes au milieu, allocateurs</td></tr></table>
<p>En pratique, le tableau dynamique gagne dans la majorité des cas grâce au cache du processeur. Apprends la liste pour comprendre les pointeurs et les structures récursives (arbres).</p>
<h2>Table de hachage</h2>
<p>Pour associer des clés à des valeurs (dictionnaire), on calcule un indice à partir de la clé :</p>
${code('c', `#define NB_SEAUX 256

typedef struct Entree { char *cle; int valeur; struct Entree *suivant; } Entree;
Entree *table[NB_SEAUX];                 /* tableau de listes chaînées (chaînage séparé) */

unsigned hacher(const char *s)           /* djb2 : simple et correct pour des chaînes */
{
    unsigned h = 5381;
    for (; *s; s++) h = h * 33 + (unsigned char)*s;
    return h % NB_SEAUX;
}

Entree *chercher(const char *cle)
{
    for (Entree *e = table[hacher(cle)]; e; e = e->suivant)
        if (strcmp(e->cle, cle) == 0) return e;
    return NULL;
}`)}
<p>Avec une bonne fonction de hachage et un nombre de seaux adapté, recherche et insertion sont en O(1) en moyenne. C'est la structure derrière les dictionnaires Python et les objets JavaScript.</p>
<h2>Arbres binaires de recherche</h2>
<p>Un nœud avec deux enfants (<code>gauche</code>, <code>droite</code>) : plus petit à gauche, plus grand à droite. Recherche et insertion en O(log n) si l'arbre est équilibré ; les parcours sont naturellement récursifs. Les bibliothèques réelles utilisent des variantes équilibrées (AVL, rouge-noir).</p>
<div class="callout info"><b>Testez avec les outils</b>Chaque structure qui alloue doit être validée avec <code>valgrind</code> ou AddressSanitizer : insérer, supprimer, libérer, zéro fuite, zéro accès invalide.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Liste chaînée triée',
            enonce: `<p>Implémente une liste chaînée d'entiers avec <code>inserer_trie(Noeud **tete, int v)</code> qui insère en gardant la liste croissante (utilise un double pointeur), <code>afficher</code>, <code>longueur</code> et <code>liberer</code>. Dans <code>main</code>, insère 5, 2, 9, 2, 7 puis affiche la liste et sa longueur. Vérifie l'absence de fuite avec valgrind ou <code>-fsanitize=address</code>.</p>`,
            depart: `#include <stdio.h>
#include <stdlib.h>

typedef struct Noeud {
    int valeur;
    struct Noeud *suivant;
} Noeud;

int inserer_trie(Noeud **tete, int v)
{
    /* ... */
}

int main(void)
{
    Noeud *liste = NULL;
    int valeurs[] = {5, 2, 9, 2, 7};
    /* ... */
    return 0;
}`,
            solution: `#include <stdio.h>
#include <stdlib.h>

typedef struct Noeud {
    int valeur;
    struct Noeud *suivant;
} Noeud;

int inserer_trie(Noeud **tete, int v)
{
    Noeud *n = malloc(sizeof *n);
    if (n == NULL) return -1;
    n->valeur = v;
    Noeud **pp = tete;
    while (*pp != NULL && (*pp)->valeur < v) {
        pp = &(*pp)->suivant;
    }
    n->suivant = *pp;
    *pp = n;
    return 0;
}

void afficher(const Noeud *n)
{
    for (; n != NULL; n = n->suivant) printf("%d -> ", n->valeur);
    printf("NULL\\n");
}

int longueur(const Noeud *n)
{
    int l = 0;
    for (; n != NULL; n = n->suivant) l++;
    return l;
}

void liberer(Noeud *n)
{
    while (n != NULL) {
        Noeud *suivant = n->suivant;
        free(n);
        n = suivant;
    }
}

int main(void)
{
    Noeud *liste = NULL;
    int valeurs[] = {5, 2, 9, 2, 7};
    for (int i = 0; i < 5; i++) {
        if (inserer_trie(&liste, valeurs[i]) != 0) {
            fprintf(stderr, "Memoire insuffisante\\n");
            liberer(liste);
            return 1;
        }
    }
    afficher(liste);
    printf("Longueur : %d\\n", longueur(liste));
    liberer(liste);
    return 0;
}`,
            sortieAttendue: `2 -> 2 -> 5 -> 7 -> 9 -> NULL
Longueur : 5`,
            explication: `<p><code>pp</code> avance tant que la valeur courante est strictement inférieure à <code>v</code> ; à l'arrêt, <code>*pp</code> est l'emplacement où insérer (la tête, un champ <code>suivant</code>, ou le <code>NULL</code> final). Les doublons (2) sont conservés, insérés après l'existant.</p>`,
            verification: { question: 'Pourquoi <code>inserer_trie</code> prend-elle un <code>Noeud **</code> plutôt qu\'un <code>Noeud *</code> ?', options: ['Pour aller plus vite', 'Pour pouvoir modifier la variable tete de l\'appelant quand l\'insertion se fait en tête', 'Parce que malloc renvoie un double pointeur'], bonne: 1, explication: 'Avec un simple pointeur (copie), une insertion en tête ne serait pas visible par main. Le double pointeur permet aussi de traiter tous les cas uniformément.' }
          },
          quiz: [
            { q: 'Pourquoi sauvegarder <code>n-&gt;suivant</code> avant <code>free(n)</code> ?', options: ['Pour la lisibilité', 'Parce que lire n->suivant après free est un use after free', 'Parce que free efface suivant'], bonne: 1, explication: 'Après free, le contenu du bloc est indéterminé.' },
            { q: 'Complexité de l\'accès au i-ème élément d\'une liste chaînée ?', options: ['O(1)', 'O(log n)', 'O(n)'], bonne: 2, explication: 'Il faut suivre i pointeurs depuis la tête.' },
            { q: 'Que fait une fonction de hachage ?', options: ['Chiffre la clé', 'Transforme une clé en indice de tableau', 'Trie les clés'], bonne: 1, explication: 'Un bon hachage répartit uniformément les clés dans les seaux.' }
          ]
        },
        {
          titre: 'Débogage, comportements indéfinis et bonnes pratiques',
          theorie: `<p>Le C offre une liberté totale, y compris celle de se tromper silencieusement. Un programme C peut « marcher » par hasard puis planter en production. Cette leçon donne les outils et les réflexes pour écrire du C fiable.</p>
<h2>Le comportement indéfini (UB)</h2>
<p>Quand le standard ne définit pas ce qui se passe, <em>tout</em> est permis : résultat aléatoire, plantage, ou code supprimé par l'optimiseur. Les plus fréquents :</p>
<ul><li>Dépassement de tableau (lecture ou écriture).</li><li>Dépassement d'un entier signé (<code>INT_MAX + 1</code>).</li><li>Déréférencer <code>NULL</code>, un pointeur non initialisé ou libéré.</li><li>Variable non initialisée.</li><li>Modifier deux fois une variable sans point de séquence : <code>i = i++ + 1;</code>.</li><li>Décalage de bits négatif ou trop grand ; division par zéro.</li><li>Renvoyer l'adresse d'une variable locale.</li></ul>
<p>Le compilateur suppose que l'UB n'arrive jamais : il peut supprimer un test <code>if (p == NULL)</code> placé <em>après</em> un déréférencement de <code>p</code>. D'où des bugs « impossibles ».</p>
<h2>Les outils</h2>
${code('bash', `gcc -std=c11 -Wall -Wextra -Wpedantic -Wshadow -Wconversion -g -O0 -o prog prog.c   # avertissements maximum
gcc -fsanitize=address,undefined -g -o prog prog.c && ./prog     # ASan + UBSan : détection à l'exécution
valgrind --leak-check=full ./prog                                   # fuites, accès invalides
gdb ./prog                                                          # débogueur : break main, run, next, print x, bt
clang-tidy prog.c -- -std=c11                                       # analyse statique`)}
<p>Avec gdb : <code>break fichier.c:42</code> (point d'arrêt), <code>run</code>, <code>next</code> (ligne suivante), <code>step</code> (entrer dans la fonction), <code>print variable</code>, <code>bt</code> (pile d'appels après un plantage). Compile avec <code>-g</code> pour avoir les numéros de ligne.</p>
<h2>Lire un plantage</h2>
<table><tr><th>Message</th><th>Cause probable</th></tr>
<tr><td>Segmentation fault</td><td>pointeur NULL/invalide, dépassement de tableau, récursion infinie</td></tr>
<tr><td>double free or corruption</td><td>free deux fois, écriture hors d'un bloc malloc</td></tr>
<tr><td>Bus error</td><td>accès mal aligné (rare sur x86)</td></tr>
<tr><td>Floating point exception</td><td>division entière par zéro</td></tr></table>
<h2>Bonnes pratiques</h2>
<ul><li>Initialise toute variable à la déclaration ; mets les pointeurs à <code>NULL</code> après <code>free</code>.</li><li>Vérifie chaque valeur de retour (<code>malloc</code>, <code>fopen</code>, <code>scanf</code>, <code>fgets</code>…).</li><li>Utilise <code>size_t</code> pour les tailles et indices, <code>const</code> partout où c'est possible.</li><li>Préfère <code>snprintf</code>, <code>fgets</code>, <code>strncpy</code> bornés ; jamais <code>gets</code>, <code>strcpy</code> sans contrôle.</li><li>Une fonction = une responsabilité ; pas de variable globale modifiable.</li><li>Compile avec tous les avertissements et corrige-les tous : zéro warning.</li><li>Écris des tests : un fichier <code>test_module.c</code> avec des <code>assert</code> (<code>&lt;assert.h&gt;</code>), exécuté par <code>make test</code>.</li></ul>
${code('c', `#include <assert.h>
#include "pile.h"
int main(void)
{
    Pile p; pile_init(&p);
    assert(EST_VIDE(&p));
    assert(pile_push(&p, 3) == 0);
    int v; assert(pile_pop(&p, &v) == 0 && v == 3);
    assert(pile_pop(&p, &v) == -1);
    return 0;      /* si on arrive ici, tous les tests passent */
}`)}
<h2>Style</h2>
<p>Adopte un style et tiens-t'y : indentation 4 espaces, accolades cohérentes, 80-100 colonnes, noms explicites. <code>clang-format</code> formate automatiquement selon un fichier de configuration.</p>
<div class="callout warn"><b>« Ça marche chez moi »</b>Un programme avec un UB peut fonctionner sur ta machine et planter ailleurs. Seule l'absence de warnings, les sanitizers et les tests donnent une confiance raisonnable.</div>`,
          exercice: {
            type: 'qcm', titre: 'Chasse aux comportements indéfinis',
            enonce: `<p>Parmi ces extraits, lesquels contiennent un comportement indéfini ? (plusieurs réponses)</p>
${code('c', `/* A */ int t[5]; for (int i = 0; i <= 5; i++) t[i] = i;
/* B */ char *s = "abc"; s[0] = 'A';
/* C */ int n; printf("%d", n);
/* D */ unsigned u = 0; u--; printf("%u", u);
/* E */ int *p = malloc(sizeof *p); free(p); free(p);
/* F */ double d = 7 / 2.0;`)}`,
            options: ['A — écriture en t[5] hors du tableau', 'B — modification d\'un littéral de chaîne', 'C — lecture d\'une variable non initialisée', 'D — décrémentation d\'un unsigned à 0', 'E — double free', 'F — division réelle'],
            bonne: [0, 1, 2, 4], multiple: true,
            explication: 'A, B, C et E sont des UB. D est défini : les non signés « bouclent » (u vaut UINT_MAX). F est une division réelle correcte (3.5).'
          },
          quiz: [
            { q: 'Que peut faire un compilateur face à un comportement indéfini ?', options: ['Refuser de compiler', 'N\'importe quoi, y compris supprimer du code', 'Afficher un message à l\'exécution'], bonne: 1, explication: 'Le compilateur suppose que l\'UB n\'arrive jamais et optimise en conséquence.' },
            { q: 'Quelle option gcc détecte les dépassements de tableau à l\'exécution ?', options: ['-O2', '-fsanitize=address', '-Wall'], bonne: 1, explication: 'AddressSanitizer instrumente les accès mémoire et signale la ligne fautive.' },
            { q: 'Quelle commande gdb affiche la pile d\'appels après un plantage ?', options: ['print', 'bt', 'next'], bonne: 1, explication: 'bt (backtrace) remonte la chaîne des appels jusqu\'à main.' }
          ]
        }
      ]
    },
    {
      titre: 'Projet final : gestionnaire d\'inventaire', niveau: 'Avancé', description: 'Un outil en ligne de commande complet : modèle, tableau dynamique, persistance CSV, interface et Makefile.',
      lecons: [
        {
          titre: 'Projet (1/4) : conception et modèle',
          theorie: `<p>Projet final : un <strong>gestionnaire d'inventaire</strong> en ligne de commande. Il charge un fichier CSV de produits, permet d'ajouter, lister, chercher, retirer du stock, et sauvegarde. Trois fichiers : <code>produit.h/.c</code> (modèle), <code>inventaire.h/.c</code> (collection dynamique), <code>main.c</code> (interface).</p>
<h2>Cahier des charges</h2>
<ul><li>Un produit : code (chaîne courte unique), nom, quantité, prix unitaire.</li><li>Commandes : <code>lister</code>, <code>ajouter CODE NOM QTE PRIX</code>, <code>retirer CODE QTE</code>, <code>chercher TEXTE</code>, <code>valeur</code> (valeur totale du stock).</li><li>Fichier <code>stock.csv</code> : une ligne par produit, <code>code;nom;quantite;prix</code>, chargé au démarrage, écrit à la fin.</li><li>Gestion d'erreurs : code inconnu, stock insuffisant, fichier illisible, ligne malformée (ignorée avec avertissement).</li><li>Zéro warning, zéro fuite (valgrind).</li></ul>
<h2>Le module produit</h2>
${code('c', `/* produit.h */
#ifndef PRODUIT_H
#define PRODUIT_H
#include <stdio.h>

#define CODE_MAX 16
#define NOM_MAX 64

typedef struct {
    char code[CODE_MAX];
    char nom[NOM_MAX];
    int quantite;
    double prix;
} Produit;

/* Analyse une ligne CSV "code;nom;qte;prix". Renvoie 0 si succès, -1 sinon. */
int produit_parser(const char *ligne, Produit *p);
/* Écrit le produit au format CSV sur le flux. */
void produit_ecrire(const Produit *p, FILE *f);
/* Affiche une ligne lisible. */
void produit_afficher(const Produit *p);
double produit_valeur(const Produit *p);

#endif`)}
${code('c', `/* produit.c */
#include "produit.h"
#include <string.h>

int produit_parser(const char *ligne, Produit *p)
{
    char fin;                                     /* détecte les caractères en trop */
    int n = sscanf(ligne, "%15[^;];%63[^;];%d;%lf%c", p->code, p->nom, &p->quantite, &p->prix, &fin);
    if (n < 4) return -1;
    if (n == 5 && fin != '\\n') return -1;
    if (p->quantite < 0 || p->prix < 0 || p->code[0] == '\\0') return -1;
    return 0;
}

void produit_ecrire(const Produit *p, FILE *f)
{
    fprintf(f, "%s;%s;%d;%.2f\\n", p->code, p->nom, p->quantite, p->prix);
}

void produit_afficher(const Produit *p)
{
    printf("%-8s %-24s %5d x %8.2f = %9.2f\\n", p->code, p->nom, p->quantite, p->prix, produit_valeur(p));
}

double produit_valeur(const Produit *p) { return p->quantite * p->prix; }`)}
<p>Les largeurs dans <code>sscanf</code> (<code>%15[^;]</code>) sont <em>une de moins</em> que la taille des tableaux : la place du <code>'\\0'</code>. C'est le genre de détail qui sépare un programme C sûr d'une faille.</p>
<h2>Pourquoi ce découpage</h2>
<p><code>produit.c</code> ne sait rien des fichiers ni de l'interface : il se teste isolément (<code>test_produit.c</code> avec des <code>assert</code> sur <code>produit_parser</code>). <code>main.c</code> ne connaît pas le format CSV. Chaque module a une seule raison de changer.</p>
<div class="callout info"><b>Tester le parseur</b>Cas à couvrir : ligne valide, champ manquant, quantité négative, nom trop long (tronqué à 63, le reste fait échouer le parse : c'est voulu), ligne vide.</div>`,
          exercice: {
            type: 'trous', langage: 'c', titre: 'Le parseur CSV',
            enonce: `<p>Complète <code>produit_parser</code> et un test unitaire. Les largeurs de champ doivent laisser la place du terminateur.</p>`,
            code: `#include <assert.h>
#include <stdio.h>
#include <string.h>

#define CODE_MAX 16
#define NOM_MAX 64

typedef struct { char code[CODE_MAX]; char nom[NOM_MAX]; int quantite; double prix; } Produit;

int produit_parser(const char *ligne, Produit *p)
{
    int n = sscanf(ligne, "%___[^;];%___[^;];%d;%___", p->code, p->nom, &p->quantite, &p->prix);
    if (n ___ 4) return -1;
    if (p->quantite < 0 || p->prix < 0) return ___;
    return 0;
}

int main(void)
{
    Produit p;
    assert(produit_parser("CAF01;Cafe moulu;10;6.50\\n", &p) == 0);
    assert(strcmp(p.code, "CAF01") == 0 && p.quantite == 10);
    assert(produit_parser("CAF01;Cafe moulu;10", &p) == ___);
    assert(produit_parser("X;Y;-3;1.0", &p) == -1);
    printf("Tests OK\\n");
    return 0;
}`,
            reponses: [['15'], ['63'], ['lf'], ['!=', '<'], ['-1'], ['-1']],
            aides: ['CODE_MAX - 1 : 15 caractères + le terminateur.', 'NOM_MAX - 1 : 63.', 'Le spécificateur scanf pour un double.', 'Succès seulement si les quatre champs ont été lus.', 'Le code d\'erreur documenté.', 'Il manque le prix : la fonction doit échouer.']
          },
          quiz: [
            { q: 'Pourquoi <code>%15[^;]</code> pour un tableau de 16 ?', options: ['Erreur, il faudrait 16', 'Pour laisser la place du caractère nul', 'Parce que scanf compte à partir de 1'], bonne: 1, explication: 'scanf écrit jusqu\'à 15 caractères puis le \'\\0\' : 16 octets au total.' },
            { q: 'Quel avantage à ce que produit.c ignore les fichiers ?', options: ['Compilation plus rapide', 'Il se teste isolément et n\'a qu\'une raison de changer', 'Aucun, c\'est une convention'], bonne: 1, explication: 'Séparation des responsabilités : modèle, stockage, interface.' },
            { q: 'Que renvoie <code>sscanf</code> ?', options: ['Le nombre de caractères lus', 'Le nombre de conversions réussies', '0 ou 1'], bonne: 1, explication: 'On compare ce nombre au nombre de champs attendus.' }
          ]
        },
        {
          titre: 'Projet (2/4) : la collection dynamique',
          theorie: `<p>L'inventaire est un tableau dynamique de <code>Produit</code> qui grandit à la demande, avec des opérations de recherche, d'ajout et de suppression. C'est le module <code>inventaire</code>.</p>
${code('c', `/* inventaire.h */
#ifndef INVENTAIRE_H
#define INVENTAIRE_H
#include "produit.h"
#include <stddef.h>

typedef struct {
    Produit *items;
    size_t taille;
    size_t capacite;
} Inventaire;

void inventaire_init(Inventaire *inv);
void inventaire_liberer(Inventaire *inv);
int  inventaire_ajouter(Inventaire *inv, const Produit *p);     /* 0 ok, -1 mémoire, -2 code déjà présent */
Produit *inventaire_chercher_code(Inventaire *inv, const char *code);   /* NULL si absent */
int  inventaire_retirer_stock(Inventaire *inv, const char *code, int qte);   /* 0 ok, -1 inconnu, -2 insuffisant */
int  inventaire_supprimer(Inventaire *inv, const char *code);
double inventaire_valeur(const Inventaire *inv);

#endif`)}
<h2>Implémentation</h2>
${code('c', `#include "inventaire.h"
#include <stdlib.h>
#include <string.h>

void inventaire_init(Inventaire *inv) { inv->items = NULL; inv->taille = inv->capacite = 0; }

void inventaire_liberer(Inventaire *inv) { free(inv->items); inventaire_init(inv); }

static int reserver(Inventaire *inv)
{
    if (inv->taille < inv->capacite) return 0;
    size_t nouvelle = inv->capacite ? inv->capacite * 2 : 16;
    Produit *tmp = realloc(inv->items, nouvelle * sizeof *tmp);
    if (tmp == NULL) return -1;
    inv->items = tmp;
    inv->capacite = nouvelle;
    return 0;
}

Produit *inventaire_chercher_code(Inventaire *inv, const char *code)
{
    for (size_t i = 0; i < inv->taille; i++)
        if (strcmp(inv->items[i].code, code) == 0) return &inv->items[i];
    return NULL;
}

int inventaire_ajouter(Inventaire *inv, const Produit *p)
{
    if (inventaire_chercher_code(inv, p->code) != NULL) return -2;
    if (reserver(inv) != 0) return -1;
    inv->items[inv->taille++] = *p;          /* copie de la structure */
    return 0;
}

int inventaire_retirer_stock(Inventaire *inv, const char *code, int qte)
{
    Produit *p = inventaire_chercher_code(inv, code);
    if (p == NULL) return -1;
    if (qte < 0 || p->quantite < qte) return -2;
    p->quantite -= qte;
    return 0;
}

int inventaire_supprimer(Inventaire *inv, const char *code)
{
    Produit *p = inventaire_chercher_code(inv, code);
    if (p == NULL) return -1;
    size_t i = p - inv->items;                                  /* indice par arithmétique de pointeurs */
    memmove(&inv->items[i], &inv->items[i + 1], (inv->taille - i - 1) * sizeof *inv->items);
    inv->taille--;
    return 0;
}`)}
<p><code>memmove</code> (et non <code>memcpy</code>) car les zones source et destination se chevauchent. Les pointeurs renvoyés par <code>chercher_code</code> deviennent invalides après un <code>realloc</code> : ne les conserve pas entre deux ajouts.</p>
<h2>Recherche textuelle et tri</h2>
${code('c', `static int comparer_nom(const void *a, const void *b)
{
    return strcmp(((const Produit *)a)->nom, ((const Produit *)b)->nom);
}
void inventaire_trier(Inventaire *inv) { qsort(inv->items, inv->taille, sizeof *inv->items, comparer_nom); }

/* Recherche insensible à la casse : strcasecmp n'est pas standard ; on compare en minuscules */
int contient_insensible(const char *texte, const char *motif);   /* à écrire avec tolower */`)}
<h2>Tests du module</h2>
<p><code>test_inventaire.c</code> : ajouter deux produits, refuser un doublon, retirer du stock (succès puis insuffisant), supprimer le premier et vérifier que le second est désormais à l'indice 0, libérer. Lancer sous valgrind.</p>
<div class="callout info"><b>Codes de retour</b>Des constantes nommées (<code>enum { INV_OK = 0, INV_MEMOIRE = -1, INV_DOUBLON = -2 }</code>) rendent les appels lisibles. Documente-les dans le .h.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Tests de l\'inventaire',
            enonce: `<p>En reprenant <code>inventaire.c</code> de la leçon (recopie-le), écris <code>test_inventaire.c</code> qui, avec des <code>assert</code> : ajoute « CAF01 » et « THE02 », vérifie que l'ajout d'un doublon renvoie −2, que <code>retirer_stock("CAF01", 3)</code> renvoie 0 puis que retirer 100 renvoie −2, qu'un code inconnu renvoie −1, que la suppression de « CAF01 » place « THE02 » à l'indice 0, puis libère et affiche <code>Tests OK</code>. Compile avec <code>-fsanitize=address</code>.</p>`,
            depart: `#include <assert.h>
#include <stdio.h>
#include <string.h>
#include "inventaire.h"

int main(void)
{
    Inventaire inv;
    inventaire_init(&inv);
    Produit cafe = {"CAF01", "Cafe moulu", 10, 6.5};
    Produit the = {"THE02", "The vert", 5, 4.0};
    /* ... */
    inventaire_liberer(&inv);
    printf("Tests OK\\n");
    return 0;
}`,
            solution: `#include <assert.h>
#include <stdio.h>
#include <string.h>
#include "inventaire.h"

int main(void)
{
    Inventaire inv;
    inventaire_init(&inv);
    Produit cafe = {"CAF01", "Cafe moulu", 10, 6.5};
    Produit the = {"THE02", "The vert", 5, 4.0};

    assert(inventaire_ajouter(&inv, &cafe) == 0);
    assert(inventaire_ajouter(&inv, &the) == 0);
    assert(inv.taille == 2);
    assert(inventaire_ajouter(&inv, &cafe) == -2);

    assert(inventaire_retirer_stock(&inv, "CAF01", 3) == 0);
    assert(inventaire_chercher_code(&inv, "CAF01")->quantite == 7);
    assert(inventaire_retirer_stock(&inv, "CAF01", 100) == -2);
    assert(inventaire_retirer_stock(&inv, "XXX", 1) == -1);

    assert(inventaire_supprimer(&inv, "CAF01") == 0);
    assert(inv.taille == 1);
    assert(strcmp(inv.items[0].code, "THE02") == 0);
    assert(inventaire_supprimer(&inv, "CAF01") == -1);

    assert(inventaire_valeur(&inv) == 20.0);

    inventaire_liberer(&inv);
    assert(inv.items == NULL && inv.taille == 0);
    printf("Tests OK\\n");
    return 0;
}`,
            sortieAttendue: `Tests OK`,
            explication: `<p>Chaque <code>assert</code> documente un contrat du module. Si l'un échoue, le programme s'arrête avec le fichier et la ligne : <code>test_inventaire.c:14: main: Assertion … failed</code>. Les tests doivent passer sous AddressSanitizer sans aucun rapport.</p>`,
            verification: { question: 'Pourquoi ne faut-il pas conserver le pointeur renvoyé par <code>inventaire_chercher_code</code> après un appel à <code>inventaire_ajouter</code> ?', options: ['Parce que la fonction renvoie une copie', 'Parce qu\'un realloc peut déplacer le tableau : le pointeur devient invalide', 'Parce que le produit est supprimé'], bonne: 1, explication: 'realloc peut rendre un nouveau bloc ailleurs en mémoire ; l\'ancienne adresse pointe alors sur de la mémoire libérée.' }
          },
          quiz: [
            { q: 'Pourquoi <code>memmove</code> plutôt que <code>memcpy</code> pour décaler les éléments ?', options: ['memmove est plus rapide', 'Les zones se chevauchent : seul memmove le garantit', 'memcpy ne gère pas les structures'], bonne: 1, explication: 'memcpy sur des zones qui se chevauchent est un comportement indéfini.' },
            { q: 'Comment obtenir l\'indice d\'un élément à partir d\'un pointeur dans le tableau ?', options: ['p / sizeof(Produit)', 'p - inv->items', 'strlen(p)'], bonne: 1, explication: 'La différence de deux pointeurs du même tableau donne le nombre d\'éléments entre eux.' },
            { q: 'Que se passe-t-il si un assert échoue ?', options: ['Un avertissement', 'Le programme s\'arrête en indiquant fichier et ligne', 'Rien en mode normal'], bonne: 1, explication: 'assert appelle abort() ; on le désactive en production avec -DNDEBUG.' }
          ]
        },
        {
          titre: 'Projet (3/4) : persistance CSV',
          theorie: `<p>Le module <code>stockage</code> fait le lien entre le fichier et l'inventaire : charger au démarrage, sauvegarder à la fin, sans jamais perdre les données en cas d'erreur.</p>
${code('c', `/* stockage.h */
#ifndef STOCKAGE_H
#define STOCKAGE_H
#include "inventaire.h"
/* Charge le fichier dans inv. Renvoie le nombre de produits chargés, -1 si le fichier est illisible.
   Les lignes invalides sont ignorées avec un avertissement sur stderr. */
int stockage_charger(const char *chemin, Inventaire *inv);
/* Sauvegarde atomiquement : écrit un fichier temporaire puis le renomme. 0 si succès. */
int stockage_sauvegarder(const char *chemin, const Inventaire *inv);
#endif`)}
${code('c', `/* stockage.c */
#include "stockage.h"
#include <stdio.h>
#include <string.h>

int stockage_charger(const char *chemin, Inventaire *inv)
{
    FILE *f = fopen(chemin, "r");
    if (f == NULL) return -1;
    char ligne[256];
    int charges = 0, numero = 0;
    while (fgets(ligne, sizeof ligne, f) != NULL) {
        numero++;
        if (ligne[0] == '\\n' || ligne[0] == '#') continue;        /* lignes vides et commentaires */
        Produit p;
        if (produit_parser(ligne, &p) != 0) {
            fprintf(stderr, "Ligne %d ignoree : %s", numero, ligne);
            continue;
        }
        int r = inventaire_ajouter(inv, &p);
        if (r == -1) { fclose(f); return -1; }
        if (r == -2) { fprintf(stderr, "Ligne %d : code %s en double, ignoree\\n", numero, p.code); continue; }
        charges++;
    }
    fclose(f);
    return charges;
}

int stockage_sauvegarder(const char *chemin, const Inventaire *inv)
{
    char tmp[512];
    snprintf(tmp, sizeof tmp, "%s.tmp", chemin);
    FILE *f = fopen(tmp, "w");
    if (f == NULL) return -1;
    fprintf(f, "# code;nom;quantite;prix\\n");
    for (size_t i = 0; i < inv->taille; i++) produit_ecrire(&inv->items[i], f);
    if (fclose(f) != 0) { remove(tmp); return -1; }     /* erreur d'écriture (disque plein) */
    if (rename(tmp, chemin) != 0) { remove(tmp); return -1; }
    return 0;
}`)}
<h2>Pourquoi écrire dans un fichier temporaire ?</h2>
<p>Si le programme plante ou si le disque est plein pendant l'écriture directe de <code>stock.csv</code>, le fichier est tronqué : toutes les données sont perdues. En écrivant <code>stock.csv.tmp</code> puis en renommant, le remplacement est <em>atomique</em> sur la plupart des systèmes : on a soit l'ancienne version, soit la nouvelle, jamais un mélange. C'est le motif standard de tout logiciel qui sauvegarde.</p>
<h2>Un fichier absent n'est pas une erreur</h2>
<p>Au premier lancement, <code>stock.csv</code> n'existe pas. <code>main</code> distingue ce cas (<code>errno == ENOENT</code> après <code>fopen</code>) d'un vrai problème de droits :</p>
${code('c', `#include <errno.h>
int n = stockage_charger(chemin, &inv);
if (n < 0 && errno != ENOENT) { perror(chemin); return 1; }
if (n < 0) printf("Nouvel inventaire (fichier absent)\\n");`)}
<h2>Format CSV : les pièges</h2>
<ul><li>Un nom contenant <code>;</code> casserait le format. Soit on l'interdit à la saisie, soit on gère les guillemets (RFC 4180). Pour ce projet, on l'interdit et on le vérifie dans <code>produit_parser</code>.</li><li>Le séparateur décimal : <code>printf("%.2f")</code> écrit un point ; sous une locale française, <code>setlocale</code> pourrait écrire une virgule. On ne touche pas à la locale dans ce projet.</li><li>Encodage : UTF-8 partout ; les largeurs de <code>%-24s</code> comptent des octets, pas des caractères accentués. Acceptable ici.</li></ul>
<h2>Tester la persistance</h2>
<p>Écrire un inventaire dans un fichier temporaire, le recharger dans un second inventaire, vérifier l'égalité champ à champ, et tester une ligne corrompue au milieu du fichier (elle doit être ignorée, les autres chargées).</p>
<div class="callout info"><b>SQLite comme suite</b>Pour un vrai outil, la bibliothèque SQLite (un seul fichier C, domaine public) remplace avantageusement le CSV : transactions, requêtes, robustesse. Le module stockage est le seul à changer.</div>`,
          exercice: {
            type: 'sortie', langage: 'c', titre: 'Aller-retour fichier',
            enonce: `<p>Écris <code>test_stockage.c</code> qui crée un inventaire de deux produits, le sauvegarde dans <code>test_stock.csv</code>, le recharge dans un second inventaire, vérifie par <code>assert</code> le nombre chargé (2) et l'égalité des codes, quantités et prix, puis ajoute manuellement une ligne corrompue (<code>"ligne;cassee\\n"</code>) à la fin du fichier avec <code>fopen(…, "a")</code>, recharge dans un troisième inventaire et vérifie qu'on obtient toujours 2 produits. Supprime le fichier avec <code>remove</code> et affiche <code>Tests OK</code>.</p>`,
            depart: `#include <assert.h>
#include <stdio.h>
#include <string.h>
#include "stockage.h"

int main(void)
{
    const char *chemin = "test_stock.csv";
    Inventaire a, b, c;
    inventaire_init(&a); inventaire_init(&b); inventaire_init(&c);
    /* ... */
    printf("Tests OK\\n");
    return 0;
}`,
            solution: `#include <assert.h>
#include <stdio.h>
#include <string.h>
#include "stockage.h"

int main(void)
{
    const char *chemin = "test_stock.csv";
    Inventaire a, b, c;
    inventaire_init(&a); inventaire_init(&b); inventaire_init(&c);

    Produit p1 = {"CAF01", "Cafe moulu", 10, 6.5};
    Produit p2 = {"THE02", "The vert", 5, 4.0};
    assert(inventaire_ajouter(&a, &p1) == 0);
    assert(inventaire_ajouter(&a, &p2) == 0);
    assert(stockage_sauvegarder(chemin, &a) == 0);

    assert(stockage_charger(chemin, &b) == 2);
    for (size_t i = 0; i < 2; i++) {
        assert(strcmp(a.items[i].code, b.items[i].code) == 0);
        assert(a.items[i].quantite == b.items[i].quantite);
        assert(a.items[i].prix == b.items[i].prix);
    }

    FILE *f = fopen(chemin, "a");
    assert(f != NULL);
    fputs("ligne;cassee\\n", f);
    fclose(f);
    assert(stockage_charger(chemin, &c) == 2);

    inventaire_liberer(&a); inventaire_liberer(&b); inventaire_liberer(&c);
    remove(chemin);
    printf("Tests OK\\n");
    return 0;
}`,
            sortieAttendue: `Ligne 4 ignoree : ligne;cassee
Tests OK`,
            explication: `<p>La ligne 4 (après l'en-tête commenté et les deux produits) est rejetée par <code>produit_parser</code> et signalée sur <code>stderr</code> ; les deux produits valides sont chargés. Le fichier temporaire est supprimé pour laisser le dossier propre.</p>`,
            verification: { question: 'Pourquoi sauvegarder dans <code>stock.csv.tmp</code> puis renommer, plutôt qu\'écrire directement dans <code>stock.csv</code> ?', options: ['Pour aller plus vite', 'Pour ne jamais laisser un fichier tronqué en cas de plantage ou de disque plein', 'Parce que fopen en "w" est interdit sur un fichier existant'], bonne: 1, explication: 'rename est atomique : le fichier final est soit l\'ancien, soit le nouveau, jamais un mélange.' }
          },
          quiz: [
            { q: 'Que vaut <code>errno</code> après un <code>fopen</code> échoué sur un fichier absent ?', options: ['0', 'ENOENT', 'EOF'], bonne: 1, explication: 'ENOENT = « No such file or directory ». On le distingue d\'un refus de permission (EACCES).' },
            { q: 'Pourquoi vérifier le retour de <code>fclose</code> en écriture ?', options: ['Ce n\'est pas nécessaire', 'Le vidage du tampon peut échouer (disque plein)', 'Pour fermer deux fois'], bonne: 1, explication: 'L\'erreur d\'écriture peut n\'apparaître qu\'au moment du vidage final.' },
            { q: 'Que fait le programme face à une ligne CSV invalide ?', options: ['Il s\'arrête', 'Il l\'ignore avec un avertissement et continue', 'Il la corrige'], bonne: 1, explication: 'Robustesse : une ligne corrompue ne doit pas rendre tout le fichier inutilisable.' }
          ]
        },
        {
          titre: 'Projet (4/4) : interface, Makefile et livraison',
          theorie: `<p>Dernière pièce : <code>main.c</code>, qui interprète la ligne de commande, appelle les modules et affiche les résultats. Puis le <code>Makefile</code> pour tout assembler et tester.</p>
${code('c', `/* main.c */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include "stockage.h"

static const char *FICHIER = "stock.csv";

static void usage(const char *prog)
{
    fprintf(stderr,
        "Usage : %s commande [arguments]\\n"
        "  lister\\n  ajouter CODE NOM QTE PRIX\\n  retirer CODE QTE\\n  supprimer CODE\\n  chercher TEXTE\\n  valeur\\n", prog);
}

static int cmd_ajouter(Inventaire *inv, int argc, char *argv[])
{
    if (argc != 6) return 2;
    Produit p;
    snprintf(p.code, sizeof p.code, "%s", argv[2]);
    snprintf(p.nom, sizeof p.nom, "%s", argv[3]);
    char *fin;
    p.quantite = (int)strtol(argv[4], &fin, 10);          /* strtol : conversion avec contrôle */
    if (*fin != '\\0' || p.quantite < 0) { fprintf(stderr, "Quantite invalide\\n"); return 1; }
    p.prix = strtod(argv[5], &fin);
    if (*fin != '\\0' || p.prix < 0) { fprintf(stderr, "Prix invalide\\n"); return 1; }
    if (strchr(p.nom, ';')) { fprintf(stderr, "Le nom ne doit pas contenir ';'\\n"); return 1; }
    int r = inventaire_ajouter(inv, &p);
    if (r == -2) { fprintf(stderr, "Code %s deja present\\n", p.code); return 1; }
    if (r == -1) { fprintf(stderr, "Memoire insuffisante\\n"); return 1; }
    printf("Ajoute : "); produit_afficher(&p);
    return 0;
}

int main(int argc, char *argv[])
{
    if (argc < 2) { usage(argv[0]); return 2; }
    Inventaire inv;
    inventaire_init(&inv);
    int n = stockage_charger(FICHIER, &inv);
    if (n < 0 && errno != ENOENT) { perror(FICHIER); return 1; }

    int code = 0, modifie = 0;
    const char *cmd = argv[1];
    if (strcmp(cmd, "lister") == 0) {
        for (size_t i = 0; i < inv.taille; i++) produit_afficher(&inv.items[i]);
    } else if (strcmp(cmd, "ajouter") == 0) {
        code = cmd_ajouter(&inv, argc, argv); modifie = (code == 0);
    } else if (strcmp(cmd, "valeur") == 0) {
        printf("Valeur du stock : %.2f\\n", inventaire_valeur(&inv));
    } /* retirer, supprimer, chercher : même schéma */
    else { usage(argv[0]); code = 2; }

    if (modifie && stockage_sauvegarder(FICHIER, &inv) != 0) { perror("sauvegarde"); code = 1; }
    inventaire_liberer(&inv);
    return code;
}`)}
<p><code>strtol</code>/<code>strtod</code> remplacent <code>atoi</code> : ils indiquent où la conversion s'est arrêtée, ce qui permet de rejeter « 12abc ». La sauvegarde n'a lieu que si une commande a modifié l'inventaire et a réussi.</p>
<h2>Makefile complet</h2>
${code('bash', `CC      = gcc
CFLAGS  = -std=c11 -Wall -Wextra -Wpedantic -g
SRC     = produit.c inventaire.c stockage.c
OBJ     = $(SRC:.c=.o)
TESTS   = test_produit test_inventaire test_stockage

all: inventaire

inventaire: main.o $(OBJ)
	$(CC) $(CFLAGS) -o $@ $^

test_%: test_%.c $(OBJ)
	$(CC) $(CFLAGS) -fsanitize=address -o $@ $^

test: $(TESTS)
	@for t in $(TESTS); do ./$$t || exit 1; done
	@echo "Tous les tests passent"

%.o: %.c %.h
	$(CC) $(CFLAGS) -c $<

clean:
	rm -f *.o inventaire $(TESTS) test_stock.csv

.PHONY: all test clean`)}
<p><code>make</code> construit l'outil, <code>make test</code> compile et lance les trois suites sous AddressSanitizer, <code>make clean</code> nettoie. <code>$@</code> = la cible, <code>$^</code> = toutes les dépendances, <code>$&lt;</code> = la première.</p>
<h2>Utilisation</h2>
${code('bash', `./inventaire ajouter CAF01 "Cafe moulu" 10 6.50
./inventaire ajouter THE02 "The vert" 5 4
./inventaire retirer CAF01 3
./inventaire lister
./inventaire valeur
cat stock.csv`)}
<h2>Pour aller plus loin</h2>
<ul><li>Mode interactif (boucle de commandes avec <code>fgets</code>).</li><li>Tri et filtres (<code>qsort</code>, options <code>--tri=nom</code>).</li><li>Historique des mouvements dans un second fichier.</li><li>Remplacer le CSV par SQLite.</li><li>Un <code>getopt</code> pour les options longues ; des pages de manuel.</li></ul>
<div class="callout ok"><b>Parcours terminé</b>Tu as écrit un programme C complet, modulaire, testé, sans fuite : modèle, collection dynamique, persistance atomique, interface. C'est la base de tout logiciel système. Le parcours C++ reprend ces idées avec les outils du langage moderne.</div>`,
          exercice: {
            type: 'trous', langage: 'c', titre: 'La commande retirer',
            enonce: `<p>Complète la commande <code>retirer CODE QTE</code> de <code>main.c</code> : conversion contrôlée, appel du module, messages d'erreur, et signalement de la modification pour déclencher la sauvegarde.</p>`,
            code: `static int cmd_retirer(Inventaire *inv, int argc, char *argv[])
{
    if (argc != ___) return 2;                 /* prog retirer CODE QTE */
    char *fin;
    long qte = strtol(argv[3], &fin, ___);
    if (*fin != '\\0' || qte < 0) { fprintf(stderr, "Quantite invalide\\n"); return 1; }
    int r = inventaire_retirer_stock(inv, argv[___], (int)qte);
    if (r == -1) { fprintf(stderr, "Code inconnu : %s\\n", argv[2]); return 1; }
    if (r == ___) { fprintf(stderr, "Stock insuffisant\\n"); return 1; }
    printf("Retire %ld unite(s) de %s\\n", qte, argv[2]);
    return 0;
}

/* dans main : */
else if (strcmp(cmd, "retirer") == 0) {
    code = cmd_retirer(&inv, argc, argv);
    modifie = (code ___ 0);
}`,
            reponses: [['4'], ['10'], ['2'], ['-2'], ['==']],
            aides: ['prog, retirer, CODE, QTE : quatre arguments.', 'La base décimale.', 'L\'indice de CODE dans argv.', 'Le code renvoyé par le module pour un stock insuffisant.', 'On ne sauvegarde que si la commande a réussi.']
          },
          quiz: [
            { q: 'Pourquoi <code>strtol</code> plutôt que <code>atoi</code> ?', options: ['Il est plus rapide', 'Il permet de détecter une conversion incomplète ou invalide', 'atoi n\'existe plus'], bonne: 1, explication: 'atoi("12abc") renvoie 12 sans se plaindre ; strtol indique où il s\'est arrêté.' },
            { q: 'Que signifie <code>$^</code> dans une règle Makefile ?', options: ['La cible', 'Toutes les dépendances', 'La première dépendance'], bonne: 1, explication: '$@ est la cible, $< la première dépendance, $^ toutes.' },
            { q: 'Quand le programme sauvegarde-t-il le fichier ?', options: ['À chaque lancement', 'Seulement si une commande a modifié l\'inventaire avec succès', 'Jamais automatiquement'], bonne: 1, explication: 'Éviter d\'écrire inutilement réduit les risques et préserve le fichier en cas d\'erreur.' }
          ]
        }
      ]
    }
  ]
};
