// ============================================================
//  plantillas.js — Plantillas HTML de la tienda publica (renderizado en
//  el servidor para SEO). Tokens de marca de Arte'Sano: crema, verde
//  oliva, beige, blush, marron tierra.
// ============================================================
import { config } from '../config.js';
import { escapar } from '../util/texto.js';
import { formatearCOP } from '../util/moneda.js';
import { optimizar } from '../imagenes/cloudinary.js';

// Fuente serif italica de marca (mismo look del logo real: "Playfair Display").
const F_MARCA = `'Playfair Display',Georgia,'Times New Roman',serif`;

// Insignia oficial: ramita de hojas + monograma "A"+"S" en olivo, sobre fondo
// crema — replica el ícono de marca (ver logo compartido por el negocio).
export const LOGO_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true">
  <circle cx="50" cy="50" r="48" fill="#F5EDE0"/>
  <path d="M22 68c1-11 6-20 17-26" fill="none" stroke="#5F6D45" stroke-width="2" stroke-linecap="round"/>
  <g fill="#5F6D45">
    <ellipse cx="25" cy="63" rx="4.6" ry="2.1" transform="rotate(-42 25 63)"/>
    <ellipse cx="29.5" cy="56.5" rx="5.1" ry="2.3" transform="rotate(-34 29.5 56.5)"/>
    <ellipse cx="34" cy="50.5" rx="5.6" ry="2.5" transform="rotate(-26 34 50.5)"/>
    <ellipse cx="38.5" cy="45" rx="6" ry="2.6" transform="rotate(-16 38.5 45)"/>
  </g>
  <text x="33" y="67" font-family="${F_MARCA}" font-style="italic" font-weight="600" font-size="44" fill="#5F6D45">A</text>
  <text x="49" y="73" font-family="${F_MARCA}" font-style="italic" font-weight="600" font-size="33" fill="#5F6D45">S</text>
</svg>`;

// ---------- Generador de helechos/hojas decorativas (para las esquinas del hero) ----------

function trazoHoja(largo, ancho) {
  return `M0,0 Q${(largo * 0.28).toFixed(1)},${(-ancho).toFixed(1)} ${largo.toFixed(1)},0 Q${(largo * 0.28).toFixed(1)},${ancho.toFixed(1)} 0,0 Z`;
}

/** Rama de helecho (espina central curva + folíolos alternos), estilo fishbone. */
function generarHelecho({ ancho = 240, alto = 280, nHojas = 11, color, curva = 0.45, grosor = 0.32, grosorTallo = 2.4 }) {
  const x0 = 10, y0 = alto - 10, x1 = ancho - 10, y1 = 10;
  const cx = x0 + (x1 - x0) * curva, cy = y1 + (y0 - y1) * curva;
  const N = 60;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, mt = 1 - t;
    pts.push([mt * mt * x0 + 2 * mt * t * cx + t * t * x1, mt * mt * y0 + 2 * mt * t * cy + t * t * y1]);
  }
  let out = `<path d="M${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' L')}" stroke="${color}" stroke-width="${grosorTallo}" fill="none" stroke-linecap="round"/>`;
  const paso = Math.max(2, Math.floor(N / nHojas));
  for (let i = paso; i < N - 2; i += paso) {
    const [x, y] = pts[i];
    const [xn, yn] = pts[Math.min(i + 2, N)];
    const angDeg = (Math.atan2(yn - y, xn - x) * 180) / Math.PI;
    const escala = 0.42 + 0.6 * (1 - i / N);
    const largo = 48 * escala, anchoH = largo * grosor;
    for (const lado of [1, -1]) {
      const rot = angDeg + lado * 58;
      out += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) rotate(${rot.toFixed(1)})"><path d="${trazoHoja(largo, anchoH)}" fill="${color}"/></g>`;
    }
  }
  return `<svg viewBox="0 0 ${ancho} ${alto}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${out}</svg>`;
}

