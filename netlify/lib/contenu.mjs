// Accès au contenu payant. Il vit dans le dossier `prive/` (hors du dossier publié),
// embarqué dans les fonctions grâce à `included_files` (netlify.toml).
import { existsSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fichiers } from '../../public/cours/content/catalogue.js';

let dossierCache = null;

/** Trouve le dossier privé selon l'environnement (local, Netlify, variable d'environnement). */
export function dossierPrive(env = process.env) {
  if (dossierCache) return dossierCache;
  const candidats = [];
  if (env.LEVIER_DOSSIER_PRIVE) candidats.push(env.LEVIER_DOSSIER_PRIVE);
  try { candidats.push(fileURLToPath(new URL('../../prive/', import.meta.url))); } catch { /* bundle sans URL de fichier */ }
  candidats.push(path.join(process.cwd(), 'prive'));
  if (env.LAMBDA_TASK_ROOT) candidats.push(path.join(env.LAMBDA_TASK_ROOT, 'prive'));
  candidats.push('/var/task/prive');
  for (const c of candidats) {
    if (c && existsSync(path.join(c, 'modules'))) { dossierCache = c; return c; }
  }
  throw new Error('Dossier du contenu privé introuvable');
}

const ID_MODULE = /^(m[2-8]|bonus)$/;
const cacheModules = new Map();

/** Charge un module payant (objet JSON-sérialisable). */
export async function chargerModule(id) {
  if (!ID_MODULE.test(id)) return null;
  if (cacheModules.has(id)) return cacheModules.get(id);
  const fichier = path.join(dossierPrive(), 'modules', `${id}.mjs`);
  if (!existsSync(fichier)) return null;
  const mod = await import(pathToFileURL(fichier).href);
  const donnees = mod.default;
  cacheModules.set(id, donnees);
  return donnees;
}

/** Lit un fichier téléchargeable déclaré dans le catalogue (aucun autre chemin n'est accepté). */
export async function lireFichier(nom) {
  const decl = Object.prototype.hasOwnProperty.call(fichiers, nom) ? fichiers[nom] : null;
  if (!decl) return null;
  const base = dossierPrive();
  const complet = path.resolve(base, nom);
  if (!complet.startsWith(path.resolve(base) + path.sep)) return null;
  const contenu = await readFile(complet, 'utf8');
  return { ...decl, nom, contenu };
}

let codesCache = null;
/**
 * Hachages de codes d'accès stockés dans prive/codes-acces.txt (une ligne « offre:hachage »).
 * Complète la variable ACCESS_CODE_HASHES, limitée en taille sur Netlify (4 Ko pour l'ensemble
 * des variables d'une fonction). Les codes générés ont 75 bits d'entropie : leurs hachages
 * peuvent être versionnés sans risque.
 */
export function codesDepuisFichier() {
  if (codesCache !== null) return codesCache;
  try {
    const f = path.join(dossierPrive(), 'codes-acces.txt');
    codesCache = existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(l => l.trim() && !l.trim().startsWith('#')).join('\n') : '';
  } catch { codesCache = ''; }
  return codesCache;
}
