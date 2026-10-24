// ============================================================
//  semilla.datos.js — Datos puros del catálogo real de Arte'Sano
//  (sin dependencias de almacenamiento), para que puedan usarse tanto
//  desde semilla.js (siembra local) como desde scripts de migración
//  externos (p. ej. contra producción vía la API del panel admin).
//
//  Datos e imágenes extraídos de la página de Facebook de la marca
//  (facebook.com/artesanoboutique1) y del catálogo compartido por el
//  negocio. Las fotos son las de mejor calidad disponibles en Facebook
//  (src/tienda/publico/imagenes/productos/); los productos sin fotografía
//  profesional usan una etiqueta diseñada con el mismo esquema del
//  empaque real — kraft + cordel + rama botánica (ver etiquetas.js,
//  src/tienda/publico/imagenes/etiquetas/).
//
//  ⚠️ Precios: el negocio aún no ha confirmado precios reales, así que
//  se usan valores de referencia (etiqueta "precio-de-ejemplo") a la
//  espera del listado definitivo.
// ============================================================

export const CATEGORIAS = [
  { slug: 'cuidado-del-cuerpo', nombre: 'Cuidado del Cuerpo', descripcion: 'Jabones y cremas artesanales para la limpieza e hidratación diaria.', orden: 1 },
  { slug: 'cuidado-facial', nombre: 'Cuidado Facial', descripcion: 'Jabones artesanales para la limpieza y frescura del rostro.', orden: 2 },
  { slug: 'lineas-especializadas', nombre: 'Líneas Especializadas', descripcion: 'Cuidado del cabello y productos de tradición Zenú.', orden: 4 },
  { slug: 'aseo', nombre: 'Aseo', descripcion: 'Higiene personal de uso diario.', orden: 5 },
  { slug: 'hogar', nombre: 'Hogar', descripcion: 'Para el cuidado del hogar.', orden: 6 },
  { slug: 'otros', nombre: 'Otros', descripcion: 'Kits, alimentos tradicionales y ediciones especiales.', orden: 7 },
];

const INGREDIENTES_BASE = [
  {
    slug: 'arroz', nombre: 'Arroz', nombreCientifico: 'Oryza sativa', region: 'Sabanas de Córdoba y Sucre',
    usoAncestral: 'El agua y el almidón de arroz se usan tradicionalmente en la región Caribe para aclarar y suavizar la piel. Arte\'Sano lo trabaja con técnica oriental.',
    beneficios: 'Suaviza e ilumina la piel.',
  },
  {
    slug: 'guasimo', nombre: 'Guásimo', nombreCientifico: 'Guazuma ulmifolia', region: 'Bosque seco tropical de Córdoba y Sucre',
    usoAncestral: 'Técnica ancestral de la mujer Zenú para proteger y limpiar el cabello.',
    beneficios: 'Limpia de forma natural, protege el color del cabello, suaviza, humecta e intensifica el brillo.',
  },
  {
    slug: 'mataraton', nombre: 'Matarratón', nombreCientifico: 'Gliricidia sepium', region: 'Cercas vivas y patios de Córdoba y Sucre',
    usoAncestral: 'Planta de las cercas vivas y los patios de la sabana, de uso tradicional en Córdoba y Sucre.',
    beneficios: 'En nuestro jabón artesanal se usa el sumo de la maceración de sus tallos para una limpieza suave de la piel y del cuero cabelludo.',
  },
  {
    slug: 'coco', nombre: 'Coco', nombreCientifico: 'Cocos nucifera', region: 'Costa Caribe colombiana',
    usoAncestral: 'El aceite de coco es base tradicional de jabones y ungüentos en toda la costa.',
    beneficios: 'Excelente alternativa para humectar y dar brillo a la piel.',
  },
  {
    slug: 'chopo', nombre: 'Chopo', nombreCientifico: '', region: 'Córdoba y Sucre',
    usoAncestral: 'Alimento tradicional del pueblo Zenú, preparado en colada desde hace generaciones.',
    beneficios: 'Alimento tradicional sin gluten, preparado en colada.',
  },
  {
    slug: 'calendula', nombre: 'Caléndula', nombreCientifico: 'Calendula officinalis', region: 'Córdoba y Sucre',
    usoAncestral: 'Planta cultivada y valorada por generaciones en Sucre.',
    beneficios: 'Sensación de frescura, amigable con todo tipo de piel.',
  },
  {
    slug: 'pepino', nombre: 'Pepino', nombreCientifico: 'Cucumis sativus', region: 'Córdoba y Sucre',
    usoAncestral: 'Usado tradicionalmente para refrescar y controlar la grasa de la piel.',
    beneficios: 'Refresca y ayuda a controlar el brillo excesivo del rostro.',
  },
  {
    slug: 'carbon-activado', nombre: 'Carbón Activado', nombreCientifico: '', region: 'Córdoba y Sucre',
    usoAncestral: 'Purificante natural de uso tradicional, combinado aquí con canela.',
    beneficios: 'Limpia los poros, purifica y revitaliza la piel.',
  },
  {
    slug: 'aguacate', nombre: 'Aguacate', nombreCientifico: 'Persea americana', region: 'Córdoba y Sucre',
    usoAncestral: 'Fruto de uso tradicional en el cuidado de la piel en la región Caribe.',
    beneficios: 'Nutre, humecta y limpia la piel.',
  },
  {
    slug: 'hierbabuena', nombre: 'Hierbabuena', nombreCientifico: 'Mentha spicata', region: 'Córdoba y Sucre',
    usoAncestral: 'Planta aromática tradicional de Sucre, de aroma fresco y mentolado.',
    beneficios: 'Aroma fresco y mentolado; ingrediente de nuestro bálsamo y de nuestro destilado.',
  },
  {
    slug: 'rosas', nombre: 'Rosas', nombreCientifico: 'Rosa damascena', region: 'Colombia',
    usoAncestral: 'Flor tradicionalmente usada en el cuidado capilar y de la piel.',
    beneficios: 'Belleza natural para un cabello fuerte, brillante y lleno de vida.',
  },
];

