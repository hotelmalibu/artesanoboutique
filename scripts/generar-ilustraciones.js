// ============================================================
//  generar-ilustraciones.js — Genera las insignias botánicas SVG de los
//  ingredientes ancestrales y las guarda como archivos estáticos en
//  src/tienda/publico/imagenes/ingredientes/<slug>.svg
//
//  Uso: node scripts/generar-ilustraciones.js
// ============================================================
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generarIlustracionIngrediente, SLUGS_ILUSTRADOS } from '../src/tienda/ilustraciones.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEST = join(__dirname, '..', 'src', 'tienda', 'publico', 'imagenes', 'ingredientes');
mkdirSync(DEST, { recursive: true });

for (const slug of SLUGS_ILUSTRADOS) {
  const svg = generarIlustracionIngrediente(slug);
  writeFileSync(join(DEST, `${slug}.svg`), svg, 'utf8');
  console.log('Generada:', slug + '.svg');
}
console.log(`\nListo: ${SLUGS_ILUSTRADOS.length} insignias en ${DEST}`);
