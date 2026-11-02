// Construit le pack « Mes photos » publié (assets/ctf/photos/defis.json) à partir de outils/ctf/mes-photos.json,
// qui contient les réponses en clair et n'est jamais publié (règle netlify.toml sur /outils/*).
//
// Les photos d'un téléphone contiennent presque toujours des métadonnées (EXIF, XMP) : position GPS exacte,
// date, modèle, parfois le nom du propriétaire. Publiées telles quelles, elles donnent la réponse du défi
// (l'inspecteur EXIF de l'arène les lit) et ta position personnelle. Ce script refuse donc toute image qui
// contient encore des métadonnées ; l'option --nettoyer les retire (le profil couleur ICC est conservé).
//
// Usage : 1. dépose tes images dans assets/ctf/photos/ ; 2. décris tes défis dans outils/ctf/mes-photos.json
//         (modèle : outils/ctf/mes-photos.exemple.json) ; 3. node outils/ctf/photos.mjs [--nettoyer]
// Options : --source <fichier.json>  --sortie <defis.json>  --solutions <fichier.json>  --nettoyer
import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { genererPack } from '../../app/ctf/packs.js';
import * as S from '../../app/ctf/securite.js';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '../..');
const arg = (nom, defaut) => { const i = process.argv.indexOf('--' + nom); return i > 0 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]) : defaut; };
const SOURCE = arg('source', path.join(ICI, 'mes-photos.json'));
const SORTIE = arg('sortie', path.join(RACINE, 'assets/ctf/photos/defis.json'));
const SOLUTIONS = arg('solutions', path.join(ICI, 'solutions-photos.json'));
const NETTOYER = process.argv.includes('--nettoyer');

/* ---------- métadonnées des images ---------- */
// Renvoie { metas: ['EXIF', 'XMP'…], gps: bool, propre: Buffer|null } ; propre = image sans métadonnées.
export function examinerImage(b) {
  const metas = new Set(); let gps = false;
  if (b[0] === 0xFF && b[1] === 0xD8) {
    const garde = [b.subarray(0, 2)];
    let o = 2;
    while (o + 4 <= b.length && b[o] === 0xFF) {
      const m = b[o + 1];
      if (m === 0xD9 || m === 0xDA) { garde.push(b.subarray(o)); o = b.length; break; }
      if (m === 0x01 || (m >= 0xD0 && m <= 0xD7)) { garde.push(b.subarray(o, o + 2)); o += 2; continue; }
      const len = b.readUInt16BE(o + 2), seg = b.subarray(o, o + 2 + len), entete = seg.subarray(4, 40).toString('latin1');
      let retirer = false;
      if (m === 0xE1 && entete.startsWith('Exif\0')) { metas.add('EXIF'); retirer = true; if (exifAGps(seg.subarray(10))) gps = true; }
      else if (m === 0xE1) { metas.add('XMP'); retirer = true; if (/GPS(Latitude|Longitude)/.test(seg.toString('latin1'))) gps = true; }
      else if (m === 0xED) { metas.add('IPTC'); retirer = true; }
      else if (m === 0xFE) { metas.add('commentaire JPEG'); retirer = true; }
      else if (m >= 0xE3 && m <= 0xEF && m !== 0xEE) { metas.add(`APP${m - 0xE0}`); retirer = true; } // APP14 (Adobe) gardé : il décrit les couleurs
      if (!retirer) garde.push(seg);
      o += 2 + len;
    }
    if (o < b.length) garde.push(b.subarray(o));
    return { metas: [...metas], gps, propre: Buffer.concat(garde) };
  }
  if (b.subarray(1, 4).toString('latin1') === 'PNG') {
    const garde = [b.subarray(0, 8)];
    let o = 8;
    while (o + 12 <= b.length) {
      const len = b.readUInt32BE(o), type = b.subarray(o + 4, o + 8).toString('latin1'), bloc = b.subarray(o, o + 12 + len);
      if (type === 'eXIf') { metas.add('EXIF'); if (exifAGps(bloc.subarray(8, 8 + len))) gps = true; }
      else if (['tEXt', 'iTXt', 'zTXt', 'tIME'].includes(type)) { metas.add('texte PNG'); if (/GPS(Latitude|Longitude)/.test(bloc.toString('latin1'))) gps = true; }
      else garde.push(bloc);
      o += 12 + len;
      if (type === 'IEND') break;
    }
    return { metas: [...metas], gps, propre: Buffer.concat(garde) };
  }
  const brut = b.toString('latin1');
  if (/Exif\0\0|GPSLatitude|<x:xmpmeta/.test(brut)) return { metas: ['EXIF ou XMP'], gps: /GPS/.test(brut), propre: null };
  return { metas: [], gps: false, propre: b };
}
// Le bloc TIFF d'un EXIF contient-il un pointeur vers un IFD GPS (balise 0x8825) ?
function exifAGps(t) {
  try {
    const le = t.toString('latin1', 0, 2) === 'II';
    const u16 = o => le ? t.readUInt16LE(o) : t.readUInt16BE(o), u32 = o => le ? t.readUInt32LE(o) : t.readUInt32BE(o);
    const ifd = u32(4), n = u16(ifd);
    for (let i = 0; i < n; i++) if (u16(ifd + 2 + i * 12) === 0x8825) return true;
  } catch { /* bloc illisible : on se rabat sur une recherche de texte */ return /GPS/.test(t.toString('latin1')); }
  return false;
}