/** Racimo de hojas anchas (tipo banano) con vena central — esquina inferior izquierda del hero. */
function generarHojasAnchas(color) {
  const hojas = [
    { largo: 210, ancho: 92, x: 6, y: 236, rot: -14 },
    { largo: 182, ancho: 78, x: 2, y: 176, rot: 10 },
    { largo: 152, ancho: 64, x: 16, y: 112, rot: 34 },
  ];
  const grupos = hojas
    .map((h) => `<g transform="translate(${h.x},${h.y}) rotate(${h.rot})"><path d="${trazoHoja(h.largo, h.ancho)}" fill="${color}"/><path d="M6,0 L${h.largo - 6},0" stroke="rgba(0,0,0,.16)" stroke-width="1.3"/></g>`)
    .join('');
  return `<svg viewBox="0 0 240 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${grupos}</svg>`;
}

const HELECHO_FANTASMA = generarHelecho({ ancho: 260, alto: 220, nHojas: 9, color: '#E4DCC8', curva: 0.4, grosorTallo: 2 });
const HELECHO_OLIVA = generarHelecho({ ancho: 230, alto: 280, nHojas: 11, color: '#7C8B5D', curva: 0.42 });
const HELECHO_TERRACOTA = generarHelecho({ ancho: 210, alto: 250, nHojas: 10, color: '#BE8B66', curva: 0.46 });
const HOJAS_BANANO = generarHojasAnchas('#41502E');

/** Ilustración de las cuatro esquinas del hero, a juego con el banner de marca. */
export function decoracionHero() {
  return `<div class="hero-hojas" aria-hidden="true">
    <span class="hoja hoja-fantasma">${HELECHO_FANTASMA}</span>
    <span class="hoja hoja-banano">${HOJAS_BANANO}</span>
    <span class="hoja hoja-oliva">${HELECHO_OLIVA}</span>
    <span class="hoja hoja-terracota">${HELECHO_TERRACOTA}</span>
  </div>`;
}

/** Ramita pequeña usada como separador entre "Arte" y "Sano" en el logotipo. */
function miniHoja() {
  return `<g stroke="#7C8B5D" stroke-width="2.4" stroke-linecap="round" fill="#7C8B5D">
    <path d="M19 88C19 58 19 28 21 4" fill="none"/>
    <ellipse cx="17" cy="66" rx="10" ry="4" transform="rotate(-55 17 66)"/>
    <ellipse cx="23" cy="46" rx="10" ry="4" transform="rotate(55 23 46)"/>
    <ellipse cx="17" cy="27" rx="9" ry="3.6" transform="rotate(-50 17 27)"/>
    <ellipse cx="22" cy="11" rx="8" ry="3.2" transform="rotate(48 22 11)"/>
  </g>`;
}

/** Logotipo horizontal completo "Arte 🌿 Sano · BOUTIQUE" para el hero y el pie. */
export const WORDMARK_SVG = `<svg viewBox="0 0 520 175" class="wordmark" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Arte Sano Boutique">
  <text x="0" y="108" font-family="${F_MARCA}" font-style="italic" font-weight="600" font-size="92" fill="#5F6D45">Arte</text>
  <g transform="translate(230,18) scale(0.62)">${miniHoja()}</g>
  <text x="272" y="108" font-family="${F_MARCA}" font-style="italic" font-weight="600" font-size="92" fill="#5F6D45">Sano</text>
  <text x="260" y="155" font-family="-apple-system,'Segoe UI',Roboto,sans-serif" font-size="18" letter-spacing="9" fill="#7C8B5D" text-anchor="middle">BOUTIQUE</text>
</svg>`;

export function urlWhatsapp(texto = '') {
  const n = config.tienda.whatsapp;
  const base = n ? `https://wa.me/${n}` : '#contacto';
  return texto && n ? `${base}?text=${encodeURIComponent(texto)}` : base;
}

/** Formatea un número de WhatsApp colombiano (573001234567) como "+57 300 123 4567". */
function formatearTelefono(numero) {
  const d = String(numero || '').replace(/\D/g, '');
  if (d.startsWith('57') && d.length === 12) return `+57 ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8)}`;
  return d ? '+' + d : '';
}

/**
 * Layout general.
 * @param {object} p { titulo, descripcion, contenido, ruta, imagen, jsonLd, canonical }
 */
