// Prospecteur NEXORA : interface principale.
import { CATEGORIES, GROUPS, PRESETS, categoryById, categoryLabel } from './lib/categories.js';
import { zoneToCells, zoneAreaKm2, bboxSizeKm, estimateCost, pagesPerTaskFor } from './lib/geo.js';
import { opportunityScore, LEVELS } from './lib/score.js';
import { websiteLabel } from './lib/website.js';
import {
  escapeHtml, fmtInt, fmtRating, fmtUsd, fmtKm, plural, formatPhoneFR, telHref, smsHref, isMobileFR,
  cityFromAddress, fmtDate, fmtDateTime, fmtShortDateTime, toLocalInput, fromLocalInput, monthKey,
} from './lib/format.js';
import { toCSV } from './lib/csv.js';
import { openStore, GOOGLE_TTL_MS } from './lib/store.js';
import { PlacesApi, ApiError } from './lib/api.js';
import { runGoogleSearch, runOsmSearch, verifyWithGoogle, countCachedTasks } from './lib/search.js';
import { demoPlaces } from './lib/demo.js';
import { buildCallScript, buildEmail, buildSms, buildObjections, DEFAULT_PROFILE } from './lib/templates.js';
import { hashPassword, randomSecret, passwordStrength } from './lib/hash.js';
import { TOULOUSE_AREAS, METRO, searchLocal, searchNominatim } from './lib/places-data.js';
import { MapView } from './ui/map.js';

// ===========================================================================
// Outils
// ===========================================================================

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const ls = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* stockage plein ou interdit */ } },
};

function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

let toastTimer;
function toast(msg, kind = '') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast is-on${kind ? ` is-${kind}` : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, kind === 'err' ? 6000 : 3200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copié dans le presse-papiers.');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast('Copié dans le presse-papiers.'); } catch { toast('Copie impossible : sélectionnez le texte à la main.', 'warn'); }
    ta.remove();
  }
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Petite boîte de confirmation accessible (dialog natif). */
function askConfirm({ title, text, ok = 'Confirmer', cancel = 'Annuler' }) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'modal';
    d.setAttribute('aria-labelledby', 'cf-title');
    d.innerHTML = `<form class="modal__inner" method="dialog">
      <h2 class="modal__title" id="cf-title">${escapeHtml(title)}</h2>
      <p class="modal__text">${escapeHtml(text)}</p>
      <div class="modal__actions"><button class="btn btn--ghost" value="no">${escapeHtml(cancel)}</button><button class="btn btn--gold" value="yes">${escapeHtml(ok)}</button></div>
    </form>`;
    document.body.appendChild(d);
    d.addEventListener('close', () => { resolve(d.returnValue === 'yes'); d.remove(); });
    d.showModal();
    d.querySelector('button[value="yes"]').focus();
  });
}

// ===========================================================================
// État
// ===========================================================================

export const STATUSES = [
  { id: 'a_appeler', label: 'À appeler' },
  { id: 'appele', label: 'Appelé' },
  { id: 'rappeler', label: 'Rappeler le…' },
  { id: 'interesse', label: 'Intéressé' },
  { id: 'devis', label: 'Devis envoyé' },
  { id: 'client', label: 'Client' },
  { id: 'pas_interesse', label: 'Pas intéressé' },
  { id: 'opposition', label: 'Ne plus contacter' },
];
const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.id, s.label]));
const CLOSED_STATUSES = new Set(['client', 'pas_interesse', 'opposition']);

const DEFAULT_CATS = ['restaurant', 'boulangerie', 'coiffeur', 'barbier', 'institut', 'garage'];

const state = {
  view: 'search',
  source: ls.get('nxp.source', 'google'),
  cats: new Set(ls.get('nxp.cats', DEFAULT_CATS).filter((id) => categoryById(id))),
  places: [],
  byId: new Map(),
  meta: null,
  crm: new Map(),
  shown: 200,
  running: null,
  fn: null,
  session: null,
  drawerId: null,
  crmFilter: 'all',
  profile: { ...DEFAULT_PROFILE, ...ls.get('nxp.profile', {}) },
  settings: { price: 0.035, freeQuota: 1000, cap: 150, cellKm: 2, dark: true, ...ls.get('nxp.settings', {}) },
  placeLabel: ls.get('nxp.placeLabel', 'Capitole · Toulouse'),
};

let store;
let map;
const api = new PlacesApi();

function saveSettings() { ls.set('nxp.settings', state.settings); }

function usageKey() { return `nxp.usage.${monthKey()}`; }
function usedThisMonth() { return Number(ls.get(usageKey(), 0)) || 0; }
function addUsage(n) {
  if (!n) return;
  ls.set(usageKey(), usedThisMonth() + n);
  renderUsage();
}

function decorate(p) {
  const { score, level } = opportunityScore(p);
  return { ...p, score, level };
}

function crmOf(id) { return state.crm.get(id) || null; }

// ===========================================================================
// Onglets
// ===========================================================================

const VIEW_HASH = { search: '', crm: '#prospects', settings: '#reglages' };

function showView(view, { focus = false, push = true } = {}) {
  state.view = view;
  for (const tab of $$('.tab')) {
    const on = tab.dataset.view === view;
    tab.setAttribute('aria-selected', String(on));
    tab.tabIndex = on ? 0 : -1;
    if (on && focus) tab.focus();
  }
  $('#view-search').hidden = view !== 'search';
  $('#view-crm').hidden = view !== 'crm';
  $('#view-settings').hidden = view !== 'settings';
  if (push) {
    const h = VIEW_HASH[view];
    if (location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search);
  }
  if (view === 'search') requestAnimationFrame(() => map?.invalidate());
  if (view === 'crm') renderCrm();
  if (view === 'settings') renderSettings();
}

function initTabs() {
  const tabs = $$('.tab');
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showView(tab.dataset.view));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      let j = i;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      showView(tabs[j].dataset.view, { focus: true });
    });
  });
  const fromHash = () => {
    const v = location.hash === '#prospects' ? 'crm' : (location.hash === '#reglages' || location.hash === '#legal') ? 'settings' : 'search';
    showView(v, { push: false });
    if (location.hash === '#legal') setTimeout(() => $('#legal').scrollIntoView({ block: 'start' }), 50);
  };
  window.addEventListener('hashchange', fromHash);
  fromHash();
  $$('[data-goto]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    showView(a.dataset.goto);
    if (a.getAttribute('href') === '#legal') setTimeout(() => $('#legal').scrollIntoView({ block: 'start' }), 30);
  }));
  $('#conn-pill').addEventListener('click', () => showView('settings'));
}

// ===========================================================================
// Zone et lieux
// ===========================================================================

function zoneText(zone) {
  if (!zone) return '';
  const area = zoneAreaKm2(zone);
  const areaTxt = `${area < 10 ? fmtRating(area) : fmtInt(area)} km²`;
  if (zone.kind === 'circle') return `Cercle de ${fmtKm(zone.radiusKm)} autour de ${state.placeLabel} · ${areaTxt}`;
  const { w, h } = bboxSizeKm(zone.bbox);
  return `${zone.view ? 'Vue de la carte' : 'Rectangle'} ${fmtKm(w)} × ${fmtKm(h)} · ${areaTxt}`;
}

function onZoneChange() {
  $('#zone-info').textContent = zoneText(map.zone);
  scheduleEstimate();
}

function goToPlace(p) {
  state.placeLabel = p.label || p.name;
  ls.set('nxp.placeLabel', state.placeLabel);
  if (p.r && map.kind === 'circle') {
    $('#radius').value = String(p.r);
    $('#radius-out').textContent = fmtKm(p.r);
  }
  map.goTo({ lat: p.lat, lng: p.lng, r: p.r || Number($('#radius').value), bbox: p.bbox });
  closeSuggest();
}

let suggestions = [];
let activeSuggest = -1;

function closeSuggest() {
  $('#place-suggest').hidden = true;
  $('#place-q').setAttribute('aria-expanded', 'false');
  $('#place-q').removeAttribute('aria-activedescendant');
  activeSuggest = -1;
}

function renderSuggest(list, info = '') {
  suggestions = list;
  activeSuggest = -1;
  const ul = $('#place-suggest');
  if (!list.length && !info) { closeSuggest(); return; }
  ul.innerHTML = list.map((p, i) => `<li role="option" id="sg-${i}" data-i="${i}" aria-selected="false">${escapeHtml(p.name)}<small>${escapeHtml(p.label === p.name ? (p.r ? `rayon ${fmtKm(p.r)}` : '') : p.label.replace(`${p.name}, `, '').slice(0, 48))}</small></li>`).join('')
    + (info ? `<li class="suggest__info" role="presentation">${escapeHtml(info)}</li>` : '');
  ul.hidden = false;
  $('#place-q').setAttribute('aria-expanded', 'true');
}

