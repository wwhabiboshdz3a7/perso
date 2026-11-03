// Tutoriel : chaque geste est illustré par une main animée, générée avec le
// même modèle de main que le mode simulation.

import { $, el, reducedMotion } from './dom.js';
import { renderHand, blendPoses, resolvePose, POSES } from '../core/handpose.js';
import { HAND_CONNECTIONS } from '../core/hand.js';

const NS = 'http://www.w3.org/2000/svg';

const CARDS = [
  { name: 'Viser', still: 900, act: ['index'],  does: 'L’index levé déplace le curseur aérien sur toute l’interface.', tag: 'Partout', hands: [[[0, 'point', 0.42, 0.52], [900, 'point', 0.6, 0.48], [1800, 'point', 0.42, 0.52]]] },
  { name: 'Cliquer', still: 850, act: ['thumb', 'index'],  does: 'Pincez brièvement le pouce et l’index.', tag: 'Boutons, onglets', hands: [[[0, 'point', 0.5, 0.52], [500, 'point'], [700, 'pinch'], [1000, 'pinch'], [1200, 'point'], [1800, 'point']]] },
  { name: 'Glisser', still: 1300, act: ['thumb', 'index'],  does: 'Pincez et déplacez : curseurs, défilement, rotation de l’hologramme.', tag: 'Pincement maintenu', hands: [[[0, 'pinch', 0.38, 0.52], [300, 'pinch', 0.38, 0.52], [1300, 'pinch', 0.64, 0.5], [1800, 'pinch', 0.64, 0.5]]] },
  { name: 'Attraper', still: 1300, act: ['index', 'middle', 'ring', 'pinky'],  does: 'Visez une photo puis fermez le poing : elle passe dans votre main.', tag: 'Galerie · partage', hands: [[[0, 'point', 0.5, 0.52], [600, 'point'], [850, 'fist'], [1700, 'fist'], [1900, 'point']]] },
  { name: 'Lâcher', still: 1300, act: ['thumb', 'index', 'middle', 'ring', 'pinky'],  does: 'Devant l’autre appareil, ouvrez la main : la photo y atterrit.', tag: 'Appareil récepteur', hands: [[[0, 'fist', 0.5, 0.56], [700, 'fist'], [900, 'open'], [1700, 'open'], [1900, 'fist']]] },
  { name: 'Lancer', still: 1000, act: ['thumb', 'index', 'middle', 'ring', 'pinky'],  does: 'Poing fermé, faites un geste rapide en ouvrant la main : envoi direct.', tag: 'Vers un appareil', trail: true, hands: [[[0, 'fist', 0.3, 0.55], [500, 'fist', 0.3, 0.55], [800, 'open', 0.72, 0.5], [1400, 'open', 0.72, 0.5], [1500, 'fist', 0.3, 0.55]]] },
  { name: 'Swipe', still: 1000, act: ['thumb', 'index', 'middle', 'ring', 'pinky'],  does: 'Main ouverte, balayez vite à gauche ou à droite : photo suivante.', tag: 'Visionneuse · hologramme', trail: true, hands: [[[0, 'open', 0.66, 0.52], [450, 'open', 0.66, 0.52], [750, 'open', 0.34, 0.52], [1500, 'open', 0.34, 0.52], [1800, 'open', 0.66, 0.52]]] },
  { name: 'Deux mains', still: 1300, act: ['thumb', 'index'],  does: 'Pincez des deux mains et écartez ou tournez : zoom et rotation.', tag: 'Visionneuse · hologramme', hands: [
    [[0, 'pinch', 0.62, 0.5], [400, 'pinch', 0.62, 0.5], [1300, 'pinch', 0.8, 0.44], [1900, 'pinch', 0.62, 0.5]],
    [[0, 'pinch', 0.38, 0.5], [400, 'pinch', 0.38, 0.5], [1300, 'pinch', 0.2, 0.56], [1900, 'pinch', 0.38, 0.5]],
  ] },
  { name: 'Pouce levé', still: 1200, act: ['thumb'],  does: 'Ajoute la photo ouverte (ou visée) aux favoris.', tag: 'Galerie', hands: [[[0, 'fist', 0.5, 0.55], [500, 'fist'], [750, 'thumb_up'], [1600, 'thumb_up'], [1900, 'fist']]] },
  { name: 'Victoire', still: 1200, act: ['index', 'middle'],  does: 'Prend une capture de la caméra avec le cadre HUD.', tag: 'Capture', hands: [[[0, 'fist', 0.5, 0.56], [500, 'fist'], [750, 'victory'], [1600, 'victory'], [1900, 'fist']]] },
  { name: 'Signe « je t’aime »', still: 1200, act: ['thumb', 'index', 'pinky'],  does: 'JARVIS vous écoute tout de suite, sans dire « Jarvis ».', tag: 'Voix', hands: [[[0, 'fist', 0.5, 0.56], [500, 'fist'], [750, 'iloveyou'], [1600, 'iloveyou'], [1900, 'fist']]] },
  { name: 'Deux index', still: 1200, act: ['index'],  does: 'Les deux index levés une demi-seconde : l’ardoise s’efface.', tag: 'Dessin', hands: [
    [[0, 'fist', 0.68, 0.56], [500, 'fist'], [750, 'point'], [1700, 'point'], [1900, 'fist']],
    [[0, 'fist', 0.32, 0.56], [500, 'fist'], [750, 'point'], [1700, 'point'], [1900, 'fist']],
  ] },
  { name: 'Poing (dessin)', still: 700, act: ['index', 'middle', 'ring', 'pinky'],  does: 'En mode dessin, le poing devient une gomme ; un pincement change de couleur.', tag: 'Dessin', trail: true, hands: [[[0, 'fist', 0.4, 0.5], [700, 'fist', 0.6, 0.56], [1400, 'fist', 0.4, 0.6], [1900, 'fist', 0.4, 0.5]]] },
  { name: 'Main ouverte 1 s', still: 900, act: ['thumb', 'index', 'middle', 'ring', 'pinky'],  does: 'En veille, montrez la paume une seconde pour réveiller JARVIS.', tag: 'Veille', hands: [[[0, 'open', 0.5, 0.6], [900, 'open', 0.5, 0.5], [1800, 'open', 0.5, 0.6]]] },
];

