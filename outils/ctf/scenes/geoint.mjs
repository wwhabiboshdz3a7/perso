// Scènes de géolocalisation. Chaque scène contient de vrais indices (langue, plaques, signalisation,
// architecture, végétation, soleil et ombres). Fichier d'auteur : jamais publié.
import { svg, degrade, nuage, fenetre, personne, platane, palmier, cypres, olivier, erable, plaqueFR, plaqueDZ, plaqueZA, plaqueQC, voiture, voitureProfil, poteau, texte, alea, f, POLICE_SERIF } from './_base.mjs';

const L = 1600, H = 1000;

/* ============ 1. Place du Capitole, Toulouse ============ */
function capitole() {
  const r = alea(11);
  const fen = [];
  for (let x = 180; x < 1440; x += 104) {
    if (x > 500 && x < 1100) continue;
    fen.push(fenetre(x, 372, 46, 92, { volets: null, cadre: '#f2ead9' }), fenetre(x, 560, 46, 100, { volets: null, cadre: '#f2ead9' }));
    fen.push(`<rect x="${x - 8}" y="364" width="62" height="10" fill="#efe6d4"/><rect x="${x - 8}" y="552" width="62" height="10" fill="#efe6d4"/>`);
  }
  const colonnes = Array.from({ length: 8 }, (_, i) => {
    const x = 552 + i * 70;
    return `<rect x="${x}" y="332" width="34" height="356" fill="#b9505f"/><rect x="${x + 6}" y="332" width="7" height="356" fill="#d77d8a" opacity=".7"/><rect x="${x - 6}" y="322" width="46" height="12" fill="#efe6d4"/><rect x="${x - 6}" y="686" width="46" height="12" fill="#efe6d4"/>`;
  }).join('');
  const fenCentre = Array.from({ length: 7 }, (_, i) => fenetre(596 + i * 70, 400, 22, 120, { volets: null, cadre: '#f2ead9' })).join('');
  const balustre = (x0, x1, y) => `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="6" fill="#efe6d4"/>` + Array.from({ length: Math.floor((x1 - x0) / 14) }, (_, i) => `<rect x="${x0 + 4 + i * 14}" y="${y + 6}" width="6" height="16" rx="3" fill="#e9dfcb"/>`).join('') + `<rect x="${x0}" y="${y + 22}" width="${x1 - x0}" height="6" fill="#efe6d4"/>`;
  const croix = (() => {
    // croix occitane (croix de Toulouse) : quatre bras évasés terminés chacun par trois pommeaux
    const bras = a => `<g transform="rotate(${a})"><path d="M-26 -30 L-70 -205 Q0 -180 70 -205 L26 -30Z"/><circle cx="-62" cy="-222" r="17"/><circle cx="0" cy="-232" r="17"/><circle cx="62" cy="-222" r="17"/></g>`;
    const zodiaque = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${f(Math.cos(a) * 300)}" cy="${f(Math.sin(a) * 300)}" r="22" fill="none" stroke="#9a7334" stroke-width="5"/>`; }).join('');
    return `<g transform="translate(800 880) scale(1.15 0.27)" fill="#a8803f" stroke="#7d5c27" stroke-width="4"><circle r="330" fill="none" stroke="#9a7334" stroke-width="8"/>${zodiaque}${[0, 90, 180, 270].map(bras).join('')}<circle r="34"/></g>`;
  })();
  const gens = [[300, 905, 112], [420, 860, 92], [1010, 930, 124], [1120, 870, 96], [650, 845, 84], [1240, 905, 110], [520, 960, 130], [900, 828, 78]]
    .map(([x, y, h], i) => personne(x, y, h, { haut: ['#1e3a8a', '#7c2d12', '#334155', '#be185d', '#065f46', '#4b5563', '#a16207', '#0f766e'][i], ombre: [34, -26], sac: i % 3 === 0 }));
  const pigeons = Array.from({ length: 14 }, () => { const x = 200 + r() * 1100, y = 900 + r() * 80; return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="4.5" fill="#6b7280"/><circle cx="${f(x + 6)}" cy="${f(y - 4)}" r="3" fill="#4b5563"/>`; }).join('');
  const lignes = Array.from({ length: 15 }, (_, i) => { const x = -600 + i * 200; return `<path d="M800 760 L${x} 1000" stroke="#c6bba8" stroke-width="2"/>`; }).join('') + [790, 815, 850, 900, 965].map(y => `<path d="M0 ${y}H1600" stroke="#c6bba8" stroke-width="2"/>`).join('');
  const drapeau = (x, coul) => `<path d="M${x} 120 V236" stroke="#d1d5db" stroke-width="4"/>${coul}`;
  return svg(L, H, `
  <rect width="${L}" height="760" fill="url(#ciel)"/>${nuage(260, 120, 1.3)}${nuage(1180, 90, 1.1, 0.8)}${nuage(1450, 200, 0.8, 0.7)}
  <rect x="140" y="300" width="1320" height="400" fill="url(#briqueRose)"/>
  <rect x="140" y="290" width="1320" height="16" fill="#efe6d4"/>${balustre(140, 1460, 262)}<rect x="140" y="520" width="1320" height="12" fill="#efe6d4"/>
  ${fen.join('')}
  <rect x="520" y="226" width="560" height="472" fill="url(#briqueRose)"/><rect x="520" y="226" width="560" height="472" fill="#fff" opacity=".08"/>
  <rect x="512" y="292" width="576" height="32" fill="#efe6d4"/>${balustre(520, 1080, 196)}
  <path d="M720 196 L800 150 L880 196Z" fill="#efe6d4"/><rect x="760" y="226" width="80" height="60" fill="#e4d6bb"/>
  ${drapeau(740, '<path d="M742 122 h60 v36 h-60z" fill="#1d4ed8"/><path d="M762 122 h20 v36 h-20z" fill="#fff"/><path d="M782 122 h20 v36 h-20z" fill="#dc2626"/>')}
  ${drapeau(800, '<path d="M802 122 h60 v36 h-60z" fill="#1e40af"/>' + Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${f(832 + Math.cos(a) * 11)}" cy="${f(140 + Math.sin(a) * 11)}" r="1.8" fill="#facc15"/>`; }).join(''))}
  ${drapeau(860, '<path d="M862 122 h60 v36 h-60z" fill="#b91c1c"/><path d="M892 128 v24 M880 140 h24" stroke="#facc15" stroke-width="5"/>')}
  ${fenCentre}${colonnes}
  <rect x="140" y="690" width="1320" height="80" fill="#e8dcc4"/>
  ${[640, 760, 880].map(x => `<path d="M${x} 770 V722 A40 40 0 0 1 ${x + 80} 722 V770Z" fill="#3a2f2a"/>`).join('')}
  ${Array.from({ length: 10 }, (_, i) => `<path d="M${180 + i * 128} 770 V735 A22 22 0 0 1 ${224 + i * 128} 735 V770Z" fill="#4a3f38" opacity="${i > 3 && i < 7 ? 0 : 1}"/>`).join('')}
  <!-- immeubles latéraux -->
  <path d="M0 210 L150 250 V780 L0 800Z" fill="url(#briqueRose)"/><path d="M0 210 L150 250 V780 L0 800Z" fill="#000" opacity=".18"/>
  <path d="M1450 250 L1600 210 V800 L1450 780Z" fill="url(#briqueRose)"/><path d="M1450 250 L1600 210 V800 L1450 780Z" fill="#000" opacity=".12"/>
  <rect x="1460" y="600" width="140" height="56" fill="#14532d"/><path d="M1452 656 h156 l-14 36 h-128z" fill="#166534"/>${Array.from({ length: 6 }, (_, i) => `<path d="M${1466 + i * 22} 656 h11 l-2 36 h-11z" fill="#f0fdf4" opacity=".85"/>`).join('')}
  ${texte(1530, 622, 'CAFÉ DES', { taille: 15, coul: '#fef3c7' })}${texte(1530, 642, 'CAPITOULS', { taille: 15, coul: '#fef3c7' })}
  <rect x="1462" y="700" width="134" height="26" rx="4" fill="#fef3c7"/>${texte(1529, 718, '05 36 49 12 34', { taille: 14, coul: '#14532d' })}
  <!-- plaque de rue bilingue -->
  <rect x="14" y="470" width="128" height="64" rx="5" fill="#1e3a8a" stroke="#f8fafc" stroke-width="3"/>
  ${texte(78, 494, 'PLACE DU', { taille: 14, coul: '#fff' })}${texte(78, 512, 'CAPITOLE', { taille: 16, coul: '#fff' })}${texte(78, 527, 'Plaça del Capitòli', { taille: 11, coul: '#e0e7ff', gras: false, italique: true })}
  <!-- sol -->
  <path d="M0 770 H1600 V1000 H0Z" fill="#ddd3c1"/>${lignes}${croix}
  ${pigeons}${gens.join('')}
  <!-- totem du métro -->
  <path d="M1352 980 L1420 940 L1440 952 L1372 992Z" fill="#000" opacity=".25"/>
  <rect x="1346" y="640" width="16" height="340" fill="#4b5563"/><rect x="1300" y="600" width="108" height="150" rx="10" fill="#111827"/>
  <rect x="1318" y="612" width="72" height="72" rx="14" fill="#dc2626"/>${texte(1354, 668, 'M', { taille: 54, coul: '#fff' })}
  ${texte(1354, 712, 'Capitole', { taille: 17, coul: '#fff' })}<circle cx="1354" cy="732" r="11" fill="#dc2626"/>${texte(1354, 737, 'A', { taille: 13, coul: '#fff' })}
  `, { defs: degrade('ciel', [[0, '#5b9bd5'], [1, '#cfe3f4']]) });
}

/* ============ 2. Pont-Neuf et dôme de La Grave, Toulouse (coucher de soleil) ============ */
function pontNeuf() {
  const r = alea(5);
  const arches = [[-40, 150], [150, 190], [380, 220], [640, 200], [880, 175], [1090, 150], [1270, 120]];
  // le pont fuit vers la gauche : plus on va à droite, plus il est proche
  const pont = arches.map(([x, w], i) => {
    const k = 0.62 + i * 0.07, haut = 585 - i * 4, base = 690 + i * 5;
    const pile = `<rect x="${x + w}" y="${haut}" width="${30 * k}" height="${base - haut + 10}" fill="#a85b43"/>`;
    const oculus = i < arches.length - 1 ? `<ellipse cx="${x + w + 15 * k}" cy="${haut + 32}" rx="${13 * k}" ry="${16 * k}" fill="#3b2a35"/>` : '';
    return `<path d="M${x} ${base} Q${x + w / 2} ${haut + 10} ${x + w} ${base}" fill="none" stroke="#000" stroke-width="0"/>
      <path d="M${x} ${haut} H${x + w + 30 * k} V${base + 10} H${x + w} Q${x + w / 2} ${haut + 22} ${x} ${base + 10}Z" fill="url(#briqueRoseFine)"/>${pile}${oculus}`;
  }).join('');
  const reflets = Array.from({ length: 70 }, () => { const y = 700 + r() * 290, x = 420 + (r() - 0.5) * (60 + (y - 700) * 1.1) - 30; return `<rect x="${f(x)}" y="${f(y)}" width="${f(20 + r() * 70)}" height="3" fill="#ffd38a" opacity="${f(0.25 + r() * 0.5)}"/>`; }).join('');
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielSoir)"/>
  <circle cx="420" cy="500" r="190" fill="#ffd27a" opacity=".35" filter="url(#flou14)"/><circle cx="420" cy="500" r="62" fill="#ffe9b0"/>
  ${nuage(380, 170, 1.6, 0.55, '#f9a8a8')}${nuage(1320, 230, 1.3, 0.5, '#fbb6a0')}${nuage(760, 300, 1.0, 0.4, '#fecaca')}
  <!-- rive gauche : hôpital de La Grave et son dôme -->
  <rect x="560" y="470" width="900" height="130" fill="#9a5544"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${586 + i * 54}" y="${500 + (i % 2) * 4}" width="18" height="34" fill="#4a2e2e" opacity=".75"/>`).join('')}
  <rect x="860" y="430" width="280" height="50" fill="#a65e4a"/>
  <rect x="905" y="350" width="190" height="90" fill="#b06a52"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${914 + i * 23}" y="362" width="9" height="70" fill="#e8d8c0" opacity=".9"/>`).join('')}
  <path d="M900 352 Q1000 170 1100 352Z" fill="#5f7d78"/><path d="M930 352 Q1000 200 1070 352" fill="none" stroke="#86a8a1" stroke-width="5"/><path d="M965 352 Q1000 230 1035 352" fill="none" stroke="#86a8a1" stroke-width="4"/>
  <rect x="980" y="215" width="40" height="40" fill="#5f7d78"/><path d="M976 216 Q1000 180 1024 216Z" fill="#5f7d78"/><path d="M1000 150 V182" stroke="#3f504d" stroke-width="5"/><path d="M990 162 h20" stroke="#3f504d" stroke-width="4"/>
  <rect x="0" y="540" width="600" height="70" fill="#8d4f40"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${20 + i * 66}" y="556" width="20" height="26" fill="#4a2e2e" opacity=".7"/>`).join('')}
  ${platane(1290, 610, 210)}${platane(1440, 612, 240)}${platane(1560, 615, 200)}
  <!-- Garonne -->
  <rect y="600" width="${L}" height="400" fill="url(#eau)"/>${reflets}
  ${pont}
  <!-- quai de la rive droite (premier plan) -->
  <path d="M1080 1000 L1600 760 V1000Z" fill="url(#briqueRose)"/><path d="M1080 1000 L1600 760 V790 L1140 1000Z" fill="#e7d6bf"/>
  <path d="M1270 920 L1600 790" stroke="#3b3b3b" stroke-width="5"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${1290 + i * 42} ${913 - i * 16.5} v-34" stroke="#3b3b3b" stroke-width="3"/>`).join('')}
  ${personne(1420, 860, 120, { haut: '#1f2937', ombre: [70, 18] })}${personne(1455, 846, 115, { haut: '#7f1d1d', ombre: [70, 18] })}
  <rect x="1316" y="870" width="10" height="70" fill="#4b5563"/><rect x="1262" y="834" width="118" height="42" rx="6" fill="#e11d48"/>${texte(1321, 861, 'VélôToulouse', { taille: 15, coul: '#fff' })}
  `, { defs: degrade('cielSoir', [[0, '#3b4a8a'], [0.45, '#e9887a'], [0.62, '#ffc98a'], [1, '#f6a96b']]) + degrade('eau', [[0, '#c9787a'], [0.3, '#7d5a78'], [1, '#2f3557']]) });
}

/* ============ 3. Cité de l'espace, Toulouse ============ */
function citeEspace() {
  const fusee = (() => {
    // Ariane 5 : étage principal blanc, deux propulseurs d'appoint, coiffe ogivale
    return `<g>
    <rect x="740" y="190" width="80" height="560" fill="#f3f4f6"/><rect x="740" y="190" width="22" height="560" fill="#d1d5db"/><path d="M740 190 C740 125 768 84 780 72 C792 84 820 125 820 190Z" fill="#f3f4f6"/><path d="M740 190 C740 125 768 84 780 72 C770 100 762 140 762 190Z" fill="#d1d5db"/>
    <rect x="740" y="300" width="80" height="14" fill="#1f2937"/><rect x="740" y="560" width="80" height="8" fill="#9ca3af"/>
    ${texte(780, 440, 'ESA', { taille: 22, coul: '#1e3a8a', transform: 'rotate(-90 780 440)' })}${texte(780, 520, 'ARIANE 5', { taille: 20, coul: '#1e3a8a', transform: 'rotate(-90 780 520)' })}
    <rect x="696" y="330" width="40" height="440" fill="#e5e7eb"/><path d="M696 330 Q716 270 736 330Z" fill="#e5e7eb"/><rect x="696" y="330" width="10" height="440" fill="#c4c7cd"/>
    <rect x="824" y="330" width="40" height="440" fill="#e5e7eb"/><path d="M824 330 Q844 270 864 330Z" fill="#e5e7eb"/><rect x="824" y="330" width="10" height="440" fill="#c4c7cd"/>
    <path d="M700 770 h32 l6 26 h-44z M828 770 h32 l6 26 h-44z" fill="#6b7280"/><path d="M760 750 h40 l8 30 h-56z" fill="#4b5563"/>
    <rect x="660" y="796" width="240" height="20" fill="#9ca3af"/></g>`;
  })();
  const parking = [
    [300, 935, 230, '#b91c1c', 'GH-418-KT'], [560, 960, 250, '#1f2937', 'FZ-073-PB'], [1060, 950, 240, '#e5e7eb', 'HA-226-RM'], [1320, 930, 220, '#0369a1', 'EP-950-LC']
  ].map(([x, y, l, c, t]) => voiture(x, y, l, { couleur: c, vue: 'arriere', plaque: (px, py, pl) => plaqueFR(px, py, pl, t, '31'), ombre: [30, -6] })).join('');
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielBleu)"/>${nuage(1240, 140, 1.2, 0.85)}${nuage(300, 230, 0.9, 0.7)}
  <!-- planétarium (dôme) et bâtiment d'accueil -->
  <path d="M960 780 Q1150 470 1340 780Z" fill="#d1d5db"/><path d="M1000 780 Q1150 520 1300 780" fill="none" stroke="#9ca3af" stroke-width="3"/><path d="M1060 780 Q1150 560 1240 780" fill="none" stroke="#9ca3af" stroke-width="3"/>
  <rect x="1250" y="640" width="350" height="140" fill="#e2e8f0"/><rect x="1250" y="640" width="350" height="18" fill="#94a3b8"/>${Array.from({ length: 6 }, (_, i) => `<rect x="${1270 + i * 54}" y="680" width="40" height="80" fill="#60a5fa" opacity=".55"/>`).join('')}
  <!-- station Mir (maquette) -->
  <g transform="translate(160 640)"><rect x="0" y="40" width="300" height="56" rx="24" fill="#cbd5e1"/><rect x="80" y="-10" width="40" height="160" rx="12" fill="#94a3b8"/><rect x="-40" y="-40" width="34" height="210" fill="#1e3a8a"/><rect x="306" y="-40" width="34" height="210" fill="#1e3a8a"/>${Array.from({ length: 9 }, (_, i) => `<path d="M-40 ${-40 + i * 24}h34 M306 ${-40 + i * 24}h34" stroke="#93c5fd" stroke-width="2"/>`).join('')}<rect x="0" y="96" width="14" height="100" fill="#6b7280"/><rect x="286" y="96" width="14" height="100" fill="#6b7280"/></g>
  <!-- herbe, allées -->
  <rect y="780" width="${L}" height="220" fill="#7aa35a"/><path d="M0 860 H1600 V1000 H0Z" fill="#9ca3af"/><path d="M0 860 H1600" stroke="#e5e7eb" stroke-width="6"/>
  ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 190 + 60} 1000 L${i * 190 + 110} 870" stroke="#f8fafc" stroke-width="5"/>`).join('')}
  ${fusee}
  <path d="M780 816 L1010 880 L980 900 L760 830Z" fill="#000" opacity=".18"/>
  ${parking}
  <!-- panneau bilingue d'entrée -->
  <rect x="1460" y="520" width="12" height="260" fill="#475569"/><rect x="1366" y="470" width="214" height="76" rx="6" fill="#1e3a8a" stroke="#f8fafc" stroke-width="3"/>
  ${texte(1473, 500, 'AVENUE', { taille: 14, coul: '#fff' })}${texte(1473, 520, 'JEAN GONORD', { taille: 18, coul: '#fff' })}${texte(1473, 538, 'Avenguda Jean Gonord', { taille: 12, coul: '#e0e7ff', italique: true, gras: false })}
  `, { defs: degrade('cielBleu', [[0, '#3b82c4'], [1, '#d6e9f8']]) });
}

/* ============ 4. Place des Abbesses, Paris (édicule Guimard, mur des je t'aime) ============ */
function abbesses() {
  const r = alea(3);
  const jetaime = ['je t\'aime', 'I love you', 'ti amo', 'te quiero', 'ich liebe dich', 'eu te amo', 'أحبك', 'aš tave myliu', 'ik hou van jou', 'σ\'αγαπώ', 'kocham cię', 'jeg elsker deg', 't\'estimi', 'seni seviyorum', 'te iubesc', 'я тебя люблю', 'rakastan sinua', 'ndakupenda', 'mahal kita', 'szeretlek', 'jag älskar dig', 't\'aimi', 'tha gaol agam ort', 'maite zaitut', 'te amo'];
  const mur = [];
  for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) mur.push(`<rect x="${70 + i * 52}" y="${300 + j * 52}" width="50" height="50" fill="${r() > 0.5 ? '#1e3a8a' : '#1d3576'}"/>`);
  const ecritures = Array.from({ length: 21 }, (_, i) => { const col = i % 3, lig = Math.floor(i / 3); return texte(f(150 + col * 152 + (r() - 0.5) * 30), f(332 + lig * 52 + r() * 14), jetaime[i % jetaime.length], { taille: f(13 + r() * 5), coul: '#f8fafc', gras: false, italique: r() > 0.5, op: 0.92 }); }).join('');
  const verriere = Array.from({ length: 9 }, (_, i) => `<path d="M${880 + i * 40} 360 L${820 + i * 55} 300" stroke="#2f4a35" stroke-width="5"/>`).join('');
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielParis)"/>
  <!-- immeubles haussmanniens -->
  <rect x="600" y="80" width="1000" height="680" fill="url(#pierre)"/>${Array.from({ length: 4 }, (_, j) => Array.from({ length: 8 }, (_, i) => fenetre(650 + i * 120, 130 + j * 140, 54, 100, { volets: null, cadre: '#ece4d3' }) + (j === 1 || j === 3 ? `<rect x="${640 + i * 120}" y="${226 + j * 140}" width="74" height="8" fill="#1f2937"/>${Array.from({ length: 6 }, (_, k) => `<rect x="${644 + i * 120 + k * 12}" y="${210 + j * 140}" width="3" height="18" fill="#1f2937"/>`).join('')}` : '')).join('')).join('')}
  <path d="M580 80 L640 20 H1600 V80Z" fill="#475569"/>${Array.from({ length: 8 }, (_, i) => `<rect x="${690 + i * 120}" y="34" width="34" height="38" fill="#cbd5e1"/>`).join('')}
  <rect x="600" y="690" width="1000" height="70" fill="#7f1d1d"/>${texte(1340, 735, 'BOULANGERIE · PÂTISSERIE', { taille: 24, coul: '#fde68a', ls: 2 })}
  <!-- square et mur -->
  <rect x="0" y="0" width="600" height="760" fill="#8aa37b"/><rect x="0" y="0" width="600" height="760" fill="url(#cielParis)" opacity=".6"/>
  ${platane(80, 300, 300)}${platane(520, 290, 280)}
  <rect x="50" y="280" width="500" height="420" fill="#cfc6b4"/>${mur.join('')}${ecritures}
  <rect x="50" y="700" width="500" height="60" fill="#5b5547"/>
  <rect x="0" y="740" width="600" height="20" fill="#2f3b2f"/>${Array.from({ length: 30 }, (_, i) => `<path d="M${i * 20 + 5} 740 v-48 l5 -10 l5 10 v48" fill="#1f2a1f"/>`).join('')}
  <!-- sol -->
  <rect y="760" width="${L}" height="240" fill="url(#paves)"/><rect y="760" width="${L}" height="240" fill="#000" opacity=".06"/>
  <!-- édicule Guimard : fonte verte, verrière en éventail, lampes orangées -->
  <path d="M840 380 L760 300 H1340 L1260 380Z" fill="#c6d8c8" opacity=".7"/>${verriere}<path d="M760 300 H1340" stroke="#2f4a35" stroke-width="10"/>
  <path d="M860 380 V900 M1240 380 V900" stroke="#2f4a35" stroke-width="18"/><path d="M860 380 H1240" stroke="#2f4a35" stroke-width="14"/>
  <path d="M860 520 Q880 470 920 460 M1240 520 Q1220 470 1180 460" stroke="#2f4a35" stroke-width="10" fill="none"/>
  <rect x="890" y="400" width="320" height="56" rx="8" fill="#f2e8c9" stroke="#2f4a35" stroke-width="6"/>${texte(1050, 437, 'METROPOLITAIN', { taille: 26, coul: '#2f4a35', police: POLICE_SERIF, ls: 1 })}
  ${[860, 1240].map(x => `<ellipse cx="${x}" cy="560" rx="16" ry="26" fill="#f97316"/><ellipse cx="${x}" cy="560" rx="30" ry="40" fill="#fdba74" opacity=".35" filter="url(#flou6)"/>`).join('')}
  <path d="M880 900 H1220 L1180 700 H920Z" fill="#1f2937"/>${Array.from({ length: 8 }, (_, i) => `<path d="M${905 + i * 4} ${890 - i * 26} H${1195 - i * 4}" stroke="#4b5563" stroke-width="5"/>`).join('')}
  ${Array.from({ length: 13 }, (_, i) => `<path d="M${876 + i * 27} 900 V770" stroke="#2f4a35" stroke-width="5"/>`).join('')}<path d="M870 770 H1230 M870 900 H1230" stroke="#2f4a35" stroke-width="7"/>
  ${personne(700, 940, 140, { haut: '#111827', ombre: [-40, 24], sac: true })}${personne(1400, 920, 130, { haut: '#9f1239', ombre: [-40, 24] })}${personne(1320, 880, 104, { haut: '#334155', ombre: [-30, 20] })}
  <!-- plaque de rue parisienne : émail bleu, cadre vert, arrondissement -->
  <rect x="1380" y="560" width="200" height="96" rx="6" fill="#1e3a8a" stroke="#166534" stroke-width="7"/>
  ${texte(1480, 588, '18<tspan font-size="11" dy="-6">e</tspan><tspan dy="6"> Arr<tspan font-size="11" dy="-6">t</tspan></tspan>', { taille: 16, coul: '#fff', gras: false })}<path d="M1400 596 H1560" stroke="#fff" stroke-width="1.5"/>
  ${texte(1480, 622, 'SQUARE', { taille: 15, coul: '#fff' })}${texte(1480, 644, 'JEHAN RICTUS', { taille: 18, coul: '#fff' })}
  `, { defs: degrade('cielParis', [[0, '#9fb7cf'], [1, '#e6edf3']]) });
}

