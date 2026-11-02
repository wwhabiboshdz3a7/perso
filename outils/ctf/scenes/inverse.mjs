// Images des défis « recherche inversée & vérification » : photo virale ressortie, image retournée,
// recadrage trompeur, photomontage aux ombres incohérentes, image générée. Fichier d'auteur : jamais publié.
import { svg, degrade, nuage, palmier, personne, platane, fenetre, voiture, plaqueFR, poteau, texte, alea, f } from './_base.mjs';

const L = 1600, H = 1000;

/* ---------- 1. L'orage « de ce matin » ---------- */
function orage({ legende = false, filigrane = false } = {}) {
  const r = alea(21);
  const pluie = Array.from({ length: 160 }, () => { const x = r() * 1700 - 50, y = r() * 900; return `<path d="M${f(x)} ${f(y)} l-8 26" stroke="#cbd5e1" stroke-width="1.5" opacity="${f(0.15 + r() * 0.3)}"/>`; }).join('');
  const lampes = [180, 520, 860, 1200].map(x => `<rect x="${x - 4}" y="560" width="8" height="200" fill="#1f2937"/><circle cx="${x}" cy="556" r="12" fill="#fde68a"/><circle cx="${x}" cy="556" r="46" fill="#fde68a" opacity=".22" filter="url(#flou6)"/><rect x="${x - 10}" y="770" width="20" height="200" fill="#fde68a" opacity=".12" filter="url(#flou6)"/>`).join('');
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielOrage)"/>
  ${nuage(300, 120, 3, 0.5, '#312e81')}${nuage(1100, 90, 3.4, 0.55, '#1e1b4b')}${nuage(700, 200, 2.6, 0.45, '#3b3577')}
  <path d="M960 110 L900 300 L950 300 L870 520 L1010 260 L955 262 L1010 110Z" fill="#f5f3ff"/><path d="M960 110 L900 300 L950 300 L870 520 L1010 260 L955 262 L1010 110Z" fill="#c4b5fd" opacity=".7" filter="url(#flou14)"/>
  <path d="M905 300 L840 360 M930 380 L980 420" stroke="#ede9fe" stroke-width="3"/>
  <rect y="560" width="${L}" height="160" fill="url(#mer)"/><path d="M0 560 H1600" stroke="#a5b4fc" stroke-width="2" opacity=".6"/>
  <!-- phare -->
  <path d="M1400 560 L1420 360 H1460 L1480 560Z" fill="#e5e7eb"/><path d="M1405 500 H1475 L1470 450 H1410Z M1414 410 H1466 L1462 380 H1418Z" fill="#b91c1c"/><rect x="1414" y="330" width="52" height="32" fill="#fde68a"/><path d="M1440 346 L1100 300 L1100 390Z" fill="#fde68a" opacity=".18"/>
  ${palmier(90, 760, 330)}${palmier(1540, 770, 300)}
  <rect y="720" width="${L}" height="280" fill="#334155"/><rect y="720" width="${L}" height="280" fill="url(#reflet)"/>
  ${lampes}${pluie}
  <path d="M0 720 H1600" stroke="#64748b" stroke-width="10"/>${Array.from({ length: 40 }, (_, i) => `<rect x="${i * 40 + 4}" y="690" width="5" height="30" fill="#475569"/>`).join('')}<path d="M0 690 H1600" stroke="#64748b" stroke-width="6"/>
  ${personne(700, 900, 130, { haut: '#facc15' })}<path d="M640 770 Q700 720 760 770Z" fill="#dc2626"/><path d="M700 770 V790" stroke="#111" stroke-width="3"/>
  ${legende ? `<rect x="0" y="0" width="${L}" height="120" fill="#dc2626"/>${texte(800, 78, 'TOULOUSE CE MATIN !!! INCROYABLE, PARTAGEZ', { taille: 52, coul: '#fff' })}` : ''}
  ${filigrane ? `<g opacity=".35" transform="rotate(-24 800 500)">${texte(800, 420, '© BANQUE-IMAGES', { taille: 120, coul: '#fff' })}${texte(800, 620, 'APERÇU · NE PAS DIFFUSER', { taille: 60, coul: '#fff' })}</g>` : ''}
  `, { defs: degrade('cielOrage', [[0, '#0f0c29'], [0.6, '#302b63'], [1, '#4c4a8f']]) + degrade('mer', [[0, '#3730a3'], [1, '#1e1b4b']]) + degrade('reflet', [[0, '#a5b4fc', 0.25], [1, '#0f172a', 0]]) });
}

/* ---------- 2. La rue « de Londres » (image retournée) ---------- */
function rue() {
  const VX = 800, VY = 560;
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielRue)"/>${nuage(1200, 110, 1.1, 0.8)}
  <!-- mairie (à gauche dans l'original) -->
  <rect x="0" y="200" width="560" height="460" fill="url(#pierre)"/><path d="M-10 200 L280 90 L570 200Z" fill="#475569"/>
  ${[60, 200, 340, 480].map(x => fenetre(x - 30, 260, 60, 110, { volets: '#1e3a8a', ouverte: true })).join('')}
  <rect x="80" y="410" width="400" height="58" fill="#1e3a8a"/>${texte(280, 450, 'MAIRIE DE VALDORNE', { taille: 30, coul: '#fff', ls: 2 })}
  <path d="M240 660 V560 A40 40 0 0 1 320 560 V660Z" fill="#3f3a33"/>
  <path d="M280 90 V40" stroke="#334155" stroke-width="4"/><path d="M282 42 h44 v26 h-44z" fill="#1d4ed8"/><path d="M296 42 h15 v26 h-15z" fill="#fff"/><path d="M311 42 h15 v26 h-15z" fill="#dc2626"/>
  <!-- commerces (à droite) -->
  <rect x="1040" y="160" width="560" height="500" fill="#f1e5d1"/>${[1080, 1240, 1400].map(x => fenetre(x, 220, 70, 110, { volets: '#65a30d', ouverte: false })).join('')}
  <rect x="1040" y="440" width="560" height="64" fill="#7c2d12"/>${texte(1320, 484, 'BOULANGERIE DU MARCHÉ', { taille: 30, coul: '#fde68a' })}
  <rect x="1060" y="520" width="200" height="140" fill="#93c5fd" opacity=".7"/><rect x="1300" y="520" width="140" height="140" fill="#3f3a33"/><rect x="1470" y="520" width="110" height="140" fill="#93c5fd" opacity=".7"/>
  ${texte(1160, 600, 'Ouvert 7j/7', { taille: 22, coul: '#7c2d12' })}
  <!-- chaussée : circulation à droite -->
  <path d="M0 1000 V660 H${VX - 260} L${VX} ${VY} L${VX + 260} 660 H1600 V1000Z" fill="#9ca3af"/>
  <path d="M260 1000 L${VX} ${VY} L1340 1000Z" fill="#475569"/><path d="M${VX} 1000 L${VX} ${VY}" stroke="#f8fafc" stroke-width="7" stroke-dasharray="40 36"/>
  ${voiture(1010, 960, 280, { couleur: '#1d4ed8', vue: 'arriere', plaque: (x, y, l) => plaqueFR(x, y, l, 'GT-208-LM', '31') })}
  ${voiture(700, 720, 130, { couleur: '#e5e7eb', vue: 'avant', plaque: (x, y, l) => plaqueFR(x, y, l, 'FB-771-KC', '31') })}
  ${poteau(1480, 600, 900, 10)}<circle cx="1480" cy="580" r="44" fill="#fff" stroke="#dc2626" stroke-width="12"/>${texte(1480, 594, '30', { taille: 40, coul: '#111' })}
  ${personne(160, 900, 140, { haut: '#0f766e', ombre: [40, 10] })}${personne(1560, 930, 140, { haut: '#7c2d12', ombre: [40, 10] })}
  `, { defs: degrade('cielRue', [[0, '#60a5fa'], [1, '#e0f2fe']]) });
}

