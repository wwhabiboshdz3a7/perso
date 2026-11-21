// Les Terrasses du Canal — lots, filtres, fiche, tableau et simulateur de financement.
// Tout ce fichier fonctionne sans WebGL : la maquette (maquette.js) n'est qu'une vue de cet état.

// x0 / x1 : emprise du lot sur la façade, en mètres (lue par la maquette).
export const LOTS = [
  { id: 'A001', rooms: 3, area: 66, ext: 38, kind: 'Jardin privatif', level: 0, x0: -15, x1: -4, aspect: 'Sud-ouest et nord-ouest', price: 389000, status: 'vendu' },
  { id: 'A002', rooms: 4, area: 84, ext: 52, kind: 'Jardin privatif', level: 0, x0: 0, x1: 15, aspect: 'Sud-ouest et sud-est', price: 472000, status: 'dispo' },
  { id: 'A101', rooms: 2, area: 44, ext: 9, kind: 'Loggia', level: 1, x0: -15, x1: -8, aspect: 'Sud-ouest et nord-ouest', price: 259000, status: 'dispo' },
  { id: 'A102', rooms: 3, area: 65, ext: 12, kind: 'Terrasse', level: 1, x0: -8, x1: 3, aspect: 'Traversant sud-ouest', price: 379000, status: 'dispo' },
  { id: 'A103', rooms: 4, area: 86, ext: 14, kind: 'Terrasse', level: 1, x0: 3, x1: 15, aspect: 'Sud-ouest et sud-est', price: 489000, status: 'option' },
  { id: 'A201', rooms: 3, area: 67, ext: 12, kind: 'Terrasse', level: 2, x0: -15, x1: -5, aspect: 'Sud-ouest et nord-ouest', price: 392000, status: 'dispo' },
  { id: 'A202', rooms: 2, area: 46, ext: 9, kind: 'Loggia', level: 2, x0: -5, x1: 2, aspect: 'Sud-ouest', price: 268000, status: 'vendu' },
  { id: 'A203', rooms: 4, area: 88, ext: 14, kind: 'Terrasse', level: 2, x0: 2, x1: 15, aspect: 'Sud-ouest et sud-est', price: 505000, status: 'vendu' },
  { id: 'A301', rooms: 4, area: 91, ext: 31, kind: 'Terrasse', level: 3, x0: -15, x1: 1, aspect: 'Sud-ouest et nord-ouest', price: 548000, status: 'dispo' },
  { id: 'A302', rooms: 3, area: 69, ext: 26, kind: 'Terrasse', level: 3, x0: 1, x1: 15, aspect: 'Sud-ouest et sud-est', price: 428000, status: 'option' },
  { id: 'A401', rooms: 5, area: 112, ext: 38, kind: 'Terrasse', level: 4, x0: -15, x1: 3, aspect: 'Triple orientation', price: 695000, status: 'dispo' },
  { id: 'A402', rooms: 2, area: 48, ext: 22, kind: 'Terrasse', level: 4, x0: 3, x1: 13, aspect: 'Sud-ouest et sud-est', price: 298000, status: 'dispo' },
  { id: 'A501', rooms: 5, area: 124, ext: 96, kind: 'Terrasse d’attique', level: 5, x0: -11, x1: 9, aspect: 'Quatre orientations', price: 865000, status: 'dispo' },
];

export const STATUS = {
  dispo: { label: 'Disponible', mark: '●' },
  option: { label: 'Optionné', mark: '◐' },
  vendu: { label: 'Vendu', mark: '○' },
};
const FLOORS = ['Rez-de-jardin', '1er étage', '2e étage', '3e étage', '4e étage', '5e étage, attique'];
const FLOORS_SHORT = ['RDC', 'R+1', 'R+2', 'R+3', 'R+4', 'R+5'];
const PARKING = ['', '', 'En option', '1 place comprise', '1 place comprise', '2 places comprises'];

