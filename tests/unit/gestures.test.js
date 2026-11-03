import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GestureEngine } from '../../js/core/gestures.js';
import { renderHand, blendPoses, mediapipeLabel } from '../../js/core/handpose.js';
import { toIso, pinchRatio } from '../../js/core/hand.js';
import * as S from '../../js/core/sequences.js';

const quiet = new Set(['pinchmove', 'twohand:update', 'pose', 'handfound']);

function run(seq, opts = {}, tail = 0) {
  const engine = new GestureEngine(opts);
  const events = [];
  const results = [];
  const frames = [...seq.frames];
  const last = frames[frames.length - 1];
  for (let k = 1; k <= Math.ceil(tail / 33); k++) frames.push({ t: last.t + k * 33, width: last.width, height: last.height, hands: [] });
  for (const f of frames) {
    const r = engine.update(f);
    results.push(r);
    for (const e of r.events) events.push(e);
  }
  return { engine, events, results, types: events.filter((e) => !quiet.has(e.type)).map((e) => e.type) };
}

const of = (events, type) => events.filter((e) => e.type === type);

for (const model of [true, false]) {
  const mode = model ? 'avec modèle' : 'géométrie seule';

  test(`attraper : main ouverte/pointée → poing (${mode})`, () => {
    const { events } = run(S.grabAt(0.3, 0.4, { model }), {}, 600);
    const grabs = of(events, 'grab');
    assert.equal(grabs.length, 1);
    assert.ok(Math.abs(grabs[0].x - 0.3) < 0.04 && Math.abs(grabs[0].y - 0.4) < 0.04, `position ${grabs[0].x},${grabs[0].y}`);
    assert.equal(of(events, 'release').length, 0, 'pas de lâcher');
    const lost = of(events, 'handlost');
    assert.equal(lost.length, 1);
    assert.equal(lost[0].closed, true, 'la main part fermée');
  });

  test(`lâcher : poing → main ouverte sans attraper préalable (${mode})`, () => {
    const { events } = run(S.releaseAt(0.6, 0.5, { model }));
    assert.equal(of(events, 'grab').length, 0, 'une main qui arrive fermée ne déclenche pas « attraper »');
    const rel = of(events, 'release');
    assert.equal(rel.length, 1);
    assert.equal(rel[0].thrown, false);
    assert.equal(of(events, 'throw').length, 0);
  });

  test(`cadence faible (2 et 3 images/s) : attraper et lâcher restent détectés (${mode})`, () => {
    for (const fps of [2, 3]) {
      assert.equal(of(run(S.grabAt(0.4, 0.45, { model, fps })).events, 'grab').length, 1, `attraper à ${fps} images/s`);
      const rel = of(run(S.releaseAt(0.6, 0.5, { model, fps })).events, 'release');
      assert.equal(rel.length, 1, `lâcher à ${fps} images/s`);
      assert.equal(rel[0].thrown, false, 'une main immobile ne lance pas');
    }
  });

  test(`lancer vers la droite et vers la gauche (${mode})`, () => {
    for (const dir of ['right', 'left', 'up']) {
      const { events } = run(S.throwToward(dir, { model }));
      const th = of(events, 'throw');
      assert.equal(th.length, 1, dir);
      assert.equal(th[0].direction, dir);
      assert.equal(of(events, 'swipe').length, 0, 'pas de swipe parasite après un lancer');
    }
  });

  test(`swipe gauche / droite (${mode})`, () => {
    for (const dir of ['left', 'right', 'up', 'down']) {
      const { events } = run(S.swipe(dir, { model }));
      const sw = of(events, 'swipe');
      assert.equal(sw.length, 1, dir);
      assert.equal(sw[0].direction, dir);
      assert.equal(of(events, 'grab').length, 0);
    }
  });

  test(`clic aérien par pincement (${mode})`, () => {
    const { events } = run(S.pinchClick(0.42, 0.36, { model }));
    const ps = of(events, 'pinchstart'), pe = of(events, 'pinchend');
    assert.equal(ps.length, 1);
    assert.equal(pe.length, 1);
    assert.ok(Math.abs(ps[0].x - 0.42) < 0.02 && Math.abs(ps[0].y - 0.36) < 0.02, 'clic sur la cible');
    assert.ok(pe[0].moved < 0.02, 'la visée ne bouge pas en relâchant');
    assert.ok(pe[0].duration > 100 && pe[0].duration < 400);
    assert.equal(of(events, 'grab').length, 0, 'un pincement n’est pas un poing');
  });

  test(`glisser par pincement maintenu (${mode})`, () => {
    const { events } = run(S.pinchDrag(0.3, 0.5, 0.7, 0.5, { model }));
    const ps = of(events, 'pinchstart'), pe = of(events, 'pinchend');
    assert.equal(ps.length, 1);
    assert.equal(pe.length, 1);
    assert.ok(Math.abs(pe[0].x - 0.7) < 0.03, `arrivée ${pe[0].x}`);
    assert.ok(of(events, 'pinchmove').length > 10);
  });

  test(`zoom et rotation à deux mains (${mode})`, () => {
    const z = run(S.twoHands({ zoom: 1.8, rotate: 0, model }));
    const ends = of(z.events, 'twohand:end');
    assert.equal(of(z.events, 'twohand:start').length, 1);
    assert.equal(ends.length, 1);
    assert.ok(ends[0].scale > 1.5 && ends[0].scale < 2.0, `échelle ${ends[0].scale}`);
    assert.ok(Math.abs(ends[0].rotation) < 0.08);
    const r = run(S.twoHands({ zoom: 1, rotate: 0.6, model }));
    const re = of(r.events, 'twohand:end')[0];
    assert.ok(re.rotation > 0.3, `rotation ${re.rotation}`);
    assert.ok(Math.abs(re.scale - 1) < 0.15);
  });

  test(`gestes canoniques maintenus (${mode})`, () => {
    for (const [pose, name] of [['thumb_up', 'Thumb_Up'], ['victory', 'Victory'], ['iloveyou', 'ILoveYou']]) {
      const { events } = run(S.holdPose(pose, { model }));
      const g = of(events, 'gesture').filter((e) => e.name === name);
      assert.equal(g.length, 1, name);
      assert.equal(of(events, 'grab').length, 0, `${name} ne doit pas « attraper »`);
    }
  });

  test(`deux index levés (${mode})`, () => {
    const { events } = run(S.twoIndex({ model }));
    assert.equal(of(events, 'gesture').filter((e) => e.name === 'Two_Index').length, 1);
  });
}

