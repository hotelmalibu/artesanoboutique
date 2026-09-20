// ============================================================
//  financiero.js — Modelo financiero interno del panel admin: meta de
//  ventas mensual, costo estimado por producto (70% del precio por
//  defecto, editable), margen y reparto de la meta entre los productos.
//  No es visible para clientes.
//
//  La meta es de VENTAS (ingresos). Las unidades de un producto salen de
//  su parte de la meta dividida entre su PRECIO; el margen solo sirve para
//  estimar la utilidad que dejaria ese plan.
// ============================================================
import { listar, obtener } from './catalogo.js';
import { listarPedidos, resumenVentas } from './pedidos.js';
import { ajuste, fijarAjuste } from './ajustes.js';

const ESTADOS_CONTADOS = ['pagado', 'en_preparacion', 'enviado', 'entregado'];

export function metaFinanciera() {
  return ajuste('financiero');
}

export function fijarMetaFinanciera({ metaMensualCop, margenObjetivoPct }) {
  const actual = ajuste('financiero');
  return fijarAjuste('financiero', {
    ...actual,
    metaMensualCop: Math.max(0, Math.round(Number(metaMensualCop))) || actual.metaMensualCop,
    margenObjetivoPct: Math.min(95, Math.max(1, Math.round(Number(margenObjetivoPct)))) || actual.margenObjetivoPct,
  });
}

/** Guarda el % de la meta de ventas que le toca a cada producto ({slug: pct}). Vacio = partes iguales. */
export function fijarReparto(participaciones) {
  const actual = ajuste('financiero');
  const limpio = {};
  for (const [slug, v] of Object.entries(participaciones || {})) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) limpio[slug] = n;
  }
  return fijarAjuste('financiero', { ...actual, participaciones: limpio });
}

/** Costo estimado de un producto: el que se guardó manualmente o, por defecto, el % de costo del ajuste financiero (70% del precio → 30% de margen). */
export function costoEstimado(producto) {
  if (producto.costoCop != null) return producto.costoCop;
  const pctCosto = 100 - (metaFinanciera().margenObjetivoPct ?? 30);
  return Math.round((producto.precioCop || 0) * (pctCosto / 100));
}

function margenDeProducto(p) {
  const v = (p.variantes || []).find((v) => v.porDefecto) || p.variantes?.[0];
  const precio = v?.precioCop || p.precioCop || 0;
  const costo = costoEstimado(p);
  const margenCop = Math.max(0, precio - costo);
  const margenPct = precio ? Math.round((margenCop / precio) * 100) : 0;
  return { precio, costo, margenCop, margenPct };
}

/** Ingresos, margen bruto y unidades por producto REALES de este mes, a partir de los pedidos ya facturados. */
function mesReal() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
  let margenCop = 0;
  let ingresosCop = 0;
  const unidadesPorProducto = new Map();
  for (const p of listarPedidos()) {
    if (!ESTADOS_CONTADOS.includes(p.estado)) continue;
    if ((p.pagadoEn || p.creado) < inicioMes) continue;
    if (p.moneda !== 'COP') continue; // pedidos internacionales quedan fuera de esta estimación en COP
    for (const it of p.items || []) {
      const prod = obtener('productos', it.productoId);
      const costoUnitario = prod ? costoEstimado(prod) : Math.round((it.total / it.cantidad) * 0.7);
      margenCop += it.total - costoUnitario * it.cantidad;
      ingresosCop += it.total;
      unidadesPorProducto.set(it.productoId, (unidadesPorProducto.get(it.productoId) || 0) + it.cantidad);
    }
  }
  return { margenCop, ingresosCop, unidadesPorProducto };
}

/**
 * Tabla de productos publicados: precio, costo, margen y el plan de la meta
 * (parte de la meta, unidades a vender, utilidad esperada y lo vendido este mes).
 */
export function tablaProductos(vendidas = mesReal().unidadesPorProducto) {
  const meta = metaFinanciera();
  const base = listar('productos')
    .filter((p) => p.estado === 'publicado')
    .map((p) => {
      const { precio, costo, margenCop, margenPct } = margenDeProducto(p);
      const categoria = p.categoriaId ? obtener('categorias', p.categoriaId) : null;
      return { id: p.id, nombre: p.nombre, slug: p.slug, categoria: categoria?.nombre || '', precio, costo, margenCop, margenPct };
    });

  const guardadas = meta.participaciones || {};
  let crudas = base.map((p) => guardadas[p.slug] ?? 100 / base.length);
  let suma = crudas.reduce((a, b) => a + b, 0);
  if (suma <= 0) { crudas = base.map(() => 1); suma = crudas.length || 1; }

  return base
    .map((p, i) => {
      const parte = crudas[i] / suma;
      const metaVentasCop = Math.round(meta.metaMensualCop * parte);
      const unidadesMeta = p.precio > 0 ? Math.ceil(metaVentasCop / p.precio) : 0;
      const vendidasMes = vendidas.get(p.id) || 0;
      return {
        ...p,
        participacionPct: Math.round(parte * 10000) / 100,
        metaVentasCop,
        unidadesMeta,
        margenEsperadoCop: unidadesMeta * p.margenCop,
        unidadesSolo: p.precio > 0 ? Math.ceil(meta.metaMensualCop / p.precio) : null,
        vendidasMes,
        avanceUnidadesPct: unidadesMeta ? Math.min(999, Math.round((vendidasMes / unidadesMeta) * 100)) : 0,
      };
    })
    .sort((a, b) => b.metaVentasCop - a.metaVentasCop || a.nombre.localeCompare(b.nombre));
}

export function resumenFinanciero() {
  const meta = metaFinanciera();
  const ventas = resumenVentas();
  const real = mesReal();
  const productos = tablaProductos(real.unidadesPorProducto);
  const plan = productos.reduce(
    (t, p) => ({ unidades: t.unidades + p.unidadesMeta, ventasCop: t.ventasCop + p.unidadesMeta * p.precio, margenCop: t.margenCop + p.margenEsperadoCop }),
    { unidades: 0, ventasCop: 0, margenCop: 0 },
  );
  return {
    meta,
    ventasMesCop: ventas.mes.COP,
    pedidosMes: ventas.mes.pedidos,
    progresoPct: meta.metaMensualCop ? Math.min(999, Math.round((ventas.mes.COP / meta.metaMensualCop) * 100)) : 0,
    faltanteCop: Math.max(0, meta.metaMensualCop - ventas.mes.COP),
    margenMesCop: real.margenCop,
    plan,
    productos,
  };
}