const number = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
export const euros = (value) => number.format(Math.round(value)) + ' €';
export const lotById = (id) => LOTS.find((lot) => lot.id === id) || null;

// ---------- état partagé ----------
export const state = { selected: null, hover: null, rooms: 0, budget: 900000, free: false, night: false };
const listeners = new Set();
export function subscribe(listener) { listeners.add(listener); }
function emit(what) { for (const listener of listeners) listener(what); }

export const matches = (lot) =>
  (!state.rooms || lot.rooms === state.rooms) && lot.price <= state.budget && (!state.free || lot.status === 'dispo');

export function selectLot(id) {
  if (!lotById(id) || state.selected === id) return;
  state.selected = id;
  const lot = lotById(id);
  if (lot.status !== 'vendu') {
    sim.lot = id;
    if (!sim.touched) sim.apport = Math.round((lot.price * 0.1) / 1000) * 1000;
  }
  emit('select');
}
export function hoverLot(id) {
  if (state.hover === id) return;
  state.hover = id;
  emit('hover');
}
// Passe au lot suivant ou précédent parmi ceux qui correspondent aux filtres.
export function stepLot(direction) {
  const pool = LOTS.filter(matches);
  const list = pool.length ? pool : LOTS;
  const index = list.findIndex((lot) => lot.id === state.selected);
  selectLot(list[(index + direction + list.length) % list.length].id);
}

// ---------- financement ----------
const NOTAIRE = 0.025; // frais réduits du neuf
const NOTAIRE_ANCIEN = 0.075;
const ASSURANCE = 0.003; // par an, sur le capital emprunté
const PRIX_PARKING = 18000;
const sim = { lot: 'A301', apport: 55000, years: 25, rate: 3.35, parking: false, touched: false };

export function finance(lot, options = sim) {
  const prix = lot.price + (options.parking ? PRIX_PARKING : 0);
  const frais = Math.round(prix * NOTAIRE);
  const budget = prix + frais;
  const apport = Math.min(Math.max(0, options.apport), budget);
  const emprunt = budget - apport;
  const months = options.years * 12;
  const monthlyRate = options.rate / 100 / 12;
  // formule d'amortissement à mensualités constantes
  const credit = emprunt === 0 ? 0 : monthlyRate === 0 ? emprunt / months : (emprunt * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const assurance = (emprunt * ASSURANCE) / 12;
  const cout = credit * months - emprunt + assurance * months;
  return { prix, frais, budget, apport, emprunt, credit, assurance, mois: credit + assurance, cout, economie: Math.round(prix * (NOTAIRE_ANCIEN - NOTAIRE)), revenus: (credit + assurance) / 0.35 };
}

// ---------- fiche ----------
const fiche = document.querySelector('[data-fiche]');
function nearestFree(lot) {
  const free = LOTS.filter((other) => other.status === 'dispo');
  const same = free.filter((other) => other.rooms === lot.rooms);
  return (same.length ? same : free).sort((a, b) => Math.abs(a.price - lot.price) - Math.abs(b.price - lot.price))[0];
}
function renderFiche() {
  if (!fiche) return;
  const preview = state.hover && state.hover !== state.selected;
  const lot = lotById(state.hover) || lotById(state.selected);
  if (!lot) {
    fiche.innerHTML = '<p class="mono">Aucun lot sélectionné</p><p class="fiche__empty">Touchez un bloc de la maquette, ou une ligne du tableau, pour afficher sa fiche.</p>';
    return;
  }
  const status = STATUS[lot.status];
  const plan = finance(lot);
  let action;
  if (lot.status === 'dispo') {
    action = `<p class="fiche__month"><span class="mono">Mensualité estimée</span><b>${euros(plan.mois)}</b><span class="mono">apport ${euros(plan.apport)} · ${sim.years} ans · ${sim.rate.toLocaleString('fr-FR')} %</span></p>
      <div class="fiche__cta"><a class="btn" href="#financer">Simuler ce lot</a><a class="btn btn--line" href="#rendez-vous">Le visiter</a></div>`;
  } else if (lot.status === 'option') {
    action = `<p class="fiche__info">Ce lot est sous option pendant 7 jours. Laissez vos coordonnées : nous vous prévenons s’il se libère.</p>
      <div class="fiche__cta"><a class="btn" href="#financer">Simuler ce lot</a><a class="btn btn--line" href="#rendez-vous">Être prévenu(e)</a></div>`;
  } else {
    const other = nearestFree(lot);
    action = `<p class="fiche__info">Ce lot a trouvé preneur. Le plus proche encore disponible : ${other.id}, un T${other.rooms} de ${other.area} m² à ${euros(other.price)}.</p>
      <div class="fiche__cta"><button class="btn" type="button" data-goto="${other.id}">Voir le lot ${other.id}</button></div>`;
  }
  fiche.innerHTML = `
    <header class="fiche__top"><span class="mono">${preview ? 'Aperçu' : 'Lot sélectionné'}</span><span class="badge badge--${lot.status}"><i aria-hidden="true">${status.mark}</i>${status.label}</span></header>
    <p class="fiche__id">${lot.id}</p>
    <p class="fiche__type">T${lot.rooms}<span> · ${lot.area} m²</span></p>
    <dl class="fiche__dl">
      <div><dt class="mono">${lot.kind}</dt><dd>${lot.ext} m²</dd></div>
      <div><dt class="mono">Étage</dt><dd>${FLOORS[lot.level]}</dd></div>
      <div><dt class="mono">Orientation</dt><dd>${lot.aspect}</dd></div>
      <div><dt class="mono">Parking</dt><dd>${PARKING[lot.rooms]}</dd></div>
    </dl>
    <p class="fiche__price"><b>${euros(lot.price)}</b><span class="mono">${euros(lot.price / lot.area)} / m² habitable</span></p>
    ${action}`;
}
fiche?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-goto]');
  if (target) selectLot(target.dataset.goto);
});