export function layout({ titulo, descripcion = '', contenido, ruta = '/', imagen = '', jsonLd = null, cuerpoClase = '' }) {
  const t = titulo ? `${titulo} · ${config.tienda.nombre}` : `${config.tienda.nombre} · Cosmética artesanal ancestral Zenú`;
  const canonical = config.publicUrl + ruta;
  const nav = [
    ['/tienda', 'Tienda'],
    ['/ingredientes', 'Ingredientes'],
    ['/artesanos', 'Artesanos'],
    ['/nosotros', 'Nuestra historia'],
  ];
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapar(t)}</title>
<meta name="description" content="${escapar(descripcion)}" />
<link rel="canonical" href="${escapar(canonical)}" />
<meta property="og:title" content="${escapar(t)}" />
<meta property="og:description" content="${escapar(descripcion)}" />
<meta property="og:url" content="${escapar(canonical)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escapar(config.tienda.nombre)}" />
${imagen ? `<meta property="og:image" content="${escapar(imagen)}" />` : ''}
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(LOGO_SVG)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600;1,700&display=swap" />
<link rel="stylesheet" href="/publico/estilos.css" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body class="${cuerpoClase}">
<header class="cabecera">
  <div class="contenedor cabecera-int">
    <a class="marca" href="/">${LOGO_SVG}<span class="marca-texto"><span class="marca-nombre">Arte<em>'</em>Sano</span><span class="marca-sub">Boutique</span></span></a>
    <nav class="nav" id="nav">${nav.map(([h, n]) => `<a href="${h}" ${ruta.startsWith(h) ? 'class="activo"' : ''}>${n}</a>`).join('')}</nav>
    <div class="acciones">
      <a class="btn-admin" href="/admin" aria-label="Acceder al panel administrativo" title="Acceso administrador">${ICONO_CANDADO}<span>Admin</span></a>
      <a class="btn-icono" href="${urlWhatsapp('Hola Arte\'Sano, quiero información sobre sus productos')}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICONO_WA}</a>
      <a class="btn-icono carrito-btn" href="/carrito" aria-label="Carrito">${ICONO_CARRITO}<span class="contador" id="carrito-contador">0</span></a>
      <button class="hamburguesa" id="hamburguesa" aria-label="Menú">☰</button>
    </div>
  </div>
</header>
<main>${contenido}</main>
<footer class="pie" id="contacto">
  <div class="contenedor pie-int">
    <div>
      <div class="marca-pie">${LOGO_SVG}<span class="marca-texto"><span class="marca-nombre">${escapar(config.tienda.nombre)}</span><span class="marca-sub">Boutique</span></span></div>
      <p>Cosmética artesanal con plantas medicinales y saberes ancestrales del pueblo Zenú. Hecha a mano en Córdoba y Sucre, Colombia, para el mundo.</p>
      <p><a href="https://www.instagram.com/artesanoboutique_" target="_blank" rel="noopener">Instagram</a> · <a href="https://www.facebook.com/artesanoboutique1" target="_blank" rel="noopener">Facebook</a> · <a href="${urlWhatsapp()}" target="_blank" rel="noopener">WhatsApp</a></p>
      <p class="contacto-info">
        ${config.tienda.whatsapp ? `WhatsApp: <a href="${urlWhatsapp()}" target="_blank" rel="noopener">${formatearTelefono(config.tienda.whatsapp)}</a><br/>` : ''}
        Correo: <a href="mailto:${escapar(config.correo.contacto)}">${escapar(config.correo.contacto)}</a>
      </p>
    </div>
    <div>
      <h4>Tienda</h4>
      <a href="/tienda">Todos los productos</a><a href="/ingredientes">Ingredientes ancestrales</a><a href="/artesanos">Nuestros artesanos</a><a href="/nosotros">Nuestra historia</a>
    </div>
    <div>
      <h4>Ayuda</h4>
      <a href="/politicas#envios">Envíos a Colombia y al mundo</a><a href="/politicas#devoluciones">Cambios y devoluciones</a><a href="/politicas#programados">Pedidos programados</a><a href="/privacidad">Privacidad y datos</a><a href="/politicas#terminos">Términos y condiciones</a>
    </div>
    <div>
      <h4>Aliados</h4>
      <p class="aliados">Programa Zaca · Ministerio de Industria, Comercio y Turismo · Artesanías de Colombia</p>
      <p class="mini">${escapar(config.tienda.nombre)}${config.tienda.nit ? ' · NIT ' + escapar(config.tienda.nit) : ''} · ${escapar(config.tienda.direccion)}<br/>Pagos seguros con RAPYD · Precios en Colombia incluyen IVA.</p>
    </div>
  </div>