test('le modèle de confiance l’emporte sur la géométrie', () => {
  const engine = new GestureEngine();
  let last;
  for (let i = 0; i < 12; i++) {
    const landmarks = renderHand('open', { x: 0.5, y: 0.5, aspect: 16 / 9 });
    last = engine.update({ t: i * 33, width: 1280, height: 720, hands: [{ landmarks, handedness: 'Left', gestures: [{ categoryName: 'Closed_Fist', score: 0.93 }] }] });
  }
  assert.equal(last.hands[0].pose, 'fist');
  const engine2 = new GestureEngine();
  for (let i = 0; i < 12; i++) {
    const landmarks = renderHand('open', { x: 0.5, y: 0.5, aspect: 16 / 9 });
    last = engine2.update({ t: i * 33, width: 1280, height: 720, hands: [{ landmarks, handedness: 'Left', gestures: [{ categoryName: 'Closed_Fist', score: 0.6 }] }] });
  }
  assert.equal(last.hands[0].pose, 'open', 'score moyen : la géométrie décide');
});

function poseAtRatio(target) {
  // Cherche un mélange « point → pinch » donnant le rapport voulu.
  let lo = 0, hi = 1;
  for (let k = 0; k < 40; k++) {
    const m = (lo + hi) / 2;
    const r = pinchRatio(toIso(renderHand(blendPoses('point', 'pinch', m), { x: 0.5, y: 0.5, aspect: 16 / 9, anchor: 'index@point' }), 16 / 9, true));
    if (r > target) lo = m; else hi = m;
  }
  return blendPoses('point', 'pinch', (lo + hi) / 2);
}

