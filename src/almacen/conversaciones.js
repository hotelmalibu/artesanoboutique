// ============================================================
//  conversaciones.js — Almacen en memoria de las conversaciones de
//  WhatsApp (con replica en PostgreSQL). Guarda el historial, el modo
//  (bot | humano) y el estado del bot por cliente.
// ============================================================
import { dbGuardarConversacion, dbGuardarMensaje } from './db.js';

/** @type {Map<string, object>} */
const conversaciones = new Map();
const MAX_MENSAJES = 200;

function persistirConv(c) {
  dbGuardarConversacion(c).catch((e) => console.error('[conversaciones] No se pudo guardar', c.waId, e.message));
}

function obtenerOCrear(waId, nombre = '') {
  let c = conversaciones.get(waId);
  if (!c) {
    c = { waId, nombre, modo: 'bot', estado: {}, mensajes: [], sinLeer: 0, creado: Date.now(), ultimaActividad: Date.now() };
    conversaciones.set(waId, c);
  }
  if (nombre && !c.nombre) c.nombre = nombre;
  return c;
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
};

export function hidratarConversaciones(datos) {
  if (!datos) return 0;
  for (const f of datos.convRows || []) {
    let estado = {};
    try { estado = f.datos ? JSON.parse(f.datos) : {}; } catch { estado = {}; }
    conversaciones.set(f.wa_id, { waId: f.wa_id, nombre: f.nombre || '', modo: f.modo || 'bot', estado, mensajes: [], sinLeer: 0, creado: Number(f.creado) || Date.now(), ultimaActividad: Number(f.ultima_actividad) || 0 });
  }
  for (const m of datos.msgRows || []) {
    const c = conversaciones.get(m.wa_id) || obtenerOCrear(m.wa_id);
    c.mensajes.push({ direccion: m.direccion, autor: m.autor, tipo: m.tipo, texto: m.texto, ts: Number(m.ts) });
  }
  return conversaciones.size;
}
