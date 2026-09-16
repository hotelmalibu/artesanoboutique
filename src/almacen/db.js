// ============================================================
//  db.js — Persistencia en PostgreSQL (Render / Neon / Supabase).
//
//  Diseno "write-through" (igual que MALIBUBOT): los almacenes en memoria
//  son la capa en vivo (rapida, sincrona); cada escritura se replica aqui
//  en segundo plano. Al arrancar, se hidrata la memoria desde la base.
//
//  Los registros del catalogo (productos, categorias, ingredientes,
//  artesanos) y los pedidos se guardan como JSON completo; las columnas
//  sueltas solo sirven para consultas/reportes SQL.
//
//  Si no hay DATABASE_URL, todo queda inactivo y la tienda funciona en
//  memoria con los datos de ejemplo (se borran al reiniciar).
// ============================================================
import pg from 'pg';
import { config } from '../config.js';

const { Pool } = pg;

/** @type {import('pg').Pool | null} */
let pool = null;

export function dbActivo() {
  return !!pool;
}

/** Conecta y crea las tablas si no existen. Devuelve true si quedo activa. */
export async function iniciarDB() {
  if (!config.db.url) {
    console.warn('[db] Sin DATABASE_URL: los datos viven en memoria y se borran al reiniciar.');
    return false;
  }
  try {
    pool = new Pool({
      connectionString: config.db.url,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS catalogo (
        tabla       TEXT NOT NULL,
        id          INTEGER NOT NULL,
        slug        TEXT,
        estado      TEXT,
        datos       TEXT NOT NULL,
        actualizado BIGINT,
        PRIMARY KEY (tabla, id)
      );
      CREATE INDEX IF NOT EXISTS idx_catalogo_slug ON catalogo (tabla, slug);
      CREATE TABLE IF NOT EXISTS pedidos (
        id          INTEGER PRIMARY KEY,
        numero      TEXT UNIQUE,
        estado      TEXT,
        canal       TEXT,
        moneda      TEXT,
        total       NUMERIC(14,2),
        email       TEXT,
        telefono    TEXT,
        pais        TEXT,
        programado  TEXT,
        datos       TEXT NOT NULL,
        creado      BIGINT,
        actualizado BIGINT
      );
      CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos (estado, creado DESC);
      CREATE TABLE IF NOT EXISTS ajustes (
        clave       TEXT PRIMARY KEY,
        valor       TEXT,
        actualizado BIGINT
      );
      CREATE TABLE IF NOT EXISTS conversaciones (
        wa_id            TEXT PRIMARY KEY,
        nombre           TEXT,
        modo             TEXT DEFAULT 'bot',
        canal            TEXT DEFAULT '',
        datos            TEXT,
        creado           BIGINT,
        ultima_actividad BIGINT
      );
      ALTER TABLE conversaciones ADD COLUMN IF NOT EXISTS canal TEXT DEFAULT '';
      CREATE TABLE IF NOT EXISTS mensajes (
        id        BIGSERIAL PRIMARY KEY,
        wa_id     TEXT,
        direccion TEXT,
        autor     TEXT,
        tipo      TEXT,
        texto     TEXT,
        ts        BIGINT
      );
      CREATE INDEX IF NOT EXISTS idx_mensajes_wa_ts ON mensajes (wa_id, ts);
    `);
    console.log('[db] Conectada a PostgreSQL y tablas listas. ✅');
    return true;
  } catch (err) {
    console.error('[db] No se pudo conectar a PostgreSQL:', err.message);
    pool = null;
    return false;
  }
}

// ---------- Catalogo (productos, categorias, ingredientes, artesanos) ----------

export async function dbGuardarRegistro(tabla, obj) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO catalogo (tabla, id, slug, estado, datos, actualizado)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (tabla, id) DO UPDATE SET
       slug = EXCLUDED.slug, estado = EXCLUDED.estado,
       datos = EXCLUDED.datos, actualizado = EXCLUDED.actualizado`,
    [tabla, obj.id, obj.slug || null, obj.estado || null, JSON.stringify(obj), obj.actualizado || Date.now()]
  );
}

export async function dbEliminarRegistro(tabla, id) {
  if (!pool) return;
  await pool.query('DELETE FROM catalogo WHERE tabla = $1 AND id = $2', [tabla, id]);
}

/** @returns {Promise<Array<{tabla:string, datos:object}>>} */
export async function dbCargarCatalogo() {
  if (!pool) return [];
  const r = await pool.query('SELECT tabla, datos FROM catalogo ORDER BY id ASC');
  return r.rows.map((f) => ({ tabla: f.tabla, datos: JSON.parse(f.datos) }));
}

// ---------- Pedidos ----------

export async function dbGuardarPedido(p) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO pedidos (id, numero, estado, canal, moneda, total, email, telefono, pais, programado, datos, creado, actualizado)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT (id) DO UPDATE SET
       estado = EXCLUDED.estado, total = EXCLUDED.total, programado = EXCLUDED.programado,
       datos = EXCLUDED.datos, actualizado = EXCLUDED.actualizado`,
    [
      p.id, p.numero, p.estado, p.canal || 'web', p.moneda, p.totales?.total ?? 0,
      p.cliente?.email || '', p.cliente?.telefono || '', p.direccion?.pais || '',
      p.programadoPara || null, JSON.stringify(p), p.creado, Date.now(),
    ]
  );
}

export async function dbCargarPedidos() {
  if (!pool) return [];
  const r = await pool.query('SELECT datos FROM pedidos ORDER BY id ASC');
  return r.rows.map((f) => JSON.parse(f.datos));
}

// ---------- Ajustes ----------

export async function dbGuardarAjuste(clave, valor) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO ajustes (clave, valor, actualizado) VALUES ($1,$2,$3)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado = EXCLUDED.actualizado`,
    [clave, JSON.stringify(valor), Date.now()]
  );
}

