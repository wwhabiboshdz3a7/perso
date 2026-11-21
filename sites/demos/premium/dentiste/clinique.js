// Clinique Lumen — le parcours métier, sans rien envoyer nulle part :
// prise de rendez-vous en trois étapes, estimateur de reste à charge, temps forts du film, horaires du jour.

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pad2 = (n) => String(n).padStart(2, '0');
const euros = (value) => value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const hourText = (minutes) => `${Math.floor(minutes / 60)} h${minutes % 60 ? ' ' + pad2(minutes % 60) : ''}`;
const icon = (name) => `<svg class="ico" aria-hidden="true"><use href="#i-${name}"/></svg>`;

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// Ouverture, en minutes depuis minuit : [matin, pause, reprise, soir]. Dimanche fermé.
const OPEN = { 1: [480, 750, 840, 1170], 2: [480, 750, 840, 1170], 3: [480, 750, 840, 1170], 4: [480, 750, 840, 1170], 5: [480, 750, 840, 1170], 6: [540, 780, 780, 780] };

const MOTIFS = [
  { id: 'controle', label: 'Contrôle et détartrage', duration: 30, price: 'environ 52 €', icon: 'tooth' },
  { id: 'urgence', label: 'Douleur ou urgence', duration: 20, price: 'reçu dans la journée', icon: 'bolt', urgent: true },
  { id: 'premiere', label: 'Première visite', duration: 40, price: '23 € · bilan complet', icon: 'spark' },
  { id: 'implant', label: 'Implant : consultation', duration: 45, price: '70 € avec radio 3D', icon: 'implant' },
  { id: 'gouttieres', label: 'Gouttières : bilan', duration: 45, price: 'offert', icon: 'align' },
  { id: 'enfant', label: 'Enfant ou adolescent', duration: 30, price: '23 €', icon: 'kid' },
];

const DOCTORS = [
  { id: 'vasseur', name: 'Dr Claire Vasseur', role: 'Omnipratique, soins conservateurs', initials: 'CV', tone: '#bfe3ff', days: [1, 2, 4, 5], motifs: ['controle', 'urgence', 'premiere'] },
  { id: 'marty', name: 'Dr Hugo Marty', role: 'Omnipratique, urgences', initials: 'HM', tone: '#bdf0e4', days: [1, 2, 3, 5, 6], motifs: ['controle', 'urgence', 'premiere'] },
  { id: 'belkacem', name: 'Dr Inès Belkacem', role: 'Implantologie, chirurgie', initials: 'IB', tone: '#ffd9d3', days: [1, 3, 4], motifs: ['implant', 'urgence'] },
  { id: 'casteran', name: 'Dr Paul Castéran', role: 'Implantologie, parodontie', initials: 'PC', tone: '#e0dcff', days: [2, 4, 5], motifs: ['implant', 'controle'] },
  { id: 'fournier', name: 'Dr Léa Fournier', role: 'Orthodontie par gouttières', initials: 'LF', tone: '#ffe9b8', days: [2, 3, 5, 6], motifs: ['gouttieres'] },
  { id: 'resseguier', name: 'Dr Tom Rességuier', role: 'Pédodontie, enfants et adolescents', initials: 'TR', tone: '#c9f1c4', days: [1, 3, 4, 6], motifs: ['enfant'] },
];

// ---------- créneaux : générés, mais toujours les mêmes pour un praticien et un jour donnés ----------
function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) % 1000;
}
const atMidnight = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const addDays = (date, n) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
const dayKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const dayOffset = (date, from) => Math.round((atMidnight(date) - atMidnight(from)) / 86400000);

