// ============================================================
//  ilustraciones.js — Set de diseño premium de Arte'Sano:
//   1) ICONOS_LINEA: iconos de línea (monolínea) para las 8 líneas de
//      producto, a juego con el candado del panel admin.
//   2) generarIlustracionIngrediente(slug): insignia botánica circular
//      por ingrediente ancestral (arroz, guásimo, matarratón, coco,
//      chopo, caléndula, pepino, carbón activado, aguacate, hierbabuena,
//      rosas), en la misma técnica de curvas orgánicas que las hojas del
//      hero (ver plantillas.js) — pensada para que la tienda se sienta
//      una experiencia de boutique de lujo, no solo un catálogo.
// ============================================================

const VERDE = '#7C8B5D';
const VERDE_OSC = '#5F6D45';
const VERDE_PROF = '#41502E';
const VERDE_SUAVE = '#E9EFE1';
const BEIGE = '#C9A876';
const BEIGE_OSC = '#A88652';
const TERRACOTA = '#BE8B66';
const BLUSH = '#E8C9C0';
const CREMA = '#F5EDE0';
const CREMA_OSC = '#EDE2CF';
const TINTA = '#4A3F35';
const CARBON = '#3B342C';

// ============================================================
//  1) Iconos de línea — monolínea, 40×40, stroke=currentColor para que
//     hereden el color desde CSS (igual que ICONO_CANDADO).
// ============================================================
const T = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

export const ICONOS_LINEA = {
  'cuidado-del-cuerpo': `<svg viewBox="0 0 40 40" aria-hidden="true"><g ${T}><rect x="9" y="15" width="22" height="16" rx="6"/><path d="M13 15c0-4 2-7 7-7s7 3 7 7"/><path d="M20 8V4"/><path d="M9 23h22"/></g></svg>`,
  'cuidado-facial': `<svg viewBox="0 0 40 40" aria-hidden="true"><g ${T}><path d="M13 18c0-7 3-11 7-11s7 4 7 11c0 8-3 13-7 13s-7-5-7-13Z"/><path d="M15 18c1-1 2-1 3 0M22 18c1-1 2-1 3 0"/><path d="M17 24c1 1 2 1.4 3 1.4s2-.4 3-1.4"/><path d="M27 12c2 1 3 3 3 6"/></g></svg>`,
  corporal: `<svg viewBox="0 0 40 40" aria-hidden="true"><g ${T}><rect x="12" y="13" width="16" height="19" rx="4"/><path d="M16 13V9a4 4 0 0 1 8 0v4"/><path d="M12 19h16"/><path d="M20 23v5M17 25h6"/></g></svg>`,
  'lineas-especializadas': `<svg viewBox="0 0 40 40" aria-hidden="true"><g ${T}><path d="M13 18 17 7"/><path d="M27 18 23 7"/><path d="M11 18c0 7 4 13 9 13s9-6 9-13Z"/><circle cx="20" cy="24" r="1.6" fill="currentColor" stroke="none"/></g></svg>`,
  aseo: `<svg viewBox="0 0 40 40" aria-hidden="true"><g ${T}><rect x="14" y="15" width="10" height="17" rx="3"/><path d="M17 15v-3h4v3"/><path d="M24 12h4l2 3-2 2"/><path d="M19 21v7M16 24.5h6"/></g></svg>`,
  hogar: `<svg viewBox="0 0 40 40" aria-hidden="true"><g ${T}><path d="M9 19 20 9l11 10"/><path d="M12 17v13h16V17"/><path d="M17 30v-7h6v7"/></g></svg>`,
  otros: `<svg viewBox="0 0 40 40" aria-hidden="true"><g ${T}><rect x="9" y="17" width="22" height="14" rx="2"/><path d="M9 22h22"/><path d="M20 17v14"/><path d="M15 17c-2-3-1-7 2-7 2 0 3 3 3 7"/><path d="M25 17c2-3 1-7-2-7-2 0-3 3-3 7"/></g></svg>`,
};

// ============================================================
//  2) Insignias botánicas de ingredientes
// ============================================================

function marco(contenido, { anillo = TERRACOTA } = {}) {
  return `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
    <circle cx="160" cy="160" r="158" fill="${CREMA}"/>
    <circle cx="160" cy="160" r="158" fill="none" stroke="${CREMA_OSC}" stroke-width="1.5"/>
    <circle cx="160" cy="160" r="140" fill="none" stroke="${anillo}" stroke-width="1" stroke-dasharray="1 5" opacity=".55"/>
    ${contenido}
  </svg>`;
}