function initPlaceSearch() {
  const input = $('#place-q');
  input.addEventListener('input', () => {
    const q = input.value.trim();
    renderSuggest(q ? searchLocal(q) : [], q.length > 2 ? 'Entrée : chercher en ligne (OpenStreetMap)' : '');
  });
  input.addEventListener('keydown', (e) => {
    const ul = $('#place-suggest');
    if (ul.hidden || !suggestions.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggest = (activeSuggest + (e.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length;
      $$('li[role="option"]', ul).forEach((li, i) => li.setAttribute('aria-selected', String(i === activeSuggest)));
      input.setAttribute('aria-activedescendant', `sg-${activeSuggest}`);
    } else if (e.key === 'Escape') {
      closeSuggest();
    }
  });
  $('#place-suggest').addEventListener('mousedown', (e) => {
    const li = e.target.closest('li[data-i]');
    if (!li) return;
    e.preventDefault();
    goToPlace(suggestions[Number(li.dataset.i)]);
    input.value = suggestions[Number(li.dataset.i)]?.name || input.value;
  });
  input.addEventListener('blur', () => setTimeout(closeSuggest, 150));
  $('#place-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    if (activeSuggest >= 0 && suggestions[activeSuggest]) {
      const p = suggestions[activeSuggest];
      input.value = p.name;
      goToPlace(p);
      return;
    }
    const local = searchLocal(q, 1);
    if (local.length && local[0].name.toLowerCase() === q.toLowerCase()) { goToPlace(local[0]); return; }
    renderSuggest([], 'Recherche en ligne…');
    try {
      const res = await searchNominatim(q);
      if (!res.length) renderSuggest(local, 'Aucun lieu trouvé en ligne.');
      else if (res.length === 1) goToPlace({ ...res[0], r: rFromBbox(res[0].bbox) });
      else renderSuggest(res.map((r) => ({ ...r, r: rFromBbox(r.bbox) })));
    } catch {
      renderSuggest(local, 'Recherche en ligne indisponible : choisissez un lieu proposé ou déplacez la carte.');
    }
  });

  const quick = [...TOULOUSE_AREAS.slice(0, 9), ...METRO.slice(1, 4)];
  $('#quick-places').innerHTML = quick.map((p, i) => `<button type="button" data-q="${i}">${escapeHtml(p.name)}</button>`).join('');
  $('#quick-places').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-q]');
    if (!b) return;
    const p = quick[Number(b.dataset.q)];
    goToPlace({ ...p, label: TOULOUSE_AREAS.includes(p) ? `${p.name} · Toulouse` : p.name });
  });
}

function rFromBbox(b) {
  if (!b) return 1.5;
  const { w, h } = bboxSizeKm(b);
  return Math.max(0.5, Math.min(6, Math.max(w, h) / 2));
}

function initZoneControls() {
  const radius = $('#radius');
  radius.value = String(map.radiusKm);
  $('#radius-out').textContent = fmtKm(map.radiusKm);
  radius.addEventListener('input', () => {
    const km = Number(radius.value);
    $('#radius-out').textContent = fmtKm(km);
    map.setRadius(km);
  });
  $$('input[name="zone-kind"]').forEach((r) => r.addEventListener('change', () => {
    const kind = $('input[name="zone-kind"]:checked').value;
    $('#radius-row').hidden = kind !== 'circle';
    $('#rect-row').hidden = kind !== 'rect';
    $('#zone-hint').textContent = kind === 'circle'
      ? 'Cliquez sur la carte ou faites glisser le point doré pour déplacer le cercle.'
      : kind === 'rect' ? 'Tracez votre rectangle sur la carte (glisser du doigt ou de la souris).' : 'La zone suit la carte : déplacez-vous et zoomez.';
    map.setKind(kind);
  }));
  $('#draw-rect').addEventListener('click', () => {
    map.startDrawRect();
    toast('Glissez sur la carte pour tracer la zone (Échap pour annuler).');
  });
  $('#locate').addEventListener('click', () => {
    if (!navigator.geolocation) { toast('Géolocalisation indisponible sur cet appareil.', 'warn'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => goToPlace({ name: 'Ma position', label: 'ma position', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast('Position refusée ou indisponible.', 'warn'),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  });
  const wrap = $('.map-wrap');
  const styleBtn = $('#map-style');
  const applyStyle = () => {
    wrap.classList.toggle('is-dark', state.settings.dark);
    styleBtn.setAttribute('aria-pressed', String(state.settings.dark));
    styleBtn.textContent = state.settings.dark ? 'Plan sombre' : 'Plan clair';
  };
  styleBtn.addEventListener('click', () => { state.settings.dark = !state.settings.dark; saveSettings(); applyStyle(); });
  applyStyle();
  $('#fit-results').addEventListener('click', () => map.fitResults());
}

// ===========================================================================
// Catégories
// ===========================================================================

function renderCategories() {
  $('#cat-groups').innerHTML = GROUPS.map((g) => {
    const cats = CATEGORIES.filter((c) => c.group === g.id);
    return `<fieldset class="cat-group" data-group="${g.id}"><legend>${escapeHtml(g.label)}</legend><div class="cat-list">${
      cats.map((c) => `<label class="cat" data-label="${escapeHtml(c.label.toLowerCase())}"><input type="checkbox" value="${c.id}" ${state.cats.has(c.id) ? 'checked' : ''}><span>${escapeHtml(c.label)}</span></label>`).join('')
    }</div></fieldset>`;
  }).join('');
  $('#preset-list').innerHTML = PRESETS.map((p) => `<button type="button" data-preset="${p.id}">${escapeHtml(p.label)}</button>`).join('');
  updateCatCount();
}

function updateCatCount() {
  $('#cat-count').textContent = `${state.cats.size} sélectionnée${state.cats.size > 1 ? 's' : ''}`;
  ls.set('nxp.cats', [...state.cats]);
  scheduleEstimate();
}

function initCategories() {
  renderCategories();
  $('#cat-groups').addEventListener('change', (e) => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    if (cb.checked) state.cats.add(cb.value); else state.cats.delete(cb.value);
    updateCatCount();
  });
  $('#preset-list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-preset]');
    if (!b) return;
    const preset = PRESETS.find((p) => p.id === b.dataset.preset);
    state.cats = new Set(preset.ids);
    $$('#cat-groups input').forEach((cb) => { cb.checked = state.cats.has(cb.value); });
    updateCatCount();
    toast(`Sélection « ${preset.label} » : ${preset.ids.length} catégories.`);
  });
  $('#cat-clear').addEventListener('click', () => {
    state.cats.clear();
    $$('#cat-groups input').forEach((cb) => { cb.checked = false; });
    updateCatCount();
  });
  $('#cat-filter').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    for (const label of $$('#cat-groups .cat')) {
      const l = label.dataset.label.normalize('NFD').replace(/[̀-ͯ]/g, '');
      label.hidden = Boolean(q) && !l.includes(q);
    }
    for (const g of $$('#cat-groups .cat-group')) g.hidden = !$$('.cat', g).some((c) => !c.hidden);
  });
}

// ===========================================================================
// Source, budget, estimation
// ===========================================================================

function initSource() {
  $$('input[name="source"]').forEach((r) => {
    r.checked = r.value === state.source;
    r.addEventListener('change', () => {
      state.source = $('input[name="source"]:checked').value;
      ls.set('nxp.source', state.source);
      applySource();
    });
  });
  $('#cap').value = String(state.settings.cap);
  $('#cell-size').value = String(state.settings.cellKm);
  $('#cap').addEventListener('input', () => {
    const v = Math.max(1, Math.min(2000, Math.floor(Number($('#cap').value) || 0)));
    if (v) { state.settings.cap = v; saveSettings(); }
    scheduleEstimate();
  });
  $('#cell-size').addEventListener('change', () => {
    state.settings.cellKm = Number($('#cell-size').value);
    saveSettings();
    scheduleEstimate();
  });
  applySource();
}

function applySource() {
  $('#google-opts').hidden = state.source !== 'google';
  $('#run-label').textContent = state.source === 'google' ? 'Lancer la recherche Google' : 'Lancer la recherche gratuite';
  scheduleEstimate();
}

const scheduleEstimate = debounce(renderEstimate, 120);
let estimateSeq = 0;

