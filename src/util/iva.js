// ============================================================
//  iva.js — Reglas de IVA (Colombia) y calculo de totales.
//
//  - Cada producto tiene un tipo de IVA: iva_19 | iva_5 | exento | excluido.
//  - En Colombia el precio se muestra CON IVA incluido (Estatuto del
//    Consumidor); el desglose aparece en carrito, checkout y correo.
//  - Ventas al exterior (regimen 'exportacion'): IVA 0 % sobre la base.
//  - Se calcula por linea y se suman las lineas (no sobre el total) para
//    que no haya diferencias de centavos con la factura.
// ============================================================

export const TASAS = { iva_19: 0.19, iva_5: 0.05, exento: 0, excluido: 0 };

export const NOMBRES_IVA = {
  iva_19: 'IVA 19 %',
  iva_5: 'IVA 5 %',
  exento: 'Exento de IVA',
  excluido: 'Excluido de IVA',
};

export function tasaDe(tipo) {
  return TASAS[tipo] ?? TASAS.iva_19;
}

export function redondear(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/**
 * Separa un precio en base + IVA.
 * @param {number} precio     Precio del producto tal como se guardo.
 * @param {string} tipo       Tipo de IVA del producto.
 * @param {boolean} incluyeIva true si el precio guardado ya trae el IVA.
 * @returns {{base:number, iva:number, total:number, tasa:number}}
 */
export function desglosar(precio, tipo, incluyeIva = true) {
  const tasa = tasaDe(tipo);
  const p = Number(precio) || 0;
  if (incluyeIva) {
    const base = redondear(p / (1 + tasa));
    return { base, iva: redondear(p - base), total: redondear(p), tasa };
  }
  const iva = redondear(p * tasa);
  return { base: redondear(p), iva, total: redondear(p + iva), tasa };
}

/**
 * Calcula una linea del pedido.
 * @param {object} p { precio, tipo, incluyeIva, cantidad, regimen }
 *   regimen: 'nacional' (IVA colombiano) | 'exportacion' (IVA 0 %).
 */
export function calcularLinea({ precio, tipo, incluyeIva = true, cantidad = 1, regimen = 'nacional' }) {
  const n = Math.max(1, parseInt(cantidad, 10) || 1);
  // Exportacion: el precio recibido ya es el precio final sin IVA colombiano
  // (precio USD fijado por la tienda o base COP convertida).
  const d = regimen === 'exportacion' ? { base: redondear(precio), iva: 0, tasa: 0 } : desglosar(precio, tipo, incluyeIva);
  return {
    cantidad: n,
    precioUnitario: d.base,          // sin IVA
    tasaIva: d.tasa,
    ivaUnitario: d.iva,
    subtotal: redondear(d.base * n), // sin IVA
    iva: redondear(d.iva * n),
    total: redondear((d.base + d.iva) * n),
  };
}

/**
 * Suma las lineas y el envio.
 * @param {object} p { lineas:[{subtotal, iva, total}], envio:number, envioTipoIva:string, regimen:string, descuento:number }
 */
export function totalesPedido({ lineas, envio = 0, envioTipoIva = 'iva_19', regimen = 'nacional', descuento = 0 }) {
  const subtotal = redondear(lineas.reduce((s, l) => s + l.subtotal, 0));
  const iva = redondear(lineas.reduce((s, l) => s + l.iva, 0));
  const dEnvio = desglosar(envio, envioTipoIva, true);
  const envioBase = regimen === 'exportacion' ? redondear(envio) : dEnvio.base;
  const envioIva = regimen === 'exportacion' ? 0 : dEnvio.iva;
  const desc = redondear(Math.min(descuento, subtotal));
  return {
    subtotal,
    descuento: desc,
    iva,
    envio: envioBase,
    envioIva,
    total: redondear(subtotal - desc + iva + envioBase + envioIva),
  };
}