/* ---------- 3. La foule (recadrage trompeur) ---------- */
function foule() {
  const r = alea(33);
  const couleurs = ['#1e3a8a', '#7c2d12', '#065f46', '#be185d', '#a16207', '#334155', '#6d28d9', '#0f766e', '#b91c1c'];
  const gens = [];
  for (let i = 0; i < 46; i++) { const x = 560 + r() * 480, y = 640 + r() * 220; gens.push([x, y]); }
  for (let i = 0; i < 9; i++) gens.push([120 + r() * 300, 700 + r() * 200], [1150 + r() * 330, 700 + r() * 200]);
  gens.sort((a, b) => a[1] - b[1]);
  const lanternes = Array.from({ length: 14 }, (_, i) => { const x = 140 + i * 95, y = 210 + Math.sin(i * 0.8) * 26; return `<path d="M${x - 40} ${y - 30} Q${x} ${y + 10} ${x + 55} ${y - 30}" stroke="#1f2937" stroke-width="2" fill="none"/><ellipse cx="${x}" cy="${y}" rx="18" ry="24" fill="${['#f97316', '#facc15', '#ef4444', '#a855f7'][i % 4]}"/><ellipse cx="${x}" cy="${y}" rx="34" ry="40" fill="#fde68a" opacity=".25" filter="url(#flou6)"/>`; }).join('');
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielFete)"/>
  <rect x="0" y="300" width="1600" height="300" fill="#4b5563"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 100 + 20}" y="330" width="40" height="60" fill="#fde68a" opacity="${i % 3 ? 0.6 : 0.2}"/><rect x="${i * 100 + 20}" y="440" width="40" height="60" fill="#fde68a" opacity="${i % 2 ? 0.5 : 0.15}"/>`).join('')}
  ${lanternes}
  <!-- scène et banderole -->
  <rect x="540" y="430" width="520" height="190" fill="#111827"/><rect x="560" y="450" width="480" height="120" fill="#7c2d12"/>
  ${texte(800, 500, 'FÊTE DES LANTERNES', { taille: 40, coul: '#fde68a', ls: 2 })}${texte(800, 548, 'Place du Marché · 21 h', { taille: 24, coul: '#fff', gras: false })}
  <rect y="600" width="${L}" height="400" fill="#57534e"/><rect y="600" width="${L}" height="400" fill="url(#solFete)"/>
  ${gens.map(([x, y], i) => personne(f(x), f(y), f(70 + (y - 620) * 0.45), { haut: couleurs[i % couleurs.length], bas: '#111827' })).join('')}
  ${platane(60, 700, 300)}${platane(1560, 710, 320)}
  <!-- grands espaces vides de part et d'autre -->
  ${Array.from({ length: 6 }, (_, i) => `<rect x="${100 + i * 40}" y="${930}" width="20" height="20" rx="4" fill="#a8a29e"/>`).join('')}
  `, { defs: degrade('cielFete', [[0, '#0b1026'], [1, '#3b2c5c']]) + degrade('solFete', [[0, '#000', 0.3], [1, '#000', 0]]) });
}

/* ---------- 4. Le photomontage (ombres incohérentes) ---------- */
function montage() {
  // soleil en haut à gauche : toutes les ombres partent vers la droite… sauf B (collé), et D n'en a aucune.
  const etiquette = (x, y, l) => `<circle cx="${x}" cy="${y}" r="24" fill="#fff" stroke="#111827" stroke-width="4"/>${texte(x, y + 10, l, { taille: 28, coul: '#111827' })}`;
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielPlage)"/><circle cx="160" cy="120" r="70" fill="#fef9c3"/><circle cx="160" cy="120" r="140" fill="#fef08a" opacity=".3" filter="url(#flou14)"/>
  ${nuage(700, 140, 1.2, 0.85)}${nuage(1300, 90, 1, 0.8)}
  <rect y="460" width="${L}" height="140" fill="#0ea5e9"/><path d="M0 470 Q400 455 800 470 T1600 466" stroke="#e0f2fe" stroke-width="3" fill="none"/>
  <rect y="590" width="${L}" height="410" fill="#f3d9a4"/><path d="M0 600 Q400 580 800 600 T1600 596" stroke="#fef3c7" stroke-width="6" fill="none"/>
  <!-- A : palmier, ombre vers la droite -->
  <path d="M240 900 L620 930 L640 912 L262 884Z" fill="#000" opacity=".22"/>${palmier(250, 900, 380)}
  <!-- B : personne collée, ombre vers la GAUCHE -->
  ${personne(620, 880, 200, { haut: '#be185d', ombre: [-150, 30] })}
  <!-- C : banc, ombre vers la droite -->
  <path d="M860 870 h200 l120 30 h-200z" fill="#000" opacity=".22"/><rect x="860" y="820" width="200" height="16" fill="#92400e"/><rect x="860" y="790" width="200" height="14" fill="#92400e"/><rect x="872" y="836" width="10" height="34" fill="#78350f"/><rect x="1038" y="836" width="10" height="34" fill="#78350f"/>
  <!-- D : chien sans ombre, éclairé par la droite -->
  <g transform="translate(1180 860)"><ellipse cx="0" cy="-40" rx="70" ry="34" fill="#a16207"/><ellipse cx="20" cy="-46" rx="50" ry="20" fill="#ca8a04"/><circle cx="66" cy="-78" r="28" fill="#a16207"/><circle cx="76" cy="-84" r="18" fill="#eab308"/><path d="M50 -100 l10 -24 l14 20z" fill="#78350f"/><rect x="-50" y="-20" width="12" height="20" fill="#a16207"/><rect x="40" y="-20" width="12" height="20" fill="#a16207"/><path d="M-66 -50 q-30 -20 -20 -40" stroke="#a16207" stroke-width="10" fill="none"/></g>
  <!-- E : lampadaire, ombre vers la droite -->
  <path d="M1450 900 L1590 940 L1598 930 L1458 892Z" fill="#000" opacity=".25"/><rect x="1446" y="560" width="10" height="340" fill="#374151"/><path d="M1446 566 h-40" stroke="#374151" stroke-width="8"/><ellipse cx="1404" cy="574" rx="16" ry="8" fill="#e5e7eb"/>
  ${personne(420, 960, 130, { haut: '#1e3a8a', ombre: [110, 20] })}
  ${etiquette(250, 470, 'A')}${etiquette(620, 640, 'B')}${etiquette(960, 750, 'C')}${etiquette(1180, 740, 'D')}${etiquette(1450, 520, 'E')}
  `, { defs: degrade('cielPlage', [[0, '#38bdf8'], [1, '#e0f2fe']]) });
}

