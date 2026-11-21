// LAME — l'interface du métier : le ticket du salon d'essayage, la réservation en trois temps
// (prestation → barbier → créneau), le statut « ouvert / fermé ». Rien n'est envoyé : les agendas
// sont fabriqués dans la page, de façon stable pour une même journée.

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const hm = (minutes) => `${Math.floor(minutes / 60)} h${minutes % 60 ? ' ' + String(minutes % 60).padStart(2, '0') : ''}`;
const span = (minutes) => (minutes >= 60 ? hm(minutes) : `${minutes} min`);
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const OPEN = 9 * 60 + 30; // 9 h 30
const CLOSE = 19 * 60 + 30; // 19 h 30
const UNIT = 15; // l'agenda est découpé en quarts d'heure
const UNITS = (CLOSE - OPEN) / UNIT;
const DUO = 4; // remise coupe + barbe le même jour
// `off` : jour de repos (0 = dimanche) ; `lunch` : quart d'heure où commence la pause.
const BARBERS = [
  { id: 'malik', name: 'Malik', off: 1, lunch: 14 },
  { id: 'jo', name: 'Jo', off: 3, lunch: 12 },
  { id: 'ines', name: 'Inès', off: 1, lunch: 16 },
  { id: 'theo', name: 'Théo', off: 4, lunch: 18 },
];

// ---------- ouvert / fermé ----------
function openStatus(now = new Date()) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (now.getDay() !== 0 && minutes >= OPEN && minutes < CLOSE) return { open: true, text: `Ouvert · ferme à ${hm(CLOSE)}` };
  let next = 'demain';
  if (now.getDay() !== 0 && minutes < OPEN) next = "aujourd'hui";
  else if (now.getDay() === 6) next = 'lundi';
  return { open: false, text: `Fermé · ouvre ${next} à ${hm(OPEN)}` };
}
const status = openStatus();
for (const node of $$('[data-open-status]')) {
  node.textContent = status.text;
  node.classList.add(status.open ? 'is-open' : 'is-closed');
}

// ---------- le salon d'essayage : coupe + barbe → ticket ----------
const essai = $('[data-essai]');
const form = $('[data-resa]');
const setRadio = (name, value) => {
  const input = form && $(`input[name="${name}"][value="${value}"]`, form);
  if (input) input.checked = true;
};

if (essai) {
  const cuts = $$('input[name="look-coupe"]', essai);
  const beards = $$('input[name="look-barbe"]', essai);
  const solo = $('[data-look-solo]', essai);
  const refreshLook = () => {
    const cut = cuts.find((input) => input.checked) || cuts[0];
    const beard = beards.find((input) => input.checked) || beards[0];
    const withBeard = !solo.checked;
    const minutes = Number(cut.dataset.min) + (withBeard ? Number(beard.dataset.min) : 0);
    const price = Number(cut.dataset.price) + (withBeard ? Number(beard.dataset.price) - DUO : 0);
    $('[data-look-ghost]', essai).textContent = cut.dataset.name.split(' ')[0];
    $('[data-look-code]', essai).textContent = `N° ${String(cuts.indexOf(cut) + 1).padStart(2, '0')} · B${beards.indexOf(beard) + 1}`;
    $('[data-look-coupe]', essai).textContent = cut.dataset.name;
    $('[data-look-coupe-meta]', essai).textContent = `${cut.dataset.min} min · ${cut.dataset.price} €`;
    $('[data-look-barbe]', essai).textContent = beard.dataset.name;
    $('[data-look-barbe-meta]', essai).textContent = withBeard ? `${beard.dataset.min} min · ${beard.dataset.price} €` : 'non comptée';
    $('[data-look-barbe-line]', essai).classList.toggle('is-off', !withBeard);
    $('[data-look-duo]', essai).hidden = !withBeard;
    $('[data-look-total]', essai).textContent = `${price} €`;
    $('[data-look-time]', essai).textContent = `${span(minutes)} au fauteuil`;
  };
  [...cuts, ...beards, solo].forEach((input) => input.addEventListener('change', refreshLook));
  refreshLook();
  // « Réserver ce look » : la prestation est reportée dans la réservation
  $('[data-look-book]', essai).addEventListener('click', () => {
    const cut = cuts.find((input) => input.checked) || cuts[0];
    const beard = beards.find((input) => input.checked) || beards[0];
    setRadio('coupe', cut.dataset.presta);
    setRadio('barbe', solo.checked ? 'aucune' : beard.dataset.presta);
    if (form) form.dispatchEvent(new Event('change'));
  });
}

// ---------- la réservation ----------
if (form) booking();

