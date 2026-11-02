// Hologramme 3D (Three.js) : globe filaire avec villes et liaisons depuis
// Toulouse, ou réacteur à anneaux. Rotation à la main, zoom à deux mains.

import { $, el, clamp, reducedMotion } from './dom.js';

const CITIES = [
  ['Toulouse', 43.6047, 1.4442, true], ['Paris', 48.8566, 2.3522], ['Londres', 51.5074, -0.1278], ['Alger', 36.7538, 3.0588],
  ['Casablanca', 33.5731, -7.5898], ['Dakar', 14.7167, -17.4677], ['New York', 40.7128, -74.006], ['Montréal', 45.5017, -73.5673],
  ['San Francisco', 37.7749, -122.4194], ['São Paulo', -23.5505, -46.6333], ['Le Cap', -33.9249, 18.4241], ['Dubaï', 25.2048, 55.2708],
  ['Singapour', 1.3521, 103.8198], ['Tokyo', 35.6762, 139.6503], ['Sydney', -33.8688, 151.2093],
];

export class Holo {
  constructor(app) {
    this.app = app;
    this.canvas = $('#holoCanvas');
    this.wrap = $('#holoWrap');
    this.labelsEl = $('#holoLabels');
    this.readout = $('#holoReadout');
    this.ready = false;
    this.running = false;
    this.object = 'globe';
    this.yaw = -0.4; this.pitch = 0.35; this.zoom = 1;
    this.vyaw = 0.0; this.vpitch = 0;
    this.drag = null;
    this.base = null;
    this.lastInteract = 0;
    this._loop = this._loop.bind(this);
    this._bindUi();
  }

  async init() {
    if (this.ready || this.failed) return this.ready;
    try {
      const THREE = await import('../../vendor/three/three.module.js');
      this.THREE = THREE;
      const renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      renderer.setClearColor(0x000000, 0);
      this.renderer = renderer;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      this.camera.position.set(0, 0, 4.2);
      this.root = new THREE.Group();
      this.scene.add(this.root);
      this.globe = this._buildGlobe(THREE);
      this.reactor = this._buildReactor(THREE);
      this.reactor.visible = false;
      this.root.add(this.globe, this.reactor);
      this._buildLabels();
      new ResizeObserver(() => this._resize()).observe(this.wrap);
      this._resize();
      this.ready = true;
    } catch (err) {
      this.failed = true;
      console.warn('[jarvis] WebGL :', err);
      this.wrap.append(el('p', { class: 'grid-empty', style: { position: 'absolute', inset: '40% 0 auto' } }, 'Hologramme indisponible : WebGL n’est pas activé sur ce navigateur.'));
    }
    return this.ready;
  }

  _latLon(lat, lon, r = 1) {
    const T = this.THREE;
    const phi = (90 - lat) * (Math.PI / 180);
    const th = (lon + 180) * (Math.PI / 180);
    return new T.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  }

