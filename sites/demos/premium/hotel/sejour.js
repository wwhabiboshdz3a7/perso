// Cour Sainte-Anne — le séjour : chambres, calendrier fictif, calcul des nuits et du total.
// Ce module tient l'état partagé (dates, voyageurs, chambre, options) ; la maquette 3D (maison.js)
// s'y abonne. Tout fonctionne sans WebGL : la fiche, le calendrier et le formulaire sont du HTML.

export const ROOMS = [
  { id: 'pastel', n: '01', name: 'la Pastel', where: '1er étage · côté cour', area: 22, view: 'cour', viewLong: 'la cour et les oliviers', cap: 2, price: 165, accent: '#7f9fb8',
    text: 'Lit de 160, salle d’eau en zellige, une haute fenêtre sur les oliviers. La plus calme de la maison ; les chiens y sont les bienvenus.' },
  { id: 'violette', n: '02', name: 'la Violette', where: '1er étage · côté cour', area: 27, view: 'cour', viewLong: 'la cour et le bassin', cap: 2, price: 185, accent: '#8d7aa8',
    text: 'Parquet d’origine, baignoire derrière la cloison, deux fauteuils face à la cour. Le soir, le bassin dessine des reflets au plafond.' },
  { id: 'olivier', n: '03', name: 'l’Olivier', where: 'Aile · 1er étage', area: 34, view: 'cour', viewLong: 'le bassin, en enfilade', cap: 3, price: 215, accent: '#8f9d7c',
    text: 'Toute l’aile pour vous : lit de 180, banquette-lit pour un troisième voyageur, deux fenêtres côté jardin et la charpente au-dessus du lit.' },
  { id: 'toits', n: '04', name: 'les Toits', where: '2e étage · sous la charpente', area: 24, view: 'toits', viewLong: 'les toits de tuile', cap: 2, price: 175, accent: '#c9836b',
    text: 'Sous la pente du toit, poutres apparentes et fenêtre plein sud. On y entend les martinets dès le mois de mai.' },
  { id: 'suite', n: '05', name: 'la Sainte-Anne', where: '2e étage · la suite', area: 42, view: 'toits', viewLong: 'les toits et le clocher', cap: 4, price: 265, accent: '#1f9d97',
    text: 'La suite du film : volets en bois, coin salon, lit de 180 et canapé-lit pour deux. Le clocher est dans l’axe de la fenêtre.' },
];

export const PRICES = { weekend: 20, breakfast: 16, late: 20, parking: 18, tax: 1.9, deposit: 0.3, maxNights: 21 };

// ---------- dates (toujours à midi, heure locale : pas de surprise au changement d'heure) ----------
const DAY = 86400000;
const pad = (n) => String(n).padStart(2, '0');
const noon = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
};
const between = (a, b) => Math.round((b - a) / DAY);
const TODAY = noon(new Date());

const fmtDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const fmtLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const euros = (v) => v.toLocaleString('fr-FR', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 }) + '\u00a0€';
const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// ---------- calendrier fictif : nuits déjà prises, en jours à partir d'aujourd'hui ----------
const TAKEN = {
  pastel: [[0, 1], [8, 10], [16, 20], [29, 31], [37, 41], [52, 55]],
  violette: [[0, 0], [6, 7], [13, 16], [24, 27], [34, 35], [45, 49]],
  olivier: [[3, 6], [11, 12], [21, 23], [28, 32], [43, 46], [58, 60]],
  toits: [[4, 5], [9, 11], [18, 19], [26, 29], [38, 39], [50, 53]],
  suite: [[0, 2], [7, 8], [14, 17], [22, 24], [33, 36], [47, 48]],
};
const booked = {};
for (const room of ROOMS) {
  booked[room.id] = new Set();
  for (const [from, to] of TAKEN[room.id]) for (let d = from; d <= to; d++) booked[room.id].add(iso(addDays(TODAY, d)));
}
const isTaken = (id, date) => booked[id].has(iso(date));
const isWeekendNight = (date) => date.getDay() === 5 || date.getDay() === 6;

// Première nuit prise dans [arrivée, départ[, ou null si la chambre est libre.
function conflict(id, arrive, depart) {
  for (let d = arrive; d < depart; d = addDays(d, 1)) if (isTaken(id, d)) return d;
  return null;
}
// Première date d'arrivée possible pour `n` nuits à partir de `from`.
function nextFree(id, from, n) {
  for (let i = 0; i < 150; i++) {
    const start = addDays(from, i);
    if (!conflict(id, start, addDays(start, n))) return start;
  }
  return null;
}