async function renderEstimate() {
  if (!map) return;
  const el = $('#estimate');
  const zone = map.zone;
  const cats = state.cats.size;
  const run = $('#run');
  run.disabled = !cats || Boolean(state.running);
  if (!cats) {
    el.className = 'estimate';
    el.innerHTML = '<p class="estimate__warn">Cochez au moins une catégorie.</p>';
    return;
  }
  if (state.source === 'osm') {
    const area = zoneAreaKm2(zone);
    el.className = 'estimate estimate--free';
    el.innerHTML = `<div class="estimate__big">Gratuit</div>
      <div class="estimate__row"><span>Source</span><strong>OpenStreetMap (Overpass)</strong></div>
      <div class="estimate__row"><span>Avis et notes</span><strong>non disponibles</strong></div>
      <p class="estimate__note">Repère les établissements sans site renseigné dans OpenStreetMap. Ensuite, vous pourrez vérifier les meilleurs sur Google (avis, note, site) : 1 requête par établissement.</p>
      ${area > 300 ? '<p class="estimate__warn">Zone très étendue : le serveur Overpass risque de refuser. Réduisez-la si besoin.</p>' : ''}`;
    return;
  }
  const seq = ++estimateSeq;
  const cellKm = state.settings.cellKm;
  const cells = zoneToCells(zone, cellKm).length;
  const cached = store ? await countCachedTasks(store, zone, [...state.cats], cellKm) : 0;
  if (seq !== estimateSeq) return;
  const price = Number(state.settings.price) || 0;
  const cap = state.settings.cap;
  const e = estimateCost({ cells, categories: cats, cachedTasks: cached, pricePerRequest: price, cap, pagesPerTask: pagesPerTaskFor(cellKm) });
  const freeLeft = Math.max(0, (Number(state.settings.freeQuota) || 0) - usedThisMonth());
  const typicalBillable = Math.max(0, e.typical - freeLeft);
  el.className = 'estimate';
  el.innerHTML = `
    <div class="estimate__row"><span>Estimation</span><strong>${cells} cellule${cells > 1 ? 's' : ''} × ${cats} catégorie${cats > 1 ? 's' : ''}</strong></div>
    <div class="estimate__big">≈ ${fmtInt(e.typical)} requêtes · ${fmtUsd(e.cost.typical)}</div>
    <div class="estimate__row"><span>Fourchette</span><strong>${fmtInt(e.min)} à ${fmtInt(e.max)} req. (${fmtUsd(e.cost.min)} à ${fmtUsd(e.cost.max)})</strong></div>
    ${e.cachedTasks ? `<div class="estimate__row"><span>Déjà en cache (gratuit)</span><strong>${fmtInt(e.cachedTasks)} sur ${fmtInt(e.tasks)}</strong></div>` : ''}
    <div class="estimate__row"><span>Offertes restantes ce mois</span><strong>${fmtInt(freeLeft)} req.${typicalBillable === 0 ? ' · probablement 0 $' : ''}</strong></div>
    ${e.capped ? `<p class="estimate__warn">La recherche s'arrêtera au plafond de ${fmtInt(cap)} requêtes (les cellules restantes seront signalées).</p>` : ''}
    ${e.capTooLow ? '<p class="estimate__warn">Plafond trop bas pour couvrir toute la zone : agrandissez les cellules, réduisez la zone ou relevez le plafond.</p>' : ''}
    <p class="estimate__note">Chaque page de 20 résultats compte pour une requête (3 au plus par cellule, puis la cellule est redécoupée si elle est saturée). Tarif indicatif « Text Search Enterprise » : vérifiez la grille officielle de Google Maps Platform.</p>`;
}

// ===========================================================================
// Recherche
// ===========================================================================

function setRunning(ctrl) {
  state.running = ctrl;
  $('#run').disabled = Boolean(ctrl) || !state.cats.size;
  $('#demo-btn').disabled = Boolean(ctrl);
  $('#progress').hidden = !ctrl;
  if (!ctrl) scheduleEstimate();
}

function setProgress(pct, title, text) {
  const bar = $('#progress-bar');
  bar.setAttribute('aria-valuenow', String(Math.round(pct)));
  bar.firstElementChild.style.width = `${Math.max(2, Math.min(100, pct))}%`;
  if (title) $('#progress-title').textContent = title;
  if (text !== undefined) $('#progress-text').textContent = text;
}

function setResults(places, meta, { fit = true } = {}) {
  state.places = places.map(decorate);
  state.byId = new Map(state.places.map((p) => [p.id, p]));
  state.meta = meta;
  state.shown = 200;
  if (meta && !meta.demo) {
    ls.set('nxp.last', { ids: state.places.map((p) => p.id), meta });
  }
  renderCategoryFilter();
  renderResults();
  if (fit && state.places.length) map.fitResults();
}

const throttledRender = (() => {
  let last = 0;
  let timer;
  return (places, meta) => {
    const now = performance.now();
    clearTimeout(timer);
    const go = () => { last = performance.now(); setResults(places, meta, { fit: false }); };
    if (now - last > 600) go(); else timer = setTimeout(go, 600 - (now - last));
  };
})();

async function ensureLogin(reason) {
  if (api.loggedIn) return true;
  const d = $('#login-dialog');
  $('#login-dialog-text').textContent = reason || 'Entrez le mot de passe d\'accès défini dans Netlify.';
  $('#ld-msg').textContent = '';
  $('#ld-pw').value = '';
  d.showModal();
  $('#ld-pw').focus();
  return new Promise((resolve) => {
    const form = $('#login-dialog-form');
    const onSubmit = async (e) => {
      e.preventDefault();
      $('#ld-msg').textContent = '';
      $('#ld-ok').disabled = true;
      try {
        await api.login($('#ld-pw').value, { remember: $('#ld-remember').checked });
        cleanup();
        d.close();
        renderConn();
        resolve(true);
      } catch (err) {
        $('#ld-msg').textContent = err.message;
      } finally {
        $('#ld-ok').disabled = false;
      }
    };
    const onCancel = () => { cleanup(); d.close(); resolve(false); };
    const onClose = () => { cleanup(); resolve(api.loggedIn); };
    function cleanup() {
      form.removeEventListener('submit', onSubmit);
      $('#ld-cancel').removeEventListener('click', onCancel);
      d.removeEventListener('close', onClose);
    }
    form.addEventListener('submit', onSubmit);
    $('#ld-cancel').addEventListener('click', onCancel);
    d.addEventListener('close', onClose);
  });
}

async function runSearch() {
  if (state.running || !state.cats.size) return;
  const zone = map.zone;
  const categoryIds = [...state.cats];
  const label = state.placeLabel;
  if (state.source === 'osm') return runOsm(zone, categoryIds, label);

  if (state.fn && !state.fn.ready && state.fn.missing?.includes('GOOGLE_PLACES_API_KEY')) {
    toast('Clé Google absente sur Netlify : voir Réglages (ou essayez le mode OpenStreetMap / la démo).', 'warn');
    showView('settings');
    return;
  }
  if (!(await ensureLogin('Connectez-vous pour lancer la recherche Google.'))) return;

  const ctrl = new AbortController();
  setRunning(ctrl);
  const startUsage = usedThisMonth();
  let lastReq = 0;
  setProgress(2, 'Recherche Google en cours…', 'Préparation du quadrillage…');
  const meta = { source: 'google', at: Date.now(), label, zone, categoryIds, requests: 0 };
  try {
    const res = await runGoogleSearch({
      api,
      store,
      zone,
      categoryIds,
      cellKm: state.settings.cellKm,
      cap: state.settings.cap,
      signal: ctrl.signal,
      onUpdate: ({ places, stats, total }) => {
        const pct = total ? (stats.tasksDone / total) * 100 : 0;
        addUsage(stats.requests - lastReq);
        lastReq = stats.requests;
        meta.requests = stats.requests;
        setProgress(pct, null, `${fmtInt(stats.tasksDone)} / ${fmtInt(total)} cellules · ${plural(stats.requests, 'requête', 'requêtes')} · ${plural(places.length, 'établissement', 'établissements')}${stats.subdivisions ? ` · ${stats.subdivisions} cellules redécoupées` : ''}`);
        throttledRender(places, { ...meta });
      },
    });
    meta.requests = res.stats.requests;
    meta.stats = { cached: res.stats.cachedTasks, subdivisions: res.stats.subdivisions, closed: res.stats.closed, pending: res.pending, stoppedByCap: res.stats.stoppedByCap };
    setResults(res.places, meta);
    if (res.fatal) {
      const msg = res.fatal instanceof ApiError || res.fatal.message ? res.fatal.message : 'Erreur inconnue';
      toast(`Recherche interrompue : ${msg}`, 'err');
      if (res.fatal.status === 401) renderConn();
    } else if (res.aborted) {
      toast(`Recherche arrêtée : ${plural(res.places.length, 'établissement', 'établissements')} déjà trouvés.`, 'warn');
    } else if (res.stats.stoppedByCap) {
      toast(`Plafond de ${state.settings.cap} requêtes atteint : ${res.pending} cellules non explorées. Relancez pour continuer (le déjà-vu est en cache).`, 'warn');
    } else {
      toast(`${plural(res.places.length, 'établissement trouvé', 'établissements trouvés')} · ${plural(res.stats.requests, 'requête', 'requêtes')} (${fmtUsd(res.stats.requests * state.settings.price)}).`);
    }
    if (res.stats.errors.length) console.warn('Erreurs pendant la recherche :', res.stats.errors);
  } catch (e) {
    if (e?.name !== 'AbortError') toast(`Recherche impossible : ${e.message}`, 'err');
  } finally {
    addUsage(0);
    if (usedThisMonth() < startUsage) ls.set(usageKey(), startUsage);
    setRunning(null);
  }
}

async function runOsm(zone, categoryIds, label) {
  const ctrl = new AbortController();
  setRunning(ctrl);
  setProgress(30, 'Recherche OpenStreetMap…', 'Interrogation du serveur Overpass (gratuit)…');
  try {
    const res = await runOsmSearch({ zone, categoryIds, store, signal: ctrl.signal });
    setProgress(100);
    setResults(res.places, { source: 'osm', at: Date.now(), label, zone, categoryIds, requests: 0 });
    const none = res.places.filter((p) => p.website.status === 'none').length;
    toast(`${plural(res.places.length, 'établissement', 'établissements')} dans OpenStreetMap, dont ${fmtInt(none)} sans site renseigné.`);
  } catch (e) {
    if (e?.name !== 'AbortError') toast(e.message || 'Overpass injoignable.', 'err');
  } finally {
    setRunning(null);
  }
}

function runDemo() {
  const zone = map.zone;
  const places = demoPlaces({ zone, categoryIds: [...state.cats] });
  setResults(places, { source: 'demo', demo: true, at: Date.now(), label: state.placeLabel, zone, categoryIds: [...state.cats], requests: 0 });
  toast('Démonstration : données entièrement fictives, aucune requête envoyée.');
  if (window.matchMedia('(max-width: 900px)').matches) $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function verifySelection() {
  const candidates = filteredPlaces().filter((p) => p.source === 'osm' && !p.verified).slice(0, Math.min(20, state.settings.cap));
  if (!candidates.length) { toast('Aucun candidat OpenStreetMap à vérifier dans la liste filtrée.'); return; }
  const n = candidates.length;
  const ok = await askConfirm({
    title: 'Vérifier sur Google',
    text: `Retrouver les ${n} premiers établissements de la liste sur Google (avis, note, site) : ${n} requêtes, environ ${fmtUsd(n * state.settings.price)}.`,
    ok: `Vérifier ${n} établissements`,
  });
  if (!ok || !(await ensureLogin('Connectez-vous pour vérifier sur Google.'))) return;
  const ctrl = new AbortController();
  setRunning(ctrl);
  setProgress(2, 'Vérification Google…', '');
  let used = 0;
  try {
    const res = await verifyWithGoogle({
      api, store, places: candidates, signal: ctrl.signal,
      onUpdate: (next, s) => {
        addUsage(s.requests - used);
        used = s.requests;
        const i = state.places.findIndex((p) => p.id === next.id);
        if (i >= 0) state.places[i] = decorate(next);
        state.byId.set(next.id, state.places[i]);
        setProgress((s.done / s.total) * 100, null, `${s.done} / ${s.total} · ${s.matched} retrouvés sur Google`);
      },
    });
    state.meta = { ...state.meta, verified: true, requests: (state.meta.requests || 0) + res.requests };
    ls.set('nxp.last', { ids: state.places.map((p) => p.id), meta: state.meta });
    renderResults();
    toast(`${res.matched} sur ${n} retrouvés sur Google (${res.requests} requêtes).`);
  } catch (e) {
    if (e?.name !== 'AbortError') toast(`Vérification interrompue : ${e.message}`, 'err');
    renderResults();
  } finally {
    setRunning(null);
  }
}

// ===========================================================================
// Résultats
// ===========================================================================

function readFilters() {
  return {
    none: $('#f-none').checked,
    social: $('#f-social').checked,
    site: $('#f-site').checked,
    minReviews: Math.max(0, Number($('#f-reviews').value) || 0),
    minRating: Number($('#f-rating').value) || 0,
    phone: $('#f-phone').checked,
    cat: $('#f-cat').value,
    sort: $('#f-sort').value,
    text: $('#f-text').value.trim().toLowerCase(),
  };
}

function filteredPlaces() {
  const f = readFilters();
  const list = state.places.filter((p) => {
    if (crmOf(p.id)?.status === 'opposition') return false;
    if (!f[p.website?.status || 'none']) return false;
    if (f.minReviews && !(p.reviews >= f.minReviews)) return false;
    if (f.minRating && !(p.rating >= f.minRating)) return false;
    if (f.phone && !p.phone) return false;
    if (f.cat && !p.categories?.includes(f.cat)) return false;
    if (f.text && !`${p.name} ${p.address}`.toLowerCase().includes(f.text)) return false;
    return true;
  });
  const by = {
    score: (a, b) => b.score - a.score || (b.reviews || 0) - (a.reviews || 0),
    reviews: (a, b) => (b.reviews ?? -1) - (a.reviews ?? -1) || b.score - a.score,
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviews || 0) - (a.reviews || 0),
    name: (a, b) => a.name.localeCompare(b.name, 'fr'),
  }[f.sort] || ((a, b) => b.score - a.score);
  return list.sort(by);
}

function renderCategoryFilter() {
  const sel = $('#f-cat');
  const current = sel.value;
  const ids = new Set();
  for (const p of state.places) for (const c of p.categories || []) ids.add(c);
  sel.innerHTML = `<option value="">Toutes</option>${[...ids].map((id) => `<option value="${id}">${escapeHtml(categoryLabel(id))}</option>`).join('')}`;
  if (ids.has(current)) sel.value = current;
}

function siteBadge(p) {
  const w = p.website || { status: 'none' };
  const label = websiteLabel(w);
  if (w.status === 'none') return '<span class="badge badge--none">Aucun site</span>';
  if (w.status === 'social') return `<span class="badge badge--social" title="${escapeHtml(w.url || '')}">${escapeHtml(label)}</span>`;
  if (w.free) return `<span class="badge badge--free" title="${escapeHtml(w.url || '')}">${escapeHtml(label)}</span>`;
  return `<span class="badge badge--site" title="${escapeHtml(w.url || '')}">A un site</span>`;
}

function scoreRing(p, lg = false) {
  return `<span class="score score--${p.level}${lg ? ' score--lg' : ''}" style="--v:${p.score}" title="Score d'opportunité : ${p.score}/100 (${LEVELS[p.level].label})"><span>${p.score}</span></span>`;
}

function statusBadge(rec) {
  if (!rec?.status) return '';
  const when = rec.status === 'rappeler' && rec.callbackAt ? ` · ${fmtShortDateTime(rec.callbackAt)}` : '';
  return `<span class="badge badge--status" data-s="${rec.status}">${escapeHtml(STATUS_LABEL[rec.status] || rec.status)}${escapeHtml(when)}</span>`;
}

function catLine(p) {
  const cats = (p.categories || []).map(categoryLabel);
  return cats.length ? cats.join(' · ') : (p.typeLabel || '');
}

function rowHtml(p) {
  const rec = crmOf(p.id);
  const phone = p.phone ? `<a class="r-phone" href="${telHref(p.phoneIntl || p.phone)}"><svg aria-hidden="true"><use href="#i-phone"/></svg>${escapeHtml(formatPhoneFR(p.phone))}</a>` : '<span class="r-muted">Pas de numéro</span>';
  const rating = Number.isFinite(p.rating) ? `<span class="r-rating"><svg aria-hidden="true"><use href="#i-star"/></svg>${fmtRating(p.rating)}</span>` : '<span class="r-muted">–</span>';
  const reviews = Number.isFinite(p.reviews) ? `<span class="r-reviews">${fmtInt(p.reviews)}</span>` : '<span class="r-muted">?</span>';
  const mobileMeta = Number.isFinite(p.reviews)
    ? `${rating}<span>${fmtInt(p.reviews)} avis</span>`
    : '<span class="r-muted">Avis inconnus (OpenStreetMap)</span>';
  const maps = p.mapsUrl ? `<a class="icon-btn" href="${escapeHtml(p.mapsUrl)}" target="_blank" rel="noopener noreferrer" title="Ouvrir dans Google Maps" aria-label="Ouvrir ${escapeHtml(p.name)} dans Google Maps"><svg aria-hidden="true"><use href="#i-pin"/></svg></a>` : '';
  return `<tr data-id="${escapeHtml(p.id)}">
    <td class="c-score">${scoreRing(p)}</td>
    <td class="c-name"><button type="button" class="r-name-btn" data-open="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button><span class="r-cat">${escapeHtml(catLine(p))}${p.source === 'demo' ? ' · <span class="badge badge--demo">démo</span>' : ''}${p.verified === 'ok' ? ' · vérifié Google' : ''}</span></td>
    <td class="c-rating r-num">${rating}</td>
    <td class="c-reviews r-num">${reviews}</td>
    <td class="c-meta-m">${mobileMeta}</td>
    <td class="c-phone">${phone}</td>
    <td class="c-addr col-addr"><span class="r-addr">${escapeHtml(p.address || '–')}</span></td>
    <td class="c-site">${siteBadge(p)}</td>
    <td class="c-status">${statusBadge(rec)}</td>
    <td class="c-actions"><div class="r-actions">${maps}</div></td>
  </tr>`;
}

function renderResults() {
  const all = state.places.filter((p) => crmOf(p.id)?.status !== 'opposition');
  const opposed = state.places.length - all.length;
  const list = filteredPlaces();
  const meta = state.meta;
  const hasGoogle = state.places.some((p) => p.source === 'google' || p.verified === 'ok');

  $('#kpi-total').textContent = fmtInt(all.length);
  $('#kpi-none').textContent = fmtInt(all.filter((p) => p.website.status === 'none').length);
  $('#kpi-social').textContent = fmtInt(all.filter((p) => p.website.status === 'social').length);
  $('#kpi-hot').textContent = fmtInt(all.filter((p) => p.level === 'chaud').length);
  if (meta?.source === 'google' || meta?.verified) {
    $('#kpi-cost').textContent = `${fmtInt(meta.requests || 0)} req.`;
    $('#kpi-cost-l').textContent = `≈ ${fmtUsd((meta.requests || 0) * state.settings.price)} · requêtes Google`;
  } else {
    $('#kpi-cost').textContent = '0 $';
    $('#kpi-cost-l').textContent = meta?.demo ? 'démonstration, aucune requête' : meta?.source === 'osm' ? 'OpenStreetMap, gratuit' : 'requêtes Google';
  }

  const srcName = { google: 'Google Maps', osm: 'OpenStreetMap', demo: 'Démonstration (données fictives)' }[meta?.source] || '';
  $('#results-title').textContent = state.places.length ? `${plural(list.length, 'prospect', 'prospects')} à appeler` : 'Résultats';
  if (meta) {
    const bits = [srcName, meta.label, plural(meta.categoryIds?.length || 0, 'catégorie', 'catégories'), fmtDateTime(meta.at)];
    if (opposed) bits.push(`${opposed} masqué${opposed > 1 ? 's' : ''} (ne plus contacter)`);
    if (meta.stats?.stoppedByCap) bits.push(`${meta.stats.pending} cellules non explorées (plafond)`);
    if (meta.stats?.cached) bits.push(`${meta.stats.cached} cellules depuis le cache`);
    $('#results-sub').textContent = bits.filter(Boolean).join(' · ');
  }

  const attr = $('#data-attribution');
  attr.hidden = !state.places.length;
  if (hasGoogle) attr.innerHTML = 'Données des établissements : <span class="google-attr">Google Maps</span> · fond de carte © contributeurs OpenStreetMap';
  else if (meta?.source === 'osm') attr.innerHTML = 'Données © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">contributeurs OpenStreetMap</a> (ODbL) · pas d\'avis Google : utilisez « Vérifier avec Google » sur les meilleurs candidats.';
  else if (meta?.demo) attr.innerHTML = '<span class="badge badge--demo">Démo</span> Établissements, numéros et adresses inventés pour la démonstration.';

  const body = $('#results-body');
  body.innerHTML = list.slice(0, state.shown).map(rowHtml).join('');
  $('#results-empty').hidden = list.length > 0;
  if (state.places.length && !list.length) {
    $('#results-empty .empty__title').textContent = 'Aucun établissement ne correspond aux filtres.';
    $('#results-empty .empty__text').textContent = 'Élargissez les filtres (statut du site, avis minimum, note) pour voir plus de résultats.';
  }
  const more = $('#results-more');
  more.hidden = list.length <= state.shown;
  more.textContent = `Afficher plus (${fmtInt(list.length - state.shown)} restants)`;

  const any = list.length > 0;
  $('#export-btn').disabled = !state.places.length;
  $('#session-btn').disabled = !list.some((p) => p.phone && !CLOSED_STATUSES.has(crmOf(p.id)?.status));
  $('#add-hot').disabled = !list.some((p) => p.level === 'chaud' && !crmOf(p.id));
  $('#fit-results').disabled = !any;
  $('#verify-btn').hidden = meta?.source !== 'osm';

  map.setPlaces(list, { google: hasGoogle });
}

function initResults() {
  $('#filters').addEventListener('submit', (e) => e.preventDefault());
  const rerender = debounce(() => { state.shown = 200; renderResults(); }, 120);
  $('#filters').addEventListener('input', rerender);
  $('#filters').addEventListener('change', rerender);
  $('#results-more').addEventListener('click', () => { state.shown += 200; renderResults(); });
  const body = $('#results-body');
  body.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const tr = e.target.closest('tr[data-id]');
    if (tr) openDrawer(tr.dataset.id);
  });
  body.addEventListener('mouseover', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) map.highlight(tr.dataset.id, true);
  });
  body.addEventListener('mouseout', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr && !tr.contains(e.relatedTarget)) map.highlight(tr.dataset.id, false);
  });
  $('#run').addEventListener('click', runSearch);
  $('#demo-btn').addEventListener('click', runDemo);
  $('#progress-stop').addEventListener('click', () => state.running?.abort());
  $('#verify-btn').addEventListener('click', verifySelection);
  $('#add-hot').addEventListener('click', async () => {
    const hot = filteredPlaces().filter((p) => p.level === 'chaud' && !crmOf(p.id));
    for (const p of hot) await saveCrm(p, { status: 'a_appeler' }, { silent: true });
    renderResults();
    renderCrmBadge();
    toast(`${plural(hot.length, 'prospect chaud ajouté', 'prospects chauds ajoutés')} à votre liste « À appeler ».`);
  });
  $('#session-btn').addEventListener('click', () => {
    const ids = filteredPlaces().filter((p) => p.phone && !CLOSED_STATUSES.has(crmOf(p.id)?.status)).map((p) => p.id);
    startSession(ids);
  });
  $('#export-btn').addEventListener('click', () => openExport('results'));
}

// ===========================================================================
// CRM
// ===========================================================================

function snapshotFor(p) {
  // Données OpenStreetMap (ODbL) et démonstration : conservées. Contenu Google : jamais copié dans le CRM.
  if (p.source === 'google' || p.verified === 'ok') {
    return { categories: p.categories || [] };
  }
  return {
    name: p.name, address: p.address, city: p.city || '', phone: p.phone, lat: p.lat, lng: p.lng,
    categories: p.categories || [], websiteUri: p.websiteUri || '', website: p.website, mapsUrl: p.mapsUrl || '', osmUrl: p.osmUrl || '',
  };
}

async function saveCrm(p, patch, { silent = false } = {}) {
  const now = Date.now();
  const prev = crmOf(p.id);
  const rec = prev ? { ...prev } : {
    id: p.id, source: p.source, status: 'a_appeler', notes: '', contactName: '', callbackAt: null,
    createdAt: now, history: [], snap: snapshotFor(p), googleId: p.googleId || (p.source === 'google' ? p.id : null),
  };
  if (patch.status && patch.status !== rec.status) rec.history = [...(rec.history || []), { at: now, status: patch.status }].slice(-30);
  if (patch.event) rec.history = [...(rec.history || []), { at: now, event: patch.event }].slice(-30);
  Object.assign(rec, Object.fromEntries(Object.entries(patch).filter(([k]) => k !== 'event')));
  rec.updatedAt = now;
  if (!prev) rec.history = [{ at: now, status: rec.status }, ...rec.history.filter((h) => h.event)];
  state.crm.set(rec.id, rec);
  await store.crmPut(rec);
  if (!silent) { renderCrmBadge(); }
  return rec;
}

async function removeCrm(id) {
  state.crm.delete(id);
  await store.crmDelete(id);
  renderCrmBadge();
}

function renderCrmBadge() {
  const open = [...state.crm.values()].filter((r) => !CLOSED_STATUSES.has(r.status)).length;
  const b = $('#crm-badge');
  b.hidden = !open;
  b.textContent = String(open);
  const due = [...state.crm.values()].filter((r) => r.status === 'rappeler' && r.callbackAt && r.callbackAt < endOfToday()).length;
  b.title = due ? `${due} rappel(s) à faire aujourd'hui` : '';
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

/** Lieu affichable pour une fiche CRM : résultats courants, cache (30 jours) ou instantané conservé. */
async function placeForCrm(rec) {
  const live = state.byId.get(rec.id);
  if (live) return live;
  const cached = await store.getPlace(rec.id);
  if (cached && cached.fetchedAt > Date.now() - GOOGLE_TTL_MS) return decorate(cached);
  if (rec.snap?.name) return decorate({ id: rec.id, source: rec.source, reviews: null, rating: null, ...rec.snap });
  return decorate({
    id: rec.id, source: rec.source, expired: true, name: rec.contactName || 'Lieu Google (contenu effacé après 30 jours)',
    address: '', phone: '', website: { status: 'none' }, reviews: null, rating: null, categories: rec.snap?.categories || [],
    mapsUrl: rec.googleId ? `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(rec.googleId)}` : '',
  });
}

async function renderCrm() {
  renderCrmBadge();
  const recs = [...state.crm.values()];
  const counts = Object.fromEntries(STATUSES.map((s) => [s.id, 0]));
  for (const r of recs) counts[r.status] = (counts[r.status] || 0) + 1;
  $('#crm-pipeline').innerHTML = [`<button type="button" class="stage-btn" data-f="all" aria-pressed="${state.crmFilter === 'all'}"><span class="stage-btn__v">${recs.length}</span><span class="stage-btn__l">Tous</span></button>`,
    ...STATUSES.filter((s) => s.id !== 'opposition').map((s) => `<button type="button" class="stage-btn" data-f="${s.id}" aria-pressed="${state.crmFilter === s.id}"><span class="stage-btn__v">${counts[s.id] || 0}</span><span class="stage-btn__l">${escapeHtml(s.label.replace('…', ''))}</span></button>`)].join('');

  const now = Date.now();
  const due = recs.filter((r) => r.status === 'rappeler' && r.callbackAt && r.callbackAt < endOfToday());
  const late = due.filter((r) => r.callbackAt < now);
  const dueEl = $('#crm-due');
  dueEl.hidden = !due.length;
  if (due.length) {
    dueEl.innerHTML = `<span><strong>${plural(due.length, 'rappel', 'rappels')}</strong> à faire aujourd'hui${late.length ? ` dont ${late.length} en retard` : ''}.</span><button type="button" class="btn btn--gold btn--sm" id="due-session">Appeler maintenant</button>`;
    $('#due-session').addEventListener('click', () => startSession(due.sort((a, b) => a.callbackAt - b.callbackAt).map((r) => r.id)));
  }

  const q = $('#crm-text').value.trim().toLowerCase();
  const sort = $('#crm-sort').value;
  const rows = [];
  for (const r of recs) {
    if (state.crmFilter !== 'all' && r.status !== state.crmFilter) continue;
    if (state.crmFilter === 'all' && r.status === 'opposition') continue;
    const p = await placeForCrm(r);
    if (q && !`${p.name} ${p.address} ${r.notes} ${r.contactName}`.toLowerCase().includes(q)) continue;
    rows.push({ r, p });
  }
  const sorters = {
    callback: (a, b) => (a.r.callbackAt || Infinity) - (b.r.callbackAt || Infinity) || b.r.updatedAt - a.r.updatedAt,
    updated: (a, b) => b.r.updatedAt - a.r.updatedAt,
    score: (a, b) => b.p.score - a.p.score,
    name: (a, b) => a.p.name.localeCompare(b.p.name, 'fr'),
  };
  rows.sort(sorters[sort] || sorters.callback);
  state.crmRows = rows;
  $('#crm-list').innerHTML = rows.map(({ r, p }) => {
    const isDue = r.status === 'rappeler' && r.callbackAt && r.callbackAt < endOfToday();
    const phone = p.phone ? `<a class="r-phone" href="${telHref(p.phoneIntl || p.phone)}"><svg aria-hidden="true"><use href="#i-phone"/></svg>${escapeHtml(formatPhoneFR(p.phone))}</a>` : '';
    return `<article class="crm-card${isDue ? ' is-due' : ''}" data-id="${escapeHtml(r.id)}">
      <div class="crm-card__top">${p.expired ? '' : scoreRing(p)}<div>
        <button type="button" class="crm-card__name" data-open="${escapeHtml(r.id)}">${escapeHtml(p.name)}</button>
        <p class="crm-card__meta">${escapeHtml([catLine(p), p.city || cityFromAddress(p.address)].filter(Boolean).join(' · '))}</p>
      </div></div>
      <div class="crm-card__row">${statusBadge(r)}${p.expired ? '' : siteBadge(p)}${r.source === 'demo' ? '<span class="badge badge--demo">démo</span>' : ''}${r.source === 'osm' ? '<span class="badge badge--osm">OSM</span>' : ''}</div>
      ${p.expired ? '<p class="crm-card__expired">Contenu Google effacé après 30 jours : ouvrez la fiche pour l\'actualiser.</p>' : ''}
      ${r.notes ? `<p class="crm-card__note">${escapeHtml(r.notes)}</p>` : ''}
      <div class="crm-card__row">${phone}<span class="crm-card__when">${r.contactName ? `Contact : ${escapeHtml(r.contactName)} · ` : ''}Modifié le ${fmtDate(r.updatedAt)}</span></div>
    </article>`;
  }).join('');
  $('#crm-empty').hidden = rows.length > 0;
  if (recs.length && !rows.length) {
    $('#crm-empty .empty__title').textContent = 'Aucun prospect dans ce filtre.';
    $('#crm-empty .empty__text').textContent = 'Choisissez un autre statut ou effacez la recherche.';
  }
  $('#crm-session').disabled = !rows.some(({ r, p }) => p.phone && !CLOSED_STATUSES.has(r.status));
}

function initCrm() {
  $('#crm-pipeline').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    state.crmFilter = b.dataset.f;
    renderCrm();
  });
  $('#crm-text').addEventListener('input', debounce(renderCrm, 150));
  $('#crm-sort').addEventListener('change', renderCrm);
  $('#crm-list').addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const card = e.target.closest('[data-id]');
    if (card) openDrawer(card.dataset.id);
  });
  $('#crm-session').addEventListener('click', () => {
    const ids = (state.crmRows || []).filter(({ r, p }) => p.phone && !CLOSED_STATUSES.has(r.status)).map(({ r }) => r.id);
    startSession(ids);
  });
  $('#crm-export').addEventListener('click', () => openExport('crm'));
}

