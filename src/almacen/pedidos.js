// ============================================================
//  pedidos.js — Creacion y ciclo de vida de los pedidos (memoria +
//  replica en PostgreSQL).
//
//  Estados: pendiente_pago -> pagado -> en_preparacion -> enviado -> entregado
//           | cancelado | rechazado | reembolsado
//
//  Al crear el pedido se RESERVA el stock (se descuenta). Si el pago no
//  llega en RESERVA_MS, expirarPendientes() lo cancela y repone el stock.
// ============================================================
import { variantePorSku, descontarStock, reponerStock } from './catalogo.js';
import { calcularLinea, totalesPedido } from '../util/iva.js';
import { cotizarEnvio } from '../envios/tarifas.js';
import { precioEn, monedaPorPais } from '../util/moneda.js';
import { siguienteConsecutivo, ajuste } from './ajustes.js';
import { dbGuardarPedido } from './db.js';
import { numeroPedido, limpiar } from '../util/texto.js';

export const ESTADOS = ['pendiente_pago', 'pagado', 'en_preparacion', 'enviado', 'entregado', 'cancelado', 'rechazado', 'reembolsado'];
export const ESTADOS_ANULADOS = ['cancelado', 'rechazado', 'reembolsado'];
export const NOMBRES_ESTADO = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  rechazado: 'Pago rechazado',
  reembolsado: 'Reembolsado',
};
const RESERVA_MS = 2 * 60 * 60 * 1000;

/** @type {Map<number, object>} */
const pedidos = new Map();
let contador = 0;

function persistir(p) {
  dbGuardarPedido(p).catch((e) => console.error(`[pedidos] No se pudo guardar el pedido ${p.numero}:`, e.message));
}

export function hidratarPedidos(filas) {
  for (const p of filas || []) {
    if (!p?.id) continue;
    pedidos.set(p.id, p);
    contador = Math.max(contador, p.id);
  }
  return pedidos.size;
}

// ---------- Validaciones ----------

function validarEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(e || ''));
}

function validarFechaProgramada(texto) {
  if (!texto) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto));
  if (!m) throw new Error('La fecha programada debe tener el formato AAAA-MM-DD.');
  const { minDias, maxDias } = ajuste('pedidosProgramados');
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(+m[1], +m[2] - 1, +m[3]);
  const dias = Math.round((fecha - hoy) / 86400000);
  if (dias < minDias) throw new Error(`La entrega programada debe ser al menos ${minDias} días después de hoy.`);
  if (dias > maxDias) throw new Error(`La entrega programada no puede superar ${maxDias} días.`);
  return texto;
}

// ---------- Creacion ----------

/**
 * Crea un pedido pendiente de pago.
 * @param {object} p {
 *   items: [{ sku, cantidad }],
 *   cliente: { nombre, email, telefono },
 *   direccion: { linea1, linea2, ciudad, departamento, pais, codigoPostal },
 *   programadoPara: 'AAAA-MM-DD' | null, nota, canal: 'web'|'whatsapp'|'admin', waId }
 */
