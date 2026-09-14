# Arte'Sano — Tienda en línea (artesanoboutique.com)

E-commerce de cosmética artesanal con ingredientes ancestrales Zenú (Córdoba y Sucre, Colombia).
**Fase 0 — Fundaciones:** tienda pública, panel administrativo para cargar productos (descripción, fotos, precio, IVA, stock), carrito y checkout con RAPYD, correos con Resend, chatbot de WhatsApp (menú guiado), pedidos programados y persistencia en PostgreSQL.

Especificación completa: [docs/ESPECIFICACION.md](docs/ESPECIFICACION.md).

---

## Qué incluye

| Ruta | Qué es |
|---|---|
| `/` `/tienda` `/producto/:slug` | Tienda pública renderizada en el servidor (SEO, JSON-LD, sitemap). |
| `/ingredientes` `/artesanos` `/nosotros` `/politicas` | Contenido de origen ancestral y políticas. |
| `/carrito` `/checkout` `/pedido/:numero` | Compra: carrito (localStorage), checkout con cálculo de IVA y envío por destino, seguimiento. |
| `/admin` | Panel: resumen, productos (con variantes, imágenes, IVA), pedidos, programados, líneas/ingredientes/artesanos, WhatsApp, ajustes, diagnóstico. |
| `/api/*` | API pública del checkout. `/admin/api/*` API del panel. |
| `/webhook/whatsapp` `/webhook/rapyd` | Webhooks de Meta y RAPYD. |
| `/health` | Health check para Render. |

**Sin `DATABASE_URL` la tienda funciona en memoria** con un catálogo de ejemplo (los productos visibles en Facebook, precios de ejemplo). Con PostgreSQL todo persiste.

---

## Estructura

```
src/
├── index.js               # Servidor Express, webhooks, tareas periódicas
├── config.js              # Variables de entorno
├── almacen/               # Memoria + PostgreSQL (write-through)
│   ├── db.js              # Conexión y tablas
│   ├── catalogo.js        # Productos, líneas, ingredientes, artesanos
│   ├── pedidos.js         # Pedidos, estados, reserva de stock, reportes
│   ├── ajustes.js         # Tarifas de envío, textos, reglas
│   ├── conversaciones.js  # Historial de WhatsApp
│   └── semilla.js         # Catálogo de ejemplo
├── util/iva.js            # Reglas de IVA y totales
├── util/moneda.js         # COP / USD
├── envios/tarifas.js      # Cotización por zona
├── pagos/rapyd.js         # Checkout hospedado + webhook + polling
├── pagos/confirmar.js     # Confirmación de pago (correo + WhatsApp)
├── correo/enviar.js       # Resend (plantillas de pedido)
├── whatsapp/              # Cloud API: firma, recibir, enviar, bot
├── imagenes/cloudinary.js # Subida directa firmada
├── admin/                 # Panel: sesión, seguridad (2FA), rutas, HTML
├── tienda/                # Plantillas SSR, rutas públicas, CSS y JS
└── legal/privacidad.html
```

---

## 1) Correr en local

```bash
npm install
cp .env.example .env   # completa al menos ADMIN_PASSWORD
npm run dev
```

Abre `http://localhost:3000` (tienda) y `http://localhost:3000/admin` (panel).

---

## 2) Subir a GitHub

```bash
git init
git add .
git commit -m "Arte'Sano Fase 0: tienda, panel, catálogo con IVA, RAPYD, Resend, WhatsApp"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/artesanoboutique.git
git push -u origin main
```

---

## 3) Desplegar en Render

1. **New → Blueprint** apuntando al repo (usa `render.yaml`): crea el servicio web y la base PostgreSQL.
   O a mano: **New → Web Service**, runtime Node, build `npm install`, start `npm start`, health `/health`.
2. Plan **Starter** para producción (always-on; el Free se duerme y pierde webhooks).
3. Variables de entorno (ver `.env.example`): `ADMIN_USUARIO`, `ADMIN_PASSWORD`, `PUBLIC_URL`, `TIENDA_WHATSAPP`, RAPYD, Resend, WhatsApp, Cloudinary.
4. Prueba `https://TU-SERVICIO.onrender.com/health`.

---

## 4) Dominio en Hostinger

En el panel DNS de Hostinger para `artesanoboutique.com`:

| Tipo | Nombre | Valor |
|---|---|---|
| CNAME | `www` | `TU-SERVICIO.onrender.com` |
| A | `@` | IP que muestra Render en *Custom Domains* (o ALIAS/ANAME si Hostinger lo permite) |

En Render → *Settings → Custom Domains* agrega `artesanoboutique.com` y `www.artesanoboutique.com`; Render emite el certificado SSL. Luego pon `PUBLIC_URL=https://artesanoboutique.com`.

El correo corporativo (`pedidos@artesanoboutique.com`) sigue en Hostinger; para Resend agrega los registros **SPF/DKIM/DMARC** que Resend indica al verificar el dominio.

---

## 5) Integraciones

**RAPYD** — llaves en `RAPYD_ACCESS_KEY` / `RAPYD_SECRET_KEY`. Sandbox por defecto (`RAPYD_BASE_URL=https://sandboxapi.rapyd.net`); producción `https://api.rapyd.net`. Webhook en el portal de RAPYD: `https://artesanoboutique.com/webhook/rapyd`. El servidor además consulta cada 90 s los checkouts pendientes, así que confirma el pago aunque el webhook falle.

**Resend** — `RESEND_API_KEY` y dominio verificado; remitente en `CORREO_REMITENTE`.

**WhatsApp Cloud API (Meta)** — en developers.facebook.com → App → WhatsApp: `WHATSAPP_PHONE_NUMBER_ID`, token permanente de sistema en `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET`. Webhook: `https://artesanoboutique.com/webhook/whatsapp` con el `WHATSAPP_VERIFY_TOKEN`; suscribir el campo `messages`. Pon el número (solo dígitos) en `TIENDA_WHATSAPP` para los botones "Pedir por WhatsApp".

**Cloudinary** — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Sin esto, el panel acepta URLs de imagen.

**2FA del panel** — en `/admin` → Diagnóstico → "Generar secreto 2FA", pégalo en `ADMIN_TOTP_SECRET`.

---

## IVA y moneda

- Cada producto tiene tipo de IVA (`iva_19`, `iva_5`, `exento`, `excluido`) y el precio se ingresa **con IVA incluido** (así se muestra en Colombia).
- El pedido guarda el desglose por línea (base, tasa, IVA) de forma inmutable.
- Pedidos con destino fuera de Colombia: régimen **exportación** (IVA 0 %), moneda **USD** (precio USD del producto o tasa `COP_POR_USD`).

---

## Siguientes fases

Ver [docs/ESPECIFICACION.md](docs/ESPECIFICACION.md), sección 23: catálogo real, facturación electrónica DIAN, tarifas de envío en vivo, bot con Claude (pedidos completos por chat), historias/experiencias, inglés, suscripciones y B2B.
