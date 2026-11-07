// Synapse — interface : saisie, analyse animée, fiche, carte mentale,
// cartes à retourner (répétition espacée), quiz, frise, partage, bibliothèque.

import { analyze, makeCards, makeQuiz, sentences } from './extract.js';
import { SAMPLES } from './samples.js';
import { Library, dueCards, grade, mastery, cardState, BOXES, encodeShare, decodeShare } from './store.js';
import { renderMindmap } from './mindmap.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? Math.min(ms, 60) : ms));
const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;
/** « Le 5 mai 1789, les États… » → « Les États… » (la date est déjà affichée). */
const withoutDate = (d) => d.text.replace(new RegExp(`^(?:le |en |dans la nuit du |depuis |vers )?${d.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},?\\s*`, 'i'), '').replace(/^./, (c) => c.toUpperCase());

const state = { a: null, cards: [], deck: null, tab: 'fiche', mm: null };

// ——— Saisie ——————————————————————————————————————————————————————

const src = $('#source');
function countWords() {
  const n = (src.value.match(/\S+/g) || []).length;
  $('#wordCount').textContent = plural(n, 'mot');
  $('#btnGenerate').disabled = n < 15;
}
src.addEventListener('input', countWords);
src.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !$('#btnGenerate').disabled) generate(); });
for (const s of SAMPLES) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.textContent = s.label;
  b.addEventListener('click', () => { src.value = s.text; countWords(); generate(); });
  $('#samples').append(b);
}
$('#fileInput').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  if (f.size > 1_000_000) { toast('Fichier trop volumineux (1 Mo au plus).'); return; }
  src.value = await f.text();
  countWords();
  toast(`« ${f.name} » importé.`);
});
$('#btnGenerate').addEventListener('click', () => generate());

// ——— Navigation ——————————————————————————————————————————————————

function show(screen) {
  for (const id of ['screenInput', 'screenDeck', 'screenLib', 'scan']) $(`#${id}`).hidden = id !== screen;
  $('#navNew').toggleAttribute('aria-current', screen === 'screenInput');
  $('#navLib').toggleAttribute('aria-current', screen === 'screenLib');
  if (screen === 'screenLib') renderLib();
  window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
}
$('#navNew').addEventListener('click', () => { show('screenInput'); src.focus(); });
$('#navLib').addEventListener('click', () => show('screenLib'));
$('#btnEdit').addEventListener('click', () => { src.value = state.deck?.text || src.value; countWords(); show('screenInput'); src.focus(); });

// ——— Analyse animée ——————————————————————————————————————————————

async function generate(text = src.value, { animate = true, title } = {}) {
  const a = analyze(text);
  if (title) a.title = title;
  const cards = makeCards(a);
  state.a = a; state.cards = cards;
  state.deck = Library.save(a.title, text);
  history.replaceState(null, '', location.pathname);
  if (animate && !reduced()) await scanAnimation(text, a, cards);
  renderDeck();
  show('screenDeck');
  selectTab('fiche');
  updateLibCount();
}

async function scanAnimation(text, a, cards) {
  const paper = $('#scanPaper');
  paper.innerHTML = text.split('\n').filter((l) => l.trim()).slice(0, 28).map((l) => `<p>${esc(l.replace(/^#+\s*/, '').slice(0, 120))}</p>`).join('');
  const steps = [
    ['Lecture du plan', plural(a.sections.filter((s) => s.heading).length, 'partie')],
    ['Définitions', plural(a.definitions.length, 'notion')],
    ['Dates et formules', `${plural(a.dates.length, 'date')} · ${plural(a.formulas.length, 'formule')}`],
    ['Listes et sigles', `${plural(a.lists.length, 'liste')} · ${plural(a.acronyms.length, 'sigle')}`],
    ['Cartes de révision', plural(cards.length, 'carte')],
  ];
  const ol = $('#scanSteps');
  ol.innerHTML = steps.map(([t]) => `<li><span class="dot"></span><span>${esc(t)}</span><b></b></li>`).join('');
  show('scan');
  paper.classList.remove('is-scanning'); void paper.offsetWidth; paper.classList.add('is-scanning');
  const lis = $$('li', ol);
  for (let i = 0; i < steps.length; i++) {
    lis[i].classList.add('is-on');
    await wait(260);
    lis[i].querySelector('b').textContent = steps[i][1];
    lis[i].classList.add('is-done');
  }
  await wait(380);
}