// ===========================================================================
// Fiche prospect
// ===========================================================================

async function resolvePlace(id) {
  if (state.byId.has(id)) return state.byId.get(id);
  const rec = crmOf(id);
  if (rec) return placeForCrm(rec);
  const cached = await store.getPlace(id);
  return cached ? decorate(cached) : null;
}

function tomorrowAt10() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d.getTime();
}

let drawerTab = 'script';

async function openDrawer(id, { focusCall = false } = {}) {
  const p = await resolvePlace(id);
  if (!p) { toast('Établissement introuvable.', 'warn'); return; }
  state.drawerId = id;
  renderDrawer(p);
  const d = $('#drawer');
  if (!d.open) d.showModal();
  map.highlight(id, true);
  if (state.view === 'search') map.panTo(id);
  const target = focusCall ? $('#d-call') : $('#d-close');
  (target || $('#d-close'))?.focus();
}

function renderDrawer(p) {
  const rec = crmOf(p.id);
  const status = rec?.status || '';
  const sess = state.session;
  const google = p.source === 'google' || p.verified === 'ok';
  const email = buildEmail(p, state.profile);
  const sms = buildSms(p, state.profile);
  const phoneTxt = formatPhoneFR(p.phone);
  const w = p.website || { status: 'none' };
  const city = p.city || cityFromAddress(p.address);

  const sessionBar = sess ? `<div class="d-session" role="group" aria-label="Session d'appels">
      <span><strong>Session d'appels</strong> · ${sess.index + 1} / ${sess.ids.length}</span>
      <div class="d-session__nav">
        <button type="button" class="btn btn--ghost btn--sm" data-act="prev" ${sess.index === 0 ? 'disabled' : ''}>Précédent</button>
        <button type="button" class="btn btn--ghost btn--sm" data-act="next">${sess.index + 1 >= sess.ids.length ? 'Terminer' : 'Suivant'}</button>
      </div></div>` : '';

  const stats = p.expired ? '' : `<div class="d-stats">
      <div class="d-scorebox">${scoreRing(p, true)}<small>${LEVELS[p.level].label}</small></div>
      <div class="d-stat"><span class="d-stat__v"><svg aria-hidden="true"><use href="#i-star"/></svg>${fmtRating(p.rating)}</span><span class="d-stat__l">note Google</span></div>
      <div class="d-stat"><span class="d-stat__v">${Number.isFinite(p.reviews) ? fmtInt(p.reviews) : '?'}</span><span class="d-stat__l">avis${Number.isFinite(p.reviews) ? '' : ' (inconnus)'}</span></div>
    </div>`;

  const call = p.phone ? `<div class="d-call">
      <a class="btn btn--gold btn--xl" id="d-call" href="${telHref(p.phoneIntl || p.phone)}"><svg aria-hidden="true"><use href="#i-phone"/></svg>Appeler ${escapeHtml(phoneTxt)}</a>
      ${isMobileFR(p.phone) ? `<a class="btn btn--ghost btn--xl" href="${escapeHtml(smsHref(p.phoneIntl || p.phone, sms))}">SMS</a>` : `<button type="button" class="btn btn--ghost btn--xl" data-copy-text="${escapeHtml(phoneTxt)}" aria-label="Copier le numéro"><svg aria-hidden="true"><use href="#i-copy"/></svg></button>`}
    </div>` : `<p class="hint">${p.expired ? 'Actualisez la fiche pour retrouver le numéro.' : 'Pas de numéro connu : cherchez-le sur la fiche Google Maps ou passez sur place.'}</p>`;

  const siteLink = w.url ? `<a class="btn btn--ghost btn--sm" href="${escapeHtml(w.url)}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-external"/></svg>${escapeHtml(w.status === 'social' ? (w.provider || 'Réseau') : (w.host || 'Site'))}</a>` : '';
  const links = `<div class="d-links">
      ${p.mapsUrl ? `<a class="btn btn--ghost btn--sm" href="${escapeHtml(p.mapsUrl)}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-pin"/></svg>Google Maps</a>` : ''}
      ${siteLink}
      ${p.osmUrl ? `<a class="btn btn--ghost btn--sm" href="${escapeHtml(p.osmUrl)}" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>` : ''}
      ${p.expired && rec?.googleId ? '<button type="button" class="btn btn--violet btn--sm" data-act="refresh">Actualiser depuis Google (1 requête)</button>' : ''}
    </div>`;

  const statusOpts = STATUSES.map((s) => `<label class="status-opt${s.id === 'opposition' ? ' status-opt--stop' : ''}"><input type="radio" name="d-status" value="${s.id}" ${status === s.id ? 'checked' : ''}><span>${escapeHtml(s.label)}</span></label>`).join('');
  const objections = buildObjections(state.profile).map(([q, a]) => `<dt>${escapeHtml(q)}</dt><dd>${escapeHtml(a)}</dd>`).join('');

  const scripts = {
    script: `<div class="d-script" id="d-text">${escapeHtml(buildCallScript(p, state.profile))}</div>`,
    email: `<p class="d-subject">Objet : <strong id="d-subject">${escapeHtml(email.subject)}</strong></p><div class="d-script" id="d-text">${escapeHtml(email.body)}</div>`,
    sms: `<div class="d-script" id="d-text">${escapeHtml(sms)}</div><p class="hint">${sms.length} caractères${sms.length > 160 ? ' (2 SMS)' : ''}.</p>`,
    objections: `<dl class="d-objections">${objections}</dl>`,
  };

  $('#drawer-body').innerHTML = `
    ${sessionBar}
    <div class="d-head">
      <div class="d-head__main">
        <h2 class="d-title" id="drawer-title">${escapeHtml(p.name)}</h2>
        <div class="d-sub">${escapeHtml(catLine(p))}${city ? ` · ${escapeHtml(city)}` : ''} ${p.expired ? '' : siteBadge(p)} <span id="d-status-badge">${statusBadge(rec)}</span>${p.source === 'demo' ? ' <span class="badge badge--demo">démo</span>' : ''}</div>
      </div>
      <button type="button" class="d-close" id="d-close" aria-label="Fermer la fiche"><svg aria-hidden="true"><use href="#i-close"/></svg></button>
    </div>
    ${stats}
    ${call}
    ${p.address ? `<div class="d-info"><div class="d-info__row"><svg aria-hidden="true"><use href="#i-pin"/></svg><span>${escapeHtml(p.address)}</span></div></div>` : ''}
    ${links}
    ${sess ? `<div class="d-quick" role="group" aria-label="Résultat de l'appel">
        <button type="button" class="btn btn--ghost" data-outcome="noanswer">Pas de réponse</button>
        <button type="button" class="btn btn--ghost" data-outcome="rappeler">À rappeler demain</button>
        <button type="button" class="btn btn--violet" data-outcome="interesse">Intéressé</button>
        <button type="button" class="btn btn--ghost" data-outcome="pas_interesse">Pas intéressé</button>
      </div>` : ''}
    <section class="d-section" aria-labelledby="d-suivi">
      <h3 class="d-section__title" id="d-suivi">Suivi</h3>
      <fieldset><legend class="sr-only">Statut</legend><div class="status-grid">${statusOpts}</div></fieldset>
      <div class="field" id="d-callback-row" ${status === 'rappeler' ? '' : 'hidden'}>
        <label for="d-callback">Rappeler le</label>
        <input type="datetime-local" id="d-callback" value="${escapeHtml(toLocalInput(rec?.callbackAt ?? tomorrowAt10()))}">
      </div>
      <div class="field"><label for="d-contact">Interlocuteur</label><input id="d-contact" placeholder="Prénom, fonction…" value="${escapeHtml(rec?.contactName || '')}"></div>
      <div class="field"><label for="d-notes">Notes</label><textarea id="d-notes" rows="3" placeholder="Ce qui a été dit, objections, prochaine étape…">${escapeHtml(rec?.notes || '')}</textarea></div>
      ${rec ? '<button type="button" class="btn btn--text btn--sm" data-act="remove">Retirer de ma liste</button>' : ''}
    </section>
    <section class="d-section" aria-labelledby="d-pitch">
      <h3 class="d-section__title" id="d-pitch">Argumentaire personnalisé</h3>
      <div class="d-tabs" role="tablist" aria-label="Type de message">
        ${[['script', 'Appel'], ['email', 'Email'], ['sms', 'SMS'], ['objections', 'Objections']].map(([k, l]) => `<button type="button" role="tab" class="d-tab" data-tab="${k}" aria-selected="${drawerTab === k}" aria-controls="d-panel" id="d-tab-${k}" tabindex="${drawerTab === k ? 0 : -1}">${l}</button>`).join('')}
      </div>
      <div id="d-panel" role="tabpanel" aria-labelledby="d-tab-${drawerTab}">${scripts[drawerTab]}</div>
      <div class="row-btns">
        ${drawerTab !== 'objections' ? '<button type="button" class="btn btn--violet btn--sm" data-act="copy"><svg aria-hidden="true"><use href="#i-copy"/></svg>Copier</button>' : ''}
        ${drawerTab === 'email' ? `<a class="btn btn--ghost btn--sm" href="mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}">Ouvrir dans ma messagerie</a>` : ''}
      </div>
    </section>
    <p class="d-foot">${google ? 'Données : <span class="google-attr">Google Maps</span>' : p.source === 'osm' ? 'Données © contributeurs OpenStreetMap (ODbL)' : p.source === 'demo' ? 'Données fictives de démonstration' : ''}${rec?.history?.length ? ` · ${rec.history.length} évènement${rec.history.length > 1 ? 's' : ''} de suivi` : ''}</p>`;
  state.drawerPlace = p;
}

