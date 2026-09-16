// ============================================================
//  metaSemanal.js — Meta semanal de pedidos y tasa de conversión, para el
//  Monitor de conversaciones del panel (mismo patrón que MalibuBot,
//  src/datos/meta.js de ese proyecto, adaptado de reservas a pedidos).
//
//  Semana = lunes a domingo en hora de Colombia. Cuentan los pedidos
//  CONFIRMADOS (pagado, en preparación, enviado o entregado) creados esa
//  semana. La conversión = conversaciones iniciadas esa semana que
//  terminaron en una compra confirmada.
// ============================================================
import { listarPedidos } from './pedidos.js';
import { store } from './conversaciones.js';
import { ajuste, fijarAjuste } from './ajustes.js';
import { diaColombia, sumarDias, inicioSemana } from '../util/fechas.js';

const ESTADOS_CONFIRMADOS = ['pagado', 'en_preparacion', 'enviado', 'entregado'];

export function metaSemanalPedidos() {
  return ajuste('metaSemanalPedidos') || 10;
}

export function fijarMetaSemanalPedidos(valor) {
  const n = Math.round(Number(valor));
  if (!Number.isFinite(n) || n < 1 || n > 1000) return null;
  fijarAjuste('metaSemanalPedidos', n);
  return n;
}

function confirmado(p) {
  return ESTADOS_CONFIRMADOS.includes(p.estado);
}

/** waIds con al menos una compra confirmada (para el embudo y la conversión). */
export function waIdsConCompra() {
  const s = new Set();
  for (const p of listarPedidos()) if (confirmado(p) && p.waId) s.add(p.waId);
  return s;
}

function pedidosEntre(desde, hasta) {
  return listarPedidos().filter((p) => {
    const dia = diaColombia(p.creado);
    return dia >= desde && dia <= hasta;
  });
}

function resumenSemana(lunes, meta, compradores) {
  const domingo = sumarDias(lunes, 6);
  const ps = pedidosEntre(lunes, domingo);
  const conf = ps.filter(confirmado);
  const emb = store.embudo({ desde: lunes, hasta: domingo, compradores });
  return {
    desde: lunes,
    hasta: domingo,
    pedidos: conf.length,
    bot: conf.filter((p) => p.canal === 'whatsapp').length,
    web: conf.filter((p) => p.canal !== 'whatsapp').length,
    chats: emb.etapas.total,
    chatsCompraron: emb.etapas.compraron,
    conversionPct: emb.etapas.total ? Math.round((emb.etapas.compraron / emb.etapas.total) * 100) : null,
    cumplida: conf.length >= meta,
  };
}

/** Todo lo que pinta la sección "Meta semanal" del Monitor de conversaciones. */
export function resumenMetaSemanal({ semanas = 8 } = {}) {
  const meta = metaSemanalPedidos();
  const hoy = diaColombia();
  const lunes = inicioSemana(hoy);
  const compradores = waIdsConCompra();

  const actual = resumenSemana(lunes, meta, compradores);
  const transcurridos = Math.round((new Date(hoy + 'T00:00:00Z') - new Date(lunes + 'T00:00:00Z')) / 864e5) + 1; // 1..7
  const restantes = 7 - transcurridos;
  const proyeccion = Math.round((actual.pedidos / transcurridos) * 7);

  const historial = [];
  for (let i = semanas - 1; i >= 0; i--) historial.push(resumenSemana(sumarDias(lunes, -7 * i), meta, compradores));
  const cerradas = historial.slice(0, -1); // sin la semana en curso
  const cumplidas = cerradas.filter((s) => s.cumplida).length;

  return {
    meta,
    hoy,
    semana: {
      ...actual,
      faltan: Math.max(meta - actual.pedidos, 0),
      pct: Math.min(100, Math.round((actual.pedidos / meta) * 100)),
      diaDeSemana: transcurridos,
      diasRestantes: restantes,
      proyeccion,
    },
    historial,
    semanasCumplidas: cumplidas,
    semanasCerradas: cerradas.length,
  };
}
