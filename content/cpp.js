import { code } from './_outils.js';

export default {
  description: 'Le C++ ajoute au C les classes, la gestion automatique des ressources (RAII), les templates et une bibliothèque standard puissante. C\'est le langage des moteurs de jeu, des navigateurs, de la finance et du calcul haute performance.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Ce parcours suppose les bases du C (types, pointeurs, mémoire) : suis d'abord le parcours C si besoin. Compile avec <code>g++ -std=c++17 -Wall -Wextra -o prog prog.cpp</code> (ou <code>clang++</code>). Comme pour le C, tu écris le programme dans l'éditeur, tu le compiles chez toi, puis tu compares avec la solution et tu réponds à la question de vérification.</p>`,
  modules: [
    {
      titre: 'Du C au C++', niveau: 'Intermédiaire', description: 'Flux, chaînes, références, classes et RAII : ce qui change tout.',
      lecons: [
        {
          titre: 'Premier programme C++ et différences avec le C',
          theorie: `<p>Le C++ est un surensemble (presque) du C : ton code C compile, mais le C++ idiomatique s'écrit autrement. Dès le premier programme, trois différences : les flux d'entrée/sortie, <code>std::string</code> et les espaces de noms.</p>
${code('cpp', `#include <iostream>     // std::cout, std::cin
#include <string>       // std::string

int main()
{
    std::string prenom;
    std::cout << "Votre prenom ? ";
    std::cin >> prenom;                               // lecture d'un mot (sans risque de dépassement)
    std::cout << "Bonjour, " << prenom << " !\\n";     // chaînage avec <<
    return 0;                                         // facultatif dans main en C++
}`)}
<p><code>std::cout &lt;&lt; x</code> choisit le format selon le <em>type</em> de <code>x</code> : plus de <code>%d</code>/<code>%f</code> à faire correspondre. <code>std::</code> est l'espace de noms de la bibliothèque standard ; évite <code>using namespace std;</code> dans les fichiers d'en-tête (pollution), tolérable dans un petit <code>.cpp</code>.</p>
<h2>std::string : enfin une vraie chaîne</h2>
${code('cpp', `std::string s = "Lumio";
s += " Academy";                 // concaténation
s.size();                        // 13
s.substr(0, 5);                  // "Lumio"
s.find("Aca");                   // 6 (std::string::npos si absent)
s == "Lumio Academy";            // comparaison de contenu
s[0] = 'l';                      // accès par indice
std::string ligne;
std::getline(std::cin, ligne);   // lecture d'une ligne entière, avec espaces
std::to_string(42); std::stoi("42"); std::stod("3.14");   // conversions`)}
<p>La mémoire est gérée automatiquement : pas de <code>malloc</code>, pas de <code>'\\0'</code>, pas de dépassement de tampon.</p>
<h2>Déclarations et types</h2>
${code('cpp', `auto n = 42;                 // type déduit : int
auto prix = 19.99;           // double
const double TVA = 0.2;      // const : vraie constante (utilisable comme taille de tableau)
bool actif = true;           // bool natif
int x{5};                    // initialisation uniforme : refuse les conversions avec perte (int y{3.5} : erreur)
nullptr                      // remplace NULL : typé, sûr`)}
<h2>Références</h2>
<p>Une référence est un alias d'une variable existante : plus simple et plus sûre qu'un pointeur pour passer des arguments.</p>
${code('cpp', `void doubler(int &x) { x *= 2; }           // modifie l'original, sans & à l'appel
void afficher(const std::string &s);       // const & : pas de copie, pas de modification : LE passage par défaut
int n = 5; doubler(n);                     // n vaut 10`)}
<h2>Ce que le C++ ajoute, en résumé</h2>
<table><tr><th>Besoin</th><th>C</th><th>C++</th></tr>
<tr><td>Chaînes</td><td><code>char[]</code> + <code>&lt;string.h&gt;</code></td><td><code>std::string</code></td></tr>
<tr><td>Tableaux dynamiques</td><td><code>malloc/realloc</code></td><td><code>std::vector</code></td></tr>
<tr><td>Libération</td><td><code>free</code> manuel</td><td>automatique (destructeurs, RAII)</td></tr>
<tr><td>Erreurs</td><td>codes de retour</td><td>exceptions, <code>std::optional</code></td></tr>
<tr><td>Généricité</td><td><code>void *</code>, macros</td><td>templates</td></tr>
<tr><td>Modélisation</td><td>struct + fonctions</td><td>classes, héritage, polymorphisme</td></tr></table>
<h2>Compilation</h2>
${code('bash', `g++ -std=c++17 -Wall -Wextra -o bonjour bonjour.cpp && ./bonjour
# C++20 : -std=c++20 (modules, concepts, ranges)`)}
<div class="callout info"><b>Conseil</b>Oublie <code>printf</code>, <code>char *</code>, <code>malloc</code> et les tableaux C : en C++ moderne, ils n'apparaissent que dans du code hérité ou des interfaces système.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Fiche de présentation',
            enonce: `<p>Écris un programme qui lit sur l'entrée standard une ligne contenant un nom complet (avec <code>std::getline</code>), puis un entier (âge), et affiche <code>Nom : …</code>, <code>Longueur du nom : …</code>, <code>Majeur : oui/non</code> et <code>Initiale : …</code>. Teste avec <code>printf "Ana Sow\\n34\\n" | ./prog</code>. Une fonction <code>bool est_majeur(int age)</code> et une fonction <code>void afficher(const std::string &amp;nom, int age)</code> sont attendues.</p>`,
            depart: `#include <iostream>
#include <string>

bool est_majeur(int age)
{
    // ...
}

void afficher(const std::string &nom, int age)
{
    // ...
}

int main()
{
    std::string nom;
    int age = 0;
    // lecture
    afficher(nom, age);
}`,
            solution: `#include <iostream>
#include <string>

bool est_majeur(int age)
{
    return age >= 18;
}

void afficher(const std::string &nom, int age)
{
    std::cout << "Nom : " << nom << "\\n";
    std::cout << "Longueur du nom : " << nom.size() << "\\n";
    std::cout << "Majeur : " << (est_majeur(age) ? "oui" : "non") << "\\n";
    std::cout << "Initiale : " << nom[0] << "\\n";
}

int main()
{
    std::string nom;
    int age = 0;
    std::getline(std::cin, nom);
    std::cin >> age;
    afficher(nom, age);
}`,
            sortieAttendue: `Nom : Ana Sow
Longueur du nom : 7
Majeur : oui
Initiale : A`,
            explication: `<p><code>std::getline</code> lit la ligne entière, espaces compris, là où <code>std::cin &gt;&gt; nom</code> s'arrêterait au premier espace. La référence constante <code>const std::string &amp;</code> évite de copier la chaîne.</p>`,
            verification: { question: 'Pourquoi passer <code>nom</code> en <code>const std::string &amp;</code> plutôt qu\'en <code>std::string</code> ?', options: ['Pour pouvoir le modifier', 'Pour éviter une copie tout en garantissant qu\'il ne sera pas modifié', 'Parce que std::string ne se copie pas'], bonne: 1, explication: 'La référence évite la copie (coûteuse pour de longues chaînes) ; const documente et impose la lecture seule.' }
          },
          quiz: [
            { q: 'Comment <code>std::cout</code> sait-il afficher un double ou un int ?', options: ['Avec %d ou %f', 'Par surcharge de l\'opérateur << selon le type', 'Il affiche toujours du texte'], bonne: 1, explication: 'L\'opérateur << est surchargé pour chaque type : plus d\'erreur de spécificateur.' },
            { q: 'Que fait <code>int &amp;r = n;</code> ?', options: ['Copie n dans r', 'Crée un alias r de la variable n', 'Crée un pointeur'], bonne: 1, explication: 'Toute modification de r modifie n ; une référence ne peut pas être nulle ni réassignée.' },
            { q: 'Lequel est préférable en C++ moderne ?', options: ['NULL', 'nullptr', '0'], bonne: 1, explication: 'nullptr a un type dédié qui évite les ambiguïtés de surcharge.' }
          ]
        },
        {
          titre: 'Classes et objets',
          theorie: `<p>Une <strong>classe</strong> regroupe des données (attributs) et les fonctions qui les manipulent (méthodes), avec un contrôle d'accès. Là où le C expose des structures et des fonctions libres, le C++ permet de <em>garantir</em> les invariants : un compte ne peut pas avoir un solde incohérent si seules ses méthodes peuvent le modifier.</p>
${code('cpp', `#include <iostream>
#include <string>
#include <stdexcept>

class CompteBancaire {
public:                                           // interface : accessible à tous
    CompteBancaire(std::string titulaire, double solde = 0)   // constructeur
        : titulaire_(std::move(titulaire)), solde_(solde)       // liste d'initialisation : préférable à l'affectation
    {
        if (solde < 0) throw std::invalid_argument("solde initial negatif");
    }

    void deposer(double montant)
    {
        if (montant <= 0) throw std::invalid_argument("montant invalide");
        solde_ += montant;
    }

    bool retirer(double montant)
    {
        if (montant <= 0 || montant > solde_) return false;
        solde_ -= montant;
        return true;
    }

    double solde() const { return solde_; }        // const : ne modifie pas l'objet, appelable sur un const
    const std::string &titulaire() const { return titulaire_; }

private:                                          // implémentation : accessible seulement aux méthodes
    std::string titulaire_;
    double solde_;
};

int main()
{
    CompteBancaire c("Ana", 100);
    c.deposer(50);
    std::cout << c.titulaire() << " : " << c.solde() << " EUR\\n";    // Ana : 150 EUR
}`)}
<h2>Conventions</h2>
<ul><li><code>struct</code> et <code>class</code> sont identiques sauf l'accès par défaut (public pour struct). Convention : <code>struct</code> pour des agrégats de données sans invariant, <code>class</code> dès qu'il y a de la logique.</li><li>Attributs privés avec un suffixe <code>_</code> (ou préfixe <code>m_</code>), accesseurs seulement si nécessaires. Un getter + setter pour chaque attribut est un signe de mauvaise conception : expose des <em>opérations</em> (<code>deposer</code>), pas des données.</li><li>Marque <code>const</code> toute méthode qui ne modifie pas l'objet.</li></ul>
<h2>Séparer déclaration et définition</h2>
${code('cpp', `// compte.hpp
class CompteBancaire {
public:
    explicit CompteBancaire(std::string titulaire, double solde = 0);   // explicit : pas de conversion implicite
    void deposer(double montant);
    double solde() const;
private:
    std::string titulaire_;
    double solde_;
};

// compte.cpp
#include "compte.hpp"
CompteBancaire::CompteBancaire(std::string titulaire, double solde) : titulaire_(std::move(titulaire)), solde_(solde) {}
void CompteBancaire::deposer(double montant) { solde_ += montant; }
double CompteBancaire::solde() const { return solde_; }`)}
<h2>Membres statiques et constantes</h2>
${code('cpp', `class Compteur {
public:
    Compteur() { ++nb_instances_; }
    static int nb_instances() { return nb_instances_; }     // appelable sans objet : Compteur::nb_instances()
    static constexpr int MAX = 100;                          // constante de classe
private:
    static inline int nb_instances_ = 0;                     // partagé par toutes les instances (C++17)
};`)}
<h2>Surcharge d'opérateurs</h2>
${code('cpp', `struct Vec2 {
    double x, y;
    Vec2 operator+(const Vec2 &o) const { return {x + o.x, y + o.y}; }
    bool operator==(const Vec2 &o) const { return x == o.x && y == o.y; }
};
std::ostream &operator<<(std::ostream &os, const Vec2 &v) { return os << "(" << v.x << ", " << v.y << ")"; }
Vec2 a{1, 2}, b{3, 4};
std::cout << a + b << "\\n";      // (4, 6)`)}
<p>Surcharge seulement quand le sens est évident (vecteurs, nombres, affichage). <code>operator+</code> sur un <code>Compte</code> ne veut rien dire.</p>
<div class="callout info"><b>Invariant</b>Le mot clé de la conception objet : une propriété toujours vraie entre deux appels de méthodes (solde ≥ 0). Le constructeur l'établit, chaque méthode le préserve, <code>private</code> empêche de le casser de l'extérieur.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Classe Rectangle',
            enonce: `<p>Écris une classe <code>Rectangle</code> avec un constructeur <code>(double largeur, double hauteur)</code> qui lève <code>std::invalid_argument</code> si une dimension est ≤ 0, des méthodes const <code>aire()</code>, <code>perimetre()</code>, <code>est_carre()</code>, une méthode <code>agrandir(double facteur)</code>, et un <code>operator&lt;&lt;</code> affichant <code>Rectangle 3x4</code>. Dans <code>main</code>, crée un rectangle 3×4, affiche-le avec son aire et son périmètre, agrandis-le ×2, réaffiche, puis tente de créer un rectangle 0×1 dans un <code>try/catch</code> et affiche le message de l'exception.</p>`,
            depart: `#include <iostream>
#include <stdexcept>

class Rectangle {
public:
    // ...
private:
    double largeur_, hauteur_;
};

int main()
{
    // ...
}`,
            solution: `#include <iostream>
#include <stdexcept>

class Rectangle {
public:
    Rectangle(double largeur, double hauteur) : largeur_(largeur), hauteur_(hauteur)
    {
        if (largeur <= 0 || hauteur <= 0) throw std::invalid_argument("dimensions positives requises");
    }
    double aire() const { return largeur_ * hauteur_; }
    double perimetre() const { return 2 * (largeur_ + hauteur_); }
    bool est_carre() const { return largeur_ == hauteur_; }
    void agrandir(double facteur) { largeur_ *= facteur; hauteur_ *= facteur; }
    friend std::ostream &operator<<(std::ostream &os, const Rectangle &r)
    {
        return os << "Rectangle " << r.largeur_ << "x" << r.hauteur_;
    }
private:
    double largeur_, hauteur_;
};

int main()
{
    Rectangle r(3, 4);
    std::cout << r << " aire=" << r.aire() << " perimetre=" << r.perimetre() << "\\n";
    r.agrandir(2);
    std::cout << r << " aire=" << r.aire() << "\\n";
    try {
        Rectangle invalide(0, 1);
    } catch (const std::invalid_argument &e) {
        std::cout << "Erreur : " << e.what() << "\\n";
    }
}`,
            sortieAttendue: `Rectangle 3x4 aire=12 perimetre=14
Rectangle 6x8 aire=48
Erreur : dimensions positives requises`,
            explication: `<p>Le constructeur établit l'invariant (dimensions positives) ; <code>friend</code> donne à l'opérateur d'affichage l'accès aux attributs privés. Les méthodes qui ne modifient rien sont <code>const</code>.</p>`,
            verification: { question: 'Pourquoi déclarer <code>operator&lt;&lt;</code> comme fonction libre (<code>friend</code>) et non comme méthode ?', options: ['Parce que les méthodes ne peuvent pas être surchargées', 'Parce que l\'opérande gauche est le flux (std::ostream), pas le Rectangle', 'Pour aller plus vite'], bonne: 1, explication: 'Une méthode operator<< aurait le Rectangle à gauche (r << os), ce qui n\'est pas la syntaxe attendue.' }
          },
          quiz: [
            { q: 'Que signifie <code>const</code> après une méthode ?', options: ['Elle renvoie une constante', 'Elle ne modifie pas l\'objet', 'Elle est statique'], bonne: 1, explication: 'Elle peut être appelée sur un objet const et ne peut pas modifier les attributs.' },
            { q: 'Pourquoi préférer la liste d\'initialisation au corps du constructeur ?', options: ['C\'est plus court', 'Les membres sont construits directement avec la bonne valeur, sans construction par défaut puis affectation', 'C\'est obligatoire'], bonne: 1, explication: 'Indispensable pour les membres const ou références, et plus efficace pour les objets.' },
            { q: 'Quelle différence entre <code>struct</code> et <code>class</code> ?', options: ['struct ne peut pas avoir de méthodes', 'Seul l\'accès par défaut : public pour struct, private pour class', 'class est plus rapide'], bonne: 1, explication: 'Techniquement équivalents ; la convention réserve struct aux simples agrégats.' }
          ]
        },
        {
          titre: 'RAII, destructeurs et sémantique de copie',
          theorie: `<p>Le concept le plus important du C++ : <strong>RAII</strong> (<em>Resource Acquisition Is Initialization</em>). Une ressource (mémoire, fichier, verrou, connexion) est acquise par un constructeur et libérée par le <strong>destructeur</strong>, appelé automatiquement quand l'objet sort de sa portée. Plus de <code>free</code> oublié, même en cas d'exception.</p>
${code('cpp', `#include <cstdio>

class Fichier {
public:
    explicit Fichier(const char *chemin, const char *mode) : f_(std::fopen(chemin, mode))
    {
        if (!f_) throw std::runtime_error("ouverture impossible");
    }
    ~Fichier() { if (f_) std::fclose(f_); }     // destructeur : appelé automatiquement
    FILE *get() const { return f_; }
private:
    FILE *f_;
};

void traiter()
{
    Fichier f("donnees.txt", "r");
    // ... si une exception est levée ici, ~Fichier() est quand même appelé
}                                                // fin de portée : fermeture garantie`)}
<p>C'est exactement ce que font <code>std::string</code>, <code>std::vector</code>, <code>std::fstream</code>, <code>std::unique_ptr</code>, <code>std::lock_guard</code>. En C++ moderne, tu écris rarement un destructeur toi-même : tu composes des membres qui ont déjà le leur.</p>
<h2>Copie : la règle des trois / cinq / zéro</h2>
<p>Si une classe gère une ressource brute (pointeur obtenu par <code>new</code>, <code>FILE *</code>), la copie par défaut (membre à membre) copie le pointeur : deux objets libèrent la même ressource → double free. Il faut alors définir :</p>
<ul><li>le destructeur,</li><li>le constructeur de copie <code>T(const T &amp;)</code>,</li><li>l'opérateur d'affectation <code>T &amp;operator=(const T &amp;)</code>,</li><li>et depuis C++11, le constructeur de déplacement <code>T(T &amp;&amp;)</code> et l'affectation par déplacement.</li></ul>
<p>C'est la <strong>règle des cinq</strong>. Ou, bien mieux, la <strong>règle de zéro</strong> : n'écris aucun des cinq, en confiant chaque ressource à un membre qui sait se gérer (<code>std::string</code>, <code>std::vector</code>, <code>std::unique_ptr</code>). La classe <code>Fichier</code> ci-dessus devrait au minimum interdire la copie :</p>
${code('cpp', `Fichier(const Fichier &) = delete;             // copie interdite
Fichier &operator=(const Fichier &) = delete;
Fichier(Fichier &&autre) noexcept : f_(autre.f_) { autre.f_ = nullptr; }   // déplacement : transfert de propriété`)}
<h2>Sémantique de déplacement</h2>
<p>Déplacer (<code>std::move</code>) transfère le contenu d'un objet temporaire ou dont on n'a plus besoin, sans copie : renvoyer un <code>std::vector</code> d'un million d'éléments depuis une fonction ne coûte rien. <code>std::move</code> ne déplace rien par lui-même : il marque l'objet comme « déplaçable ». Après déplacement, l'objet source est valide mais indéterminé : ne l'utilise plus.</p>
${code('cpp', `std::vector<int> creer() { std::vector<int> v(1'000'000); return v; }   // déplacé (ou élidé), pas copié
std::vector<int> a = creer();
std::vector<int> b = std::move(a);     // a est maintenant vide ; b a pris son contenu
std::string s = "long texte";
std::vector<std::string> noms;
noms.push_back(std::move(s));          // s vidée, pas de copie`)}
<h2>Durée de vie et portée</h2>
<ul><li>Objet automatique (pile) : détruit à la fin du bloc, dans l'ordre inverse de construction.</li><li>Membre : détruit avec l'objet qui le contient.</li><li>Objet dynamique (<code>new</code>) : détruit par <code>delete</code>… que l'on n'écrit plus : <code>std::unique_ptr</code> s'en charge (leçon 3.2).</li><li>Statique/global : détruit à la fin du programme.</li></ul>
<div class="callout warn"><b>Jamais de new/delete nus</b>Dans du C++ moderne, <code>new</code> et <code>delete</code> n'apparaissent que dans l'implémentation de conteneurs ou de smart pointers. Si tu en écris dans du code applicatif, c'est presque toujours une erreur de conception.</div>`,
          exercice: {
            type: 'trous', langage: 'cpp', titre: 'Un tampon avec RAII et règle des cinq',
            enonce: `<p>Complète la classe <code>Tampon</code> qui gère un tableau alloué dynamiquement (exercice pédagogique : en vrai, <code>std::vector</code> suffirait). Elle doit libérer dans le destructeur, interdire la copie et autoriser le déplacement.</p>`,
            code: `#include <cstddef>
#include <utility>

class Tampon {
public:
    explicit Tampon(std::size_t taille) : taille_(taille), donnees_(new int[taille]{}) {}
    ___Tampon() { delete[] donnees_; }

    Tampon(const Tampon &) = ___;
    Tampon &operator=(const Tampon &) = delete;

    Tampon(Tampon &&autre) noexcept : taille_(autre.taille_), donnees_(autre.donnees_)
    {
        autre.donnees_ = ___;
        autre.taille_ = 0;
    }
    Tampon &operator=(Tampon &&autre) noexcept
    {
        if (this != &autre) {
            delete[] donnees_;
            donnees_ = autre.donnees_;
            taille_ = autre.taille_;
            autre.donnees_ = nullptr;
            autre.taille_ = 0;
        }
        return ___;
    }

    std::size_t taille() const { return taille_; }
    int &operator[](std::size_t i) { return donnees_[i]; }

private:
    std::size_t taille_;
    int *donnees_;
};

int main()
{
    Tampon a(4);
    a[0] = 7;
    Tampon b = std::___(a);      // transfert : a est vide, b possède les données
    return b.taille() == 4 && a.taille() == 0 ? 0 : 1;
}`,
            reponses: [['~'], ['delete'], ['nullptr'], ['*this'], ['move']],
            aides: ['Le destructeur porte un tilde devant le nom de la classe.', 'Le mot-clé qui interdit une opération.', 'La source déplacée ne doit plus pointer sur les données.', 'L\'opérateur d\'affectation renvoie une référence sur l\'objet courant.', 'La fonction qui marque un objet comme déplaçable.']
          },
          quiz: [
            { q: 'Quand le destructeur d\'un objet local est-il appelé ?', options: ['Jamais automatiquement', 'À la sortie du bloc, même en cas d\'exception', 'Seulement avec delete'], bonne: 1, explication: 'C\'est le principe du RAII : libération déterministe et garantie.' },
            { q: 'Que fait <code>std::move(x)</code> ?', options: ['Copie x', 'Déplace x immédiatement', 'Marque x comme déplaçable (conversion en rvalue)'], bonne: 2, explication: 'Le déplacement effectif a lieu dans le constructeur ou l\'affectation qui reçoit la rvalue.' },
            { q: 'Qu\'est-ce que la règle de zéro ?', options: ['Ne jamais écrire de constructeur', 'Confier les ressources à des membres qui se gèrent, pour n\'écrire aucune des cinq fonctions spéciales', 'Mettre tous les membres à zéro'], bonne: 1, explication: 'std::string, std::vector, std::unique_ptr gèrent déjà copie, déplacement et destruction.' }
          ]
        },
        {
          titre: 'Références, const, surcharge et fonctions',
          theorie: `<p>Les fonctions C++ ajoutent au C la surcharge, les paramètres par défaut, les références et des règles de passage d'arguments qu'il faut connaître pour écrire du code à la fois sûr et rapide.</p>
<h2>Comment passer un argument</h2>
<table><tr><th>Cas</th><th>Signature</th><th>Pourquoi</th></tr>
<tr><td>Petit type (int, double, pointeur)</td><td><code>f(int x)</code></td><td>la copie coûte moins qu'une indirection</td></tr>
<tr><td>Objet en lecture seule</td><td><code>f(const std::string &amp;s)</code></td><td>pas de copie, pas de modification</td></tr>
<tr><td>Objet à modifier</td><td><code>f(std::vector&lt;int&gt; &amp;v)</code></td><td>modifie l'original</td></tr>
<tr><td>Objet que la fonction va stocker</td><td><code>f(std::string s)</code> puis <code>std::move(s)</code></td><td>l'appelant peut déplacer ou copier</td></tr>
<tr><td>Paramètre optionnel</td><td><code>f(const T *p)</code> ou <code>std::optional</code></td><td>une référence ne peut pas être nulle</td></tr></table>
<h2>Surcharge</h2>
${code('cpp', `double aire(double rayon);                       // cercle
double aire(double largeur, double hauteur);     // rectangle
std::string formater(int n);
std::string formater(double d);
std::string formater(const std::string &s);
// Le compilateur choisit selon le nombre et le type des arguments. Ambiguïté = erreur de compilation.`)}
<p>La surcharge remplace les familles <code>abs</code>/<code>fabs</code>/<code>labs</code> du C. Évite les surcharges dont le sens diffère : <code>enregistrer(int)</code> et <code>enregistrer(bool)</code> se confondent trop facilement.</p>
<h2>Paramètres par défaut</h2>
${code('cpp', `void connecter(const std::string &hote, int port = 443, bool tls = true);
connecter("exemple.fr");             // port 443, tls true
connecter("exemple.fr", 8080);       // les suivants restent par défaut : impossible de ne passer que tls`)}
<h2>const partout</h2>
${code('cpp', `const int n = 10;                      // variable constante
const std::string &nom = obj.nom();    // référence constante : pas de copie
void f(const Objet &o);                // paramètre non modifié
int taille() const;                    // méthode qui ne modifie pas l'objet
constexpr int carre(int x) { return x * x; }   // évaluable à la compilation : static_assert(carre(4) == 16)`)}
<p>Règle : tout ce qui peut être <code>const</code> doit l'être. Le compilateur attrape alors les modifications involontaires, et l'optimiseur a plus de liberté.</p>
<h2>Renvoyer des valeurs</h2>
${code('cpp', `std::vector<int> lire();                     // par valeur : déplacé, pas copié. Le cas normal.
const std::string &nom() const;              // référence vers un membre : valide tant que l'objet vit
std::string &operator[](std::size_t i);      // référence modifiable vers un élément
// JAMAIS une référence vers une variable locale : elle est détruite au return.`)}
<h2>Fonctions inline, lambdas et pointeurs de fonction</h2>
${code('cpp', `inline double carre(double x) { return x * x; }      // définie dans un .hpp sans violer l'ODR

auto est_pair = [](int n) { return n % 2 == 0; };      // lambda : fonction anonyme
int seuil = 10;
auto au_dessus = [seuil](int n) { return n > seuil; };  // capture par valeur
auto incremente = [&compteur]() { ++compteur; };        // capture par référence
std::function<int(int)> f = carre;                     // type générique pour stocker un callable`)}
<p>Les lambdas remplacent les pointeurs de fonction du C partout : tri, recherche, callbacks (leçon 2.3).</p>
<div class="callout info"><b>Lire une signature</b><code>const std::vector&lt;std::string&gt; &amp;noms</code> : « référence vers un vecteur constant de chaînes ». Le <code>const</code> protège le contenu ; le <code>&amp;</code> évite la copie.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Surcharge, const et lambdas',
            enonce: `<p>Écris deux surcharges <code>decrire(int)</code> et <code>decrire(const std::string &amp;)</code> renvoyant respectivement <code>"entier 42"</code> et <code>"texte \\"abc\\" (3 car.)"</code>, une fonction <code>int compter_si(const std::vector&lt;int&gt; &amp;v, std::function&lt;bool(int)&gt; pred)</code>, et une fonction <code>constexpr int cube(int)</code> vérifiée par <code>static_assert(cube(3) == 27)</code>. Dans <code>main</code>, affiche les deux descriptions, puis le nombre de valeurs supérieures à un seuil capturé par une lambda dans <code>{1, 5, 12, 20, 7}</code> (seuil 6).</p>`,
            depart: `#include <functional>
#include <iostream>
#include <string>
#include <vector>

// ...

int main()
{
    // ...
}`,
            solution: `#include <functional>
#include <iostream>
#include <string>
#include <vector>

std::string decrire(int n)
{
    return "entier " + std::to_string(n);
}

std::string decrire(const std::string &s)
{
    return "texte \\"" + s + "\\" (" + std::to_string(s.size()) + " car.)";
}

int compter_si(const std::vector<int> &v, std::function<bool(int)> pred)
{
    int n = 0;
    for (int x : v) {
        if (pred(x)) ++n;
    }
    return n;
}

constexpr int cube(int x) { return x * x * x; }
static_assert(cube(3) == 27, "cube incorrect");

int main()
{
    std::cout << decrire(42) << "\\n";
    std::cout << decrire(std::string("abc")) << "\\n";
    const std::vector<int> valeurs{1, 5, 12, 20, 7};
    int seuil = 6;
    std::cout << "Au-dessus de " << seuil << " : "
              << compter_si(valeurs, [seuil](int x) { return x > seuil; }) << "\\n";
}`,
            sortieAttendue: `entier 42
texte "abc" (3 car.)
Au-dessus de 6 : 3`,
            explication: `<p>Attention au piège : <code>decrire("abc")</code> avec un littéral <code>const char *</code> choisirait… aucune surcharge exacte, et pourrait même préférer <code>int</code> via une conversion inattendue dans d'autres cas ; d'où <code>std::string("abc")</code> explicite. La lambda capture <code>seuil</code> par valeur.</p>`,
            verification: { question: 'Que permet <code>constexpr</code> sur <code>cube</code> ?', options: ['De la rendre plus rapide à l\'exécution uniquement', 'De l\'évaluer à la compilation, par exemple dans un static_assert ou une taille de tableau', 'De la rendre récursive'], bonne: 1, explication: 'Une fonction constexpr peut s\'exécuter à la compilation quand ses arguments sont des constantes ; elle reste utilisable normalement sinon.' }
          },
          quiz: [
            { q: 'Quelle signature pour un paramètre chaîne en lecture seule ?', options: ['std::string s', 'const std::string &s', 'std::string *s'], bonne: 1, explication: 'Pas de copie, pas de modification, jamais nul.' },
            { q: 'Que capture <code>[&amp;x]</code> dans une lambda ?', options: ['Une copie de x', 'Une référence vers x', 'L\'adresse de x comme pointeur'], bonne: 1, explication: 'Attention : la lambda ne doit pas survivre à x.' },
            { q: 'Pourquoi ne jamais renvoyer une référence vers une variable locale ?', options: ['C\'est lent', 'La variable est détruite à la fin de la fonction : référence pendante', 'Le compilateur l\'interdit toujours'], bonne: 1, explication: 'Comportement indéfini ; gcc prévient (-Wreturn-local-addr) mais pas dans tous les cas.' }
          ]
        }
      ]
    },
    {
      titre: 'La bibliothèque standard', niveau: 'Intermédiaire', description: 'vector, map, algorithmes, lambdas, chaînes et flux : écrire moins de code, plus sûr.',
      lecons: [
        {
          titre: 'std::vector et les conteneurs séquentiels',
          theorie: `<p><code>std::vector</code> est le tableau dynamique du C++ : contigu, redimensionnable, gérant sa mémoire. C'est le conteneur par défaut, celui qu'on choisit sans réfléchir dans 90 % des cas.</p>
${code('cpp', `#include <vector>
#include <iostream>

std::vector<int> notes = {12, 15, 9};
notes.push_back(18);               // ajoute à la fin (réallocation automatique)
notes.emplace_back(11);            // construit sur place (utile pour les objets)
notes.size();                      // 5
notes[0];                          // accès sans vérification (rapide)
notes.at(10);                      // lève std::out_of_range : accès vérifié
notes.front(); notes.back();
notes.pop_back();                  // retire le dernier
notes.insert(notes.begin() + 1, 20);   // insertion (O(n) : décalage)
notes.erase(notes.begin());            // suppression du premier
notes.empty(); notes.clear();
std::vector<std::string> noms(3, "?");  // 3 éléments "?"
std::vector<double> v; v.reserve(1000); // préalloue : évite les réallocations si la taille est connue

for (int n : notes) std::cout << n << " ";         // boucle sur plage (copie chaque élément)
for (const auto &n : noms) std::cout << n << " ";   // const auto & : pas de copie
for (auto &n : notes) n *= 2;                       // modification en place`)}
<h2>Capacité et réallocation</h2>
<p><code>size()</code> est le nombre d'éléments, <code>capacity()</code> la place réservée. Quand elle est dépassée, le vecteur alloue un bloc plus grand (×2 en général) et déplace les éléments : les pointeurs, références et itérateurs vers les éléments deviennent <strong>invalides</strong>. Ne garde jamais une référence vers un élément pendant un <code>push_back</code>.</p>
<h2>Vecteurs d'objets et à deux dimensions</h2>
${code('cpp', `struct Produit { std::string nom; double prix; };
std::vector<Produit> stock;
stock.push_back({"Stylo", 1.5});
stock.emplace_back("Cahier", 2.2);          // appelle le constructeur directement
for (const auto &p : stock) std::cout << p.nom << "\\n";

std::vector<std::vector<int>> grille(3, std::vector<int>(4, 0));   // 3 lignes × 4 colonnes
grille[1][2] = 7;`)}
<h2>Les autres conteneurs séquentiels</h2>
<table><tr><th>Conteneur</th><th>Force</th><th>Quand</th></tr>
<tr><td><code>std::vector</code></td><td>accès O(1), contigu, cache-friendly</td><td>par défaut</td></tr>
<tr><td><code>std::array&lt;T, N&gt;</code></td><td>taille fixe à la compilation, sur la pile</td><td>petits tableaux de taille connue</td></tr>
<tr><td><code>std::deque</code></td><td>insertion O(1) aux deux bouts</td><td>files d'attente</td></tr>
<tr><td><code>std::list</code></td><td>insertion O(1) partout, itérateurs stables</td><td>rarement (cache défavorable)</td></tr>
<tr><td><code>std::string</code></td><td>un vector de char avec des méthodes texte</td><td>texte</td></tr></table>
<h2>Passer un vecteur à une fonction</h2>
${code('cpp', `double moyenne(const std::vector<double> &v)          // référence const : pas de copie
{
    if (v.empty()) return 0;
    double somme = 0;
    for (double x : v) somme += x;
    return somme / static_cast<double>(v.size());    // size() est un size_t : cast explicite
}
void remplir(std::vector<int> &v) { v.push_back(1); } // modification`)}
<p><code>size()</code> renvoie un <code>std::size_t</code> (non signé) : comparer avec un <code>int</code> provoque l'avertissement <em>sign-compare</em>. Utilise <code>std::size_t i</code> dans les boucles indexées, ou mieux, la boucle sur plage.</p>
<div class="callout info"><b>Supprimer pendant un parcours</b>Effacer des éléments dans une boucle <code>for</code> par indices est piégeux. Utilise l'idiome <code>std::erase_if(v, pred)</code> (C++20) ou <code>v.erase(std::remove_if(v.begin(), v.end(), pred), v.end())</code>.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Statistiques sur un vecteur',
            enonce: `<p>Écris <code>double moyenne(const std::vector&lt;double&gt; &amp;)</code>, <code>double mediane(std::vector&lt;double&gt;)</code> (reçoit une copie, la trie avec <code>std::sort</code>), <code>std::vector&lt;double&gt; au_dessus(const std::vector&lt;double&gt; &amp;, double seuil)</code> qui renvoie un nouveau vecteur, et <code>void retirer_negatifs(std::vector&lt;double&gt; &amp;)</code> avec l'idiome erase/remove_if. Teste sur <code>{4, -2, 9, 1, -7, 6}</code> : affiche la moyenne après retrait des négatifs, la médiane, et les valeurs au-dessus de 3 séparées par des espaces.</p>`,
            depart: `#include <algorithm>
#include <iostream>
#include <vector>

// ...

int main()
{
    std::vector<double> v{4, -2, 9, 1, -7, 6};
    // ...
}`,
            solution: `#include <algorithm>
#include <iostream>
#include <vector>

double moyenne(const std::vector<double> &v)
{
    if (v.empty()) return 0;
    double somme = 0;
    for (double x : v) somme += x;
    return somme / static_cast<double>(v.size());
}

double mediane(std::vector<double> v)
{
    if (v.empty()) return 0;
    std::sort(v.begin(), v.end());
    std::size_t n = v.size();
    return n % 2 ? v[n / 2] : (v[n / 2 - 1] + v[n / 2]) / 2;
}

std::vector<double> au_dessus(const std::vector<double> &v, double seuil)
{
    std::vector<double> r;
    for (double x : v) {
        if (x > seuil) r.push_back(x);
    }
    return r;
}

void retirer_negatifs(std::vector<double> &v)
{
    v.erase(std::remove_if(v.begin(), v.end(), [](double x) { return x < 0; }), v.end());
}

int main()
{
    std::vector<double> v{4, -2, 9, 1, -7, 6};
    retirer_negatifs(v);
    std::cout << "Moyenne : " << moyenne(v) << "\\n";
    std::cout << "Mediane : " << mediane(v) << "\\n";
    std::cout << "Au-dessus de 3 :";
    for (double x : au_dessus(v, 3)) std::cout << " " << x;
    std::cout << "\\n";
}`,
            sortieAttendue: `Moyenne : 5
Mediane : 5
Au-dessus de 3 : 4 9 6`,
            explication: `<p>Après retrait des négatifs : {4, 9, 1, 6}, moyenne 5, médiane (4+6)/2 = 5. <code>mediane</code> prend une copie car elle trie ; <code>remove_if</code> déplace les éléments à garder au début et renvoie la nouvelle fin, que <code>erase</code> coupe.</p>`,
            verification: { question: 'Pourquoi <code>mediane</code> reçoit-elle le vecteur par valeur et non par référence const ?', options: ['Par erreur, la référence serait plus rapide', 'Parce qu\'elle doit le trier sans modifier le vecteur de l\'appelant', 'Parce que std::sort exige une copie'], bonne: 1, explication: 'La copie est locale : on peut la trier librement ; l\'original de main reste intact.' }
          },
          quiz: [
            { q: 'Quelle différence entre <code>v[i]</code> et <code>v.at(i)</code> ?', options: ['Aucune', 'at vérifie l\'indice et lève une exception', '[] est plus lent'], bonne: 1, explication: '[] ne vérifie rien (comportement indéfini hors limites) ; at lève std::out_of_range.' },
            { q: 'Que deviennent les références vers les éléments après un push_back qui réalloue ?', options: ['Elles restent valides', 'Elles sont invalidées', 'Elles pointent sur le nouvel élément'], bonne: 1, explication: 'Les éléments ont été déplacés dans un nouveau bloc mémoire.' },
            { q: 'Quelle boucle évite de copier des chaînes ?', options: ['for (auto s : v)', 'for (const auto &s : v)', 'for (std::string s : v)'], bonne: 1, explication: 'La référence const lit sans copier.' }
          ]
        },
        {
          titre: 'map, set et conteneurs associatifs',
          theorie: `<p>Les conteneurs associatifs retrouvent une valeur à partir d'une <strong>clé</strong> : index inversé, compteurs, caches, configurations. Deux familles : ordonnés (<code>std::map</code>, arbre équilibré, O(log n)) et non ordonnés (<code>std::unordered_map</code>, table de hachage, O(1) en moyenne).</p>
${code('cpp', `#include <map>
#include <string>
#include <iostream>

std::map<std::string, int> stock;
stock["pomme"] = 12;                  // insertion ou modification ; crée la clé si absente
stock["kiwi"] = 5;
stock["pomme"] += 3;
stock.size();                         // 2

if (stock.count("poire") == 0) { /* absente */ }
auto it = stock.find("kiwi");          // itérateur, ou stock.end() si absente
if (it != stock.end()) std::cout << it->first << " : " << it->second << "\\n";   // first = clé, second = valeur
stock.erase("kiwi");

for (const auto &[nom, qte] : stock)   // structured bindings (C++17) : parcours trié par clé
    std::cout << nom << " " << qte << "\\n";`)}
<p>Piège : <code>stock["poire"]</code> en <em>lecture</em> crée l'entrée avec la valeur 0. Pour tester sans insérer : <code>find</code>, <code>count</code> ou <code>contains</code> (C++20).</p>
<h2>Insertion précise</h2>
${code('cpp', `auto [pos, insere] = stock.insert({"poire", 8});       // n'écrase pas si la clé existe ; insere = bool
stock.insert_or_assign("poire", 9);                    // écrase
stock.try_emplace("figue", 2);                         // construit seulement si absente
stock.at("pomme");                                     // lève std::out_of_range si absente (pas de création)`)}
<h2>Compter des occurrences : l'idiome</h2>
${code('cpp', `std::map<std::string, int> frequences;
for (const auto &mot : mots) ++frequences[mot];        // la création à 0 puis ++ est exactement ce qu'on veut
// unordered_map : même interface, plus rapide, ordre de parcours quelconque
std::unordered_map<std::string, int> f2;`)}
<h2>Ensembles</h2>
${code('cpp', `#include <set>
std::set<int> ids = {5, 1, 3, 1};     // {1, 3, 5} : trié, sans doublon
ids.insert(4); ids.erase(1);
ids.count(3);                          // 1 ou 0
std::unordered_set<std::string> vus;   // test d'appartenance O(1)
if (vus.insert(url).second) { /* première fois qu'on voit url */ }
std::multimap, std::multiset           // clés dupliquées autorisées`)}
<h2>Choisir</h2>
<table><tr><th>Besoin</th><th>Conteneur</th></tr>
<tr><td>Clé → valeur, parcours trié ou recherche par intervalle</td><td><code>std::map</code></td></tr>
<tr><td>Clé → valeur, vitesse pure, ordre indifférent</td><td><code>std::unordered_map</code></td></tr>
<tr><td>Ensemble de clés uniques</td><td><code>std::set</code> / <code>std::unordered_set</code></td></tr>
<tr><td>Petites collections (&lt; 50 éléments)</td><td>un <code>std::vector</code> trié + <code>std::lower_bound</code> est souvent plus rapide</td></tr></table>
<h2>Clés personnalisées</h2>
<p><code>std::map</code> exige <code>operator&lt;</code> sur la clé (ou un comparateur en paramètre de template) ; <code>std::unordered_map</code> exige <code>std::hash</code> et <code>operator==</code>. Pour une clé composée, un <code>std::pair</code> ou un <code>std::tuple</code> fonctionne directement avec <code>map</code>.</p>
<div class="callout info"><b>Valeurs lourdes</b>Les valeurs peuvent être n'importe quel type : <code>std::map&lt;std::string, std::vector&lt;Produit&gt;&gt;</code> pour grouper des produits par catégorie, en une ligne.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Index de mots',
            enonce: `<p>Écris un programme qui lit tous les mots de l'entrée standard (<code>while (std::cin &gt;&gt; mot)</code>), les met en minuscules (<code>std::tolower</code> sur chaque caractère), compte leurs occurrences dans une <code>std::map</code>, puis affiche chaque mot avec son nombre (ordre alphabétique), le nombre de mots distincts via un <code>std::set</code> (ou la taille de la map) et le mot le plus fréquent. Teste avec <code>echo "le chat et le chien et le canari" | ./prog</code>.</p>`,
            depart: `#include <cctype>
#include <iostream>
#include <map>
#include <string>

int main()
{
    std::map<std::string, int> freq;
    std::string mot;
    // ...
}`,
            solution: `#include <cctype>
#include <iostream>
#include <map>
#include <string>

int main()
{
    std::map<std::string, int> freq;
    std::string mot;
    while (std::cin >> mot) {
        for (char &c : mot) c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
        ++freq[mot];
    }

    std::string plus_frequent;
    int max = 0;
    for (const auto &[m, n] : freq) {
        std::cout << m << " : " << n << "\\n";
        if (n > max) { max = n; plus_frequent = m; }
    }
    std::cout << "Mots distincts : " << freq.size() << "\\n";
    std::cout << "Plus frequent : " << plus_frequent << " (" << max << ")\\n";
}`,
            sortieAttendue: `canari : 1
chat : 1
chien : 1
et : 2
le : 3
Mots distincts : 5
Plus frequent : le (3)`,
            explication: `<p><code>++freq[mot]</code> crée l'entrée à 0 si nécessaire puis l'incrémente. Le parcours d'une <code>std::map</code> est trié par clé, d'où l'ordre alphabétique sans tri explicite.</p>`,
            verification: { question: 'Que se passe-t-il si on écrit <code>if (freq["zebre"] &gt; 0)</code> pour tester un mot absent ?', options: ['Erreur de compilation', 'L\'entrée "zebre" est créée avec la valeur 0 : la map grossit', 'Une exception est levée'], bonne: 1, explication: 'operator[] insère toujours la clé. Pour tester sans insérer : find, count ou contains.' }
          },
          quiz: [
            { q: 'Complexité d\'une recherche dans <code>std::map</code> ?', options: ['O(1)', 'O(log n)', 'O(n)'], bonne: 1, explication: 'Arbre binaire équilibré (rouge-noir).' },
            { q: 'Quelle méthode teste la présence d\'une clé sans l\'insérer ?', options: ['operator[]', 'find ou count', 'insert'], bonne: 1, explication: 'operator[] crée l\'entrée ; find renvoie end() si absente.' },
            { q: 'Que désigne <code>it-&gt;second</code> pour un itérateur de map ?', options: ['Le deuxième élément de la map', 'La valeur associée à la clé', 'La clé'], bonne: 1, explication: 'Chaque élément est une paire (first = clé, second = valeur).' }
          ]
        },
        {
          titre: 'Itérateurs, algorithmes et lambdas',
          theorie: `<p>La STL sépare les <strong>conteneurs</strong> (où sont les données), les <strong>algorithmes</strong> (ce qu'on en fait) et les <strong>itérateurs</strong> (le pont entre les deux). Une soixantaine d'algorithmes génériques, testés et optimisés, remplacent la plupart des boucles manuelles.</p>
<h2>Itérateurs</h2>
${code('cpp', `std::vector<int> v = {3, 1, 4};
auto it = v.begin();        // « pointeur » vers le premier élément
*it;                        // 3
++it;                       // suivant
v.end();                    // juste APRÈS le dernier : jamais déréférencé
for (auto it = v.begin(); it != v.end(); ++it) std::cout << *it;   // la boucle sur plage fait cela pour toi
auto cit = v.cbegin();      // itérateur const`)}
<p>Tout algorithme prend une plage <code>[début, fin)</code> : <code>std::sort(v.begin(), v.end())</code>. C++20 ajoute les <em>ranges</em> : <code>std::ranges::sort(v)</code>.</p>
<h2>Les algorithmes à connaître</h2>
${code('cpp', `#include <algorithm>
#include <numeric>

std::sort(v.begin(), v.end());                                   // tri croissant
std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });   // décroissant
std::sort(p.begin(), p.end(), [](const Produit &a, const Produit &b) { return a.prix < b.prix; });
std::stable_sort(...);                                           // conserve l'ordre des égaux

auto it = std::find(v.begin(), v.end(), 4);                      // premier 4, ou end()
auto it2 = std::find_if(v.begin(), v.end(), [](int x) { return x > 2; });
bool tous = std::all_of(v.begin(), v.end(), [](int x) { return x > 0; });   // any_of, none_of
int n = std::count_if(v.begin(), v.end(), est_pair);

int somme = std::accumulate(v.begin(), v.end(), 0);              // réduction (reduce en parallèle)
auto [mn, mx] = std::minmax_element(v.begin(), v.end());         // itérateurs vers min et max
std::reverse(v.begin(), v.end());
std::transform(v.begin(), v.end(), v.begin(), [](int x) { return x * 2; });   // map en place
std::copy_if(v.begin(), v.end(), std::back_inserter(dest), est_pair);        // filter vers dest
v.erase(std::unique(v.begin(), v.end()), v.end());               // dédoublonne (après tri)
std::binary_search(v.begin(), v.end(), 4);                       // sur plage triée, O(log n)
std::iota(v.begin(), v.end(), 1);                                // 1, 2, 3, ...`)}
<h2>Lambdas en détail</h2>
${code('cpp', `[capture](paramètres) -> type_retour { corps }
[]            // rien capturé
[x]           // x par copie
[&x]          // x par référence
[=]           // tout par copie   [&] tout par référence (prudence : durée de vie)
[this]        // l'objet courant dans une méthode
auto f = [](auto a, auto b) { return a + b; };    // lambda générique (template implicite)
auto compteur = [n = 0]() mutable { return ++n; }; // état interne modifiable`)}
<h2>Un exemple complet</h2>
${code('cpp', `struct Employe { std::string nom; std::string service; double salaire; };
std::vector<Employe> e = /* ... */;

// Les 3 salaires les plus élevés du service "R&D"
std::vector<Employe> rd;
std::copy_if(e.begin(), e.end(), std::back_inserter(rd), [](const Employe &x) { return x.service == "R&D"; });
std::partial_sort(rd.begin(), rd.begin() + std::min<std::size_t>(3, rd.size()), rd.end(),
                  [](const Employe &a, const Employe &b) { return a.salaire > b.salaire; });

// Masse salariale
double total = std::accumulate(e.begin(), e.end(), 0.0, [](double acc, const Employe &x) { return acc + x.salaire; });`)}
<p>Chaque algorithme dit ce qu'il fait par son nom : la lecture remplace la compréhension d'une boucle. Et pas d'erreur d'indice possible.</p>
<div class="callout info"><b>Ranges (C++20)</b><code>auto chers = e | std::views::filter(cher) | std::views::transform(nom);</code> compose des vues paresseuses sans copie intermédiaire. L'avenir de la STL.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Classement de produits',
            enonce: `<p>Avec un <code>std::vector&lt;Produit&gt;</code> ({"Clavier", 49, 3}, {"Souris", 19, 0}, {"Écran", 189, 5}, {"Câble", 9, 12}) et uniquement des algorithmes de la STL (aucune boucle <code>for</code> écrite à la main sauf pour l'affichage) : trie par prix décroissant et affiche les noms, calcule la valeur totale du stock avec <code>std::accumulate</code>, compte les produits en rupture avec <code>std::count_if</code>, trouve le produit le moins cher avec <code>std::min_element</code>, et vérifie avec <code>std::any_of</code> s'il existe un produit à plus de 100.</p>`,
            depart: `#include <algorithm>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>

struct Produit { std::string nom; double prix; int stock; };

int main()
{
    std::vector<Produit> p{{"Clavier", 49, 3}, {"Souris", 19, 0}, {"Ecran", 189, 5}, {"Cable", 9, 12}};
    // ...
}`,
            solution: `#include <algorithm>
#include <iostream>
#include <numeric>
#include <string>
#include <vector>

struct Produit { std::string nom; double prix; int stock; };

int main()
{
    std::vector<Produit> p{{"Clavier", 49, 3}, {"Souris", 19, 0}, {"Ecran", 189, 5}, {"Cable", 9, 12}};

    std::sort(p.begin(), p.end(), [](const Produit &a, const Produit &b) { return a.prix > b.prix; });
    std::cout << "Par prix :";
    for (const auto &x : p) std::cout << " " << x.nom;
    std::cout << "\\n";

    double valeur = std::accumulate(p.begin(), p.end(), 0.0,
                                    [](double acc, const Produit &x) { return acc + x.prix * x.stock; });
    std::cout << "Valeur du stock : " << valeur << "\\n";

    auto ruptures = std::count_if(p.begin(), p.end(), [](const Produit &x) { return x.stock == 0; });
    std::cout << "En rupture : " << ruptures << "\\n";

    auto moins_cher = std::min_element(p.begin(), p.end(), [](const Produit &a, const Produit &b) { return a.prix < b.prix; });
    std::cout << "Moins cher : " << moins_cher->nom << "\\n";

    bool premium = std::any_of(p.begin(), p.end(), [](const Produit &x) { return x.prix > 100; });
    std::cout << "Produit > 100 : " << (premium ? "oui" : "non") << "\\n";
}`,
            sortieAttendue: `Par prix : Ecran Clavier Souris Cable
Valeur du stock : 1200
En rupture : 1
Moins cher : Cable
Produit > 100 : oui`,
            explication: `<p>Valeur : 189×5 + 49×3 + 19×0 + 9×12 = 945 + 147 + 0 + 108 = 1200. Chaque algorithme reçoit une lambda qui exprime le critère ; <code>min_element</code> renvoie un itérateur, d'où <code>-&gt;nom</code>.</p>`,
            verification: { question: 'Pourquoi <code>std::accumulate</code> reçoit-il <code>0.0</code> et non <code>0</code> comme valeur initiale ?', options: ['Par style', 'Parce que le type de l\'accumulateur est déduit de la valeur initiale : avec 0 (int), les décimales seraient perdues', 'Parce que accumulate n\'accepte que des doubles'], bonne: 1, explication: 'Avec un int initial, chaque addition serait tronquée en int : un piège classique de accumulate.' }
          },
          quiz: [
            { q: 'Que représente <code>v.end()</code> ?', options: ['Le dernier élément', 'La position juste après le dernier élément', 'Le nombre d\'éléments'], bonne: 1, explication: 'Les plages sont semi-ouvertes [begin, end) ; end() ne se déréférence jamais.' },
            { q: 'Quel algorithme renvoie le premier élément vérifiant un prédicat ?', options: ['std::find', 'std::find_if', 'std::count_if'], bonne: 1, explication: 'find compare à une valeur ; find_if prend un prédicat.' },
            { q: 'Que capture <code>[=]</code> ?', options: ['Rien', 'Toutes les variables utilisées, par copie', 'Toutes les variables, par référence'], bonne: 1, explication: 'Pratique mais implicite : préfère nommer les captures.' }
          ]
        },
        {
          titre: 'Chaînes, flux et fichiers',
          theorie: `<p>Le traitement de texte en C++ combine <code>std::string</code>, les flux (<code>&lt;sstream&gt;</code>, <code>&lt;fstream&gt;</code>) et quelques algorithmes. Fini les tampons de taille fixe et les débordements.</p>
<h2>Lire et écrire un fichier</h2>
${code('cpp', `#include <fstream>
#include <string>
#include <iostream>

std::ofstream sortie("notes.txt");            // ouvre en écriture (écrase) ; std::ios::app pour ajouter
if (!sortie) { std::cerr << "Ecriture impossible\\n"; return 1; }
sortie << "Ana;15\\n" << "Bob;12\\n";            // fermé automatiquement par le destructeur (RAII)

std::ifstream entree("notes.txt");
std::string ligne;
while (std::getline(entree, ligne)) {         // ligne par ligne, sans \\n
    std::cout << ligne << "\\n";
}
// entree.fail() distingue fin de fichier normale et erreur`)}
<h2>Découper et analyser une ligne : stringstream</h2>
${code('cpp', `#include <sstream>

std::string ligne = "Ana;15;3.5";
std::stringstream ss(ligne);
std::string nom, champ;
std::getline(ss, nom, ';');                   // "Ana"  (délimiteur personnalisé)
std::getline(ss, champ, ';'); int note = std::stoi(champ);
std::getline(ss, champ);      double coef = std::stod(champ);

// Lecture typée directe quand le format est simple
std::istringstream is("12 3.5 ok");
int a; double b; std::string c;
is >> a >> b >> c;                            // conversion automatique selon le type

// Construire une chaîne
std::ostringstream os;
os << nom << " a " << note << "/20";
std::string resultat = os.str();`)}
<p><code>std::stoi</code>/<code>std::stod</code> lèvent <code>std::invalid_argument</code> ou <code>std::out_of_range</code> sur une entrée invalide : entoure-les d'un <code>try</code> ou utilise <code>std::from_chars</code> (C++17, sans exception, très rapide).</p>
<h2>Manipuler des chaînes</h2>
${code('cpp', `#include <algorithm>
#include <cctype>

std::string s = "  Bonjour le Monde  ";
// trim (pas de fonction standard : on l'écrit une fois)
auto debut = s.find_first_not_of(" \\t"); auto fin = s.find_last_not_of(" \\t");
std::string propre = debut == std::string::npos ? "" : s.substr(debut, fin - debut + 1);
// minuscules
std::transform(propre.begin(), propre.end(), propre.begin(), [](unsigned char c) { return std::tolower(c); });
// remplacer
std::size_t pos = propre.find("monde"); if (pos != std::string::npos) propre.replace(pos, 5, "web");
// préfixe / suffixe (C++20) : s.starts_with("Bon"), s.ends_with("de")
// découper sur un séparateur
std::vector<std::string> morceaux;
std::stringstream flux(propre);
for (std::string m; std::getline(flux, m, ' ');) if (!m.empty()) morceaux.push_back(m);`)}
<h2>std::string_view</h2>
<p>Une « vue » non propriétaire sur une chaîne (pointeur + longueur) : passer <code>std::string_view</code> en paramètre évite toute copie, et accepte aussi bien un littéral qu'une <code>std::string</code>. Ne la stocke pas : elle ne possède pas les données.</p>
<h2>Formatage</h2>
${code('cpp', `#include <iomanip>
std::cout << std::fixed << std::setprecision(2) << 3.14159;      // 3.14
std::cout << std::setw(10) << std::left << "nom" << "|";          // alignement
#include <format>   // C++20
std::string s = std::format("{} a {:.1f}/20 ({:>5})", nom, note, "ok");   // enfin un printf typé et sûr`)}
<div class="callout info"><b>Fichiers binaires</b><code>std::ofstream f("x.bin", std::ios::binary); f.write(reinterpret_cast&lt;const char *&gt;(&amp;obj), sizeof obj);</code> fonctionne pour des types triviaux, mais préfère un format texte (CSV, JSON) ou une bibliothèque de sérialisation : plus portable et débogable.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Analyse d\'un CSV',
            enonce: `<p>Écris un programme qui lit un fichier <code>ventes.csv</code> (chemin en argument) au format <code>produit;quantite;prix</code> avec une ligne d'en-tête à ignorer, découpe chaque ligne avec <code>std::getline</code> sur un <code>std::stringstream</code>, convertit avec <code>std::stoi</code>/<code>std::stod</code> dans un <code>try/catch</code> (ligne invalide signalée sur <code>std::cerr</code> et ignorée), accumule le chiffre d'affaires par produit dans une <code>std::map</code>, puis affiche chaque produit avec son CA formaté à deux décimales (<code>std::fixed</code>, <code>std::setprecision</code>) et le total. Fichier de test : en-tête, <code>stylo;3;1.50</code>, <code>cahier;2;2.20</code>, <code>stylo;abc;1.50</code>, <code>stylo;1;1.50</code>.</p>`,
            depart: `#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <string>

int main(int argc, char *argv[])
{
    if (argc < 2) { std::cerr << "Usage : " << argv[0] << " fichier.csv\\n"; return 2; }
    // ...
}`,
            solution: `#include <fstream>
#include <iomanip>
#include <iostream>
#include <map>
#include <sstream>
#include <string>

int main(int argc, char *argv[])
{
    if (argc < 2) { std::cerr << "Usage : " << argv[0] << " fichier.csv\\n"; return 2; }
    std::ifstream f(argv[1]);
    if (!f) { std::cerr << "Impossible d'ouvrir " << argv[1] << "\\n"; return 1; }

    std::map<std::string, double> ca;
    std::string ligne;
    int numero = 0;
    std::getline(f, ligne);                     // en-tête
    while (std::getline(f, ligne)) {
        ++numero;
        std::stringstream ss(ligne);
        std::string produit, qte, prix;
        if (!std::getline(ss, produit, ';') || !std::getline(ss, qte, ';') || !std::getline(ss, prix)) {
            std::cerr << "Ligne " << numero << " incomplete\\n";
            continue;
        }
        try {
            ca[produit] += std::stoi(qte) * std::stod(prix);
        } catch (const std::exception &) {
            std::cerr << "Ligne " << numero << " invalide : " << ligne << "\\n";
        }
    }

    std::cout << std::fixed << std::setprecision(2);
    double total = 0;
    for (const auto &[produit, montant] : ca) {
        std::cout << std::setw(10) << std::left << produit << montant << "\\n";
        total += montant;
    }
    std::cout << "Total : " << total << "\\n";
}`,
            sortieAttendue: `cahier    4.40
stylo     6.00
Total : 10.40`,
            explication: `<p>La ligne <code>stylo;abc;1.50</code> fait échouer <code>std::stoi</code> : l'exception est attrapée, la ligne signalée sur <code>stderr</code> (qui n'apparaît pas dans la sortie standard) et ignorée. Stylo : 3×1,5 + 1×1,5 = 6,00 ; cahier : 4,40.</p>`,
            verification: { question: 'Pourquoi utiliser <code>std::getline(ss, champ, \';\')</code> plutôt que <code>ss &gt;&gt; champ</code> pour un CSV ?', options: ['Parce que >> est plus lent', 'Parce que >> s\'arrête aux espaces et ignore le séparateur ; getline avec délimiteur découpe exactement sur le point-virgule', 'Parce que >> ne fonctionne pas sur stringstream'], bonne: 1, explication: 'Un nom de produit avec espace ("cafe moulu") serait coupé par >>.' }
          },
          quiz: [
            { q: 'Quand un <code>std::ofstream</code> est-il fermé ?', options: ['Jamais automatiquement', 'À la destruction de l\'objet (fin de portée)', 'À chaque écriture'], bonne: 1, explication: 'RAII : pas de close() oublié.' },
            { q: 'Que lève <code>std::stoi("abc")</code> ?', options: ['Rien, renvoie 0', 'std::invalid_argument', 'std::bad_alloc'], bonne: 1, explication: 'Contrairement à atoi, stoi signale l\'erreur.' },
            { q: 'Qu\'est-ce qu\'un <code>std::string_view</code> ?', options: ['Une copie de chaîne', 'Une vue non propriétaire (pointeur + taille) sur une chaîne existante', 'Un flux'], bonne: 1, explication: 'Idéal en paramètre de fonction ; à ne pas stocker au-delà de la durée de vie de la chaîne.' }
          ]
        }
      ]
    },
    {
      titre: 'C++ moderne', niveau: 'Avancé', description: 'Templates, smart pointers, polymorphisme, exceptions et types sûrs.',
      lecons: [
        {
          titre: 'Templates et programmation générique',
          theorie: `<p>Un <strong>template</strong> est un modèle de fonction ou de classe paramétré par des types. Le compilateur génère une version spécialisée pour chaque type utilisé : du code générique <em>sans</em> coût à l'exécution. Toute la STL est faite de templates.</p>
${code('cpp', `template <typename T>
T maximum(const T &a, const T &b)
{
    return a < b ? b : a;          // fonctionne pour tout type qui a operator<
}
maximum(3, 7);                     // T = int, déduit
maximum(2.5, 1.0);                 // T = double
maximum(std::string("a"), std::string("b"));
maximum<double>(3, 2.5);           // type imposé (sinon ambigu : int et double)`)}
<h2>Classes template</h2>
${code('cpp', `template <typename T, std::size_t N>
class TableauFixe {
public:
    T &operator[](std::size_t i) { return donnees_[i]; }
    const T &operator[](std::size_t i) const { return donnees_[i]; }
    constexpr std::size_t taille() const { return N; }
    T *begin() { return donnees_; }
    T *end() { return donnees_ + N; }
private:
    T donnees_[N]{};
};
TableauFixe<double, 3> v;          // c'est std::array, en miniature
for (double x : v) { /* begin/end suffisent pour la boucle sur plage */ }

template <typename Cle, typename Valeur>
struct Paire { Cle cle; Valeur valeur; };
Paire<std::string, int> p{"age", 30};
Paire q{"x", 2.5};                 // CTAD (C++17) : types déduits`)}
<p>Les templates se définissent dans les fichiers d'en-tête : le compilateur doit voir le code pour l'instancier dans chaque unité de compilation.</p>
<h2>Contraintes et messages d'erreur</h2>
<p>Un template appelé avec un type inadapté (pas d'<code>operator&lt;</code>) produit des erreurs longues. C++20 apporte les <strong>concepts</strong> pour exprimer les exigences :</p>
${code('cpp', `#include <concepts>
template <typename T>
requires std::totally_ordered<T>
T maximum(const T &a, const T &b);

template <std::integral T>            // forme abrégée
T double_(T x) { return x * 2; }

// Avant C++20 : static_assert avec des traits
template <typename T>
T moyenne(const std::vector<T> &v)
{
    static_assert(std::is_arithmetic_v<T>, "moyenne : type numerique requis");
    /* ... */
}`)}
<h2>Spécialisation et surcharge</h2>
${code('cpp', `template <typename T> std::string decrire(const T &x) { return "valeur"; }
template <> std::string decrire<bool>(const bool &b) { return b ? "vrai" : "faux"; }   // spécialisation totale
// if constexpr : brancher à la compilation selon le type
template <typename T> std::string vers_texte(const T &x)
{
    if constexpr (std::is_same_v<T, std::string>) return x;
    else return std::to_string(x);
}`)}
<h2>Templates variadiques</h2>
${code('cpp', `template <typename... Args>
void afficher(const Args &...args)
{
    ((std::cout << args << " "), ...);     // fold expression (C++17)
    std::cout << "\\n";
}
afficher(1, "deux", 3.0);`)}
<h2>Quand utiliser un template</h2>
<p>Quand l'algorithme est identique pour plusieurs types (conteneurs, fonctions mathématiques, utilitaires). Pas pour faire varier un <em>comportement</em> : là, c'est le polymorphisme (leçon suivante) ou de simples surcharges. Les templates compilent plus lentement et doivent rester lisibles.</p>
<div class="callout info"><b>auto et templates</b>Une lambda avec des paramètres <code>auto</code> est un template déguisé : <code>[](const auto &amp;a, const auto &amp;b) { return a &lt; b; }</code> fonctionne pour tout type comparable.</div>`,
          exercice: {
            type: 'trous', langage: 'cpp', titre: 'Une pile générique',
            enonce: `<p>Complète la classe template <code>Pile&lt;T&gt;</code> construite sur un <code>std::vector</code>, ainsi qu'une fonction template <code>somme</code> et un <code>static_assert</code>.</p>`,
            code: `#include <iostream>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <vector>

template <___ T>
class Pile {
public:
    void empiler(const T &v) { donnees_.push_back(v); }
    T depiler()
    {
        if (donnees_.empty()) throw std::out_of_range("pile vide");
        T v = donnees_.___();
        donnees_.pop_back();
        return v;
    }
    bool vide() const { return donnees_.empty(); }
private:
    std::vector<___> donnees_;
};

template <typename T>
T somme(const std::vector<T> &v)
{
    static_assert(std::___<T>, "somme : type arithmetique requis");
    T total{};
    for (const T &x : v) total += x;
    return total;
}

int main()
{
    Pile<std::string> p;
    p.empiler("a"); p.empiler("b");
    std::cout << p.depiler() << p.depiler() << "\\n";     // ba
    Pile<___> entiers;
    entiers.empiler(3);
    std::cout << somme(std::vector<double>{1.5, 2.5}) << "\\n";   // 4
}`,
            reponses: [['typename', 'class'], ['back'], ['T'], ['is_arithmetic_v'], ['int']],
            aides: ['Le mot-clé qui introduit un paramètre de type.', 'La méthode qui renvoie le dernier élément d\'un vector.', 'Le paramètre de type du template.', 'Le trait (variable template) qui vaut true pour les types numériques.', 'Un type entier pour empiler 3.']
          },
          quiz: [
            { q: 'Quand le code d\'un template est-il généré ?', options: ['À l\'exécution', 'À la compilation, pour chaque type utilisé', 'Au chargement du programme'], bonne: 1, explication: 'Chaque instanciation est du code spécialisé : généricité sans coût à l\'exécution.' },
            { q: 'Pourquoi les templates sont-ils définis dans les .hpp ?', options: ['Par convention', 'Le compilateur doit voir la définition pour instancier le template dans chaque fichier', 'Pour compiler plus vite'], bonne: 1, explication: 'Une déclaration seule ne suffit pas à générer le code.' },
            { q: 'À quoi servent les concepts (C++20) ?', options: ['À remplacer les classes', 'À exprimer les exigences sur les types et obtenir des erreurs claires', 'À accélérer l\'exécution'], bonne: 1, explication: 'Ils documentent et vérifient ce qu\'un template attend de ses paramètres.' }
          ]
        },
        {
          titre: 'Smart pointers et gestion de la mémoire',
          theorie: `<p>En C++ moderne, la mémoire dynamique se gère avec des <strong>pointeurs intelligents</strong> : des objets RAII qui possèdent un pointeur et le libèrent automatiquement. <code>new</code>/<code>delete</code> explicites disparaissent du code applicatif.</p>
<h2>std::unique_ptr : propriété exclusive</h2>
${code('cpp', `#include <memory>

auto p = std::make_unique<Produit>("Stylo", 1.5);   // alloue et construit ; jamais new
p->nom;                                            // accès comme un pointeur
*p;
Produit *brut = p.get();                           // pointeur brut non propriétaire (observation)
// à la fin de la portée : delete automatique

std::unique_ptr<Produit> q = p;                    // ERREUR : pas de copie (propriété unique)
std::unique_ptr<Produit> q = std::move(p);         // transfert : p est maintenant nul
if (!p) { /* vide */ }

std::vector<std::unique_ptr<Forme>> formes;        // conteneur d'objets polymorphes (leçon suivante)
formes.push_back(std::make_unique<Cercle>(2.0));`)}
<p><code>unique_ptr</code> a exactement le coût d'un pointeur brut. C'est le choix par défaut dès qu'un objet doit vivre au-delà d'une portée ou être polymorphe.</p>
<h2>std::shared_ptr : propriété partagée</h2>
${code('cpp', `auto a = std::make_shared<Image>("photo.png");   // compteur de références = 1
auto b = a;                                       // copie : compteur = 2
a.use_count();                                    // 2
a.reset();                                        // compteur = 1 ; l'image vit encore via b
// détruite quand le dernier shared_ptr disparaît`)}
<p>Plus coûteux (compteur atomique, bloc de contrôle). Réserve-le aux cas où la durée de vie est réellement partagée et imprévisible (cache, graphe d'objets). Beaucoup de code abuse de <code>shared_ptr</code> là où <code>unique_ptr</code> + références suffisent.</p>
<h2>std::weak_ptr : observer sans posséder</h2>
<p>Deux objets qui se référencent mutuellement par <code>shared_ptr</code> ne sont jamais libérés (cycle). <code>weak_ptr</code> casse le cycle : il observe un <code>shared_ptr</code> sans augmenter le compteur ; <code>lock()</code> renvoie un <code>shared_ptr</code> temporaire ou nul si l'objet a disparu.</p>
${code('cpp', `struct Noeud {
    std::vector<std::shared_ptr<Noeud>> enfants;
    std::weak_ptr<Noeud> parent;                  // pas shared_ptr : sinon cycle parent ↔ enfant
};
if (auto p = n->parent.lock()) { /* parent encore vivant */ }`)}
<h2>Pointeurs bruts et références : toujours utiles</h2>
<p>Un pointeur brut ou une référence signifie « j'utilise, je ne possède pas ». Passer <code>Produit &amp;</code> ou <code>const Produit *</code> à une fonction qui ne stocke rien est correct et idiomatique. La règle : <em>la propriété est explicite</em> (unique/shared), <em>l'observation est brute</em>.</p>
<h2>Règles de transmission</h2>
<table><tr><th>Signature</th><th>Sens</th></tr>
<tr><td><code>f(std::unique_ptr&lt;T&gt; p)</code></td><td>f prend la propriété (appel avec std::move)</td></tr>
<tr><td><code>f(T &amp;)</code>, <code>f(const T &amp;)</code>, <code>f(T *)</code></td><td>f utilise, sans posséder</td></tr>
<tr><td><code>f(std::shared_ptr&lt;T&gt;)</code></td><td>f partage la propriété (va la stocker)</td></tr>
<tr><td><code>f(const std::shared_ptr&lt;T&gt; &amp;)</code></td><td>presque toujours une erreur : passe T&amp;</td></tr></table>
<h2>Destructeurs personnalisés</h2>
${code('cpp', `std::unique_ptr<FILE, decltype(&std::fclose)> f(std::fopen("x.txt", "r"), &std::fclose);   // ressource C gérée en RAII
auto fermer = [](SDL_Window *w) { SDL_DestroyWindow(w); };
std::unique_ptr<SDL_Window, decltype(fermer)> fenetre(SDL_CreateWindow(/*...*/), fermer);`)}
<div class="callout warn"><b>Ce qu'il ne faut plus voir</b><code>Produit *p = new Produit(); … delete p;</code> dans du code applicatif. Et jamais deux smart pointers construits à partir du même pointeur brut : double delete.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Propriété et observation',
            enonce: `<p>Écris une classe <code>Journal</code> dont le constructeur et le destructeur affichent <code>Journal ouvert</code> / <code>Journal ferme</code>, avec une méthode <code>ecrire(const std::string &amp;)</code> qui affiche <code>[log] message</code>. Dans <code>main</code> : crée un <code>std::unique_ptr&lt;Journal&gt;</code> avec <code>make_unique</code>, passe-le par référence à une fonction <code>void traiter(Journal &amp;j)</code> qui écrit une ligne, transfère-le dans un <code>std::vector&lt;std::unique_ptr&lt;Journal&gt;&gt;</code> avec <code>std::move</code>, vérifie que le pointeur d'origine est nul (affiche <code>Transfere</code>), puis crée un <code>std::shared_ptr&lt;Journal&gt;</code> partagé par deux variables et affiche <code>use_count</code>. Observe l'ordre des destructions.</p>`,
            depart: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Journal {
    // ...
};

void traiter(Journal &j) { j.ecrire("traitement"); }

int main()
{
    // ...
}`,
            solution: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Journal {
public:
    Journal() { std::cout << "Journal ouvert\\n"; }
    ~Journal() { std::cout << "Journal ferme\\n"; }
    void ecrire(const std::string &message) { std::cout << "[log] " << message << "\\n"; }
};

void traiter(Journal &j) { j.ecrire("traitement"); }

int main()
{
    auto j = std::make_unique<Journal>();
    traiter(*j);

    std::vector<std::unique_ptr<Journal>> journaux;
    journaux.push_back(std::move(j));
    if (!j) std::cout << "Transfere\\n";
    journaux[0]->ecrire("depuis le vecteur");

    {
        auto partage = std::make_shared<Journal>();
        auto autre = partage;
        std::cout << "use_count = " << partage.use_count() << "\\n";
    }
    std::cout << "Fin de main\\n";
}`,
            sortieAttendue: `Journal ouvert
[log] traitement
Transfere
[log] depuis le vecteur
Journal ouvert
use_count = 2
Journal ferme
Fin de main
Journal ferme`,
            explication: `<p>Le journal partagé est détruit à la fin du bloc interne, quand ses deux <code>shared_ptr</code> disparaissent. Le journal du vecteur est détruit après <code>Fin de main</code>, quand le vecteur lui-même est détruit.</p>`,
            verification: { question: 'Que vaut <code>j</code> après <code>journaux.push_back(std::move(j))</code> ?', options: ['Toujours le même objet', 'nullptr : la propriété a été transférée au vecteur', 'Une copie de l\'objet'], bonne: 1, explication: 'unique_ptr ne se copie pas ; le déplacement laisse la source vide.' }
          },
          quiz: [
            { q: 'Quel smart pointer choisir par défaut ?', options: ['std::shared_ptr', 'std::unique_ptr', 'std::auto_ptr'], bonne: 1, explication: 'Propriété unique, zéro surcoût. shared_ptr seulement pour une propriété réellement partagée.' },
            { q: 'À quoi sert <code>std::weak_ptr</code> ?', options: ['À accélérer shared_ptr', 'À observer un objet partagé sans le maintenir en vie (casser les cycles)', 'À remplacer unique_ptr'], bonne: 1, explication: 'Deux shared_ptr en cycle ne seraient jamais libérés.' },
            { q: 'Que signifie un paramètre <code>const Produit &amp;p</code> en termes de propriété ?', options: ['La fonction prend la propriété', 'La fonction utilise sans posséder', 'La fonction partage la propriété'], bonne: 1, explication: 'Références et pointeurs bruts = observation ; smart pointers = propriété.' }
          ]
        },
        {
          titre: 'Héritage, polymorphisme et interfaces',
          theorie: `<p>Le <strong>polymorphisme</strong> permet de manipuler des objets de types différents à travers une interface commune : une liste de <code>Forme</code> contenant des cercles et des rectangles, chacun calculant son aire à sa façon. C'est l'outil pour faire varier un <em>comportement</em> à l'exécution.</p>
${code('cpp', `#include <iostream>
#include <memory>
#include <vector>

class Forme {
public:
    virtual ~Forme() = default;                     // destructeur virtuel : OBLIGATOIRE pour une classe de base polymorphe
    virtual double aire() const = 0;                // fonction virtuelle pure : Forme est abstraite
    virtual std::string nom() const { return "forme"; }   // virtuelle avec implémentation par défaut
    void decrire() const { std::cout << nom() << " d'aire " << aire() << "\\n"; }   // non virtuelle : utilise les virtuelles
};

class Cercle : public Forme {
public:
    explicit Cercle(double r) : r_(r) {}
    double aire() const override { return 3.14159 * r_ * r_; }   // override : le compilateur vérifie la signature
    std::string nom() const override { return "cercle"; }
private:
    double r_;
};

class Rectangle : public Forme {
public:
    Rectangle(double l, double h) : l_(l), h_(h) {}
    double aire() const override { return l_ * h_; }
    std::string nom() const override { return "rectangle"; }
private:
    double l_, h_;
};

int main()
{
    std::vector<std::unique_ptr<Forme>> formes;
    formes.push_back(std::make_unique<Cercle>(1.0));
    formes.push_back(std::make_unique<Rectangle>(2.0, 3.0));
    for (const auto &f : formes) f->decrire();      // appel résolu à l'exécution selon le type réel
}`)}
<h2>Les règles</h2>
<ul><li><code>virtual</code> sur la méthode de base, <code>override</code> sur les redéfinitions (détecte les fautes de signature).</li><li>Destructeur virtuel dans toute classe destinée à être dérivée, sinon <code>delete</code> via un pointeur de base ne détruit que la base.</li><li>Le polymorphisme fonctionne par <strong>pointeur ou référence</strong>. Copier un <code>Cercle</code> dans une variable <code>Forme</code> tronque l'objet (<em>slicing</em>) : c'est pourquoi on stocke des <code>unique_ptr&lt;Forme&gt;</code>.</li><li><code>= 0</code> rend la méthode pure et la classe abstraite (non instanciable). Une classe avec uniquement des méthodes pures est une <strong>interface</strong>.</li><li><code>final</code> interdit la dérivation ou la redéfinition.</li></ul>
<h2>Héritage : « est-un », pas « réutilise »</h2>
<p>Hérite seulement si <code>Derivee</code> <em>est une</em> <code>Base</code> substituable partout (principe de Liskov). Pour réutiliser du code, préfère la <strong>composition</strong> : un membre de type <code>Moteur</code> dans <code>Voiture</code>. L'héritage d'implémentation profond est un piège classique.</p>
<h2>Appel de la base et protected</h2>
${code('cpp', `class Employe {
public:
    virtual double salaire() const { return base_; }
protected:                               // accessible aux classes dérivées, pas à l'extérieur
    double base_ = 2000;
};
class Manager : public Employe {
public:
    double salaire() const override { return Employe::salaire() * 1.3; }   // réutilise la version de base
};`)}
<h2>Identification dynamique</h2>
<p><code>dynamic_cast&lt;Cercle *&gt;(f.get())</code> renvoie le pointeur si l'objet est bien un cercle, sinon <code>nullptr</code>. Un code qui en abuse révèle une interface mal conçue : la bonne méthode virtuelle manque. <code>std::variant</code> + <code>std::visit</code> est l'alternative sans héritage pour un ensemble fermé de types.</p>
<h2>Coût</h2>
<p>Un appel virtuel passe par une table (vtable) : une indirection, quelques nanosecondes. Négligeable sauf dans une boucle très chaude ; les templates (polymorphisme statique) sont alors l'alternative.</p>
<div class="callout info"><b>Interface = contrat</b>Nomme les interfaces par leur capacité (<code>Dessinable</code>, <code>Serialisable</code>), garde-les petites, et fais dépendre ton code des interfaces plutôt que des classes concrètes : c'est ce qui rend les tests possibles (fausses implémentations).</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Hiérarchie de véhicules',
            enonce: `<p>Crée une classe abstraite <code>Vehicule</code> (destructeur virtuel, <code>virtual double cout_journalier() const = 0</code>, <code>virtual std::string type() const = 0</code>, méthode non virtuelle <code>void afficher() const</code> qui imprime <code>type : cout EUR/jour</code>), puis <code>Voiture</code> (constructeur avec tarif de base, coût = base) et <code>Camion</code> (base + 0.5 × tonnage). Dans <code>main</code>, remplis un <code>std::vector&lt;std::unique_ptr&lt;Vehicule&gt;&gt;</code> avec une voiture à 40 et un camion à 80 de base et 10 tonnes, affiche chaque véhicule et le coût total.</p>`,
            depart: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Vehicule {
    // ...
};

int main()
{
    // ...
}`,
            solution: `#include <iostream>
#include <memory>
#include <string>
#include <vector>

class Vehicule {
public:
    virtual ~Vehicule() = default;
    virtual double cout_journalier() const = 0;
    virtual std::string type() const = 0;
    void afficher() const { std::cout << type() << " : " << cout_journalier() << " EUR/jour\\n"; }
};

class Voiture : public Vehicule {
public:
    explicit Voiture(double base) : base_(base) {}
    double cout_journalier() const override { return base_; }
    std::string type() const override { return "voiture"; }
private:
    double base_;
};

class Camion : public Vehicule {
public:
    Camion(double base, double tonnage) : base_(base), tonnage_(tonnage) {}
    double cout_journalier() const override { return base_ + 0.5 * tonnage_; }
    std::string type() const override { return "camion"; }
private:
    double base_, tonnage_;
};

int main()
{
    std::vector<std::unique_ptr<Vehicule>> flotte;
    flotte.push_back(std::make_unique<Voiture>(40));
    flotte.push_back(std::make_unique<Camion>(80, 10));
    double total = 0;
    for (const auto &v : flotte) {
        v->afficher();
        total += v->cout_journalier();
    }
    std::cout << "Total : " << total << " EUR/jour\\n";
}`,
            sortieAttendue: `voiture : 40 EUR/jour
camion : 85 EUR/jour
Total : 125 EUR/jour`,
            explication: `<p><code>afficher</code> n'est pas virtuelle : elle appelle les méthodes virtuelles <code>type()</code> et <code>cout_journalier()</code>, résolues selon le type réel de l'objet. C'est le patron « template method ».</p>`,
            verification: { question: 'Que se passerait-il sans destructeur virtuel dans <code>Vehicule</code> ?', options: ['Rien, les unique_ptr gèrent tout', 'La destruction via unique_ptr<Vehicule> n\'appellerait que ~Vehicule : comportement indéfini, ressources des dérivées non libérées', 'Les classes dérivées ne compileraient pas'], bonne: 1, explication: 'Le destructeur virtuel garantit l\'appel du destructeur de la classe réelle.' }
          },
          quiz: [
            { q: 'À quoi sert <code>override</code> ?', options: ['À rendre la méthode virtuelle', 'À vérifier à la compilation que la méthode redéfinit bien une virtuelle de la base', 'À appeler la base'], bonne: 1, explication: 'Une faute de signature deviendrait silencieusement une nouvelle méthode sans override.' },
            { q: 'Qu\'est-ce que le slicing ?', options: ['Découper une chaîne', 'Perdre la partie dérivée en copiant un objet dans une variable du type de base', 'Trier une hiérarchie'], bonne: 1, explication: 'D\'où l\'usage de pointeurs ou références pour le polymorphisme.' },
            { q: 'Quand préférer la composition à l\'héritage ?', options: ['Jamais', 'Quand la relation est « possède un » et non « est un »', 'Quand il y a plus de trois classes'], bonne: 1, explication: 'L\'héritage exprime une substituabilité ; la composition une réutilisation.' }
          ]
        },
        {
          titre: 'Exceptions, optional, variant et tests',
          theorie: `<p>Comment signaler une erreur en C++ ? Trois outils complémentaires : les <strong>exceptions</strong> pour les situations exceptionnelles, <code>std::optional</code> pour « pas de résultat », <code>std::variant</code>/<code>std::expected</code> pour « résultat ou erreur ». Et des tests pour tout vérifier.</p>
<h2>Exceptions</h2>
${code('cpp', `#include <stdexcept>

double diviser(double a, double b)
{
    if (b == 0) throw std::invalid_argument("division par zero");
    return a / b;
}

try {
    std::cout << diviser(1, 0);
} catch (const std::invalid_argument &e) {        // attraper par référence const, du plus précis au plus général
    std::cerr << "Argument : " << e.what() << "\\n";
} catch (const std::exception &e) {
    std::cerr << "Erreur : " << e.what() << "\\n";
}

class ErreurStock : public std::runtime_error {    // exception métier
public:
    ErreurStock(const std::string &code, int demande)
        : std::runtime_error("stock insuffisant pour " + code), code_(code), demande_(demande) {}
    const std::string &code() const { return code_; }
private:
    std::string code_; int demande_;
};`)}
<p>Grâce au RAII, une exception qui traverse dix fonctions libère toutes les ressources en chemin. Règles : lever pour les erreurs qu'on ne peut pas traiter localement (fichier corrompu, invariant violé), pas pour le contrôle de flux ordinaire ; ne jamais laisser une exception sortir d'un destructeur ; marquer <code>noexcept</code> les fonctions qui ne lèvent pas (déplacements, destructeurs).</p>
<h2>std::optional : une valeur ou rien</h2>
${code('cpp', `#include <optional>

std::optional<Produit> chercher(const std::string &code)
{
    auto it = index.find(code);
    if (it == index.end()) return std::nullopt;
    return it->second;
}

if (auto p = chercher("CAF01")) {        // conversion en bool : a une valeur ?
    std::cout << p->nom;                 // accès comme un pointeur
}
chercher("X").value_or(Produit{});       // valeur par défaut
chercher("X").value();                   // lève std::bad_optional_access si vide`)}
<p>Remplace le pointeur nul et les valeurs sentinelles (-1, "") : le type dit explicitement que l'absence est possible.</p>
<h2>std::variant : l'un parmi plusieurs types</h2>
${code('cpp', `#include <variant>
using Resultat = std::variant<double, std::string>;    // un nombre ou un message d'erreur

Resultat analyser(const std::string &s)
{
    try { return std::stod(s); } catch (...) { return std::string("non numerique : " + s); }
}
std::visit([](const auto &v) { std::cout << v << "\\n"; }, analyser("3.5"));   // dispatch selon le type
if (auto d = std::get_if<double>(&r)) { /* c'est un double */ }
// C++23 : std::expected<T, E> formalise exactement « valeur ou erreur »`)}
<h2>Tester</h2>
<p>Sans framework : un <code>main</code> de test avec <code>assert</code> (<code>&lt;cassert&gt;</code>). Avec un framework, en quelques lignes : <strong>Catch2</strong> (un seul en-tête) ou <strong>GoogleTest</strong>.</p>
${code('cpp', `#define CATCH_CONFIG_MAIN
#include <catch2/catch_test_macros.hpp>
#include "inventaire.hpp"

TEST_CASE("ajout et recherche") {
    Inventaire inv;
    inv.ajouter({"CAF01", "Cafe", 10, 6.5});
    REQUIRE(inv.taille() == 1);
    REQUIRE(inv.chercher("CAF01").has_value());
    REQUIRE_FALSE(inv.chercher("XXX").has_value());
}
TEST_CASE("retrait insuffisant leve une exception") {
    Inventaire inv;
    inv.ajouter({"CAF01", "Cafe", 1, 6.5});
    REQUIRE_THROWS_AS(inv.retirer("CAF01", 5), ErreurStock);
}`)}
<h2>Outils de qualité</h2>
<ul><li><code>-Wall -Wextra -Wpedantic -Wshadow -Wconversion</code> et zéro avertissement.</li><li><code>-fsanitize=address,undefined</code> en test ; <code>valgrind</code>.</li><li><code>clang-tidy</code> (modernize-*, cppcoreguidelines-*) et <code>clang-format</code>.</li><li>Les <a href="https://isocpp.github.io/CppCoreGuidelines/" target="_blank" rel="noopener">C++ Core Guidelines</a> : la référence des bonnes pratiques.</li></ul>
<div class="callout info"><b>Quelle technique pour quelle erreur ?</b>Résultat normalement absent (recherche) : <code>optional</code>. Erreur prévisible à traiter par l'appelant (parsing) : <code>variant</code>/<code>expected</code> ou code de retour. Erreur exceptionnelle, invariant cassé, ressource indisponible : exception.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Un parseur robuste',
            enonce: `<p>Écris <code>std::optional&lt;int&gt; vers_entier(const std::string &amp;)</code> qui renvoie <code>std::nullopt</code> si la chaîne n'est pas un entier complet (utilise <code>std::stoi</code> avec sa position de fin, dans un <code>try/catch</code>), une exception <code>ErreurConfig : std::runtime_error</code>, et <code>int lire_port(const std::map&lt;std::string, std::string&gt; &amp;config)</code> qui lève <code>ErreurConfig</code> si la clé <code>port</code> manque, n'est pas un entier ou est hors de [1, 65535]. Dans <code>main</code>, teste trois configurations ({port=8080}, {port=abc}, {}) en affichant le port ou le message d'erreur.</p>`,
            depart: `#include <iostream>
#include <map>
#include <optional>
#include <stdexcept>
#include <string>

// ...

int main()
{
    // ...
}`,
            solution: `#include <iostream>
#include <map>
#include <optional>
#include <stdexcept>
#include <string>

std::optional<int> vers_entier(const std::string &s)
{
    try {
        std::size_t fin = 0;
        int v = std::stoi(s, &fin);
        if (fin != s.size()) return std::nullopt;
        return v;
    } catch (const std::exception &) {
        return std::nullopt;
    }
}

class ErreurConfig : public std::runtime_error {
public:
    explicit ErreurConfig(const std::string &m) : std::runtime_error(m) {}
};

int lire_port(const std::map<std::string, std::string> &config)
{
    auto it = config.find("port");
    if (it == config.end()) throw ErreurConfig("cle 'port' manquante");
    auto port = vers_entier(it->second);
    if (!port) throw ErreurConfig("port non numerique : " + it->second);
    if (*port < 1 || *port > 65535) throw ErreurConfig("port hors limites : " + std::to_string(*port));
    return *port;
}

int main()
{
    std::map<std::string, std::string> configs[] = {{{"port", "8080"}}, {{"port", "abc"}}, {}};
    for (const auto &c : configs) {
        try {
            std::cout << "Port : " << lire_port(c) << "\\n";
        } catch (const ErreurConfig &e) {
            std::cout << "Erreur de configuration : " << e.what() << "\\n";
        }
    }
}`,
            sortieAttendue: `Port : 8080
Erreur de configuration : port non numerique : abc
Erreur de configuration : cle 'port' manquante`,
            explication: `<p><code>vers_entier</code> utilise <code>optional</code> car « pas un entier » est un résultat normal ; <code>lire_port</code> lève une exception car une configuration invalide empêche de continuer. Le second paramètre de <code>std::stoi</code> donne la position où la conversion s'est arrêtée, ce qui rejette "12abc".</p>`,
            verification: { question: 'Pourquoi <code>vers_entier</code> renvoie-t-elle un <code>optional</code> plutôt que de lever une exception ?', options: ['Parce que les exceptions sont interdites avec stoi', 'Parce qu\'une chaîne non numérique est un cas attendu que l\'appelant traite normalement, pas une situation exceptionnelle', 'Parce que optional est plus rapide à écrire'], bonne: 1, explication: 'Le type documente l\'absence possible de résultat ; l\'appelant décide quoi en faire (ici, lire_port transforme ce cas en erreur de configuration).' }
          },
          quiz: [
            { q: 'Comment attraper une exception correctement ?', options: ['catch (std::exception e)', 'catch (const std::exception &e)', 'catch (std::exception *e)'], bonne: 1, explication: 'Par référence const : pas de copie ni de slicing.' },
            { q: 'Que renvoie <code>opt.value_or(0)</code> ?', options: ['Toujours 0', 'La valeur si présente, sinon 0', 'Une exception'], bonne: 1, explication: 'Accès avec valeur par défaut, sans exception.' },
            { q: 'Quelle garantie offre le RAII face aux exceptions ?', options: ['Aucune', 'Les ressources des objets locaux sont libérées pendant le déroulement de la pile', 'Les exceptions sont ignorées'], bonne: 1, explication: 'C\'est ce qui rend les exceptions sûres en C++, contrairement au C.' }
          ]
        }
      ]
    },
    {
      titre: 'Projet final : bibliothèque de gestion', niveau: 'Avancé', description: 'Un système de gestion de bibliothèque : modèle objet, conteneurs, persistance, exceptions, CMake et tests.',
      lecons: [
        {
          titre: 'Projet (1/4) : modèle objet',
          theorie: `<p>Projet final : un <strong>système de gestion de bibliothèque</strong> en ligne de commande. Livres, adhérents, emprunts et retours avec règles métier (limite d'emprunts, retard, disponibilité), sauvegarde et tests. Trois modules : <code>modele</code>, <code>bibliotheque</code> (logique), <code>stockage</code>, plus <code>main.cpp</code>.</p>
<h2>Cahier des charges</h2>
<ul><li><code>Livre</code> : ISBN (identifiant), titre, auteur, année, nombre d'exemplaires total et disponibles.</li><li><code>Adherent</code> : identifiant, nom, liste des ISBN empruntés (3 maximum).</li><li><code>Emprunt</code> : ISBN, identifiant adhérent, date d'emprunt, date de retour prévue (14 jours).</li><li>Règles : impossible d'emprunter un livre indisponible ou au-delà de 3 ; retour d'un livre non emprunté = erreur ; un retard est signalé.</li><li>Persistance : trois fichiers CSV ; interface : <code>ajouter-livre</code>, <code>inscrire</code>, <code>emprunter</code>, <code>rendre</code>, <code>lister</code>, <code>retards</code>.</li></ul>
<h2>Le modèle</h2>
${code('cpp', `// modele.hpp
#pragma once
#include <chrono>
#include <string>
#include <vector>

using Date = std::chrono::year_month_day;    // C++20 ; sinon un simple struct {int annee, mois, jour}

struct Livre {
    std::string isbn;
    std::string titre;
    std::string auteur;
    int annee = 0;
    int exemplaires = 1;
    int disponibles = 1;
    bool disponible() const { return disponibles > 0; }
};

struct Adherent {
    std::string id;
    std::string nom;
    std::vector<std::string> emprunts;        // ISBN en cours
    static constexpr int MAX_EMPRUNTS = 3;
    bool peut_emprunter() const { return emprunts.size() < MAX_EMPRUNTS; }
};

struct Emprunt {
    std::string isbn;
    std::string adherent;
    Date date_emprunt;
    Date date_retour_prevue;
    bool en_retard(Date aujourdhui) const { return aujourdhui > date_retour_prevue; }
};`)}
<p>Des <code>struct</code> : ce sont des enregistrements avec quelques méthodes de confort, sans invariant complexe. Les règles métier qui impliquent plusieurs objets (emprunter) vivent dans la classe <code>Bibliotheque</code>, pas dans <code>Livre</code>.</p>
<h2>Les erreurs métier</h2>
${code('cpp', `// erreurs.hpp
#pragma once
#include <stdexcept>
class ErreurBibliotheque : public std::runtime_error { using std::runtime_error::runtime_error; };
class LivreInconnu    : public ErreurBibliotheque { using ErreurBibliotheque::ErreurBibliotheque; };
class AdherentInconnu : public ErreurBibliotheque { using ErreurBibliotheque::ErreurBibliotheque; };
class LivreIndisponible : public ErreurBibliotheque { using ErreurBibliotheque::ErreurBibliotheque; };
class LimiteAtteinte  : public ErreurBibliotheque { using ErreurBibliotheque::ErreurBibliotheque; };`)}
<p>Une hiérarchie d'exceptions permet à l'interface d'attraper <code>ErreurBibliotheque</code> en bloc, et aux tests de vérifier précisément le type levé.</p>
<h2>Dates sans C++20</h2>
<p>Si ton compilateur n'a pas <code>std::chrono::year_month_day</code> : un <code>struct Date { int annee, mois, jour; }</code> avec <code>operator&lt;=&gt;</code> (C++20) ou un <code>operator&lt;</code> comparant le tuple <code>(annee, mois, jour)</code>, et une fonction <code>ajouter_jours</code> simplifiée (ou via <code>std::time_t</code>).</p>
<div class="callout info"><b>Identifiants</b>Les ISBN et identifiants sont des <code>std::string</code> : pas de conversion, pas de dépassement, comparaison naturelle. Les <code>std::map</code> du module suivant les utiliseront comme clés.</div>`,
          exercice: {
            type: 'trous', langage: 'cpp', titre: 'Modèle et exceptions',
            enonce: `<p>Complète le modèle : méthode de disponibilité, constante de limite, hiérarchie d'exceptions avec héritage de constructeurs, et un test.</p>`,
            code: `#include <cassert>
#include <stdexcept>
#include <string>
#include <vector>

struct Livre {
    std::string isbn, titre;
    int exemplaires = 1, disponibles = 1;
    bool disponible() ___ { return disponibles > 0; }
};

struct Adherent {
    std::string id, nom;
    std::vector<std::string> emprunts;
    static ___ int MAX_EMPRUNTS = 3;
    bool peut_emprunter() const { return emprunts.size() ___ MAX_EMPRUNTS; }
};

class ErreurBibliotheque : public std::___ {
    using std::runtime_error::runtime_error;
};
class LivreIndisponible : public ___ {
    using ErreurBibliotheque::ErreurBibliotheque;
};

int main()
{
    Livre l{"978-1", "C++ moderne", 2, 0};
    assert(!l.disponible());
    Adherent a{"A1", "Ana", {"978-1", "978-2", "978-3"}};
    assert(!a.peut_emprunter());
    try {
        throw LivreIndisponible("978-1 indisponible");
    } catch (const ___ &e) {        // la classe de base attrape aussi les dérivées
        assert(std::string(e.what()) == "978-1 indisponible");
    }
    return 0;
}`,
            reponses: [['const'], ['constexpr', 'const'], ['<'], ['runtime_error'], ['ErreurBibliotheque'], ['ErreurBibliotheque', 'std::exception', 'std::runtime_error', 'LivreIndisponible']],
            aides: ['Une méthode qui ne modifie pas l\'objet.', 'Une constante de classe connue à la compilation.', 'Strictement inférieur à la limite.', 'L\'exception standard adaptée aux erreurs d\'exécution.', 'La classe de base de la hiérarchie d\'exceptions métier.', 'Attraper par la classe de base permet d\'intercepter toutes les erreurs métier.']
          },
          quiz: [
            { q: 'Où placer la règle « 3 emprunts maximum » ?', options: ['Dans Livre', 'Dans Adherent (peut_emprunter) et vérifiée par Bibliotheque', 'Dans main'], bonne: 1, explication: 'La donnée est dans Adherent ; l\'orchestration (vérifier puis emprunter) dans la logique métier.' },
            { q: 'Que fait <code>using std::runtime_error::runtime_error;</code> ?', options: ['Importe l\'espace de noms', 'Hérite des constructeurs de la classe de base', 'Rend la classe abstraite'], bonne: 1, explication: 'Évite de réécrire un constructeur qui ne fait que transmettre le message.' },
            { q: 'Pourquoi une hiérarchie d\'exceptions ?', options: ['Pour la performance', 'Pour attraper finement (tests) ou globalement (interface) selon le besoin', 'C\'est obligatoire en C++'], bonne: 1, explication: 'catch (const ErreurBibliotheque &) couvre toutes les erreurs métier d\'un coup.' }
          ]
        },
        {
          titre: 'Projet (2/4) : la logique métier',
          theorie: `<p>La classe <code>Bibliotheque</code> orchestre les règles : elle possède les livres, adhérents et emprunts, et expose des opérations qui préservent les invariants (un exemplaire emprunté n'est plus disponible, un adhérent n'a jamais plus de trois livres).</p>
${code('cpp', `// bibliotheque.hpp
#pragma once
#include "modele.hpp"
#include "erreurs.hpp"
#include <map>
#include <optional>
#include <vector>

class Bibliotheque {
public:
    void ajouter_livre(Livre livre);                           // lève si ISBN déjà présent
    void inscrire(Adherent adherent);
    Emprunt emprunter(const std::string &isbn, const std::string &adherent, Date aujourdhui);
    void rendre(const std::string &isbn, const std::string &adherent);
    std::vector<Emprunt> retards(Date aujourdhui) const;
    std::vector<const Livre *> rechercher(const std::string &texte) const;   // titre ou auteur, insensible à la casse
    std::optional<Livre> livre(const std::string &isbn) const;

    const std::map<std::string, Livre> &livres() const { return livres_; }
    const std::map<std::string, Adherent> &adherents() const { return adherents_; }
    const std::vector<Emprunt> &emprunts() const { return emprunts_; }

private:
    Livre &livre_ou_erreur(const std::string &isbn);
    Adherent &adherent_ou_erreur(const std::string &id);
    std::map<std::string, Livre> livres_;
    std::map<std::string, Adherent> adherents_;
    std::vector<Emprunt> emprunts_;
};`)}
<h2>Implémentation des opérations clés</h2>
${code('cpp', `#include "bibliotheque.hpp"
#include <algorithm>

Livre &Bibliotheque::livre_ou_erreur(const std::string &isbn)
{
    auto it = livres_.find(isbn);
    if (it == livres_.end()) throw LivreInconnu("ISBN inconnu : " + isbn);
    return it->second;
}

Emprunt Bibliotheque::emprunter(const std::string &isbn, const std::string &id, Date aujourdhui)
{
    Livre &l = livre_ou_erreur(isbn);                 // toutes les vérifications AVANT toute modification
    Adherent &a = adherent_ou_erreur(id);
    if (!l.disponible()) throw LivreIndisponible("aucun exemplaire disponible : " + l.titre);
    if (!a.peut_emprunter()) throw LimiteAtteinte(a.nom + " a atteint la limite d'emprunts");
    if (std::find(a.emprunts.begin(), a.emprunts.end(), isbn) != a.emprunts.end())
        throw ErreurBibliotheque(a.nom + " a deja ce livre");

    --l.disponibles;                                   // modifications : l'état reste cohérent
    a.emprunts.push_back(isbn);
    Emprunt e{isbn, id, aujourdhui, ajouter_jours(aujourdhui, 14)};
    emprunts_.push_back(e);
    return e;
}

void Bibliotheque::rendre(const std::string &isbn, const std::string &id)
{
    Livre &l = livre_ou_erreur(isbn);
    Adherent &a = adherent_ou_erreur(id);
    auto it = std::find_if(emprunts_.begin(), emprunts_.end(),
                           [&](const Emprunt &e) { return e.isbn == isbn && e.adherent == id; });
    if (it == emprunts_.end()) throw ErreurBibliotheque("emprunt introuvable");
    emprunts_.erase(it);
    a.emprunts.erase(std::remove(a.emprunts.begin(), a.emprunts.end(), isbn), a.emprunts.end());
    ++l.disponibles;
}

std::vector<Emprunt> Bibliotheque::retards(Date aujourdhui) const
{
    std::vector<Emprunt> r;
    std::copy_if(emprunts_.begin(), emprunts_.end(), std::back_inserter(r),
                 [aujourdhui](const Emprunt &e) { return e.en_retard(aujourdhui); });
    return r;
}`)}
<p>Principe de la <strong>garantie forte</strong> : si une exception est levée, l'état n'a pas changé. On vérifie tout d'abord, on modifie ensuite, avec des opérations qui ne peuvent pas échouer (ou presque : <code>push_back</code> peut lever <code>bad_alloc</code>, cas extrême).</p>
<h2>Recherche insensible à la casse</h2>
${code('cpp', `static std::string minuscules(std::string s)
{
    std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return std::tolower(c); });
    return s;
}
std::vector<const Livre *> Bibliotheque::rechercher(const std::string &texte) const
{
    std::vector<const Livre *> r;
    auto t = minuscules(texte);
    for (const auto &[isbn, l] : livres_)
        if (minuscules(l.titre).find(t) != std::string::npos || minuscules(l.auteur).find(t) != std::string::npos)
            r.push_back(&l);
    return r;
}`)}
<p>Renvoyer des <code>const Livre *</code> évite de copier les livres ; les pointeurs restent valides tant qu'on n'insère/supprime pas dans la map (les éléments de <code>std::map</code> ne bougent pas, contrairement au <code>vector</code>).</p>
<div class="callout info"><b>Tester la logique</b>C'est le module à couvrir en priorité : emprunt normal, livre indisponible, limite, double emprunt, retour, retards. Sans fichier ni interface : une <code>Bibliotheque</code> en mémoire suffit.</div>`,
          exercice: {
            type: 'sortie', langage: 'cpp', titre: 'Tests de la logique d\'emprunt',
            enonce: `<p>En reprenant <code>Bibliotheque</code> (avec un <code>struct Date {int a, m, j;}</code> simplifié et <code>ajouter_jours</code> qui ajoute aux jours sans gestion de mois, suffisant pour les tests), écris un programme de test avec <code>assert</code> : ajoute un livre à 1 exemplaire et deux adhérents ; l'adhérent A emprunte (disponibles passe à 0) ; B tente d'emprunter → <code>LivreIndisponible</code> ; A tente de rendre un ISBN inconnu → <code>LivreInconnu</code> ; A rend → disponibles 1 ; avec une date d'aujourd'hui 20 jours plus tard, un nouvel emprunt de B apparaît dans <code>retards()</code>. Affiche <code>Tests OK</code>.</p>`,
            depart: `#include <cassert>
#include <iostream>
#include "bibliotheque.hpp"

int main()
{
    Bibliotheque b;
    Date d0{2026, 3, 1};
    // ...
    std::cout << "Tests OK\\n";
}`,
            solution: `#include <cassert>
#include <iostream>
#include "bibliotheque.hpp"

template <typename E, typename F>
bool leve(F f)
{
    try { f(); } catch (const E &) { return true; } catch (...) { return false; }
    return false;
}

int main()
{
    Bibliotheque b;
    Date d0{2026, 3, 1};
    b.ajouter_livre({"978-1", "C++ moderne", "B. Stroustrup", 2022, 1, 1});
    b.inscrire({"A", "Ana", {}});
    b.inscrire({"B", "Bob", {}});

    b.emprunter("978-1", "A", d0);
    assert(b.livre("978-1")->disponibles == 0);
    assert(leve<LivreIndisponible>([&] { b.emprunter("978-1", "B", d0); }));
    assert(leve<LivreInconnu>([&] { b.rendre("999", "A"); }));

    b.rendre("978-1", "A");
    assert(b.livre("978-1")->disponibles == 1);
    assert(b.adherents().at("A").emprunts.empty());

    b.emprunter("978-1", "B", d0);
    Date plus_tard{2026, 3, 21};
    assert(b.retards(plus_tard).size() == 1);
    assert(b.retards(d0).empty());

    std::cout << "Tests OK\\n";
}`,
            sortieAttendue: `Tests OK`,
            explication: `<p>Le petit template <code>leve&lt;E&gt;(lambda)</code> rend lisible la vérification « cette opération lève E » ; c'est ce que font <code>REQUIRE_THROWS_AS</code> de Catch2 ou <code>EXPECT_THROW</code> de GoogleTest. Chaque <code>assert</code> vérifie un invariant après une opération.</p>`,
            verification: { question: 'Pourquoi <code>emprunter</code> effectue-t-elle toutes les vérifications avant la première modification ?', options: ['Pour la lisibilité uniquement', 'Pour garantir qu\'en cas d\'exception l\'état n\'a pas changé (garantie forte)', 'Parce que les exceptions ne peuvent être levées qu\'au début'], bonne: 1, explication: 'Si on décrémentait disponibles avant de découvrir que l\'adhérent a atteint sa limite, la bibliothèque serait incohérente.' }
          },
          quiz: [
            { q: 'Pourquoi les pointeurs renvoyés par <code>rechercher</code> restent-ils valides ?', options: ['Parce qu\'ils sont const', 'Parce que les éléments d\'une std::map ne sont jamais déplacés en mémoire', 'Parce qu\'on copie les livres'], bonne: 1, explication: 'Contrairement à vector, map garantit la stabilité des adresses de ses éléments.' },
            { q: 'Qu\'est-ce que la garantie forte d\'exception ?', options: ['Aucune exception n\'est levée', 'En cas d\'exception, l\'état est celui d\'avant l\'appel', 'L\'exception est toujours attrapée'], bonne: 1, explication: 'Vérifier avant de modifier est la façon la plus simple de l\'obtenir.' },
            { q: 'Quel algorithme pour extraire les emprunts en retard ?', options: ['std::sort', 'std::copy_if', 'std::find'], bonne: 1, explication: 'copy_if filtre vers un nouveau conteneur selon un prédicat.' }
          ]
        },
        {
          titre: 'Projet (3/4) : persistance et sérialisation',
          theorie: `<p>Le module <code>stockage</code> lit et écrit trois fichiers CSV. Il ne connaît que le modèle et un objet <code>Bibliotheque</code> à remplir ; la logique métier ne sait rien des fichiers.</p>
${code('cpp', `// stockage.hpp
#pragma once
#include "bibliotheque.hpp"
#include <filesystem>

class Stockage {
public:
    explicit Stockage(std::filesystem::path dossier);
    Bibliotheque charger() const;                // fichiers absents = bibliothèque vide
    void sauvegarder(const Bibliotheque &b) const;   // écriture atomique
private:
    std::filesystem::path dossier_;
};`)}
<h2>Sérialiser une ligne : une fonction par type</h2>
${code('cpp', `#include <sstream>

static std::string ligne_livre(const Livre &l)
{
    std::ostringstream os;
    os << l.isbn << ';' << l.titre << ';' << l.auteur << ';' << l.annee << ';' << l.exemplaires << ';' << l.disponibles;
    return os.str();
}

static std::optional<Livre> livre_depuis(const std::string &ligne)
{
    std::stringstream ss(ligne);
    Livre l; std::string champ;
    if (!std::getline(ss, l.isbn, ';') || !std::getline(ss, l.titre, ';') || !std::getline(ss, l.auteur, ';')) return std::nullopt;
    try {
        std::getline(ss, champ, ';'); l.annee = std::stoi(champ);
        std::getline(ss, champ, ';'); l.exemplaires = std::stoi(champ);
        std::getline(ss, champ);      l.disponibles = std::stoi(champ);
    } catch (const std::exception &) { return std::nullopt; }
    if (l.disponibles < 0 || l.disponibles > l.exemplaires) return std::nullopt;
    return l;
}`)}
<p>Le parseur renvoie un <code>optional</code> : une ligne invalide n'est pas une exception, c'est une donnée à ignorer (avec avertissement). Les champs texte ne doivent pas contenir <code>;</code> : à vérifier à la saisie, ou à échapper.</p>
<h2>Chargement</h2>
${code('cpp', `#include <fstream>
#include <iostream>

template <typename T, typename Parse, typename Ajout>
static void charger_fichier(const std::filesystem::path &p, Parse parse, Ajout ajout)
{
    std::ifstream f(p);
    if (!f) return;                               // absent : rien à charger
    std::string ligne; int numero = 0;
    while (std::getline(f, ligne)) {
        ++numero;
        if (ligne.empty() || ligne[0] == '#') continue;
        if (auto obj = parse(ligne)) ajout(*obj);
        else std::cerr << p.filename().string() << ":" << numero << " ligne ignoree\\n";
    }
}

Bibliotheque Stockage::charger() const
{
    Bibliotheque b;
    charger_fichier<Livre>(dossier_ / "livres.csv", livre_depuis, [&](const Livre &l) { b.ajouter_livre(l); });
    charger_fichier<Adherent>(dossier_ / "adherents.csv", adherent_depuis, [&](const Adherent &a) { b.inscrire(a); });
    charger_fichier<Emprunt>(dossier_ / "emprunts.csv", emprunt_depuis, [&](const Emprunt &e) { b.restaurer_emprunt(e); });
    return b;
}`)}
<p>Une fonction générique pour les trois fichiers : le parseur et l'action d'ajout sont des paramètres. <code>restaurer_emprunt</code> est une méthode de <code>Bibliotheque</code> qui réinsère un emprunt sans refaire les vérifications ni modifier les compteurs (déjà sauvegardés).</p>
<h2>Sauvegarde atomique avec std::filesystem</h2>
${code('cpp', `static void ecrire_atomique(const std::filesystem::path &cible, const std::vector<std::string> &lignes)
{
    auto tmp = cible; tmp += ".tmp";
    {
        std::ofstream f(tmp);
        if (!f) throw std::runtime_error("ecriture impossible : " + tmp.string());
        for (const auto &l : lignes) f << l << '\\n';
        if (!f) throw std::runtime_error("erreur d'ecriture : " + tmp.string());
    }                                               // fermeture ici, avant le rename
    std::filesystem::rename(tmp, cible);            // atomique sur le même système de fichiers
}

void Stockage::sauvegarder(const Bibliotheque &b) const
{
    std::filesystem::create_directories(dossier_);
    std::vector<std::string> lignes{"# isbn;titre;auteur;annee;exemplaires;disponibles"};
    for (const auto &[isbn, l] : b.livres()) lignes.push_back(ligne_livre(l));
    ecrire_atomique(dossier_ / "livres.csv", lignes);
    /* idem adherents (emprunts séparés par ',') et emprunts */
}`)}
<p><code>std::filesystem</code> (C++17) gère chemins, dossiers, existence et renommage de façon portable. Le bloc interne force la fermeture du flux avant <code>rename</code>.</p>
<div class="callout info"><b>Format alternatif</b>Pour un projet réel, JSON avec la bibliothèque <em>nlohmann/json</em> (un seul en-tête) : <code>json j = livre; livre = j.get&lt;Livre&gt;();</code> après avoir défini <code>to_json</code>/<code>from_json</code>. Le module Stockage reste le seul à changer.</div>`,
          exercice: {
            type: 'trous', langage: 'cpp', titre: 'Sérialisation des adhérents',
            enonce: `<p>Complète la sérialisation d'un <code>Adherent</code> : les ISBN empruntés sont joints par des virgules dans le dernier champ (<code>id;nom;isbn1,isbn2</code>), et le parseur reconstruit le vecteur.</p>`,
            code: `#include <optional>
#include <sstream>
#include <string>
#include <vector>

struct Adherent { std::string id, nom; std::vector<std::string> emprunts; };

std::string ligne_adherent(const Adherent &a)
{
    std::ostringstream os;
    os << a.id << ';' << a.nom << ';';
    for (std::size_t i = 0; i < a.emprunts.size(); ++i) {
        if (i > 0) os << '___';
        os << a.emprunts[i];
    }
    return os.___();
}

std::optional<Adherent> adherent_depuis(const std::string &ligne)
{
    std::stringstream ss(ligne);
    Adherent a;
    std::string liste;
    if (!std::getline(ss, a.id, ';') || !std::getline(ss, a.nom, ';')) return std::___;
    std::getline(ss, liste);
    std::stringstream sl(liste);
    for (std::string isbn; std::getline(sl, isbn, '___');) {
        if (!isbn.empty()) a.emprunts.___(isbn);
    }
    if (a.emprunts.size() > 3) return std::nullopt;
    return ___;
}`,
            reponses: [[','], ['str'], ['nullopt'], [','], ['push_back', 'emplace_back'], ['a']],
            aides: ['Le séparateur entre ISBN.', 'La méthode qui extrait la chaîne d\'un ostringstream.', 'La valeur « absence » d\'un optional.', 'Le même séparateur en lecture.', 'La méthode qui ajoute à la fin d\'un vector.', 'L\'adhérent reconstruit, converti implicitement en optional.']
          },
          quiz: [
            { q: 'Pourquoi le parseur renvoie-t-il <code>optional</code> et non une exception ?', options: ['Les exceptions sont lentes', 'Une ligne invalide est un cas attendu à ignorer, pas une panne', 'optional est obligatoire avec getline'], bonne: 1, explication: 'Le chargement continue avec les lignes valides ; l\'erreur est signalée sur stderr.' },
            { q: 'Pourquoi fermer le fichier temporaire avant <code>rename</code> ?', options: ['Pour libérer de la mémoire', 'Pour garantir que tout est écrit sur disque avant de remplacer la cible', 'rename refuse un fichier ouvert sur Linux'], bonne: 1, explication: 'Les données en tampon ne sont écrites qu\'à la fermeture ; renommer avant exposerait un fichier incomplet.' },
            { q: 'Que fournit <code>std::filesystem</code> ?', options: ['La lecture de fichiers texte', 'Chemins, dossiers, existence, renommage, portables', 'La sérialisation JSON'], bonne: 1, explication: 'La manipulation du système de fichiers, indépendante de l\'OS.' }
          ]
        },
        {
          titre: 'Projet (4/4) : interface, CMake et tests',
          theorie: `<p>Dernière étape : <code>main.cpp</code> interprète les commandes, le projet se construit avec <strong>CMake</strong> (le standard de fait) et les tests s'exécutent avec <strong>Catch2</strong>.</p>
<h2>main.cpp : une table de commandes</h2>
${code('cpp', `#include "bibliotheque.hpp"
#include "stockage.hpp"
#include <functional>
#include <iostream>
#include <map>
#include <span>

using Args = std::vector<std::string>;
using Commande = std::function<void(Bibliotheque &, const Args &)>;

static Date aujourdhui();   // via std::chrono::system_clock

static const std::map<std::string, Commande> commandes = {
    {"ajouter-livre", [](Bibliotheque &b, const Args &a) {
        if (a.size() != 5) throw std::invalid_argument("ajouter-livre ISBN TITRE AUTEUR ANNEE EXEMPLAIRES");
        int ex = std::stoi(a[4]);
        b.ajouter_livre({a[0], a[1], a[2], std::stoi(a[3]), ex, ex});
        std::cout << "Livre ajoute\\n";
    }},
    {"emprunter", [](Bibliotheque &b, const Args &a) {
        if (a.size() != 2) throw std::invalid_argument("emprunter ISBN ADHERENT");
        auto e = b.emprunter(a[0], a[1], aujourdhui());
        std::cout << "A rendre avant le " << e.date_retour_prevue << "\\n";
    }},
    {"lister", [](Bibliotheque &b, const Args &) {
        for (const auto &[isbn, l] : b.livres())
            std::cout << isbn << "  " << l.titre << " (" << l.auteur << ")  " << l.disponibles << "/" << l.exemplaires << "\\n";
    }},
    /* inscrire, rendre, retards, rechercher : même schéma */
};

int main(int argc, char *argv[])
{
    if (argc < 2) { std::cerr << "Commandes : "; for (auto &[n, _] : commandes) std::cerr << n << " "; std::cerr << "\\n"; return 2; }
    auto it = commandes.find(argv[1]);
    if (it == commandes.end()) { std::cerr << "Commande inconnue\\n"; return 2; }
    Args args(argv + 2, argv + argc);

    Stockage stockage("donnees");
    try {
        Bibliotheque b = stockage.charger();
        it->second(b, args);
        stockage.sauvegarder(b);
    } catch (const ErreurBibliotheque &e) {
        std::cerr << "Refuse : " << e.what() << "\\n"; return 1;
    } catch (const std::exception &e) {
        std::cerr << "Erreur : " << e.what() << "\\n"; return 1;
    }
}`)}
<p>La <code>map</code> de lambdas remplace une cascade de <code>if/else</code> : ajouter une commande = ajouter une entrée. Deux niveaux de <code>catch</code> : les erreurs métier (refus normal) et le reste (bug ou système).</p>
<h2>CMake</h2>
${code('bash', `# CMakeLists.txt
cmake_minimum_required(VERSION 3.16)
project(bibliotheque CXX)
set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
add_compile_options(-Wall -Wextra -Wpedantic)

add_library(biblio src/bibliotheque.cpp src/stockage.cpp)
target_include_directories(biblio PUBLIC include)

add_executable(biblio-cli src/main.cpp)
target_link_libraries(biblio-cli PRIVATE biblio)

# Tests
find_package(Catch2 3 QUIET)
if (Catch2_FOUND)
  add_executable(tests tests/test_bibliotheque.cpp tests/test_stockage.cpp)
  target_link_libraries(tests PRIVATE biblio Catch2::Catch2WithMain)
  enable_testing()
  add_test(NAME tous COMMAND tests)
endif()`)}
${code('bash', `cmake -S . -B build -DCMAKE_BUILD_TYPE=Debug
cmake --build build
./build/biblio-cli ajouter-livre 978-1 "C++ moderne" "Stroustrup" 2022 2
./build/biblio-cli emprunter 978-1 A
ctest --test-dir build --output-on-failure`)}
<p>La logique est une <em>bibliothèque</em> (<code>biblio</code>) liée à la fois à l'exécutable et aux tests : un seul code compilé, deux usages. Catch2 s'installe via le gestionnaire de paquets (<code>apt install catch2</code>, <code>brew install catch2</code>, vcpkg…).</p>
<h2>Tests Catch2</h2>
${code('cpp', `#include <catch2/catch_test_macros.hpp>
#include "bibliotheque.hpp"

TEST_CASE("emprunt et retour", "[biblio]") {
    Bibliotheque b;
    b.ajouter_livre({"1", "T", "A", 2020, 1, 1});
    b.inscrire({"X", "Xavier", {}});
    SECTION("emprunt rend le livre indisponible") {
        b.emprunter("1", "X", {2026, 1, 1});
        REQUIRE_FALSE(b.livre("1")->disponible());
        REQUIRE_THROWS_AS(b.emprunter("1", "X", {2026, 1, 1}), ErreurBibliotheque);
    }
    SECTION("retour d'un livre non emprunte") {
        REQUIRE_THROWS_AS(b.rendre("1", "X"), ErreurBibliotheque);
    }
}`)}
<h2>Pour aller plus loin</h2>
<ul><li>Dates réelles avec <code>std::chrono</code> C++20 et calcul des pénalités de retard.</li><li>Un mode interactif (REPL) ou une petite API HTTP (cpp-httplib) : la classe <code>Bibliotheque</code> ne change pas.</li><li>Réservations (file d'attente par livre : <code>std::deque</code>).</li><li>Mesurer avec <code>-O2</code> et un profileur (perf, Instruments) sur 100 000 livres.</li></ul>
<div class="callout ok"><b>Parcours terminé</b>Classes, RAII, STL, templates, smart pointers, polymorphisme, exceptions, build system et tests : tu as pratiqué l'ensemble du C++ moderne sur un projet structuré. Prochaine étape naturelle : contribuer à un projet open source C++ ou explorer la concurrence (<code>std::thread</code>, <code>std::async</code>).</div>`,
          exercice: {
            type: 'qcm', titre: 'Architecture du projet',
            enonce: `<p>Quelles affirmations sur l'architecture du projet sont correctes ? (plusieurs réponses)</p>`,
            options: ['La classe Bibliotheque ne doit contenir aucun accès aux fichiers', 'Le module Stockage peut être remplacé par du JSON sans modifier Bibliotheque', 'main.cpp doit vérifier les règles métier (limite d\'emprunts) avant d\'appeler Bibliotheque', 'La logique compilée en bibliothèque (add_library) est partagée par l\'exécutable et les tests', 'Les erreurs métier sont signalées par des exceptions dérivées d\'ErreurBibliotheque', 'Un échec de sauvegarde doit être ignoré silencieusement'],
            bonne: [0, 1, 3, 4], multiple: true,
            explication: 'Séparation des responsabilités : la logique ignore la persistance et l\'interface ; main ne refait pas les règles (il les laisse à Bibliotheque et affiche les erreurs) ; un échec d\'écriture doit être signalé.'
          },
          quiz: [
            { q: 'Quel avantage à une <code>std::map</code> de lambdas pour les commandes ?', options: ['La vitesse', 'Ajouter une commande = ajouter une entrée, sans toucher au reste', 'Les lambdas sont obligatoires'], bonne: 1, explication: 'Principe ouvert/fermé : extension sans modification.' },
            { q: 'Pourquoi compiler la logique en bibliothèque CMake ?', options: ['Pour la distribuer', 'Pour la lier à la fois à l\'exécutable et aux tests sans la recompiler', 'C\'est obligatoire avec Catch2'], bonne: 1, explication: 'Un seul code, deux consommateurs.' },
            { q: 'Que lance <code>ctest</code> ?', options: ['La compilation', 'Les tests enregistrés avec add_test', 'L\'exécutable principal'], bonne: 1, explication: 'ctest est le lanceur de tests de CMake, intégrable en CI.' }
          ]
        }
      ]
    }
  ]
};
