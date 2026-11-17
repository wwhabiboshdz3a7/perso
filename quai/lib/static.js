'use strict';
// Service des fichiers d'un site : index.html, URLs sans .html, 404.html, mode SPA,
// ETag / 304, requêtes Range (vidéo) et compression gzip.

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const zlib = require('node:zlib');

const TYPES = {
  html: 'text/html; charset=utf-8',
  htm: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  map: 'application/json; charset=utf-8',
  webmanifest: 'application/manifest+json; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  md: 'text/markdown; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  pdf: 'application/pdf',
  wasm: 'application/wasm',
  zip: 'application/zip',
  glb: 'model/gltf-binary',
  gltf: 'model/gltf+json',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|manifest\+json|wasm)|image\/svg\+xml|model\/gltf\+json)/;

function contentType(file) {
  const ext = path.extname(file).slice(1).toLowerCase();
  return TYPES[ext] || 'application/octet-stream';
}

async function fileStat(file) {
  try {
    const st = await fsp.lstat(file);
    return st.isFile() || st.isDirectory() ? st : null;
  } catch {
    return null;
  }
}

const encodePath = (segs) => segs.map((s) => '/' + encodeURIComponent(s)).join('');

function notFoundPage(message) {
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Introuvable</title><body style="font:16px/1.5 system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;margin:0;color:#1c2530;background:#f4f1ea"><div style="text-align:center;padding:24px"><p style="font-size:56px;margin:0;font-weight:700">404</p><p>${message}</p></div>`;
}

function sendNotFound(req, res, message) {
  const body = Buffer.from(notFoundPage(message));
  res.writeHead(404, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(req.method === 'HEAD' ? undefined : body);
}

function sendFile(req, res, file, st, status) {
  const type = contentType(file);
  const etag = `W/"${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}"`;
  const headers = {
    'Content-Type': type,
    ETag: etag,
    'Last-Modified': st.mtime.toUTCString(),
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };

  if (status === 200 && req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers);
    return res.end();
  }

  let start = 0;
  let end = st.size - 1;
  const range = status === 200 ? req.headers.range : undefined;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match && (match[1] || match[2])) {
      if (match[1]) {
        start = Number(match[1]);
        if (match[2]) end = Math.min(Number(match[2]), st.size - 1);
      } else {
        start = Math.max(0, st.size - Number(match[2]));
      }
      if (start > end || start >= st.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
        return res.end();
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${st.size}`;
    }
  }

  const gzip =
    status !== 206 &&
    st.size > 1024 &&
    COMPRESSIBLE.test(type) &&
    /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
  if (gzip) {
    headers['Content-Encoding'] = 'gzip';
    headers.Vary = 'Accept-Encoding';
  } else {
    headers['Content-Length'] = st.size === 0 ? 0 : end - start + 1;
  }

  res.writeHead(status, headers);
  if (req.method === 'HEAD' || st.size === 0) return res.end();

  const stream = fs.createReadStream(file, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  if (gzip) stream.pipe(zlib.createGzip()).pipe(res);
  else stream.pipe(res);
}

// segs : segments d'URL déjà décodés. basePath : '' (sous-domaine) ou '/nom' (mode chemin).
async function serveSite(req, res, site, { segs, trailingSlash, search, basePath }) {
  for (const s of segs) {
    if (s === '..' || s === '.' || s.includes('\0') || s.includes('\\') || s.includes('/')) {
      return sendNotFound(req, res, 'Page introuvable.');
    }
  }
  const root = site.dir;
  let file = path.join(root, ...segs);
  if (file !== root && !file.startsWith(root + path.sep)) {
    return sendNotFound(req, res, 'Page introuvable.');
  }

  let st = await fileStat(file);
  if (st && st.isDirectory()) {
    if (segs.length && !trailingSlash) {
      res.writeHead(301, { Location: basePath + encodePath(segs) + '/' + search });
      return res.end();
    }
    file = path.join(file, 'index.html');
    st = await fileStat(file);
    if (st && !st.isFile()) st = null;
  } else if (!st && segs.length) {
    // URL « propre » : /contact sert contact.html
    const html = file + '.html';
    const htmlStat = await fileStat(html);
    if (htmlStat && htmlStat.isFile()) {
      file = html;
      st = htmlStat;
    }
  }
  if (st) return sendFile(req, res, file, st, 200);

  if (site.deploy.spa) {
    const index = path.join(root, 'index.html');
    const indexStat = await fileStat(index);
    if (indexStat && indexStat.isFile()) return sendFile(req, res, index, indexStat, 200);
  }
  const custom = path.join(root, '404.html');
  const customStat = await fileStat(custom);
  if (customStat && customStat.isFile()) return sendFile(req, res, custom, customStat, 404);

  const hint =
    !segs.length && !site.deploy.hasIndex
      ? "Ce projet n'a pas de fichier index.html à sa racine."
      : 'Page introuvable.';
  return sendNotFound(req, res, hint);
}

module.exports = { serveSite, sendNotFound, encodePath };
