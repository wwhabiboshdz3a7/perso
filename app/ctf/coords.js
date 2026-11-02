// Lecture de coordonnées saisies à la main ou collées : décimales (point ou virgule à la française),
// degrés-minutes-secondes, lettre d'hémisphère avant ou après le nombre (N/S, E/O/W), liens de cartes.
// Module sans dépendance, partagé avec outils/ctf/generer.mjs.

// Exemples affichés dans l'interface : volontairement en plein océan Atlantique, loin de tout défi
// (le générateur vérifie qu'ils ne tombent dans aucune zone acceptée).
export const EXEMPLE_DECIMAL = '12.3456, -45.6789';
export const EXEMPLE_DMS = '12°20\'44"N 45°40\'44"W';

const NOMBRE = '(-?\\d+(?:\\.\\d+)?)';
const DMS = `\\s*(?:°\\s*(?:(\\d+(?:\\.\\d+)?)\\s*'\\s*)?(?:(\\d+(?:\\.\\d+)?)\\s*"\\s*)?)?`;
const COMP_APRES = new RegExp(`${NOMBRE}${DMS}\\s*([NSEOW](?![A-Z]))?`, 'g');
const COMP_AVANT = new RegExp(`([NSEOW])\\s*${NOMBRE}${DMS}`, 'g');

function valeur(lettre, deg, min, sec) {
  const m = +min || 0, s = +sec || 0;
  if (m >= 60 || s >= 60) return null;
  let x = Math.abs(+deg) + m / 60 + s / 3600;
  if (lettre ? /[SOW]/.test(lettre) : String(deg).startsWith('-')) x = -x;
  return x;
}

export function lireCoordonnees(saisie) {
  let t = String(saisie || '').trim();
  if (!t) return null;
  // liens OpenStreetMap, Google Maps, geo:
  const lien = t.match(/#map=\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/) || t.match(/mlat=(-?\d+(?:\.\d+)?)&(?:amp;)?mlon=(-?\d+(?:\.\d+)?)/)
    || t.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/) || t.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i) || t.match(/[?&](?:q|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (lien) return borne(+lien[1], +lien[2]);
  t = t.toUpperCase().replace(/[′’‘´]/g, "'").replace(/[″”“]|''/g, '"').replace(/[º˚]/g, '°').replace(/\bDEG\b/g, '°')
    .replace(/\bNORD\b/g, 'N').replace(/\bSUD\b/g, 'S').replace(/\bEST\b/g, 'E').replace(/\bOUEST\b/g, 'O');
  // virgule décimale à la française : « 43,6045, 1,4440 » ou « 43,6045 ; 1,4440 »
  if (!t.includes('.')) t = t.replace(/(\d),(\d)/g, '$1.$2');
  const avant = /^[NSEOW]\s*[-\d]/.test(t);
  const comps = [...t.matchAll(avant ? COMP_AVANT : COMP_APRES)].slice(0, 2)
    .map(m => avant ? { l: m[1], v: valeur(m[1], m[2], m[3], m[4]) } : { l: m[4] || '', v: valeur(m[4], m[1], m[2], m[3]) });
  if (comps.length < 2 || comps.some(c => c.v === null || !Number.isFinite(c.v))) return null;
  let [a, b] = comps;
  if (/[EOW]/.test(a.l) && /[NS]/.test(b.l)) [a, b] = [b, a];
  if (/[NS]/.test(a.l) && /[NS]/.test(b.l)) return null;
  if (/[EOW]/.test(a.l) && /[EOW]/.test(b.l)) return null;
  return borne(a.v, b.v);
}
function borne(lat, lon) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}
