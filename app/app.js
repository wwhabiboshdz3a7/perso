// Lumio — application principale : routage par hash, vues, exercices, quiz, progression.
import { parcours, categories, chargerParcours, chargerTout } from '../content/index.js';
import { glossaire } from '../content/glossaire.js';
import { progression, BADGES } from './progress.js';
import { creerEditeur, colorer } from './editor.js';
import { executerJS, executerPython, rendreHTML } from './runner.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const main = $('#main');

/* ---------- utilitaires ---------- */
export function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type; t.innerHTML = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 3800);
}
const texteBrut = html => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
function dureeLecon(l) {
  const mots = texteBrut(l.theorie || '').split(' ').length;
  let min = Math.ceil(mots / 170);
  if (l.exercice) min += l.exercice.type === 'code' || l.exercice.type === 'sortie' ? 10 : 5;
  if (l.quiz) min += l.quiz.length;
  return Math.max(3, min);
}
function dureeParcours(p) { return p.lecons.reduce((a, l) => a + dureeLecon(l), 0); }
const fmtDuree = m => m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`;
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const niveauClasse = n => /déb/i.test(n) ? 'lvl-debutant' : /inter/i.test(n) ? 'lvl-intermediaire' : /avanc/i.test(n) ? 'lvl-avance' : 'lvl-mixte';
const badgesGagnes = () => { const g = progression.verifierBadges(); g.forEach(b => toast(`${b.e} Badge obtenu : <b>${b.nom}</b>`, 'ok')); };
function setTitre(t) { document.title = t ? `${t} — Lumio` : 'Lumio — Apprendre à coder, créer avec l\'IA et lancer son activité'; }

/* ---------- thème, taille de police, menu ---------- */
$('#themeBtn').addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('lumio.theme', t); } catch {}
});
$('#fontBtn').addEventListener('click', () => {
  const ordre = ['', 'large', 'xlarge'];
  const cur = document.documentElement.dataset.font || '';
  const nxt = ordre[(ordre.indexOf(cur) + 1) % ordre.length];
  if (nxt) document.documentElement.dataset.font = nxt; else delete document.documentElement.dataset.font;
  try { localStorage.setItem('lumio.font', nxt); } catch {}
});
$('#menuBtn').addEventListener('click', () => {
  const open = $('#topbar').classList.toggle('menu-open');
  $('#menuBtn').setAttribute('aria-expanded', open);
});
$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  if (q) location.hash = '#/recherche?q=' + encodeURIComponent(q);
});

/* ---------- raccourcis clavier ---------- */
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  const enSaisie = tag === 'input' || tag === 'textarea' || e.target.isContentEditable || e.target.closest('.CodeMirror');
  if (e.key === 'Escape') { $('.modal-bg')?.remove(); $('.sidebar.open')?.classList.remove('open'); return; }
  if (enSaisie) return;
  if (e.key === '/') { e.preventDefault(); $('#searchInput').focus(); }
  else if (e.key === '?') { e.preventDefault(); afficherRaccourcis(); }
  else if (e.altKey && e.key === 'ArrowRight') { $('#navSuiv')?.click(); }
  else if (e.altKey && e.key === 'ArrowLeft') { $('#navPrec')?.click(); }
  else if (e.key === 't' && !e.ctrlKey && !e.metaKey) { $('#themeBtn').click(); }
});
function afficherRaccourcis() {
  if ($('.modal-bg')) return;
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal" role="dialog" aria-label="Raccourcis clavier"><h3>Raccourcis clavier</h3>
    <table><tr><td><kbd>/</kbd></td><td>Rechercher</td></tr><tr><td><kbd>Ctrl</kbd> + <kbd>Entrée</kbd></td><td>Exécuter le code de l'exercice</td></tr>
    <tr><td><kbd>Alt</kbd> + <kbd>→</kbd> / <kbd>←</kbd></td><td>Leçon suivante / précédente</td></tr><tr><td><kbd>t</kbd></td><td>Basculer le thème</td></tr>
    <tr><td><kbd>?</kbd></td><td>Cette aide</td></tr><tr><td><kbd>Échap</kbd></td><td>Fermer</td></tr></table>
    <div class="row" style="justify-content:flex-end"><button class="btn primary" id="closeModal">Fermer</button></div></div>`;
  document.body.appendChild(bg);
  bg.addEventListener('click', e => { if (e.target === bg || e.target.id === 'closeModal') bg.remove(); });
}

/* ---------- routage ---------- */
const routes = [
  [/^\/?$/, vueAccueil],
  [/^\/parcours\/([\w-]+)$/, vueParcours],
  [/^\/cours\/([\w-]+)\/(\d+)$/, vueLecon],
  [/^\/cours\/([\w-]+)$/, (s) => vueLecon(s, '1')],
  [/^\/profil$/, vueProfil],
  [/^\/glossaire$/, vueGlossaire],
  [/^\/recherche(?:\?q=(.*))?$/, vueRecherche],
  [/^\/certificat\/([\w-]+)$/, vueCertificat],
];
let navId = 0;
async function router() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const id = ++navId;
  $('#topbar').classList.remove('menu-open');
  $$('.topnav a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + hash.split('/').slice(0, 2).join('/')));
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (m) {
      try { await fn(...m.slice(1).map(x => x === undefined ? x : decodeURIComponent(x)), id); }
      catch (err) { console.error(err); main.innerHTML = `<div class="wrap"><div class="card"><h2>Oups</h2><p>Impossible d'afficher cette page : ${esc(err.message)}</p><a class="btn" href="#/">Retour à l'accueil</a></div></div>`; }
      if (id === navId) { window.scrollTo({ top: 0 }); colorer(main); }
      return;
    }
  }
  main.innerHTML = `<div class="wrap"><div class="empty"><h2>Page introuvable</h2><a class="btn primary" href="#/">Retour à l'accueil</a></div></div>`;
}
window.addEventListener('hashchange', router);

