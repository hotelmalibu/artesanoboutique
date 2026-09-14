// ============================================================
//  enviar.js — Envia mensajes a WhatsApp usando la Graph API (Meta).
//  Texto libre, botones, listas, plantillas y acuse de lectura.
// ============================================================
import { config } from '../config.js';

function urlMensajes() {
  return `${config.whatsapp.graphBase}/${config.whatsapp.graphVersion}/${config.whatsapp.phoneNumberId}/messages`;
}

export function whatsappActivo() {
  return !!(config.whatsapp.token && config.whatsapp.phoneNumberId);
}

async function llamarGraph(payload) {
  if (!whatsappActivo()) throw new Error('WhatsApp no configurado');
  const resp = await fetch(urlMensajes(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.whatsapp.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error('[enviar] Error de Graph API:', resp.status, JSON.stringify(datos));
    throw new Error(`Graph API respondio ${resp.status}`);
  }
  return datos;
}

/** Texto libre (solo dentro de la ventana de 24 h que abre el cliente). */
export function enviarTexto(destino, texto) {
  return llamarGraph({ messaging_product: 'whatsapp', to: destino, type: 'text', text: { body: texto, preview_url: true } });
}

/**
 * Hasta 3 botones de respuesta rapida.
 * @param {Array<{id:string, titulo:string}>} botones
 */
export function enviarBotones(destino, cuerpo, botones, pie = '') {
  return llamarGraph({
    messaging_product: 'whatsapp',
    to: destino,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: cuerpo },
      ...(pie ? { footer: { text: pie } } : {}),
      action: { buttons: botones.slice(0, 3).map((b) => ({ type: 'reply', reply: { id: b.id, title: String(b.titulo).slice(0, 20) } })) },
    },
  });
}

/**
 * Lista desplegable (hasta 10 opciones).
 * @param {Array<{id:string, titulo:string, descripcion?:string}>} opciones
 */
export function enviarLista(destino, cuerpo, botonTexto, opciones, tituloSeccion = 'Opciones') {
  return llamarGraph({
    messaging_product: 'whatsapp',
    to: destino,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: cuerpo },
      action: {
        button: String(botonTexto).slice(0, 20),
        sections: [{ title: tituloSeccion.slice(0, 24), rows: opciones.slice(0, 10).map((o) => ({ id: o.id, title: String(o.titulo).slice(0, 24), ...(o.descripcion ? { description: String(o.descripcion).slice(0, 72) } : {}) })) }],
      },
    },
  });
}

/** Plantilla aprobada por Meta (funciona fuera de la ventana de 24 h). */
export function enviarPlantilla(destino, nombre, idioma = 'es', parametros = []) {
  const components = parametros.length
    ? [{ type: 'body', parameters: parametros.map((p) => ({ type: 'text', text: String(p) })) }]
    : [];
  return llamarGraph({ messaging_product: 'whatsapp', to: destino, type: 'template', template: { name: nombre, language: { code: idioma }, components } });
}

/** Marca un mensaje como leido (ticks azules). */
export function marcarLeido(messageId) {
  return llamarGraph({ messaging_product: 'whatsapp', status: 'read', message_id: messageId });
}
