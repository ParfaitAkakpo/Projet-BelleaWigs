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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      colors: {
        Row: {
          created_at: string | null
          hex_code: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          hex_code?: string | null
          id?: never
          name: string
        }
        Update: {
          created_at?: string | null
          hex_code?: string | null
          id?: never
          name?: string
        }
        Relationships: []
      }
      lengths: {
        Row: {
          id: number
          unit: string | null
          value: number
        }
        Insert: {
          id?: never
          unit?: string | null
          value: number
        }
        Update: {
          id?: never
          unit?: string | null
          value?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string | null
          id: string
          length: number | null
          order_id: string | null
          product_id: string | null
          quantity: number
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          color?: string | null
          id?: string
          length?: number | null
          order_id?: string | null
          product_id?: string | null
          quantity: number
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          color?: string | null
          id?: string
          length?: number | null
          order_id?: string | null
          product_id?: string | null
          quantity?: number
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          payment_method: string | null
          phone: string
          region: string | null
          total: number
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          phone: string
          region?: string | null
          total: number
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          payment_method?: string | null
          phone?: string
          region?: string | null
          total?: number
        }
        Relationships: []
      }
      product: {
        Row: {
          base_price_min: number | null
          category: string | null
          created_at: string | null
          description: string | null
          details: string[] | null
          id: number
          is_active: boolean | null
          name: string
          original_price: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          base_price_min?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          details?: string[] | null
          id?: never
          is_active?: boolean | null
          name: string
          original_price?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          base_price_min?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          details?: string[] | null
          id?: never
          is_active?: boolean | null
          name?: string
          original_price?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_color_images: {
        Row: {
          id: number
          image_url: string
          position: number | null
          product_color_id: number
        }
        Insert: {
          id?: never
          image_url: string
          position?: number | null
          product_color_id: number
        }
        Update: {
          id?: never
          image_url?: string
          position?: number | null
          product_color_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_color"
            columns: ["product_color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
        ]
      }
      product_colors: {
        Row: {
          color_id: number
          created_at: string | null
          id: number
          is_default: boolean | null
          product_id: number
        }
        Insert: {
          color_id: number
          created_at?: string | null
          id?: never
          is_default?: boolean | null
          product_id: number
        }
        Update: {
          color_id?: number
          created_at?: string | null
          id?: never
          is_default?: boolean | null
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_color"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_default_media"
            referencedColumns: ["product_id"]
          },
        ]
      }
      product_variant: {
        Row: {
          id: number
          is_active: boolean | null
          length_id: number
          price: number
          product_color_id: number
          product_id: number
          sku: string | null
          stock: number | null
        }
        Insert: {
          id?: never
          is_active?: boolean | null
          length_id: number
          price: number
          product_color_id: number
          product_id: number
          sku?: string | null
          stock?: number | null
        }
        Update: {
          id?: never
          is_active?: boolean | null
          length_id?: number
          price?: number
          product_color_id?: number
          product_id?: number
          sku?: string | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_variant_color"
            columns: ["product_color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variant_length"
            columns: ["length_id"]
            isOneToOne: false
            referencedRelation: "lengths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variant_length"
            columns: ["length_id"]
            isOneToOne: false
            referencedRelation: "product_variants_full"
            referencedColumns: ["length_id"]
          },
          {
            foreignKeyName: "fk_variant_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variant_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_default_media"
            referencedColumns: ["product_id"]
          },
        ]
      }
    }
    Views: {
      product_default_media: {
        Row: {
          image_url: string | null
          product_id: number | null
        }
        Relationships: []
      }
      product_variants_full: {
        Row: {
          color: string | null
          color_hex: string | null
          image_url: string | null
          is_active: boolean | null
          is_default: boolean | null
          length: number | null
          length_id: number | null
          medias: Json | null
          price: number | null
          product_color_id: number | null
          product_id: number | null
          sku: string | null
          stock_count: number | null
          variant_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_variant_color"
            columns: ["product_color_id"]
            isOneToOne: false
            referencedRelation: "product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variant_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_variant_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_default_media"
            referencedColumns: ["product_id"]
          },
        ]
      }
    }
    Functions: {
      bytea_to_text: { Args: { data: string }; Returns: string }
      get_product_with_variants: {
        Args: { p_product_id: number }
        Returns: Json
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
    }
    Enums: {
      extension_type:
        | "amina"
        | "kanekalon"
        | "xpression"
        | "darling"
        | "sensationnel"
        | "rastafri"
        | "clip-in"
        | "tape-in"
      product_category:
        | "natural-wigs"
        | "synthetic-wigs"
        | "natural-weaves"
        | "synthetic-weaves"
        | "extensions"
        | "accessories"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      extension_type: [
        "amina",
        "kanekalon",
        "xpression",
        "darling",
        "sensationnel",
        "rastafri",
        "clip-in",
        "tape-in",
      ],
      product_category: [
        "natural-wigs",
        "synthetic-wigs",
        "natural-weaves",
        "synthetic-weaves",
        "extensions",
        "accessories",
      ],
    },
  },
} as const
