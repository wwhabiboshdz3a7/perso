// Atelier 31 — devis instantané, suivi de réparation, état d'ouverture.
// Tout se calcule dans la page ; rien n'est envoyé.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const round5 = (value) => Math.round(value / 5) * 5;
const euros = (value) => value.toLocaleString('fr-FR') + ' €';

// ---------- barème ----------
const RATE = 78; // main-d'œuvre, € TTC de l'heure
const ORIGIN = 1.22; // surcoût des pièces d'origine constructeur
const LOAN = { freeFrom: 3, price: 19 };
const CATS = {
  citadine: { label: 'Citadine', labour: 0.9, parts: 0.85 },
  compacte: { label: 'Compacte', labour: 1, parts: 1 },
  suv: { label: 'SUV', labour: 1.1, parts: 1.2 },
  sport: { label: 'Sportive', labour: 1.3, parts: 1.7 },
};
const JOBS = {
  revision: { label: 'Révision', hours: 1.5, parts: [95, 150] },
  'freins-av': { label: 'Freins avant', hours: 1.5, parts: [150, 260] },
  'freins-ar': { label: 'Freins arrière', hours: 1.3, parts: [110, 200] },
  distribution: { label: 'Distribution', hours: 4.5, parts: [210, 340] },
  clim: { label: 'Climatisation', hours: 0.8, parts: [45, 70] },
  pneus: { label: 'Pneus', hours: 0.25, parts: [85, 150], unit: true },
};

function quote({ jobs, cat, tyres, loan, origin }) {
  const c = CATS[cat] || CATS.compacte;
  const lines = [];
  let hours = 0;
  for (const id of jobs) {
    const job = JOBS[id];
    if (!job) continue;
    const count = job.unit ? tyres : 1;
    const h = job.hours * c.labour * count;
    const k = c.parts * count * (origin ? ORIGIN : 1);
    hours += h;
    lines.push({ label: job.unit ? `${job.label} × ${count}` : job.label, min: round5(h * RATE + job.parts[0] * k), max: round5(h * RATE + job.parts[1] * k) });
  }
  let extra = 0;
  if (loan && lines.length) {
    extra = hours >= LOAN.freeFrom ? 0 : LOAN.price;
    lines.push({ label: 'Véhicule de prêt', fixed: extra, note: extra ? '' : 'offert' });
  }
  const sum = (key) => lines.reduce((total, line) => total + (line.fixed ?? line[key]), 0);
  return { lines, hours, min: sum('min'), max: sum('max'), cat: c };
}

function duration(hours) {
  const minutes = Math.max(15, Math.round((hours * 60) / 15) * 15);
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return h ? `${h} h${m ? ' ' + String(m).padStart(2, '0') : ''}` : `${m} min`;
}

