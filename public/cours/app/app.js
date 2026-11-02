// Espace membre : routage par hash, vues, exercices, quiz, progression, accès payant.
import { modules, bonus, trouverModule, chargerModule, chargerAccessibles, estAccessible, viderCache } from '../content/index.js';
import { RANGS, NOMS_OFFRES, offrePermet, totalLecons, fichiers } from '../content/catalogue.js';
import { progression, BADGES } from './progress.js';
import { colorer } from './surligneur.js';
import { accesActuel, offreActuelle, activerCle, oublierAcces, telechargerFichier, ErreurAcces } from '../../assets/js/acces-client.js';

const CFG = window.LEVIER_CONFIG || {};
const NOM_PRODUIT = CFG.produit?.nom || 'Levier';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const main = $('#main');
const num = n => String(n).padStart(2, '0');
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const texteBrut = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const nomFormateur = () => [CFG.formateur?.prenom, CFG.formateur?.nom].filter(Boolean).join(' ') || 'Le formateur';
const url = new URL(location.href);
const modeFormateur = url.searchParams.get('formateur') === '1';

const ICO = {
  lock: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  dl: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0-5-5m5 5 5-5M4 21h16"/></svg>',
  film: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 5v14M17 5v14M3 9h4M3 15h4M17 9h4M17 15h4"/></svg>'
};

/* ---------- utilitaires d'interface ---------- */
export function toast(msg, type = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  const zone = $('#toasts');
  while (zone.children.length >= 3) zone.firstElementChild.remove(); // trois messages visibles au plus
  zone.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3800);
}
function setTitre(t) { document.title = t ? `${t} · ${NOM_PRODUIT}` : `Espace membre · ${NOM_PRODUIT}`; }
function dureeLecon(l) {
  let min = Math.ceil(texteBrut(l.theorie).split(' ').length / 180) + Math.ceil(texteBrut((l.pas || []).map(p => p.t + ' ' + p.d).join(' ')).split(' ').length / 180);
  if (l.exercice) min += l.exercice.type === 'texte' ? 10 : 5;
  if (l.quiz) min += l.quiz.length;
  return Math.max(5, min);
}
const fmtDuree = m => m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`;
const badgesGagnes = () => progression.verifierBadges().forEach(b => toast(`Badge obtenu : ${b.nom}`, 'ok'));
const pillOffre = o => `<span class="pill offre-${o}">${o === 'gratuit' ? 'Gratuit' : esc(NOMS_OFFRES[o])}</span>`;
async function copier(texte, bouton) {
  try { await navigator.clipboard.writeText(texte); }
  catch {
    const ta = document.createElement('textarea'); ta.value = texte; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch { /* */ }
    ta.remove();
  }
  if (bouton) { const o = bouton.innerHTML; bouton.textContent = 'Copié'; setTimeout(() => { bouton.innerHTML = o; }, 1600); }
}

/* ---------- barre d'en-tête ---------- */
function majStatutAcces() {
  const o = offreActuelle();
  const b = $('#accesBtn');
  b.textContent = o === 'gratuit' ? 'Débloquer' : `Accès ${NOMS_OFFRES[o]}`;
  b.classList.toggle('actif', o !== 'gratuit');
  $$('[data-bonus]').forEach(el => { el.hidden = !offrePermet(o, bonus.offre); });
}
$('#themeBtn').addEventListener('click', () => {
  const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('levier.theme', t); } catch { /* */ }
});
$('#menuBtn').addEventListener('click', () => {
  const ouvert = $('#topbar').classList.toggle('menu-open');
  $('#menuBtn').setAttribute('aria-expanded', String(ouvert));
});
$('#searchForm').addEventListener('submit', e => {
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  if (q) location.hash = '#/recherche?q=' + encodeURIComponent(q);
});
document.addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (e.key === 'Escape') { $('.sidebar.open')?.classList.remove('open'); $('#topbar').classList.remove('menu-open'); return; }
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
  if (e.key === '/') { e.preventDefault(); $('#searchInput').focus(); }
  else if (e.altKey && e.key === 'ArrowRight') $('#navSuiv')?.click();
  else if (e.altKey && e.key === 'ArrowLeft') $('#navPrec')?.click();
});

/* ---------- routage ---------- */
const routes = [
  [/^\/?$/, vueAccueil],
  [/^\/module\/([\w-]+)$/, vueModule],
  [/^\/lecon\/([\w-]+)\/(\d+)$/, vueLecon],
  [/^\/acces$/, vueAcces],
  [/^\/prompts$/, vuePrompts],
  [/^\/ressources$/, vueRessources],
  [/^\/profil$/, vueProfil],
  [/^\/certificat\/([\w-]+)$/, vueCertificat],
  [/^\/recherche(?:\?q=(.*))?$/, vueRecherche],
  [/^\/scripts$/, vueScripts]
];
let navId = 0;
async function router() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const id = ++navId;
  $('#topbar').classList.remove('menu-open');
  $('#menuBtn').setAttribute('aria-expanded', 'false');
  if (!hash.startsWith('/recherche')) $('#searchInput').value = '';
  const section = '#/' + (hash.split('/')[1] || '').split('?')[0];
  $$('.topnav a').forEach(a => {
    const actif = a.getAttribute('href') === section || (section === '#/' && a.getAttribute('href') === '#/') || (section === '#/lecon' && a.getAttribute('href') === '#/');
    a.classList.toggle('active', actif);
    if (actif) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  majStatutAcces();
  for (const [re, fn] of routes) {
    const m = hash.match(re);
    if (!m) continue;
    try {
      await fn(...m.slice(1).map(x => x === undefined ? x : decodeURIComponent(x)), id);
    } catch (err) {
      if (id !== navId) return;
      if (err instanceof ErreurAcces && err.statut === 401) { majStatutAcces(); toast(err.message); location.hash = '#/acces'; return; }
      console.warn(err);
      main.innerHTML = `<div class="wrap"><div class="card"><h1 class="h2">Impossible d'afficher cette page</h1><p>${esc(err.message)}</p><a class="btn primary" href="#/">Retour au tableau de bord</a></div></div>`;
    }
    if (id === navId) {
      window.scrollTo({ top: 0 });
      colorer(main);
      const h1 = $('h1', main);
      if (h1 && document.activeElement !== $('#searchInput')) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
    return;
  }
  main.innerHTML = `<div class="wrap"><div class="empty"><h1 class="h2">Page introuvable</h1><a class="btn primary" href="#/">Retour au tableau de bord</a></div></div>`;
}
window.addEventListener('hashchange', router);

