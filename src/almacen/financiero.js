// ============================================================
//  financiero.js — Modelo financiero interno del panel admin: meta de
//  ventas mensual, costo estimado por producto (70% del precio por
//  defecto, editable) y margen resultante. No es visible para clientes.
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
  const nuevo = {
    metaMensualCop: Math.max(0, Math.round(Number(metaMensualCop))) || actual.metaMensualCop,
    margenObjetivoPct: Math.min(95, Math.max(1, Math.round(Number(margenObjetivoPct)))) || actual.margenObjetivoPct,
  };
  return fijarAjuste('financiero', nuevo);
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

/** Tabla de productos publicados con precio, costo estimado, margen y cuántas unidades de ESE producto solo harían falta para cubrir la meta mensual. */
export function tablaProductos() {
  const meta = metaFinanciera();
  return listar('productos')
    .filter((p) => p.estado === 'publicado')
    .map((p) => {
      const { precio, costo, margenCop, margenPct } = margenDeProducto(p);
      const categoria = p.categoriaId ? obtener('categorias', p.categoriaId) : null;
      return {
        id: p.id,
        nombre: p.nombre,
        slug: p.slug,
        categoria: categoria?.nombre || '',
        precio,
        costo,
        margenCop,
        margenPct,
        unidadesParaMeta: margenCop > 0 ? Math.ceil(meta.metaMensualCop / margenCop) : null,
      };
    })
    .sort((a, b) => b.margenCop - a.margenCop);
}

/** Ingresos y margen bruto REAL generados este mes, a partir de los pedidos ya facturados. */
function mesReal() {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
  let margenCop = 0;
  let ingresosCop = 0;
  for (const p of listarPedidos()) {
    if (!ESTADOS_CONTADOS.includes(p.estado)) continue;
    if ((p.pagadoEn || p.creado) < inicioMes) continue;
    if (p.moneda !== 'COP') continue; // pedidos internacionales quedan fuera de esta estimación en COP
    for (const it of p.items || []) {
      const prod = obtener('productos', it.productoId);
      const costoUnitario = prod ? costoEstimado(prod) : Math.round((it.total / it.cantidad) * 0.7);
      margenCop += it.total - costoUnitario * it.cantidad;
      ingresosCop += it.total;
    }
  }
  return { margenCop, ingresosCop };
}

export function resumenFinanciero() {
  const meta = metaFinanciera();
  const ventas = resumenVentas();
  const { margenCop } = mesReal();
  return {
    meta,
    ventasMesCop: ventas.mes.COP,
    pedidosMes: ventas.mes.pedidos,
    progresoPct: meta.metaMensualCop ? Math.min(999, Math.round((ventas.mes.COP / meta.metaMensualCop) * 100)) : 0,
    faltanteCop: Math.max(0, meta.metaMensualCop - ventas.mes.COP),
    margenMesCop: margenCop,
    productos: tablaProductos(),
  };
}
