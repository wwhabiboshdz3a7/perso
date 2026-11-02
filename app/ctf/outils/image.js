// Labo image : miroir, rotation, inversion, contraste, amplification des écarts, plans de bits,
// extraction de texte caché dans les bits de poids faible (LSB) et inspection des pixels.
import { $, $$, url, lireFichier, telecharger, versHex } from '../commun.js';

// Extrait des octets depuis les bits choisis des pixels (parcours ligne par ligne, bit de poids fort d'abord).
export function extraireLSB(data, { canaux = 'R', bit = 0, max = 4096 } = {}) {
  const idx = [...canaux].map(c => 'RGBA'.indexOf(c)).filter(i => i >= 0);
  const out = []; let octet = 0, n = 0;
  for (let p = 0; p < data.length && out.length < max; p += 4) {
    for (const i of idx) {
      octet = (octet << 1) | ((data[p + i] >> bit) & 1);
      if (++n === 8) { out.push(octet); octet = 0; n = 0; if (out.length >= max) break; }
    }
  }
  return Uint8Array.from(out);
}

export function monter(el) {
  el.innerHTML = `<div class="lab">
    <div class="row lab-tete"><label class="btn small" for="labFile">Ouvrir une image…</label><input type="file" id="labFile" accept="image/*" hidden><span class="muted lab-nom">Aucune image chargée.</span></div>
    <div class="lab-grille">
      <div class="lab-vue"><div class="lab-cadre"><canvas class="lab-canvas" aria-label="Image transformée"></canvas></div><p class="lab-pixel muted" aria-live="off">Survole l'image pour lire la valeur des pixels.</p></div>
      <div class="lab-ctrl">
        <fieldset><legend>Géométrie</legend><div class="row">
          <button type="button" class="btn small" data-t="miroirH" aria-pressed="false">Miroir ↔</button><button type="button" class="btn small" data-t="miroirV" aria-pressed="false">Miroir ↕</button><button type="button" class="btn small" data-t="rot">Rotation 90°</button></div>
          <label class="lab-range"><span>Zoom <output data-o="zoom">100 %</output></span><input type="range" min="0.25" max="8" step="0.25" value="1" data-r="zoom"></label></fieldset>
        <fieldset><legend>Couleurs</legend>
          <label class="lab-range"><span>Luminosité <output data-o="lum">0</output></span><input type="range" min="-100" max="100" value="0" data-r="lum"></label>
          <label class="lab-range"><span>Contraste <output data-o="con">0</output></span><input type="range" min="-100" max="100" value="0" data-r="con"></label>
          <label class="lab-range"><span>Amplifier les écarts ×<output data-o="amp">1</output></span><input type="range" min="1" max="64" step="1" value="1" data-r="amp"></label>
          <div class="row"><button type="button" class="btn small" data-t="inv" aria-pressed="false">Négatif</button><button type="button" class="btn small" data-t="nb" aria-pressed="false">Niveaux de gris</button></div></fieldset>
        <fieldset><legend>Plan de bits</legend>
          <div class="row"><label>Canal <select data-s="canal"><option value="">— désactivé —</option><option value="0">Rouge</option><option value="1">Vert</option><option value="2">Bleu</option><option value="3">Alpha</option></select></label>
          <label>Bit <select data-s="bit">${[0, 1, 2, 3, 4, 5, 6, 7].map(b => `<option value="${b}">${b}${b === 0 ? ' (LSB)' : b === 7 ? ' (MSB)' : ''}</option>`).join('')}</select></label></div></fieldset>
        <fieldset><legend>Extraire un texte caché (LSB)</legend>
          <div class="row"><label>Canaux <select data-x="canaux"><option>R</option><option>G</option><option>B</option><option selected>RGB</option><option>RGBA</option></select></label><label>Bit <select data-x="bit">${[0, 1, 2].map(b => `<option value="${b}">${b}</option>`).join('')}</select></label><button type="button" class="btn small primary" data-extraire>Extraire</button></div>
          <pre class="lab-sortie" tabindex="0" aria-label="Texte extrait"></pre></fieldset>
        <div class="row"><button type="button" class="btn small ghost" data-t="reset">Réinitialiser</button><button type="button" class="btn small ghost" data-dl>Télécharger la vue (PNG)</button></div>
      </div>
    </div></div>`;
  const cv = $('.lab-canvas', el), g = cv.getContext('2d', { willReadFrequently: true });
  const etat = { miroirH: false, miroirV: false, rot: 0, inv: false, nb: false, zoom: 1, lum: 0, con: 0, amp: 1, canal: '', bit: 0 };
  let source = null, original = null;

  function dessiner() {
    if (!source) return;
    const w = source.width, h = source.height, r = etat.rot % 2;
    cv.width = r ? h : w; cv.height = r ? w : h;
    g.save();
    g.translate(cv.width / 2, cv.height / 2);
    g.rotate(etat.rot * Math.PI / 2);
    g.scale(etat.miroirH ? -1 : 1, etat.miroirV ? -1 : 1);
    g.drawImage(source, -w / 2, -h / 2);
    g.restore();
    const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
    const c = (259 * (etat.con * 2.55 + 255)) / (255 * (259 - etat.con * 2.55));
    const canal = etat.canal === '' ? -1 : +etat.canal;
    for (let i = 0; i < d.length; i += 4) {
      if (canal >= 0) { const v = ((d[i + canal] >> etat.bit) & 1) * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; continue; }
      for (let k = 0; k < 3; k++) {
        let v = d[i + k];
        if (etat.amp > 1) v = (v * etat.amp) & 255;
        v = c * (v - 128) + 128 + etat.lum * 1.28;
        if (etat.inv) v = 255 - v;
        d[i + k] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
      if (etat.nb) { const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; d[i] = d[i + 1] = d[i + 2] = y; }
    }
    g.putImageData(im, 0, 0);
    cv.style.width = Math.round(cv.width * etat.zoom) + 'px';
    cv.classList.toggle('pixel', etat.zoom >= 2);
  }
  $$('[data-t]', el).forEach(b => b.addEventListener('click', () => {
    const t = b.dataset.t;
    if (t === 'rot') etat.rot = (etat.rot + 1) % 4;
    else if (t === 'reset') { Object.assign(etat, { miroirH: false, miroirV: false, rot: 0, inv: false, nb: false, zoom: 1, lum: 0, con: 0, amp: 1, canal: '', bit: 0 }); $$('[data-r]', el).forEach(x => { x.value = etat[x.dataset.r]; x.dispatchEvent(new Event('input')); }); $$('[data-s]', el).forEach(x => { x.value = etat[x.dataset.s]; }); }
    else etat[t] = !etat[t];
    $$('[data-t]', el).forEach(x => { if (x.hasAttribute('aria-pressed')) x.setAttribute('aria-pressed', !!etat[x.dataset.t]); });
    dessiner();
  }));
  $$('[data-r]', el).forEach(x => x.addEventListener('input', () => {
    etat[x.dataset.r] = +x.value;
    $(`[data-o="${x.dataset.r}"]`, el).textContent = x.dataset.r === 'zoom' ? Math.round(x.value * 100) + ' %' : x.value;
    dessiner();
  }));
  $$('[data-s]', el).forEach(x => x.addEventListener('change', () => { etat[x.dataset.s] = x.value === '' ? '' : x.dataset.s === 'bit' ? +x.value : x.value; dessiner(); }));
  $('[data-extraire]', el).addEventListener('click', () => {
    if (!original) return;
    const b = extraireLSB(original.data, { canaux: $('[data-x="canaux"]', el).value, bit: +$('[data-x="bit"]', el).value, max: 2048 });
    const fin = b.indexOf(0);
    const utile = fin >= 0 ? b.slice(0, fin) : b;
    const imprimables = [...utile].filter(x => (x >= 32 && x < 127) || x === 10).length / Math.max(1, utile.length);
    $('.lab-sortie', el).textContent = imprimables > 0.9 && utile.length
      ? new TextDecoder().decode(utile) + (fin >= 0 ? `\n\n[arrêt au premier octet nul, position ${fin}]` : '')
      : `Pas de texte lisible avec ces réglages (${Math.round(imprimables * 100)} % de caractères imprimables).\nDébut en hexadécimal : ${versHex(b.slice(0, 48), ' ')}`;
  });
  $('[data-dl]', el).addEventListener('click', () => cv.toBlob(b => b && telecharger('labo-image.png', b)));
  cv.addEventListener('mousemove', e => {
    if (!source) return;
    const r = cv.getBoundingClientRect(), x = Math.floor((e.clientX - r.left) * cv.width / r.width), y = Math.floor((e.clientY - r.top) * cv.height / r.height);
    const p = g.getImageData(x, y, 1, 1).data;
    $('.lab-pixel', el).textContent = `x ${x}, y ${y} · R ${p[0]} G ${p[1]} B ${p[2]} · #${versHex(p.slice(0, 3))}`;
  });
  async function chargerImage(src) {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    await img.decode();
    source = img;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const cg = c.getContext('2d'); cg.drawImage(img, 0, 0);
    original = cg.getImageData(0, 0, img.width, img.height);
    dessiner();
  }
  $('#labFile', el).addEventListener('change', async e => {
    const f = e.target.files[0]; if (!f) return;
    const u = URL.createObjectURL(new Blob([await lireFichier(f)], { type: f.type }));
    await chargerImage(u);
    $('.lab-nom', el).textContent = `${f.name} · ${source.width} × ${source.height} px`;
  });
  return {
    async charger({ src, nom }) {
      try { await chargerImage(url(src)); $('.lab-nom', el).textContent = `${nom || String(src).split('/').pop()} · ${source.width} × ${source.height} px`; }
      catch { $('.lab-nom', el).textContent = 'Impossible de charger cette image.'; }
    },
    etat, extraire: o => original && extraireLSB(original.data, o)
  };
}
