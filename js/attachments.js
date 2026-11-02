// Pièces jointes : fichiers texte/code (contenu injecté dans le message) et images (data URL, modèles « vision »).

import { readAsText, readAsDataURL, uid } from './util.js';

const TEXT_EXT = /\.(md|markdown|txt|text|csv|tsv|json|jsonl|xml|ya?ml|toml|ini|cfg|conf|log|html?|css|scss|sass|less|m?js|cjs|tsx?|jsx|vue|svelte|astro|py|rb|php|java|kt|kts|c|h|cpp|hpp|cc|cs|go|rs|swift|sql|sh|bash|zsh|fish|ps1|bat|lua|r|m|dart|tex|bib|srt|vtt|svg|graphql|gql|proto|env\.example|gitignore|dockerfile|makefile)$/i;
const TEXT_MIME = /^(text\/|application\/(json|xml|javascript|x-javascript|typescript|x-sh|x-python|yaml|x-yaml|toml|sql|ld\+json|graphql))/i;
const IMAGE_MIME = /^image\/(png|jpe?g|webp|gif)$/i;

export const MAX_TEXT_CHARS = 120000;
export const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_SIDE = 1600;

const LANG = { md: 'markdown', markdown: 'markdown', yml: 'yaml', htm: 'html', mjs: 'javascript', cjs: 'javascript', txt: '', text: '', log: '', csv: 'csv', tsv: '', env: 'bash', svg: 'xml' };

function extOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = src;
  });
}

async function processImage(file) {
  const original = await readAsDataURL(file);
  const img = await loadImage(original);
  let { naturalWidth: w, naturalHeight: h } = img;
  const big = Math.max(w, h) > MAX_SIDE;
  if (!big && file.size <= 1.5 * 1024 * 1024) {
    return { id: uid('a_'), kind: 'image', name: file.name || 'image', type: file.type, size: file.size, width: w, height: h, dataUrl: original };
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
  w = Math.round(w * scale); h = Math.round(h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.86);
  return { id: uid('a_'), kind: 'image', name: file.name || 'image.jpg', type: 'image/jpeg', size: Math.round(dataUrl.length * 0.75), width: w, height: h, dataUrl };
}

async function processText(file) {
  let content = await readAsText(file);
  if (content.includes('\u0000')) throw new Error('fichier binaire');
  let truncated = false;
  if (content.length > MAX_TEXT_CHARS) { content = content.slice(0, MAX_TEXT_CHARS); truncated = true; }
  const ext = extOf(file.name);
  const lang = ext in LANG ? LANG[ext] : ext;
  return { id: uid('a_'), kind: 'text', name: file.name || 'texte.txt', type: file.type || 'text/plain', size: file.size, lang, content, truncated, lines: content.split('\n').length };
}

export async function processFiles(fileList) {
  const items = [];
  const errors = [];
  for (const file of Array.from(fileList || [])) {
    try {
      if (file.size > MAX_FILE_BYTES) { errors.push(`${file.name} : fichier trop lourd (8 Mo maximum).`); continue; }
      if (IMAGE_MIME.test(file.type)) items.push(await processImage(file));
      else if (TEXT_MIME.test(file.type) || TEXT_EXT.test(file.name) || (!file.type && file.size < 512 * 1024)) items.push(await processText(file));
      else errors.push(`${file.name} : format non pris en charge. Pour un PDF ou un document Word, copiez-collez le texte.`);
    } catch {
      errors.push(`${file.name} : lecture impossible (fichier binaire ou corrompu).`);
    }
  }
  return { items, errors };
}

function fenceFor(content) {
  const runs = String(content).match(/`{3,}/g) || [];
  const longest = runs.reduce((n, r) => Math.max(n, r.length), 2);
  return '`'.repeat(longest + 1);
}

/** Contenu envoyé à l'API pour un message utilisateur avec pièces jointes. */
export function toApiContent(text, attachments = []) {
  const files = attachments.filter((a) => a.kind === 'text');
  const images = attachments.filter((a) => a.kind === 'image');
  let body = text || '';
  for (const f of files) {
    const fence = fenceFor(f.content);
    body += `${body ? '\n\n' : ''}Fichier joint : ${f.name}${f.truncated ? ' (tronqué)' : ''}\n${fence}${f.lang || ''}\n${f.content}\n${fence}`;
  }
  if (!images.length) return body;
  return [
    { type: 'text', text: body || 'Décris cette image.' },
    ...images.map((i) => ({ type: 'image_url', image_url: { url: i.dataUrl } })),
  ];
}
