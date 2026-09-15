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
import { ajuste } from '../almacen/ajustes.js';
import { cotizarEnvio, PAISES } from '../envios/tarifas.js';
import { calcularLinea, totalesPedido, NOMBRES_IVA } from '../util/iva.js';
import { precioEn, monedaPorPais, formatear, formatearCOP } from '../util/moneda.js';
import { crearCheckout, rapydActivo } from '../pagos/rapyd.js';
import { escapar } from '../util/texto.js';
import { optimizar } from '../imagenes/cloudinary.js';
import { layout, tarjetaProducto, imagenProducto, migas, seccionTitulo, urlWhatsapp, LOGO_SVG, WORDMARK_SVG, decoracionHero } from './plantillas.js';
import { ICONOS_LINEA } from './ilustraciones.js';

const iconoLinea = (slug) => ICONOS_LINEA[slug] || '';

export const tiendaRouter = Router();

// ============================================================
//  Paginas
// ============================================================

tiendaRouter.get('/', (_req, res) => {
  const inicio = ajuste('inicio');
  const destacados = productosPublicados({ destacado: true }).slice(0, 4);
  const nuevos = productosPublicados({ orden: 'nuevos' }).slice(0, 8);
  const lineas = listar('categorias').filter((c) => c.activo !== false);
  const ingredientes = listar('ingredientes').filter((i) => i.activo !== false).slice(0, 6);
  const contenido = `
  <section class="hero">
    ${decoracionHero()}
    <div class="contenedor hero-int">
      <div class="hero-texto">
        <span class="sobre">Cosmética artesanal · Cultura Zenú</span>
        <h1>${escapar(inicio.titulo)}</h1>
        <p>${escapar(inicio.subtitulo)}</p>
        <div class="hero-botones"><a class="btn primario grande" href="/tienda">Comprar ahora</a><a class="btn secundario grande" href="${urlWhatsapp('Hola Arte\'Sano, quiero hacer un pedido')}" target="_blank" rel="noopener">Pedir por WhatsApp</a></div>
        <ul class="hero-sellos"><li>Hecho a mano en pequeños lotes</li><li>Envíos a Colombia y al mundo</li><li>Pago seguro · Pedidos programados</li></ul>
      </div>
      <div class="hero-visual">${destacados[0]?.imagenPrincipal ? imagenProducto(destacados[0], 900) : `<div class="hero-marca">${WORDMARK_SVG}</div>`}</div>
    </div>
  </section>
  <section class="contenedor seccion">
    ${seccionTitulo('Líneas', 'Encuentra lo que tu piel necesita')}
    <div class="lineas">${lineas.map((c) => `<a class="linea" href="/tienda/${escapar(c.slug)}"><span class="linea-icono">${iconoLinea(c.slug)}</span><b>${escapar(c.nombre)}</b><span class="linea-desc">${escapar(c.descripcion || '')}</span></a>`).join('')}</div>
  </section>
  ${destacados.length ? `<section class="contenedor seccion">${seccionTitulo('Favoritos', 'Los más queridos', '', ['/tienda', 'Ver toda la tienda'])}<div class="rejilla">${destacados.map(tarjetaProducto).join('')}</div></section>` : ''}
  <section class="franja">
    <div class="contenedor franja-int">
      <div>${seccionTitulo('Origen', 'De la tierra Zenú a tu piel', 'Cada producto nace de plantas medicinales de Córdoba y Sucre y del saber de familias artesanas que lo elaboran a mano.', ['/ingredientes', 'Conoce los ingredientes'])}</div>
      <div class="ingredientes-mini">${ingredientes.map((i) => `<a href="/ingredientes/${escapar(i.slug)}">${i.imagenUrl ? `<img src="${escapar(optimizar(i.imagenUrl, 160))}" alt="" loading="lazy" />` : ''}<div><b>${escapar(i.nombre)}</b><span>${escapar((i.beneficios || '').slice(0, 70))}</span></div></a>`).join('')}</div>
    </div>
  </section>
  ${nuevos.length ? `<section class="contenedor seccion">${seccionTitulo('Catálogo', 'Recién hechos', '', ['/tienda', 'Ver todo'])}<div class="rejilla">${nuevos.map(tarjetaProducto).join('')}</div></section>` : ''}
  <section class="contenedor seccion confianza">
    <div><b>Pago seguro</b><span>Tarjetas, PSE, Nequi y más con RAPYD. Precios en Colombia con IVA incluido.</span></div>
    <div><b>Envíos a todo el mundo</b><span>Colombia en 2 a 7 días hábiles. Internacional en 5 a 20 días.</span></div>
    <div><b>Programa tu entrega</b><span>Elige la fecha en que quieres recibir tu pedido.</span></div>
    <div><b>Atención por WhatsApp</b><span>Asesoría, pedidos y seguimiento las 24 horas.</span></div>
  </section>`;
  res.type('html').send(layout({ titulo: '', descripcion: inicio.subtitulo, contenido, ruta: '/', jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: config.tienda.nombre, url: config.publicUrl, sameAs: ['https://www.instagram.com/artesanoboutique_', 'https://www.facebook.com/artesanoboutique1'] } }));
});

