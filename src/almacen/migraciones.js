// ============================================================
//  migraciones.js — Cambios de datos que se aplican UNA sola vez al arrancar
//  (cada migracion queda registrada en el ajuste "migraciones"). Sirven para
//  corregir el catalogo que ya vive en PostgreSQL sin tener que editar a mano
//  cada producto desde el panel.
//
//  Fuente de los textos: semilla.datos.js (la version vigente del catalogo).
//  Solo se tocan los registros que existen en la semilla (por slug); los que
//  el negocio creo desde el panel no se modifican.
// ============================================================
import { listar, obtenerPorSlug, guardar } from './catalogo.js';
import { ajuste, fijarAjuste } from './ajustes.js';
import { CATEGORIAS, INGREDIENTES, ARTESANOS, PRECIOS_DEFINITIVOS, productos } from './semilla.datos.js';

// Fotos tipo afiche cuyo texto impreso promete efectos terapeuticos
// (anticaida, antiinflamatorio, "medicinal", eficaz contra la migraña...).
// Se quitan de las fichas; los archivos originales siguen en el repo.
const IMAGENES_CON_PROMESAS = ['guasimo-shampoo-1.jpg', 'guasimo-info.jpg', 'mataraton-2.jpg', 'gel-cannabis-coca-arnica.png', 'elixir-hierbabuena.jpg'];

// Productos sin foto que se retiran de la tienda (quedan archivados, no borrados).
const RETIRAR = ['jabon-de-coco', 'jabon-de-aguacate'];
const RETIRAR_3 = ['vaporub-artesanal', 'colada-de-chopo', 'jabon-liquido-artesanal', 'jabon-carbon-activado', 'jabon-de-rosas'];
const RETIRAR_2 = ['limpiador-multiusos-natural', 'detergente-liquido-para-pisos', 'gel-cannabis-coca-arnica', 'elixir-de-hierbabuena'];

const CAMPOS_PRODUCTO = ['descripcionCorta', 'descripcion', 'beneficios', 'modoUso', 'advertencias', 'tipoPiel'];

// guardar() recalcula el slug a partir de los datos recibidos: siempre se le pasa el registro completo.
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Sincroniza los textos del catalogo con la semilla vigente (sin promesas terapeuticas). */
function textosSinPromesasTerapeuticas() {
  let cambios = 0;

  const relaciones = new Proxy({}, { get: () => 0 });
  for (const sp of productos({ categorias: relaciones, ingredientes: relaciones, artesanos: relaciones })) {
    const p = obtenerPorSlug('productos', sp.slug);
    if (!p) continue;
    const cambio = {};
    for (const campo of CAMPOS_PRODUCTO) {
      if (sp[campo] !== undefined && !igual(p[campo], sp[campo])) cambio[campo] = sp[campo];
    }
    const imagenes = (p.imagenes || []).filter((im) => !IMAGENES_CON_PROMESAS.some((f) => String(im.url).endsWith('/' + f)));
    if (imagenes.length !== (p.imagenes || []).length) cambio.imagenes = imagenes;
    if (Object.keys(cambio).length) { guardar('productos', { ...p, ...cambio }); cambios++; }
  }

  for (const si of INGREDIENTES) {
    const i = obtenerPorSlug('ingredientes', si.slug);
    if (!i) continue;
    const cambio = {};
    for (const campo of ['usoAncestral', 'beneficios']) if (!igual(i[campo], si[campo])) cambio[campo] = si[campo];
    if (Object.keys(cambio).length) { guardar('ingredientes', { ...i, ...cambio }); cambios++; }
  }

  for (const sc of CATEGORIAS) {
    const c = obtenerPorSlug('categorias', sc.slug);
    if (c && !igual(c.descripcion, sc.descripcion)) { guardar('categorias', { ...c, descripcion: sc.descripcion }); cambios++; }
  }

  for (const sa of ARTESANOS) {
    const a = obtenerPorSlug('artesanos', sa.slug);
    if (a && (a.municipio !== sa.municipio || a.departamento !== sa.departamento)) {
      guardar('artesanos', { ...a, municipio: sa.municipio, departamento: sa.departamento });
      cambios++;
    }
  }
  return cambios;
}

