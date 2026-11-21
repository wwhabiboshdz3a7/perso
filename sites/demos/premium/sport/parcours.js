// FORGE — parcours : planning filtrable et réservation simulée, bascule mensuel / annuel,
// compteurs, statut d'ouverture. Rien n'est envoyé : tout vit dans la page.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fr = (value, digits = 0) => value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

// ---------- planning ----------
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const DISCIPLINES = { haltero: 'Haltérophilie', kettlebell: 'Kettlebell', conditionnement: 'Conditionnement', bases: 'Bases de la barre' };
const LEVELS = { tous: 'Tous niveaux', debutant: 'Débutant', intermediaire: 'Intermédiaire', confirme: 'Confirmé' };
const CAPACITY = 8;
// [jour, heure, durée (min), discipline, niveau, coach, places prises]
const CLASSES = [
  [0, '07:00', 60, 'kettlebell', 'tous', 'Malik', 5], [0, '12:15', 45, 'conditionnement', 'intermediaire', 'Malik', 8], [0, '18:00', 75, 'bases', 'debutant', 'Théo', 6], [0, '19:30', 90, 'haltero', 'intermediaire', 'Inès', 7],
  [1, '06:30', 45, 'conditionnement', 'tous', 'Malik', 3], [1, '12:15', 60, 'haltero', 'debutant', 'Inès', 4], [1, '18:30', 60, 'kettlebell', 'intermediaire', 'Malik', 8], [1, '19:45', 90, 'haltero', 'confirme', 'Inès', 6],
  [2, '07:00', 75, 'bases', 'debutant', 'Théo', 2], [2, '12:15', 45, 'kettlebell', 'tous', 'Malik', 7], [2, '17:30', 45, 'conditionnement', 'tous', 'Malik', 5], [2, '19:00', 90, 'haltero', 'intermediaire', 'Inès', 8],
  [3, '06:30', 60, 'kettlebell', 'intermediaire', 'Malik', 4], [3, '12:15', 45, 'conditionnement', 'intermediaire', 'Malik', 6], [3, '18:00', 75, 'bases', 'debutant', 'Théo', 7], [3, '19:30', 90, 'haltero', 'confirme', 'Inès', 5],
  [4, '07:00', 60, 'haltero', 'debutant', 'Inès', 3], [4, '12:15', 45, 'kettlebell', 'tous', 'Malik', 6], [4, '18:00', 45, 'conditionnement', 'confirme', 'Malik', 7],
  [5, '09:00', 75, 'bases', 'debutant', 'Théo', 5], [5, '10:30', 90, 'haltero', 'intermediaire', 'Inès', 8], [5, '12:00', 60, 'kettlebell', 'tous', 'Malik', 4],
  [6, '10:00', 45, 'conditionnement', 'tous', 'Malik', 6],
].map(([day, time, minutes, disc, level, coach, taken], id) => {
  const hour = Number(time.slice(0, 2));
  return { id, day, time, minutes, disc, level, coach, taken, booked: false, waiting: false, slot: hour < 12 ? 'matin' : hour < 15 ? 'midi' : 'soir' };
});
const hourText = (time) => (time.endsWith(':00') ? `${Number(time.slice(0, 2))} h` : `${Number(time.slice(0, 2))} h ${time.slice(3)}`);

