// Lumio — Arène CTF : liste des défis, page de défi, classement, établi, charte.
import { progression, BADGES } from '../progress.js';
import * as S from './securite.js';
import { $, $$, esc, url, modale, formatDuree, telecharger, copier, reduitMouvement } from './commun.js';
import { CATEGORIES, CATEGORIES_SPECIALES, DIFFICULTES } from '../../content/ctf/categories.js';
import { lirePacks, normaliserPack } from './packs.js';
import { lireCoordonnees, EXEMPLE_DECIMAL, EXEMPLE_DMS } from './coords.js';
import { typographier } from '../typo.js';

export { lireCoordonnees };
let ctx = null;      // fourni par app.js : main, toast, setTitre, courant(id), badgesGagnes
let donnees = null;
const CAT = Object.fromEntries([...CATEGORIES, ...Object.values(CATEGORIES_SPECIALES)].map(c => [c.id, c]));
const sansAccent = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---------- données ---------- */
// L'index léger (titres, accroches, points) suffit pour l'arène, le classement et la recherche ;
// le contenu complet d'un défi officiel n'est chargé qu'à son ouverture.
export async function chargerDefis() {
  if (donnees) return donnees;
  const m = await import('../../content/ctf/index.js');
  const officiels = m.default.defis;
  let photos = [];
  try {
    const r = await fetch(url('assets/ctf/photos/defis.json'), { cache: 'no-cache' });
    if (r.ok) photos = normaliserPack(await r.json(), 'photos');
  } catch { /* pas de photos personnelles */ }
  const packs = lirePacks().flatMap(p => normaliserPack(p, 'packs'));
  const ids = new Set(officiels.map(d => d.id));
  const defis = [...officiels, ...[...photos, ...packs].filter(d => !ids.has(d.id) && ids.add(d.id))];
  donnees = { defis, officiels, parId: Object.fromEntries(defis.map(d => [d.id, d])) };
  const categories = {};
  CATEGORIES.forEach(c => { categories[c.id] = officiels.filter(d => d.categorie === c.id).map(d => d.id); });
  progression.contexteCTF = { categories, tous: officiels.map(d => d.id) };
  return donnees;
}
export function invaliderDefis() { donnees = null; }
const complets = new Map();
async function chargerDefi(entree) {
  if (entree.categorie === 'photos' || entree.categorie === 'packs') return entree;
  if (!complets.has(entree.id)) complets.set(entree.id, fetch(url(`content/ctf/defis/${entree.id}.json`)).then(r => { if (!r.ok) throw new Error('Défi introuvable : ' + entree.id); return r.json(); }));
  try { return await complets.get(entree.id); } catch (e) { complets.delete(entree.id); throw e; }
}

const officiel = id => !String(id).startsWith('p-');
const statut = id => progression.ctfResolu(id) ? 'resolu' : progression.ctfAbandonne(id) ? 'abandon' : progression.ctf.ouverts[id] ? 'encours' : 'nouveau';
const diffPips = n => `<span class="ctf-diff" role="img" aria-label="Difficulté : ${DIFFICULTES[n]}" title="Difficulté : ${DIFFICULTES[n]}">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const badgesCTF = () => { const g = progression.verifierBadges(); g.forEach(b => ctx.toast(`${b.e} Badge obtenu : <b>${esc(b.nom)}</b>`, 'ok')); };
const defiler = el => el && el.scrollIntoView({ behavior: reduitMouvement() ? 'auto' : 'smooth', block: 'start' });

/* ---------- point d'entrée (routage) ---------- */
export async function vueCTF(sous, requete, id, contexte) {
  ctx = contexte;
  if (!sous) return vueArene(id);
  if (sous === 'classement') return vueClassement(id);
  if (sous === 'outils') return vueOutils(id);
  if (sous === 'charte') return vueCharte();
  if (sous === 'packs') return (await import('./packs.js')).vuePacks(id, ctx, { chargerDefis, invaliderDefis });
  return vueDefi(sous, id);
}

const sousNav = actif => `<nav class="ctf-subnav" aria-label="Arène CTF">
  ${[['', 'Défis'], ['classement', 'Classement'], ['outils', 'Établi'], ['packs', 'Packs'], ['charte', 'Charte éthique']].map(([h, t]) => `<a href="#/ctf${h ? '/' + h : ''}" ${actif === h ? 'aria-current="page" class="active"' : ''}>${t}</a>`).join('')}
</nav>`;

/* ---------- radar de progression ---------- */
function radar(stats) {
  const n = stats.length, cx = 120, cy = 120, R = 92;
  const pt = (i, r) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const anneaux = [0.25, 0.5, 0.75, 1].map(f => `<polygon points="${stats.map((_, i) => pt(i, R * f).join(',')).join(' ')}" class="rd-grille"/>`).join('');
  const axes = stats.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" class="rd-axe"/>`).join('');
  const poly = stats.map((s, i) => pt(i, R * Math.max(0.04, s.ratio)).join(',')).join(' ');
  const labels = stats.map((s, i) => { const [x, y] = pt(i, R + 16); return `<text x="${x}" y="${y}" text-anchor="${x < cx - 5 ? 'end' : x > cx + 5 ? 'start' : 'middle'}" dominant-baseline="middle" style="fill:${s.couleur}">${esc(s.court)}</text>`; }).join('');
  const points = stats.map((s, i) => { const [x, y] = pt(i, R * Math.max(0.04, s.ratio)); return `<circle cx="${x}" cy="${y}" r="3.2" style="fill:${s.couleur}"/>`; }).join('');
  return `<svg class="ctf-radar" viewBox="-40 -6 320 252" role="img" aria-label="Progression par catégorie : ${stats.map(s => `${s.titre} ${Math.round(s.ratio * 100)} %`).join(', ')}">${anneaux}${axes}<polygon points="${poly}" class="rd-zone"/>${points}${labels}</svg>`;
}
// « mérité » : résolu sans avoir lu le writeup avant
const merite = id => { const r = progression.ctfResolu(id); return !!r && !r.abandon; };
function statsCategories(d) {
  return CATEGORIES.map(c => {
    const l = d.officiels.filter(x => x.categorie === c.id);
    const r = l.filter(x => merite(x.id)).length;
    return { id: c.id, titre: c.titre, court: c.court, couleur: c.couleur, total: l.length, resolus: r, ratio: l.length ? r / l.length : 0 };
  });
}
function classementEntrees() {
  const moi = progression.ctfCarteScore();
  const liste = [{ ...moi, moi: true }, ...progression.ctf.archives.map(a => ({ ...a, archive: true })), ...progression.ctf.amis];
  return liste.sort((a, b) => b.points - a.points || b.flags - a.flags || a.temps - b.temps);
}

/* ---------- arène ---------- */
let filtres = { cat: 'tous', diff: 'toutes', etat: 'tous', q: '' };
try { Object.assign(filtres, JSON.parse(sessionStorage.getItem('lumio.ctf.filtres') || '{}')); } catch { /* ignoré */ }

