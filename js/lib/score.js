// Score d'opportunité (0 à 100) : beaucoup d'avis + bonne note + pas de vrai site = prospect chaud.

const WEB_WEIGHT = { none: 1, social: 0.82, site: 0.08 };

export const LEVELS = {
  chaud: { label: 'Chaud', min: 75 },
  tiede: { label: 'Tiède', min: 50 },
  froid: { label: 'Froid', min: 0 },
};

export function reviewsFactor(n) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  // échelle logarithmique : 10 avis ≈ 0,45 ; 50 ≈ 0,74 ; 200 et plus = 1
  return Math.min(1, Math.log10(1 + n) / Math.log10(201));
}

export function ratingFactor(r) {
  if (!Number.isFinite(r) || r <= 0) return null;
  return Math.max(0, Math.min(1, (r - 3) / 1.8));
}

export function levelFor(score) {
  if (score >= LEVELS.chaud.min) return 'chaud';
  if (score >= LEVELS.tiede.min) return 'tiede';
  return 'froid';
}

/**
 * @param {{website?:{status:string, free?:boolean}, reviews?:number|null, rating?:number|null, phone?:string|null, source?:string}} p
 */
export function opportunityScore(p) {
  const status = p?.website?.status || 'none';
  let web = WEB_WEIGHT[status] ?? 1;
  if (status === 'site' && p.website?.free) web = 0.4;

  const knowsReviews = Number.isFinite(p?.reviews);
  const rev = knowsReviews ? reviewsFactor(p.reviews) : 0.35; // OSM : avis inconnus → valeur neutre
  const rf = ratingFactor(p?.rating);
  const rat = rf === null ? (knowsReviews && p.reviews > 0 ? 0.4 : 0.35) : rf;
  const phone = p?.phone ? 1 : 0;

  let score = 100 * (0.42 * web + 0.33 * rev + 0.15 * rat + 0.10 * phone);
  // Un établissement sans avis n'est pas un prospect chaud, même sans site.
  if (knowsReviews && p.reviews < 5) score = Math.min(score, 55);
  // Un vrai site (hors site gratuit) plafonne le score.
  if (status === 'site' && !p.website?.free) score = Math.min(score, 40);
  score = Math.round(Math.max(0, Math.min(100, score)));
  return { score, level: levelFor(score) };
}