// ---------- état ----------
const state = {
  room: 'suite',
  arrive: addDays(TODAY, 3),
  depart: addDays(TODAY, 5),
  guests: 2,
  opts: { breakfast: false, late: false, parking: false },
  picking: 'arrive', // prochain clic dans le calendrier
  month: 0, // mois affiché, compté depuis le mois courant
  touched: false,
};
const room = (id = state.room) => ROOMS.find((r) => r.id === id);
const nights = () => between(state.arrive, state.depart);

export function roomStatus(id) {
  const r = room(id);
  const n = nights();
  if (state.guests > r.cap) return { free: false, why: 'cap', label: `${r.cap} voyageurs au plus` };
  if (n < 1) return { free: true, why: null, label: 'libre' };
  const clash = conflict(id, state.arrive, state.depart);
  if (clash) return { free: false, why: 'taken', clash, label: 'complète' };
  return { free: true, why: null, label: 'libre' };
}

function quote() {
  const r = room();
  const n = Math.max(0, nights());
  let stay = 0, weekend = 0;
  for (let i = 0; i < n; i++) {
    const night = addDays(state.arrive, i);
    stay += r.price;
    if (isWeekendNight(night)) { stay += PRICES.weekend; weekend += 1; }
  }
  const lines = [{ label: `${r.name} · ${plural(n, 'nuit', 'nuits')}`, detail: weekend ? `dont ${plural(weekend, 'nuit', 'nuits')} de week-end (+ ${PRICES.weekend} €)` : `${r.price} € la nuit`, amount: stay }];
  if (state.opts.breakfast) lines.push({ label: 'Petit-déjeuner', detail: `${plural(state.guests, 'personne', 'personnes')} × ${plural(n, 'matin', 'matins')}`, amount: PRICES.breakfast * state.guests * n });
  if (state.opts.late) lines.push({ label: 'Arrivée après 20 h', detail: 'boîte à clés', amount: PRICES.late });
  if (state.opts.parking) lines.push({ label: 'Garage fermé', detail: plural(n, 'nuit', 'nuits'), amount: PRICES.parking * n });
  lines.push({ label: 'Taxe de séjour', detail: `${plural(state.guests, 'personne', 'personnes')} × ${plural(n, 'nuit', 'nuits')}`, amount: Math.round(PRICES.tax * state.guests * n * 100) / 100 });
  const total = Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
  return { n, stay, lines, total, deposit: Math.round(total * PRICES.deposit) };
}

function problem() {
  const n = nights();
  const r = room();
  if (n < 1) return 'Le départ doit être après l’arrivée.';
  if (state.arrive < TODAY) return 'La date d’arrivée est déjà passée.';
  if (n > PRICES.maxNights) return `Au-delà de ${PRICES.maxNights} nuits, écrivez-nous : nous préparons un tarif au mois.`;
  const status = roomStatus(r.id);
  if (status.why === 'cap') return `${cap(r.name)} accueille ${r.cap} voyageurs au plus. Choisissez une chambre plus grande.`;
  if (status.why === 'taken') return `${cap(r.name)} est déjà prise la nuit du ${fmtLong.format(status.clash)}. Changez de chambre ou de dates.`;
  return '';
}
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

// ---------- abonnements (maquette 3D) ----------
const listeners = new Set();
export function onSejour(fn) { listeners.add(fn); fn(snapshot()); }
export function selectRoom(id) { if (room(id) && id !== state.room) { state.room = id; state.touched = true; render(); } }
export function snapshot() {
  return { room: state.room, status: Object.fromEntries(ROOMS.map((r) => [r.id, roomStatus(r.id)])) };
}

// ---------- éléments ----------
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const form = $('[data-booking]');
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

// onglets de la fiche (01 … 05)
const tabs = $('[data-room-tabs]');
if (tabs) for (const r of ROOMS) {
  const button = el('button', 'fiche__tab mono', r.n);
  button.type = 'button';
  button.dataset.room = r.id;
  button.setAttribute('aria-label', `Chambre ${r.n}, ${r.name}`);
  button.addEventListener('click', () => selectRoom(r.id));
  tabs.append(button);
}

