// ============================================================
//  plantillas.js — Plantillas HTML de la tienda publica (renderizado en
//  el servidor para SEO). Diseño botánico-editorial: marfil, verde
//  bosque, salvia, terracota y blush (ver publico/estilos.css).
// ============================================================
import { config } from '../config.js';
import { escapar } from '../util/texto.js';
import { formatearCOP } from '../util/moneda.js';
import { optimizar } from '../imagenes/cloudinary.js';

// Cambia en cada arranque: fuerza al navegador a bajar el CSS/JS nuevos tras un despliegue.
const VERSION_ACTIVOS = Date.now().toString(36);

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

// ---------- Iconos ----------
const S = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
export const ICONO_WA = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M20.5 3.5A11.9 11.9 0 0 0 12 0C5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.3-1.7a11.9 11.9 0 0 0 5.7 1.5c6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 0 1 2.1 12C2.1 6.5 6.5 2 12 2c2.6 0 5.1 1 7 2.9a9.8 9.8 0 0 1 2.9 7c0 5.5-4.5 9.9-9.9 9.9zm5.4-7.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1l-.9 1.2c-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5L9 6.9c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4z"/></svg>`;
export const ICONO_FLECHA = `<svg width="18" height="18" viewBox="0 0 24 24" ${S}><path d="M4 12h15M13 6l6 6-6 6"/></svg>`;
const ICONO_BUSCAR = `<svg width="22" height="22" viewBox="0 0 24 24" ${S}><circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/></svg>`;
const ICONO_BOLSA = `<svg width="20" height="20" viewBox="0 0 24 24" ${S}><path d="M5 8h14l-1 12H6z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>`;
const ICONO_MENU = `<svg width="26" height="26" viewBox="0 0 24 24" ${S} stroke-width="1.8"><path d="M4 8h16M4 16h16"/></svg>`;
const ICONO_CERRAR = `<svg width="24" height="24" viewBox="0 0 24 24" ${S} stroke-width="1.8"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
export const ICONO_MAS = `<svg width="20" height="20" viewBox="0 0 24 24" ${S} stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>`;
export const ICONO_HOJA = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14 0 9-5 14-14 14z"/><path d="M5 19c3-4 6-7 10-9"/></svg>`;

const MARCA = `<span class="marca-nombre">Arte'Sano</span><span class="marca-sub">Boutique</span>`;

const NAV = [
  ['/tienda', 'Tienda'],
  ['/ingredientes', 'Ingredientes'],
  ['/artesanos', 'Artesanos'],
  ['/nosotros', 'Nuestra historia'],
];

/**
 * Layout general.
 * @param {object} p { titulo, descripcion, contenido, ruta, imagen, jsonLd, cuerpoClase }
 */
