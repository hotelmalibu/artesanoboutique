// ============================================================
//  plantillas.js — Plantillas HTML de la tienda publica (renderizado en
//  el servidor para SEO). Tokens de marca de Arte'Sano: crema, verde
//  oliva, beige, blush, marron tierra.
// ============================================================
import { config } from '../config.js';
import { escapar } from '../util/texto.js';
import { formatearCOP } from '../util/moneda.js';
import { optimizar } from '../imagenes/cloudinary.js';

export const LOGO_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="48" fill="#F5EDE0"/><path d="M22 62c6-10 14-16 24-18c-4 8-12 14-24 18z" fill="none" stroke="#7C8B5D" stroke-width="2.2" stroke-linecap="round"/><text x="44" y="62" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="42" fill="#7C8B5D">A</text><text x="56" y="72" font-family="Georgia,'Times New Roman',serif" font-style="italic" font-size="34" fill="#C9A876">S</text></svg>`;

export function urlWhatsapp(texto = '') {
  const n = config.tienda.whatsapp;
  const base = n ? `https://wa.me/${n}` : '#contacto';
  return texto && n ? `${base}?text=${encodeURIComponent(texto)}` : base;
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
<link rel="stylesheet" href="/publico/estilos.css" />
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body class="${cuerpoClase}">
<header class="cabecera">
  <div class="contenedor cabecera-int">
    <a class="marca" href="/">${LOGO_SVG}<span>Arte<em>'</em>Sano</span></a>
    <nav class="nav" id="nav">${nav.map(([h, n]) => `<a href="${h}" ${ruta.startsWith(h) ? 'class="activo"' : ''}>${n}</a>`).join('')}</nav>
    <div class="acciones">
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
      <div class="marca-pie">${LOGO_SVG}<b>${escapar(config.tienda.nombre)}</b></div>
      <p>Cosmética artesanal con plantas medicinales y saberes ancestrales del pueblo Zenú. Hecha a mano en Córdoba y Sucre, Colombia, para el mundo.</p>
      <p><a href="https://www.instagram.com/artesanoboutique_" target="_blank" rel="noopener">Instagram</a> · <a href="https://www.facebook.com/artesanoboutique1" target="_blank" rel="noopener">Facebook</a> · <a href="${urlWhatsapp()}" target="_blank" rel="noopener">WhatsApp</a></p>
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