/* ---------- accueil ---------- */
function carteParcours(p) {
  const e = progression.etat.lecons[p.slug];
  const nb = e ? Object.keys(e).length : 0;
  return `<a class="card pcard fade" href="#/parcours/${p.slug}" style="--c:${p.couleur}">
    <div class="ico">${p.icone}</div>
    <h3>${esc(p.titre)}</h3>
    <p>${esc(p.description)}</p>
    <div class="meta"><span class="pill ${niveauClasse(p.niveau)}">${esc(p.niveau)}</span><span>${nb ? nb + ' leçon' + (nb > 1 ? 's' : '') + ' faite' + (nb > 1 ? 's' : '') : 'Commencer'}</span></div>
  </a>`;
}
async function vueAccueil() {
  setTitre('');
  const st = progression.etat;
  main.innerHTML = `<div class="wrap">
    <section class="hero">
      <div>
        <h1>Apprends à <span>coder</span>, à <span>créer avec l'IA</span> et à lancer ton activité.</h1>
        <p class="lead">Des parcours complets en français, du premier programme au projet final : exercices exécutés directement dans ton navigateur, quiz corrigés, progression, badges et certificats. Gratuit, sans inscription.</p>
        <div class="actions">
          <a class="btn primary" href="#/parcours/python">Commencer avec Python</a>
          <a class="btn" href="#/parcours/video-ia">Créer des vidéos avec l'IA</a>
        </div>
      </div>
      <div class="stats" aria-label="Ta progression">
        <div class="stat"><b>${st.xp}</b><small>XP gagnés</small></div>
        <div class="stat"><b>${progression.totalLecons()}</b><small>leçons terminées</small></div>
        <div class="stat"><b>${progression.streak()} 🔥</b><small>jours d'affilée</small></div>
      </div>
    </section>
    ${categories.map(c => `
      <div class="section-title"><h2>${esc(c.titre)}</h2><span class="muted">${esc(c.sous)}</span></div>
      <div class="grid">${parcours.filter(p => p.categorie === c.id).map(carteParcours).join('')}</div>`).join('')}
    <div class="section-title"><h2>Comment ça marche</h2></div>
    <div class="features">
      <div class="feature"><b>Théorie claire</b>Chaque leçon explique un concept avec des exemples commentés, sans jargon inutile.</div>
      <div class="feature"><b>Pratique immédiate</b>Python, JavaScript, HTML et CSS s'exécutent dans la page. C et C++ : exercices à trous, sorties attendues et commandes de compilation.</div>
      <div class="feature"><b>Vérification automatique</b>Des tests te disent précisément ce qui manque. Après deux essais, la solution commentée est disponible.</div>
      <div class="feature"><b>Progression durable</b>XP, série quotidienne, badges et certificat imprimable à la fin de chaque parcours. Tout reste dans ton navigateur, exportable en JSON.</div>
    </div>
  </div>`;
}

/* ---------- page parcours ---------- */
async function vueParcours(slug, id) {
  const p = await chargerParcours(slug);
  if (!p) throw new Error('Parcours inconnu : ' + slug);
  if (id !== navId) return;
  setTitre(p.titre);
  const faites = progression.nbLecons(slug);
  const total = p.lecons.length;
  const suivante = p.lecons.find(l => !progression.leconFaite(slug, l.index)) || p.lecons[0];
  main.innerHTML = `<div class="wrap">
    <div class="crumbs"><a href="#/">Parcours</a> › <span>${esc(p.titre)}</span></div>
    <div class="phead" style="--c:${p.couleur}">
      <div class="ico">${p.icone}</div>
      <div style="flex:1">
        <h1>${esc(p.titre)}</h1>
        <p class="muted" style="margin-bottom:10px">${esc(p.description)}</p>
        <div class="row" style="margin-bottom:12px"><span class="pill ${niveauClasse(p.niveau)}">${esc(p.niveau)}</span><span class="pill">${p.modules.length} modules · ${total} leçons</span><span class="pill">≈ ${fmtDuree(dureeParcours(p))}</span></div>
        <div class="progress" aria-label="Progression"><span style="width:${pct(faites, total)}%"></span></div>
        <div class="row" style="margin-top:14px">
          <a class="btn primary" href="#/cours/${slug}/${suivante.index}">${faites ? 'Continuer' : 'Commencer'} : ${esc(suivante.titre)}</a>
          ${faites >= total ? `<a class="btn ok" href="#/certificat/${slug}">Voir mon certificat</a>` : `<span class="muted">${faites}/${total} leçons terminées</span>`}
        </div>
      </div>
    </div>
    ${p.intro ? `<div class="card" style="margin-bottom:20px">${p.intro}</div>` : ''}
    <div class="modules">
      ${p.modules.map((m, mi) => `<section class="card module">
        <header><span class="num">${mi + 1}</span><h3>${esc(m.titre)}</h3>${m.niveau ? `<span class="pill ${niveauClasse(m.niveau)}">${esc(m.niveau)}</span>` : ''}</header>
        ${m.description ? `<p class="muted" style="padding:10px 18px 0;margin:0;font-size:.92rem">${esc(m.description)}</p>` : ''}
        <ol>${m.lecons.map(l => `<li class="${progression.leconFaite(slug, l.index) ? 'done' : ''}"><a href="#/cours/${slug}/${l.index}"><span class="check">${progression.leconFaite(slug, l.index) ? '✓' : ''}</span><span>${l.index}. ${esc(l.titre)}</span><span class="dur">${fmtDuree(dureeLecon(l))}</span></a></li>`).join('')}</ol>
      </section>`).join('')}
    </div>
  </div>`;
}