/* ---------- tableau de bord ---------- */
function prochaineLecon() {
  for (const m of modules) {
    if (!estAccessible(m.id)) continue;
    const i = m.lecons.findIndex((_, k) => !progression.leconFaite(m.id, k + 1));
    if (i >= 0) return { m, index: i + 1, titre: m.lecons[i] };
  }
  return null;
}
function carteModule(m) {
  const ouvert = estAccessible(m.id);
  const faites = progression.nbLecons(m.id), total = m.lecons.length;
  return `<a class="mcard ${ouvert ? '' : 'locked'} ${faites >= total ? 'complete' : ''}" href="#/module/${m.id}">
    <span class="mnum" aria-hidden="true">M${num(m.numero)}</span>
    <span class="mbody">
      <span class="mtitre">${esc(m.titre)}</span>
      <span class="macc">${esc(m.accroche)}</span>
    </span>
    <span class="mmeta">
      ${ouvert ? `<span>${faites}/${total} leçons</span>` : `<span class="lockline">${ICO.lock} Offre ${esc(NOMS_OFFRES[m.offre])}</span>`}
      ${m.offre === 'gratuit' ? pillOffre('gratuit') : ''}
    </span>
    ${ouvert ? `<span class="progress" aria-hidden="true"><span style="width:${pct(faites, total)}%"></span></span>` : ''}
  </a>`;
}
async function vueAccueil() {
  setTitre('');
  const o = offreActuelle();
  const accessibles = modules.filter(m => estAccessible(m.id));
  const totalAcc = accessibles.reduce((n, m) => n + m.lecons.length, 0);
  const faitesAcc = accessibles.reduce((n, m) => n + Math.min(progression.nbLecons(m.id), m.lecons.length), 0);
  const suite = prochaineLecon();
  const prenom = progression.nom ? progression.nom.split(' ')[0] : '';
  main.innerHTML = `<div class="wrap">
    <section class="dash-hero">
      <div>
        <p class="eyebrow">Espace membre · ${esc(NOM_PRODUIT)}</p>
        <h1>${prenom ? `Bonjour ${esc(prenom)}.` : 'Bienvenue.'} <em>On avance.</em></h1>
        <p class="lead">${totalAcc ? `Vous avez terminé <b>${faitesAcc}</b> leçon${faitesAcc > 1 ? 's' : ''} sur ${totalAcc} accessibles avec votre offre.` : ''} Chaque leçon : la théorie, un pas-à-pas, un exercice, un quiz et un script vidéo.</p>
        <div class="row">
          ${suite ? `<a class="btn primary" href="#/lecon/${suite.m.id}/${suite.index}">${faitesAcc ? 'Reprendre' : 'Commencer'} : ${esc(suite.titre)}</a>` : `<a class="btn primary" href="#/profil">Voir mes certificats</a>`}
          <a class="btn" href="#/module/m0">Plan d'action 30 jours</a>
        </div>
      </div>
      <aside class="acces-card ${o}">
        <p class="eyebrow">Votre accès</p>
        <p class="acces-offre">${o === 'gratuit' ? 'Gratuit' : esc(NOMS_OFFRES[o])}</p>
        <p class="muted">${o === 'gratuit' ? 'Modules 0 et 1 ouverts. Les modules 2 à 8 et les bonus se débloquent avec une offre.' : o === 'essentiel' ? 'Modules 0 à 3, 7, 8 et bonus. Les modules 4, 5 et 6 sont inclus dans l\'offre Pro.' : 'Toute la formation et les bonus sont ouverts.'}</p>
        <div class="progress big" role="progressbar" aria-label="Progression sur les leçons accessibles" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct(faitesAcc, totalAcc)}"><span style="width:${pct(faitesAcc, totalAcc)}%"></span></div>
        <div class="row">
          ${RANGS[o] < RANGS.pro ? `<a class="btn small primary" href="../#offres">Voir les offres</a>` : ''}
          <a class="btn small ghost" href="#/acces">${o === 'gratuit' ? 'J\'ai un code ou une licence' : 'Gérer mon accès'}</a>
        </div>
      </aside>
    </section>
    <div class="section-title"><h2>Le programme</h2><span class="muted">${modules.length} modules · ${totalLecons} leçons</span></div>
    <div class="mgrid">${modules.map(carteModule).join('')}
      <a class="mcard bonus ${offrePermet(o, bonus.offre) ? '' : 'locked'}" href="${offrePermet(o, bonus.offre) ? '#/prompts' : '#/module/bonus'}">
        <span class="mnum" aria-hidden="true">+</span>
        <span class="mbody"><span class="mtitre">${esc(bonus.titre)}</span><span class="macc">${esc(bonus.accroche)}</span></span>
        <span class="mmeta">${offrePermet(o, bonus.offre) ? '<span>Prompts · modèles · checklists</span>' : `<span class="lockline">${ICO.lock} Offre ${NOMS_OFFRES[bonus.offre]}</span>`}</span>
      </a>
    </div>
    <div class="section-title"><h2>Méthode</h2></div>
    <div class="features">
      <div class="feature"><b>1 · Comprendre</b>Une théorie courte, à jour, avec les pièges à éviter.</div>
      <div class="feature"><b>2 · Faire</b>Un pas-à-pas à suivre pendant que vous lisez, sur vos propres projets.</div>
      <div class="feature"><b>3 · Valider</b>Exercice corrigé selon des critères précis, puis quiz. La leçon se valide automatiquement.</div>
      <div class="feature"><b>4 · Vendre</b>Chaque module se termine par ce que vous pouvez proposer à un client dès maintenant.</div>
    </div>
  </div>`;
}

/* ---------- module ---------- */
function panneauDeblocage(meta, message = '') {
  return `<section class="card unlock" aria-labelledby="unlockTitre">
    <div class="unlock-ico">${ICO.lock}</div>
    <div class="unlock-body">
      <h2 id="unlockTitre" class="h3">Ce module fait partie de l'offre ${esc(NOMS_OFFRES[meta.offre])}</h2>
      <p class="muted">${message ? esc(message) + ' ' : ''}Saisissez le code d'accès ou la clé de licence reçue après votre achat. Le contenu est chargé de façon sécurisée, il n'est pas stocké dans les pages publiques du site.</p>
      ${formulaireAcces('unlock')}
      <p class="small">Pas encore inscrit ? <a href="../#offres">Comparer les offres</a>.</p>
    </div>
  </section>`;
}
function formulaireAcces(idForm) {
  return `<form class="acces-form" id="${idForm}" novalidate>
    <label for="${idForm}-cle">Code d'accès ou clé de licence</label>
    <div class="inline-field">
      <input id="${idForm}-cle" name="cle" type="text" autocomplete="off" spellcheck="false" placeholder="LEV-XXXXX-XXXXX-XXXXX ou clé de licence" required aria-describedby="${idForm}-msg">
      <button class="btn primary" type="submit">Débloquer</button>
    </div>
    <p class="form-msg" id="${idForm}-msg" role="status" aria-live="polite"></p>
  </form>`;
}
function brancherFormulaireAcces(form, apres) {
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const champ = form.querySelector('input'), msg = form.querySelector('.form-msg'), btn = form.querySelector('button');
    const cle = champ.value.trim();
    msg.className = 'form-msg';
    if (!cle) { msg.textContent = 'Collez votre code ou votre clé de licence.'; msg.classList.add('ko'); champ.focus(); return; }
    btn.disabled = true; msg.textContent = 'Vérification…';
    try {
      const a = await activerCle(cle);
      viderCache();
      msg.textContent = `Accès ${NOMS_OFFRES[a.offre]} activé.`; msg.classList.add('ok');
      toast(`Accès ${NOMS_OFFRES[a.offre]} activé. Bonne formation !`, 'ok');
      majStatutAcces();
      apres ? apres(a) : router();
    } catch (err) {
      msg.textContent = err.message; msg.classList.add('ko');
      champ.setAttribute('aria-invalid', 'true');
    } finally { btn.disabled = false; }
  });
}