// ---------- tableau ----------
const body = document.querySelector('[data-lots]');
const rows = new Map();
if (body) {
  for (const lot of LOTS) {
    const status = STATUS[lot.status];
    const row = document.createElement('tr');
    row.dataset.lot = lot.id;
    row.innerHTML = `
      <th scope="row"><button type="button" class="lot-btn" aria-pressed="false" aria-label="Lot ${lot.id}, afficher la fiche">${lot.id}</button></th>
      <td>T${lot.rooms}</td>
      <td class="num">${lot.area} m²</td>
      <td class="num c-ext">${lot.ext} m²</td>
      <td class="c-floor">${FLOORS_SHORT[lot.level]}</td>
      <td class="c-aspect">${lot.aspect}</td>
      <td class="num">${euros(lot.price)}</td>
      <td><span class="badge badge--${lot.status}"><i aria-hidden="true">${status.mark}</i><span>${status.label}</span></span></td>`;
    row.addEventListener('click', () => selectLot(lot.id));
    row.addEventListener('mouseenter', () => hoverLot(lot.id));
    row.addEventListener('mouseleave', () => hoverLot(null));
    body.append(row);
    rows.set(lot.id, row);
  }
}
const count = document.querySelector('[data-count]');
function renderTable() {
  let shown = 0;
  for (const lot of LOTS) {
    const row = rows.get(lot.id);
    if (!row) continue;
    const on = matches(lot);
    if (on) shown += 1;
    row.classList.toggle('is-off', !on);
    row.classList.toggle('is-selected', state.selected === lot.id);
    row.classList.toggle('is-hover', state.hover === lot.id);
    row.querySelector('.lot-btn').setAttribute('aria-pressed', String(state.selected === lot.id));
  }
  if (count) count.textContent = shown === LOTS.length ? `${shown} lots sur ${LOTS.length}` : `${shown} lot${shown > 1 ? 's' : ''} sur ${LOTS.length} dans vos critères`;
}