/** Hoja orgánica (óvalo con vena central), como las de plantillas.js pero reutilizable con tamaño/rotación libres. */
function hoja(cx, cy, largo, ancho, rot, color, vena = true) {
  const mitad = largo / 2;
  const d = `M${-mitad},0 Q0,${-ancho} ${mitad},0 Q0,${ancho} ${-mitad},0 Z`;
  const veinte = vena ? `<path d="M${-mitad + 3},0 L${mitad - 3},0" stroke="rgba(0,0,0,.15)" stroke-width="1"/>` : '';
  return `<g transform="translate(${cx},${cy}) rotate(${rot})"><path d="${d}" fill="${color}"/>${veinte}</g>`;
}

function tallo(puntos, color, grosor = 2.4) {
  const d = puntos.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${grosor}" stroke-linecap="round"/>`;
}

// ---------- Arroz: panícula con espiguillas colgantes ----------
function ilustracionArroz() {
  const tallo1 = tallo([[160, 250], [166, 150], [178, 78]], VERDE_OSC, 2.6);
  let espigas = '';
  const paso = [[176, 92], [172, 108], [180, 108], [170, 124], [180, 122], [168, 140], [178, 140], [166, 158], [176, 156], [163, 176]];
  paso.forEach(([x, y], i) => {
    const lado = i % 2 === 0 ? 1 : -1;
    espigas += hoja(x, y, 34, 8, lado * 55 - 90, BEIGE, false);
  });
  const hojasBase = hoja(148, 240, 90, 14, -150, VERDE, true) + hoja(172, 246, 80, 13, -25, VERDE, true);
  return marco(`${hojasBase}${tallo1}${espigas}`, { anillo: BEIGE_OSC });
}

// ---------- Guásimo: rama con foliolos y pequeñas vainas ----------
function ilustracionGuasimo() {
  const rama = tallo([[100, 230], [150, 170], [220, 100]], VERDE_OSC, 3);
  const pos = [[125, 200], [150, 172], [172, 150], [196, 126], [216, 104]];
  let hojas = '';
  pos.forEach(([x, y], i) => {
    const lado = i % 2 === 0 ? 1 : -1;
    hojas += hoja(x + lado * 16, y - lado * 6, 46, 17, lado * 40 - 45, VERDE);
  });
  const vainas = `<g fill="${BEIGE_OSC}"><ellipse cx="140" cy="210" rx="16" ry="6" transform="rotate(30 140 210)"/><ellipse cx="185" cy="150" rx="14" ry="5.5" transform="rotate(35 185 150)"/></g>`;
  return marco(`${rama}${hojas}${vainas}`, { anillo: VERDE });
}

// ---------- Matarratón: rama con foliolos en pares y flores rosadas ----------
function ilustracionMataraton() {
  const rama = tallo([[160, 250], [160, 170], [160, 90]], VERDE_OSC, 2.8);
  let foliolos = '';
  const alturas = [220, 200, 180, 160, 140, 120, 100];
  alturas.forEach((y, i) => {
    foliolos += hoja(160 - 24, y, 34, 12, -20, VERDE_PROF);
    foliolos += hoja(160 + 24, y, 34, 12, 20, VERDE_PROF);
  });
  const flor = (cx, cy, escala) => {
    let petalos = '';
    for (let a = 0; a < 5; a++) petalos += hoja(cx, cy, 20 * escala, 8 * escala, a * 72, BLUSH, false);
    return `<g>${petalos}<circle cx="${cx}" cy="${cy}" r="${3 * escala}" fill="${TERRACOTA}"/></g>`;
  };
  const flores = flor(120, 110, 1) + flor(205, 135, 0.85);
  return marco(`${rama}${foliolos}${flores}`, { anillo: BLUSH });
}

// ---------- Coco: corte transversal + hoja de palma ----------
function ilustracionCoco() {
  const palma = hoja(160, 60, 200, 30, -20, VERDE_PROF) + hoja(160, 55, 190, 28, 24, VERDE);
  const corte = `
    <circle cx="160" cy="195" r="72" fill="${BEIGE_OSC}"/>
    <circle cx="160" cy="195" r="72" fill="none" stroke="${TINTA}" stroke-width="1" opacity=".25"/>
    <circle cx="160" cy="195" r="58" fill="${CREMA}"/>
    <circle cx="160" cy="195" r="44" fill="#fff"/>
    <circle cx="160" cy="195" r="44" fill="none" stroke="${BEIGE}" stroke-width="1.5" opacity=".6"/>
    <g stroke="${BEIGE_OSC}" stroke-width="1" opacity=".5">
      <path d="M110 175q50 -18 100 0" fill="none"/>
      <path d="M105 195h110" fill="none"/>
      <path d="M110 215q50 18 100 0" fill="none"/>
    </g>`;
  return marco(`${palma}${corte}`, { anillo: BEIGE_OSC });
}