// Insignia botánica ilustrada por Arte'Sano (ver src/tienda/ilustraciones.js)
// para cada ingrediente ancestral — reemplaza el placeholder genérico en
// /ingredientes y en la ficha de cada planta.
export const INGREDIENTES = INGREDIENTES_BASE.map((i) => ({
  ...i,
  imagenUrl: `/publico/imagenes/ingredientes/${i.slug}.svg`,
}));

export const ARTESANOS = [
  {
    slug: 'arte-sano-boutique', nombre: 'Arte\'Sano Boutique', municipio: 'Origen Zenú', departamento: 'Córdoba y Sucre',
    bio: 'Marca artesanal elaborada en Sucre, Colombia. Participante activa de ferias regionales (Feria del Sombrero Vueltiao, Feria de la Juventud, ExpoMadres) y aliada del programa ZASCA para el fortalecimiento de emprendimientos artesanales.',
    fotoUrl: '/publico/imagenes/artesanos/arte-sano-boutique.jpg',
  },
];

// Precios y stock definitivos (lista confirmada por el negocio el 2026-10-18; precio en COP con IVA
// incluido). Fuente unica: la semilla los aplica a los productos y la migracion "precios definitivos"
// los aplica al catalogo que ya vive en PostgreSQL. El precio en USD queda sin fijar (se calcula desde COP).
export const PRECIOS_DEFINITIVOS = {
  'AS-GUASIMO-SHP-250': { precioCop: 60000, stock: 20 },
  'AS-GUASIMO-ACOND-100': { precioCop: 45000, stock: 20 },
  'AS-MATARRATON-100': { precioCop: 20000, stock: 20 },
  'AS-PEPINO-100': { precioCop: 20000, stock: 24 },
  'AS-ARROZ-100': { precioCop: 20000, stock: 30 },
  'AS-KIT-ROSAS': { precioCop: 55000, stock: 10 },
  'AS-DESO-MINERAL-60': { precioCop: 20000, stock: 25 },
  'AS-CALENDULA-30': { precioCop: 22000, stock: 20 },
  'AS-PORCELANA-120': { precioCop: 28000, stock: 15 },
};

function aplicarPrecioDefinitivo(p) {
  const variantes = p.variantes.map((v) => {
    const d = PRECIOS_DEFINITIVOS[v.sku];
    return d ? { ...v, precioCop: d.precioCop, stock: d.stock, precioUsd: null } : v;
  });
  const porDefecto = variantes.find((v) => v.porDefecto) || variantes[0];
  return { ...p, variantes, precioCop: porDefecto.precioCop, precioUsd: null, etiquetas: [] };
}

