// Serveur de développement sans dépendance : sert le site comme Netlify,
// avec les en-têtes déclarés dans netlify.toml (CORS des polices pour l'aperçu isolé).
// Usage : npm run serve  (port 8080, ou PORT=9000 npm run serve)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT) || 8080;
const host = process.env.HOST || '127.0.0.1';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.map': 'application/json',
};

// Lecture minimale des blocs [[headers]] de netlify.toml
function netlifyHeaders() {
  const rules = [];
  let cur = null;
  for (const line of readFileSync(join(root, 'netlify.toml'), 'utf8').split('\n')) {
    const t = line.trim();
    if (t === '[[headers]]') { cur = { for: '', values: {} }; rules.push(cur); continue; }
    if (!cur || !t || t.startsWith('#') || t.startsWith('[')) { if (t.startsWith('[') && t !== '[headers.values]') cur = null; continue; }
    const m = t.match(/^([\w-]+)\s*=\s*"(.*)"$/);
    if (!m) continue;
    if (m[1] === 'for') cur.for = m[2]; else cur.values[m[1]] = m[2];
  }
  return rules.map((r) => ({ re: new RegExp(`^${r.for.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`), values: r.values }));
}
const rules = netlifyHeaders();

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let path = decodeURIComponent(url.pathname);
    let file = normalize(join(root, path));
    if (!file.startsWith(root) || file.split(sep).includes('node_modules') || file.split(sep).includes('.git')) {
      res.writeHead(403).end('Interdit');
      return;
    }
    let info = await stat(file).catch(() => null);
    if (info && info.isDirectory()) {
      if (!path.endsWith('/')) { res.writeHead(301, { Location: `${path}/${url.search}` }).end(); return; }
      file = join(file, 'index.html');
      info = await stat(file).catch(() => null);
    }
    if (!info) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable'); return; }
    const headers = { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' };
    for (const r of rules) if (r.re.test(path)) Object.assign(headers, r.values);
    headers['Cache-Control'] = 'no-cache';
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : await readFile(file));
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(port, host, () => console.log(`Kinetika : http://${host}:${port}/`));