/* ============ 5. Cité de Carcassonne ============ */
function carcassonne() {
  const tour = (x, base, l, h, toit = true) => `<rect x="${x}" y="${base - h}" width="${l}" height="${h}" fill="url(#pierreOcre)"/><rect x="${x}" y="${base - h}" width="${l * 0.3}" height="${h}" fill="#000" opacity=".1"/>
    ${Array.from({ length: Math.floor(l / 18) }, (_, i) => `<rect x="${x + 3 + i * 18}" y="${base - h - 12}" width="10" height="14" fill="url(#pierreOcre)"/>`).join('')}
    ${toit ? `<path d="M${x - 6} ${base - h} L${x + l / 2} ${base - h - l * 1.25} L${x + l + 6} ${base - h}Z" fill="url(#ardoise)"/>` : ''}<rect x="${x + l / 2 - 4}" y="${base - h + 30}" width="8" height="20" fill="#3f3424"/>`;
  const remparts = `<rect x="80" y="420" width="1300" height="130" fill="url(#pierreOcre)"/>${Array.from({ length: 64 }, (_, i) => `<rect x="${82 + i * 20}" y="408" width="12" height="14" fill="url(#pierreOcre)"/>`).join('')}
    ${tour(150, 430, 70, 140)}${tour(420, 425, 80, 170)}${tour(700, 420, 100, 220)}${tour(1000, 425, 80, 160)}${tour(1260, 430, 70, 130)}
    <rect x="0" y="540" width="1600" height="110" fill="url(#pierreOcre)"/><rect x="0" y="540" width="1600" height="110" fill="#000" opacity=".08"/>${Array.from({ length: 80 }, (_, i) => `<rect x="${i * 20 + 2}" y="528" width="12" height="14" fill="url(#pierreOcre)"/>`).join('')}
    ${tour(260, 545, 76, 120)}${tour(600, 545, 90, 150, true)}${tour(940, 545, 90, 150, true)}${tour(1340, 545, 76, 120)}
    <path d="M700 650 V575 A45 45 0 0 1 790 575 V650Z" fill="#2b2418"/>`;
  const vignes = Array.from({ length: 14 }, (_, i) => `<path d="M${-200 + i * 140} 1000 L${640 + i * 20} 690" stroke="#5f7d3a" stroke-width="${14 - i * 0.3}" stroke-dasharray="10 8"/>`).join('');
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielSud)"/>${nuage(1300, 120, 1.1, 0.8)}
  <path d="M0 640 Q400 560 800 600 T1600 590 V700 H0Z" fill="#9db06a"/>
  ${remparts}
  ${cypres(1440, 660, 200)}${cypres(1480, 665, 160)}${cypres(60, 660, 180)}
  <path d="M0 680 Q800 640 1600 690 V1000 H0Z" fill="#8ba05a"/>${vignes}
  <!-- route départementale -->
  <path d="M760 1000 L1080 700 H1130 L1300 1000Z" fill="#4b5563"/><path d="M1030 1000 L1105 700" stroke="#f8fafc" stroke-width="6" stroke-dasharray="30 26"/><path d="M780 1000 L1082 702 M1280 1000 L1128 702" stroke="#f8fafc" stroke-width="5"/>
  ${voiture(1180, 900, 190, { couleur: '#f8fafc', vue: 'arriere', plaque: (x, y, l) => plaqueFR(x, y, l, 'GK-512-HN', '11'), ombre: [24, -2] })}
  ${voiture(1050, 780, 90, { couleur: '#b91c1c', vue: 'avant', plaque: (x, y, l) => plaqueFR(x, y, l, 'FD-338-AE', '34') })}
  <!-- borne de route départementale (tête jaune) -->
  <path d="M1352 900 q0 -64 30 -64 q30 0 30 64z" fill="#f8fafc" stroke="#9ca3af" stroke-width="2"/><path d="M1352 870 q0 -34 30 -34 q30 0 30 34z" fill="#facc15"/>${texte(1382, 866, 'D', { taille: 14 })}${texte(1382, 890, '118', { taille: 14 })}
  <!-- panneaux -->
  ${poteau(1440, 620, 900)}${poteau(1540, 620, 900)}
  <rect x="1390" y="610" width="196" height="56" fill="#f8fafc" stroke="#111" stroke-width="3"/>${texte(1488, 646, '← La Cité', { taille: 24 })}
  <rect x="1390" y="676" width="196" height="56" fill="#7c4a1e"/>${texte(1488, 700, 'Cité médiévale', { taille: 16, coul: '#fff' })}${texte(1488, 720, 'UNESCO', { taille: 13, coul: '#fde68a' })}
  `, { defs: degrade('cielSud', [[0, '#4f8fd0'], [1, '#e2eef8']]) });
}

/* ============ 6. Maqam Echahid, Alger ============ */
function alger() {
  // trois palmes de béton qui se rejoignent au sommet ; une statue de bronze au pied de chacune
  const palme = (b0, b1, inv, coul, ombre) => {
    const [x0, x1] = [b0, b1];
    const mi = (x0 + x1) / 2;
    return `<path d="M${x0} 820 C${x0 + inv * 30} 560 ${mi - inv * 10} 300 800 96 C${mi + inv * 40} 320 ${x1 + inv * 6} 560 ${x1} 820Z" fill="${coul}"/>
      ${Array.from({ length: 14 }, (_, i) => { const t = (i + 1) / 15, y = 820 - t * 700; const xa = x0 + (800 - x0) * t * t * 0.9 + inv * 10 * t, xb = x1 + (800 - x1) * t * 1.05; return `<path d="M${f(xa + 4)} ${f(y)} L${f(xb - 4)} ${f(y - 8)}" stroke="${ombre}" stroke-width="2" opacity=".55"/>`; }).join('')}`;
  };
  const soldat = x => `<rect x="${x - 22}" y="700" width="44" height="120" rx="6" fill="#6b4a22"/><circle cx="${x}" cy="684" r="18" fill="#6b4a22"/><rect x="${x + 18}" y="640" width="6" height="96" fill="#4b3416"/><rect x="${x - 34}" y="812" width="68" height="14" fill="#8b8274"/>`;
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielAlger)"/>${nuage(260, 170, 1.0, 0.7)}${nuage(1350, 120, 0.9, 0.6)}
  <!-- baie d'Alger, en contrebas de la colline de Riadh El Feth -->
  <rect y="560" width="${L}" height="120" fill="#3d7fb3"/><path d="M0 560 Q400 548 800 560 T1600 552" fill="none" stroke="#b9d8ee" stroke-width="3"/>
  <path d="M1040 562 L1600 520 V600 L1040 600Z" fill="#cbd5e1"/>${Array.from({ length: 32 }, (_, i) => `<rect x="${1060 + i * 17}" y="${548 - (i % 4) * 9 - i * 1.2}" width="14" height="${40 + (i % 4) * 9 + i * 1.2}" fill="${i % 3 ? '#f1f5f9' : '#e2e8f0'}"/>`).join('')}
  <path d="M0 640 Q400 600 800 650 T1600 630 V860 H0Z" fill="#5f8a4a"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${i * 42 + 10}" cy="${700 + (i * 53 % 90)}" r="${18 + (i * 7 % 12)}" fill="${i % 2 ? '#4f7a3c' : '#6a9a52'}"/>`).join('')}
  <!-- monument -->
  ${palme(560, 700, -1, '#cfc8ba', '#a39b8b')}${palme(900, 1040, 1, '#c2bbac', '#9b937f')}${palme(730, 870, 0, '#e4dfd3', '#b6ad9b')}
  <path d="M770 120 Q800 70 830 120 Q800 132 770 120Z" fill="#bfb7a6"/>
  ${soldat(600)}${soldat(1000)}${soldat(800)}
  <rect x="500" y="826" width="600" height="28" fill="#bdb6a8"/>
  <!-- esplanade, palmiers -->
  <rect y="850" width="${L}" height="150" fill="#d9d2c3"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 200} 1000 L${700 + i * 25} 850" stroke="#c7bfae" stroke-width="2"/>`).join('')}
  ${palmier(160, 900, 380)}${palmier(1440, 905, 360)}${palmier(1560, 910, 300)}
  ${personne(420, 950, 120, { haut: '#0f766e', ombre: [-36, 20] })}${personne(1180, 960, 128, { haut: '#7c2d12', ombre: [-36, 20] })}${personne(330, 930, 100, { haut: '#a16207', ombre: [-30, 16] })}
  ${voiture(1250, 1010, 220, { couleur: '#f8fafc', vue: 'arriere', plaque: (x, y, l) => plaqueDZ(x, y, l, '04217 118 16'), ombre: [-26, -2] })}
  <!-- panneau bilingue arabe / français -->
  ${poteau(300, 640, 900)}<rect x="170" y="600" width="260" height="104" rx="8" fill="#1e3a8a" stroke="#fff" stroke-width="4"/>
  ${texte(300, 645, 'رياض الفتح', { taille: 32, coul: '#fff' })}${texte(300, 686, 'Riadh El Feth', { taille: 24, coul: '#fff' })}
  <!-- affiche -->
  <rect x="1300" y="640" width="250" height="150" fill="#fff7ed" stroke="#9a3412" stroke-width="4"/>${texte(1425, 680, 'Musée central', { taille: 20, coul: '#9a3412' })}${texte(1425, 705, 'de l\'Armée', { taille: 20, coul: '#9a3412' })}${texte(1425, 740, 'المتحف المركزي للجيش', { taille: 18, coul: '#7c2d12' })}${texte(1425, 772, '+213 21 00 00 00 · musee.dz', { taille: 12, coul: '#7c2d12', gras: false })}
  `, { defs: degrade('cielAlger', [[0, '#2f7fd1'], [1, '#d8ecfb']]) });
}

/* ============ 7. Kabylie, route vers Tizi Ouzou ============ */
function kabylie() {
  const r = alea(9);
  const village = (x, y, n) => Array.from({ length: n }, (_, i) => { const dx = x + i * 26 + r() * 6, dy = y - Math.sin(i / n * Math.PI) * 30; return `<rect x="${f(dx)}" y="${f(dy)}" width="22" height="16" fill="#f1ede4"/><path d="M${f(dx - 2)} ${f(dy)} l13 -9 l13 9z" fill="#b4543b"/>`; }).join('');
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielKab)"/>
  <!-- massif du Djurdjura enneigé -->
  <path d="M0 470 L180 330 L300 400 L460 250 L600 360 L760 230 L900 340 L1060 260 L1240 380 L1400 300 L1600 420 V560 H0Z" fill="#8792a3"/>
  <path d="M460 250 L520 300 L490 296 L470 320 L440 290Z M760 230 L820 285 L790 280 L770 300 L740 272Z M1060 260 L1110 300 L1080 298 L1060 320 L1036 292Z" fill="#f8fafc"/>
  <!-- crêtes et villages perchés -->
  <path d="M0 560 Q200 470 400 520 T800 500 T1200 520 T1600 500 V700 H0Z" fill="#6f8f4e"/>${village(260, 500, 9)}${village(980, 498, 11)}
  <path d="M0 640 Q300 580 700 620 T1600 610 V1000 H0Z" fill="#7f9c58"/>
  ${olivier(120, 780, 170)}${olivier(330, 740, 120)}${olivier(1450, 790, 180)}${olivier(1240, 740, 110)}
  <!-- route nationale -->
  <path d="M500 1000 L780 640 H840 L1200 1000Z" fill="#475569"/><path d="M840 1000 L810 640" stroke="#f8fafc" stroke-width="7" stroke-dasharray="34 30"/>
  ${voiture(1000, 930, 210, { couleur: '#f8fafc', vue: 'arriere', plaque: (x, y, l) => plaqueDZ(x, y, l, '18342 114 15'), ombre: [-20, -2] })}
  ${voiture(735, 760, 100, { couleur: '#1f2937', vue: 'avant', plaque: (x, y, l) => plaqueDZ(x, y, l, '00561 109 16') })}
  <!-- panneau de direction trilingue arabe / tifinagh / latin -->
  ${poteau(1300, 560, 900, 12)}${poteau(1520, 560, 900, 12)}
  <rect x="1240" y="470" width="340" height="190" rx="10" fill="#16a34a" stroke="#f8fafc" stroke-width="5"/>
  ${texte(1380, 520, 'تيزي وزو', { taille: 38, coul: '#fff' })}${texte(1380, 566, 'ⵜⵉⵣⵉ ⵡⴻⵣⵣⵓ', { taille: 30, coul: '#fff', gras: false })}${texte(1380, 612, 'Tizi Ouzou', { taille: 32, coul: '#fff' })}
  ${texte(1540, 590, '12', { taille: 40, coul: '#fff' })}${texte(1540, 630, 'km', { taille: 18, coul: '#fff' })}<path d="M1270 640 h70 l-14 -12 m14 12 l-14 12" stroke="#fff" stroke-width="6" fill="none"/>
  <rect x="1250" y="672" width="320" height="40" rx="6" fill="#f8fafc"/>${texte(1410, 700, 'RN 12', { taille: 24, coul: '#b91c1c' })}
  <!-- échoppe -->
  <rect x="40" y="840" width="300" height="120" fill="#fef3c7"/><rect x="40" y="820" width="300" height="34" fill="#b91c1c"/>${texte(190, 845, 'زيت الزيتون · Huile d\'olive', { taille: 18, coul: '#fff' })}${texte(190, 900, '0550 00 00 00', { taille: 22, coul: '#7c2d12' })}${texte(190, 935, 'zitouna-kabylie.dz', { taille: 16, coul: '#7c2d12', gras: false })}
  `, { defs: degrade('cielKab', [[0, '#4a8fd6'], [1, '#e6f1fb']]) });
}