// ---------- filtres et bascule jour / soir ----------
const budgetOut = document.querySelector('[data-budget-out]');
const budgetInput = document.querySelector('input[name="budget"]');
function setRooms(rooms) {
  state.rooms = rooms;
  const radio = document.querySelector(`input[name="rooms"][value="${rooms}"]`);
  if (radio) radio.checked = true;
  emit('filter');
}
for (const radio of document.querySelectorAll('input[name="rooms"]')) radio.addEventListener('change', () => setRooms(Number(radio.value)));
budgetInput?.addEventListener('input', () => {
  state.budget = Number(budgetInput.value);
  if (budgetOut) budgetOut.textContent = euros(state.budget);
  emit('filter');
});
document.querySelector('input[name="free"]')?.addEventListener('change', (event) => {
  state.free = event.target.checked;
  emit('filter');
});
// Les lignes « typologies » règlent le filtre de la maquette avant d'y conduire.
for (const link of document.querySelectorAll('a[data-rooms]')) {
  link.addEventListener('click', () => {
    state.free = false;
    const free = document.querySelector('input[name="free"]');
    if (free) free.checked = false;
    setRooms(Number(link.dataset.rooms));
  });
}
const night = document.querySelector('[data-night]');
night?.addEventListener('click', () => {
  state.night = !state.night;
  night.setAttribute('aria-checked', String(state.night));
  night.closest('[data-stage]')?.classList.toggle('is-night', state.night);
  emit('night');
});

// ---------- simulateur ----------
const form = document.querySelector('[data-sim]');
const lotSelect = document.getElementById('sim-lot');
const apportRange = document.getElementById('sim-apport');
const apportNumber = document.getElementById('sim-apport-n');
const rateRange = document.getElementById('sim-taux');
const parking = document.getElementById('sim-park');
const message = document.querySelector('[data-sim-msg]');
const recap = document.querySelector('[data-recap]');
const rdv = document.querySelector('[data-rdv]');
const rdvLot = document.querySelector('[data-rdv-lot]');
const out = (name, text) => { for (const node of document.querySelectorAll(`[data-out="${name}"]`)) node.textContent = text; };

if (lotSelect) {
  for (const lot of LOTS) {
    if (lot.status === 'vendu') continue;
    const option = new Option(`${lot.id} — T${lot.rooms}, ${lot.area} m² — ${euros(lot.price)}${lot.status === 'option' ? ' (optionné)' : ''}`, lot.id);
    lotSelect.append(option);
  }
  lotSelect.addEventListener('change', () => selectLot(lotSelect.value));
}
function setApport(value) {
  sim.apport = Math.max(0, Math.round(Number(value) || 0));
  sim.touched = true;
  emit('sim');
}
apportRange?.addEventListener('input', () => setApport(apportRange.value));
apportNumber?.addEventListener('change', () => setApport(apportNumber.value));
rateRange?.addEventListener('input', () => { sim.rate = Number(rateRange.value); emit('sim'); });
parking?.addEventListener('change', () => { sim.parking = parking.checked; emit('sim'); });
for (const radio of document.querySelectorAll('input[name="duree"]')) radio.addEventListener('change', () => { sim.years = Number(radio.value); emit('sim'); });
form?.addEventListener('submit', (event) => event.preventDefault());