async function vueModule(id, nav) {
  if (id === 'bonus') {
    if (offrePermet(offreActuelle(), bonus.offre)) { location.replace('#/prompts'); return; }
    setTitre(bonus.titre);
    main.innerHTML = `<div class="wrap narrow"><div class="crumbs"><a href="#/">Tableau de bord</a> › <span>Bonus</span></div>
      <header class="mhead"><span class="mnum big">+</span><div><h1>${esc(bonus.titre)}</h1><p class="lead">${esc(bonus.accroche)}</p></div></header>
      <ul class="lessons locked">${bonus.sections.map(s => `<li><span class="lk">${ICO.lock}<span>${esc(s)}</span></span></li>`).join('')}</ul>
      ${panneauDeblocage(bonus)}</div>`;
    brancherFormulaireAcces($('#unlock'));
    return;
  }
  const meta = trouverModule(id);
  if (!meta) throw new Error('Module inconnu.');
  setTitre(`M${num(meta.numero)} ${meta.titre}`);
  const entete = `<div class="crumbs"><a href="#/">Tableau de bord</a> › <span>Module ${meta.numero}</span></div>
    <header class="mhead"><span class="mnum big" aria-hidden="true">M${num(meta.numero)}</span><div><h1>${esc(meta.titre)}</h1><p class="lead">${esc(meta.accroche)}</p><div class="row">${pillOffre(meta.offre)}<span class="pill">${meta.lecons.length} leçons</span></div></div></header>`;
  if (!estAccessible(id)) {
    main.innerHTML = `<div class="wrap narrow">${entete}
      <ul class="lessons locked">${meta.lecons.map((t, i) => `<li><span class="lk">${ICO.lock}<span class="n">${num(i + 1)}</span><span>${esc(t)}</span></span></li>`).join('')}</ul>
      ${panneauDeblocage(meta, offreActuelle() !== 'gratuit' ? `Votre accès ${NOMS_OFFRES[offreActuelle()]} est actif sur cet appareil.` : '')}</div>`;
    brancherFormulaireAcces($('#unlock'));
    return;
  }
  main.innerHTML = `<div class="wrap narrow">${entete}<p class="muted"><span class="spinner"></span> Chargement du module…</p></div>`;
  let m;
  try { m = await chargerModule(id); }
  catch (err) {
    if (nav !== navId) return;
    if (err instanceof ErreurAcces && (err.statut === 401 || err.statut === 403)) {
      if (err.statut === 401) majStatutAcces();
      main.innerHTML = `<div class="wrap narrow">${entete}${panneauDeblocage(meta, err.message)}</div>`;
      brancherFormulaireAcces($('#unlock'));
      return;
    }
    throw err;
  }
  if (nav !== navId) return;
  const faites = progression.nbLecons(id), total = m.lecons.length;
  const suivante = m.lecons.find(l => !progression.leconFaite(id, l.index)) || m.lecons[0];
  main.innerHTML = `<div class="wrap narrow">${entete}
    <div class="progress big" role="progressbar" aria-label="Progression du module" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct(faites, total)}"><span style="width:${pct(faites, total)}%"></span></div>
    <div class="row" style="margin:16px 0 26px">
      <a class="btn primary" href="#/lecon/${id}/${suivante.index}">${faites ? 'Continuer' : 'Commencer'} : ${esc(suivante.titre)}</a>
      ${faites >= total ? `<a class="btn ok" href="#/certificat/${id}">Certificat du module</a>` : `<span class="muted">${faites}/${total} leçons terminées</span>`}
    </div>
    ${m.intro ? `<div class="card intro">${m.intro}</div>` : ''}
    <ol class="lessons">${m.lecons.map(l => {
      const fait = progression.leconFaite(id, l.index);
      return `<li class="${fait ? 'done' : ''}"><a class="lk" href="#/lecon/${id}/${l.index}"><span class="check">${fait ? ICO.check : ''}</span><span class="n">${num(l.index)}</span><span class="t">${esc(l.titre)}</span><span class="dur">${fmtDuree(dureeLecon(l))}</span></a></li>`;
    }).join('')}</ol>
  </div>`;
}

