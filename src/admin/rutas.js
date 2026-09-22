// ============================================================
//  rutas.js — Rutas del panel administrativo (/admin).
//
//  Publicas (loginRouter):  GET/POST /admin/login · GET /admin/logout
//  Protegidas (adminRouter):
//   GET  /admin/                         -> panel (HTML)
//   GET  /admin/api/resumen              -> tablero
//   GET  /admin/api/catalogo             -> categorias, ingredientes, artesanos
//   GET  /admin/api/productos[/:id]      -> productos
//   POST /admin/api/productos            -> crea/actualiza producto
//   DELETE /admin/api/productos/:id      -> elimina producto
//   POST /admin/api/productos/:id/estado -> borrador|publicado|archivado
//   POST /admin/api/:tabla  DELETE /admin/api/:tabla/:id  (categorias|ingredientes|artesanos)
//   GET  /admin/api/subidas/firma        -> firma para subir imagen a Cloudinary
//   GET  /admin/api/pedidos[/:id]        -> pedidos
//   POST /admin/api/pedidos/:id/estado   -> cambia estado (+guia, transportadora)
//   POST /admin/api/pedidos/:id/confirmar-pago  -> confirmacion manual
//   POST /admin/api/pedidos/:id/reprogramar     -> { fecha }
//   GET/POST /admin/api/ajustes
//   GET  /admin/api/financiero · POST /admin/api/financiero/meta · POST .../reparto
//   GET  /admin/api/conversaciones[/:waId] · POST .../responder · POST .../modo
//   GET  /admin/api/ia/metricas          -> costo y uso de Arte-SanoBot
//   GET  /admin/api/monitor              -> conversaciones por canal
//   GET  /admin/api/embudo               -> embudo de conversión
//   GET  /admin/api/calientes            -> conversaciones sin cerrar con interés
//   GET/POST /admin/api/meta-semanal     -> meta semanal de pedidos
//   GET  /admin/api/diagnostico · POST /admin/api/diagnostico/correo
//   GET  /admin/api/seguridad · GET /admin/api/seguridad/totp/nuevo
// ============================================================
import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config, TIPOS_IVA } from '../config.js';
import { listar, obtener, guardar, eliminar, enriquecer, bajoStock, resumenCatalogo, ESTADOS_PRODUCTO, TABLAS } from '../almacen/catalogo.js';
import { listarPedidos, obtenerPedido, actualizarEstado, reprogramar, resumenVentas, programadosProximos, pedidosDeCliente, ESTADOS, NOMBRES_ESTADO } from '../almacen/pedidos.js';
import { todosLosAjustes, fijarAjuste } from '../almacen/ajustes.js';
import { resumenFinanciero, fijarMetaFinanciera, fijarReparto } from '../almacen/financiero.js';
import { resumenMetricas } from '../ia/metricas.js';
import { store } from '../almacen/conversaciones.js';
import { resumenMetaSemanal, fijarMetaSemanalPedidos, waIdsConCompra } from '../almacen/metaSemanal.js';
import { dbActivo, dbDiagnostico } from '../almacen/db.js';
import { confirmarPago } from '../pagos/confirmar.js';
import { rapydActivo, probarAuth, metodosPais } from '../pagos/rapyd.js';
import { probarCorreo, ultimosEnviosCorreo, avisarEnvioPorCorreo } from '../correo/enviar.js';
import { enviarTexto, whatsappActivo } from '../whatsapp/enviar.js';
import { cloudinaryActivo, firmaSubida } from '../imagenes/cloudinary.js';
import { NOMBRES_IVA } from '../util/iva.js';
import { validarCredenciales, crearToken, ponerCookieSesion, borrarCookieSesion, haySesion, sesionActual } from './sesion.js';
import { ipDe, bloqueoRestante, registrarFallo, registrarExito, totpActivo, verificarTotp, nuevoSecretoTotp, ultimosIntentos } from './seguridad.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PANEL_HTML = readFileSync(join(__dirname, 'panel.html'), 'utf8');
const LOGIN_HTML = readFileSync(join(__dirname, 'login.html'), 'utf8');