function paginaTienda(req, res, categoria) {
  const q = String(req.query.q || '').slice(0, 80);
  const orden = String(req.query.orden || '');
  const ingrediente = String(req.query.ingrediente || '');
  const productos = productosPublicados({ categoria: categoria?.slug, q, orden, ingrediente });
  const lineas = listar('categorias').filter((c) => c.activo !== false);
  const ings = listar('ingredientes').filter((i) => i.activo !== false);
  const titulo = categoria ? categoria.nombre : 'Tienda';
  const contenido = `
  <section class="contenedor seccion">
    ${migas(categoria ? [['/tienda', 'Tienda'], [null, categoria.nombre]] : [[null, 'Tienda']])}
    <div class="seccion-titulo"><div><span class="sobre">Catálogo</span><h1>${categoria ? `<span class="linea-icono grande">${iconoLinea(categoria.slug)}</span>` : ''}${escapar(titulo)}</h1>${categoria?.descripcion ? `<p>${escapar(categoria.descripcion)}</p>` : ''}</div></div>
    <div class="filtros">
      <div class="chips"><a href="/tienda" class="${!categoria ? 'activo' : ''}">Todo</a>${lineas.map((c) => `<a href="/tienda/${escapar(c.slug)}" class="${categoria?.id === c.id ? 'activo' : ''}"><span class="linea-icono mini">${iconoLinea(c.slug)}</span>${escapar(c.nombre)}</a>`).join('')}</div>
      <form class="filtros-form" method="get">
        <input type="search" name="q" value="${escapar(q)}" placeholder="Buscar…" />
        <select name="ingrediente"><option value="">Ingrediente</option>${ings.map((i) => `<option value="${escapar(i.slug)}" ${ingrediente === i.slug ? 'selected' : ''}>${escapar(i.nombre)}</option>`).join('')}</select>
        <select name="orden"><option value="">Relevancia</option><option value="nuevos" ${orden === 'nuevos' ? 'selected' : ''}>Novedades</option><option value="precio_asc" ${orden === 'precio_asc' ? 'selected' : ''}>Menor precio</option><option value="precio_desc" ${orden === 'precio_desc' ? 'selected' : ''}>Mayor precio</option></select>
        <button class="btn secundario" type="submit">Filtrar</button>
      </form>
    </div>
    ${productos.length ? `<div class="rejilla">${productos.map(tarjetaProducto).join('')}</div>` : '<p class="vacio">No encontramos productos con esos filtros. <a href="/tienda">Ver todo</a></p>'}
  </section>`;
  res.type('html').send(layout({ titulo, descripcion: categoria?.descripcion || 'Jabones, cremas, shampoo y lociones artesanales con ingredientes ancestrales Zenú.', contenido, ruta: categoria ? `/tienda/${categoria.slug}` : '/tienda' }));
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
  const galeria = p.imagenes.length ? p.imagenes : [];
  const contenido = `
  <section class="contenedor seccion producto">
    ${migas([['/tienda', 'Tienda'], p.categoria ? [`/tienda/${p.categoria.slug}`, p.categoria.nombre] : null, [null, p.nombre]].filter(Boolean))}
    <div class="producto-int">
      <div class="galeria">
        <div class="galeria-principal" id="galeria-principal">${imagenProducto(p, 1000)}</div>
        ${galeria.length > 1 ? `<div class="galeria-mini">${galeria.map((im, i) => `<img src="${escapar(optimizar(im.url, 200))}" alt="${escapar(im.alt || p.nombre)}" data-grande="${escapar(optimizar(im.url, 1000))}" class="${i === 0 ? 'activo' : ''}" />`).join('')}</div>` : ''}
      </div>
      <div class="ficha">
        <div class="tarjeta-linea">${p.categoria ? `<a href="/tienda/${escapar(p.categoria.slug)}">${escapar(p.categoria.nombre)}</a>` : ''}${p.protagonista ? ` · <a href="/ingredientes/${escapar(p.protagonista.slug)}">${escapar(p.protagonista.nombre)}</a>` : ''}</div>
        <h1>${escapar(p.nombre)}</h1>
        <p class="ficha-corta">${escapar(p.descripcionCorta)}</p>
        <div class="precio grande" id="precio">${formatearCOP(v.precioCop)}</div>
        <div class="mini iva">Precio con IVA incluido (${escapar(NOMBRES_IVA[p.tipoIva] || '')}). Clientes fuera de Colombia pagan en USD sin IVA colombiano.</div>
        ${p.variantes.length > 1 ? `<div class="variantes" id="variantes">${p.variantes.map((x) => `<button class="${x.sku === v.sku ? 'activo' : ''}" data-sku="${escapar(x.sku)}" data-nombre="${escapar(x.nombre)}" data-precio="${x.precioCop}" data-stock="${x.stock}" ${x.stock <= 0 ? 'disabled' : ''}>${escapar(x.nombre)}${x.stock <= 0 ? ' (agotado)' : ''}</button>`).join('')}</div>` : ''}
        <div class="comprar">
          <div class="cantidad"><button type="button" data-d="-1">−</button><input id="cantidad" type="number" min="1" max="50" value="1" /><button type="button" data-d="1">+</button></div>
          ${p.agotado ? '<button class="btn primario grande" disabled>Agotado</button>' : `<button class="btn primario grande agregar" id="agregar" data-sku="${escapar(v.sku)}" data-nombre="${escapar(p.nombre)}" data-variante="${escapar(v.nombre)}" data-precio="${v.precioCop}" data-imagen="${escapar(p.imagenPrincipal || '')}" data-slug="${escapar(p.slug)}">Agregar al carrito</button>`}
        </div>
        <a class="btn secundario grande wa" href="${urlWhatsapp(`Hola Arte'Sano, quiero pedir "${p.nombre}" (${v.sku})`)}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
        <ul class="sellos"><li>Hecho a mano${p.artesano ? ' por ' + escapar(p.artesano.nombre) : ''}</li><li>Envío a Colombia y al mundo</li><li>Programa la fecha de entrega al pagar</li>${p.invima ? `<li>INVIMA/NSO ${escapar(p.invima)}</li>` : ''}</ul>
        ${p.ingredientes.length ? `<div class="bloque"><h3>Ingredientes ancestrales</h3><div class="chips">${p.ingredientes.map((i) => `<a href="/ingredientes/${escapar(i.slug)}">${escapar(i.nombre)}</a>`).join('')}</div></div>` : ''}
        ${p.descripcion ? `<div class="bloque"><h3>Descripción</h3>${p.descripcion}</div>` : ''}
        ${p.beneficios ? `<div class="bloque"><h3>Beneficios</h3>${p.beneficios}</div>` : ''}
        ${p.modoUso ? `<div class="bloque"><h3>Modo de uso</h3>${p.modoUso}</div>` : ''}
        ${p.tipoPiel?.length ? `<div class="bloque"><h3>Ideal para</h3><p>${escapar(p.tipoPiel.join(', '))}</p></div>` : ''}
        ${p.advertencias ? `<div class="bloque mini"><h3>Advertencias</h3><p>${escapar(p.advertencias)}</p></div>` : ''}
      </div>
    </div>
    ${p.artesano ? `<div class="artesano-caja"><div>${p.artesano.fotoUrl ? `<img src="${escapar(optimizar(p.artesano.fotoUrl, 300))}" alt="${escapar(p.artesano.nombre)}" />` : LOGO_SVG}</div><div><span class="sobre">Elaborado por</span><h3><a href="/artesanos/${escapar(p.artesano.slug)}">${escapar(p.artesano.nombre)}</a></h3><p>${escapar(p.artesano.municipio || '')}${p.artesano.departamento ? ', ' + escapar(p.artesano.departamento) : ''}</p><p>${escapar((p.artesano.bio || '').slice(0, 220))}</p></div></div>` : ''}
    ${relacionados.length ? `<div class="seccion">${seccionTitulo('También te puede gustar', 'De la misma línea')}<div class="rejilla">${relacionados.map(tarjetaProducto).join('')}</div></div>` : ''}
  </section>`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.nombre, description: p.descripcionCorta, sku: v.sku,
    image: p.imagenes.map((i) => i.url), brand: { '@type': 'Brand', name: config.tienda.nombre },
    offers: { '@type': 'Offer', url: `${config.publicUrl}/producto/${p.slug}`, priceCurrency: 'COP', price: v.precioCop, availability: p.agotado ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' },
  };
  res.type('html').send(layout({ titulo: p.seoTitulo || p.nombre, descripcion: p.seoDescripcion || p.descripcionCorta, contenido, ruta: `/producto/${p.slug}`, imagen: p.imagenPrincipal, jsonLd }));
});

tiendaRouter.get('/ingredientes', (_req, res) => {
  const ings = listar('ingredientes').filter((i) => i.activo !== false);
  const contenido = `<section class="contenedor seccion">${migas([[null, 'Ingredientes']])}
    <div class="seccion-titulo"><div><span class="sobre">Origen</span><h1>Ingredientes ancestrales</h1><p>Plantas medicinales del territorio Zenú (Córdoba y Sucre) usadas por generaciones y hoy en tus productos de cuidado personal.</p></div></div>
    <div class="rejilla ingredientes">${ings.map((i) => `<a class="tarjeta-ingrediente" href="/ingredientes/${escapar(i.slug)}">${i.imagenUrl ? `<img src="${escapar(optimizar(i.imagenUrl, 500))}" alt="${escapar(i.nombre)}" loading="lazy" />` : `<div class="sin-imagen">${LOGO_SVG}</div>`}<div><h3>${escapar(i.nombre)}</h3>${i.nombreCientifico ? `<i>${escapar(i.nombreCientifico)}</i>` : ''}<p>${escapar(i.beneficios || '')}</p></div></a>`).join('')}</div></section>`;
  res.type('html').send(layout({ titulo: 'Ingredientes ancestrales', descripcion: 'Guásimo, arroz, mataratón, coco y chopo: plantas de la cultura Zenú en cosmética artesanal.', contenido, ruta: '/ingredientes' }));
});

tiendaRouter.get('/ingredientes/:slug', (req, res, next) => {
  const i = obtenerPorSlug('ingredientes', req.params.slug);
  if (!i || i.activo === false) return next();
  const productos = productosPublicados({ ingrediente: i.slug });
  const contenido = `<section class="contenedor seccion">${migas([['/ingredientes', 'Ingredientes'], [null, i.nombre]])}
    <div class="ingrediente-int">
      <div>${i.imagenUrl ? `<img src="${escapar(optimizar(i.imagenUrl, 900))}" alt="${escapar(i.nombre)}" />` : `<div class="sin-imagen">${LOGO_SVG}<span>${escapar(i.nombre)}</span></div>`}</div>
      <div><span class="sobre">Ingrediente ancestral</span><h1>${escapar(i.nombre)}</h1>${i.nombreCientifico ? `<p class="cientifico">${escapar(i.nombreCientifico)}</p>` : ''}
        ${i.region ? `<p><b>Origen:</b> ${escapar(i.region)}</p>` : ''}
        ${i.usoAncestral ? `<h3>Uso ancestral Zenú</h3><p>${escapar(i.usoAncestral)}</p>` : ''}
        ${i.beneficios ? `<h3>Beneficios</h3><p>${escapar(i.beneficios)}</p>` : ''}</div>
    </div>
    ${productos.length ? `<div class="seccion">${seccionTitulo('Productos', `Con ${i.nombre}`)}<div class="rejilla">${productos.map(tarjetaProducto).join('')}</div></div>` : ''}</section>`;
  res.type('html').send(layout({ titulo: i.nombre, descripcion: (i.beneficios || i.usoAncestral || '').slice(0, 160), contenido, ruta: `/ingredientes/${i.slug}`, imagen: i.imagenUrl }));
});

tiendaRouter.get('/artesanos', (_req, res) => {
  const arts = listar('artesanos').filter((a) => a.activo !== false);
  const contenido = `<section class="contenedor seccion">${migas([[null, 'Artesanos']])}
    <div class="seccion-titulo"><div><span class="sobre">Las manos</span><h1>Nuestros artesanos</h1><p>Familias y comunidades del resguardo Zenú que elaboran cada producto con el saber heredado de sus mayores.</p></div></div>
    <div class="rejilla artesanos">${arts.map((a) => `<a class="tarjeta-artesano" href="/artesanos/${escapar(a.slug)}">${a.fotoUrl ? `<img src="${escapar(optimizar(a.fotoUrl, 500))}" alt="${escapar(a.nombre)}" loading="lazy" />` : `<div class="sin-imagen">${LOGO_SVG}</div>`}<div><h3>${escapar(a.nombre)}</h3><p>${escapar(a.municipio || '')}${a.departamento ? ', ' + escapar(a.departamento) : ''}</p></div></a>`).join('') || '<p class="vacio">Pronto conocerás a nuestros artesanos.</p>'}</div></section>`;
  res.type('html').send(layout({ titulo: 'Artesanos', descripcion: 'Conoce a las familias artesanas Zenú de Córdoba y Sucre que elaboran nuestros productos.', contenido, ruta: '/artesanos' }));
});

tiendaRouter.get('/artesanos/:slug', (req, res, next) => {
  const a = obtenerPorSlug('artesanos', req.params.slug);
  if (!a || a.activo === false) return next();
  const productos = productosPublicados({ artesano: a.slug });
  const contenido = `<section class="contenedor seccion">${migas([['/artesanos', 'Artesanos'], [null, a.nombre]])}
    <div class="ingrediente-int"><div>${a.fotoUrl ? `<img src="${escapar(optimizar(a.fotoUrl, 900))}" alt="${escapar(a.nombre)}" />` : `<div class="sin-imagen">${LOGO_SVG}</div>`}</div>
      <div><span class="sobre">Artesano</span><h1>${escapar(a.nombre)}</h1><p><b>${escapar(a.municipio || '')}${a.departamento ? ', ' + escapar(a.departamento) : ''}</b></p><p>${escapar(a.bio || '')}</p></div></div>
    ${productos.length ? `<div class="seccion">${seccionTitulo('Productos', `Elaborados por ${a.nombre}`)}<div class="rejilla">${productos.map(tarjetaProducto).join('')}</div></div>` : ''}</section>`;
  res.type('html').send(layout({ titulo: a.nombre, descripcion: (a.bio || '').slice(0, 160), contenido, ruta: `/artesanos/${a.slug}`, imagen: a.fotoUrl }));
});

tiendaRouter.get('/nosotros', (_req, res) => {
  const contenido = `<section class="contenedor seccion texto">${migas([[null, 'Nuestra historia']])}
    <span class="sobre">Arte + Sano</span><h1>Belleza con raíces</h1>
    <p><b>${escapar(config.tienda.nombre)}</b> es una startup de cuidado de la belleza con productos de origen ancestral. Nacimos en la sabana de Córdoba y Sucre, territorio del pueblo Zenú, donde las plantas medicinales y los saberes heredados siguen vivos en cada patio y cada cocina.</p>
    <p>Elaboramos jabones de tocador, cremas, shampoo y lociones a mano, en pequeños lotes, con ingredientes como el <a href="/ingredientes/guasimo">guásimo</a>, el <a href="/ingredientes/arroz">arroz</a>, el <a href="/ingredientes/mataraton">mataratón</a>, el <a href="/ingredientes/coco">coco</a> y el <a href="/ingredientes/chopo">chopo</a>. Cada producto cuenta la historia de las familias artesanas que lo hacen posible.</p>
    <h2>Aliados</h2>
    <p>Crecemos de la mano de programas de fortalecimiento empresarial como <b>ZASCA</b> y del <b>Ministerio de Industria, Comercio y Turismo</b>, entre otros aliados que creen en el talento artesanal colombiano.</p>
    <h2>Nuestro compromiso</h2>
    <ul><li>Fórmulas naturales, sin parabenos ni sulfatos.</li><li>Comercio justo con las comunidades artesanas.</li><li>Empaques de cartón y fibras naturales.</li><li>Envíos a Colombia y a cualquier lugar del mundo.</li></ul>
    <p><a class="btn primario grande" href="/tienda">Conoce la tienda</a></p></section>`;
  res.type('html').send(layout({ titulo: 'Nuestra historia', descripcion: 'Arte\'Sano: startup de belleza con productos artesanales de origen ancestral Zenú.', contenido, ruta: '/nosotros' }));
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
    <p>Los pagos se procesan de forma segura a través de RAPYD (tarjetas, PSE, Nequi y otros medios según el país). Los precios en Colombia incluyen IVA; las ventas internacionales se facturan como exportación (IVA 0 %) en dólares.</p>
    <h2 id="terminos">Términos y condiciones</h2>
    <p>Al comprar en ${escapar(config.tienda.nombre)} aceptas estas políticas y nuestra <a href="/privacidad">política de tratamiento de datos personales</a> (Ley 1581 de 2012). Para cualquier consulta escríbenos a ${escapar(config.correo.contacto)} o por WhatsApp.</p></section>`;
  res.type('html').send(layout({ titulo: 'Políticas', descripcion: 'Envíos, devoluciones, pedidos programados, pagos y términos de Arte\'Sano.', contenido, ruta: '/politicas' }));
});

