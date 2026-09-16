// ============================================================
//  conversaciones.js — Almacen en memoria de las conversaciones de
//  WhatsApp (con replica en PostgreSQL). Guarda el historial, el modo
//  (bot | humano) y el estado del bot por cliente.
// ============================================================
import { dbGuardarConversacion, dbGuardarMensaje } from './db.js';
import { diaColombia } from '../util/fechas.js';

/** @type {Map<string, object>} */
const conversaciones = new Map();
const MAX_MENSAJES = 200;

function persistirConv(c) {
  dbGuardarConversacion(c).catch((e) => console.error('[conversaciones] No se pudo guardar', c.waId, e.message));
}

function obtenerOCrear(waId, nombre = '') {
  let c = conversaciones.get(waId);
  if (!c) {
    c = { waId, nombre, modo: 'bot', canal: '', estado: {}, mensajes: [], sinLeer: 0, creado: Date.now(), ultimaActividad: Date.now() };
    conversaciones.set(waId, c);
  }
  if (nombre && !c.nombre) c.nombre = nombre;
  return c;
}

// Detecta de qué "puerta" llegó el cliente por el texto del PRIMER mensaje
// (enlaces medibles de anuncios traen una frase característica por canal).
function normTexto(t) {
  return (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
function detectarCanal(texto) {
  const t = normTexto(texto);
  if (t.includes('instagram')) return 'Instagram';
  if (t.includes('tiktok')) return 'TikTok';
  if (t.includes('facebook')) return 'Facebook';
  if (t.includes('google maps') || /\bmaps\b/.test(t)) return 'Google Maps';
  if (t.includes('google ads') || t.includes('vengo de google') || t.includes('anuncio de google')) return 'Google Ads';
  if (t.includes('qr') || t.includes('escane')) return 'QR físico';
  if (t.includes('pagina web') || t.includes('sitio web') || t.includes('tienda online')) return 'Sitio web';
  return '';
}

// Señales de interés real de compra (para "conversaciones calientes" y el
// embudo): el cliente preguntó por precio/producto/envío, o el bot ya le
// dio un valor en pesos.
const RE_INTERES = /precio|cu[aá]nt[oa]|vale|cuesta|comprar|disponib|env[ií]o|domicilio|pedido|jab[oó]n|crema|shampoo|producto/i;
function tieneInteres(c) {
  return c.mensajes.some(
    (m) => (m.autor === 'cliente' && RE_INTERES.test(m.texto || '')) || (m.autor === 'bot' && /\$\s?\d/.test(m.texto || ''))
  );
}
function ultimoEntranteTs(c) {
  for (let i = c.mensajes.length - 1; i >= 0; i--) if (c.mensajes[i].direccion === 'in') return c.mensajes[i].ts;
  return 0;
}

function agregar(c, m) {
  c.mensajes.push(m);
  if (c.mensajes.length > MAX_MENSAJES) c.mensajes.splice(0, c.mensajes.length - MAX_MENSAJES);
  c.ultimaActividad = m.ts;
  dbGuardarMensaje(c.waId, m).catch(() => {});
  persistirConv(c);
}

export const store = {
  registrarEntrante({ waId, nombre, tipo, texto }) {
    const c = obtenerOCrear(waId, nombre);
    // La primera vez que detectamos un canal en el texto, lo fijamos.
    if (!c.canal) {
      const cn = detectarCanal(texto);
      if (cn) c.canal = cn;
    }
    c.sinLeer++;
    agregar(c, { direccion: 'in', autor: 'cliente', tipo: tipo || 'text', texto: texto || '', ts: Date.now() });
    return c;
  },
  registrarSaliente({ waId, autor = 'bot', texto }) {
    const c = obtenerOCrear(waId);
    agregar(c, { direccion: 'out', autor, tipo: 'text', texto: texto || '', ts: Date.now() });
    return c;
  },
  obtener(waId) {
    return conversaciones.get(waId) || null;
  },
  obtenerModo(waId) {
    return conversaciones.get(waId)?.modo || 'bot';
  },
  fijarModo(waId, modo) {
    const c = obtenerOCrear(waId);
    c.modo = modo === 'humano' ? 'humano' : 'bot';
    persistirConv(c);
    return c;
  },
  estadoBot(waId) {
    return obtenerOCrear(waId).estado;
  },
  fijarEstadoBot(waId, estado) {
    const c = obtenerOCrear(waId);
    c.estado = estado || {};
    persistirConv(c);
  },
  marcarLeida(waId) {
    const c = conversaciones.get(waId);
    if (c) c.sinLeer = 0;
  },
  listar() {
    return [...conversaciones.values()]
      .map((c) => ({ waId: c.waId, nombre: c.nombre, modo: c.modo, sinLeer: c.sinLeer, ultimaActividad: c.ultimaActividad, ultimo: c.mensajes[c.mensajes.length - 1]?.texto || '' }))
      .sort((a, b) => (b.modo === 'humano') - (a.modo === 'humano') || b.ultimaActividad - a.ultimaActividad);
  },
  /** true si el cliente escribio en las ultimas 24 h (ventana de texto libre de WhatsApp). */
  ventanaAbierta(waId) {
    const c = conversaciones.get(waId);
    if (!c) return false;
    const ultimoIn = [...c.mensajes].reverse().find((m) => m.direccion === 'in');
    return !!ultimoIn && Date.now() - ultimoIn.ts < 24 * 60 * 60 * 1000;
  },

  /**
   * Estadisticas de conversaciones para el monitor. "activa" = actividad en
   * las ultimas 24 h o atendida por un humano. Filtro opcional por fechas
   * (segun ultima actividad, dia de Colombia).
   */
  estadisticas(desde, hasta) {
    const limiteActiva = Date.now() - 24 * 60 * 60 * 1000;
    let total = 0, activas = 0, enHumano = 0;
    for (const c of conversaciones.values()) {
      const dia = diaColombia(c.ultimaActividad);
      if (desde && dia < desde) continue;
      if (hasta && dia > hasta) continue;
      total++;
      if (c.ultimaActividad >= limiteActiva || c.modo === 'humano') activas++;
      if (c.modo === 'humano') enHumano++;
    }
    return { total, activas, inactivas: total - activas, enHumano };
  },

  /** Cuenta las conversaciones por canal de origen. Filtro opcional por fechas. */
  canalesResumen(desde, hasta) {
    const conteo = new Map();
    for (const c of conversaciones.values()) {
      const dia = diaColombia(c.ultimaActividad);
      if (desde && dia < desde) continue;
      if (hasta && dia > hasta) continue;
      const canal = c.canal || 'Directo / Otro';
      conteo.set(canal, (conteo.get(canal) || 0) + 1);
    }
    return [...conteo.entries()].map(([canal, total]) => ({ canal, total })).sort((a, b) => b.total - a.total);
  },

  /**
   * Conversaciones "calientes": mostraron interés (precio/producto/envío),
   * NO terminaron en compra, las atiende el bot y el cliente escribió hace
   * menos de ventanaMs. De la más reciente a la más vieja.
   */
  calientes({ compradores, ahora: ts = Date.now(), ventanaMs = 72 * 60 * 60 * 1000 }) {
    const salida = [];
    for (const c of conversaciones.values()) {
      if (compradores.has(c.waId)) continue;
      if (c.modo !== 'bot') continue;
      const ult = ultimoEntranteTs(c);
      if (!ult || ts - ult > ventanaMs) continue;
      if (!tieneInteres(c)) continue;
      const ultimo = c.mensajes[c.mensajes.length - 1];
      salida.push({
        waId: c.waId,
        nombre: c.nombre,
        canal: c.canal || '',
        ultimoEntrante: ult,
        horasDesde: Math.round(((ts - ult) / 36e5) * 10) / 10,
        ultimoTexto: ultimo?.texto || '',
        ultimoAutor: ultimo?.autor || '',
      });
    }
    return salida.sort((a, b) => b.ultimoEntrante - a.ultimoEntrante);
  },

  /**
   * Embudo de conversión: de las conversaciones INICIADAS en el rango (día
   * de Colombia), cuántas mostraron interés, cuántas recibieron un precio
   * del bot y cuántas terminaron en compra (waId en `compradores`). Las
   * etapas son acumulativas: comprar implica cotizada e interesada.
   */
  embudo({ desde, hasta, compradores = new Set() }) {
    const nueva = () => ({ total: 0, interesadas: 0, cotizadas: 0, compraron: 0 });
    const etapas = nueva();
    const porCanal = new Map();
    for (const c of conversaciones.values()) {
      const dia = diaColombia(c.creado);
      if (desde && dia < desde) continue;
      if (hasta && dia > hasta) continue;
      const canal = c.canal || 'Directo / Otro';
      if (!porCanal.has(canal)) porCanal.set(canal, nueva());
      const compro = compradores.has(c.waId);
      const cotizada = compro || c.mensajes.some((m) => m.autor === 'bot' && /\$\s?\d/.test(m.texto || ''));
      const interesada = cotizada || tieneInteres(c);
      for (const e of [etapas, porCanal.get(canal)]) {
        e.total++;
        if (interesada) e.interesadas++;
        if (cotizada) e.cotizadas++;
        if (compro) e.compraron++;
      }
    }
    const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);
    const canales = [...porCanal.entries()]
      .map(([canal, e]) => ({ canal, ...e, conversionPct: pct(e.compraron, e.total) }))
      .sort((a, b) => b.total - a.total || b.compraron - a.compraron);
    return {
      etapas,
      tasas: {
        interesPct: pct(etapas.interesadas, etapas.total),
        cotizacionPct: pct(etapas.cotizadas, etapas.interesadas),
        cierrePct: pct(etapas.compraron, etapas.cotizadas),
        conversionPct: pct(etapas.compraron, etapas.total),
      },
      canales,
    };
  },
};

export function hidratarConversaciones(datos) {
  if (!datos) return 0;
  for (const f of datos.convRows || []) {
    let estado = {};
    try { estado = f.datos ? JSON.parse(f.datos) : {}; } catch { estado = {}; }
    conversaciones.set(f.wa_id, { waId: f.wa_id, nombre: f.nombre || '', modo: f.modo || 'bot', canal: f.canal || '', estado, mensajes: [], sinLeer: 0, creado: Number(f.creado) || Date.now(), ultimaActividad: Number(f.ultima_actividad) || 0 });
  }
  for (const m of datos.msgRows || []) {
    const c = conversaciones.get(m.wa_id) || obtenerOCrear(m.wa_id);
    c.mensajes.push({ direccion: m.direccion, autor: m.autor, tipo: m.tipo, texto: m.texto, ts: Number(m.ts) });
  }
  return conversaciones.size;
}
