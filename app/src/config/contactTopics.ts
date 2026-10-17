/** Motivos que el cliente puede elegir antes de abrir WhatsApp. */
export const contactTopics = [
  { id: 'pedido', label: 'Quiero hacer un pedido', icon: '🛍️', message: 'Quiero hacer un pedido.' },
  { id: 'personalizado', label: 'Cotizar un personalizado', icon: '🎨', message: 'Quiero cotizar un producto personalizado.' },
  { id: 'envio', label: 'Envíos y costos', icon: '🚚', message: 'Quiero consultar el costo y el tiempo de envío a mi distrito o provincia.' },
  { id: 'recojo', label: 'Recojo en Chorrillos', icon: '📍', message: 'Quiero coordinar el recojo de un pedido en Chorrillos.' },
  { id: 'pagos', label: 'Medios de pago', icon: '💳', message: 'Quiero consultar los medios de pago (Yape, Plin o transferencia).' },
  { id: 'promociones', label: 'Promociones vigentes', icon: '✨', message: 'Quiero información sobre las promociones vigentes.' },
  { id: 'seguimiento', label: 'Un pedido que ya hice', icon: '📦', message: 'Tengo una consulta sobre un pedido que ya hice.' },
  { id: 'otra', label: 'Otra consulta', icon: '💬', message: 'Tengo una consulta.' },
]

export function topicMessage(message: string) {
  return `¡Hola! Vengo de la web de JHOS Importaciones. ${message}`
}
