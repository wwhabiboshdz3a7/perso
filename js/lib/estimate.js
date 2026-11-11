// Estimation du nombre de requêtes Google AVANT de lancer une recherche.
//
// Le coût réel dépend surtout du redécoupage : une cellule qui renvoie 60 résultats
// (le maximum de Text Search) est coupée en quatre, et chaque quart est interrogé à
// son tour. En centre-ville dense, c'est systématique pour les restaurants ou les
// coiffeurs. On modélise donc le nombre d'établissements attendus par cellule à
// partir d'une densité par catégorie, puis on simule le redécoupage.
//
// Les densités par défaut sont des ordres de grandeur pour un centre-ville dense ;
// elles sont recalibrées après chaque recherche réelle (voir learnDensity).
import { zoneToCells, zoneAreaKm2, bboxSizeKm, MAX_PAGES, MAX_RESULTS_PER_QUERY } from './geo.js';
import { categoryById } from './categories.js';
import { MAX_DEPTH } from './search.js';

const PAGE_SIZE = 20;

/** Établissements par km² en centre-ville dense (ordre de grandeur, Toulouse). */
export const DENSE_DENSITY = {
  restaurant: 200, cafe: 90, boulangerie: 25, boucherie: 10, traiteur: 12, fastfood: 60, pizzeria: 30,
  coiffeur: 50, barbier: 20, institut: 35, ongles: 20, spa: 15, tatouage: 8,
  garage: 6, carrosserie: 3, lavage: 2, autoecole: 6,
  plombier: 10, electricien: 10, serrurier: 8, peintre: 8, couvreur: 4, menuisier: 5, paysagiste: 3,
  dentiste: 25, kine: 30, osteo: 20, opticien: 15, veterinaire: 4,
  avocat: 60, comptable: 20, immobilier: 30, assurance: 15, pressing: 10, cordonnerie: 6, retouche: 10,
  demenageur: 3, photographe: 10, toilettage: 3,
  vetements: 80, chaussures: 25, bijouterie: 20, fleuriste: 10, epicerie: 40, caviste: 10, animalerie: 3, telephonie: 15,
  sport: 15, yoga: 10, hotel: 30,
};
const DEFAULT_DENSITY = 12;

/**
 * Plus la zone est grande, plus elle déborde du centre : la densité moyenne baisse.
 * 1 jusqu'à 4 km², puis décroissance en racine (≈ 0,2 pour 100 km²).
 */
export function urbanFactor(areaKm2) {
  if (!(areaKm2 > 4)) return 1;
  return Math.sqrt(4 / areaKm2);
}

/** Requêtes au plus pour une tâche (cellule × catégorie) redécoupée jusqu'au bout. */
export const MAX_REQUESTS_PER_TASK = requestsForCount(Infinity);

/** Requêtes pour une cellule contenant `n` établissements (pages de 20, redécoupage à 60). */
export function requestsForCount(n, depth = 0) {
  if (n >= MAX_RESULTS_PER_QUERY && depth < MAX_DEPTH) return MAX_PAGES + 4 * requestsForCount(n / 4, depth + 1);
  return Math.min(MAX_PAGES, Math.max(1, Math.ceil(n / PAGE_SIZE)));
}

/**
 * Espérance lissée : la densité réelle varie d'une cellule à l'autre, et le seuil de 60
 * crée des marches. On moyenne le modèle autour de la valeur attendue.
 */
export function expectedRequests(n) {
  return 0.25 * requestsForCount(n * 0.6) + 0.5 * requestsForCount(n) + 0.25 * requestsForCount(n * 1.6);
}

/** Densité « centre dense » d'une catégorie : apprise si disponible, sinon valeur par défaut. */
export function denseDensity(catId, learned = {}) {
  const l = learned?.[catId];
  if (l && Number.isFinite(l.d) && l.d >= 0) return { d: l.d, learned: true };
  return { d: DENSE_DENSITY[catId] ?? DEFAULT_DENSITY, learned: false };
}

/**
 * @param {{zone:object, categoryIds:string[], cellKm:number, cachedKeys?:Set<string>, taskKeyOf?:Function,
 *          learned?:object, pricePerRequest?:number, cap?:number}} o
 */
export function estimateSearch({
  zone, categoryIds, cellKm, cachedKeys = new Set(), taskKeyOf = () => '', learned = {},
  pricePerRequest = 0.035, cap = 150,
}) {
  const cells = zoneToCells(zone, cellKm);
  const area = zoneAreaKm2(zone);
  const uf = urbanFactor(area);
  let tasks = 0;
  let cachedTasks = 0;
  let min = 0;
  let probable = 0;
  let low = 0;
  let high = 0;
  let calibrated = 0;
  for (const catId of categoryIds) {
    if (!categoryById(catId)) continue;
    const { d, learned: isLearned } = denseDensity(catId, learned);
    if (isLearned) calibrated++;
    for (const cell of cells) {
      tasks++;
      if (cachedKeys.has(taskKeyOf(catId, cell))) { cachedTasks++; continue; }
      const { w, h } = bboxSizeKm(cell);
      const n = d * uf * w * h;
      min += 1;
      probable += expectedRequests(n);
      low += requestsForCount(n * 0.15);
      high += requestsForCount(n * 1.6);
    }
  }
  probable = Math.ceil(probable);
  const bounded = (x) => Math.min(x, cap);
  const toFetch = tasks - cachedTasks;
  // Vrai pire cas : la recherche s'arrête toujours au plafond (et rien à payer si tout est en cache).
  const worst = Math.min(cap, toFetch * MAX_REQUESTS_PER_TASK);
  return {
    cells: cells.length,
    categories: categoryIds.length,
    tasks,
    cachedTasks,
    toFetch,
    areaKm2: area,
    calibrated,
    /** sans aucun redécoupage : 1 requête par cellule et par catégorie (borne basse) */
    min: bounded(min),
    probable: bounded(probable),
    low: bounded(low),
    high: bounded(high),
    /** vrai pire cas : la recherche s'arrête toujours au plafond */
    worst,
    unbounded: { min, probable, low, high },
    capped: high > cap,
    probableCapped: probable > cap,
    capTooLow: min > cap,
    dense: probable >= Math.max(min * 2, min + 10),
    cost: {
      min: bounded(min) * pricePerRequest,
      probable: bounded(probable) * pricePerRequest,
      low: bounded(low) * pricePerRequest,
      high: bounded(high) * pricePerRequest,
      worst: worst * pricePerRequest,
    },
  };
}

/**
 * Apprend la densité réelle après une recherche complète : on ramène la densité
 * observée dans la zone à son équivalent « centre dense », puis on la fond dans la
 * moyenne existante (les recherches récentes comptent davantage).
 * @param {object} learned  {catId: {d, n, at}}
 * @param {{zone:object, places:object[], categoryIds:string[], now?:number}} o
 */
export function learnDensity(learned, { zone, places, categoryIds, now = Date.now() }) {
  const area = zoneAreaKm2(zone);
  if (!(area > 0.05)) return learned || {};
  const uf = urbanFactor(area);
  const next = { ...(learned || {}) };
  for (const catId of categoryIds) {
    const count = places.filter((p) => p.categories?.includes(catId)).length;
    // Les établissements fermés sont écartés par la fonction : on compense un peu (≈ 5 %).
    const observed = (count * 1.05) / area / uf;
    const prev = next[catId];
    const n = Math.min(5, (prev?.n || 0) + 1);
    const d = prev && Number.isFinite(prev.d) ? prev.d + (observed - prev.d) / n : observed;
    next[catId] = { d: Math.round(d * 10) / 10, n, at: now };
  }
  return next;
}
