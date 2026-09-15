// ============================================================
//  semilla.js — Siembra del catálogo real de Arte'Sano en el almacén
//  local (en memoria + Postgres). Los datos viven en semilla.datos.js
//  para poder reutilizarlos también desde scripts de migración externos.
// ============================================================
import { guardar, hayDatos, listar } from './catalogo.js';
import { CATEGORIAS, INGREDIENTES, ARTESANOS, productos } from './semilla.datos.js';

/** Carga el catálogo real de Arte'Sano si el catalogo esta vacio. Devuelve cuantos productos creo. */
export function sembrarSiVacio() {
  if (hayDatos()) return 0;
  const ids = { categorias: {}, ingredientes: {}, artesanos: {} };
  for (const c of CATEGORIAS) ids.categorias[c.slug] = guardar('categorias', c).id;
  for (const i of INGREDIENTES) ids.ingredientes[i.slug] = guardar('ingredientes', i).id;
  for (const a of ARTESANOS) ids.artesanos[a.slug] = guardar('artesanos', a).id;
  let n = 0;
  for (const p of productos(ids)) {
    guardar('productos', p);
    n++;
  }
  console.log(`[semilla] Catálogo real de Arte'Sano cargado: ${CATEGORIAS.length} líneas, ${INGREDIENTES.length} ingredientes, ${n} productos.`);
  return n;
}

export function resumenSemilla() {
  return { categorias: listar('categorias').length, productos: listar('productos').length };
}
