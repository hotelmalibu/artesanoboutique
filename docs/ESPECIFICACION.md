# Arte'Sano — Especificación Técnica y Funcional
## E-commerce global de cosmética artesanal de origen ancestral Zenú

> Documento maestro de desarrollo. Define producto, arquitectura, backend, panel administrativo, modelo de datos, integraciones (pagos, envíos, WhatsApp, email), seguridad, DevOps y roadmap. Stack alineado con los demás proyectos: **Hostinger + GitHub + Render + Resend + WhatsApp + pagos y envíos en línea**.

**Versión:** 1.1 · **Fecha:** 2026-09-13 · **Estado:** aprobado — Fase 0 implementada (ver README.md)

> **Decisiones confirmadas (2026-09-13):** dominio **artesanoboutique.com** (Hostinger); pasarela única **RAPYD** (Colombia + internacional); stack idéntico a los demás proyectos del equipo: **Node.js ESM + Express + PostgreSQL (`pg`) en Render**, integraciones por `fetch` (RAPYD, Resend, WhatsApp Cloud API, Cloudinary), panel `/admin` servido por el mismo servicio. Las secciones 6, 7, 18, 19 y 20 quedan reemplazadas por la implementación real descrita en `README.md`; el resto del documento (funcionalidad, modelo de datos lógico, reglas de IVA, flujos, roadmap) sigue vigente.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Marca y contexto](#2-marca-y-contexto)
3. [Alcance funcional (storefront)](#3-alcance-funcional-storefront)
4. [Panel administrativo (backoffice)](#4-panel-administrativo-backoffice)
5. [Catálogo, precios e IVA](#5-catálogo-precios-e-iva)
6. [Arquitectura técnica](#6-arquitectura-técnica)
7. [Stack tecnológico detallado](#7-stack-tecnológico-detallado)
8. [Modelo de datos](#8-modelo-de-datos)
9. [API REST — contratos](#9-api-rest--contratos)
10. [Flujo de compra, pagos y facturación](#10-flujo-de-compra-pagos-y-facturación)
11. [Envíos nacionales e internacionales](#11-envíos-nacionales-e-internacionales)
12. [Pedidos programados y suscripciones](#12-pedidos-programados-y-suscripciones)
13. [Chatbot de WhatsApp](#13-chatbot-de-whatsapp)
14. [Notificaciones por email (Resend)](#14-notificaciones-por-email-resend)
15. [Contenido: ingredientes, artesanos, historias, experiencias, aliados](#15-contenido-ingredientes-artesanos-historias-experiencias-aliados)
16. [Internacionalización, moneda y SEO](#16-internacionalización-moneda-y-seo)
17. [Seguridad y cumplimiento legal (Colombia)](#17-seguridad-y-cumplimiento-legal-colombia)
18. [DevOps: repositorios, entornos, CI/CD](#18-devops-repositorios-entornos-cicd)
19. [Estructura del código](#19-estructura-del-código)
20. [Variables de entorno](#20-variables-de-entorno)
21. [Rendimiento, observabilidad y analítica](#21-rendimiento-observabilidad-y-analítica)
22. [Pruebas y calidad](#22-pruebas-y-calidad)
23. [Roadmap por fases y backlog](#23-roadmap-por-fases-y-backlog)
24. [Pendientes por confirmar](#24-pendientes-por-confirmar)

---

## 1. Resumen ejecutivo

**Objetivo:** construir la plataforma de comercio electrónico de **Arte'Sano**, startup de belleza con productos artesanales (jabones de tocador, cremas, shampoo, lociones) formulados con ingredientes ancestrales del pueblo Zenú (Córdoba y Sucre), con estándar de e-commerce global de alto nivel: catálogo administrable, pagos en línea nacionales e internacionales, envíos a Colombia y al mundo, pedidos programados, chatbot de WhatsApp 24/7 y un módulo narrativo (ingredientes, artesanos, historias, experiencias, aliados) que diferencia la marca.

**Qué se entrega:**

| Componente | Descripción |
|---|---|
| **Storefront** (tienda pública) | Web responsive, multi-idioma (ES/EN), multi-moneda (COP/USD), SEO, checkout con pago en línea. |
| **Backoffice / Admin** | Panel para cargar productos (nombre, descripción, fotos, precio, IVA, inventario, variantes), gestionar pedidos, envíos, clientes, contenido, cupones, aliados y configuración. |
| **API Backend** | Servicio REST (Node.js) + PostgreSQL desplegado en Render, con webhooks de pagos, envíos y WhatsApp. |
| **Integraciones** | Pasarela nacional (Wompi/ePayco: PSE, Nequi, tarjetas), pasarela internacional (Stripe/PayPal), transportadoras (Servientrega/Coordinadora/DHL), WhatsApp Cloud API, Resend, Cloudinary (imágenes), facturación electrónica DIAN. |
| **Chatbot WhatsApp** | Catálogo, pedidos, pedidos programados, seguimiento, FAQs, escalamiento a humano. |

**Principios de diseño:** mobile-first, tiempo de carga < 2.5 s (LCP), checkout en ≤ 3 pasos, cero fricción para pedir por WhatsApp, contenido de origen verificable en cada ficha de producto.

---

## 2. Marca y contexto

**Fuente revisada:** [facebook.com/artesanoboutique1](https://www.facebook.com/artesanoboutique1) (Instagram: [@artesanoboutique_](https://www.instagram.com/artesanoboutique_)).

- **Nombre:** Arte'Sano ("Arte" + "Sano").
- **Bio actual:** *"Jabones artesanales y remedios naturales. Inspirados en plantas medicinales y saberes ancestrales."*
- **Categoría:** Belleza, cosmética y cuidado personal · Medicina alternativa.
- **Logo:** insignia circular crema; ramita de hojas verde oliva; monograma "A" (verde oliva) + "S" (beige/tan) en script; adorno de ramita inferior.
- **Paleta observada (aproximada, tomada de captura):**

| Token | HEX aprox. | Uso |
|---|---|---|
| `--color-primary` | `#7C8B5D` (verde oliva/sage) | Botones primarios, íconos, monograma "A" |
| `--color-secondary` | `#C9A876` (beige/tan) | Acentos, monograma "S", precios destacados |
| `--color-bg` | `#F5EDE0` (crema/hueso) | Fondo general |
| `--color-accent` | `#E8C9C0` (rosa palo/blush) | Línea "Arroz", badges suaves |
| `--color-text` | `#4A3F35` (marrón tierra) | Texto principal |

- **Empaque/fotografía:** cajas crema/rosa palo atadas con rafia, ilustración de pluma/hoja en línea fina, tipografía serif delicada, nombre del ingrediente como nombre de producto (ej. **"ARROZ"**); roll-ons de vidrio verde sage para "Loción"; fotografía en entornos tropicales.
- **Posicionamiento:** startup de *clean/slow beauty* con herencia Zenú (Córdoba y Sucre). Tono cálido, orgulloso del origen, educativo.
- **Estado actual:** ~72 seguidores en Facebook → marca en etapa temprana; el sitio debe proyectar confianza (pago seguro, políticas claras, testimonios, sellos institucionales, INVIMA).

---

## 3. Alcance funcional (storefront)

### 3.1 Mapa del sitio

| Ruta | Página | Notas |
|---|---|---|
| `/` | Inicio | Hero, líneas destacadas, best-sellers, historia breve, aliados, CTA WhatsApp |
| `/tienda` | Catálogo | Filtros: línea, tipo de piel/cabello, ingrediente, precio, disponibilidad; orden por relevancia/precio/novedad |
| `/tienda/[linea]` | Landing por línea | Cuidado del Cuerpo, Facial, Corporal, Especializadas, Aseo, Hogar, Otros |
| `/producto/[slug]` | Ficha de producto | Galería, variantes, precio con/sin IVA, ingredientes con enlace, artesano, modo de uso, INVIMA/NSO, reseñas, "Comprar" + "Pedir por WhatsApp", "Programar entrega" |
| `/ingredientes` y `/ingredientes/[slug]` | Ingredientes ancestrales | Guásimo, Arroz, Mataratón, Coco, Chopo… con productos relacionados |
| `/artesanos` y `/artesanos/[slug]` | Artesanos | Perfil, municipio (mapa), productos que elabora |
| `/historias` y `/historias/[slug]` | Historias (blog editorial) | Cultura Zenú, procesos, tradición |
| `/experiencias` y `/experiencias/[slug]` | Experiencias | Talleres/turismo comunitario reservables (fecha, cupos, pago) |
| `/portafolio` | Portafolio institucional | Catálogo PDF descargable, formulario B2B |
| `/aliados` | Aliados | Zaca, MinCIT y otros |
| `/carrito` | Carrito | Persistente (invitado + usuario) |
| `/checkout` | Checkout | 3 pasos: datos/dirección → envío → pago |
| `/pedido/[id]` | Confirmación y seguimiento | Estado, tracking, factura |
| `/cuenta/*` | Cuenta | Pedidos, pedidos programados, suscripciones, direcciones, favoritos |
| `/nosotros`, `/contacto`, `/politicas/*` | Institucionales | Envíos, devoluciones, privacidad (Ley 1581), T&C |
| `/en/*` | Versión en inglés | Mismo árbol de rutas |

### 3.2 Funcionalidades clave

- **Catálogo:** productos con variantes (tamaño/presentación), stock en tiempo real, etiquetas ("nuevo", "best-seller", "edición limitada"), productos relacionados, búsqueda con autocompletado.
- **Ficha de producto de nivel global:** galería zoom, video, tabla de ingredientes (INCI + nombre ancestral), beneficios, para qué tipo de piel, sin qué (parabenos, sulfatos), registro INVIMA, origen (municipio) y artesano, reseñas verificadas, preguntas y respuestas.
- **Carrito y checkout:** invitado o registrado, cupones, cálculo de IVA e envío en tiempo real, múltiples métodos de pago según país, guardado de direcciones, cumplimiento de datos.
- **Pedidos programados:** elegir fecha futura de entrega; recordatorios automáticos (email + WhatsApp).
- **Suscripciones (fase 2):** reposición cada 30/60/90 días con descuento.
- **Cuenta de cliente:** historial, tracking, re-pedido en 1 clic, favoritos, datos.
- **WhatsApp omnipresente:** botón flotante, "Pedir por WhatsApp" en cada ficha (deep link con SKU precargado), chatbot 24/7.
- **Reseñas y UGC:** reseñas post-compra (solicitud automática por email/WhatsApp), fotos de clientes.
- **Contenido narrativo** enlazado bidireccionalmente con productos.
- **Experiencias reservables:** fecha, cupos, pago anticipado.
- **B2B:** formulario de cotización mayorista con carga de portafolio.

---

## 4. Panel administrativo (backoffice)

Aplicación web protegida (`/admin`) con roles. Es el corazón operativo: aquí se suben los productos y se gestiona todo.

### 4.1 Roles y permisos

| Rol | Permisos |
|---|---|
| **Super Admin** | Todo, incluido configuración, usuarios admin, pasarelas |
| **Gerente de tienda** | Productos, pedidos, clientes, cupones, reportes |
| **Operador logístico** | Pedidos, envíos, guías, inventario |
| **Editor de contenido** | Ingredientes, artesanos, historias, experiencias, aliados, páginas |
| **Agente de atención** | Ver pedidos/clientes, bandeja WhatsApp, notas internas |

### 4.2 Módulos

**Productos**
- Crear/editar/duplicar/archivar producto.
- Campos: nombre, slug (auto), SKU, línea/categoría, subcategoría, descripción corta, descripción larga (editor enriquecido), ingredientes (selección múltiple desde catálogo de ingredientes), artesano responsable, modo de uso, beneficios, advertencias, tipo de piel/cabello, registro INVIMA/NSO, peso y dimensiones (para envío), país de origen, código arancelario HS (para exportación).
- **Precios:** precio base, **tipo de IVA** (19 % / 5 % / exento / excluido), indicador "precio incluye IVA", precio de comparación (tachado), precio mayorista (B2B), precio en USD (manual o por tasa automática).
- **Variantes:** tamaño/presentación con precio, SKU, stock y foto propios.
- **Imágenes:** carga múltiple con arrastrar/soltar, reordenar, imagen principal, texto alt; se suben a Cloudinary y se generan versiones optimizadas (WebP/AVIF, tamaños responsive).
- **Inventario:** stock por variante y bodega, umbral de bajo stock con alerta, historial de movimientos.
- **Estado:** borrador / publicado / programado (fecha de publicación) / archivado.
- **SEO:** meta título, meta descripción, OpenGraph image.
- Importación/exportación masiva por CSV.

**Pedidos**
- Listado con filtros (estado, fecha, país, método de pago, programado).
- Detalle: ítems, IVA desglosado, envío, pagos, timeline, notas internas, cliente.
- Acciones: confirmar, generar guía, marcar enviado (tracking), entregado, cancelar, reembolsar (total/parcial vía pasarela), reenviar confirmación, emitir factura electrónica.
- Vista "Pedidos programados" con calendario.

**Envíos**
- Zonas y tarifas (por ciudad/departamento/país, peso, valor), tarifas en vivo por API de transportadora, generación de guía y rótulo PDF, tracking.

**Clientes**
- Ficha con pedidos, LTV, direcciones, consentimientos, etiquetas, historial WhatsApp.

**Marketing**
- Cupones (porcentaje, monto, envío gratis, mínimo de compra, uso único, por cliente, vigencia), banners del home, colecciones destacadas, recuperación de carrito abandonado (email/WhatsApp).

**Contenido**
- CRUD de ingredientes, artesanos, historias, experiencias (con cupos y calendario), aliados, páginas institucionales, FAQs.

**WhatsApp**
- Bandeja de conversaciones (handoff humano), plantillas aprobadas, métricas del bot.

**Reportes**
- Ventas por día/línea/producto/país, ticket promedio, conversión, IVA recaudado, stock valorizado, exportación CSV/XLSX.

**Configuración**
- Datos fiscales (NIT, régimen), IVA por defecto, monedas y tasa de cambio, idiomas, pasarelas, transportadoras, plantillas de email, dominios, usuarios y roles, logs de auditoría.

### 4.3 UX del formulario de producto (resumen)

```
[Información básica]  Nombre · SKU · Línea · Estado · Artesano
[Descripción]         Corta · Larga (rich text) · Beneficios · Modo de uso · Advertencias
[Ingredientes]        Selector múltiple (Guásimo, Arroz, …) + INCI opcional
[Precio e impuestos]  Precio base COP · Tipo IVA · ¿Incluye IVA? · Precio USD · Precio B2B
[Variantes]           Tabla: presentación · SKU · precio · stock · imagen
[Imágenes]            Dropzone (máx. 10) · reordenar · alt
[Inventario]          Stock · umbral · bodega
[Envío]               Peso (g) · dimensiones (cm) · HS code · ¿frágil?
[Regulatorio]         INVIMA/NSO · país de origen · lote (opcional)
[SEO]                 Meta título · descripción · OG image
[Guardar borrador]  [Publicar]  [Vista previa]
```

---

## 5. Catálogo, precios e IVA

### 5.1 Líneas de producto (categorías de nivel 1)

| Línea | Ejemplos de productos |
|---|---|
| Cuidado del Cuerpo | Jabones de tocador (Arroz, Coco, Guásimo…), exfoliantes, aceites |
| Cuidado Facial | Limpiadores, cremas, tónicos, mascarillas, sérums |
| Corporal | Cremas hidratantes, mantecas, lociones aromáticas (roll-on) |
| Líneas Especializadas | Capilar (shampoo/acondicionador), piel sensible, antifúngico (Mataratón), bebé/familia |
| Aseo | Jabones de uso diario, higiene personal |
| Hogar | Jabón multiusos, aromatizantes, velas |
| Otros | Kits, regalos, ediciones limitadas, colaboraciones |

Categorías y subcategorías son administrables (no fijas en código).

### 5.2 Reglas de IVA (Colombia)

- Tipos soportados: **19 %** (general — aplica a la mayoría de cosméticos), **5 %**, **0 % exento**, **excluido**. Configurable por producto; valor por defecto en configuración global.
- Precio mostrado al cliente en Colombia: **con IVA incluido** (norma de protección al consumidor); el desglose aparece en carrito, checkout, confirmación y factura.
- Cálculo por ítem: `base = precio_con_iva / (1 + tasa)`, `iva = precio_con_iva − base`, redondeo a 2 decimales, totales sumados por ítem (no sobre el total) para evitar diferencias de centavos.
- Envío: IVA del servicio de transporte según configuración (por defecto 19 % si la transportadora factura con IVA).
- **Ventas internacionales (exportación):** tratadas como exportación de bienes → IVA 0 %; se muestra precio en USD sin IVA colombiano y aviso de posibles aranceles/impuestos de importación en destino (DDU). El pedido guarda `tax_regime = 'export'`.
- Cupones: se aplican sobre el precio antes de IVA proporcionalmente a cada ítem.
- Todo se guarda **inmutable** en el pedido (snapshot de precio, tasa y monto de IVA) para trazabilidad contable.

### 5.3 Moneda

- Moneda base: **COP**. Moneda secundaria: **USD** (más monedas en fase posterior).
- Precio en USD: fijado manualmente por producto o calculado con tasa diaria (API de tasas) + margen configurable; se congela en el pedido.

---

## 6. Arquitectura técnica

```
                ┌──────────────────────────────────────────────┐
                │                  CLIENTES                     │
                │  Navegador (web/móvil) · WhatsApp · Admin     │
                └───────────┬───────────────────┬───────────────┘
                            │ HTTPS              │ Meta Cloud API (webhook)
        ┌───────────────────▼───────────┐   ┌────▼──────────────────────┐
        │  STOREFRONT + ADMIN (Next.js) │   │   WHATSAPP SERVICE        │
        │  Hostinger (dominio + CDN)    │   │   (módulo del backend)    │
        │  SSR/ISR · i18n · SEO         │   └────┬──────────────────────┘
        └───────────────┬───────────────┘        │
                        │ REST/JSON (JWT)        │
        ┌───────────────▼────────────────────────▼──────────────────────┐
        │                 API BACKEND — Node.js (NestJS)                 │
        │                        Render (Web Service)                    │
        │  Auth · Catálogo · Carrito · Pedidos · Pagos · Envíos ·        │
        │  Programación · Contenido · Notificaciones · Reportes          │
        │  + Worker (BullMQ/cron): recordatorios, carritos abandonados,  │
        │    sincronización de tracking, tasas de cambio                 │
        └──┬─────────┬──────────┬──────────┬──────────┬──────────┬───────┘
           │         │          │          │          │          │
   ┌───────▼──┐ ┌────▼────┐ ┌───▼─────┐ ┌──▼──────┐ ┌─▼──────┐ ┌─▼───────────┐
   │PostgreSQL│ │  Redis  │ │Cloudinary│ │ Resend │ │ Pagos  │ │Transportad. │
   │ (Render) │ │ (Render)│ │ imágenes │ │ email  │ │Wompi/  │ │Servientrega │
   │          │ │ colas + │ │  + CDN   │ │        │ │Stripe/ │ │Coordinadora │
   │          │ │ caché   │ │          │ │        │ │PayPal  │ │DHL/Aramex   │
   └──────────┘ └─────────┘ └──────────┘ └────────┘ └────────┘ └─────────────┘
                                              + Facturación electrónica DIAN (proveedor tecnológico)
```

**Decisiones:**

- **Monorepo** en GitHub (`apps/web`, `apps/api`, `packages/shared`) para compartir tipos y validaciones.
- **Frontend Next.js** (React + TypeScript): SSR/ISR para SEO y velocidad; el admin vive en la misma app bajo `/admin` con guardas de rol (o app separada `apps/admin` si se prefiere aislar).
- **Backend NestJS** (Node + TypeScript): módulos claros, validación con DTOs, OpenAPI automático, fácil de testear. Prisma como ORM sobre PostgreSQL.
- **Hostinger** aloja dominio, DNS, correo corporativo y el frontend (Node hosting o build estático + reverse proxy); **Render** aloja API, worker, PostgreSQL y Redis.
- **Webhooks** de pagos/envíos/WhatsApp entran por endpoints firmados en la API.
- **Idempotencia** en creación de pedidos y procesamiento de webhooks (clave `Idempotency-Key` + tabla `webhook_events`).

---

## 7. Stack tecnológico detallado

> **Stack definitivo (implementado en Fase 0, alineado con MALIBUBOT y los demás proyectos del equipo):**

| Capa | Tecnología | Notas |
|---|---|---|
| Servidor | **Node.js 18+ (ESM) + Express** — un solo servicio | Sirve tienda (HTML renderizado en servidor, SEO), API, panel `/admin` y webhooks |
| Tienda pública | Plantillas HTML en servidor + CSS/JS vanilla con tokens de marca | Carrito en `localStorage`, checkout por API |
| Panel admin | HTML + JS vanilla servido por Express; sesión con cookie HMAC, freno a fuerza bruta, 2FA TOTP | Productos (variantes, imágenes, IVA, stock), pedidos, programados, contenido, WhatsApp, ajustes, diagnóstico |
| Base de datos | **PostgreSQL** (Render) vía `pg`, diseño write-through (memoria en vivo + réplica) | Sin `DATABASE_URL` funciona en memoria con catálogo de ejemplo |
| Imágenes | **Cloudinary** (subida directa firmada desde el panel) o URL | Transformaciones `f_auto,q_auto` |
| Email | **Resend** (fetch) | Confirmación de pedido, aviso de envío, alertas a la tienda |
| WhatsApp | **WhatsApp Business Cloud API (Meta)** (fetch) | Bot de menú guiado (Fase 3: Claude con tool use) + bandeja humana |
| Pagos | **RAPYD** — checkout hospedado, COP para Colombia y USD para el exterior; webhook firmado + revisor por polling | Una sola pasarela nacional e internacional |
| Envíos | Tabla de tarifas por zona editable en el panel (Fase posterior: API de transportadoras) | Colombia ciudades principales / resto; América / Europa / resto del mundo |
| Facturación electrónica | Proveedor DIAN vía API (Fase 2) | Obligatoria en Colombia |
| Repositorio / despliegue | **GitHub** → **Render** (`render.yaml`, autodeploy) | Health check `/health` |
| Dominio / correo | **Hostinger** (DNS de artesanoboutique.com → Render, buzón pedidos@) | SPF/DKIM/DMARC para Resend |

---

## 8. Modelo de datos

### 8.1 Diagrama entidad-relación (resumen)

```
users ─┬─< addresses
       ├─< orders ─┬─< order_items >─ product_variants >─ products ─┬─< product_images
       │           ├─< payments                                     ├─< product_ingredients >─ ingredients
       │           ├─< shipments                                    ├─── artisans
       │           └─── scheduled_orders                            ├─── categories (líneas)
       ├─< carts ─< cart_items                                      └─< reviews
       ├─< subscriptions
       └─< whatsapp_conversations ─< whatsapp_messages
coupons · inventory_movements · webhook_events · exchange_rates · settings · audit_logs
stories · experiences ─< experience_bookings · partners (aliados) · pages · faqs
```

### 8.2 Esquema SQL (núcleo)

```sql
-- Usuarios y autenticación
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         CITEXT UNIQUE NOT NULL,
  phone_e164    VARCHAR(20) UNIQUE,            -- vínculo con WhatsApp
  password_hash TEXT,                          -- null si sólo social/OTP
  full_name     VARCHAR(120) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer', -- customer|super_admin|manager|logistics|editor|agent
  locale        VARCHAR(5) NOT NULL DEFAULT 'es',
  currency      CHAR(3) NOT NULL DEFAULT 'COP',
  accepts_marketing BOOLEAN NOT NULL DEFAULT false,
  data_consent_at   TIMESTAMPTZ,               -- Ley 1581
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  label        VARCHAR(40),
  recipient    VARCHAR(120) NOT NULL,
  phone_e164   VARCHAR(20) NOT NULL,
  line1        VARCHAR(200) NOT NULL,
  line2        VARCHAR(200),
  city         VARCHAR(100) NOT NULL,
  state        VARCHAR(100) NOT NULL,          -- departamento / estado
  postal_code  VARCHAR(20),
  country_code CHAR(2) NOT NULL,               -- ISO 3166-1
  is_default   BOOLEAN NOT NULL DEFAULT false
);

-- Catálogo
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  UUID REFERENCES categories(id),
  slug       VARCHAR(120) UNIQUE NOT NULL,
  name       JSONB NOT NULL,                   -- {"es": "...", "en": "..."}
  description JSONB,
  image_url  TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE artisans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        VARCHAR(120) UNIQUE NOT NULL,
  name        VARCHAR(120) NOT NULL,
  bio         JSONB,
  municipality VARCHAR(100),
  department   VARCHAR(50),                    -- Córdoba | Sucre
  photo_url   TEXT,
  lat NUMERIC(9,6), lng NUMERIC(9,6),
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE ingredients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           VARCHAR(120) UNIQUE NOT NULL,
  name           JSONB NOT NULL,               -- {"es":"Guásimo","en":"Guazuma"}
  scientific_name VARCHAR(150),
  inci_name      VARCHAR(150),
  ancestral_use  JSONB,
  benefits       JSONB,
  origin_region  VARCHAR(120),
  image_url      TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true
);

CREATE TYPE tax_type AS ENUM ('iva_19','iva_5','exempt','excluded');
CREATE TYPE product_status AS ENUM ('draft','scheduled','published','archived');

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            VARCHAR(160) UNIQUE NOT NULL,
  name            JSONB NOT NULL,
  short_description JSONB,
  description     JSONB,                       -- HTML sanitizado por idioma
  benefits        JSONB,
  how_to_use      JSONB,
  warnings        JSONB,
  category_id     UUID NOT NULL REFERENCES categories(id),
  artisan_id      UUID REFERENCES artisans(id),
  tax_type        tax_type NOT NULL DEFAULT 'iva_19',
  price_includes_tax BOOLEAN NOT NULL DEFAULT true,
  base_price_cop  NUMERIC(12,2) NOT NULL,      -- precio de referencia (variantes pueden sobreescribir)
  compare_at_cop  NUMERIC(12,2),
  price_usd       NUMERIC(10,2),               -- null => calcular por tasa
  wholesale_price_cop NUMERIC(12,2),
  weight_grams    INT NOT NULL DEFAULT 0,
  length_cm NUMERIC(6,2), width_cm NUMERIC(6,2), height_cm NUMERIC(6,2),
  hs_code         VARCHAR(12),
  invima_code     VARCHAR(60),
  country_of_origin CHAR(2) NOT NULL DEFAULT 'CO',
  skin_types      TEXT[],                      -- ['seca','mixta',...]
  tags            TEXT[],
  seo_title       JSONB,
  seo_description JSONB,
  status          product_status NOT NULL DEFAULT 'draft',
  publish_at      TIMESTAMPTZ,
  rating_avg      NUMERIC(3,2) DEFAULT 0,
  rating_count    INT DEFAULT 0,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON products (status, category_id);
CREATE INDEX products_search_idx ON products USING GIN (to_tsvector('spanish', coalesce(name->>'es','') || ' ' || coalesce(short_description->>'es','')));

CREATE TABLE product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku          VARCHAR(60) UNIQUE NOT NULL,
  name         JSONB NOT NULL,                 -- {"es":"100 g"}
  price_cop    NUMERIC(12,2) NOT NULL,
  price_usd    NUMERIC(10,2),
  stock        INT NOT NULL DEFAULT 0,
  low_stock_threshold INT NOT NULL DEFAULT 5,
  weight_grams INT,
  image_url    TEXT,
  is_default   BOOLEAN NOT NULL DEFAULT false,
  is_active    BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,                    -- Cloudinary public URL
  public_id  TEXT NOT NULL,
  alt        JSONB,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE product_ingredients (
  product_id    UUID REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
  is_hero       BOOLEAN NOT NULL DEFAULT false, -- ingrediente protagonista
  PRIMARY KEY (product_id, ingredient_id)
);

CREATE TABLE inventory_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  UUID NOT NULL REFERENCES product_variants(id),
  delta       INT NOT NULL,
  reason      VARCHAR(30) NOT NULL,            -- sale|restock|adjustment|return|reservation
  reference_id UUID,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Carrito
CREATE TABLE carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  session_id VARCHAR(64),                      -- invitado
  currency   CHAR(3) NOT NULL DEFAULT 'COP',
  coupon_code VARCHAR(40),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  abandoned_notified_at TIMESTAMPTZ
);
CREATE TABLE cart_items (
  cart_id    UUID REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (cart_id, variant_id)
);

-- Pedidos
CREATE TYPE order_status AS ENUM ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded','failed');
CREATE TYPE tax_regime AS ENUM ('domestic','export');

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     VARCHAR(20) UNIQUE NOT NULL, -- AS-2026-000123
  user_id          UUID REFERENCES users(id),
  guest_email      CITEXT,
  status           order_status NOT NULL DEFAULT 'pending_payment',
  channel          VARCHAR(20) NOT NULL DEFAULT 'web', -- web|whatsapp|admin
  currency         CHAR(3) NOT NULL,
  exchange_rate    NUMERIC(14,6),               -- COP por unidad de currency
  tax_regime       tax_regime NOT NULL DEFAULT 'domestic',
  subtotal         NUMERIC(12,2) NOT NULL,      -- sin IVA
  discount_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_total        NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_total   NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_tax     NUMERIC(12,2) NOT NULL DEFAULT 0,
  grand_total      NUMERIC(12,2) NOT NULL,
  coupon_code      VARCHAR(40),
  shipping_address JSONB NOT NULL,             -- snapshot
  billing_info     JSONB,                      -- NIT/cédula, razón social para factura
  scheduled_for    DATE,                       -- pedido programado
  customer_note    TEXT,
  internal_notes   TEXT,
  invoice_number   VARCHAR(40),
  invoice_cufe     VARCHAR(120),               -- DIAN
  invoice_pdf_url  TEXT,
  idempotency_key  VARCHAR(80) UNIQUE,
  placed_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ, shipped_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ
);
CREATE INDEX ON orders (status, placed_at DESC);
CREATE INDEX ON orders (scheduled_for) WHERE scheduled_for IS NOT NULL;

CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id    UUID REFERENCES product_variants(id),
  product_name  VARCHAR(200) NOT NULL,         -- snapshot
  variant_name  VARCHAR(100),
  sku           VARCHAR(60) NOT NULL,
  image_url     TEXT,
  quantity      INT NOT NULL,
  unit_price    NUMERIC(12,2) NOT NULL,        -- sin IVA, en currency del pedido
  tax_type      tax_type NOT NULL,
  tax_rate      NUMERIC(5,4) NOT NULL,         -- 0.19
  tax_amount    NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_total    NUMERIC(12,2) NOT NULL         -- (unit_price*qty - discount) + tax
);

CREATE TYPE payment_status AS ENUM ('pending','approved','declined','voided','refunded','partially_refunded','error');
CREATE TABLE payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID NOT NULL REFERENCES orders(id),
  provider       VARCHAR(20) NOT NULL,         -- wompi|epayco|stripe|paypal|manual
  provider_ref   VARCHAR(120),                 -- id de transacción
  method         VARCHAR(30),                  -- pse|nequi|card|cash|apple_pay...
  amount         NUMERIC(12,2) NOT NULL,
  currency       CHAR(3) NOT NULL,
  status         payment_status NOT NULL DEFAULT 'pending',
  raw_response   JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE shipment_status AS ENUM ('pending','label_created','in_transit','delivered','exception','returned');
CREATE TABLE shipments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES orders(id),
  carrier       VARCHAR(40) NOT NULL,          -- servientrega|coordinadora|dhl|...
  service_level VARCHAR(40),
  tracking_number VARCHAR(80),
  tracking_url  TEXT,
  label_url     TEXT,
  cost          NUMERIC(12,2),
  status        shipment_status NOT NULL DEFAULT 'pending',
  estimated_delivery DATE,
  events        JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coupons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(40) UNIQUE NOT NULL,
  type        VARCHAR(20) NOT NULL,            -- percent|fixed|free_shipping
  value       NUMERIC(12,2) NOT NULL,
  min_subtotal NUMERIC(12,2),
  max_uses    INT, uses INT NOT NULL DEFAULT 0,
  per_user_limit INT,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id),
  variant_id   UUID NOT NULL REFERENCES product_variants(id),
  quantity     INT NOT NULL DEFAULT 1,
  interval_days INT NOT NULL,                  -- 30|60|90
  next_run_at  DATE NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'active',
  payment_token VARCHAR(160)                   -- token de pasarela
);

CREATE TABLE reviews (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  user_id    UUID REFERENCES users(id),
  order_id   UUID REFERENCES orders(id),       -- compra verificada
  rating     SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(120), body TEXT,
  photos     TEXT[],
  status     VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|approved|rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contenido
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(160) UNIQUE NOT NULL,
  title JSONB NOT NULL, excerpt JSONB, body JSONB,
  cover_url TEXT, author VARCHAR(120),
  related_product_ids UUID[], related_artisan_ids UUID[],
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ
);

CREATE TABLE experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(160) UNIQUE NOT NULL,
  title JSONB NOT NULL, description JSONB,
  location VARCHAR(160), duration_minutes INT,
  price_cop NUMERIC(12,2) NOT NULL, price_usd NUMERIC(10,2),
  tax_type tax_type NOT NULL DEFAULT 'iva_19',
  capacity INT NOT NULL,
  cover_url TEXT, gallery TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE experience_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES experiences(id),
  order_id UUID REFERENCES orders(id),
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL, slot TIME, people INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
);

CREATE TABLE partners (                        -- aliados
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL, type VARCHAR(40), -- gobierno|programa|comercial|ong
  logo_url TEXT, website TEXT, description JSONB,
  sort_order INT DEFAULT 0, is_active BOOLEAN DEFAULT true
);

-- WhatsApp
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_e164 VARCHAR(20) NOT NULL,
  user_id UUID REFERENCES users(id),
  state JSONB NOT NULL DEFAULT '{}',           -- máquina de estados del bot
  assigned_agent_id UUID REFERENCES users(id),
  mode VARCHAR(10) NOT NULL DEFAULT 'bot',     -- bot|human
  last_message_at TIMESTAMPTZ
);
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id),
  direction VARCHAR(3) NOT NULL,               -- in|out
  wa_message_id VARCHAR(120),
  type VARCHAR(20), body JSONB,
  status VARCHAR(20),                          -- sent|delivered|read|failed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Infraestructura
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(30) NOT NULL, event_id VARCHAR(160) NOT NULL,
  payload JSONB NOT NULL, processed_at TIMESTAMPTZ,
  UNIQUE (provider, event_id)
);
CREATE TABLE exchange_rates (
  base CHAR(3), quote CHAR(3), rate NUMERIC(14,6), fetched_at TIMESTAMPTZ,
  PRIMARY KEY (base, quote, fetched_at)
);
CREATE TABLE settings (key VARCHAR(80) PRIMARY KEY, value JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id), action VARCHAR(60), entity VARCHAR(40), entity_id UUID,
  diff JSONB, ip INET, created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 9. API REST — contratos

Base: `https://api.artesano.com/v1` · Autenticación: JWT (access 15 min + refresh 30 días, cookies httpOnly para web) · Admin: mismo JWT con `role` · Rate limiting por IP y usuario · Documentación OpenAPI en `/docs`.

### 9.1 Público / cliente

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` · `/auth/login` · `/auth/refresh` · `/auth/logout` | Autenticación |
| `POST` | `/auth/otp/request` · `/auth/otp/verify` | Login por WhatsApp/SMS OTP |
| `GET` | `/catalog/categories` | Árbol de líneas |
| `GET` | `/catalog/products?category=&ingredient=&skin=&q=&sort=&page=&currency=` | Listado con filtros y facetas |
| `GET` | `/catalog/products/:slug` | Ficha completa (variantes, imágenes, ingredientes, artesano, reseñas) |
| `GET` | `/catalog/ingredients` · `/catalog/ingredients/:slug` | Ingredientes |
| `GET` | `/catalog/artisans` · `/catalog/artisans/:slug` | Artesanos |
| `GET` | `/content/stories` · `/content/stories/:slug` · `/content/experiences` · `/content/partners` · `/content/pages/:slug` · `/content/faqs` | Contenido |
| `GET/POST/PATCH/DELETE` | `/cart` · `/cart/items` · `/cart/items/:variantId` · `/cart/coupon` | Carrito (usuario o sesión invitada) |
| `POST` | `/shipping/quote` `{address, items}` | Cotización de envío en vivo |
| `POST` | `/checkout/orders` (header `Idempotency-Key`) | Crea pedido `pending_payment`, reserva stock, devuelve totales con IVA |
| `POST` | `/checkout/orders/:id/pay` `{provider, method, token?}` | Inicia pago: devuelve URL de redirección (PSE/Wompi) o `client_secret` (Stripe) |
| `GET` | `/orders` · `/orders/:number` | Pedidos del cliente (tracking, factura) |
| `POST` | `/orders/:id/schedule` `{date}` | Programar/reprogramar entrega |
| `GET/POST/PATCH/DELETE` | `/account/addresses` | Direcciones |
| `GET/POST/PATCH` | `/account/subscriptions` | Suscripciones |
| `POST` | `/reviews` | Reseña (requiere pedido entregado) |
| `POST` | `/experiences/:id/bookings` | Reserva de experiencia |
| `POST` | `/b2b/quotes` | Solicitud de cotización mayorista |

### 9.2 Admin (`/admin/*`, requiere rol)

| Método | Ruta | Descripción |
|---|---|---|
| `GET/POST/PATCH/DELETE` | `/admin/products` · `/admin/products/:id` · `/admin/products/:id/variants` · `/admin/products/:id/images` | CRUD productos, variantes, imágenes |
| `POST` | `/admin/uploads/sign` | Firma para subida directa a Cloudinary |
| `POST` | `/admin/products/import` · `GET /admin/products/export` | CSV |
| `GET/PATCH` | `/admin/inventory` · `POST /admin/inventory/movements` | Stock |
| `GET/PATCH` | `/admin/orders` · `/admin/orders/:id` | Gestión de pedidos |
| `POST` | `/admin/orders/:id/ship` · `/refund` · `/cancel` · `/invoice` · `/resend-confirmation` | Acciones |
| `GET/POST/PATCH` | `/admin/shipping/zones` · `/admin/shipping/rates` · `/admin/shipments/:id/label` | Envíos |
| `GET/POST/PATCH/DELETE` | `/admin/coupons` · `/admin/banners` · `/admin/collections` | Marketing |
| `GET/POST/PATCH/DELETE` | `/admin/ingredients` · `/admin/artisans` · `/admin/stories` · `/admin/experiences` · `/admin/partners` · `/admin/pages` · `/admin/faqs` | Contenido |
| `GET/PATCH` | `/admin/customers` · `/admin/customers/:id` | Clientes |
| `GET` | `/admin/whatsapp/conversations` · `POST /admin/whatsapp/conversations/:id/reply` · `/takeover` · `/release` | Bandeja WhatsApp |
| `GET` | `/admin/reports/sales` · `/products` · `/tax` · `/inventory` | Reportes |
| `GET/PATCH` | `/admin/settings` · `/admin/users` | Configuración |

### 9.3 Webhooks (entrantes, firmados)

| Ruta | Proveedor | Efecto |
|---|---|---|
| `POST /webhooks/wompi` | Wompi | Actualiza `payments` + `orders.status` → `paid`; dispara email/WhatsApp; libera o confirma stock |
| `POST /webhooks/stripe` | Stripe | Igual (eventos `payment_intent.*`, `charge.refunded`) |
| `POST /webhooks/paypal` | PayPal | Igual |
| `POST /webhooks/shipping/:carrier` | Transportadora | Actualiza `shipments.events/status`; notifica cliente |
| `GET/POST /webhooks/whatsapp` | Meta Cloud API | Verificación + mensajes entrantes/estados |
| `POST /webhooks/resend` | Resend | Rebotes/entregas de email |

Todos verifican firma HMAC, registran en `webhook_events` y son idempotentes.

### 9.4 Ejemplo: creación de producto (admin)

```http
POST /v1/admin/products
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": { "es": "Jabón de Arroz", "en": "Rice Soap" },
  "short_description": { "es": "Limpieza suave con arroz de la sabana Zenú." },
  "description": { "es": "<p>…</p>" },
  "category_id": "…",
  "artisan_id": "…",
  "ingredient_ids": ["<arroz>", "<coco>"],
  "hero_ingredient_id": "<arroz>",
  "tax_type": "iva_19",
  "price_includes_tax": true,
  "base_price_cop": 18000,
  "price_usd": 6.5,
  "weight_grams": 110,
  "invima_code": "NSOC…",
  "variants": [
    { "sku": "AS-ARROZ-100", "name": { "es": "100 g" }, "price_cop": 18000, "stock": 120, "is_default": true },
    { "sku": "AS-ARROZ-PACK3", "name": { "es": "Pack x3" }, "price_cop": 48000, "stock": 40 }
  ],
  "images": [{ "public_id": "artesano/arroz-1", "url": "https://res.cloudinary.com/…", "alt": { "es": "Jabón de arroz" } }],
  "status": "published"
}
```

Respuesta `201` con el producto completo y precios calculados (`price_without_tax`, `tax_amount`).

---

## 10. Flujo de compra, pagos y facturación

```
Carrito → Checkout paso 1 (email/teléfono, dirección, ¿programar entrega?)
        → paso 2 (cotización de envío en vivo, selección de servicio)
        → paso 3 (método de pago según país)
        → POST /checkout/orders  (pedido pending_payment, stock reservado 30 min)
        → POST /checkout/orders/:id/pay
             ├─ Colombia: Wompi widget/redirect (PSE, Nequi, tarjeta, efectivo)
             └─ Internacional: Stripe Elements (tarjeta, Apple/Google Pay) o PayPal
        → Webhook aprueba → orden `paid` → email + WhatsApp de confirmación
        → Factura electrónica DIAN (job asíncrono) → PDF adjunto por email
        → Admin prepara → guía de envío → `shipped` (tracking al cliente)
        → Webhook transportadora → `delivered` → solicitud de reseña (48 h)
```

**Reglas:**
- Selección automática de pasarela por país de la dirección de envío (configurable).
- Reserva de stock con expiración; job libera reservas vencidas.
- Reintentos de pago sin crear un nuevo pedido.
- Reembolsos desde admin llaman a la API de la pasarela y registran movimiento de inventario si aplica.
- Pago contra entrega: opcional para ciudades seleccionadas (configurable, requiere confirmación por WhatsApp).
- Facturación electrónica obligatoria (Colombia) vía proveedor tecnológico; para exportaciones se emite factura de exportación.
- Pedidos por WhatsApp: el bot crea el pedido (`channel = 'whatsapp'`) y envía **link de pago** seguro.

---

## 11. Envíos nacionales e internacionales

- **Zonas:** Colombia (ciudades principales / intermedias / zonas especiales), Latinoamérica, Norteamérica, Europa, resto del mundo.
- **Cotización:** tarifa en vivo por API de transportadora usando peso volumétrico (`L×A×H/5000`) vs. real; fallback a tabla de tarifas por zona/peso si la API falla.
- **Reglas de negocio:** envío gratis por umbral (configurable por zona), recargos por zona especial, tiempos estimados mostrados en checkout.
- **Guías:** generación desde admin (API) con rótulo PDF; número de tracking sincronizado por webhook o polling (job cada 2 h).
- **Internacional:** documentación de exportación (factura comercial con HS code, descripción en inglés, valor declarado), incoterm DDU (impuestos en destino a cargo del cliente, avisado en checkout), restricciones por país para cosméticos configurables.
- **Empaque:** peso de empaque configurable, opción "regalo" con nota.

---

## 12. Pedidos programados y suscripciones

**Pedidos programados**
- En checkout o vía WhatsApp el cliente elige una fecha futura (`orders.scheduled_for`) — mínimo +2 días, máximo +90.
- El pago se realiza al crear el pedido (o se autoriza y captura al despachar, si la pasarela lo soporta).
- Job diario (worker): 3 días antes → recordatorio; 1 día antes → aviso a logística y aparece en la vista "Por despachar mañana"; día de despacho → cambia a `processing`.
- Reprogramación desde la cuenta o WhatsApp hasta 48 h antes.

**Suscripciones (fase 2)**
- Reposición periódica con token de pago; job diario crea pedidos `next_run_at = hoy`, cobra, notifica; pausa/cancelación desde cuenta o WhatsApp.

---

## 13. Chatbot de WhatsApp

**Plataforma:** WhatsApp Business Cloud API (Meta) con número verificado y nombre de empresa; webhook al backend; plantillas de mensaje aprobadas para notificaciones fuera de la ventana de 24 h.

**Arquitectura del bot:** máquina de estados por conversación (`whatsapp_conversations.state`), mensajes interactivos (botones, listas, catálogo), opción de capa de NLU/LLM para entender lenguaje natural con respuestas basadas en la base de conocimiento del sitio (productos, ingredientes, políticas).

**Flujos:**

| Flujo | Descripción |
|---|---|
| Bienvenida / menú | Botones: Ver productos · Hacer pedido · Programar pedido · Rastrear · Ingredientes · Hablar con alguien |
| Catálogo | Lista por línea → producto (foto, precio, link a ficha) → agregar al pedido |
| Pedido | Carrito conversacional → dirección (o elegir guardada) → cotización de envío → resumen con IVA → **link de pago** → confirmación |
| Programar pedido | Igual + fecha (lista de fechas) → recordatorios automáticos |
| Rastreo | Pide número de pedido o teléfono → estado + tracking |
| Ingredientes/FAQ | Respuestas desde base de conocimiento (Guásimo, Arroz, Mataratón, Coco, Chopo…), envíos, devoluciones |
| Handoff humano | `mode = 'human'`; agente responde desde bandeja admin; retorno al bot al cerrar |
| Notificaciones salientes | Confirmación de pago, envío con tracking, entrega, recordatorio programado, carrito abandonado (con consentimiento), solicitud de reseña |

**Deep links en el sitio:** `https://wa.me/57XXXXXXXXXX?text=Hola,%20quiero%20el%20producto%20AS-ARROZ-100` — el bot reconoce el SKU y precarga.

**Métricas:** conversaciones, pedidos originados, tasa de handoff, tiempo de respuesta.

---

## 14. Notificaciones por email (Resend)

Plantillas con React Email, bilingües, con identidad de marca:

| Evento | Plantilla |
|---|---|
| Registro / verificación | `welcome`, `verify-email`, `reset-password` |
| Pedido | `order-confirmation` (desglose IVA, PDF factura), `order-paid`, `order-shipped` (tracking), `order-delivered`, `order-cancelled`, `refund-issued` |
| Programados | `scheduled-reminder-3d`, `scheduled-reminder-1d` |
| Marketing (opt-in) | `abandoned-cart`, `review-request`, `back-in-stock`, `newsletter` |
| Admin | `low-stock-alert`, `new-order-alert`, `b2b-quote-request`, `daily-scheduled-orders` |
| B2B | `quote-received`, `quote-response` |

Dominio de envío verificado (SPF/DKIM/DMARC en Hostinger DNS), webhooks de rebote, lista de supresión.

---

## 15. Contenido: ingredientes, artesanos, historias, experiencias, aliados

- **Ingredientes:** ficha por insumo — nombre común/científico/INCI, uso ancestral Zenú, beneficio cosmético, región de origen (Córdoba/Sucre), imagen, productos que lo contienen. Iniciales: **Guásimo, Arroz, Mataratón, Coco, Chopo** (extensible).
- **Artesanos:** perfil con foto, municipio (mapa), historia, productos que elabora; en cada ficha de producto aparece "Elaborado por…".
- **Historias:** editorial (cultura Zenú, procesos, tradición), con productos y artesanos relacionados; SEO.
- **Experiencias:** talleres y turismo comunitario con calendario, cupos y pago en línea.
- **Portafolio:** PDF generado automáticamente desde el catálogo (job) + formulario B2B.
- **Aliados:** Zaca, Ministerio de Industria, Comercio y Turismo (MinCIT) y otros (Artesanías de Colombia, ProColombia, cámaras de comercio, SENA…) — logos, descripción del rol, enlace.

Todo administrable desde el backoffice; todos los textos con soporte ES/EN (JSONB por idioma).

---

## 16. Internacionalización, moneda y SEO

- **Idiomas:** ES (por defecto) y EN; rutas `/en/*`; `hreflang`; contenido por idioma en base de datos; detección por `Accept-Language` con selector manual.
- **Moneda:** selector COP/USD; geolocalización por IP para sugerir; precios congelados en el pedido.
- **SEO:** SSR/ISR, metadatos por página, `sitemap.xml` dinámico, `robots.txt`, JSON-LD (`Product`, `Offer`, `AggregateRating`, `Organization`, `BreadcrumbList`, `Article`), URLs limpias, Core Web Vitals, imágenes optimizadas, canónicas, Open Graph para compartir en WhatsApp/Instagram.
- **Accesibilidad:** WCAG 2.1 AA (contraste con la paleta, navegación por teclado, alt en imágenes).

---

## 17. Seguridad y cumplimiento legal (Colombia)

**Seguridad**
- HTTPS en todo (Hostinger + Render), HSTS, cabeceras (CSP, X-Frame-Options), CORS restringido.
- Contraseñas con Argon2id; JWT de corta vida + refresh rotativo; OTP con expiración y rate limit.
- **PCI DSS:** nunca se almacenan datos de tarjeta; se usan widgets/tokens de Wompi/Stripe (SAQ-A).
- Validación de entrada (zod/class-validator), sanitización de HTML del editor, protección CSRF en cookies, rate limiting, protección contra enumeración.
- Verificación de firmas HMAC en todos los webhooks; secretos sólo en variables de entorno.
- RBAC en admin, logs de auditoría, 2FA para administradores.
- Backups automáticos diarios de PostgreSQL (Render) + retención 30 días; pruebas de restauración.
- Dependencias auditadas en CI (`npm audit`, Dependabot).

**Cumplimiento**
- **Ley 1581 de 2012 (Habeas Data):** política de tratamiento de datos, consentimiento explícito, registro de consentimientos, derechos ARCO (exportar/eliminar cuenta desde `/cuenta`).
- **Ley 1480 (Estatuto del Consumidor) / Decreto 587 de 2016 (comercio electrónico):** precios finales con IVA, derecho de retracto (5 días hábiles), información del vendedor (NIT, dirección), términos claros, comprobante de la transacción.
- **INVIMA:** registro/Notificación Sanitaria Obligatoria (NSO) visible por producto; etiquetado según Decisión Andina 833.
- **DIAN:** facturación electrónica; reportes de IVA exportables.
- **Exportación:** documentación aduanera, restricciones por país (validación configurable).
- Cookies: banner de consentimiento con categorías.

---

## 18. DevOps: repositorios, entornos, CI/CD

**Repositorio GitHub (monorepo):** `artesano-ecommerce`

```
main        → producción (protegida, PR + revisión + CI verde)
develop     → staging
feature/*   → ramas de trabajo
```

**Entornos**

| Entorno | Frontend | API/Worker/DB | Dominio |
|---|---|---|---|
| Local | `next dev` | `nest start --watch` + Docker Compose (Postgres, Redis) | localhost |
| Staging | Hostinger (subdominio) o Render preview | Render (plan starter) | `staging.artesano.com` |
| Producción | Hostinger | Render (autoscaling, DB con backups) | `artesano.com` · `api.artesano.com` |

**Pipelines (GitHub Actions)**
1. `ci.yml` en cada PR: lint, typecheck, tests unitarios e integración (Postgres en servicio), build, `npm audit`.
2. `deploy-api.yml` en push a `main`: Render Deploy Hook → migraciones Prisma (`prisma migrate deploy`) → health check `/health`.
3. `deploy-web.yml` en push a `main`: build Next.js → despliegue a Hostinger (Git deploy / SSH / API de Hostinger) → purga de caché CDN.
4. `nightly.yml`: pruebas E2E (Playwright) contra staging, Lighthouse CI, backup check.

**Infra como configuración:** `render.yaml` (Blueprint) define web service, worker, Postgres y Redis. `docker-compose.yml` para desarrollo local. Migraciones versionadas; seeds para catálogo demo, categorías, ingredientes y aliados.

---

## 19. Estructura del código

```
artesano-ecommerce/
├─ apps/
│  ├─ web/                      # Next.js (storefront + /admin)
│  │  ├─ app/
│  │  │  ├─ (store)/            # rutas públicas: /, tienda, producto, ingredientes, ...
│  │  │  ├─ (account)/          # cuenta del cliente
│  │  │  ├─ admin/              # backoffice (layout con guard de rol)
│  │  │  └─ [locale]/           # i18n
│  │  ├─ components/ (ui, product, cart, checkout, admin, content)
│  │  ├─ lib/ (api-client, i18n, currency, analytics, seo)
│  │  ├─ styles/ (tokens de marca)
│  │  └─ emails/                # React Email templates (Resend)
│  └─ api/                      # NestJS
│     ├─ src/
│     │  ├─ modules/
│     │  │  ├─ auth/  users/  catalog/ (products, variants, categories, ingredients, artisans)
│     │  │  ├─ cart/  checkout/  orders/  payments/ (wompi, stripe, paypal)
│     │  │  ├─ shipping/ (carriers/servientrega, coordinadora, dhl, quote)
│     │  │  ├─ scheduling/  subscriptions/  coupons/  reviews/
│     │  │  ├─ content/ (stories, experiences, partners, pages, faqs)
│     │  │  ├─ whatsapp/ (webhook, bot state machine, templates, inbox)
│     │  │  ├─ notifications/ (resend, whatsapp)
│     │  │  ├─ invoicing/ (DIAN provider)
│     │  │  ├─ uploads/ (cloudinary signing)
│     │  │  ├─ reports/  settings/  audit/
│     │  │  └─ webhooks/
│     │  ├─ jobs/ (BullMQ processors: reminders, abandoned carts, tracking sync, fx rates, invoices)
│     │  ├─ common/ (guards, interceptors, filters, pipes, idempotency)
│     │  └─ main.ts
│     ├─ prisma/ (schema.prisma, migrations/, seed.ts)
│     └─ test/
├─ packages/
│  ├─ shared/                   # tipos, zod schemas, utilidades (IVA, moneda)
│  └─ config/                   # eslint, tsconfig, tailwind preset (tokens)
├─ .github/workflows/
├─ render.yaml
├─ docker-compose.yml
└─ README.md
```

---

## 20. Variables de entorno

**API (Render)**
```
NODE_ENV, PORT, APP_URL, API_URL
DATABASE_URL, REDIS_URL
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ADMIN_2FA_ISSUER
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
RESEND_API_KEY, EMAIL_FROM, RESEND_WEBHOOK_SECRET
WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_BUSINESS_ACCOUNT_ID, WHATSAPP_ACCESS_TOKEN, WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET
WOMPI_PUBLIC_KEY, WOMPI_PRIVATE_KEY, WOMPI_EVENTS_SECRET, WOMPI_INTEGRITY_SECRET
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID
SERVIENTREGA_*, COORDINADORA_*, DHL_API_KEY (según transportadoras contratadas)
DIAN_PROVIDER_API_KEY, DIAN_PROVIDER_URL
FX_API_KEY, DEFAULT_TAX_TYPE=iva_19
SENTRY_DSN
```

**Web (Hostinger)**
```
NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_WOMPI_PUBLIC_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_WHATSAPP_NUMBER
NEXT_PUBLIC_GA4_ID, NEXT_PUBLIC_META_PIXEL_ID
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
SENTRY_DSN
```

---

## 21. Rendimiento, observabilidad y analítica

- Objetivos: LCP < 2.5 s, CLS < 0.1, TTFB < 500 ms, API p95 < 300 ms.
- ISR para catálogo y contenido (revalidación al publicar desde admin), caché Redis para listados y tasas, imágenes responsive por Cloudinary, code splitting, prefetch.
- Health checks `/health` y `/ready`; logs estructurados (JSON); Sentry para errores; alertas de uptime; dashboard de colas (Bull Board) en admin.
- Analítica: GA4 e-commerce (view_item, add_to_cart, begin_checkout, purchase), Meta Pixel + Conversions API, atribución por canal (web vs. WhatsApp), embudos, reportes internos.

---

## 22. Pruebas y calidad

| Nivel | Herramienta | Cobertura |
|---|---|---|
| Unitarias | Vitest/Jest | Cálculo de IVA, totales, cupones, reglas de envío, máquina de estados del bot |
| Integración API | Jest + Supertest + Postgres de prueba | Endpoints, webhooks (firmas), idempotencia, reserva de stock |
| E2E | Playwright | Compra completa (COP y USD), pedido programado, admin: crear producto con fotos e IVA, flujo WhatsApp simulado |
| Contrato | OpenAPI + zod compartido | Front y back sincronizados |
| Rendimiento | Lighthouse CI, k6 (carga en checkout) | Umbrales definidos arriba |
| Seguridad | `npm audit`, OWASP ZAP baseline, revisión de dependencias | En CI |

Definición de "hecho": código revisado por PR, tests verdes, documentado en OpenAPI, probado en staging, sin errores en Sentry.

---

## 23. Roadmap por fases y backlog

| Fase | Alcance | Duración estimada |
|---|---|---|
| **0. Fundaciones** | Monorepo, CI/CD, entornos (Hostinger/Render), diseño UI (tokens de marca), modelo de datos, auth, seeds | 2 semanas |
| **1. Catálogo + Admin de productos** | CRUD de productos/variantes/imágenes/IVA/inventario, categorías, ingredientes, artesanos; storefront catálogo y fichas; búsqueda | 3 semanas |
| **2. Checkout y pagos Colombia** | Carrito, cotización de envío, checkout, Wompi (PSE/Nequi/tarjeta), emails Resend, gestión de pedidos y envíos en admin, facturación DIAN | 3 semanas |
| **3. WhatsApp** | Cloud API, bot (catálogo, pedido, rastreo, FAQ), handoff, notificaciones, bandeja admin | 2–3 semanas |
| **4. Pedidos programados + contenido** | Programación y recordatorios, historias, experiencias con reservas, aliados, portafolio PDF, reseñas | 2 semanas |
| **5. Internacional** | EN, USD, Stripe/PayPal, DHL/FedEx, documentación de exportación, IVA 0 % exportación | 2–3 semanas |
| **6. Crecimiento** | Suscripciones, carrito abandonado, cupones avanzados, B2B, reportes avanzados, optimización CRO/SEO | continuo |

**Épicas del backlog (Jira/GitHub Projects):** `EPIC-01 Fundaciones`, `EPIC-02 Catálogo`, `EPIC-03 Admin productos`, `EPIC-04 Carrito/Checkout`, `EPIC-05 Pagos CO`, `EPIC-06 Envíos`, `EPIC-07 Pedidos/Facturación`, `EPIC-08 WhatsApp`, `EPIC-09 Programados`, `EPIC-10 Contenido`, `EPIC-11 i18n/USD/Pagos INTL`, `EPIC-12 Seguridad/Legal`, `EPIC-13 Analítica/SEO`, `EPIC-14 Suscripciones/B2B`.

---

## 24. Pendientes por confirmar

- [ ] **Nombre y dominio definitivos** (¿Arte'Sano? ¿dominio `.com`/`.co` ya registrado en Hostinger?).
- [ ] **Assets de marca** en alta resolución (logo vectorial, HEX exactos, tipografías, fotografías de producto).
- [ ] **Acceso a la página de Facebook/Instagram** (o exportación de fotos/posts) para migrar catálogo, historias y contenido completos — el acceso público está limitado por login.
- [ ] **Proveedores ya usados en los otros proyectos** (para reutilizar cuentas/código): pasarela (¿Wompi, ePayco, PayU, Mercado Pago?), plataforma de WhatsApp (¿Cloud API directa, Twilio, 360dialog, Wati?), transportadora/agregador, proveedor de facturación DIAN, servicio de imágenes, y forma de despliegue del frontend en Hostinger (Node hosting, estático o VPS).
- [ ] **Datos fiscales:** NIT, régimen (responsable de IVA), resolución de facturación, tipo de IVA aplicable por producto (confirmar con contador si algún producto es exento/excluido).
- [ ] **Registros INVIMA/NSO** por producto y etiquetado.
- [ ] **Catálogo inicial:** lista de productos con presentaciones, precios, stock, fotos, ingredientes y artesano.
- [ ] **Artesanos y municipios** (Córdoba/Sucre) con autorización de uso de imagen.
- [ ] **Ingrediente "Chopo":** identificación botánica y uso para la ficha.
- [ ] **Alianzas:** alcance y logos de **Zaca** y **MinCIT**; otros aliados; marca **"ECOAfro"** vista en una foto (¿aliado, proveedor o sub-línea?).
- [ ] **Políticas:** envíos (tiempos, umbral de envío gratis), devoluciones/retracto, garantía.
- [ ] **Países destino prioritarios** para la fase internacional (define transportadora y restricciones).
- [ ] **Experiencias:** ubicaciones, cupos, precios y responsables.

---

*Siguiente paso propuesto: aprobar este documento, resolver los pendientes de la sección 24 y arrancar la Fase 0 (creación del monorepo en GitHub, blueprint de Render, configuración de dominio en Hostinger y diseño de tokens/UI).*