async function vueArene(navId) {
  ctx.setTitre('Arène CTF');
  ctx.main.innerHTML = `<div class="wrap"><p class="muted"><span class="spinner"></span> Chargement de l'arène…</p></div>`;
  const d = await chargerDefis();
  if (!ctx.courant(navId)) return;
  const stats = statsCategories(d);
  const total = d.officiels.length, faits = d.officiels.filter(x => merite(x.id)).length;
  const rang = classementEntrees().findIndex(e => e.moi) + 1;
  const suivant = d.officiels.find(x => !progression.ctfResolu(x.id) && !progression.ctfAbandonne(x.id)) || d.officiels[0];
  const cats = [...CATEGORIES, ...(d.defis.some(x => x.categorie === 'photos') ? [CAT.photos] : []), ...(d.defis.some(x => x.categorie === 'packs') ? [CAT.packs] : [])];
  ctx.main.innerHTML = `<div class="wrap ctf">
    <section class="ctf-hero">
      <div class="ctf-hero-txt">
        <p class="ctf-kicker"><span class="ctf-blink" aria-hidden="true"></span> Arène CTF · grand débutant → intermédiaire</p>
        <h1>Trouve le <span class="ctf-flagword">flag</span>.<br>Comprends comment.</h1>
        <p class="lead">${total} défis d'enquête et de cybersécurité : géolocalisation sur carte, EXIF, OpenStreetMap, OSINT sur un personnage fictif, vérification d'images, crypto, stéganographie, web et forensique. Chaque défi se termine par un writeup qui explique la méthode pas à pas.</p>
        <div class="actions">
          <a class="btn primary" href="#/ctf/${suivant.id}">${faits ? 'Reprendre' : 'Premier défi'} : ${esc(suivant.titre)}</a>
          <a class="btn" href="#/parcours/osint">Parcours Méthodo OSINT</a>
        </div>
      </div>
      <div class="card ctf-score">
        ${radar(stats)}
        <dl class="ctf-kpis">
          <div><dt>Points</dt><dd>${progression.ctfPoints()}</dd></div>
          <div><dt>Flags</dt><dd>${faits}<small>/${total}</small></dd></div>
          <div><dt>Rang local</dt><dd>${faits ? '#' + rang : '—'}</dd></div>
          <div><dt>Temps</dt><dd>${faits ? formatDuree(progression.ctfTemps()) : '—'}</dd></div>
        </dl>
      </div>
    </section>
    <aside class="ctf-charte-mini" aria-label="Cadre éthique">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v5M12 16h.01"/></svg>
      <p><b>Tout est simulé ici.</b> Les personnages, sites et fuites de l'arène sont fictifs. Dans la vraie vie : jamais d'enquête sur une personne réelle sans cadre ni consentement (RGPD), jamais d'accès à un système sans autorisation (Code pénal, art. 323-1 et suivants). <a href="#/ctf/charte">Lire la charte</a></p>
    </aside>
    ${sousNav('')}
    <div class="ctf-filtres">
      <div class="ctf-chips" role="group" aria-label="Filtrer par catégorie">
        <button type="button" class="chip" data-cat="tous" aria-pressed="${filtres.cat === 'tous'}">Toutes <span>${d.defis.length}</span></button>
        ${cats.map(c => `<button type="button" class="chip" data-cat="${c.id}" style="--c:${c.couleur}" aria-pressed="${filtres.cat === c.id}">${esc(c.court)} <span>${d.defis.filter(x => x.categorie === c.id).length}</span></button>`).join('')}
      </div>
      <div class="ctf-filtres-2">
        <label class="sr" for="fDiff">Difficulté</label>
        <select id="fDiff"><option value="toutes">Toutes difficultés</option>${Object.entries(DIFFICULTES).map(([k, v]) => `<option value="${k}" ${filtres.diff === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <label class="sr" for="fEtat">État</label>
        <select id="fEtat">${[['tous', 'Tous les défis'], ['afaire', 'À faire'], ['resolus', 'Résolus']].map(([k, v]) => `<option value="${k}" ${filtres.etat === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <label class="sr" for="fQ">Rechercher un défi</label>
        <input id="fQ" type="search" placeholder="Rechercher un défi…" value="${esc(filtres.q)}" autocomplete="off">
      </div>
    </div>
    <div id="ctfListe" aria-live="polite"></div>
  </div>`;

  const liste = () => {
    const q = sansAccent(filtres.q.trim());
    const garde = x => (filtres.cat === 'tous' || x.categorie === filtres.cat)
      && (filtres.diff === 'toutes' || String(x.difficulte) === filtres.diff)
      && (filtres.etat === 'tous' || (filtres.etat === 'resolus' ? !!progression.ctfResolu(x.id) : !progression.ctfResolu(x.id)))
      && (!q || sansAccent(x.titre + ' ' + (x.accroche || '') + ' ' + CAT[x.categorie].titre + ' ' + (x.pack ? x.pack.titre : '')).includes(q));
    const html = cats.map(c => {
      const l = d.defis.filter(x => x.categorie === c.id && garde(x));
      if (!l.length) return '';
      const tous = d.defis.filter(x => x.categorie === c.id), r = tous.filter(x => progression.ctfResolu(x.id)).length;
      return `<section class="ctf-catsec" style="--c:${c.couleur}" aria-labelledby="cat-${c.id}">
        <header><span class="ctf-ico">${c.icone}</span><div><h2 id="cat-${c.id}">${esc(c.titre)}</h2><p>${esc(c.description)}</p></div>
          <div class="ctf-catprog"><span>${r}/${tous.length}</span><div class="progress" role="progressbar" aria-label="Progression ${esc(c.titre)}" aria-valuemin="0" aria-valuemax="${tous.length}" aria-valuenow="${r}"><span style="width:${Math.round(100 * r / tous.length)}%"></span></div></div></header>
        <div class="ctf-grid">${l.map(carte).join('')}</div>
      </section>`;
    }).join('');
    const z = $('#ctfListe');
    z.innerHTML = html || '<p class="empty">Aucun défi ne correspond à ces filtres.</p>';
    typographier(z);
  };
  const sauver = () => { try { sessionStorage.setItem('lumio.ctf.filtres', JSON.stringify(filtres)); } catch { /* ignoré */ } liste(); };
  $$('.ctf-chips .chip').forEach(b => b.addEventListener('click', () => { filtres.cat = b.dataset.cat; $$('.ctf-chips .chip').forEach(x => x.setAttribute('aria-pressed', x === b)); sauver(); }));
  $('#fDiff').addEventListener('change', e => { filtres.diff = e.target.value; sauver(); });
  $('#fEtat').addEventListener('change', e => { filtres.etat = e.target.value; sauver(); });
  $('#fQ').addEventListener('input', e => { filtres.q = e.target.value; sauver(); });
  liste();
}
function carte(x) {
  const c = CAT[x.categorie], st = statut(x.id), r = progression.ctfResolu(x.id);
  const etat = st === 'resolu' ? `<span class="ctf-etat ok">✓ ${Number(r.points) || 0} pts</span>` : st === 'abandon' ? '<span class="ctf-etat ab">Writeup lu</span>' : st === 'encours' ? '<span class="ctf-etat ec">En cours</span>' : `<span class="ctf-etat">${x.validation === 'carte' ? 'Carte' : 'Flag'}</span>`;
  return `<a class="ctf-card st-${st}" href="#/ctf/${x.id}" style="--c:${c.couleur}">
    ${x.miniature ? `<span class="ctf-card-img"><img src="${esc(url(x.miniature))}" alt="" loading="lazy" decoding="async"></span>` : ''}
    <div class="ctf-card-top"><span class="ctf-tag">${esc(x.categorie === 'packs' && x.pack ? x.pack.titre : c.court)}</span><span class="ctf-pts">${x.points} pts</span></div>
    <h3>${esc(x.titre)}</h3>
    <p>${esc(x.accroche || '')}</p>
    <div class="ctf-card-bas">${diffPips(x.difficulte)}${etat}</div>
  </a>`;
}

/* ---------- page d'un défi ---------- */
const OUTILS = {
  boite: 'Boîte à outils', exif: 'Inspecteur EXIF', image: 'Labo image', hex: 'Hex & signatures', spectro: 'Spectrogramme'
};
async function vueDefi(id, navId) {
  const d = await chargerDefis();
  if (!ctx.courant(navId)) return;
  const entree = d.parId[id];
  const introuvable = () => { ctx.main.innerHTML = `<div class="wrap"><div class="empty"><h2>Défi introuvable</h2><p>Ce défi n'existe pas ou provient d'un pack qui n'est plus installé.</p><a class="btn primary" href="#/ctf">Retour à l'arène</a></div></div>`; };
  if (!entree) return introuvable();
  ctx.main.innerHTML = `<div class="wrap"><p class="muted"><span class="spinner"></span> Ouverture du défi…</p></div>`;
  const defi = await chargerDefi(entree);
  if (!ctx.courant(navId)) return;
  const c = CAT[defi.categorie];
  progression.ctfOuvrir(id);
  ctx.setTitre(defi.titre + ' · CTF');
  const memes = d.defis.filter(x => x.categorie === defi.categorie);
  const i = memes.findIndex(x => x.id === defi.id), prec = memes[i - 1], suiv = memes[i + 1];
  const ressources = S.ouvrir(defi.ressources || [], defi.id);
  const outils = [...new Set([...(defi.outils || []), ...ressources.flatMap(r => r.outils || [])])].filter(o => OUTILS[o]);

  ctx.main.innerHTML = `<div class="wrap ctf ctf-page v-${defi.validation === 'carte' ? 'carte' : 'flag'}" style="--c:${c.couleur}">
    <div class="crumbs"><a href="#/ctf">Arène CTF</a> › <span>${esc(c.titre)}</span> › <span>${esc(defi.titre)}</span></div>
    <header class="ctf-dhead">
      <span class="ctf-ico lg">${c.icone}</span>
      <div>
        <h1>${esc(defi.titre)}</h1>
        <div class="row ctf-meta"><span class="pill ctf-pill">${esc(defi.pack ? defi.pack.titre : c.titre)}</span><span class="pill">${DIFFICULTES[defi.difficulte]}</span>${diffPips(defi.difficulte)}<span class="pill">${defi.points} points</span><span class="pill">${defi.validation === 'carte' ? 'Validation sur la carte' : 'Flag LUMIO{…}'}</span>${defi.pack && defi.pack.auteur ? `<span class="muted">par ${esc(defi.pack.auteur)}</span>` : ''}</div>
      </div>
    </header>
    ${defi.categorie === 'osint' ? `<div class="callout warn ctf-ethique"><b>Personnage fictif, méthode réelle</b>Inès Valadier et tous les sites de cette enquête sont inventés et simulés dans la page. Ces techniques ne s'appliquent jamais à une personne réelle sans base légale ni consentement (RGPD) ; ne te connecte jamais avec des identifiants trouvés dans une fuite (art. 323-1 et suivants du Code pénal). <a href="#/ctf/charte">Charte</a></div>` : ''}
    <div class="ctf-layout">
      <div class="ctf-col">
        <section class="card ctf-brief" aria-labelledby="hBrief"><h2 id="hBrief" class="ctf-h">Briefing</h2>${defi.texte ? texteEnParagraphes(defi.briefing) : defi.briefing}</section>
        <div id="ressources" class="ctf-ressources"></div>
        ${outils.length ? `<section class="card ctf-etabli" id="etabli" aria-labelledby="hEtabli">
          <div class="ctf-etabli-tete"><h2 id="hEtabli" class="ctf-h">Établi</h2>
          <div class="ctf-tabs" role="tablist" aria-label="Outils d'analyse">${outils.map((o, k) => `<button type="button" role="tab" id="tab-${o}" aria-controls="pan-${o}" aria-selected="${k === 0}" tabindex="${k === 0 ? 0 : -1}" data-outil="${o}">${OUTILS[o]}</button>`).join('')}</div></div>
          ${outils.map((o, k) => `<div class="ctf-panel" role="tabpanel" id="pan-${o}" aria-labelledby="tab-${o}" ${k ? 'hidden' : ''}></div>`).join('')}
        </section>` : ''}
        <div id="writeup" class="ctf-wu-zone"></div>
      </div>
      <aside class="ctf-side" aria-label="Validation du défi">
        <section class="card ctf-valid" id="valid"></section>
        <section class="card ctf-indices" id="indices" aria-labelledby="hInd"></section>
        <nav class="ctf-prevnext" aria-label="Défis de la même catégorie">
          ${prec ? `<a class="btn small" href="#/ctf/${prec.id}">← ${esc(prec.titre)}</a>` : '<span></span>'}
          ${suiv ? `<a class="btn small" href="#/ctf/${suiv.id}">${esc(suiv.titre)} →</a>` : `<a class="btn small" href="#/ctf">Arène →</a>`}
        </nav>
      </aside>
    </div>
  </div>`;

  const racine = $('.ctf-page', ctx.main);
  // toutes les références passent par la page créée ici : si l'on navigue ailleurs pendant un chargement,
  // la suite de cette fonction ne touche plus qu'une page détachée (et s'arrête au contrôle suivant).
  const page = { defi, ressources, carte: null, etabli: null, racine, navId, q: s => $(s, racine), qq: s => $$(s, racine) };
  const encore = () => ctx.courant(navId) && racine.isConnected;
  // fichiers du défi proposés dans chaque outil (seul le labo image s'ouvre directement : il ne fait qu'afficher l'image)
  const propositions = {};
  for (const o of outils) { const r = ressources.find(x => (x.outils || []).includes(o) && x.src); if (r) propositions[o] = { src: r.src, nom: r.nom || r.titre }; }
  page.etabli = monterEtabli(outils, racine, propositions);
  rendreValidation(page);
  rendreIndices(page);
  typographier(racine);
  await rendreRessources(page, encore);
  if (!encore()) return;
  if (outils[0] === 'image' && propositions.image) page.etabli.ouvrir('image', propositions.image, false).catch(() => {});
  if (progression.ctfResolu(id) || progression.ctfAbandonne(id)) await afficherWriteup(page);
}
const texteEnParagraphes = t => String(t || '').split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');

/* ---------- établi (outils d'analyse en onglets) ---------- */
function monterEtabli(outils, racine, propositions = {}) {
  const montes = {}, charges = {};
  const q = s => $(s, racine), qq = s => $$(s, racine);
  const api = {
    async ouvrir(nom, charge, defilerVers = !!charge) {
      if (!OUTILS[nom] || !q('#tab-' + nom)) return null;
      qq('.ctf-tabs [role=tab]').forEach(t => { const on = t.dataset.outil === nom; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; q('#pan-' + t.dataset.outil).hidden = !on; });
      if (!montes[nom]) {
        const pan = q('#pan-' + nom);
        pan.innerHTML = `<div class="ctf-propose" hidden></div><div class="ctf-outil"><p class="muted"><span class="spinner"></span> Chargement de l'outil…</p></div>`;
        const zone = $('.ctf-outil', pan);
        montes[nom] = import(`./outils/${nom}.js`).then(m => { zone.innerHTML = ''; return m.monter(zone, { toast: ctx.toast }); });
      }
      const outil = await montes[nom];
      if (charge && outil.charger) { charges[nom] = true; const p = q(`#pan-${nom} .ctf-propose`); if (p) p.hidden = true; await outil.charger(charge); }
      else if (!charges[nom] && propositions[nom]) proposer(nom);
      if (charge && defilerVers) defiler(q('#etabli'));
      return outil;
    }
  };
  // tant que le fichier du défi n'est pas chargé, l'outil affiche un état vide et un bouton pour l'analyser
  function proposer(nom) {
    const p = q(`#pan-${nom} .ctf-propose`), f = propositions[nom];
    if (!p || !f) return;
    p.hidden = false;
    p.innerHTML = `<p>Fichier du défi : <code>${esc(f.nom || String(f.src).split('/').pop())}</code></p><button type="button" class="btn small primary">Analyser ce fichier avec l'outil « ${esc(OUTILS[nom])} »</button>`;
    $('button', p).addEventListener('click', () => api.ouvrir(nom, f, false));
  }
  if (outils.length) {
    qq('.ctf-tabs [role=tab]').forEach(t => {
      t.addEventListener('click', () => api.ouvrir(t.dataset.outil));
      t.addEventListener('keydown', e => {
        const tabs = qq('.ctf-tabs [role=tab]'), k = tabs.indexOf(t);
        const n = e.key === 'ArrowRight' ? (k + 1) % tabs.length : e.key === 'ArrowLeft' ? (k - 1 + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
        if (n >= 0) { e.preventDefault(); tabs[n].focus(); api.ouvrir(tabs[n].dataset.outil); }
      });
    });
    api.ouvrir(outils[0]);
  }
  return api;
}

/* ---------- ressources ---------- */
const ICONES = { texte: '📄', scene: '🖼️', image: '🖼️', fichier: '📦', audio: '🔊', galerie: '🗂️', web: '🌐', terminal: '⌨️', geojson: '🗺️', lens: '🔍', log: '📜' };
async function rendreRessources(page, encore) {
  const zone = page.q('#ressources');
  for (const [k, r] of page.ressources.entries()) {
    const sec = document.createElement('section');
    sec.className = 'card ctf-res ctf-res-' + r.type;
    sec.setAttribute('aria-label', r.titre || r.nom || 'Ressource');
    zone.appendChild(sec);
    await rendreRessource(sec, r, page, k);
    if (!encore()) return;
    typographier(sec);
  }
  if (page.defi.validation === 'carte') {
    const sec = document.createElement('section');
    sec.className = 'card ctf-res ctf-res-carte';
    sec.innerHTML = `<header class="ctf-res-tete"><h2 class="ctf-h">🧭 Carte — place ton repère</h2><span class="muted ctf-res-sous">Clic sur la carte, ou coordonnées dans le panneau de validation</span></header><div class="ctf-carte" id="carteDefi"></div>`;
    zone.appendChild(sec);
    const { creerCarte } = await import('./carte.js');
    if (!encore()) return;
    const v = Array.isArray(page.defi.vue) && page.defi.vue.length === 3 && page.defi.vue.every(Number.isFinite) ? page.defi.vue : [30, 10, 2];
    page.carte = await creerCarte($('#carteDefi', sec), { vue: v, fond: page.defi.fond, calque: page.defi.calque, onChoix: () => majBoutonPosition(page) });
    if (!encore()) return;
    majBoutonPosition(page);
  }
}
const boutonsOutils = (r, src) => (r.outils || []).filter(o => OUTILS[o]).map(o => `<button type="button" class="btn small" data-ouvrir="${o}" data-src="${esc(src)}">${esc(OUTILS[o])}</button>`).join('');
async function rendreRessource(sec, r, page, k) {
  const titre = esc(r.titre || r.nom || '');
  const tete = (extra = '') => `<header class="ctf-res-tete"><h2 class="ctf-h">${ICONES[r.type] || '📎'} ${titre}</h2>${extra}</header>`;
  const lier = () => $$('[data-ouvrir]', sec).forEach(b => b.addEventListener('click', () => page.etabli.ouvrir(b.dataset.ouvrir, { src: b.dataset.src, nom: b.dataset.nom || r.nom })));
  switch (r.type) {
    case 'texte': case 'log': {
      sec.innerHTML = tete(`<div class="row"><button type="button" class="btn small" data-copier>Copier</button>${page.q('#tab-boite') && r.type === 'texte' ? '<button type="button" class="btn small" data-boite>Envoyer dans la boîte à outils</button>' : ''}${r.type === 'log' ? `<button type="button" class="btn small" data-dl>Télécharger</button>` : ''}</div>`)
        + (r.description ? `<p class="ctf-res-desc">${r.description}</p>` : '')
        + (r.type === 'log' ? `<div class="ctf-logfiltre"><label for="lf${k}">Filtrer les lignes</label><input id="lf${k}" type="search" placeholder="ex. 401, sshd, 203.0.113" autocomplete="off"><span class="muted" data-compte></span></div>` : '')
        + `<pre class="ctf-pre ${r.type === 'log' ? 'ctf-log' : ''}" tabindex="0" role="region" aria-label="${esc(r.titre || r.nom || 'Contenu')}">${esc(r.contenu)}</pre>`;
      $('[data-copier]', sec).addEventListener('click', async () => ctx.toast(await copier(r.contenu) ? 'Copié dans le presse-papiers.' : 'Copie impossible : sélectionne le texte à la main.'));
      $('[data-boite]', sec)?.addEventListener('click', () => page.etabli.ouvrir('boite', { texte: r.contenu }));
      $('[data-dl]', sec)?.addEventListener('click', () => telecharger(r.nom || 'journal.log', r.contenu, 'text/plain'));
      if (r.type === 'log') {
        const lignes = r.contenu.split('\n'), pre = $('pre', sec), cpt = $('[data-compte]', sec);
        const maj = q => { const l = q ? lignes.filter(x => x.toLowerCase().includes(q.toLowerCase())) : lignes; pre.textContent = l.join('\n'); cpt.textContent = `${l.length} ligne${l.length > 1 ? 's' : ''} sur ${lignes.length}`; };
        $('input', sec).addEventListener('input', e => maj(e.target.value)); maj('');
      }
      break;
    }
    case 'scene': case 'image': {
      sec.innerHTML = tete(`<div class="row"><button type="button" class="btn small" data-zoom>Agrandir</button>${boutonsOutils(r, r.src)}${r.telechargeable !== false ? `<a class="btn small" href="${esc(url(r.src))}" download>Télécharger</a>` : ''}</div>`)
        + `<figure class="ctf-fig"><button type="button" class="ctf-figbtn" data-zoom aria-label="Agrandir l'image : ${esc(r.alt || '')}"><img src="${esc(url(r.src))}" alt="${esc(r.alt || '')}" loading="lazy" decoding="async"></button>${r.legende ? `<figcaption>${r.legende}</figcaption>` : ''}</figure>`;
      $$('[data-zoom]', sec).forEach(b => b.addEventListener('click', () => visionneuse(r, b)));
      lier();
      break;
    }
    case 'galerie': {
      sec.innerHTML = tete() + (r.description ? `<p class="ctf-res-desc">${r.description}</p>` : '') + `<div class="ctf-galerie">${r.images.map((im, j) => `<figure><button type="button" class="ctf-figbtn" data-j="${j}" aria-label="Agrandir : ${esc(im.legende || im.alt || '')}"><img src="${esc(url(im.src))}" alt="${esc(im.alt || '')}" loading="lazy"></button><figcaption>${im.legende || ''}</figcaption>${(im.outils || []).length ? `<div class="row">${boutonsOutils(im, im.src)}</div>` : ''}</figure>`).join('')}</div>`;
      $$('[data-j]', sec).forEach(b => b.addEventListener('click', () => visionneuse(r.images[+b.dataset.j], b)));
      lier();
      break;
    }
    case 'fichier': {
      sec.innerHTML = tete(`<span class="muted ctf-res-sous">${esc(r.taille || '')}</span>`) + (r.description ? `<p class="ctf-res-desc">${r.description}</p>` : '')
        + `<div class="ctf-fichier"><span class="ctf-fichier-ico" aria-hidden="true">${esc((r.nom.split('.').pop() || '').toUpperCase().slice(0, 4))}</span><code>${esc(r.nom)}</code><div class="row">${boutonsOutils(r, r.src)}<a class="btn small" href="${esc(url(r.src))}" download="${esc(r.nom)}">Télécharger</a></div></div>`;
      lier();
      break;
    }
    case 'audio': {
      sec.innerHTML = tete(`<div class="row">${boutonsOutils(r, r.src)}<a class="btn small" href="${esc(url(r.src))}" download="${esc(r.nom || '')}">Télécharger</a></div>`) + (r.description ? `<p class="ctf-res-desc">${r.description}</p>` : '') + `<audio controls preload="none" src="${esc(url(r.src))}"></audio>`;
      lier();
      break;
    }
    case 'web': case 'terminal': case 'geojson': case 'lens': {
      sec.innerHTML = tete() + (r.description ? `<p class="ctf-res-desc">${r.description}</p>` : '') + '<div class="ctf-outil-int"><p class="muted"><span class="spinner"></span> Chargement…</p></div>';
      const mod = await import(`./outils/${{ web: 'web', terminal: 'terminal', geojson: 'overpass', lens: 'lens' }[r.type]}.js`);
      if (!sec.isConnected) return;
      const z = $('.ctf-outil-int', sec); z.innerHTML = '';
      await mod.monter(z, { ...r, toast: ctx.toast, defi: page.defi });
      break;
    }
    default: sec.innerHTML = tete() + '<p class="muted">Ressource non reconnue.</p>';
  }
}

// Visionneuse plein écran avec zoom et déplacement (souris, tactile, clavier) ; focus piégé, rendu à la fermeture.
function visionneuse(r, declencheur) {
  const bg = document.createElement('div');
  bg.className = 'modal-bg ctf-viewer';
  bg.innerHTML = `<div class="ctf-viewer-in" role="dialog" aria-modal="true" aria-label="Image agrandie">
    <div class="ctf-viewer-bar"><span>${esc(r.legende ? r.legende.replace(/<[^>]+>/g, '') : r.alt || '')}</span>
      <div class="row"><button type="button" class="btn small" data-z="-1" aria-label="Dézoomer">−</button><button type="button" class="btn small" data-z="0">Ajuster</button><button type="button" class="btn small" data-z="1" aria-label="Zoomer">+</button><button type="button" class="btn small" data-miroir aria-pressed="false">Miroir</button><button type="button" class="btn small primary" data-fermer>Fermer</button></div></div>
    <div class="ctf-viewer-zone" tabindex="0" role="img" aria-label="Zone d'image : flèches pour se déplacer, + et − pour zoomer"><img src="${esc(url(r.src))}" alt="${esc(r.alt || '')}" draggable="false"></div></div>`;
  document.body.appendChild(bg);
  const img = $('img', bg), zoneV = $('.ctf-viewer-zone', bg);
  let z = 1, x = 0, y = 0, miroir = false;
  const maj = () => { img.style.transform = `translate(${x}px, ${y}px) scale(${z * (miroir ? -1 : 1)}, ${z})`; };
  const zoom = f => { z = Math.min(12, Math.max(0.5, z * f)); maj(); };
  const fermer = () => { bg.remove(); document.removeEventListener('keydown', clavier, true); if (declencheur && declencheur.isConnected) declencheur.focus(); };
  const clavier = e => {
    if (e.key === 'Escape') { e.stopPropagation(); fermer(); }
    else if (e.key === 'Tab') {
      const f = $$('button, [tabindex="0"]', bg).filter(n => !n.disabled);
      const k = f.indexOf(document.activeElement);
      e.preventDefault();
      f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
    }
    else if (e.key === '+' || e.key === '=') zoom(1.25); else if (e.key === '-') zoom(0.8);
    else if (e.key.startsWith('Arrow') && document.activeElement === zoneV) { e.preventDefault(); const p = 40; if (e.key === 'ArrowLeft') x += p; if (e.key === 'ArrowRight') x -= p; if (e.key === 'ArrowUp') y += p; if (e.key === 'ArrowDown') y -= p; maj(); }
  };
  document.addEventListener('keydown', clavier, true);
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-fermer]')) fermer(); });
  $$('[data-z]', bg).forEach(b => b.addEventListener('click', () => { const v = +b.dataset.z; if (!v) { z = 1; x = 0; y = 0; maj(); } else zoom(v > 0 ? 1.4 : 0.7); }));
  $('[data-miroir]', bg).addEventListener('click', e => { miroir = !miroir; e.currentTarget.setAttribute('aria-pressed', miroir); maj(); });
  zoneV.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.15 : 0.87); }, { passive: false });
  let drag = null;
  zoneV.addEventListener('pointerdown', e => { drag = { sx: e.clientX - x, sy: e.clientY - y }; zoneV.setPointerCapture(e.pointerId); });
  zoneV.addEventListener('pointermove', e => { if (drag) { x = e.clientX - drag.sx; y = e.clientY - drag.sy; maj(); } });
  zoneV.addEventListener('pointerup', () => { drag = null; });
  $('[data-fermer]', bg).focus();
}

