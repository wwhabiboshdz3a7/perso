// Briques de dessin des scènes illustrées (SVG). Les scènes sont rendues en JPEG/PNG par
// outils/ctf/rendre_scenes.mjs : le fichier publié est une image, sans le texte source.

const POLICE = "'DejaVu Sans', 'Inter', 'FreeSans', sans-serif";
const POLICE_SERIF = "'DejaVu Serif', 'Caladea', serif";
export { POLICE, POLICE_SERIF };

// Générateur pseudo-aléatoire déterministe (les rendus sont reproductibles).
export function alea(graine = 1) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const f = n => +n.toFixed(1);

// Motifs et filtres communs
export const DEFS = `
<pattern id="briqueRose" width="56" height="22" patternUnits="userSpaceOnUse">
  <rect width="56" height="22" fill="#e4b8a0"/>
  <rect x="1" y="1" width="26" height="9" fill="#c8735a"/><rect x="29" y="1" width="26" height="9" fill="#d3846a"/>
  <rect x="-13" y="12" width="26" height="9" fill="#d07c62"/><rect x="15" y="12" width="26" height="9" fill="#bf6a52"/><rect x="43" y="12" width="26" height="9" fill="#c97a5f"/>
</pattern>
<pattern id="briqueRoseFine" width="28" height="11" patternUnits="userSpaceOnUse">
  <rect width="28" height="11" fill="#e2b59c"/>
  <rect x=".5" y=".5" width="13" height="4.5" fill="#c8735a"/><rect x="14.5" y=".5" width="13" height="4.5" fill="#d3866b"/>
  <rect x="-6.5" y="6" width="13" height="4.5" fill="#cf7b60"/><rect x="7.5" y="6" width="13" height="4.5" fill="#bd6850"/><rect x="21.5" y="6" width="13" height="4.5" fill="#c97a5f"/>
</pattern>
<pattern id="pierre" width="80" height="40" patternUnits="userSpaceOnUse">
  <rect width="80" height="40" fill="#d9cdb4"/><path d="M0 20H80M40 0V20M0 20V40M80 20V40M20 20V40M60 20V40" stroke="#bcae92" stroke-width="1.4"/>
</pattern>
<pattern id="pierreOcre" width="64" height="30" patternUnits="userSpaceOnUse">
  <rect width="64" height="30" fill="#cdb48a"/><path d="M0 15H64M24 0V15M8 15V30M48 15V30" stroke="#a88f66" stroke-width="1.3"/>
</pattern>
<pattern id="tuiles" width="18" height="12" patternUnits="userSpaceOnUse">
  <rect width="18" height="12" fill="#b4543b"/><path d="M0 12 Q9 2 18 12" fill="#c8664a" stroke="#93402c" stroke-width="1"/>
</pattern>
<pattern id="paves" width="40" height="20" patternUnits="userSpaceOnUse">
  <rect width="40" height="20" fill="#a9a29a"/><path d="M0 10H40M10 0V10M30 10V20" stroke="#8f887f" stroke-width="1.2"/>
</pattern>
<pattern id="dalles" width="60" height="60" patternUnits="userSpaceOnUse">
  <rect width="60" height="60" fill="#d8d2c6"/><path d="M0 0H60V60" fill="none" stroke="#b9b1a3" stroke-width="2"/>
</pattern>
<pattern id="ardoise" width="14" height="10" patternUnits="userSpaceOnUse">
  <rect width="14" height="10" fill="#4b5563"/><path d="M0 10 L7 3 L14 10" fill="none" stroke="#374151" stroke-width="1"/>
</pattern>
<filter id="grain" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" stitchTiles="stitch" result="b"/>
  <feColorMatrix type="saturate" values="0"/>
  <feComponentTransfer><feFuncA type="table" tableValues="0 0.10"/></feComponentTransfer>
</filter>
<filter id="flou2"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="flou6"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="flou14"><feGaussianBlur stdDeviation="14"/></filter>
<radialGradient id="vignette" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".38"/></radialGradient>
`;

