import { advisors } from './checkout'

export function whatsappLink(phone: string, text: string) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export const defaultGreeting = '¡Hola! Vengo de la web de JHOS Importaciones y tengo una consulta.'

export { advisors }