/* ---------- leçon ---------- */
async function vueLecon(slug, num, id) {
  const p = await chargerParcours(slug);
  if (!p) throw new Error('Parcours inconnu : ' + slug);
  if (id !== navId) return;
  const idx = Math.min(Math.max(parseInt(num, 10) || 1, 1), p.lecons.length);
  const l = p.lecons[idx - 1];
  const mod = p.modules[l.module];
  const prec = p.lecons[idx - 2], suiv = p.lecons[idx];
  setTitre(`${l.titre} · ${p.titre}`);
  const cle = `${slug}/${idx}`;

  main.innerHTML = `<div class="lesson-layout">
    <aside class="sidebar" id="sidebar" aria-label="Sommaire du parcours">
      <div class="sb-title"><a href="#/parcours/${slug}" style="color:inherit">${esc(p.titre)}</a><span class="muted" style="font-weight:400;font-size:.8rem">${progression.nbLecons(slug)}/${p.lecons.length}</span></div>
      <div style="padding:0 18px 12px"><div class="progress"><span style="width:${pct(progression.nbLecons(slug), p.lecons.length)}%"></span></div></div>
      ${p.modules.map((m, mi) => `<details ${mi === l.module ? 'open' : ''}><summary><span>${mi + 1}. ${esc(m.titre)}</span></summary>
        ${m.lecons.map(x => `<a class="lk ${x.index === idx ? 'current' : ''} ${progression.leconFaite(slug, x.index) ? 'done' : ''}" href="#/cours/${slug}/${x.index}"><span class="dot"></span><span>${esc(x.titre)}</span></a>`).join('')}
      </details>`).join('')}
    </aside>
    <article class="lesson fade">
      <div class="crumbs"><a href="#/">Parcours</a> › <a href="#/parcours/${slug}">${esc(p.titre)}</a> › <span>${esc(mod.titre)}</span></div>
      <h1>${esc(l.titre)}</h1>
      <div class="lesson-meta">
        <button class="btn small ghost noprint" id="sbToggle" type="button">☰ Sommaire</button>
        <span>Leçon ${idx}/${p.lecons.length}</span><span>·</span><span>≈ ${fmtDuree(dureeLecon(l))}</span>
        ${l.exercice ? '<span>·</span><span>1 exercice</span>' : ''}${l.quiz ? `<span>·</span><span>Quiz ${l.quiz.length} questions</span>` : ''}
      </div>
      <div class="theorie">${l.theorie}</div>
      <div id="exo"></div>
      <div id="quiz"></div>
      <div class="done-bar ${progression.leconFaite(slug, idx) ? 'is-done' : ''}" id="doneBar">
        <span class="msg" id="doneMsg"></span>
        <button class="btn ${progression.leconFaite(slug, idx) ? 'ok' : 'primary'}" id="doneBtn" type="button">${progression.leconFaite(slug, idx) ? '✓ Leçon terminée' : 'Marquer comme terminée'}</button>
      </div>
      <nav class="lesson-nav" aria-label="Navigation entre leçons">
        ${prec ? `<a class="btn" id="navPrec" href="#/cours/${slug}/${prec.index}">← ${esc(prec.titre)}</a>` : '<span></span>'}
        ${suiv ? `<a class="btn primary" id="navSuiv" href="#/cours/${slug}/${suiv.index}">${esc(suiv.titre)} →</a>` : `<a class="btn ok" id="navSuiv" href="#/parcours/${slug}">Terminer le parcours 🏁</a>`}
      </nav>
    </article>
  </div>`;

  $('#sbToggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#sidebar').addEventListener('click', e => { if (e.target.closest('a.lk')) $('#sidebar').classList.remove('open'); });
  const etatLecon = { exo: !l.exercice || progression.exercice(cle).reussi, quiz: !l.quiz || !!progression.quiz(cle) };
  const majDone = () => {
    const msg = $('#doneMsg');
    if (progression.leconFaite(slug, idx)) { msg.textContent = 'Bravo, cette leçon est validée. Passe à la suivante !'; return; }
    const reste = [];
    if (!etatLecon.exo) reste.push('réussir l\'exercice');
    if (!etatLecon.quiz) reste.push('faire le quiz');
    msg.textContent = reste.length ? `Pour valider automatiquement : ${reste.join(' et ')}. Tu peux aussi la marquer manuellement.` : 'Exercice et quiz faits : tu peux valider la leçon.';
  };
  const terminer = (auto = false) => {
    const nouveau = progression.marquerLecon(slug, idx, p.lecons.length);
    $('#doneBar').classList.add('is-done');
    $('#doneBtn').className = 'btn ok'; $('#doneBtn').textContent = '✓ Leçon terminée';
    $$('.sidebar a.lk.current').forEach(a => a.classList.add('done'));
    majDone();
    if (nouveau) {
      toast(auto ? '🎉 Leçon validée automatiquement : +50 XP' : '✓ Leçon terminée : +50 XP', 'ok');
      if (progression.nbLecons(slug) >= p.lecons.length) toast(`🏆 Parcours ${esc(p.titre)} terminé ! <a href="#/certificat/${slug}">Voir le certificat</a>`, 'ok');
      badgesGagnes();
    }
  };
  $('#doneBtn').addEventListener('click', () => terminer(false));
  const verifierAuto = () => { majDone(); if (etatLecon.exo && etatLecon.quiz && !progression.leconFaite(slug, idx)) terminer(true); };
  majDone();

  if (l.exercice) rendreExercice(l.exercice, cle, $('#exo'), () => { etatLecon.exo = true; verifierAuto(); });
  if (l.quiz) rendreQuiz(l.quiz, cle, $('#quiz'), () => { etatLecon.quiz = true; verifierAuto(); });
}