// Schémas plus lisibles que les poses de simulation : « victoire » en V net.
const TUTO_POSES = { victory: { ...POSES.victory, spread: 3.6, roll: -0.14 } };
const P = (name) => TUTO_POSES[name] || name;
const FINGER_OF = (i) => (i === 0 ? null : ['thumb', 'index', 'middle', 'ring', 'pinky'][Math.ceil(i / 4) - 1]);

function normalizeKeys(keys) {
  // Complète chaque image-clé avec la pose et la position précédentes.
  let prev = { pose: 'open', x: 0.5, y: 0.5 };
  return keys.map(([t, pose, x, y]) => (prev = { t, pose: pose ?? prev.pose, x: x ?? prev.x, y: y ?? prev.y }));
}

function sample(keys, t) {
  const total = keys[keys.length - 1].t;
  t %= total || 1;
  let i = 0;
  while (i < keys.length - 2 && keys[i + 1].t <= t) i++;
  const a = keys[i], b = keys[i + 1] || a;
  const k = b.t > a.t ? Math.min(1, (t - a.t) / (b.t - a.t)) : 0;
  const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  return {
    pose: a.pose === b.pose ? resolvePose(P(a.pose)) : blendPoses(P(a.pose), P(b.pose), e),
    x: a.x + (b.x - a.x) * e,
    y: a.y + (b.y - a.y) * e,
  };
}

export class Tutorial {
  constructor(app) {
    this.app = app;
    this.dialog = $('#dlgTuto');
    this.list = $('#gestureCards');
    this.cards = [];
    this._loop = this._loop.bind(this);
    this._build();
    $('#tutoClose').addEventListener('click', () => this.dialog.close());
    $('#tutoDone').addEventListener('click', () => { this.app.settings.set({ tutoSeen: true }); this.dialog.close(); });
    this.dialog.addEventListener('close', () => { this.running = false; });
  }

  _build() {
    for (const c of CARDS) {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('class', 'gcard__svg');
      svg.setAttribute('aria-hidden', 'true');
      const hands = c.hands.map((keys, h) => {
        const g = document.createElementNS(NS, 'g');
        // Doigts qui font le geste : trait plus épais, couleur ambre.
        const lines = HAND_CONNECTIONS.map(([a, b]) => {
          const l = document.createElementNS(NS, 'line');
          const f = FINGER_OF(b);
          if (f && (FINGER_OF(a) === f || a === 0) && c.act?.includes(f)) l.setAttribute('class', 'act');
          g.append(l);
          return l;
        });
        const dots = Array.from({ length: 21 }, (_, i) => { const d = document.createElementNS(NS, 'circle'); d.setAttribute('r', [4, 8, 12, 16, 20].includes(i) ? 2.1 : 1.5); if (i === 8) d.setAttribute('class', 'tip'); g.append(d); return d; });
        svg.append(g);
        return { keys: normalizeKeys(keys), lines, dots, side: h === 0 ? 'Right' : 'Left' };
      });
      let trail = null;
      if (c.trail) { trail = document.createElementNS(NS, 'path'); trail.setAttribute('class', 'gtrail'); svg.prepend(trail); }
      const li = el('li', { class: 'gcard' }, svg, el('div', {}, el('h3', { class: 'gcard__name', text: c.name }), el('p', { class: 'gcard__does', text: c.does }), el('span', { class: 'gcard__tag', text: c.tag })));
      this.list.append(li);
      this.cards.push({ hands, trail, hist: [], still: c.still ?? 1200 });
    }
    this._draw(null);
  }

  /** t = null : image fixe caractéristique de chaque geste (mouvement réduit). */
  _draw(t) {
    for (const card of this.cards) {
      card.hands.forEach((h, hi) => {
        const s = sample(h.keys, t ?? card.still);
        const pts = renderHand(s.pose, { x: 1 - s.x, y: s.y + 0.06, size: card.hands.length > 1 ? 0.31 : 0.42, aspect: 1, side: h.side, anchor: 'palm' })
          .map((p) => ({ x: (1 - p.x) * 100, y: p.y * 100 }));
        HAND_CONNECTIONS.forEach(([a, b], i) => {
          const l = h.lines[i];
          l.setAttribute('x1', pts[a].x.toFixed(1)); l.setAttribute('y1', pts[a].y.toFixed(1));
          l.setAttribute('x2', pts[b].x.toFixed(1)); l.setAttribute('y2', pts[b].y.toFixed(1));
        });
        h.dots.forEach((d, i) => { d.setAttribute('cx', pts[i].x.toFixed(1)); d.setAttribute('cy', pts[i].y.toFixed(1)); });
        if (card.trail && hi === 0 && t !== null) {
          card.hist.push(pts[9]);
          if (card.hist.length > 14) card.hist.shift();
          card.trail.setAttribute('d', card.hist.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
        }
      });
    }
  }

  open() {
    this.app.openDialog(this.dialog);
    if (reducedMotion()) { this._draw(null); return; }
    this.running = true;
    this.t0 = performance.now();
    requestAnimationFrame(this._loop);
  }

  _loop(now) {
    if (!this.running) return;
    this._draw(now - this.t0);
    setTimeout(() => requestAnimationFrame(this._loop), 33);
  }
}
