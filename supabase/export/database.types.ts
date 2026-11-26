export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name: string
          order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_risk_profiles: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          is_pardoned: boolean | null
          last_bad_order_code: string | null
          last_bad_reason: string | null
          phone: string
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_pardoned?: boolean | null
          last_bad_order_code?: string | null
          last_bad_reason?: string | null
          phone: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          is_pardoned?: boolean | null
          last_bad_order_code?: string | null
          last_bad_reason?: string | null
          phone?: string
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_risk_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_loyal: boolean | null
          name: string
          order_count: number | null
          phone: string
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_loyal?: boolean | null
          name: string
          order_count?: number | null
          phone: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_loyal?: boolean | null
          name?: string
          order_count?: number | null
          phone?: string
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gifts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          tag: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          tag?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          tag?: string | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          campaign_gift_title: string | null
          created_at: string | null
          id: string
          line_total: number
          name: string
          order_code: string | null
          price: number
          product_id: string | null
          quantity: number
          weight_label: string | null
        }
        Insert: {
          campaign_gift_title?: string | null
          created_at?: string | null
          id?: string
          line_total: number
          name: string
          order_code?: string | null
          price: number
          product_id?: string | null
          quantity: number
          weight_label?: string | null
        }
        Update: {
          campaign_gift_title?: string | null
          created_at?: string | null
          id?: string
          line_total?: number
          name?: string
          order_code?: string | null
          price?: number
          product_id?: string | null
          quantity?: number
          weight_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order_code"
            columns: ["order_code"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "order_items_order_code_fkey"
            columns: ["order_code"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_logs: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string
          order_code: string | null
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status: string
          order_code?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string
          order_code?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_logs_order_code_fkey"
            columns: ["order_code"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["code"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          campaign_gifts: string | null
          cancel_reason: string | null
          code: string
          created_at: string | null
          customer_id: string | null
          customer_name: string
          customer_note: string | null
          deposit_paid: number | null
          discount: number
          edge_signature: string | null
          email: string | null
          final_total: number
          is_tampered: boolean | null
          packing_image: string | null
          payment_gift: string | null
          payment_method: string
          payment_verified: boolean | null
          payment_verified_at: string | null
          phone: string
          shipping_fee: number | null
          status: string
          subtotal: number
          updated_at: string | null
          used_previous_order_code: string | null
          voucher_codes: string | null
        }
        Insert: {
          address: string
          campaign_gifts?: string | null
          cancel_reason?: string | null
          code: string
          created_at?: string | null
          customer_id?: string | null
          customer_name: string
          customer_note?: string | null
          deposit_paid?: number | null
          discount?: number
          edge_signature?: string | null
          email?: string | null
          final_total?: number
          is_tampered?: boolean | null
          packing_image?: string | null
          payment_gift?: string | null
          payment_method?: string
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          phone: string
          shipping_fee?: number | null
          status?: string
          subtotal?: number
          updated_at?: string | null
          used_previous_order_code?: string | null
          voucher_codes?: string | null
        }
        Update: {
          address?: string
          campaign_gifts?: string | null
          cancel_reason?: string | null
          code?: string
          created_at?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_note?: string | null
          deposit_paid?: number | null
          discount?: number
          edge_signature?: string | null
          email?: string | null
          final_total?: number
          is_tampered?: boolean | null
          packing_image?: string | null
          payment_gift?: string | null
          payment_method?: string
          payment_verified?: boolean | null
          payment_verified_at?: string | null
          phone?: string
          shipping_fee?: number | null
          status?: string
          subtotal?: number
          updated_at?: string | null
          used_previous_order_code?: string | null
          voucher_codes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          image: string | null
          read_time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          id: string
          image?: string | null
          read_time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          image?: string | null
          read_time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_weights: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean
          label: string
          multiplier: number | null
          price_override: number | null
          product_id: string | null
          sort_order: number
          weight_key: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          label: string
          multiplier?: number | null
          price_override?: number | null
          product_id?: string | null
          sort_order?: number
          weight_key: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean
          label?: string
          multiplier?: number | null
          price_override?: number | null
          product_id?: string | null
          sort_order?: number
          weight_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_weights_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          base_price: number
          campaign_gift_id: string | null
          campaign_tag: string | null
          category: string | null
          created_at: string | null
          description: string | null
          flavors: Json | null
          id: string
          image_url: string | null
          images: string[] | null
          in_stock: boolean | null
          name: string
          source: string | null
          unit: string | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          badge?: string | null
          base_price: number
          campaign_gift_id?: string | null
          campaign_tag?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          flavors?: Json | null
          id: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          name: string
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          badge?: string | null
          base_price?: number
          campaign_gift_id?: string | null
          campaign_tag?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          flavors?: Json | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          name?: string
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          created_at: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          image_urls: string[] | null
          is_approved: boolean | null
          order_code: string
          product_tags: string | null
          rating: number | null
          shop_packing_image: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          image_urls?: string[] | null
          is_approved?: boolean | null
          order_code: string
          product_tags?: string | null
          rating?: number | null
          shop_packing_image?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          image_urls?: string[] | null
          is_approved?: boolean | null
          order_code?: string
          product_tags?: string | null
          rating?: number | null
          shop_packing_image?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_configs: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      stories: {
        Row: {
          author: string | null
          content: string | null
          created_at: string | null
          id: string
          image: string | null
          image_url: string | null
          location: string | null
          order: number | null
          quote: string | null
          season: string | null
          story: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          id: string
          image?: string | null
          image_url?: string | null
          location?: string | null
          order?: number | null
          quote?: string | null
          season?: string | null
          story?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          location?: string | null
          order?: number | null
          quote?: string | null
          season?: string | null
          story?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          can_stack: boolean | null
          code: string
          created_at: string | null
          description: string | null
          is_active: boolean | null
          max_discount: number | null
          min_order: number | null
          type: string
          usage_limit: number | null
          used_count: number | null
          value: number
        }
        Insert: {
          can_stack?: boolean | null
          code: string
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          max_discount?: number | null
          min_order?: number | null
          type?: string
          usage_limit?: number | null
          used_count?: number | null
          value: number
        }
        Update: {
          can_stack?: boolean | null
          code?: string
          created_at?: string | null
          description?: string | null
          is_active?: boolean | null
          max_discount?: number | null
          min_order?: number | null
          type?: string
          usage_limit?: number | null
          used_count?: number | null
          value?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_atomic: {
        Args: {
          p_address?: string
          p_campaign_gifts?: Json
          p_code: string
          p_customer_name: string
          p_customer_note?: string
          p_discount?: number
          p_edge_signature?: string
          p_email?: string
          p_final_total?: number
          p_items?: Json
          p_payment_gift?: string
          p_payment_method?: string
          p_phone: string
          p_status?: string
          p_subtotal?: number
          p_used_previous_order_code?: string
          p_voucher_codes?: string
        }
        Returns: Json
      }
      create_product_with_weights: {
        Args: {
          p_badge?: string
          p_base_price: number
          p_category: string
          p_description?: string
          p_image_url?: string
          p_in_stock?: boolean
          p_name: string
          p_source?: string
          p_unit: string
          p_weights?: Json
        }
        Returns: Json
      }
      generate_prefixed_id: {
        Args: { p_pad: number; p_prefix: string; p_seq_name: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
