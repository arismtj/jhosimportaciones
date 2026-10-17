export interface FaqItem {
  id: string
  /** Texto corto para los botones del asistente */
  topic: string
  question: string
  answer: string
}

export const faq: FaqItem[] = [
  {
    id: 'pedido',
    topic: 'Cómo hacer un pedido',
    question: '¿Cómo hago un pedido?',
    answer: 'Añade tus productos al carrito, pulsa «Preparar pedido» y completa tus datos de entrega y el medio de pago. Al final eliges un asesor y se abre WhatsApp con tu pedido ya escrito; solo tienes que enviarlo. No necesitas crear una cuenta.',
  },
  {
    id: 'personalizar',
    topic: 'Personalizados',
    question: '¿Cómo personalizo un producto?',
    answer: 'En el producto o en el carrito escribe los nombres, frases, colores, tallas o tu idea. Las fotos y el diseño final se coordinan por WhatsApp con tu asesor, que te confirmará el plazo de preparación antes de que pagues.',
  },
  {
    id: 'envio',
    topic: 'Envíos',
    question: '¿Hacen envíos? ¿Cuánto cuestan?',
    answer: 'Sí, enviamos a Lima y a provincias, a domicilio o por agencia. El costo y el plazo dependen del destino y del tamaño del pedido; indica tu distrito o provincia en el carrito y el asesor te los confirmará antes del pago.',
  },
  {
    id: 'recojo',
    topic: 'Recojo en tienda',
    question: '¿Puedo recoger mi pedido?',
    answer: 'Sí. Elige «Recojo coordinado en Chorrillos» en el carrito. El punto de recojo es La Campiña, calle Meteoros 216; el día y la hora se coordinan con tu asesor.',
  },
  {
    id: 'pagos',
    topic: 'Medios de pago',
    question: '¿Qué medios de pago aceptan? ¿Se cobra en la web?',
    answer: 'Aceptamos Yape, Plin y transferencia bancaria (Interbank). La web no cobra nada: primero confirmas el importe final con tu asesor, luego pagas por el medio elegido y envías el comprobante por WhatsApp.',
  },
  {
    id: 'desde',
    topic: 'Precio «Desde»',
    question: '¿Qué significa el precio «Desde»?',
    answer: 'Es el precio de la opción más económica de un producto que tiene varios modelos, tamaños o presentaciones. El precio final depende de la opción que elijas y te lo confirma el asesor.',
  },
  {
    id: 'confirmacion',
    topic: 'Confirmación del pedido',
    question: '¿Cuándo queda confirmado mi pedido?',
    answer: 'Cuando el asesor revisa la disponibilidad, el modelo, el importe final y la entrega, y recibe tu comprobante de pago. Hasta entonces, los precios mostrados son referenciales.',
  },
  {
    id: 'fotos',
    topic: 'Fotos y modelos',
    question: '¿Los productos son iguales a las fotos?',
    answer: 'Las fotos son referenciales. Algunos colores, modelos o contenidos pueden variar según el stock, por eso el asesor te confirmará los detalles antes de que pagues.',
  },
  {
    id: 'problema',
    topic: 'Tengo un inconveniente',
    question: '¿Qué hago si tengo un inconveniente con mi compra?',
    answer: 'Escríbenos por WhatsApp con tu comprobante, el nombre del producto y una descripción de lo ocurrido. Revisaremos tu caso lo antes posible.',
  },
]