function integraciones() {
  return {
    db: dbActivo(),
    rapyd: rapydActivo(),
    rapydSandbox: /sandbox/.test(config.rapyd.baseUrl),
    resend: !!config.correo.resendApiKey,
    whatsapp: whatsappActivo(),
    cloudinary: cloudinaryActivo(),
    ia: !!config.ia.apiKey,
    publicUrl: config.publicUrl,
  };
}

// ============================================================
//  Router PUBLICO (login / logout)
// ============================================================
export const loginRouter = Router();

loginRouter.get('/login', (req, res) => {
  if (haySesion(req)) return res.redirect('/admin');
  res.type('html').send(LOGIN_HTML);
});

loginRouter.get('/login/estado', (_req, res) => {
  res.json({ ok: true, requiereCodigo: totpActivo() });
});

loginRouter.post('/login', async (req, res) => {
  if (!config.admin.password) return res.status(503).json({ ok: false, error: 'Panel deshabilitado (falta ADMIN_PASSWORD).' });
  const ip = ipDe(req);
  const espera = bloqueoRestante(ip);
  if (espera) return res.status(429).json({ ok: false, bloqueado: true, error: `Demasiados intentos fallidos. Espera ${Math.ceil(espera / 60)} min.` });

  const usuario = String(req.body?.usuario || '').trim().slice(0, 60);
  const clave = String(req.body?.clave || '').slice(0, 200);
  const codigo = String(req.body?.codigo || '').trim();

  if (!validarCredenciales(usuario, clave)) {
    await registrarFallo(ip, usuario, 'clave');
    return res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos.' });
  }
  if (totpActivo()) {
    if (!codigo) return res.status(401).json({ ok: false, requiereCodigo: true, error: 'Escribe el código de 6 dígitos de tu app de autenticación.' });
    if (!verificarTotp(config.admin.totpSecret, codigo)) {
      await registrarFallo(ip, usuario, 'codigo');
      return res.status(401).json({ ok: false, requiereCodigo: true, error: 'Código incorrecto o vencido.' });
    }
  }
  registrarExito(ip, usuario);
  console.log(`[seguridad] Ingreso correcto de "${usuario}" desde ${ip}.`);
  ponerCookieSesion(req, res, crearToken(usuario));
  res.json({ ok: true });
});

loginRouter.get('/logout', (_req, res) => {
  borrarCookieSesion(res);
  res.redirect('/admin/login');
});

// ============================================================
//  Router PROTEGIDO
// ============================================================
export const adminRouter = Router();

adminRouter.get('/', (_req, res) => res.type('html').send(PANEL_HTML));

adminRouter.get('/api/resumen', (req, res) => {
  res.json({
    ok: true,
    usuario: sesionActual(req)?.u || '',
    tienda: config.tienda.nombre,
    ventas: resumenVentas(),
    catalogo: resumenCatalogo(),
    bajoStock: bajoStock().slice(0, 20),
    programados: programadosProximos().slice(0, 20).map((p) => ({ id: p.id, numero: p.numero, fecha: p.programadoPara, cliente: p.cliente.nombre, estado: p.estado })),
    ultimosPedidos: listarPedidos().slice(0, 8).map(resumenPedido),
    integraciones: integraciones(),
    chatsSinLeer: store.listar().reduce((n, c) => n + (c.sinLeer || 0), 0),
  });
});

// ---------- Catalogo auxiliar ----------

adminRouter.get('/api/catalogo', (_req, res) => {
  res.json({
    ok: true,
    categorias: listar('categorias'),
    ingredientes: listar('ingredientes'),
    artesanos: listar('artesanos'),
    tiposIva: TIPOS_IVA.map((t) => ({ valor: t, nombre: NOMBRES_IVA[t] })),
    ivaPorDefecto: config.tienda.ivaPorDefecto,
    estados: ESTADOS_PRODUCTO,
  });
});

