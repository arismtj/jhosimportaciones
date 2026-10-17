export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      catalog_import_runs: {
        Row: {
          id: string
          source_url: string
          source_sha256: string
          source_product_count: number
          status: Database['public']['Enums']['catalog_import_status']
          imported_product_count: number
          imported_image_count: number
          failed_image_count: number
          summary: Json
          created_by: string | null
          started_at: string
          finished_at: string | null
        }
        Insert: {
          id?: string
          source_url: string
          source_sha256: string
          source_product_count: number
          status?: Database['public']['Enums']['catalog_import_status']
          imported_product_count?: number
          imported_image_count?: number
          failed_image_count?: number
          summary?: Json
          created_by?: string | null
          started_at?: string
          finished_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['catalog_import_runs']['Insert']>
        Relationships: []
      }
      catalog_import_issues: {
        Row: {
          id: string
          import_run_id: string
          external_id: string | null
          stage: string
          code: string
          message: string
          source_url: string | null
          details: Json
          created_at: string
        }
        Insert: {
          id?: string
          import_run_id: string
          external_id?: string | null
          stage: string
          code: string
          message: string
          source_url?: string | null
          details?: Json
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['catalog_import_issues']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'catalog_import_issues_import_run_id_fkey'
            columns: ['import_run_id']
            isOneToOne: false
            referencedRelation: 'catalog_import_runs'
            referencedColumns: ['id']
          },
        ]
      }
      promotions: {
        Row: {
          id: string
          title: string
          body: string
          media_url: string | null
          media_type: 'image' | 'video' | null
          starts_on: string
          ends_on: string
          active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          body?: string
          media_url?: string | null
          media_type?: 'image' | 'video' | null
          starts_on?: string
          ends_on: string
          active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['promotions']['Insert']>
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          display_name: string | null
          email: string | null
          phone: string | null
          role: Database['public']['Enums']['user_role']
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          email?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          email?: string | null
          phone?: string | null
          role?: Database['public']['Enums']['user_role']
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          parent_id: string | null
          slug: string
          name: string
          description: string | null
          sort_order: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id?: string | null
          slug: string
          name: string
          description?: string | null
          sort_order?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          parent_id?: string | null
          slug?: string
          name?: string
          description?: string | null
          sort_order?: number
          active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'categories_parent_id_fkey'
            columns: ['parent_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          id: string
          external_id: string | null
          category_id: string
          slug: string
          name: string
          description: string
          price: number
          price_mode: Database['public']['Enums']['price_mode']
          price_max: number | null
          availability: Database['public']['Enums']['product_availability']
          stock_quantity: number | null
          customizable: boolean
          featured: boolean
          published: boolean
          price_verified: boolean
          source_system: string | null
          source_version: number | null
          source_updated_at: string | null
          source_metadata: Json
          latest_import_run_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          external_id?: string | null
          category_id: string
          slug: string
          name: string
          description?: string
          price: number
          price_mode?: Database['public']['Enums']['price_mode']
          price_max?: number | null
          availability?: Database['public']['Enums']['product_availability']
          stock_quantity?: number | null
          customizable?: boolean
          featured?: boolean
          published?: boolean
          price_verified?: boolean
          source_system?: string | null
          source_version?: number | null
          source_updated_at?: string | null
          source_metadata?: Json
          latest_import_run_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['products']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'products_latest_import_run_id_fkey'
            columns: ['latest_import_run_id']
            isOneToOne: false
            referencedRelation: 'catalog_import_runs'
            referencedColumns: ['id']
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          storage_path: string | null
          source_url: string | null
          alt_text: string
          sort_order: number
          is_primary: boolean
          source_sha256: string | null
          source_mime_type: string | null
          import_run_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          storage_path?: string | null
          source_url?: string | null
          alt_text?: string
          sort_order?: number
          is_primary?: boolean
          source_sha256?: string | null
          source_mime_type?: string | null
          import_run_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_images_import_run_id_fkey'
            columns: ['import_run_id']
            isOneToOne: false
            referencedRelation: 'catalog_import_runs'
            referencedColumns: ['id']
          },
        ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string | null
          name: string
          options: Json
          price_adjustment: number
          stock_quantity: number | null
          availability: Database['public']['Enums']['product_availability']
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          sku?: string | null
          name: string
          options?: Json
          price_adjustment?: number
          stock_quantity?: number | null
          availability?: Database['public']['Enums']['product_availability']
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      favorites: {
        Row: { user_id: string; product_id: string; created_at: string }
        Insert: { user_id: string; product_id: string; created_at?: string }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'favorites_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: number
          user_id: string | null
          status: Database['public']['Enums']['order_status']
          customer_name: string
          customer_email: string | null
          customer_phone: string
          delivery_method: Database['public']['Enums']['delivery_method']
          delivery_address: string | null
          payment_method: string | null
          customer_notes: string | null
          subtotal: number
          shipping_amount: number | null
          total: number | null
          whatsapp_recipient: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          status?: Database['public']['Enums']['order_status']
          customer_name: string
          customer_email?: string | null
          customer_phone: string
          delivery_method: Database['public']['Enums']['delivery_method']
          delivery_address?: string | null
          payment_method?: string | null
          customer_notes?: string | null
          subtotal?: number
          shipping_amount?: number | null
          total?: number | null
          whatsapp_recipient?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name: string
          variant_name: string | null
          unit_price: number
          quantity: number
          line_total: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name: string
          variant_name?: string | null
          unit_price: number
          quantity: number
          created_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey'
            columns: ['variant_id']
            isOneToOne: false
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
          },
        ]
      }
      order_item_customizations: {
        Row: {
          id: string
          order_item_id: string
          label: string
          value: string
          created_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          label: string
          value: string
          created_at?: string
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'order_item_customizations_order_item_id_fkey'
            columns: ['order_item_id']
            isOneToOne: false
            referencedRelation: 'order_items'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      grant_admin: { Args: { p_email: string }; Returns: string }
      revoke_admin: { Args: { p_email: string }; Returns: undefined }
      list_admins: { Args: Record<string, never>; Returns: { email: string; has_logged_in: boolean }[] }
      create_order: {
        Args: {
          p_customer_name: string
          p_customer_email: string | null
          p_customer_phone: string
          p_delivery_method: Database['public']['Enums']['delivery_method']
          p_delivery_address: string | null
          p_payment_method: string | null
          p_customer_notes: string | null
          p_items: Json
        }
        Returns: {
          order_id: string
          order_number: number
          subtotal: number
          total: number | null
        }[]
      }
      replace_product_images: {
        Args: {
          p_product_id: string
          p_images: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'customer' | 'admin'
      product_availability: 'in_stock' | 'out_of_stock' | 'made_to_order'
      price_mode: 'fixed' | 'from'
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'shipped' | 'completed' | 'cancelled'
      delivery_method: 'pickup' | 'delivery'
      catalog_import_status: 'running' | 'succeeded' | 'partial' | 'failed'
    }
    CompositeTypes: Record<string, never>
  }
}

export type Tables<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Row']

export type TablesInsert<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Insert']

export type TablesUpdate<TableName extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][TableName]['Update']
