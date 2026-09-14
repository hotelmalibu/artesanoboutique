// ============================================================
//  confirmar.js — Al confirmarse un pago: marca el pedido como pagado,
//  envia los correos (cliente + tienda) y avisa por WhatsApp si el pedido
//  nacio en el chat. Es idempotente.
// ============================================================
import { actualizarEstado } from '../almacen/pedidos.js';
import { store } from '../almacen/conversaciones.js';
import { enviarTexto } from '../whatsapp/enviar.js';
import { confirmarPedidoPorCorreo } from '../correo/enviar.js';
import { formatear } from '../util/moneda.js';
import { config } from '../config.js';

export async function confirmarPago(pedido, referencia = '') {
  if (!pedido || pedido.estado !== 'pendiente_pago') return false;
  actualizarEstado(pedido.id, 'pagado', 'Pago confirmado' + (referencia ? ' · ref ' + referencia : ''), { referenciaPago: referencia || pedido.referenciaPago });
  console.log(`[pago] Pedido ${pedido.numero} confirmado como PAGADO.`);

  confirmarPedidoPorCorreo(pedido).catch(() => {});

  if (pedido.waId && store.ventanaAbierta(pedido.waId)) {
    const msg =
      `¡Tu pago fue confirmado! ✅ Pedido *${pedido.numero}* por ${formatear(pedido.totales.total, pedido.moneda)}.\n` +
      (pedido.programadoPara ? `Lo despacharemos para tu fecha programada: ${pedido.programadoPara}.\n` : 'Empezamos a prepararlo con mucho cariño.\n') +
      `Te avisaremos por aquí y a ${pedido.cliente.email} cuando salga. Sigue tu pedido en ${config.publicUrl}/pedido/${pedido.numero}`;
    enviarTexto(pedido.waId, msg).catch(() => {});
    store.registrarSaliente({ waId: pedido.waId, autor: 'bot', texto: msg });
  }
  return true;
}

export function rechazarPago(pedido, motivo = 'Pago rechazado por la pasarela') {
  if (!pedido || pedido.estado !== 'pendiente_pago') return false;
  actualizarEstado(pedido.id, 'rechazado', motivo);
  return true;
}
