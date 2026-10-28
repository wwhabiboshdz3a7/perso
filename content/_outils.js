// Petits constructeurs de tests pour les exercices.
const norm = s => String(s ?? '').replace(/\r/g, '').trim();
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const sortieContient = (texte, aide) => ({
  nom: `La sortie contient « ${texte} »`,
  verif: ctx => ctx.stdout.includes(texte) ? true : (aide || `On attend « ${texte} » dans la sortie du programme.`)
});
export const sortieEgale = (texte, aide) => ({
  nom: 'La sortie correspond exactement',
  verif: ctx => norm(ctx.stdout) === norm(texte) ? true : (aide || `Sortie attendue :\n${texte}`)
});
export const sortieRegex = (re, nom, aide) => ({
  nom, verif: ctx => re.test(ctx.stdout) ? true : (aide || 'La sortie ne correspond pas à ce qui est attendu.')
});
export const codeContient = (texte, aide) => ({
  nom: `Le code utilise « ${texte} »`,
  verif: ctx => ctx.code.includes(texte) ? true : (aide || `Ton code doit utiliser « ${texte} ».`)
});
export const codeRegex = (re, nom, aide) => ({ nom, verif: ctx => re.test(ctx.code) ? true : (aide || 'Le code ne contient pas ce qui est demandé.') });
export const codeSans = (texte, aide) => ({ nom: `Le code n'utilise pas « ${texte} »`, verif: ctx => !ctx.code.includes(texte) ? true : (aide || `N'utilise pas « ${texte} » ici.`) });
export const sansErreur = () => ({ nom: 'Le programme s\'exécute sans erreur', verif: ctx => ctx.erreur ? ('Erreur : ' + ctx.erreur) : true });
// Évalue une expression dans l'espace du programme de l'élève et compare au résultat attendu.
export const expr = (expression, attendu, aide) => ({
  nom: `${expression} → ${JSON.stringify(attendu)}`, expr: expression,
  verif: (ctx, v) => {
    if (!v || !v.ok) return `Impossible d'évaluer ${expression} : ${v && v.erreur || 'erreur'}`;
    if (typeof attendu === 'number' && typeof v.valeur === 'number' && Math.abs(attendu - v.valeur) < 1e-6) return true;
    return egal(v.valeur, attendu) ? true : (aide || `${expression} a renvoyé ${JSON.stringify(v.valeur)} au lieu de ${JSON.stringify(attendu)}.`);
  }
});
export const exprVerif = (expression, nom, fn, aide) => ({
  nom, expr: expression,
  verif: (ctx, v) => (v && v.ok && fn(v.valeur)) ? true : (aide || `${expression} ne renvoie pas la valeur attendue${v && !v.ok ? ' (' + v.erreur + ')' : ''}.`)
});
// Tests sur le DOM de l'aperçu HTML/CSS : fn(doc, win) renvoie true/false.
export const dom = (nom, fn, aide) => ({ nom, verif: ctx => { try { return fn(ctx.doc, ctx.win) ? true : (aide || 'Vérifie ton HTML.'); } catch (e) { return aide || e.message; } } });

// Bloc de code pour la théorie : échappe le HTML et ajoute la classe de coloration.
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const code = (lang, src) => `<pre><code class="language-${lang}">${escHtml(src.replace(/^\n/, '').replace(/\n\s*$/, ''))}</code></pre>`;
export const esc = escHtml;

// Vérifie qu'une expression Python lève une exception donnée (exécutée dans l'espace de l'élève).
export const levePython = (expression, exc, aide) => ({
  nom: `${expression} lève ${exc}`,
  expr: `__r = "aucune exception"\ntry:\n    ${expression}\nexcept ${exc}:\n    __r = "${exc}"\nexcept Exception as __e:\n    __r = type(__e).__name__\n__r`,
  verif: (ctx, v) => (v && v.ok && v.valeur === exc) ? true : (aide || `${expression} devrait lever ${exc} (obtenu : ${v ? (v.valeur || v.erreur) : 'rien'}).`)
});
// Idem pour JavaScript.
export const leveJS = (expression, nomErreur, aide) => ({
  nom: `${expression} lève ${nomErreur}`,
  expr: `(() => { try { ${expression}; return 'aucune exception'; } catch (e) { return e && e.name === '${nomErreur}' ? '${nomErreur}' : (e && e.name) || 'erreur'; } })()`,
  verif: (ctx, v) => (v && v.ok && v.valeur === nomErreur) ? true : (aide || `${expression} devrait lever ${nomErreur}.`)
});
