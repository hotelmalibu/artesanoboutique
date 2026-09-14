// ============================================================
//  sesion.js — Autenticacion del panel por FORMULARIO (cookie firmada).
//  Sesion "stateless": la cookie lleva un token HMAC con el usuario y su
//  vencimiento; sigue valida aunque el servicio se redespliegue. La firma
//  depende de la contrasena: cambiar ADMIN_PASSWORD cierra todas las sesiones.
// ============================================================
import crypto from 'crypto';
import { config } from '../config.js';
import { igualSeguro } from './seguridad.js';

const COOKIE = 'artesano_ses';
const DURACION_MS = 12 * 60 * 60 * 1000;

function secreto() {
  const base = config.admin.secretoSesion || 'artesano';
  return crypto.createHash('sha256').update(base + '|' + (config.admin.password || '')).digest();
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function firmar(dato) {
  return b64url(crypto.createHmac('sha256', secreto()).update(dato).digest());
}

export function validarCredenciales(usuario, clave) {
  if (!config.admin.password || !usuario) return false;
  const claveOk = igualSeguro(clave, config.admin.password);
  const usuarioOk = !config.admin.usuario || igualSeguro(usuario, config.admin.usuario);
  return claveOk && usuarioOk;
}

export function crearToken(usuario) {
  const payload = b64url(JSON.stringify({ u: usuario, iat: Date.now(), exp: Date.now() + DURACION_MS, n: b64url(crypto.randomBytes(8)) }));
  return `${payload}.${firmar(payload)}`;
}

function verificarToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!igualSeguro(sig, firmar(payload))) return null;
  try {
    const datos = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    if (!datos.exp || datos.exp < Date.now()) return null;
    return datos;
  } catch {
    return null;
  }
}

function leerCookies(req) {
  const bruto = req.headers.cookie || '';
  const out = {};
  for (const parte of bruto.split(';')) {
    const i = parte.indexOf('=');
    if (i > -1) out[parte.slice(0, i).trim()] = decodeURIComponent(parte.slice(i + 1).trim());
  }
  return out;
}

function esHttps(req) {
  return (req.headers['x-forwarded-proto'] || req.protocol) === 'https';
}

export function ponerCookieSesion(req, res, token) {
  const attrs = [`${COOKIE}=${token}`, 'Path=/admin', 'HttpOnly', 'SameSite=Strict', `Max-Age=${Math.floor(DURACION_MS / 1000)}`];
  if (esHttps(req)) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

export function borrarCookieSesion(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=0`);
}

export function haySesion(req) {
  return !!verificarToken(leerCookies(req)[COOKIE]);
}

export function sesionActual(req) {
  return verificarToken(leerCookies(req)[COOKIE]);
}

export function requiereSesion(req, res, next) {
  if (!config.admin.password) return res.status(503).send('Panel deshabilitado. Configura ADMIN_PASSWORD en el entorno.');
  if (haySesion(req)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ ok: false, error: 'Sesión requerida.' });
  return res.redirect('/admin/login');
}

export function cabecerasSeguridad(_req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}
