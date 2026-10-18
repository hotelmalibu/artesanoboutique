// ============================================================
//  index.js — Servidor de Arte'Sano (tienda + panel + API + webhooks).
//
//  Endpoints principales:
//   GET  /health               -> health check (Render)
//   /                          -> tienda publica (tienda/rutas.js)
//   /admin                     -> panel administrativo (admin/rutas.js)
//   GET/POST /webhook/whatsapp -> Meta (verificacion + mensajes)
//   POST /webhook/wompi        -> confirmacion de pagos
//   GET  /privacidad           -> politica de datos (requerida por Meta)
// ============================================================
import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config, revisarConfig } from './config.js';
import { iniciarDB, dbActivo, dbCargarCatalogo, dbCargarPedidos, dbCargarAjustes, dbCargarConversaciones } from './almacen/db.js';
import { hidratarCatalogo } from './almacen/catalogo.js';
import { hidratarPedidos, obtenerPorNumero, pedidosPendientesPago, expirarPendientes, programadosProximos } from './almacen/pedidos.js';
import { hidratarAjustes } from './almacen/ajustes.js';
import { store, hidratarConversaciones } from './almacen/conversaciones.js';
import { sembrarSiVacio } from './almacen/semilla.js';
import { aplicarMigraciones } from './almacen/migraciones.js';
import { verificarFirma } from './whatsapp/firma.js';
import { parsearMensajes } from './whatsapp/recibir.js';
import { enviarTexto, marcarLeido, whatsappActivo } from './whatsapp/enviar.js';
import { responderBot } from './whatsapp/bot.js';
import { responderIA } from './ia/agente.js';
import { verificarWebhook as verificarWebhookWompi, consultarTransaccion, wompiActivo, montoCoincide, montoEnCentavos, iniciarRefrescoMetodos } from './pagos/wompi.js';
import { confirmarPago, rechazarPago } from './pagos/confirmar.js';
import { requiereSesion, cabecerasSeguridad } from './admin/sesion.js';
import { loginRouter, adminRouter } from './admin/rutas.js';
import { tiendaRouter } from './tienda/rutas.js';
import { layout } from './tienda/plantillas.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Cuerpo crudo (rawBody) para verificar la firma de Meta.
app.use(express.json({ limit: '2mb', verify: (req, _res, buf) => { req.rawBody = buf; } }));

// ---------- Salud ----------
app.get('/health', (_req, res) => {
  res.json({ ok: true, servicio: 'artesanoboutique', persistencia: dbActivo() ? 'postgresql' : 'memoria', wompi: wompiActivo(), wompiEntorno: wompiActivo() ? (config.wompi.produccion ? 'produccion' : 'pruebas') : null, whatsapp: whatsappActivo(), ia: !!config.ia.apiKey });
});

// ---------- Estaticos y legal ----------
app.use('/publico', express.static(join(__dirname, 'tienda', 'publico'), { maxAge: '1h' }));
// La política (HTML plano en legal/) se muestra dentro del mismo marco de la tienda.
const privacidadCuerpo = /<main[^>]*>([\s\S]*?)<\/main>/.exec(readFileSync(join(__dirname, 'legal', 'privacidad.html'), 'utf8'))?.[1] || '';
const PRIVACIDAD_HTML = layout({
  titulo: 'Política de privacidad',
  descripcion: 'Cómo Arte\'Sano trata tus datos personales conforme a la Ley 1581 de 2012.',
  contenido: `<section class="contenedor seccion texto">${privacidadCuerpo}</section>`,
  ruta: '/privacidad',
});
app.get(['/privacidad', '/politica-de-privacidad', '/privacy'], (_req, res) => res.type('html').send(PRIVACIDAD_HTML));

// ---------- Panel ----------
app.use('/admin', cabecerasSeguridad, loginRouter);
app.use('/admin', requiereSesion, adminRouter);

// ---------- Webhook de WhatsApp ----------
app.get('/webhook/whatsapp', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === config.whatsapp.verifyToken) {
    console.log('[webhook] Verificación de Meta correcta.');
    return res.status(200).send(req.query['hub.challenge']);
  }
  return res.sendStatus(403);
});

app.post('/webhook/whatsapp', async (req, res) => {
  if (config.whatsapp.appSecret && !verificarFirma(req)) {
    console.warn('[webhook] Firma de Meta inválida. Rechazado.');
    return res.sendStatus(403);
  }
  res.sendStatus(200);
  try {
    for (const m of parsearMensajes(req.body)) {
      console.log(`[msg] de ${m.nombre || m.from} (${m.tipo}): ${m.texto || m.opcion}`);
      store.registrarEntrante({ waId: m.from, nombre: m.nombre, tipo: m.tipo, texto: m.texto || m.opcion });
      marcarLeido(m.id).catch(() => {});
      if (store.obtenerModo(m.from) === 'humano') continue;
      // Arte-SanoBot (Claude, tool-use) responde primero; si no hay API key
      // configurada o falla, cae al bot de menú (whatsapp/bot.js) como respaldo.
      const respuestaIA = await responderIA(m.from);
      if (respuestaIA) {
        await enviarTexto(m.from, respuestaIA);
        store.registrarSaliente({ waId: m.from, autor: 'bot', texto: respuestaIA });
      } else {
        const enviado = await responderBot(m);
        if (enviado) store.registrarSaliente({ waId: m.from, autor: 'bot', texto: enviado });
      }
    }
  } catch (err) {
    console.error('[webhook] Error procesando el mensaje:', err);
  }
});