  _buildGlobe(T) {
    const g = new T.Group();
    const cyan = new T.Color('#6ee7ff');
    const amber = new T.Color('#ffb547');
    // Sphère sombre : masque les lignes de la face arrière.
    g.add(new T.Mesh(new T.SphereGeometry(0.985, 48, 32), new T.MeshBasicMaterial({ color: 0x041821, transparent: true, opacity: 0.82 })));
    // Parallèles et méridiens.
    const pts = [];
    for (let lat = -75; lat <= 75; lat += 15) {
      for (let lon = 0; lon < 360; lon += 4) {
        pts.push(this._latLon(lat, lon - 180), this._latLon(lat, lon + 4 - 180));
      }
    }
    for (let lon = -180; lon < 180; lon += 15) {
      for (let lat = -88; lat < 88; lat += 4) {
        pts.push(this._latLon(lat, lon), this._latLon(lat + 4, lon));
      }
    }
    const grid = new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.28 }));
    g.add(grid);
    // Nuage de points (sphère de Fibonacci) pour la matière.
    const n = 1600, dots = [];
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * Math.PI * (3 - Math.sqrt(5));
      dots.push(new T.Vector3(Math.cos(th) * r * 1.002, y * 1.002, Math.sin(th) * r * 1.002));
    }
    g.add(new T.Points(new T.BufferGeometry().setFromPoints(dots), new T.PointsMaterial({ color: cyan, size: 0.008, transparent: true, opacity: 0.55 })));
    // Équateur renforcé et anneaux orbitaux.
    const ring = (radius, color, opacity, tilt) => {
      const c = new T.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
      const geo = new T.BufferGeometry().setFromPoints(c.getPoints(160).map((p) => new T.Vector3(p.x, 0, p.y)));
      const l = new T.LineLoop(geo, new T.LineBasicMaterial({ color, transparent: true, opacity }));
      l.rotation.x = tilt;
      return l;
    };
    g.add(ring(1.0, cyan, 0.7, 0));
    this.orbitA = ring(1.32, cyan, 0.35, 0.35);
    this.orbitB = ring(1.5, amber, 0.25, -0.6);
    g.add(this.orbitA, this.orbitB);
    this.sat = new T.Mesh(new T.SphereGeometry(0.02, 8, 8), new T.MeshBasicMaterial({ color: amber }));
    g.add(this.sat);
    // Villes et arcs depuis Toulouse.
    this.cityNodes = [];
    const home = this._latLon(CITIES[0][1], CITIES[0][2], 1);
    this.arcs = [];
    for (const [name, lat, lon, isHome] of CITIES) {
      const p = this._latLon(lat, lon, 1.01);
      const dot = new T.Mesh(new T.SphereGeometry(isHome ? 0.032 : 0.02, 10, 10), new T.MeshBasicMaterial({ color: isHome ? amber : cyan }));
      dot.position.copy(p);
      g.add(dot);
      const halo = new T.Mesh(new T.RingGeometry(0.035, 0.045, 24), new T.MeshBasicMaterial({ color: isHome ? amber : cyan, transparent: true, opacity: 0.6, side: T.DoubleSide }));
      halo.position.copy(p);
      halo.lookAt(p.clone().multiplyScalar(2));
      g.add(halo);
      this.cityNodes.push({ name, pos: p, isHome, halo });
      if (!isHome) {
        const end = this._latLon(lat, lon, 1);
        const midDir = home.clone().add(end).normalize();
        const dist = home.distanceTo(end);
        const mid = midDir.multiplyScalar(1 + dist * 0.35);
        const curve = new T.QuadraticBezierCurve3(home.clone().multiplyScalar(1.01), mid, end.clone().multiplyScalar(1.01));
        const line = new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(64)), new T.LineBasicMaterial({ color: amber, transparent: true, opacity: 0.45 }));
        g.add(line);
        const pulse = new T.Mesh(new T.SphereGeometry(0.012, 6, 6), new T.MeshBasicMaterial({ color: 0xffffff }));
        g.add(pulse);
        this.arcs.push({ curve, pulse, offset: Math.random() });
      }
    }
    return g;
  }

  _glowTexture(T, color) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.25, color);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr;
    x.fillRect(0, 0, 128, 128);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  _buildReactor(T) {
    const g = new T.Group();
    const cyan = new T.Color('#6ee7ff'), amber = new T.Color('#ffb547');
    this.reactorRings = [];
    const specs = [[0.35, 0.025, cyan, 0.9], [0.55, 0.012, amber, 0.8], [0.78, 0.03, cyan, 0.55], [1.02, 0.01, cyan, 0.8], [1.25, 0.018, amber, 0.5]];
    specs.forEach(([r, tube, color, op], i) => {
      const m = new T.Mesh(new T.TorusGeometry(r, tube, 12, 120), new T.MeshBasicMaterial({ color, transparent: true, opacity: op }));
      m.rotation.x = Math.PI / 2 + (i % 2 ? 0.5 : -0.3) * (i / 4);
      m.userData.speed = (i % 2 ? -1 : 1) * (0.25 + i * 0.12);
      g.add(m);
      this.reactorRings.push(m);
    });
    // Segments du rotor.
    const seg = new T.Group();
    for (let k = 0; k < 10; k++) {
      const s = new T.Mesh(new T.RingGeometry(0.62, 0.72, 8, 1, (k / 10) * Math.PI * 2, (Math.PI * 2) / 14), new T.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.7, side: T.DoubleSide }));
      seg.add(s);
    }
    seg.rotation.x = Math.PI / 2;
    g.add(seg);
    this.rotor = seg;
    const core = new T.Sprite(new T.SpriteMaterial({ map: this._glowTexture(T, 'rgba(110,231,255,0.9)'), transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    core.scale.set(1.1, 1.1, 1);
    g.add(core);
    this.core = core;
    const n = 600, pts = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = 0.4 + Math.random() * 1.1;
      pts.push(new T.Vector3(Math.cos(a) * r, (Math.random() - 0.5) * 0.25, Math.sin(a) * r));
    }
    this.sparks = new T.Points(new T.BufferGeometry().setFromPoints(pts), new T.PointsMaterial({ color: cyan, size: 0.012, transparent: true, opacity: 0.6 }));
    g.add(this.sparks);
    return g;
  }

  _buildLabels() {
    this.labelsEl.textContent = '';
    for (const c of this.cityNodes) {
      c.label = el('span', { class: `holo-label${c.isHome ? ' is-home' : ''}`, text: c.name });
      this.labelsEl.append(c.label);
    }
  }

  _resize() {
    if (!this.renderer) return;
    const r = this.wrap.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.size = { w, h };
  }

  setObject(name) {
    this.object = name;
    for (const b of document.querySelectorAll('[data-holo]')) b.setAttribute('aria-pressed', String(b.dataset.holo === name));
    if (!this.ready) return;
    this.globe.visible = name === 'globe';
    this.reactor.visible = name === 'reactor';
    this.labelsEl.hidden = name !== 'globe';
  }

  reset() {
    this.yaw = -0.4; this.pitch = 0.35; this.zoom = 1; this.vyaw = 0; this.vpitch = 0;
  }

  async start() {
    await this.init();
    if (!this.ready || this.running) return;
    this.running = true;
    this.setObject(this.object);
    this._resize();
    this._t = performance.now();
    requestAnimationFrame(this._loop);
  }

  stop() { this.running = false; this.drag = null; }

  _loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this._loop);
    if (document.hidden) return;
    const dt = Math.min(0.05, (now - this._t) / 1000);
    this._t = now;
    const T = this.THREE;
    const idle = now - this.lastInteract > 2500 && !this.drag;
    if (!this.drag) {
      this.yaw += this.vyaw * dt;
      this.pitch += this.vpitch * dt;
      this.vyaw *= Math.pow(0.12, dt);
      this.vpitch *= Math.pow(0.12, dt);
      if (idle && !reducedMotion()) this.yaw += dt * 0.12;
    }
    this.pitch = clamp(this.pitch, -1.2, 1.2);
    this.root.rotation.set(this.pitch, this.yaw, 0, 'XYZ');
    this.camera.position.z = 4.2 / this.zoom;
    const t = now / 1000;
    if (this.globe.visible) {
      this.orbitA.rotation.z = t * 0.2;
      const a = t * 0.6;
      this.sat.position.set(Math.cos(a) * 1.32, Math.sin(a) * Math.sin(0.35) * 1.32 * 0, Math.sin(a) * 1.32).applyAxisAngle(new T.Vector3(1, 0, 0), 0.35);
      for (const arc of this.arcs) {
        const k = ((t * 0.25 + arc.offset) % 1);
        arc.pulse.position.copy(arc.curve.getPoint(k));
      }
      for (const c of this.cityNodes) c.halo.scale.setScalar(1 + 0.25 * Math.sin(t * 3 + c.pos.x * 5));
      this._labels();
    } else {
      for (const r of this.reactorRings) r.rotation.z += r.userData.speed * dt;
      this.rotor.rotation.z -= dt * 0.8;
      this.sparks.rotation.y += dt * 0.3;
      this.core.material.opacity = 0.75 + 0.25 * Math.sin(t * 4);
    }
    this.renderer.render(this.scene, this.camera);
    const deg = (v) => Math.round(((v * 180) / Math.PI) % 360 + 360) % 360;
    this.readout.textContent = `${this.object === 'globe' ? 'GLOBE · 15 VILLES · ORIGINE TOULOUSE' : 'RÉACTEUR · 5 ANNEAUX'}\nROT ${String(deg(this.yaw)).padStart(3, '0')}° · INCL ${Math.round((this.pitch * 180) / Math.PI)}°\nZOOM ${this.zoom.toFixed(2).replace('.', ',')}×`;
  }

  _labels() {
    const T = this.THREE;
    const { w, h } = this.size;
    const camDir = new T.Vector3();
    const wp = new T.Vector3();
    for (const c of this.cityNodes) {
      wp.copy(c.pos).applyMatrix4(this.globe.matrixWorld);
      camDir.copy(this.camera.position).sub(wp).normalize();
      const facing = wp.clone().normalize().dot(camDir) > 0.15;
      const p = wp.clone().project(this.camera);
      const x = (p.x * 0.5 + 0.5) * w, y = (-p.y * 0.5 + 0.5) * h;
      c.label.style.transform = `translate(${x.toFixed(1)}px, ${(y - 6).toFixed(1)}px)`;
      c.label.style.opacity = facing ? '1' : '0';
    }
  }

  _bindUi() {
    for (const b of document.querySelectorAll('[data-holo]')) b.addEventListener('click', () => this.setObject(b.dataset.holo));
    $('#btnHoloReset').addEventListener('click', () => this.reset());
    const c = this.canvas;
    c.addEventListener('pointerdown', (e) => {
      if (this.app.mouseHand?.enabled && e.pointerType === 'mouse') return;
      c.setPointerCapture(e.pointerId);
      this._dragStart(e.clientX, e.clientY);
    });
    c.addEventListener('pointermove', (e) => { if (this.drag?.src === 'pointer') this._dragMove(e.clientX, e.clientY); });
    c.addEventListener('pointerup', () => this._dragEnd());
    c.addEventListener('pointercancel', () => this._dragEnd());
    c.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom = clamp(this.zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08), 0.5, 3); this.lastInteract = performance.now(); }, { passive: false });
    c.tabIndex = 0;
    c.addEventListener('keydown', (e) => {
      const k = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.12], ArrowDown: [0, 0.12] }[e.key];
      if (k) { this.yaw += k[0]; this.pitch += k[1]; e.preventDefault(); this.lastInteract = performance.now(); }
      if (e.key === '+' || e.key === '=') this.zoom = clamp(this.zoom * 1.1, 0.5, 3);
      if (e.key === '-') this.zoom = clamp(this.zoom / 1.1, 0.5, 3);
    });
  }

  _dragStart(x, y, src = 'pointer') {
    this.drag = { x, y, yaw: this.yaw, pitch: this.pitch, src, hist: [{ x, y, t: performance.now() }] };
    this.lastInteract = performance.now();
  }

  _dragMove(x, y) {
    const d = this.drag;
    if (!d) return;
    const k = 3 / Math.max(300, this.size?.w || 600);
    this.yaw = d.yaw + (x - d.x) * k;
    this.pitch = d.pitch + (y - d.y) * k;
    d.hist.push({ x, y, t: performance.now() });
    if (d.hist.length > 6) d.hist.shift();
    this.lastInteract = performance.now();
  }

  _dragEnd() {
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    const a = d.hist[0], b = d.hist[d.hist.length - 1];
    const dt = Math.max(0.016, (b.t - a.t) / 1000);
    const k = 3 / Math.max(300, this.size?.w || 600);
    this.vyaw = clamp(((b.x - a.x) * k) / dt, -6, 6);
    this.vpitch = clamp(((b.y - a.y) * k) / dt, -4, 4);
  }

  _overCanvas() {
    const s = this.app.cursor.screen;
    if (!s) return false;
    const under = document.elementFromPoint(s.x, s.y);
    return under === this.canvas || under?.closest?.('#holoWrap') === this.wrap && !under.closest('button');
  }

  onFrame() {
    if (this.drag && this.drag.src === 'air' && this.app.cursor.screen) this._dragMove(this.app.cursor.screen.x, this.app.cursor.screen.y);
  }

  onGesture(ev) {
    if (!this.ready) return false;
    const s = this.app.cursor.screen;
    if ((ev.type === 'pinchstart' || ev.type === 'grab') && s && this._overCanvas()) {
      this._dragStart(s.x, s.y, 'air');
      return true;
    }
    if ((ev.type === 'pinchend' || ev.type === 'release') && this.drag?.src === 'air') {
      this._dragEnd();
      return true;
    }
    if (ev.type === 'twohand:start') { this.drag = null; this.base = { zoom: this.zoom, yaw: this.yaw }; return true; }
    if (ev.type === 'twohand:update' && this.base) {
      this.zoom = clamp(this.base.zoom * ev.scale, 0.5, 3);
      this.yaw = this.base.yaw + ev.rotation * 0.8;
      this.lastInteract = performance.now();
      return true;
    }
    if (ev.type === 'twohand:end') { this.base = null; return true; }
    if (ev.type === 'swipe' && (ev.direction === 'left' || ev.direction === 'right')) {
      this.vyaw += ev.direction === 'right' ? 4 : -4;
      this.lastInteract = performance.now();
      this.app.sound.play('swipe');
      return true;
    }
    return false;
  }
}