// liste « chambres & tarifs »
const list = $('[data-room-list]');
if (list) for (const r of ROOMS) {
  const item = el('li', 'room rv');
  item.dataset.room = r.id;
  item.innerHTML = `
    <span class="room__n mono">${r.n}</span>
    <h3 class="room__name">${r.name}</h3>
    <p class="room__text">${r.text}</p>
    <p class="room__facts mono"><span>${r.area} m²</span><span>vue ${r.view}</span><span>${r.cap} pers.</span></p>
    <p class="room__price"><b>${r.price} €</b><span class="mono" data-room-state></span></p>
    <a class="room__go mono" href="#maison" aria-label="Voir ${r.name} dans la maquette">Dans la maquette ↑</a>`;
  item.querySelector('.room__go').addEventListener('click', () => selectRoom(r.id));
  list.append(item);
}

// chambres du formulaire (boutons radio)
const radios = $('[data-room-radios]');
if (radios) for (const r of ROOMS) {
  const label = el('label', 'opt');
  label.dataset.room = r.id;
  label.innerHTML = `
    <input type="radio" name="chambre" value="${r.id}">
    <span class="opt__n mono">${r.n}</span>
    <span class="opt__name">${r.name}</span>
    <span class="opt__facts mono">${r.area} m² · vue ${r.view} · ${r.cap} pers.</span>
    <span class="opt__price">${r.price} €<small class="mono"> / nuit</small></span>
    <span class="opt__state mono" data-room-state></span>`;
  label.querySelector('input').addEventListener('change', () => selectRoom(r.id));
  radios.append(label);
}

// champs de dates (dans la fiche et dans le formulaire : mêmes valeurs)
for (const input of $$('[data-field]')) {
  input.min = iso(TODAY);
  input.addEventListener('change', () => {
    const date = parse(input.value);
    if (!date) return render();
    state.touched = true;
    if (input.dataset.field === 'arrive') setArrive(date);
    else state.depart = date;
    state.picking = 'arrive';
    showMonthOf(state.arrive);
    render();
  });
}
function setArrive(date) {
  const length = Math.max(1, nights());
  state.arrive = date < TODAY ? TODAY : date;
  if (state.depart <= state.arrive) state.depart = addDays(state.arrive, length);
}
function showMonthOf(date) {
  const offset = (date.getFullYear() - TODAY.getFullYear()) * 12 + date.getMonth() - TODAY.getMonth();
  if (offset < state.month || offset > state.month + 1) state.month = Math.max(0, Math.min(10, offset));
}

// voyageurs
for (const button of $$('[data-guests]')) {
  button.addEventListener('click', () => {
    state.guests = Math.min(4, Math.max(1, state.guests + Number(button.dataset.guests)));
    state.touched = true;
    render();
  });
}
// options
for (const input of $$('[data-opt]')) {
  input.addEventListener('change', () => { state.opts[input.dataset.opt] = input.checked; render(); });
}
// « prendre ces dates » : la prochaine période libre pour la chambre choisie
const nextButton = $('[data-next-free]');
nextButton?.addEventListener('click', () => {
  const n = Math.max(1, nights());
  const start = nextFree(state.room, state.arrive, n);
  if (!start) return;
  state.arrive = start;
  state.depart = addDays(start, n);
  showMonthOf(start);
  render();
});

// calendrier
const months = $('[data-cal-months]');
for (const button of $$('[data-cal-nav]')) {
  button.addEventListener('click', () => { state.month = Math.max(0, Math.min(10, state.month + Number(button.dataset.calNav))); renderCalendar(); });
}
months?.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-date]');
  if (!button) return;
  const date = parse(button.dataset.date);
  state.touched = true;
  if (state.picking === 'depart' && date > state.arrive) {
    state.depart = date;
    state.picking = 'arrive';
  } else {
    state.arrive = date;
    state.depart = addDays(date, 1);
    state.picking = 'depart';
  }
  render();
  months.querySelector(`button[data-date="${button.dataset.date}"]`)?.focus({ preventScroll: true });
});