function booking() {
  const picked = (name) => $(`input[name="${name}"]:checked`, form);
  const daysBox = $('[data-days]', form);
  const slotsBox = $('[data-slots]', form);
  const note = $('[data-slots-note]', form);
  const error = $('[data-error]', form);
  const done = $('[data-done]', form);

  // les deux prochains jours ouverts, aujourd'hui compris s'il reste du temps avant la fermeture
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const days = [];
  for (let n = 0; n < 8 && days.length < 2; n++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + n);
    if (date.getDay() === 0 || (n === 0 && nowMinutes > CLOSE - 30)) continue;
    days.push({
      date,
      today: n === 0,
      key: date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate(),
      title: n === 0 ? "Aujourd'hui" : n === 1 ? 'Demain' : cap(DAYS[date.getDay()]),
      long: `${DAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`,
    });
  }
  let dayIndex = 0;
  let slot = null; // { unit, barber }

  // agenda d'un barbier pour un jour : 1 = pris. Tiré au sort, mais toujours pareil pour ce jour-là.
  const agendas = new Map();
  function agenda(day, b) {
    const id = `${day.key}:${b}`;
    if (agendas.has(id)) return agendas.get(id);
    const busy = new Uint8Array(UNITS);
    const barber = BARBERS[b];
    if (day.date.getDay() === barber.off) busy.fill(1);
    else {
      let seed = (day.key * 31 + b * 7919) >>> 0;
      const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
      for (let n = 0; n < 4; n++) rnd();
      busy.fill(1, barber.lunch, barber.lunch + 3);
      const load = (day.today ? 0.5 : 0.3) + (day.date.getDay() === 6 ? 0.06 : 0);
      for (let t = 0; t < UNITS; ) {
        if (rnd() < load) {
          const length = 2 + Math.floor(rnd() * 3);
          busy.fill(1, t, Math.min(UNITS, t + length));
          t += length;
        } else t += 2 + Math.floor(rnd() * 2);
      }
    }
    agendas.set(id, busy);
    return busy;
  }
  const fits = (day, b, unit, length) => {
    if (unit + length > UNITS) return false;
    const busy = agenda(day, b);
    for (let n = unit; n < unit + length; n++) if (busy[n]) return false;
    return true;
  };

  function basket() {
    const cut = picked('coupe'), beard = picked('barbe');
    const lines = [cut, beard].filter((input) => input && input.value !== 'aucune')
      .map((input) => ({ name: input.dataset.name, minutes: Number(input.dataset.min), price: Number(input.dataset.price) }));
    const duo = lines.length === 2 && cut.value !== 'gamin';
    return {
      lines,
      duo,
      minutes: lines.reduce((sum, line) => sum + line.minutes, 0),
      price: lines.reduce((sum, line) => sum + line.price, 0) - (duo ? DUO : 0),
    };
  }

  function renderDays() {
    daysBox.replaceChildren(...days.map((day, n) => {
      const label = document.createElement('label');
      label.className = 'day';
      label.innerHTML = `<input type="radio" name="jour" value="${n}"${n === dayIndex ? ' checked' : ''}><span>${day.title}</span><em>${day.long}</em>`;
      return label;
    }));
  }

  function render() {
    const order = basket();
    const day = days[dayIndex];
    const want = picked('barbier').value;
    const length = Math.ceil(order.minutes / UNIT);
    const list = want === 'auto' ? BARBERS.map((_, b) => b) : [BARBERS.findIndex((barber) => barber.id === want)];

    // créneaux : un départ toutes les demi-heures ; libre si un barbier a toute la durée devant lui
    const labels = [];
    let free = 0, keep = null;
    for (let unit = 0; unit < UNITS; unit += 2) {
      const start = OPEN + unit * UNIT;
      const past = day.today && start < nowMinutes + 5;
      let barber = -1;
      if (!past && length > 0) {
        for (let o = 0; o < list.length && barber < 0; o++) {
          const b = list[(unit / 2 + o) % list.length];
          if (fits(day, b, unit, length)) barber = b;
        }
      }
      const ok = barber >= 0;
      if (ok) free++;
      const selected = ok && slot && slot.unit === unit;
      if (selected) keep = { unit, barber };
      const label = document.createElement('label');
      label.className = 'slot' + (ok ? '' : ' is-full');
      label.innerHTML = `<input type="radio" name="creneau" value="${unit}"${ok ? '' : ' disabled'}${selected ? ' checked' : ''}><span>${hm(start)}</span>`;
      if (!ok) label.title = past ? 'Créneau passé' : 'Complet';
      label.dataset.barber = String(barber);
      labels.push(label);
    }
    const lost = slot && !keep;
    slot = keep;
    slotsBox.replaceChildren(...labels);

    const single = want === 'auto' ? null : BARBERS[list[0]];
    if (!order.lines.length) note.textContent = "Choisis d'abord une prestation.";
    else if (single && day.date.getDay() === single.off) note.textContent = `${single.name} ne travaille pas le ${DAYS[single.off]} : change de jour ou prends « Premier disponible ».`;
    else if (!free) note.textContent = `Complet ${day.today ? "aujourd'hui" : day.long} pour ${span(order.minutes)} d'affilée. Essaie l'autre jour.`;
    else note.textContent = `${free} créneau${free > 1 ? 'x' : ''} libre${free > 1 ? 's' : ''} pour ${span(order.minutes)}${single ? ' avec ' + single.name : ''}${lost ? ' — ton créneau précédent ne tient plus.' : ''}`;

    // récapitulatif
    const rows = order.lines.map((line) => `<div><dt>${line.name}</dt><dd>${line.minutes} min · ${line.price} €</dd></div>`);
    if (order.duo) rows.push(`<div class="is-duo"><dt>Duo coupe + barbe</dt><dd>− ${DUO} €</dd></div>`);
    $('[data-recap-lines]', form).innerHTML = rows.join('') || '<div><dt>Aucune prestation</dt><dd>—</dd></div>';
    $('[data-recap-total]', form).textContent = `${order.price} €`;
    $('[data-recap-time]', form).textContent = order.minutes ? span(order.minutes) : '';
    const who = slot ? BARBERS[slot.barber].name + (want === 'auto' ? ' (premier disponible)' : '') : picked('barbier').dataset.name;
    $('[data-recap-who]', form).textContent = who;
    const start = slot ? OPEN + slot.unit * UNIT : 0;
    $('[data-recap-when]', form).textContent = slot ? `${cap(day.long)} · ${hm(start)} → ${hm(start + order.minutes)}` : 'Choisis un créneau';
    form.classList.toggle('has-slot', Boolean(slot));
    return order;
  }

  form.addEventListener('change', (event) => {
    const input = event.target;
    if (input && input.name === 'jour') dayIndex = Number(input.value);
    if (input && input.name === 'creneau') {
      const label = input.closest('.slot');
      slot = { unit: Number(input.value), barber: Number(label.dataset.barber) };
    }
    error.textContent = '';
    if (form.classList.contains('is-done') && input && input.name !== 'prenom' && input.name !== 'tel') {
      form.classList.remove('is-done');
      done.textContent = '';
    }
    render();
    // le clic remplace les boutons : on rend le focus au créneau choisi
    if (input && input.name === 'creneau') { const again = $('input[name="creneau"]:checked', form); if (again) again.focus({ preventScroll: true }); }
    if (input && input.name === 'jour') { const again = $('input[name="jour"]:checked', form); if (again) again.focus({ preventScroll: true }); }
  });

  // Validation : ce module est chargé avant ui.js, il peut donc arrêter l'envoi simulé.
  form.addEventListener('submit', (event) => {
    const order = basket();
    const name = form.elements.prenom, phone = form.elements.tel;
    let message = '', focus = null;
    if (!order.lines.length) { message = 'Choisis au moins une prestation.'; focus = picked('coupe'); }
    else if (!slot) { message = 'Il manque le créneau : choisis une heure libre.'; focus = $('input[name="creneau"]:not(:disabled)', form); }
    else if (!name.value.trim()) { message = 'Indique ton prénom.'; focus = name; }
    else if (phone.value.replace(/\D/g, '').length < 10) { message = 'Indique un numéro à dix chiffres : on envoie un SMS de rappel.'; focus = phone; }
    if (message) {
      event.preventDefault();
      event.stopImmediatePropagation();
      error.textContent = message;
      if (focus) focus.focus();
      return;
    }
    const day = days[dayIndex];
    const start = OPEN + slot.unit * UNIT;
    form.dataset.demo = `Démonstration : rien n’a été envoyé. En vrai, ${name.value.trim()}, tu serais attendu ${day.today ? "aujourd'hui" : day.long} à ${hm(start)} au fauteuil de ${BARBERS[slot.barber].name} — ${order.lines.map((line) => line.name.toLowerCase()).join(' + ')}, ${order.price} € à régler sur place.`;
    // le créneau validé devient « complet », et l'on garde les choix après la remise à zéro du formulaire
    agenda(day, slot.barber).fill(1, slot.unit, slot.unit + Math.ceil(order.minutes / UNIT));
    const memory = { coupe: picked('coupe').value, barbe: picked('barbe').value, barbier: picked('barbier').value };
    slot = null;
    setTimeout(() => {
      for (const [field, value] of Object.entries(memory)) setRadio(field, value);
      renderDays();
      render();
      form.classList.add('is-done');
    }, 0);
  });

  // boutons « Réserver » de la carte et de l'équipe
  for (const link of $$('[data-pick-coupe], [data-pick-barbe], [data-pick-barbier]')) {
    link.addEventListener('click', () => {
      const { pickCoupe, pickBarbe, pickBarbier } = link.dataset;
      if (pickCoupe) setRadio('coupe', pickCoupe);
      if (pickBarbe) setRadio('barbe', pickBarbe);
      if (pickBarbier) setRadio('barbier', pickBarbier);
      form.dispatchEvent(new Event('change'));
    });
  }

  renderDays();
  render();
}
