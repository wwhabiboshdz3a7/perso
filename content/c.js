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
