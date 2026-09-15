// ============================================================
//  etiquetas.js — Generador de etiquetas de producto en SVG, replicando
//  el empaque real de Arte'Sano: tarjeta kraft/crema, cordel de fibra
//  natural, logotipo y una rama botánica de línea fina. Se usa para los
//  productos que aún no tienen fotografía profesional.
// ============================================================
const F_MARCA = `'Playfair Display',Georgia,'Times New Roman',serif`;
const OLIVA = '#5F6D45';
const OLIVA_CLARO = '#7C8B5D';
const BEIGE = '#B08552';
const CREMA = '#F7F1E6';
const LINEA = '#D8C9A8';

function envolverTexto(texto, maxCaracteres) {
  const palabras = String(texto || '').split(/\s+/);
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p;
    if (prueba.length > maxCaracteres && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}

/** Rama botánica de línea fina (folíolos alternos), como en los empaques reales. */
function ramaBotanica(cx, cy, escala = 1, rotacion = 0, color = OLIVA) {
  const hoja = (x, y, rot, largo) =>
    `<g transform="translate(${x},${y}) rotate(${rot})"><path d="M0,0 Q${largo * 0.3},${-largo * 0.32} ${largo},0 Q${largo * 0.3},${largo * 0.32} 0,0 Z" fill="${color}"/></g>`;
  const puntos = [
    [0, 70, -36, 13], [5, 48, 36, 13], [-4, 26, -32, 12], [6, 4, 33, 12],
    [-5, -18, -30, 10], [5, -40, 31, 10], [-4, -60, -26, 8], [3, -78, 25, 7],
  ];
  const hojas = puntos.map(([x, y, rot, largo]) => hoja(x, y, rot, largo)).join('');
  return `<g transform="translate(${cx},${cy}) rotate(${rotacion}) scale(${escala})">
    <path d="M0,68 C-2,30 2,-10 0,-48" fill="none" stroke="${color}" stroke-width="2.4" stroke-linecap="round"/>
    ${hojas}
  </g>`;
}

function iconoFrasco(cx, cy, escala = 1, color = OLIVA) {
  return `<g transform="translate(${cx - 26 * escala},${cy - 40 * escala}) scale(${escala})" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="14" y="0" width="24" height="10" rx="2"/>
    <path d="M18 10 L18 20 L8 34 L8 78 Q8 82 12 82 L40 82 Q44 82 44 78 L44 34 L34 20 L34 10"/>
    <line x1="8" y1="46" x2="44" y2="46"/>
  </g>`;
}

function iconoPerfume(cx, cy, escala = 1, color = OLIVA) {
  return `<g transform="translate(${cx - 20 * escala},${cy - 44 * escala}) scale(${escala})" fill="none" stroke="${color}" stroke-width="2.2" stroke-linejoin="round">
    <rect x="12" y="0" width="16" height="14" rx="2"/>
    <circle cx="20" cy="-4" r="3" fill="${color}" stroke="none"/>
    <path d="M8 14 L32 14 L36 26 L36 78 Q36 84 30 84 L10 84 Q4 84 4 78 L4 26 Z"/>
    <line x1="4" y1="34" x2="36" y2="34"/>
  </g>`;
}

function iconoJabon(cx, cy, escala = 1, color = OLIVA) {
  return `<g transform="translate(${cx - 32 * escala},${cy - 20 * escala}) scale(${escala})" fill="none" stroke="${color}" stroke-width="2.2">
    <rect x="2" y="2" width="60" height="36" rx="10"/>
    <path d="M10 14 Q32 4 54 14" stroke-width="1.6" opacity=".6"/>
  </g>`;
}

const ICONOS = { frasco: iconoFrasco, perfume: iconoPerfume, jabon: iconoJabon };

/**
 * Genera la etiqueta SVG de un producto.
 * @param {object} p { nombre, ingrediente, leyenda, tipo: 'jabon'|'frasco'|'perfume', ancho, alto }
 */
export function generarEtiqueta({ nombre, ingrediente = '', leyenda = 'Producto artesanal', tipo = 'jabon', ancho = 480, alto = 600 }) {
  const icono = ICONOS[tipo] || iconoJabon;
  const cx = ancho / 2;
  const nombreLineas = envolverTexto(nombre.toUpperCase(), tipo === 'jabon' ? 14 : 12);
  const tamNombre = nombreLineas.length > 1 ? 34 : 42;
  const yNombreInicio = alto * 0.62;
  const nombreSvg = nombreLineas
    .map((l, i) => `<text x="${cx}" y="${yNombreInicio + i * (tamNombre + 6)}" text-anchor="middle" font-family="${F_MARCA}" font-weight="700" font-size="${tamNombre}" letter-spacing="2" fill="${OLIVA}">${escaparXml(l)}</text>`)
    .join('');
  const yIngrediente = yNombreInicio + nombreLineas.length * (tamNombre + 6) + 6;

  return `<svg viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escaparXml(nombre)}">
  <rect width="${ancho}" height="${alto}" fill="${CREMA}"/>
  <rect x="14" y="14" width="${ancho - 28}" height="${alto - 28}" fill="none" stroke="${LINEA}" stroke-width="2"/>
  <rect x="20" y="20" width="${ancho - 40}" height="${alto - 40}" fill="none" stroke="${LINEA}" stroke-width="1"/>

  <g transform="translate(${cx},64)">
    <path d="M-30,-6 C-16,-20 16,-20 30,-6" fill="none" stroke="${BEIGE}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="-30" cy="-6" r="4" fill="${BEIGE}"/>
    <circle cx="30" cy="-6" r="4" fill="${BEIGE}"/>
  </g>

  <text x="${cx}" y="128" text-anchor="middle" font-family="${F_MARCA}" font-style="italic" font-weight="600" font-size="34" fill="${OLIVA_CLARO}">Arte<tspan fill="${BEIGE}">'</tspan>Sano</text>
  <text x="${cx}" y="150" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="11" letter-spacing="6" fill="${OLIVA}">BOUTIQUE</text>

  <line x1="${cx - 70}" y1="172" x2="${cx + 70}" y2="172" stroke="${LINEA}" stroke-width="1.5"/>

  ${tipo === 'jabon' ? ramaBotanica(cx, alto * 0.4, 1.15, 0, OLIVA) : icono(cx, alto * 0.4, 1.15, OLIVA)}

  ${nombreSvg}
  ${ingrediente ? `<text x="${cx}" y="${yIngrediente}" text-anchor="middle" font-family="${F_MARCA}" font-style="italic" font-size="17" fill="${BEIGE}">${escaparXml(ingrediente)}</text>` : ''}

  <line x1="${cx - 90}" y1="${alto - 66}" x2="${cx + 90}" y2="${alto - 66}" stroke="${LINEA}" stroke-width="1"/>
  <text x="${cx}" y="${alto - 40}" text-anchor="middle" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="12" letter-spacing="2" fill="${OLIVA}">${escaparXml(leyenda.toUpperCase())}</text>
</svg>`;
}

function escaparXml(t) {
  return String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
