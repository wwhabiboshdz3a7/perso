(() => {
  const M = window.MOTION;
  const VERT = `attribute vec2 a; varying vec2 uv; void main(){ uv = a; gl_Position = vec4(a, 0., 1.); }`;
  const FRAG = `precision highp float; varying vec2 uv;
  uniform vec2 uRes; uniform vec2 uC; uniform float uZoom; uniform vec2 uCenter; uniform float uIter; uniform float uTime; uniform vec3 uPalA; uniform vec3 uPalB; uniform vec3 uPalC; uniform vec3 uPalD;
  vec3 pal(float t){ return uPalA + uPalB * cos(6.28318 * (uPalC * t + uPalD)); }
  void main(){
    vec2 p = uv * vec2(uRes.x / uRes.y, 1.) / uZoom + uCenter;
    vec2 z = p; float n = 0.; float escaped = 0.;
    const int MAXI = 400;
    for (int i = 0; i < MAXI; i++) {
      if (float(i) >= uIter) break;
      z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + uC;
      if (dot(z, z) > 256.) { escaped = 1.; break; }
      n += 1.;
    }
    float sn = n - log2(log2(dot(z, z))) + 4.; // itérations lissées
    float t = escaped > .5 ? sqrt(max(sn, 0.) / uIter) : 0.;
    float tt = clamp(t * 1.15 - .08 + sin(uTime * .1) * .03, 0., 1.); vec3 col = escaped > .5 ? pal(tt) * smoothstep(.02, .3, tt) : vec3(.85, .95, .6);
    col = pow(col, vec3(1.15));
    gl_FragColor = vec4(col, 1.);
  }`;
  function makeGL(canvas) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false }) || canvas.getContext('experimental-webgl'); if (!gl) return null;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    let prog; try { prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog); if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog)); } catch (e) { return null; }
    gl.useProgram(prog);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = {}; ['uRes', 'uC', 'uZoom', 'uCenter', 'uIter', 'uTime', 'uPalA', 'uPalB', 'uPalC', 'uPalD'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
    const PAL = [[.5, .5, .5], [.5, .5, .5], [1, 1, 1], [.0, .1, .2]]; // palette de base (bleu/jaune), modulée plus bas
    return {
      render(o) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(U.uRes, canvas.width, canvas.height); gl.uniform2f(U.uC, o.cx, o.cy); gl.uniform1f(U.uZoom, o.zoom); gl.uniform2f(U.uCenter, o.ox, o.oy);
        gl.uniform1f(U.uIter, o.iter); gl.uniform1f(U.uTime, o.time);
        gl.uniform3fv(U.uPalA, o.pal[0]); gl.uniform3fv(U.uPalB, o.pal[1]); gl.uniform3fv(U.uPalC, o.pal[2]); gl.uniform3fv(U.uPalD, o.pal[3]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      },
    };
  }
  // Palette violet → lime → blanc (formule d'Inigo Quilez : a + b·cos(2π(c·t + d)))
  const PALETTE = [[.41, .49, .56], [.38, .51, .44], [.62, .83, 1.74], [.38, .17, .88]];
  const S = { theta: 2.45, iter: M.mobile ? 120 : 220, zoomBase: 1.0, speed: 1 };

  /* ---------- Hero ---------- */
  const wrap = document.getElementById('hero-canvas'); const canvas = wrap.querySelector('canvas');
  const gl = makeGL(canvas);
  if (!gl) M.fallback(wrap.closest('.hero'));
  else {
    M.fit(canvas, null, M.mobile ? 0.8 : Math.min(M.dpr, 1.25));
    const ptr = M.pointer(); let t = 0; let theta = 0;
    const frame = (time, dt) => {
      ptr.update(); t += dt * S.speed; theta += dt * 0.06 * S.speed;
      const th = S.theta + theta;
      // Zoom qui respire : on plonge vers un point de la frontière, puis on ressort.
      const zoom = S.zoomBase * (0.95 + 0.9 * (0.5 + 0.5 * Math.sin(t * 0.1)));
      gl.render({ cx: 0.7885 * Math.cos(th), cy: 0.7885 * Math.sin(th), zoom, ox: 0.18 + ptr.x * 0.12, oy: ptr.y * 0.08, iter: S.iter, time: t, pal: PALETTE });
    };
    if (M.reduced) { t = 10; frame(0, 0); } else M.loop(canvas, frame);
  }

  /* ---------- Panneau ---------- */
  const fc = document.getElementById('formula-canvas'); const panel = document.getElementById('params');
  if (fc && panel) {
    const g2 = makeGL(fc);
    const P = { theta: 2.45, iter: 150, zoom: 1.2 };
    const draw = () => { if (!g2) return; g2.render({ cx: 0.7885 * Math.cos(P.theta), cy: 0.7885 * Math.sin(P.theta), zoom: P.zoom, ox: 0, oy: 0, iter: P.iter, time: 10, pal: PALETTE }); };
    if (g2) M.fit(fc, draw, 1);
    M.params(panel, [
      { key: 'theta', label: 'θ — angle de c sur le cercle', min: 0, max: 6.283, step: 0.01, value: 2.45 },
      { key: 'iter', label: 'Itérations maximum', min: 20, max: 400, step: 5, value: 150 },
      { key: 'zoom', label: 'Zoom', min: 0.6, max: 40, step: 0.1, value: 1.2 },
    ], s => { Object.assign(P, s); draw(); S.theta = s.theta; S.iter = Math.min(400, s.iter); });
    M.lazyTile(fc, draw);
  }

  /* ---------- Vignettes ---------- */
  document.querySelectorAll('[data-julia]').forEach(tile => {
    const [theta, iter] = tile.dataset.julia.split(',').map(Number); const cv = tile.querySelector('canvas');
    M.lazyTile(tile, (w, h) => { cv.width = Math.round(w); cv.height = Math.round(h); const g = makeGL(cv); if (g) g.render({ cx: 0.7885 * Math.cos(theta), cy: 0.7885 * Math.sin(theta), zoom: 1.3, ox: 0, oy: 0, iter, time: theta * 7, pal: PALETTE }); else cv.style.background = 'linear-gradient(135deg,#7c5cff,#05060a)'; });
  });
})();