function renderCalendar() {
  if (!months) return;
  months.replaceChildren();
  for (let m = 0; m < 2; m++) {
    const first = new Date(TODAY.getFullYear(), TODAY.getMonth() + state.month + m, 1, 12);
    const block = el('div', 'cal__month');
    block.append(el('p', 'cal__title', fmtMonth.format(first)));
    const grid = el('div', 'cal__grid');
    for (const name of ['lu', 'ma', 'me', 'je', 've', 'sa', 'di']) grid.append(el('span', 'cal__dow mono', name));
    const lead = (first.getDay() + 6) % 7;
    for (let i = 0; i < lead; i++) grid.append(el('span', 'cal__void'));
    const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (let day = 1; day <= count; day++) {
      const date = new Date(first.getFullYear(), first.getMonth(), day, 12);
      const button = el('button', 'cal__day', String(day));
      button.type = 'button';
      button.dataset.date = iso(date);
      const past = date < TODAY;
      const taken = !past && isTaken(state.room, date);
      const inStay = date >= state.arrive && date < state.depart;
      if (past) button.disabled = true;
      if (taken) button.classList.add('is-off');
      if (inStay) button.classList.add('is-in');
      if (iso(date) === iso(state.arrive)) button.classList.add('is-start');
      if (iso(date) === iso(state.depart)) button.classList.add('is-end');
      if (iso(date) === iso(TODAY)) button.classList.add('is-today');
      button.setAttribute('aria-label', `${fmtLong.format(date)}${taken ? ', complet' : ''}${iso(date) === iso(state.arrive) ? ', arrivée' : ''}${iso(date) === iso(state.depart) ? ', départ' : ''}`);
      if (inStay || iso(date) === iso(state.depart)) button.setAttribute('aria-pressed', 'true');
      grid.append(button);
    }
    block.append(grid);
    months.append(block);
  }
  const hint = $('[data-cal-hint]');
  if (hint) hint.textContent = state.picking === 'depart' ? 'Touchez maintenant le jour du départ' : 'Touchez le jour d’arrivée, puis celui du départ';
  const name = $('[data-cal-room]');
  if (name) name.textContent = room().name;
  const prev = $('[data-cal-nav="-1"]');
  if (prev) prev.disabled = state.month === 0;
}

// ---------- rendu ----------
const set = (selector, text) => { const node = $(selector); if (node) node.textContent = text; };

