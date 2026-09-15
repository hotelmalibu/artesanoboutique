// Migra el catálogo real de Arte'Sano a producción (Render) usando la API
// del panel admin ya existente — no requiere acceso directo a la base de
// datos ni exponer DATABASE_URL. Reemplaza el catálogo placeholder viejo.
//
// Uso (las credenciales SIEMPRE se pasan por variable de entorno, nunca
// quedan escritas en este archivo):
//   BASE_URL=... ADMIN_USUARIO=... ADMIN_PASSWORD=... node scripts/migrar-catalogo-produccion.mjs
import { CATEGORIAS, INGREDIENTES, ARTESANOS, productos } from '../src/almacen/semilla.datos.js';

const BASE = process.env.BASE_URL;
const USUARIO = process.env.ADMIN_USUARIO;
const CLAVE = process.env.ADMIN_PASSWORD;

if (!BASE || !USUARIO || !CLAVE) {
  console.error('Faltan variables de entorno: BASE_URL, ADMIN_USUARIO y ADMIN_PASSWORD son obligatorias.');
  process.exit(1);
}

let cookie = '';

async function llamar(ruta, opciones = {}) {
  const r = await fetch(BASE + ruta, {
    ...opciones,
    headers: {
      'content-type': 'application/json',
      ...(cookie ? { cookie } : {}),
      ...(opciones.headers || {}),
    },
  });
  const setCookie = r.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const texto = await r.text();
  let json;
  try { json = JSON.parse(texto); } catch { json = { ok: r.ok, texto }; }
  if (!r.ok) throw new Error(`${opciones.method || 'GET'} ${ruta} -> ${r.status}: ${texto.slice(0, 300)}`);
  return json;
}

async function main() {
  console.log(`Conectando a ${BASE} ...`);
  await llamar('/admin/login', { method: 'POST', body: JSON.stringify({ usuario: USUARIO, clave: CLAVE }) });
  if (!cookie) throw new Error('No se obtuvo cookie de sesión (credenciales inválidas?).');
  console.log('Sesión iniciada.');

  const actual = await llamar('/admin/api/catalogo');
  const prodActuales = await llamar('/admin/api/productos');

  console.log(`Eliminando ${prodActuales.productos.length} productos antiguos...`);
  for (const p of prodActuales.productos) {
    await llamar(`/admin/api/productos/${p.id}`, { method: 'DELETE' });
  }

  console.log('Eliminando categorías/ingredientes/artesanos antiguos...');
  for (const c of actual.categorias) await llamar(`/admin/api/categorias/${c.id}`, { method: 'DELETE' });
  for (const i of actual.ingredientes) await llamar(`/admin/api/ingredientes/${i.id}`, { method: 'DELETE' });
  for (const a of actual.artesanos) await llamar(`/admin/api/artesanos/${a.id}`, { method: 'DELETE' });

  console.log('Creando categorías, ingredientes y artesanos reales...');
  const ids = { categorias: {}, ingredientes: {}, artesanos: {} };
  for (const c of CATEGORIAS) ids.categorias[c.slug] = (await llamar('/admin/api/categorias', { method: 'POST', body: JSON.stringify(c) })).registro.id;
  for (const i of INGREDIENTES) ids.ingredientes[i.slug] = (await llamar('/admin/api/ingredientes', { method: 'POST', body: JSON.stringify(i) })).registro.id;
  for (const a of ARTESANOS) ids.artesanos[a.slug] = (await llamar('/admin/api/artesanos', { method: 'POST', body: JSON.stringify(a) })).registro.id;

  console.log('Creando productos reales...');
  let n = 0;
  for (const p of productos(ids)) {
    await llamar('/admin/api/productos', { method: 'POST', body: JSON.stringify(p) });
    n++;
  }
  console.log(`Listo: ${CATEGORIAS.length} categorías, ${INGREDIENTES.length} ingredientes, ${n} productos creados en producción.`);
}

main().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