/** Archiva productos por slug: salen de la tienda pero se pueden restaurar desde el panel. */
function archivar(slugs) {
  let cambios = 0;
  for (const slug of slugs) {
    const p = obtenerPorSlug('productos', slug);
    if (p && p.estado !== 'archivado') { guardar('productos', { ...p, estado: 'archivado' }); cambios++; }
  }
  return cambios;
}

/** Aplica la lista de precios y stock definitivos (por SKU) y marca el precio como confirmado. */
function preciosDefinitivos() {
  let cambios = 0;
  for (const p of listar('productos')) {
    if (!(p.variantes || []).some((v) => PRECIOS_DEFINITIVOS[v.sku])) continue;
    const variantes = p.variantes.map((v) => {
      const d = PRECIOS_DEFINITIVOS[v.sku];
      return d ? { ...v, precioCop: d.precioCop, stock: d.stock, precioUsd: null } : v;
    });
    const porDefecto = variantes.find((v) => v.porDefecto) || variantes[0];
    guardar('productos', { ...p, variantes, precioCop: porDefecto.precioCop, precioUsd: null, etiquetas: (p.etiquetas || []).filter((t) => t !== 'precio-de-ejemplo') });
    cambios++;
  }
  return cambios;
}

const retirarJabonesCocoAguacate = () => archivar(RETIRAR);
const retirarLimpiadorDetergenteGelElixir = () => archivar(RETIRAR_2);

/** Unifica "Corporal" dentro de "Cuidado del Cuerpo" (las dos lineas se solapaban). */
function unificarCorporal() {
  const destino = obtenerPorSlug('categorias', 'cuidado-del-cuerpo');
  const origen = obtenerPorSlug('categorias', 'corporal');
  if (!destino || !origen) return 0;
  let cambios = 0;
  for (const p of listar('productos')) {
    if (p.categoriaId === origen.id) { guardar('productos', { ...p, categoriaId: destino.id }); cambios++; }
  }
  guardar('categorias', { ...destino, descripcion: 'Jabones y cremas artesanales para la limpieza e hidratación diaria.' });
  guardar('categorias', { ...origen, activo: false });
  return cambios + 2;
}

const MIGRACIONES = [
  { nombre: '2026-10-textos-sin-promesas-terapeuticas', aplicar: textosSinPromesasTerapeuticas },
  { nombre: '2026-10-retirar-jabones-coco-aguacate', aplicar: retirarJabonesCocoAguacate },
  { nombre: '2026-10-retirar-limpiador-detergente-gel-elixir', aplicar: retirarLimpiadorDetergenteGelElixir },
  { nombre: '2026-10-precios-y-catalogo-definitivos', aplicar: () => archivar(RETIRAR_3) + preciosDefinitivos() },
  { nombre: '2026-10-unificar-corporal-en-cuidado-del-cuerpo', aplicar: unificarCorporal },
];

/** Aplica las migraciones pendientes. Llamar despues de hidratar el catalogo y sembrar. */
export function aplicarMigraciones() {
  const hechas = ajuste('migraciones') || [];
  if (!listar('productos').length) return; // catalogo vacio: nada que migrar
  for (const m of MIGRACIONES) {
    if (hechas.includes(m.nombre)) continue;
    try {
      const n = m.aplicar();
      hechas.push(m.nombre);
      fijarAjuste('migraciones', [...hechas]);
      console.log(`[migraciones] ${m.nombre}: ${n} registro(s) actualizados.`);
    } catch (err) {
      console.error(`[migraciones] ${m.nombre} falló y se reintentará al próximo arranque:`, err.message);
    }
  }
}
