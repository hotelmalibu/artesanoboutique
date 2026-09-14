// ============================================================
//  catalogo.js — Almacen en memoria del catalogo (capa en vivo) con
//  replica en PostgreSQL (db.js). Tablas: productos, categorias,
//  ingredientes, artesanos.
//
//  Forma de un PRODUCTO:
//   { id, slug, nombre, descripcionCorta, descripcion (HTML saneado),
//     beneficios, modoUso, advertencias, categoriaId, artesanoId,
//     ingredienteIds[], ingredienteProtagonistaId,
//     tipoIva, precioIncluyeIva, precioCop, precioComparacionCop, precioUsd,
//     precioMayoristaCop, pesoGramos, invima, tipoPiel[], etiquetas[],
//     estado (borrador|publicado|archivado), destacado,
//     variantes[{ sku, nombre, precioCop, precioUsd, stock, umbralStock, imagenUrl, porDefecto }],
//     imagenes[{ url, alt }], seoTitulo, seoDescripcion, creado, actualizado }
// ============================================================
import { config, TIPOS_IVA } from '../config.js';
import { dbGuardarRegistro, dbEliminarRegistro } from './db.js';
import { slugificar, limpiar, sanearHtml } from '../util/texto.js';

export const TABLAS = ['productos', 'categorias', 'ingredientes', 'artesanos'];
export const ESTADOS_PRODUCTO = ['borrador', 'publicado', 'archivado'];

/** @type {Record<string, Map<number, object>>} */
const tablas = Object.fromEntries(TABLAS.map((t) => [t, new Map()]));
const contadores = Object.fromEntries(TABLAS.map((t) => [t, 0]));

function persistir(tabla, obj) {
  dbGuardarRegistro(tabla, obj).catch((e) => console.error(`[catalogo] No se pudo guardar ${tabla}/${obj.id}:`, e.message));
}

// ---------- Hidratacion ----------

export function hidratarCatalogo(filas) {
  let n = 0;
  for (const { tabla, datos } of filas || []) {
    if (!tablas[tabla] || !datos?.id) continue;
    tablas[tabla].set(datos.id, datos);
    contadores[tabla] = Math.max(contadores[tabla], datos.id);
    n++;
  }
  return n;
}

export function hayDatos() {
  return tablas.productos.size > 0 || tablas.categorias.size > 0;
}

// ---------- Lectura generica ----------

export function listar(tabla) {
  return [...(tablas[tabla]?.values() || [])].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id - b.id);
}

export function obtener(tabla, id) {
  return tablas[tabla]?.get(Number(id)) || null;
}

export function obtenerPorSlug(tabla, slug) {
  for (const r of tablas[tabla]?.values() || []) if (r.slug === slug) return r;
  return null;
}

// ---------- Escritura generica ----------

function slugUnico(tabla, base, idActual) {
  let s = slugificar(base);
  let i = 2;
  while ([...tablas[tabla].values()].some((r) => r.slug === s && r.id !== idActual)) s = `${slugificar(base)}-${i++}`;
  return s;
}

/**
 * Crea o actualiza un registro. Devuelve el registro guardado.
 * Los productos pasan por normalizarProducto() para validar y limpiar.
 */
export function guardar(tabla, datos) {
  if (!tablas[tabla]) throw new Error('Tabla desconocida: ' + tabla);
  const id = Number(datos.id) || ++contadores[tabla];
  const previo = tablas[tabla].get(id);
  let registro = { ...(previo || {}), ...datos, id };
  registro.slug = slugUnico(tabla, datos.slug || datos.nombre || String(id), id);
  if (tabla === 'productos') registro = normalizarProducto(registro, previo);
  else {
    registro.nombre = limpiar(registro.nombre, 160);
    registro.activo = registro.activo !== false;
  }
  registro.creado = previo?.creado || registro.creado || Date.now();
  registro.actualizado = Date.now();
  tablas[tabla].set(id, registro);
  persistir(tabla, registro);
  return registro;
}

export function eliminar(tabla, id) {
  const ok = tablas[tabla]?.delete(Number(id));
  if (ok) dbEliminarRegistro(tabla, Number(id)).catch(() => {});
  return !!ok;
}

// ---------- Productos ----------

function numero(v, defecto = 0) {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : defecto;
}

function lista(v) {
  if (Array.isArray(v)) return v.map((x) => limpiar(x, 60)).filter(Boolean);
  return String(v || '').split(',').map((x) => limpiar(x, 60)).filter(Boolean);
}

