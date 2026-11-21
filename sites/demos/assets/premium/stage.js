// Écrin — moteur de scène 3D piloté par le défilement.
//
// La page est découpée en « chapitres » ([data-chapter]). À chaque chapitre correspond un plan
// de caméra ; entre deux chapitres la caméra glisse d'un plan à l'autre. Le code d'une démo
// reçoit à chaque image la position fractionnaire `f` (0 = 1er chapitre centré, 1 = 2e, 1.5 =
// à mi-chemin entre le 2e et le 3e…) et anime ses objets avec.
//
//   const stage = new Stage({ background: '#0b0a09' });
//   stage.setShots([{ target: [0, 0, 0], radius: 6, azimuth: 20, elevation: 15 }, …]);
//   stage.onFrame(({ f, time, dt }) => { … });
//   stage.start();

import * as THREE from 'three';

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
// Progression 0→1 quand `f` passe de `a` à `b`, adoucie.
export const span = (f, a, b) => smooth(clamp((f - a) / (b - a)));
// Amortissement exponentiel indépendant de la fréquence d'images.
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));

// Valeur d'une piste à la position `f` : une valeur par chapitre, interpolée en douceur.
//   const tilt = track(f, [0.9, 0, 0, 0.2]);
export function track(f, values) {
  const last = values.length - 1;
  const x = clamp(f, 0, last);
  const i = Math.min(Math.floor(x), last);
  const j = Math.min(i + 1, last);
  return lerp(values[i], values[j], smoother(x - i));
}

const DEG = Math.PI / 180;
const SHOT_DEFAULTS = { target: [0, 0, 0], radius: 6, azimuth: 0, elevation: 10, fov: 30, shift: [0, 0], roll: 0 };

export class Stage {
  constructor(options = {}) {
    const {
      canvas = document.querySelector('[data-stage]'),
      chapters = '[data-chapter]',
      background = '#0b0a09',
      exposure = 1,
      maxPixelRatio = 2,
      follow = 4.5, // vivacité du suivi du défilement (plus haut = plus direct)
      parallax = 1, // ampleur du léger mouvement de caméra au pointeur
    } = options;

    this.canvas = canvas;
    this.chapters = [...document.querySelectorAll(chapters)];
    this.follow = follow;
    this.parallax = parallax;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.callbacks = [];
    this.shots = [];
    this.ok = false;

    const query = new URLSearchParams(location.search);
    this.lockedPixelRatio = Number(query.get('dpr')) || 0;

    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch {
      document.documentElement.classList.add('no-webgl', 'is-ready');
      return;
    }
    this.ok = true;
    this.maxPixelRatio = maxPixelRatio;
    this.pixelRatio = this.lockedPixelRatio || Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = exposure;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(background);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 200);

