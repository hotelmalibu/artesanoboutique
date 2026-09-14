// ============================================================
//  moneda.js — Formato y conversion COP / USD.
//  Moneda base: COP. Para el exterior se usa el precio USD fijado en el
//  producto o, si no lo tiene, la tasa COP_POR_USD de la configuracion.
// ============================================================
import { config } from '../config.js';
import { redondear, desglosar } from './iva.js';

export const MONEDAS = ['COP', 'USD'];

export function formatearCOP(n) {
  return '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
}

export function formatearUSD(n) {
  return 'US$ ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatear(n, moneda = 'COP') {
  return moneda === 'USD' ? formatearUSD(n) : formatearCOP(n);
}

export function copAUsd(cop) {
  const tasa = config.tienda.copPorUsd || 4200;
  return redondear((Number(cop) || 0) / tasa);
}

/**
 * Precio de una variante (o producto) en la moneda pedida.
 * En USD (exportacion) se usa el precio USD fijado por la tienda; si no hay,
 * se convierte la base COP SIN el IVA colombiano.
 * @param {{precioCop:number, precioUsd?:number, tipoIva?:string, incluyeIva?:boolean}} item
 */
export function precioEn(item, moneda = 'COP') {
  if (moneda === 'USD') {
    if (item.precioUsd) return Number(item.precioUsd);
    const base = desglosar(item.precioCop, item.tipoIva || 'iva_19', item.incluyeIva !== false).base;
    return copAUsd(base);
  }
  return Number(item.precioCop) || 0;
}

/** Moneda sugerida segun el pais de la direccion. */
export function monedaPorPais(pais) {
  return String(pais || 'CO').toUpperCase() === 'CO' ? 'COP' : 'USD';
}
