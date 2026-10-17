import type { Database, Json, Tables } from '../../types/database'
import { requireSupabase } from './client'

type DeliveryMethod = Database['public']['Enums']['delivery_method']

export interface CreateOrderItemInput {
  productId: string
  variantId?: string | null
  quantity: number
  customizations?: Record<string, string>
}

export interface CreateOrderInput {
  customerName: string
  customerEmail?: string | null
  customerPhone: string
  deliveryMethod: DeliveryMethod
  deliveryAddress?: string | null
  paymentMethod?: string | null
  customerNotes?: string | null
  items: CreateOrderItemInput[]
}

export interface CreatedOrder {
  orderId: string
  orderNumber: number
  subtotal: number
  total: number | null
}

export type OrderHistoryItem = Tables<'order_items'> & {
  customizations: Tables<'order_item_customizations'>[]
}

export type OrderHistoryEntry = Tables<'orders'> & {
  items: OrderHistoryItem[]
}

export async function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  const client = requireSupabase()
  const rpcItems: Json = input.items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId ?? null,
    quantity: item.quantity,
    customizations: item.customizations ?? {},
  }))

  const { data, error } = await client.rpc('create_order', {
    p_customer_name: input.customerName,
    p_customer_email: input.customerEmail ?? null,
    p_customer_phone: input.customerPhone,
    p_delivery_method: input.deliveryMethod,
    p_delivery_address: input.deliveryAddress ?? null,
    p_payment_method: input.paymentMethod ?? null,
    p_customer_notes: input.customerNotes ?? null,
    p_items: rpcItems,
  })

  if (error) throw error
  const order = data[0]
  if (!order) throw new Error('Supabase no devolvió el pedido creado.')

  return {
    orderId: order.order_id,
    orderNumber: order.order_number,
    subtotal: order.subtotal,
    total: order.total,
  }
}

export async function getMyOrders(): Promise<OrderHistoryEntry[]> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('orders')
    .select('*, items:order_items(*, customizations:order_item_customizations(*))')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as unknown as OrderHistoryEntry[]
}