function slotsFor(doctor, date, motif, now = new Date()) {
  const hours = OPEN[date.getDay()];
  const offset = dayOffset(date, now);
  if (!hours || offset < 0 || !doctor.days.includes(date.getDay())) return [];
  const step = motif.duration <= 20 ? 20 : motif.duration <= 30 ? 30 : 45;
  const chance = motif.urgent ? (offset <= 1 ? 620 : 420) : offset <= 1 ? 180 : offset <= 4 ? 330 : 480;
  const earliest = offset === 0 ? now.getHours() * 60 + now.getMinutes() + 45 : 0;
  const list = [];
  for (const [from, to] of [[hours[0], hours[1]], [hours[2], hours[3]]]) {
    for (let t = from; t + motif.duration <= to; t += step) {
      if (t >= earliest && hash(`${doctor.id}|${dayKey(date)}|${t}`) < chance) list.push(t);
    }
  }
  return list;
}

// Premier créneau libre d'un praticien pour un motif, dans les quatre semaines.
function firstSlot(doctor, motif, now = new Date()) {
  for (let i = 0; i < 28; i++) {
    const date = addDays(now, i);
    const slots = slotsFor(doctor, date, motif, now);
    if (slots.length) return { date, time: slots[0] };
  }
  return null;
}
const slotText = (date, time, long = false) =>
  long ? `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} à ${hourText(time)}` : `${DAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} · ${hourText(time)}`;