async function setStatusFromDrawer(status, extra = {}) {
  const p = state.drawerPlace;
  if (!p) return;
  const patch = { status, ...extra };
  if (status === 'rappeler' && !extra.callbackAt) patch.callbackAt = fromLocalInput($('#d-callback')?.value) || tomorrowAt10();
  const rec = await saveCrm(p, patch);
  const badge = $('#d-status-badge');
  if (badge) badge.innerHTML = statusBadge(rec);
  const row = $('#d-callback-row');
  if (row) row.hidden = status !== 'rappeler';
  $$('input[name="d-status"]').forEach((r) => { r.checked = r.value === status; });
  if (status === 'opposition') toast('Noté : cet établissement ne sera plus proposé dans vos recherches.');
  renderResults();
  if (state.view === 'crm') renderCrm();
}

function initDrawer() {
  const d = $('#drawer');
  const body = $('#drawer-body');
  d.addEventListener('close', () => {
    if (state.drawerId) map.highlight(state.drawerId, false);
    state.drawerId = null;
    if (state.session) { state.session = null; toast('Session d\'appels terminée.'); }
  });
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  body.addEventListener('change', async (e) => {
    if (e.target.name === 'd-status') await setStatusFromDrawer(e.target.value);
    if (e.target.id === 'd-callback') {
      const t = fromLocalInput(e.target.value);
      if (t) await saveCrm(state.drawerPlace, { status: 'rappeler', callbackAt: t });
      $('#d-status-badge').innerHTML = statusBadge(crmOf(state.drawerPlace.id));
      renderResults();
    }
  });
  const saveText = debounce(async (field, value) => {
    const p = state.drawerPlace;
    if (!p) return;
    const rec = crmOf(p.id);
    if (!rec && !value.trim()) return;
    await saveCrm(p, { [field]: value });
    if (!rec) { $('#d-status-badge').innerHTML = statusBadge(crmOf(p.id)); $$('input[name="d-status"]').forEach((r) => { r.checked = r.value === 'a_appeler'; }); renderResults(); }
  }, 400);
  body.addEventListener('input', (e) => {
    if (e.target.id === 'd-notes') saveText('notes', e.target.value);
    if (e.target.id === 'd-contact') saveText('contactName', e.target.value);
  });
  body.addEventListener('click', async (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.id === 'd-close') { d.close(); return; }
    if (t.id === 'd-call') { saveCrm(state.drawerPlace, { event: 'appel' }, { silent: true }); return; }
    if (t.dataset.copyText) { copyText(t.dataset.copyText); return; }
    if (t.dataset.tab) {
      drawerTab = t.dataset.tab;
      renderDrawer(state.drawerPlace);
      $(`#d-tab-${drawerTab}`)?.focus();
      return;
    }
    const act = t.dataset.act;
    if (act === 'copy') {
      const text = drawerTab === 'email' ? `Objet : ${$('#d-subject').textContent}\n\n${$('#d-text').textContent}` : $('#d-text').textContent;
      copyText(text);
    } else if (act === 'remove') {
      await removeCrm(state.drawerPlace.id);
      renderDrawer(state.drawerPlace);
      renderResults();
      if (state.view === 'crm') renderCrm();
      toast('Retiré de votre liste.');
    } else if (act === 'refresh') {
      await refreshFromGoogle();
    } else if (act === 'next' || act === 'prev') {
      sessionStep(act === 'next' ? 1 : -1);
    }
    const outcome = t.dataset.outcome;
    if (outcome) {
      if (outcome === 'noanswer') {
        await setStatusFromDrawer('rappeler', { callbackAt: tomorrowAt10(), event: 'pas de réponse' });
      } else if (outcome === 'rappeler') {
        await setStatusFromDrawer('rappeler', { callbackAt: tomorrowAt10() });
      } else {
        await setStatusFromDrawer(outcome);
      }
      sessionStep(1);
    }
  });
  body.addEventListener('keydown', (e) => {
    const tab = e.target.closest('.d-tab');
    if (!tab || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const tabs = $$('.d-tab', body);
    const i = tabs.indexOf(tab);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    drawerTab = next.dataset.tab;
    renderDrawer(state.drawerPlace);
    $(`#d-tab-${drawerTab}`)?.focus();
  });
}