// ---------- Chopo (plátano/banano): racimo + hoja grande ----------
function ilustracionChopo() {
  const hojaGrande = hoja(215, 110, 150, 46, 35, VERDE_PROF) + `<path d="M180,90 Q225,110 265,135" stroke="rgba(0,0,0,.18)" stroke-width="1" fill="none"/>`;
  const platano = (cx, cy, rot) => `<g transform="translate(${cx},${cy}) rotate(${rot})">
      <path d="M-14,42 C-22,10 -14,-30 4,-46 C10,-50 16,-48 14,-42 C0,-28 -6,4 0,40 Z" fill="${BEIGE}"/>
      <path d="M-14,42 C-22,10 -14,-30 4,-46" fill="none" stroke="${BEIGE_OSC}" stroke-width="1" opacity=".5"/>
      <ellipse cx="8" cy="-45" rx="4" ry="6" fill="${VERDE_OSC}"/>
    </g>`;
  const racimo = platano(130, 210, 8) + platano(160, 215, -4) + platano(190, 208, -16);
  return marco(`${hojaGrande}${racimo}`, { anillo: VERDE });
}

// ---------- Caléndula: flor radiada ----------
function ilustracionCalendula() {
  let petalos = '';
  const n = 16;
  for (let i = 0; i < n; i++) petalos += hoja(160, 160, 92, 11, (360 / n) * i, i % 2 === 0 ? TERRACOTA : BEIGE, false);
  const centro = `<circle cx="160" cy="160" r="26" fill="${BEIGE_OSC}"/><circle cx="160" cy="160" r="26" fill="none" stroke="${TINTA}" stroke-width="1" opacity=".2"/>`;
  const hojasBase = hoja(120, 244, 60, 12, -60, VERDE) + hoja(196, 244, 60, 12, 60, VERDE);
  const tallito = tallo([[160, 250], [160, 210]], VERDE_OSC, 3);
  return marco(`${tallito}${hojasBase}${petalos}${centro}`, { anillo: TERRACOTA });
}

// ---------- Pepino: corte circular + zarcillo ----------
function ilustracionPepino() {
  const zarcillo = `<path d="M232 96c14 -4 22 6 16 18c-6 11 -20 10 -20 -2" stroke="${VERDE}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const corte = `
    <circle cx="160" cy="180" r="78" fill="${VERDE_OSC}"/>
    <circle cx="160" cy="180" r="68" fill="${VERDE_SUAVE}"/>
    <circle cx="160" cy="180" r="40" fill="#fbfaf3"/>`;
  let semillas = '';
  const n = 9;
  for (let i = 0; i < n; i++) {
    const ang = (360 / n) * i * (Math.PI / 180);
    const x = 160 + Math.cos(ang) * 26, y = 180 + Math.sin(ang) * 26;
    semillas += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6" ry="3" transform="rotate(${(ang * 180) / Math.PI + 90} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${CREMA_OSC}" stroke="${BEIGE}" stroke-width=".6"/>`;
  }
  const hojaLat = hoja(238, 122, 46, 16, 40, VERDE);
  return marco(`${hojaLat}${zarcillo}${corte}${semillas}`, { anillo: VERDE });
}

// ---------- Carbón activado: briquetas apiladas ----------
function ilustracionCarbonActivado() {
  const bloque = (x, y, w, h, rot) => `<g transform="translate(${x},${y}) rotate(${rot})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="10" fill="${CARBON}"/>
      <path d="M${-w / 3},${-h / 4} L${-w / 8},${h / 6} L${w / 6},${-h / 8}" stroke="rgba(255,255,255,.14)" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>`;
  const briquetas = bloque(120, 205, 92, 46, -8) + bloque(185, 178, 92, 46, 6) + bloque(150, 150, 92, 46, -4);
  let polvo = '';
  const specks = [[95, 230, 2.6], [220, 210, 2], [205, 240, 1.6], [110, 120, 2], [230, 150, 1.8], [90, 165, 1.6]];
  specks.forEach(([x, y, r]) => (polvo += `<circle cx="${x}" cy="${y}" r="${r}" fill="${TINTA}" opacity=".35"/>`));
  return marco(`${briquetas}${polvo}`, { anillo: CARBON });
}