// ---------- prise de rendez-vous ----------
const booking = $('[data-booking]');
if (booking) {
  const state = { step: 1, motif: null, doctor: null, slot: null, week: 0, expanded: false };
  const panes = $$('[data-pane]', booking);
  const gotos = $$('[data-goto]', booking);
  const motifBox = $('[data-motifs]', booking);
  const doctorBox = $('[data-doctors]', booking);
  const doctorHint = $('[data-doctors-hint]', booking);
  const grid = $('[data-week-grid]', booking);
  const weekLabel = $('[data-week-label]', booking);
  const recap = $('[data-recap]', booking);
  const fields = $('[data-recap-fields]', recap);
  const wait = $('[data-recap-wait]', recap);
  const ok = $('[data-recap-ok]', recap);
  const done = $('[data-done]', recap);
  let confirmed = false;

  motifBox.innerHTML = MOTIFS.map(
    (m) => `<button class="choice${m.urgent ? ' choice--urgent' : ''}" type="button" data-motif="${m.id}" aria-pressed="false"><span class="choice__ico">${icon(m.icon)}</span><b>${m.label}</b><small>${m.duration} min · ${m.price}</small></button>`
  ).join('');

  function renderDoctors() {
    const list = DOCTORS.filter((d) => d.motifs.includes(state.motif.id));
    doctorHint.textContent = `${list.length} praticien${list.length > 1 ? 's' : ''} ${list.length > 1 ? 'reçoivent' : 'reçoit'} pour « ${state.motif.label.toLowerCase()} ».`;
    doctorBox.innerHTML = list
      .map((d) => {
        const next = firstSlot(d, state.motif);
        return `<button class="choice" type="button" data-doctor="${d.id}" aria-pressed="${state.doctor === d}"><span class="avatar" style="--tone:${d.tone}" aria-hidden="true">${d.initials}</span><b>${d.name}</b><small>${d.role}<br>${next ? 'Prochain créneau : ' + slotText(next.date, next.time) : 'Complet ce mois-ci'}</small></button>`;
      })
      .join('');
  }

  // Lundi de la première semaine où il reste un jour ouvert.
  function firstMonday() {
    const now = new Date();
    let date = atMidnight(now);
    for (let i = 0; i < 8; i++) {
      const hours = OPEN[date.getDay()];
      if (hours && (i > 0 || now.getHours() * 60 + now.getMinutes() < hours[3] - 60)) break;
      date = addDays(date, 1);
    }
    return addDays(date, -((date.getDay() + 6) % 7));
  }

  function renderWeek() {
    const monday = addDays(firstMonday(), state.week * 7);
    const saturday = addDays(monday, 5);
    weekLabel.textContent = `Du ${monday.getDate()}${monday.getMonth() !== saturday.getMonth() ? ' ' + MONTHS[monday.getMonth()] : ''} au ${saturday.getDate()} ${MONTHS[saturday.getMonth()]}`;
    $('[data-week="-1"]', booking).disabled = state.week <= 0;
    $('[data-week="1"]', booking).disabled = state.week >= 5;
    const now = new Date();
    let html = '';
    for (let i = 0; i < 6; i++) {
      const date = addDays(monday, i);
      const slots = slotsFor(state.doctor, date, state.motif, now);
      const head = `<p class="day__head"><span>${DAYS_SHORT[date.getDay()]}</span><b>${date.getDate()}</b><small>${MONTHS_SHORT[date.getMonth()]}</small></p>`;
      if (!slots.length) {
        const why = dayOffset(date, now) < 0 ? 'Passé' : !state.doctor.days.includes(date.getDay()) ? 'Ne consulte pas' : 'Complet';
        html += `<div class="day is-off">${head}<p class="day__none">${why}</p></div>`;
        continue;
      }
      const limit = state.expanded ? slots.length : 5;
      const buttons = slots
        .slice(0, limit)
        .map((t) => {
          const on = state.slot && dayKey(state.slot.date) === dayKey(date) && state.slot.time === t;
          return `<button class="slot" type="button" data-slot="${dayKey(date)}|${t}" aria-pressed="${on}" aria-label="${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} à ${hourText(t)}">${hourText(t)}</button>`;
        })
        .join('');
      const more = slots.length > limit ? `<button class="slot slot--more" type="button" data-more aria-label="Afficher ${slots.length - limit} autres horaires">+ ${slots.length - limit}</button>` : '';
      html += `<div class="day">${head}${buttons}${more}</div>`;
    }
    grid.innerHTML = html;
  }

  function renderRecap() {
    const set = (key, html, empty) => {
      const node = $(`[data-recap-${key}]`, recap);
      node.innerHTML = html || empty;
      node.classList.toggle('is-empty', !html);
    };
    set('motif', state.motif && `${state.motif.label}<small>${state.motif.duration} min · ${state.motif.price}</small>`, 'Motif à choisir');
    set('doctor', state.doctor && `${state.doctor.name}<small>${state.doctor.role}</small>`, 'Praticien à choisir');
    set('slot', state.slot && `${slotText(state.slot.date, state.slot.time, true).replace(/^./, (c) => c.toUpperCase())}`, 'Créneau à choisir');
    fields.hidden = !state.slot || confirmed;
    wait.hidden = Boolean(state.slot) || confirmed;
    wait.textContent = !state.motif ? 'Choisissez un motif, un praticien puis un créneau : la confirmation apparaît ici.' : !state.doctor ? 'Il reste à choisir un praticien, puis un créneau.' : 'Il reste à choisir un créneau.';
    ok.hidden = !confirmed;
    $('[data-crumb="1"]', booking).textContent = state.motif ? state.motif.label : '';
    $('[data-crumb="2"]', booking).textContent = state.doctor ? state.doctor.name : '';
    $('[data-crumb="3"]', booking).textContent = state.slot ? slotText(state.slot.date, state.slot.time) : '';
  }

  function go(step, focus = true) {
    state.step = step;
    panes.forEach((pane) => (pane.hidden = Number(pane.dataset.pane) !== step));
    gotos.forEach((button) => {
      const n = Number(button.dataset.goto);
      button.disabled = n > 1 && ((n === 2 && !state.motif) || (n === 3 && !state.doctor));
      if (n === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
      button.classList.toggle('is-done', (n === 1 && Boolean(state.motif)) || (n === 2 && Boolean(state.doctor)) || (n === 3 && Boolean(state.slot)));
    });
    if (step === 2) renderDoctors();
    if (step === 3) renderWeek();
    renderRecap();
    if (focus) $('.pane__title', panes[step - 1])?.focus({ preventScroll: true });
  }

  function chooseMotif(id, focus = true) {
    const motif = MOTIFS.find((m) => m.id === id);
    if (!motif) return;
    if (state.motif !== motif) Object.assign(state, { doctor: null, slot: null, week: 0, expanded: false });
    state.motif = motif;
    confirmed = false;
    done.textContent = '';
    $$('[data-motif]', motifBox).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.motif === id)));
    go(2, focus);
  }
  function chooseDoctor(id, focus = true) {
    const doctor = DOCTORS.find((d) => d.id === id);
    if (!doctor) return;
    if (state.doctor !== doctor) Object.assign(state, { slot: null, expanded: false });
    state.doctor = doctor;
    // on ouvre directement la semaine du premier créneau libre
    const next = firstSlot(doctor, state.motif);
    state.week = next ? Math.min(5, Math.max(0, Math.floor(dayOffset(next.date, firstMonday()) / 7))) : 0;
    go(3, focus);
  }

  booking.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target || !booking.contains(target)) return;
    if (target.dataset.motif) chooseMotif(target.dataset.motif);
    else if (target.dataset.doctor) chooseDoctor(target.dataset.doctor);
    else if (target.dataset.goto) go(Number(target.dataset.goto));
    else if (target.dataset.week) {
      state.week = Math.min(5, Math.max(0, state.week + Number(target.dataset.week)));
      state.expanded = false;
      renderWeek();
    } else if (target.hasAttribute('data-more')) {
      state.expanded = true;
      renderWeek();
    } else if (target.dataset.slot) {
      const [key, time] = target.dataset.slot.split('|');
      const [y, m, d] = key.split('-').map(Number);
      state.slot = { date: new Date(y, m - 1, d), time: Number(time) };
      confirmed = false;
      done.textContent = '';
      done.classList.remove('is-error');
      go(3, false);
      if (matchMedia('(max-width: 1080px)').matches) recap.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else if (target.hasAttribute('data-recap-again')) {
      confirmed = false;
      Object.assign(state, { motif: null, doctor: null, slot: null, week: 0, expanded: false });
      done.textContent = '';
      $$('[data-motif]', motifBox).forEach((b) => b.setAttribute('aria-pressed', 'false'));
      go(1);
    }
  });

  // Validation : simulée. Ce gestionnaire passe avant celui de ui.js (qui affiche le message de démonstration).
  recap.addEventListener('submit', (event) => {
    if (!state.motif || !state.doctor || !state.slot) {
      event.preventDefault();
      event.stopImmediatePropagation();
      done.textContent = 'Choisissez d’abord un motif, un praticien et un créneau.';
      done.classList.add('is-error');
      return;
    }
    const first = (new FormData(recap).get('nom') || '').toString().trim().split(/\s+/)[0] || '';
    done.classList.remove('is-error');
    setTimeout(() => {
      confirmed = true;
      $('[data-recap-oktitle]', recap).textContent = first ? `C’est noté, ${first}.` : 'C’est noté.';
      $('[data-recap-ref]', recap).textContent = `Réf. LUM-${1000 + hash(dayKey(state.slot.date) + state.slot.time + state.doctor.id)} · SMS de rappel la veille`;
      renderRecap();
    }, 0);
  });

  // Raccourcis ailleurs dans la page : « Rendez-vous enfant », « Créneau d'urgence », prochain créneau de l'ouverture.
  const reveal = () => document.getElementById('rdv')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  for (const button of $$('[data-book]')) {
    button.addEventListener('click', () => {
      chooseMotif(button.dataset.book, false);
      reveal();
    });
  }
  const nextCard = $('[data-next-slot]');
  if (nextCard) {
    const motif = MOTIFS[0];
    let best = null;
    for (const doctor of DOCTORS.filter((d) => d.motifs.includes(motif.id))) {
      const slot = firstSlot(doctor, motif);
      if (slot && (!best || slot.date < best.slot.date || (dayKey(slot.date) === dayKey(best.slot.date) && slot.time < best.slot.time))) best = { doctor, slot };
    }
    if (best) {
      $('[data-next-when]', nextCard).textContent = slotText(best.slot.date, best.slot.time);
      $('[data-next-who]', nextCard).textContent = `${motif.label} · ${best.doctor.name}`;
      nextCard.addEventListener('click', (event) => {
        event.preventDefault();
        chooseMotif(motif.id, false);
        chooseDoctor(best.doctor.id, false);
        state.slot = best.slot;
        go(3, false);
        reveal();
      });
    }
  }
  go(1, false);
}