/* ---------- exercices ---------- */
const NOMS_LANG = { javascript: 'JavaScript', python: 'Python', html: 'HTML', css: 'CSS', c: 'C', cpp: 'C++', bash: 'Terminal', sql: 'SQL' };
function rendreExercice(ex, cle, cont, onReussite) {
  const etatEx = progression.exercice(cle);
  const titre = ex.titre || 'Exercice';
  cont.innerHTML = `<section class="block exo" aria-label="Exercice"><header>🧪 ${esc(titre)}<span class="tag">${esc(NOMS_LANG[ex.langage] || (ex.type === 'qcm' ? 'QCM' : ex.type === 'texte' ? 'Rédaction' : ex.type === 'trous' ? 'Texte à trous' : ''))}${etatEx.reussi ? ' · réussi ✓' : ''}</span></header><div class="body"><div class="enonce">${ex.enonce}</div><div class="zone"></div></div></section>`;
  const zone = $('.zone', cont);
  const reussite = () => {
    const nouveau = progression.reussiteExercice(cle, ex.xp || 30);
    $('.tag', cont).textContent = ($('.tag', cont).textContent.replace(' · réussi ✓', '')) + ' · réussi ✓';
    if (nouveau) { toast('✓ Exercice réussi : +' + (ex.xp || 30) + ' XP', 'ok'); badgesGagnes(); }
    onReussite();
  };
  const echec = () => progression.echecExercice(cle);
  const banniere = (ok, texte) => {
    let b = $('.result-banner', zone);
    if (!b) { b = document.createElement('div'); zone.appendChild(b); }
    b.className = 'result-banner ' + (ok ? 'ok' : 'ko'); b.innerHTML = (ok ? '🎉 ' : '✗ ') + texte;
  };
  const blocSolution = (lang, texte, libelle = 'Voir la solution') => {
    if (!texte) return;
    const d = document.createElement('details'); d.className = 'solution';
    d.innerHTML = `<summary>${libelle}</summary>` + (lang ? `<pre><code class="language-${lang}">${esc(texte)}</code></pre>` : `<div class="callout info">${texte}</div>`) + (ex.explication ? `<div class="callout info">${ex.explication}</div>` : '');
    zone.appendChild(d); colorer(d);
    return d;
  };
  const peutVoirSolution = () => progression.exercice(cle).echecs >= 2 || progression.exercice(cle).reussi;

  if (ex.type === 'code') return exerciceCode(ex, cle, zone, { reussite, echec, banniere, blocSolution, peutVoirSolution });
  if (ex.type === 'sortie') return exerciceSortie(ex, zone, { reussite, echec, banniere, blocSolution });
  if (ex.type === 'trous') return exerciceTrous(ex, zone, { reussite, echec, banniere, blocSolution, peutVoirSolution });
  if (ex.type === 'qcm') return exerciceQCM(ex, zone, { reussite, echec, banniere });
  if (ex.type === 'texte') return exerciceTexte(ex, zone, { reussite, echec, banniere, blocSolution, peutVoirSolution });
  zone.innerHTML = '<p class="muted">Type d\'exercice inconnu.</p>';
}

function afficherTests(ul, resultats) {
  ul.innerHTML = resultats.map(r => `<li class="${r.ok ? 'ok' : 'ko'}"><span class="m">${r.ok ? '✓' : '✗'}</span><span>${esc(r.nom)}${r.ok ? '' : `<span class="help">${esc(r.aide)}</span>`}</span></li>`).join('');
}
function lancerTests(tests, ctx) {
  let i = 0;
  return tests.map(t => {
    let v = null;
    if (t.expr) v = (ctx.valeurs || [])[i++] || { ok: false, erreur: 'non évalué' };
    let res;
    try { res = t.verif(ctx, v); } catch (e) { res = 'Erreur pendant la vérification : ' + e.message; }
    return { nom: t.nom, ok: res === true, aide: res === true ? '' : String(res) };
  });
}

