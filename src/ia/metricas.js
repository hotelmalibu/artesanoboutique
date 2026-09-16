// ============================================================
//  metricas.js — Contador de uso de tokens de Arte-SanoBot (Claude).
//
//  Registra el `usage` de cada llamada, calcula el costo en USD/COP y lo
//  persiste como un ajuste más (ajustes.js) — mismo patrón que el resto
//  del panel, sin necesitar una tabla nueva en la base de datos.
// ============================================================
import { config } from '../config.js';
import { ajuste, fijarAjuste } from '../almacen/ajustes.js';

// Precios oficiales de Anthropic (USD por 1M de tokens) — mismos valores
// usados en MalibuBot (src/ia/metricas.js de ese proyecto).
const PRECIOS = {
  'claude-sonnet-5': { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
};
function precioDe(modelo) {
  return PRECIOS[modelo] || PRECIOS['claude-sonnet-5'];
}

const vacio = () => ({ llamadas: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

let guardarPendiente = false;
function programarGuardado() {
  if (guardarPendiente) return;
  guardarPendiente = true;
  setTimeout(() => {
    guardarPendiente = false;
    fijarAjuste('metricasIa', ajuste('metricasIa'));
  }, 20 * 1000); // guarda a lo sumo cada 20 s
}

/** Registra el uso de una llamada a Claude. */
export function registrarUso(modelo, usage) {
  if (!usage) return;
  const m = ajuste('metricasIa');
  const dia = hoyISO();
  if (!m.porDia[dia]) m.porDia[dia] = vacio();

  const inp = usage.input_tokens || 0;
  const out = usage.output_tokens || 0;
  const cr = usage.cache_read_input_tokens || 0;
  const cw = usage.cache_creation_input_tokens || 0;

  for (const acc of [m.totales, m.porDia[dia]]) {
    acc.llamadas += 1;
    acc.input += inp;
    acc.output += out;
    acc.cacheRead += cr;
    acc.cacheWrite += cw;
  }
  programarGuardado();
}

function costoUSD(t, modelo) {
  const p = precioDe(modelo || config.ia.modelo);
  return (t.input * p.input + t.output * p.output + t.cacheRead * p.cacheRead + t.cacheWrite * p.cacheWrite) / 1e6;
}

/** Resumen para el panel. Recibe el # de pedidos creados por el bot para cruzar costo. */
export function resumenMetricas(pedidosBot = 0) {
  const m = ajuste('metricasIa');
  const usd = costoUSD(m.totales);
  const cop = usd * config.tienda.copPorUsd;
  const tokensTotales = m.totales.input + m.totales.output + m.totales.cacheRead + m.totales.cacheWrite;
  const dias = Object.entries(m.porDia)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 30)
    .map(([dia, t]) => ({ dia, llamadas: t.llamadas, tokens: t.input + t.output + t.cacheRead + t.cacheWrite, costoCOP: Math.round(costoUSD(t) * config.tienda.copPorUsd) }));

  return {
    modelo: config.ia.modelo,
    copPorUsd: config.tienda.copPorUsd,
    llamadas: m.totales.llamadas,
    tokens: { ...m.totales, total: tokensTotales },
    costoUSD: Number(usd.toFixed(4)),
    costoCOP: Math.round(cop),
    pedidosBot,
    costoPorPedidoCOP: pedidosBot > 0 ? Math.round(cop / pedidosBot) : null,
    ahorroCacheTokens: m.totales.cacheRead,
    porDia: dias,
  };
}