const planning = document.querySelector('[data-planning]');
if (planning) {
  const week = planning.querySelector('[data-week]');
  const countOut = planning.querySelector('[data-count-out]');
  const title = planning.querySelector('[data-ticket-title]');
  const meta = planning.querySelector('[data-ticket-meta]');
  const form = planning.querySelector('[data-book]');
  const submit = planning.querySelector('[data-book-submit]');
  const message = planning.querySelector('[data-book-msg]');
  const filters = { disc: '', level: '', slot: '' };
  const today = (new Date().getDay() + 6) % 7;
  let picked = null;

  // construction de la grille : une colonne par jour
  const columns = DAYS.map((name, index) => {
    const column = document.createElement('section');
    column.className = 'day' + (index === today ? ' day--today' : '');
    const head = document.createElement('h3');
    head.className = 'day__name';
    head.innerHTML = `<span>${name.slice(0, 3)}.</span>${index === today ? '<small>Auj.</small>' : ''}`;
    head.setAttribute('aria-label', name + (index === today ? ', aujourd’hui' : ''));
    const empty = document.createElement('p');
    empty.className = 'day__empty';
    empty.textContent = 'Aucun cours avec ces filtres';
    empty.hidden = true;
    column.append(head, empty);
    week.append(column);
    return { column, empty };
  });
  for (const item of CLASSES) {
    const card = document.createElement('article');
    card.className = 'slot';
    card.innerHTML = `
      <p class="slot__time">${hourText(item.time)}<small>${item.minutes} min</small></p>
      <h4 class="slot__name">${DISCIPLINES[item.disc]}</h4>
      <p class="slot__meta">${LEVELS[item.level]} · ${item.coach}</p>
      <div class="seats" aria-hidden="true">${'<i></i>'.repeat(CAPACITY)}</div>
      <p class="slot__left"></p>
      <button class="slot__btn" type="button"></button>`;
    item.card = card;
    item.button = card.querySelector('button');
    item.button.addEventListener('click', () => (item.booked || item.waiting ? cancel(item) : pick(item)));
    columns[item.day].column.append(card);
    paint(item);
  }

  function describe(item) {
    return `${DISCIPLINES[item.disc]}, ${DAYS[item.day].toLowerCase()} à ${hourText(item.time)}`;
  }

  function paint(item) {
    const left = CAPACITY - item.taken, full = left <= 0;
    item.card.classList.toggle('is-full', full && !item.booked);
    item.card.classList.toggle('is-booked', item.booked || item.waiting);
    item.card.classList.toggle('is-picked', picked === item);
    item.card.querySelectorAll('.seats i').forEach((seat, index) => seat.classList.toggle('free', index >= item.taken));
    const leftText = item.card.querySelector('.slot__left');
    if (item.booked) leftText.textContent = 'Ta place est réservée';
    else if (item.waiting) leftText.textContent = 'Tu es en liste d’attente';
    else leftText.textContent = full ? 'Complet' : left === 1 ? 'Dernière place' : `${left} places restantes`;
    item.button.textContent = item.booked || item.waiting ? 'Annuler' : full ? 'Liste d’attente' : 'Réserver';
    item.button.setAttribute('aria-label', `${item.button.textContent} : ${describe(item)}`);
  }

  function applyFilters() {
    let shown = 0;
    const perDay = DAYS.map(() => 0);
    for (const item of CLASSES) {
      const match = (!filters.disc || item.disc === filters.disc) && (!filters.level || item.level === filters.level || item.level === 'tous') && (!filters.slot || item.slot === filters.slot);
      item.card.hidden = !match;
      if (match) { shown += 1; perDay[item.day] += 1; }
    }
    columns.forEach(({ empty }, index) => { empty.hidden = perDay[index] > 0; });
    countOut.textContent = shown === CLASSES.length ? `${shown} cours cette semaine` : shown ? `${shown} cours sur ${CLASSES.length} correspondent` : 'Aucun cours ne correspond : élargis un filtre.';
  }
  function setFilter(key, value) {
    filters[key] = value;
    for (const button of planning.querySelectorAll(`[data-filter="${key}"]`)) button.setAttribute('aria-pressed', String(button.dataset.value === value));
    applyFilters();
  }
  for (const button of planning.querySelectorAll('[data-filter]')) {
    button.addEventListener('click', () => setFilter(button.dataset.filter, button.dataset.value));
  }
  // « Voir les cours débutants » (section disciplines) règle le filtre avant d'arriver
  for (const link of document.querySelectorAll('[data-preset-level]')) link.addEventListener('click', () => setFilter('level', link.dataset.presetLevel));

  function pick(item) {
    const before = picked;
    picked = item;
    if (before) paint(before);
    paint(item);
    const left = CAPACITY - item.taken;
    title.textContent = `${DISCIPLINES[item.disc]} · ${DAYS[item.day].slice(0, 3)}. ${hourText(item.time)}`;
    meta.textContent = `${item.minutes} min avec ${item.coach} · ${LEVELS[item.level]} · ${left > 0 ? (left === 1 ? 'dernière place' : `${left} places restantes sur ${CAPACITY}`) : 'complet : inscription en liste d’attente'}`;
    submit.textContent = left > 0 ? 'Confirmer ma place' : 'M’inscrire en liste d’attente';
    form.hidden = false;
    message.textContent = '';
    message.classList.remove('is-error');
    form.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    form.elements.prenom.focus({ preventScroll: true });
  }

  function cancel(item) {
    if (item.booked) item.taken -= 1;
    item.booked = item.waiting = false;
    paint(item);
    title.textContent = 'Réservation annulée';
    meta.textContent = `${describe(item)} : ta place est rendue au groupe.`;
    form.hidden = true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!picked) return;
    const name = form.elements.prenom, mail = form.elements.email;
    const nameOk = name.value.trim().length >= 2;
    const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim());
    name.setAttribute('aria-invalid', String(!nameOk));
    mail.setAttribute('aria-invalid', String(!mailOk));
    if (!nameOk || !mailOk) {
      message.classList.add('is-error');
      message.textContent = !nameOk ? 'Indique ton prénom (2 lettres au moins).' : 'Cette adresse e-mail ne semble pas complète.';
      (nameOk ? mail : name).focus();
      return;
    }
    const item = picked, first = name.value.trim();
    if (CAPACITY - item.taken > 0) { item.taken += 1; item.booked = true; } else item.waiting = true;
    picked = null;
    paint(item);
    title.textContent = item.booked ? `C’est noté, ${first}.` : `Tu es sur la liste, ${first}.`;
    meta.textContent = item.booked
      ? `${describe(item)} avec ${item.coach}. Arrive dix minutes avant. Démonstration : aucune réservation réelle n’a été envoyée.`
      : `${describe(item)} : on te prévient si une place se libère. Démonstration : rien n’a été envoyé.`;
    form.reset();
    form.hidden = true;
    title.setAttribute('tabindex', '-1');
    title.focus({ preventScroll: true });
  });

  applyFilters();
}

