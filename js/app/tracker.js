// Source caméra : flux vidéo + suivi des mains MediaPipe (modèles et WASM
// hébergés avec le site). Produit des images au format attendu par le moteur.

const VISION_URL = new URL('../../vendor/mediapipe/vision_bundle.mjs', import.meta.url).href;
const WASM_BASE = new URL('../../vendor/mediapipe/wasm', import.meta.url).href.replace(/\/$/, '');
export const MODEL_URLS = {
  gesture: new URL('../../models/gesture_recognizer.task', import.meta.url).href,
  landmarker: new URL('../../models/hand_landmarker.task', import.meta.url).href,
};

async function fetchBytes(url, onProgress) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement impossible (${res.status}) : ${url.split('/').pop()}`);
  const total = Number(res.headers.get('content-length')) || 0;
  if (!res.body || !total) {
    const buf = new Uint8Array(await res.arrayBuffer());
    onProgress?.(1);
    return buf;
  }
  const reader = res.body.getReader();
  const out = new Uint8Array(total);
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (received + value.length > out.length) {
      // Taille annoncée inexacte (compression) : on bascule sur une concaténation.
      const bigger = new Uint8Array(Math.max(out.length * 2, received + value.length));
      bigger.set(out.subarray(0, received));
      return finishGrow(bigger, received, value, reader, onProgress, total);
    }
    out.set(value, received);
    received += value.length;
    onProgress?.(Math.min(1, received / total));
  }
  onProgress?.(1);
  return received === out.length ? out : out.slice(0, received);
}

async function finishGrow(buf, received, value, reader, onProgress, total) {
  let b = buf, r = received;
  const push = (v) => {
    if (r + v.length > b.length) { const n = new Uint8Array((r + v.length) * 2); n.set(b.subarray(0, r)); b = n; }
    b.set(v, r); r += v.length;
  };
  push(value);
  for (;;) {
    const { done, value: v } = await reader.read();
    if (done) break;
    push(v);
    onProgress?.(Math.min(0.99, r / (total * 1.5)));
  }
  onProgress?.(1);
  return b.slice(0, r);
}

// Les journaux internes de MediaPipe (format glog, « INFO: … ») passent par
// console.error/warn : on les range au niveau « debug » pour garder une
// console propre. Les vraies erreurs (lignes « E… ») restent des erreurs.
const GLOG = /^(?:[IW]\d{4} \d{2}:\d{2}:\d{2}|INFO: |Graph successfully started running)/;
for (const level of ['error', 'warn', 'log', 'info']) {
  const original = console[level].bind(console);
  console[level] = (...args) => (typeof args[0] === 'string' && GLOG.test(args[0]) ? console.debug(...args) : original(...args));
}

/** Rendu WebGL logiciel (SwiftShader, llvmpipe…) : le « GPU » y serait plus lent que le CPU. */
export function softwareGpu() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}

let visionModule = null;
let filesetPromise = null;
const taskCache = new Map();

async function loadFileset(onProgress) {
  if (!filesetPromise) {
    filesetPromise = (async () => {
      visionModule = visionModule || (await import(VISION_URL));
      const fs = await visionModule.FilesetResolver.forVisionTasks(WASM_BASE);
      // Pré-téléchargement du binaire WASM avec progression, servi ensuite depuis un blob.
      const bytes = await fetchBytes(fs.wasmBinaryPath, onProgress);
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/wasm' }));
      return { ...fs, wasmBinaryPath: blobUrl };
    })();
    filesetPromise.catch(() => { filesetPromise = null; });
  }
  return filesetPromise;
}

async function createTask(kind, delegate, onProgress) {
  const key = `${kind}:${delegate}`;
  if (taskCache.has(key)) return taskCache.get(key);
  const prog = { wasm: 0, model: 0 };
  const report = () => onProgress?.(prog.wasm * 0.6 + prog.model * 0.4);
  const [fileset, model] = await Promise.all([
    loadFileset((p) => { prog.wasm = p; report(); }),
    fetchBytes(MODEL_URLS[kind], (p) => { prog.model = p; report(); }),
  ]);
  const Cls = kind === 'gesture' ? visionModule.GestureRecognizer : visionModule.HandLandmarker;
  const base = {
    runningMode: 'VIDEO',
    numHands: 2,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  };
  let task = null;
  let used = delegate;
  const attempt = async (d) => Cls.createFromOptions(fileset, {
    baseOptions: { modelAssetBuffer: model.slice(), delegate: d },
    ...base,
    ...(kind === 'gesture' ? { cannedGesturesClassifierOptions: { scoreThreshold: 0.3 } } : {}),
  });
  try {
    task = await attempt(delegate);
  } catch (err) {
    if (delegate === 'GPU') {
      console.info('[jarvis] délégué GPU indisponible, repli sur le CPU :', err?.message || err);
      used = 'CPU';
      task = await attempt('CPU');
    } else {
      throw err;
    }
  }
  const entry = { task, delegate: used, kind };
  taskCache.set(key, entry);
  return entry;
}

export class CameraSource {
  constructor({ video, onFrame, onStatus }) {
    this.video = video;
    this.onFrame = onFrame;
    this.onStatus = onStatus || (() => {});
    this.stream = null;
    this.entry = null;
    this.running = false;
    this.throttleMs = 0;
    this.lastTs = 0;
    this.lastVideoTime = -1;
    this.stats = { fps: 0, latency: 0, delegate: '—', width: 0, height: 0, model: '—' };
    this._frames = [];
    this._loop = this._loop.bind(this);
  }

  get active() { return this.running; }

  async start(opts) {
    this.opts = opts;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Caméra non disponible : ouvrez la page en HTTPS dans un navigateur récent.');
    this.onStatus({ phase: 'camera', message: 'Autorisation de la caméra…' });
    const light = opts.quality === 'light';
    const constraints = {
      audio: false,
      video: {
        facingMode: opts.facing || 'user',
        width: { ideal: light ? 640 : 1280 },
        height: { ideal: light ? 480 : 720 },
        frameRate: { ideal: 30, max: 60 },
      },
    };
    this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.video.srcObject = this.stream;
    this.video.muted = true;
    await this.video.play().catch(() => {});
    await new Promise((r) => (this.video.readyState >= 2 ? r() : this.video.addEventListener('loadeddata', r, { once: true })));

    this.stats.width = this.video.videoWidth;
    this.stats.height = this.video.videoHeight;

    this.onStatus({ phase: 'download', progress: 0, message: 'Chargement du modèle optique…' });
    let delegate = opts.delegate || 'GPU';
    if (delegate === 'GPU' && this._preferCpu) delegate = 'CPU';
    else if (delegate === 'GPU' && softwareGpu()) {
      delegate = 'CPU';
      this._preferCpu = true;
      this.onStatus({ phase: 'notice', message: 'Processeur graphique émulé : calcul sur le processeur.' });
    }
    this.entry = await createTask(opts.model || 'gesture', delegate, (p) => this.onStatus({ phase: 'download', progress: p, message: 'Chargement du modèle optique…' }));
    this.startedAt = performance.now();
    this._gpuEntry = null;
    this._decided = false;
    this.stats.delegate = this.entry.delegate;
    this.stats.model = this.entry.kind === 'gesture' ? 'gestes' : 'points';
    this.running = true;
    this.onStatus({ phase: 'running', message: 'Suivi actif' });
    this._schedule();
    return this.stream;
  }

  _schedule() {
    if (!this.running) return;
    if (this.throttleMs > 0) {
      this._timer = setTimeout(this._loop, this.throttleMs);
    } else if (this.video.requestVideoFrameCallback) {
      this._rvfc = this.video.requestVideoFrameCallback(this._loop);
    } else {
      this._raf = requestAnimationFrame(this._loop);
    }
  }

  _loop() {
    if (!this.running) return;
    try {
      const v = this.video;
      if (v.readyState >= 2 && v.videoWidth && (this.throttleMs > 0 || v.currentTime !== this.lastVideoTime)) {
        this.lastVideoTime = v.currentTime;
        let ts = performance.now();
        if (ts <= this.lastTs) ts = this.lastTs + 0.01;
        this.lastTs = ts;
        const t0 = performance.now();
        const res = this.entry.kind === 'gesture'
          ? this.entry.task.recognizeForVideo(v, ts)
          : this.entry.task.detectForVideo(v, ts);
        const latency = performance.now() - t0;
        this._measure(ts, latency);
        this._checkDelegate();
        this.stats.width = v.videoWidth;
        this.stats.height = v.videoHeight;
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
        this.onFrame({ t: ts, width: v.videoWidth, height: v.videoHeight, hands, source: 'camera' });
      }
    } catch (err) {
      console.warn('[jarvis] inférence :', err);
    }
    this._schedule();
  }

  _measure(ts, latency) {
    this._frames.push(ts);
    while (this._frames.length && ts - this._frames[0] > 1000) this._frames.shift();
    this.stats.fps = this._frames.length;
    this.stats.latency = this.stats.latency ? this.stats.latency * 0.85 + latency * 0.15 : latency;
  }

  /**
   * GPU nettement trop lent après quelques secondes : essai sur le CPU, puis
   * on garde le plus rapide des deux (comparaison des latences moyennes).
   */
  _checkDelegate() {
    if (this._switching || this._decided) return;
    const now = performance.now();
    if (this.entry.delegate === 'GPU' && !this._gpuEntry) {
      if (now - this.startedAt < 3000 || this._frames.length < 3 || this.stats.latency < 140) return;
      this._gpuEntry = this.entry;
      this._gpuLatency = this.stats.latency;
      this._switching = true;
      createTask(this.entry.kind, 'CPU')
        .then((entry) => {
          if (!this.running) return;
          this.entry = entry;
          this.stats.delegate = entry.delegate;
          this.stats.latency = 0;
          this._cpuSince = performance.now();
        })
        .catch((err) => { this._decided = true; console.warn('[jarvis] repli CPU :', err); })
        .finally(() => { this._switching = false; });
      return;
    }
    if (this._gpuEntry && this.entry.delegate === 'CPU' && now - this._cpuSince > 2500) {
      this._decided = true;
      if (this.stats.latency > this._gpuLatency) {
        this.entry = this._gpuEntry;
        this.stats.delegate = 'GPU';
      } else {
        this._preferCpu = true;
        this.onStatus({ phase: 'delegate', delegate: 'CPU', message: 'Calcul basculé sur le processeur, plus rapide sur cet appareil.' });
      }
    }
  }

  setThrottle(ms) {
    this.throttleMs = ms;
    if (this.running) {
      clearTimeout(this._timer);
      if (this._rvfc && this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this._rvfc);
      cancelAnimationFrame(this._raf);
      this._schedule();
    }
  }

  stop() {
    this.running = false;
    clearTimeout(this._timer);
    if (this._rvfc && this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this._rvfc);
    cancelAnimationFrame(this._raf);
    if (this.stream) for (const tr of this.stream.getTracks()) tr.stop();
    this.stream = null;
    this.video.srcObject = null;
    this._frames = [];
    this.stats.fps = 0;
    this.onStatus({ phase: 'stopped', message: 'Caméra coupée' });
  }
}