tiendaRouter.get('/carrito', (_req, res) => {
  const contenido = `<section class="contenedor seccion carrito-pagina">${migas([[null, 'Carrito']])}
    <h1>Tu carrito</h1>
    <div id="carrito-vacio" class="vacio" hidden>Tu carrito está vacío. <a href="/tienda">Descubre nuestros productos</a>.</div>
    <div class="carrito-int" id="carrito-int" hidden>
      <div id="carrito-lista"></div>
      <aside class="resumen">
        <h3>Resumen</h3>
        <div class="fila"><span>Subtotal (con IVA)</span><b id="carrito-subtotal"></b></div>
        <p class="mini">El envío y el desglose de IVA se calculan en el siguiente paso según tu ciudad o país.</p>
        <a class="btn primario grande" href="/checkout">Ir a pagar</a>
        <a class="btn secundario grande" href="/tienda">Seguir comprando</a>
      </aside>
    </div></section>`;
  res.type('html').send(layout({ titulo: 'Carrito', descripcion: 'Tu carrito de compras.', contenido, ruta: '/carrito' }));
});

tiendaRouter.get('/checkout', (_req, res) => {
  const pp = ajuste('pedidosProgramados');
  const hoy = new Date();
  const fmt = (d) => d.toISOString().slice(0, 10);
  const min = fmt(new Date(hoy.getTime() + pp.minDias * 86400000));
  const max = fmt(new Date(hoy.getTime() + pp.maxDias * 86400000));
  const contenido = `<section class="contenedor seccion checkout">${migas([['/carrito', 'Carrito'], [null, 'Pagar']])}
    <h1>Finalizar compra</h1>
    <div class="checkout-int">
      <form id="checkout-form" class="checkout-form" novalidate>
        <h3>1. Tus datos</h3>
        <div class="grid2"><label>Nombre completo<input name="nombre" required autocomplete="name" /></label><label>Correo<input name="email" type="email" required autocomplete="email" /></label></div>
        <label>Teléfono / WhatsApp<input name="telefono" required autocomplete="tel" placeholder="+57 300 000 0000" /></label>
        <h3>2. Dirección de entrega</h3>
        <label>País<select name="pais" id="pais">${PAISES.map(([c, n]) => `<option value="${c}">${escapar(n)}</option>`).join('')}</select></label>
        <div class="grid2"><label>Ciudad<input name="ciudad" id="ciudad" required autocomplete="address-level2" /></label><label>Departamento / Estado<input name="departamento" autocomplete="address-level1" /></label></div>
        <label>Dirección<input name="linea1" required autocomplete="address-line1" placeholder="Calle, número, barrio" /></label>
        <div class="grid2"><label>Apartamento, referencia (opcional)<input name="linea2" autocomplete="address-line2" /></label><label>Código postal (opcional)<input name="codigoPostal" autocomplete="postal-code" /></label></div>
        <h3>3. ¿Cuándo quieres recibirlo?</h3>
        <div class="opciones-fecha"><label class="radio"><input type="radio" name="cuando" value="ya" checked /> Lo antes posible</label><label class="radio"><input type="radio" name="cuando" value="programar" /> Programar una fecha</label></div>
        <label id="fecha-caja" hidden>Fecha de entrega<input type="date" name="programadoPara" min="${min}" max="${max}" /></label>
        <label>Nota para tu pedido (opcional)<textarea name="nota" rows="2" placeholder="Es un regalo, dejar en portería, etc."></textarea></label>
        <label class="radio consent"><input type="checkbox" name="acepto" required /> Acepto las <a href="/politicas" target="_blank">políticas</a> y el <a href="/privacidad" target="_blank">tratamiento de mis datos</a>.</label>
        <div class="error" id="checkout-error"></div>
        <button class="btn primario grande" id="pagar" type="submit">Pagar de forma segura</button>
        <p class="mini">Serás redirigido a la pasarela de pagos RAPYD. ${rapydActivo() ? '' : '<b>Pasarela en configuración:</b> tu pedido quedará registrado y te contactaremos por WhatsApp para completar el pago.'}</p>
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
  res.type('html').send(layout({ titulo: 'Pagar', descripcion: 'Finaliza tu compra de forma segura.', contenido, ruta: '/checkout' }));
});

function paginaPedido(res, p, mensaje = '') {
  const t = p.totales, m = p.moneda;
  const contenido = `<section class="contenedor seccion pedido-pagina">${migas([[null, 'Pedido ' + p.numero]])}
    ${mensaje ? `<div class="aviso-ok">${mensaje}</div>` : ''}
    <h1>Pedido ${escapar(p.numero)} <span class="chip ${escapar(p.estado)}">${escapar(NOMBRES_ESTADO[p.estado] || p.estado)}</span></h1>
    <div class="pedido-int">
      <div>
        <h3>Productos</h3>
        ${p.items.map((l) => `<div class="pedido-item">${l.imagenUrl ? `<img src="${escapar(optimizar(l.imagenUrl, 200))}" alt="" />` : `<div class="sin-imagen mini">${LOGO_SVG}</div>`}<div><b>${escapar(l.productoNombre)}</b><br /><small>${escapar(l.varianteNombre)} · ${l.cantidad} × ${formatear(l.precioUnitario + l.ivaUnitario, m)}</small></div><b>${formatear(l.total, m)}</b></div>`).join('')}
        <h3>Entrega</h3>
        <p>${escapar(p.direccion.linea1)}${p.direccion.linea2 ? ', ' + escapar(p.direccion.linea2) : ''}<br />${escapar(p.direccion.ciudad)}${p.direccion.departamento ? ', ' + escapar(p.direccion.departamento) : ''} · ${escapar(p.direccion.pais)}<br /><small>${escapar(p.envio.transportadora)} · ${escapar(p.envio.dias)}</small></p>
        ${p.programadoPara ? `<p><b>📅 Entrega programada:</b> ${escapar(p.programadoPara)}</p>` : ''}
        ${p.guia ? `<p><b>Guía:</b> ${escapar(p.guia)} ${p.urlSeguimiento ? `· <a href="${escapar(p.urlSeguimiento)}" target="_blank" rel="noopener">Rastrear envío</a>` : ''}</p>` : ''}
        <h3>Historial</h3>
        <ul class="historial">${p.historial.map((h) => `<li><small>${new Date(h.ts).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</small> · ${escapar(NOMBRES_ESTADO[h.estado] || h.estado)}${h.nota && !/ref /.test(h.nota) ? ' · ' + escapar(h.nota) : ''}</li>`).join('')}</ul>
      </div>
      <aside class="resumen">
        <h3>Resumen</h3>
        <div class="fila"><span>Subtotal sin IVA</span><b>${formatear(t.subtotal, m)}</b></div>
        <div class="fila"><span>IVA${p.regimen === 'exportacion' ? ' (exportación 0 %)' : ''}</span><b>${formatear(t.iva, m)}</b></div>
        <div class="fila"><span>Envío${p.envio.gratis ? ' (gratis)' : ''}</span><b>${formatear(t.envio + t.envioIva, m)}</b></div>
        <div class="fila total"><span>Total</span><b>${formatear(t.total, m)}</b></div>
        ${p.estado === 'pendiente_pago' ? (p.urlPago ? `<a class="btn primario grande" href="${escapar(p.urlPago)}">Pagar ahora</a>` : `<a class="btn primario grande" href="${urlWhatsapp(`Hola Arte'Sano, quiero completar el pago del pedido ${p.numero}`)}" target="_blank" rel="noopener">Completar pago por WhatsApp</a>`) : ''}
        <a class="btn secundario grande" href="${urlWhatsapp(`Hola Arte'Sano, tengo una consulta sobre mi pedido ${p.numero}`)}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
      </aside>
    </div></section>`;
  res.type('html').send(layout({ titulo: 'Pedido ' + p.numero, descripcion: 'Estado de tu pedido.', contenido, ruta: '/pedido/' + p.numero, cuerpoClase: 'sin-indexar' }));
}

tiendaRouter.get('/pedido/:numero', (req, res, next) => {
  const p = obtenerPorNumero(req.params.numero);
  if (!p) return next();
  paginaPedido(res, p);
});

tiendaRouter.get('/pago/gracias', (req, res) => {
  const p = obtenerPorNumero(req.query.p);
  if (!p) return res.redirect('/');
  paginaPedido(res, p, p.estado === 'pendiente_pago'
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

/** Crea el pedido y devuelve la URL de pago de RAPYD. */
tiendaRouter.post('/api/pedidos', async (req, res) => {
  try {
    const pedido = crearPedido({ ...(req.body || {}), canal: 'web' });
    let urlPago = '';
    if (rapydActivo()) {
      try {
        const ck = await crearCheckout(pedido);
        if (ck) { asignarCheckout(pedido.id, ck.checkoutId, ck.redirectUrl); urlPago = ck.redirectUrl; }
      } catch (err) {
        console.error('[checkout] RAPYD no creó el checkout:', err.message);
        actualizarEstado(pedido.id, 'pendiente_pago', 'Error creando checkout RAPYD: ' + err.message);
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