/* ---------- validation ---------- */
const coutIndices = defi => progression.ctfIndices(defi.id).reduce((a, n) => a + ((defi.indices || [])[n]?.cout || 0), 0);
const pointsPossibles = defi => Math.max(Math.ceil(defi.points * 0.1), defi.points - coutIndices(defi));
// pause de 20 s toutes les 5 erreurs, propre à chaque défi (et conservée pendant la session)
const CLE_ATTENTE = 'lumio.ctf.attente';
const lireAttente = id => { try { return +(JSON.parse(sessionStorage.getItem(CLE_ATTENTE) || '{}')[id] || 0); } catch { return 0; } };
const ecrireAttente = (id, t) => { try { const o = JSON.parse(sessionStorage.getItem(CLE_ATTENTE) || '{}'); o[id] = t; sessionStorage.setItem(CLE_ATTENTE, JSON.stringify(o)); } catch { /* ignoré */ } };
function rendreValidation(page) {
  const { defi, q } = page, z = q('#valid'), r = progression.ctfResolu(defi.id), ab = progression.ctfAbandonne(defi.id);
  const entete = r
    ? `<div class="ctf-ok"><span class="ctf-ok-ico" aria-hidden="true">✓</span><div><b>Défi résolu</b><span>${r.abandon ? 'après lecture du writeup · 0 point' : `+${Number(r.points) || 0} points · ${formatDuree(r.duree)}${r.indices ? ` · ${r.indices} indice${r.indices > 1 ? 's' : ''}` : ''}`}</span></div></div>`
    : `<h2 class="ctf-h">Valider</h2><p class="ctf-pot">Points possibles : <b id="ptsPot">${ab ? 0 : pointsPossibles(defi)}</b>${defi.validation === 'carte' ? ' <span class="muted">(selon la précision)</span>' : ''}</p>`;
  const formulaire = defi.validation === 'carte'
    ? `<p class="ctf-aide">Place ton repère sur la carte (clic), ou saisis des coordonnées puis « Placer ».</p>
       <div class="field"><label for="coords">Coordonnées (décimales, DMS ou lien de carte)</label><input id="coords" placeholder="ex. ${esc(EXEMPLE_DECIMAL)}" autocomplete="off" spellcheck="false" aria-describedby="coordsAide"><p class="ctf-aide" id="coordsAide">Exemple fictif en plein océan, à remplacer par ta réponse.</p></div>
       <div class="row"><button type="button" class="btn small" id="placer">Placer</button><button type="button" class="btn small" id="centre">Repère au centre</button></div>
       <button type="button" class="btn primary ctf-big" id="validerPos" disabled>Valider ma position</button>`
    : `<form id="flagForm" class="ctf-flagform" novalidate><label for="flag">Ton flag</label>
       <div class="ctf-flag-input"><input id="flag" name="flag" placeholder="LUMIO{…}" autocomplete="off" spellcheck="false" autocapitalize="off" aria-describedby="flagAide"><button class="btn primary" type="submit">Valider</button></div>
       <p class="ctf-aide" id="flagAide">${esc(defi.format || 'Format : LUMIO{…}')} — casse, accents et espaces ignorés ; tu peux omettre LUMIO{ }.</p></form>`;
  z.innerHTML = `${entete}${r ? '' : formulaire}<div id="retour" class="ctf-retour" role="status" aria-live="polite"></div>
    ${r ? '' : `<button type="button" class="btn ghost small ctf-abandon" id="abandon">${ab ? 'Revoir le writeup' : 'Abandonner et lire le writeup'}</button>`}
    ${r || ab ? '' : `<p class="ctf-essais muted">${progression.ctfEssais(defi.id) ? `${progression.ctfEssais(defi.id)} essai(s) incorrect(s)` : ''}</p>`}`;
  const retour = (ok, html) => { const el = q('#retour'); if (!el) return; el.className = 'ctf-retour ' + (ok === true ? 'ok' : ok === false ? 'ko' : 'info'); el.innerHTML = html; typographier(el); };
  const tempo = () => {
    const reste = Math.ceil((lireAttente(defi.id) - Date.now()) / 1000);
    if (reste > 0) { retour(false, `Trop d'essais d'affilée sur ce défi : patiente ${reste} s. Relis le briefing ou prends un indice.`); return true; }
    return false;
  };
  const echec = msg => {
    const n = progression.ctfMauvaiseReponse(defi.id);
    retour(false, msg);
    const e = q('.ctf-essais'); if (e) e.textContent = `${n} essai(s) incorrect(s)`;
    if (n % 5 === 0) { ecrireAttente(defi.id, Date.now() + 20000); tempo(); }
  };
  if (!r && defi.validation === 'carte') {
    q('#placer').addEventListener('click', () => {
      const p = lireCoordonnees(q('#coords').value);
      if (!p) return retour(null, `Coordonnées non reconnues. Formats acceptés, par exemple : <code>${esc(EXEMPLE_DECIMAL)}</code>, <code>${esc(EXEMPLE_DMS)}</code>, <code>12.3456 N, 45.6789 W</code> ou un lien openstreetmap.org/#map=…`);
      if (!page.carte) return retour(null, 'La carte est encore en cours de chargement.');
      page.carte.placer(p.lat, p.lon, true); majBoutonPosition(page);
    });
    q('#coords').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); q('#placer').click(); } });
    q('#centre').addEventListener('click', () => { page.carte?.placerAuCentre(); majBoutonPosition(page); });
    q('#validerPos').addEventListener('click', async () => {
      if (tempo()) return;
      const pos = page.carte?.position();
      if (!pos) return retour(null, 'Place d\'abord ton repère.');
      const res = await S.verifierPosition(defi, pos.lat, pos.lng);
      if (!page.racine.isConnected) return;
      if (res && res.part > 0) return reussite(page, { points: pointsPossibles(defi) * res.part, anneau: res.anneau, carte: true, message: res.anneau === 0 ? 'En plein dans le mille !' : `Accepté à moins de ${fmtDist(res.rayon)} : ${Math.round(res.part * 100)} % des points.` });
      echec(res ? `Tu chauffes : tu es à moins de ${fmtDist(res.rayon)} de la cible, mais pas assez près. Affine avec les détails de l'image.` : 'Ce n\'est pas le bon endroit. Reprends les indices visuels un par un : langue, sens de circulation, panneaux, architecture.');
    });
    majBoutonPosition(page);
  } else if (!r) {
    q('#flagForm').addEventListener('submit', async e => {
      e.preventDefault();
      if (tempo()) return;
      const v = q('#flag').value;
      if (!v.trim()) return retour(null, 'Saisis un flag.');
      if (await S.verifierFlag(defi, v)) return reussite(page, { points: pointsPossibles(defi), message: 'Flag correct !', flag: v });
      if (!page.racine.isConnected) return;
      const norm = S.normaliserFlag(v);
      echec(`<code>${esc(norm)}</code> n'est pas le bon flag.${/[{}]/.test(norm.slice(6, -1)) ? ' Attention aux accolades en trop.' : ''}`);
    });
  }
  q('#abandon')?.addEventListener('click', async () => {
    if (!ab) {
      const rep = await modale({ titre: 'Abandonner ce défi ?', corps: '<p>Le writeup (la méthode pas à pas) s\'affichera. Tu pourras encore valider le défi ensuite, mais il ne rapportera plus de points ni de badge.</p>', actions: [{ id: 'non', texte: 'Continuer à chercher' }, { id: 'oui', texte: 'Lire le writeup', primaire: true }] });
      if (rep !== 'oui' || !page.racine.isConnected) return;
      progression.ctfAbandonner(defi.id);
      rendreValidation(page); rendreIndices(page);
    }
    await afficherWriteup(page, true);
  });
}
const fmtDist = m => m >= 1000 ? (m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' km' : Math.round(m) + ' m';
function majBoutonPosition(page) { const b = page.q('#validerPos'); if (b) b.disabled = !page.carte?.position(); }

async function reussite(page, { points, anneau = null, carte = false, message, flag = null }) {
  const { defi } = page;
  const r = progression.ctfResoudre(defi.id, { points, anneau, carte });
  if (!r) return;
  ctx.toast(r.points ? `🚩 ${esc(message)} +${r.points} points, +${r.xp} XP` : '🚩 Défi validé (writeup déjà lu : 0 point).', 'ok');
  badgesCTF();
  rendreValidation(page); rendreIndices(page);
  const v = page.q('#retour'); if (v) { v.className = 'ctf-retour ok'; v.textContent = message; }
  await afficherWriteup(page, true, flag);
}

/* ---------- indices ---------- */
function rendreIndices(page) {
  const { defi, q, qq } = page, z = q('#indices');
  const ind = defi.indices || [];
  if (!ind.length) { z.hidden = true; return; }
  const libre = !!(progression.ctfResolu(defi.id) || progression.ctfAbandonne(defi.id));
  const achetes = progression.ctfIndices(defi.id);
  z.innerHTML = `<h2 class="ctf-h" id="hInd">Indices</h2><ol class="ctf-ind">${ind.map((x, n) => {
    const vu = libre || achetes.includes(n), bloque = !vu && n > 0 && !achetes.includes(n - 1) && !libre;
    return `<li class="${vu ? 'vu' : ''}">${vu ? `<div class="ctf-ind-txt"><span class="muted">Indice ${n + 1}${achetes.includes(n) ? ` · −${x.cout} pts` : ''}</span>${defi.texte ? esc(S.ouvrir(x.texte, defi.id)) : S.ouvrir(x.texte, defi.id)}</div>`
      : `<button type="button" class="btn small" data-n="${n}" ${bloque ? 'disabled' : ''}>Indice ${n + 1} · −${x.cout} pts</button>${bloque ? '<span class="muted">après l\'indice ' + n + '</span>' : ''}`}</li>`;
  }).join('')}</ol>`;
  typographier(z);
  $$('[data-n]', z).forEach(b => b.addEventListener('click', async () => {
    const n = +b.dataset.n;
    const rep = await modale({ titre: `Indice ${n + 1}`, corps: `<p>Cet indice coûte <b>${ind[n].cout} points</b> sur ce défi. Les points possibles passeront à ${Math.max(Math.ceil(defi.points * 0.1), pointsPossibles(defi) - ind[n].cout)}.</p>`, actions: [{ id: 'non', texte: 'Annuler' }, { id: 'oui', texte: 'Voir l\'indice', primaire: true }] });
    if (rep !== 'oui' || !page.racine.isConnected) return;
    progression.ctfAcheterIndice(defi.id, n);
    rendreIndices(page);
    const p = q('#ptsPot'); if (p && !progression.ctfAbandonne(defi.id)) p.textContent = pointsPossibles(defi);
    const t = qq('#indices .ctf-ind li')[n]?.querySelector('.ctf-ind-txt');
    if (t) { t.setAttribute('tabindex', '-1'); t.focus(); }
  }));
}

/* ---------- writeup ---------- */
// Après abandon : writeup sans le flag exact. Après réussite : writeup complet, déchiffré avec le flag saisi
// (la clé de contenu est ensuite gardée dans la progression pour les visites suivantes).
async function afficherWriteup(page, defilerVers = false, flag = null) {
  const { defi } = page, z = page.q('#writeup');
  let wu;
  try { wu = JSON.parse(S.demasquer(defi.wu, defi.id)); } catch { wu = { html: '<p>Writeup indisponible.</p>' }; }
  let complet = false;
  const r = progression.ctfResolu(defi.id);
  if (r && defi.wf) {
    let texte = r.k ? await S.ouvrirAvecCle(defi.wf, r.k) : null;
    if (!texte && flag) { const o = await S.ouvrirAvecFlag(defi.id, defi.wf, flag); if (o) { texte = o.texte; progression.ctfCle(defi.id, o.cle); } }
    if (texte) { try { wu = { ...wu, ...JSON.parse(texte), masque: false }; complet = true; } catch { /* version abandon */ } }
  }
  if (!z.isConnected) return;
  const corps = defi.texte ? texteEnParagraphes(wu.html) : wu.html;
  const retenir = wu.retenir ? (defi.texte ? esc(wu.retenir) : wu.retenir) : '';
  const note = wu.masque && !complet ? `<p class="callout info ctf-wu-note"><b>Flag masqué</b>${r ? 'Ce défi a été validé sur un autre appareil ou avant la mise à jour : revalide le flag pour afficher sa forme exacte.' : 'Le writeup donne toute la méthode ; le flag exact n\'apparaît qu\'une fois le défi validé. Applique la dernière étape et valide-le (0 point après abandon).'}</p>` : '';
  z.innerHTML = `<section class="card ctf-writeup" aria-labelledby="hWu" tabindex="-1">
    <h2 id="hWu" class="ctf-h">Writeup — la solution expliquée</h2>
    ${wu.lieu ? `<p class="ctf-lieu"><b>Lieu :</b> ${esc(wu.lieu)}</p>` : ''}
    ${note}
    <div class="theorie">${corps}</div>
    ${retenir ? `<div class="callout ok"><b>À retenir</b>${retenir}</div>` : ''}
  </section>`;
  const c = wu.cible;
  if (page.carte && c && Number.isFinite(+c.lat) && Number.isFinite(+c.lon)) page.carte.montrerCible(+c.lat, +c.lon, Math.max(1, +c.r || (defi.zones && defi.zones[0] && defi.zones[0].r) || 300), wu.lieu);
  ctx.colorer && ctx.colorer(z);
  typographier(z);
  if (defilerVers) { const s = $('.ctf-writeup', z); defiler(s); s.focus({ preventScroll: true }); }
}

/* ---------- classement ---------- */
const nombre = v => (Number.isFinite(+v) ? Math.round(+v) : 0);
async function vueClassement(navId) {
  ctx.setTitre('Classement CTF');
  const d = await chargerDefis();
  if (!ctx.courant(navId)) return;
  const stats = statsCategories(d);
  const rendre = () => {
    const e = classementEntrees();
    ctx.main.innerHTML = `<div class="wrap ctf">
      <div class="crumbs"><a href="#/ctf">Arène CTF</a> › <span>Classement</span></div>
      <h1>Classement local</h1>
      <p class="muted ctf-intro">Ton score, tes parties précédentes et les cartes de score de tes amis. Seuls les défis officiels et ceux du propriétaire du site comptent, sans les défis abandonnés. Tout reste dans ton navigateur : échange les cartes en fichier ou en texte.</p>
      ${sousNav('classement')}
      <div class="ctf-classement">
        <section class="card">
          <div class="field"><label for="pseudo">Ton pseudo d'arène</label><input id="pseudo" maxlength="32" value="${esc(progression.ctf.pseudo || progression.nom || '')}" placeholder="ex. geo_hibou" autocomplete="nickname"></div>
          <div class="table-scroll"><table class="ctf-table"><caption class="sr">Classement par points, puis par nombre de flags, puis par temps</caption>
            <thead><tr><th scope="col">#</th><th scope="col">Pseudo</th><th scope="col">Points</th><th scope="col">Flags</th><th scope="col">Temps</th><th scope="col">Origine</th><th scope="col"><span class="sr">Actions</span></th></tr></thead>
            <tbody>${e.map((x, i) => `<tr class="${x.moi ? 'moi' : ''}"><td>${i + 1}</td><td><b>${esc(x.pseudo)}</b></td><td>${nombre(x.points)}</td><td>${nombre(x.flags)}</td><td>${nombre(x.flags) ? formatDuree(nombre(x.temps)) : '—'}</td><td>${x.moi ? 'Toi (en cours)' : x.archive ? 'Partie du ' + esc(dateFr(x.date)) : 'Ami·e'}</td><td>${x.ami ? `<button type="button" class="btn small ghost" data-retirer="${esc(x.pseudo)}" aria-label="Retirer ${esc(x.pseudo)}">Retirer</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
        </section>
        <section class="card">
          <h2 class="ctf-h">Échanger les scores</h2>
          <p class="muted">Ta carte de score contient ton pseudo, tes points, ton nombre de flags et ton temps : rien d'autre.</p>
          <div class="row"><button type="button" class="btn primary" id="expScore">⬇ Ma carte de score</button><button type="button" class="btn" id="copScore">Copier en texte</button><label class="btn" for="impScore">⬆ Importer une carte</label><input type="file" id="impScore" accept="application/json,.json" hidden></div>
          <div class="field" style="margin-top:14px"><label for="colScore">Ou colle la carte d'un ami</label><textarea id="colScore" class="answer" rows="3" placeholder='{"format":"lumio-ctf-score", …}'></textarea></div>
          <button type="button" class="btn small" id="ajScore">Ajouter au classement</button>
          <hr>
          <h3>Nouvelle partie</h3>
          <p class="muted">Archive ton score actuel dans le classement et remet l'arène à zéro (les XP Lumio déjà gagnés sont conservés).</p>
          <button type="button" class="btn ghost danger-txt" id="nvPartie">Archiver et recommencer</button>
        </section>
      </div>
      <div class="section-title"><h2>Progression par catégorie</h2></div>
      <ul class="plist ctf-plist">${stats.map(s => `<li style="--c:${s.couleur}"><span><b>${esc(s.titre)}</b> <span class="muted">${s.resolus}/${s.total}</span></span><a class="btn small" href="#/ctf" data-cat="${s.id}">Voir</a><div class="progress"><span style="width:${Math.round(100 * s.ratio)}%;background:${s.couleur}"></span></div></li>`).join('')}</ul>
      <div class="section-title"><h2>Badges de l'arène</h2></div>
      <div class="badges">${BADGES.filter(b => b.ctf).map(b => `<div class="badge ${progression.etat.badges.includes(b.id) ? 'won' : ''}"><div class="e">${b.e}</div><b>${b.nom}</b><small>${b.desc}</small></div>`).join('')}</div>
    </div>`;
    typographier(ctx.main);
    $('#pseudo').addEventListener('change', ev => { progression.ctfPseudo(ev.target.value.trim()); ctx.toast('Pseudo enregistré.'); rendre(); });
    $('#expScore').addEventListener('click', () => telecharger(`lumio-ctf-score-${(progression.ctf.pseudo || 'moi').replace(/[^\w-]+/g, '_')}.json`, JSON.stringify(progression.ctfCarteScore(), null, 2), 'application/json'));
    $('#copScore').addEventListener('click', async () => ctx.toast(await copier(JSON.stringify(progression.ctfCarteScore())) ? 'Carte de score copiée.' : 'Copie impossible.'));
    const ajouter = txt => { try { const a = progression.ctfAjouterAmi(JSON.parse(txt)); ctx.toast(`${esc(a.pseudo)} ajouté·e au classement.`, 'ok'); rendre(); } catch (err) { ctx.toast('Carte invalide : ' + esc(err.message)); } };
    $('#impScore').addEventListener('change', async ev => { const f = ev.target.files[0]; if (f) ajouter(await f.text()); });
    $('#ajScore').addEventListener('click', () => ajouter($('#colScore').value));
    $$('[data-retirer]').forEach(b => b.addEventListener('click', () => { progression.ctfRetirerAmi(b.dataset.retirer); rendre(); }));
    $$('[data-cat]').forEach(a => a.addEventListener('click', () => { filtres.cat = a.dataset.cat; try { sessionStorage.setItem('lumio.ctf.filtres', JSON.stringify(filtres)); } catch { /* ignoré */ } }));
    $('#nvPartie').addEventListener('click', async () => {
      const rep = await modale({ titre: 'Recommencer l\'arène ?', corps: '<p>Ton score actuel sera archivé dans le classement local, puis tous les défis redeviendront « à faire ».</p>', actions: [{ id: 'non', texte: 'Annuler' }, { id: 'oui', texte: 'Archiver et recommencer', primaire: true }] });
      if (rep === 'oui') { progression.ctfNouvellePartie(); ctx.toast('Nouvelle partie commencée.'); rendre(); }
    });
  };
  rendre();
}
const dateFr = d => { const x = new Date(d); return isNaN(x) ? '—' : x.toLocaleDateString('fr-FR'); };

/* ---------- établi libre ---------- */
async function vueOutils(navId) {
  ctx.setTitre('Établi CTF');
  const noms = Object.keys(OUTILS);
  ctx.main.innerHTML = `<div class="wrap ctf ctf-libre">
    <div class="crumbs"><a href="#/ctf">Arène CTF</a> › <span>Établi</span></div>
    <h1>Établi d'analyse</h1>
    <p class="muted ctf-intro">Les outils de l'arène, utilisables sur tes propres fichiers. Rien n'est envoyé sur Internet : tout est calculé dans ton navigateur.</p>
    ${sousNav('outils')}
    <section class="card ctf-etabli" id="etabli" aria-label="Outils">
      <div class="ctf-etabli-tete"><div class="ctf-tabs" role="tablist" aria-label="Outils d'analyse">${noms.map((o, k) => `<button type="button" role="tab" id="tab-${o}" aria-controls="pan-${o}" aria-selected="${k === 0}" tabindex="${k === 0 ? 0 : -1}" data-outil="${o}">${OUTILS[o]}</button>`).join('')}</div></div>
      ${noms.map((o, k) => `<div class="ctf-panel" role="tabpanel" id="pan-${o}" aria-labelledby="tab-${o}" ${k ? 'hidden' : ''}></div>`).join('')}
    </section>
    <div class="grid ctf-outils-plus">
      <a class="card pcard" href="#/ctf/foren-terminal" style="--c:#dc2626"><h3>Terminal Linux simulé</h3><p>ls, cd, cat, grep, find, strings, base64, file… sur un système de fichiers virtuel (défis forensique).</p></a>
      <a class="card pcard" href="#/ctf/osm-tags" style="--c:#16a34a"><h3>Éditeur Overpass</h3><p>Requêtes Overpass QL sur un jeu de données local ou en ligne sur overpass-api.de.</p></a>
      <a class="card pcard" href="#/ctf/packs" style="--c:#64748b"><h3>Créer un pack de défis</h3><p>Tes propres défis (flag ou carte), à partager avec tes amis en JSON.</p></a>
    </div>
  </div>`;
  if (!ctx.courant(navId)) return;
  monterEtabli(noms, $('.ctf-libre', ctx.main));
}

/* ---------- charte ---------- */
function vueCharte() {
  ctx.setTitre('Charte éthique CTF');
  ctx.main.innerHTML = `<div class="wrap ctf ctf-charte">
    <div class="crumbs"><a href="#/ctf">Arène CTF</a> › <span>Charte éthique</span></div>
    <h1>Charte éthique et cadre légal</h1>
    ${sousNav('charte')}
    <div class="theorie">
      <p class="lead">L'OSINT et la sécurité offensive sont des compétences puissantes. Dans l'arène, tout est simulé : les personnes, les sites, les fuites et les serveurs. Dehors, les mêmes gestes engagent ta responsabilité.</p>
      <h2>Les règles de l'arène, et de la vraie vie</h2>
      <ol>
        <li><b>Jamais sur une personne réelle sans cadre.</b> Rechercher, compiler et recouper des informations sur quelqu'un est un traitement de données personnelles (RGPD). Sans base légale (mission encadrée, consentement, intérêt légitime documenté), c'est interdit — et le harcèlement ou le « doxing » sont des délits.</li>
        <li><b>Jamais d'accès sans autorisation écrite.</b> Accéder ou se maintenir frauduleusement dans un système, même « juste pour voir », est puni par les articles 323-1 et suivants du Code pénal (jusqu'à 3 ans d'emprisonnement et 100 000 € d'amende, davantage si des données sont modifiées ou s'il s'agit d'un système de l'État).</li>
        <li><b>Jamais d'identifiants issus d'une fuite.</b> Les lire pour comprendre une menace, oui ; s'en servir pour se connecter, non : c'est un accès frauduleux.</li>
        <li><b>Minimiser.</b> Ne collecter que ce qui sert l'objectif, ne pas publier d'adresse, de visage ou de proches, supprimer ce qui ne sert plus.</li>
        <li><b>Signaler plutôt qu'exploiter.</b> Une faille trouvée par hasard se signale à l'organisation (adresse <code>security.txt</code>, programme de divulgation) ou à l'ANSSI / CERT-FR, sans aller plus loin.</li>
        <li><b>Vérifier avant de partager.</b> Une géolocalisation ou une attribution erronée peut nuire à des innocents : recoupe toujours avec au moins deux sources indépendantes.</li>
      </ol>
      <h2>Le jeu de l'arène : ce que fait (et ne fait pas) la vérification</h2>
      <p>L'arène fonctionne sans serveur : tout se passe dans ton navigateur. Les flags ne sont jamais publiés en clair (seule leur empreinte SHA-256 l'est), les positions des cartes sont vérifiées par des empreintes de cellules geohash, et le writeup complet est chiffré avec une clé tirée du flag lui-même. En revanche, le writeup « abandon » (la méthode, sans le flag exact), les indices et le lieu des défis de carte sont seulement masqués : quelqu'un qui lit le code depuis la console peut les retrouver. C'est une limite assumée d'un site statique : le score n'a de valeur que si tu joues le jeu.</p>
      <h2>Où s'entraîner légalement</h2>
      <p>Root-Me, TryHackMe, Hack The Box, PortSwigger Web Security Academy, les CTF listés sur CTFtime, et pour l'OSINT : les défis de géolocalisation communautaires, les exercices de vérification d'images, les compétitions OSINT à personnages fictifs.</p>
      <div class="callout info"><b>Ressources officielles</b>CNIL (cnil.fr) pour le RGPD, ANSSI et CERT-FR pour la sécurité, cybermalveillance.gouv.fr pour l'assistance aux victimes, legifrance.gouv.fr pour le texte des articles 323-1 à 323-8 du Code pénal.</div>
    </div>
  </div>`;
}

/* ---------- recherche globale ---------- */
export async function rechercherDefis(mots) {
  const d = await chargerDefis();
  const m = mots.map(sansAccent);
  return d.defis.map(x => {
    const t = sansAccent(x.titre + ' ' + (x.accroche || '')), c = sansAccent(CAT[x.categorie].titre), k = String(x.mots || '');
    const score = m.reduce((a, w) => a + (t.includes(w) ? 10 : 0) + (k.includes(w) ? 4 : 0) + (c.includes(w) ? 3 : 0), 0);
    return { x, score, cat: CAT[x.categorie] };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);
}
