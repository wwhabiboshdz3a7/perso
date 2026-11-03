// Moteur de gestes : transforme des images de points de la main (format
// MediaPipe) en états stables et en évènements (pincement, attraper, lâcher,
// lancer, swipe, deux mains, gestes canoniques). Module pur, sans DOM.

import { OneEuroFilter } from './one-euro.js';
import {
  LM, toIso, classify, palmCenter, fingerRatio, mid, MODEL_TO_POSE, POSE_TO_GESTURE,
} from './hand.js';

export const DEFAULT_OPTIONS = Object.freeze({
  mirror: true,               // affichage miroir (caméra frontale)
  invertHandedness: true,     // MediaPipe suppose une image miroir : on corrige
  dominant: 'Right',          // main qui pilote le curseur
  pinchOn: 0.28,              // pincement si distance pouce-index / main < pinchOn
  pinchOff: 0.42,             // … et relâché au-dessus de pinchOff (hystérésis)
  pinchMinIndexRatio: 1.3,    // l'index ne doit pas être replié (sinon : poing)
  extRatio: 1.42,
  curlRatio: 1.22,
  thumbExt: 0.72,
  modelMinScore: 0.55,        // score minimal pour considérer le modèle
  modelTrustScore: 0.72,      // au-delà, le modèle l'emporte sur la géométrie
  poseDebounceMs: 90,         // une pose doit tenir ce temps pour devenir stable
  pinchDebounceMs: 45,
  releaseWindowMs: 400,       // poing → (transition) → main ouverte toléré
  lostMs: 320,                // main perdue au-delà
  trackMaxJump: 0.45,         // saut maximal entre deux images (association)
  swipeSpeed: 1.25,           // hauteurs d'image par seconde
  swipeMinDist: 0.2,
  swipeAxisRatio: 1.7,
  swipeWindowMs: 220,
  swipeCooldownMs: 650,
  throwSpeed: 1.4,
  throwWindowMs: 160,
  holdMs: 380,                // maintien d'un geste canonique
  gestureCooldownMs: 1200,
  twoIndexHoldMs: 600,
  offsetHalfLifeMs: 140,
  curlOnsetRatio: 0.96,       // index replié de 4 % : on fige la visée sur la paume
  pinchOnsetRatio: 0.85,      // pouce qui se rapproche de 15 % : idem
  smoothing: Object.freeze({ minCutoff: 1.4, beta: 6, dCutoff: 1.0 }),
});

const invert = (side) => (side === 'Right' ? 'Left' : side === 'Left' ? 'Right' : side);

function normAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function direction(vx, vy) {
  if (Math.abs(vx) >= Math.abs(vy)) return vx >= 0 ? 'right' : 'left';
  return vy >= 0 ? 'down' : 'up';
}

