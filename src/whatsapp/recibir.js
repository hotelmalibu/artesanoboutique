// ============================================================
//  recibir.js — Convierte el cuerpo del webhook de Meta en una lista
//  simple de mensajes. Ignora las notificaciones de estado (enviado /
//  entregado / leido). Los botones y listas interactivas llegan como
//  tipo "interactive": se expone el id elegido en "opcion".
// ============================================================

/**
 * @returns {Array<{from:string, id:string, tipo:string, texto:string, opcion:string, nombre:string}>}
 */
export function parsearMensajes(body) {
  const resultado = [];
  if (!body || body.object !== 'whatsapp_business_account') return resultado;

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const mensajes = value.messages || [];
      if (!mensajes.length) continue;
      const nombre = value.contacts?.[0]?.profile?.name || '';

      for (const msg of mensajes) {
        const inter = msg.interactive || {};
        const opcion = inter.button_reply?.id || inter.list_reply?.id || msg.button?.payload || '';
        const textoInter = inter.button_reply?.title || inter.list_reply?.title || msg.button?.text || '';
        resultado.push({
          from: msg.from,
          id: msg.id,
          tipo: msg.type,
          texto: msg.text?.body || textoInter || '',
          opcion,
          nombre,
        });
      }
    }
  }
  return resultado;
}