test('hystérésis du pincement : pas de bascule entre les deux seuils', () => {
  const engine = new GestureEngine();
  const between = poseAtRatio(0.35); // entre pinchOn (0.28) et pinchOff (0.42)
  const frames = [];
  for (let i = 0; i < 10; i++) frames.push('point');
  for (let i = 0; i < 6; i++) frames.push('pinch');
  for (let i = 0; i < 20; i++) frames.push(i % 2 ? 'pinch' : between);
  for (let i = 0; i < 10; i++) frames.push(between);
  const events = [];
  frames.forEach((pose, i) => {
    const landmarks = renderHand(pose, { x: 0.5, y: 0.5, aspect: 16 / 9, anchor: 'index@point' });
    const r = engine.update({ t: i * 33, width: 1280, height: 720, hands: [{ landmarks, handedness: 'Left' }] });
    events.push(...r.events);
  });
  assert.equal(of(events, 'pinchstart').length, 1);
  assert.equal(of(events, 'pinchend').length, 0, 'reste pincé dans la zone d’hystérésis');
  // Et une main « entre deux » qui arrive ne déclenche pas de pincement.
  const e2 = new GestureEngine();
  const ev2 = [];
  for (let i = 0; i < 20; i++) {
    const landmarks = renderHand(between, { x: 0.5, y: 0.5, aspect: 16 / 9, anchor: 'index@point' });
    ev2.push(...e2.update({ t: i * 33, width: 1280, height: 720, hands: [{ landmarks, handedness: 'Left' }] }).events);
  }
  assert.equal(of(ev2, 'pinchstart').length, 0);
});

test('anti-rebond : une image parasite isolée ne change pas la pose', () => {
  const engine = new GestureEngine();
  const events = [];
  const seq = [];
  for (let i = 0; i < 12; i++) seq.push('open');
  seq.push('fist'); // une seule image
  for (let i = 0; i < 12; i++) seq.push('open');
  seq.forEach((pose, i) => {
    const landmarks = renderHand(pose, { x: 0.5, y: 0.5, aspect: 16 / 9, anchor: 'palm' });
    events.push(...engine.update({ t: i * 33, width: 1280, height: 720, hands: [{ landmarks, handedness: 'Left' }] }).events);
  });
  assert.equal(of(events, 'grab').length, 0);
  assert.equal(of(events, 'release').length, 0);
});

test('perte de main tolérée brièvement puis signalée', () => {
  const engine = new GestureEngine({ lostMs: 300 });
  const lm = renderHand('open', { x: 0.5, y: 0.5, aspect: 16 / 9 });
  const ev = [];
  let t = 0;
  for (let i = 0; i < 6; i++) ev.push(...engine.update({ t: (t += 33), width: 1280, height: 720, hands: [{ landmarks: lm, handedness: 'Left' }] }).events);
  for (let i = 0; i < 4; i++) ev.push(...engine.update({ t: (t += 33), width: 1280, height: 720, hands: [] }).events);
  assert.equal(of(ev, 'handlost').length, 0, 'coupure de 130 ms tolérée');
  ev.push(...engine.update({ t: (t += 33), width: 1280, height: 720, hands: [{ landmarks: lm, handedness: 'Left' }] }).events);
  assert.equal(of(ev, 'handfound').length, 1, 'même piste conservée');
  for (let i = 0; i < 12; i++) ev.push(...engine.update({ t: (t += 33), width: 1280, height: 720, hands: [] }).events);
  assert.equal(of(ev, 'handlost').length, 1);
});