// ---------- Webhook de Wompi ----------
app.post('/webhook/wompi', async (req, res) => {
  const evento = req.body || {};
  if (!verificarWebhookWompi(evento)) {
    console.warn('[wompi] Webhook con checksum inválido. Rechazado.');
    return res.sendStatus(403);
  }
  res.sendStatus(200);
  try {
    const t = evento?.data?.transaction || {};
    console.log(`[wompi] Webhook recibido: ${evento.event || '?'} · pedido ${t.reference || '?'} · estado ${t.status || '?'}`);
    const pedido = obtenerPorNumero(t.reference);
    if (!pedido) return console.warn('[wompi] Pedido no encontrado para el evento', t.reference);
    if (t.status === 'APPROVED') {
      if (!montoCoincide(pedido, t.amount_in_cents)) return console.warn(`[wompi] Monto no coincide en el pedido ${pedido.numero}: Wompi ${t.amount_in_cents} vs pedido ${montoEnCentavos(pedido)}. No se confirma.`);
      await confirmarPago(pedido, t.id || '');
    } else if (t.status === 'DECLINED' || t.status === 'ERROR' || t.status === 'VOIDED') rechazarPago(pedido, `Pago ${t.status} en Wompi`);
  } catch (err) {
    console.error('[wompi] Error procesando webhook:', err);
  }
});

// ---------- Tienda ----------
app.use('/', tiendaRouter);

// ---------- 404 ----------
app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'No existe.' });
  res.status(404).type('html').send(layout({ titulo: 'Página no encontrada', contenido: '<section class="contenedor seccion texto"><h1>No encontramos esa página</h1><p>Quizás el producto ya no está disponible. <a href="/tienda">Ver la tienda</a>.</p></section>', ruta: req.path }));
});

// ---------- Tareas periodicas ----------
const REVISION_PAGOS_MS = 90 * 1000;
const VENTANA_REVISION_MS = 3 * 60 * 60 * 1000;
async function revisarPagosPendientes() {
  if (!wompiActivo()) return;
  const ahora = Date.now();
  for (const p of pedidosPendientesPago()) {
    // checkoutId empieza siendo nuestra referencia; solo se puede consultar
    // en Wompi una vez que /pago/gracias la reemplaza por el id real de la
    // transacción (Wompi no soporta buscar por referencia).
    if (!p.checkoutId || p.checkoutId === p.numero || ahora - p.creado > VENTANA_REVISION_MS) continue;
    const estado = await consultarTransaccion(p.checkoutId);
    if (!estado) continue;
    if (estado.pagado && !montoCoincide(p, estado.montoCentavos)) console.warn(`[wompi] Revisor: monto no coincide en el pedido ${p.numero}. No se confirma.`);
    else if (estado.pagado) { console.log(`[wompi] Revisor: pedido ${p.numero} aparece pagado en Wompi (sin webhook).`); await confirmarPago(p, estado.referenciaPago); }
    else if (estado.rechazado) rechazarPago(p, `Pago ${estado.estado} en Wompi`);
  }
}

function recordatoriosProgramados() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  for (const p of programadosProximos()) {
    if (!p.waId || !store.ventanaAbierta(p.waId)) continue;
    const dias = Math.round((new Date(p.programadoPara + 'T00:00:00') - hoy) / 86400000);
    if (![3, 1].includes(dias) || (p.recordatorios || []).includes(dias)) continue;
    p.recordatorios = [...(p.recordatorios || []), dias];
    const msg = `🌿 Recordatorio: tu pedido *${p.numero}* está programado para el ${p.programadoPara} (${dias === 1 ? 'mañana' : 'en 3 días'}). Si necesitas cambiar la fecha, escríbenos.`;
    enviarTexto(p.waId, msg).then(() => store.registrarSaliente({ waId: p.waId, autor: 'bot', texto: msg })).catch(() => {});
  }
}

// ---------- Arranque ----------
async function arrancar() {
  const dbOk = await iniciarDB();
  if (dbOk) {
    try {
      const nCat = hidratarCatalogo(await dbCargarCatalogo());
      const nPed = hidratarPedidos(await dbCargarPedidos());
      hidratarAjustes(await dbCargarAjustes());
      const nConv = hidratarConversaciones(await dbCargarConversaciones());
      console.log(`[db] Memoria hidratada: ${nCat} registros de catálogo, ${nPed} pedidos, ${nConv} conversaciones.`);
    } catch (err) {
      console.error('[db] Error hidratando desde la base:', err.message);
    }
  }
  sembrarSiVacio();
  aplicarMigraciones();

  iniciarRefrescoMetodos();
  setInterval(() => revisarPagosPendientes().catch((e) => console.error('[pago] revisor:', e.message)), REVISION_PAGOS_MS);
  setInterval(() => { const n = expirarPendientes(); if (n) console.log(`[pedidos] ${n} reservas vencidas canceladas.`); }, 10 * 60 * 1000);
  setInterval(recordatoriosProgramados, 60 * 60 * 1000);

  app.listen(config.puerto, () => {
    revisarConfig();
    console.log(`[servidor] ${config.tienda.nombre} escuchando en el puerto ${config.puerto}`);
    console.log(`[servidor] Tienda en / · Panel en /admin · Salud en /health`);
  });
}

arrancar();
