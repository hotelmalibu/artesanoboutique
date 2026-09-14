// ============================================================
//  bot.js — Chatbot de WhatsApp de Arte'Sano (Fase 0: menu guiado).
//
//  Flujos: menu principal, catalogo por linea con precios y enlaces,
//  rastreo de pedido, informacion de ingredientes y paso a una persona.
//  En la Fase 3 se conecta Claude (tool use) para lenguaje natural y
//  toma de pedidos completa por chat.
// ============================================================
import { config } from '../config.js';
import { store } from '../almacen/conversaciones.js';
import { listar, productosPublicados, obtenerPorSlug, enriquecer } from '../almacen/catalogo.js';
import { obtenerPorNumero, pedidosDeCliente, NOMBRES_ESTADO } from '../almacen/pedidos.js';
import { formatearCOP } from '../util/moneda.js';
import { enviarTexto, enviarBotones, enviarLista } from './enviar.js';

const URL = () => config.publicUrl;

function saludo(nombre) {
  return `¡Hola${nombre ? ' ' + nombre.split(' ')[0] : ''}! 🌿 Soy el asistente de *${config.tienda.nombre}*, cosmética artesanal con plantas ancestrales Zenú.\n¿Qué te gustaría hacer?`;
}

async function menu(waId, nombre) {
  await enviarBotones(waId, saludo(nombre), [
    { id: 'menu_productos', titulo: 'Ver productos' },
    { id: 'menu_pedido', titulo: 'Rastrear pedido' },
    { id: 'menu_humano', titulo: 'Hablar con alguien' },
  ], 'También puedes escribir "ingredientes" o "envíos".');
  store.fijarEstadoBot(waId, { paso: 'menu' });
  return '[menú]';
}

async function lineas(waId) {
  const cats = listar('categorias').filter((c) => c.activo !== false && productosPublicados({ categoria: c.slug }).length);
  if (!cats.length) {
    await enviarTexto(waId, `Aún estamos cargando el catálogo. Míralo en ${URL()}/tienda 🌿`);
    return '[sin catálogo]';
  }
  await enviarLista(waId, 'Estas son nuestras líneas de producto. Elige una para ver los productos y precios:', 'Ver líneas',
    cats.map((c) => ({ id: 'linea_' + c.slug, titulo: c.nombre, descripcion: c.descripcion })), 'Líneas');
  store.fijarEstadoBot(waId, { paso: 'lineas' });
  return '[líneas]';
}

async function productosDeLinea(waId, slug) {
  const cat = obtenerPorSlug('categorias', slug);
  const lista = productosPublicados({ categoria: slug });
  if (!cat || !lista.length) return menu(waId);
  const texto = lista.slice(0, 8).map((p) =>
    `• *${p.nombre}* — ${formatearCOP(p.precioDesde)}${p.agotado ? ' (agotado)' : ''}\n  ${p.descripcionCorta}\n  ${URL()}/producto/${p.slug}`
  ).join('\n\n');
  await enviarTexto(waId, `*${cat.nombre}*\n\n${texto}\n\nPara comprar, abre el enlace del producto o dime cuál quieres y te ayudo con el pedido. 🛍️`);
  await enviarBotones(waId, '¿Algo más?', [
    { id: 'menu_productos', titulo: 'Otra línea' },
    { id: 'menu_humano', titulo: 'Hablar con alguien' },
    { id: 'menu_inicio', titulo: 'Menú' },
  ]);
  store.fijarEstadoBot(waId, { paso: 'productos', linea: slug });
  return '[productos ' + slug + ']';
}

async function pedirNumero(waId) {
  await enviarTexto(waId, 'Escribe el número de tu pedido (ejemplo: *AS-2026-000012*) o simplemente responde *mis pedidos* para buscar por tu número de WhatsApp.');
  store.fijarEstadoBot(waId, { paso: 'rastrear' });
  return '[pedir número]';
}