function exerciceCode(ex, cle, zone, h) {
  const lang = ex.langage || 'javascript';
  const web = lang === 'html' || lang === 'css';
  zone.innerHTML = `<div class="${web ? 'split' : ''}"><div class="ed"></div>${web ? '<iframe class="preview" title="Aperçu" sandbox="allow-same-origin allow-scripts"></iframe>' : ''}</div>
    <div class="toolbar"><button class="btn primary run" type="button">▶ ${web ? 'Actualiser et vérifier' : 'Exécuter et vérifier'}</button><button class="btn small ghost reset" type="button">Réinitialiser</button><button class="btn small ghost sol" type="button" hidden>Voir la solution</button><span class="status"></span></div>
    ${web ? '' : '<div class="output" aria-live="polite"></div>'}<ul class="tests"></ul>`;
  const sauvegarde = (() => { try { return localStorage.getItem('lumio.code.' + cle); } catch { return null; } })();
  const editeur = creerEditeur($('.ed', zone), { langage: lang, valeur: sauvegarde ?? ex.depart ?? '', onRun: () => executer() });
  const statut = $('.status', zone), out = $('.output', zone), ul = $('.tests', zone), btnSol = $('.sol', zone);
  const majSol = () => { btnSol.hidden = !h.peutVoirSolution() || !ex.solution; };
  majSol();
  btnSol.addEventListener('click', () => { if (!$('.solution', zone)) h.blocSolution(lang, ex.solution).open = true; btnSol.hidden = true; });
  $('.reset', zone).addEventListener('click', () => { editeur.set(ex.depart || ''); try { localStorage.removeItem('lumio.code.' + cle); } catch {} });
  const exprs = (ex.tests || []).filter(t => t.expr).map(t => t.expr);
  let enCours = false;
  async function executer() {
    if (enCours) return; enCours = true;
    const code = editeur.get();
    try { localStorage.setItem('lumio.code.' + cle, code); } catch {}
    statut.innerHTML = '<span class="spinner"></span> Exécution…';
    const ctx = { code, stdout: '', erreur: null, valeurs: [] };
    try {
      if (lang === 'javascript') Object.assign(ctx, await executerJS(code, exprs));
      else if (lang === 'python') Object.assign(ctx, await executerPython(code, exprs, s => { statut.textContent = s; }));
      else if (web) {
        const iframe = $('iframe', zone);
        const doc = lang === 'css' ? (ex.html || '<!doctype html><html><head></head><body></body></html>').replace('</head>', `<style>${code}</style></head>`) : code;
        const r = await rendreHTML(iframe, doc);
        ctx.doc = r.doc; ctx.win = r.win;
      }
    } catch (err) { ctx.erreur = err.message; ctx.stdout = '⚠ ' + err.message; }
    if (out) { out.textContent = ctx.stdout; out.classList.toggle('err', !!ctx.erreur); }
    const res = lancerTests(ex.tests || [], ctx);
    afficherTests(ul, res);
    const ok = res.every(r => r.ok);
    if (ok) { h.banniere(true, 'Tous les tests passent !'); h.reussite(); }
    else { h.echec(); h.banniere(false, `${res.filter(r => !r.ok).length} test(s) à corriger. Lis les indications ci-dessus.` + (h.peutVoirSolution() ? ' La solution est disponible.' : '')); }
    majSol();
    statut.textContent = ok ? 'Terminé ✓' : 'Terminé';
    enCours = false;
  }
  $('.run', zone).addEventListener('click', executer);
  if (web) { const iframe = $('iframe', zone); const code = editeur.get(); iframe.srcdoc = lang === 'css' ? (ex.html || '').replace('</head>', `<style>${code}</style></head>`) : code; }
}

function exerciceSortie(ex, zone, h) {
  const lang = ex.langage || 'c';
  const compile = lang === 'cpp' ? 'g++ -std=c++17 -Wall -Wextra -o prog prog.cpp && ./prog' : 'gcc -std=c11 -Wall -Wextra -o prog prog.c && ./prog';
  zone.innerHTML = `<div class="ed"></div>
    <div class="callout info" style="margin-top:12px"><b>Compiler en local</b>Enregistre ton code dans <code>prog.${lang === 'cpp' ? 'cpp' : 'c'}</code> puis lance : <code>${compile}</code></div>
    <div class="toolbar"><button class="btn primary cmp" type="button">Comparer avec la solution</button><span class="status muted">Écris ton programme, puis compare-le à la solution de référence et réponds à la question de vérification.</span></div>
    <div class="cmpzone"></div>`;
  const editeur = creerEditeur($('.ed', zone), { langage: lang, valeur: ex.depart || '' });
  $('.cmp', zone).addEventListener('click', () => {
    const z = $('.cmpzone', zone);
    z.innerHTML = `<div class="split"><div><h4>Ta version</h4><pre><code class="language-${lang}">${esc(editeur.get())}</code></pre></div><div><h4>Solution de référence</h4><pre><code class="language-${lang}">${esc(ex.solution)}</code></pre></div></div>
      ${ex.sortieAttendue !== undefined ? `<h4>Sortie attendue du programme</h4><pre>${esc(ex.sortieAttendue)}</pre>` : ''}
      ${ex.explication ? `<div class="callout info">${ex.explication}</div>` : ''}
      <h4>Question de vérification</h4><div class="quiz"><div class="q"><p class="qt">${ex.verification.question}</p>${ex.verification.options.map((o, i) => `<label><input type="radio" name="verif" value="${i}"> <span>${o}</span></label>`).join('')}</div><button class="btn primary valid" type="button">Valider</button></div>`;
    colorer(z);
    $('.valid', z).addEventListener('click', () => {
      const c = $('input[name=verif]:checked', z);
      if (!c) return toast('Choisis une réponse.');
      const ok = +c.value === ex.verification.bonne;
      $$('label', z).forEach((lab, i) => lab.classList.toggle('ok', i === ex.verification.bonne));
      if (!ok) c.closest('label').classList.add('ko');
      if (ok) { h.banniere(true, 'Bonne réponse ! ' + (ex.verification.explication || '')); h.reussite(); }
      else { h.echec(); h.banniere(false, 'Pas tout à fait. ' + (ex.verification.explication || 'Relis la solution.')); }
    });
  });
}

