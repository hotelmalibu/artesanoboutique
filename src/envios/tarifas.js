// ============================================================
//  tarifas.js — Cotizacion de envio por zona (tabla configurable en
//  ajustes). Fase posterior: tarifas en vivo por API de transportadora.
//
//  Colombia   -> COP: ciudades principales / resto del pais; envio gratis
//                desde ENVIO_GRATIS_DESDE.
//  Exterior   -> USD por zona (America / Europa / Resto del mundo).
// ============================================================
import { config } from '../config.js';
import { ajuste } from '../almacen/ajustes.js';
import { slugificar } from '../util/texto.js';
import { copAUsd } from '../util/moneda.js';

/**
 * @param {object} p { pais (ISO2), ciudad, subtotalCop (para envio gratis), moneda }
 * @returns {{ zona, transportadora, costo, moneda, dias, gratis, tipoIva }}
 */
export function cotizarEnvio({ pais = 'CO', ciudad = '', subtotalCop = 0, moneda = 'COP' }) {
  const env = ajuste('envio');
  const iso = String(pais || 'CO').toUpperCase();

  if (iso === 'CO') {
    const principal = env.ciudadesPrincipales.includes(slugificar(ciudad));
    let costoCop = principal ? env.tarifaPrincipalCop : env.tarifaRestoCop;
    const gratis = config.tienda.envioGratisDesde > 0 && subtotalCop >= config.tienda.envioGratisDesde;
    if (gratis) costoCop = 0;
    return {
      zona: principal ? 'Colombia · ciudad principal' : 'Colombia · resto del país',
      transportadora: env.transportadoraNacional,
      costo: moneda === 'USD' ? copAUsd(costoCop) : costoCop,
      moneda,
      dias: principal ? env.diasPrincipal : env.diasResto,
      gratis,
      tipoIva: env.ivaEnvio,
      regimen: 'nacional',
    };
  }

  const zona = env.zonas.find((z) => z.paises.includes(iso)) || env.zonas[env.zonas.length - 1];
  const costoUsd = zona.tarifaUsd;
  return {
    zona: `Internacional · ${zona.nombre}`,
    transportadora: env.transportadoraInternacional,
    costo: moneda === 'USD' ? costoUsd : Math.round(costoUsd * config.tienda.copPorUsd),
    moneda,
    dias: zona.dias,
    gratis: false,
    tipoIva: 'exento',
    regimen: 'exportacion',
    aviso: 'Los impuestos y aranceles de importación en el país de destino (si aplican) corren por cuenta del comprador.',
  };
}

export const PAISES = [
  ['CO', 'Colombia'], ['US', 'Estados Unidos'], ['CA', 'Canadá'], ['MX', 'México'], ['ES', 'España'], ['FR', 'Francia'],
  ['DE', 'Alemania'], ['IT', 'Italia'], ['PT', 'Portugal'], ['GB', 'Reino Unido'], ['NL', 'Países Bajos'], ['CH', 'Suiza'],
  ['PA', 'Panamá'], ['CR', 'Costa Rica'], ['EC', 'Ecuador'], ['PE', 'Perú'], ['CL', 'Chile'], ['AR', 'Argentina'],
  ['BR', 'Brasil'], ['UY', 'Uruguay'], ['DO', 'República Dominicana'], ['PR', 'Puerto Rico'], ['AU', 'Australia'],
  ['JP', 'Japón'], ['KR', 'Corea del Sur'], ['AE', 'Emiratos Árabes Unidos'], ['OT', 'Otro país'],
];