export class GestureEngine {
  constructor(options = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...options, smoothing: { ...DEFAULT_OPTIONS.smoothing, ...(options.smoothing || {}) } };
    this.reset();
  }

  configure(options = {}) {
    const smoothing = { ...this.opts.smoothing, ...(options.smoothing || {}) };
    this.opts = { ...this.opts, ...options, smoothing };
    for (const tr of this.tracks) for (const f of tr.filters) Object.assign(f, smoothing);
  }

  reset() {
    this.tracks = [];
    this.nextId = 1;
    this.primaryId = null;
    this.twoHand = null;
    this.twoIndex = { since: null, fired: false };
    this.lastT = null;
    this.frameDt = 0;
    this.aspect = 4 / 3;
  }

  /**
   * @param {{t:number, width?:number, height?:number, aspect?:number,
   *          hands: Array<{landmarks:{x:number,y:number,z?:number}[], handedness?:string, gestures?:{name?:string,categoryName?:string,score:number}[]}>}} frame
   */
  update(frame) {
    const o = this.opts;
    const t = frame.t;
    const aspect = frame.width && frame.height ? frame.width / frame.height : frame.aspect || this.aspect;
    this.aspect = aspect;
    // Intervalle moyen entre deux images : la tolérance de perte s'y adapte.
    const gap = this.lastT === null ? 0 : t - this.lastT;
    if (gap > 0 && gap < 2000) this.frameDt = this.frameDt ? this.frameDt * 0.8 + gap * 0.2 : gap;
    this.lastT = t;
    const lostMs = Math.max(o.lostMs, this.frameDt * 2.5);
    const events = [];

    const inputs = (frame.hands || [])
      .filter((h) => h && h.landmarks && h.landmarks.length >= 21)
      .map((h) => {
        const iso = toIso(h.landmarks, aspect, o.mirror);
        const label = h.handedness || 'Right';
        const top = (h.gestures && h.gestures[0]) || null;
        return {
          iso,
          palm: palmCenter(iso),
          side: o.invertHandedness ? invert(label) : label,
          model: top ? { name: top.name || top.categoryName || 'None', score: top.score ?? 0 } : null,
        };
      });

    // Association des mains détectées aux pistes existantes (au plus proche).
    const pairs = [];
    inputs.forEach((inp, i) => {
      this.tracks.forEach((tr, j) => {
        const d = Math.hypot(inp.palm.x - tr.palm.x, inp.palm.y - tr.palm.y) + (tr.side === inp.side ? 0 : 0.12);
        pairs.push({ i, j, d });
      });
    });
    pairs.sort((a, b) => a.d - b.d);
    const usedIn = new Set(), usedTr = new Set();
    const assign = new Map();
    for (const p of pairs) {
      if (usedIn.has(p.i) || usedTr.has(p.j) || p.d > o.trackMaxJump) continue;
      usedIn.add(p.i); usedTr.add(p.j);
      assign.set(p.i, this.tracks[p.j]);
    }
    inputs.forEach((inp, i) => {
      let tr = assign.get(i);
      if (!tr) {
        tr = this._newTrack(inp, t);
        this.tracks.push(tr);
        events.push(this._evt('handfound', tr));
      }
      this._process(tr, inp, t, events);
    });

    // Pistes non vues : perdues après un délai (les micro-coupures sont tolérées).
    this.tracks = this.tracks.filter((tr) => {
      if (tr.lastSeen === t) return true;
      if (t - tr.lastSeen > lostMs) {
        if (tr.pinching) events.push(this._evt('pinchend', tr, { duration: t - tr.pinchStart.t, moved: 0, cancelled: true }));
        events.push(this._evt('handlost', tr, { closed: tr.stable === 'fist' }));
        if (this.primaryId === tr.id) this.primaryId = null;
        return false;
      }
      return true;
    });

    const visible = this.tracks.filter((tr) => tr.lastSeen === t);
    this._twoHands(visible, t, events);
    this._choosePrimary(visible);

    const hands = visible.map((tr) => this._summary(tr));
    const primary = hands.find((h) => h.id === this.primaryId) || null;
    return {
      t,
      aspect,
      hands,
      primary,
      events,
      twoHand: this.twoHand ? { ...this.twoHand } : null,
    };
  }

  _newTrack(inp, t) {
    const sm = this.opts.smoothing;
    return {
      id: this.nextId++,
      side: inp.side,
      firstSeen: t,
      lastSeen: t,
      filters: Array.from({ length: 63 }, () => new OneEuroFilter(sm)),
      pts: inp.iso,
      palm: inp.palm,
      scale: 1,
      geo: null,
      model: null,
      pinching: false,
      pinchCand: null,
      pinchCandSince: 0,
      pinchStart: null,
      stable: 'none',
      rawPose: 'none',
      cand: null,
      candSince: t,
      fistEndedAt: -Infinity,
      history: [],
      pointer: null,
      steadyIndex: true,
      anchorKind: null,
      offset: { x: 0, y: 0 },
      offsetDecay: false,
      holdName: null,
      holdSince: t,
      holdFired: true,
      lastGestureAt: {},
      lastSwipe: -Infinity,
      suppressSwipeUntil: 0,
    };
  }

  _process(tr, inp, t, events) {
    const o = this.opts;
    const dtMs = t - tr.lastSeen;
    tr.lastSeen = t;
    tr.side = inp.side;
    tr.model = inp.model;

    // 1. Lissage One Euro de chaque coordonnée.
    const ts = t / 1000;
    const pts = new Array(21);
    for (let k = 0; k < 21; k++) {
      const p = inp.iso[k];
      pts[k] = {
        x: tr.filters[k * 3].filter(p.x, ts),
        y: tr.filters[k * 3 + 1].filter(p.y, ts),
        z: tr.filters[k * 3 + 2].filter(p.z, ts),
      };
    }
    tr.pts = pts;

    // 2. Mesures.
    const geo = classify(pts, o);
    tr.geo = geo;
    tr.palm = geo.palm;
    tr.scale = geo.scale;

    // 3. Pincement avec hystérésis + anti-rebond.
    const indexRatio = fingerRatio(pts, 'index');
    const wantPinch = tr.pinching
      ? geo.pinchRatio < o.pinchOff
      : geo.pinchRatio < o.pinchOn && indexRatio > o.pinchMinIndexRatio && tr.stable !== 'fist';
    let pinchChanged = false;
    if (wantPinch === tr.pinching) {
      tr.pinchCand = null;
    } else if (tr.pinchCand !== wantPinch) {
      tr.pinchCand = wantPinch;
      tr.pinchCandSince = t;
      if (o.pinchDebounceMs <= 0) pinchChanged = true;
    } else if (t - tr.pinchCandSince >= o.pinchDebounceMs) {
      pinchChanged = true;
    }
    if (pinchChanged) {
      tr.pinching = wantPinch;
      tr.pinchCand = null;
    }

    // 4. Pose brute : pincement prioritaire, puis fusion modèle / géométrie.
    const rawPose = tr.pinching ? 'pinch' : this._fuse(geo.pose, inp.model);
    tr.rawPose = rawPose;

    // 5. Pose stable (anti-rebond temporel).
    if (rawPose === tr.stable) {
      tr.cand = null;
    } else {
      const instant = rawPose === 'pinch' || tr.stable === 'pinch';
      if (tr.cand !== rawPose) {
        tr.cand = rawPose;
        tr.candSince = t;
      }
      if (instant || t - tr.candSince >= o.poseDebounceMs) {
        this._changeStable(tr, rawPose, t, events);
        tr.cand = null;
      }
    }

    // 6. Historique de la paume (vitesse) et de l'ouverture des doigts.
    tr.history.push({ t, x: geo.palm.x, y: geo.palm.y, ir: indexRatio, pr: geo.pinchRatio });
    while (tr.history.length && t - tr.history[0].t > 600) tr.history.shift();
    let maxIr = 0, maxPr = 0;
    for (const h of tr.history) {
      if (t - h.t > 400) continue;
      if (h.ir > maxIr) maxIr = h.ir;
      if (h.pr > maxPr) maxPr = h.pr;
    }
    tr.steadyIndex = indexRatio >= maxIr * o.curlOnsetRatio && geo.pinchRatio >= maxPr * o.pinchOnsetRatio;

    // 7. Pointeur (avec continuité lors des changements de point d'ancrage).
    this._updatePointer(tr, dtMs);

    // 8. Évènements de pincement (après la mise à jour du pointeur).
    if (pinchChanged) {
      const ptr = this._display(tr.pointer);
      if (tr.pinching) {
        tr.pinchStart = { t, x: ptr.x, y: ptr.y };
        events.push(this._evt('pinchstart', tr));
      } else if (tr.pinchStart) {
        const moved = Math.hypot(ptr.x - tr.pinchStart.x, ptr.y - tr.pinchStart.y);
        events.push(this._evt('pinchend', tr, { duration: t - tr.pinchStart.t, moved }));
        tr.pinchStart = null;
      }
    } else if (tr.pinching) {
      events.push(this._evt('pinchmove', tr));
    }

    // 9. Swipe (main ouverte, mouvement rapide et franc).
    if (tr.stable === 'open' && !tr.pinching && t >= tr.suppressSwipeUntil && t - tr.lastSwipe >= o.swipeCooldownMs) {
      const win = tr.history.filter((h) => t - h.t <= o.swipeWindowMs);
      if (win.length >= 3) {
        const a = win[0], b = win[win.length - 1];
        const dt = (b.t - a.t) / 1000;
        const dx = b.x - a.x, dy = b.y - a.y;
        if (dt >= 0.06) {
          const horiz = Math.abs(dx) / dt >= o.swipeSpeed && Math.abs(dx) >= o.swipeMinDist && Math.abs(dx) >= Math.abs(dy) * o.swipeAxisRatio;
          const vert = Math.abs(dy) / dt >= o.swipeSpeed && Math.abs(dy) >= o.swipeMinDist && Math.abs(dy) >= Math.abs(dx) * o.swipeAxisRatio;
          if (horiz || vert) {
            tr.lastSwipe = t;
            events.push(this._evt('swipe', tr, {
              direction: horiz ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'),
              speed: Math.hypot(dx, dy) / dt,
            }));
          }
        }
      }
    }

    // 10. Gestes canoniques maintenus.
    if (tr.holdName && !tr.holdFired && t - tr.holdSince >= o.holdMs) {
      tr.holdFired = true;
      const last = tr.lastGestureAt[tr.holdName] ?? -Infinity;
      if (t - last >= o.gestureCooldownMs) {
        tr.lastGestureAt[tr.holdName] = t;
        events.push(this._evt('gesture', tr, { name: tr.holdName }));
      }
    }
  }

  _fuse(geoPose, model) {
    const o = this.opts;
    if (!model) return geoPose;
    const mp = MODEL_TO_POSE[model.name];
    if (!mp) return geoPose;
    if (model.score >= o.modelTrustScore) return mp;
    if (model.score >= o.modelMinScore && (geoPose === 'unknown' || geoPose === mp)) return mp;
    return geoPose;
  }

  _changeStable(tr, to, t, events) {
    const o = this.opts;
    const from = tr.stable;
    tr.stable = to;
    events.push(this._evt('pose', tr, { from, to }));

    if (to === 'fist' && from !== 'none') {
      events.push(this._evt('grab', tr, { from }));
    }
    if (from === 'fist') {
      tr.fistEndedAt = tr.candSince;
    }
    // Lâcher : la main ouverte a commencé moins de releaseWindowMs après la fin
    // du poing. On compare le début de la nouvelle pose (et non l'instant où elle
    // devient stable) : à faible cadence (2-3 images/s sur un appareil modeste),
    // l'anti-rebond dure une image entière et ne doit pas faire manquer le geste.
    if (to === 'open' && tr.candSince - tr.fistEndedAt <= o.releaseWindowMs) {
      tr.fistEndedAt = -Infinity;
      const v = this._velocity(tr, Math.min(tr.candSince, t - o.throwWindowMs) - 60, t);
      const speed = Math.hypot(v.vx, v.vy);
      const thrown = speed >= o.throwSpeed;
      const extra = { thrown, vx: v.vx, vy: v.vy, speed, direction: direction(v.vx, v.vy) };
      events.push(this._evt('release', tr, extra));
      if (thrown) events.push(this._evt('throw', tr, extra));
      tr.suppressSwipeUntil = t + 500;
    }
    tr.holdName = POSE_TO_GESTURE[to] || null;
    tr.holdSince = t;
    tr.holdFired = !tr.holdName;
  }

  _velocity(tr, from, to) {
    const win = tr.history.filter((h) => h.t >= from && h.t <= to);
    if (win.length < 2) return { vx: 0, vy: 0 };
    const a = win[0], b = win[win.length - 1];
    const dt = (b.t - a.t) / 1000 || 1e-3;
    // Vitesses exprimées en coordonnées d'affichage isotropes (hauteurs/s).
    return { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt };
  }

  _anchor(tr) {
    const p = tr.pts;
    const pose = tr.stable === 'none' ? tr.rawPose : tr.stable;
    if (pose === 'fist' || pose === 'thumb_up' || pose === 'thumb_down') return { kind: 'palm', pos: tr.palm };
    // Pendant un pincement, et dès que l'index commence à se replier ou que le
    // pouce s'en approche, le pointeur suit la paume : le geste de « clic » ou
    // d'« attraper » ne décale pas la cible visée.
    if (pose === 'pinch' || tr.pinching || !tr.steadyIndex) return { kind: 'palm', pos: tr.palm };
    return { kind: 'index', pos: p[LM.INDEX_TIP] };
  }

  _updatePointer(tr, dtMs) {
    const { kind, pos } = this._anchor(tr);
    if (kind !== tr.anchorKind) {
      if (tr.pointer) tr.offset = { x: tr.pointer.x - pos.x, y: tr.pointer.y - pos.y };
      tr.anchorKind = kind;
      tr.offsetDecay = kind === 'index';
    } else if (tr.offsetDecay && dtMs > 0) {
      const k = Math.pow(0.5, dtMs / this.opts.offsetHalfLifeMs);
      tr.offset.x *= k;
      tr.offset.y *= k;
    }
    tr.pointer = { x: pos.x + tr.offset.x, y: pos.y + tr.offset.y };
  }

  _twoHands(visible, t, events) {
    const o = this.opts;
    const pinching = visible.filter((tr) => tr.pinching).sort((a, b) => a.id - b.id);
    if (pinching.length >= 2) {
      const [a, b] = pinching;
      const pa = mid(a.pts[LM.THUMB_TIP], a.pts[LM.INDEX_TIP]);
      const pb = mid(b.pts[LM.THUMB_TIP], b.pts[LM.INDEX_TIP]);
      const d = Math.hypot(pb.x - pa.x, pb.y - pa.y) || 1e-6;
      const ang = Math.atan2(pb.y - pa.y, pb.x - pa.x);
      const center = this._display({ x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 });
      if (!this.twoHand || this.twoHand.ids[0] !== a.id || this.twoHand.ids[1] !== b.id) {
        if (this.twoHand) events.push({ type: 'twohand:end', t, ...this.twoHand });
        this.twoHand = { ids: [a.id, b.id], d0: d, a0: ang, scale: 1, rotation: 0, center, distance: d };
        events.push({ type: 'twohand:start', t, ...this.twoHand });
      } else {
        const th = this.twoHand;
        th.scale = d / th.d0;
        th.rotation = normAngle(ang - th.a0);
        th.center = center;
        th.distance = d;
        events.push({ type: 'twohand:update', t, ...th });
      }
    } else if (this.twoHand) {
      events.push({ type: 'twohand:end', t, ...this.twoHand });
      this.twoHand = null;
    }

    // Deux index levés maintenus.
    const pointing = visible.filter((tr) => tr.stable === 'point');
    if (visible.length >= 2 && pointing.length >= 2) {
      if (this.twoIndex.since === null) this.twoIndex = { since: t, fired: false };
      else if (!this.twoIndex.fired && t - this.twoIndex.since >= o.twoIndexHoldMs) {
        this.twoIndex.fired = true;
        events.push({ type: 'gesture', t, name: 'Two_Index', hand: null });
      }
    } else {
      this.twoIndex = { since: null, fired: false };
    }
  }

  _choosePrimary(visible) {
    if (this.primaryId !== null && this.tracks.some((tr) => tr.id === this.primaryId)) return;
    if (!visible.length) { this.primaryId = null; return; }
    const dom = visible.find((tr) => tr.side === this.opts.dominant);
    this.primaryId = (dom || [...visible].sort((a, b) => a.id - b.id)[0]).id;
  }

  _display(p) {
    return { x: p.x / this.aspect, y: p.y };
  }

  _evt(type, tr, extra = {}) {
    const ptr = tr.pointer ? this._display(tr.pointer) : this._display(tr.palm);
    return { type, t: this.lastT, hand: tr.id, side: tr.side, x: ptr.x, y: ptr.y, ...extra };
  }

  _summary(tr) {
    const a = this.aspect;
    return {
      id: tr.id,
      side: tr.side,
      pose: tr.stable,
      rawPose: tr.rawPose,
      pinching: tr.pinching,
      closed: tr.stable === 'fist',
      pointer: tr.pointer ? this._display(tr.pointer) : this._display(tr.palm),
      palm: this._display(tr.palm),
      scale: tr.scale,
      pinchRatio: tr.geo ? tr.geo.pinchRatio : 1,
      fingers: tr.geo ? tr.geo.fingers : null,
      model: tr.model,
      primary: tr.id === this.primaryId,
      landmarks: tr.pts.map((p) => ({ x: p.x / a, y: p.y, z: p.z / a })),
    };
  }
}
