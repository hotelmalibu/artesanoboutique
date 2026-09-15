// ============================================================
//  generar-etiquetas.js — Genera las etiquetas SVG (kraft + cordel) para
//  los productos sin foto profesional y las guarda como archivos estáticos
//  en src/tienda/publico/imagenes/etiquetas/<slug>.svg
//
//  Uso: node scripts/generar-etiquetas.js
// ============================================================
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generarEtiqueta } from '../src/tienda/etiquetas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEST = join(__dirname, '..', 'src', 'tienda', 'publico', 'imagenes', 'etiquetas');
mkdirSync(DEST, { recursive: true });

const PRODUCTOS = [
  { slug: 'mataraton', nombre: 'Matarratón', ingrediente: 'Gliricidia sepium', leyenda: 'Jabón medicinal', tipo: 'jabon' },
  { slug: 'coco', nombre: 'Coco', ingrediente: 'Cocos nucifera', leyenda: 'Jabón 100% natural', tipo: 'jabon' },
  { slug: 'aguacate', nombre: 'Aguacate', ingrediente: 'Persea americana', leyenda: 'Jabón 100% natural', tipo: 'jabon' },
  { slug: 'rosas', nombre: 'Rosas', ingrediente: 'Rosa damascena', leyenda: 'Jabón artesanal', tipo: 'jabon' },
  { slug: 'calendula', nombre: 'Caléndula', ingrediente: 'Ungüento anti-inflamatorio', leyenda: 'Producto artesanal', tipo: 'frasco' },
  { slug: 'piel-de-porcelana', nombre: 'Piel de Porcelana', ingrediente: 'Técnica oriental', leyenda: 'Crema artesanal', tipo: 'frasco' },
  { slug: 'gel-cannabis-coca-arnica', nombre: 'Cannabis, Coca y Árnica', ingrediente: 'Gel para golpes e inflamación', leyenda: 'Producto artesanal', tipo: 'frasco' },
  { slug: 'proteccion-mineral', nombre: 'Protección Mineral', ingrediente: 'Desodorante natural en spray', leyenda: 'Producto artesanal', tipo: 'frasco' },
  { slug: 'colada-de-chopo', nombre: 'Colada de Chopo', ingrediente: 'Alimento tradicional Zenú', leyenda: 'Suplemento sin gluten', tipo: 'frasco' },
  { slug: 'aqva-bvlgari', nombre: "AQVA D'Bvlgari", leyenda: 'Fragancia artesanal', tipo: 'perfume' },
  { slug: 'good-girl', nombre: 'Good Girl', leyenda: 'Fragancia artesanal', tipo: 'perfume' },
  { slug: 'amber-rouge', nombre: 'Amber Rouge Orientica', leyenda: 'Fragancia artesanal', tipo: 'perfume' },
  { slug: 'omnia-crystal', nombre: 'Omnia Crystal', leyenda: 'Fragancia artesanal', tipo: 'perfume' },
  { slug: 'invictus', nombre: 'Invictus', leyenda: 'Fragancia artesanal', tipo: 'perfume' },
  { slug: 'olympea', nombre: 'Olympea', leyenda: 'Fragancia artesanal', tipo: 'perfume' },
  { slug: 'la-vie-est-belle', nombre: 'La Vie Est Belle', leyenda: 'Fragancia artesanal', tipo: 'perfume' },
  { slug: 'bharara-king', nombre: 'Bharara King', leyenda: 'Fragancia artesanal', tipo: 'perfume' },
];

for (const p of PRODUCTOS) {
  const svg = generarEtiqueta(p);
  writeFileSync(join(DEST, `${p.slug}.svg`), svg, 'utf8');
  console.log('Generada:', p.slug + '.svg');
}
console.log(`\nListo: ${PRODUCTOS.length} etiquetas en ${DEST}`);
