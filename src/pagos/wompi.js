// ============================================================
//  wompi.js — Integracion con Wompi (pagos en Colombia: tarjetas, PSE,
//  Nequi, Bancolombia). Reemplaza a RAPYD (rechazado por volumen minimo).
//
//  - crearCheckout(): arma la URL del Web Checkout hospedado por Wompi
//    (no requiere llamada a la API; la firma de integridad se calcula acá).
//  - consultarTransaccion(): consulta una transaccion por id (para el
//    regreso del cliente en /pago/gracias, sin depender solo del webhook).
//  - verificarWebhook(): valida el checksum de los eventos entrantes.
//
//  Solo soporta COP (pedidos internacionales en USD no usan Wompi; ver
//  crearCheckout). Doc: https://docs.wompi.co/docs/colombia/
// ============================================================
import crypto from 'crypto';
import { config } from '../config.js';

function activo() {
  return !!(config.wompi.publicKey && config.wompi.privateKey && config.wompi.integritySecret);
}

function firmaIntegridad(referencia, montoCentavos, moneda) {
  const base = `${referencia}${montoCentavos}${moneda}${config.wompi.integritySecret}`;
  return crypto.createHash('sha256').update(base).digest('hex');
}

/** Monto del pedido en centavos, tal como se lo enviamos a Wompi. */
export function montoEnCentavos(pedido) {
  return Math.round(Number(pedido.totales.total) * 100);
}

/** El monto que reporta Wompi debe ser el del pedido; si no, no se confirma el pago. */
export function montoCoincide(pedido, centavosWompi) {
  return Number(centavosWompi) === montoEnCentavos(pedido);
}

/** Celular colombiano a 10 digitos (Wompi pide el prefijo aparte); null si no se puede normalizar. */
function celularColombiano(telefono) {
  let d = String(telefono || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('57')) d = d.slice(2);
  return /^3\d{9}$/.test(d) ? d : null;
}

/**
 * Arma la URL del Web Checkout de Wompi para un pedido (solo COP).
 * @param {object} pedido  Pedido creado por almacen/pedidos.js
 * @returns {{redirectUrl:string, checkoutId:string}|null}
 */
export function crearCheckout(pedido) {
  if (!activo() || pedido.moneda !== 'COP') return null;
  const montoCentavos = montoEnCentavos(pedido);
  const referencia = String(pedido.numero);
  const params = new URLSearchParams({
    'public-key': config.wompi.publicKey,
    currency: 'COP',
    'amount-in-cents': String(montoCentavos),
    reference: referencia,
    'signature:integrity': firmaIntegridad(referencia, montoCentavos, 'COP'),
    'redirect-url': `${config.publicUrl}/pago/gracias?p=${encodeURIComponent(referencia)}`,
    'customer-data:email': pedido.cliente.email,
    'customer-data:full-name': pedido.cliente.nombre,
  });
  const celular = celularColombiano(pedido.cliente.telefono);
  if (celular) {
    params.set('customer-data:phone-number', celular);
    params.set('customer-data:phone-number-prefix', '+57');
  }
  return { redirectUrl: `${config.wompi.checkoutUrl}/p/?${params.toString()}`, checkoutId: referencia };
}

/**
 * Consulta una transaccion de Wompi por su id (lo trae Wompi en el query
 * `?id=` al volver a redirect-url). Confirma el pago sin esperar webhook.
 */
