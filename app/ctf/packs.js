// Packs de défis : format JSON partageable, import/export, éditeur pour créer ses propres défis
// (flag ou géolocalisation). Les flags et les cibles sont transformés en empreintes avant export.
import * as S from './securite.js';
import { $, $$, esc, modale, telecharger } from './commun.js';
import { CATEGORIES, DIFFICULTES } from '../../content/ctf/categories.js';
import { progression } from '../progress.js';

const CLE = 'lumio.ctf.packs', CLE_BROUILLON = 'lumio.ctf.brouillon';
export function lirePacks() {
  try { const l = JSON.parse(localStorage.getItem(CLE) || '[]'); return Array.isArray(l) ? l : []; } catch { return []; }
}
function ecrirePacks(l) { localStorage.setItem(CLE, JSON.stringify(l)); }

const imageSure = s => typeof s === 'string' && (
  /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s) ||
  (/^assets\/ctf\/photos\/[\w\-./]+\.(jpe?g|png|webp|gif|svg)$/i.test(s) && !s.includes('..')) ||
  /^https:\/\/[^\s"'<>()]+$/.test(s));
const enveloppe = t => typeof t === 'string' ? t.slice(0, 2000) : (t && typeof t['~'] === 'string' ? { '~': t['~'].slice(0, 4000) } : '');
const coord = (v, max) => Number.isFinite(+v) && Math.abs(+v) <= max ? +v : null;
// Le writeup d'un pack est démasqué, réduit à des champs connus et vérifiés (texte, lieu, cible numérique), puis remasqué.
function writeupSur(wu, id) {
  let o = {};
  try { o = JSON.parse(S.demasquer(String(wu), id)); } catch { o = {}; }
  if (!o || typeof o !== 'object') o = {};
  const res = { html: String(o.html || '').slice(0, 20000), retenir: String(o.retenir || '').slice(0, 2000), masque: !!o.masque };
  if (o.lieu) res.lieu = String(o.lieu).slice(0, 120);
  const c = o.cible;
  if (c && coord(c.lat, 90) !== null && coord(c.lon, 180) !== null) res.cible = { lat: +c.lat, lon: +c.lon, r: Math.min(2e6, Math.max(1, +c.r || 300)) };
  return S.masquer(JSON.stringify(res), id);
}

// Transforme un pack JSON (non fiable : il vient d'un ami) en défis affichables. Tout le texte est échappé à l'affichage.
export function normaliserPack(p, origine) {
  if (!p || p.format !== 'lumio-ctf-pack' || !Array.isArray(p.defis)) return [];
  const pack = { id: String(p.id || '').replace(/[^a-z0-9-]/g, '').slice(0, 40), titre: String(p.titre || 'Pack sans titre').slice(0, 60), auteur: String(p.auteur || '').slice(0, 40) };
  return p.defis.filter(d => d && typeof d.id === 'string' && /^(p|photo)-[a-z0-9-]{1,80}$/.test(d.id) && typeof d.wu === 'string' && (Array.isArray(d.h) || Array.isArray(d.zones))).map(d => {
    const carte = d.validation === 'carte';
    const zones = carte && Array.isArray(d.zones) ? d.zones.slice(0, 4).filter(z => z && Array.isArray(z.c)).map(z => ({ p: Math.min(9, Math.max(1, +z.p || 6)), part: Math.min(1, Math.max(0, +z.part || 0)), r: Math.max(1, +z.r || 100), c: z.c.filter(x => /^[0-9a-f]{24}$/.test(x)).slice(0, 5000) })) : [];
    const vue = Array.isArray(d.vue) && d.vue.length === 3 && coord(d.vue[0], 90) !== null && coord(d.vue[1], 180) !== null && coord(d.vue[2], 19) !== null ? d.vue.map(Number) : [30, 10, 2];
    return {
      id: d.id, categorie: origine, sousCategorie: CATEGORIES.some(c => c.id === d.categorie) ? d.categorie : 'geoint', pack,
      titre: String(d.titre || 'Défi').slice(0, 80), accroche: String(d.accroche || '').slice(0, 160),
      difficulte: [1, 2, 3].includes(+d.difficulte) ? +d.difficulte : 1, points: Math.min(1000, Math.max(10, Math.round(+d.points || 100))),
      briefing: String(d.briefing || '').slice(0, 6000), texte: true,
      ressources: imageSure(d.image) ? [{ type: 'image', titre: 'Image du défi', src: d.image, alt: String(d.alt || 'Image du défi').slice(0, 200), outils: ['image', 'exif'] }] : [],
      outils: imageSure(d.image) ? ['image', 'exif', 'boite'] : ['boite'],
      miniature: imageSure(d.image) ? d.image : undefined,
      indices: (Array.isArray(d.indices) ? d.indices : []).slice(0, 3).map(i => ({ cout: Math.max(0, Math.min(500, Math.round(+i.cout || 0))), texte: enveloppe(i.texte) })),
      validation: carte ? 'carte' : 'flag', h: carte ? [] : (d.h || []).filter(x => /^[0-9a-f]{64}$/.test(x)).slice(0, 10), zones, vue, fond: 'osm',
      wu: writeupSur(d.wu, d.id), ...(!carte && S.wfValide(d.wf) ? { wf: { iv: d.wf.iv, ct: d.wf.ct, k: d.wf.k.map(x => ({ iv: x.iv, ct: x.ct })) } } : {}), format: 'Format : LUMIO{…}'
    };
  });
}

/* ---------- génération d'un pack depuis un brouillon (flags en clair → empreintes) ---------- */
export async function genererPack({ titre, auteur, proprietaire = false, defis }) {
  const slug = (titre || 'pack').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'pack';
  const id = proprietaire ? slug : slug + '-' + Math.random().toString(36).slice(2, 7);
  const sortie = { format: 'lumio-ctf-pack', version: 1, id, titre, auteur, date: new Date().toISOString(), defis: [] };
  for (const [n, d] of defis.entries()) {
    const did = `${proprietaire ? 'photo' : 'p'}-${id}-${n + 1}`;
    const o = { id: did, titre: d.titre, accroche: d.accroche, categorie: d.categorie, difficulte: d.difficulte, points: d.points, briefing: d.briefing, image: d.image || undefined, alt: d.alt || undefined, validation: d.validation,
      indices: d.indices.filter(i => i.texte.trim()).map(i => ({ cout: i.cout, texte: { '~': S.masquer(i.texte, did) } })) };
    if (d.validation === 'carte') {
      const r = d.rayon;
      o.zones = await S.construireZones(did, [{ lat: d.lat, lon: d.lon }], [{ r, part: 1 }, { r: r * 4, part: 0.6 }, { r: r * 30, part: 0 }]);
      o.vue = d.vue || [d.lat, d.lon, 3];
      o.wu = S.masquer(JSON.stringify({ html: d.writeup || '', lieu: d.lieu || '', cible: { lat: d.lat, lon: d.lon, r } }), did);
    } else {
      o.h = [await S.empreinteFlag(did, d.flag)];
      // writeup complet (avec le flag) chiffré par le flag ; version « abandon » sans le flag exact
      const flag = S.normaliserFlag(d.flag), complet = (d.writeup || '') + `\n\nFlag : ${flag}`;
      o.wf = await S.chiffrerPourFlags(did, JSON.stringify({ html: complet }), [flag]);
      const m = S.masquerFlags(d.writeup || '', [flag, d.flag], 'LUMIO{…}');
      o.wu = S.masquer(JSON.stringify({ html: m.html + '\n\nFlag : LUMIO{…} (affiché une fois le défi validé)', masque: true }), did);
    }
    sortie.defis.push(o);
  }
  return sortie;
}

/* ---------- vue ---------- */
const lireBrouillon = () => { try { return JSON.parse(localStorage.getItem(CLE_BROUILLON) || 'null') || { titre: '', auteur: '', proprietaire: false, defis: [] }; } catch { return { titre: '', auteur: '', proprietaire: false, defis: [] }; } };
const ecrireBrouillon = b => { try { localStorage.setItem(CLE_BROUILLON, JSON.stringify(b)); } catch { /* quota */ } };

async function redimensionner(fichier, max = 1400) {
  const img = await createImageBitmap(fichier);
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.82);
}

