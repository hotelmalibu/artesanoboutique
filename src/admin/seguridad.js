// ============================================================
//  seguridad.js — Protecciones del inicio de sesion del panel.
//   1) Freno a fuerza bruta por IP.
//   2) Segundo factor (2FA) opcional con codigos TOTP (Google Authenticator).
//   3) Bitacora de intentos.
// ============================================================
import crypto from 'crypto';
import { config } from '../config.js';

const MAX_FALLOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const BLOQUEO_MS = 15 * 60 * 1000;
const ESPERA_FALLO_MS = 1500;

const porIp = new Map();
const bitacora = [];

export function ipDe(req) {
  const xf = (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xf || req.socket?.remoteAddress || 'desconocida';
}

function estadoIp(ip) {
  let e = porIp.get(ip);
  if (!e) { e = { fallos: [], bloqueadoHasta: 0 }; porIp.set(ip, e); }
  const corte = Date.now() - VENTANA_MS;
  e.fallos = e.fallos.filter((t) => t > corte);
  return e;
}

export function bloqueoRestante(ip) {
  const e = estadoIp(ip);
  return e.bloqueadoHasta > Date.now() ? Math.ceil((e.bloqueadoHasta - Date.now()) / 1000) : 0;
}

export function registrarFallo(ip, usuario, motivo) {
  const e = estadoIp(ip);
  e.fallos.push(Date.now());
  if (e.fallos.length >= MAX_FALLOS) {
    e.bloqueadoHasta = Date.now() + BLOQUEO_MS;
    e.fallos = [];
    console.warn(`[seguridad] IP ${ip} bloqueada ${BLOQUEO_MS / 60000} min por intentos fallidos (usuario "${usuario}").`);
  }
  anotar({ ip, usuario, ok: false, motivo });
  return new Promise((r) => setTimeout(r, ESPERA_FALLO_MS));
}

export function registrarExito(ip, usuario) {
  porIp.delete(ip);
  anotar({ ip, usuario, ok: true, motivo: '' });
}

function anotar(dato) {
  bitacora.unshift({ ts: Date.now(), ...dato });
  if (bitacora.length > 50) bitacora.length = 50;
}

export function ultimosIntentos() {
  return bitacora.slice(0, 30);
}

export function igualSeguro(a, b) {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  if (x.length !== y.length) {
    crypto.timingSafeEqual(x, x);
    return false;
  }
  return crypto.timingSafeEqual(x, y);
}

// ---------- TOTP ----------
const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Decodificar(texto) {
  const limpio = String(texto || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const ch of limpio) bits += B32.indexOf(ch).toString(2).padStart(5, '0');
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

export function base32Codificar(buf) {
  let bits = '';
  for (const b of buf) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += B32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}

export function codigoTotp(secretoB32, ts = Date.now(), paso = 30) {
  const contador = Math.floor(ts / 1000 / paso);
  const msg = Buffer.alloc(8);
  msg.writeUInt32BE(Math.floor(contador / 0x100000000), 0);
  msg.writeUInt32BE(contador >>> 0, 4);
  const h = crypto.createHmac('sha1', base32Decodificar(secretoB32)).update(msg).digest();
  const off = h[h.length - 1] & 0x0f;
  const num = ((h[off] & 0x7f) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
  return String(num % 1_000_000).padStart(6, '0');
}

export function verificarTotp(secretoB32, codigo) {
  const c = String(codigo || '').replace(/\D/g, '');
  if (c.length !== 6) return false;
  const ahora = Date.now();
  for (const d of [0, -1, 1]) if (igualSeguro(codigoTotp(secretoB32, ahora + d * 30000), c)) return true;
  return false;
}

export function totpActivo() {
  return !!config.admin.totpSecret;
}

export function nuevoSecretoTotp(usuario = 'admin') {
  const secreto = base32Codificar(crypto.randomBytes(20));
  const cuenta = encodeURIComponent(`ArteSano:${usuario}`);
  const uri = `otpauth://totp/${cuenta}?secret=${secreto}&issuer=ArteSano&algorithm=SHA1&digits=6&period=30`;
  return { secreto, uri };
}
