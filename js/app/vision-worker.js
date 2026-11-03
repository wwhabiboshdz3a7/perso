// Inférence MediaPipe hors du fil principal : l'interface reste fluide même
// quand le suivi des mains est lent (processeur modeste, calcul sur le CPU).
// Worker « classique » : le chargeur WASM de MediaPipe passe par importScripts,
// d'où la version IIFE de la bibliothèque (même version que le module ESM).
/* eslint-env worker */
/* global importScripts, Vision */

// Les journaux internes de MediaPipe (format glog) restent au niveau « debug ».
const GLOG = /^(?:[IW]\d{4} \d{2}:\d{2}:\d{2}|INFO: |Graph successfully started running)/;
for (const level of ['error', 'warn', 'log', 'info']) {
  const original = console[level].bind(console);
  console[level] = (...args) => (typeof args[0] === 'string' && GLOG.test(args[0]) ? console.debug(...args) : original(...args));
}

importScripts('../../vendor/mediapipe/vision_bundle.js');
const vision = Vision;

const tasks = new Map();
let current = null;
let filesetPromise = null;

async function fetchBytes(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status}) : ${url.split('/').pop()}`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) {
    const buf = new Uint8Array(await res.arrayBuffer());
    onProgress(1);
    return buf;
  }
  const reader = res.body.getReader();
  const parts = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    parts.push(value);
    received += value.length;
    onProgress(Math.min(0.99, received / total));
  }
  const out = new Uint8Array(received);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  onProgress(1);
  return out;
}

function loadFileset(wasmBase, onProgress) {
  if (!filesetPromise) {
    filesetPromise = (async () => {
      const fs = await vision.FilesetResolver.forVisionTasks(wasmBase);
      const bytes = await fetchBytes(fs.wasmBinaryPath, onProgress);
      return { ...fs, wasmBinaryPath: URL.createObjectURL(new Blob([bytes], { type: 'application/wasm' })) };
    })();
    filesetPromise.catch(() => { filesetPromise = null; });
  }
  return filesetPromise;
}

async function createTask({ kind, delegate, wasmBase, modelUrl }) {
  const key = `${kind}:${delegate}`;
  if (tasks.has(key)) { postMessage({ type: 'progress', progress: 1 }); return tasks.get(key); }
  const prog = { wasm: 0, model: 0 };
  const report = () => postMessage({ type: 'progress', progress: prog.wasm * 0.6 + prog.model * 0.4 });
  const [fileset, model] = await Promise.all([
    loadFileset(wasmBase, (p) => { prog.wasm = p; report(); }),
    fetchBytes(modelUrl, (p) => { prog.model = p; report(); }),
  ]);
  const Cls = kind === 'gesture' ? vision.GestureRecognizer : vision.HandLandmarker;
  const attempt = (d) => Cls.createFromOptions(fileset, {
    baseOptions: { modelAssetBuffer: model.slice(), delegate: d },
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
    ...(kind === 'gesture' ? { cannedGesturesClassifierOptions: { scoreThreshold: 0.3 } } : {}),
  });
  let task;
  let used = delegate;
  try {
    task = await attempt(delegate);
  } catch (err) {
    if (delegate !== 'GPU') throw err;
    console.info('[jarvis] délégué GPU indisponible dans le worker, repli sur le CPU :', err?.message || err);
    used = 'CPU';
    task = await attempt('CPU');
  }
  const entry = { task, kind, delegate: used };
  tasks.set(key, entry);
  return entry;
}

function detect(bitmap, ts) {
  const t0 = performance.now();
  const res = current.kind === 'gesture' ? current.task.recognizeForVideo(bitmap, ts) : current.task.detectForVideo(bitmap, ts);
  const inference = performance.now() - t0;
  const hands = (res.landmarks || []).map((lm, i) => {
    const hd = (res.handedness || res.handednesses || [])[i]?.[0];
    const g = res.gestures ? res.gestures[i] : null;
    return {
      landmarks: lm.map((p) => ({ x: p.x, y: p.y, z: p.z })),
      handedness: hd?.categoryName || 'Right',
      handednessScore: hd?.score ?? 1,
      gestures: g ? g.slice(0, 2).map((c) => ({ categoryName: c.categoryName, score: c.score })) : undefined,
    };
  });
  return { hands, inference };
}

self.onmessage = async ({ data: m }) => {
  if (m.type === 'init') {
    try {
      current = await createTask(m);
      postMessage({ type: 'ready', id: m.id, delegate: current.delegate, kind: current.kind });
    } catch (err) {
      postMessage({ type: 'error', id: m.id, message: String(err?.message || err) });
    }
  } else if (m.type === 'frame') {
    try {
      if (!current) throw new Error('Modèle non chargé');
      const out = detect(m.bitmap, m.ts);
      postMessage({ type: 'result', id: m.id, ...out });
    } catch (err) {
      postMessage({ type: 'error', id: m.id, message: String(err?.message || err) });
    } finally {
      m.bitmap?.close?.();
    }
  }
};