function exerciceTrous(ex, zone, h) {
  let i = 0;
  const html = esc(ex.code).replace(/___/g, () => `<input type="text" data-i="${i++}" aria-label="trou ${i}" autocomplete="off" spellcheck="false" style="width:${Math.max(6, ((ex.reponses[i - 1] || [''])[0].length + 2))}ch">`);
  zone.innerHTML = `<div class="trous" aria-label="Code à compléter">${html}</div>
    <div class="toolbar"><button class="btn primary verif" type="button">Vérifier</button><button class="btn small ghost sol" type="button" hidden>Voir la solution</button></div><ul class="tests"></ul>`;
  const btnSol = $('.sol', zone);
  const majSol = () => { btnSol.hidden = !h.peutVoirSolution(); };
  majSol();
  btnSol.addEventListener('click', () => { if (!$('.solution', zone)) h.blocSolution(ex.langage, ex.code.replace(/___/g, () => ex.reponses[k++][0]), 'Solution').open = true; btnSol.hidden = true; });
  let k = 0;
  $('.verif', zone).addEventListener('click', () => {
    k = 0;
    const inputs = $$('input', zone);
    const res = inputs.map((inp, j) => {
      const v = inp.value.trim().replace(/\s+/g, ' ');
      const ok = (ex.reponses[j] || []).some(r => r.trim().replace(/\s+/g, ' ') === v);
      inp.classList.toggle('ok', ok); inp.classList.toggle('ko', !ok);
      return { nom: `Trou ${j + 1}`, ok, aide: ex.aides && ex.aides[j] ? ex.aides[j] : 'Relis la leçon : quel mot-clé ou quelle valeur va ici ?' };
    });
    afficherTests($('.tests', zone), res);
    const ok = res.every(r => r.ok);
    if (ok) { h.banniere(true, 'Tous les trous sont corrects.'); h.reussite(); } else { h.echec(); h.banniere(false, `${res.filter(r => !r.ok).length} trou(s) à corriger.`); }
    majSol();
  });
}

function exerciceQCM(ex, zone, h) {
  zone.innerHTML = `<div class="quiz"><div class="q">${ex.options.map((o, i) => `<label><input type="${ex.multiple ? 'checkbox' : 'radio'}" name="qcm" value="${i}"> <span>${o}</span></label>`).join('')}</div><button class="btn primary valid" type="button">Valider</button></div>`;
  $('.valid', zone).addEventListener('click', () => {
    const choisis = $$('input[name=qcm]:checked', zone).map(c => +c.value);
    if (!choisis.length) return toast('Choisis au moins une réponse.');
    const bonnes = Array.isArray(ex.bonne) ? ex.bonne : [ex.bonne];
    const ok = choisis.length === bonnes.length && choisis.every(c => bonnes.includes(c));
    $$('label', zone).forEach((lab, i) => { lab.classList.toggle('ok', bonnes.includes(i)); lab.classList.toggle('ko', choisis.includes(i) && !bonnes.includes(i)); });
    if (ok) { h.banniere(true, ex.explication || 'Bonne réponse.'); h.reussite(); } else { h.echec(); h.banniere(false, 'Ce n\'est pas la bonne réponse. Relis la leçon et réessaie.'); }
  });
}

function exerciceTexte(ex, zone, h) {
  zone.innerHTML = `<textarea class="answer" placeholder="${esc(ex.placeholder || 'Écris ta réponse ici…')}" aria-label="Ta réponse"></textarea>
    ${ex.criteres ? `<ul class="criteres">${ex.criteres.map(c => `<li><span class="m"></span><span>${esc(c.label)}</span></li>`).join('')}</ul>` : ''}
    <div class="toolbar"><button class="btn primary verif" type="button">Vérifier</button><button class="btn small ghost sol" type="button" hidden>Voir un exemple de réponse</button></div>`;
  const ta = $('textarea', zone), btnSol = $('.sol', zone);
  const majSol = () => { btnSol.hidden = !h.peutVoirSolution() || !ex.solution; };
  majSol();
  btnSol.addEventListener('click', () => { if (!$('.solution', zone)) h.blocSolution(null, ex.solution, 'Exemple de réponse').open = true; btnSol.hidden = true; });
  const evaluer = () => {
    const t = ta.value;
    let ok = true, msg = '';
    if (ex.criteres) {
      $$('.criteres li', zone).forEach((li, i) => { const c = ex.criteres[i]; const r = c.re ? c.re.test(t) : c.verif(t); li.classList.toggle('ok', !!r); li.querySelector('.m').textContent = r ? '✓' : ''; if (!r) ok = false; });
      if (!ok) msg = 'Certains critères ne sont pas encore remplis (voir la liste).';
    }
    if (ex.verif) { const r = ex.verif(t.trim()); if (r !== true) { ok = false; msg = typeof r === 'string' ? r : (msg || 'Réponse incorrecte.'); } }
    return { ok, msg };
  };
  ta.addEventListener('input', () => { if (ex.criteres) evaluer(); });
  $('.verif', zone).addEventListener('click', () => {
    const { ok, msg } = evaluer();
    if (ok) { h.banniere(true, ex.explication || 'Réponse validée.'); h.reussite(); } else { h.echec(); h.banniere(false, msg); }
    majSol();
  });
}

