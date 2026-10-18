// ============================================================
//  rutas.js — Tienda publica (paginas renderizadas en el servidor) y API
//  publica del carrito/checkout.
//
//  Paginas: / · /tienda · /tienda/:linea · /producto/:slug · /ingredientes
//           /ingredientes/:slug · /artesanos · /artesanos/:slug · /nosotros
//           /politicas · /carrito · /checkout · /pedido/:numero
//           /pago/gracias · /pago/cancelado · /sitemap.xml · /robots.txt
//  API:     GET  /api/productos · GET /api/productos/:slug
//           POST /api/checkout/totales   { items, pais, ciudad }
//           POST /api/pedidos            { items, cliente, direccion, programadoPara, nota }
//           GET  /api/pedidos/:numero?email=
// ============================================================
import { Router } from 'express';
import { config } from '../config.js';
import { listar, obtenerPorSlug, productosPublicados, productoPublico, variantePorSku, enriquecer } from '../almacen/catalogo.js';
import { crearPedido, obtenerPorNumero, asignarCheckout, actualizarEstado, NOMBRES_ESTADO } from '../almacen/pedidos.js';
import { confirmarPago, rechazarPago } from '../pagos/confirmar.js';
import { ajuste } from '../almacen/ajustes.js';
import { cotizarEnvio, PAISES } from '../envios/tarifas.js';
import { calcularLinea, totalesPedido, NOMBRES_IVA } from '../util/iva.js';
import { precioEn, monedaPorPais, formatear, formatearCOP } from '../util/moneda.js';
import { crearCheckout, consultarTransaccion, wompiActivo, montoCoincide, metodosDePago, frasePagoWompi, parentesisMetodos } from '../pagos/wompi.js';
import { escapar } from '../util/texto.js';
import { optimizar } from '../imagenes/cloudinary.js';
import { layout, tarjetaProducto, fotoLimpia, imagenesOrdenadas, migas, seccionTitulo, urlWhatsapp, ICONO_WA, ICONO_FLECHA, ICONO_MAS, ICONO_HOJA } from './plantillas.js';
import { ICONOS_LINEA } from './ilustraciones.js';

export const tiendaRouter = Router();

// ------------------------------------------------------------
//  Utilidades de presentacion
// ------------------------------------------------------------

// Un producto "con foto real" es el que no usa solo la etiqueta generica.
const tieneFotoReal = (p) => !!p.imagenPrincipal && !p.imagenPrincipal.includes('/imagenes/etiquetas/');


// Texto de la seccion "Origen" del inicio (sin promesas terapeuticas). Si un
// ingrediente no esta aqui se usa su "uso ancestral" del catalogo.
const TEXTO_ORIGEN = {
  guasimo: 'Técnica ancestral de la mujer Zenú para limpiar y proteger el cabello. Es el protagonista de nuestro shampoo y acondicionador.',
  arroz: 'El agua y el almidón de arroz se usan desde hace generaciones en el Caribe para suavizar la piel. Lo trabajamos con técnica oriental.',
  mataraton: 'Crece en las cercas vivas de la sabana. Usamos el sumo de la maceración de sus tallos en un jabón artesanal de limpieza suave.',
  pepino: 'Fresco y ligero: se usa tradicionalmente para refrescar la piel. Lo incorporamos como sumo purificado a nuestro jabón.',
  coco: 'El aceite de coco es base tradicional de jabones y ungüentos en toda la costa Caribe.',
  'carbon-activado': 'Purificante natural de uso tradicional, combinado aquí con canela en un jabón artesanal.',
};
const origenRegion = (r) => (!r || /^Sucre, Colombia$/i.test(r) ? 'Córdoba y Sucre' : r);
const iconoLinea = (slug) => ICONOS_LINEA[slug] || '';
const enlaceWa = (t) => urlWhatsapp(t);

/** Atributos data-* con los que el JS agrega un producto (variante) al carrito. */
function datosAgregar(p, v) {
  const url = imagenesOrdenadas(p)[0]?.url || p.imagenPrincipal || '';
  return `data-sku="${escapar(v.sku)}" data-nombre="${escapar(p.nombre)}" data-variante="${escapar(v.nombre)}" data-precio="${v.precioCop}" data-imagen="${escapar(url ? optimizar(url, 600) : '')}" data-slug="${escapar(p.slug)}"`;
}

// ============================================================
//  Paginas
// ============================================================