export function svg(l, h, corps, { defs = '', grain = true, vignette = true } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${h}" viewBox="0 0 ${l} ${h}" font-family="${POLICE}"><defs>${DEFS}${defs}</defs>${corps}${vignette ? `<rect width="${l}" height="${h}" fill="url(#vignette)"/>` : ''}${grain ? `<rect width="${l}" height="${h}" filter="url(#grain)"/>` : ''}</svg>`;
}

export const degrade = (id, couleurs, vertical = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${couleurs.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('')}</linearGradient>`;

export function nuage(x, y, s = 1, op = 0.9, coul = '#fff') {
  return `<g transform="translate(${x} ${y}) scale(${s})" fill="${coul}" opacity="${op}"><ellipse cx="0" cy="0" rx="60" ry="22"/><ellipse cx="-40" cy="6" rx="38" ry="16"/><ellipse cx="42" cy="5" rx="44" ry="17"/><ellipse cx="8" cy="-14" rx="34" ry="20"/></g>`;
}

// Fenêtre à volets (Sud de la France)
export function fenetre(x, y, l, h, { volets = '#5b7f6e', cadre = '#efe6d6', ouverte = false, arc = false } = {}) {
  const v = l * 0.48;
  return `<g>${arc ? `<path d="M${x} ${y + l / 2} A${l / 2} ${l / 2} 0 0 1 ${x + l} ${y + l / 2} V${y + h} H${x} Z" fill="#2c3440"/>` : `<rect x="${x}" y="${y}" width="${l}" height="${h}" fill="#2c3440"/>`}
  <path d="M${x + l / 2} ${y} V${y + h} M${x} ${y + h * 0.55} H${x + l}" stroke="${cadre}" stroke-width="3"/>
  <rect x="${x - 3}" y="${y + h - 2}" width="${l + 6}" height="6" fill="${cadre}"/>
  ${volets ? (ouverte ? `<rect x="${x - v - 3}" y="${y}" width="${v}" height="${h}" fill="${volets}"/><rect x="${x + l + 3}" y="${y}" width="${v}" height="${h}" fill="${volets}"/>` : `<rect x="${x}" y="${y}" width="${l}" height="${h * 0.42}" fill="${volets}" opacity=".9"/>`) : ''}</g>`;
}

// Personnage stylisé (vu de face ou de dos) et son ombre portée (dx, dy = direction de l'ombre au sol)
export function personne(x, y, h = 120, { haut = '#334155', bas = '#1f2937', peau = '#d6a77a', cheveux = '#2a1d16', ombre = null, sac = false, ombreNette = false } = {}) {
  const k = h / 120;
  // ombre nette : silhouette allongée (jambes, corps, tête) projetée au sol dans la direction donnée
  const om = !ombre ? '' : !ombreNette ? `<path d="M${x - 12 * k} ${y} L${x + 12 * k} ${y} L${x + 12 * k + ombre[0] * k} ${y + ombre[1] * k} L${x - 12 * k + ombre[0] * k} ${y + ombre[1] * k} Z" fill="#000" opacity=".28" filter="url(#flou2)"/>`
    : (() => { const ex = x + ombre[0] * k, ey = y + ombre[1] * k, n = Math.hypot(ombre[0], ombre[1]) || 1, px = -ombre[1] / n, py = ombre[0] / n, w = 11 * k;
      return `<path d="M${f(x + px * w)} ${f(y + py * w)} L${f(ex + px * w * 1.2)} ${f(ey + py * w * 1.2)} L${f(ex - px * w * 1.2)} ${f(ey - py * w * 1.2)} L${f(x - px * w)} ${f(y - py * w)} Z" fill="#111827" opacity=".5"/><ellipse cx="${f(ex + (ombre[0] / n) * 8 * k)}" cy="${f(ey + (ombre[1] / n) * 8 * k)}" rx="${f(10 * k)}" ry="${f(6 * k)}" fill="#111827" opacity=".5" transform="rotate(${f(Math.atan2(ombre[1], ombre[0]) * 180 / Math.PI)} ${f(ex + (ombre[0] / n) * 8 * k)} ${f(ey + (ombre[1] / n) * 8 * k)})"/>`; })();
  return `${om}<g transform="translate(${x} ${y}) scale(${k})">
    <rect x="-11" y="-58" width="9" height="58" rx="4" fill="${bas}"/><rect x="2" y="-58" width="9" height="58" rx="4" fill="${bas}"/>
    <path d="M-17 -60 Q-18 -100 0 -102 Q18 -100 17 -60 Z" fill="${haut}"/>
    <rect x="-23" y="-98" width="7" height="40" rx="3.5" fill="${haut}"/><rect x="16" y="-98" width="7" height="40" rx="3.5" fill="${haut}"/>
    ${sac ? '<rect x="14" y="-80" width="16" height="20" rx="3" fill="#7c2d12"/>' : ''}
    <circle cx="0" cy="-112" r="11" fill="${peau}"/><path d="M-11 -114 Q0 -128 11 -114 Q8 -122 0 -123 Q-8 -122 -11 -114Z" fill="${cheveux}"/></g>`;
}

// Arbres
export function platane(x, y, h = 260, ombre = null) {
  const k = h / 260;
  return `${ombre ? `<ellipse cx="${x + ombre[0] * k}" cy="${y + 8 * k}" rx="${110 * k}" ry="${22 * k}" fill="#000" opacity=".22" filter="url(#flou6)"/>` : ''}<g transform="translate(${x} ${y}) scale(${k})">
    <path d="M-10 0 Q-6 -80 -14 -140 L6 -140 Q4 -80 12 0Z" fill="#b8ad93"/><path d="M-6 -40 q8 -6 14 2 M-8 -90 q10 -4 12 6" stroke="#8d846f" stroke-width="5" fill="none"/>
    <ellipse cx="-50" cy="-170" rx="70" ry="52" fill="#4d7c3a"/><ellipse cx="40" cy="-185" rx="78" ry="58" fill="#5a8a42"/><ellipse cx="0" cy="-225" rx="72" ry="50" fill="#669a4b"/><ellipse cx="-20" cy="-160" rx="50" ry="30" fill="#406b30" opacity=".7"/></g>`;
}
export function palmier(x, y, h = 300) {
  const k = h / 300;
  const palme = a => `<path d="M0 0 Q${f(Math.cos(a) * 70)} ${f(Math.sin(a) * 70 - 30)} ${f(Math.cos(a) * 130)} ${f(Math.sin(a) * 130 + 10)}" stroke="#3f7a3a" stroke-width="14" fill="none" stroke-linecap="round"/>`;
  return `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-8 0 Q-2 -150 10 -290 L18 -290 Q8 -150 8 0Z" fill="#8b6b48"/><g transform="translate(14 -290)">${[-2.8, -2.2, -1.6, -1.0, -0.4, 0.2, 3.4].map(palme).join('')}</g></g>`;
}
export function cypres(x, y, h = 240) {
  return `<path d="M${x} ${y} C${x - h * 0.13} ${y - h * 0.35} ${x - h * 0.09} ${y - h * 0.8} ${x} ${y - h} C${x + h * 0.09} ${y - h * 0.8} ${x + h * 0.13} ${y - h * 0.35} ${x} ${y}Z" fill="#2f4f2a"/>`;
}
export function olivier(x, y, h = 160) {
  const k = h / 160;
  return `<g transform="translate(${x} ${y}) scale(${k})"><path d="M-12 0 Q-20 -30 -6 -50 Q-16 -62 -4 -78 L6 -76 Q12 -50 4 -40 Q14 -20 14 0Z" fill="#5b4a36"/><ellipse cx="-30" cy="-95" rx="48" ry="30" fill="#5e7044"/><ellipse cx="28" cy="-100" rx="50" ry="32" fill="#6b7d4f"/><ellipse cx="0" cy="-125" rx="44" ry="26" fill="#7a8c5c"/><ellipse cx="-6" cy="-130" rx="26" ry="10" fill="#b7c4a0" opacity=".55"/><ellipse cx="30" cy="-104" rx="22" ry="8" fill="#b7c4a0" opacity=".45"/></g>`;
}
export function erable(x, y, h = 220) {
  const k = h / 220;
  return `<g transform="translate(${x} ${y}) scale(${k})"><rect x="-8" y="-110" width="16" height="110" fill="#5a4636"/><circle cx="-40" cy="-140" r="52" fill="#c2410c"/><circle cx="36" cy="-150" r="56" fill="#ea580c"/><circle cx="0" cy="-190" r="54" fill="#f59e0b"/><circle cx="-10" cy="-130" r="34" fill="#b91c1c" opacity=".7"/></g>`;
}

/* ---------- plaques d'immatriculation ---------- */
// France (SIV, depuis 2009) : bande bleue européenne à gauche (F), bande bleue à droite (logo régional + numéro de département)
export function plaqueFR(x, y, l, texte, dep, logo = 'occitanie') {
  const h = l * 0.22, b = l * 0.085;
  const etoiles = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${f(x + b / 2 + Math.cos(a) * b * 0.28)}" cy="${f(y + h * 0.36 + Math.sin(a) * b * 0.28)}" r="${f(b * 0.05)}" fill="#facc15"/>`; }).join('');
  const lg = logo === 'occitanie' ? `<path d="M${f(x + l - b * 0.72)} ${f(y + h * 0.18)} h${f(b * 0.44)} v${f(h * 0.3)} h${f(-b * 0.44)}z" fill="#dc2626"/><path d="M${f(x + l - b / 2)} ${f(y + h * 0.2)} v${f(h * 0.26)} M${f(x + l - b * 0.68)} ${f(y + h * 0.33)} h${f(b * 0.36)}" stroke="#facc15" stroke-width="${f(b * 0.08)}"/>` : `<circle cx="${f(x + l - b / 2)}" cy="${f(y + h * 0.33)}" r="${f(b * 0.22)}" fill="#fff"/>`;
  return `<g><rect x="${x}" y="${y}" width="${l}" height="${f(h)}" rx="${f(h * 0.12)}" fill="#f8fafc" stroke="#1f2937" stroke-width="${f(l * 0.008)}"/>
  <rect x="${x}" y="${y}" width="${f(b)}" height="${f(h)}" rx="${f(h * 0.1)}" fill="#1d4ed8"/>${etoiles}<text x="${f(x + b / 2)}" y="${f(y + h * 0.86)}" font-size="${f(h * 0.3)}" fill="#fff" text-anchor="middle" font-weight="700">F</text>
  <rect x="${f(x + l - b)}" y="${y}" width="${f(b)}" height="${f(h)}" rx="${f(h * 0.1)}" fill="#1d4ed8"/>${lg}<text x="${f(x + l - b / 2)}" y="${f(y + h * 0.88)}" font-size="${f(h * 0.32)}" fill="#fff" text-anchor="middle" font-weight="700">${dep}</text>
  <text x="${f(x + l / 2)}" y="${f(y + h * 0.74)}" font-size="${f(h * 0.56)}" fill="#111827" text-anchor="middle" font-weight="700" textLength="${f(l - 2 * b - l * 0.06)}" lengthAdjust="spacingAndGlyphs">${texte}</text></g>`;
}
// Algérie : chiffres noirs sur fond blanc, format « série catégorie+année wilaya »
export function plaqueDZ(x, y, l, texte) {
  const h = l * 0.22;
  return `<g><rect x="${x}" y="${y}" width="${l}" height="${f(h)}" rx="${f(h * 0.12)}" fill="#f8fafc" stroke="#111" stroke-width="${f(l * 0.01)}"/><text x="${f(x + l / 2)}" y="${f(y + h * 0.74)}" font-size="${f(h * 0.56)}" fill="#111" text-anchor="middle" font-weight="700" textLength="${f(l * 0.86)}" lengthAdjust="spacingAndGlyphs">${texte}</text></g>`;
}
// Afrique du Sud (Cap-Occidental) : « CA » = Cape Town
export function plaqueZA(x, y, l, texte) {
  const h = l * 0.22;
  return `<g><rect x="${x}" y="${y}" width="${l}" height="${f(h)}" rx="${f(h * 0.12)}" fill="#fefce8" stroke="#111" stroke-width="${f(l * 0.01)}"/><text x="${f(x + l / 2)}" y="${f(y + h * 0.7)}" font-size="${f(h * 0.56)}" fill="#111" text-anchor="middle" font-weight="700" textLength="${f(l * 0.84)}" lengthAdjust="spacingAndGlyphs">${texte}</text><text x="${f(x + l / 2)}" y="${f(y + h * 0.94)}" font-size="${f(h * 0.17)}" fill="#1e3a8a" text-anchor="middle" font-weight="700" letter-spacing="1">WESTERN CAPE</text></g>`;
}
// Québec : texte bleu, devise « Je me souviens »
export function plaqueQC(x, y, l, texte) {
  const h = l * 0.5;
  return `<g><rect x="${x}" y="${y}" width="${l}" height="${f(h)}" rx="${f(h * 0.1)}" fill="#f8fafc" stroke="#1e3a8a" stroke-width="${f(l * 0.012)}"/><text x="${f(x + l / 2)}" y="${f(y + h * 0.24)}" font-size="${f(h * 0.17)}" fill="#1e40af" text-anchor="middle" font-weight="700">QUÉBEC</text><text x="${f(x + l / 2)}" y="${f(y + h * 0.7)}" font-size="${f(h * 0.4)}" fill="#1e3a8a" text-anchor="middle" font-weight="700">${texte}</text><text x="${f(x + l / 2)}" y="${f(y + h * 0.92)}" font-size="${f(h * 0.14)}" fill="#1e40af" text-anchor="middle" font-style="italic">Je me souviens</text></g>`;
}

/* ---------- voitures ---------- */
// Voiture vue de l'arrière (elle s'éloigne) ou de l'avant (elle arrive). plaque(x, y, l) dessine la plaque.
export function voiture(cx, base, l, { couleur = '#2563eb', vue = 'arriere', plaque = null, ombre = [0, 0] } = {}) {
  const h = l * 0.62, x = cx - l / 2, y = base - h;
  const vitre = vue === 'arriere' ? '#1e293b' : '#334155';
  const feux = vue === 'arriere' ? '#dc2626' : '#fef3c7';
  const pl = plaque ? plaque(f(cx - l * 0.23), f(y + h * 0.64), f(l * 0.46)) : '';
  return `<ellipse cx="${f(cx + ombre[0])}" cy="${f(base + 2 + ombre[1])}" rx="${f(l * 0.58)}" ry="${f(l * 0.07)}" fill="#000" opacity=".3" filter="url(#flou2)"/>
  <g><rect x="${f(x + l * 0.06)}" y="${f(base - l * 0.08)}" width="${f(l * 0.16)}" height="${f(l * 0.1)}" rx="3" fill="#111"/><rect x="${f(x + l * 0.78)}" y="${f(base - l * 0.08)}" width="${f(l * 0.16)}" height="${f(l * 0.1)}" rx="3" fill="#111"/>
  <path d="M${f(x + l * 0.16)} ${f(y + h * 0.38)} L${f(x + l * 0.26)} ${f(y)} H${f(x + l * 0.74)} L${f(x + l * 0.84)} ${f(y + h * 0.38)}Z" fill="${couleur}"/>
  <path d="M${f(x + l * 0.21)} ${f(y + h * 0.36)} L${f(x + l * 0.29)} ${f(y + h * 0.06)} H${f(x + l * 0.71)} L${f(x + l * 0.79)} ${f(y + h * 0.36)}Z" fill="${vitre}"/>
  <rect x="${f(x)}" y="${f(y + h * 0.36)}" width="${l}" height="${f(h * 0.52)}" rx="${f(l * 0.06)}" fill="${couleur}"/>
  <rect x="${f(x + l * 0.04)}" y="${f(y + h * 0.46)}" width="${f(l * 0.16)}" height="${f(h * 0.12)}" rx="3" fill="${feux}"/><rect x="${f(x + l * 0.8)}" y="${f(y + h * 0.46)}" width="${f(l * 0.16)}" height="${f(h * 0.12)}" rx="3" fill="${feux}"/>
  <rect x="${f(x + l * 0.02)}" y="${f(y + h * 0.8)}" width="${f(l * 0.96)}" height="${f(h * 0.1)}" rx="4" fill="#1f2937" opacity=".85"/>${pl}</g>`;
}
// Voiture de profil (sens = 1 vers la droite, -1 vers la gauche) ; volant visible à travers la vitre avant.
export function voitureProfil(x, base, l, { couleur = '#dc2626', sens = 1, volant = true, ombre = [0, 0] } = {}) {
  const h = l * 0.36;
  const g = `<ellipse cx="${f(l / 2 + ombre[0])}" cy="${f(2 + ombre[1])}" rx="${f(l * 0.55)}" ry="${f(l * 0.05)}" fill="#000" opacity=".3" filter="url(#flou2)"/>
    <path d="M${f(l * 0.03)} ${f(-h * 0.3)} Q0 ${f(-h * 0.62)} ${f(l * 0.1)} ${f(-h * 0.64)} L${f(l * 0.3)} ${f(-h * 0.68)} L${f(l * 0.42)} ${f(-h)} H${f(l * 0.72)} L${f(l * 0.86)} ${f(-h * 0.66)} Q${f(l)} ${f(-h * 0.62)} ${f(l * 0.99)} ${f(-h * 0.3)} V${f(-h * 0.14)} H${f(l * 0.01)}Z" fill="${couleur}"/>
    <path d="M${f(l * 0.45)} ${f(-h * 0.94)} H${f(l * 0.56)} V${f(-h * 0.68)} H${f(l * 0.36)}Z" fill="#334155"/><path d="M${f(l * 0.59)} ${f(-h * 0.94)} H${f(l * 0.7)} L${f(l * 0.82)} ${f(-h * 0.68)} H${f(l * 0.59)}Z" fill="#334155"/>
    ${volant ? `<circle cx="${f(l * 0.665)}" cy="${f(-h * 0.74)}" r="${f(l * 0.035)}" fill="none" stroke="#e5e7eb" stroke-width="${f(l * 0.012)}"/>` : ''}
    <circle cx="${f(l * 0.2)}" cy="${f(-h * 0.12)}" r="${f(l * 0.085)}" fill="#111"/><circle cx="${f(l * 0.2)}" cy="${f(-h * 0.12)}" r="${f(l * 0.04)}" fill="#9ca3af"/><circle cx="${f(l * 0.8)}" cy="${f(-h * 0.12)}" r="${f(l * 0.085)}" fill="#111"/><circle cx="${f(l * 0.8)}" cy="${f(-h * 0.12)}" r="${f(l * 0.04)}" fill="#9ca3af"/>
    <rect x="${f(l * 0.93)}" y="${f(-h * 0.52)}" width="${f(l * 0.06)}" height="${f(h * 0.1)}" rx="2" fill="#fef3c7"/><rect x="${f(l * 0.01)}" y="${f(-h * 0.52)}" width="${f(l * 0.05)}" height="${f(h * 0.1)}" rx="2" fill="#dc2626"/>`;
  // sens 1 : l'avant (phares) à droite. Le volant est dessiné du côté conducteur : à gauche du véhicule (vitre avant côté droit du dessin quand on voit le flanc gauche)
  return `<g transform="translate(${sens === 1 ? x : x + l} ${base}) scale(${sens} 1)">${g}</g>`;
}

/* ---------- panneaux ---------- */
export function poteau(x, y1, y2, l = 8, c = '#6b7280') { return `<rect x="${x - l / 2}" y="${y1}" width="${l}" height="${y2 - y1}" fill="${c}"/>`; }
export function texte(x, y, t, { taille = 20, coul = '#111', ancre = 'middle', gras = true, police = null, italique = false, ls = 0, op = 1, transform = '' } = {}) {
  return `<text x="${x}" y="${y}" font-size="${taille}" fill="${coul}" text-anchor="${ancre}" ${gras ? 'font-weight="700"' : ''} ${italique ? 'font-style="italic"' : ''} ${police ? `font-family="${police}"` : ''} ${ls ? `letter-spacing="${ls}"` : ''} ${op < 1 ? `opacity="${op}"` : ''} ${transform ? `transform="${transform}"` : ''}>${t}</text>`;
}
// Ombre portée d'un objet vertical de base (x, y), hauteur h, direction (dx, dy) par unité de hauteur.
export function ombreVerticale(x, y, h, dx, dy, l = 8, op = 0.3) {
  return `<path d="M${x - l / 2} ${y} L${f(x - l / 2 + dx * h)} ${f(y + dy * h)} L${f(x + l / 2 + dx * h)} ${f(y + dy * h)} L${x + l / 2} ${y}Z" fill="#000" opacity="${op}"/>`;
}