// ---------- abonnements : mensuel / annuel (annuel = 10 mensualités, 2 mois offerts) ----------
const subs = document.querySelector('[data-subs]');
if (subs) {
  const cards = [...subs.querySelectorAll('[data-plan]')];
  const render = () => {
    const yearly = subs.querySelector('input[name="rythme"]:checked')?.value === 'annuel';
    for (const card of cards) {
      const monthly = Number(card.dataset.monthly);
      const perMonth = yearly ? (monthly * 10) / 12 : monthly;
      card.querySelector('[data-price]').textContent = fr(perMonth, Number.isInteger(perMonth) ? 0 : 2);
      card.querySelector('[data-price-sub]').textContent = yearly
        ? `${fr(monthly * 10)} € l'année, en une fois · ${fr(monthly * 2)} € d'économie`
        : 'Sans engagement · préavis de 30 jours';
    }
  };
  subs.querySelectorAll('input[name="rythme"]').forEach((input) => input.addEventListener('change', render));
  render();
  // « Essayer d'abord » reporte la formule dans le formulaire d'essai
  const select = document.querySelector('[data-formule]');
  for (const link of subs.querySelectorAll('[data-choose]')) {
    link.addEventListener('click', () => { if (select) select.value = link.dataset.choose; });
  }
}

// ---------- compteurs ----------
const counters = document.querySelectorAll('[data-count]');
if (counters.length && !reduced && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const node = entry.target, goal = Number(node.dataset.count), digits = Number(node.dataset.decimals) || 0, began = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - began) / 1100);
        node.textContent = fr(goal * (1 - Math.pow(1 - k, 3)), digits);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  counters.forEach((node) => observer.observe(node));
}

// ---------- statut d'ouverture (heure de l'appareil) ----------
const status = document.querySelector('[data-open-status]');
if (status) {
  const HOURS = [[9, 13], [6, 22], [6, 22], [6, 22], [6, 22], [6, 22], [8, 18]]; // dimanche → samedi
  const now = new Date(), hour = now.getHours() + now.getMinutes() / 60, [open, close] = HOURS[now.getDay()];
  const isOpen = hour >= open && hour < close;
  status.classList.toggle('is-open', isOpen);
  const next = hour < open ? `ouvre à ${open} h` : `ouvre demain à ${HOURS[(now.getDay() + 1) % 7][0]} h`;
  status.querySelector('span').textContent = isOpen ? `Ouvert · ferme à ${close} h` : `Fermé · ${next}`;
}

// ---------- assistant : même brique, tutoiement ----------
const chatInput = document.querySelector('.chat__input');
if (chatInput) {
  chatInput.placeholder = 'Écris ta question…';
  chatInput.setAttribute('aria-label', 'Ton message');
}
