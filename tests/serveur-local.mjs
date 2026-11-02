#!/usr/bin/env node
// Serveur de développement : sert le site statique et branche la fonction Netlify sur /api/*,
// avec les mêmes en-têtes de sécurité qu'en production (lus dans netlify.toml).
//
//   PROVIDER_BASE_URL=http://127.0.0.1:9302/v1 PROVIDER_API_KEY=cle-valide \
//   ACCESS_PASSWORD_HASH="$(…)" TOKEN_SECRET=… node tests/serveur-local.mjs 9303

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import handler from '../netlify/functions/chat.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};

async function headersFromToml() {
  const toml = await readFile(join(ROOT, 'netlify.toml'), 'utf8');
  const block = toml.split('[[headers]]').find((b) => /for = "\/\*"/.test(b)) || '';
  const out = {};
  for (const m of block.matchAll(/^\s*([A-Za-z-]+) = "(.*)"\s*$/gm)) if (m[1] !== 'for') out[m[1]] = m[2];
  return out;
}

export async function startServer({ port = 0, host = '127.0.0.1' } = {}) {
  const security = await headersFromToml();
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req);
      const controller = new AbortController();
      res.on('close', () => controller.abort());
      const request = new Request(url, { method: req.method, headers: req.headers, body, duplex: 'half', signal: controller.signal });
      try {
        const response = await handler(request, { ip: req.socket.remoteAddress });
        res.writeHead(response.status, Object.fromEntries(response.headers));
        if (response.body) {
          for await (const chunk of response.body) res.write(chunk);
        }
        res.end();
      } catch (e) {
        if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end();
      }
      return;
    }
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT) || /\/(tests|scripts|netlify|\.git)\//.test(path)) {
      res.writeHead(404, security); res.end('Introuvable'); return;
    }
    try {
      const st = await stat(file);
      if (!st.isFile()) throw new Error('pas un fichier');
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache', ...security });
      res.end(data);
    } catch {
      const data = await readFile(join(ROOT, '404.html')).catch(() => 'Introuvable');
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...security });
      res.end(data);
    }
  });
  return new Promise((resolve) => server.listen(port, host, () => resolve({ server, port: server.address().port, close: () => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }) })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2] || 9303);
  startServer({ port }).then(() => console.log(`Nour : http://127.0.0.1:${port}/ (fonction sur /api/*)`));
}
