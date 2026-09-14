// ============================================================
//  semilla.js — Datos iniciales del catalogo.
//
//  Se cargan SOLO si el catalogo esta vacio (primer arranque o modo
//  memoria). Los productos vienen de lo visible en la pagina de Facebook
//  de Arte'Sano; los precios son DE EJEMPLO (etiqueta "precio-de-ejemplo")
//  y se reemplazan con el catalogo oficial desde el panel /admin.
// ============================================================
import { guardar, hayDatos, listar } from './catalogo.js';

const CATEGORIAS = [
  { slug: 'cuidado-del-cuerpo', nombre: 'Cuidado del Cuerpo', descripcion: 'Jabones de tocador, exfoliantes y aceites artesanales para la limpieza diaria.', orden: 1 },
  { slug: 'cuidado-facial', nombre: 'Cuidado Facial', descripcion: 'Limpiadores, cremas, tónicos y mascarillas con plantas ancestrales.', orden: 2 },
  { slug: 'corporal', nombre: 'Corporal', descripcion: 'Cremas hidratantes, mantecas y lociones aromáticas.', orden: 3 },
  { slug: 'lineas-especializadas', nombre: 'Líneas Especializadas', descripcion: 'Capilar, piel sensible, cuidado antifúngico y familia.', orden: 4 },
  { slug: 'aseo', nombre: 'Aseo', descripcion: 'Jabones e higiene personal de uso diario.', orden: 5 },
  { slug: 'hogar', nombre: 'Hogar', descripcion: 'Jabón multiusos, aromatizantes y velas naturales.', orden: 6 },
  { slug: 'otros', nombre: 'Otros', descripcion: 'Kits, regalos y ediciones especiales.', orden: 7 },
];

const INGREDIENTES = [
  {
    slug: 'arroz', nombre: 'Arroz', nombreCientifico: 'Oryza sativa', region: 'Sabanas de Córdoba y Sucre',
    usoAncestral: 'El agua y el almidón de arroz se han usado por generaciones en la región Caribe para aclarar, suavizar y refrescar la piel y el cabello.',
    beneficios: 'Suaviza, ilumina y calma la piel; aporta antioxidantes y ayuda a unificar el tono.',
  },
  {
    slug: 'guasimo', nombre: 'Guásimo', nombreCientifico: 'Guazuma ulmifolia', region: 'Bosque seco tropical de Córdoba y Sucre',
    usoAncestral: 'Árbol emblemático de la sabana Zenú. Su corteza y hojas se maceran tradicionalmente para el cuidado del cabello y la piel.',
    beneficios: 'Fortalece y da brillo al cabello, ayuda a controlar la caspa y aporta mucílagos hidratantes.',
  },
  {
    slug: 'mataraton', nombre: 'Mataratón', nombreCientifico: 'Gliricidia sepium', region: 'Cercas vivas y patios de Córdoba y Sucre',
    usoAncestral: 'Sus hojas se usan en baños y emplastos para aliviar afecciones de la piel, picaduras y hongos.',
    beneficios: 'Propiedades antifúngicas y calmantes; ayuda con irritaciones y picazón.',
  },
  {
    slug: 'coco', nombre: 'Coco', nombreCientifico: 'Cocos nucifera', region: 'Costa Caribe colombiana',
    usoAncestral: 'El aceite de coco extraído de forma artesanal es la base de jabones y ungüentos en toda la costa.',
    beneficios: 'Hidrata en profundidad, nutre la piel y el cabello y aporta espuma cremosa a los jabones.',
  },
  {
    slug: 'chopo', nombre: 'Chopo', nombreCientifico: '', region: 'Córdoba y Sucre',
    usoAncestral: 'Planta de uso tradicional en la cultura Zenú (ficha en construcción con el equipo de artesanos).',
    beneficios: 'Por confirmar con el equipo de artesanos.',
  },
];

const ARTESANOS = [
  {
    slug: 'comunidad-artesana-zenu', nombre: 'Comunidad artesana Zenú', municipio: 'San Andrés de Sotavento', departamento: 'Córdoba',
    bio: 'Familias artesanas del resguardo Zenú que elaboran cada producto a mano con plantas de su territorio. (Perfil de ejemplo: reemplazar con los artesanos reales desde el panel).',
  },
];