export async function consultarTransaccion(transaccionId) {
  if (!activo() || !transaccionId) return null;
  try {
    const r = await fetch(`${config.wompi.baseUrl}/v1/transactions/${encodeURIComponent(transaccionId)}`, {
      headers: { Authorization: `Bearer ${config.wompi.privateKey}` },
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok || !json.data) return null;
    const t = json.data;
    return {
      pagado: t.status === 'APPROVED',
      rechazado: t.status === 'DECLINED' || t.status === 'ERROR' || t.status === 'VOIDED',
      estado: t.status,
      referencia: t.reference,
      referenciaPago: t.id,
      montoCentavos: t.amount_in_cents,
    };
  } catch (err) {
    console.warn('[wompi] No se pudo consultar la transacción', transaccionId, ':', err.message);
    return null;
  }
}

/**
 * Verifica el checksum de un evento (webhook) entrante de Wompi.
 * @param {object} evento  Cuerpo JSON ya parseado (req.body).
 */
export function verificarWebhook(evento) {
  if (!activo() || !config.wompi.eventsSecret) return false;
  const props = evento?.signature?.properties;
  const checksumRecibido = evento?.signature?.checksum;
  if (!Array.isArray(props) || !checksumRecibido || !evento.timestamp) return false;

  const valores = props.map((ruta) => ruta.split('.').reduce((o, k) => o?.[k], evento.data)).join('');
  const base = `${valores}${evento.timestamp}${config.wompi.eventsSecret}`;
  const esperado = crypto.createHash('sha256').update(base).digest('hex');

  const a = Buffer.from(String(checksumRecibido).toLowerCase());
  const b = Buffer.from(esperado);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const wompiActivo = activo;

// ---------- Metodos de pago habilitados (para no anunciar de mas) ----------

const ETIQUETA_METODO = {
  CARD: 'Tarjeta', PSE: 'PSE', NEQUI: 'Nequi', DAVIPLATA: 'Daviplata',
  BANCOLOMBIA_TRANSFER: 'Bancolombia', BANCOLOMBIA: 'Bancolombia', BANCOLOMBIA_COLLECT: 'Bancolombia', BANCOLOMBIA_QR: 'Bancolombia',
};
let metodosHabilitados = null; // null = aun no se sabe (o Wompi no respondio)

async function refrescarMetodos() {
  if (!activo()) return;
  try {
    const r = await fetch(`${config.wompi.baseUrl}/v1/merchants/${encodeURIComponent(config.wompi.publicKey)}`);
    const json = await r.json().catch(() => ({}));
    const lista = json?.data?.accepted_payment_methods;
    if (!r.ok || !Array.isArray(lista)) throw new Error(`HTTP ${r.status}`);
    const etiquetas = [...new Set(lista.map((m) => ETIQUETA_METODO[String(m?.name || m)]).filter(Boolean))];
    metodosHabilitados = etiquetas;
    console.log(`[wompi] Métodos de pago habilitados: ${etiquetas.join(', ') || '(ninguno)'}.`);
  } catch (err) {
    console.warn('[wompi] No se pudieron consultar los métodos de pago habilitados:', err.message);
  }
}

/** Consulta los metodos habilitados al arrancar y cada 30 minutos. */
export function iniciarRefrescoMetodos() {
  if (!activo()) return;
  refrescarMetodos();
  setInterval(refrescarMetodos, 30 * 60 * 1000).unref?.();
}

/** Metodos habilitados como etiquetas ('Tarjeta', 'PSE'…); [] si aun no se sabe. */
export function metodosDePago() {
  return metodosHabilitados || [];
}

function enumerar(l) {
  return l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] || '';
}

/** "Paga con PSE a través de Wompi" (o una frase generica si no se conocen los metodos). */
export function frasePagoWompi() {
  const l = metodosDePago();
  return l.length ? `Paga con ${enumerar(l)} a través de Wompi` : 'Paga de forma segura a través de Wompi';
}

/** "(PSE)" / "(tarjeta, PSE y Nequi)" para insertar en una oracion; '' si no se conocen. */
export function parentesisMetodos() {
  const l = metodosDePago().map((m) => m.toLowerCase().replace(/^pse$/, 'PSE'));
  return l.length ? ` (${enumerar(l)})` : '';
}

/** Datos del comercio (metodos de pago aceptados) para el diagnostico del panel. */
export async function datosComercio() {
  if (!activo()) return { ok: false, error: 'Faltan WOMPI_PUBLIC_KEY / WOMPI_PRIVATE_KEY / WOMPI_INTEGRITY_SECRET.' };
  try {
    const r = await fetch(`${config.wompi.baseUrl}/v1/merchants/${encodeURIComponent(config.wompi.publicKey)}`);
    const json = await r.json().catch(() => ({}));
    if (!r.ok || !json.data) throw new Error(json?.error?.messages ? JSON.stringify(json.error.messages) : `HTTP ${r.status}`);
    const metodos = (json.data.presigned_acceptance ? ['presigned_acceptance'] : []).concat(
      (json.data.accepted_payment_methods || []).map((m) => m.name || m),
    );
    return { ok: true, mensaje: `Autenticación OK con Wompi ✅ (${json.data.name || config.wompi.publicKey})`, metodos, baseUrl: config.wompi.baseUrl };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