</footer>
<a class="wa-flotante" href="${urlWhatsapp('Hola Arte\'Sano, quiero hacer un pedido')}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${ICONO_WA}<span>¿Te ayudo?</span></a>
<div class="toast" id="toast"></div>
<script src="/publico/tienda.js" defer></script>
</body>
</html>`;
}

const ICONO_WA = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a11.9 11.9 0 0 0 5.7 1.5c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 0 1 2.1 12C2.1 6.5 6.5 2 12 2c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.5-4.5 9.9-9.9 9.9zm5.4-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5L9 6.9c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>`;
const ICONO_CARRITO = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6h15l-1.5 8h-12z"/><path d="M6 6L5 3H2"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>`;
const ICONO_CANDADO = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;

// ---------- Componentes ----------

export function imagenProducto(p, ancho = 600) {
  const url = p.imagenPrincipal || p.imagenes?.[0]?.url;
  if (url) return `<img src="${escapar(optimizar(url, ancho))}" alt="${escapar(p.imagenes?.[0]?.alt || p.nombre)}" loading="lazy" />`;
  return `<div class="sin-imagen">${LOGO_SVG}<span>${escapar(p.protagonista?.nombre || p.nombre)}</span></div>`;
}

export function tarjetaProducto(p) {
  const v = p.variantePorDefecto;
  const etiquetas = [];
  if (p.agotado) etiquetas.push('<span class="etiqueta agotado">Agotado</span>');
  else if (p.destacado) etiquetas.push('<span class="etiqueta">Favorito</span>');
  if (p.precioComparacionCop && p.precioComparacionCop > p.precioDesde) etiquetas.push('<span class="etiqueta oferta">Oferta</span>');
  return `<article class="tarjeta-producto">
    <a href="/producto/${escapar(p.slug)}" class="tarjeta-img">${imagenProducto(p, 600)}<div class="etiquetas">${etiquetas.join('')}</div></a>
    <div class="tarjeta-cuerpo">
      <div class="tarjeta-linea">${escapar(p.categoria?.nombre || '')}${p.protagonista ? ' · ' + escapar(p.protagonista.nombre) : ''}</div>
      <h3><a href="/producto/${escapar(p.slug)}">${escapar(p.nombre)}</a></h3>
      <p>${escapar(p.descripcionCorta)}</p>
      <div class="tarjeta-pie">
        <div class="precio">${p.precioComparacionCop && p.precioComparacionCop > p.precioDesde ? `<s>${formatearCOP(p.precioComparacionCop)}</s> ` : ''}${formatearCOP(p.precioDesde)}${p.variantes.length > 1 ? '<small> desde</small>' : ''}</div>
        ${p.agotado ? '<button class="btn secundario" disabled>Agotado</button>' : `<button class="btn agregar" data-sku="${escapar(v.sku)}" data-nombre="${escapar(p.nombre)}" data-variante="${escapar(v.nombre)}" data-precio="${v.precioCop}" data-imagen="${escapar(p.imagenPrincipal || '')}" data-slug="${escapar(p.slug)}">Agregar</button>`}
      </div>
    </div>
  </article>`;
}

export function migas(items) {
  return `<nav class="migas" aria-label="Ruta"><a href="/">Inicio</a>${items.map(([h, n]) => (h ? ` › <a href="${h}">${escapar(n)}</a>` : ` › <span>${escapar(n)}</span>`)).join('')}</nav>`;
}

export function seccionTitulo(sobre, titulo, texto = '', enlace = null) {
  return `<div class="seccion-titulo"><div><span class="sobre">${escapar(sobre)}</span><h2>${escapar(titulo)}</h2>${texto ? `<p>${escapar(texto)}</p>` : ''}</div>${enlace ? `<a class="enlace" href="${enlace[0]}">${escapar(enlace[1])} →</a>` : ''}</div>`;
}