function productos(ids) {
  const cat = (slug) => ids.categorias[slug];
  const ing = (slug) => ids.ingredientes[slug];
  const art = ids.artesanos['comunidad-artesana-zenu'];
  const comunes = { artesanoId: art, tipoIva: 'iva_19', precioIncluyeIva: true, estado: 'publicado', etiquetas: ['precio-de-ejemplo'] };
  return [
    {
      ...comunes, nombre: 'Jabón de Arroz', slug: 'jabon-de-arroz', destacado: true,
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [ing('arroz'), ing('coco')], ingredienteProtagonistaId: ing('arroz'),
      descripcionCorta: 'Limpieza suave y luminosa con almidón de arroz de la sabana Zenú.',
      descripcion: '<p>Jabón de tocador elaborado a mano en pequeños lotes. El arroz aporta suavidad y luminosidad, mientras el aceite de coco nutre y deja una espuma cremosa. Ideal para uso diario en rostro y cuerpo.</p>',
      beneficios: '<ul><li>Ilumina y unifica el tono de la piel</li><li>Limpia sin resecar</li><li>Sin parabenos ni sulfatos</li></ul>',
      modoUso: '<p>Humedece la piel, frota el jabón hasta formar espuma, masajea suavemente y enjuaga. Deja secar el jabón entre usos.</p>',
      tipoPiel: ['todo tipo', 'sensible'], pesoGramos: 110, precioCop: 18000, precioUsd: 6.5,
      variantes: [
        { sku: 'AS-ARROZ-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 50, porDefecto: true },
        { sku: 'AS-ARROZ-X3', nombre: 'Pack x3', precioCop: 48000, precioUsd: 17, stock: 20 },
      ],
    },
    {
      ...comunes, nombre: 'Loción aromática roll-on', slug: 'locion-aromatica-roll-on', destacado: true,
      categoriaId: cat('corporal'), ingredienteIds: [ing('coco'), ing('mataraton')], ingredienteProtagonistaId: ing('coco'),
      descripcionCorta: 'Loción natural con propiedades aromáticas en práctico envase roll-on de vidrio.',
      descripcion: '<p>Loción corporal de aplicación directa con aceites naturales y extractos de plantas ancestrales. Presentación roll-on de vidrio, perfecta para llevar en el bolso.</p>',
      beneficios: '<ul><li>Aroma natural y fresco</li><li>Hidratación ligera</li><li>Sin alcohol ni fragancias sintéticas</li></ul>',
      modoUso: '<p>Aplica en muñecas, cuello y detrás de las orejas. Reaplica cuando lo desees.</p>',
      tipoPiel: ['todo tipo'], pesoGramos: 40, precioCop: 25000, precioUsd: 9,
      variantes: [{ sku: 'AS-LOCION-10', nombre: '10 ml', precioCop: 25000, precioUsd: 9, stock: 40, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Jabón de Coco', slug: 'jabon-de-coco',
      categoriaId: cat('cuidado-del-cuerpo'), ingredienteIds: [ing('coco')], ingredienteProtagonistaId: ing('coco'),
      descripcionCorta: 'Espuma cremosa e hidratación profunda con aceite de coco artesanal.',
      descripcion: '<p>Jabón nutritivo elaborado con aceite de coco extraído de forma tradicional en la costa Caribe.</p>',
      beneficios: '<ul><li>Hidrata y suaviza</li><li>Espuma abundante</li></ul>',
      modoUso: '<p>Uso diario en cuerpo y manos.</p>',
      tipoPiel: ['seca', 'normal'], pesoGramos: 110, precioCop: 18000, precioUsd: 6.5,
      variantes: [{ sku: 'AS-COCO-100', nombre: '100 g', precioCop: 18000, precioUsd: 6.5, stock: 45, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Shampoo de Guásimo', slug: 'shampoo-de-guasimo', destacado: true,
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('guasimo'), ing('coco')], ingredienteProtagonistaId: ing('guasimo'),
      descripcionCorta: 'Fortalece y da brillo al cabello con el árbol emblemático de la sabana Zenú.',
      descripcion: '<p>Shampoo artesanal con extracto de corteza y hojas de guásimo, usado por generaciones para el cuidado del cabello.</p>',
      beneficios: '<ul><li>Fortalece la fibra capilar</li><li>Ayuda a controlar la caspa</li><li>Brillo natural</li></ul>',
      modoUso: '<p>Aplica sobre el cabello húmedo, masajea el cuero cabelludo y enjuaga. Repite si es necesario.</p>',
      tipoPiel: ['todo tipo de cabello'], pesoGramos: 260, precioCop: 32000, precioUsd: 11.5,
      variantes: [{ sku: 'AS-GUASIMO-250', nombre: '250 ml', precioCop: 32000, precioUsd: 11.5, stock: 30, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Crema corporal de Mataratón', slug: 'crema-corporal-de-mataraton',
      categoriaId: cat('lineas-especializadas'), ingredienteIds: [ing('mataraton'), ing('coco')], ingredienteProtagonistaId: ing('mataraton'),
      descripcionCorta: 'Crema calmante con propiedades antifúngicas para piel irritada o con picazón.',
      descripcion: '<p>Crema de uso corporal con extracto de hojas de mataratón y aceite de coco. Tradicionalmente usada para aliviar irritaciones, picaduras y hongos en la piel.</p>',
      beneficios: '<ul><li>Calma la irritación</li><li>Acción antifúngica natural</li><li>Hidratación prolongada</li></ul>',
      modoUso: '<p>Aplica una capa fina sobre la zona limpia y seca, 1 a 2 veces al día.</p>',
      advertencias: 'Uso externo. Suspender si hay irritación. No aplicar sobre heridas abiertas.',
      tipoPiel: ['sensible', 'irritada'], pesoGramos: 130, precioCop: 38000, precioUsd: 13.5,
      variantes: [{ sku: 'AS-MATARATON-120', nombre: '120 g', precioCop: 38000, precioUsd: 13.5, stock: 25, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Jabón multiusos para el hogar', slug: 'jabon-multiusos-hogar',
      categoriaId: cat('hogar'), ingredienteIds: [ing('coco')], ingredienteProtagonistaId: ing('coco'),
      descripcionCorta: 'Barra de jabón natural para ropa, superficies y lavado de manos.',
      descripcion: '<p>Jabón en barra biodegradable a base de aceite de coco, sin fragancias sintéticas. Rinde y cuida tus manos.</p>',
      beneficios: '<ul><li>Biodegradable</li><li>Rinde más que el jabón industrial</li></ul>',
      modoUso: '<p>Frota directamente sobre la prenda o superficie húmeda y enjuaga.</p>',
      tipoPiel: [], pesoGramos: 250, precioCop: 15000, precioUsd: 5.5,
      variantes: [{ sku: 'AS-HOGAR-250', nombre: '250 g', precioCop: 15000, precioUsd: 5.5, stock: 60, porDefecto: true }],
    },
    {
      ...comunes, nombre: 'Kit de regalo Arte\'Sano', slug: 'kit-de-regalo', estado: 'borrador',
      categoriaId: cat('otros'), ingredienteIds: [ing('arroz'), ing('coco'), ing('guasimo')], ingredienteProtagonistaId: ing('arroz'),
      descripcionCorta: 'Jabón de arroz + jabón de coco + loción roll-on en caja artesanal.',
      descripcion: '<p>Selección de nuestros productos más queridos en una caja de cartón kraft atada con fibra natural.</p>',
      tipoPiel: ['todo tipo'], pesoGramos: 320, precioCop: 58000, precioUsd: 21,
      variantes: [{ sku: 'AS-KIT-1', nombre: 'Kit', precioCop: 58000, precioUsd: 21, stock: 10, porDefecto: true }],
    },
  ];
}

/** Carga los datos de ejemplo si el catalogo esta vacio. Devuelve cuantos productos creo. */
export function sembrarSiVacio() {
  if (hayDatos()) return 0;
  const ids = { categorias: {}, ingredientes: {}, artesanos: {} };
  for (const c of CATEGORIAS) ids.categorias[c.slug] = guardar('categorias', c).id;
  for (const i of INGREDIENTES) ids.ingredientes[i.slug] = guardar('ingredientes', i).id;
  for (const a of ARTESANOS) ids.artesanos[a.slug] = guardar('artesanos', a).id;
  let n = 0;
  for (const p of productos(ids)) {
    guardar('productos', p);
    n++;
  }
  console.log(`[semilla] Catálogo de ejemplo cargado: ${CATEGORIAS.length} líneas, ${INGREDIENTES.length} ingredientes, ${n} productos.`);
  return n;
}

export function resumenSemilla() {
  return { categorias: listar('categorias').length, productos: listar('productos').length };
}
