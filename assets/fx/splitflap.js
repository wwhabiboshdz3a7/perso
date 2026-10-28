import { injectCSS, clamp } from '../core.js';

injectCSS('splitflap', `
.sf { display: grid; gap: var(--g); padding: calc(var(--g) * 3); background: #050506; border-radius: 14px; box-shadow: 0 30px 80px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.05); }
.sf__row { display: grid; grid-auto-flow: column; gap: var(--g); }
.sf__c { position: relative; width: var(--cw); height: var(--ch); perspective: 300px; font-family: var(--f-tall); font-weight: 700; font-size: calc(var(--ch) * .78); color: #eeeae1; }
.sf__row.hl .sf__c { color: var(--fx); }
.sf__h { position: absolute; left: 0; right: 0; height: 50%; overflow: hidden; background: #1b1b1f; backface-visibility: hidden; }
.sf__h span { position: absolute; left: 0; right: 0; height: var(--ch); line-height: var(--ch); text-align: center; }
.sf__h.t { top: 0; border-radius: 4px 4px 0 0; transform-origin: 50% 100%; background: linear-gradient(#222227, #1b1b1f); }
.sf__h.b { bottom: 0; border-radius: 0 0 4px 4px; transform-origin: 50% 0; }
.sf__h.b span { top: calc(var(--ch) * -.5); }
.sf__c::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: #050506; z-index: 5; }
.sf__cap { margin-top: 22px; display: flex; justify-content: space-between; color: var(--mute); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
.sf__cap b { color: var(--fx); font-weight: 400; }
`);

const SET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZÉÈÀÇ0123456789.-:·/→’';

export function createBoard(root, { cols, rows, cw }) {
  const ch = cw * 1.45;
  const board = document.createElement('div');
  board.className = 'sf';
  board.style.setProperty('--cw', cw + 'px'); board.style.setProperty('--ch', ch + 'px'); board.style.setProperty('--g', Math.max(2, cw * 0.06) + 'px');
  const cells = [];
  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div'); row.className = 'sf__row' + (r === 0 ? ' hl' : '');
    for (let c = 0; c < cols; c++) {
      const el = document.createElement('div'); el.className = 'sf__c';
      el.innerHTML = '<div class="sf__h t s"><span> </span></div><div class="sf__h b s"><span> </span></div><div class="sf__h t f"><span> </span></div><div class="sf__h b f"><span> </span></div>';
      const [ts, bs, tf, bf] = el.children;
      gsap.set(bf, { rotationX: 90 });
      cells.push({ el, ts: ts.firstChild, bs: bs.firstChild, tf, bf, tfs: tf.firstChild, bfs: bf.firstChild, cur: ' ', gen: 0 });
      row.appendChild(el);
    }
    board.appendChild(row);
  }
  root.appendChild(board);
  const flipTo = (cell, target, delay, speed) => {
    const g = ++cell.gen;
    const ti = Math.max(0, SET.indexOf(target));
    const one = (next) => new Promise((res) => {
      cell.ts.textContent = next; cell.tfs.textContent = cell.cur; cell.bs.textContent = cell.cur; cell.bfs.textContent = next;
      gsap.set(cell.tf, { rotationX: 0 }); gsap.set(cell.bf, { rotationX: 90 });
      const d = 0.07 / speed;
      gsap.to(cell.tf, { rotationX: -90, duration: d, ease: 'power1.in' });
      gsap.to(cell.bf, { rotationX: 0, duration: d, delay: d, ease: 'power1.out', onComplete: () => { cell.bs.textContent = next; cell.cur = next; res(); } });
    });
    return new Promise((done) => setTimeout(async () => {
      let i = Math.max(0, SET.indexOf(cell.cur)), steps = 0;
      while (cell.cur !== target && g === cell.gen && steps < 9) {
        i = (i + 1) % SET.length;
        const next = steps === 8 ? SET[ti] : SET[i];
        await one(next); steps++;
        if (SET[i] === target) break;
      }
      done();
    }, delay * 1000 / speed));
  };
  return {
    show(lines, speed = 1) {
      const jobs = [];
      for (let r = 0; r < rows; r++) {
        const line = (lines[r] || '').toUpperCase().slice(0, cols).padEnd(cols, ' ');
        [...line].forEach((ch2, c) => {
          const t = SET.includes(ch2) ? ch2 : ' ';
          jobs.push(flipTo(cells[r * cols + c], t, c * 0.03 + r * 0.12 + Math.random() * 0.15, speed));
        });
      }
      return Promise.all(jobs);
    },
    setInstant(lines) {
      for (let r = 0; r < rows; r++) {
        const line = (lines[r] || '').toUpperCase().slice(0, cols).padEnd(cols, ' ');
        [...line].forEach((ch2, c) => { const cl = cells[r * cols + c]; cl.gen++; cl.cur = ch2; cl.ts.textContent = cl.bs.textContent = cl.tfs.textContent = cl.bfs.textContent = ch2; });
      }
    },
    el: board
  };
}

function wrap(text, cols) {
  const out = []; let line = '';
  text.split(/\s+/).forEach((w) => { if ((line + ' ' + w).trim().length > cols) { out.push(line.trim()); line = w; } else line += ' ' + w; });
  if (line.trim()) out.push(line.trim());
  return out;
}

export function mount(stage, o) {
  const W = stage.clientWidth, H = stage.clientHeight;
  const cols = clamp(Math.floor((W * 0.86) / 58), 10, 18);
  const cw = Math.min((W * 0.86) / (cols * 1.08), (H * 0.6) / (5 * 1.45 * 1.12));
  const rows = 5;
  const wrapBox = document.createElement('div');
  stage.appendChild(wrapBox);
  const board = createBoard(wrapBox, { cols, rows, cw });
  wrapBox.insertAdjacentHTML('beforeend', `<div class="sf__cap mono"><span>Départs · <b>Motion Lab</b></span><span class="clk"></span></div>`);
  const clk = wrapBox.querySelector('.clk');
  const tick = () => { const d = new Date(); clk.textContent = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); };
  tick();
  const sets = [
    [...wrap(o.text, cols).slice(0, 2), '', 'QUAI 06 → 22:14', 'À L’HEURE'],
    ['TYPO CINÉTIQUE', '', 'PORTE 25', 'EMBARQUEMENT', '25 EFFETS'],
    ['MOTION LAB', '', ...wrap(o.text, cols).slice(0, 2), 'VOIE LIBRE']
  ];
  let i = 0, alive = true, timer, runId = 0;
  const run = async () => {
    const id = ++runId;
    if (!alive) return;
    tick();
    await board.show(sets[i % sets.length], o.speed);
    i++;
    if (alive && id === runId) timer = setTimeout(run, 2600 / o.speed);
  };
  if (o.reduced) { board.setInstant(sets[0]); return {}; }
  run();
  return { replay: () => { clearTimeout(timer); i = 0; run(); }, destroy: () => { alive = false; clearTimeout(timer); } };
}
