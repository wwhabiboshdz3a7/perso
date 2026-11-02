// Spectrogramme : lecture d'un WAV PCM, transformée de Fourier à court terme (FFT maison),
// affichage temps × fréquence. Un message dessiné dans le spectre devient lisible.
import { $, $$, chargerOctets, lireFichier, url } from '../commun.js';

export function lireWav(b) {
  const v = new DataView(b.buffer, b.byteOffset, b.length);
  const tag = o => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('Ce n\'est pas un fichier WAV (en-tête RIFF/WAVE absent)');
  let o = 12, fmt = null, data = null;
  while (o + 8 <= b.length) {
    const id = tag(o), len = v.getUint32(o + 4, true);
    if (id === 'fmt ') fmt = { format: v.getUint16(o + 8, true), canaux: v.getUint16(o + 10, true), freq: v.getUint32(o + 12, true), bits: v.getUint16(o + 22, true) };
    if (id === 'data') { data = { o: o + 8, len: Math.min(len, b.length - o - 8) }; break; }
    o += 8 + len + (len & 1);
  }
  if (!fmt || !data) throw new Error('WAV incomplet');
  if (fmt.format !== 1 || (fmt.bits !== 16 && fmt.bits !== 8)) throw new Error('Seul le PCM 8 ou 16 bits est pris en charge');
  const oct = fmt.bits / 8, n = Math.floor(data.len / (oct * fmt.canaux));
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let x = 0;
    for (let c = 0; c < fmt.canaux; c++) { const p = data.o + (i * fmt.canaux + c) * oct; x += oct === 2 ? v.getInt16(p, true) / 32768 : (b[p] - 128) / 128; }
    s[i] = x / fmt.canaux;
  }
  return { ...fmt, echantillons: s, duree: n / fmt.freq };
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k], j = i + k + len / 2;
        const vr = re[j] * cr - im[j] * ci, vi = re[j] * ci + im[j] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi; re[j] = ur - vr; im[j] = ui - vi;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
}
// Palette sombre → violet → orange → jaune
function couleur(t) {
  const p = [[11, 13, 19], [72, 36, 140], [190, 60, 120], [245, 140, 50], [255, 236, 140]];
  const x = Math.min(0.9999, Math.max(0, t)) * (p.length - 1), i = Math.floor(x), f = x - i;
  return p[i].map((c, k) => Math.round(c + (p[i + 1][k] - c) * f));
}
export function spectrogramme(wav, { taille = 1024, fmax = 0, plancher = -80, largeurMax = 1400 } = {}) {
  const s = wav.echantillons, nb = Math.max(1, Math.floor((s.length - taille) / (taille / 4)));
  const pas = Math.max(taille / 4, Math.floor((s.length - taille) / Math.min(nb, largeurMax)));
  const cols = Math.max(1, Math.floor((s.length - taille) / pas));
  const bins = taille / 2, bmax = fmax ? Math.min(bins, Math.round(fmax / (wav.freq / 2) * bins)) : bins;
  const hann = Float32Array.from({ length: taille }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (taille - 1)));
  const mag = new Float32Array(cols * bmax); let max = -Infinity;
  const re = new Float32Array(taille), im = new Float32Array(taille);
  for (let c = 0; c < cols; c++) {
    for (let i = 0; i < taille; i++) { re[i] = (s[c * pas + i] || 0) * hann[i]; im[i] = 0; }
    fft(re, im);
    for (let k = 0; k < bmax; k++) { const db = 10 * Math.log10(re[k] * re[k] + im[k] * im[k] + 1e-12); mag[c * bmax + k] = db; if (db > max) max = db; }
  }
  const img = new ImageData(cols, bmax);
  for (let c = 0; c < cols; c++) for (let k = 0; k < bmax; k++) {
    const t = (mag[c * bmax + k] - max - plancher) / -plancher;
    const [r, g, b] = couleur(t), p = ((bmax - 1 - k) * cols + c) * 4;
    img.data[p] = r; img.data[p + 1] = g; img.data[p + 2] = b; img.data[p + 3] = 255;
  }
  return { img, cols, bmax, fmaxReelle: bmax / bins * wav.freq / 2 };
}

export function monter(el) {
  el.innerHTML = `<div class="sp">
    <div class="row sp-tete"><label class="btn small" for="spFile">Ouvrir un WAV…</label><input type="file" id="spFile" accept="audio/wav,.wav" hidden><span class="muted sp-nom">Aucun son chargé.</span></div>
    <div class="row sp-ctrl">
      <label>Taille FFT <select data-c="taille"><option>512</option><option selected>1024</option><option>2048</option></select></label>
      <label>Fréquence max <select data-c="fmax"><option value="0">toutes</option><option value="12000">12 kHz</option><option value="8000">8 kHz</option><option value="4000">4 kHz</option></select></label>
      <label>Contraste <input type="range" min="30" max="110" value="80" data-c="plancher" aria-label="Plage dynamique en décibels"></label>
    </div>
    <div class="sp-vue"><canvas class="sp-canvas" aria-label="Spectrogramme : le temps de gauche à droite, les fréquences de bas en haut"></canvas><div class="sp-axe muted"></div></div>
    <audio class="sp-audio" controls hidden></audio></div>`;
  const cv = $('.sp-canvas', el), opts = { taille: 1024, fmax: 0, plancher: -80 };
  let wav = null;
  const dessiner = () => {
    if (!wav) return;
    const r = spectrogramme(wav, opts);
    cv.width = r.cols; cv.height = r.bmax;
    cv.getContext('2d').putImageData(r.img, 0, 0);
    $('.sp-axe', el).textContent = `0 s → ${wav.duree.toFixed(2).replace('.', ',')} s · 0 Hz (bas) → ${Math.round(r.fmaxReelle)} Hz (haut) · ${wav.freq} Hz, ${wav.canaux} canal(aux), ${wav.bits} bits`;
  };
  $$('[data-c]', el).forEach(x => x.addEventListener('input', () => { opts[x.dataset.c] = x.dataset.c === 'plancher' ? -x.value : +x.value; dessiner(); }));
  const charger = (b, nom, src) => {
    try { wav = lireWav(b); } catch (err) { $('.sp-nom', el).textContent = err.message; return; }
    $('.sp-nom', el).textContent = `${nom} · ${wav.duree.toFixed(1).replace('.', ',')} s`;
    const a = $('.sp-audio', el); a.hidden = false; a.src = src || URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
    dessiner();
  };
  $('#spFile', el).addEventListener('change', async e => { const f = e.target.files[0]; if (f) charger(await lireFichier(f), f.name); });
  return { async charger({ src, nom }) { charger(await chargerOctets(src), nom || String(src).split('/').pop(), url(src)); } };
}