// Premier créneau : deux jours ouvrés pour une intervention courte, quatre sinon. Le samedi matin
// ne reçoit que les interventions de moins de deux heures ; le dimanche, l'atelier est fermé.
function firstSlot(hours) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  let left = hours <= 3 ? 2 : 4;
  while (left > 0) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day === 0 || (day === 6 && hours > 2)) continue;
    left -= 1;
  }
  return date;
}
const dayLabel = (date) => new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
const isoDay = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// ---------- devis instantané ----------
const devis = document.querySelector('[data-devis]');
if (devis) {
  const $ = (selector) => devis.querySelector(selector);
  const price = $('[data-q-price]');
  const lines = $('[data-q-lines]');
  const form = $('[data-q-form]');
  const date = $('[data-q-date]');
  const submit = $('[data-q-submit]');
  const tyresBox = $('[data-tyres]');
  let shown = { min: 0, max: 0 }, tween = 0, slotDay = '';

  function paint(min, max) {
    price.replaceChildren();
    const a = document.createElement('span'), dash = document.createElement('i'), b = document.createElement('span'), unit = document.createElement('em');
    a.textContent = Math.round(min).toLocaleString('fr-FR');
    dash.textContent = '–';
    b.textContent = Math.round(max).toLocaleString('fr-FR');
    unit.textContent = '€ TTC';
    price.append(a, dash, b, unit);
  }

  function update() {
    const choice = {
      jobs: [...devis.querySelectorAll('input[name="presta"]:checked')].map((input) => input.value),
      cat: devis.querySelector('input[name="cat"]:checked')?.value || 'compacte',
      tyres: Number(devis.querySelector('input[name="pneus-n"]:checked')?.value) || 2,
      loan: devis.querySelector('input[name="pret"]').checked,
      origin: devis.querySelector('input[name="origine"]').checked,
    };
    tyresBox.hidden = !choice.jobs.includes('pneus');
    const result = quote(choice);
    const empty = !choice.jobs.length;
    price.classList.toggle('is-empty', empty);
    submit.disabled = empty;
    cancelAnimationFrame(tween);
    lines.replaceChildren();

    if (empty) {
      price.textContent = 'Choisissez au moins une prestation';
      $('[data-q-ref]').textContent = `${result.cat.label} · aucune prestation`;
      $('[data-q-time]').textContent = '—';
      $('[data-q-stay]').textContent = '—';
      $('[data-q-slot]').textContent = '—';
      shown = { min: 0, max: 0 };
      return;
    }

    // le prix défile jusqu'à sa nouvelle valeur
    const from = { ...shown }, start = performance.now();
    shown = { min: result.min, max: result.max };
    if (reduced || (!from.min && !from.max)) paint(result.min, result.max);
    else {
      const tick = (now) => {
        const p = Math.min(1, (now - start) / 380), e = 1 - Math.pow(1 - p, 3);
        paint(from.min + (result.min - from.min) * e, from.max + (result.max - from.max) * e);
        if (p < 1) tween = requestAnimationFrame(tick);
      };
      tween = requestAnimationFrame(tick);
    }

    const count = choice.jobs.length;
    $('[data-q-ref]').textContent = `${result.cat.label} · ${count} prestation${count > 1 ? 's' : ''}`;
    $('[data-q-time]').textContent = duration(result.hours);
    $('[data-q-stay]').textContent = result.hours <= 2 ? 'Sur place, au salon d’attente' : result.hours <= 4.5 ? 'Une demi-journée' : result.hours <= 8 ? 'La journée, rendue le soir même' : 'Deux jours';
    const slot = firstSlot(result.hours);
    $('[data-q-slot]').textContent = `${dayLabel(slot)}, 8 h`;
    if (isoDay(slot) !== slotDay) {
      slotDay = isoDay(slot);
      date.min = slotDay;
      if (!date.value || date.value < slotDay) date.value = slotDay;
    }

    for (const line of result.lines) {
      const item = document.createElement('li'), name = document.createElement('span'), amount = document.createElement('span');
      name.textContent = line.label;
      amount.textContent = line.fixed !== undefined ? (line.fixed ? euros(line.fixed) : line.note) : `${line.min.toLocaleString('fr-FR')} – ${euros(line.max)}`;
      item.append(name, amount);
      lines.append(item);
    }
    const note = document.createElement('li');
    note.className = 'is-note';
    note.textContent = `Main-d’œuvre ${RATE} € / h · pièces ${choice.origin ? 'd’origine constructeur' : 'de qualité équivalente à l’origine'} · TVA comprise.`;
    lines.append(note);

    const summary = result.lines.filter((line) => line.fixed === undefined).map((line) => line.label).join(' + ');
    form.dataset.demo = `Merci. Demande notée : ${summary} (${result.cat.label.toLowerCase()}), ${result.min.toLocaleString('fr-FR')} à ${euros(result.max)}. Ceci est une démonstration : rien n’a été envoyé.`;
  }

  devis.addEventListener('change', (event) => { if (event.target.matches('input[name="presta"], input[name="cat"], input[name="pneus-n"], input[name="pret"], input[name="origine"]')) update(); });
  // après l'envoi simulé (ui.js vide le formulaire), on remet la date proposée
  form.addEventListener('submit', () => setTimeout(() => { date.value = slotDay; }, 0));
  // la saisie efface le message de confirmation précédent
  form.addEventListener('input', () => { const done = form.querySelector('[data-done]'); if (done) done.textContent = ''; });

  // « Chiffrer… » depuis la vue éclatée ou ailleurs : coche la prestation correspondante
  document.addEventListener('click', (event) => {
    const link = event.target.closest?.('[data-pick]');
    if (!link) return;
    const input = devis.querySelector(`input[name="presta"][value="${link.dataset.pick}"]`);
    if (input && !input.checked) { input.checked = true; update(); }
  });

  // prix « à partir de » de la grille tarifaire : même barème, citadine
  for (const cell of document.querySelectorAll('[data-from]')) {
    const from = quote({ jobs: [cell.dataset.from], cat: 'citadine', tyres: 1 });
    if (from.lines.length) cell.textContent = euros(from.min);
  }
  update();
}

