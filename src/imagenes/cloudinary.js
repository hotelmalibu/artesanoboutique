// ============================================================
//  cloudinary.js — Firma para subir imagenes DIRECTAMENTE desde el
//  panel al CDN de Cloudinary (el servidor nunca recibe el archivo).
//  Si Cloudinary no esta configurado, el panel acepta URLs de imagen.
// ============================================================
import crypto from 'crypto';
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

/** URL optimizada (WebP/AVIF automatico, ancho fijo) para una imagen de Cloudinary. */
export function optimizar(url, ancho = 800) {
  if (!url || !/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) return url;
  return url.replace('/image/upload/', `/image/upload/f_auto,q_auto,w_${ancho},c_limit/`);
}
