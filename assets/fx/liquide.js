import { injectCSS, loop, virtualPointer, hasWebGL, hexToRgb, resizeCanvas, FONTS, bigSize } from '../core.js';

injectCSS('liquide', `
.lq__fb { margin: 0; padding: 0 4vw; text-align: center; position: relative; font-family: var(--f-display); font-weight: 900; text-transform: uppercase; line-height: .85;
  letter-spacing: -.03em; color: var(--fx); font-variation-settings: "wdth" 140; }
.lq__fb::before, .lq__fb::after { content: attr(data-t); position: absolute; inset: 0; padding: inherit; }
.lq__fb::before { color: #ff2d55; transform: translate(-.03em, 0); mix-blend-mode: screen; animation: lqA 2.4s steps(2) infinite; }
.lq__fb::after { color: #2d9bff; transform: translate(.03em, 0); mix-blend-mode: screen; animation: lqB 3.1s steps(2) infinite; }
@keyframes lqA { 0%,88%,100% { clip-path: inset(0 0 0 0); } 90% { clip-path: inset(20% 0 50% 0); transform: translate(-.08em,0); } 94% { clip-path: inset(60% 0 10% 0); } }
@keyframes lqB { 0%,85%,100% { clip-path: inset(0 0 0 0); } 88% { clip-path: inset(40% 0 30% 0); transform: translate(.1em,0); } }
.lq__cap { position: absolute; left: 50%; bottom: 14vh; transform: translateX(-50%); color: var(--mute); font-size: 13px; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
`);

const VS = `attribute vec2 p; varying vec2 v; void main(){ v = p*0.5+0.5; gl_Position = vec4(p,0.,1.); }`;
const FS = `precision highp float;
varying vec2 v; uniform sampler2D T; uniform vec2 R; uniform vec2 M; uniform float U, V, G; uniform vec3 C, B;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float m(vec2 q){ return texture2D(T, vec2(q.x, 1.0-q.y)).r; }
void main(){
  vec2 uv = v; float asp = R.x/R.y;
  vec2 d = uv - M; d.x *= asp; float dist = length(d);
  float rip = sin(dist*38.0 - U*7.0) * exp(-dist*5.0) * (0.006 + V*0.05);
  uv += (d/(dist+1e-4)) * rip * vec2(1.0/asp, 1.0);
  uv.x += sin(uv.y*9.0 + U*1.3) * (0.003 + V*0.02);
  uv.y += sin(uv.x*6.0 - U*0.9) * 0.004;
  float sl = floor(uv.y*28.0);
  float n = h(vec2(sl, floor(U*14.0)));
  uv.x += step(1.0 - G*0.4, n) * (h(vec2(sl, floor(U*30.0))) - 0.5) * 0.16 * G;
  float sh = 0.003 + V*0.035 + G*0.025;
  float a = m(uv), r = m(uv + vec2(sh, 0.0)), b = m(uv - vec2(sh, sh*0.3));
  vec3 col = mix(B, C, a);
  col += vec3(1.0, 0.18, 0.32) * max(r - a, 0.0) + vec3(0.18, 0.55, 1.0) * max(b - a, 0.0);
  col *= 0.9 + 0.1*sin(v.y*R.y*1.4);
  col += (h(v*R + U) - 0.5) * 0.06;
  gl_FragColor = vec4(col, 1.0);
}`;

// Moteur WebGL réutilisable : un texte rendu en texture, déformé en shader.
export function createLiquid(cv, { bg = '#0a0a0b' } = {}) {
  const gl = cv.getContext('webgl', { antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['T', 'R', 'M', 'U', 'V', 'G', 'C', 'B'].forEach((k) => (U[k] = gl.getUniformLocation(pr, k)));
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const off = document.createElement('canvas');
  const bgc = hexToRgb(bg).map((x) => x / 255);
  let txt = '', lines = null;
  const upload = () => {
    const w = cv.width, h = cv.height;
    off.width = w; off.height = h;
    const g = off.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const rows = lines || [txt];
    let s = Math.min(h * 0.72 / (rows.length * 0.86), w * 0.3);
    g.font = `900 ${s}px ${FONTS.display}`;
    const wid = Math.max(...rows.map((r) => g.measureText(r).width));
    if (wid > w * 0.9) { s *= (w * 0.9) / wid; g.font = `900 ${s}px ${FONTS.display}`; }
    rows.forEach((r, i) => g.fillText(r, w / 2, h / 2 + (i - (rows.length - 1) / 2) * s * 0.88));
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
  };
  return {
    setText(t, l = null) { txt = t; lines = l; resizeCanvas(cv, Math.min(1.5, devicePixelRatio || 1)); upload(); },
    resize() { if (resizeCanvas(cv, Math.min(1.5, devicePixelRatio || 1))) upload(); },
    render(t, { mx = 0.5, my = 0.5, vel = 0, glitch = 0, color = '#c6ff3d' }) {
      gl.viewport(0, 0, cv.width, cv.height);
      const c = hexToRgb(color).map((x) => x / 255);
      gl.uniform1i(U.T, 0); gl.uniform2f(U.R, cv.width, cv.height); gl.uniform2f(U.M, mx, my);
      gl.uniform1f(U.U, t); gl.uniform1f(U.V, vel); gl.uniform1f(U.G, glitch);
      gl.uniform3f(U.C, c[0], c[1], c[2]); gl.uniform3f(U.B, bgc[0], bgc[1], bgc[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    lose() { const e = gl.getExtension('WEBGL_lose_context'); e && e.loseContext(); }
  };
}

export function mount(stage, o) {
  const fallback = () => {
    stage.innerHTML = `<h2 class="lq__fb" data-t="${o.text}">${o.text}</h2>`;
    stage.querySelector('.lq__fb').style.fontSize = bigSize(o.text, stage.clientWidth, stage.clientHeight, { ratio: 0.7 }) + 'px';
    return {};
  };
  if (!hasWebGL() || o.reduced) return fallback();
  stage.innerHTML = `<canvas class="fill" role="img" aria-label="${o.text}"></canvas><p class="lq__cap mono">fragment shader · ondulation + séparation RGB + tranches</p>`;
  const cv = stage.querySelector('canvas');
  const lq = createLiquid(cv);
  if (!lq) return fallback();
  lq.setText(o.text.toUpperCase());
  let vel = 0, glitch = 0, nextBurst = 1, lx = 0, ly = 0, mx = 0.5, my = 0.5;
  const step = (t, dt) => {
    const p = virtualPointer(t, stage.getBoundingClientRect());
    const sp = Math.hypot(p.x - lx, p.y - ly) / Math.max(1, dt) / 3000;
    lx = p.x; ly = p.y;
    vel += (Math.min(1, sp + (o.extVel || 0)) - vel) * 0.08;
    mx += (p.x / stage.clientWidth - mx) * 0.1; my += (p.y / stage.clientHeight - my) * 0.1;
    if (t > nextBurst) { glitch = 1; nextBurst = t + (1.2 + Math.random() * 2.2) / o.speed; }
    glitch *= Math.pow(0.02, dt * o.speed);
    lq.resize();
    lq.render(t * o.speed, { mx, my: 1 - my, vel, glitch, color: o.color });
  };
  const lp = loop(stage, step);
  return { destroy: () => { lp.stop(); lq.lose(); } };
}