// ---------- suivi de réparation ----------
const suivi = document.querySelector('[data-suivi]');
if (suivi) {
  const STEPS = ['Réception', 'Diagnostic', 'Accord du devis', 'Intervention', 'Contrôle et essai', 'Prêt à restituer'];
  const short = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  // jour ouvré : aujourd'hui (0) ou n jours plus tôt, en sautant le dimanche
  const day = (back) => {
    const date = new Date();
    for (let i = 0; i < back; i++) { date.setDate(date.getDate() - 1); if (date.getDay() === 0) date.setDate(date.getDate() - 1); }
    return short.format(date);
  };
  const DOSSIERS = {
    'A31-2026-118': {
      car: 'Coupé 2.0 turbo · FG-118-KL', job: 'Freins avant, purge du liquide', tech: 'Karim B.', step: 3,
      eta: 'Aujourd’hui, 17 h', total: '412 €',
      times: [`${day(1)} · 8 h 12`, `${day(1)} · 9 h 40`, `${day(1)} · 11 h 05`, `${day(0)} · 8 h 30`],
      note: 'Disques déposés : 25,8 mm pour une cote minimale de 26. Étriers nettoyés, remontage en cours, essai routier vers 15 h 30.',
    },
    'A31-2026-124': {
      car: 'SUV hybride · GH-124-MN', job: 'Révision, bruit au freinage', tech: 'Élodie M.', step: 2,
      eta: 'Demain, 12 h, si accord ce jour', total: '389 € à valider',
      times: [`${day(0)} · 7 h 48`, `${day(0)} · 9 h 15`],
      note: 'Plaquettes arrière à 2 mm, photos envoyées par SMS. Le devis complémentaire (185 €) attend votre accord : rien n’est démonté d’ici là.',
      action: true,
    },
    'A31-2026-097': {
      car: 'Citadine 1.2 · EF-097-HJ', job: 'Distribution et pompe à eau', tech: 'Thomas R.', step: 5,
      eta: 'Disponible à l’accueil', total: '548 € réglés',
      times: [`${day(3)} · 8 h 02`, `${day(3)} · 10 h 20`, `${day(3)} · 14 h 10`, `${day(2)} · 8 h 15`, `${day(1)} · 16 h 40`, `${day(1)} · 17 h 25`],
      note: 'Essai de 12 km sans défaut, niveaux refaits. Les anciennes pièces sont dans le coffre, comme convenu. Clés à l’accueil jusqu’à 18 h 30.',
    },
  };

  const form = suivi.querySelector('[data-sv-form]');
  const input = form.querySelector('input');
  const message = suivi.querySelector('[data-sv-msg]');
  const result = suivi.querySelector('[data-sv-result]');
  const examples = [...suivi.querySelectorAll('[data-sv-ex]')];
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function render(id) {
    const file = DOSSIERS[id];
    result.replaceChildren();
    const done = file.step >= STEPS.length - 1;

    const top = el('div', 'sv__top');
    const stateBox = el('div', 'sv__state');
    const big = el('b', '', String(file.step + 1).padStart(2, '0'));
    big.append(el('small', '', ' / 06'));
    stateBox.append(el('span', 'lbl', id), big, el('span', 'lbl', STEPS[file.step] + (done ? '' : ' en cours')));
    const meta = el('dl', 'sv__meta');
    for (const [label, value] of [['Véhicule', file.car], ['Intervention', file.job], ['Technicien · montant', `${file.tech} · ${file.total}`]]) {
      const cell = el('div');
      cell.append(el('dt', '', label), el('dd', '', value));
      meta.append(cell);
    }
    const eta = el('dl', 'sv__eta');
    eta.append(el('dt', '', 'Restitution'), el('dd', '', file.eta));
    top.append(stateBox, meta, eta);

    const list = el('ol', 'sv__steps');
    STEPS.forEach((name, index) => {
      const status = index < file.step || done ? 'is-done' : index === file.step ? 'is-now' : 'is-todo';
      const item = el('li', status);
      if (status === 'is-now') item.setAttribute('aria-current', 'step');
      item.append(el('i', '', String(index + 1).padStart(2, '0')), el('h3', '', name), el('p', '', file.times[index] || (status === 'is-now' ? 'En attente' : 'À venir')));
      list.append(item);
    });

    const note = el('div', 'sv__note');
    note.append(el('span', 'lbl', `Message de ${file.tech}`), el('p', '', file.note));
    if (file.action) {
      const accept = el('button', 'btn btn--ink', 'Donner mon accord');
      accept.type = 'button';
      accept.addEventListener('click', () => {
        // démonstration : l'accord fait avancer le dossier d'une étape, dans la page seulement
        file.action = false;
        file.step = 3;
        file.times[2] = 'À l’instant';
        file.times[3] = 'Démarre à 14 h';
        file.total = '574 € validés';
        file.eta = 'Demain, 12 h';
        file.note = 'Accord reçu, merci. Les plaquettes arrière sont en stock : l’intervention démarre à 14 h. (Démonstration : rien n’a été envoyé.)';
        render(id);
      });
      note.append(accept);
    }
    result.append(top, list, note);
  }

  function lookup(raw) {
    const id = raw.trim().toUpperCase().replace(/\s+/g, '').replace(/^A31-?(\d{4})-?(\d{3})$/, 'A31-$1-$2');
    for (const button of examples) button.setAttribute('aria-pressed', String(button.dataset.svEx === id));
    input.removeAttribute('aria-invalid');
    if (!/^A31-\d{4}-\d{3}$/.test(id)) {
      message.textContent = 'Format attendu : A31-2026-118 (A31, l’année, trois chiffres).';
      input.setAttribute('aria-invalid', 'true');
      result.replaceChildren();
      return;
    }
    input.value = id;
    if (!DOSSIERS[id]) {
      message.textContent = `Aucun dossier ${id} dans cette démonstration. Essayez A31-2026-118.`;
      input.setAttribute('aria-invalid', 'true');
      result.replaceChildren();
      return;
    }
    message.textContent = '';
    render(id);
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); lookup(input.value); });
  for (const button of examples) button.addEventListener('click', () => { input.value = button.dataset.svEx; lookup(input.value); });
  lookup(input.value);
}

// ---------- ouvert ou fermé, à l'heure de Toulouse ----------
const open = document.querySelector('[data-open]');
if (open) {
  try {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date()).map((p) => [p.type, p.value]));
    const now = Number(parts.hour) * 60 + Number(parts.minute);
    const hours = { Sat: [480, 720], Sun: null }[parts.weekday];
    const span = hours === undefined ? [450, 1110] : hours;
    const close = span && now >= span[0] && now < span[1] ? span[1] : 0;
    if (close) open.textContent = `Ouvert · jusqu’à ${Math.floor(close / 60)} h${close % 60 ? ' ' + (close % 60) : ''}`;
    else open.textContent = parts.weekday === 'Sat' && now >= 720 || parts.weekday === 'Sun' ? 'Fermé · réouverture lundi 7 h 30' : parts.weekday === 'Fri' && now >= 1110 ? 'Fermé · réouverture samedi 8 h' : now < 450 ? 'Fermé · ouverture à 7 h 30' : 'Fermé · réouverture demain';
  } catch { /* on garde les horaires écrits dans la page */ }
}