// ---------- estimateur de reste à charge ----------
// La Sécurité sociale rembourse 60 % de sa base (BRSS). Une mutuelle « 200 % » couvre jusqu'à
// deux fois la base, part de la Sécurité sociale comprise. Les implants et l'orthodontie de
// l'adulte n'ont pas de base : seul un forfait de mutuelle peut jouer.
const ACTS = [
  { id: 'bilan', label: 'Consultation et bilan', price: 23, base: 23 },
  { id: 'detartrage', label: 'Détartrage', price: 28.92, base: 28.92 },
  { id: 'carie', label: 'Soin d’une carie (deux faces)', price: 50, base: 50 },
  { id: 'mtdents', label: 'Bilan enfant M’T dents', price: 30, base: 30, rate: 1, note: 'Le bilan M’T dents est pris en charge à 100 % par l’Assurance maladie, sans avance de frais.' },
  { id: 'couronne100', label: 'Couronne — panier 100 % Santé', price: 500, base: 120, zero: true },
  { id: 'couronne', label: 'Couronne tout céramique', price: 690, base: 107.5 },
  { id: 'implant', label: 'Implant, pilier et couronne', price: 2150, base: 107.5, forfait: true, note: 'L’implant et le pilier ne sont pas remboursés par la Sécurité sociale : seule la couronne a une base.' },
  { id: 'gouttieres', label: 'Gouttières d’alignement (adulte)', price: 3600, base: 0, forfait: true, note: 'Chez l’adulte, l’orthodontie n’a pas de base de remboursement : tout dépend du forfait de votre mutuelle.' },
];
const cents = (value) => Math.round(value * 100) / 100;