/* ---------- construction du pack ---------- */
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(await readFile(SOURCE, 'utf8'));
  const erreurs = [], nettoyees = [];
  for (const [i, d] of (source.defis || []).entries()) {
    const ou = `défi ${i + 1} (${d.titre || 'sans titre'})`;
    if (!d.titre || !d.briefing) erreurs.push(`${ou} : titre et briefing obligatoires`);
    if (d.image && !/^assets\/ctf\/photos\/[\w\-./]+\.(jpe?g|png|webp|gif)$/i.test(d.image)) erreurs.push(`${ou} : l'image doit être dans assets/ctf/photos/`);
    else if (d.image) {
      const f = path.join(RACINE, d.image);
      const b = await readFile(f).catch(() => null);
      if (!b) erreurs.push(`${ou} : image introuvable ${d.image}`);
      else {
        const x = examinerImage(b);
        if (x.metas.length && !(d.garderMetadonnees && !x.gps)) {
          if (NETTOYER && x.propre) { await writeFile(f, x.propre); nettoyees.push(`${d.image} (${x.metas.join(', ')} retirés)`); }
          else if (NETTOYER) erreurs.push(`${ou} : ${d.image} contient des métadonnées (${x.metas.join(', ')}) que ce script ne sait pas retirer pour ce format : convertis l'image en JPEG ou en PNG, ou utilise « exiftool -all= ${d.image} ».`);
          else erreurs.push(`${ou} : ${d.image} contient encore des métadonnées (${x.metas.join(', ')})${x.gps ? ', DONT LA POSITION GPS : elle donnerait la réponse du défi et ta position à tout visiteur' : ''}. Relance avec --nettoyer pour les retirer (ou « exiftool -all= ${d.image} »).`);
        }
      }
    }
    if (d.validation === 'carte' && !(Number.isFinite(d.lat) && Number.isFinite(d.lon) && d.rayon > 0)) erreurs.push(`${ou} : lat, lon et rayon (m) obligatoires`);
    if (d.validation !== 'carte' && !d.flag) erreurs.push(`${ou} : flag obligatoire (ex. LUMIO{reponse})`);
    d.indices = (d.indices || []).slice(0, 3);
    d.categorie = d.categorie || 'geoint';
  }
  if (nettoyees.length) console.log('Métadonnées retirées :\n - ' + nettoyees.join('\n - '));
  if (erreurs.length) { console.error('ERREURS :\n - ' + erreurs.join('\n - ')); process.exit(1); }

  const pack = await genererPack({ titre: source.titre || 'Mes photos', auteur: source.auteur || '', proprietaire: true, defis: source.defis || [] });
  pack.id = 'mes-photos';
  await writeFile(SORTIE, JSON.stringify(pack, null, 1) + '\n');

  // Solutions pour les tests automatiques (restent dans outils/)
  const solutions = {};
  for (const [i, d] of (source.defis || []).entries()) {
    const id = pack.defis[i].id;
    solutions[id] = d.validation === 'carte' ? { type: 'carte', lat: d.lat, lon: d.lon, faux: { lat: -d.lat, lon: d.lon + 120 } } : { type: 'flag', flags: [S.normaliserFlag(d.flag)] };
  }
  await writeFile(SOLUTIONS, JSON.stringify(solutions, null, 1) + '\n');
  console.log(`${pack.defis.length} défi(s) écrit(s) dans ${path.relative(process.cwd(), SORTIE) || SORTIE}`);
}
