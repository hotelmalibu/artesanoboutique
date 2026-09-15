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
  { slug: 'cuidado-del-cuerpo', nombre: 'Cuidado del Cuerpo', descripcion: 'Jabones artesanales para la limpieza e hidratación diaria.', orden: 1 },
  { slug: 'cuidado-facial', nombre: 'Cuidado Facial', descripcion: 'Jabones medicinales para el rostro: control de grasa, acné y poros.', orden: 2 },
  { slug: 'corporal', nombre: 'Corporal', descripcion: 'Cremas y lociones para el cuidado del cuerpo.', orden: 3 },
  { slug: 'lineas-especializadas', nombre: 'Líneas Especializadas', descripcion: 'Capilar, medicinales y de alivio terapéutico.', orden: 4 },
  { slug: 'aseo', nombre: 'Aseo', descripcion: 'Higiene personal de uso diario.', orden: 5 },
  { slug: 'hogar', nombre: 'Hogar', descripcion: 'Para el cuidado del hogar.', orden: 6 },
  { slug: 'colonias', nombre: 'Colonias', descripcion: 'Fragancias artesanales inspiradas en referencias reconocidas de perfumería.', orden: 7 },
  { slug: 'otros', nombre: 'Otros', descripcion: 'Kits, alimentos tradicionales y ediciones especiales.', orden: 8 },
];

export const INGREDIENTES = [
  {
    slug: 'arroz', nombre: 'Arroz', nombreCientifico: 'Oryza sativa', region: 'Sabanas de Córdoba y Sucre',
    usoAncestral: 'El agua y el almidón de arroz se usan tradicionalmente en la región Caribe para aclarar y suavizar la piel. Arte\'Sano lo trabaja con técnica oriental.',
    beneficios: 'Aclara y suaviza la piel; disminuye manchas. Resultados notables a partir de la tercera aplicación.',
  },
  {
    slug: 'guasimo', nombre: 'Guásimo', nombreCientifico: 'Guazuma ulmifolia', region: 'Bosque seco tropical de Córdoba y Sucre',
    usoAncestral: 'Técnica ancestral de la mujer Zenú para proteger y limpiar el cabello.',
    beneficios: 'Nutre y fortalece el cuero cabelludo, protege el color del cabello, limpia de forma natural, suaviza, humecta e intensifica el brillo. Acción anticaída. Sin químicos ni sales agresivas.',
  },
  {
    slug: 'mataraton', nombre: 'Matarratón', nombreCientifico: 'Gliricidia sepium', region: 'Cercas vivas y patios de Córdoba y Sucre',
    usoAncestral: 'Planta con propiedades antibióticas naturales gracias a su alto contenido de nitrógeno, usada tradicionalmente en la sabana.',
    beneficios: 'Jabón medicinal que ayuda a eliminar el hongo Malassezia globosa, causante de la caspa, la rasquiña y el empeine.',
  },
  {
    slug: 'coco', nombre: 'Coco', nombreCientifico: 'Cocos nucifera', region: 'Costa Caribe colombiana',
    usoAncestral: 'El aceite de coco es base tradicional de jabones y ungüentos en toda la costa.',
    beneficios: 'Excelente alternativa para humectar y dar brillo a la piel.',
  },
  {
    slug: 'chopo', nombre: 'Chopo', nombreCientifico: '', region: 'Córdoba y Sucre',
    usoAncestral: 'Alimento tradicional del pueblo Zenú, preparado en colada desde hace generaciones.',
    beneficios: 'Cargado de nutrientes; ideal para personas de todas las edades. Suplemento sin gluten.',
  },
  {
    slug: 'calendula', nombre: 'Caléndula', nombreCientifico: 'Calendula officinalis', region: 'Sucre, Colombia',
    usoAncestral: 'Planta reconocida por generaciones como remedio tópico para golpes e inflamaciones.',
    beneficios: 'Poderosas propiedades antiinflamatorias; eficaz contra golpes, dolores musculares, artritis y dolor de cabeza. Sensación de frescura, amigable con todo tipo de piel.',
  },
  {
    slug: 'pepino', nombre: 'Pepino', nombreCientifico: 'Cucumis sativus', region: 'Sucre, Colombia',
    usoAncestral: 'Usado tradicionalmente para refrescar y controlar la grasa de la piel.',
    beneficios: 'Cortador de grasa por naturaleza: controla el brillo excesivo del rostro y ayuda a controlar el acné tipo 1.',
  },
  {
    slug: 'carbon-activado', nombre: 'Carbón Activado', nombreCientifico: '', region: 'Sucre, Colombia',
    usoAncestral: 'Purificante natural usado en la medicina tradicional, combinado aquí con canela.',
    beneficios: 'Elimina espinillas, puntos negros y poros sucios. Purifica y revitaliza la piel.',
  },
  {
    slug: 'aguacate', nombre: 'Aguacate', nombreCientifico: 'Persea americana', region: 'Córdoba y Sucre',
    usoAncestral: 'Fruto de uso tradicional en el cuidado de la piel en la región Caribe.',
    beneficios: 'Desintoxica, nutre, humecta y limpia la piel, al tiempo que reduce las marcas de la edad.',
  },
  {
    slug: 'hierbabuena', nombre: 'Hierbabuena', nombreCientifico: 'Mentha spicata', region: 'Sucre, Colombia',
    usoAncestral: 'Planta medicinal tradicional usada para dolores de cabeza, molestias musculares y digestivas.',
    beneficios: 'Alivia la migraña, trata dolores e inflamaciones, ayuda en problemas digestivos y alivia síntomas de la artritis.',
  },
  {
    slug: 'rosas', nombre: 'Rosas', nombreCientifico: 'Rosa damascena', region: 'Colombia',
    usoAncestral: 'Flor tradicionalmente usada en el cuidado capilar y de la piel.',
    beneficios: 'Belleza natural para un cabello fuerte, brillante y lleno de vida.',
  },
];