/* ---------- 5. L'image générée ---------- */
function generee() {
  // indices visuels typiques : six doigts, texte illisible, boucles d'oreilles différentes, roue fondue, lignes qui ondulent
  const main = `<g transform="translate(700 330) rotate(-10)"><ellipse cx="0" cy="40" rx="62" ry="70" fill="#e0b48c"/>${[-48, -26, -4, 18, 40, 60].map((x, i) => `<rect x="${x - 9}" y="${-70 + Math.abs(i - 2.5) * 10}" width="18" height="${96 - Math.abs(i - 2.5) * 8}" rx="9" fill="#e0b48c"/>`).join('')}<rect x="-90" y="20" width="30" height="80" rx="15" fill="#e0b48c" transform="rotate(-30 -75 60)"/></g>`;
  return svg(1024, 1024, `
  <rect width="1024" height="1024" fill="url(#cielIA)"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 120} 120 Q${i * 120 + 30} 300 ${i * 120 - 10} 520" stroke="#cbd5e1" stroke-width="10" fill="none" opacity=".6"/>`).join('')}
  <rect x="0" y="120" width="1024" height="400" fill="#e7d3c0" opacity=".85"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${40 + i * 170} 180 q20 -10 60 4 v110 q-30 14 -60 -4z" fill="#475569" opacity=".8"/>`).join('')}
  <rect x="160" y="40" width="700" height="96" rx="12" fill="#7c3aed"/>${texte(510, 104, 'LUMOI FESTVAL 2O2G', { taille: 52, coul: '#fef3c7', ls: 3 })}<path d="M300 80 q20 -20 40 0 M640 96 q10 14 30 0" stroke="#fef3c7" stroke-width="5" fill="none"/>
  <rect y="760" width="1024" height="264" fill="#9ca3af"/>
  <!-- personnage -->
  <g transform="translate(512 600)"><path d="M-200 424 Q-190 160 0 150 Q190 160 200 424Z" fill="#0e7490"/><rect x="-36" y="90" width="72" height="70" fill="#e0b48c"/>
    <ellipse cx="0" cy="0" rx="130" ry="150" fill="#e0b48c"/><path d="M-140 10 Q-150 -170 0 -176 Q150 -170 140 10 Q120 -90 0 -110 Q-110 -90 -140 10Z" fill="#7c2d12"/>
    <ellipse cx="-46" cy="-6" rx="14" ry="10" fill="#1f2937"/><ellipse cx="46" cy="-10" rx="16" ry="9" fill="#1f2937"/><path d="M-40 80 Q0 104 40 80" stroke="#9f3a3a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <circle cx="-132" cy="40" r="12" fill="#facc15"/><path d="M132 30 l10 30 l-20 0z" fill="#38bdf8"/></g>
  <path d="M590 470 Q640 520 660 600" stroke="#0e7490" stroke-width="70" fill="none" stroke-linecap="round"/>${main}
  <!-- vélo à la roue « fondue » -->
  <g transform="translate(150 830)"><ellipse cx="0" cy="0" rx="80" ry="64" fill="none" stroke="#111827" stroke-width="10" transform="rotate(20)"/><path d="M160 0 q40 -70 90 -10 q-20 70 -90 10z" fill="none" stroke="#111827" stroke-width="10"/><path d="M0 0 L80 -80 L170 -80 L160 0 M80 -80 L100 0" stroke="#ef4444" stroke-width="12" fill="none"/></g>
  `, { defs: degrade('cielIA', [[0, '#a5b4fc'], [1, '#fbcfe8']]), grain: false });
}

export default [
  { nom: 'inv-orage', l: L, h: H, svg: () => orage(), qualite: 88,
    variantes: [{ suffixe: '-viral', svg: () => orage({ legende: true }), qualite: 45 }, { suffixe: '-filigrane', svg: () => orage({ filigrane: true }), qualite: 70 }] },
  { nom: 'inv-rue', l: L, h: H, svg: rue, variantes: [{ suffixe: '-miroir', miroir: true, qualite: 78 }] },
  { nom: 'inv-foule', l: L, h: H, svg: foule, variantes: [{ suffixe: '-recadree', cadre: [548, 606, 500, 360], qualite: 80 }] },
  { nom: 'inv-montage', l: L, h: H, svg: montage },
  { nom: 'inv-generee', l: 1024, h: 1024, svg: generee, format: 'png',
    textesPNG: [['Software', 'PixelReve 3 (generateur d\'images)'], ['Description', 'prompt: mascotte qui salue devant une banderole de festival, photo realiste, 35 mm'], ['Comment', 'IPTC DigitalSourceType: http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia']] }
];
