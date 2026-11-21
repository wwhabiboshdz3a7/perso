// Catalogue des démos : grille Premium, paires Éco ↔ Premium, grille Éco filtrable.

const PREMIUM = [
  { slug: 'pizza', metier: 'Pizzeria', name: 'Forno Nero', film: 'La pizza se fabrique sous vos yeux, en quatre gestes', module: 'Pizza à composer en 3D', media: 'etirer', poster: 'cuire', accent: '#e8412c', eco: 'pizzeria' },
  { slug: 'garage', metier: 'Garage', name: 'Atelier 31', film: 'Du diagnostic à l’intervention', module: 'Train roulant en vue éclatée', media: 'orbite', poster: 'orbite', accent: '#ff5a1f', eco: 'garage' },
  { slug: 'immobilier', metier: 'Immobilier neuf', name: 'Les Terrasses du Canal', film: 'On arrive par le canal, on entre dans le séjour', module: 'Maquette de l’immeuble, lot par lot', media: 'aerien', poster: 'aerien', accent: '#c8553d', eco: 'immobilier' },
  { slug: 'hotel', metier: 'Maison d’hôtes', name: 'Cour Sainte-Anne', film: 'Le soir dans la cour, le matin dans la chambre', module: 'La maison en coupe, chambre par chambre', media: 'cour', poster: 'cour', accent: '#1f9d97', eco: 'hotel' },
  { slug: 'sport', metier: 'Salle de sport', name: 'Forge', film: 'Un swing de kettlebell, image par image', module: 'Calculateur de barre en 3D', media: 'kettlebell', poster: 'kettlebell', accent: '#c6f432', eco: 'salle-de-sport' },
  { slug: 'dentiste', metier: 'Centre dentaire', name: 'Clinique Lumen', film: 'L’empreinte 3D, sans pâte', module: 'Un implant, pièce par pièce', media: 'scanner', poster: 'scanner', accent: '#17c3a2', eco: 'dentiste' },
  { slug: 'barbier', metier: 'Barbier', name: 'Lame', film: 'Le dégradé, geste par geste', module: 'Essaie ta coupe sur un buste 3D', media: 'tondeuse', poster: 'tondeuse', accent: '#c2362f', eco: 'barbier' },
  { slug: 'montre', metier: 'Horloger-bijoutier', name: 'Aurèle', film: 'Le calibre en marche', module: 'Configurateur de montre, vue éclatée', media: 'mouvement', poster: 'mouvement', accent: '#ff4f00', eco: null },
];

const $ = (selector) => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'style') node.style.cssText = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