/* ---------- leçon ---------- */
function blocVideo(id, idx) {
  const src = CFG.cours?.videos?.[`${id}-${idx}`];
  if (!src || !/^https:\/\/(www\.youtube-nocookie\.com|player\.vimeo\.com|iframe\.mediadelivery\.net)\//.test(src)) return '';
  return `<div class="video"><iframe src="${esc(src)}" title="Vidéo de la leçon" loading="lazy" allow="fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
}
function blocPas(pas) {
  if (!pas?.length) return '';
  return `<section class="block pas" aria-labelledby="pasTitre"><header><span id="pasTitre">Pas-à-pas</span><span class="tag">${pas.length} étapes</span></header>
    <ol class="steps">${pas.map(p => `<li><b>${esc(p.t)}</b><div>${p.d}</div></li>`).join('')}</ol></section>`;
}
function scriptsVisibles() {
  const mode = CFG.cours?.scriptsVideo || 'tous';
  return mode === 'tous' || (mode === 'formateur' && modeFormateur);
}
function blocScript(s, titre) {
  if (!s || !scriptsVisibles()) return '';
  const texte = `${titre}\nDurée visée : ${s.duree}\n\nACCROCHE\n${s.accroche}\n\nPLAN\n${s.plan.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n${s.demo ? `\nÀ L'ÉCRAN\n${s.demo}\n` : ''}\nAPPEL À L'ACTION\n${s.cta}`;
  return `<details class="block script"><summary>${ICO.film}<span>Script vidéo de la leçon</span><span class="tag">${esc(s.duree)}</span></summary>
    <div class="body">
      <p class="eyebrow">Accroche</p><p class="accroche">« ${esc(s.accroche)} »</p>
      <p class="eyebrow">Plan</p><ol>${s.plan.map(p => `<li>${esc(p)}</li>`).join('')}</ol>
      ${s.demo ? `<p class="eyebrow">À l'écran</p><p>${esc(s.demo)}</p>` : ''}
      <p class="eyebrow">Appel à l'action</p><p>${esc(s.cta)}</p>
      <button class="btn small ghost copy-script" type="button">${ICO.copy} Copier le script</button>
    </div>
    <textarea hidden class="script-src">${esc(texte)}</textarea>
  </details>`;
}
function blocFichiers(liste) {
  if (!liste?.length) return '';
  return `<div class="files">${liste.map(f => `<button class="btn small dl" type="button" data-fichier="${esc(f)}">${ICO.dl} ${esc(fichiers[f]?.titre || f)} (n8n, .json)</button>`).join('')}</div>`;
}

async function vueLecon(id, numStr, nav) {
  const meta = trouverModule(id);
  if (!meta || id === 'bonus') throw new Error('Module inconnu.');
  if (!estAccessible(id)) { location.replace('#/module/' + id); return; }
  main.innerHTML = `<div class="wrap narrow"><p class="muted"><span class="spinner"></span> Chargement de la leçon…</p></div>`;
  const m = await chargerModule(id);
  if (nav !== navId) return;
  const idx = Math.min(Math.max(parseInt(numStr, 10) || 1, 1), m.lecons.length);
  const l = m.lecons[idx - 1];
  const prec = m.lecons[idx - 2], suiv = m.lecons[idx];
  const cle = `${id}/${idx}`;
  setTitre(`${l.titre} · M${num(m.numero)}`);
  const fait = progression.leconFaite(id, idx);

  main.innerHTML = `<div class="lesson-layout">
    <aside class="sidebar" id="sidebar" aria-label="Leçons du module">
      <div class="sb-title"><a href="#/module/${id}">M${num(m.numero)} · ${esc(m.titre)}</a><span class="muted">${progression.nbLecons(id)}/${m.lecons.length}</span></div>
      <div class="sb-progress"><div class="progress"><span style="width:${pct(progression.nbLecons(id), m.lecons.length)}%"></span></div></div>
      <nav>${m.lecons.map(x => `<a class="lk ${x.index === idx ? 'current' : ''} ${progression.leconFaite(id, x.index) ? 'done' : ''}" href="#/lecon/${id}/${x.index}" ${x.index === idx ? 'aria-current="page"' : ''}><span class="dot"></span><span>${esc(x.titre)}</span></a>`).join('')}</nav>
    </aside>
    <article class="lesson">
      <div class="crumbs"><a href="#/">Tableau de bord</a> › <a href="#/module/${id}">Module ${m.numero}</a> › <span>Leçon ${idx}</span></div>
      <p class="eyebrow">M${num(m.numero)} · Leçon ${num(idx)} / ${num(m.lecons.length)}</p>
      <h1>${esc(l.titre)}</h1>
      <div class="lesson-meta">
        <button class="btn small ghost sb-toggle" id="sbToggle" type="button" aria-controls="sidebar" aria-expanded="false">Sommaire</button>
        <span>≈ ${fmtDuree(dureeLecon(l))}</span>
        ${l.exercice ? `<span>· ${l.exercice.type === 'checklist' ? 'Checklist' : 'Exercice'}</span>` : ''}${l.quiz ? `<span>· Quiz ${l.quiz.length} questions</span>` : ''}
      </div>
      ${l.objectifs?.length ? `<div class="objectifs"><p class="eyebrow">À la fin de cette leçon</p><ul>${l.objectifs.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>` : ''}
      ${blocVideo(id, idx)}
      <div class="theorie">${l.theorie}</div>
      ${blocFichiers(l.fichiers)}
      ${blocPas(l.pas)}
      <div id="exo"></div>
      <div id="quiz"></div>
      ${blocScript(l.script, l.titre)}
      ${l.sources?.length ? `<div class="sources"><p class="eyebrow">Sources officielles à consulter</p><ul>${l.sources.map(s => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.titre)}</a></li>`).join('')}</ul></div>` : ''}
      <div class="done-bar ${fait ? 'is-done' : ''}" id="doneBar">
        <span class="msg" id="doneMsg"></span>
        <button class="btn ${fait ? 'ok' : 'primary'}" id="doneBtn" type="button">${fait ? 'Leçon terminée' : 'Marquer comme terminée'}</button>
      </div>
      <nav class="lesson-nav" aria-label="Leçon précédente ou suivante">
        ${prec ? `<a class="btn" id="navPrec" href="#/lecon/${id}/${prec.index}"><span aria-hidden="true">←</span> ${esc(prec.titre)}</a>` : '<span></span>'}
        ${suiv ? `<a class="btn primary" id="navSuiv" href="#/lecon/${id}/${suiv.index}">${esc(suiv.titre)} <span aria-hidden="true">→</span></a>` : `<a class="btn ok" id="navSuiv" href="#/module/${id}">Terminer le module</a>`}
      </nav>
    </article>
  </div>`;

  const sb = $('#sidebar'), tg = $('#sbToggle');
  tg.addEventListener('click', () => { const o = sb.classList.toggle('open'); tg.setAttribute('aria-expanded', String(o)); });
  sb.addEventListener('click', e => { if (e.target.closest('a.lk')) sb.classList.remove('open'); });
  $$('.copy-script', main).forEach(b => b.addEventListener('click', () => copier(b.closest('details').querySelector('.script-src').value, b)));
  $$('button.dl', main).forEach(b => b.addEventListener('click', async () => {
    b.disabled = true;
    try { await telechargerFichier(b.dataset.fichier); toast('Workflow téléchargé. Importez-le dans n8n (menu ⋯ › Import from file).', 'ok'); }
    catch (err) { toast(err.message); }
    finally { b.disabled = false; }
  }));

  const etatLecon = { exo: !l.exercice || progression.exercice(cle).reussi, quiz: !l.quiz || !!progression.quiz(cle) };
  const majDone = () => {
    const msg = $('#doneMsg');
    if (progression.leconFaite(id, idx)) { msg.textContent = 'Leçon validée. Passez à la suivante quand vous voulez.'; return; }
    const reste = [];
    if (!etatLecon.exo) reste.push(l.exercice.type === 'checklist' ? 'cocher la checklist' : 'réussir l\'exercice');
    if (!etatLecon.quiz) reste.push('faire le quiz');
    msg.textContent = reste.length ? `Pour valider automatiquement : ${reste.join(' et ')}. Vous pouvez aussi la marquer comme terminée.` : 'Exercice et quiz faits : la leçon est validée.';
  };
  const terminer = auto => {
    const nouveau = progression.marquerLecon(id, idx, m.lecons.length);
    $('#doneBar').classList.add('is-done');
    const b = $('#doneBtn'); b.className = 'btn ok'; b.textContent = 'Leçon terminée';
    $$('.sidebar a.lk.current').forEach(a => a.classList.add('done'));
    majDone();
    if (nouveau) {
      toast(auto ? 'Leçon validée automatiquement : +50 XP' : 'Leçon terminée : +50 XP', 'ok');
      if (progression.nbLecons(id) >= m.lecons.length) toast(`Module ${m.numero} terminé : votre certificat est disponible.`, 'ok');
      if (modules.every(x => progression.nbLecons(x.id) >= x.lecons.length)) progression.certifierFormation();
      badgesGagnes();
    }
  };
  $('#doneBtn').addEventListener('click', () => terminer(false));
  const verifierAuto = () => { majDone(); if (etatLecon.exo && etatLecon.quiz && !progression.leconFaite(id, idx)) terminer(true); };
  majDone();
  if (l.exercice) rendreExercice(l.exercice, cle, $('#exo'), () => { etatLecon.exo = true; verifierAuto(); });
  if (l.quiz) rendreQuiz(l.quiz, cle, $('#quiz'), () => { etatLecon.quiz = true; verifierAuto(); });
}

/* ---------- exercices ---------- */
function rendreExercice(ex, cle, cont, onReussite) {
  const etatEx = progression.exercice(cle);
  const type = ex.type === 'qcm' ? 'QCM' : ex.type === 'checklist' ? 'Checklist' : 'Mise en pratique';
  cont.innerHTML = `<section class="block exo" aria-labelledby="exoTitre-${cle.replace('/', '-')}"><header><span id="exoTitre-${cle.replace('/', '-')}">${esc(ex.titre || 'Exercice')}</span><span class="tag">${type}${etatEx.reussi ? ' · validé' : ''}</span></header>
    <div class="body"><div class="enonce">${ex.enonce || ''}</div><div class="zone"></div></div></section>`;
  const zone = $('.zone', cont);
  const reussite = () => {
    const nouveau = progression.reussiteExercice(cle, ex.xp || 30);
    const tag = $('.tag', cont); if (!/validé/.test(tag.textContent)) tag.textContent += ' · validé';
    if (nouveau) { toast(`Exercice validé : +${ex.xp || 30} XP`, 'ok'); badgesGagnes(); }
    onReussite();
  };
  const echec = () => progression.echecExercice(cle);
  const banniere = (ok, texte) => {
    let b = $('.result-banner', zone);
    if (!b) { b = document.createElement('div'); b.setAttribute('role', 'status'); zone.appendChild(b); }
    b.className = 'result-banner ' + (ok ? 'ok' : 'ko'); b.textContent = texte;
  };
  if (ex.type === 'qcm') return exerciceQCM(ex, zone, { reussite, echec, banniere });
  if (ex.type === 'checklist') return exerciceChecklist(ex, cle, zone, { reussite, banniere, deja: etatEx.reussi });
  return exerciceTexte(ex, cle, zone, { reussite, echec, banniere });
}

function testerCritere(c, t) {
  if (c.minMots) return t.trim().split(/\s+/).filter(Boolean).length >= c.minMots;
  if (c.motif) { try { return new RegExp(c.motif, c.drapeaux || 'i').test(t); } catch { return false; } }
  return false;
}
function exerciceTexte(ex, cle, zone, h) {
  const idTa = 'rep-' + cle.replace('/', '-');
  zone.innerHTML = `<label class="sr-only" for="${idTa}">Votre réponse</label>
    <textarea class="answer" id="${idTa}" placeholder="${esc(ex.placeholder || 'Écrivez votre réponse ici…')}"></textarea>
    ${ex.criteres ? `<ul class="criteres" aria-label="Critères de validation">${ex.criteres.map(c => `<li><span class="m" aria-hidden="true"></span><span>${esc(c.label)}</span></li>`).join('')}</ul>` : ''}
    <div class="toolbar"><button class="btn primary verif" type="button">Vérifier ma réponse</button><button class="btn small ghost sol" type="button" hidden>Voir un exemple de réponse</button></div>`;
  const ta = $('textarea', zone), btnSol = $('.sol', zone);
  try { const s = localStorage.getItem('levier.rep.' + cle); if (s) ta.value = s; } catch { /* */ }
  const peutVoir = () => progression.exercice(cle).echecs >= 1 || progression.exercice(cle).reussi;
  const majSol = () => { btnSol.hidden = !peutVoir() || !ex.solution; };
  majSol();
  btnSol.addEventListener('click', () => {
    if (!$('.solution', zone)) { const d = document.createElement('div'); d.className = 'solution callout info'; d.innerHTML = `<b>Exemple de réponse</b>${ex.solution}`; zone.appendChild(d); }
    btnSol.hidden = true;
  });
  const evaluer = () => {
    const t = ta.value;
    let ok = true;
    $$('.criteres li', zone).forEach((li, i) => {
      const r = testerCritere(ex.criteres[i], t);
      li.classList.toggle('ok', r);
      li.querySelector('.m').innerHTML = r ? ICO.check : '';
      if (!r) ok = false;
    });
    return ok;
  };
  ta.addEventListener('input', () => { if (ex.criteres) evaluer(); try { localStorage.setItem('levier.rep.' + cle, ta.value); } catch { /* */ } });
  if (ta.value && ex.criteres) evaluer();
  $('.verif', zone).addEventListener('click', () => {
    const ok = evaluer();
    if (ok) { h.banniere(true, ex.explication || 'Réponse validée.'); h.reussite(); }
    else { h.echec(); h.banniere(false, 'Certains critères ne sont pas encore remplis : complétez votre réponse (liste ci-dessus).'); }
    majSol();
  });
}
function exerciceQCM(ex, zone, h) {
  const nom = 'qcm-' + Math.random().toString(36).slice(2, 8);
  zone.innerHTML = `<fieldset class="quiz"><legend class="sr-only">Choisissez ${ex.multiple ? 'une ou plusieurs réponses' : 'une réponse'}</legend><div class="q">${ex.options.map((o, i) => `<label><input type="${ex.multiple ? 'checkbox' : 'radio'}" name="${nom}" value="${i}"> <span>${esc(o)}</span></label>`).join('')}</div></fieldset><button class="btn primary valid" type="button">Valider</button>`;
  $('.valid', zone).addEventListener('click', () => {
    const choisis = $$(`input[name=${nom}]:checked`, zone).map(c => +c.value);
    if (!choisis.length) return toast('Choisissez au moins une réponse.');
    const bonnes = Array.isArray(ex.bonne) ? ex.bonne : [ex.bonne];
    const ok = choisis.length === bonnes.length && choisis.every(c => bonnes.includes(c));
    $$('label', zone).forEach((lab, i) => { lab.classList.toggle('ok', ok && bonnes.includes(i)); lab.classList.toggle('ko', choisis.includes(i) && !bonnes.includes(i)); });
    if (ok) { h.banniere(true, ex.explication || 'Bonne réponse.'); h.reussite(); } else { h.echec(); h.banniere(false, 'Ce n\'est pas encore ça. Relisez la leçon et réessayez.'); }
  });
}
function exerciceChecklist(ex, cle, zone, h) {
  const items = ex.items || [];
  const etat = progression.checklist(cle, items.length);
  zone.innerHTML = `<ul class="checklist">${items.map((it, i) => `<li><label><input type="checkbox" data-i="${i}" ${etat[i] ? 'checked' : ''}> <span>${esc(it)}</span></label></li>`).join('')}</ul><p class="muted small checklist-count"></p>`;
  const maj = (fin = false) => {
    const l = progression.checklist(cle, items.length);
    const n = l.filter(Boolean).length;
    $('.checklist-count', zone).textContent = `${n}/${items.length} éléments cochés`;
    if (n === items.length && fin) { h.banniere(true, ex.explication || 'Checklist complète.'); h.reussite(); }
  };
  zone.addEventListener('change', e => {
    const c = e.target.closest('input[type=checkbox]'); if (!c) return;
    progression.cocher(cle, +c.dataset.i, c.checked, items.length);
    maj(true);
  });
  maj(false);
}

/* ---------- quiz ---------- */
function rendreQuiz(quiz, cle, cont, onFait) {
  const ancien = progression.quiz(cle);
  const base = 'q-' + cle.replace('/', '-');
  cont.innerHTML = `<section class="block quiz" aria-labelledby="${base}-t"><header><span id="${base}-t">Quiz de la leçon</span><span class="tag">${quiz.length} questions${ancien ? ` · meilleur score ${ancien.score}/${ancien.total}` : ''}</span></header><div class="body">
    ${quiz.map((q, qi) => `<fieldset class="q"><legend class="qt">${qi + 1}. ${esc(q.q)}</legend>${q.options.map((o, i) => `<label><input type="radio" name="${base}-${qi}" value="${i}"> <span>${esc(o)}</span></label>`).join('')}<p class="expl" hidden>${esc(q.explication || '')}</p></fieldset>`).join('')}
    <div class="row"><button class="btn primary corr" type="button">Corriger le quiz</button><span class="quiz-score" role="status" aria-live="polite"></span></div></div></section>`;
  $('.corr', cont).addEventListener('click', () => {
    let score = 0, repondues = 0;
    quiz.forEach((q, qi) => {
      const c = $(`input[name="${base}-${qi}"]:checked`, cont);
      if (c) repondues++;
      $$(`input[name="${base}-${qi}"]`, cont).forEach((inp, i) => {
        const lab = inp.closest('label');
        lab.classList.toggle('ok', i === q.bonne);
        lab.classList.toggle('ko', !!c && +c.value === i && i !== q.bonne);
      });
      if (c && +c.value === q.bonne) score++;
      $$('.expl', cont)[qi].hidden = !q.explication;
    });
    if (!repondues) { toast('Répondez aux questions avant de corriger.'); return; }
    $('.quiz-score', cont).textContent = `Score : ${score}/${quiz.length}` + (score === quiz.length ? ' · parfait.' : score >= quiz.length / 2 ? ' · bien, lisez les explications.' : ' · relisez la leçon puis réessayez.');
    progression.scoreQuiz(cle, score, quiz.length);
    badgesGagnes();
    onFait();
  });
}

/* ---------- accès ---------- */
function vueAcces() {
  setTitre('Mon accès');
  const a = accesActuel();
  const o = offreActuelle();
  main.innerHTML = `<div class="wrap narrow">
    <div class="crumbs"><a href="#/">Tableau de bord</a> › <span>Accès</span></div>
    <h1>Mon accès</h1>
    <div class="card acces-etat">
      <p class="eyebrow">Offre active</p>
      <p class="acces-offre">${o === 'gratuit' ? 'Gratuit' : esc(NOMS_OFFRES[o])}</p>
      ${a ? `<p class="muted">Activé sur cet appareil${a.expire ? `, valable jusqu'au ${new Date(a.expire * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} (il suffira de ressaisir votre code ensuite)` : ''}.</p>` : '<p class="muted">Modules 0 et 1 ouverts à tous.</p>'}
      ${a ? '<button class="btn small ghost" id="oublier" type="button">Retirer l\'accès de cet appareil</button>' : ''}
    </div>
    <section class="card">
      <h2 class="h3">${a ? 'Changer d\'offre ou saisir un autre code' : 'Débloquer la formation'}</h2>
      ${formulaireAcces('accesForm')}
      <details class="aide"><summary>Où trouver mon code ou ma clé ?</summary>
        <ul>
          <li><b>Achat via Gumroad ou Lemon Squeezy</b> : la clé de licence figure dans l'email de confirmation et dans votre espace client du vendeur.</li>
          <li><b>Achat via Stripe</b> : votre clé (commençant par <code>cs_</code>) s'affiche sur la page de confirmation après le paiement. Conservez-la.</li>
          <li><b>Code reçu par email</b> (format <code>LEV-XXXXX-XXXXX-XXXXX</code>) : copiez-collez-le tel quel.</li>
          <li>Un problème ? ${CFG.contact?.email ? `Écrivez à <a href="mailto:${esc(CFG.contact.email)}">${esc(CFG.contact.email)}</a> (réponse sous ${esc(CFG.contact.delaiReponse || '48 h ouvrées')}).` : 'Contactez le support indiqué dans votre email de confirmation.'}</li>
        </ul>
      </details>
    </section>
    ${RANGS[o] < RANGS.pro ? `<p class="muted">Pas encore d'offre ou besoin des modules 4 à 6 ? <a href="../#offres">Voir les offres</a>.</p>` : ''}
  </div>`;
  brancherFormulaireAcces($('#accesForm'), () => { location.hash = '#/'; });
  $('#oublier')?.addEventListener('click', () => { oublierAcces(); viderCache(); toast('Accès retiré de cet appareil.'); router(); });
}

/* ---------- bonus : prompts ---------- */
async function chargerBonus(nav) {
  if (!offrePermet(offreActuelle(), bonus.offre)) { location.replace('#/module/bonus'); return null; }
  main.innerHTML = `<div class="wrap"><p class="muted"><span class="spinner"></span> Chargement des bonus…</p></div>`;
  const b = await chargerModule('bonus');
  return nav === navId ? b : null;
}
const metierSlug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
async function vuePrompts(nav) {
  setTitre('Bibliothèque de prompts');
  const b = await chargerBonus(nav);
  if (!b) return;
  const metiers = [...new Set(b.prompts.map(p => p.metier))];
  main.innerHTML = `<div class="wrap">
    <div class="crumbs"><a href="#/">Tableau de bord</a> › <span>Bonus</span></div>
    <div class="bonus-tabs" role="navigation" aria-label="Bonus"><a class="active" aria-current="page" href="#/prompts">Prompts</a><a href="#/ressources">Modèles et checklists</a></div>
    <h1>Bibliothèque de prompts</h1>
    <p class="lead">${b.prompts.length} prompts métiers, structurés comme on l'apprend au module 2. Remplacez les <code>{{variables}}</code>, ajoutez vos documents, et gardez ceux qui marchent dans vos Projets.</p>
    <div class="filters">
      <label class="sr-only" for="pq">Rechercher un prompt</label>
      <input id="pq" type="search" placeholder="Rechercher : avis, devis, TikTok, SEO…" autocomplete="off">
      <div class="chips" role="group" aria-label="Filtrer par métier"><button class="chip active" type="button" data-m="">Tous</button>${metiers.map(m => `<button class="chip" type="button" data-m="${esc(metierSlug(m))}">${esc(m)}</button>`).join('')}</div>
    </div>
    <p class="muted small" id="pcount" role="status" aria-live="polite"></p>
    <div class="pgrid" id="plist"></div>
  </div>`;
  let filtre = '';
  const surligner = t => esc(t).replace(/\{\{([^}]+)\}\}/g, '<mark class="var">{{$1}}</mark>');
  const rendre = () => {
    const q = $('#pq').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const liste = b.prompts.filter(p => (!filtre || metierSlug(p.metier) === filtre) && (!q || (p.titre + ' ' + p.objectif + ' ' + p.prompt + ' ' + p.metier).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)));
    $('#pcount').textContent = `${liste.length} prompt${liste.length > 1 ? 's' : ''}`;
    $('#plist').innerHTML = liste.map(p => `<article class="pcard" data-id="${esc(p.id)}">
      <div class="row between"><span class="pill">${esc(p.metier)}</span><button class="btn small ghost cp" type="button" aria-label="Copier le prompt « ${esc(p.titre)} »">${ICO.copy} Copier</button></div>
      <h2 class="h4">${esc(p.titre)}</h2><p class="muted small">${esc(p.objectif)}</p>
      <pre class="prompt">${surligner(p.prompt)}</pre></article>`).join('') || '<p class="empty">Aucun prompt ne correspond.</p>';
  };
  $('#pq').addEventListener('input', rendre);
  $('.chips').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    filtre = c.dataset.m;
    $$('.chip').forEach(x => { x.classList.toggle('active', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    rendre();
  });
  $$('.chip').forEach(x => x.setAttribute('aria-pressed', String(x.classList.contains('active'))));
  $('#plist').addEventListener('click', e => {
    const bt = e.target.closest('.cp'); if (!bt) return;
    const p = b.prompts.find(x => x.id === bt.closest('.pcard').dataset.id);
    copier(p.prompt, bt);
  });
  rendre();
}

/* ---------- bonus : modèles et checklists ---------- */
async function vueRessources(nav) {
  setTitre('Modèles et checklists');
  const b = await chargerBonus(nav);
  if (!b) return;
  main.innerHTML = `<div class="wrap narrow">
    <div class="crumbs"><a href="#/">Tableau de bord</a> › <span>Bonus</span></div>
    <div class="bonus-tabs" role="navigation" aria-label="Bonus"><a href="#/prompts">Prompts</a><a class="active" aria-current="page" href="#/ressources">Modèles et checklists</a></div>
    <h1>Modèles et checklists</h1>
    <p class="lead">Des bases à adapter à votre activité. Les modèles juridiques sont des points de départ : faites-les relire par un professionnel avant usage.</p>
    <h2>Modèles</h2>
    <div class="modeles">${b.modeles.map((m, i) => `<details class="block modele"><summary><span>${esc(m.titre)}</span><span class="tag">${esc(m.type)}</span></summary>
      <div class="body"><div class="doc">${m.contenu}</div><button class="btn small ghost cpm" type="button" data-i="${i}">${ICO.copy} Copier le texte</button></div></details>`).join('')}</div>
    <h2>Checklists</h2>
    <div class="checklists">${b.checklists.map((c, ci) => {
      const cle = 'res/' + ci;
      const etat = progression.checklist(cle, c.items.length);
      return `<section class="card cl"><h3>${esc(c.titre)}</h3><ul class="checklist">${c.items.map((it, i) => `<li><label><input type="checkbox" data-c="${ci}" data-i="${i}" ${etat[i] ? 'checked' : ''}> <span>${esc(it)}</span></label></li>`).join('')}</ul></section>`;
    }).join('')}</div>
  </div>`;
  $$('.cpm', main).forEach(bt => bt.addEventListener('click', () => copier(texteBrutAvecLignes(b.modeles[+bt.dataset.i].contenu), bt)));
  main.addEventListener('change', e => {
    const c = e.target.closest('input[data-c]'); if (!c) return;
    progression.cocher('res/' + c.dataset.c, +c.dataset.i, c.checked, b.checklists[+c.dataset.c].items.length);
  });
}
function texteBrutAvecLignes(html) {
  const d = document.createElement('div');
  d.innerHTML = html.replace(/<\/(p|h\d|li|tr)>/g, '$&\n').replace(/<br\s*\/?>/g, '\n').replace(/<li>/g, '<li>• ');
  return d.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

/* ---------- profil ---------- */
async function vueProfil(nav) {
  setTitre('Mon profil');
  const st = progression.etat;
  const formationOk = !!st.certificats.formation;
  main.innerHTML = `<div class="wrap">
    <h1>Mon profil</h1>
    <div class="grid2">
      <div class="card">
        <h2 class="h3">Identité</h2>
        <div class="field"><label for="nom">Nom affiché sur les certificats</label><input id="nom" value="${esc(st.nom)}" placeholder="Prénom Nom" autocomplete="name"></div>
        <div class="stats">
          <div class="stat"><b>${st.xp}</b><small>XP</small></div><div class="stat"><b>${progression.totalLecons()}</b><small>leçons</small></div>
          <div class="stat"><b>${progression.nbExercices()}</b><small>exercices</small></div><div class="stat"><b>${progression.serie()}</b><small>jours d'affilée</small></div>
        </div>
      </div>
      <div class="card">
        <h2 class="h3">Sauvegarde</h2>
        <p class="muted small">Votre progression est stockée uniquement dans ce navigateur. Exportez-la pour la transférer sur un autre appareil.</p>
        <div class="row"><button class="btn" id="exportBtn" type="button">Exporter (JSON)</button><label class="btn" for="importFile">Importer</label><input type="file" id="importFile" accept="application/json" class="sr-only"><button class="btn ghost danger" id="resetBtn" type="button">Réinitialiser</button></div>
        ${scriptsVisibles() ? '<p class="small" style="margin-top:14px"><a href="#/scripts">Tous les scripts vidéo (impression, tournage)</a></p>' : ''}
      </div>
    </div>
    <div class="section-title"><h2>Badges</h2><span class="muted">${st.badges.length}/${BADGES.length}</span></div>
    <div class="badges">${BADGES.map((b, i) => `<div class="badge ${st.badges.includes(b.id) ? 'won' : ''}"><span class="bn">${num(i + 1)}</span><b>${esc(b.nom)}</b><small>${esc(b.desc)}</small></div>`).join('')}</div>
    <div class="section-title"><h2>Certificats</h2></div>
    <ul class="plist">
      ${modules.map(m => { const n = Math.min(progression.nbLecons(m.id), m.lecons.length), t = m.lecons.length, acc = estAccessible(m.id); return `<li><span><b>M${num(m.numero)} · ${esc(m.titre)}</b> <span class="muted">${n}/${t} leçons</span></span><span>${n >= t ? `<a class="btn small ok" href="#/certificat/${m.id}">Certificat</a>` : acc ? `<a class="btn small" href="#/module/${m.id}">${n ? 'Continuer' : 'Commencer'}</a>` : `<span class="lockline">${ICO.lock} ${esc(NOMS_OFFRES[m.offre])}</span>`}</span><div class="progress" aria-hidden="true"><span style="width:${pct(n, t)}%"></span></div></li>`; }).join('')}
      <li class="final"><span><b>Certificat de fin de formation</b> <span class="muted">toutes les leçons des modules 0 à 8</span></span><span>${formationOk ? '<a class="btn small ok" href="#/certificat/formation">Certificat</a>' : `<span class="muted">${progression.totalLecons()}/${totalLecons}</span>`}</span></li>
    </ul>
  </div>`;
  $('#nom').addEventListener('change', e => { progression.nom = e.target.value.trim(); toast('Nom enregistré.'); });
  $('#exportBtn').addEventListener('click', () => {
    const blob = new Blob([progression.exporter()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `levier-progression-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#importFile').addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    try { progression.importer(await f.text()); toast('Progression importée.', 'ok'); router(); } catch (err) { toast('Import impossible : ' + err.message); }
  });
  $('#resetBtn').addEventListener('click', () => { if (confirm('Effacer toute votre progression sur cet appareil ? Cette action est irréversible.')) { progression.reinitialiser(); router(); } });
}