export async function dbCargarAjustes() {
  if (!pool) return [];
  const r = await pool.query('SELECT clave, valor FROM ajustes');
  return r.rows.map((f) => ({ clave: f.clave, valor: JSON.parse(f.valor) }));
}

// ---------- WhatsApp ----------

export async function dbGuardarConversacion(c) {
  if (!pool) return;
  await pool.query(
    `INSERT INTO conversaciones (wa_id, nombre, modo, canal, datos, creado, ultima_actividad)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (wa_id) DO UPDATE SET
       nombre = EXCLUDED.nombre, modo = EXCLUDED.modo, canal = EXCLUDED.canal, datos = EXCLUDED.datos,
       ultima_actividad = EXCLUDED.ultima_actividad`,
    [c.waId, c.nombre || '', c.modo || 'bot', c.canal || '', JSON.stringify(c.estado || {}), c.creado, c.ultimaActividad]
  );
}

export async function dbGuardarMensaje(waId, m) {
  if (!pool) return;
  await pool.query(
    'INSERT INTO mensajes (wa_id, direccion, autor, tipo, texto, ts) VALUES ($1,$2,$3,$4,$5,$6)',
    [waId, m.direccion, m.autor, m.tipo || 'text', m.texto || '', m.ts]
  );
}

export async function dbCargarConversaciones(dias = 120) {
  if (!pool) return null;
  const desde = Date.now() - dias * 24 * 60 * 60 * 1000;
  const [c, m] = await Promise.all([
    pool.query('SELECT * FROM conversaciones'),
    pool.query('SELECT wa_id, direccion, autor, tipo, texto, ts FROM mensajes WHERE ts >= $1 ORDER BY ts ASC', [desde]),
  ]);
  return { convRows: c.rows, msgRows: m.rows };
}

/** Diagnostico rapido: cuenta filas por tabla. */
export async function dbDiagnostico() {
  if (!pool) return { activo: false };
  try {
    const [c, p, m] = await Promise.all([
      pool.query('SELECT tabla, COUNT(*)::int AS n FROM catalogo GROUP BY tabla'),
      pool.query('SELECT COUNT(*)::int AS n FROM pedidos'),
      pool.query('SELECT COUNT(*)::int AS n FROM mensajes'),
    ]);
    return {
      activo: true,
      catalogo: Object.fromEntries(c.rows.map((f) => [f.tabla, f.n])),
      pedidos: p.rows[0].n,
      mensajes: m.rows[0].n,
    };
  } catch (err) {
    return { activo: true, error: err.message };
  }
}
