import { code, sortieContient, sortieEgale, sortieRegex, expr, exprVerif, codeContient, codeRegex, sansErreur, levePython } from './_outils.js';

export default {
  description: 'Python est le langage le plus recommandé pour débuter : lisible, polyvalent (web, données, automatisation, IA) et immédiatement utile. Ce parcours te mène des premières lignes jusqu\'à un projet complet, avec des exercices exécutés directement dans ton navigateur.',
  intro: `<h3>Comment travailler ce parcours</h3><p>Chaque leçon contient une théorie courte, un exercice exécuté dans la page (Python tourne dans ton navigateur grâce à Pyodide, le premier lancement prend une dizaine de secondes) et un quiz. Pour travailler aussi sur ton ordinateur : installe Python depuis <a href="https://www.python.org" target="_blank" rel="noopener">python.org</a>, enregistre ton code dans <code>script.py</code> et lance <code>python3 script.py</code>.</p><p class="muted">Limite de l'éditeur intégré : <code>input()</code> n'est pas interactif. Les exercices utilisent des valeurs fixées dans le code.</p>`,
  modules: [
    {
      titre: 'Les bases', niveau: 'Débutant', description: 'Variables, types, conditions et boucles : tout ce qu\'il faut pour écrire un premier vrai programme.',
      lecons: [
        {
          titre: 'Premier programme et variables',
          theorie: `<p>Un programme Python est un fichier texte lu de haut en bas. La fonction <code>print()</code> affiche quelque chose à l'écran : c'est la première chose à connaître, parce qu'elle permet de <em>voir</em> ce que fait le programme.</p>
${code('python', `print("Bonjour, Lumio !")   # affiche le texte entre guillemets
print(2 + 3)                 # affiche 5 : Python calcule d'abord`)}
<p>Tout ce qui suit un <code>#</code> est un <strong>commentaire</strong> : ignoré par Python, utile pour les humains.</p>
<h2>Les variables</h2>
<p>Une variable est une étiquette collée sur une valeur. On la crée avec <code>=</code> (lire « reçoit », pas « égale ») :</p>
${code('python', `prenom = "Nadia"      # une chaîne de caractères (str)
age = 27              # un entier (int)
taille = 1.68         # un nombre à virgule (float)
majeur = True         # un booléen (bool) : True ou False

print(prenom, "a", age, "ans")
age = age + 1         # on peut changer la valeur
print(age)            # 28`)}
<p>Règles de nommage : lettres, chiffres et <code>_</code>, pas d'espace, pas de chiffre au début, et surtout des noms <strong>parlants</strong> : <code>prix_total</code> vaut mieux que <code>x</code>. Par convention Python utilise le <em>snake_case</em> (minuscules et tirets bas).</p>
<h2>Les types de base</h2>
<table><tr><th>Type</th><th>Exemples</th><th>Usage</th></tr>
<tr><td><code>int</code></td><td><code>42</code>, <code>-3</code></td><td>Entiers, sans limite de taille</td></tr>
<tr><td><code>float</code></td><td><code>3.14</code>, <code>2.0</code></td><td>Nombres réels (séparateur : point)</td></tr>
<tr><td><code>str</code></td><td><code>"texte"</code>, <code>'ok'</code></td><td>Texte, entre guillemets simples ou doubles</td></tr>
<tr><td><code>bool</code></td><td><code>True</code>, <code>False</code></td><td>Vrai / faux (majuscule obligatoire)</td></tr></table>
<p><code>type(valeur)</code> renvoie le type. Python est <em>dynamiquement typé</em> : on ne déclare pas le type, il est déduit de la valeur. Mais il est <em>fortement typé</em> : <code>"3" + 4</code> provoque une erreur, il faut convertir avec <code>int("3")</code> ou <code>str(4)</code>.</p>
<h2>Les f-strings</h2>
<p>Pour insérer des valeurs dans un texte, la syntaxe moderne est la <strong>f-string</strong> : un <code>f</code> devant les guillemets et des accolades autour des expressions.</p>
${code('python', `prix = 19.99
quantite = 3
print(f"Total : {prix * quantite:.2f} €")   # Total : 59.97 €  (.2f = 2 décimales)`)}
<div class="callout info"><b>Erreurs fréquentes</b>Oublier les guillemets autour d'un texte (<code>print(Bonjour)</code> → NameError), confondre <code>=</code> (affectation) et <code>==</code> (comparaison), utiliser une virgule au lieu d'un point dans un nombre.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Carte de visite',
            enonce: `<p>Crée trois variables : <code>nom</code> (une chaîne), <code>annee_naissance</code> (un entier) et <code>ville</code>. Calcule l'âge en 2026 dans une variable <code>age</code>, puis affiche exactement : <code>Nom : …</code>, <code>Âge : …</code> et <code>Ville : …</code> sur trois lignes, en utilisant des f-strings.</p>`,
            depart: `nom = "Lina Moreau"
annee_naissance = 1998
ville = "Lyon"

# Calcule l'âge en 2026
age = ...

# Affiche les trois lignes avec des f-strings
`,
            solution: `nom = "Lina Moreau"
annee_naissance = 1998
ville = "Lyon"

age = 2026 - annee_naissance

print(f"Nom : {nom}")
print(f"Âge : {age}")
print(f"Ville : {ville}")`,
            tests: [sansErreur(), expr('age', 28, 'age doit valoir 2026 - annee_naissance, soit 28.'), sortieContient('Nom : Lina Moreau'), sortieContient('Âge : 28'), sortieContient('Ville : Lyon'), codeContient('f"', 'Utilise au moins une f-string : f"Nom : {nom}".')]
          },
          quiz: [
            { q: 'Que fait l\'instruction <code>x = 5</code> ?', options: ['Elle vérifie si x vaut 5', 'Elle associe la valeur 5 au nom x', 'Elle affiche 5'], bonne: 1, explication: 'Le signe = est une affectation : la variable x reçoit la valeur 5. La comparaison s\'écrit ==.' },
            { q: 'Quel est le type de <code>"42"</code> ?', options: ['int', 'float', 'str'], bonne: 2, explication: 'Les guillemets font de "42" une chaîne de caractères, même si elle contient des chiffres. int("42") la convertit en entier.' },
            { q: 'Quelle ligne est correcte ?', options: ['print(f"Il a {age} ans")', 'print("Il a {age} ans")', 'print(f"Il a age ans")'], bonne: 0, explication: 'Il faut le préfixe f ET les accolades pour que la valeur de age soit insérée.' }
          ]
        },
        {
          titre: 'Conditions : if, elif, else',
          theorie: `<p>Un programme devient intéressant quand il <strong>décide</strong>. En Python, la décision s'écrit avec <code>if</code>, suivi d'une condition et de deux-points. Le bloc à exécuter est <strong>indenté</strong> (4 espaces) : l'indentation n'est pas décorative, c'est la syntaxe.</p>
${code('python', `temperature = 31

if temperature > 30:
    print("Canicule")          # exécuté seulement si la condition est vraie
elif temperature > 20:
    print("Il fait bon")       # testé seulement si la première condition est fausse
else:
    print("Prends une veste")  # si aucune condition n'est vraie
print("Fin")                   # toujours exécuté (pas indenté)`)}
<h2>Les opérateurs de comparaison</h2>
<p><code>==</code> (égal), <code>!=</code> (différent), <code>&lt;</code>, <code>&lt;=</code>, <code>&gt;</code>, <code>&gt;=</code>. Chaque comparaison produit un booléen. On peut les combiner avec <code>and</code>, <code>or</code> et <code>not</code> :</p>
${code('python', `age = 20
permis = True
if age >= 18 and permis:
    print("Peut conduire")
if not permis or age < 18:
    print("Ne peut pas conduire")`)}
<p>Python évalue <code>and</code> et <code>or</code> en « court-circuit » : dans <code>a and b</code>, si <code>a</code> est faux, <code>b</code> n'est même pas évalué.</p>
<h2>Ce qui est « vrai »</h2>
<p>Dans une condition, Python accepte n'importe quelle valeur. Sont considérés comme faux : <code>0</code>, <code>0.0</code>, <code>""</code> (chaîne vide), <code>[]</code> (liste vide), <code>None</code> et <code>False</code>. Tout le reste est vrai. D'où l'idiome <code>if liste:</code> pour tester « la liste n'est pas vide ».</p>
<h2>Tester l'appartenance</h2>
${code('python', `fruit = "pomme"
if fruit in ["pomme", "poire", "prune"]:
    print("Fruit à noyau ou pépins connu")
if "om" in fruit:
    print("contient 'om'")`)}
<h2>Les conditions imbriquées et l'expression conditionnelle</h2>
<p>On peut mettre un <code>if</code> dans un <code>if</code>, mais trois niveaux d'imbrication rendent le code illisible : préfère des <code>elif</code> ou des fonctions. Pour une affectation simple, l'expression conditionnelle tient en une ligne :</p>
${code('python', `statut = "majeur" if age >= 18 else "mineur"`)}
<div class="callout warn"><b>Piège classique</b><code>if x = 5:</code> est une erreur de syntaxe (affectation au lieu de comparaison). Et comparer des floats avec <code>==</code> est risqué : <code>0.1 + 0.2 == 0.3</code> vaut <code>False</code> à cause des arrondis binaires. Utilise <code>abs(a - b) &lt; 1e-9</code>.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Calcul de la mention',
            enonce: `<p>Écris une fonction… non, pas encore ! Pour l'instant, complète le programme : selon la variable <code>note</code> (sur 20), affiche <code>Très bien</code> si note ≥ 16, <code>Bien</code> si ≥ 14, <code>Assez bien</code> si ≥ 12, <code>Passable</code> si ≥ 10, sinon <code>Échec</code>. Le code sera testé avec plusieurs valeurs de <code>note</code> : ne change pas la première ligne.</p>`,
            depart: `note = 13.5

# Ton code ici
`,
            solution: `note = 13.5

if note >= 16:
    print("Très bien")
elif note >= 14:
    print("Bien")
elif note >= 12:
    print("Assez bien")
elif note >= 10:
    print("Passable")
else:
    print("Échec")`,
            tests: [sansErreur(), sortieContient('Assez bien', 'Avec note = 13.5, le programme doit afficher « Assez bien ».'), codeContient('elif', 'Utilise elif pour enchaîner les conditions.'), codeContient('else', 'Prévois un else pour le cas « Échec ».'),
              codeRegex(/>=\s*16/, 'Le seuil 16 est testé avec >=', 'La mention Très bien commence à 16 inclus : utilise >= 16.')]
          },
          quiz: [
            { q: 'Que vaut <code>not (3 > 2 and 2 > 1)</code> ?', options: ['True', 'False', 'Erreur'], bonne: 1, explication: '3 > 2 et 2 > 1 sont vrais, donc le and vaut True, et not True vaut False.' },
            { q: 'Laquelle de ces valeurs est « fausse » dans un if ?', options: ['"False"', '[]', '-1'], bonne: 1, explication: 'La liste vide est fausse. La chaîne "False" n\'est pas vide (donc vraie) et -1 est un entier non nul (vrai).' },
            { q: 'Pourquoi l\'indentation est-elle importante en Python ?', options: ['Pour la lisibilité uniquement', 'Elle délimite les blocs de code', 'Elle accélère le programme'], bonne: 1, explication: 'Contrairement à C ou JavaScript (accolades), Python utilise l\'indentation pour savoir quelles lignes appartiennent au if.' }
          ]
        },
        {
          titre: 'Boucles for et while',
          theorie: `<p>Répéter est le travail de base d'un ordinateur. Python propose deux boucles : <code>for</code> pour parcourir une séquence, <code>while</code> pour répéter tant qu'une condition est vraie.</p>
<h2>La boucle for</h2>
${code('python', `for lettre in "abc":
    print(lettre)           # a, b, c

for i in range(5):          # range(5) produit 0, 1, 2, 3, 4
    print(i)

for i in range(2, 11, 2):   # de 2 à 10 inclus, par pas de 2
    print(i)                # 2 4 6 8 10

for nom in ["Ana", "Bob"]:
    print(f"Bonjour {nom}")`)}
<p><code>range(debut, fin, pas)</code> s'arrête <em>avant</em> <code>fin</code>. C'est cohérent avec les indices qui commencent à 0 : <code>range(len(liste))</code> couvre exactement tous les indices.</p>
<p>Pour avoir l'indice <em>et</em> la valeur, utilise <code>enumerate</code> :</p>
${code('python', `for i, nom in enumerate(["Ana", "Bob"], start=1):
    print(i, nom)           # 1 Ana / 2 Bob`)}
<h2>La boucle while</h2>
${code('python', `solde = 100
mois = 0
while solde < 200:          # répète tant que la condition est vraie
    solde = solde * 1.05    # +5 % par mois
    mois += 1               # raccourci de mois = mois + 1
print(f"{mois} mois pour doubler")`)}
<p>Le danger du <code>while</code> : si la condition ne devient jamais fausse, la boucle est <strong>infinie</strong>. Vérifie toujours que quelque chose change à chaque tour.</p>
<h2>break et continue</h2>
<p><code>break</code> sort immédiatement de la boucle ; <code>continue</code> passe au tour suivant.</p>
${code('python', `for n in range(1, 100):
    if n % 7 == 0:          # % = reste de la division
        print("Premier multiple de 7 :", n)
        break
    if n % 2 == 0:
        continue            # on saute les pairs
    # ici n est impair et non multiple de 7`)}
<h2>Accumuler un résultat</h2>
<p>Le motif le plus fréquent : une variable initialisée avant la boucle, mise à jour à chaque tour.</p>
${code('python', `total = 0
for prix in [12.5, 3, 7.25]:
    total += prix
print(total)                # 22.75

# Équivalent intégré : sum([12.5, 3, 7.25])`)}
<div class="callout info"><b>Bonne pratique</b>Préfère <code>for</code> quand tu sais combien de tours faire ou quand tu parcours une collection ; réserve <code>while</code> aux cas où l'arrêt dépend d'un calcul.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'FizzBuzz, le classique',
            enonce: `<p>Pour chaque nombre de 1 à 20 (inclus), affiche <code>Fizz</code> si le nombre est multiple de 3, <code>Buzz</code> s'il est multiple de 5, <code>FizzBuzz</code> s'il est multiple des deux, sinon le nombre lui-même. Une ligne par nombre.</p>`,
            depart: `for n in range(1, 21):
    # Complète ici
    pass
`,
            solution: `for n in range(1, 21):
    if n % 15 == 0:
        print("FizzBuzz")
    elif n % 3 == 0:
        print("Fizz")
    elif n % 5 == 0:
        print("Buzz")
    else:
        print(n)`,
            tests: [sansErreur(), sortieEgale(`1
2
Fizz
4
Buzz
Fizz
7
8
Fizz
Buzz
11
Fizz
13
14
FizzBuzz
16
17
Fizz
19
Buzz`, 'La sortie attendue est 1, 2, Fizz, 4, Buzz, …, FizzBuzz (15), …, Buzz (20) : une valeur par ligne. Pense à tester le multiple de 15 en premier.')]
          },
          quiz: [
            { q: 'Que produit <code>range(3, 8)</code> ?', options: ['3, 4, 5, 6, 7, 8', '3, 4, 5, 6, 7', '4, 5, 6, 7, 8'], bonne: 1, explication: 'La borne de fin est exclue : range(3, 8) donne 3 à 7.' },
            { q: 'Quelle instruction arrête complètement une boucle ?', options: ['continue', 'stop', 'break'], bonne: 2, explication: 'break sort de la boucle ; continue saute seulement le tour en cours.' },
            { q: 'Combien de fois s\'affiche « ok » ?<br><code>i = 0<br>while i &lt; 3:<br>&nbsp;&nbsp;&nbsp;&nbsp;print("ok")<br>&nbsp;&nbsp;&nbsp;&nbsp;i += 1</code>', options: ['2', '3', 'Infini'], bonne: 1, explication: 'i prend les valeurs 0, 1, 2 (trois tours) puis vaut 3 et la condition devient fausse.' }
          ]
        },
        {
          titre: 'Les fonctions',
          theorie: `<p>Une fonction regroupe des instructions sous un nom. On l'écrit une fois, on l'appelle autant de fois qu'on veut. C'est l'outil numéro un pour éviter la duplication et donner du sens au code.</p>
${code('python', `def aire_rectangle(largeur, hauteur):     # définition : nom et paramètres
    """Renvoie l'aire d'un rectangle."""    # docstring : documentation
    return largeur * hauteur                # return renvoie une valeur et sort

a = aire_rectangle(3, 4)                    # appel : les arguments 3 et 4
print(a)                                    # 12`)}
<p><strong>Paramètres</strong> = les noms dans la définition ; <strong>arguments</strong> = les valeurs passées à l'appel. Une fonction sans <code>return</code> renvoie <code>None</code>.</p>
<h2>Valeurs par défaut et arguments nommés</h2>
${code('python', `def saluer(nom, politesse="Bonjour"):
    return f"{politesse} {nom} !"

print(saluer("Eva"))                       # Bonjour Eva !
print(saluer("Eva", politesse="Salut"))    # Salut Eva !  (argument nommé)`)}
<p>Les paramètres avec valeur par défaut doivent venir après les autres. Attention : n'utilise jamais une liste comme valeur par défaut (elle serait partagée entre les appels) ; mets <code>None</code> et crée la liste dans la fonction.</p>
<h2>Portée des variables</h2>
<p>Une variable créée dans une fonction est <strong>locale</strong> : elle n'existe que pendant l'appel. Une fonction peut lire une variable globale, mais pour la modifier il faudrait <code>global</code>… ce qu'on évite : préfère passer les valeurs en paramètres et renvoyer le résultat.</p>
${code('python', `compteur = 0
def incrementer(c):
    return c + 1
compteur = incrementer(compteur)   # propre : pas d'effet caché`)}
<h2>Renvoyer plusieurs valeurs</h2>
${code('python', `def min_max(valeurs):
    return min(valeurs), max(valeurs)    # un tuple

petit, grand = min_max([4, 9, 1])        # dépaquetage
print(petit, grand)                      # 1 9`)}
<h2>Fonctions bien conçues</h2>
<ul><li>Un nom qui dit ce qu'elle fait, souvent un verbe : <code>calculer_tva</code>, <code>est_valide</code>.</li>
<li>Une seule responsabilité : si tu décris la fonction avec « et », découpe-la.</li>
<li>Pas d'affichage dans une fonction de calcul : elle <em>renvoie</em>, l'appelant décide d'afficher. Cela la rend testable.</li>
<li>Une docstring d'une ligne pour les fonctions non triviales.</li></ul>
<div class="callout info"><b>Pourquoi c'est important</b>Les tests automatiques de Lumio appellent tes fonctions avec différentes valeurs. Une fonction qui renvoie (au lieu d'afficher) peut être vérifiée précisément.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Convertisseur de températures',
            enonce: `<p>Écris deux fonctions : <code>celsius_vers_fahrenheit(c)</code> qui renvoie <code>c × 9/5 + 32</code>, et <code>est_gel(c)</code> qui renvoie <code>True</code> si la température est inférieure ou égale à 0. Puis une fonction <code>decrire(c)</code> qui renvoie la chaîne <code>"-5 °C = 23.0 °F (gel)"</code> ou <code>"20 °C = 68.0 °F"</code> selon le cas.</p>`,
            depart: `def celsius_vers_fahrenheit(c):
    ...

def est_gel(c):
    ...

def decrire(c):
    ...

print(decrire(-5))
print(decrire(20))
`,
            solution: `def celsius_vers_fahrenheit(c):
    return c * 9 / 5 + 32

def est_gel(c):
    return c <= 0

def decrire(c):
    f = celsius_vers_fahrenheit(c)
    texte = f"{c} °C = {f} °F"
    if est_gel(c):
        texte += " (gel)"
    return texte

print(decrire(-5))
print(decrire(20))`,
            tests: [sansErreur(), expr('celsius_vers_fahrenheit(100)', 212), expr('celsius_vers_fahrenheit(-40)', -40), expr('est_gel(0)', true), expr('est_gel(3)', false), expr('decrire(-5)', '-5 °C = 23.0 °F (gel)'), expr('decrire(20)', '20 °C = 68.0 °F')]
          },
          quiz: [
            { q: 'Que renvoie une fonction sans instruction <code>return</code> ?', options: ['0', 'None', 'Une chaîne vide'], bonne: 1, explication: 'Sans return explicite, Python renvoie None.' },
            { q: 'Dans <code>def f(a, b=2)</code>, que représente <code>b=2</code> ?', options: ['Une comparaison', 'Une valeur par défaut', 'Une variable globale'], bonne: 1, explication: 'Si l\'appel ne fournit pas b, il vaut 2.' },
            { q: 'Pourquoi éviter print() dans une fonction de calcul ?', options: ['print est lent', 'La fonction devient impossible à réutiliser et à tester', 'C\'est interdit par Python'], bonne: 1, explication: 'Renvoyer la valeur laisse l\'appelant libre de l\'afficher, la stocker ou la tester.' }
          ]
        }
      ]
    },
    {
      titre: 'Structures de données', niveau: 'Débutant', description: 'Listes, dictionnaires, chaînes et compréhensions : manipuler des données réelles.',
      lecons: [
        {
          titre: 'Listes et tuples',
          theorie: `<p>Une <strong>liste</strong> est une séquence ordonnée et modifiable de valeurs, entre crochets. C'est la structure la plus utilisée en Python.</p>
${code('python', `courses = ["pain", "lait", "œufs"]
print(courses[0])        # pain  (indices à partir de 0)
print(courses[-1])       # œufs  (indices négatifs : depuis la fin)
print(len(courses))      # 3

courses.append("riz")    # ajoute à la fin
courses.insert(1, "thé") # insère à l'indice 1
courses.remove("lait")   # retire la première occurrence
dernier = courses.pop()  # retire et renvoie le dernier
courses[0] = "baguette"  # modification en place
print(courses)           # ['baguette', 'thé', 'œufs']`)}
<h2>Le slicing (tranches)</h2>
${code('python', `nombres = [10, 20, 30, 40, 50]
print(nombres[1:3])      # [20, 30]   de l'indice 1 inclus à 3 exclu
print(nombres[:2])       # [10, 20]
print(nombres[::2])      # [10, 30, 50]  un sur deux
print(nombres[::-1])     # [50, 40, 30, 20, 10]  inversé`)}
<h2>Opérations utiles</h2>
${code('python', `notes = [12, 15, 9, 18]
print(sum(notes), max(notes), min(notes))       # 54 18 9
print(sorted(notes))                           # nouvelle liste triée
notes.sort(reverse=True)                       # tri en place, décroissant
print(15 in notes)                             # True
print(notes.index(9))                          # position de 9
mots = "a b c".split()                         # ['a', 'b', 'c']
print("-".join(mots))                          # a-b-c`)}
<h2>Attention : les listes sont des références</h2>
${code('python', `a = [1, 2, 3]
b = a            # b n'est PAS une copie : même objet
b.append(4)
print(a)         # [1, 2, 3, 4]  surprise !
c = a.copy()     # ou a[:] ou list(a) : vraie copie`)}
<p>Ce comportement vaut aussi quand on passe une liste à une fonction : la fonction peut la modifier.</p>
<h2>Les tuples</h2>
<p>Un <strong>tuple</strong> est une séquence <em>immuable</em>, entre parenthèses : <code>point = (3, 5)</code>. On ne peut ni ajouter ni modifier. On l'utilise pour des groupes de valeurs fixes (coordonnées, retour multiple de fonction) et comme clé de dictionnaire. Le dépaquetage <code>x, y = point</code> fonctionne pour tuples et listes.</p>
<div class="callout info"><b>Quand choisir quoi ?</b>Liste : collection homogène qui évolue (des notes, des tâches). Tuple : enregistrement fixe (une date, une coordonnée).</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Statistiques de notes',
            enonce: `<p>Écris la fonction <code>statistiques(notes)</code> qui renvoie un tuple <code>(moyenne, meilleure, nb_au_dessus_de_10)</code>. La moyenne est arrondie à 2 décimales avec <code>round()</code>. Écris aussi <code>top3(notes)</code> qui renvoie une <em>nouvelle</em> liste des trois meilleures notes en ordre décroissant, sans modifier la liste d'origine.</p>`,
            depart: `def statistiques(notes):
    ...

def top3(notes):
    ...

notes = [12, 8.5, 17, 9, 14, 19.5]
print(statistiques(notes))
print(top3(notes))
print(notes)  # doit rester inchangée
`,
            solution: `def statistiques(notes):
    moyenne = round(sum(notes) / len(notes), 2)
    meilleure = max(notes)
    au_dessus = 0
    for n in notes:
        if n > 10:
            au_dessus += 1
    return (moyenne, meilleure, au_dessus)

def top3(notes):
    return sorted(notes, reverse=True)[:3]

notes = [12, 8.5, 17, 9, 14, 19.5]
print(statistiques(notes))
print(top3(notes))
print(notes)`,
            tests: [sansErreur(), expr('statistiques([12, 8.5, 17, 9, 14, 19.5])', [13.33, 19.5, 4]), expr('statistiques([10, 10])', [10, 10, 0]), expr('top3([12, 8.5, 17, 9, 14, 19.5])', [19.5, 17, 14]), exprVerif('(lambda l: (top3(l), l)[1])([3, 1, 2])', 'top3 ne modifie pas la liste d\'origine', v => JSON.stringify(v) === '[3,1,2]', 'top3 doit utiliser sorted() (nouvelle liste), pas .sort() qui modifie la liste.')]
          },
          quiz: [
            { q: 'Que vaut <code>[1, 2, 3, 4][1:3]</code> ?', options: ['[2, 3]', '[1, 2, 3]', '[2, 3, 4]'], bonne: 0, explication: 'La tranche va de l\'indice 1 inclus à 3 exclu.' },
            { q: 'Après <code>a = [1]; b = a; b.append(2)</code>, que vaut <code>a</code> ?', options: ['[1]', '[1, 2]', 'Erreur'], bonne: 1, explication: 'b et a désignent la même liste : la modification est visible via les deux noms.' },
            { q: 'Quelle différence entre <code>sorted(l)</code> et <code>l.sort()</code> ?', options: ['Aucune', 'sorted renvoie une nouvelle liste, sort modifie l en place', 'sort est plus lent'], bonne: 1, explication: 'l.sort() renvoie None et trie la liste existante ; sorted() laisse l intacte.' }
          ]
        },
        {
          titre: 'Dictionnaires et ensembles',
          theorie: `<p>Un <strong>dictionnaire</strong> associe des <em>clés</em> à des <em>valeurs</em>. Là où une liste répond à « quel est le 3<sup>e</sup> élément ? », un dictionnaire répond à « quelle est la valeur pour la clé <code>"email"</code> ? ». L'accès par clé est quasi instantané, quelle que soit la taille.</p>
${code('python', `contact = {"nom": "Sow", "email": "a.sow@mail.fr", "age": 34}
print(contact["email"])              # accès par clé
contact["tel"] = "06 00 00 00 00"    # ajout
contact["age"] += 1                  # modification
del contact["tel"]                   # suppression
print("nom" in contact)              # True : test sur les clés
print(contact.get("ville", "inconnue"))  # valeur par défaut si la clé manque`)}
<p><code>contact["ville"]</code> lèverait une <code>KeyError</code> si la clé n'existe pas ; <code>.get()</code> évite l'erreur.</p>
<h2>Parcourir un dictionnaire</h2>
${code('python', `for cle in contact:                    # parcourt les clés
    print(cle)
for cle, valeur in contact.items():    # clés et valeurs
    print(f"{cle} → {valeur}")
print(list(contact.keys()), list(contact.values()))`)}
<p>Depuis Python 3.7, l'ordre d'insertion est conservé.</p>
<h2>Le motif « compteur »</h2>
<p>Compter des occurrences est l'usage le plus fréquent :</p>
${code('python', `texte = "le chat et le chien et le canari"
compte = {}
for mot in texte.split():
    compte[mot] = compte.get(mot, 0) + 1
print(compte)   # {'le': 3, 'chat': 1, 'et': 2, ...}

# Version standard :
from collections import Counter
print(Counter(texte.split()).most_common(2))   # [('le', 3), ('et', 2)]`)}
<h2>Dictionnaires imbriqués</h2>
<p>Les valeurs peuvent être des listes ou d'autres dictionnaires : c'est exactement la structure du JSON, et donc de la plupart des API.</p>
${code('python', `eleves = {
    "ana": {"notes": [15, 12], "classe": "B"},
    "bob": {"notes": [9, 14], "classe": "A"},
}
print(eleves["ana"]["notes"][0])    # 15`)}
<h2>Les ensembles (set)</h2>
<p>Un <strong>set</strong> est une collection non ordonnée <em>sans doublons</em>. Idéal pour dédupliquer et pour les tests d'appartenance rapides.</p>
${code('python', `tags = {"python", "web", "python"}
print(tags)                     # {'python', 'web'}
tags.add("ia")
a = {1, 2, 3}; b = {3, 4}
print(a & b, a | b, a - b)      # intersection, union, différence
uniques = list(set([3, 1, 3, 2]))`)}
<div class="callout info"><b>Clés valides</b>Une clé de dictionnaire (ou un élément de set) doit être immuable : chaîne, nombre, tuple. Pas de liste.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Inventaire de boutique',
            enonce: `<p>Complète trois fonctions travaillant sur un dictionnaire <code>stock</code> de la forme <code>{"pomme": {"prix": 0.5, "qte": 40}, ...}</code> :</p><ul><li><code>valeur_totale(stock)</code> : somme de prix × qte, arrondie à 2 décimales ;</li><li><code>en_rupture(stock)</code> : liste triée des produits dont la quantité est 0 ;</li><li><code>vendre(stock, produit, n)</code> : diminue la quantité de <code>n</code> et renvoie <code>True</code>, ou renvoie <code>False</code> sans rien changer si le produit n'existe pas ou si le stock est insuffisant.</li></ul>`,
            depart: `stock = {
    "pomme": {"prix": 0.5, "qte": 40},
    "poire": {"prix": 0.8, "qte": 0},
    "kiwi": {"prix": 0.6, "qte": 12},
    "mangue": {"prix": 2.2, "qte": 0},
}

def valeur_totale(stock):
    ...

def en_rupture(stock):
    ...

def vendre(stock, produit, n):
    ...

print(valeur_totale(stock))
print(en_rupture(stock))
print(vendre(stock, "kiwi", 5), stock["kiwi"]["qte"])
print(vendre(stock, "kiwi", 50))
print(vendre(stock, "ananas", 1))
`,
            solution: `stock = {
    "pomme": {"prix": 0.5, "qte": 40},
    "poire": {"prix": 0.8, "qte": 0},
    "kiwi": {"prix": 0.6, "qte": 12},
    "mangue": {"prix": 2.2, "qte": 0},
}

def valeur_totale(stock):
    total = 0
    for info in stock.values():
        total += info["prix"] * info["qte"]
    return round(total, 2)

def en_rupture(stock):
    return sorted([p for p, info in stock.items() if info["qte"] == 0])

def vendre(stock, produit, n):
    if produit not in stock or stock[produit]["qte"] < n:
        return False
    stock[produit]["qte"] -= n
    return True

print(valeur_totale(stock))
print(en_rupture(stock))
print(vendre(stock, "kiwi", 5), stock["kiwi"]["qte"])
print(vendre(stock, "kiwi", 50))
print(vendre(stock, "ananas", 1))`,
            tests: [sansErreur(), expr('valeur_totale({"a": {"prix": 2, "qte": 3}, "b": {"prix": 0.5, "qte": 1}})', 6.5), expr('en_rupture({"z": {"prix": 1, "qte": 0}, "a": {"prix": 1, "qte": 0}, "m": {"prix": 1, "qte": 3}})', ['a', 'z']), expr('vendre({"x": {"prix": 1, "qte": 2}}, "x", 2)', true), expr('vendre({"x": {"prix": 1, "qte": 2}}, "x", 3)', false), expr('vendre({"x": {"prix": 1, "qte": 2}}, "y", 1)', false, 'Un produit inexistant doit renvoyer False, pas lever KeyError : teste produit in stock.'),
              exprVerif('(lambda s: (vendre(s, "x", 3), s["x"]["qte"])[1])({"x": {"prix": 1, "qte": 2}})', 'Un échec de vente ne modifie pas le stock', v => v === 2)]
          },
          quiz: [
            { q: 'Que renvoie <code>d.get("k", 0)</code> si la clé "k" n\'existe pas ?', options: ['None', '0', 'KeyError'], bonne: 1, explication: 'get renvoie la valeur par défaut fournie (ici 0) au lieu de lever une erreur.' },
            { q: 'Que vaut <code>len({1, 2, 2, 3, 3, 3})</code> ?', options: ['6', '3', 'Erreur'], bonne: 1, explication: 'Un set élimine les doublons : il reste {1, 2, 3}.' },
            { q: 'Quel type ne peut PAS servir de clé de dictionnaire ?', options: ['tuple', 'str', 'list'], bonne: 2, explication: 'Les listes sont modifiables, donc non hachables : interdites comme clés.' }
          ]
        },
        {
          titre: 'Chaînes de caractères et formatage',
          theorie: `<p>Le texte est partout : fichiers, formulaires, API. Les chaînes Python sont <strong>immuables</strong> : chaque méthode renvoie une nouvelle chaîne, l'originale ne change jamais.</p>
${code('python', `s = "  Bonjour le Monde  "
print(s.strip())              # "Bonjour le Monde" : retire les espaces aux extrémités
print(s.lower(), s.upper())   # minuscules / majuscules
print(s.strip().title())      # Bonjour Le Monde
print("monde" in s.lower())   # True
print(s.replace("Monde", "Web"))
print(s.strip().split(" "))   # ['Bonjour', 'le', 'Monde']
print(s.strip().startswith("Bon"), s.endswith("x"))   # True False
print(s.count("o"))           # 3
print(s.find("le"))           # indice de la première occurrence, -1 si absent`)}
<h2>Indexation et tranches</h2>
<p>Une chaîne se manipule comme une liste de caractères : <code>s[0]</code>, <code>s[-1]</code>, <code>s[2:5]</code>, <code>s[::-1]</code> (inversion). <code>len(s)</code> donne la longueur.</p>
<h2>Construire du texte</h2>
<p>Concaténer dans une boucle avec <code>+</code> est lent (une nouvelle chaîne à chaque tour). Le bon réflexe : accumuler dans une liste puis <code>"".join(liste)</code>.</p>
${code('python', `lignes = []
for i in range(3):
    lignes.append(f"Ligne {i}")
print("\\n".join(lignes))      # \\n = saut de ligne`)}
<h2>Les f-strings en détail</h2>
${code('python', `prix = 1234.5
print(f"{prix:.2f}")        # 1234.50     deux décimales
print(f"{prix:>10.1f}|")    #     1234.5| aligné à droite sur 10 caractères
print(f"{prix:,.0f}")       # 1,234       séparateur de milliers
print(f"{0.256:.1%}")       # 25.6%
print(f"{'ok':^8}|")        #    ok   |  centré
print(f"{42:05d}")          # 00042
print(f"{prix=}")           # prix=1234.5  pratique pour déboguer`)}
<h2>Caractères spéciaux et Unicode</h2>
<p><code>\\n</code> (nouvelle ligne), <code>\\t</code> (tabulation), <code>\\"</code> (guillemet dans une chaîne à guillemets). Les chaînes brutes <code>r"C:\\dossier"</code> désactivent ces séquences, utile pour les chemins Windows et les regex. Python 3 gère l'Unicode nativement : <code>"é".upper()</code>, <code>len("😀") == 1</code>. <code>ord("A")</code> donne le code 65, <code>chr(65)</code> fait l'inverse.</p>
<h2>Vérifier un contenu</h2>
${code('python', `"123".isdigit()      # True
"abc".isalpha()      # True
"Ab1".isalnum()      # True
"  ".isspace()       # True`)}
<div class="callout info"><b>Immuabilité</b><code>s.upper()</code> ne change pas <code>s</code> : il faut écrire <code>s = s.upper()</code>. C'est une source classique de bug.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Nettoyage de données',
            enonce: `<p>Écris <code>normaliser_email(e)</code> qui retire les espaces aux extrémités et met en minuscules, <code>initiales(nom_complet)</code> qui renvoie les initiales en majuscules séparées par des points (<code>"jean paul sartre"</code> → <code>"J.P.S."</code>), et <code>est_palindrome(s)</code> qui ignore la casse et les espaces (<code>"Engage le jeu que je le gagne"</code> → <code>True</code>).</p>`,
            depart: `def normaliser_email(e):
    ...

def initiales(nom_complet):
    ...

def est_palindrome(s):
    ...

print(normaliser_email("  Ana.Sow@Mail.FR "))
print(initiales("jean paul sartre"))
print(est_palindrome("Engage le jeu que je le gagne"))
`,
            solution: `def normaliser_email(e):
    return e.strip().lower()

def initiales(nom_complet):
    mots = nom_complet.split()
    return "".join(m[0].upper() + "." for m in mots)

def est_palindrome(s):
    propre = s.replace(" ", "").lower()
    return propre == propre[::-1]

print(normaliser_email("  Ana.Sow@Mail.FR "))
print(initiales("jean paul sartre"))
print(est_palindrome("Engage le jeu que je le gagne"))`,
            tests: [sansErreur(), expr('normaliser_email("  Ana.Sow@Mail.FR ")', 'ana.sow@mail.fr'), expr('initiales("jean paul sartre")', 'J.P.S.'), expr('initiales("Marie Curie")', 'M.C.'), expr('est_palindrome("Engage le jeu que je le gagne")', true), expr('est_palindrome("kayak")', true), expr('est_palindrome("python")', false)]
          },
          quiz: [
            { q: 'Après <code>s = "abc"; s.upper()</code>, que vaut <code>s</code> ?', options: ['"ABC"', '"abc"', 'None'], bonne: 1, explication: 'Les chaînes sont immuables : upper() renvoie une nouvelle chaîne qu\'on n\'a pas stockée.' },
            { q: 'Que donne <code>f"{3.14159:.2f}"</code> ?', options: ['3.14', '3.1416', '3.142'], bonne: 0, explication: '.2f formate avec exactement deux décimales.' },
            { q: 'Quelle est la façon efficace d\'assembler 10 000 morceaux de texte ?', options: ['Boucle avec +=', '"".join(liste)', 'print répété'], bonne: 1, explication: 'join crée une seule chaîne en une passe ; += recrée une chaîne à chaque tour.' }
          ]
        },
        {
          titre: 'Compréhensions et fonctions intégrées',
          theorie: `<p>Python brille par sa concision quand on transforme des collections. Les <strong>compréhensions de liste</strong> remplacent la boucle « créer une liste vide, parcourir, ajouter » par une seule expression lisible.</p>
${code('python', `nombres = [1, 2, 3, 4, 5, 6]

# Boucle classique
carres = []
for n in nombres:
    carres.append(n ** 2)

# Compréhension équivalente
carres = [n ** 2 for n in nombres]              # [1, 4, 9, 16, 25, 36]
pairs = [n for n in nombres if n % 2 == 0]      # filtre : [2, 4, 6]
libelles = ["pair" if n % 2 == 0 else "impair" for n in nombres]`)}
<p>Lecture : « pour chaque <code>n</code> dans <code>nombres</code>, (si condition), garde <code>n ** 2</code> ». Si la ligne dépasse ~80 caractères ou imbrique deux <code>for</code>, reviens à une boucle : la lisibilité prime.</p>
<h2>Compréhensions de dictionnaire et d'ensemble</h2>
${code('python', `prix = {"pomme": 0.5, "kiwi": 0.6}
prix_ttc = {k: round(v * 1.2, 2) for k, v in prix.items()}
longueurs = {len(mot) for mot in ["a", "bb", "cc"]}    # {1, 2}`)}
<h2>Fonctions intégrées à connaître</h2>
${code('python', `zip(["a", "b"], [1, 2])          # couples ('a', 1), ('b', 2)
dict(zip(["a", "b"], [1, 2]))    # {'a': 1, 'b': 2}
sorted(mots, key=len)            # tri par longueur
sorted(eleves, key=lambda e: e["note"], reverse=True)
max(mots, key=len)               # le mot le plus long
any(n > 5 for n in nombres)      # True si au moins un
all(n > 0 for n in nombres)      # True si tous
list(map(str, [1, 2]))           # ['1', '2']
list(filter(lambda n: n > 2, nombres))
round(2.675, 2), abs(-3), divmod(17, 5)   # (3, 2) : quotient et reste`)}
<h2>Les lambdas</h2>
<p><code>lambda x: x * 2</code> est une fonction anonyme d'une seule expression. On l'utilise comme argument <code>key</code> ou dans <code>map</code>/<code>filter</code>. Pour autre chose qu'une ligne, écris un vrai <code>def</code>.</p>
<h2>Générateurs : traiter sans tout stocker</h2>
<p>Remplace les crochets par des parenthèses et tu obtiens un <strong>générateur</strong> : les valeurs sont produites à la demande, une par une, sans créer la liste complète en mémoire. Parfait pour <code>sum</code>, <code>max</code>, <code>any</code> sur de gros volumes.</p>
${code('python', `total = sum(n ** 2 for n in range(1_000_000))   # pas de liste d'un million d'éléments`)}
<div class="callout info"><b>Règle de style</b>Une compréhension doit se lire d'un coup d'œil. Si tu hésites, c'est qu'une boucle avec un nom de variable explicite sera plus claire.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Analyse de commandes',
            enonce: `<p>À partir de la liste <code>commandes</code> (dictionnaires avec <code>client</code>, <code>montant</code>, <code>payee</code>), écris en utilisant des compréhensions ou des fonctions intégrées :</p><ul><li><code>montants_impayes(commandes)</code> : liste des montants des commandes non payées ;</li><li><code>total_par_client(commandes)</code> : dictionnaire client → somme des montants (toutes commandes) ;</li><li><code>meilleur_client(commandes)</code> : le nom du client au plus gros total.</li></ul>`,
            depart: `commandes = [
    {"client": "Ana", "montant": 120.0, "payee": True},
    {"client": "Bob", "montant": 80.0, "payee": False},
    {"client": "Ana", "montant": 45.5, "payee": False},
    {"client": "Chloé", "montant": 200.0, "payee": True},
]

def montants_impayes(commandes):
    ...

def total_par_client(commandes):
    ...

def meilleur_client(commandes):
    ...

print(montants_impayes(commandes))
print(total_par_client(commandes))
print(meilleur_client(commandes))
`,
            solution: `commandes = [
    {"client": "Ana", "montant": 120.0, "payee": True},
    {"client": "Bob", "montant": 80.0, "payee": False},
    {"client": "Ana", "montant": 45.5, "payee": False},
    {"client": "Chloé", "montant": 200.0, "payee": True},
]

def montants_impayes(commandes):
    return [c["montant"] for c in commandes if not c["payee"]]

def total_par_client(commandes):
    totaux = {}
    for c in commandes:
        totaux[c["client"]] = totaux.get(c["client"], 0) + c["montant"]
    return totaux

def meilleur_client(commandes):
    totaux = total_par_client(commandes)
    return max(totaux, key=totaux.get)

print(montants_impayes(commandes))
print(total_par_client(commandes))
print(meilleur_client(commandes))`,
            tests: [sansErreur(), expr('montants_impayes(commandes)', [80.0, 45.5]), expr('total_par_client(commandes)', { Ana: 165.5, Bob: 80.0, 'Chloé': 200.0 }), expr('meilleur_client(commandes)', 'Chloé'), codeRegex(/\[.*\bfor\b.*\]/s, 'Le code utilise une compréhension de liste', 'montants_impayes se prête parfaitement à une compréhension : [c["montant"] for c in commandes if ...].')]
          },
          quiz: [
            { q: 'Que vaut <code>[x * 2 for x in range(3)]</code> ?', options: ['[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]'], bonne: 0, explication: 'range(3) donne 0, 1, 2 ; multipliés par 2 : 0, 2, 4.' },
            { q: 'Quel argument de <code>sorted()</code> permet de trier des dictionnaires par une clé ?', options: ['by', 'key', 'field'], bonne: 1, explication: 'key reçoit une fonction qui extrait la valeur de tri, par exemple key=lambda d: d["note"].' },
            { q: 'Avantage d\'un générateur <code>(x for x in …)</code> sur une liste ?', options: ['Plus rapide à indexer', 'Ne stocke pas tous les éléments en mémoire', 'Peut être parcouru plusieurs fois'], bonne: 1, explication: 'Il produit les valeurs à la demande. En contrepartie il ne se parcourt qu\'une fois et n\'est pas indexable.' }
          ]
        }
      ]
    },
    {
      titre: 'Niveau intermédiaire', niveau: 'Intermédiaire', description: 'Gérer les erreurs, structurer avec des classes, utiliser la bibliothèque standard et lire/écrire des fichiers.',
      lecons: [
        {
          titre: 'Gérer les erreurs : exceptions',
          theorie: `<p>Un programme réel rencontre des situations imprévues : fichier absent, division par zéro, texte non convertible. Python signale ces situations par des <strong>exceptions</strong>. Non gérée, une exception arrête le programme avec une <em>traceback</em> ; gérée, elle devient une branche normale du code.</p>
${code('python', `def convertir(texte):
    try:
        return int(texte)
    except ValueError:
        print(f"'{texte}' n'est pas un entier")
        return None

print(convertir("42"))     # 42
print(convertir("abc"))    # message, puis None`)}
<h2>Anatomie de try</h2>
${code('python', `try:
    resultat = 10 / diviseur
except ZeroDivisionError:
    print("Division par zéro")
except (TypeError, ValueError) as e:     # plusieurs types, accès à l'objet
    print("Entrée invalide :", e)
else:
    print("Succès :", resultat)         # exécuté seulement si aucune exception
finally:
    print("Toujours exécuté")           # nettoyage (fermer un fichier...)`)}
<p>Attrape des exceptions <strong>précises</strong>. Un <code>except Exception</code> global masque les bugs : une faute de frappe dans un nom de variable (<code>NameError</code>) serait avalée silencieusement.</p>
<h2>Lever ses propres exceptions</h2>
${code('python', `def retirer(solde, montant):
    if montant <= 0:
        raise ValueError("Le montant doit être positif")
    if montant > solde:
        raise ValueError("Solde insuffisant")
    return solde - montant`)}
<p><code>raise</code> interrompt la fonction et remonte jusqu'au premier <code>except</code> compatible. Pour des erreurs métier, définis ta propre classe :</p>
${code('python', `class SoldeInsuffisant(Exception):
    pass

try:
    raise SoldeInsuffisant("il manque 20 €")
except SoldeInsuffisant as e:
    print("Refusé :", e)`)}
<h2>Les exceptions courantes</h2>
<table><tr><th>Exception</th><th>Cause typique</th></tr>
<tr><td><code>ValueError</code></td><td>Bon type, mauvaise valeur : <code>int("x")</code></td></tr>
<tr><td><code>TypeError</code></td><td>Mauvais type : <code>"a" + 1</code></td></tr>
<tr><td><code>KeyError</code> / <code>IndexError</code></td><td>Clé ou indice absent</td></tr>
<tr><td><code>FileNotFoundError</code></td><td>Fichier introuvable</td></tr>
<tr><td><code>ZeroDivisionError</code></td><td>Division par 0</td></tr>
<tr><td><code>AttributeError</code></td><td>Méthode inexistante : <code>None.upper()</code></td></tr></table>
<h2>EAFP vs LBYL</h2>
<p>Python préfère « demander pardon » (<em>Easier to Ask Forgiveness than Permission</em>) : tenter l'opération dans un <code>try</code> plutôt que multiplier les vérifications préalables. C'est plus lisible et évite les conditions de course.</p>
<div class="callout warn"><b>À ne jamais faire</b><code>except: pass</code>. Au minimum, journalise l'erreur. Une erreur silencieuse coûte des heures de débogage.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Lecture robuste de données',
            enonce: `<p>Écris <code>parser_ligne(ligne)</code> qui reçoit une chaîne <code>"nom;age"</code> et renvoie un tuple <code>(nom, age_entier)</code>. Si le format est invalide (pas de <code>;</code>, âge non entier, âge négatif), la fonction doit lever <code>ValueError</code> avec un message. Puis écris <code>charger(lignes)</code> qui renvoie <code>(valides, nb_erreurs)</code> : la liste des tuples valides et le nombre de lignes rejetées, sans jamais planter.</p>`,
            depart: `def parser_ligne(ligne):
    ...

def charger(lignes):
    ...

donnees = ["Ana;34", "Bob;abc", "Chloé", "Dan;-2", "Eva;27"]
print(charger(donnees))
`,
            solution: `def parser_ligne(ligne):
    if ";" not in ligne:
        raise ValueError(f"séparateur manquant : {ligne}")
    nom, age_texte = ligne.split(";", 1)
    age = int(age_texte)           # lève ValueError si non entier
    if age < 0:
        raise ValueError("âge négatif")
    return (nom, age)

def charger(lignes):
    valides = []
    erreurs = 0
    for ligne in lignes:
        try:
            valides.append(parser_ligne(ligne))
        except ValueError:
            erreurs += 1
    return (valides, erreurs)

donnees = ["Ana;34", "Bob;abc", "Chloé", "Dan;-2", "Eva;27"]
print(charger(donnees))`,
            tests: [sansErreur(), expr('parser_ligne("Ana;34")', ['Ana', 34]), levePython('parser_ligne("Bob;abc")', 'ValueError'), levePython('parser_ligne("Chloé")', 'ValueError'), levePython('parser_ligne("Dan;-2")', 'ValueError'),
              expr('charger(["Ana;34", "Bob;abc", "Chloé", "Dan;-2", "Eva;27"])', [[['Ana', 34], ['Eva', 27]], 3]), codeContient('raise ValueError', 'parser_ligne doit lever ValueError explicitement pour l\'âge négatif.'), codeContient('except ValueError', 'charger doit attraper précisément ValueError.')]
          },
          quiz: [
            { q: 'Quand s\'exécute le bloc <code>finally</code> ?', options: ['Seulement en cas d\'erreur', 'Seulement sans erreur', 'Toujours'], bonne: 2, explication: 'finally sert au nettoyage : il s\'exécute qu\'il y ait eu exception ou non.' },
            { q: 'Pourquoi éviter <code>except Exception:</code> sans précision ?', options: ['C\'est plus lent', 'Cela masque des bugs inattendus', 'C\'est une erreur de syntaxe'], bonne: 1, explication: 'Attraper tout empêche de voir les vraies erreurs de programmation.' },
            { q: 'Quelle exception lève <code>int("3.5")</code> ?', options: ['TypeError', 'ValueError', 'Aucune, renvoie 3'], bonne: 1, explication: 'Le type est bon (str) mais la valeur n\'est pas un entier : ValueError.' }
          ]
        },
        {
          titre: 'Programmation orientée objet',
          theorie: `<p>Jusqu'ici, données (dictionnaires) et comportements (fonctions) étaient séparés. La <strong>programmation orientée objet</strong> les regroupe dans des <strong>classes</strong>. Une classe est un moule ; chaque <strong>objet</strong> (instance) créé à partir du moule a ses propres données.</p>
${code('python', `class CompteBancaire:
    taux_interet = 0.02                      # attribut de classe (partagé)

    def __init__(self, titulaire, solde=0):  # constructeur
        self.titulaire = titulaire           # attributs d'instance
        self.solde = solde

    def deposer(self, montant):              # méthode : self = l'objet courant
        if montant <= 0:
            raise ValueError("montant invalide")
        self.solde += montant

    def __str__(self):                       # représentation texte pour print()
        return f"{self.titulaire} : {self.solde:.2f} €"

compte = CompteBancaire("Ana", 100)
compte.deposer(50)
print(compte)                                # Ana : 150.00 €`)}
<p><code>self</code> est le premier paramètre de toute méthode : c'est l'objet sur lequel on travaille. Python le passe automatiquement à l'appel <code>compte.deposer(50)</code>.</p>
<h2>Méthodes spéciales (« dunder »)</h2>
<p>Les méthodes entourées de doubles tirets bas branchent ta classe sur la syntaxe du langage : <code>__str__</code> (print), <code>__repr__</code> (débogage), <code>__eq__</code> (<code>==</code>), <code>__lt__</code> (<code>&lt;</code>, permet <code>sorted</code>), <code>__len__</code>, <code>__add__</code> (<code>+</code>), <code>__getitem__</code> (<code>obj[i]</code>).</p>
<h2>Héritage</h2>
${code('python', `class CompteEpargne(CompteBancaire):          # hérite de CompteBancaire
    def __init__(self, titulaire, solde=0, plafond=10000):
        super().__init__(titulaire, solde)        # appelle le constructeur parent
        self.plafond = plafond

    def deposer(self, montant):                   # redéfinition (override)
        if self.solde + montant > self.plafond:
            raise ValueError("plafond dépassé")
        super().deposer(montant)

    def appliquer_interets(self):
        self.solde *= 1 + self.taux_interet`)}
<p><code>isinstance(obj, CompteBancaire)</code> est vrai aussi pour un <code>CompteEpargne</code>. Règle : hérite quand B <em>est un</em> A ; sinon préfère la <strong>composition</strong> (B <em>possède</em> un A comme attribut).</p>
<h2>Propriétés et encapsulation</h2>
<p>Python n'a pas de <code>private</code> strict. La convention : un attribut préfixé <code>_</code> est interne. <code>@property</code> expose un calcul comme un attribut :</p>
${code('python', `class Cercle:
    def __init__(self, rayon):
        self._rayon = rayon
    @property
    def aire(self):
        return 3.14159 * self._rayon ** 2

print(Cercle(2).aire)     # 12.56636 — sans parenthèses`)}
<div class="callout info"><b>Quand créer une classe ?</b>Quand plusieurs fonctions manipulent la même structure de données, ou quand tu as besoin d'un état qui évolue (compte, joueur, connexion). Pour de simples données, un dictionnaire ou une dataclass suffit.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Panier d\'achat',
            enonce: `<p>Crée une classe <code>Produit</code> (attributs <code>nom</code>, <code>prix</code>) et une classe <code>Panier</code> avec : une liste interne d'articles, une méthode <code>ajouter(produit, quantite=1)</code>, une propriété <code>total</code> (somme prix × quantité), une méthode <code>__len__</code> renvoyant le nombre total d'unités, et <code>__str__</code> renvoyant <code>"Panier : N articles, X.XX €"</code>. Si on ajoute deux fois le même produit (même nom), les quantités se cumulent.</p>`,
            depart: `class Produit:
    def __init__(self, nom, prix):
        ...

class Panier:
    def __init__(self):
        ...

    def ajouter(self, produit, quantite=1):
        ...

    @property
    def total(self):
        ...

    def __len__(self):
        ...

    def __str__(self):
        ...

p = Panier()
p.ajouter(Produit("Stylo", 1.5), 3)
p.ajouter(Produit("Cahier", 2.2))
p.ajouter(Produit("Stylo", 1.5), 2)
print(p)
`,
            solution: `class Produit:
    def __init__(self, nom, prix):
        self.nom = nom
        self.prix = prix

class Panier:
    def __init__(self):
        self._articles = {}   # nom -> [produit, quantite]

    def ajouter(self, produit, quantite=1):
        if produit.nom in self._articles:
            self._articles[produit.nom][1] += quantite
        else:
            self._articles[produit.nom] = [produit, quantite]

    @property
    def total(self):
        return round(sum(p.prix * q for p, q in self._articles.values()), 2)

    def __len__(self):
        return sum(q for _, q in self._articles.values())

    def __str__(self):
        return f"Panier : {len(self)} articles, {self.total:.2f} €"

p = Panier()
p.ajouter(Produit("Stylo", 1.5), 3)
p.ajouter(Produit("Cahier", 2.2))
p.ajouter(Produit("Stylo", 1.5), 2)
print(p)`,
            tests: [sansErreur(), expr('len(p)', 6), expr('round(p.total, 2)', 9.7), expr('str(p)', 'Panier : 6 articles, 9.70 €'), exprVerif('Panier().total', 'Un panier vide a un total de 0', v => v === 0), codeContient('@property', 'total doit être une propriété (@property), accessible sans parenthèses.'), codeContient('def __len__', 'Définis __len__ pour que len(panier) fonctionne.')]
          },
          quiz: [
            { q: 'Que représente <code>self</code> ?', options: ['La classe', 'L\'objet sur lequel la méthode est appelée', 'Le module'], bonne: 1, explication: 'self est la référence à l\'instance courante ; Python le passe automatiquement.' },
            { q: 'À quoi sert <code>super().__init__()</code> ?', options: ['À créer une sous-classe', 'À appeler le constructeur de la classe parente', 'À supprimer l\'objet'], bonne: 1, explication: 'Dans une classe fille, super() donne accès aux méthodes du parent, notamment pour initialiser ses attributs.' },
            { q: 'Quelle méthode spéciale est utilisée par <code>print(obj)</code> ?', options: ['__print__', '__str__', '__init__'], bonne: 1, explication: 'print appelle str(obj), qui appelle __str__ (ou __repr__ à défaut).' }
          ]
        },
        {
          titre: 'Modules et bibliothèque standard',
          theorie: `<p>Un <strong>module</strong> est simplement un fichier <code>.py</code>. On l'importe pour réutiliser ses fonctions. Python est livré « piles incluses » : sa bibliothèque standard couvre les maths, les dates, le hasard, le JSON, les fichiers, le réseau et bien plus, sans rien installer.</p>
${code('python', `import math                       # module entier, accès par préfixe
print(math.sqrt(16), math.pi)     # 4.0 3.14159...

from random import randint, choice   # fonctions précises
print(randint(1, 6))              # entier aléatoire entre 1 et 6 inclus
print(choice(["pile", "face"]))

import datetime as dt             # alias
print(dt.date.today())`)}
<p>Évite <code>from module import *</code> : on ne sait plus d'où viennent les noms.</p>
<h2>Modules indispensables</h2>
<table><tr><th>Module</th><th>Pour quoi</th><th>Exemple</th></tr>
<tr><td><code>math</code></td><td>Fonctions mathématiques</td><td><code>math.floor(3.7)</code>, <code>math.gcd(12, 18)</code></td></tr>
<tr><td><code>random</code></td><td>Hasard (jeux, simulation)</td><td><code>random.shuffle(liste)</code>, <code>random.sample(liste, 3)</code></td></tr>
<tr><td><code>datetime</code></td><td>Dates et durées</td><td><code>dt.datetime(2026, 1, 1) + dt.timedelta(days=30)</code></td></tr>
<tr><td><code>json</code></td><td>Lire/écrire du JSON</td><td><code>json.dumps(obj)</code>, <code>json.loads(texte)</code></td></tr>
<tr><td><code>collections</code></td><td>Structures avancées</td><td><code>Counter</code>, <code>defaultdict</code>, <code>deque</code></td></tr>
<tr><td><code>itertools</code></td><td>Combinatoire, itération</td><td><code>permutations</code>, <code>combinations</code>, <code>groupby</code></td></tr>
<tr><td><code>re</code></td><td>Expressions régulières</td><td><code>re.findall(r"\\d+", texte)</code></td></tr>
<tr><td><code>pathlib</code>, <code>os</code></td><td>Fichiers et dossiers</td><td><code>Path("data").glob("*.csv")</code></td></tr>
<tr><td><code>statistics</code></td><td>Moyenne, médiane, écart-type</td><td><code>statistics.mean(valeurs)</code></td></tr></table>
<h2>JSON : le format universel</h2>
${code('python', `import json
config = {"theme": "sombre", "taille": 14, "plugins": ["git", "lint"]}
texte = json.dumps(config, indent=2, ensure_ascii=False)   # objet → texte
print(texte)
copie = json.loads(texte)                                   # texte → objet
print(copie["plugins"][0])`)}
<h2>Écrire son propre module</h2>
<p>Place tes fonctions dans <code>outils.py</code>, puis <code>from outils import ma_fonction</code> dans un autre fichier du même dossier. Le bloc suivant permet de tester un module en le lançant directement, sans que le test s'exécute lors d'un import :</p>
${code('python', `def principal():
    print("Lancé directement")

if __name__ == "__main__":     # vrai seulement si ce fichier est le point d'entrée
    principal()`)}
<h2>Installer des bibliothèques externes</h2>
<p>Le gestionnaire <code>pip</code> installe les paquets de <a href="https://pypi.org" target="_blank" rel="noopener">PyPI</a> : <code>pip install requests</code>. Travaille toujours dans un environnement virtuel pour isoler chaque projet : <code>python3 -m venv .venv</code> puis <code>source .venv/bin/activate</code> (Windows : <code>.venv\\Scripts\\activate</code>). Liste les dépendances dans <code>requirements.txt</code>.</p>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Statistiques et dates',
            enonce: `<p>Avec la bibliothèque standard uniquement : écris <code>resume(valeurs)</code> qui renvoie un dictionnaire <code>{"moyenne", "mediane", "ecart_type"}</code> arrondis à 2 décimales (module <code>statistics</code>, écart-type d'échantillon <code>stdev</code>), <code>jours_jusqua(annee, mois, jour)</code> qui renvoie le nombre de jours entre le 1<sup>er</sup> janvier 2026 et cette date (module <code>datetime</code>), et <code>vers_json(d)</code> qui renvoie la chaîne JSON triée par clés (<code>sort_keys=True</code>).</p>`,
            depart: `import statistics
import datetime
import json

def resume(valeurs):
    ...

def jours_jusqua(annee, mois, jour):
    ...

def vers_json(d):
    ...

print(resume([2, 4, 4, 4, 5, 5, 7, 9]))
print(jours_jusqua(2026, 3, 1))
print(vers_json({"b": 1, "a": [1, 2]}))
`,
            solution: `import statistics
import datetime
import json

def resume(valeurs):
    return {
        "moyenne": round(statistics.mean(valeurs), 2),
        "mediane": round(statistics.median(valeurs), 2),
        "ecart_type": round(statistics.stdev(valeurs), 2),
    }

def jours_jusqua(annee, mois, jour):
    origine = datetime.date(2026, 1, 1)
    return (datetime.date(annee, mois, jour) - origine).days

def vers_json(d):
    return json.dumps(d, sort_keys=True)

print(resume([2, 4, 4, 4, 5, 5, 7, 9]))
print(jours_jusqua(2026, 3, 1))
print(vers_json({"b": 1, "a": [1, 2]}))`,
            tests: [sansErreur(), expr('resume([2, 4, 4, 4, 5, 5, 7, 9])', { moyenne: 5, mediane: 4.5, ecart_type: 2.14 }), expr('jours_jusqua(2026, 3, 1)', 59), expr('jours_jusqua(2027, 1, 1)', 365), expr('vers_json({"b": 1, "a": [1, 2]})', '{"a": [1, 2], "b": 1}'), codeContient('statistics.', 'Utilise le module statistics (mean, median, stdev).')]
          },
          quiz: [
            { q: 'Quelle écriture est déconseillée ?', options: ['import math', 'from math import sqrt', 'from math import *'], bonne: 2, explication: 'L\'import étoile pollue l\'espace de noms et rend l\'origine des fonctions opaque.' },
            { q: 'Que fait <code>json.loads()</code> ?', options: ['Charge un fichier', 'Convertit une chaîne JSON en objet Python', 'Convertit un objet en chaîne'], bonne: 1, explication: 'loads = load string. json.dumps fait l\'inverse ; json.load/json.dump travaillent sur des fichiers.' },
            { q: 'À quoi sert <code>if __name__ == "__main__":</code> ?', options: ['À définir la fonction main', 'À n\'exécuter un bloc que si le fichier est lancé directement', 'À importer le module principal'], bonne: 1, explication: 'Lors d\'un import, __name__ vaut le nom du module, pas "__main__" : le bloc est ignoré.' }
          ]
        },
        {
          titre: 'Fichiers, CSV et JSON',
          theorie: `<p>Un programme utile lit et écrit des données persistantes. En Python, on ouvre un fichier avec <code>open()</code> et, surtout, avec le mot-clé <code>with</code> qui garantit sa fermeture même en cas d'erreur.</p>
${code('python', `# Écriture ("w" écrase, "a" ajoute à la fin)
with open("notes.txt", "w", encoding="utf-8") as f:
    f.write("Ana;15\\n")
    f.write("Bob;12\\n")

# Lecture complète
with open("notes.txt", encoding="utf-8") as f:
    contenu = f.read()

# Lecture ligne par ligne (économe en mémoire)
with open("notes.txt", encoding="utf-8") as f:
    for ligne in f:
        nom, note = ligne.strip().split(";")
        print(nom, int(note))`)}
<p>Précise toujours <code>encoding="utf-8"</code> : sans cela, l'encodage dépend du système et les accents cassent sous Windows.</p>
<h2>Modes d'ouverture</h2>
<table><tr><th>Mode</th><th>Effet</th></tr><tr><td><code>"r"</code></td><td>lecture (défaut), erreur si absent</td></tr><tr><td><code>"w"</code></td><td>écriture, crée ou écrase</td></tr><tr><td><code>"a"</code></td><td>ajout à la fin</td></tr><tr><td><code>"x"</code></td><td>création, erreur si existe déjà</td></tr><tr><td><code>"rb"</code> / <code>"wb"</code></td><td>binaire (images, etc.)</td></tr></table>
<h2>CSV</h2>
<p>Le module <code>csv</code> gère les guillemets, séparateurs et sauts de ligne mieux qu'un <code>split(";")</code> maison.</p>
${code('python', `import csv
with open("ventes.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f, delimiter=";")
    w.writerow(["produit", "qte", "prix"])
    w.writerow(["stylo", 3, 1.5])

with open("ventes.csv", newline="", encoding="utf-8") as f:
    for ligne in csv.DictReader(f, delimiter=";"):     # dict par ligne
        print(ligne["produit"], float(ligne["prix"]))`)}
<h2>JSON sur disque</h2>
${code('python', `import json
donnees = {"taches": [{"titre": "Lire", "fait": False}]}
with open("taches.json", "w", encoding="utf-8") as f:
    json.dump(donnees, f, indent=2, ensure_ascii=False)
with open("taches.json", encoding="utf-8") as f:
    donnees = json.load(f)`)}
<h2>Chemins avec pathlib</h2>
${code('python', `from pathlib import Path
p = Path("data") / "export.csv"      # concaténation portable (/ ou \\)
print(p.suffix, p.stem, p.exists())  # .csv export False
Path("data").mkdir(exist_ok=True)
texte = Path("notes.txt").read_text(encoding="utf-8")   # raccourci`)}
<div class="callout info"><b>Dans l'éditeur Lumio</b>Pyodide fournit un système de fichiers virtuel en mémoire : <code>open()</code> fonctionne normalement, les fichiers disparaissent au rechargement de la page.</div>
<div class="callout warn"><b>Erreurs à gérer</b><code>FileNotFoundError</code> en lecture, <code>PermissionError</code> en écriture, <code>json.JSONDecodeError</code> si le JSON est corrompu. Entoure les lectures de <code>try/except</code> et prévois une valeur par défaut.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Journal de dépenses',
            enonce: `<p>Écris <code>ajouter_depense(chemin, libelle, montant)</code> qui ajoute une ligne <code>libelle;montant</code> à la fin du fichier (mode ajout), et <code>total_depenses(chemin)</code> qui lit le fichier et renvoie la somme des montants, en renvoyant <code>0.0</code> si le fichier n'existe pas (sans planter). Le fichier est créé dans le système de fichiers virtuel de Pyodide.</p>`,
            depart: `def ajouter_depense(chemin, libelle, montant):
    ...

def total_depenses(chemin):
    ...

print(total_depenses("depenses.txt"))   # 0.0 : fichier absent
ajouter_depense("depenses.txt", "café", 2.5)
ajouter_depense("depenses.txt", "livre", 18)
print(total_depenses("depenses.txt"))   # 20.5
`,
            solution: `def ajouter_depense(chemin, libelle, montant):
    with open(chemin, "a", encoding="utf-8") as f:
        f.write(f"{libelle};{montant}\\n")

def total_depenses(chemin):
    try:
        with open(chemin, encoding="utf-8") as f:
            total = 0.0
            for ligne in f:
                if ligne.strip():
                    _, montant = ligne.strip().split(";")
                    total += float(montant)
            return total
    except FileNotFoundError:
        return 0.0

print(total_depenses("depenses.txt"))
ajouter_depense("depenses.txt", "café", 2.5)
ajouter_depense("depenses.txt", "livre", 18)
print(total_depenses("depenses.txt"))`,
            tests: [sansErreur(), expr('total_depenses("inexistant_xyz.txt")', 0.0, 'Si le fichier n\'existe pas, attrape FileNotFoundError et renvoie 0.0.'), exprVerif('(lambda: (__import__("os").remove("t_test.txt") if __import__("os").path.exists("t_test.txt") else None, ajouter_depense("t_test.txt", "a", 1.5), ajouter_depense("t_test.txt", "b", 2), total_depenses("t_test.txt"))[-1])()', 'Deux ajouts puis total = 3.5', v => Math.abs(v - 3.5) < 1e-9, 'Après deux ajouts (1.5 et 2), le total doit valoir 3.5 : vérifie le mode "a" et le saut de ligne.'), codeContient('with open', 'Utilise with open(...) pour garantir la fermeture du fichier.'), codeRegex(/open\([^)]*"a"/, 'Ouverture en mode ajout "a"', 'ajouter_depense doit ouvrir en mode "a" (append).')]
          },
          quiz: [
            { q: 'Pourquoi utiliser <code>with open(...)</code> ?', options: ['C\'est plus rapide', 'Le fichier est fermé automatiquement, même en cas d\'erreur', 'C\'est obligatoire en Python 3'], bonne: 1, explication: 'with gère le contexte : la fermeture est garantie à la sortie du bloc.' },
            { q: 'Quel mode ajoute à la fin sans écraser ?', options: ['"w"', '"a"', '"r+"'], bonne: 1, explication: '"a" (append) positionne l\'écriture à la fin du fichier existant.' },
            { q: 'Quelle fonction écrit un objet Python dans un fichier JSON ?', options: ['json.dumps', 'json.dump', 'json.write'], bonne: 1, explication: 'dump écrit dans un fichier ouvert ; dumps renvoie une chaîne.' }
          ]
        }
      ]
    },
    {
      titre: 'Avancé et projet final', niveau: 'Avancé', description: 'Décorateurs, générateurs, typage et tests, puis un projet complet : un gestionnaire de tâches persistant.',
      lecons: [
        {
          titre: 'Itérateurs, générateurs et décorateurs',
          theorie: `<p>Trois mécanismes font la différence entre « écrire du Python » et « écrire du Python idiomatique » : le protocole d'itération, les générateurs et les décorateurs.</p>
<h2>Le protocole d'itération</h2>
<p>La boucle <code>for</code> fonctionne sur tout objet <em>itérable</em> : elle appelle <code>iter(obj)</code> pour obtenir un itérateur, puis <code>next()</code> jusqu'à l'exception <code>StopIteration</code>. Listes, chaînes, dictionnaires, fichiers, <code>range</code> : tous respectent ce protocole, et tu peux le faire aussi.</p>
${code('python', `it = iter([10, 20])
print(next(it))      # 10
print(next(it))      # 20
# next(it) → StopIteration`)}
<h2>Les générateurs : yield</h2>
<p>Une fonction contenant <code>yield</code> devient un générateur : à chaque <code>yield</code>, elle <em>suspend</em> son exécution et livre une valeur ; elle reprend là où elle s'était arrêtée au prochain <code>next()</code>. Mémoire constante, séquences potentiellement infinies.</p>
${code('python', `def fibonacci():
    a, b = 0, 1
    while True:              # infini, mais paresseux
        yield a
        a, b = b, a + b

for n in fibonacci():
    if n > 100:
        break
    print(n, end=" ")        # 0 1 1 2 3 5 8 13 21 34 55 89

def lire_grand_fichier(chemin):
    with open(chemin) as f:
        for ligne in f:
            yield ligne.strip()      # une ligne à la fois, jamais tout le fichier`)}
<p>Les outils <code>itertools</code> composent les générateurs : <code>islice(fibonacci(), 10)</code> prend les 10 premiers, <code>chain</code>, <code>takewhile</code>, <code>count</code>.</p>
<h2>Les décorateurs</h2>
<p>En Python, une fonction est une valeur : on peut la passer en argument et la renvoyer. Un <strong>décorateur</strong> est une fonction qui prend une fonction et renvoie une version enrichie. La syntaxe <code>@nom</code> est un simple raccourci de <code>f = nom(f)</code>.</p>
${code('python', `import time
from functools import wraps

def chronometre(fonction):
    @wraps(fonction)                     # conserve le nom et la docstring
    def enveloppe(*args, **kwargs):      # accepte tous les arguments
        debut = time.perf_counter()
        resultat = fonction(*args, **kwargs)
        print(f"{fonction.__name__} : {time.perf_counter() - debut:.4f} s")
        return resultat
    return enveloppe

@chronometre
def calcul_lourd(n):
    return sum(i * i for i in range(n))

calcul_lourd(100_000)     # affiche la durée puis renvoie le résultat`)}
<p><code>*args</code> collecte les arguments positionnels dans un tuple, <code>**kwargs</code> les arguments nommés dans un dictionnaire : l'enveloppe fonctionne pour n'importe quelle signature.</p>
<p>Usages courants : mise en cache (<code>@functools.lru_cache</code>, intégré), journalisation, vérification de droits, nouvelle tentative en cas d'erreur, enregistrement de routes dans les frameworks web (<code>@app.route("/")</code> en Flask).</p>
${code('python', `from functools import lru_cache

@lru_cache(maxsize=None)
def fib(n):                      # récursif mais mémoïsé : instantané
    return n if n < 2 else fib(n - 1) + fib(n - 2)
print(fib(80))`)}
<div class="callout info"><b>Les gestionnaires de contexte</b>Le <code>with</code> repose sur le même esprit : <code>__enter__</code>/<code>__exit__</code>, ou plus simplement <code>@contextlib.contextmanager</code> autour d'un générateur qui fait un seul <code>yield</code>.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Générateur et décorateur maison',
            enonce: `<p>1) Écris le générateur <code>nombres_premiers()</code> qui produit indéfiniment les nombres premiers (2, 3, 5, 7, 11, …). 2) Écris le décorateur <code>compter_appels</code> qui ajoute à la fonction décorée un attribut <code>appels</code> incrémenté à chaque appel (l'attribut se pose sur l'enveloppe : <code>enveloppe.appels = 0</code>). 3) Décore une fonction <code>carre(x)</code> avec lui.</p>`,
            depart: `from itertools import islice
from functools import wraps

def nombres_premiers():
    ...

def compter_appels(fonction):
    ...

@compter_appels
def carre(x):
    return x * x

print(list(islice(nombres_premiers(), 10)))
carre(2); carre(3); carre(4)
print(carre.appels)
`,
            solution: `from itertools import islice
from functools import wraps

def nombres_premiers():
    n = 2
    while True:
        est_premier = True
        for d in range(2, int(n ** 0.5) + 1):
            if n % d == 0:
                est_premier = False
                break
        if est_premier:
            yield n
        n += 1

def compter_appels(fonction):
    @wraps(fonction)
    def enveloppe(*args, **kwargs):
        enveloppe.appels += 1
        return fonction(*args, **kwargs)
    enveloppe.appels = 0
    return enveloppe

@compter_appels
def carre(x):
    return x * x

print(list(islice(nombres_premiers(), 10)))
carre(2); carre(3); carre(4)
print(carre.appels)`,
            tests: [sansErreur(), expr('list(islice(nombres_premiers(), 10))', [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]), codeContient('yield', 'nombres_premiers doit être un générateur (mot-clé yield).'), expr('carre(5)', 25), exprVerif('(carre(1), carre.appels)[1]', 'Le compteur d\'appels augmente', v => v >= 4, 'Après plusieurs appels, carre.appels doit refléter leur nombre.'), expr('carre.__name__', 'carre', 'Utilise @wraps(fonction) pour conserver le nom de la fonction décorée.')]
          },
          quiz: [
            { q: 'Que se passe-t-il à un <code>yield</code> ?', options: ['La fonction se termine', 'La fonction livre une valeur et se met en pause', 'La valeur est stockée dans une liste'], bonne: 1, explication: 'Le générateur reprend après le yield au prochain next().' },
            { q: '<code>@deco</code> au-dessus de <code>def f()</code> équivaut à :', options: ['f = deco(f)', 'deco = f', 'f(deco)'], bonne: 0, explication: 'Le décorateur reçoit la fonction et son résultat remplace le nom f.' },
            { q: 'Pourquoi utiliser <code>functools.wraps</code> ?', options: ['Pour accélérer l\'enveloppe', 'Pour conserver le nom et la docstring de la fonction décorée', 'C\'est obligatoire'], bonne: 1, explication: 'Sans wraps, f.__name__ vaudrait "enveloppe", ce qui gêne le débogage et la documentation.' }
          ]
        },
        {
          titre: 'Dataclasses, typage et tests',
          theorie: `<p>Du code « qui marche » au code « professionnel », il y a trois pratiques : décrire ses données, annoter ses types, et tester automatiquement.</p>
<h2>Dataclasses</h2>
<p>Pour une classe qui sert surtout à transporter des données, <code>@dataclass</code> génère automatiquement <code>__init__</code>, <code>__repr__</code> et <code>__eq__</code>.</p>
${code('python', `from dataclasses import dataclass, field

@dataclass
class Tache:
    titre: str
    priorite: int = 2
    faite: bool = False
    tags: list[str] = field(default_factory=list)   # jamais une liste en défaut direct

t = Tache("Réviser Python", priorite=1)
print(t)                       # Tache(titre='Réviser Python', priorite=1, faite=False, tags=[])
print(t == Tache("Réviser Python", 1))   # True : comparaison champ par champ`)}
<p><code>@dataclass(frozen=True)</code> rend les instances immuables (utilisables comme clés) ; <code>order=True</code> génère les comparaisons pour trier.</p>
<h2>Annotations de type</h2>
<p>Python n'impose pas les types, mais on peut les <em>annoter</em>. Ce n'est pas vérifié à l'exécution ; un outil comme <strong>mypy</strong> ou l'éditeur (VS Code, PyCharm) lit les annotations et signale les incohérences avant même de lancer le programme. Et c'est de la documentation vivante.</p>
${code('python', `def moyenne(valeurs: list[float]) -> float:
    return sum(valeurs) / len(valeurs)

def chercher(nom: str, annuaire: dict[str, str]) -> str | None:   # peut renvoyer None
    return annuaire.get(nom)

from typing import Callable
def appliquer(f: Callable[[int], int], x: int) -> int:
    return f(x)`)}
<h2>Tester automatiquement</h2>
<p>Un test est une fonction qui appelle ton code et vérifie le résultat avec <code>assert</code>. L'outil standard moderne est <strong>pytest</strong> (<code>pip install pytest</code>) : il collecte les fonctions <code>test_*</code> des fichiers <code>test_*.py</code> et les exécute avec <code>pytest</code> en ligne de commande.</p>
${code('python', `# fichier test_calculs.py
from calculs import moyenne
import pytest

def test_moyenne_simple():
    assert moyenne([2, 4]) == 3

def test_moyenne_liste_vide():
    with pytest.raises(ZeroDivisionError):   # on attend une exception
        moyenne([])

@pytest.mark.parametrize("valeurs, attendu", [([1], 1), ([1, 2, 3], 2)])
def test_moyenne_param(valeurs, attendu):
    assert moyenne(valeurs) == attendu`)}
<p>Sans installation, le module <code>unittest</code> est intégré (classes héritant de <code>unittest.TestCase</code>, méthodes <code>assertEqual</code>). Et pour les petits scripts, de simples <code>assert</code> en fin de fichier font déjà beaucoup.</p>
<h2>Méthode : écrire le test d'abord</h2>
<ol><li>Écris un test qui décrit le comportement voulu (il échoue).</li><li>Écris le minimum de code pour le faire passer.</li><li>Nettoie (refactorise) en gardant les tests verts.</li></ol>
<p>Pense aux cas limites : liste vide, valeurs négatives, chaîne vide, doublons, très grands nombres.</p>
<div class="callout info"><b>Déboguer efficacement</b>Lis la traceback de bas en haut : la dernière ligne donne le type d'erreur, les lignes au-dessus le chemin exact. <code>print(f"{variable=}")</code> et <code>breakpoint()</code> (débogueur intégré) sont tes amis.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Dataclass et tests',
            enonce: `<p>Crée une dataclass <code>Etudiant</code> (champs <code>nom: str</code>, <code>notes: list[float]</code> avec une liste vide par défaut) dotée d'une méthode <code>moyenne() -> float</code> qui renvoie 0.0 si aucune note, et d'une méthode <code>mention() -> str</code> (« Très bien » ≥ 16, « Bien » ≥ 14, « Assez bien » ≥ 12, « Passable » ≥ 10, sinon « Insuffisant »). Puis écris au moins trois fonctions <code>test_…</code> avec des <code>assert</code> et appelle-les : le programme doit afficher <code>Tests OK</code> à la fin.</p>`,
            depart: `from dataclasses import dataclass, field

@dataclass
class Etudiant:
    ...

def test_moyenne_vide():
    ...

def test_moyenne():
    ...

def test_mention():
    ...

test_moyenne_vide()
test_moyenne()
test_mention()
print("Tests OK")
`,
            solution: `from dataclasses import dataclass, field

@dataclass
class Etudiant:
    nom: str
    notes: list[float] = field(default_factory=list)

    def moyenne(self) -> float:
        if not self.notes:
            return 0.0
        return sum(self.notes) / len(self.notes)

    def mention(self) -> str:
        m = self.moyenne()
        if m >= 16:
            return "Très bien"
        if m >= 14:
            return "Bien"
        if m >= 12:
            return "Assez bien"
        if m >= 10:
            return "Passable"
        return "Insuffisant"

def test_moyenne_vide():
    assert Etudiant("Léa").moyenne() == 0.0

def test_moyenne():
    assert Etudiant("Léa", [12, 16]).moyenne() == 14

def test_mention():
    assert Etudiant("A", [17]).mention() == "Très bien"
    assert Etudiant("B", [9]).mention() == "Insuffisant"
    assert Etudiant("C", [12]).mention() == "Assez bien"

test_moyenne_vide()
test_moyenne()
test_mention()
print("Tests OK")`,
            tests: [sansErreur(), sortieContient('Tests OK'), expr('Etudiant("X").moyenne()', 0.0), expr('Etudiant("X", [12, 16]).moyenne()', 14), expr('Etudiant("X", [16]).mention()', 'Très bien'), expr('Etudiant("X", [13.9]).mention()', 'Assez bien'), expr('Etudiant("X", [9.5]).mention()', 'Insuffisant'), expr('Etudiant("A", [1]) == Etudiant("A", [1])', true, 'Avec @dataclass, deux instances aux mêmes champs sont égales.'), codeContient('@dataclass'), codeRegex(/assert /g, 'Le code contient des assert', 'Tes fonctions de test doivent utiliser assert.')]
          },
          quiz: [
            { q: 'Que génère automatiquement <code>@dataclass</code> ?', options: ['__init__, __repr__ et __eq__', 'Des méthodes de tri uniquement', 'Un fichier JSON'], bonne: 0, explication: 'Le constructeur, la représentation et la comparaison sont déduits des champs annotés.' },
            { q: 'Les annotations de type sont-elles vérifiées à l\'exécution ?', options: ['Oui, Python lève une erreur', 'Non, ce sont des outils externes (mypy, éditeur) qui les vérifient', 'Seulement dans les dataclasses'], bonne: 1, explication: 'Python ignore les annotations à l\'exécution ; elles servent aux outils et à la documentation.' },
            { q: 'Comment pytest trouve-t-il les tests ?', options: ['Il exécute tout le fichier', 'Fonctions test_* dans des fichiers test_*.py', 'Il faut les lister dans un fichier de config'], bonne: 1, explication: 'La convention de nommage suffit : pas de configuration nécessaire pour commencer.' }
          ]
        },
        {
          titre: 'Projet final (1/2) : gestionnaire de tâches',
          theorie: `<p>Place à un projet complet, construit en deux leçons : un <strong>gestionnaire de tâches</strong> en ligne de commande, avec priorités, échéances, filtres et sauvegarde JSON. Cette première partie pose le modèle de données et la logique métier ; la seconde ajoute la persistance et l'interface.</p>
<h2>Cahier des charges</h2>
<ul><li>Une tâche a un identifiant, un titre, une priorité (1 = haute, 2 = normale, 3 = basse), une échéance optionnelle (date ISO <code>AAAA-MM-JJ</code>), un état fait / à faire.</li>
<li>On peut ajouter, terminer, supprimer une tâche, lister par priorité ou par échéance, chercher par mot-clé.</li>
<li>Les tâches en retard (échéance passée et non faites) sont détectables.</li></ul>
<h2>Architecture</h2>
<p>Séparer la <em>logique</em> (classe <code>Gestionnaire</code>, testable, sans aucun <code>print</code>) de la <em>présentation</em> (fonctions qui affichent). C'est la règle d'or qui te permettra, plus tard, de brancher une interface web sur le même cœur.</p>
${code('python', `from dataclasses import dataclass, field, asdict
from datetime import date

@dataclass
class Tache:
    id: int
    titre: str
    priorite: int = 2
    echeance: str | None = None      # "2026-03-01" ou None
    faite: bool = False

    def en_retard(self, aujourdhui: date) -> bool:
        if self.faite or self.echeance is None:
            return False
        return date.fromisoformat(self.echeance) < aujourdhui

class Gestionnaire:
    def __init__(self):
        self.taches: list[Tache] = []
        self._prochain_id = 1

    def ajouter(self, titre, priorite=2, echeance=None) -> Tache:
        if not titre.strip():
            raise ValueError("titre vide")
        if priorite not in (1, 2, 3):
            raise ValueError("priorité invalide")
        if echeance is not None:
            date.fromisoformat(echeance)      # lève ValueError si format incorrect
        t = Tache(self._prochain_id, titre.strip(), priorite, echeance)
        self.taches.append(t)
        self._prochain_id += 1
        return t`)}
<p>Remarque les validations dans <code>ajouter</code> : la logique métier refuse les données incohérentes dès l'entrée, ce qui évite de les retrouver corrompues dans le fichier de sauvegarde.</p>
<h2>Recherche d'une tâche</h2>
${code('python', `    def trouver(self, id_: int) -> Tache:
        for t in self.taches:
            if t.id == id_:
                return t
        raise KeyError(f"tâche {id_} introuvable")

    def terminer(self, id_: int) -> None:
        self.trouver(id_).faite = True

    def supprimer(self, id_: int) -> None:
        t = self.trouver(id_)
        self.taches.remove(t)`)}
<h2>Tri et filtres</h2>
<p><code>sorted(self.taches, key=lambda t: (t.faite, t.priorite, t.echeance or "9999"))</code> place les tâches à faire d'abord, puis par priorité, puis par échéance (les tâches sans date en dernier grâce à <code>"9999"</code>). Une recherche insensible à la casse : <code>[t for t in self.taches if mot.lower() in t.titre.lower()]</code>.</p>
<div class="callout info"><b>Pourquoi un id ?</b>Deux tâches peuvent avoir le même titre. L'identifiant entier, jamais réutilisé, désigne une tâche sans ambiguïté dans les commandes (« terminer 3 »).</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Le cœur du gestionnaire',
            enonce: `<p>Complète la classe <code>Gestionnaire</code> : <code>ajouter</code> (avec validations : titre non vide, priorité ∈ {1,2,3}, échéance ISO valide ou None), <code>trouver</code> (lève <code>KeyError</code>), <code>terminer</code>, <code>supprimer</code>, <code>a_faire()</code> (liste triée : priorité croissante puis échéance, sans date en dernier), <code>en_retard(aujourdhui)</code> et <code>chercher(mot)</code>.</p>`,
            depart: `from dataclasses import dataclass
from datetime import date

@dataclass
class Tache:
    id: int
    titre: str
    priorite: int = 2
    echeance: str | None = None
    faite: bool = False

    def en_retard(self, aujourdhui):
        if self.faite or self.echeance is None:
            return False
        return date.fromisoformat(self.echeance) < aujourdhui

class Gestionnaire:
    def __init__(self):
        self.taches = []
        self._prochain_id = 1

    def ajouter(self, titre, priorite=2, echeance=None):
        ...

    def trouver(self, id_):
        ...

    def terminer(self, id_):
        ...

    def supprimer(self, id_):
        ...

    def a_faire(self):
        ...

    def en_retard(self, aujourdhui):
        ...

    def chercher(self, mot):
        ...

g = Gestionnaire()
g.ajouter("Payer le loyer", 1, "2026-01-05")
g.ajouter("Lire un chapitre", 3)
g.ajouter("Préparer la réunion", 2, "2026-01-10")
g.terminer(2)
print([t.titre for t in g.a_faire()])
print([t.titre for t in g.en_retard(date(2026, 1, 7))])
`,
            solution: `from dataclasses import dataclass
from datetime import date

@dataclass
class Tache:
    id: int
    titre: str
    priorite: int = 2
    echeance: str | None = None
    faite: bool = False

    def en_retard(self, aujourdhui):
        if self.faite or self.echeance is None:
            return False
        return date.fromisoformat(self.echeance) < aujourdhui

class Gestionnaire:
    def __init__(self):
        self.taches = []
        self._prochain_id = 1

    def ajouter(self, titre, priorite=2, echeance=None):
        if not titre.strip():
            raise ValueError("titre vide")
        if priorite not in (1, 2, 3):
            raise ValueError("priorité invalide")
        if echeance is not None:
            date.fromisoformat(echeance)
        t = Tache(self._prochain_id, titre.strip(), priorite, echeance)
        self.taches.append(t)
        self._prochain_id += 1
        return t

    def trouver(self, id_):
        for t in self.taches:
            if t.id == id_:
                return t
        raise KeyError(f"tâche {id_} introuvable")

    def terminer(self, id_):
        self.trouver(id_).faite = True

    def supprimer(self, id_):
        self.taches.remove(self.trouver(id_))

    def a_faire(self):
        restantes = [t for t in self.taches if not t.faite]
        return sorted(restantes, key=lambda t: (t.priorite, t.echeance or "9999"))

    def en_retard(self, aujourdhui):
        return [t for t in self.taches if t.en_retard(aujourdhui)]

    def chercher(self, mot):
        return [t for t in self.taches if mot.lower() in t.titre.lower()]

g = Gestionnaire()
g.ajouter("Payer le loyer", 1, "2026-01-05")
g.ajouter("Lire un chapitre", 3)
g.ajouter("Préparer la réunion", 2, "2026-01-10")
g.terminer(2)
print([t.titre for t in g.a_faire()])
print([t.titre for t in g.en_retard(date(2026, 1, 7))])`,
            tests: [sansErreur(), expr('[t.titre for t in g.a_faire()]', ['Payer le loyer', 'Préparer la réunion']), expr('[t.id for t in g.en_retard(date(2026, 1, 7))]', [1]), expr('[t.id for t in g.chercher("RÉUNION")]', [3], 'chercher doit ignorer la casse.'),
              exprVerif('(lambda g2: (g2.ajouter("a", 2, "2026-05-01"), g2.ajouter("b", 1), g2.ajouter("c", 2, "2026-02-01"), [t.titre for t in g2.a_faire()])[-1])(Gestionnaire())', 'Tri : priorité puis échéance, sans date en dernier', v => JSON.stringify(v) === '["b","c","a"]', 'Attendu ["b", "c", "a"] : priorité 1 d\'abord, puis parmi les priorités 2, l\'échéance la plus proche.'),
              exprVerif('(lambda g2: (g2.ajouter("x"), g2.supprimer(1), len(g2.taches))[-1])(Gestionnaire())', 'supprimer retire la tâche', v => v === 0),
              levePython('Gestionnaire().ajouter("x", 7)', 'ValueError'), levePython('Gestionnaire().ajouter("   ")', 'ValueError'), levePython('Gestionnaire().ajouter("x", 2, "2026-99-01")', 'ValueError'), levePython('Gestionnaire().trouver(42)', 'KeyError'),
              codeContient('raise ValueError', 'ajouter doit lever ValueError pour un titre vide ou une priorité invalide.'), codeContient('raise KeyError', 'trouver doit lever KeyError si l\'id est inconnu.')]
          },
          quiz: [
            { q: 'Pourquoi séparer logique métier et affichage ?', options: ['Pour écrire moins de code', 'Pour tester la logique sans interface et pouvoir changer d\'interface', 'Parce que print est interdit dans une classe'], bonne: 1, explication: 'Une classe sans print se teste directement et peut servir à une interface console, web ou graphique.' },
            { q: 'Dans la clé de tri <code>(t.priorite, t.echeance or "9999")</code>, à quoi sert <code>or "9999"</code> ?', options: ['À mettre les tâches sans échéance en dernier', 'À convertir en entier', 'À ignorer la priorité'], bonne: 0, explication: 'None n\'est pas comparable à une chaîne ; "9999" est une chaîne « plus grande » que toute date ISO.' },
            { q: 'Que fait <code>date.fromisoformat("2026-13-01")</code> ?', options: ['Renvoie une date approximative', 'Lève ValueError', 'Renvoie None'], bonne: 1, explication: 'Le mois 13 n\'existe pas : ValueError. On s\'en sert pour valider le format dès l\'ajout.' }
          ]
        },
        {
          titre: 'Projet final (2/2) : persistance et interface',
          theorie: `<p>Le cœur est prêt. Il manque deux choses pour un vrai outil : <strong>conserver</strong> les tâches entre deux lancements, et une <strong>interface</strong> pour les manipuler.</p>
<h2>Sauvegarder en JSON</h2>
<p>Les dataclasses se convertissent en dictionnaires avec <code>asdict()</code>, et reviennent avec <code>Tache(**d)</code> (l'opérateur <code>**</code> déplie le dictionnaire en arguments nommés).</p>
${code('python', `import json
from dataclasses import asdict

class Gestionnaire:
    # ... méthodes précédentes ...

    def sauvegarder(self, chemin):
        donnees = {"prochain_id": self._prochain_id, "taches": [asdict(t) for t in self.taches]}
        with open(chemin, "w", encoding="utf-8") as f:
            json.dump(donnees, f, indent=2, ensure_ascii=False)

    @classmethod
    def charger(cls, chemin):
        g = cls()
        try:
            with open(chemin, encoding="utf-8") as f:
                donnees = json.load(f)
        except FileNotFoundError:
            return g                      # premier lancement : gestionnaire vide
        g._prochain_id = donnees["prochain_id"]
        g.taches = [Tache(**d) for d in donnees["taches"]]
        return g`)}
<p><code>@classmethod</code> reçoit la classe (<code>cls</code>) au lieu d'une instance : c'est le motif standard pour un « constructeur alternatif » comme <code>Gestionnaire.charger("taches.json")</code>.</p>
<h2>Interface en ligne de commande</h2>
<p>Un outil CLI lit ses arguments dans <code>sys.argv</code> ; le module <code>argparse</code> structure proprement les sous-commandes :</p>
${code('python', `import argparse

def principal(argv=None):
    parser = argparse.ArgumentParser(description="Gestionnaire de tâches")
    sub = parser.add_subparsers(dest="commande", required=True)

    p_add = sub.add_parser("ajouter")
    p_add.add_argument("titre")
    p_add.add_argument("-p", "--priorite", type=int, default=2)
    p_add.add_argument("-e", "--echeance")

    sub.add_parser("lister")
    p_done = sub.add_parser("terminer"); p_done.add_argument("id", type=int)

    args = parser.parse_args(argv)
    g = Gestionnaire.charger("taches.json")
    if args.commande == "ajouter":
        t = g.ajouter(args.titre, args.priorite, args.echeance)
        print(f"Ajouté #{t.id}")
    elif args.commande == "terminer":
        g.terminer(args.id); print("Terminé")
    elif args.commande == "lister":
        for t in g.a_faire():
            print(formater(t))
    g.sauvegarder("taches.json")

if __name__ == "__main__":
    principal()`)}
<p>Utilisation : <code>python taches.py ajouter "Appeler le dentiste" -p 1 -e 2026-02-03</code>, <code>python taches.py lister</code>. Passer <code>argv</code> en paramètre permet de tester <code>principal(["lister"])</code> sans lancer un vrai processus.</p>
<h2>Affichage soigné</h2>
${code('python', `def formater(t):
    etat = "✓" if t.faite else " "
    prio = {1: "!!!", 2: " !!", 3: "  !"}[t.priorite]
    ech = f"  ⏰ {t.echeance}" if t.echeance else ""
    return f"[{etat}] #{t.id:<3} {prio} {t.titre}{ech}"`)}
<h2>Pour aller plus loin</h2>
<ul><li>Ajouter des <strong>tags</strong> et un filtre par tag.</li><li>Exporter un rapport Markdown des tâches en retard.</li><li>Remplacer le JSON par <strong>SQLite</strong> (module <code>sqlite3</code>, intégré).</li><li>Exposer le gestionnaire via une petite API web avec <strong>FastAPI</strong> : la logique ne change pas, c'est tout l'intérêt de l'avoir isolée.</li></ul>
<div class="callout ok"><b>Bravo</b>Tu as écrit une application complète : modèle de données validé, logique testable, persistance, interface. C'est exactement la structure des projets professionnels, à plus grande échelle.</div>`,
          exercice: {
            type: 'code', langage: 'python', titre: 'Sauvegarde, chargement et rapport',
            enonce: `<p>En repartant d'une version simplifiée du gestionnaire (fournie), implémente <code>sauvegarder(chemin)</code>, la méthode de classe <code>charger(chemin)</code> (gestionnaire vide si le fichier n'existe pas) et <code>rapport()</code> qui renvoie une chaîne multi-lignes : première ligne <code>"N tâche(s), F faite(s)"</code>, puis une ligne <code>"[x] titre"</code> ou <code>"[ ] titre"</code> par tâche dans l'ordre d'ajout.</p>`,
            depart: `import json
from dataclasses import dataclass, asdict

@dataclass
class Tache:
    id: int
    titre: str
    priorite: int = 2
    echeance: str | None = None
    faite: bool = False

class Gestionnaire:
    def __init__(self):
        self.taches = []
        self._prochain_id = 1

    def ajouter(self, titre, priorite=2, echeance=None):
        t = Tache(self._prochain_id, titre, priorite, echeance)
        self.taches.append(t)
        self._prochain_id += 1
        return t

    def sauvegarder(self, chemin):
        ...

    @classmethod
    def charger(cls, chemin):
        ...

    def rapport(self):
        ...

g = Gestionnaire()
g.ajouter("Relire le cours", 1)
g.ajouter("Faire les exercices", 2, "2026-02-01").faite = True
g.sauvegarder("taches.json")

g2 = Gestionnaire.charger("taches.json")
print(g2.rapport())
print(g2.ajouter("Nouvelle").id)   # doit valoir 3
`,
            solution: `import json
from dataclasses import dataclass, asdict

@dataclass
class Tache:
    id: int
    titre: str
    priorite: int = 2
    echeance: str | None = None
    faite: bool = False

class Gestionnaire:
    def __init__(self):
        self.taches = []
        self._prochain_id = 1

    def ajouter(self, titre, priorite=2, echeance=None):
        t = Tache(self._prochain_id, titre, priorite, echeance)
        self.taches.append(t)
        self._prochain_id += 1
        return t

    def sauvegarder(self, chemin):
        donnees = {"prochain_id": self._prochain_id, "taches": [asdict(t) for t in self.taches]}
        with open(chemin, "w", encoding="utf-8") as f:
            json.dump(donnees, f, indent=2, ensure_ascii=False)

    @classmethod
    def charger(cls, chemin):
        g = cls()
        try:
            with open(chemin, encoding="utf-8") as f:
                donnees = json.load(f)
        except FileNotFoundError:
            return g
        g._prochain_id = donnees["prochain_id"]
        g.taches = [Tache(**d) for d in donnees["taches"]]
        return g

    def rapport(self):
        faites = sum(1 for t in self.taches if t.faite)
        lignes = [f"{len(self.taches)} tâche(s), {faites} faite(s)"]
        for t in self.taches:
            lignes.append(f"[{'x' if t.faite else ' '}] {t.titre}")
        return "\\n".join(lignes)

g = Gestionnaire()
g.ajouter("Relire le cours", 1)
g.ajouter("Faire les exercices", 2, "2026-02-01").faite = True
g.sauvegarder("taches.json")

g2 = Gestionnaire.charger("taches.json")
print(g2.rapport())
print(g2.ajouter("Nouvelle").id)`,
            tests: [sansErreur(), expr('g2.rapport().split("\\n")[0]', '2 tâche(s), 1 faite(s)'), sortieContient('[ ] Relire le cours'), sortieContient('[x] Faire les exercices'), expr('[t.id for t in g2.taches][:2]', [1, 2]), expr('g2.taches[1].echeance', '2026-02-01', 'L\'échéance doit survivre à la sauvegarde puis au chargement.'), expr('g2._prochain_id', 4, 'Le prochain id doit être sauvegardé et rechargé (ici 3 avant l\'ajout de "Nouvelle", puis 4).'), expr('len(Gestionnaire.charger("fichier_inexistant_123.json").taches)', 0, 'Si le fichier n\'existe pas, charger renvoie un gestionnaire vide.'), codeContient('@classmethod', 'charger doit être une méthode de classe.'), codeContient('asdict', 'Utilise asdict() pour convertir les dataclasses en dictionnaires.')]
          },
          quiz: [
            { q: 'Que fait <code>Tache(**d)</code> ?', options: ['Crée une liste de tâches', 'Appelle le constructeur avec les clés de d comme arguments nommés', 'Copie la tâche d'], bonne: 1, explication: 'L\'opérateur ** déplie un dictionnaire en arguments nommés : Tache(id=1, titre=...).' },
            { q: 'Quel est l\'intérêt de <code>@classmethod</code> pour <code>charger</code> ?', options: ['Elle est plus rapide', 'Elle peut créer et renvoyer une instance sans en avoir une au départ', 'Elle est privée'], bonne: 1, explication: 'C\'est un constructeur alternatif : Gestionnaire.charger(chemin) fabrique l\'objet à partir du fichier.' },
            { q: 'Pourquoi <code>principal(argv=None)</code> accepte-t-il une liste d\'arguments ?', options: ['Pour être testable sans lancer un vrai processus', 'Parce qu\'argparse l\'exige', 'Pour gérer plusieurs fichiers'], bonne: 0, explication: 'En test, on appelle principal(["lister"]) ; en production, argparse lit sys.argv.' }
          ]
        }
      ]
    }
  ]
};