export function normalizarProducto(p, previo) {
  const nombre = limpiar(p.nombre, 160);
  if (!nombre) throw new Error('El producto necesita un nombre.');
  const tipoIva = TIPOS_IVA.includes(p.tipoIva) ? p.tipoIva : config.tienda.ivaPorDefecto;
  const precioCop = numero(p.precioCop);
  const estado = ESTADOS_PRODUCTO.includes(p.estado) ? p.estado : 'borrador';

  // Variantes: si no viene ninguna, se crea una por defecto con el precio base.
  let variantes = Array.isArray(p.variantes) ? p.variantes : [];
  variantes = variantes
    .map((v, i) => ({
      sku: limpiar(v.sku, 60) || `AS-${p.id}-${i + 1}`,
      nombre: limpiar(v.nombre, 80) || 'Único',
      precioCop: numero(v.precioCop, precioCop),
      precioUsd: numero(v.precioUsd) || null,
      stock: Math.max(0, parseInt(v.stock, 10) || 0),
      umbralStock: Math.max(0, parseInt(v.umbralStock, 10) || 5),
      imagenUrl: limpiar(v.imagenUrl, 500) || '',
      porDefecto: !!v.porDefecto,
    }))
    .filter((v) => v.sku);
  if (!variantes.length) {
    variantes = [{ sku: `AS-${p.id}-1`, nombre: 'Único', precioCop, precioUsd: numero(p.precioUsd) || null, stock: 0, umbralStock: 5, imagenUrl: '', porDefecto: true }];
  }
  if (!variantes.some((v) => v.porDefecto)) variantes[0].porDefecto = true;
  // SKU unico dentro de toda la tienda.
  for (const v of variantes) {
    for (const otro of tablas.productos.values()) {
      if (otro.id !== p.id && (otro.variantes || []).some((ov) => ov.sku === v.sku)) {
        throw new Error(`El SKU "${v.sku}" ya existe en el producto "${otro.nombre}".`);
      }
    }
  }
  const skus = variantes.map((v) => v.sku);
  if (new Set(skus).size !== skus.length) throw new Error('Hay SKUs repetidos en las variantes.');

  const imagenes = (Array.isArray(p.imagenes) ? p.imagenes : [])
    .map((im) => (typeof im === 'string' ? { url: im, alt: '' } : im))
    .map((im) => ({ url: limpiar(im.url, 500), alt: limpiar(im.alt, 160) }))
    .filter((im) => /^https?:\/\//i.test(im.url));

  return {
    ...p,
    nombre,
    descripcionCorta: limpiar(p.descripcionCorta, 300),
    descripcion: sanearHtml(p.descripcion).slice(0, 20000),
    beneficios: sanearHtml(p.beneficios).slice(0, 5000),
    modoUso: sanearHtml(p.modoUso).slice(0, 5000),
    advertencias: limpiar(p.advertencias, 1000),
    categoriaId: Number(p.categoriaId) || null,
    artesanoId: Number(p.artesanoId) || null,
    ingredienteIds: (Array.isArray(p.ingredienteIds) ? p.ingredienteIds : []).map(Number).filter(Boolean),
    ingredienteProtagonistaId: Number(p.ingredienteProtagonistaId) || null,
    tipoIva,
    precioIncluyeIva: p.precioIncluyeIva !== false,
    precioCop,
    precioComparacionCop: numero(p.precioComparacionCop) || null,
    precioUsd: numero(p.precioUsd) || null,
    precioMayoristaCop: numero(p.precioMayoristaCop) || null,
    pesoGramos: Math.max(0, parseInt(p.pesoGramos, 10) || 0),
    invima: limpiar(p.invima, 80),
    tipoPiel: lista(p.tipoPiel),
    etiquetas: lista(p.etiquetas),
    estado,
    destacado: !!p.destacado,
    variantes,
    imagenes,
    seoTitulo: limpiar(p.seoTitulo, 70),
    seoDescripcion: limpiar(p.seoDescripcion, 160),
    creado: previo?.creado,
  };
}

/** Producto con sus relaciones resueltas (para tienda y API). */
export function enriquecer(p) {
  if (!p) return null;
  const categoria = p.categoriaId ? obtener('categorias', p.categoriaId) : null;
  const artesano = p.artesanoId ? obtener('artesanos', p.artesanoId) : null;
  const ingredientes = (p.ingredienteIds || []).map((id) => obtener('ingredientes', id)).filter(Boolean);
  const protagonista = p.ingredienteProtagonistaId ? obtener('ingredientes', p.ingredienteProtagonistaId) : ingredientes[0] || null;
  const porDefecto = p.variantes.find((v) => v.porDefecto) || p.variantes[0];
  const stockTotal = p.variantes.reduce((s, v) => s + (v.stock || 0), 0);
  return {
    ...p,
    categoria,
    artesano,
    ingredientes,
    protagonista,
    variantePorDefecto: porDefecto,
    precioDesde: Math.min(...p.variantes.map((v) => v.precioCop)),
    stockTotal,
    agotado: stockTotal <= 0,
    imagenPrincipal: p.imagenes[0]?.url || porDefecto?.imagenUrl || '',
  };
}

/**
 * Productos publicados para la tienda, con filtros.
 * @param {object} f { categoria (slug), ingrediente (slug), q, destacado, etiqueta, orden }
 */
export function productosPublicados(f = {}) {
  let lista = listar('productos').filter((p) => p.estado === 'publicado');
  if (f.categoria) {
    const c = obtenerPorSlug('categorias', f.categoria);
    lista = c ? lista.filter((p) => p.categoriaId === c.id) : [];
  }
  if (f.ingrediente) {
    const i = obtenerPorSlug('ingredientes', f.ingrediente);
    lista = i ? lista.filter((p) => (p.ingredienteIds || []).includes(i.id)) : [];
  }
  if (f.artesano) {
    const a = obtenerPorSlug('artesanos', f.artesano);
    lista = a ? lista.filter((p) => p.artesanoId === a.id) : [];
  }
  if (f.destacado) lista = lista.filter((p) => p.destacado);
  if (f.etiqueta) lista = lista.filter((p) => (p.etiquetas || []).includes(f.etiqueta));
  if (f.q) {
    const q = slugificar(f.q);
    lista = lista.filter((p) => slugificar(`${p.nombre} ${p.descripcionCorta} ${(p.etiquetas || []).join(' ')}`).includes(q));
  }
  const res = lista.map(enriquecer);
  if (f.orden === 'precio_asc') res.sort((a, b) => a.precioDesde - b.precioDesde);
  else if (f.orden === 'precio_desc') res.sort((a, b) => b.precioDesde - a.precioDesde);
  else if (f.orden === 'nuevos') res.sort((a, b) => b.creado - a.creado);
  else res.sort((a, b) => (b.destacado - a.destacado) || b.creado - a.creado);
  return res;
}

export function productoPublico(slug) {
  const p = obtenerPorSlug('productos', slug);
  return p && p.estado === 'publicado' ? enriquecer(p) : null;
}

/** Busca una variante por SKU en productos publicados. */
export function variantePorSku(sku) {
  for (const p of tablas.productos.values()) {
    if (p.estado !== 'publicado') continue;
    const v = (p.variantes || []).find((x) => x.sku === sku);
    if (v) return { producto: p, variante: v };
  }
  return null;
}

/** Descuenta stock (al confirmar un pago). Devuelve false si no alcanza. */
export function descontarStock(sku, cantidad) {
  for (const p of tablas.productos.values()) {
    const v = (p.variantes || []).find((x) => x.sku === sku);
    if (!v) continue;
    if (v.stock < cantidad) return false;
    v.stock -= cantidad;
    p.actualizado = Date.now();
    persistir('productos', p);
    return true;
  }
  return false;
}

export function reponerStock(sku, cantidad) {
  for (const p of tablas.productos.values()) {
    const v = (p.variantes || []).find((x) => x.sku === sku);
    if (!v) continue;
    v.stock += cantidad;
    persistir('productos', p);
    return true;
  }
  return false;
}

/** Variantes con stock por debajo del umbral (alerta del panel). */
export function bajoStock() {
  const res = [];
  for (const p of tablas.productos.values()) {
    if (p.estado === 'archivado') continue;
    for (const v of p.variantes || []) if (v.stock <= v.umbralStock) res.push({ producto: p.nombre, productoId: p.id, sku: v.sku, variante: v.nombre, stock: v.stock });
  }
  return res;
}

export function resumenCatalogo() {
  const productos = listar('productos');
  return {
    productos: productos.length,
    publicados: productos.filter((p) => p.estado === 'publicado').length,
    borradores: productos.filter((p) => p.estado === 'borrador').length,
    categorias: tablas.categorias.size,
    ingredientes: tablas.ingredientes.size,
    artesanos: tablas.artesanos.size,
    bajoStock: bajoStock().length,
  };
}