export function crearPedido({ items, cliente, direccion, programadoPara, nota, canal = 'web', waId = '' }) {
  if (!Array.isArray(items) || !items.length) throw new Error('El carrito está vacío.');
  if (items.length > 30) throw new Error('Máximo 30 líneas por pedido.');

  const nombre = limpiar(cliente?.nombre, 120);
  const email = limpiar(cliente?.email, 160).toLowerCase();
  const telefono = limpiar(cliente?.telefono, 30).replace(/[^\d+]/g, '');
  if (!nombre) throw new Error('Escribe tu nombre completo.');
  if (!validarEmail(email)) throw new Error('Escribe un correo válido.');
  if (telefono.replace(/\D/g, '').length < 7) throw new Error('Escribe un teléfono válido.');

  const pais = String(direccion?.pais || 'CO').toUpperCase().slice(0, 2);
  const dir = {
    linea1: limpiar(direccion?.linea1, 200),
    linea2: limpiar(direccion?.linea2, 200),
    ciudad: limpiar(direccion?.ciudad, 100),
    departamento: limpiar(direccion?.departamento, 100),
    pais,
    codigoPostal: limpiar(direccion?.codigoPostal, 20),
  };
  if (!dir.linea1 || !dir.ciudad) throw new Error('Completa la dirección y la ciudad de entrega.');

  const moneda = monedaPorPais(pais);
  const regimen = pais === 'CO' ? 'nacional' : 'exportacion';
  const fechaProgramada = validarFechaProgramada(programadoPara);

  // Lineas: se resuelve cada SKU contra el catalogo y se congela el precio.
  const lineas = [];
  let subtotalCopConIva = 0;
  for (const it of items) {
    const cantidad = Math.max(1, Math.min(50, parseInt(it.cantidad, 10) || 1));
    const encontrado = variantePorSku(String(it.sku || ''));
    if (!encontrado) throw new Error(`El producto ${it.sku} ya no está disponible.`);
    const { producto, variante } = encontrado;
    if (variante.stock < cantidad) {
      throw new Error(`Solo quedan ${variante.stock} unidades de "${producto.nombre} · ${variante.nombre}".`);
    }
    const precioUsd = variante.precioUsd || producto.precioUsd || null;
    const precio = precioEn({ precioCop: variante.precioCop, precioUsd, tipoIva: producto.tipoIva, incluyeIva: producto.precioIncluyeIva }, moneda);
    const c = calcularLinea({ precio, tipo: producto.tipoIva, incluyeIva: producto.precioIncluyeIva, cantidad, regimen });
    subtotalCopConIva += variante.precioCop * cantidad;
    lineas.push({
      sku: variante.sku,
      productoId: producto.id,
      productoSlug: producto.slug,
      productoNombre: producto.nombre,
      varianteNombre: variante.nombre,
      imagenUrl: variante.imagenUrl || producto.imagenes?.[0]?.url || '',
      tipoIva: producto.tipoIva,
      ...c,
    });
  }

  const envio = cotizarEnvio({ pais, ciudad: dir.ciudad, subtotalCop: subtotalCopConIva, moneda });
  const totales = totalesPedido({ lineas, envio: envio.costo, envioTipoIva: envio.tipoIva, regimen });

  // Reserva de stock (todo o nada).
  const descontados = [];
  for (const l of lineas) {
    if (!descontarStock(l.sku, l.cantidad)) {
      for (const d of descontados) reponerStock(d.sku, d.cantidad);
      throw new Error(`No hay stock suficiente de ${l.productoNombre}.`);
    }
    descontados.push(l);
  }

  const id = ++contador;
  const ahora = Date.now();
  const pedido = {
    id,
    numero: numeroPedido(siguienteConsecutivo()),
    estado: 'pendiente_pago',
    canal,
    waId,
    moneda,
    regimen,
    items: lineas,
    envio,
    totales,
    cliente: { nombre, email, telefono },
    direccion: dir,
    programadoPara: fechaProgramada,
    nota: limpiar(nota, 500),
    checkoutId: '',
    urlPago: '',
    referenciaPago: '',
    guia: '',
    urlSeguimiento: '',
    transportadora: '',
    historial: [{ ts: ahora, estado: 'pendiente_pago', nota: 'Pedido creado' }],
    creado: ahora,
    pagadoEn: null,
    enviadoEn: null,
    entregadoEn: null,
  };
  pedidos.set(id, pedido);
  persistir(pedido);
  console.log(`[pedidos] Nuevo pedido ${pedido.numero} (${canal}) por ${totales.total} ${moneda}.`);
  return pedido;
}

// ---------- Lectura ----------

export function listarPedidos(filtro = {}) {
  let lista = [...pedidos.values()];
  if (filtro.estado) lista = lista.filter((p) => p.estado === filtro.estado);
  if (filtro.programados) lista = lista.filter((p) => p.programadoPara);
  if (filtro.q) {
    const q = String(filtro.q).toLowerCase();
    lista = lista.filter((p) => [p.numero, p.cliente.nombre, p.cliente.email, p.cliente.telefono].join(' ').toLowerCase().includes(q));
  }
  return lista.sort((a, b) => b.creado - a.creado);
}

export function obtenerPedido(id) {
  return pedidos.get(Number(id)) || null;
}

export function obtenerPorNumero(numero) {
  const n = String(numero || '').trim().toUpperCase();
  for (const p of pedidos.values()) if (p.numero === n) return p;
  return null;
}