function renderSim() {
  const lot = lotById(sim.lot);
  if (!lot || !form) return;
  const plan = finance(lot);
  sim.apport = plan.apport; // un apport supérieur au budget est ramené au budget
  const ceiling = Math.ceil(plan.budget / 1000) * 1000;
  lotSelect.value = lot.id;
  apportRange.max = String(ceiling);
  apportRange.value = String(plan.apport);
  apportNumber.max = String(plan.budget);
  if (document.activeElement !== apportNumber) apportNumber.value = String(plan.apport);
  const rate = sim.rate.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' %';
  out('taux', rate);
  out('mois', number.format(Math.round(plan.mois)));
  out('assurance', euros(plan.assurance));
  out('duree', `${sim.years} ans`);
  out('lot-nom', `du lot ${lot.id}${sim.parking ? ' + parking' : ''}`);
  out('prix', euros(plan.prix));
  out('frais', euros(plan.frais));
  out('eco', `soit ${euros(plan.economie)} de moins que dans l’ancien`);
  out('budget', euros(plan.budget));
  out('apport', euros(plan.apport));
  out('apport-pct', `${Math.round((plan.apport / plan.budget) * 100)} % du budget`);
  out('emprunt', euros(plan.emprunt));
  out('cout', euros(plan.cout));
  out('revenus', euros(plan.revenus) + ' / mois');

  const whole = plan.budget + plan.cout;
  const bar = document.querySelector('[data-bar]');
  if (bar) {
    bar.querySelector('[data-seg="apport"]').style.flexGrow = String(plan.apport / whole);
    bar.querySelector('[data-seg="capital"]').style.flexGrow = String(plan.emprunt / whole);
    bar.querySelector('[data-seg="cout"]').style.flexGrow = String(plan.cout / whole);
    bar.setAttribute('aria-label', `Coût total ${euros(whole)} : apport ${euros(plan.apport)}, capital emprunté ${euros(plan.emprunt)}, intérêts et assurance ${euros(plan.cout)}`);
  }
  if (message) {
    message.textContent =
      plan.emprunt === 0 ? 'Votre apport couvre tout le budget : aucun crédit n’est nécessaire.'
      : plan.apport < plan.frais ? `À noter : la plupart des banques attendent un apport couvrant au moins les frais de notaire, soit ${euros(plan.frais)}.`
      : lot.status === 'option' ? 'Ce lot est actuellement sous option : la simulation reste valable s’il se libère.'
      : '';
  }
  const summary = plan.emprunt === 0
    ? `Lot ${lot.id} — T${lot.rooms} de ${lot.area} m², ${euros(plan.prix)}. Financement sans crédit.`
    : `Lot ${lot.id} — T${lot.rooms} de ${lot.area} m², ${euros(plan.prix)}. Apport ${euros(plan.apport)}, ${sim.years} ans à ${rate} : ${euros(plan.mois)} par mois.`;
  if (recap) recap.textContent = summary;
  if (rdvLot) rdvLot.value = `${lot.id} — T${lot.rooms}, ${lot.area} m², ${euros(lot.price)}`;
  if (rdv) rdv.dataset.demo = `Merci. Ceci est une démonstration : aucune demande n’a été envoyée. En conditions réelles, un conseiller vous rappellerait sous 24 h au sujet du lot ${lot.id}.`;
}

// ---------- rendez-vous : l'espace de vente est fermé le dimanche et le lundi ----------
const date = rdv?.querySelector('input[name="date"]');
if (date) {
  const tomorrow = new Date(Date.now() + 86400000);
  date.min = tomorrow.toISOString().slice(0, 10);
  const check = () => {
    const day = date.value ? new Date(date.value + 'T12:00:00').getDay() : -1;
    date.setCustomValidity(day === 0 || day === 1 ? 'L’espace de vente est fermé le dimanche et le lundi : choisissez un jour du mardi au samedi.' : '');
  };
  date.addEventListener('input', check);
  // ui.js vide le formulaire après l'envoi : on remet le lot en place.
  rdv.addEventListener('submit', () => setTimeout(renderSim, 0));
}

subscribe((what) => {
  if (what !== 'night') { renderFiche(); renderTable(); }
  if (what === 'select' || what === 'sim') renderSim();
});
selectLot('A301');
renderFiche();
renderTable();
renderSim();
