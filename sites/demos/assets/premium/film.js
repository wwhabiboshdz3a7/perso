// Film piloté par le défilement : une suite de plans (séquences d'images) que l'on fait
// avancer en faisant défiler la page, avec fondu entre les plans et une légende par plan.
//
//   <section class="film" data-film>
//     <div class="film__sticky">
//       <canvas class="film__canvas"></canvas>
//       <article class="film__shot" data-src="media/petrir" data-frames="48" data-label="Pétrir"> …légende… </article>
//       <article class="film__shot" data-src="media/etirer" data-frames="48" data-label="Étirer"> …légende… </article>
//       <p class="film__hud" aria-hidden="true"></p>
//     </div>
//   </section>
//
// Images attendues : <data-src>/f-001.webp … f-NNN.webp (toutes de même taille).
// Seules quelques images sont décodées à la fois : la mémoire reste basse sur tablette.

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const KEEP = 26; // images décodées gardées en mémoire
const PARALLEL = 6; // téléchargements simultanés
const FADE = 0.14; // part de chaque plan consacrée au fondu vers le suivant

class Film {
  constructor(section) {
    this.section = section;
    this.canvas = section.querySelector('.film__canvas');
    this.context = this.canvas.getContext('2d');
    this.hud = section.querySelector('.film__hud');
    this.shots = [...section.querySelectorAll('.film__shot')].map((element, index) => ({
      element,
      index,
      src: element.dataset.src,
      count: Number(element.dataset.frames) || 1,
      label: element.dataset.label || '',
      blobs: [],
    }));
    this.bitmaps = new Map(); // "plan:image" → ImageBitmap
    this.pending = new Set();
    this.queue = [];
    this.active = 0;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lastKey = '';
    this.started = false;

    // Longueur de défilement : chaque plan occupe `data-length` hauteurs d'écran (défaut 1,7).
    const length = Number(section.dataset.length) || 1.7;
    section.style.setProperty('--film-length', String(this.shots.length * length + 1));

    this.resize = this.resize.bind(this);
    this.update = this.update.bind(this);
    window.addEventListener('resize', this.resize, { passive: true });
    window.addEventListener('scroll', this.update, { passive: true });
    this.resize();

    // Première image de chaque plan tout de suite (affiche et secours), le reste à l'approche.
    for (const shot of this.shots) this.enqueue(shot, 0, true);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect();
            this.loadAll();
          }
        },
        { rootMargin: '150% 0px' }
      );
      observer.observe(section);
    } else {
      this.loadAll();
    }
    this.update();
  }

  loadAll() {
    if (this.started) return;
    this.started = true;
    // On charge une image sur quatre d'abord : le film est parcourable très vite, puis s'affine.
    for (const step of [4, 2, 1]) {
      for (const shot of this.shots) {
        for (let i = 0; i < shot.count; i += step) this.enqueue(shot, i);
      }
    }
  }

  enqueue(shot, frame, urgent = false) {
    if (shot.blobs[frame] !== undefined) return;
    shot.blobs[frame] = null; // réservé
    const job = { shot, frame };
    if (urgent) this.queue.unshift(job);
    else this.queue.push(job);
    this.pump();
  }

  pump() {
    while (this.active < PARALLEL && this.queue.length) {
      const { shot, frame } = this.queue.shift();
      this.active += 1;
      const url = `${shot.src}/f-${String(frame + 1).padStart(3, '0')}.webp`;
      fetch(url)
        .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
        .then((blob) => {
          shot.blobs[frame] = blob;
          if (!this.lastKey) this.update();
          else this.draw();
        })
        .catch(() => {
          shot.blobs[frame] = false; // image manquante : on s'en passera
        })
        .finally(() => {
          this.active -= 1;
          this.pump();
        });
    }
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (!width || !height) return;
    this.canvas.width = Math.round(width * ratio);
    this.canvas.height = Math.round(height * ratio);
    this.lastKey = '';
    this.update();
  }

  // Position dans le film : plan courant, avancement dans le plan.
  position() {
    const rect = this.section.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    const progress = travel > 0 ? clamp(-rect.top / travel) : 0;
    const scaled = progress * this.shots.length;
    const index = Math.min(Math.floor(scaled), this.shots.length - 1);
    return { progress, index, local: clamp(scaled - index) };
  }

  update() {
    const { index, local } = this.position();
    const shot = this.shots[index];
    const play = clamp(local / (1 - FADE));
    this.target = {
      shot,
      frame: this.reduced ? Math.floor(shot.count / 2) : Math.round(play * (shot.count - 1)),
      fade: index < this.shots.length - 1 ? clamp((local - (1 - FADE)) / FADE) : 0,
      next: this.shots[index + 1],
    };
    if (index !== this.shown) {
      this.shown = index;
      this.shots.forEach((item) => item.element.classList.toggle('is-on', item.index === index));
      if (this.hud) {
        this.hud.textContent = `${String(index + 1).padStart(2, '0')} / ${String(this.shots.length).padStart(2, '0')}${shot.label ? ' — ' + shot.label : ''}`;
      }
    }
    this.section.style.setProperty('--film-progress', String(Math.round(this.position().progress * 1000) / 1000));
    this.draw();
  }

  // Image décodée la plus proche de celle demandée (et demande de décodage si besoin).
  bitmap(shot, frame) {
    const key = `${shot.index}:${frame}`;
    const hit = this.bitmaps.get(key);
    if (hit) {
      this.bitmaps.delete(key);
      this.bitmaps.set(key, hit); // remonte en tête : c'est la plus récemment utilisée
      return hit;
    }
    const blob = shot.blobs[frame];
    if (blob && !this.pending.has(key)) {
      this.pending.add(key);
      createImageBitmap(blob)
        .then((bitmap) => {
          this.bitmaps.set(key, bitmap);
          while (this.bitmaps.size > KEEP) {
            const [oldest, stale] = this.bitmaps.entries().next().value;
            this.bitmaps.delete(oldest);
            stale.close();
          }
          this.draw();
        })
        .catch(() => {})
        .finally(() => this.pending.delete(key));
    }
    let best = null;
    let distance = Infinity;
    for (const [name, value] of this.bitmaps) {
      const [s, f] = name.split(':').map(Number);
      if (s !== shot.index) continue;
      const d = Math.abs(f - frame);
      if (d < distance) {
        distance = d;
        best = value;
      }
    }
    return best;
  }

  paint(image, alpha) {
    const { width, height } = this.canvas;
    const scale = Math.max(width / image.width, height / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    this.context.globalAlpha = alpha;
    this.context.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
  }

  draw() {
    if (!this.target) return;
    const { shot, frame, fade, next } = this.target;
    const current = this.bitmap(shot, frame);
    const following = fade > 0 && next ? this.bitmap(next, 0) : null;
    if (!current) return;
    const key = `${shot.index}:${frame}:${fade.toFixed(2)}:${current.width}:${Boolean(following)}`;
    if (key === this.lastKey && this.drawn === current) return;
    this.lastKey = key;
    this.drawn = current;
    this.paint(current, 1);
    if (following) this.paint(following, fade);
    this.context.globalAlpha = 1;
    this.section.classList.add('is-loaded');
  }
}

for (const section of document.querySelectorAll('[data-film]')) new Film(section);
