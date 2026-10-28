(() => {
  const M = window.MOTION;

  const VERT = `#version 300 es
  in vec2 a; out vec2 uv; void main(){ uv = a * .5 + .5; gl_Position = vec4(a, 0., 1.); }`;
  const SIM = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D uState; uniform vec2 uTexel; uniform float uF; uniform float uK; uniform float uDu; uniform float uDv;
  uniform vec2 uPointer; uniform float uPointerR; uniform float uSeed;
  void main(){
    vec2 c = texture(uState, uv).rg;
    vec2 n = texture(uState, uv + vec2(0., uTexel.y)).rg, s = texture(uState, uv - vec2(0., uTexel.y)).rg;
    vec2 e = texture(uState, uv + vec2(uTexel.x, 0.)).rg, w = texture(uState, uv - vec2(uTexel.x, 0.)).rg;
    vec2 ne = texture(uState, uv + uTexel).rg, sw = texture(uState, uv - uTexel).rg;
    vec2 nw = texture(uState, uv + vec2(-uTexel.x, uTexel.y)).rg, se = texture(uState, uv + vec2(uTexel.x, -uTexel.y)).rg;
    vec2 lap = (n + s + e + w) * .2 + (ne + nw + se + sw) * .05 - c;
    float u = c.r, v = c.g; float uvv = u * v * v;
    float du = uDu * lap.r - uvv + uF * (1. - u);
    float dv = uDv * lap.g + uvv - (uF + uK) * v;
    u = clamp(u + du, 0., 1.); v = clamp(v + dv, 0., 1.);
    vec2 d = (uv - uPointer) / uTexel; float dist = length(d * vec2(1., 1.));
    if (dist < uPointerR) v = max(v, .5 * (1. - dist / uPointerR) + .25);
    if (uSeed > 0.) {
      vec2 cell = floor(uv / uTexel / 30.);
      float r = fract(sin(dot(cell, vec2(12.9898, 78.233)) + uSeed) * 43758.5453);
      vec2 jit = vec2(fract(r * 17.3), fract(r * 29.7)) - .5;
      vec2 center = (cell + .5 + jit * .6) * 30. * uTexel;
      float dc = length((uv - center) / uTexel);
      if (r > .86 && dc < 4.5 + r * 3.) v = max(v, .55);
    }
    o = vec4(u, v, 0., 1.);
  }`;
  const DRAW = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D uState; uniform vec2 uTexel; uniform vec3 uBg; uniform vec3 uA; uniform vec3 uB; uniform float uTime;
  void main(){
    float v = texture(uState, uv).g;
    float vx = texture(uState, uv + vec2(uTexel.x, 0.)).g - texture(uState, uv - vec2(uTexel.x, 0.)).g;
    float vy = texture(uState, uv + vec2(0., uTexel.y)).g - texture(uState, uv - vec2(0., uTexel.y)).g;
    float t = smoothstep(.08, .42, v);
    vec3 col = mix(uBg, uA, t);
    col = mix(col, uB, smoothstep(.3, .55, v) * .85);
    float light = clamp(1. + (vx * 1.2 - vy * 1.6) * 9., .4, 1.8);
    col *= mix(1., light, .55);
    col += uA * pow(max(0., -vx * 7. - vy * 4.), 2.) * .35;
    o = vec4(col, 1.);
  }`;

  function compile(gl, type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { throw new Error(gl.getShaderInfoLog(s)); } return s; }
  function program(gl, vs, fs) { const p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; }
  const hex = (h) => M.hexToRgb(h).map(v => v / 255);

  /* ---------- Simulation Gray-Scott sur GPU (ping-pong) ---------- */
  function createSim(canvas, opts) {
    const o = Object.assign({ f: 0.0545, k: 0.062, du: 0.21, dv: 0.105, steps: 10, scale: 0.5, bg: '#0b1a1c', a: '#b8f2d6', b: '#ff9f7a', pointer: true }, opts);
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    const ext = gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float');
    if (!ext) return null;
    let simP, drawP;
    try { simP = program(gl, VERT, SIM); drawP = program(gl, VERT, DRAW); } catch (e) { return null; }
    const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    let W = 0, H = 0, tex = [], fbo = [], cur = 0;
    const U = (p, n) => gl.getUniformLocation(p, n);
    const makeTex = (w, h, data) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, w, h, 0, gl.RG, gl.HALF_FLOAT, data); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); return t; };
    let seedPending = 1;
    const resize = (cw, ch) => {
      W = Math.max(8, Math.round(cw * o.scale)); H = Math.max(8, Math.round(ch * o.scale));
      tex.forEach(t => gl.deleteTexture(t)); fbo.forEach(f => gl.deleteFramebuffer(f)); tex = []; fbo = [];
      for (let i = 0; i < 2; i++) { tex.push(makeTex(W, H, null)); const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex[i], 0); fbo.push(f); }
      // État initial : u = 1 partout, v = 0, graines ajoutées au premier pas.
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[0]); gl.clearColor(1, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1]); gl.clear(gl.COLOR_BUFFER_BIT);
      seedPending = Math.random() * 10 + 1;
      warm = 220;
    };
    let warm = 0;
    M.fit(canvas, resize, 1);
    let pointer = [-10, -10], pointerR = 0;
    const step = (frames) => {
      if (!W) return;
      if (warm) { frames += warm; warm = 0; }
      gl.bindVertexArray(vao);
      gl.useProgram(simP); gl.viewport(0, 0, W, H);
      gl.uniform2f(U(simP, 'uTexel'), 1 / W, 1 / H); gl.uniform1f(U(simP, 'uF'), o.f); gl.uniform1f(U(simP, 'uK'), o.k); gl.uniform1f(U(simP, 'uDu'), o.du); gl.uniform1f(U(simP, 'uDv'), o.dv);
      for (let i = 0; i < frames; i++) {
        gl.uniform2f(U(simP, 'uPointer'), pointer[0], pointer[1]); gl.uniform1f(U(simP, 'uPointerR'), i === 0 ? pointerR : 0);
        gl.uniform1f(U(simP, 'uSeed'), seedPending); seedPending = 0;
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur]); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]); gl.uniform1i(U(simP, 'uState'), 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); cur = 1 - cur;
      }
      pointerR = 0;
    };
    const draw = () => {
      if (!W) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(drawP); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]); gl.uniform1i(U(drawP, 'uState'), 0);
      gl.uniform2f(U(drawP, 'uTexel'), 1 / W, 1 / H); gl.uniform3fv(U(drawP, 'uBg'), hex(o.bg)); gl.uniform3fv(U(drawP, 'uA'), hex(o.a)); gl.uniform3fv(U(drawP, 'uB'), hex(o.b));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const touch = (clientX, clientY, r = 6) => { const rect = canvas.getBoundingClientRect(); pointer = [(clientX - rect.left) / rect.width, 1 - (clientY - rect.top) / rect.height]; pointerR = r; };
    return { step, draw, touch, set(k, v) { o[k] = v; }, reseed() { seedPending = Math.random() * 10 + 1; } };
  }

  /* ---------- Hero ---------- */
  const wrap = document.getElementById('hero-canvas'); const heroCanvas = wrap.querySelector('canvas');
  const hero = createSim(heroCanvas, { scale: M.mobile ? 0.45 : 0.5, steps: M.mobile ? 8 : 12 });
  if (!hero) M.fallback(wrap.closest('.hero'));
  else {
    addEventListener('pointermove', e => { if (e.clientY < innerHeight && scrollY < innerHeight) hero.touch(e.clientX, e.clientY, 7); }, { passive: true });
    if (M.reduced) { for (let i = 0; i < 400; i++) hero.step(10); hero.draw(); }
    else M.loop(heroCanvas, () => { hero.step(M.mobile ? 8 : 12); hero.draw(); });
  }

  /* ---------- Panneau interactif ---------- */
  const fc = document.getElementById('formula-canvas'); const panel = document.getElementById('params');
  if (fc && panel) {
    const sim = createSim(fc, { scale: 0.5, bg: '#10262a' });
    if (sim) {
      fc.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') sim.touch(e.clientX, e.clientY, 8); });
      fc.addEventListener('pointerdown', e => sim.touch(e.clientX, e.clientY, 10));
      if (M.reduced) { for (let i = 0; i < 300; i++) sim.step(10); sim.draw(); } else M.loop(fc, () => { sim.step(10); sim.draw(); });
    }
    const state = M.params(panel, [
      { key: 'f', label: 'f — apport (feed)', min: 0.01, max: 0.1, step: 0.0005, value: 0.0545 },
      { key: 'k', label: 'k — retrait (kill)', min: 0.045, max: 0.07, step: 0.0005, value: 0.062 },
    ], s => { [sim, hero].forEach(x => { if (x) { x.set('f', s.f); x.set('k', s.k); } }); if (M.reduced && sim) { for (let i = 0; i < 300; i++) sim.step(10); sim.draw(); } });
    const actions = document.createElement('div'); actions.className = 'params__actions';
    [['Corail', 0.0545, 0.062], ['Mitose', 0.0367, 0.0649], ['Vers', 0.078, 0.061], ['Taches', 0.03, 0.062], ['Labyrinthe', 0.029, 0.057]].forEach(([n, f, k], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (i ? '' : ' is-active'); b.textContent = n;
      b.addEventListener('click', () => { actions.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active')); b.classList.add('is-active'); state.set({ f, k }); sim && sim.reseed(); });
      actions.appendChild(b);
    });
    panel.appendChild(actions);
  }

  /* ---------- Cartes produits : petites simulations ---------- */
  document.querySelectorAll('[data-sim]').forEach(card => {
    const [f, k, a, bg] = card.dataset.sim.split(','); const cv = card.querySelector('canvas');
    M.lazyTile(card, () => {
      const sim = createSim(cv, { f: +f, k: +k, a, b: '#ffffff', bg, scale: 0.4 });
      if (!sim) { cv.style.background = `radial-gradient(circle at 30% 30%, ${a}33, ${bg})`; return; }
      if (M.reduced) { for (let i = 0; i < 300; i++) sim.step(10); sim.draw(); } else M.loop(cv, () => { sim.step(6); sim.draw(); });
    });
  });
})();