export const ARTESANOS = [
  {
    slug: 'arte-sano-boutique', nombre: 'Arte\'Sano Boutique', municipio: 'Sampués / Sincelejo', departamento: 'Sucre',
    bio: 'Marca artesanal elaborada en Sucre, Colombia. Participante activa de ferias regionales (Feria del Sombrero Vueltiao, Feria de la Juventud, ExpoMadres) y aliada del programa ZASCA para el fortalecimiento de emprendimientos artesanales.',
  },
];

export function productos(ids) {
  const cat = (slug) => ids.categorias[slug];
  const ing = (slug) => ids.ingredientes[slug];
  const art = ids.artesanos['arte-sano-boutique'];
  const comunes = { artesanoId: art, tipoIva: 'iva_19', precioIncluyeIva: true, estado: 'publicado', etiquetas: ['precio-de-ejemplo'] };
  const foto = (archivo) => [{ url: `/publico/imagenes/productos/${archivo}`, alt: '' }];
  const etiqueta = (slug) => [{ url: `/publico/imagenes/etiquetas/${slug}.svg`, alt: '' }];

  return [
    // ---------- Cuidado del Cuerpo ----------
    {
      ...comunes, nombre: 'Jabón de Arroz', slug: 'jabon-de-arroz', destacado: true,
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [ing('arroz')], ingredienteProtagonistaId: ing('arroz'),
      descripcionCorta: 'Aclara y suaviza tu piel, disminuye manchas. Técnica oriental.',
      descripcion: '<p>Jabón 100% natural elaborado con arroz (<i>Oryza sativa</i>). Nutre, aclara y humecta la piel. Resultados notables a partir de la tercera aplicación.</p>',
      beneficios: '<ul><li>Nutre, aclara y humecta</li><li>Disminuye manchas</li><li>Técnica oriental</li><li>100% natural</li></ul>',
      modoUso: '<p>Humedece la piel, frota el jabón hasta formar espuma, masajea suavemente y enjuaga.</p>',
      tipoPiel: ['todo tipo'], pesoGramos: 100, precioCop: 18000, precioUsd: 6.5,
      imagenes: [...foto('arroz.jpg'), ...foto('arroz-2.jpg')],
      variantes: [{ sku: 'AS-ARROZ-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 30, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Jabón de Coco', slug: 'jabon-de-coco',
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [ing('coco')], ingredienteProtagonistaId: ing('coco'),
      descripcionCorta: 'Excelente alternativa para humectar y dar brillo a tu piel.',
      descripcion: '<p>Jabón artesanal 100% natural elaborado con aceite de coco (<i>Cocos nucifera</i>).</p>',
      beneficios: '<ul><li>Humecta profundamente</li><li>Da brillo natural a la piel</li></ul>',
      modoUso: '<p>Uso diario en cuerpo y manos.</p>',
      tipoPiel: ['seca', 'normal'], pesoGramos: 100, precioCop: 18000, precioUsd: 6.5,
      imagenes: etiqueta('coco'),
      variantes: [{ sku: 'AS-COCO-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 30, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Jabón de Aguacate', slug: 'jabon-de-aguacate',
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [ing('aguacate')], ingredienteProtagonistaId: ing('aguacate'),
      descripcionCorta: 'Desintoxica, nutre, humecta y limpia reduciendo las marcas de la edad.',
      descripcion: '<p>Las propiedades de la <i>Persea americana</i> en un jabón 100% natural que desintoxica, nutre, humecta y limpia tu piel al tiempo que reduce las marcas de la edad.</p>',
      beneficios: '<ul><li>Desintoxica</li><li>Nutre y humecta</li><li>Reduce marcas de la edad</li></ul>',
      modoUso: '<p>Uso diario en cuerpo y rostro.</p>',
      tipoPiel: ['madura', 'todo tipo'], pesoGramos: 100, precioCop: 19000, precioUsd: 6.8,
      imagenes: etiqueta('aguacate'),
      variantes: [{ sku: 'AS-AGUACATE-100', nombre: '100 g', precioCop: 19000, precioUsd: 6.8, stock: 25, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Jabón de Rosas', slug: 'jabon-de-rosas',
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [ing('rosas')], ingredienteProtagonistaId: ing('rosas'),
      descripcionCorta: 'Belleza natural para un cabello fuerte, brillante y lleno de vida.',
      descripcion: '<p>Jabón artesanal de rosas, parte de nuestra línea de belleza natural. Ideal como parte de la rutina capilar y de cuidado de la piel.</p>',
      beneficios: '<ul><li>Cabello fuerte y brillante</li><li>Aroma floral natural</li></ul>',
      modoUso: '<p>Uso diario en cuerpo o como jabón capilar.</p>',
      tipoPiel: ['todo tipo'], pesoGramos: 100, precioCop: 19000, precioUsd: 6.8,
      imagenes: etiqueta('rosas'),
      variantes: [{ sku: 'AS-ROSAS-100', nombre: '100 g', precioCop: 19000, precioUsd: 6.8, stock: 20, porDefecto: true }],
    },

    // ---------- Cuidado Facial ----------
    {
      ...comunes, nombre: 'Jabón de Pepino', slug: 'jabon-de-pepino', destacado: true,
      categoriaId: cat('cuidado-facial'), ingredienteIds: [ing('pepino')], ingredienteProtagonistaId: ing('pepino'),
      descripcionCorta: 'Jabón natural medicinal: purifica y refresca. Controla el brillo y el acné.',
      descripcion: '<p>El pepino es un cortador de grasa por naturaleza: no solo controla la grasa interna del cuerpo, también neutraliza el brillo excesivo del rostro y ayuda a controlar el acné tipo 1.</p>',
      beneficios: '<ul><li>100% natural, medicinal y artesanal</li><li>Purifica y refresca</li><li>Controla el brillo facial</li><li>Ayuda con el acné tipo 1</li></ul>',
      modoUso: '<p>Aplicar sobre el rostro húmedo, masajear suavemente y enjuagar.</p>',
      tipoPiel: ['grasa', 'mixta'], pesoGramos: 100, precioCop: 18000, precioUsd: 6.5,
      imagenes: foto('pepino.jpg'),
      variantes: [{ sku: 'AS-PEPINO-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 25, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Jabón de Carbón Activado con Canela', slug: 'jabon-carbon-activado',
      categoriaId: cat('cuidado-facial'), ingredienteIds: [ing('carbon-activado')], ingredienteProtagonistaId: ing('carbon-activado'),
      descripcionCorta: 'Dile adiós a las espinillas, puntos negros y poros sucios.',
      descripcion: '<p>Jabón natural medicinal de carbón activado con canela. Purifica y revitaliza la piel, con el poder de la canela.</p>',
      beneficios: '<ul><li>100% natural y medicinal</li><li>Elimina espinillas y puntos negros</li><li>Purifica y revitaliza</li></ul>',
      modoUso: '<p>Aplicar sobre el rostro húmedo, masajear y enjuagar.</p>',
      tipoPiel: ['grasa', 'mixta', 'con poros abiertos'], pesoGramos: 100, precioCop: 18000, precioUsd: 6.5,
      imagenes: foto('carbon-activado.jpg'),
      variantes: [{ sku: 'AS-CARBON-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 25, porDefecto: true }],
    },

    // ---------- Corporal ----------
    {
      ...comunes, nombre: 'Crema Piel de Porcelana', slug: 'crema-piel-de-porcelana',
      categoriaId: cat('corporal'), ingredienteIds: [], ingredienteProtagonistaId: null,
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
      descripcionCorta: 'Jabón medicinal anticaspa con propiedades antibióticas naturales.',
      descripcion: '<p><i>Gliricidia sepium</i>, "matarratón": planta con propiedades antibióticas naturales gracias a su alto contenido de nitrógeno. Aprovechamos sus beneficios en un jabón medicinal que ayuda a eliminar el hongo Malassezia globosa, causante de la caspa.</p>',
      beneficios: '<ul><li>Propiedades antibióticas naturales</li><li>Ayuda con caspa, rasquiña y empeine</li></ul>',
      advertencias: 'Uso externo. Suspender si hay irritación.',
      tipoPiel: ['con hongos', 'cuero cabelludo sensible'], pesoGramos: 100, precioCop: 20000, precioUsd: 7.2,
      imagenes: etiqueta('mataraton'),
      variantes: [{ sku: 'AS-MATARRATON-100', nombre: '100 g', precioCop: 20000, precioUsd: 7.2, stock: 20, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Shampoo y Acondicionador de Guásimo', slug: 'shampoo-de-guasimo', destacado: true,
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('guasimo')], ingredienteProtagonistaId: ing('guasimo'),
      descripcionCorta: 'Técnica ancestral de la mujer Zenú contra la caída del cabello.',
      descripcion: '<p>Shampoo y acondicionador natural elaborado con guásimo (<i>Guazuma ulmifolia</i>), técnica ancestral de la mujer Zenú para proteger y limpiar el cabello.</p>',
      beneficios: '<ul><li>Nutre y fortalece el cuero cabelludo</li><li>Protege el color del cabello</li><li>Limpieza natural</li><li>Suaviza y humecta</li><li>Intensifica el brillo natural</li><li>Acción anticaída</li><li>No contiene químicos ni sales agresivas</li></ul>',
      modoUso: '<p>Aplica el shampoo sobre el cabello húmedo, masajea el cuero cabelludo y enjuaga. Sigue con el acondicionador de puntas a medios.</p>',
      tipoPiel: ['todo tipo de cabello'], pesoGramos: 260, precioCop: 32000, precioUsd: 11.5,
      imagenes: [...foto('guasimo-shampoo-1.jpg'), ...foto('guasimo-shampoo-2.jpg'), ...foto('guasimo-info.jpg')],
      variantes: [
        { sku: 'AS-GUASIMO-SHP-250', nombre: 'Shampoo 250 ml', precioCop: 32000, precioUsd: 11.5, stock: 20, porDefecto: true },
        { sku: 'AS-GUASIMO-ACOND-100', nombre: 'Acondicionador 100 ml', precioCop: 22000, precioUsd: 8, stock: 20 },
      ],
    },
    {
      ...comunes, nombre: 'Ungüento de Caléndula', slug: 'unguento-de-calendula',
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('calendula')], ingredienteProtagonistaId: ing('calendula'),
      descripcionCorta: 'Poderosas propiedades antiinflamatorias contra golpes y dolores.',
      descripcion: '<p>La caléndula es una planta con poderosas propiedades antiinflamatorias. Este ungüento es eficaz contra traumas como golpes, inflamaciones, dolores musculares y artritis. También es efectivo contra el dolor de cabeza. Sensación de frescura, amigable con todo tipo de piel.</p>',
      beneficios: '<ul><li>Antiinflamatorio</li><li>Golpes, dolores musculares y artritis</li><li>Alivia el dolor de cabeza</li></ul>',
      modoUso: '<p>Aplicar una pequeña cantidad sobre la zona afectada y masajear suavemente.</p>',
      advertencias: 'Uso externo. No aplicar sobre heridas abiertas.',
      tipoPiel: ['todo tipo'], pesoGramos: 30, precioCop: 22000, precioUsd: 8,
      imagenes: etiqueta('calendula'),
      variantes: [{ sku: 'AS-CALENDULA-30', nombre: '30 g', precioCop: 22000, precioUsd: 8, stock: 20, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Gel de Cannabis, Coca y Árnica', slug: 'gel-cannabis-coca-arnica',
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [], ingredienteProtagonistaId: null,
      descripcionCorta: 'Para golpes, inflamaciones, esguinces y dolores de cabeza.',
      descripcion: '<p>Gel con extractos de cannabis, coca y árnica, plantas de uso medicinal tradicional en Colombia. Indicado para golpes, inflamaciones, esguinces y dolores de cabeza.</p>',
      beneficios: '<ul><li>Alivio para golpes e inflamaciones</li><li>Esguinces</li><li>Dolores de cabeza</li></ul>',
      modoUso: '<p>Aplicar sobre la zona afectada con un masaje suave.</p>',
      advertencias: 'Uso externo únicamente. No aplicar sobre heridas abiertas. Consultar en caso de embarazo o lactancia.',
      tipoPiel: [], pesoGramos: 60, precioCop: 25000, precioUsd: 9,
      imagenes: etiqueta('gel-cannabis-coca-arnica'),
      variantes: [{ sku: 'AS-GEL-CCA-60', nombre: '60 ml', precioCop: 25000, precioUsd: 9, stock: 15, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Vaporub Artesanal', slug: 'vaporub-artesanal', destacado: true,
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('hierbabuena'), ing('coco')], ingredienteProtagonistaId: ing('hierbabuena'),
      descripcionCorta: 'Menta de hierbabuena y aceite de coco. Uno de nuestros más vendidos.',
      descripcion: '<p>Vaporub artesanal elaborado con menta de hierbabuena y aceite de coco. Uno de los productos más vendidos de nuestra tienda.</p>',
      beneficios: '<ul><li>Alivio respiratorio natural</li><li>Menta de hierbabuena</li><li>Aceite de coco</li></ul>',
      modoUso: '<p>Aplicar en pecho y espalda, o inhalar los vapores.</p>',
      tipoPiel: [], pesoGramos: 50, precioCop: 16000, precioUsd: 5.8,
      imagenes: foto('vaporub.jpg'),
      variantes: [{ sku: 'AS-VAPORUB-50', nombre: 'Frasco 50 g', precioCop: 16000, precioUsd: 5.8, stock: 30, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Elixir de Hierbabuena', slug: 'elixir-de-hierbabuena',
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('hierbabuena')], ingredienteProtagonistaId: ing('hierbabuena'),
      descripcionCorta: 'Destilado puro, eficaz contra la migraña. Elaborado en Sucre, Colombia.',
      descripcion: '<p>Elixir de hierbabuena destilado puro. Alivio terapéutico y natural, eficaz contra la migraña, tratamiento de inflamaciones y golpes. Producto tópico, elaborado en Sucre, Colombia.</p>',
      beneficios: '<ul><li>Alivia la migraña</li><li>Trata dolores e inflamaciones</li><li>Ayuda en problemas digestivos</li><li>Alivia síntomas de la artritis</li></ul>',
      modoUso: '<p>Aplicar una gota del elixir en la zona afectada.</p>',
      advertencias: 'Uso tópico externo. Evitar contacto con los ojos.',
      tipoPiel: [], pesoGramos: 15, precioCop: 15000, precioUsd: 5.5,
      imagenes: foto('elixir-hierbabuena.jpg'),
      variantes: [{ sku: 'AS-ELIXIR-15', nombre: 'Gotero 15 ml', precioCop: 15000, precioUsd: 5.5, stock: 25, porDefecto: true }],
    },

    // ---------- Aseo ----------
    {
      ...comunes, nombre: 'Desodorante Protección Mineral', slug: 'desodorante-proteccion-mineral',
      categoriaId: cat('aseo'), ingredienteIds: [], ingredienteProtagonistaId: null,
      descripcionCorta: 'Desodorante natural en spray. Protección 24 horas, no mancha la ropa.',
      descripcion: '<p>Desodorante natural en spray, sin químicos ni metales agresivos, elaborado a partir de ingredientes naturales: una alternativa saludable y eficaz.</p>',
      beneficios: '<ul><li>Sin químicos ni metales agresivos</li><li>Protección 24 horas</li><li>No mancha la ropa</li></ul>',
      modoUso: '<p>Aplicar directamente en las axilas, limpias y secas.</p>',
      tipoPiel: ['sensible'], pesoGramos: 60, precioCop: 20000, precioUsd: 7.2,
      imagenes: etiqueta('proteccion-mineral'),
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
    {
      ...comunes, nombre: 'Colada de Chopo', slug: 'colada-de-chopo',
      categoriaId: cat('otros'), ingredienteIds: [ing('chopo')], ingredienteProtagonistaId: ing('chopo'),
      descripcionCorta: 'Alimento tradicional Zenú cargado de nutrientes. Suplemento sin gluten.',
      descripcion: '<p>Alimento tradicional cargado de nutrientes, ideal para personas de todas las edades. Suplemento sin gluten, parte de nuestra línea de bienestar heredada de la cultura Zenú.</p>',
      beneficios: '<ul><li>Sin gluten</li><li>Alimento tradicional Zenú</li></ul>',
      modoUso: '<p>Preparar como colada siguiendo las instrucciones del empaque.</p>',
      tipoPiel: [], pesoGramos: 250, precioCop: 17000, precioUsd: 6,
      imagenes: foto('colada-de-chopo.jpg'),
      variantes: [{ sku: 'AS-CHOPO-250', nombre: '250 g', precioCop: 17000, precioUsd: 6, stock: 15, porDefecto: true }],
    },

    // ---------- Colonias ----------
    ...[
      ['aqva-bvlgari', "AQVA D'Bvlgari", 60000],
      ['good-girl', 'Good Girl', 65000],
      ['amber-rouge', 'Amber Rouge Orientica', 60000],
      ['omnia-crystal', 'Omnia Crystal', 62000],
      ['invictus', 'Invictus', 60000],
      ['olympea', 'Olympea', 65000],
      ['la-vie-est-belle', 'La Vie Est Belle', 65000],
      ['bharara-king', 'Bharara King', 58000],
    ].map(([slug, nombre, precio]) => ({
      ...comunes, nombre, slug: `colonia-${slug}`,
      categoriaId: cat('colonias'), ingredienteIds: [], ingredienteProtagonistaId: null,
      descripcionCorta: `Fragancia artesanal Arte'Sano inspirada en ${nombre}.`,
      descripcion: `<p>Interpretación artesanal de Arte'Sano inspirada en la icónica referencia <b>${nombre}</b>. Producto de perfumería artesanal, sin afiliación ni asociación con la marca original.</p>`,
      beneficios: '', modoUso: '<p>Aplicar sobre puntos de pulso: cuello, muñecas y detrás de las orejas.</p>',
      tipoPiel: [], pesoGramos: 60, precioCop: precio, precioUsd: Math.round(precio / 4200 * 10) / 10,
      imagenes: etiqueta(slug),
      variantes: [{ sku: `AS-COL-${slug.toUpperCase()}`, nombre: '60 ml', precioCop: precio, precioUsd: Math.round(precio / 4200 * 10) / 10, stock: 10, porDefecto: true }],
    })),
  ];
}
