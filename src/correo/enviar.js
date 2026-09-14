// ============================================================
//  enviar.js — Envio de correos con Resend (confirmacion de pedido,
//  aviso de envio, alertas a la tienda).
// ============================================================
import { config } from '../config.js';
import { formatear } from '../util/moneda.js';
import { NOMBRES_IVA } from '../util/iva.js';
import { escapar } from '../util/texto.js';

function activo() {
  return !!config.correo.resendApiKey;
}

const ultimos = [];
function registrar(entrada) {
  ultimos.unshift({ cuando: new Date().toISOString(), ...entrada });
  if (ultimos.length > 25) ultimos.length = 25;
}
export function ultimosEnviosCorreo() {
  return { hayApiKey: activo(), remitente: config.correo.remitente, tienda: config.correo.tienda, ultimos };
}

export async function enviarCorreo({ to, subject, html }) {
  if (!activo()) {
    console.warn('[correo] Sin RESEND_API_KEY; no se envia:', subject, '->', to);
    registrar({ to, subject, ok: false, error: 'Falta RESEND_API_KEY' });
    return false;
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.correo.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.correo.remitente,
        to,
        subject,
        html,
        ...(config.correo.responder ? { reply_to: config.correo.responder } : {}),
      }),
    });
    if (!resp.ok) {
      const d = await resp.text().catch(() => '');
      console.error('[correo] Error Resend:', resp.status, d.slice(0, 200), '| para:', to);
      registrar({ to, subject, ok: false, status: resp.status, error: d.slice(0, 300) });
      return false;
    }
    const info = await resp.json().catch(() => ({}));
    console.log('[correo] Enviado OK ->', to, '| id:', info.id || '?', '| asunto:', subject);
    registrar({ to, subject, ok: true, status: resp.status, id: info.id || null });
    return true;
  } catch (err) {
    console.error('[correo] Error enviando:', err.message);
    registrar({ to, subject, ok: false, error: err.message });
    return false;
  }
}

// ---------- Plantillas ----------

const C = { tinta: '#4A3F35', verde: '#7C8B5D', beige: '#C9A876', crema: '#F5EDE0', linea: '#E6DCC8', gris: '#8A7F72' };