/* ---------- quiz ---------- */
function rendreQuiz(quiz, cle, cont, onFait) {
  const ancien = progression.quiz(cle);
  cont.innerHTML = `<section class="block quiz" aria-label="Quiz"><header>🎯 Quiz de la leçon<span class="tag">${quiz.length} questions${ancien ? ` · meilleur score ${ancien.score}/${ancien.total}` : ''}</span></header><div class="body">
    ${quiz.map((q, qi) => `<div class="q"><p class="qt">${qi + 1}. ${q.q}</p>${q.options.map((o, i) => `<label><input type="radio" name="q${qi}" value="${i}"> <span>${o}</span></label>`).join('')}<div class="expl" hidden>${q.explication || ''}</div></div>`).join('')}
    <div class="row"><button class="btn primary corr" type="button">Corriger le quiz</button><span class="quiz-score"></span></div></div></section>`;
  $('.corr', cont).addEventListener('click', () => {
    let score = 0;
    quiz.forEach((q, qi) => {
      const c = $(`input[name=q${qi}]:checked`, cont);
      const labels = $$(`input[name=q${qi}]`, cont).map(i => i.closest('label'));
      labels.forEach((lab, i) => { lab.classList.toggle('ok', i === q.bonne); lab.classList.toggle('ko', c && +c.value === i && i !== q.bonne); });
      if (c && +c.value === q.bonne) score++;
      const ex = $$('.expl', cont)[qi]; ex.hidden = !q.explication;
    });
    $('.quiz-score', cont).textContent = `Score : ${score}/${quiz.length}` + (score === quiz.length ? ' — parfait !' : score >= quiz.length / 2 ? ' — bien, relis les explications.' : ' — relis la leçon puis réessaie.');
    progression.scoreQuiz(cle, score, quiz.length);
    badgesGagnes();
    onFait();
  });
}

/* ---------- profil ---------- */
async function vueProfil(id) {
  setTitre('Mon profil');
  const tous = await chargerTout();
  if (id !== navId) return;
  const st = progression.etat;
  main.innerHTML = `<div class="wrap">
    <h1>Mon profil</h1>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
      <div class="card">
        <h3>Identité</h3>
        <div class="field"><label for="nom">Nom affiché sur les certificats</label><input id="nom" value="${esc(st.nom)}" placeholder="Prénom Nom"></div>
        <div class="stats" style="grid-template-columns:repeat(2,1fr)">
          <div class="stat"><b>${st.xp}</b><small>XP</small></div><div class="stat"><b>${progression.totalLecons()}</b><small>leçons</small></div>
          <div class="stat"><b>${progression.nbExercices()}</b><small>exercices réussis</small></div><div class="stat"><b>${progression.streak()} 🔥</b><small>jours d'affilée</small></div>
        </div>
      </div>
      <div class="card">
        <h3>Sauvegarde</h3>
        <p class="muted" style="font-size:.92rem">Ta progression est stockée uniquement dans ce navigateur. Exporte-la pour la transférer sur un autre appareil.</p>
        <div class="row"><button class="btn" id="exportBtn" type="button">⬇ Exporter (JSON)</button><label class="btn" for="importFile">⬆ Importer</label><input type="file" id="importFile" accept="application/json" hidden><button class="btn ghost" id="resetBtn" type="button" style="color:var(--err)">Réinitialiser</button></div>
      </div>
    </div>
    <div class="section-title"><h2>Badges</h2><span class="muted">${st.badges.length}/${BADGES.length}</span></div>
    <div class="badges">${BADGES.map(b => `<div class="badge ${st.badges.includes(b.id) ? 'won' : ''}"><div class="e">${b.e}</div><b>${b.nom}</b><small>${b.desc}</small></div>`).join('')}</div>
    <div class="section-title"><h2>Parcours</h2></div>
    <ul class="plist">${tous.map(p => { const n = progression.nbLecons(p.slug), t = p.lecons.length; return `<li><span><b>${esc(p.titre)}</b> <span class="muted">${n}/${t} leçons</span></span><span>${n >= t ? `<a class="btn small ok" href="#/certificat/${p.slug}">Certificat</a>` : `<a class="btn small" href="#/parcours/${p.slug}">${n ? 'Continuer' : 'Commencer'}</a>`}</span><div class="progress"><span style="width:${pct(n, t)}%"></span></div></li>`; }).join('')}</ul>
  </div>`;
  $('#nom').addEventListener('change', e => { progression.nom = e.target.value.trim(); toast('Nom enregistré.'); });
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([progression.exporter()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lumio-progression-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { progression.importer(await f.text()); toast('Progression importée.', 'ok'); router(); } catch (err) { toast('Import impossible : ' + err.message); }
  });
  $('#resetBtn').addEventListener('click', () => { if (confirm('Effacer toute ta progression ? Cette action est irréversible.')) { progression.reinitialiser(); router(); } });
}