function render() {
  const r = room();
  const n = nights();
  const status = roomStatus(r.id);
  const q = quote();
  const issue = problem();

  // champs
  for (const input of $$('[data-field="arrive"]')) input.value = iso(state.arrive);
  for (const input of $$('[data-field="depart"]')) { input.value = iso(state.depart); input.min = iso(addDays(state.arrive, 1)); }
  set('[data-guests-out]', String(state.guests));
  const hidden = $('[data-guests-input]');
  if (hidden) hidden.value = String(state.guests);
  for (const button of $$('[data-guests]')) button.disabled = state.guests + Number(button.dataset.guests) < 1 || state.guests + Number(button.dataset.guests) > 4;
  for (const input of $$('[data-opt]')) input.checked = state.opts[input.dataset.opt];

  // fiche de la maquette
  set('[data-f="where"]', `Chambre ${r.n} / 05 — ${r.where}`);
  set('[data-f="name"]', r.name);
  set('[data-f="text"]', r.text);
  set('[data-f="area"]', `${r.area} m²`);
  set('[data-f="view"]', r.viewLong);
  set('[data-f="cap"]', r.cap === 2 ? 'deux' : r.cap === 3 ? 'jusqu’à trois' : 'jusqu’à quatre');
  set('[data-f="price"]', `${r.price} €`);
  const dispo = $('[data-f="dispo"]');
  const cta = $('[data-f="cta"]');
  if (dispo) {
    dispo.className = 'fiche__dispo ' + (status.free && !issue ? 'is-free' : 'is-off');
    let next = null;
    if (n < 1) dispo.innerHTML = '<b>Dates à revoir</b> Le départ doit être après l’arrivée.';
    else if (status.why === 'cap') dispo.innerHTML = `<b>Trop petite</b> Prévue pour ${r.cap} voyageurs ; vous êtes ${state.guests}.`;
    else if (status.why === 'taken') {
      next = nextFree(r.id, state.arrive, n);
      dispo.innerHTML = `<b>Complète</b> du ${fmtShort.format(state.arrive)} au ${fmtShort.format(state.depart)}` + (next ? ` — libre pour ${plural(n, 'nuit', 'nuits')} dès le ${fmtDay.format(next)}` : '');
    } else dispo.innerHTML = `<b>Libre</b> du ${fmtDay.format(state.arrive)} au ${fmtDay.format(state.depart)} — ${plural(n, 'nuit', 'nuits')}, ${euros(q.stay)}.`;
    if (nextButton) nextButton.hidden = !next;
    if (cta) cta.textContent = status.free ? 'Réserver cette chambre' : 'Changer mes dates';
  }
  for (const tab of $$('.fiche__tab')) {
    const s = roomStatus(tab.dataset.room);
    tab.classList.toggle('is-on', tab.dataset.room === r.id);
    tab.classList.toggle('is-off', !s.free);
    tab.setAttribute('aria-pressed', String(tab.dataset.room === r.id));
  }

  // liste et boutons radio
  for (const node of $$('[data-room]')) {
    if (node.matches('.fiche__tab')) continue;
    const s = roomStatus(node.dataset.room);
    node.classList.toggle('is-off', !s.free);
    node.classList.toggle('is-on', node.dataset.room === r.id);
    const tag = node.querySelector('[data-room-state]');
    if (tag) tag.textContent = s.label;
    const input = node.querySelector('input[type="radio"]');
    if (input) {
      input.checked = node.dataset.room === r.id;
      input.disabled = !s.free && node.dataset.room !== r.id;
    }
  }

  // récapitulatif
  set('[data-t="room"]', r.name);
  set('[data-t="dates"]', n >= 1 ? `${fmtDay.format(state.arrive)} → ${fmtDay.format(state.depart)} · ${plural(state.guests, 'voyageur', 'voyageurs')}` : 'Dates à choisir');
  set('[data-t="nights"]', String(Math.max(0, n)));
  set('[data-t="nights-label"]', n > 1 ? 'nuits' : 'nuit');
  const lines = $('[data-t="lines"]');
  if (lines) {
    lines.replaceChildren();
    for (const line of q.lines) {
      const item = el('li');
      const left = el('span');
      left.append(el('b', '', line.label), el('small', 'mono', line.detail));
      item.append(left, el('span', 'ticket__amount', euros(line.amount)));
      lines.append(item);
    }
  }
  set('[data-t="total"]', issue ? '—' : euros(q.total));
  const limit = addDays(state.arrive, -7);
  set('[data-t="note"]', issue ? '' : `Acompte de 30 % à la confirmation : ${euros(q.deposit)}. ` + (limit > TODAY ? `Annulation gratuite jusqu’au ${fmtShort.format(limit)}.` : 'Arrivée dans moins de 7 jours : acompte non remboursable.'));
  set('[data-t="problem"]', issue);
  form?.classList.toggle('has-problem', Boolean(issue));
  if (form && state.touched) set('[data-done]', '');

  renderCalendar();
  const snap = snapshot();
  for (const fn of listeners) fn(snap);
}

// ---------- envoi (simulé) : on valide tout, puis ui.js affiche le message et vide le formulaire ----------
if (form) {
  document.addEventListener('submit', (event) => {
    if (event.target !== form) return;
    const issue = problem();
    const name = form.elements.nom, mail = form.elements.email;
    let message = issue;
    let focus = null;
    if (!message && !name.value.trim()) { message = 'Il nous manque votre nom.'; focus = name; }
    if (!message && !/^\S+@\S+\.\S+$/.test(mail.value.trim())) { message = 'Vérifiez votre adresse e-mail : elle sert à vous confirmer le séjour.'; focus = mail; }
    if (message) {
      event.preventDefault();
      event.stopPropagation();
      set('[data-t="problem"]', message);
      form.classList.add('has-problem');
      (focus || $('[data-t="problem"]'))?.focus?.();
      return;
    }
    const q = quote();
    const r = room();
    state.touched = false;
    form.dataset.demo = `C’est noté, ${name.value.trim().split(' ')[0]} : ${r.name}, du ${fmtDay.format(state.arrive)} au ${fmtDay.format(state.depart)}, ${plural(q.n, 'nuit', 'nuits')}, ${euros(q.total)}. Ceci est une démonstration : aucune réservation n’a été envoyée.`;
  }, true);
  // ui.js vide le formulaire après l'envoi : on remet les dates, la chambre et les voyageurs en place.
  form.addEventListener('reset', () => setTimeout(() => {
    state.opts = { breakfast: false, late: false, parking: false };
    render();
  }));
}

render();
