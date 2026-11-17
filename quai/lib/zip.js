'use strict';
// Lecteur ZIP minimal (méthodes « stored » et « deflate »), sans dépendance.
// Le fichier est lu par morceaux depuis le disque : seule une entrée à la fois est en mémoire.

const fsp = require('node:fs/promises');
const zlib = require('node:zlib');
const { promisify } = require('node:util');
const { HttpError } = require('./store');

const inflateRaw = promisify(zlib.inflateRaw);

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;
const LOCAL_SIG = 0x04034b50;

const invalid = (why) => new HttpError(400, `Archive zip illisible (${why}).`);

async function readAt(handle, position, length) {
  const buffer = Buffer.alloc(length);
  const { bytesRead } = await handle.read(buffer, 0, length, position);
  if (bytesRead !== length) throw invalid('fichier tronqué');
  return buffer;
}

// Appelle onEntry(nom, contenu) pour chaque fichier de l'archive.
async function extractZip(file, { maxBytes, maxFiles, onEntry }) {
  const handle = await fsp.open(file, 'r');
  try {
    const { size } = await handle.stat();
    if (size < 22) throw invalid('trop petit');

    const tailLength = Math.min(size, 22 + 0xffff);
    const tail = await readAt(handle, size - tailLength, tailLength);
    let eocd = -1;
    for (let i = tail.length - 22; i >= 0; i--) {
      if (tail.readUInt32LE(i) === EOCD_SIG) {
        eocd = i;
        break;
      }
    }
    if (eocd === -1) throw invalid("ce n'est pas un zip");

    const count = tail.readUInt16LE(eocd + 10);
    const cdSize = tail.readUInt32LE(eocd + 12);
    const cdOffset = tail.readUInt32LE(eocd + 16);
    if (count === 0xffff || cdSize === 0xffffffff || cdOffset === 0xffffffff) {
      throw invalid('format zip64 non pris en charge');
    }
    if (count > maxFiles) throw new HttpError(413, 'Trop de fichiers dans cette archive.');
    if (cdOffset + cdSize > size) throw invalid('index corrompu');

    const central = await readAt(handle, cdOffset, cdSize);
    let pos = 0;
    let total = 0;
    for (let n = 0; n < count; n++) {
      if (pos + 46 > central.length || central.readUInt32LE(pos) !== CENTRAL_SIG) {
        throw invalid('index corrompu');
      }
      const flags = central.readUInt16LE(pos + 8);
      const method = central.readUInt16LE(pos + 10);
      const compressedSize = central.readUInt32LE(pos + 20);
      const nameLength = central.readUInt16LE(pos + 28);
      const extraLength = central.readUInt16LE(pos + 30);
      const commentLength = central.readUInt16LE(pos + 32);
      const externalAttrs = central.readUInt32LE(pos + 38);
      const localOffset = central.readUInt32LE(pos + 42);
      const name = central.toString('utf8', pos + 46, pos + 46 + nameLength);
      pos += 46 + nameLength + extraLength + commentLength;

      if (name.endsWith('/') || name.endsWith('\\')) continue; // dossier
      if (((externalAttrs >>> 16) & 0o170000) === 0o120000) continue; // lien symbolique
      if (flags & 1) throw invalid('archive chiffrée');
      if (compressedSize === 0xffffffff || localOffset === 0xffffffff) {
        throw invalid('format zip64 non pris en charge');
      }

      const local = await readAt(handle, localOffset, 30);
      if (local.readUInt32LE(0) !== LOCAL_SIG) throw invalid('entrée corrompue');
      const dataOffset = localOffset + 30 + local.readUInt16LE(26) + local.readUInt16LE(28);
      if (dataOffset + compressedSize > size) throw invalid('entrée corrompue');
      const raw = await readAt(handle, dataOffset, compressedSize);

      let content;
      if (method === 0) {
        content = raw;
      } else if (method === 8) {
        try {
          content = await inflateRaw(raw, { maxOutputLength: Math.max(1, maxBytes - total) });
        } catch (err) {
          if (err.code === 'ERR_BUFFER_TOO_LARGE') {
            throw new HttpError(413, 'Projet trop volumineux une fois décompressé.');
          }
          throw invalid('données corrompues');
        }
      } else {
        throw invalid(`méthode de compression ${method} non prise en charge`);
      }
      total += content.length;
      if (total > maxBytes) throw new HttpError(413, 'Projet trop volumineux une fois décompressé.');
      await onEntry(name, content);
    }
  } finally {
    await handle.close();
  }
}

module.exports = { extractZip };