export function pedidosDeCliente({ email, telefono, waId }) {
  const tel = String(telefono || waId || '').replace(/\D/g, '');
  return [...pedidos.values()]
    .filter((p) => (email && p.cliente.email === String(email).toLowerCase()) || (tel && (p.cliente.telefono.replace(/\D/g, '').endsWith(tel.slice(-10)) || p.waId === waId)))
    .sort((a, b) => b.creado - a.creado);
}

// ---------- Cambios de estado ----------

export function actualizarEstado(id, estado, nota = '', extra = {}) {
  const p = obtenerPedido(id);
  if (!p) return null;
  if (!ESTADOS.includes(estado)) throw new Error('Estado inválido: ' + estado);
  const anterior = p.estado;
  if (anterior === estado && !Object.keys(extra).length) return p;

  // Reponer stock al anular un pedido que lo tenia reservado/pagado.
  if (ESTADOS_ANULADOS.includes(estado) && !ESTADOS_ANULADOS.includes(anterior)) {
    for (const l of p.items) reponerStock(l.sku, l.cantidad);
  }
  Object.assign(p, extra);
  p.estado = estado;
  if (estado === 'pagado' && !p.pagadoEn) p.pagadoEn = Date.now();
  if (estado === 'enviado' && !p.enviadoEn) p.enviadoEn = Date.now();
  if (estado === 'entregado' && !p.entregadoEn) p.entregadoEn = Date.now();
  p.historial.push({ ts: Date.now(), estado, nota });
  persistir(p);
  console.log(`[pedidos] ${p.numero}: ${anterior} -> ${estado}${nota ? ' (' + nota + ')' : ''}`);
  return p;
}

export function asignarCheckout(id, checkoutId, urlPago) {
  const p = obtenerPedido(id);
  if (!p) return null;
  p.checkoutId = checkoutId || '';
  p.urlPago = urlPago || '';
  persistir(p);
  return p;
}

export function reprogramar(id, fecha) {
  const p = obtenerPedido(id);
  if (!p) return null;
  p.programadoPara = validarFechaProgramada(fecha);
  p.historial.push({ ts: Date.now(), estado: p.estado, nota: 'Entrega reprogramada para ' + p.programadoPara });
  persistir(p);
  return p;
}

export function pedidosPendientesPago() {
  return [...pedidos.values()].filter((p) => p.estado === 'pendiente_pago');
}

/** Cancela los pedidos sin pago cuya reserva vencio y repone el stock. */
export function expirarPendientes() {
  const ahora = Date.now();
  let n = 0;
  for (const p of pedidosPendientesPago()) {
    if (ahora - p.creado > RESERVA_MS) {
      actualizarEstado(p.id, 'cancelado', 'Reserva vencida sin pago');
      n++;
    }
  }
  return n;
}

// ---------- Reportes ----------

export function resumenVentas() {
  const ahora = new Date();
  const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).getTime();
  const inicioSemana = inicioDia - ((ahora.getDay() + 6) % 7) * 86400000;
  const pagados = [...pedidos.values()].filter((p) => !['pendiente_pago', 'cancelado', 'rechazado'].includes(p.estado));
  const suma = (desde) => {
    const out = { pedidos: 0, COP: 0, USD: 0 };
    for (const p of pagados) {
      if ((p.pagadoEn || p.creado) < desde) continue;
      out.pedidos++;
      out[p.moneda] += p.totales.total;
    }
    return out;
  };
  return {
    hoy: suma(inicioDia),
    semana: suma(inicioSemana),
    mes: suma(inicioMes),
    pendientesPago: pedidosPendientesPago().length,
    porPreparar: [...pedidos.values()].filter((p) => p.estado === 'pagado').length,
    programados: [...pedidos.values()].filter((p) => p.programadoPara && !ESTADOS_ANULADOS.includes(p.estado) && p.estado !== 'entregado').length,
    total: pedidos.size,
  };
}

/** Pedidos programados ordenados por fecha (para el calendario del panel). */
export function programadosProximos() {
  return [...pedidos.values()]
    .filter((p) => p.programadoPara && !ESTADOS_ANULADOS.includes(p.estado) && p.estado !== 'entregado')
    .sort((a, b) => a.programadoPara.localeCompare(b.programadoPara));
}