test('cadence faible : une image manquée à 3 images/s n’est pas une perte de main', () => {
  const engine = new GestureEngine({ lostMs: 320 });
  const lm = renderHand('open', { x: 0.5, y: 0.5, aspect: 16 / 9 });
  const ev = [];
  const hand = [{ landmarks: lm, handedness: 'Left' }];
  let t = 0;
  for (let i = 0; i < 6; i++) ev.push(...engine.update({ t: (t += 333), width: 1280, height: 720, hands: hand }).events);
  ev.push(...engine.update({ t: (t += 333), width: 1280, height: 720, hands: [] }).events);
  ev.push(...engine.update({ t: (t += 333), width: 1280, height: 720, hands: hand }).events);
  assert.equal(of(ev, 'handlost').length, 0, 'une image vide isolée est tolérée');
  assert.equal(of(ev, 'handfound').length, 1, 'même piste conservée');
  for (let i = 0; i < 4; i++) ev.push(...engine.update({ t: (t += 333), width: 1280, height: 720, hands: [] }).events);
  assert.equal(of(ev, 'handlost').length, 1, 'perte signalée ensuite');
});

test('miroir : un swipe vers la droite à l’écran est vers la gauche dans l’image brute', () => {
  const seq = S.swipe('right', { mirror: true });
  const a = run(seq, { mirror: true });
  const b = run(seq, { mirror: false });
  assert.equal(of(a.events, 'swipe')[0].direction, 'right');
  assert.equal(of(b.events, 'swipe')[0].direction, 'left');
});

test('main dominante : pilote le curseur, latéralité MediaPipe corrigée', () => {
  const r = run(S.twoIndex(), { dominant: 'Left' });
  const res = r.results.find((x) => x.hands.length === 2);
  assert.equal(res.primary.side, 'Left');
  assert.ok(res.primary.pointer.x < 0.5, 'la main gauche est à gauche à l’écran (miroir)');
  const r2 = run(S.twoIndex(), { dominant: 'Right' });
  assert.equal(r2.results.find((x) => x.hands.length === 2).primary.side, 'Right');
  assert.equal(mediapipeLabel('Right'), 'Left');
});

test('réglages modifiables à chaud', () => {
  const engine = new GestureEngine();
  engine.configure({ pinchOn: 0.1, smoothing: { beta: 1 } });
  assert.equal(engine.opts.pinchOn, 0.1);
  assert.equal(engine.opts.smoothing.beta, 1);
  assert.equal(engine.opts.smoothing.minCutoff, 1.4);
});

test('séquences : coordonnées valides et main absente en fin de séquence', () => {
  for (const [name, sc] of Object.entries(S.SCENARIOS)) {
    const seq = sc.build();
    assert.ok(seq.frames.length > 10, name);
    for (const f of seq.frames) for (const h of f.hands) {
      assert.equal(h.landmarks.length, 21);
      for (const p of h.landmarks) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
  }
});

test('geste importé : horodatages croissants et durée bornée', () => {
  const ok = S.swipe('left', { mirror: true }).frames;
  assert.equal(S.sequenceProblem(ok), null, 'séquence synthétique jouable');
  const hand = ok.find((f) => f.hands.length).hands[0];
  const at = (t) => ({ t, width: 1280, height: 720, hands: [hand] });
  assert.equal(S.sequenceProblem([at(0), at(1e9), at(2e9)]), 'durée', '23 jours refusés');
  assert.equal(S.sequenceProblem([at(0), at(500), at(200)]), 'temps', 'horodatages décroissants refusés');
  assert.equal(S.sequenceProblem([at(0), at(10)]), 'format', 'trop court');
  assert.equal(S.sequenceProblem([at(0), at(10), { t: 20, hands: [{ landmarks: [] }] }]), 'format', 'main incomplète');
  assert.equal(S.sequenceProblem([at(0), at(10), at(S.MAX_SEQUENCE_S * 1000)]), null, 'durée maximale acceptée');
});
