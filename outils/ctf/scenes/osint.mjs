// Images du personnage FICTIF de l'enquête OSINT (Inès Valadier) : avatar, publications, selfie au reflet
// révélateur et vue depuis la fenêtre du bureau. Fichier d'auteur : jamais publié.
import { svg, degrade, nuage, f } from './_base.mjs';

const visage = (cx, cy, s = 1) => `<g transform="translate(${cx} ${cy}) scale(${s})">
  <path d="M-120 230 Q-110 120 0 112 Q110 120 120 230Z" fill="#0f766e"/><path d="M-36 112 Q0 150 36 112 L30 96 H-30Z" fill="#c98d63"/>
  <rect x="-24" y="60" width="48" height="50" fill="#c98d63"/>
  <ellipse cx="0" cy="0" rx="78" ry="92" fill="#d9a074"/>
  <path d="M-86 10 Q-96 -96 0 -104 Q96 -96 86 10 Q80 -40 40 -58 Q-10 -30 -70 -40 Q-82 -20 -86 10Z" fill="#2a1a12"/>
  <path d="M-86 10 Q-92 70 -70 96 L-62 30Z M86 10 Q92 70 70 96 L62 30Z" fill="#2a1a12"/>
  <ellipse cx="-30" cy="4" rx="9" ry="11" fill="#2a1a12"/><ellipse cx="30" cy="4" rx="9" ry="11" fill="#2a1a12"/><path d="M-46 -18 Q-30 -26 -14 -18 M14 -18 Q30 -26 46 -18" stroke="#2a1a12" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M0 10 Q-8 36 0 40" stroke="#b47a54" stroke-width="4" fill="none"/><path d="M-26 56 Q0 74 26 56" stroke="#9f3a3a" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="-80" cy="30" r="6" fill="#facc15"/><circle cx="80" cy="30" r="6" fill="#facc15"/></g>`;

function avatar() {
  return svg(400, 400, `<rect width="400" height="400" fill="url(#fa)"/><circle cx="320" cy="80" r="60" fill="#fde68a" opacity=".6"/>${visage(200, 190, 1.2)}`,
    { defs: degrade('fa', [[0, '#fb923c'], [1, '#a855f7']]), vignette: false });
}

function chat() {
  return svg(800, 800, `
  <rect width="800" height="800" fill="#e7dccb"/><rect y="0" width="800" height="300" fill="#d8ccb8"/>
  <rect x="520" y="60" width="200" height="150" fill="#94a3b8"/><rect x="530" y="70" width="180" height="130" fill="#bfdbfe"/><path d="M620 70 V200 M530 135 H710" stroke="#94a3b8" stroke-width="6"/>
  <path d="M60 340 Q60 280 120 280 H680 Q740 280 740 340 V640 H60Z" fill="#475569"/><rect x="40" y="430" width="720" height="250" rx="40" fill="#556274"/><rect x="90" y="400" width="620" height="120" rx="30" fill="#64748b"/>
  <g transform="translate(400 470)">
    <ellipse cx="0" cy="10" rx="170" ry="80" fill="#e8893a"/><ellipse cx="-30" cy="0" rx="120" ry="60" fill="#f29d4d"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${-120 + i * 36} -40 q10 30 -4 70" stroke="#c96a22" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}
    <circle cx="130" cy="-20" r="62" fill="#f29d4d"/><path d="M90 -70 L100 -112 L128 -78Z M150 -80 L178 -110 L182 -64Z" fill="#e8893a"/><path d="M98 -78 L104 -100 L118 -82Z" fill="#fbcfe8"/>
    <path d="M104 -18 q14 8 26 0 M146 -22 q14 8 26 0" stroke="#5b3a1a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M134 2 l6 6 l6 -6z" fill="#db2777"/>
    <path d="M-170 30 Q-240 40 -220 -20 Q-200 -60 -160 -40" stroke="#e8893a" stroke-width="30" fill="none" stroke-linecap="round"/>
    <ellipse cx="60" cy="72" rx="40" ry="16" fill="#f8c08b"/></g>
  <rect x="80" y="380" width="120" height="90" rx="20" fill="#a78bfa" transform="rotate(-12 140 425)"/>
  `);
}