tiendaRouter.get('/', (_req, res) => {
  const inicio = ajuste('inicio');
  const todos = productosPublicados({});
  const conFoto = todos.filter(tieneFotoReal);
  const lineas = listar('categorias').filter((c) => c.activo !== false);
  const ingredientes = listar('ingredientes').filter((i) => i.activo !== false);

  // Hero: fotos limpias, con tarjeta de producto que sigue a la foto visible.
  const heroProds = todos.filter((p) => fotoLimpia(p) && !p.agotado).slice(0, 4);
  const titulo = String(inicio.titulo || 'Belleza con raíces').trim();
  const partes = titulo.split(' ');
  const ultima = partes.length > 1 ? partes.pop() : '';
  const tituloHtml = ultima ? `${escapar(partes.join(' '))} <em>${escapar(ultima)}</em>` : escapar(titulo);
  const hero = heroProds.length
    ? `<div class="hero-rotativo" data-rotativo>${heroProds.map((p, i) => {
        const v = p.variantePorDefecto;
        return `<figure class="${i === 0 ? 'activo' : ''}" data-nombre="${escapar(p.nombre)}" data-precio-txt="${escapar(formatearCOP(v.precioCop) + ' · ' + v.nombre)}" data-href="/producto/${escapar(p.slug)}" ${datosAgregar(p, v)}><img src="${escapar(optimizar(fotoLimpia(p), 1000))}" alt="${escapar(p.nombre)} de Arte'Sano" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" /></figure>`;
      }).join('')}</div>`
    : '<div class="hero-marca">Arte\'Sano</div>';
  const h0 = heroProds[0];
  const heroCard = h0
    ? `<div class="hero-card" id="hero-card"><img id="hero-card-img" src="${escapar(optimizar(fotoLimpia(h0), 600))}" alt="" /><div><b id="hero-card-nombre">${escapar(h0.nombre)}</b><span id="hero-card-precio">${formatearCOP(h0.variantePorDefecto.precioCop)} · ${escapar(h0.variantePorDefecto.nombre)}</span></div><button class="mas agregar" id="hero-card-agregar" type="button" aria-label="Agregar al carrito" ${datosAgregar(h0, h0.variantePorDefecto)}>${ICONO_MAS}</button></div>`
    : '';

  // Lineas: las que tienen productos, primero las que tienen foto.
  const tiles = lineas
    .map((c) => { const ps = productosPublicados({ categoria: c.slug }); const pf = ps.find((p) => fotoLimpia(p)); return { c, n: ps.length, foto: pf ? fotoLimpia(pf) : '' }; })
    .filter((x) => x.n > 0)
    .sort((a, b) => (b.foto ? 1 : 0) - (a.foto ? 1 : 0))
    .slice(0, 4);

  const porCalidad = [...conFoto].sort((a, b) => (fotoLimpia(b) ? 1 : 0) - (fotoLimpia(a) ? 1 : 0));
  const destacados = porCalidad.filter((p) => p.destacado).slice(0, 4);
  const relleno = porCalidad.filter((p) => !destacados.includes(p)).slice(0, 4 - destacados.length);
  const favoritos = [...destacados, ...relleno];
  const nuevos = productosPublicados({ orden: 'nuevos' }).filter((p) => tieneFotoReal(p) && !favoritos.includes(p)).slice(0, 4);

  // Origen: ingredientes (con foto de producto primero) en pestañas.
  const origen = ingredientes
    .map((i) => { const ps = productosPublicados({ ingrediente: i.slug }); const pf = ps.find((p) => fotoLimpia(p)); return { i, n: ps.length, foto: pf ? fotoLimpia(pf) : '' }; })
    .filter((x) => x.n > 0)
    .sort((a, b) => (b.foto ? 1 : 0) - (a.foto ? 1 : 0))
    .slice(0, 4);

  const artesano = listar('artesanos').find((a) => a.activo !== false && a.fotoUrl);

  const contenido = `
  <section class="hero">
    <div class="contenedor hero-int">
      <div class="hero-texto">
        <span class="sobre">Cosmética artesanal · Cultura Zenú</span>
        <h1 class="${titulo.length > 28 ? 'largo' : ''}">${tituloHtml}</h1>
        <p>${escapar(inicio.subtitulo)}</p>
        <div class="hero-botones"><a class="btn" href="/tienda">Descubrir la tienda ${ICONO_FLECHA}</a><a class="btn secundario" href="${enlaceWa('Hola Arte\'Sano, quiero hacer un pedido')}" target="_blank" rel="noopener">Pedir por WhatsApp</a></div>
        <ul class="hero-sellos"><li>Hecho a mano en pequeños lotes</li><li>Envíos a Colombia y al mundo</li><li>Sin parabenos ni sulfatos</li></ul>
      </div>
      <div class="hero-visual">
        <div class="hero-circulo"></div>
        <div class="hero-arco">${hero}</div>
        ${heroCard}
      </div>
    </div>
  </section>
  <div class="banda"><span>Hecho a mano</span><i>✦</i><span>Plantas del territorio Zenú</span><i>✦</i><span>Pequeños lotes</span><i>✦</i><span>Envíos al mundo</span></div>
  ${tiles.length ? `<section class="contenedor seccion revelar">
    ${seccionTitulo('Líneas', 'Encuentra lo que tu piel necesita', '', ['/tienda', 'Ver toda la tienda'])}
    <div class="lineas">${tiles.map(({ c, foto }) => `<a class="linea-tile${foto ? '' : ' sin-foto'}" href="/tienda/${escapar(c.slug)}">${foto ? `<img src="${escapar(optimizar(foto, 600))}" alt="" loading="lazy" decoding="async" />` : `<div class="fondo-icono">${iconoLinea(c.slug) || ICONO_HOJA}</div>`}<div class="linea-info"><b>${escapar(c.nombre)}</b><span>${escapar(c.descripcion || '')}</span></div></a>`).join('')}</div>
  </section>` : ''}
  ${favoritos.length ? `<section class="contenedor seccion" style="padding-top:0">${seccionTitulo('Favoritos', 'Los más queridos', '', ['/tienda', 'Ver todo'])}<div class="rejilla carril">${favoritos.map(tarjetaProducto).join('')}</div></section>` : ''}
  ${origen.length ? `<section class="origen seccion">
    <div class="contenedor origen-int">
      <div class="origen-intro">
        <span class="sobre">Origen</span>
        <h2>De la tierra Zenú a tu piel</h2>
        <p>Cada producto nace de plantas de Córdoba y Sucre y del saber de las familias artesanas que las trabajan a mano. Elige una planta y conócela.</p>
        <div class="origen-tabs" role="tablist" aria-label="Ingredientes ancestrales">${origen.map(({ i }, k) => `<button class="tab" type="button" role="tab" id="tab-${escapar(i.slug)}" aria-controls="panel-${escapar(i.slug)}" aria-selected="${k === 0}" data-tab="${escapar(i.slug)}"><b>${escapar(i.nombre)}</b>${i.nombreCientifico ? `<i>${escapar(i.nombreCientifico)}</i>` : ''}</button>`).join('')}</div>
      </div>
      <div>${origen.map(({ i, foto }, k) => `<div class="origen-panel${k === 0 ? ' activo' : ''}" role="tabpanel" id="panel-${escapar(i.slug)}" aria-labelledby="tab-${escapar(i.slug)}">
        ${foto ? `<img src="${escapar(optimizar(foto, 900))}" alt="${escapar(i.nombre)}" loading="lazy" decoding="async" />` : `<div class="ing-ilustracion"><img src="${escapar(i.imagenUrl || '')}" alt="${escapar(i.nombre)}" loading="lazy" /></div>`}
        <div class="origen-panel-texto"><span class="region">${escapar(origenRegion(i.region))}</span><h3>${escapar(i.nombre)}</h3><p>${escapar(TEXTO_ORIGEN[i.slug] || i.usoAncestral || '')}</p><a class="btn secundario" href="/tienda?ingrediente=${escapar(i.slug)}">Ver productos con ${escapar(i.nombre.toLowerCase())} →</a></div>
      </div>`).join('')}</div>
    </div>
  </section>` : ''}
  <section class="contenedor seccion revelar">
    <div class="historia-int">
      <div class="historia-foto"><div class="historia-marco">${artesano ? `<img src="${escapar(optimizar(artesano.fotoUrl, 900))}" alt="Equipo de ${escapar(config.tienda.nombre)} en una feria artesanal" loading="lazy" decoding="async" />` : ''}</div><div class="historia-sello">Origen Zenú · Córdoba y Sucre.</div></div>
      <div>
        <span class="sobre">Las manos</span>
        <h2>Arte + Sano: belleza con historia</h2>
        <p>Nacimos en la sabana de Córdoba y Sucre, territorio del pueblo Zenú, donde las plantas y los saberes heredados siguen vivos en cada patio y cada cocina.</p>
        <p>Participamos en ferias regionales y crecemos de la mano de programas como ZASCA, el Ministerio de Industria, Comercio y Turismo y Artesanías de Colombia.</p>
        <a class="btn auto" href="/nosotros">Conoce nuestra historia ${ICONO_FLECHA}</a>
      </div>
    </div>
  </section>
  ${nuevos.length ? `<section class="contenedor seccion" style="padding-top:0">${seccionTitulo('Catálogo', 'Recién hechos', '', ['/tienda?orden=nuevos', 'Ver novedades'])}<div class="rejilla carril">${nuevos.map(tarjetaProducto).join('')}</div></section>` : ''}
  <section class="contenedor confianza revelar">
    <div><b>Pago seguro</b><span>${frasePagoWompi()}. Precios en Colombia con IVA incluido.</span></div>
    <div><b>Envíos a todo el mundo</b><span>Colombia en 2 a 7 días hábiles. Internacional en 5 a 20 días.</span></div>
    <div><b>Programa tu entrega</b><span>Elige la fecha en que quieres recibir tu pedido.</span></div>
    <div><b>Atención por WhatsApp</b><span>Asesoría, pedidos y seguimiento.</span></div>
  </section>
  <section class="contenedor seccion revelar" style="padding-top:clamp(40px,5vw,72px)">
    <div class="banda-wa">
      <div><h2>¿No sabes cuál es para ti?</h2><p>Cuéntanos qué necesitas y te recomendamos por WhatsApp. Asesoría, pedidos y seguimiento.</p></div>
      <a class="btn" href="${enlaceWa('Hola Arte\'Sano, ¿me ayudan a elegir un producto?')}" target="_blank" rel="noopener">${ICONO_WA}Escríbenos por WhatsApp</a>
    </div>
  </section>`;
  res.type('html').send(layout({
    titulo: '', descripcion: inicio.subtitulo, contenido, ruta: '/',
    imagen: h0 ? optimizar(fotoLimpia(h0), 1000) : '',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: config.tienda.nombre, url: config.publicUrl, sameAs: ['https://www.instagram.com/artesanoboutique_', 'https://www.facebook.com/artesanoboutique1'] },
  }));
});

function paginaTienda(req, res, categoria) {
  const q = String(req.query.q || '').slice(0, 80);
  const orden = String(req.query.orden || '');
  const ingrediente = String(req.query.ingrediente || '');
  const productos = productosPublicados({ categoria: categoria?.slug, q, orden, ingrediente });
  const lineas = listar('categorias').filter((c) => c.activo !== false && productosPublicados({ categoria: c.slug }).length > 0);
  const ings = listar('ingredientes').filter((i) => i.activo !== false && productosPublicados({ ingrediente: i.slug }).length > 0);
  const titulo = categoria ? categoria.nombre : 'Tienda';
  const base = categoria ? `/tienda/${categoria.slug}` : '/tienda';
  const qs = (sobre = {}) => {
    const o = { q, orden, ingrediente, ...sobre };
    const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v)).toString();
    return s ? '?' + s : '';
  };
  const contenido = `
  <section class="contenedor seccion" style="padding-bottom:0">
    ${migas(categoria ? [['/tienda', 'Tienda'], [null, categoria.nombre]] : [[null, 'Tienda']])}
    <div class="catalogo-cab">
      <div class="seccion-titulo" style="margin:0;flex:1 1 480px"><div><span class="sobre">Catálogo</span><h1>${escapar(titulo)}</h1><p>${escapar(categoria?.descripcion || 'Jabones, cremas, cuidado del cabello y más, de origen Zenú y hechos a mano en Córdoba y Sucre.')}</p></div></div>
      <form class="ordenar" method="get" action="${base}">
        ${q ? `<input type="hidden" name="q" value="${escapar(q)}" />` : ''}${ingrediente ? `<input type="hidden" name="ingrediente" value="${escapar(ingrediente)}" />` : ''}
        <label for="orden">Ordenar por</label>
        <select id="orden" name="orden" data-autoenviar><option value="">Relevancia</option><option value="nuevos" ${orden === 'nuevos' ? 'selected' : ''}>Novedades</option><option value="precio_asc" ${orden === 'precio_asc' ? 'selected' : ''}>Menor precio</option><option value="precio_desc" ${orden === 'precio_desc' ? 'selected' : ''}>Mayor precio</option></select>
        <noscript><button class="btn auto" type="submit">Aplicar</button></noscript>
      </form>
    </div>
  </section>
  <div class="filtros-barra"><div class="contenedor">
    <div class="chips" aria-label="Líneas de producto"><a class="chip-f ${!categoria ? 'activo' : ''}" href="/tienda${qs()}">Todo</a>${lineas.map((c) => `<a class="chip-f ${categoria?.id === c.id ? 'activo' : ''}" href="/tienda/${escapar(c.slug)}${qs()}">${escapar(c.nombre)}</a>`).join('')}</div>
    <div class="chips secundarios" aria-label="Ingredientes"><span class="etq">Ingrediente:</span><a class="chip-f ${!ingrediente ? 'activo' : ''}" href="${base}${qs({ ingrediente: '' })}">Todos</a>${ings.map((i) => `<a class="chip-f ${ingrediente === i.slug ? 'activo' : ''}" href="${base}${qs({ ingrediente: i.slug })}">${escapar(i.nombre)}</a>`).join('')}<span class="catalogo-meta">${q ? `Resultados para “${escapar(q)}” · ` : ''}${productos.length} ${productos.length === 1 ? 'producto' : 'productos'}</span></div>
  </div></div>
  <section class="contenedor seccion" style="padding-top:28px">
    ${productos.length ? `<div class="rejilla">${productos.map(tarjetaProducto).join('')}</div>` : `<div class="vacio"><h2 style="font-size:30px">No encontramos productos con esos filtros</h2><p>Prueba con otra línea u otro ingrediente.</p><a class="btn auto" href="/tienda">Ver todo</a></div>`}
  </section>`;
  res.type('html').send(layout({ titulo, descripcion: categoria?.descripcion || 'Jabones, cremas, shampoo y más de origen Zenú, hechos a mano en Córdoba y Sucre con plantas ancestrales.', contenido, ruta: categoria ? `/tienda/${categoria.slug}` : '/tienda' }));
}

tiendaRouter.get('/tienda', (req, res) => paginaTienda(req, res, null));
tiendaRouter.get('/tienda/:linea', (req, res, next) => {
  const c = obtenerPorSlug('categorias', req.params.linea);
  if (!c) return next();
  paginaTienda(req, res, c);
});

tiendaRouter.get('/producto/:slug', (req, res, next) => {
  const p = productoPublico(req.params.slug);
  if (!p) return next();
  const relacionados = productosPublicados({ categoria: p.categoria?.slug }).filter((x) => x.id !== p.id).slice(0, 4);
  const v = p.variantePorDefecto;
  const galeria = imagenesOrdenadas(p);
  const etiquetas = [];
  if (p.agotado) etiquetas.push('<span class="etiqueta agotado">Agotado</span>');
  else if (p.destacado) etiquetas.push('<span class="etiqueta">Favorito</span>');
  const acc = [];
  if (p.descripcion || p.beneficios) acc.push(['Descripción', `${p.descripcion || ''}${p.beneficios || ''}`]);
  if (p.ingredientes.length) acc.push(['Ingredientes ancestrales', `<p>Plantas del territorio Zenú en este producto:</p><div class="chips">${p.ingredientes.map((i) => `<a class="chip-f" href="/ingredientes/${escapar(i.slug)}">${escapar(i.nombre)}</a>`).join('')}</div>`]);
  if (p.modoUso) acc.push(['Modo de uso', p.modoUso]);
  if (p.tipoPiel?.length) acc.push(['Ideal para', `<p>${escapar(p.tipoPiel.join(', '))}</p>`]);
  if (p.advertencias) acc.push(['Advertencias', `<p>${escapar(p.advertencias)}</p>`]);
  const contenido = `
  <section class="contenedor seccion producto" style="padding-top:32px">
    ${migas([['/tienda', 'Tienda'], p.categoria ? [`/tienda/${p.categoria.slug}`, p.categoria.nombre] : null, [null, p.nombre]].filter(Boolean))}
    <div class="producto-int">
      <div class="galeria ${galeria.length > 1 ? '' : 'una'}">
        ${galeria.length > 1 ? `<div class="galeria-mini">${galeria.map((im, i) => `<button type="button" class="${i === 0 ? 'activo' : ''}" data-grande="${escapar(optimizar(im.url, 1200))}" aria-label="Ver foto ${i + 1}"><img src="${escapar(optimizar(im.url, 600))}" alt="" loading="lazy" /></button>`).join('')}</div>` : ''}
        <div class="galeria-principal" id="galeria-principal">${galeria.length ? `<img id="galeria-img" src="${escapar(optimizar(galeria[0].url, 1200))}" alt="${escapar(galeria[0].alt || p.nombre)}" decoding="async" />` : `<div class="sin-imagen">${ICONO_HOJA}<span>Foto próximamente</span></div>`}<div class="etiquetas">${etiquetas.join('')}</div></div>
      </div>
      <div class="compra">
        <div class="tarjeta-linea">${p.categoria ? `<a href="/tienda/${escapar(p.categoria.slug)}">${escapar(p.categoria.nombre)}</a>` : ''}${p.protagonista ? ` · <a href="/ingredientes/${escapar(p.protagonista.slug)}">${escapar(p.protagonista.nombre)}</a>` : ''}</div>
        <h1>${escapar(p.nombre)}</h1>
        <p class="ficha-corta">${escapar(p.descripcionCorta)}</p>
        <div class="precio grande" id="precio">${formatearCOP(v.precioCop)}</div>
        <div class="mini iva">Precio con IVA incluido (${escapar(NOMBRES_IVA[p.tipoIva] || '')}). Clientes fuera de Colombia pagan en USD sin IVA colombiano.</div>
        ${p.variantes.length > 1 ? `<div class="rotulo">Presentación</div><div class="variantes" id="variantes">${p.variantes.map((x) => `<button type="button" class="${x.sku === v.sku ? 'activo' : ''}" data-sku="${escapar(x.sku)}" data-nombre="${escapar(x.nombre)}" data-precio="${x.precioCop}" data-stock="${x.stock}" ${x.stock <= 0 ? 'disabled' : ''}>${escapar(x.nombre)}${x.stock <= 0 ? ' (agotado)' : ''}</button>`).join('')}</div>` : ''}
        <div class="comprar">
          <div class="cantidad"><button type="button" data-d="-1" aria-label="Menos">−</button><input id="cantidad" type="number" min="1" max="50" value="1" aria-label="Cantidad" /><button type="button" data-d="1" aria-label="Más">+</button></div>
          ${p.agotado ? '<button class="btn grande" type="button" disabled>Agotado</button>' : `<button class="btn grande agregar" id="agregar" type="button" ${datosAgregar(p, v)}>Agregar al carrito</button>`}
        </div>
        <a class="btn secundario grande wa" href="${enlaceWa(`Hola Arte'Sano, quiero pedir "${p.nombre}" (${v.sku})`)}" target="_blank" rel="noopener">${ICONO_WA}Pedir por WhatsApp</a>
        <div class="garantias"><div><b>Envío a Colombia</b>2 a 7 días hábiles${config.tienda.envioGratisDesde ? `. Gratis desde ${formatearCOP(config.tienda.envioGratisDesde)}.` : '.'}</div><div><b>Programa tu entrega</b>Elige la fecha al pagar.</div></div>
        ${p.invima ? `<p class="mini">Notificación sanitaria (NSO): ${escapar(p.invima)}</p>` : ''}
        ${acc.length ? `<div class="acordeon">${acc.map(([t, c], i) => `<details name="ficha" ${i === 0 ? 'open' : ''}><summary>${escapar(t)}</summary><div class="acc-cuerpo">${c}</div></details>`).join('')}</div>` : ''}
      </div>
    </div>
    ${p.artesano ? `<div class="artesano-caja revelar"><div class="artesano-foto">${p.artesano.fotoUrl ? `<img src="${escapar(optimizar(p.artesano.fotoUrl, 600))}" alt="${escapar(p.artesano.nombre)}" loading="lazy" />` : `<div class="sin-imagen">${ICONO_HOJA}</div>`}</div><div><span class="sobre">Elaborado por</span><h3><a href="/artesanos/${escapar(p.artesano.slug)}">${escapar(p.artesano.nombre)}</a></h3><p class="origen-lugar">Origen Zenú · Córdoba y Sucre</p><p>${escapar((p.artesano.bio || '').slice(0, 260))}</p><a class="btn secundario auto" href="/artesanos/${escapar(p.artesano.slug)}">Conocer a los artesanos →</a></div></div>` : ''}
    ${relacionados.length ? `<div class="relacionados">${seccionTitulo('También te puede gustar', 'De la misma línea')}<div class="rejilla carril">${relacionados.map(tarjetaProducto).join('')}</div></div>` : ''}
  </section>`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, description: p.descripcionCorta, sku: v.sku,
    image: galeria.map((i) => (i.url.startsWith('/') ? config.publicUrl + i.url : i.url)), brand: { '@type': 'Brand', name: config.tienda.nombre },
    offers: { '@type': 'Offer', url: `${config.publicUrl}/producto/${p.slug}`, priceCurrency: 'COP', price: v.precioCop, availability: p.agotado ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' },
  };
  res.type('html').send(layout({ titulo: p.seoTitulo || p.nombre, descripcion: p.seoDescripcion || p.descripcionCorta, contenido, ruta: `/producto/${p.slug}`, imagen: galeria[0] ? optimizar(galeria[0].url, 1200) : '', jsonLd }));
});

/** Marco de imagen (foto, o la ilustracion botanica cuando solo hay SVG). */
function marcoImagen(url, alt, ancho) {
  if (!url) return `<div class="marco"><div class="sin-imagen">${ICONO_HOJA}</div></div>`;
  const ilustrado = /\.svg(\?|$)/i.test(url);
  return `<div class="marco ${ilustrado ? 'ilustrado' : ''}"><img src="${escapar(ilustrado ? url : optimizar(url, ancho))}" alt="${escapar(alt)}" loading="lazy" decoding="async" /></div>`;
}

tiendaRouter.get('/ingredientes', (_req, res) => {
  const ings = listar('ingredientes').filter((i) => i.activo !== false);
  const contenido = `<section class="contenedor seccion">${migas([[null, 'Ingredientes']])}
    <div class="seccion-titulo"><div><span class="sobre">Origen</span><h1>Ingredientes ancestrales</h1><p>Plantas del territorio Zenú (Córdoba y Sucre) usadas por generaciones y hoy en tus productos de cuidado personal.</p></div></div>
    <div class="rejilla ingredientes">${ings.map((i) => `<a class="tarjeta-ingrediente revelar" href="/ingredientes/${escapar(i.slug)}">${marcoImagen(i.imagenUrl, i.nombre, 600)}<div><h3>${escapar(i.nombre)}</h3>${i.nombreCientifico ? `<i>${escapar(i.nombreCientifico)}</i>` : ''}<p>${escapar(TEXTO_ORIGEN[i.slug] || i.usoAncestral || '')}</p></div></a>`).join('')}</div></section>`;
  res.type('html').send(layout({ titulo: 'Ingredientes ancestrales', descripcion: 'Guásimo, arroz, matarratón, coco y chopo: plantas de la cultura Zenú en cosmética artesanal.', contenido, ruta: '/ingredientes' }));
});

tiendaRouter.get('/ingredientes/:slug', (req, res, next) => {
  const i = obtenerPorSlug('ingredientes', req.params.slug);
  if (!i || i.activo === false) return next();
  const productos = productosPublicados({ ingrediente: i.slug });
  const ilustrado = !i.imagenUrl || /\.svg(\?|$)/i.test(i.imagenUrl);
  const contenido = `<section class="contenedor seccion">${migas([['/ingredientes', 'Ingredientes'], [null, i.nombre]])}
    <div class="ingrediente-int">
      <div class="ingrediente-foto ${ilustrado ? 'ilustrado' : ''}">${i.imagenUrl ? `<img src="${escapar(ilustrado ? i.imagenUrl : optimizar(i.imagenUrl, 900))}" alt="${escapar(i.nombre)}" />` : `<div class="sin-imagen">${ICONO_HOJA}<span>${escapar(i.nombre)}</span></div>`}</div>
      <div><span class="sobre">Ingrediente ancestral</span><h1>${escapar(i.nombre)}</h1>${i.nombreCientifico ? `<p class="cientifico">${escapar(i.nombreCientifico)}</p>` : ''}
        <p><b>Origen:</b> ${escapar(origenRegion(i.region))}</p>
        ${i.usoAncestral ? `<h3>Uso ancestral Zenú</h3><p>${escapar(i.usoAncestral)}</p>` : ''}
        ${i.beneficios ? `<h3>Beneficios</h3><p>${escapar(i.beneficios)}</p>` : ''}</div>
    </div>
    ${productos.length ? `<div class="relacionados">${seccionTitulo('Productos', `Con ${i.nombre}`)}<div class="rejilla">${productos.map(tarjetaProducto).join('')}</div></div>` : ''}</section>`;
  res.type('html').send(layout({ titulo: i.nombre, descripcion: (i.usoAncestral || i.beneficios || '').slice(0, 160), contenido, ruta: `/ingredientes/${i.slug}` }));
});

tiendaRouter.get('/artesanos', (_req, res) => {
  const arts = listar('artesanos').filter((a) => a.activo !== false);
  const contenido = `<section class="contenedor seccion">${migas([[null, 'Artesanos']])}
    <div class="seccion-titulo"><div><span class="sobre">Las manos</span><h1>Nuestros artesanos</h1><p>Familias y comunidades de Córdoba y Sucre que elaboran cada producto con el saber heredado del pueblo Zenú.</p></div></div>
    <div class="rejilla artesanos">${arts.map((a) => `<a class="tarjeta-artesano revelar" href="/artesanos/${escapar(a.slug)}">${marcoImagen(a.fotoUrl, a.nombre, 600)}<div><h3>${escapar(a.nombre)}</h3><p>Origen Zenú · Córdoba y Sucre</p></div></a>`).join('') || '<p class="vacio">Pronto conocerás a nuestros artesanos.</p>'}</div></section>`;
  res.type('html').send(layout({ titulo: 'Artesanos', descripcion: 'Conoce a las familias artesanas de origen Zenú de Córdoba y Sucre que elaboran nuestros productos.', contenido, ruta: '/artesanos' }));
});

tiendaRouter.get('/artesanos/:slug', (req, res, next) => {
  const a = obtenerPorSlug('artesanos', req.params.slug);
  if (!a || a.activo === false) return next();
  const productos = productosPublicados({ artesano: a.slug });
  const contenido = `<section class="contenedor seccion">${migas([['/artesanos', 'Artesanos'], [null, a.nombre]])}
    <div class="ingrediente-int"><div class="ingrediente-foto">${a.fotoUrl ? `<img src="${escapar(optimizar(a.fotoUrl, 900))}" alt="${escapar(a.nombre)}" />` : `<div class="sin-imagen">${ICONO_HOJA}</div>`}</div>
      <div><span class="sobre">Artesano</span><h1>${escapar(a.nombre)}</h1><p><b>Origen Zenú · Córdoba y Sucre</b></p><p>${escapar(a.bio || '')}</p></div></div>
    ${productos.length ? `<div class="relacionados">${seccionTitulo('Productos', `Elaborados por ${a.nombre}`)}<div class="rejilla">${productos.map(tarjetaProducto).join('')}</div></div>` : ''}</section>`;
  res.type('html').send(layout({ titulo: a.nombre, descripcion: (a.bio || '').slice(0, 160), contenido, ruta: `/artesanos/${a.slug}`, imagen: a.fotoUrl ? optimizar(a.fotoUrl, 900) : '' }));
});

tiendaRouter.get('/nosotros', (_req, res) => {
  const contenido = `<section class="contenedor seccion texto">${migas([[null, 'Nuestra historia']])}
    <span class="sobre">Arte + Sano</span><h1>Belleza con raíces</h1>
    <p><b>${escapar(config.tienda.nombre)}</b> es una startup de cuidado de la belleza con productos de origen ancestral. Nacimos en la sabana de Córdoba y Sucre, territorio del pueblo Zenú, donde las plantas y los saberes heredados siguen vivos en cada patio y cada cocina.</p>
    <p>Elaboramos jabones de tocador, cremas, shampoo y lociones a mano, en pequeños lotes, con ingredientes como el <a href="/ingredientes/guasimo">guásimo</a>, el <a href="/ingredientes/arroz">arroz</a>, el <a href="/ingredientes/mataraton">matarratón</a>, el <a href="/ingredientes/coco">coco</a> y el <a href="/ingredientes/chopo">chopo</a>. Cada producto cuenta la historia de las familias artesanas que lo hacen posible.</p>
    <h2>Aliados</h2>
    <p>Crecemos de la mano de programas de fortalecimiento empresarial como <b>ZASCA</b> y del <b>Ministerio de Industria, Comercio y Turismo</b>, entre otros aliados que creen en el talento artesanal colombiano.</p>
    <h2>Nuestro compromiso</h2>
    <ul><li>Fórmulas naturales, sin parabenos ni sulfatos.</li><li>Comercio justo con las comunidades artesanas.</li><li>Empaques de cartón y fibras naturales.</li><li>Envíos a Colombia y a cualquier lugar del mundo.</li></ul>
    <p><a class="btn auto" href="/tienda" style="text-decoration:none;color:var(--ivory)">Conoce la tienda</a></p></section>`;
  res.type('html').send(layout({ titulo: 'Nuestra historia', descripcion: 'Arte\'Sano: cosmética artesanal de origen ancestral Zenú, hecha a mano en Córdoba y Sucre.', contenido, ruta: '/nosotros' }));
});

tiendaRouter.get('/politicas', (_req, res) => {
  const env = ajuste('envio');
  const pp = ajuste('pedidosProgramados');
  const contenido = `<section class="contenedor seccion texto">${migas([[null, 'Políticas']])}
    <h1>Políticas de la tienda</h1>
    <h2 id="envios">Envíos</h2>
    <p><b>Colombia:</b> ${escapar(env.transportadoraNacional)}. Ciudades principales ${formatearCOP(env.tarifaPrincipalCop)} (${escapar(env.diasPrincipal)}); resto del país ${formatearCOP(env.tarifaRestoCop)} (${escapar(env.diasResto)}).${config.tienda.envioGratisDesde ? ` Envío gratis en compras desde ${formatearCOP(config.tienda.envioGratisDesde)}.` : ''}</p>
    <p><b>Internacional:</b> ${escapar(env.transportadoraInternacional)}. ${env.zonas.map((z) => `${escapar(z.nombre)}: US$ ${z.tarifaUsd} (${escapar(z.dias)})`).join(' · ')}. Los impuestos o aranceles de importación del país de destino, si aplican, corren por cuenta del comprador.</p>
    <h2 id="programados">Pedidos programados</h2>
    <p>Puedes elegir la fecha en la que quieres recibir tu pedido, entre ${pp.minDias} y ${pp.maxDias} días después de la compra. Te recordaremos por correo y WhatsApp antes del despacho y podrás reprogramar hasta 48 horas antes.</p>
    <h2 id="devoluciones">Cambios, devoluciones y retracto</h2>
    <p>Por tratarse de productos de cuidado personal, solo aceptamos devoluciones de productos sellados y sin uso dentro de los 5 días hábiles siguientes a la entrega (derecho de retracto, Ley 1480 de 2011). Si tu producto llegó dañado, escríbenos por WhatsApp con una foto y lo reponemos sin costo.</p>
    <h2 id="pagos">Pagos e impuestos</h2>
    <p>Los pagos se procesan de forma segura a través de Wompi${parentesisMetodos()}. Los precios en Colombia incluyen IVA; las ventas internacionales no cuentan con pasarela de pago en línea por ahora — te contactamos por WhatsApp para completarlas.</p>
    <h2 id="terminos">Términos y condiciones</h2>
    <p>Al comprar en ${escapar(config.tienda.nombre)} aceptas estas políticas y nuestra <a href="/privacidad">política de tratamiento de datos personales</a> (Ley 1581 de 2012). Para cualquier consulta escríbenos a ${escapar(config.correo.contacto)} o por WhatsApp.</p></section>`;
  res.type('html').send(layout({ titulo: 'Políticas', descripcion: 'Envíos, devoluciones, pedidos programados, pagos y términos de Arte\'Sano.', contenido, ruta: '/politicas' }));
});

tiendaRouter.get('/carrito', (_req, res) => {
  const contenido = `<section class="contenedor seccion carrito-pagina" style="padding-top:32px">${migas([[null, 'Carrito']])}
    <h1 style="margin-bottom:.6em">Tu carrito</h1>
    <div id="carrito-vacio" class="vacio" hidden>Tu carrito está vacío. <a href="/tienda" style="text-decoration:underline">Descubre nuestros productos</a>.</div>
    <div class="carrito-int" id="carrito-int" hidden>
      <div id="carrito-lista"></div>
      <aside class="resumen">
        <h3>Resumen</h3>
        <div class="fila"><span>Subtotal (con IVA)</span><b id="carrito-subtotal"></b></div>
        <p class="mini">El envío y el desglose de IVA se calculan en el siguiente paso según tu ciudad o país.</p>
        <a class="btn grande" href="/checkout">Ir a pagar</a>
        <a class="btn secundario grande" href="/tienda">Seguir comprando</a>
      </aside>
    </div></section>`;
  res.type('html').send(layout({ titulo: 'Carrito', descripcion: 'Tu carrito de compras.', contenido, ruta: '/carrito', cuerpoClase: 'sin-indexar' }));
});

tiendaRouter.get('/checkout', (_req, res) => {
  const pp = ajuste('pedidosProgramados');
  const hoy = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const min = fmt(new Date(hoy.getTime() + pp.minDias * 86400000));
  const max = fmt(new Date(hoy.getTime() + pp.maxDias * 86400000));
  const contenido = `<section class="contenedor seccion checkout" style="padding-top:32px">${migas([['/carrito', 'Carrito'], [null, 'Pagar']])}
    <ol class="cuenta-pasos"><li class="hecho"><span>✓</span>Carrito</li><li class="actual"><span>2</span>Datos y entrega</li><li><span>3</span>${wompiActivo() ? 'Pago con Wompi' : 'Confirmación'}</li></ol>
    <h1 style="margin-bottom:.6em">Finalizar compra</h1>
    <div class="checkout-int">
      <form id="checkout-form" class="checkout-form" novalidate>
        <div class="paso">
          <h3><span>1</span>Tus datos</h3>
          <div class="grid2"><label>Nombre completo<input name="nombre" required autocomplete="name" /></label><label>Correo<input name="email" type="email" required autocomplete="email" /></label></div>
          <label>Teléfono / WhatsApp<input name="telefono" required autocomplete="tel" placeholder="+57 300 000 0000" /></label>
        </div>
        <div class="paso">
          <h3><span>2</span>Dirección de entrega</h3>
          <label>País<select name="pais" id="pais">${PAISES.map(([c, n]) => `<option value="${c}">${escapar(n)}</option>`).join('')}</select></label>
          <div class="grid2"><label>Ciudad<input name="ciudad" id="ciudad" required autocomplete="address-level2" /></label><label>Departamento / Estado<input name="departamento" autocomplete="address-level1" /></label></div>
          <label>Dirección<input name="linea1" required autocomplete="address-line1" placeholder="Calle, número, barrio" /></label>
          <div class="grid2"><label>Apartamento, referencia (opcional)<input name="linea2" autocomplete="address-line2" /></label><label>Código postal (opcional)<input name="codigoPostal" autocomplete="postal-code" /></label></div>
          <div class="aviso-info" id="aviso-intl" hidden>Los pedidos fuera de Colombia no se pagan en línea todavía: registramos tu pedido y te contactamos por WhatsApp para completarlo. Los aranceles del país de destino, si aplican, corren por cuenta del comprador.</div>
        </div>
        <div class="paso">
          <h3><span>3</span>¿Cuándo quieres recibirlo?</h3>
          <div class="opciones-fecha">
            <label class="opcion"><input type="radio" name="cuando" value="ya" checked /><span><b>Lo antes posible</b><small>Despachamos en cuanto se confirme el pago.</small></span></label>
            <label class="opcion"><input type="radio" name="cuando" value="programar" /><span><b>Programar una fecha</b><small>Elige el día de entrega (${pp.minDias} a ${pp.maxDias} días).</small></span></label>
          </div>
          <label id="fecha-caja" hidden style="max-width:300px">Fecha de entrega<input type="date" name="programadoPara" min="${min}" max="${max}" /></label>
          <label>Nota para tu pedido (opcional)<textarea name="nota" rows="2" placeholder="Es un regalo, dejar en portería, etc."></textarea></label>
        </div>
        <label class="consent"><input type="checkbox" name="acepto" required /> <span>Acepto las <a href="/politicas" target="_blank">políticas</a> y el <a href="/privacidad" target="_blank">tratamiento de mis datos</a>.</span></label>
        <div class="error" id="checkout-error" role="alert"></div>
        <button class="btn grande" id="pagar" type="submit" data-texto="Pagar de forma segura">Pagar de forma segura</button>
        ${wompiActivo()
    ? `<div class="metodos" id="metodos"><span>Serás redirigido a Wompi para pagar${metodosDePago().length ? ' con:' : ' de forma segura.'}</span>${metodosDePago().map((m) => `<em>${escapar(m)}</em>`).join('')}</div>`
    : '<p class="mini"><b>Pasarela en configuración:</b> tu pedido quedará registrado y te contactaremos por WhatsApp para completar el pago.</p>'}
      </form>
      <aside class="resumen" id="resumen">
        <h3>Tu pedido</h3>
        <div id="resumen-items"></div>
        <div class="fila"><span>Subtotal sin IVA</span><b id="r-subtotal">—</b></div>
        <div class="fila"><span id="r-iva-label">IVA</span><b id="r-iva">—</b></div>
        <div class="fila"><span>Envío <small id="r-envio-detalle"></small></span><b id="r-envio">—</b></div>
        <div class="fila total"><span>Total</span><b id="r-total">—</b></div>
        <p class="mini" id="r-aviso"></p>
      </aside>
    </div></section>`;
  res.type('html').send(layout({ titulo: 'Pagar', descripcion: 'Finaliza tu compra de forma segura.', contenido, ruta: '/checkout', cuerpoClase: 'sin-indexar' }));
});

function paginaPedido(res, p, mensaje = '') {
  const t = p.totales, m = p.moneda;
  const contenido = `<section class="contenedor seccion pedido-pagina" style="padding-top:32px">${migas([[null, 'Pedido ' + p.numero]])}
    ${mensaje ? `<div class="aviso-ok">${mensaje}</div>` : ''}
    <h1 style="margin-bottom:.6em">Pedido ${escapar(p.numero)} <span class="chip ${escapar(p.estado)}">${escapar(NOMBRES_ESTADO[p.estado] || p.estado)}</span></h1>
    <div class="pedido-int">
      <div>
        <h3>Productos</h3>
        ${p.items.map((l) => `<div class="pedido-item">${l.imagenUrl ? `<img src="${escapar(optimizar(l.imagenUrl, 600))}" alt="" />` : `<div class="sin-imagen mini">${ICONO_HOJA}</div>`}<div><b>${escapar(l.productoNombre)}</b><br /><small>${escapar(l.varianteNombre)} · ${l.cantidad} × ${formatear(l.precioUnitario + l.ivaUnitario, m)}</small></div><b>${formatear(l.total, m)}</b></div>`).join('')}
        <h3 style="margin-top:28px">Entrega</h3>
        <p>${escapar(p.direccion.linea1)}${p.direccion.linea2 ? ', ' + escapar(p.direccion.linea2) : ''}<br />${escapar(p.direccion.ciudad)}${p.direccion.departamento ? ', ' + escapar(p.direccion.departamento) : ''} · ${escapar(p.direccion.pais)}<br /><small>${escapar(p.envio.transportadora)} · ${escapar(p.envio.dias)}</small></p>
        ${p.programadoPara ? `<p><b>Entrega programada:</b> ${escapar(p.programadoPara)}</p>` : ''}
        ${p.guia ? `<p><b>Guía:</b> ${escapar(p.guia)} ${p.urlSeguimiento ? `· <a href="${escapar(p.urlSeguimiento)}" target="_blank" rel="noopener" style="text-decoration:underline">Rastrear envío</a>` : ''}</p>` : ''}
        <h3 style="margin-top:28px">Historial</h3>
        <ul class="historial">${p.historial.map((h) => `<li><small>${new Date(h.ts).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</small> · ${escapar(NOMBRES_ESTADO[h.estado] || h.estado)}${h.nota && !/ref /.test(h.nota) ? ' · ' + escapar(h.nota) : ''}</li>`).join('')}</ul>
      </div>
      <aside class="resumen">
        <h3>Resumen</h3>
        <div class="fila"><span>Subtotal sin IVA</span><b>${formatear(t.subtotal, m)}</b></div>
        <div class="fila"><span>IVA${p.regimen === 'exportacion' ? ' (exportación 0 %)' : ''}</span><b>${formatear(t.iva, m)}</b></div>
        <div class="fila"><span>Envío${p.envio.gratis ? ' (gratis)' : ''}</span><b>${formatear(t.envio + t.envioIva, m)}</b></div>
        <div class="fila total"><span>Total</span><b>${formatear(t.total, m)}</b></div>
        ${p.estado === 'pendiente_pago' ? (p.urlPago ? `<a class="btn grande" href="${escapar(p.urlPago)}">Pagar ahora</a>` : `<a class="btn grande" href="${enlaceWa(`Hola Arte'Sano, quiero completar el pago del pedido ${p.numero}`)}" target="_blank" rel="noopener">Completar pago por WhatsApp</a>`) : ''}
        <a class="btn secundario grande" href="${enlaceWa(`Hola Arte'Sano, tengo una consulta sobre mi pedido ${p.numero}`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
      </aside>
    </div></section>`;
  res.type('html').send(layout({ titulo: 'Pedido ' + p.numero, descripcion: 'Estado de tu pedido.', contenido, ruta: '/pedido/' + p.numero, cuerpoClase: 'sin-indexar' }));
}

tiendaRouter.get('/pedido/:numero', (req, res, next) => {
  const p = obtenerPorNumero(req.params.numero);
  if (!p) return next();
  paginaPedido(res, p);
});

tiendaRouter.get('/pago/gracias', async (req, res) => {
  const p = obtenerPorNumero(req.query.p);
  if (!p) return res.redirect('/');
  // Wompi agrega ?id=<transaccion> al volver del checkout; lo consultamos de
  // una vez (no depende solo del webhook) y guardamos el id real para que
  // el revisor periódico también pueda volver a consultarlo si hace falta.
  if (p.estado === 'pendiente_pago' && req.query.id) {
    asignarCheckout(p.id, String(req.query.id), p.urlPago || '');
    const estado = await consultarTransaccion(req.query.id);
    if (estado?.pagado && montoCoincide(p, estado.montoCentavos)) await confirmarPago(p, estado.referenciaPago);
    else if (estado?.rechazado) rechazarPago(p, `Pago ${estado.estado} en Wompi`);
  }
  const actual = obtenerPorNumero(req.query.p);
  paginaPedido(res, actual, actual.estado === 'pendiente_pago'
    ? '¡Gracias! Estamos confirmando tu pago con la pasarela. En unos minutos recibirás la confirmación por correo y WhatsApp; puedes refrescar esta página.'
    : '¡Pago confirmado! Gracias por apoyar el trabajo artesanal Zenú. 🌿');
});

tiendaRouter.get('/pago/cancelado', (req, res) => {
  const p = obtenerPorNumero(req.query.p);
  if (!p) return res.redirect('/carrito');
  paginaPedido(res, p, 'No se completó el pago. Puedes intentarlo de nuevo con el botón "Pagar ahora" o escribirnos por WhatsApp.');
});

tiendaRouter.get('/sitemap.xml', (_req, res) => {
  const urls = ['/', '/tienda', '/ingredientes', '/artesanos', '/nosotros', '/politicas',
    ...listar('categorias').map((c) => '/tienda/' + c.slug),
    ...productosPublicados().map((p) => '/producto/' + p.slug),
    ...listar('ingredientes').map((i) => '/ingredientes/' + i.slug),
    ...listar('artesanos').map((a) => '/artesanos/' + a.slug)];
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((u) => `<url><loc>${escapar(config.publicUrl + u)}</loc></url>`).join('')}</urlset>`);
});

tiendaRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /carrito\nDisallow: /pedido/\nSitemap: ${config.publicUrl}/sitemap.xml\n`);
});

// ============================================================
//  API publica
// ============================================================

tiendaRouter.get('/api/productos', (req, res) => {
  const lista = productosPublicados({ categoria: req.query.categoria, q: req.query.q, ingrediente: req.query.ingrediente, orden: req.query.orden });
  res.json({ ok: true, productos: lista.map((p) => ({ id: p.id, slug: p.slug, nombre: p.nombre, descripcionCorta: p.descripcionCorta, categoria: p.categoria?.nombre, precioDesde: p.precioDesde, precioUsd: p.precioUsd, imagen: p.imagenPrincipal, agotado: p.agotado, variantes: p.variantes.map((v) => ({ sku: v.sku, nombre: v.nombre, precioCop: v.precioCop, precioUsd: v.precioUsd, stock: v.stock })) })) });
});

tiendaRouter.get('/api/productos/:slug', (req, res) => {
  const p = productoPublico(req.params.slug);
  if (!p) return res.status(404).json({ ok: false, error: 'No existe.' });
  res.json({ ok: true, producto: p });
});

/** Totales del carrito con IVA y envio segun destino (sin crear pedido). */
tiendaRouter.post('/api/checkout/totales', (req, res) => {
  try {
    const { items = [], pais = 'CO', ciudad = '' } = req.body || {};
    const iso = String(pais).toUpperCase().slice(0, 2);
    const moneda = monedaPorPais(iso);
    const regimen = iso === 'CO' ? 'nacional' : 'exportacion';
    const lineas = [];
    let subtotalCop = 0;
    for (const it of items.slice(0, 30)) {
      const e = variantePorSku(String(it.sku || ''));
      if (!e) continue;
      const cantidad = Math.max(1, Math.min(50, parseInt(it.cantidad, 10) || 1));
      const precio = precioEn({ precioCop: e.variante.precioCop, precioUsd: e.variante.precioUsd || e.producto.precioUsd, tipoIva: e.producto.tipoIva, incluyeIva: e.producto.precioIncluyeIva }, moneda);
      const c = calcularLinea({ precio, tipo: e.producto.tipoIva, incluyeIva: e.producto.precioIncluyeIva, cantidad, regimen });
      subtotalCop += e.variante.precioCop * cantidad;
      lineas.push({ sku: e.variante.sku, nombre: e.producto.nombre, variante: e.variante.nombre, stock: e.variante.stock, ...c });
    }
    const envio = cotizarEnvio({ pais: iso, ciudad, subtotalCop, moneda });
    const totales = totalesPedido({ lineas, envio: envio.costo, envioTipoIva: envio.tipoIva, regimen });
    res.json({ ok: true, moneda, regimen, lineas, envio, totales });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/** Crea el pedido y devuelve la URL de pago de Wompi (solo pedidos en COP; ver pagos/wompi.js). */
tiendaRouter.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = crearPedido({ ...(req.body || {}), canal: 'web' });
    let urlPago = '';
    if (wompiActivo()) {
      try {
        const ck = crearCheckout(pedido);
        if (ck) { asignarCheckout(pedido.id, ck.checkoutId, ck.redirectUrl); urlPago = ck.redirectUrl; }
      } catch (err) {
        console.error('[checkout] Wompi no creó el checkout:', err.message);
        actualizarEstado(pedido.id, 'pendiente_pago', 'Error creando checkout Wompi: ' + err.message);
      }
    }
    res.json({ ok: true, numero: pedido.numero, urlPago, urlPedido: `/pedido/${pedido.numero}`, total: pedido.totales.total, moneda: pedido.moneda });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

tiendaRouter.get('/api/pedidos/:numero', (req, res) => {
  const p = obtenerPorNumero(req.params.numero);
  if (!p || (req.query.email && p.cliente.email !== String(req.query.email).toLowerCase())) return res.status(404).json({ ok: false, error: 'No existe.' });
  res.json({ ok: true, pedido: { numero: p.numero, estado: p.estado, estadoNombre: NOMBRES_ESTADO[p.estado], programadoPara: p.programadoPara, guia: p.guia, urlSeguimiento: p.urlSeguimiento, total: p.totales.total, moneda: p.moneda } });
});

export { enriquecer };
