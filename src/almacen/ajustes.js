// ============================================================
//  ajustes.js — Configuracion editable desde el panel (en memoria +
//  replica en PostgreSQL). Ej.: tarifas de envio, textos del inicio,
//  aliados destacados, consecutivo de pedidos.
// ============================================================
import { dbGuardarAjuste } from './db.js';

const valores = new Map();

const POR_DEFECTO = {
  consecutivoPedidos: 0,
  envio: {
    // Colombia (COP)
    ciudadesPrincipales: ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga', 'sincelejo', 'monteria', 'cucuta', 'pereira', 'manizales', 'santa-marta', 'ibague', 'villavicencio', 'armenia', 'valledupar', 'pasto', 'neiva', 'popayan', 'tunja'],
    tarifaPrincipalCop: 12000,
    tarifaRestoCop: 18000,
    diasPrincipal: '2 a 4 días hábiles',
    diasResto: '3 a 7 días hábiles',
    transportadoraNacional: 'Servientrega / Coordinadora',
    // Internacional (USD)
    zonas: [
      { nombre: 'América', paises: ['US', 'CA', 'MX', 'PA', 'CR', 'EC', 'PE', 'CL', 'AR', 'BR', 'UY', 'PY', 'BO', 'VE', 'DO', 'PR', 'GT', 'HN', 'SV', 'NI', 'CU', 'JM'], tarifaUsd: 28, dias: '5 a 10 días hábiles' },
      { nombre: 'Europa', paises: ['ES', 'FR', 'DE', 'IT', 'PT', 'GB', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL'], tarifaUsd: 38, dias: '7 a 14 días hábiles' },
      { nombre: 'Resto del mundo', paises: [], tarifaUsd: 48, dias: '10 a 20 días hábiles' },
    ],
    transportadoraInternacional: 'DHL Express',
    ivaEnvio: 'iva_19',
  },
  inicio: {
    titulo: 'El cuidado de la belleza, con productos de origen artesanal',
    subtitulo: 'Jabones, cremas y lociones artesanales con plantas medicinales de la cultura Zenú. Del corazón de Córdoba y Sucre para el mundo.',
  },
  pedidosProgramados: { minDias: 2, maxDias: 90 },
  // Modelo financiero interno (no visible al cliente): meta de ventas del
  // mes y % de costo por defecto sobre el precio (70% costo = 30% margen).
  financiero: { metaMensualCop: 50000000, margenObjetivoPct: 30 },
  // Contadores de uso de Arte-SanoBot (tokens de Claude), ver almacen/ia/metricas.js.
  metricasIa: { totales: { llamadas: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, porDia: {} },
};

export function hidratarAjustes(filas) {
  for (const { clave, valor } of filas || []) valores.set(clave, valor);
  return valores.size;
}

export function ajuste(clave) {
  return valores.has(clave) ? valores.get(clave) : structuredClone(POR_DEFECTO[clave]);
}

export function fijarAjuste(clave, valor) {
  valores.set(clave, valor);
  dbGuardarAjuste(clave, valor).catch((e) => console.error('[ajustes] No se pudo guardar', clave, e.message));
  return valor;
}

export function siguienteConsecutivo() {
  const n = (ajuste('consecutivoPedidos') || 0) + 1;
  fijarAjuste('consecutivoPedidos', n);
  return n;
}

export function todosLosAjustes() {
  const out = {};
  for (const k of Object.keys(POR_DEFECTO)) out[k] = ajuste(k);
  return out;
}