export function productos(ids) {
  const cat = (slug) => ids.categorias[slug];
  const ing = (slug) => ids.ingredientes[slug];
  const art = ids.artesanos['arte-sano-boutique'];
  const comunes = { artesanoId: art, tipoIva: 'iva_19', precioIncluyeIva: true, estado: 'publicado', etiquetas: ['precio-de-ejemplo'] };
  const foto = (archivo) => [{ url: `/publico/imagenes/productos/${archivo}`, alt: '' }];
  const etiqueta = (slug) => [{ url: `/publico/imagenes/etiquetas/${slug}.svg`, alt: '' }];

  const lista = [
    // ---------- Cuidado del Cuerpo ----------
    {
      ...comunes, nombre: 'Jabón de Arroz', slug: 'jabon-de-arroz', destacado: true,
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [ing('arroz')], ingredienteProtagonistaId: ing('arroz'),
      descripcionCorta: 'Aclara y suaviza tu piel. Técnica oriental.',
      descripcion: '<p>Jabón 100% natural elaborado con arroz (<i>Oryza sativa</i>). Nutre, aclara y humecta la piel.</p>',
      beneficios: '<ul><li>Nutre, aclara y humecta</li><li>Técnica oriental</li><li>100% natural</li></ul>',
      modoUso: '<p>Humedece la piel, frota el jabón hasta formar espuma, masajea suavemente y enjuaga.</p>',
      tipoPiel: ['todo tipo'], pesoGramos: 100, precioCop: 18000, precioUsd: 6.5,
      imagenes: [...foto('arroz.jpg'), ...foto('arroz-2.jpg'), ...foto('arroz-3.jpg')],
      variantes: [{ sku: 'AS-ARROZ-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 30, porDefecto: true }],
    },
    // ---------- Cuidado Facial ----------
    {
      ...comunes, nombre: 'Jabón de Pepino', slug: 'jabon-de-pepino', destacado: true,
      categoriaId: cat('cuidado-facial'), ingredienteIds: [ing('pepino')], ingredienteProtagonistaId: ing('pepino'),
      descripcionCorta: 'Jabón artesanal con sumo de pepino: limpia, refresca y ayuda a controlar el brillo del rostro.',
      descripcion: '<p>Jabón artesanal con sumo de pepino (<i>Cucumis sativus</i>). Limpia y refresca la piel del rostro y ayuda a neutralizar el brillo excesivo.</p>',
      beneficios: '<ul><li>100% natural y artesanal</li><li>Limpia y refresca</li><li>Ayuda a controlar el brillo facial</li></ul>',
      modoUso: '<p>Aplicar sobre el rostro húmedo, masajear suavemente y enjuagar.</p>',
      tipoPiel: ['grasa', 'mixta'], pesoGramos: 100, precioCop: 18000, precioUsd: 6.5,
      imagenes: [...foto('pepino-2.png'), ...foto('pepino.jpg')],
      variantes: [{ sku: 'AS-PEPINO-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 25, porDefecto: true }],
    },
    // ---------- Corporal ----------
    {
      ...comunes, nombre: 'Crema Piel de Porcelana', slug: 'crema-piel-de-porcelana',
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [], ingredienteProtagonistaId: null,
      descripcionCorta: 'Técnica oriental. Aclara la piel y conserva su tono natural.',
      descripcion: '<p>Crema corporal elaborada con técnica oriental. Nutre, humecta, limpia y purifica, con un aroma y textura agradables.</p>',
      beneficios: '<ul><li>Aclara la piel y conserva su tono natural</li><li>Nutre y humecta</li><li>Limpia y purifica</li></ul>',
      modoUso: '<p>Aplicar sobre la piel limpia con masajes circulares.</p>',
      tipoPiel: ['todo tipo'], pesoGramos: 120, precioCop: 28000, precioUsd: 10,
      imagenes: foto('piel-de-porcelana.jpg'),
      variantes: [{ sku: 'AS-PORCELANA-120', nombre: '120 ml', precioCop: 28000, precioUsd: 10, stock: 15, porDefecto: true }],
    },

    // ---------- Líneas Especializadas ----------
    {
      ...comunes, nombre: 'Jabón de Matarratón', slug: 'jabon-de-mataraton', destacado: true,
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('mataraton')], ingredienteProtagonistaId: ing('mataraton'),
      descripcionCorta: 'Jabón artesanal con sumo de matarratón, planta de las cercas vivas de la sabana.',
      descripcion: '<p>Jabón artesanal elaborado con sumo de matarratón (<i>Gliricidia sepium</i>), planta de las cercas vivas de Córdoba y Sucre, obtenido de la maceración de sus tallos. Limpieza suave para la piel y el cuero cabelludo.</p>',
      beneficios: '<ul><li>Limpieza suave de la piel y del cuero cabelludo</li><li>Con sumo de matarratón</li><li>Hecho a mano en pequeños lotes</li></ul>',
      modoUso: '<p>Humedece la piel o el cabello, forma espuma con el jabón, masajea suavemente y enjuaga.</p>',
      advertencias: 'Uso externo. Suspender si hay irritación.',
      tipoPiel: ['todo tipo'], pesoGramos: 100, precioCop: 20000, precioUsd: 7.2,
      imagenes: [...foto('mataraton-1.jpg'), ...foto('mataraton.jpg'), ...foto('mataraton-3.png')],
      variantes: [{ sku: 'AS-MATARRATON-100', nombre: '100 g', precioCop: 20000, precioUsd: 7.2, stock: 20, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Shampoo y Acondicionador de Guásimo', slug: 'shampoo-de-guasimo', destacado: true,
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('guasimo')], ingredienteProtagonistaId: ing('guasimo'),
      descripcionCorta: 'Técnica ancestral de la mujer Zenú para limpiar y proteger el cabello.',
      descripcion: '<p>Shampoo y acondicionador natural elaborado con guásimo (<i>Guazuma ulmifolia</i>), técnica ancestral de la mujer Zenú para proteger y limpiar el cabello.</p>',
      beneficios: '<ul><li>Nutre y fortalece el cabello</li><li>Protege el color del cabello</li><li>Limpieza natural</li><li>Suaviza y humecta</li><li>Intensifica el brillo natural</li></ul>',
      modoUso: '<p>Aplica el shampoo sobre el cabello húmedo, masajea el cuero cabelludo y enjuaga. Sigue con el acondicionador de puntas a medios.</p>',
      tipoPiel: ['todo tipo de cabello'], pesoGramos: 260, precioCop: 32000, precioUsd: 11.5,
      imagenes: [...foto('guasimo-shampoo-2.jpg'), ...foto('guasimo-shampoo-4.png')],
      variantes: [
        { sku: 'AS-GUASIMO-SHP-250', nombre: 'Shampoo 250 ml', precioCop: 32000, precioUsd: 11.5, stock: 20, porDefecto: true },
        { sku: 'AS-GUASIMO-ACOND-100', nombre: 'Acondicionador 100 ml', precioCop: 22000, precioUsd: 8, stock: 20 },
      ],
    },
    {
      ...comunes, nombre: 'Ungüento de Caléndula', slug: 'unguento-de-calendula',
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('calendula')], ingredienteProtagonistaId: ing('calendula'),
      descripcionCorta: 'Ungüento artesanal de caléndula, de textura suave y sensación de frescura.',
      descripcion: '<p>Ungüento artesanal elaborado con caléndula (<i>Calendula officinalis</i>), planta tradicional de Sucre. Textura suave y sensación de frescura, amigable con todo tipo de piel.</p>',
      beneficios: '<ul><li>Con caléndula</li><li>Sensación de frescura</li><li>Para todo tipo de piel</li></ul>',
      modoUso: '<p>Aplicar una pequeña cantidad sobre la piel y masajear suavemente.</p>',
      advertencias: 'Uso externo. No aplicar sobre heridas abiertas.',
      tipoPiel: ['todo tipo'], pesoGramos: 30, precioCop: 22000, precioUsd: 8,
      imagenes: etiqueta('calendula'),
      variantes: [{ sku: 'AS-CALENDULA-30', nombre: '30 g', precioCop: 22000, precioUsd: 8, stock: 20, porDefecto: true }],
    },
    // ---------- Aseo ----------
    {
      ...comunes, nombre: 'Desodorante Protección Mineral', slug: 'desodorante-proteccion-mineral',
      categoriaId: cat('aseo'), ingredienteIds: [], ingredienteProtagonistaId: null,
      descripcionCorta: 'Desodorante natural en spray. Protección 24 horas, no mancha la ropa.',
      descripcion: '<p>Desodorante natural en spray elaborado a partir de ingredientes naturales. No mancha la ropa.</p>',
      beneficios: '<ul><li>Ingredientes naturales</li><li>Protección 24 horas</li><li>No mancha la ropa</li></ul>',
      modoUso: '<p>Aplicar directamente en las axilas, limpias y secas.</p>',
      tipoPiel: ['sensible'], pesoGramos: 60, precioCop: 20000, precioUsd: 7.2,
      imagenes: [...foto('proteccion-mineral.jpg'), ...foto('proteccion-mineral-2.jpg')],
      variantes: [{ sku: 'AS-DESO-MINERAL-60', nombre: 'Spray 60 ml', precioCop: 20000, precioUsd: 7.2, stock: 25, porDefecto: true }],
    },
    // ---------- Otros ----------
    {
      ...comunes, nombre: 'Kit Rosas para Mamá', slug: 'kit-rosas-para-mama',
      categoriaId: cat('otros'), ingredienteIds: [ing('rosas')], ingredienteProtagonistaId: ing('rosas'),
      descripcionCorta: 'Belleza natural, amor que se nota. Cabello fuerte, brillante y lleno de vida.',
      descripcion: '<p>Kit de regalo con jabón de rosas, spray capilar "Descapilar" y loción en roll-on. Porque mamá se merece lo mejor todos los días.</p>',
      beneficios: '<ul><li>Jabón de Rosas</li><li>Spray "Descapilar"</li><li>Roll-on</li></ul>',
      tipoPiel: [], pesoGramos: 300, precioCop: 55000, precioUsd: 20,
      imagenes: foto('kit-rosas.jpg'),
      variantes: [{ sku: 'AS-KIT-ROSAS', nombre: 'Kit completo', precioCop: 55000, precioUsd: 20, stock: 10, porDefecto: true }],
    },
  ];
  return lista.map(aplicarPrecioDefinitivo);
}
