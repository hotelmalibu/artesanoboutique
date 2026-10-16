// ============================================================
//  cloudinary.js — Firma para subir imagenes DIRECTAMENTE desde el
//  panel al CDN de Cloudinary (el servidor nunca recibe el archivo).
//  Si Cloudinary no esta configurado, el panel acepta URLs de imagen.
// ============================================================
import crypto from 'crypto';
import { existsSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';

export function cloudinaryActivo() {
  return !!(config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret);
}

/** Parametros firmados para una subida directa (validos ~1 hora). */
export function firmaSubida() {
  if (!cloudinaryActivo()) return null;
  const timestamp = Math.round(Date.now() / 1000);
  const folder = config.cloudinary.carpeta;
  const aFirmar = `folder=${folder}&timestamp=${timestamp}${config.cloudinary.apiSecret}`;
  const signature = crypto.createHash('sha1').update(aFirmar).digest('hex');
  return {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    timestamp,
    folder,
    signature,
    url: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/image/upload`,
  };
}

// Variantes WebP de las fotos que viven en el repo (scripts/optimizar-imagenes.py).
const DIR_WEB = join(dirname(fileURLToPath(import.meta.url)), '..', 'tienda', 'publico', 'imagenes', 'web');
const VARIANTES_LOCALES = new Set(existsSync(DIR_WEB) ? readdirSync(DIR_WEB) : []);
const FOTO_LOCAL = /^\/publico\/imagenes\/(productos|artesanos)\/([^/]+)\.(?:jpe?g|png)$/i;

/**
 * URL optimizada para una imagen: WebP/AVIF automatico en Cloudinary, o la
 * variante WebP de 600/1200 px cuando es una foto local del repo. Cualquier
 * otra URL (o una foto local sin variante) se devuelve tal cual.
 */
export function optimizar(url, ancho = 800) {
  const local = FOTO_LOCAL.exec(url || '');
  if (local) {
    const w = ancho <= 640 ? 600 : 1200;
    const nombre = `${local[1]}-${local[2]}-${w}.webp`;
    return VARIANTES_LOCALES.has(nombre) ? `/publico/imagenes/web/${nombre}` : url;
  }
  if (!url || !/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) return url;
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${ancho},c_limit/`);
}