async function refreshFromGoogle() {
  const rec = crmOf(state.drawerPlace?.id);
  if (!rec?.googleId) return;
  if (!(await ensureLogin('Connectez-vous pour actualiser la fiche depuis Google.'))) return;
  try {
    const res = await api.details(rec.googleId);
    addUsage(res.requests || 1);
    const place = { ...res.place, categories: rec.snap?.categories || [] };
    if (rec.source === 'google') {
      await store.putPlaces([place]);
      renderDrawer(decorate(place));
    } else {
      toast('Fiche Google actualisée.');
    }
    if (state.view === 'crm') renderCrm();
  } catch (e) {
    toast(e.message, 'err');
  }
}

function startSession(ids) {
  if (!ids.length) { toast('Aucun prospect avec numéro à appeler dans cette liste.'); return; }
  state.session = { ids, index: 0 };
  openDrawer(ids[0], { focusCall: true });
}

function sessionStep(delta) {
  const s = state.session;
  if (!s) return;
  const next = s.index + delta;
  if (next >= s.ids.length) {
    state.session = null;
    $('#drawer').close();
    toast('Session terminée : bravo ! Retrouvez le suivi dans « Mes prospects ».');
    return;
  }
  s.index = Math.max(0, next);
  openDrawer(s.ids[s.index], { focusCall: true });
}

