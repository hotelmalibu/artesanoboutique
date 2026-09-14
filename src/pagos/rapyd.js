// ============================================================
//  rapyd.js — Integracion con RAPYD (pagos nacionales e internacionales).
//
//  - crearCheckout(): crea una pagina de pago hospedada y devuelve su URL.
//  - consultarCheckout(): estado de un checkout (revisor por polling).
//  - verificarWebhook(): valida la firma de los webhooks entrantes.
//
//  Firma de RAPYD (HMAC-SHA256):
//    to_sign = metodo + urlPath + salt + timestamp + accessKey + secretKey + body
//    firma   = base64( hex( hmac_sha256(to_sign, secretKey) ) )
//  Doc: https://docs.rapyd.net (Message Signing).
// ============================================================
import crypto from 'crypto';
import { config } from '../config.js';

function activo() {
  return !!(config.rapyd.accessKey && config.rapyd.secretKey);
}

function salt() {
  return crypto.randomBytes(8).toString('hex');
}

function firmar(metodo, urlPath, s, ts, body) {
  const { accessKey, secretKey } = config.rapyd;
  const toSign = metodo.toLowerCase() + urlPath + s + ts + accessKey + secretKey + body;
  const hash = crypto.createHmac('sha256', secretKey).update(toSign).digest('hex');
  return Buffer.from(hash).toString('base64');
}

async function pedir(metodo, urlPath, cuerpo) {
  const body = cuerpo ? JSON.stringify(cuerpo) : '';
  const s = salt();
  const ts = Math.round(Date.now() / 1000).toString();
  const firma = firmar(metodo, urlPath, s, ts, body);

  const resp = await fetch(config.rapyd.baseUrl + urlPath, {
    method: metodo.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      access_key: config.rapyd.accessKey,
      salt: s,
      timestamp: ts,
      signature: firma,
    },
    body: metodo.toLowerCase() === 'get' ? undefined : body,
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok || datos?.status?.status !== 'SUCCESS') {
    const msg = datos?.status?.message || `HTTP ${resp.status}`;
    console.error('[rapyd] Error:', metodo, urlPath, msg, JSON.stringify(datos?.status || {}));
    throw new Error('RAPYD: ' + msg);
  }
  return datos.data;
}

/**
 * Crea una pagina de pago (checkout) hospedada por RAPYD para un pedido.
 * @param {object} pedido  Pedido creado por almacen/pedidos.js
 * @returns {Promise<{redirectUrl:string, checkoutId:string}|null>}
 */
export async function crearCheckout(pedido) {
  if (!activo()) return null;
  const pais = pedido.direccion?.pais && pedido.direccion.pais !== 'OT' ? pedido.direccion.pais : config.rapyd.pais;
  const data = await pedir('post', '/v1/checkout', {
    amount: Number(pedido.totales.total),
    currency: pedido.moneda,
    country: pais,
    merchant_reference_id: String(pedido.numero),
    complete_payment_url: `${config.publicUrl}/pago/gracias?p=${encodeURIComponent(pedido.numero)}`,
    cancel_payment_url: `${config.publicUrl}/pago/cancelado?p=${encodeURIComponent(pedido.numero)}`,
    description: `Pedido ${pedido.numero} · ${config.tienda.nombre}`,
    language: 'es',
    metadata: { pedidoId: pedido.id, numero: pedido.numero, canal: pedido.canal },
    customer: undefined,
    cardholder_preferred_currency: true,
  });
  return { redirectUrl: data.redirect_url, checkoutId: data.id };
}

/**
 * Consulta el estado de un checkout creado (para confirmar el pago sin
 * depender solo del webhook).
 * @returns {Promise<{pagado:boolean, rechazado:boolean, estado:string, referencia:string}|null>}
 */
export async function consultarCheckout(checkoutId) {
  if (!activo() || !checkoutId) return null;
  try {
    const data = await pedir('get', `/v1/checkout/${encodeURIComponent(checkoutId)}`, null);
    const pago = data.payment || {};
    const pagado = pago.paid === true || pago.status === 'CLO';
    const rechazado = pago.status === 'ERR' || pago.status === 'EXP' || data.status === 'CAN';
    return { pagado, rechazado, estado: pago.status || data.status || '', referencia: pago.id || '' };
  } catch (err) {
    console.warn('[rapyd] No se pudo consultar el checkout', checkoutId, ':', err.message);
    return null;
  }
}

/**
 * Verifica la firma de un webhook entrante de RAPYD.
 * @param {import('express').Request} req  con req.rawBody (Buffer) y cabeceras.
 */
export function verificarWebhook(req) {
  if (!activo()) return false;
  const s = req.get('salt');
  const ts = req.get('timestamp');
  const firmaRecibida = req.get('signature');
  if (!s || !ts || !firmaRecibida || !req.rawBody) return false;

  const url = config.publicUrl + req.originalUrl;
  const body = req.rawBody.toString('utf8');
  const toSign = url + s + ts + config.rapyd.accessKey + config.rapyd.secretKey + body;
  const hash = crypto.createHmac('sha256', config.rapyd.secretKey).update(toSign).digest('hex');
  const esperada = Buffer.from(hash).toString('base64');

  const a = Buffer.from(firmaRecibida);
  const b = Buffer.from(esperada);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const rapydActivo = activo;

/** Lista los metodos de pago disponibles para un pais/moneda (diagnostico). */
export async function metodosPais(country, currency) {
  if (!activo()) return { ok: false, error: 'RAPYD no configurado' };
  try {
    const qs = `?country=${encodeURIComponent(country)}` + (currency ? `&currency=${encodeURIComponent(currency)}` : '');
    const data = await pedir('get', '/v1/payment_methods/country' + qs, null);
    const lista = Array.isArray(data) ? data : [];
    return { ok: true, cantidad: lista.length, metodos: lista.map((m) => m.type || m.name).slice(0, 40) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/** Prueba rapida de autenticacion con RAPYD. */
export async function probarAuth() {
  if (!activo()) return { ok: false, error: 'Faltan RAPYD_ACCESS_KEY / RAPYD_SECRET_KEY.' };
  try {
    const data = await pedir('get', '/v1/data/countries', null);
    return { ok: true, mensaje: 'Autenticación OK con RAPYD ✅', paises: Array.isArray(data) ? data.length : undefined, baseUrl: config.rapyd.baseUrl };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
