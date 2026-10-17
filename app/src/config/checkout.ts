export type PaymentMethodId = 'yape' | 'plin' | 'transfer'
export type DeliveryOption = 'shipping' | 'pickup'

export interface PaymentMethod {
  id: PaymentMethodId
  label: string
  phone?: string
  holder: string
  bank?: string
  account?: string
  instructions: string
}

export interface Advisor {
  /** Número internacional sin "+" ni espacios, para wa.me */
  whatsapp: string
  label: string
}

/** Datos comerciales tomados de la tienda de referencia. Actualízalos aquí si cambian. */
export const advisors: Advisor[] = [
  { whatsapp: '51976110949', label: '976 110 949' },
  { whatsapp: '51902582800', label: '902 582 800' },
]

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'yape',
    label: 'Yape',
    phone: '902582800',
    holder: 'luis alberto jimenez ovalle',
    instructions: 'Solicita el número o QR de cobro actualizado por WhatsApp antes de pagar.',
  },
  {
    id: 'plin',
    label: 'Plin',
    phone: '976110949',
    holder: 'Tatiana Herrera Suárez',
    instructions: 'Confirma el importe final con tu asesor y verifica el titular antes de transferir. Envía el comprobante por WhatsApp.',
  },
  {
    id: 'transfer',
    label: 'Transferencia bancaria',
    holder: 'JHOS IMPORTACIONES EIRL',
    bank: 'Banco Interbank',
    account: 'CTA: 200-3008480298 / CCI: 003-200-003008480298-39',
    instructions: 'Solicita los datos bancarios actualizados a tu asesor antes de transferir.',
  },
]

export const deliveryOptions: Array<{ id: DeliveryOption; label: string }> = [
  { id: 'shipping', label: 'Envío a domicilio / agencia' },
  { id: 'pickup', label: 'Recojo coordinado en Chorrillos' },
]

export const checkoutNotes = {
  pickup: 'Chorrillos, Lima. La Campiña, calle Meteoros 216.',
  shipping: 'Envíos a Lima y provincias. El costo y plazo se confirman antes del pago.',
  preparation: 'Para personalizados, confirma diseño y plazo de preparación con tu asesor.',
}