/* ============ 8. Le Cap (Afrique du Sud) : Table Mountain, soleil au nord ============ */
function leCap() {
  // le photographe regarde vers le SUD (la montagne) à 12 h 41 : le soleil est dans son dos, au NORD,
  // et les ombres partent vers la montagne. On roule à GAUCHE.
  const VX = 800, VY = 640;
  // Ombres portées nettes : le soleil est dans le dos du photographe, toutes les ombres filent vers le point
  // de fuite, c'est-à-dire vers la montagne. part = fraction du chemin vers le point de fuite.
  const versVP = (x, base, part) => [f(x + (VX - x) * part), f(base - (base - VY) * part)];
  const ombreSol = (x, base, l, part, op = 0.5) => { const [ex, ey] = versVP(x, base, part); return `<path d="M${f(x - l / 2)} ${base} L${f(ex - l * 0.3)} ${ey} L${f(ex + l * 0.3)} ${ey} L${f(x + l / 2)} ${base}Z" fill="#111827" opacity="${op}"/>`; };
  const lampadaire = (x, base, h, part) => { const [ex, ey] = versVP(x, base, part), bras = x < VX ? 1 : -1;
    return `${ombreSol(x, base, 12, part, 0.55)}<path d="M${ex} ${ey} l${f(bras * 26 * (1 - part))} ${f(-4 * (1 - part))}" stroke="#111827" stroke-width="${f(8 * (1 - part * 0.5))}" opacity=".55" stroke-linecap="round"/>
    <rect x="${x - 4}" y="${base - h}" width="8" height="${h}" fill="#374151"/><rect x="${x - 4}" y="${base - h}" width="${bras * 40}" height="6" fill="#374151"/>`; };
  const ombrePalmier = (x, base, part) => { const [ex, ey] = versVP(x, base, part);
    return `${ombreSol(x, base, 20, part, 0.5)}<g transform="translate(${ex} ${ey}) rotate(${f(Math.atan2(ey - base, ex - x) * 180 / Math.PI)})" opacity=".5" fill="#111827">${[-50, -25, 0, 25, 50].map(a => `<ellipse cx="0" cy="0" rx="62" ry="9" transform="rotate(${a})"/>`).join('')}</g>`; };
  const ombreVoiture = (cx, base, l, part) => { const [ex, ey] = versVP(cx, base, part); return `<path d="M${f(cx - l * 0.5)} ${base} L${f(ex - l * 0.32)} ${ey} L${f(ex + l * 0.32)} ${ey} L${f(cx + l * 0.5)} ${base}Z" fill="#111827" opacity=".42"/>`; };
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielCap)"/>
  <!-- Devil's Peak (gauche), Table Mountain (sommet plat, « nappe » de nuage), Lion's Head (droite) -->
  <path d="M0 560 L110 330 L250 270 L330 252 L1150 244 L1220 262 L1290 400 L1350 350 L1420 230 L1480 330 L1600 470 V640 H0Z" fill="#6b7c8f"/>
  <path d="M250 270 L330 252 L1150 244 L1220 262 L1270 380 L1100 410 L800 392 L420 420 L260 380Z" fill="#7f90a4"/>
  <path d="M320 250 Q500 214 760 234 Q1000 208 1160 246 Q1100 272 960 262 Q800 282 600 266 Q430 280 320 250Z" fill="#f8fafc" opacity=".94"/>
  ${Array.from({ length: 12 }, (_, i) => `<path d="M${350 + i * 68} 262 q10 50 -4 110" stroke="#5b6b7d" stroke-width="3" fill="none" opacity=".55"/>`).join('')}
  <!-- ville -->
  ${Array.from({ length: 30 }, (_, i) => { const x = i * 56 - 20, h = 60 + (i * 37 % 90); return `<rect x="${x}" y="${640 - h}" width="50" height="${h}" fill="${['#e2e8f0', '#f1f5f9', '#d6dde6'][i % 3]}"/>${Array.from({ length: Math.floor(h / 22) }, (_, k) => `<rect x="${x + 8}" y="${648 - h + k * 22}" width="34" height="8" fill="#94a3b8" opacity=".6"/>`).join('')}`; }).join('')}
  <!-- trottoirs et chaussée en perspective -->
  <path d="M0 1000 L0 760 L${VX} ${VY} L640 1000Z" fill="#cbd5e1"/><path d="M1600 1000 L1600 760 L${VX} ${VY} L960 1000Z" fill="#cbd5e1"/>
  <path d="M640 1000 L${VX} ${VY} L960 1000Z" fill="#4b5563"/><path d="M180 1000 L${VX} ${VY} L1420 1000Z" fill="#4b5563"/>
  <path d="M800 1000 L${VX} ${VY}" stroke="#f8fafc" stroke-width="6" stroke-dasharray="40 34"/><path d="M180 1000 L${VX} ${VY} M1420 1000 L${VX} ${VY}" stroke="#facc15" stroke-width="5"/>
  ${ombrePalmier(130, 800, 0.62)}${ombrePalmier(1470, 800, 0.6)}${palmier(130, 800, 300)}${palmier(1470, 800, 280)}
  ${lampadaire(330, 900, 300, 0.5)}${lampadaire(1270, 900, 300, 0.5)}${lampadaire(600, 735, 150, 0.45)}${lampadaire(1000, 735, 150, 0.45)}
  ${ombreVoiture(560, 960, 250, 0.42)}${ombreVoiture(720, 735, 90, 0.4)}${ombreVoiture(1020, 820, 150, 0.4)}${ombreVoiture(870, 700, 60, 0.4)}
  <!-- voies : on s'éloigne à gauche, on arrive à droite -->
  ${voiture(560, 960, 250, { couleur: '#b91c1c', vue: 'arriere', plaque: (x, y, l) => plaqueZA(x, y, l, 'CA 418-206'), ombre: [6, -30] })}
  ${voiture(720, 735, 90, { couleur: '#e5e7eb', vue: 'arriere', plaque: (x, y, l) => plaqueZA(x, y, l, 'CA 77-301') })}
  ${voiture(1020, 820, 150, { couleur: '#0f766e', vue: 'avant', plaque: null, ombre: [-2, -18] })}
  ${voiture(870, 700, 60, { couleur: '#1d4ed8', vue: 'avant', plaque: null })}
  ${personne(230, 930, 130, { haut: '#1e3a8a', ombre: [146, -74], ombreNette: true })}${personne(1380, 950, 130, { haut: '#9f1239', ombre: [-142, -76], ombreNette: true })}
  ${personne(400, 836, 96, { haut: '#047857', ombre: [146, -72], ombreNette: true, sac: true })}${personne(1230, 846, 96, { haut: '#a16207', ombre: [-146, -70], ombreNette: true })}
  <!-- panneaux -->
  <rect x="60" y="560" width="220" height="74" rx="8" fill="#e11d48"/>${texte(170, 594, 'MyCiTi', { taille: 30, coul: '#fff' })}${texte(170, 620, 'Civic Centre · Stadsentrum', { taille: 13, coul: '#fff', gras: false })}<rect x="164" y="634" width="10" height="150" fill="#334155"/>
  <rect x="1356" y="560" width="10" height="210" fill="#334155"/><rect x="1296" y="520" width="130" height="50" rx="6" fill="#0f172a"/>${texte(1361, 553, '12:41', { taille: 30, coul: '#facc15', police: "'DejaVu Sans Mono', monospace" })}
  <rect x="1060" y="520" width="200" height="66" fill="#fde68a"/>${texte(1160, 548, 'BILTONG', { taille: 22, coul: '#7c2d12' })}${texte(1160, 572, '021 555 0142', { taille: 14, coul: '#7c2d12', gras: false })}
  <rect x="380" y="540" width="220" height="40" fill="#0f172a"/>${texte(490, 566, 'braai-shop.co.za', { taille: 16, coul: '#fde68a' })}
  `, { defs: degrade('cielCap', [[0, '#2b78c9'], [1, '#d4e9fa']]) });
}

/* ============ 9. Montréal, Plateau-Mont-Royal ============ */
function montreal() {
  // escalier extérieur en fer forgé : du trottoir au balcon du 1er étage, en courbe
  const escalier = (xb, yb, xh, yh, sens) => {
    const pts = Array.from({ length: 12 }, (_, k) => { const t = k / 11; return [xb + (xh - xb) * t + sens * Math.sin(t * Math.PI) * 46, yb + (yh - yb) * t]; });
    const ligne = d => 'M' + pts.map(([x, y]) => `${f(x + d)} ${f(y)}`).join(' L');
    const rampe = 'M' + pts.map(([x, y]) => `${f(x + 26)} ${f(y - 34)}`).join(' L');
    return `<path d="${ligne(0)}" stroke="#111827" stroke-width="7" fill="none"/><path d="${ligne(52)}" stroke="#111827" stroke-width="7" fill="none"/>
      ${pts.map(([x, y]) => `<path d="M${f(x)} ${f(y)} h52" stroke="#1f2937" stroke-width="6"/><path d="M${f(x + 26)} ${f(y)} v-34" stroke="#111827" stroke-width="2"/>`).join('')}<path d="${rampe}" stroke="#111827" stroke-width="4" fill="none"/>`;
  };
  const triplex = (x, coul) => `<rect x="${x}" y="300" width="300" height="520" fill="${coul}"/><rect x="${x}" y="300" width="300" height="520" fill="url(#briqueRoseFine)" opacity=".25"/>
    ${[340, 500, 660].map(y => [30, 170].map(dx => fenetre(x + dx, y, 70, 100, { volets: null, cadre: '#f1f5f9' })).join('')).join('')}
    <rect x="${x - 4}" y="270" width="308" height="34" fill="#1f2937"/>${Array.from({ length: 10 }, (_, k) => `<rect x="${x + 8 + k * 30}" y="276" width="18" height="10" fill="#475569"/>`).join('')}
    ${[460, 620].map(y => `<rect x="${x - 10}" y="${y}" width="320" height="12" fill="#1f2937"/>${Array.from({ length: 16 }, (_, k) => `<rect x="${x - 6 + k * 20}" y="${y - 34}" width="3" height="34" fill="#1f2937"/>`).join('')}<path d="M${x - 10} ${y - 34} H${x + 310}" stroke="#1f2937" stroke-width="4"/>`).join('')}
    ${escalier(x + 210, 812, x + 150, 632, 1)}
    <rect x="${x + 30}" y="740" width="70" height="80" fill="#7c2d12"/><rect x="${x + 30}" y="580" width="70" height="40" fill="#7c2d12" opacity=".0"/>`;
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#cielMtl)"/>${nuage(400, 120, 1.2, 0.85)}${nuage(1260, 200, 0.9, 0.7)}
  ${triplex(-40, '#9a3b2a')}${triplex(260, '#a1503a')}${triplex(560, '#8f3a2c')}${triplex(860, '#9c4630')}
  ${erable(1300, 840, 360)}${erable(1520, 830, 300)}
  <rect y="820" width="${L}" height="180" fill="#6b7280"/><rect y="820" width="${L}" height="34" fill="#d1d5db"/>
  <!-- panneau ARRÊT -->
  ${poteau(1180, 560, 860, 10)}<path d="M1140 470 h80 l56 56 v80 l-56 56 h-80 l-56 -56 v-80z" fill="#c1121f" stroke="#fff" stroke-width="7"/>${texte(1180, 582, 'ARRÊT', { taille: 46, coul: '#fff' })}
  <!-- plaque de rue -->
  ${poteau(1180, 400, 470, 10)}<rect x="1090" y="396" width="180" height="50" rx="5" fill="#1d4ed8" stroke="#fff" stroke-width="3"/>${texte(1180, 429, 'Rue Rachel E', { taille: 22, coul: '#fff' })}
  <!-- signalétique du métro (flèche blanche vers le bas dans un cercle bleu) -->
  ${poteau(70, 610, 860, 10)}<circle cx="70" cy="560" r="50" fill="#0067c5" stroke="#fff" stroke-width="5"/><path d="M70 528 V590 M48 568 L70 592 L92 568" stroke="#fff" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="24" y="616" width="92" height="28" rx="4" fill="#0067c5"/>${texte(70, 637, 'MÉTRO', { taille: 17, coul: '#fff' })}
  <!-- dépanneur -->
  <rect x="580" y="700" width="260" height="46" fill="#065f46"/>${texte(710, 732, 'DÉPANNEUR', { taille: 26, coul: '#fff' })}<rect x="584" y="750" width="252" height="26" fill="#f8fafc"/>${texte(710, 769, 'Bière · Vin · Loto  —  514 555-0123', { taille: 13, coul: '#065f46' })}
  ${voiture(420, 990, 260, { couleur: '#334155', vue: 'arriere', plaque: (x, y, l) => plaqueQC(x + l * 0.15, y - l * 0.12, l * 0.7, 'F47 KRB'), ombre: [-30, -2] })}
  ${voiture(1000, 975, 200, { couleur: '#f1f5f9', vue: 'avant', plaque: null })}
  ${personne(1400, 900, 120, { haut: '#1e3a8a', ombre: [-40, 20] })}
  `, { defs: degrade('cielMtl', [[0, '#5d9bd9'], [1, '#e1eefa']]) });
}

