// ============================================================
//  config.js — Carga y valida las variables de entorno.
// ============================================================
import dotenv from 'dotenv';

dotenv.config();

const TIPOS_IVA = ['iva_19', 'iva_5', 'exento', 'excluido'];

// Ambiente de Wompi: lo define la llave pública (pub_prod_… = producción, pub_test_… = pruebas),
// así las llaves y la URL de la API nunca quedan en ambientes distintos. WOMPI_BASE_URL solo sirve
// para forzarlo a mano.
const wompiProduccion = (process.env.WOMPI_PUBLIC_KEY || '').startsWith('pub_prod_');

export const config = {
  puerto: process.env.PORT || 3000,
  publicUrl: (process.env.PUBLIC_URL || 'http://localhost:3000').replace(/\/+$/, ''),

  tienda: {
    nombre: process.env.TIENDA_NOMBRE || "Arte'Sano",
    nit: process.env.TIENDA_NIT || '',
    direccion: process.env.TIENDA_DIRECCION || 'Córdoba y Sucre, Colombia',
    whatsapp: (process.env.TIENDA_WHATSAPP || '').replace(/\D/g, ''),
    ivaPorDefecto: TIPOS_IVA.includes(process.env.IVA_POR_DEFECTO) ? process.env.IVA_POR_DEFECTO : 'iva_19',
    copPorUsd: parseFloat(process.env.COP_POR_USD || '4200'),
    envioGratisDesde: parseInt(process.env.ENVIO_GRATIS_DESDE || '0', 10),
  },

  db: {
    url: process.env.DATABASE_URL || '',
  },

  admin: {
    usuario: process.env.ADMIN_USUARIO || '',
    password: process.env.ADMIN_PASSWORD,
    secretoSesion: process.env.ADMIN_SESSION_SECRET || '',
    totpSecret: (process.env.ADMIN_TOTP_SECRET || '').replace(/[^A-Za-z2-7]/g, '').toUpperCase(),
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    carpeta: process.env.CLOUDINARY_CARPETA || 'artesano',
  },

  rapyd: {
    accessKey: process.env.RAPYD_ACCESS_KEY || '',
    secretKey: process.env.RAPYD_SECRET_KEY || '',
    baseUrl: process.env.RAPYD_BASE_URL || 'https://sandboxapi.rapyd.net',
    pais: process.env.RAPYD_PAIS || 'CO',
  },

  // Pasarela activa (RAPYD no acepta el volumen del negocio; ver docs/pagos).
  wompi: {
    publicKey: process.env.WOMPI_PUBLIC_KEY || '',
    privateKey: process.env.WOMPI_PRIVATE_KEY || '',
    integritySecret: process.env.WOMPI_INTEGRITY_SECRET || '',
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || '',
    produccion: wompiProduccion,
    baseUrl: process.env.WOMPI_BASE_URL || (wompiProduccion ? 'https://production.wompi.co' : 'https://sandbox.wompi.co'),
    checkoutUrl: process.env.WOMPI_CHECKOUT_URL || 'https://checkout.wompi.co',
  },

  correo: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    remitente: process.env.CORREO_REMITENTE || "Arte'Sano <pedidos@artesanoboutique.com>",
    tienda: process.env.CORREO_TIENDA || 'pedidos@artesanoboutique.com',
    responder: process.env.CORREO_RESPONDER || 'pedidos@artesanoboutique.com',
    // Correo de contacto general (mostrado al público: pie de página, políticas, privacidad).
    contacto: process.env.CORREO_CONTACTO || 'contacto@artesanoboutique.com',
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    graphVersion: process.env.GRAPH_API_VERSION || 'v21.0',
    graphBase: process.env.GRAPH_API_BASE || 'https://graph.facebook.com',
  },

  ia: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    modelo: process.env.ANTHROPIC_MODELO || 'claude-sonnet-5',
  },
};

export { TIPOS_IVA };

// Avisa (sin frenar el arranque) si falta algo. Asi el /health sigue
// funcionando y se ve el problema en los logs de Render.
export function revisarConfig() {
  const avisos = [];
  if (!config.db.url) avisos.push('Sin DATABASE_URL: catálogo y pedidos viven en memoria (se borran al reiniciar).');
  if (!config.admin.password) avisos.push('Sin ADMIN_PASSWORD: el panel /admin estará cerrado.');
  if (!config.wompi.publicKey || !config.wompi.privateKey || !config.wompi.integritySecret) avisos.push('Sin llaves Wompi: el checkout no podrá cobrar (modo simulado).');
  if (config.wompi.publicKey) {
    const urlEsProduccion = !/sandbox/.test(config.wompi.baseUrl);
    if (urlEsProduccion !== config.wompi.produccion) avisos.push('Wompi: la llave pública y WOMPI_BASE_URL son de ambientes distintos (pruebas vs producción). Los pagos fallarán.');
    else if (config.wompi.produccion && !config.wompi.eventsSecret) avisos.push('Wompi en PRODUCCIÓN sin WOMPI_EVENTS_SECRET: los avisos de pago (webhook) serán rechazados.');
    else console.log(`[config] Wompi en modo ${config.wompi.produccion ? 'PRODUCCIÓN (cobra dinero real)' : 'PRUEBAS (sandbox)'}.`);
  }
  if (!config.correo.resendApiKey) avisos.push('Sin RESEND_API_KEY: no se enviarán correos.');
  if (!config.whatsapp.token || !config.whatsapp.phoneNumberId) avisos.push('Sin credenciales de WhatsApp: el bot no responderá.');
  if (!config.tienda.whatsapp) avisos.push('Sin TIENDA_WHATSAPP: los botones "Pedir por WhatsApp" no tendrán número.');
  if (!config.cloudinary.cloudName) avisos.push('Sin Cloudinary: en el panel se cargan imágenes por URL.');

  if (avisos.length) {
    for (const a of avisos) console.warn('[config] ' + a);
  } else {
    console.log('[config] Todas las variables están presentes. ✅');
  }
}