// ---------- Aguacate: mitad con semilla ----------
function ilustracionAguacate() {
  const piel = `<path d="M160 90c50 0 74 46 74 92 0 44 -32 70 -74 70s-74 -26 -74 -70c0 -46 24 -92 74 -92Z" fill="${VERDE_PROF}"/>`;
  const pulpa = `<path d="M160 104c42 0 62 40 62 78 0 38 -26 60 -62 60s-62 -22 -62 -60c0 -38 20 -78 62 -78Z" fill="${VERDE_SUAVE}"/>`;
  const semilla = `<circle cx="160" cy="200" r="42" fill="${BEIGE_OSC}"/><circle cx="160" cy="200" r="42" fill="none" stroke="${TINTA}" stroke-width="1" opacity=".25"/><ellipse cx="148" cy="186" rx="12" ry="8" fill="rgba(255,255,255,.18)"/>`;
  const tallito = tallo([[160, 90], [160, 68], [172, 52]], VERDE_OSC, 3);
  const hojita = hoja(180, 58, 34, 12, 30, VERDE);
  return marco(`${tallito}${hojita}${piel}${pulpa}${semilla}`, { anillo: VERDE_PROF });
}

// ---------- Hierbabuena: ramillete de menta ----------
function ilustracionHierbabuena() {
  const t1 = tallo([[160, 250], [155, 170], [150, 100]], VERDE_OSC, 2.6);
  const t2 = tallo([[160, 250], [172, 190], [186, 130]], VERDE_OSC, 2.2);
  const pares = [[130, 100, 0], [150, 130, -6], [170, 160, 4], [140, 190, -4], [186, 130, 10], [200, 160, 2], [166, 220, -8]];
  let hojas = '';
  pares.forEach(([x, y, rot], i) => {
    const lado = i % 2 === 0 ? 1 : -1;
    hojas += hoja(x, y, 40, 15, rot + lado * 35, i % 3 === 0 ? VERDE_PROF : VERDE);
  });
  return marco(`${t1}${t2}${hojas}`, { anillo: VERDE });
}

// ---------- Rosas: rosa estilizada ----------
function ilustracionRosas() {
  let petalos = '';
  const capas = [
    { r: 20, n: 1, color: TERRACOTA },
    { r: 34, n: 5, color: '#D98E86' },
    { r: 50, n: 7, color: BLUSH },
    { r: 66, n: 8, color: '#F0DAD3' },
  ];
  capas.forEach(({ r, n, color }) => {
    for (let i = 0; i < n; i++) {
      const rot = (360 / n) * i + r;
      petalos += `<g transform="translate(160,150) rotate(${rot})"><path d="M0,0 C${r * 0.6},${-r * 0.5} ${r * 0.6},${-r * 1.1} 0,${-r * 1.3} C${-r * 0.6},${-r * 1.1} ${-r * 0.6},${-r * 0.5} 0,0 Z" fill="${color}" opacity=".95"/></g>`;
    }
  });
  const tallito = tallo([[160, 232], [160, 260]], VERDE_OSC, 3.2);
  const hojita = hoja(180, 250, 34, 12, 30, VERDE) + hoja(140, 256, 30, 11, -35, VERDE);
  return marco(`${tallito}${hojita}${petalos}`, { anillo: BLUSH });
}

const GENERADORES = {
  arroz: ilustracionArroz,
  guasimo: ilustracionGuasimo,
  mataraton: ilustracionMataraton,
  coco: ilustracionCoco,
  chopo: ilustracionChopo,
  calendula: ilustracionCalendula,
  pepino: ilustracionPepino,
  'carbon-activado': ilustracionCarbonActivado,
  aguacate: ilustracionAguacate,
  hierbabuena: ilustracionHierbabuena,
  rosas: ilustracionRosas,
};

/** Genera la insignia SVG del ingrediente por slug, o null si no hay diseño para ese slug. */
export function generarIlustracionIngrediente(slug) {
  const fn = GENERADORES[slug];
  return fn ? fn() : null;
}

export const SLUGS_ILUSTRADOS = Object.keys(GENERADORES);
