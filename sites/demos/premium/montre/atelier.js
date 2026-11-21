// Aurèle — la logique de la page, sans 3D : horloge, relevés du film, prix et référence de la
// configuration, estimateur de réparation, dates d'ouverture. Rien n'est envoyé nulle part.

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const euros = (value) => `${Math.round(value).toLocaleString('fr-FR')} €`;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// ---------- l'heure, dans la barre ----------
const clock = $('[data-clock]');
if (clock) {
  const tick = () => { clock.textContent = new Date().toLocaleTimeString('fr-FR', { hour12: false }); };
  tick();
  setInterval(tick, 1000);
}

// ---------- film : trois relevés qui se relaient pendant le plan ----------
const film = $('#film');
const notes = $$('[data-notes] li');
if (film && notes.length) {
  let shown = 0;
  const update = () => {
    const rect = film.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    const progress = travel > 0 ? clamp(-rect.top / travel) : 0;
    const index = Math.min(notes.length - 1, Math.floor(progress * notes.length));
    if (index === shown) return;
    shown = index;
    notes.forEach((note, i) => note.classList.toggle('is-on', i === index));
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ---------- configuration : référence, prix, récapitulatif ----------
const BASE_PRICE = 2480;
const configForm = $('[data-config-form]');
const tryForm = $('[data-try]');
function readConfig() {
  const config = { price: BASE_PRICE, codes: ['AU01'], parts: {} };
  for (const input of $$('input[type="radio"]:checked', configForm)) {
    config.price += Number(input.dataset.price) || 0;
    config.codes.push(input.dataset.code);
    config.parts[input.name] = input.dataset.label;
  }
  config.ref = config.codes.join('-');
  return config;
}
function showConfig() {
  if (!configForm) return;
  const config = readConfig();
  $$('[data-ref]').forEach((node) => { node.textContent = config.ref; });
  $$('[data-price-out]').forEach((node) => { node.textContent = euros(config.price); });
  for (const [name, label] of Object.entries(config.parts)) {
    $$(`[data-part="${name}"]`).forEach((node) => { node.textContent = label; });
  }
  const recap = $('[data-recap]');
  if (recap) recap.textContent = Object.values(config.parts).map((label, i) => (i ? label.toLowerCase() : label)).join(' · ');
  const hidden = $('[data-ref-input]');
  if (hidden) hidden.value = `${config.ref} — ${euros(config.price)}`;
  if (tryForm) tryForm.dataset.demo = `Merci ! Ceci est une démonstration : aucune demande n’a été envoyée. Votre configuration ${config.ref} (${euros(config.price)}) aurait été jointe.`;
}
if (configForm) {
  configForm.addEventListener('change', showConfig);
  configForm.addEventListener('submit', (event) => event.preventDefault());
  showConfig();
}
// ui.js vide le formulaire après l'envoi simulé : on y remet la configuration
if (tryForm) tryForm.addEventListener('reset', () => setTimeout(showConfig));

// ---------- jours d'ouverture : mardi au samedi ----------
const DAY = 86400000;
const isOpen = (date) => date.getDay() >= 2; // 0 dimanche, 1 lundi
const nextOpen = (date) => {
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  while (!isOpen(day)) day.setDate(day.getDate() + 1);
  return day;
};
const longDate = (date) => date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/ 1 /, ' 1er ');
const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

for (const input of $$('[data-open-days]')) {
  const hint = $('[data-date-hint]', input.form);
  const first = nextOpen(new Date(Date.now() + DAY)); // à partir de demain
  input.min = isoDate(first);
  const check = () => {
    if (!input.value) {
      input.setCustomValidity('');
      if (hint) hint.textContent = `Comptoir ouvert du mardi au samedi. Premier créneau : ${longDate(first)}.`;
      return;
    }
    const [y, m, d] = input.value.split('-').map(Number);
    const chosen = new Date(y, m - 1, d);
    if (!isOpen(chosen)) {
      const next = nextOpen(chosen);
      input.setCustomValidity(`Le comptoir est fermé le dimanche et le lundi. Prochain jour ouvert : ${longDate(next)}.`);
      if (hint) hint.textContent = `Fermé ce jour-là — prochain jour ouvert : ${longDate(next)}.`;
    } else {
      input.setCustomValidity('');
      if (hint) hint.textContent = `Essayage le ${longDate(chosen)}, au 9, rue Peyrolières.`;
    }
  };
  input.addEventListener('input', check);
  input.form.addEventListener('reset', () => setTimeout(check));
  check();
}

// ---------- estimateur de réparation ----------
const MOVEMENTS = {
  quartz: { label: 'quartz', battery: true, pile: 19, revision: 95, days: 7 },
  quartzchrono: { label: 'chronographe à quartz', battery: true, pile: 24, revision: 145, days: 10 },
  manuel: { label: 'mécanique à remontage manuel', battery: false, revision: 290, days: 21 },
  auto: { label: 'automatique', battery: false, revision: 340, days: 28 },
  chrono: { label: 'chronographe mécanique', battery: false, revision: 620, days: 42 },
};
const STRAPS = { taille: ['Mise à taille du bracelet', 12, 0], pompes: ['Pompes ou maillon remplacés', 18, 0], cuir: ['Bracelet cuir sur mesure', 89, 8] };
const GLASSES = { plexi: ['Glace plexiglas', 45], minerale: ['Glace minérale', 65], saphir: ['Glace saphir', 140] };
const delayText = (days) => {
  if (days === 0) return 'Sur place, pendant que vous attendez';
  if (days < 14) return `${days} jours`;
  const weeks = Math.round(days / 7);
  return `${weeks} semaines`;
};

const est = $('[data-est]');
if (est) {
  const out = {
    price: $('[data-est-price]', est), kind: $('[data-est-kind]', est), lines: $('[data-est-lines]', est), delay: $('[data-est-delay]', est),
    drop: $('[data-est-drop]', est), ready: $('[data-est-ready]', est), warranty: $('[data-est-warranty]', est), warn: $('[data-est-warn]', est),
  };
  const value = (name) => est.elements[name] && est.elements[name].value;
  const box = (name) => est.elements[name];
  const note = (name, text) => { const node = $(`[data-opt-note="${name}"]`, est); if (node) node.textContent = text; };
  // une option peut être proposée, incluse d'office ou sans objet
  const option = (name, state, text) => {
    const input = box(name);
    if (state === 'included') { input.checked = true; input.disabled = true; }
    else if (state === 'off') { input.checked = false; input.disabled = true; }
    else {
      if (input.disabled) input.checked = false;
      input.disabled = false;
    }
    note(name, text);
    return input.checked && state === 'free';
  };

  function estimate() {
    const job = value('intervention');
    let warning = '';

    // l'étape 2 dépend de l'intervention
    for (const group of $$('fieldset[data-for]', est)) {
      const on = group.dataset.for.split(' ').includes(job);
      group.hidden = !on;
      group.disabled = !on;
    }
    // une montre mécanique n'a pas de pile
    for (const input of $$('input[name="mouvement"]', est)) {
      const blocked = job === 'pile' && !MOVEMENTS[input.value].battery;
      if (blocked && input.checked) {
        est.elements.mouvement.value = 'quartz';
        warning = 'Une montre mécanique n’a pas de pile : nous avons sélectionné « quartz ». Si la vôtre est mécanique et s’arrête, c’est une révision qu’il lui faut.';
      }
      input.disabled = blocked;
    }
    const movement = MOVEMENTS[value('mouvement')] || MOVEMENTS.auto;

    const lines = [];
    let days = 0, warranty = '', firm = true;
    if (job === 'pile') {
      lines.push([`Pile neuve, ${movement.label}`, movement.pile]);
      lines.push(['Contrôle du joint de fond', 0]);
      if (option('etancheite', 'free', '+ 25 €')) lines.push(['Test d’étanchéité 10 bar', 25]);
      option('ancienne', 'off', 'sans objet');
      option('express', 'off', 'déjà immédiat');
      warranty = '12 mois sur la pile';
    } else if (job === 'revision') {
      firm = false;
      lines.push([`Révision complète, ${movement.label}`, movement.revision]);
      days = movement.days;
      option('etancheite', 'included', 'inclus');
      lines.push(['Joints neufs et test d’étanchéité', 0]);
      if (option('ancienne', 'free', '+ 20 %')) {
        lines.push(['Montre de plus de 30 ans : pièces à ajuster', Math.round((movement.revision * 0.2) / 5) * 5]);
        days += 14;
      }
      if (option('express', 'free', '+ 60 €')) {
        lines.push(['Express : passe en tête d’établi', 60]);
        days = Math.ceil(days / 2);
      }
      warranty = '24 mois, pièces et main-d’œuvre';
    } else if (job === 'bracelet') {
      const [label, price, wait] = STRAPS[value('detail-bracelet')] || STRAPS.taille;
      lines.push([label, price]);
      days = wait;
      option('etancheite', 'off', 'sans objet');
      option('ancienne', 'off', 'sans objet');
      option('express', 'off', wait ? 'sur mesure : non' : 'déjà immédiat');
      warranty = wait ? '12 mois sur le bracelet' : 'Ajustement repris gratuitement';
    } else {
      const [label, price] = GLASSES[value('detail-glace')] || GLASSES.minerale;
      lines.push([label, price]);
      days = 5;
      option('etancheite', 'included', 'inclus');
      lines.push(['Joint de glace et test d’étanchéité', 0]);
      if (option('ancienne', 'free', '+ 30 €')) {
        lines.push(['Glace taillée sur mesure', 30]);
        days += 10;
      }
      if (option('express', 'free', '+ 25 €')) {
        lines.push(['Express', 25]);
        days = Math.ceil(days / 2);
      }
      warranty = '12 mois sur la glace';
    }

    const total = lines.reduce((sum, [, price]) => sum + price, 0);
    out.price.textContent = euros(total);
    out.kind.textContent = firm ? 'Prix ferme, réglé au retrait' : 'Estimation, confirmée après le diagnostic gratuit';
    out.lines.replaceChildren(...lines.map(([label, price]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = price ? euros(price) : 'inclus';
      row.append(dt, dd);
      return row;
    }));
    out.delay.textContent = delayText(days);
    // dépôt : aujourd'hui si le comptoir est ouvert et qu'il n'est pas trop tard, sinon le prochain jour ouvert
    const now = new Date();
    const today = isOpen(now) && now.getHours() < 18;
    const drop = today ? nextOpen(now) : nextOpen(new Date(now.getTime() + DAY));
    out.drop.textContent = today ? 'Aujourd’hui, sans rendez-vous' : `Dès ${longDate(drop)}`;
    out.ready.textContent = days === 0 ? 'Vous repartez avec' : `Vers le ${longDate(nextOpen(new Date(drop.getTime() + days * DAY)))}`;
    out.warranty.textContent = warranty;
    out.warn.hidden = !warning;
    out.warn.textContent = warning;
    est.dataset.demo = `Merci ! Ceci est une démonstration : aucun dépôt n’a été enregistré. Votre estimation : ${euros(total)}, ${delayText(days).toLowerCase()}.`;
  }

  est.addEventListener('change', estimate);
  est.addEventListener('reset', () => setTimeout(estimate));
  estimate();
}