/* ---------- certificat ---------- */
function refCertificat(...parts) {
  let h = 2166136261;
  for (const c of parts.join('|')) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(36).toUpperCase().padStart(7, '0');
}
async function vueCertificat(id) {
  const formation = id === 'formation';
  const meta = formation ? null : trouverModule(id);
  if (!formation && (!meta || id === 'bonus')) throw new Error('Certificat inconnu.');
  const titre = formation ? `${NOM_PRODUIT} : la formation complète` : `Module ${meta.numero} · ${meta.titre}`;
  setTitre('Certificat');
  const n = formation ? modules.filter(m => progression.nbLecons(m.id) >= m.lecons.length).length : progression.nbLecons(id);
  const t = formation ? modules.length : meta.lecons.length;
  if (n < t) {
    main.innerHTML = `<div class="wrap narrow"><div class="card"><h1 class="h2">Certificat pas encore disponible</h1><p>${formation ? `Vous avez terminé ${n} module(s) sur ${t}.` : `Vous avez terminé ${n} leçon(s) sur ${t} de ce module.`} Terminez toutes les leçons pour l'obtenir.</p><a class="btn primary" href="${formation ? '#/' : '#/module/' + id}">Reprendre</a></div></div>`;
    return;
  }
  const dateIso = progression.etat.certificats[id] || new Date().toISOString();
  const date = new Date(dateIso);
  const nom = progression.nom || '';
  main.innerHTML = `<div class="wrap">
    <div class="row between noprint" style="margin-bottom:14px"><a class="btn" href="#/profil">← Retour</a><div class="row">${nom ? '' : '<a class="btn" href="#/profil">Indiquer mon nom</a>'}<button class="btn primary" id="printBtn" type="button">Imprimer ou enregistrer en PDF</button></div></div>
    <div class="certif">
      <div class="certif-top"><span class="logo-mark" aria-hidden="true"></span><span class="certif-brand">${esc(NOM_PRODUIT)}</span><span class="certif-ref">Réf. ${refCertificat(nom, id, dateIso)}</span></div>
      <p class="eyebrow">Certificat de réussite</p>
      <p class="certif-intro">Ce certificat atteste que</p>
      <h1 class="name">${esc(nom || 'Nom de l\'élève')}</h1>
      <p class="certif-intro">a terminé l'intégralité du programme</p>
      <p class="certif-titre">${esc(titre)}</p>
      <p class="muted">${formation ? `${modules.length} modules et ${totalLecons} leçons, avec exercices et quiz` : `${meta.lecons.length} leçons, avec exercices et quiz`}.</p>
      <div class="sig"><span>Délivré le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span><span><b>${esc(nomFormateur())}</b><br>${esc(CFG.formateur?.titre || 'Formateur')}</span></div>
      <p class="certif-note">Formation indépendante, non affiliée à Anthropic. Claude est une marque d'Anthropic.</p>
    </div></div>`;
  $('#printBtn').addEventListener('click', () => window.print());
}