export async function vuePacks(navId, ctx, { chargerDefis, invaliderDefis }) {
  ctx.setTitre('Packs de défis');
  const d = await chargerDefis();
  if (!ctx.courant(navId)) return;
  const packs = lirePacks();
  const b = lireBrouillon();
  ctx.main.innerHTML = `<div class="wrap ctf">
    <div class="crumbs"><a href="#/ctf">Arène CTF</a> › <span>Packs</span></div>
    <h1>Packs de défis</h1>
    <p class="muted ctf-intro">Un pack est un fichier JSON qui contient des défis créés par quelqu'un d'autre. Les flags et les positions y sont stockés sous forme d'empreintes : ton ami ne voit pas les réponses en ouvrant le fichier.</p>
    <nav class="ctf-subnav" aria-label="Arène CTF"><a href="#/ctf">Défis</a><a href="#/ctf/classement">Classement</a><a href="#/ctf/outils">Établi</a><a href="#/ctf/packs" aria-current="page" class="active">Packs</a><a href="#/ctf/charte">Charte éthique</a></nav>
    <div class="ctf-classement">
      <section class="card">
        <h2 class="ctf-h">Packs installés</h2>
        ${packs.length ? `<ul class="plist">${packs.map((p, i) => `<li><span><b>${esc(p.titre)}</b> <span class="muted">${(p.defis || []).length} défi(s)${p.auteur ? ' · par ' + esc(p.auteur) : ''}</span></span><span class="row"><a class="btn small" href="#/ctf" data-voir>Jouer</a><button type="button" class="btn small" data-exp="${i}">Exporter</button><button type="button" class="btn small ghost danger-txt" data-sup="${i}">Supprimer</button></span></li>`).join('')}</ul>` : '<p class="muted">Aucun pack installé pour l\'instant.</p>'}
        <h3 style="margin-top:18px">Importer un pack</h3>
        <div class="row"><label class="btn" for="impPack">⬆ Choisir un fichier .json</label><input type="file" id="impPack" accept="application/json,.json" hidden></div>
        <div class="field" style="margin-top:12px"><label for="colPack">Ou colle le contenu du pack</label><textarea id="colPack" class="answer" rows="3" placeholder='{"format":"lumio-ctf-pack", …}'></textarea></div>
        <button type="button" class="btn small" id="impTexte">Importer le texte collé</button>
      </section>
      <section class="card">
        <h2 class="ctf-h">Créer un pack</h2>
        <div class="field"><label for="pkTitre">Titre du pack</label><input id="pkTitre" value="${esc(b.titre)}" placeholder="ex. Mes vacances à Oran" maxlength="60"></div>
        <div class="field"><label for="pkAuteur">Auteur</label><input id="pkAuteur" value="${esc(b.auteur)}" placeholder="ton pseudo" maxlength="40"></div>
        <label class="ctf-check"><input type="checkbox" id="pkProprio" ${b.proprietaire ? 'checked' : ''}><span>Pack « Mes photos » du propriétaire du site (images dans <code>assets/ctf/photos/</code>)</span></label>
        <h3 style="margin-top:14px">Défis du brouillon (${b.defis.length})</h3>
        ${b.defis.length ? `<ol class="ctf-brouillon">${b.defis.map((x, i) => `<li><span><b>${esc(x.titre)}</b> <span class="muted">${x.validation === 'carte' ? 'carte' : 'flag'} · ${x.points} pts</span></span><button type="button" class="btn small ghost" data-rm="${i}">Retirer</button></li>`).join('')}</ol>` : '<p class="muted">Ajoute un premier défi avec le formulaire ci-dessous.</p>'}
        <div class="row"><button type="button" class="btn primary" id="genPack" ${b.defis.length ? '' : 'disabled'}>Générer le pack (JSON)</button><button type="button" class="btn ghost" id="viderPack" ${b.defis.length ? '' : 'disabled'}>Vider le brouillon</button></div>
      </section>
    </div>
    <section class="card ctf-editeur" aria-labelledby="hEd">
      <h2 class="ctf-h" id="hEd">Nouveau défi</h2>
      <form id="formDefi" novalidate>
        <div class="ctf-form-grille">
          <div class="field"><label for="fTitre">Titre *</label><input id="fTitre" required maxlength="80"></div>
          <div class="field"><label for="fAccroche">Accroche (une phrase)</label><input id="fAccroche" maxlength="160"></div>
          <div class="field"><label for="fCat">Catégorie</label><select id="fCat">${CATEGORIES.map(c => `<option value="${c.id}">${esc(c.titre)}</option>`).join('')}</select></div>
          <div class="field"><label for="fDiff">Difficulté</label><select id="fDiff">${Object.entries(DIFFICULTES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
          <div class="field"><label for="fPts">Points</label><input id="fPts" type="number" min="10" max="1000" step="10" value="100"></div>
          <div class="field"><label for="fType">Validation</label><select id="fType"><option value="flag">Flag LUMIO{…}</option><option value="carte">Clic sur la carte</option></select></div>
        </div>
        <div class="field"><label for="fBrief">Briefing *</label><textarea id="fBrief" class="answer" rows="4" required placeholder="Raconte la situation et ce qu'il faut trouver."></textarea></div>
        <div class="ctf-form-grille">
          <div class="field"><span class="ctf-lab" id="fImgLab">Image (facultative)</span><div class="ctf-fichier-choix"><label class="btn small" for="fImg">🖼 Choisir une image</label><input id="fImg" type="file" accept="image/*" class="sr" aria-labelledby="fImgLab"><span class="muted" id="fImgNom" aria-live="polite">Aucun fichier choisi</span></div></div>
          <div class="field"><label for="fImgChemin">… ou chemin dans le site</label><input id="fImgChemin" placeholder="assets/ctf/photos/ma-photo.jpg"></div>
          <div class="field"><label for="fAlt">Description de l'image (accessibilité)</label><input id="fAlt" maxlength="200"></div>
        </div>
        <div id="zFlag" class="field"><label for="fFlag">Flag attendu *</label><input id="fFlag" placeholder="LUMIO{ma_reponse}" autocomplete="off"></div>
        <div id="zCarte" hidden>
          <p class="muted">Clique sur la carte pour placer la cible exacte, puis choisis la tolérance.</p>
          <div class="ctf-carte" id="carteEd"></div>
          <div class="ctf-form-grille">
            <div class="field"><label for="fRayon">Tolérance (rayon plein score)</label><select id="fRayon">${[[50, '50 m'], [150, '150 m'], [400, '400 m'], [1500, '1,5 km'], [5000, '5 km'], [25000, '25 km'], [150000, '150 km']].map(([v, t]) => `<option value="${v}" ${v === 400 ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
            <div class="field"><label for="fLieu">Nom du lieu (révélé après coup)</label><input id="fLieu" maxlength="120"></div>
          </div>
        </div>
        <fieldset class="ctf-fs"><legend>Indices (facultatifs)</legend>
          ${[1, 2, 3].map(n => `<div class="ctf-form-ind"><label for="fInd${n}">Indice ${n}</label><input id="fInd${n}" maxlength="400"><label for="fCout${n}" class="sr">Coût de l'indice ${n}</label><input id="fCout${n}" type="number" min="0" max="500" step="5" value="${n * 10}" aria-label="Coût en points"></div>`).join('')}
        </fieldset>
        <div class="field"><label for="fWu">Writeup (solution expliquée)</label><textarea id="fWu" class="answer" rows="4" placeholder="Comment trouver la réponse, étape par étape."></textarea></div>
        <div class="row"><button type="submit" class="btn primary">Ajouter au brouillon</button><span class="muted" id="fMsg" role="status"></span></div>
      </form>
    </section>
  </div>`;

  const recharger = () => { invaliderDefis(); ctx.router(); };
  const installer = txt => {
    let p;
    try { p = JSON.parse(txt); } catch { return ctx.toast('Ce n\'est pas du JSON valide.'); }
    const defis = normaliserPack(p, 'packs');
    if (!defis.length) return ctx.toast('Pack invalide ou vide (format « lumio-ctf-pack » attendu).');
    const l = lirePacks().filter(x => x.id !== p.id);
    l.push(p);
    try { ecrirePacks(l); } catch { return ctx.toast('Stockage du navigateur plein : supprime un pack ou réduis les images.'); }
    ctx.toast(`Pack « ${esc(p.titre)} » installé : ${defis.length} défi(s).`, 'ok');
    recharger();
  };
  $('#impPack').addEventListener('change', async e => { const f = e.target.files[0]; if (f) installer(await f.text()); });
  $('#impTexte').addEventListener('click', () => installer($('#colPack').value));
  $$('[data-voir]').forEach(a => a.addEventListener('click', () => { try { sessionStorage.setItem('lumio.ctf.filtres', JSON.stringify({ cat: 'packs', diff: 'toutes', etat: 'tous', q: '' })); } catch { /* ignoré */ } }));
  $$('[data-exp]').forEach(x => x.addEventListener('click', () => { const p = packs[+x.dataset.exp]; telecharger(`lumio-pack-${p.id}.json`, JSON.stringify(p, null, 1), 'application/json'); }));
  $$('[data-sup]').forEach(x => x.addEventListener('click', async () => {
    const p = packs[+x.dataset.sup];
    if (await modale({ titre: 'Supprimer ce pack ?', corps: `<p>« ${esc(p.titre)} » sera retiré de ce navigateur.</p>`, actions: [{ id: 'non', texte: 'Annuler' }, { id: 'oui', texte: 'Supprimer', primaire: true }] }) !== 'oui') return;
    progression.ctfOublier((p.defis || []).map(z => z && z.id).filter(id => typeof id === 'string'));
    ecrirePacks(packs.filter((_, i) => i !== +x.dataset.sup)); recharger();
  }));

  const majB = () => { b.titre = $('#pkTitre').value.trim(); b.auteur = $('#pkAuteur').value.trim(); b.proprietaire = $('#pkProprio').checked; ecrireBrouillon(b); };
  ['#pkTitre', '#pkAuteur', '#pkProprio'].forEach(s => $(s).addEventListener('change', majB));
  $$('[data-rm]').forEach(x => x.addEventListener('click', () => { b.defis.splice(+x.dataset.rm, 1); ecrireBrouillon(b); ctx.router(); }));
  $('#viderPack').addEventListener('click', () => { b.defis = []; ecrireBrouillon(b); ctx.router(); });
  $('#genPack').addEventListener('click', async () => {
    majB();
    if (!b.titre) { ctx.toast('Donne un titre au pack.'); $('#pkTitre').focus(); return; }
    const pack = await genererPack(b);
    telecharger(b.proprietaire ? 'defis.json' : `lumio-pack-${pack.id}.json`, JSON.stringify(pack, null, 1), 'application/json');
    if (!b.proprietaire) {
      const rep = await modale({ titre: 'Pack généré', corps: `<p>Le fichier <code>lumio-pack-${esc(pack.id)}.json</code> est téléchargé : envoie-le à tes amis. Veux-tu aussi l'installer ici pour le tester ?</p>`, actions: [{ id: 'non', texte: 'Plus tard' }, { id: 'oui', texte: 'Installer ici', primaire: true }] });
      if (rep === 'oui') installer(JSON.stringify(pack));
    } else {
      await modale({ titre: 'Fichier « defis.json » prêt', corps: '<p>Place-le dans <code>assets/ctf/photos/</code> avec tes images (mêmes chemins que dans le formulaire), puis publie le site : la catégorie « Mes photos » apparaîtra dans l\'arène.</p>' });
    }
  });

  // formulaire de défi
  $('#fImg').addEventListener('change', e => { const f = e.target.files[0]; $('#fImgNom').textContent = f ? f.name : 'Aucun fichier choisi'; });
  let carteEd = null;
  $('#fType').addEventListener('change', async e => {
    const carte = e.target.value === 'carte';
    $('#zFlag').hidden = carte; $('#zCarte').hidden = !carte;
    if (carte && !carteEd) { const { creerCarte } = await import('./carte.js'); carteEd = await creerCarte($('#carteEd'), { vue: [43.6, 1.44, 5] }) || null; }
  });
  $('#formDefi').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#fMsg');
    const titre = $('#fTitre').value.trim(), brief = $('#fBrief').value.trim(), type = $('#fType').value;
    if (!titre || !brief) { msg.textContent = 'Titre et briefing sont obligatoires.'; return; }
    const x = { titre, accroche: $('#fAccroche').value.trim(), categorie: $('#fCat').value, difficulte: +$('#fDiff').value, points: Math.min(1000, Math.max(10, +$('#fPts').value || 100)), briefing: brief, validation: type, alt: $('#fAlt').value.trim(), writeup: $('#fWu').value.trim(),
      indices: [1, 2, 3].map(n => ({ texte: $('#fInd' + n).value.trim(), cout: Math.max(0, +$('#fCout' + n).value || 0) })) };
    const f = $('#fImg').files[0], chemin = $('#fImgChemin').value.trim();
    if (f) x.image = await redimensionner(f); else if (chemin) x.image = chemin;
    if (x.image && !imageSure(x.image)) { msg.textContent = 'Chemin d\'image refusé : utilise assets/ctf/photos/… ou une adresse https.'; return; }
    if (type === 'flag') {
      if (!$('#fFlag').value.trim()) { msg.textContent = 'Indique le flag attendu.'; return; }
      x.flag = S.normaliserFlag($('#fFlag').value);
    } else {
      const p = carteEd && carteEd.position();
      if (!p) { msg.textContent = 'Place la cible sur la carte.'; return; }
      x.lat = +p.lat.toFixed(6); x.lon = +p.lng.toFixed(6); x.rayon = +$('#fRayon').value; x.lieu = $('#fLieu').value.trim();
      x.vue = [20, 0, 2];
    }
    b.defis.push(x); majB(); ecrireBrouillon(b);
    ctx.toast('Défi ajouté au brouillon.', 'ok');
    ctx.router();
  });
}