export function layout({ titulo, descripcion = '', contenido, ruta = '/', imagen = '', jsonLd = null, cuerpoClase = '' }) {
  const t = titulo ? `${titulo} · ${config.tienda.nombre}` : `${config.tienda.nombre} · Cosmética artesanal de origen Zenú`;
  const canonical = config.publicUrl + ruta;
  const gratis = config.tienda.envioGratisDesde;
  const anuncio = [
    gratis > 0 ? `Envío gratis en Colombia desde ${formatearCOP(gratis)}` : 'Envíos a Colombia y al mundo',
    'Programa la fecha de entrega',
    'Pago seguro con Wompi',
  ];
  const enlaces = NAV.map(([h, n]) => `<a href="${h}" ${ruta.startsWith(h) ? 'class="activo" aria-current="page"' : ''}>${n}</a>`).join('');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="theme-color" content="#2F3B27" />
<title>${escapar(t)}</title>
<meta name="description" content="${escapar(descripcion)}" />
<link rel="canonical" href="${escapar(canonical)}" />
<meta property="og:title" content="${escapar(t)}" />
<meta property="og:description" content="${escapar(descripcion)}" />
<meta property="og:url" content="${escapar(canonical)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${escapar(config.tienda.nombre)}" />
${imagen ? `<meta property="og:image" content="${escapar(imagen.startsWith('/') ? config.publicUrl + imagen : imagen)}" />` : ''}
<link rel="icon" href="/publico/favicon.svg" type="image/svg+xml" />
<link rel="alternate icon" href="/publico/favicon.svg" />
<link rel="apple-touch-icon" href="/publico/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=DM+Sans:wght@400;500;700&family=Playfair+Display:ital,wght@1,600&display=swap" />
<link rel="stylesheet" href="/publico/estilos.css?v=${VERSION_ACTIVOS}" />
<script>document.documentElement.classList.add('js')</script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body class="${escapar(cuerpoClase)}" data-envio-gratis="${gratis > 0 ? gratis : 0}">
<a class="salto" href="#contenido">Saltar al contenido</a>
<div class="anuncio">${anuncio.map((a) => `<span>${escapar(a)}</span>`).join('')}</div>
<header class="cabecera">
  <div class="contenedor cabecera-int">
    <a class="marca" href="/" aria-label="${escapar(config.tienda.nombre)} Boutique, inicio">${MARCA}</a>
    <nav class="nav" aria-label="Principal">${enlaces}</nav>
    <div class="acciones">
      <button class="btn-icono" type="button" data-abrir-buscador aria-label="Buscar productos">${ICONO_BUSCAR}</button>
      <a class="btn-icono solo-escritorio" href="${urlWhatsapp('Hola Arte\'Sano, quiero información sobre sus productos')}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">${ICONO_WA}</a>
      <a class="btn-carrito" href="/carrito" data-abrir-carrito aria-label="Abrir carrito">${ICONO_BOLSA}<span class="texto-carrito">Carrito</span><span class="contador" id="carrito-contador">0</span></a>
      <button class="btn-icono hamburguesa" type="button" data-abrir-menu aria-label="Abrir menú" aria-expanded="false" aria-controls="menu-movil">${ICONO_MENU}</button>
    </div>
  </div>
</header>

<div class="menu-movil" id="menu-movil" aria-hidden="true">
  <div class="menu-movil-cab">
    <a class="marca" href="/">${MARCA}</a>
    <button class="btn-icono" type="button" data-cerrar-menu aria-label="Cerrar menú">${ICONO_CERRAR}</button>
  </div>
  <nav aria-label="Menú móvil">${NAV.map(([h, n]) => `<a href="${h}">${n}</a>`).join('')}</nav>
  <a class="btn grande" href="${urlWhatsapp('Hola Arte\'Sano, quiero hacer un pedido')}" target="_blank" rel="noopener">${ICONO_WA}Pedir por WhatsApp</a>
</div>

<div class="buscador" id="buscador" aria-hidden="true">
  <form action="/tienda" method="get" role="search">
    <input type="search" name="q" placeholder="Busca jabón, shampoo, arroz…" aria-label="Buscar productos" autocomplete="off" />
    <button class="btn" type="submit">Buscar</button>
  </form>
</div>

<main id="contenido">${contenido}</main>

<footer class="pie" id="contacto">
  <div class="contenedor">
    <div class="pie-int">
      <div>
        <a class="marca" href="/">${MARCA}</a>
        <p>Cosmética artesanal con plantas y saberes ancestrales del pueblo Zenú. De origen Zenú, hecha a mano en Córdoba y Sucre para el mundo.</p>
        <p><a href="https://www.instagram.com/artesanoboutique_" target="_blank" rel="noopener">Instagram</a> · <a href="https://www.facebook.com/artesanoboutique1" target="_blank" rel="noopener">Facebook</a> · <a href="${urlWhatsapp()}" target="_blank" rel="noopener">WhatsApp</a></p>
        <p class="contacto-info">
          ${config.tienda.whatsapp ? `WhatsApp: <a href="${urlWhatsapp()}" target="_blank" rel="noopener">${formatearTelefono(config.tienda.whatsapp)}</a><br/>` : ''}
          Correo: <a href="mailto:${escapar(config.correo.contacto)}">${escapar(config.correo.contacto)}</a>
        </p>
      </div>
      <div>
        <h4>Tienda</h4>
        <div class="pie-enlaces"><a href="/tienda">Todos los productos</a><a href="/ingredientes">Ingredientes ancestrales</a><a href="/artesanos">Nuestros artesanos</a><a href="/nosotros">Nuestra historia</a></div>
      </div>
      <div>
        <h4>Ayuda</h4>
        <div class="pie-enlaces"><a href="/politicas#envios">Envíos a Colombia y al mundo</a><a href="/politicas#devoluciones">Cambios y devoluciones</a><a href="/politicas#programados">Pedidos programados</a><a href="/privacidad">Privacidad y datos</a><a href="/politicas#terminos">Términos y condiciones</a></div>
      </div>
      <div>
        <h4>Aliados</h4>
        <p>Programa ZASCA · Ministerio de Industria, Comercio y Turismo · Artesanías de Colombia</p>
      </div>
    </div>
    <div class="pie-base">
      <span>${escapar(config.tienda.nombre)} Boutique${config.tienda.nit ? ' · NIT ' + escapar(config.tienda.nit) : ''} · Origen Zenú · Córdoba y Sucre, Colombia</span>
      <span>Pagos seguros con Wompi · Precios en Colombia incluyen IVA</span>
    </div>
  </div>
</footer>

<a class="wa-flotante" href="${urlWhatsapp('Hola Arte\'Sano, quiero hacer un pedido')}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${ICONO_WA}<span>¿Te ayudo?</span></a>

<div class="cajon" id="cajon" aria-hidden="true">
  <button class="cajon-fondo" type="button" data-cerrar-carrito aria-label="Cerrar carrito" tabindex="-1"></button>
  <aside class="cajon-panel" role="dialog" aria-modal="true" aria-labelledby="cajon-titulo">
    <div class="cajon-cab">
      <h2 id="cajon-titulo">Tu carrito <small>(<span id="cajon-n">0</span>)</small></h2>
      <button class="btn-icono" type="button" data-cerrar-carrito aria-label="Cerrar carrito">${ICONO_CERRAR}</button>
    </div>
    <div class="cajon-envio" id="cajon-envio" hidden><div id="cajon-envio-txt"></div><div class="barra"><div id="cajon-barra"></div></div></div>
    <div class="cajon-lista" id="cajon-lista"></div>
    <div class="cajon-pie">
      <div class="fila"><span>Subtotal</span><b id="cajon-subtotal">$0</b></div>
      <p class="mini">IVA incluido. El envío se calcula al pagar.</p>
      <a class="btn grande" id="cajon-pagar" href="/checkout">Ir a pagar</a>
    </div>
  </aside>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="/publico/tienda.js?v=${VERSION_ACTIVOS}" defer></script>
</body>
</html>`;
}

// ---------- Fotos ----------

// Fotos de buena resolucion y sin texto superpuesto (las demas son afiches de
// redes sociales con letras encima). Se prefieren para el hero, las lineas, las
// tarjetas y la galeria. Cuando se tome un set de fotos nuevo esta lista deja de
// tener efecto sin romper nada: todo cae a la primera imagen del producto.
const FOTOS_LIMPIAS = ['pepino-2.png', 'mataraton-1.jpg', 'mataraton-3.png', 'guasimo-shampoo-4.png', 'guasimo-shampoo-2.jpg'];
const esLimpia = (im) => FOTOS_LIMPIAS.some((f) => (im.url || '').endsWith('/' + f));
/** URL de la primera foto limpia del producto ('' si no tiene). */
export const fotoLimpia = (p) => p.imagenes?.find(esLimpia)?.url || '';
/** Imagenes del producto con las fotos limpias primero. */
export const imagenesOrdenadas = (p) => {
  const l = p.imagenes || [];
  return [...l.filter(esLimpia), ...l.filter((im) => !esLimpia(im))];
};

// ---------- Componentes ----------

/** Foto del producto (WebP optimizada) o marcador elegante cuando aun no hay foto. */
export function imagenProducto(p, ancho = 600, clase = '') {
  const url = p.imagenPrincipal || p.imagenes?.[0]?.url;
  if (url) return `<img${clase ? ` class="${clase}"` : ''} src="${escapar(optimizar(url, ancho))}" alt="${escapar(p.imagenes?.[0]?.alt || p.nombre)}" loading="lazy" decoding="async" />`;
  return `<div class="sin-imagen">${ICONO_HOJA}<span>Foto próximamente</span></div>`;
}

export function tarjetaProducto(p) {
  const v = p.variantePorDefecto;
  const etiquetas = [];
  if (p.agotado) etiquetas.push('<span class="etiqueta agotado">Agotado</span>');
  else if (p.destacado) etiquetas.push('<span class="etiqueta">Favorito</span>');
  if (p.precioComparacionCop && p.precioComparacionCop > p.precioDesde) etiquetas.push('<span class="etiqueta oferta">Oferta</span>');
  const imgs = imagenesOrdenadas(p);
  const url = imgs[0]?.url || p.imagenPrincipal;
  const segunda = imgs[1]?.url;
  const foto = url
    ? `<img src="${escapar(optimizar(url, 600))}" alt="${escapar(imgs[0]?.alt || p.nombre)}" loading="lazy" decoding="async" />${segunda ? `<img class="foto-alt" src="${escapar(optimizar(segunda, 600))}" alt="${escapar(p.nombre)} (vista 2)" loading="lazy" decoding="async" />` : ''}`
    : `<div class="sin-imagen">${ICONO_HOJA}<span>Foto próximamente</span></div>`;
  const precio = `${p.precioComparacionCop && p.precioComparacionCop > p.precioDesde ? `<s>${formatearCOP(p.precioComparacionCop)}</s>` : ''}${p.variantes.length > 1 ? '<small>Desde </small>' : ''}${formatearCOP(p.precioDesde)}`;
  const activas = p.variantes.filter((x) => x.stock > 0);
  const presentaciones = p.variantes.length > 1 ? `<div class="presentaciones">${p.variantes.map((x) => `${escapar(x.nombre)} ${formatearCOP(x.precioCop)}`).join(' · ')}</div>` : '';
  const stockTxt = !p.agotado && activas.length && activas.every((x) => x.stock <= 5) ? `<div class="stock-bajo">Últimas ${activas.reduce((n, x) => n + x.stock, 0)} unidades</div>` : '';
  const boton = p.agotado
    ? '<button class="agregar-rapido" type="button" disabled>Agotado</button>'
    : p.variantes.length > 1
    ? `<a class="agregar-rapido" href="/producto/${escapar(p.slug)}">Elegir presentación</a>`
    : `<button class="agregar-rapido agregar" type="button" data-sku="${escapar(v.sku)}" data-nombre="${escapar(p.nombre)}" data-variante="${escapar(v.nombre)}" data-precio="${v.precioCop}" data-imagen="${escapar(url ? optimizar(url, 600) : '')}" data-slug="${escapar(p.slug)}">Agregar al carrito</button>`;
  return `<article class="tarjeta-producto revelar">
    <div class="tarjeta-img">
      <a class="enlace-img" href="/producto/${escapar(p.slug)}" aria-label="${escapar(p.nombre)}">${foto}</a>
      <div class="etiquetas">${etiquetas.join('')}</div>
      ${boton}
    </div>
    <div class="tarjeta-cuerpo">
      <div class="tarjeta-linea">${escapar(p.categoria?.nombre || '')}${p.protagonista ? ' · ' + escapar(p.protagonista.nombre) : ''}</div>
      <h3><a href="/producto/${escapar(p.slug)}">${escapar(p.nombre)}</a></h3>
      <p>${escapar(p.descripcionCorta)}</p>
      <div class="precio">${precio}</div>${presentaciones}${stockTxt}
    </div>
  </article>`;
}

export function migas(items) {
  return `<nav class="migas" aria-label="Ruta"><a href="/">Inicio</a>${items.map(([h, n]) => (h ? ` › <a href="${h}">${escapar(n)}</a>` : ` › <span>${escapar(n)}</span>`)).join('')}</nav>`;
}

export function seccionTitulo(sobre, titulo, texto = '', enlace = null) {
  return `<div class="seccion-titulo"><div><span class="sobre">${escapar(sobre)}</span><h2>${escapar(titulo)}</h2>${texto ? `<p>${escapar(texto)}</p>` : ''}</div>${enlace ? `<a class="enlace-sub" href="${enlace[0]}">${escapar(enlace[1])} →</a>` : ''}</div>`;
}