/* ---------- recherche ---------- */
async function vueRecherche(q = '', nav) {
  q = (q || '').trim();
  $('#searchInput').value = q;
  setTitre('Recherche');
  main.innerHTML = `<div class="wrap narrow"><h1>Recherche</h1><p class="muted"><span class="spinner"></span> Recherche dans vos modules…</p></div>`;
  const tous = await chargerAccessibles();
  if (nav !== navId) return;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const mots = norm(q).split(/\s+/).filter(m => m.length > 1);
  const res = [];
  if (mots.length) {
    for (const m of tous) for (const l of m.lecons) {
      const titre = norm(l.titre), brut = texteBrut(l.theorie + ' ' + (l.pas || []).map(p => p.t + ' ' + p.d).join(' ')), texte = norm(brut);
      let score = 0;
      for (const w of mots) { if (titre.includes(w)) score += 10; score += Math.min(texte.split(w).length - 1, 5); }
      if (score > 0) {
        const pos = Math.max(0, texte.indexOf(mots[0]));
        res.push({ m, l, score, extrait: brut.slice(Math.max(0, pos - 70), pos + 140) });
      }
    }
    res.sort((a, b) => b.score - a.score);
  }
  const verrouilles = modules.filter(m => !estAccessible(m.id));
  const surligner = s => { let out = esc(s); mots.forEach(w => { out = out.replace(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), x => `<mark>${x}</mark>`); }); return out; };
  main.innerHTML = `<div class="wrap narrow"><h1>Recherche</h1>
    <p class="muted">${mots.length ? `${res.length} résultat${res.length > 1 ? 's' : ''} pour « ${esc(q)} »` : 'Tapez un mot-clé dans la barre de recherche.'}</p>
    <ul class="results">${res.slice(0, 40).map(r => `<li><a href="#/lecon/${r.m.id}/${r.l.index}"><span class="path">M${num(r.m.numero)} · ${esc(r.m.titre)}</span><b>${surligner(r.l.titre)}</b><span class="muted small">…${surligner(r.extrait)}…</span></a></li>`).join('')}</ul>
    ${verrouilles.length && mots.length ? `<p class="muted small">La recherche porte sur les modules de votre offre. ${verrouilles.length} module(s) verrouillé(s) non inclus.</p>` : ''}</div>`;
}