const normalize = (text) => String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function main() {
  const eco = await fetch('assets/eco.json').then((response) => response.json());
  const premiumFor = new Map(PREMIUM.filter((p) => p.eco).map((p) => [p.eco, p]));

  for (const node of document.querySelectorAll('[data-count-premium]')) node.textContent = PREMIUM.length;
  for (const node of document.querySelectorAll('[data-count-eco]')) node.textContent = eco.length;

  // ---------- bandeau d'images en ouverture ----------
  const reel = $('[data-reel]');
  const tiles = [...PREMIUM.map((p) => `premium/${p.slug}/media/${p.poster}.webp`), ...eco.slice(0, 8).map((d) => `eco/demos/${d.slug}/hero.webp`)];
  for (const src of [...tiles, ...tiles]) reel.append(el('img', { src, alt: '', loading: 'lazy', decoding: 'async' }));

  // ---------- grille Premium : le film se lance au survol ou au focus ----------
  const premiumGrid = $('[data-premium]');
  PREMIUM.forEach((item, index) => {
    const video = el('video', { muted: true, loop: true, playsinline: true, preload: 'none', poster: `premium/${item.slug}/media/${item.poster}.webp`, 'aria-hidden': 'true' },
      el('source', { src: `premium/${item.slug}/media/${item.media}.mp4`, type: 'video/mp4' }));
    video.muted = true;
    const card = el('article', { class: 'pcard', style: `--accent:${item.accent}` },
      el('a', { class: 'pcard__media', href: `premium/${item.slug}/`, tabindex: '-1', 'aria-hidden': 'true' }, video, el('span', { class: 'pcard__num mono' }, String(index + 1).padStart(2, '0'))),
      el('div', { class: 'pcard__body' },
        el('p', { class: 'mono pcard__metier' }, item.metier),
        el('h3', { class: 'pcard__name' }, el('a', { href: `premium/${item.slug}/` }, item.name)),
        el('ul', { class: 'pcard__feats' },
          el('li', {}, el('b', {}, 'Film'), item.film),
          el('li', {}, el('b', {}, '3D'), item.module),
          el('li', {}, el('b', {}, 'Assistant'), 'Répond aux questions des clients')),
        el('div', { class: 'pcard__links' },
          el('a', { class: 'btn btn--accent', href: `premium/${item.slug}/` }, 'Ouvrir la démo →'),
          item.eco ? el('a', { class: 'link', href: `eco/demos/${item.eco}/` }, 'Version Éco') : null)));
    if (!reduced) {
      const play = () => video.play().catch(() => {});
      const stop = () => video.pause();
      card.addEventListener('pointerenter', play);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focusin', play);
      card.addEventListener('focusout', stop);
    }
    premiumGrid.append(card);
  });

  // ---------- paires Éco ↔ Premium ----------
  const pairs = $('[data-pairs]');
  for (const item of PREMIUM.filter((p) => p.eco)) {
    const twin = eco.find((d) => d.slug === item.eco);
    if (!twin) continue;
    pairs.append(el('div', { class: 'pair' },
      el('p', { class: 'mono pair__metier' }, item.metier),
      el('a', { class: 'pair__side', href: `eco/demos/${twin.slug}/` }, el('span', { class: 'mono' }, 'Éco'), el('strong', {}, twin.name)),
      el('span', { class: 'pair__arrow', 'aria-hidden': 'true' }, '→'),
      el('a', { class: 'pair__side pair__side--premium', href: `premium/${item.slug}/`, style: `--accent:${item.accent}` }, el('span', { class: 'mono' }, 'Premium'), el('strong', {}, item.name))));
  }

  // ---------- grille Éco ----------
  const grid = $('[data-eco]');
  for (const demo of eco) {
    const twin = premiumFor.get(demo.slug);
    grid.append(el('article', { class: 'ecard', 'data-sector': demo.sector, 'data-text': normalize(`${demo.name} ${demo.type} ${demo.quartier} ${demo.feature} ${demo.sector} ${demo.slug}`), style: `--bg:${demo.bg};--fg:${demo.fg};--accent:${demo.accent}` },
      el('a', { class: 'ecard__media', href: `eco/demos/${demo.slug}/`, tabindex: '-1', 'aria-hidden': 'true' },
        el('img', { src: `eco/demos/${demo.slug}/hero.webp`, alt: '', loading: 'lazy', decoding: 'async', width: '800', height: '600' })),
      el('div', { class: 'ecard__body' },
        el('p', { class: 'mono ecard__type' }, `${demo.type} · ${demo.quartier}`),
        el('h3', { class: 'ecard__name' }, el('a', { href: `eco/demos/${demo.slug}/` }, demo.name)),
        el('p', { class: 'ecard__feat' }, demo.feature),
        twin ? el('a', { class: 'ecard__twin mono', href: `premium/${twin.slug}/` }, 'Existe en Premium →') : null)));
  }

  const sectors = [...new Set(eco.map((d) => d.sector))];
  const filters = $('[data-filters]');
  const shown = $('[data-shown]');
  let sector = 'tous';
  let query = '';
  const apply = () => {
    let count = 0;
    for (const card of grid.children) {
      const ok = (sector === 'tous' || card.dataset.sector === sector) && (!query || card.dataset.text.includes(query));
      card.hidden = !ok;
      if (ok) count += 1;
    }
    shown.textContent = count ? `${count} démo${count > 1 ? 's' : ''} affichée${count > 1 ? 's' : ''}` : 'Aucune démo ne correspond : essayez un autre mot.';
  };
  const button = (label, value) => {
    const node = el('button', { type: 'button', 'aria-pressed': String(value === sector) }, label);
    node.addEventListener('click', () => {
      sector = value;
      for (const other of filters.children) other.setAttribute('aria-pressed', String(other === node));
      apply();
    });
    return node;
  };
  filters.append(button(`Tous (${eco.length})`, 'tous'), ...sectors.map((name) => button(`${name} (${eco.filter((d) => d.sector === name).length})`, name)));
  $('[data-search]').addEventListener('input', (event) => {
    query = normalize(event.target.value.trim());
    apply();
  });
  apply();
}

main();
