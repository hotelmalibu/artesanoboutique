// ============================================================
//  firma.js — Verifica que el webhook venga realmente de Meta.
//  Meta firma el cuerpo con el App Secret (HMAC SHA-256) y lo manda en
//  la cabecera "X-Hub-Signature-256: sha256=<hash>".
// ============================================================
import crypto from 'crypto';
import { config } from '../config.js';

export function verificarFirma(req) {
  const firmaRecibida = req.get('X-Hub-Signature-256');
  if (!firmaRecibida || !req.rawBody) return false;
  const firmaEsperada = 'sha256=' + crypto.createHmac('sha256', config.whatsapp.appSecret || '').update(req.rawBody).digest('hex');
  const a = Buffer.from(firmaRecibida);
  const b = Buffer.from(firmaEsperada);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