// ——— Résultat ————————————————————————————————————————————————————

function renderDeck() {
  const { a, cards } = state;
  $('#deckTitle').textContent = a.title;
  $('#deckMeta').textContent = `${plural(a.stats.words, 'mot')} · ${a.stats.minutes} min de lecture`;
  const stats = [
    [a.definitions.length, 'définition'], [a.dates.length, 'date'], [a.formulas.length, 'formule'],
    [a.lists.length, 'liste'], [cards.length, 'carte'],
  ].filter(([n]) => n);
  $('#deckStats').innerHTML = stats.map(([n, w], i) => `<li style="--i:${i}"><b data-n="${n}">0</b> ${esc(n > 1 ? `${w}s` : w)}</li>`).join('');
  for (const b of $$('#deckStats b')) countUp(b, +b.dataset.n);
  renderPaper();
  updateDue();
  $('#tab-frise').hidden = a.dates.length < 2;
  $('#tab-quiz').hidden = a.definitions.length < 3;
  state.mm = null;
}

function countUp(el, n) {
  if (reduced()) { el.textContent = n; return; }
  const t0 = performance.now();
  const step = (t) => { const k = Math.min(1, (t - t0) / 700); el.textContent = Math.round(n * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

/** Met en valeur les mots-clés (première occurrence) dans un texte déjà échappé. */
function marks(html, used) {
  for (const k of state.a.keywords.slice(0, 10)) {
    if (used.has(k.term)) continue;
    const re = new RegExp(`(^|[^\\p{L}])(${k.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![\\p{L}])`, 'iu');
    if (re.test(html)) { html = html.replace(re, '$1<mark>$2</mark>'); used.add(k.term); }
  }
  return html;
}

function renderPaper() {
  const { a } = state;
  const used = new Set();
  const taken = new Set([...a.definitions.map((d) => d.source), ...a.dates.map((d) => d.text.replace(/\.$/, '')), ...a.formulas.map((f) => f.context.replace(/\.$/, ''))]);
  const parts = [];
  parts.push(`<header class="paper__head"><p class="paper__kicker">Fiche de révision</p><h1>${esc(a.title)}</h1>
    <p class="paper__meta">${esc(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }))} · ${plural(a.definitions.length, 'notion')} · ${plural(state.cards.length, 'carte')}</p></header>`);
  if (a.keywords.length) parts.push(`<section class="paper__keys"><h2>L’essentiel en un coup d’œil</h2><p>${a.keywords.slice(0, 12).map((k, i) => `<span class="kw" style="--w:${Math.min(1, k.score / (a.keywords[0].score || 1))};--i:${i}">${esc(k.term)}</span>`).join('')}</p></section>`);
  let n = 0;
  for (const sec of a.sections) {
    const h = sec.heading;
    const defs = a.definitions.filter((d) => d.section === h);
    const forms = a.formulas.filter((f) => f.section === h);
    const lists = a.lists.filter((l) => l.section === h);
    const dates = a.dates.filter((d) => d.section === h);
    const ideas = [];
    for (const blk of sec.blocks || []) {
      if (blk.type !== 'p') continue;
      for (const s of sentences(blk.text)) {
        const t = s.replace(/\.$/, '');
        if (taken.has(s) || taken.has(t) || /:\s*$/.test(s) || ideas.length >= 3) continue;
        ideas.push(s);
      }
    }
    if (!h && !defs.length && !ideas.length && !lists.length) continue;
    n++;
    let body = '';
    if (defs.length) body += `<dl class="defs">${defs.map((d) => `<div><dt>${esc(d.term)}</dt><dd>${esc(d.def)}</dd></div>`).join('')}</dl>`;
    if (forms.length) body += forms.map((f) => `<div class="formula"><span>${esc(f.formula)}</span></div>`).join('');
    if (lists.length) body += lists.map((l) => `<div class="plist"><p>${esc(l.label)}</p><ol>${l.items.map((x) => `<li>${esc(x)}</li>`).join('')}</ol></div>`).join('');
    if (dates.length) body += `<ul class="pdates">${dates.map((d) => `<li><b>${esc(d.label)}</b><span>${marks(esc(withoutDate(d)), used)}</span></li>`).join('')}</ul>`;
    if (ideas.length) body += `<ul class="ideas">${ideas.map((s) => `<li>${marks(esc(s), used)}</li>`).join('')}</ul>`;
    parts.push(`<section class="psec" style="--i:${n}">${h ? `<h2><span class="psec__n">${String(n).padStart(2, '0')}</span>${esc(h)}</h2>` : ''}${body}</section>`);
  }
  const check = state.cards.filter((c) => c.kind !== 'date').slice(0, 4);
  if (check.length) parts.push(`<section class="paper__check"><h2>Je vérifie que j’ai compris</h2>${check.map((c) => `<details><summary>${esc(c.q)}</summary><p>${esc(c.a).replace(/\n/g, '<br>')}</p></details>`).join('')}</section>`);
  $('#paper').innerHTML = parts.join('');
}

// ——— Onglets ————————————————————————————————————————————————————

const TABS = ['fiche', 'carte', 'cartes', 'quiz', 'frise'];
function selectTab(name) {
  state.tab = name;
  for (const t of TABS) {
    const tab = $(`#tab-${t}`), on = t === name;
    tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1;
    $(`#view-${t}`).hidden = !on;
  }
  if (name === 'carte') { state.mm = renderMindmap($('#mm'), state.a, showTip); }
  if (name === 'cartes') startStudy();
  if (name === 'quiz') startQuiz();
  if (name === 'frise') renderFrise();
}
for (const t of TABS) {
  const tab = $(`#tab-${t}`);
  tab.addEventListener('click', () => selectTab(t));
  tab.addEventListener('keydown', (e) => {
    const vis = TABS.filter((x) => !$(`#tab-${x}`).hidden);
    const i = vis.indexOf(t);
    const j = e.key === 'ArrowRight' ? (i + 1) % vis.length : e.key === 'ArrowLeft' ? (i - 1 + vis.length) % vis.length : -1;
    if (j >= 0) { e.preventDefault(); selectTab(vis[j]); $(`#tab-${vis[j]}`).focus(); }
  });
}

// ——— Carte mentale ———————————————————————————————————————————————

function showTip(leaf, ev) {
  const tip = $('#mmTip');
  if (!leaf) { tip.hidden = true; return; }
  tip.innerHTML = `<b>${esc(leaf.label)}</b><span>${esc(leaf.tip)}</span>`;
  tip.hidden = false;
  const wrap = $('#mmWrap').getBoundingClientRect();
  const r = (ev?.target?.closest?.('g') || ev?.target)?.getBoundingClientRect?.();
  if (r) {
    const x = Math.min(wrap.width - 300, Math.max(10, r.left - wrap.left + r.width / 2 - 140));
    const y = r.bottom - wrap.top + 10 > wrap.height - 120 ? r.top - wrap.top - tip.offsetHeight - 10 : r.bottom - wrap.top + 10;
    tip.style.transform = `translate(${x}px, ${Math.max(8, y)}px)`;
  }
}
$('#mmIn').addEventListener('click', () => state.mm?.zoom(1.25));
$('#mmOut').addEventListener('click', () => state.mm?.zoom(0.8));
$('#mmReset').addEventListener('click', () => state.mm?.reset());

// ——— Cartes (répétition espacée) ———————————————————————————————————

const study = { queue: [], i: 0, flipped: false, done: 0, ok: 0, retried: new Set() };

function updateDue() {
  const due = dueCards(Library.get(state.deck.id), state.cards).length;
  $('#dueBadge').textContent = due ? String(due) : '';
}

function startStudy(all = false) {
  const deck = Library.get(state.deck.id);
  study.queue = all ? [...state.cards].sort(() => Math.random() - 0.5) : dueCards(deck, state.cards);
  study.i = 0; study.done = 0; study.ok = 0; study.flipped = false; study.retried = new Set();
  renderStudy();
}

function boxesHtml() {
  const m = mastery(Library.get(state.deck.id), state.cards);
  const max = Math.max(1, ...m.boxes);
  return `<div class="boxes" aria-label="Répartition des cartes par boîte">${m.boxes.map((n, i) => `<div class="box"><i style="--h:${n / max}"></i><b>${n}</b><span>${i === 0 ? 'Nouvelles' : `J+${BOXES[i]}`}</span></div>`).join('')}</div>
    <p class="mastery"><b>${state.cards.length - m.boxes[0]} / ${state.cards.length}</b> cartes apprises · <b>${Math.round(m.mastered * 100)} %</b> maîtrisé${Library.get(state.deck.id)?.streak > 1 ? ` · série de ${Library.get(state.deck.id).streak} jours` : ''}</p>
    <p class="hint">Les cartes reviennent au bon moment : J+1, J+3, J+7 puis J+16 si vous les savez.</p>`;
}

function renderStudy() {
  const el = $('#study');
  const card = study.queue[study.i];
  if (!card) {
    const nothing = study.done === 0;
    el.innerHTML = `<div class="done">${nothing ? '<p class="done__big">Tout est à jour.</p><p>Aucune carte à revoir pour l’instant : revenez plus tard, la répétition espacée s’occupe du calendrier.</p>'
      : `<p class="done__big">Session terminée</p><p>${study.ok} / ${study.done} réussies du premier coup.</p>`}
      ${boxesHtml()}<button type="button" class="btn btn--primary" id="studyAll">Réviser toutes les cartes</button></div>`;
    $('#studyAll').addEventListener('click', () => startStudy(true));
    if (!nothing && study.ok / study.done >= 0.7) confetti();
    updateDue();
    return;
  }
  const st = cardState(Library.get(state.deck.id), card);
  el.innerHTML = `<div class="studybar"><span>Carte ${study.i + 1} / ${study.queue.length}</span><span class="pbar"><i style="width:${(study.i / study.queue.length) * 100}%"></i></span><span>Boîte ${st.box + 1}</span></div>
    <div class="flip" id="flip" tabindex="0" role="button" aria-label="Retourner la carte">
      <div class="flip__inner">
        <div class="face face--front"><span class="kind">${esc(card.kind)}</span><p class="q">${esc(card.q)}</p><span class="tap">Touchez ou appuyez sur Espace pour voir la réponse</span></div>
        <div class="face face--back"><span class="kind">${esc(card.section || 'réponse')}</span><p class="a">${esc(card.a).replace(/\n/g, '<br>')}</p>${card.full ? `<p class="full">${esc(card.full)}</p>` : ''}</div>
      </div>
    </div>
    <div class="grade" id="grade" hidden>
      <button type="button" class="btn btn--ko" id="gKo">À revoir <kbd>←</kbd></button>
      <button type="button" class="btn btn--ok" id="gOk">Je savais <kbd>→</kbd></button>
    </div>
    <p class="hint">Glissez la carte à gauche ou à droite après l’avoir retournée.</p>`;
  const flip = $('#flip');
  flip.addEventListener('click', () => doFlip());
  $('#gKo').addEventListener('click', () => answer(false));
  $('#gOk').addEventListener('click', () => answer(true));
  // Glisser au doigt ou à la souris.
  let x0 = null;
  flip.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
  flip.addEventListener('pointermove', (e) => { if (x0 !== null && study.flipped) flip.style.transform = `translateX(${e.clientX - x0}px) rotate(${(e.clientX - x0) / 25}deg)`; });
  flip.addEventListener('pointerup', (e) => {
    const dx = x0 === null ? 0 : e.clientX - x0;
    x0 = null;
    if (study.flipped && Math.abs(dx) > 90) { answer(dx > 0); return; }
    flip.style.transform = '';
  });
  flip.focus({ preventScroll: true });
}

function doFlip() {
  if (study.flipped) return;
  study.flipped = true;
  $('#flip').classList.add('is-flipped');
  $('#grade').hidden = false;
}

function answer(known) {
  if (!study.flipped) { doFlip(); return; }
  const card = study.queue[study.i];
  const flip = $('#flip');
  flip.classList.add(known ? 'is-out-right' : 'is-out-left');
  grade(state.deck.id, card, known);
  if (!study.retried.has(card.id)) { study.done++; if (known) study.ok++; }
  if (!known && !study.retried.has(card.id)) { study.retried.add(card.id); study.queue.push(card); }
  setTimeout(() => { study.i++; study.flipped = false; renderStudy(); }, reduced() ? 0 : 260);
}

document.addEventListener('keydown', (e) => {
  if (state.tab !== 'cartes' || $('#screenDeck').hidden || e.target.closest('input, textarea')) return;
  if (!$('#flip')) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doFlip(); }
  else if (e.key === 'ArrowRight' && study.flipped) answer(true);
  else if (e.key === 'ArrowLeft' && study.flipped) answer(false);
});

// ——— Quiz —————————————————————————————————————————————————————————

const quiz = { list: [], i: 0, score: 0 };
function startQuiz() {
  quiz.list = makeQuiz(state.a).slice(0, 10);
  quiz.i = 0; quiz.score = 0;
  renderQuiz();
}
function renderQuiz() {
  const el = $('#quiz');
  const q = quiz.list[quiz.i];
  if (!q) {
    const pct = Math.round((quiz.score / quiz.list.length) * 100);
    el.innerHTML = `<div class="done"><p class="done__big">${quiz.score} / ${quiz.list.length}</p><p>${pct >= 80 ? 'Excellent, c’est maîtrisé.' : pct >= 50 ? 'Bien. Repassez les cartes ratées.' : 'Relisez la fiche, puis retentez.'}</p><button type="button" class="btn btn--primary" id="quizAgain">Nouveau quiz</button></div>`;
    $('#quizAgain').addEventListener('click', startQuiz);
    if (pct >= 80) confetti();
    return;
  }
  el.innerHTML = `<div class="studybar"><span>Question ${quiz.i + 1} / ${quiz.list.length}</span><span class="pbar"><i style="width:${(quiz.i / quiz.list.length) * 100}%"></i></span><span>${quiz.score} pt${quiz.score > 1 ? 's' : ''}</span></div>
    <h3 class="quiz__q">${esc(q.q)}</h3>
    <ol class="opts">${q.options.map((o, i) => `<li><button type="button" class="opt" data-i="${i}"><span class="opt__l">${'ABCD'[i]}</span><span>${esc(o)}</span></button></li>`).join('')}</ol>`;
  for (const b of $$('.opt', el)) b.addEventListener('click', () => {
    const i = +b.dataset.i;
    for (const o of $$('.opt', el)) { o.disabled = true; if (+o.dataset.i === q.answer) o.classList.add('is-right'); }
    if (i === q.answer) quiz.score++; else b.classList.add('is-wrong');
    setTimeout(() => { quiz.i++; renderQuiz(); }, reduced() ? 300 : 1100);
  });
  $('.opt', el)?.focus({ preventScroll: true });
}

// ——— Frise ————————————————————————————————————————————————————————

function renderFrise() {
  const d = state.a.dates;
  const min = d[0].year, max = d[d.length - 1].year, span = Math.max(1, max - min);
  $('#frise').innerHTML = `<div class="frise__axis"><span>${min < 0 ? `${-min} av. J.-C.` : min}</span><span>${max < 0 ? `${-max} av. J.-C.` : max}</span></div>
    <ol class="frise__list">${d.map((x, i) => `<li style="--p:${((x.year - min) / span).toFixed(3)};--i:${i}"><span class="frise__dot"></span><b>${esc(x.label)}</b><p>${esc(withoutDate(x))}</p></li>`).join('')}</ol>`;
}

// ——— Partage, impression, export ——————————————————————————————————

$('#btnShare').addEventListener('click', async () => {
  const code = await encodeShare(state.a.title, state.deck.text);
  const url = `${location.origin}${location.pathname}#c=${code}`;
  try {
    if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: state.a.title, text: 'Ma fiche de révision Synapse', url });
    else { await navigator.clipboard.writeText(url); toast(`Lien copié (${Math.round(url.length / 100) / 10} k caractères) : le cours est dans le lien, sans serveur.`); }
  } catch { prompt('Copiez ce lien :', url); }
});
$('#btnPrint').addEventListener('click', () => { selectTab('fiche'); setTimeout(() => window.print(), 50); });
$('#btnAnki').addEventListener('click', () => {
  const q = (s) => `"${String(s).replace(/"/g, '""').replace(/\n/g, '<br>')}"`;
  const csv = state.cards.map((c) => `${q(c.q)};${q(c.a)};${q(c.kind)}`).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([`#separator:semicolon\n#html:true\n#columns:Recto;Verso;Type\n${csv}\n`], { type: 'text/csv;charset=utf-8' }));
  a.download = `${state.a.title.replace(/[^\p{L}\p{N} -]/gu, '').trim().slice(0, 60) || 'synapse'}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`${plural(state.cards.length, 'carte')} exportées pour Anki.`);
});

// ——— Bibliothèque ————————————————————————————————————————————————

function updateLibCount() { $('#libCount').textContent = String(Library.all().length); }
function renderLib() {
  const decks = Library.all();
  $('#libEmpty').hidden = decks.length > 0;
  $('#lib').innerHTML = decks.map((d) => {
    const cards = makeCards(analyze(d.text));
    const m = mastery(d, cards);
    const due = dueCards(d, cards).length;
    return `<li class="libcard"><button type="button" class="libcard__open" data-id="${esc(d.id)}"><span class="ring" style="--p:${m.mastered}"><b>${Math.round(m.mastered * 100)}%</b></span><span><b>${esc(d.title)}</b><small>${plural(cards.length, 'carte')}${due ? ` · ${due} à revoir` : ' · à jour'}</small></span></button><button type="button" class="iconbtn" data-del="${esc(d.id)}" aria-label="Supprimer ${esc(d.title)}">✕</button></li>`;
  }).join('');
  for (const b of $$('[data-id]', $('#lib'))) b.addEventListener('click', () => { const d = Library.get(b.dataset.id); src.value = d.text; generate(d.text, { animate: false, title: d.title }); });
  for (const b of $$('[data-del]', $('#lib'))) b.addEventListener('click', () => { if (confirm('Supprimer cette fiche et sa progression ?')) { Library.remove(b.dataset.del); renderLib(); updateLibCount(); } });
}

// ——— Petits effets ————————————————————————————————————————————————

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.hidden = true; }, 3800);
}

function confetti() {
  if (reduced()) return;
  const c = $('#confetti'), ctx = c.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const colors = ['#7c5cff', '#ff5c8a', '#20c997', '#ffb020', '#3fa9ff'];
  const ps = Array.from({ length: 160 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.4, vx: (Math.random() - 0.5) * 14, vy: -Math.random() * 14 - 4, r: Math.random() * 6 + 3, c: colors[(Math.random() * colors.length) | 0], a: Math.random() * 6 }));
  const t0 = performance.now();
  const step = (t) => {
    const k = (t - t0) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of ps) {
      p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.a += 0.15;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.max(0, 1 - k / 2.4);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore();
    }
    if (k < 2.4) requestAnimationFrame(step); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(step);
}

// ——— Démarrage : lien partagé ? ————————————————————————————————————

(async () => {
  updateLibCount();
  countWords();
  const m = location.hash.match(/^#c=([A-Za-z0-9_-]+)$/);
  if (m) {
    try {
      const { title, text } = await decodeShare(m[1]);
      src.value = text; countWords();
      await generate(text, { title });
      toast('Fiche reçue par lien : elle est maintenant dans « Mes fiches ».');
    } catch { toast('Ce lien de partage est invalide ou incomplet.'); }
  }
})();