// ===========================================================================
// Export / import
// ===========================================================================

let exportScope = 'results';

async function exportRows() {
  if (exportScope === 'crm') {
    const rows = [];
    for (const r of state.crm.values()) rows.push({ p: await placeForCrm(r), r });
    return rows;
  }
  return filteredPlaces().map((p) => ({ p, r: crmOf(p.id) }));
}

async function openExport(scope) {
  exportScope = scope;
  const rows = await exportRows();
  $('#export-scope').textContent = scope === 'crm'
    ? `Votre suivi : ${plural(rows.length, 'prospect', 'prospects')}.`
    : `Résultats affichés (filtres actuels) : ${plural(rows.length, 'établissement', 'établissements')}.`;
  $('#export-dialog').showModal();
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function doExport(kind) {
  const rows = await exportRows();
  if (kind === 'json') {
    const data = { app: 'nexora-prospecteur', version: 1, exportedAt: new Date().toISOString(), crm: [...state.crm.values()] };
    download(`prospects-crm-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
    toast(`Sauvegarde : ${plural(data.crm.length, 'fiche', 'fiches')} exportée${data.crm.length > 1 ? 's' : ''}.`);
    return;
  }
  const full = kind === 'csv-full';
  const isGoogle = (p) => p.source === 'google' || p.verified === 'ok';
  const keep = (p, v) => (full || !isGoogle(p) ? v : '');
  const columns = [
    { label: 'Nom', get: ({ p }) => keep(p, p.name) },
    { label: 'Catégorie', get: ({ p }) => catLine(p) },
    { label: 'Note', get: ({ p }) => keep(p, Number.isFinite(p.rating) ? p.rating : '') },
    { label: 'Nombre d\'avis', get: ({ p }) => keep(p, Number.isFinite(p.reviews) ? p.reviews : '') },
    { label: 'Téléphone', get: ({ p }) => keep(p, formatPhoneFR(p.phone)) },
    { label: 'Lien d\'appel', get: ({ p }) => keep(p, p.phone ? telHref(p.phoneIntl || p.phone) : '') },
    { label: 'Adresse', get: ({ p }) => keep(p, p.address) },
    { label: 'Ville', get: ({ p }) => keep(p, p.city || cityFromAddress(p.address)) },
    { label: 'Statut du site', get: ({ p }) => keep(p, websiteLabel(p.website)) },
    { label: 'Lien site ou réseau', get: ({ p }) => keep(p, p.websiteUri || '') },
    { label: 'Score', get: ({ p }) => (p.expired ? '' : p.score) },
    { label: 'Niveau', get: ({ p }) => (p.expired ? '' : LEVELS[p.level].label) },
    { label: 'Google Maps', get: ({ p }) => p.mapsUrl || '' },
    { label: 'Source', get: ({ p }) => ({ google: 'Google Maps', osm: 'OpenStreetMap', demo: 'Démonstration' }[p.source] || p.source) + (p.verified === 'ok' ? ' + Google' : '') },
    { label: 'Suivi', get: ({ r }) => (r ? STATUS_LABEL[r.status] : '') },
    { label: 'Rappel', get: ({ r }) => (r?.callbackAt ? fmtDateTime(r.callbackAt) : '') },
    { label: 'Interlocuteur', get: ({ r }) => r?.contactName || '' },
    { label: 'Notes', get: ({ r }) => r?.notes || '' },
    { label: 'Identifiant', get: ({ p }) => p.googleId || p.id },
  ];
  const csv = toCSV(rows, columns);
  download(`prospects-${full ? 'liste-appel' : 'suivi'}-${stamp()}.csv`, csv, 'text/csv;charset=utf-8');
  toast(`${plural(rows.length, 'ligne exportée', 'lignes exportées')} (CSV Excel).`);
}

async function importJson(file) {
  try {
    const data = JSON.parse(await file.text());
    if (data?.app !== 'nexora-prospecteur' || !Array.isArray(data.crm)) throw new Error('Ce fichier n\'est pas une sauvegarde du Prospecteur.');
    let added = 0;
    let updated = 0;
    const ok = [];
    for (const r of data.crm) {
      if (!r || typeof r.id !== 'string' || !STATUS_LABEL[r.status]) continue;
      const rec = {
        id: r.id.slice(0, 300), source: ['google', 'osm', 'demo'].includes(r.source) ? r.source : 'osm', status: r.status,
        notes: String(r.notes || '').slice(0, 5000), contactName: String(r.contactName || '').slice(0, 200),
        callbackAt: Number.isFinite(r.callbackAt) ? r.callbackAt : null, createdAt: Number(r.createdAt) || Date.now(),
        updatedAt: Number(r.updatedAt) || Date.now(), history: Array.isArray(r.history) ? r.history.slice(-30) : [],
        snap: r.snap && typeof r.snap === 'object' ? r.snap : {}, googleId: typeof r.googleId === 'string' ? r.googleId : null,
      };
      const prev = state.crm.get(rec.id);
      if (prev && prev.updatedAt >= rec.updatedAt) continue;
      if (prev) updated++; else added++;
      state.crm.set(rec.id, rec);
      ok.push(rec);
    }
    await store.crmPutMany(ok);
    renderCrmBadge();
    renderResults();
    if (state.view === 'crm') renderCrm();
    toast(`Import : ${added} ajouté${added > 1 ? 's' : ''}, ${updated} mis à jour.`);
  } catch (e) {
    toast(e.message || 'Import impossible.', 'err');
  }
}

function initExport() {
  const d = $('#export-dialog');
  d.addEventListener('click', async (e) => {
    if (e.target === d) { d.close(); return; }
    const b = e.target.closest('[data-export]');
    if (b) { await doExport(b.dataset.export); d.close(); }
  });
  $('#export-close').addEventListener('click', () => d.close());
  $('#import-file').addEventListener('change', async (e) => {
    const f = e.target.files?.[0];
    if (f) await importJson(f);
    e.target.value = '';
    d.close();
  });
}

// ===========================================================================
// Réglages
// ===========================================================================

function renderUsage() {
  const used = usedThisMonth();
  const free = Number(state.settings.freeQuota) || 0;
  $('#usage-month').textContent = `Ce mois : ${fmtInt(used)} / ${fmtInt(free)} req. offertes`;
}

function renderConn() {
  const pill = $('#conn-pill');
  pill.classList.remove('is-on', 'is-warn');
  const fn = state.fn;
  let txt = 'Google : vérification…';
  if (fn?.error) txt = 'Google : fonction absente';
  else if (fn && !fn.ready) { txt = 'Google : à configurer'; pill.classList.add('is-warn'); }
  else if (fn && api.loggedIn) { txt = 'Google : connecté'; pill.classList.add('is-on'); }
  else if (fn) { txt = 'Google : se connecter'; pill.classList.add('is-warn'); }
  pill.textContent = txt;
  if (state.view === 'settings') renderSettings();
}

async function checkFunction() {
  try {
    const s = await api.status();
    state.fn = { ready: s.ready, missing: s.missing || [], dailyLimit: s.dailyLimit };
  } catch (e) {
    state.fn = { error: e.message || 'injoignable', code: e.code };
  }
  renderConn();
}

async function renderSettings() {
  const fn = state.fn;
  const el = $('#fn-status');
  if (!fn) el.textContent = 'Vérification de la fonction serveur…';
  else if (fn.error) el.innerHTML = `La fonction <code>/api/places</code> ne répond pas ici (${escapeHtml(fn.error)}). En local, utilisez la démonstration ou le mode OpenStreetMap ; en ligne, publiez le site sur Netlify (voir README).`;
  else if (!fn.ready) el.innerHTML = `Fonction en ligne, mais configuration incomplète. Variables manquantes dans Netlify : ${fn.missing.map((m) => `<code>${escapeHtml(m)}</code>`).join(', ')}.`;
  else el.innerHTML = `Fonction prête : clé Google et mot de passe configurés côté serveur (plafond de ${fmtInt(fn.dailyLimit)} requêtes par jour). ${api.loggedIn ? `<strong>Connecté</strong> jusqu'au ${escapeHtml(fmtDateTime(api.session.exp))}.` : 'Connectez-vous pour lancer des recherches.'}`;
  $('#login-form').hidden = api.loggedIn || Boolean(fn?.error);
  $('#logout').hidden = !api.loggedIn;
  $('#price-req').value = String(state.settings.price);
  $('#free-quota').value = String(state.settings.freeQuota);
  const form = $('#profile-form');
  for (const [k, v] of Object.entries(state.profile)) { if (form.elements[k] && document.activeElement !== form.elements[k]) form.elements[k].value = v; }
  const c = await store.counts();
  $('#cache-stats').textContent = `${plural(c.places, 'lieu', 'lieux')} en cache · ${plural(c.cells, 'cellule interrogée', 'cellules interrogées')} · ${plural(c.crm, 'prospect suivi', 'prospects suivis')}. Stockage : ${store.persistent ? 'base locale de ce navigateur' : 'mémoire seulement (navigation privée : rien ne sera conservé)'}. Le contenu Google est effacé automatiquement après 30 jours.`;
}

function initSettings() {
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('#login-msg');
    msg.className = 'form-msg';
    msg.textContent = '';
    try {
      await api.login($('#login-pw').value, { remember: $('#login-remember').checked });
      $('#login-pw').value = '';
      msg.className = 'form-msg is-ok';
      msg.textContent = 'Connecté.';
      renderConn();
    } catch (err) {
      msg.textContent = err.message;
    }
  });
  $('#logout').addEventListener('click', () => { api.logout(); renderConn(); toast('Déconnecté.'); });
  $('#price-req').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    if (v >= 0) { state.settings.price = v; saveSettings(); scheduleEstimate(); renderResults(); }
  });
  $('#free-quota').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    if (v >= 0) { state.settings.freeQuota = v; saveSettings(); renderUsage(); scheduleEstimate(); }
  });
  $('#profile-form').addEventListener('input', (e) => {
    if (!e.target.name) return;
    state.profile[e.target.name] = e.target.value;
    ls.set('nxp.profile', state.profile);
  });
  $('#gen-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('#gen-pw').value;
    const msg = $('#gen-msg');
    msg.className = 'form-msg';
    if (pw !== $('#gen-pw2').value) { msg.textContent = 'Les deux mots de passe ne correspondent pas.'; return; }
    const s = passwordStrength(pw);
    if (!s.ok) { msg.textContent = 'Mot de passe trop faible : 12 caractères ou plus, en mélangeant lettres, chiffres et symboles.'; return; }
    msg.className = 'form-msg is-ok';
    msg.textContent = 'Calcul en cours…';
    try {
      const hash = await hashPassword(pw);
      $('#gen-hash').textContent = hash;
      $('#gen-secret').textContent = randomSecret(32);
      $('#gen-out').hidden = false;
      msg.textContent = `Empreinte générée (robustesse : ${s.level}). Copiez les deux valeurs dans Netlify puis redéployez.`;
      $('#gen-pw').value = '';
      $('#gen-pw2').value = '';
    } catch {
      msg.className = 'form-msg';
      msg.textContent = 'Calcul impossible : ce navigateur ne permet pas le chiffrement ici (page en HTTPS ou localhost requise).';
    }
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-copy]');
    if (b) copyText($(`#${b.dataset.copy}`).textContent);
  });
  $('#purge').addEventListener('click', async () => {
    const r = await store.purgeExpired();
    toast(`${plural(r.places, 'lieu effacé', 'lieux effacés')}, ${plural(r.cells, 'cellule', 'cellules')}.`);
    renderSettings();
  });
  $('#clear-cache').addEventListener('click', async () => {
    const ok = await askConfirm({ title: 'Vider le cache ?', text: 'Les prochaines recherches Google sur les mêmes zones seront de nouveau facturées. Votre suivi (CRM) est conservé.', ok: 'Vider le cache' });
    if (!ok) return;
    await store.clearCache();
    toast('Cache vidé.');
    renderSettings();
    scheduleEstimate();
  });
}

// ===========================================================================
// Démarrage
// ===========================================================================

async function restoreLast() {
  const last = ls.get('nxp.last', null);
  if (!last?.ids?.length || !last.meta) return;
  const places = await store.getPlaces(last.ids);
  if (!places.length) return;
  setResults(places, last.meta, { fit: false });
}

async function boot() {
  if (!globalThis.L) {
    document.body.insertAdjacentHTML('afterbegin', '<p class="demo-banner">La carte n\'a pas pu se charger. Rechargez la page.</p>');
    return;
  }
  store = await openStore();
  try { await store.purgeExpired(); } catch { /* base indisponible */ }
  for (const r of await store.crmAll()) state.crm.set(r.id, r);

  map = new MapView($('#map'), {
    wrap: $('.map-wrap'),
    onZoneChange,
    onMarkerClick: (id) => openDrawer(id),
    onMarkerHover: (id, on) => {
      const tr = $(`#results-body tr[data-id="${CSS.escape(id)}"]`);
      tr?.classList.toggle('is-hl', on);
    },
    onDrawState: (on) => { $('#draw-rect').textContent = on ? 'Tracez sur la carte… (Échap pour annuler)' : 'Tracer un rectangle sur la carte'; },
  });

  initTabs();
  initPlaceSearch();
  initZoneControls();
  initCategories();
  initSource();
  initResults();
  initCrm();
  initDrawer();
  initExport();
  initSettings();

  map.drawZone();
  onZoneChange();
  renderUsage();
  renderCrmBadge();
  renderResults();
  await restoreLast();
  checkFunction();
  document.documentElement.dataset.ready = 'true';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