export function estimate({ price, base, rate = 0.6, level = 0, forfait = 0, zero = false }) {
  const ss = cents(Math.min(price, base * rate));
  let mutuelle = 0;
  if (level > 0) {
    if (zero) mutuelle = price - ss;
    else mutuelle = Math.max(0, Math.min(price - ss, (base * level) / 100 - ss)) + Math.max(0, forfait);
  }
  mutuelle = cents(Math.min(mutuelle, price - ss));
  return { ss, mutuelle, rac: cents(price - ss - mutuelle) };
}

const est = $('[data-estimator]');
if (est) {
  const select = $('[data-est-act]', est);
  const baseInput = $('[data-est-base]', est);
  const forfaitWrap = $('[data-est-forfait-wrap]', est);
  const forfaitInput = $('[data-est-forfait]', est);
  select.innerHTML = ACTS.map((a) => `<option value="${a.id}">${a.label} — ${a.price.toLocaleString('fr-FR')} €</option>`).join('');
  select.value = 'couronne';
  const number = (input) => Math.max(0, Number(String(input.value).replace(',', '.')) || 0);

  function setAct(id) {
    const act = ACTS.find((a) => a.id === id) || ACTS[0];
    select.value = act.id;
    baseInput.value = act.base.toFixed(2);
    forfaitWrap.hidden = !act.forfait;
    if (!act.forfait) forfaitInput.value = 0;
    update();
  }
  function update() {
    const act = ACTS.find((a) => a.id === select.value) || ACTS[0];
    const level = Number($('input[name="mutuelle"]:checked', est)?.value || 0);
    const rate = act.rate ?? 0.6;
    const result = estimate({ price: act.price, base: number(baseInput), rate, level, forfait: act.forfait ? number(forfaitInput) : 0, zero: act.zero });
    $('[data-est-rac]', est).textContent = euros(result.rac);
    $('[data-est-price]', est).textContent = euros(act.price);
    const minus = (value) => (value > 0 ? '− ' : '') + euros(value);
    $('[data-est-ss]', est).textContent = minus(result.ss);
    $('[data-est-mut]', est).textContent = minus(result.mutuelle);
    $('[data-est-you]', est).textContent = euros(result.rac);
    $('[data-est-rate]', est).textContent = `${Math.round(rate * 100)} % de ${euros(number(baseInput))}`;
    for (const [key, value] of [['ss', result.ss], ['mut', result.mutuelle], ['rac', result.rac]]) {
      $(`[data-est-bar="${key}"]`, est).style.flexBasis = `${(value / act.price) * 100}%`;
    }
    let note = act.note || '';
    if (act.zero) note = level > 0 ? 'Panier 100 % Santé : avec une mutuelle responsable, il ne vous reste rien à payer, quel que soit son niveau.' : 'Sans mutuelle, le panier 100 % Santé plafonne le prix mais ne supprime pas le reste à charge.';
    else if (!note && result.rac === 0) note = level > 0 ? 'Soin au tarif de la Sécurité sociale : votre mutuelle couvre le ticket modérateur, il ne vous reste rien à payer.' : '';
    else if (!note && level === 0) note = 'Sans mutuelle, vous payez le ticket modérateur (40 % de la base) et tout ce qui dépasse la base.';
    else if (!note) note = `Votre mutuelle complète jusqu’à ${level} % de la base, soit ${euros((number(baseInput) * level) / 100)} au total avec la Sécurité sociale.`;
    $('[data-est-note]', est).textContent = note;
  }
  select.addEventListener('change', () => setAct(select.value));
  est.addEventListener('input', (event) => { if (event.target !== select) update(); });
  for (const link of $$('[data-estimate]')) link.addEventListener('click', () => setAct(link.dataset.estimate));
  setAct('couronne');
}