function velo() {
  const roue = (x, y) => `<circle cx="${x}" cy="${y}" r="120" fill="none" stroke="#1f2937" stroke-width="14"/><circle cx="${x}" cy="${y}" r="10" fill="#1f2937"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path d="M${x} ${y} L${f(x + Math.cos(a) * 112)} ${f(y + Math.sin(a) * 112)}" stroke="#9ca3af" stroke-width="2"/>`; }).join('')}`;
  return svg(800, 800, `
  <rect width="800" height="640" fill="url(#briqueRose)"/><rect y="640" width="800" height="160" fill="#a8a29e"/><rect y="640" width="800" height="12" fill="#78716c"/>
  <path d="M120 660 L700 660 L760 720 L180 720Z" fill="#000" opacity=".15"/>
  ${roue(210, 560)}${roue(590, 560)}
  <path d="M210 560 L330 380 L560 380 L590 560 M330 380 L400 560 L560 380 M400 560 L210 560" stroke="#facc15" stroke-width="18" fill="none" stroke-linejoin="round"/>
  <path d="M330 380 L310 330 M280 322 H350" stroke="#1f2937" stroke-width="14" stroke-linecap="round"/><path d="M560 380 L570 320 Q600 300 630 320" stroke="#1f2937" stroke-width="12" fill="none" stroke-linecap="round"/>
  <circle cx="400" cy="560" r="28" fill="none" stroke="#1f2937" stroke-width="8"/>
  <rect x="160" y="300" width="160" height="70" rx="10" fill="#a16207" opacity=".85"/>`);
}

function selfie() {
  // reflet dans les verres : devanture du café d'en face, inversée gauche-droite
  const reflet = (cx, cy, s) => `<g transform="translate(${cx} ${cy}) scale(${-s} ${s})">
    <rect x="-150" y="-80" width="300" height="160" fill="#7c4a3a"/><rect x="-150" y="-80" width="300" height="160" fill="url(#briqueRoseFine)" opacity=".5"/>
    <rect x="-130" y="-66" width="260" height="46" fill="#0f3d3e"/><text x="0" y="-33" font-size="30" font-weight="700" fill="#fef3c7" text-anchor="middle" letter-spacing="2">CAFÉ ZÉPHYR</text>
    <path d="M-140 -18 H140 L124 14 H-124Z" fill="#14b8a6"/>${Array.from({ length: 7 }, (_, i) => `<path d="M${-124 + i * 38} -18 h19 l-3 32 h-19z" fill="#f0fdfa" opacity=".8"/>`).join('')}
    <rect x="-110" y="20" width="60" height="60" fill="#1f2937" opacity=".7"/><rect x="50" y="20" width="60" height="60" fill="#1f2937" opacity=".7"/></g>`;
  const verre = (cx, id, s, dx) => `<clipPath id="${id}"><ellipse cx="${cx}" cy="430" rx="100" ry="82"/></clipPath>
    <ellipse cx="${cx}" cy="430" rx="100" ry="82" fill="url(#verreG)"/><g clip-path="url(#${id})" opacity=".62">${reflet(cx + dx, 432, s)}</g>
    <ellipse cx="${cx - 30}" cy="398" rx="40" ry="14" fill="#fff" opacity=".18" transform="rotate(-18 ${cx - 30} 398)"/>
    <ellipse cx="${cx}" cy="430" rx="100" ry="82" fill="none" stroke="#111827" stroke-width="10"/>`;
  return svg(800, 1000, `
  <rect width="800" height="1000" fill="url(#rue)"/>
  <rect x="0" y="80" width="260" height="640" fill="url(#briqueRose)" opacity=".9"/><rect x="560" y="40" width="240" height="680" fill="url(#briqueRose)" opacity=".85"/>
  <rect x="600" y="120" width="70" height="110" fill="#334155"/><rect x="40" y="160" width="70" height="110" fill="#334155"/><rect x="40" y="340" width="70" height="110" fill="#334155"/>
  <rect y="720" width="800" height="280" fill="#d6c7ad"/>
  <g transform="translate(400 470)">
    <path d="M-250 530 Q-240 260 0 250 Q240 260 250 530Z" fill="#f8fafc"/><path d="M-70 250 Q0 320 70 250 L60 220 H-60Z" fill="#d9a074"/>
    <rect x="-44" y="150" width="88" height="90" fill="#d9a074"/>
    <ellipse cx="0" cy="0" rx="170" ry="200" fill="#d9a074"/>
    <path d="M-186 30 Q-206 -210 0 -226 Q206 -210 186 30 Q176 -80 90 -124 Q-20 -64 -150 -86 Q-180 -40 -186 30Z" fill="#2a1a12"/>
    <path d="M-186 30 Q-200 160 -150 210 L-136 60Z M186 30 Q200 160 150 210 L136 60Z" fill="#2a1a12"/>
    <path d="M-60 128 Q0 166 60 128" stroke="#9f3a3a" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M0 30 Q-16 84 0 92" stroke="#b47a54" stroke-width="7" fill="none"/></g>
  <path d="M290 430 H510" stroke="#111827" stroke-width="12"/>
  ${verre(295, 'vg', 0.5, -24)}${verre(505, 'vd', 0.62, -40)}
  <path d="M196 410 L150 380 M604 410 L650 380" stroke="#111827" stroke-width="10"/>
  <ellipse cx="640" cy="930" rx="70" ry="22" fill="#f8fafc"/><rect x="600" y="860" width="80" height="70" rx="10" fill="#f8fafc"/><ellipse cx="640" cy="862" rx="40" ry="10" fill="#5b3a1a"/>
  <path d="M90 930 Q150 880 210 930 Q150 950 90 930Z" fill="#d97706"/>
  `, { defs: degrade('rue', [[0, '#bfdbfe'], [1, '#e0e7ff']]) + `<radialGradient id="verreG" cx="40%" cy="35%" r="80%"><stop offset="0" stop-color="#3b4b5e"/><stop offset="1" stop-color="#0b1220"/></radialGradient>` });
}

function vuePause() {
  // vue depuis la fenêtre d'un bureau : clocher octogonal en brique (trois étages en plein cintre, deux en mitre, flèche)
  const etage = (y, l, h, mitre) => {
    const x = 600 - l / 2;
    const arcs = [0, 1, 2].map(k => {
      const w = l / 3, ax = x + k * w + w * 0.18, aw = w * 0.64, ab = y + h - 8;
      const sommet = mitre ? `L${f(ax + aw / 2)} ${f(y + 12)} L${f(ax + aw)} ${f(y + h * 0.42)}` : `A${f(aw / 2)} ${f(aw / 2)} 0 0 1 ${f(ax + aw)} ${f(y + h * 0.42)}`;
      return `<path d="M${f(ax)} ${ab} V${f(y + h * 0.42)} ${sommet} V${ab}Z" fill="#3a2a26"/>`;
    }).join('');
    return `<rect x="${f(x)}" y="${y}" width="${l}" height="${h}" fill="url(#briqueRoseFine)"/><rect x="${f(x)}" y="${y}" width="${f(l / 3)}" height="${h}" fill="#000" opacity=".12"/><rect x="${f(x + l * 2 / 3)}" y="${y}" width="${f(l / 3)}" height="${h}" fill="#fff" opacity=".08"/>${arcs}<rect x="${f(x - 6)}" y="${y + h - 6}" width="${l + 12}" height="10" fill="#e2c9b2"/>`;
  };
  return svg(1200, 900, `
  <rect width="1200" height="900" fill="url(#cielT)"/>${nuage(250, 140, 1.2, 0.8)}${nuage(960, 100, 0.9, 0.7)}
  ${Array.from({ length: 7 }, (_, i) => `<path d="M${i * 190 - 60} ${640 + (i % 2) * 30} L${i * 190 + 40} ${590 + (i % 3) * 14} L${i * 190 + 160} ${640 + (i % 2) * 30}Z" fill="url(#tuiles)"/><rect x="${i * 190 - 60}" y="${640 + (i % 2) * 30}" width="220" height="200" fill="#c98366"/>`).join('')}
  <path d="M300 640 L380 560 H820 L900 640Z" fill="url(#tuiles)"/><rect x="300" y="640" width="600" height="140" fill="url(#briqueRose)"/>
  ${etage(500, 300, 110, false)}${etage(400, 270, 100, false)}${etage(310, 240, 92, false)}${etage(228, 210, 84, true)}${etage(156, 180, 74, true)}
  <path d="M520 158 L600 30 L680 158Z" fill="url(#briqueRoseFine)"/><path d="M600 30 L680 158 H640Z" fill="#fff" opacity=".1"/>${Array.from({ length: 5 }, (_, i) => `<circle cx="${f(528 + i * 7)}" cy="${f(146 - i * 22)}" r="5" fill="#d9a183"/><circle cx="${f(672 - i * 7)}" cy="${f(146 - i * 22)}" r="5" fill="#d9a183"/>`).join('')}
  <path d="M600 30 V8 M592 16 H608" stroke="#374151" stroke-width="4"/>
  <path d="M0 0 H1200 V900 H0Z M110 70 V820 H1090 V70Z" fill="#f1ede6" fill-rule="evenodd"/><path d="M110 70 H1090 V820 H110Z" fill="none" stroke="#d6cfc2" stroke-width="18"/>
  <rect x="80" y="800" width="1040" height="40" fill="#e7e0d3"/>
  <path d="M880 700 h110 v70 q0 30 -30 30 h-50 q-30 0 -30 -30z" fill="#f8fafc"/><path d="M990 716 q36 0 30 30 q-4 22 -30 20" stroke="#f8fafc" stroke-width="12" fill="none"/><ellipse cx="935" cy="702" rx="55" ry="10" fill="#5b3a1a"/>
  <path d="M920 680 q-10 -20 6 -40 q10 -14 -4 -30 M950 676 q-10 -18 4 -36" stroke="#fff" stroke-width="5" fill="none" opacity=".6"/>
  `, { defs: degrade('cielT', [[0, '#7fb2e5'], [1, '#e4effa']]) });
}

export default [
  { nom: 'osint-avatar', l: 400, h: 400, svg: avatar },
  { nom: 'osint-chat', l: 800, h: 800, svg: chat },
  { nom: 'osint-velo', l: 800, h: 800, svg: velo },
  { nom: 'osint-selfie', l: 800, h: 1000, svg: selfie },
  { nom: 'osint-vue-pause', l: 1200, h: 900, svg: vuePause }
];