function resumenPedido(p) {
  const l = p.items.map((i) => `${i.cantidad}× ${i.productoNombre}`).join(', ');
  return `*${p.numero}* · ${NOMBRES_ESTADO[p.estado] || p.estado}\n${l}\n` +
    (p.programadoPara ? `Entrega programada: ${p.programadoPara}\n` : '') +
    (p.guia ? `Guía ${p.guia}${p.urlSeguimiento ? ' · ' + p.urlSeguimiento : ''}\n` : '') +
    `${URL()}/pedido/${p.numero}`;
}

async function rastrear(waId, texto) {
  const m = /AS-\d{4}-\d{6}/i.exec(texto);
  let pedidos = [];
  if (m) {
    const p = obtenerPorNumero(m[0]);
    if (p) pedidos = [p];
  } else {
    pedidos = pedidosDeCliente({ waId, telefono: waId }).slice(0, 3);
  }
  if (!pedidos.length) {
    await enviarTexto(waId, 'No encontré pedidos con ese dato. Revisa el número (formato AS-AAAA-000000) o escríbenos tu correo y te ayudamos. 🙏');
  } else {
    await enviarTexto(waId, pedidos.map(resumenPedido).join('\n\n'));
  }
  return menu(waId);
}

async function ingredientes(waId) {
  const ings = listar('ingredientes').filter((i) => i.activo !== false);
  const texto = ings.map((i) => `• *${i.nombre}*${i.nombreCientifico ? ` (${i.nombreCientifico})` : ''}: ${i.beneficios || i.usoAncestral || ''}`).join('\n');
  await enviarTexto(waId, `Nuestros ingredientes vienen del territorio Zenú (Córdoba y Sucre) 🌱\n\n${texto}\n\nMás en ${URL()}/ingredientes`);
  return menu(waId);
}

async function envios(waId) {
  await enviarTexto(waId, `📦 *Envíos*\n• Colombia: 2 a 7 días hábiles${config.tienda.envioGratisDesde ? `; gratis desde ${formatearCOP(config.tienda.envioGratisDesde)}` : ''}.\n• Internacional: enviamos a todo el mundo (5 a 20 días hábiles según destino).\n• Puedes *programar* la fecha de entrega al pagar.\nCompra en ${URL()}/tienda`);
  return menu(waId);
}

async function humano(waId) {
  store.fijarModo(waId, 'humano');
  await enviarTexto(waId, 'Listo, una persona de nuestro equipo te atenderá en breve por este mismo chat. 🌿');
  return '[handoff]';
}

/**
 * Responde un mensaje entrante. Devuelve una descripcion corta de lo
 * enviado (para el registro) o null si no respondio.
 */
export async function responderBot(m) {
  const waId = m.from;
  const texto = (m.texto || '').trim();
  const t = texto.toLowerCase();
  const opcion = m.opcion || '';
  const estado = store.estadoBot(waId);

  if (opcion === 'menu_inicio' || /^(hola|buenas|menu|menú|inicio|hi)\b/.test(t)) return menu(waId, m.nombre);
  if (opcion === 'menu_productos' || /(producto|catalogo|catálogo|comprar|jab[oó]n|crema|shampoo|loci[oó]n)/.test(t)) return lineas(waId);
  if (opcion.startsWith('linea_')) return productosDeLinea(waId, opcion.slice(6));
  if (opcion === 'menu_pedido' || /(rastrear|pedido|seguimiento|mi compra)/.test(t)) {
    if (/AS-\d{4}-\d{6}/i.test(texto) || /mis pedidos/.test(t)) return rastrear(waId, texto);
    return pedirNumero(waId);
  }
  if (estado.paso === 'rastrear') return rastrear(waId, texto);
  if (opcion === 'menu_humano' || /(persona|humano|asesor|alguien|ayuda)/.test(t)) return humano(waId);
  if (/(ingrediente|planta|arroz|gu[aá]simo|matarat[oó]n|coco|chopo|zen[uú])/.test(t)) return ingredientes(waId);
  if (/(env[ií]o|entrega|domicilio|cu[aá]nto tarda|internacional)/.test(t)) return envios(waId);

  return menu(waId, m.nombre);
}