function marco(titulo, cuerpo) {
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:600px;margin:0 auto;color:${C.tinta};background:#fff">
    <div style="background:${C.crema};padding:22px 26px;border-bottom:2px solid ${C.beige}">
      <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:${C.verde};font-weight:700">${escapar(config.tienda.nombre)}</div>
      <h2 style="margin:6px 0 0;font-weight:600">${titulo}</h2>
    </div>
    <div style="padding:22px 26px">${cuerpo}</div>
    <div style="padding:14px 26px;font-size:12px;color:${C.gris};border-top:1px solid ${C.linea}">
      ${escapar(config.tienda.nombre)} · Cosmética artesanal de origen ancestral Zenú · ${escapar(config.tienda.direccion)}<br/>
      <a href="${config.publicUrl}" style="color:${C.verde}">${config.publicUrl.replace(/^https?:\/\//, '')}</a>
    </div>
  </div>`;
}

function tablaPedido(p) {
  const m = p.moneda;
  const filas = p.items
    .map(
      (l) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid ${C.linea}">${escapar(l.productoNombre)}<br/><span style="color:${C.gris};font-size:12px">${escapar(l.varianteNombre)} · ${l.cantidad} × ${formatear(l.precioUnitario + l.ivaUnitario, m)}</span></td>
        <td style="padding:8px 10px;border-bottom:1px solid ${C.linea};text-align:right;font-weight:600">${formatear(l.total, m)}</td></tr>`
    )
    .join('');
  const t = p.totales;
  const fila = (k, v, negrita) =>
    `<tr><td style="padding:6px 10px;color:${C.gris}">${k}</td><td style="padding:6px 10px;text-align:right;${negrita ? 'font-weight:700;font-size:16px' : ''}">${v}</td></tr>`;
  return `
    <table style="border-collapse:collapse;width:100%;background:#fff;border:1px solid ${C.linea};border-radius:10px">
      ${filas}
      ${fila('Subtotal (sin IVA)', formatear(t.subtotal, m))}
      ${t.descuento ? fila('Descuento', '- ' + formatear(t.descuento, m)) : ''}
      ${fila(p.regimen === 'exportacion' ? 'IVA (exportación)' : 'IVA', formatear(t.iva, m))}
      ${fila('Envío' + (p.envio?.gratis ? ' (gratis)' : ''), formatear(t.envio + t.envioIva, m))}
      ${fila('Total', formatear(t.total, m), true)}
    </table>`;
}

function datosEntrega(p) {
  const d = p.direccion;
  return `<p style="margin:14px 0 0;font-size:14px;line-height:1.5">
    <strong>Entrega:</strong> ${escapar(d.linea1)}${d.linea2 ? ', ' + escapar(d.linea2) : ''}, ${escapar(d.ciudad)}${d.departamento ? ', ' + escapar(d.departamento) : ''} (${escapar(d.pais)})<br/>
    <strong>Transportadora:</strong> ${escapar(p.envio?.transportadora || '')} · ${escapar(p.envio?.dias || '')}<br/>
    ${p.programadoPara ? `<strong>Entrega programada para:</strong> ${escapar(p.programadoPara)}<br/>` : ''}
    <strong>Contacto:</strong> ${escapar(p.cliente.nombre)} · ${escapar(p.cliente.telefono)} · ${escapar(p.cliente.email)}
    ${p.nota ? `<br/><strong>Nota:</strong> ${escapar(p.nota)}` : ''}
  </p>`;
}

export async function confirmarPedidoPorCorreo(p) {
  const urlPedido = `${config.publicUrl}/pedido/${encodeURIComponent(p.numero)}`;
  const aviso = `<div style="margin:14px 0;padding:10px 14px;background:#e9f0e3;border:1px solid #cfdcc3;border-radius:10px;color:${C.verde};font-size:14px;font-weight:700">PAGO CONFIRMADO ✓ · Pedido ${escapar(p.numero)}</div>`;
  const tareas = [
    enviarCorreo({
      to: p.cliente.email,
      subject: `Pedido ${p.numero} confirmado — ${config.tienda.nombre}`,
      html: marco(
        '¡Gracias por tu compra!',
        `<p style="font-size:15px;line-height:1.5">Hola ${escapar(p.cliente.nombre)}, recibimos tu pago y ya estamos preparando tu pedido con mucho cariño.</p>
         ${aviso}${tablaPedido(p)}${datosEntrega(p)}
         <p style="margin-top:18px"><a href="${urlPedido}" style="background:${C.verde};color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:700">Ver el estado de mi pedido</a></p>
         <p style="font-size:12px;color:${C.gris}">IVA aplicado según tipo de producto (${Object.values(NOMBRES_IVA).join(' / ')}). Este correo sirve como comprobante de la transacción.</p>`
      ),
    }),
  ];
  if (config.correo.tienda) {
    tareas.push(
      enviarCorreo({
        to: config.correo.tienda,
        subject: `Nuevo pedido pagado ${p.numero} — ${formatear(p.totales.total, p.moneda)}${p.programadoPara ? ' (programado ' + p.programadoPara + ')' : ''}`,
        html: marco('Nuevo pedido pagado', `${aviso}${tablaPedido(p)}${datosEntrega(p)}<p><a href="${config.publicUrl}/admin" style="color:${C.verde}">Abrir en el panel</a></p>`),
      })
    );
  }
  const res = await Promise.allSettled(tareas);
  return res.some((r) => r.status === 'fulfilled' && r.value);
}

export async function avisarEnvioPorCorreo(p) {
  const urlPedido = `${config.publicUrl}/pedido/${encodeURIComponent(p.numero)}`;
  return enviarCorreo({
    to: p.cliente.email,
    subject: `Tu pedido ${p.numero} va en camino — ${config.tienda.nombre}`,
    html: marco(
      '¡Tu pedido va en camino!',
      `<p style="font-size:15px;line-height:1.5">Hola ${escapar(p.cliente.nombre)}, tu pedido salió con ${escapar(p.transportadora || p.envio?.transportadora || 'nuestra transportadora')}.</p>
       ${p.guia ? `<p><strong>Guía:</strong> ${escapar(p.guia)}${p.urlSeguimiento ? ` · <a href="${escapar(p.urlSeguimiento)}" style="color:${C.verde}">Rastrear</a>` : ''}</p>` : ''}
       ${tablaPedido(p)}${datosEntrega(p)}
       <p style="margin-top:18px"><a href="${urlPedido}" style="background:${C.verde};color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:700">Ver mi pedido</a></p>`
    ),
  });
}

/** Diagnostico: envia un correo de prueba. */
export async function probarCorreo(to) {
  const destino = to || config.correo.tienda;
  const ok = await enviarCorreo({ to: destino, subject: `Prueba ${config.tienda.nombre} ✅`, html: marco('Prueba de correo', '<p>Si ves este correo, el envío con Resend funciona. 🌿</p>') });
  return { ok, destino, remitente: config.correo.remitente };
}