    this.state = {
      time: 0,
      dt: 0,
      f: 0, // position fractionnaire lissée parmi les chapitres
      chapter: 0, // chapitre le plus proche du centre de l'écran
      progress: 0, // 0→1 sur l'ensemble des chapitres
      pointer: new THREE.Vector2(), // -1…1, lissé
      portrait: false,
      reduced: this.reduced,
      width: 1,
      height: 1,
    };
    this.rawPointer = new THREE.Vector2();
    this.targetF = 0;
    this.visibleChapters = this.chapters.length ? 0 : 1;
    this.slow = 0;
    this.clock = new THREE.Clock();
    this._shot = { ...SHOT_DEFAULTS, target: new THREE.Vector3(), shift: [0, 0] };
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.measure = this.measure.bind(this);

    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('scroll', () => this.readScroll(), { passive: true });
    window.addEventListener(
      'pointermove',
      (event) => {
        if (event.pointerType === 'touch') return;
        this.rawPointer.set((event.clientX / window.innerWidth) * 2 - 1, -((event.clientY / window.innerHeight) * 2 - 1));
      },
      { passive: true }
    );
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.clock.getDelta();
    });
    if ('IntersectionObserver' in window && this.chapters.length) {
      const seen = new Set();
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target);
          else seen.delete(entry.target);
        }
        this.visibleChapters = seen.size;
        this.canvas.classList.toggle('is-idle', seen.size === 0);
      });
      for (const chapter of this.chapters) observer.observe(chapter);
    } else {
      this.visibleChapters = 1;
    }
    if ('ResizeObserver' in window) new ResizeObserver(this.measure).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(this.measure);

    this.resize();
  }

  // ---------- API pour les démos ----------

  add(...objects) {
    this.scene.add(...objects);
    return objects[0];
  }

  onFrame(callback) {
    this.callbacks.push(callback);
  }

  // Un plan par chapitre. Champs : target [x,y,z], radius, azimuth (°), elevation (°), fov (°),
  // shift [x,y] (décalage du sujet à l'écran, -1…1), roll (°).
  // `portrait: { … }` remplace ces champs quand l'écran est plus haut que large.
  setShots(shots) {
    this.shots = shots.map((shot) => ({ ...SHOT_DEFAULTS, ...shot }));
  }

  setEnvironment(texture, intensity = 1) {
    this.scene.environment = texture;
    this.scene.environmentIntensity = intensity;
  }

  // Lance le rendu. `assets` : promesse(s) à attendre avant de lever le voile de chargement.
  async start(assets) {
    if (!this.ok) return;
    try {
      await assets;
    } catch (error) {
      console.error('[écrin] chargement incomplet', error);
    }
    this.measure();
    this.readScroll();
    this.state.f = this.targetF;
    this.clock.start();
    try {
      this.renderer.compile(this.scene, this.camera);
    } catch {
      // la compilation anticipée est un simple confort
    }
    this.frame();
    requestAnimationFrame(() => document.documentElement.classList.add('is-ready'));
  }

  // ---------- défilement ----------

  measure() {
    this.centers = this.chapters.map((element) => {
      const rect = element.getBoundingClientRect();
      return rect.top + window.scrollY + rect.height / 2;
    });
    this.readScroll();
  }

  readScroll() {
    const centers = this.centers || [];
    if (!centers.length) return;
    const y = window.scrollY + window.innerHeight / 2;
    let f = centers.length - 1;
    if (y <= centers[0]) f = 0;
    else {
      for (let i = 0; i < centers.length - 1; i++) {
        if (y < centers[i + 1]) {
          f = i + (y - centers[i]) / (centers[i + 1] - centers[i]);
          break;
        }
      }
    }
    this.targetF = f;
    const nearest = Math.round(f);
    if (nearest !== this.activeChapter) {
      this.activeChapter = nearest;
      this.chapters.forEach((element, index) => {
        element.classList.toggle('is-active', index === nearest);
        element.classList.toggle('is-past', index < nearest);
      });
      document.documentElement.dataset.activeChapter = String(nearest);
    }
  }

  // ---------- rendu ----------

  resize() {
    if (!this.ok) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.state.width = width;
    this.state.height = height;
    this.state.portrait = height > width * 1.05;
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.measure();
  }

  resolveShot(index) {
    const shot = this.shots[clamp(index, 0, this.shots.length - 1)];
    return this.state.portrait && shot.portrait ? { ...shot, ...shot.portrait } : shot;
  }

  applyCamera() {
    const state = this.state;
    if (!this.shots.length) return;
    const last = this.shots.length - 1;
    const f = clamp(state.f, 0, last);
    const i = Math.min(Math.floor(f), last);
    const a = this.resolveShot(i);
    const b = this.resolveShot(i + 1);
    const k = smoother(f - i);
    const shot = this._shot;
    shot.radius = lerp(a.radius, b.radius, k);
    shot.azimuth = lerp(a.azimuth, b.azimuth, k);
    shot.elevation = lerp(a.elevation, b.elevation, k);
    shot.fov = lerp(a.fov, b.fov, k);
    shot.roll = lerp(a.roll, b.roll, k);
    shot.shift[0] = lerp(a.shift[0], b.shift[0], k);
    shot.shift[1] = lerp(a.shift[1], b.shift[1], k);
    shot.target.lerpVectors(this._a.fromArray(a.target), this._b.fromArray(b.target), k);

    // Un écran étroit recule un peu la caméra pour garder le sujet entier.
    const narrow = state.portrait ? clamp(1.9 - (state.width / state.height) * 1.6, 1, 1.9) : 1;
    const sway = this.reduced ? 0 : this.parallax;
    const azimuth = (shot.azimuth + state.pointer.x * 4 * sway + Math.sin(state.time * 0.23) * 0.8 * sway) * DEG;
    const elevation = clamp(shot.elevation - state.pointer.y * 2.5 * sway, -89, 89) * DEG;
    const radius = shot.radius * narrow;

    const camera = this.camera;
    camera.position.set(
      shot.target.x + radius * Math.cos(elevation) * Math.sin(azimuth),
      shot.target.y + radius * Math.sin(elevation),
      shot.target.z + radius * Math.cos(elevation) * Math.cos(azimuth)
    );
    camera.up.set(Math.sin(shot.roll * DEG), Math.cos(shot.roll * DEG), 0);
    camera.lookAt(shot.target);
    camera.fov = shot.fov;
    // Décale le sujet à l'écran sans changer la perspective.
    const { width, height } = state;
    camera.setViewOffset(width, height, (-shot.shift[0] * width) / 2, (shot.shift[1] * height) / 2, width, height);
    state.shot = shot;
  }

  frame() {
    requestAnimationFrame(this.frame);
    if (document.hidden || this.visibleChapters === 0) return;

    const state = this.state;
    const dt = Math.min(this.clock.getDelta(), 0.1);
    state.dt = dt;
    state.time += dt;
    state.f = this.reduced ? this.targetF : damp(state.f, this.targetF, this.follow, dt);
    state.chapter = this.activeChapter || 0;
    state.progress = this.shots.length > 1 ? clamp(state.f / (this.chapters.length - 1 || 1)) : 0;
    state.pointer.x = damp(state.pointer.x, this.rawPointer.x, 3, dt);
    state.pointer.y = damp(state.pointer.y, this.rawPointer.y, 3, dt);

    const shown = Math.round(state.progress * 1000) / 1000;
    if (shown !== this.shownProgress) {
      this.shownProgress = shown;
      document.documentElement.style.setProperty('--progress', String(shown));
    }

    this.applyCamera();
    for (const callback of this.callbacks) callback(state);
    this.renderer.render(this.scene, this.camera);
    this.adapt(dt);
  }

  // Si l'appareil peine, on baisse la définition plutôt que la fluidité.
  adapt(dt) {
    if (this.lockedPixelRatio || this.pixelRatio <= 1) return;
    this.slow = dt > 1 / 38 ? this.slow + 1 : Math.max(0, this.slow - 2);
    if (this.slow > 50) {
      this.slow = 0;
      this.pixelRatio = Math.max(1, this.pixelRatio - 0.25);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(this.state.width, this.state.height, false);
    }
  }
}
