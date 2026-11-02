// Terminal Linux simulé : système de fichiers virtuel en mémoire et une quinzaine de commandes
// (ls cd pwd cat head tail grep find file strings base64 wc sort uniq cut xxd echo…), avec tubes « | ».
import { $, esc, chargerOctets, latin1 } from '../commun.js';
import { detecter, chaines } from './hex.js';

const T = s => new TextEncoder().encode(s), U = b => new TextDecoder().decode(b);

export function creerFS(fs) {
  const n = new Map([['/', { d: true }]]);
  const ajouterDossier = p => { const parts = p.split('/').filter(Boolean); let c = ''; for (const x of parts) { c += '/' + x; if (!n.has(c)) n.set(c, { d: true }); } };
  for (const [chemin, v] of Object.entries(fs)) {
    if (chemin.endsWith('/')) { ajouterDossier(chemin); continue; }
    ajouterDossier(chemin.split('/').slice(0, -1).join('/'));
    n.set(chemin, { d: false, data: v instanceof Uint8Array ? v : typeof v === 'string' ? T(v) : v && v.b64 ? Uint8Array.from(atob(v.b64), c => c.charCodeAt(0)) : T(String(v && v.texte || '')), date: v && v.date });
  }
  return n;
}

export function creerShell({ fs, utilisateur = 'analyste', hote = 'lumio', cwd }) {
  const N = fs, maison = `/home/${utilisateur}`;
  let dir = cwd || (N.has(maison) ? maison : '/'), precedent = dir;
  const historique = [];
  const norm = p => {
    if (!p || p === '~') p = maison; else if (p.startsWith('~/')) p = maison + p.slice(1);
    const abs = p.startsWith('/') ? p : dir + '/' + p;
    const out = [];
    for (const x of abs.split('/')) { if (!x || x === '.') continue; if (x === '..') out.pop(); else out.push(x); }
    return '/' + out.join('/');
  };
  const enfants = d => [...N.keys()].filter(k => k !== d && k.startsWith(d === '/' ? '/' : d + '/') && !k.slice(d === '/' ? 1 : d.length + 1).includes('/')).sort();
  const base = p => p.split('/').pop() || '/';
  const globRe = m => new RegExp('^' + m.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  const expandre = a => {
    if (!/[*?]/.test(a)) return [a];
    const d = a.includes('/') ? norm(a.split('/').slice(0, -1).join('/') || '/') : dir;
    const re = globRe(base(a));
    const l = enfants(d).filter(k => re.test(base(k)) && !base(k).startsWith('.')).map(k => a.includes('/') ? k : base(k));
    return l.length ? l : [a];
  };
  const lire = p => { const c = norm(p), e = N.get(c); if (!e) throw new Error(`${p} : aucun fichier ou dossier de ce nom`); if (e.d) throw new Error(`${p} : est un dossier`); return e.data; };
  const decouper = ligne => {
    const toks = []; let cur = '', q = null, a = false;
    for (const ch of ligne) {
      if (q) { if (ch === q) q = null; else cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; a = true; continue; }
      if (/\s/.test(ch)) { if (cur || a) toks.push(cur); cur = ''; a = false; continue; }
      cur += ch;
    }
    if (cur || a) toks.push(cur);
    return toks;
  };
  const options = (args, avecValeur = []) => {
    const o = {}, reste = [];
    let fin = false;
    for (let i = 0; i < args.length; i++) {
      const x = args[i];
      if (x === '--' && !fin) { fin = true; continue; }
      if (!fin && /^-\d+$/.test(x)) { o.n = +x.slice(1); continue; }
      if (!fin && x.startsWith('-') && x.length > 1) {
        if (avecValeur.includes(x.slice(1))) { o[x.slice(1)] = args[++i]; continue; }
        for (const c of x.slice(1)) if (avecValeur.includes(c)) { o[c] = args[++i]; } else o[c] = true;
      } else reste.push(x);
    }
    return { o, reste };
  };
  const typeFichier = b => {
    const s = detecter(b.subarray(0, 64)).find(x => x.offset === 0 && !x.fin);
    if (s) {
      if (s.ext === 'png') { const v = new DataView(b.buffer, b.byteOffset); return `PNG image data, ${v.getUint32(16)} x ${v.getUint32(20)}`; }
      return ({ jpg: 'JPEG image data', zip: 'Zip archive data', pdf: 'PDF document', gif: 'GIF image data', wav: 'RIFF (little-endian) data, WAVE audio', elf: 'ELF 64-bit LSB executable, x86-64', gz: 'gzip compressed data' })[s.ext] || 'data';
    }
    if (!b.length) return 'empty';
    const imp = [...b.subarray(0, 2048)].filter(x => x === 9 || x === 10 || x === 13 || (x >= 32 && x < 127)).length / Math.min(b.length, 2048);
    if (imp > 0.97) { const t = latin1(b.subarray(0, 400)); return /^#!.*\b(ba)?sh\b/.test(t) ? 'Bourne-Again shell script, ASCII text executable' : /^[A-Za-z0-9+/=\s]+$/.test(t) && t.length > 16 ? 'ASCII text (ressemble à du Base64)' : 'ASCII text'; }
    try { new TextDecoder('utf-8', { fatal: true }).decode(b); return 'UTF-8 Unicode text'; } catch { return 'data'; }
  };
  const lignes = b => { const t = U(b); return t.endsWith('\n') ? t.slice(0, -1).split('\n') : t ? t.split('\n') : []; };
  const sortie = l => T(l.length ? l.join('\n') + '\n' : '');

  const CMD = {
    help: () => T(`Commandes disponibles :
  ls [-a] [-l] [chemin]      lister (les fichiers cachés commencent par un point : ls -a)
  cd [chemin]  pwd           se déplacer / afficher le dossier courant (cd .. remonte, cd ~ revient au départ)
  cat fichier                afficher un fichier
  head|tail [-n N] fichier   début / fin d'un fichier
  grep [-i -v -n -r -c] motif [fichiers]   chercher des lignes (motif = expression régulière)
  find [chemin] [-name motif] [-type f|d]  chercher des fichiers (ex. find / -name "*.bak")
  file fichier               deviner le vrai type d'après les premiers octets
  strings [-n N] fichier     extraire les suites de caractères lisibles d'un binaire
  base64 [-d] [fichier]      encoder / décoder (-d) en Base64
  wc [-l] · sort [-n -r] · uniq [-c] · cut -d X -f N · xxd fichier · echo · whoami · history · clear
Les tubes fonctionnent : cat acces.log | cut -d " " -f 1 | sort | uniq -c | sort -n\n`),
    pwd: () => T(dir + '\n'),
    whoami: () => T(utilisateur + '\n'),
    hostname: () => T(hote + '\n'),
    id: () => T(`uid=1000(${utilisateur}) gid=1000(${utilisateur}) groupes=1000(${utilisateur})\n`),
    echo: a => T(a.join(' ') + '\n'),
    history: () => sortie(historique.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`)),
    cd: a => { const p = a[0] === '-' ? precedent : norm(a[0]); const e = N.get(p); if (!e) throw new Error(`cd: ${a[0]} : aucun fichier ou dossier de ce nom`); if (!e.d) throw new Error(`cd: ${a[0]} : n'est pas un dossier`); precedent = dir; dir = p; return T(''); },
    ls: a => {
      const { o, reste } = options(a);
      const cibles = reste.length ? reste.flatMap(expandre) : ['.'];
      const out = [];
      for (const c of cibles) {
        const p = norm(c), e = N.get(p);
        if (!e) { out.push(`ls: impossible d'accéder à '${c}' : aucun fichier ou dossier de ce nom`); continue; }
        const l = e.d ? enfants(p).filter(k => o.a || !base(k).startsWith('.')) : [p];
        if (cibles.length > 1 && e.d) out.push(c + ':');
        const noms = (e.d && o.a ? ['.', '..'] : []).concat(l.map(base));
        if (o.l) {
          if (e.d) out.push(`total ${l.length * 4}`);
          noms.forEach(nm => { const k = nm === '.' ? p : nm === '..' ? norm(p + '/..') : (e.d ? (p === '/' ? '' : p) + '/' + nm : p); const x = N.get(k) || { d: true }; out.push(`${x.d ? 'drwxr-xr-x' : '-rw-r--r--'} 1 ${utilisateur} ${utilisateur} ${String(x.d ? 4096 : x.data.length).padStart(7)} ${x.date || 'mars 14 09:12'} ${nm}${x.d && nm !== '.' && nm !== '..' ? '/' : ''}`); });
        } else out.push(noms.map(nm => { const k = e.d ? (p === '/' ? '' : p) + '/' + nm : p; return N.get(k)?.d && nm !== '.' && nm !== '..' ? nm + '/' : nm; }).join('  '));
      }
      return sortie(out.filter(x => x !== ''));
    },
    cat: (a, entree) => a.length ? (() => { const parts = a.flatMap(expandre).map(f => lire(f)); const t = new Uint8Array(parts.reduce((s, x) => s + x.length, 0)); let o = 0; parts.forEach(x => { t.set(x, o); o += x.length; }); return t; })() : entree,
    head: (a, entree, fin = false) => { const { o, reste } = options(a, ['n']); const n = +(o.n ?? 10); const l = lignes(reste.length ? lire(reste[0]) : entree); return sortie(fin ? l.slice(Math.max(0, l.length - n)) : l.slice(0, n)); },
    tail: (a, entree) => CMD.head(a, entree, true),
    wc: (a, entree) => { const { o, reste } = options(a); const b = reste.length ? lire(reste[0]) : entree; const t = U(b); const l = (t.match(/\n/g) || []).length, w = t.split(/\s+/).filter(Boolean).length; return T((o.l ? `${l}` : o.w ? `${w}` : o.c ? `${b.length}` : `${l} ${w} ${b.length}`) + (reste[0] ? ' ' + reste[0] : '') + '\n'); },
    grep: (a, entree) => {
      const { o, reste } = options(a, ['e']);
      const motif = o.e ?? reste.shift();
      if (motif === undefined) throw new Error('grep : motif manquant (ex. grep -i erreur fichier.log)');
      let re; try { re = new RegExp(motif, o.i ? 'i' : ''); } catch { re = new RegExp(motif.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), o.i ? 'i' : ''); }
      let sources = [];
      if (!reste.length) sources = [[null, entree]];
      else for (const f of reste.flatMap(expandre)) {
        const p = norm(f), e = N.get(p);
        if (!e) throw new Error(`grep: ${f} : aucun fichier ou dossier de ce nom`);
        if (e.d) { if (!(o.r || o.R)) throw new Error(`grep: ${f} : est un dossier (ajoute -r)`); [...N.keys()].filter(k => k.startsWith(p === '/' ? '/' : p + '/') && !N.get(k).d).sort().forEach(k => sources.push([k, N.get(k).data])); }
        else sources.push([f, e.data]);
      }
      const multi = sources.length > 1 || o.r || o.R, out = [];
      for (const [nom, b] of sources) {
        const l = lignes(b); let c = 0;
        l.forEach((x, i) => { if (re.test(x) !== !!o.v) { c++; if (!o.c) out.push((multi ? nom + ':' : '') + (o.n ? (i + 1) + ':' : '') + x); } });
        if (o.c) out.push((multi ? nom + ':' : '') + c);
      }
      return sortie(out);
    },
    sort: (a, entree) => { const { o, reste } = options(a); let l = lignes(reste.length ? lire(reste[0]) : entree); l.sort(o.n ? (x, y) => parseFloat(x) - parseFloat(y) || x.localeCompare(y) : (x, y) => x < y ? -1 : x > y ? 1 : 0); if (o.r) l.reverse(); if (o.u) l = [...new Set(l)]; return sortie(l); },
    uniq: (a, entree) => { const { o, reste } = options(a); const l = lignes(reste.length ? lire(reste[0]) : entree), out = []; let prec = null, n = 0; const pousser = () => { if (prec !== null) out.push(o.c ? `${String(n).padStart(7)} ${prec}` : prec); }; for (const x of l) { if (x === prec) n++; else { pousser(); prec = x; n = 1; } } pousser(); return sortie(out); },
    cut: (a, entree) => { const { o, reste } = options(a, ['d', 'f', 'c']); const l = lignes(reste.length ? lire(reste[0]) : entree); const d = o.d ?? '\t'; const champs = String(o.f || '1').split(',').flatMap(x => { const [m, n] = x.split('-').map(Number); return n ? Array.from({ length: n - m + 1 }, (_, i) => m + i) : [m]; }); return sortie(l.map(x => { const p = x.split(d); return champs.map(i => p[i - 1] ?? '').join(d); })); },
    file: a => { if (!a.length) throw new Error('file : indique un fichier'); return sortie(a.flatMap(expandre).map(f => { const p = norm(f), e = N.get(p); if (!e) return `${f}: cannot open (aucun fichier de ce nom)`; return `${f}: ${e.d ? 'directory' : typeFichier(e.data)}`; })); },
    strings: (a, entree) => { const { o, reste } = options(a, ['n']); const b = reste.length ? lire(reste[0]) : entree; return sortie(chaines(b, +(o.n || 4)).map(x => x.texte)); },
    base64: (a, entree) => {
      const { o, reste } = options(a); const b = reste.length ? lire(reste[0]) : entree;
      if (o.d) { const s = U(b).replace(/\s+/g, ''); try { return Uint8Array.from(atob(s), c => c.charCodeAt(0)); } catch { throw new Error('base64: entrée invalide'); } }
      let s = ''; b.forEach(x => { s += String.fromCharCode(x); }); return T(btoa(s).replace(/.{76}/g, '$&\n') + '\n');
    },
    xxd: (a, entree) => { const b = a.length ? lire(a[0]) : entree; const out = []; for (let i = 0; i < Math.min(b.length, 4096); i += 16) { const s = b.subarray(i, i + 16); out.push(`${i.toString(16).padStart(8, '0')}: ${[...s].map(x => x.toString(16).padStart(2, '0')).join('').replace(/(.{4})/g, '$1 ').padEnd(40)} ${[...s].map(x => x >= 32 && x < 127 ? String.fromCharCode(x) : '.').join('')}`); } return sortie(out); },
    find: a => {
      let depart = '.'; const args = [...a];
      if (args.length && !args[0].startsWith('-')) depart = args.shift();
      const crit = []; for (let i = 0; i < args.length; i++) { if (args[i] === '-name' || args[i] === '-iname') crit.push(['name', globRe(args[++i] || '*'), args[i - 1] === '-iname']); else if (args[i] === '-type') crit.push(['type', args[++i]]); else throw new Error(`find : option inconnue ${args[i]}`); }
      const p = norm(depart); if (!N.has(p)) throw new Error(`find: '${depart}' : aucun fichier ou dossier de ce nom`);
      const pre = depart.endsWith('/') ? depart.slice(0, -1) : depart;
      return sortie([...N.keys()].filter(k => k === p || k.startsWith(p === '/' ? '/' : p + '/')).sort().filter(k => crit.every(c => c[0] === 'type' ? (c[1] === 'd') === N.get(k).d : (c[2] ? new RegExp(c[1].source, 'i') : c[1]).test(base(k)))).map(k => depart.startsWith('/') ? k : pre + k.slice(p.length)));
    }
  };
  const ALIAS = { ll: ['ls', '-l'], la: ['ls', '-a'], dir: ['ls'] };

  function executer(ligne) {
    ligne = ligne.trim();
    if (!ligne) return { texte: '' };
    historique.push(ligne);
    if (ligne === 'clear') return { clear: true };
    let flux = new Uint8Array();
    const etapes = []; let cur = '', q = null;
    for (const ch of ligne) { if (q) { if (ch === q) q = null; cur += ch; continue; } if (ch === '"' || ch === "'") q = ch; if (ch === '|' && !q) { etapes.push(cur); cur = ''; } else cur += ch; }
    etapes.push(cur);
    try {
      for (const e of etapes) {
        let [cmd, ...args] = decouper(e.trim());
        if (!cmd) throw new Error('commande vide autour du tube « | »');
        if (ALIAS[cmd]) [cmd, ...args] = [...ALIAS[cmd], ...args];
        if (cmd === 'sudo') throw new Error(`[sudo] ${utilisateur} n'est pas dans le fichier sudoers. Cet incident sera signalé.`);
        if (!CMD[cmd]) throw new Error(`${cmd} : commande introuvable (tape « help »)`);
        flux = CMD[cmd](args, flux) || new Uint8Array();
      }
      return { texte: U(flux) };
    } catch (err) { return { texte: err.message + '\n', erreur: true }; }
  }
  const completer = mot => {
    const d = mot.includes('/') ? mot.slice(0, mot.lastIndexOf('/') + 1) : '';
    const dossier = norm(d || '.'), deb = mot.slice(d.length);
    return enfants(dossier).map(base).filter(x => x.startsWith(deb)).map(x => d + x + (N.get((dossier === '/' ? '' : dossier) + '/' + x)?.d ? '/' : ''));
  };
  return { executer, completer, invite: () => `${utilisateur}@${hote}:${dir === maison ? '~' : dir.startsWith(maison + '/') ? '~' + dir.slice(maison.length) : dir}$`, historique };
}

export async function monter(el, opts = {}) {
  const fs = {};
  for (const [k, v] of Object.entries(opts.fs || {})) fs[k] = v && v.src ? await chargerOctets(v.src) : v;
  const sh = creerShell({ fs: creerFS(fs), utilisateur: opts.utilisateur, hote: opts.hote, cwd: opts.cwd });
  el.innerHTML = `<div class="term" role="region" aria-label="Terminal simulé">
    <div class="term-barre"><span></span><span></span><span></span><b>${esc(opts.utilisateur || 'analyste')}@${esc(opts.hote || 'lumio')}</b></div>
    <div class="term-ecran" tabindex="-1"><pre class="term-sortie" aria-live="polite">${esc(opts.motd || 'Terminal simulé — tape « help » pour la liste des commandes.')}\n</pre>
    <form class="term-ligne"><label class="term-invite" for="termIn"></label><input id="termIn" class="term-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Commande"></form></div></div>`;
  const out = $('.term-sortie', el), inp = $('.term-in', el), inv = $('.term-invite', el), ecran = $('.term-ecran', el);
  inv.textContent = sh.invite();
  let pos = -1;
  const ecrire = (t, cls) => { const s = document.createElement('span'); if (cls) s.className = cls; s.textContent = t; out.appendChild(s); if (out.childNodes.length > 1500) out.removeChild(out.firstChild); ecran.scrollTop = ecran.scrollHeight; };
  const lancer = cmd => {
    ecrire(`${sh.invite()} ${cmd}\n`, 'term-cmd');
    const r = sh.executer(cmd);
    if (r.clear) { out.textContent = ''; } else if (r.texte) ecrire(r.texte.length > 200000 ? r.texte.slice(0, 200000) + '\n[sortie tronquée]\n' : r.texte, r.erreur ? 'term-err' : '');
    inv.textContent = sh.invite(); pos = -1;
    return r;
  };
  $('.term-ligne', el).addEventListener('submit', e => { e.preventDefault(); const c = inp.value; inp.value = ''; lancer(c); });
  inp.addEventListener('keydown', e => {
    const h = sh.historique;
    if (e.key === 'ArrowUp' && h.length) { e.preventDefault(); pos = pos < 0 ? h.length - 1 : Math.max(0, pos - 1); inp.value = h[pos]; }
    else if (e.key === 'ArrowDown' && pos >= 0) { e.preventDefault(); pos = pos + 1 >= h.length ? -1 : pos + 1; inp.value = pos < 0 ? '' : h[pos]; }
    else if (e.key === 'Tab') {
      const mots = inp.value.split(' '), dernier = mots.pop() || '';
      const c = sh.completer(dernier);
      if (c.length === 1) { e.preventDefault(); inp.value = [...mots, c[0]].join(' '); }
      else if (c.length > 1) { e.preventDefault(); ecrire(c.join('  ') + '\n'); }
    } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); out.textContent = ''; }
  });
  ecran.addEventListener('click', () => { if (!getSelection().toString()) inp.focus(); });
  return { lancer, shell: sh };
}