for (const tabla of ['categorias', 'ingredientes', 'artesanos']) {
  adminRouter.post(`/api/${tabla}`, (req, res) => {
    try {
      const r = guardar(tabla, req.body || {});
      res.json({ ok: true, registro: r });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });
  adminRouter.delete(`/api/${tabla}/:id`, (req, res) => {
    const id = Number(req.params.id);
    const usado = listar('productos').some((p) =>
      (tabla === 'categorias' && p.categoriaId === id) ||
      (tabla === 'artesanos' && p.artesanoId === id) ||
      (tabla === 'ingredientes' && (p.ingredienteIds || []).includes(id))
    );
    if (usado) return res.status(400).json({ ok: false, error: 'No se puede eliminar: hay productos que lo usan.' });
    res.json({ ok: eliminar(tabla, id) });
  });
}

// ---------- Productos ----------

adminRouter.get('/api/productos', (_req, res) => {
  res.json({ ok: true, productos: listar('productos').map(enriquecer) });
});

adminRouter.get('/api/productos/:id', (req, res) => {
  const p = obtener('productos', req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'No existe.' });
  res.json({ ok: true, producto: enriquecer(p) });
});

adminRouter.post('/api/productos', (req, res) => {
  try {
    const p = guardar('productos', req.body || {});
    res.json({ ok: true, producto: enriquecer(p) });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

adminRouter.delete('/api/productos/:id', (req, res) => {
  res.json({ ok: eliminar('productos', req.params.id) });
});

adminRouter.post('/api/productos/:id/estado', (req, res) => {
  const p = obtener('productos', req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'No existe.' });
  const estado = req.body?.estado;
  if (!ESTADOS_PRODUCTO.includes(estado)) return res.status(400).json({ ok: false, error: 'Estado inválido.' });
  try {
    res.json({ ok: true, producto: enriquecer(guardar('productos', { ...p, estado })) });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

adminRouter.get('/api/subidas/firma', (_req, res) => {
  const f = firmaSubida();
  if (!f) return res.json({ ok: false, error: 'Cloudinary no configurado. Pega la URL de la imagen.' });
  res.json({ ok: true, ...f });
});

// ---------- Pedidos ----------

function resumenPedido(p) {
  return {
    id: p.id, numero: p.numero, estado: p.estado, estadoNombre: NOMBRES_ESTADO[p.estado], canal: p.canal, moneda: p.moneda,
    total: p.totales.total, cliente: p.cliente.nombre, email: p.cliente.email, telefono: p.cliente.telefono,
    pais: p.direccion.pais, ciudad: p.direccion.ciudad, programadoPara: p.programadoPara, creado: p.creado,
    items: p.items.length, guia: p.guia,
  };
}

adminRouter.get('/api/pedidos', (req, res) => {
  const lista = listarPedidos({ estado: req.query.estado, q: req.query.q, programados: req.query.programados === '1' });
  res.json({ ok: true, pedidos: lista.slice(0, 500).map(resumenPedido), estados: ESTADOS.map((e) => ({ valor: e, nombre: NOMBRES_ESTADO[e] })) });
});

adminRouter.get('/api/pedidos/:id', (req, res) => {
  const p = obtenerPedido(req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'No existe.' });
  res.json({ ok: true, pedido: p });
});

adminRouter.post('/api/pedidos/:id/estado', async (req, res) => {
  const p = obtenerPedido(req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'No existe.' });
  const { estado, nota, guia, transportadora, urlSeguimiento } = req.body || {};
  try {
    const extra = {};
    if (guia !== undefined) extra.guia = String(guia).slice(0, 80);
    if (transportadora !== undefined) extra.transportadora = String(transportadora).slice(0, 80);
    if (urlSeguimiento !== undefined) extra.urlSeguimiento = String(urlSeguimiento).slice(0, 300);
    const actualizado = actualizarEstado(p.id, estado, String(nota || '').slice(0, 300), extra);
    const avisarWhatsApp = (msg) => {
      if (!actualizado.waId || !store.ventanaAbierta(actualizado.waId)) return;
      enviarTexto(actualizado.waId, msg).catch(() => {});
      store.registrarSaliente({ waId: actualizado.waId, autor: 'tienda', texto: msg });
    };
    if (estado === 'enviado') {
      avisarEnvioPorCorreo(actualizado).catch(() => {});
      avisarWhatsApp(`📦 Tu pedido *${actualizado.numero}* va en camino con ${actualizado.transportadora || 'nuestra transportadora'}.` + (actualizado.guia ? ` Guía: ${actualizado.guia}.` : '') + ` Síguelo en ${config.publicUrl}/pedido/${actualizado.numero}`);
    } else if (estado === 'cancelado' && p.estado !== 'cancelado') {
      avisarWhatsApp(`Tu pedido *${actualizado.numero}* fue cancelado.` + (nota ? ` Motivo: ${String(nota).slice(0, 200)}.` : '') + ' Si tienes dudas, escríbenos por aquí y con gusto te ayudamos.');
    } else if (estado === 'entregado' && p.estado !== 'entregado') {
      avisarWhatsApp(`🎉 Tu pedido *${actualizado.numero}* fue entregado. ¡Gracias por comprar en Arte'Sano! Cuéntanos cómo te fue con tus productos.`);
    }
    res.json({ ok: true, pedido: actualizado });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

adminRouter.post('/api/pedidos/:id/confirmar-pago', async (req, res) => {
  const p = obtenerPedido(req.params.id);
  if (!p) return res.status(404).json({ ok: false, error: 'No existe.' });
  const ok = await confirmarPago(p, String(req.body?.referencia || 'manual').slice(0, 80));
  res.json({ ok, pedido: obtenerPedido(p.id) });
});

adminRouter.post('/api/pedidos/:id/reprogramar', (req, res) => {
  try {
    const p = reprogramar(req.params.id, req.body?.fecha);
    if (!p) return res.status(404).json({ ok: false, error: 'No existe.' });
    res.json({ ok: true, pedido: p });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ---------- Ajustes ----------

adminRouter.get('/api/ajustes', (_req, res) => res.json({ ok: true, ajustes: todosLosAjustes() }));

adminRouter.post('/api/ajustes', (req, res) => {
  const { clave, valor } = req.body || {};
  if (!['envio', 'inicio', 'pedidosProgramados'].includes(clave)) return res.status(400).json({ ok: false, error: 'Ajuste no editable.' });
  fijarAjuste(clave, valor);
  res.json({ ok: true, ajustes: todosLosAjustes() });
});

// ---------- Modelo financiero ----------

adminRouter.get('/api/financiero', (_req, res) => res.json({ ok: true, ...resumenFinanciero() }));

adminRouter.post('/api/financiero/meta', (req, res) => {
  try {
    res.json({ ok: true, meta: fijarMetaFinanciera(req.body || {}) });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

adminRouter.post('/api/financiero/reparto', (req, res) => {
  try {
    res.json({ ok: true, meta: fijarReparto(req.body?.participaciones || {}) });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// ---------- WhatsApp ----------

adminRouter.get('/api/conversaciones', (_req, res) => res.json({ ok: true, conversaciones: store.listar() }));

// Diagnostico/reparacion: suscribe la app de Meta a la cuenta de WhatsApp (WABA).
// Sin esa suscripcion el webhook se verifica bien pero Meta no entrega mensajes.
adminRouter.get('/api/waba/reparar', async (req, res) => {
  const { token, graphBase, graphVersion } = config.whatsapp;
  const wabaId = String(req.query.waba || process.env.WHATSAPP_WABA_ID || '').trim();
  if (!token) return res.status(400).json({ ok: false, error: 'Falta WHATSAPP_TOKEN en el entorno (Render).' });
  if (!wabaId) return res.status(400).json({ ok: false, error: 'Falta el ID de la WABA. Abre esta ruta con ?waba=TU_ID.' });

  const url = `${graphBase}/${graphVersion}/${encodeURIComponent(wabaId)}/subscribed_apps`;
  const headers = { Authorization: `Bearer ${token}` };
  try {
    const antesResp = await fetch(url, { headers });
    const antes = await antesResp.json();
    if (!antesResp.ok) {
      return res.status(502).json({ ok: false, pista: 'Graph API rechazo la consulta. Causa tipica: token vencido (el temporal dura ~24 h) o ID de WABA incorrecto.', respuesta: antes });
    }
    const subResp = await fetch(url, { method: 'POST', headers });
    const suscripcion = await subResp.json();
    const despues = await (await fetch(url, { headers })).json();
    res.json({
      ok: subResp.ok,
      mensaje: subResp.ok ? 'Listo: la app quedo suscrita a la WABA. Escribe un "Hola" al numero.' : 'No se pudo suscribir; revisa la respuesta.',
      wabaId, antes, suscripcion, appsSuscritas: despues,
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: err.message });
  }
});

adminRouter.get('/api/ia/metricas', (_req, res) => {
  const pedidosBot = listarPedidos().filter((p) => p.canal === 'whatsapp').length;
  res.json({ ok: true, activa: !!config.ia.apiKey, ...resumenMetricas(pedidosBot) });
});

// ---------- Monitor de conversaciones ----------

adminRouter.get('/api/monitor', (req, res) => {
  const desde = (req.query.desde || '').trim() || null;
  const hasta = (req.query.hasta || '').trim() || null;
  res.json({ ok: true, rango: { desde, hasta }, conversaciones: store.estadisticas(desde, hasta), canales: store.canalesResumen(desde, hasta) });
});

adminRouter.get('/api/embudo', (req, res) => {
  const desde = (req.query.desde || '').trim() || null;
  const hasta = (req.query.hasta || '').trim() || null;
  res.json({ ok: true, rango: { desde, hasta }, ...store.embudo({ desde, hasta, compradores: waIdsConCompra() }) });
});

adminRouter.get('/api/calientes', (_req, res) => {
  res.json({ ok: true, calientes: store.calientes({ compradores: waIdsConCompra() }) });
});

adminRouter.get('/api/meta-semanal', (_req, res) => res.json(resumenMetaSemanal()));

adminRouter.post('/api/meta-semanal', (req, res) => {
  const n = fijarMetaSemanalPedidos(req.body?.meta);
  if (!n) return res.status(400).json({ ok: false, error: 'La meta debe ser un número entre 1 y 1000.' });
  res.json({ ok: true, meta: n });
});

adminRouter.get('/api/conversaciones/:waId', (req, res) => {
  const c = store.obtener(req.params.waId);
  if (!c) return res.status(404).json({ ok: false, error: 'No existe.' });
  store.marcarLeida(c.waId);
  res.json({
    ok: true,
    conversacion: { waId: c.waId, nombre: c.nombre, modo: c.modo, canal: c.canal || '', mensajes: c.mensajes, ventanaAbierta: store.ventanaAbierta(c.waId) },
    pedidos: pedidosDeCliente({ waId: c.waId }).map(resumenPedido),
  });
});

adminRouter.post('/api/conversaciones/:waId/responder', async (req, res) => {
  const texto = String(req.body?.texto || '').trim().slice(0, 4000);
  if (!texto) return res.status(400).json({ ok: false, error: 'Escribe un mensaje.' });
  if (!store.ventanaAbierta(req.params.waId)) return res.status(400).json({ ok: false, error: 'La ventana de 24 h está cerrada; el cliente debe escribir primero.' });
  try {
    await enviarTexto(req.params.waId, texto);
    store.registrarSaliente({ waId: req.params.waId, autor: 'tienda', texto });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

adminRouter.post('/api/conversaciones/:waId/modo', (req, res) => {
  const c = store.fijarModo(req.params.waId, req.body?.modo);
  res.json({ ok: true, modo: c.modo });
});

// ---------- Diagnostico y seguridad ----------

adminRouter.get('/api/diagnostico', async (req, res) => {
  const [db, rapyd] = await Promise.all([dbDiagnostico(), req.query.rapyd === '1' ? probarAuth() : Promise.resolve(null)]);
  const metodos = req.query.rapyd === '1' ? await metodosPais(config.rapyd.pais, 'COP') : null;
  res.json({ ok: true, integraciones: integraciones(), db, rapyd, metodosRapyd: metodos, correo: ultimosEnviosCorreo(), wabaId: process.env.WHATSAPP_WABA_ID || '' });
});

adminRouter.post('/api/diagnostico/correo', async (req, res) => {
  res.json(await probarCorreo(String(req.body?.to || '').trim()));
});

adminRouter.get('/api/seguridad', (req, res) => {
  res.json({ ok: true, usuario: sesionActual(req)?.u || '', totpActivo: totpActivo(), intentos: ultimosIntentos() });
});

adminRouter.get('/api/seguridad/totp/nuevo', (req, res) => {
  res.json({ ok: true, ...nuevoSecretoTotp(sesionActual(req)?.u || 'admin') });
});