// ---------- temps forts du film : trois cartes qui s'allument au fil du plan ----------
const film = document.getElementById('film');
const beats = $$('[data-beats] .beat');
if (film && beats.length) {
  let shown = -1;
  const onScroll = () => {
    const rect = film.getBoundingClientRect();
    const travel = rect.height - innerHeight;
    const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
    const index = Math.min(beats.length - 1, Math.floor(progress * beats.length * 0.999));
    if (index === shown) return;
    shown = index;
    beats.forEach((beat, i) => {
      beat.classList.toggle('is-on', i === index);
      beat.classList.toggle('is-done', i < index);
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();
}

// ---------- ouvert ou fermé, là, maintenant ----------
{
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const hours = OPEN[now.getDay()];
  const chip = $('[data-open-status]');
  if (chip) {
    const open = hours && minutes >= hours[0] && minutes < hours[3];
    let text;
    if (open) text = `Ouvert · jusqu’à ${hourText(hours[3])}`;
    else if (hours && minutes < hours[0]) text = `Fermé · ouvre à ${hourText(hours[0])}`;
    else {
      let next = addDays(now, 1);
      while (!OPEN[next.getDay()]) next = addDays(next, 1);
      text = `Fermé · réouverture ${dayOffset(next, now) === 1 ? 'demain' : DAYS[next.getDay()]} à ${hourText(OPEN[next.getDay()][0])}`;
    }
    chip.classList.add(open ? 'is-open' : 'is-closed');
    $('span', chip).textContent = text;
  }
  $(`[data-hours] tr[data-day="${now.getDay()}"]`)?.classList.add('is-today');
}