/* ---------- glossaire ---------- */
function vueGlossaire() {
  setTitre('Glossaire');
  const rendre = q => {
    const liste = glossaire.filter(g => !q || (g.terme + ' ' + g.def + ' ' + g.domaine).toLowerCase().includes(q)).sort((a, b) => a.terme.localeCompare(b.terme, 'fr'));
    return liste.length ? `<dl class="gloss">${liste.map(g => `<dt>${esc(g.terme)}<span class="pill">${esc(g.domaine)}</span></dt><dd>${g.def}</dd>`).join('')}</dl>` : '<p class="empty">Aucun terme trouvé.</p>';
  };
  main.innerHTML = `<div class="wrap"><h1>Glossaire</h1><p class="muted">${glossaire.length} termes expliqués simplement, tous domaines confondus.</p>
    <div class="field"><input id="gq" placeholder="Filtrer : pointeur, prompt, SEO…" aria-label="Filtrer le glossaire"></div><div id="gl">${rendre('')}</div></div>`;
  $('#gq').addEventListener('input', e => { $('#gl').innerHTML = rendre(e.target.value.trim().toLowerCase()); });
}

/* ---------- recherche ---------- */
async function vueRecherche(q = '', id) {
  q = (q || '').trim();
  $('#searchInput').value = q;
  setTitre('Recherche');
  main.innerHTML = `<div class="wrap"><h1>Recherche</h1><p class="muted"><span class="spinner"></span> Chargement des parcours…</p></div>`;
  const tous = await chargerTout();
  if (id !== navId) return;
  const mots = q.toLowerCase().split(/\s+/).filter(Boolean);
  const res = [];
  if (mots.length) {
    for (const p of tous) for (const l of p.lecons) {
      const titre = l.titre.toLowerCase(), texte = texteBrut(l.theorie).toLowerCase();
      let score = 0;
      for (const m of mots) { if (titre.includes(m)) score += 10; if (p.titre.toLowerCase().includes(m)) score += 4; const n = texte.split(m).length - 1; score += Math.min(n, 5); }
      if (score > 0) {
        const pos = texte.indexOf(mots[0]);
        const extrait = texteBrut(l.theorie).slice(Math.max(0, pos - 70), pos + 130);
        res.push({ p, l, score, extrait });
      }
    }
    res.sort((a, b) => b.score - a.score);
  }
  const surligner = s => { let out = esc(s); mots.forEach(m => { out = out.replace(new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), x => `<mark>${x}</mark>`); }); return out; };
  main.innerHTML = `<div class="wrap"><h1>Recherche</h1><p class="muted">${mots.length ? `${res.length} résultat(s) pour « ${esc(q)} »` : 'Tape un mot-clé dans la barre de recherche.'}</p>
    <ul class="results">${res.slice(0, 40).map(r => `<li><a href="#/cours/${r.p.slug}/${r.l.index}"><div class="path">${esc(r.p.titre)} › ${esc(r.p.modules[r.l.module].titre)}</div><b>${surligner(r.l.titre)}</b><div class="muted" style="font-size:.9rem">…${surligner(r.extrait)}…</div></a></li>`).join('')}</ul></div>`;
}

/* ---------- certificat ---------- */
async function vueCertificat(slug, id) {
  const p = await chargerParcours(slug);
  if (!p) throw new Error('Parcours inconnu');
  if (id !== navId) return;
  setTitre('Certificat ' + p.titre);
  const n = progression.nbLecons(slug), t = p.lecons.length;
  if (n < t) { main.innerHTML = `<div class="wrap"><div class="card"><h2>Certificat non disponible</h2><p>Tu as terminé ${n} leçon(s) sur ${t} du parcours ${esc(p.titre)}. Termine toutes les leçons pour obtenir ton certificat.</p><a class="btn primary" href="#/parcours/${slug}">Reprendre le parcours</a></div></div>`; return; }
  const date = progression.etat.certificats[slug] ? new Date(progression.etat.certificats[slug]) : new Date();
  const nom = progression.nom || 'Apprenant·e Lumio';
  main.innerHTML = `<div class="wrap">
    <div class="row noprint" style="justify-content:space-between;margin-bottom:10px"><a class="btn" href="#/parcours/${slug}">← Retour</a><div class="row">${progression.nom ? '' : '<a class="btn" href="#/profil">Indiquer mon nom</a>'}<button class="btn primary" onclick="window.print()">🖨 Imprimer / PDF</button></div></div>
    <div class="certif">
      <svg width="56" height="56" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${p.couleur}"/><path d="M20 16v26h22" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="44" cy="22" r="5" fill="#ffd166"/></svg>
      <p class="muted" style="letter-spacing:.2em;text-transform:uppercase;font-size:.8rem;margin-top:10px">Certificat de réussite</p>
      <h1>${esc(p.titre)}</h1>
      <p>Ce certificat atteste que</p>
      <div class="name">${esc(nom)}</div>
      <p>a terminé l'intégralité du parcours <b>${esc(p.titre)}</b> sur Lumio : ${p.modules.length} modules, ${t} leçons, exercices pratiques et quiz validés.</p>
      <p class="muted">Durée estimée du parcours : ${fmtDuree(dureeParcours(p))} · XP total de l'apprenant : ${progression.etat.xp}</p>
      <div class="sig"><span>Délivré le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span>Lumio — plateforme de formation</span></div>
    </div></div>`;
}

router();