/* ---------- scripts vidéo (tournage) ---------- */
async function vueScripts(nav) {
  setTitre('Scripts vidéo');
  if (!scriptsVisibles()) { main.innerHTML = '<div class="wrap narrow"><p class="empty">Les scripts vidéo ne sont pas affichés.</p></div>'; return; }
  main.innerHTML = `<div class="wrap narrow"><h1>Scripts vidéo</h1><p class="muted"><span class="spinner"></span> Chargement…</p></div>`;
  const tous = await chargerAccessibles();
  if (nav !== navId) return;
  main.innerHTML = `<div class="wrap narrow">
    <div class="row between noprint"><a class="btn" href="#/profil">← Retour</a><button class="btn primary" id="printBtn" type="button">Imprimer</button></div>
    <h1>Scripts vidéo</h1><p class="lead">Un script par leçon, pour tourner les vidéos de la formation : accroche, plan, démonstration à l'écran et appel à l'action.</p>
    ${tous.map(m => `<section class="scripts-mod"><h2>M${num(m.numero)} · ${esc(m.titre)}</h2>${m.lecons.filter(l => l.script).map(l => `<article class="card script-print"><h3>${num(l.index)}. ${esc(l.titre)} <span class="muted small">(${esc(l.script.duree)})</span></h3>
      <p><b>Accroche :</b> ${esc(l.script.accroche)}</p><ol>${l.script.plan.map(p => `<li>${esc(p)}</li>`).join('')}</ol>${l.script.demo ? `<p><b>À l'écran :</b> ${esc(l.script.demo)}</p>` : ''}<p><b>Appel à l'action :</b> ${esc(l.script.cta)}</p></article>`).join('')}</section>`).join('')}
  </div>`;
  $('#printBtn').addEventListener('click', () => window.print());
}

router();