/* ============ 10. Cadran solaire (défi « quelle heure ? ») ============ */
function cadran() {
  // cadran vertical plein sud : heures du matin à gauche, de l'après-midi à droite ; ombre du style sur II (14 h solaires)
  const cx = 800, cy = 250, R = 350;
  const heures = ['VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'I', 'II', 'III', 'IV', 'V', 'VI'];
  const lignes = heures.map((h, i) => {
    const a = (i - 6) * 15 * Math.PI / 180, ang = Math.atan(Math.tan(a) * Math.cos(43.6 * Math.PI / 180));
    const x2 = cx + Math.sin(ang) * R, y2 = cy + Math.cos(ang) * R;
    const tx = cx + Math.sin(ang) * (R + 34), ty = cy + Math.cos(ang) * (R + 34);
    return `<path d="M${cx} ${cy} L${f(x2)} ${f(y2)}" stroke="#7c2d12" stroke-width="${h === 'XII' ? 5 : 3}"/>${texte(f(tx), f(ty + 10), h, { taille: 28, coul: '#7c2d12', police: POLICE_SERIF })}`;
  }).join('');
  const aOmbre = Math.atan(Math.tan(30 * Math.PI / 180) * Math.cos(43.6 * Math.PI / 180));
  return svg(L, H, `
  <rect width="${L}" height="${H}" fill="url(#briqueRose)"/><rect width="${L}" height="${H}" fill="#fff" opacity=".04"/>
  <path d="M260 250 A540 540 0 0 0 1340 250 L1340 230 H260Z" fill="#f2e6cf"/><path d="M260 250 A540 540 0 0 0 1340 250" fill="none" stroke="#b45309" stroke-width="6"/>
  <path d="M${cx} ${cy} L${f(cx + Math.sin(aOmbre) * 400)} ${f(cy + Math.cos(aOmbre) * 400)}" stroke="#2b1d12" stroke-width="16" opacity=".5" filter="url(#flou2)"/>
  ${lignes}
  <rect x="${cx - 70}" y="200" width="140" height="44" fill="#f2e6cf"/><path d="M${cx} ${cy} l0 -20" stroke="#111" stroke-width="6"/>
  <path d="M${cx} ${cy} L${cx} ${cy + 240}" stroke="#1f2937" stroke-width="7"/><path d="M${cx} ${cy + 240} L${cx} ${cy}" stroke="#4b5563" stroke-width="3"/>
  ${texte(800, 718, 'L\'HEURE PASSE, L\'AMITIÉ RESTE', { taille: 28, coul: '#7c2d12', police: POLICE_SERIF, ls: 3 })}
  ${texte(800, 756, 'MDCCCXII', { taille: 22, coul: '#7c2d12', police: POLICE_SERIF })}
  <!-- balcon et son ombre portée vers le bas-droite (soleil au sud-ouest) -->
  <rect x="1340" y="520" width="260" height="14" fill="#1f2937"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${1350 + i * 20}" y="534" width="4" height="70" fill="#1f2937"/>`).join('')}<rect x="1340" y="600" width="260" height="8" fill="#1f2937"/>
  <path d="M1340 608 L1600 608 L1600 700 L1420 700Z" fill="#000" opacity=".2"/>
  <!-- affiche municipale bilingue -->
  <rect x="80" y="560" width="290" height="380" fill="#fefce8" stroke="#1f2937" stroke-width="4"/>
  ${texte(225, 610, 'FÊTE DU QUARTIER', { taille: 22, coul: '#b91c1c' })}${texte(225, 640, 'Hèsta del barri', { taille: 18, coul: '#7c2d12', italique: true, gras: false })}
  ${texte(225, 700, '15 AOÛT', { taille: 46, coul: '#1f2937' })}${texte(225, 738, 'Assomption · bal à 21 h', { taille: 16, coul: '#374151', gras: false })}
  <circle cx="225" cy="810" r="40" fill="#b91c1c"/><path d="M225 784 v52 M199 810 h52" stroke="#facc15" stroke-width="8"/>
  ${texte(225, 900, 'Mairie de Toulouse', { taille: 16, coul: '#374151' })}${texte(225, 922, 'quartier des Carmes', { taille: 14, coul: '#374151', gras: false })}
  <!-- plaque de rue bilingue -->
  <rect x="1250" y="800" width="300" height="92" rx="6" fill="#1e3a8a" stroke="#f8fafc" stroke-width="3"/>${texte(1400, 836, 'RUE DES FILATIERS', { taille: 22, coul: '#fff' })}${texte(1400, 870, 'Carrièra dels Filatièrs', { taille: 18, coul: '#e0e7ff', italique: true, gras: false })}
  `);
}

export default [
  { nom: 'geo-capitole', l: L, h: H, svg: capitole, miniature: true },
  { nom: 'geo-pont-neuf', l: L, h: H, svg: pontNeuf, miniature: true },
  { nom: 'geo-cite-espace', l: L, h: H, svg: citeEspace, miniature: true },
  { nom: 'geo-abbesses', l: L, h: H, svg: abbesses, miniature: true },
  { nom: 'geo-carcassonne', l: L, h: H, svg: carcassonne, miniature: true },
  { nom: 'geo-alger', l: L, h: H, svg: alger, miniature: true },
  { nom: 'geo-kabylie', l: L, h: H, svg: kabylie, miniature: true },
  { nom: 'geo-le-cap', l: L, h: H, svg: leCap, miniature: true },
  { nom: 'geo-montreal', l: L, h: H, svg: montreal, miniature: true },
  { nom: 'geo-cadran', l: L, h: H, svg: cadran, miniature: true }
];
