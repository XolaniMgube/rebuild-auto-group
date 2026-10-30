export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      part_images: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          part_id: string
          position: number
          storage_path: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          part_id: string
          position?: number
          storage_path: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          part_id?: string
          position?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "part_images_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "part_images_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
        ]
      }
      parts: {
        Row: {
          added_by: string | null
          brand: string | null
          condition: Database["public"]["Enums"]["part_condition"]
          cost_price: number | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          held_at: string | null
          held_by: string | null
          id: string
          location: string | null
          name: string
          quantity: number
          selling_price: number
          serial_number: string | null
          status: Database["public"]["Enums"]["part_status"]
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          added_by?: string | null
          brand?: string | null
          condition?: Database["public"]["Enums"]["part_condition"]
          cost_price?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          held_at?: string | null
          held_by?: string | null
          id?: string
          location?: string | null
          name: string
          quantity?: number
          selling_price?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["part_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          added_by?: string | null
          brand?: string | null
          condition?: Database["public"]["Enums"]["part_condition"]
          cost_price?: number | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          held_at?: string | null
          held_by?: string | null
          id?: string
          location?: string | null
          name?: string
          quantity?: number
          selling_price?: number
          serial_number?: string | null
          status?: Database["public"]["Enums"]["part_status"]
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parts_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_held_by_fkey"
            columns: ["held_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          id: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      project_tasks: {
        Row: {
          added_by: string | null
          created_at: string
          done: boolean
          id: string
          name: string
          position: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          done?: boolean
          id?: string
          name: string
          position?: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          done?: boolean
          id?: string
          name?: string
          position?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          cost_at_sale: number | null
          id: string
          list_price_at_sale: number | null
          part_id: string
          price_at_sale: number
          quantity: number
          sale_id: string
        }
        Insert: {
          cost_at_sale?: number | null
          id?: string
          list_price_at_sale?: number | null
          part_id: string
          price_at_sale: number
          quantity?: number
          sale_id: string
        }
        Update: {
          cost_at_sale?: number | null
          id?: string
          list_price_at_sale?: number | null
          part_id?: string
          price_at_sale?: number
          quantity?: number
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          id: string
          notes: string | null
          sale_date: string
          sold_by: string | null
          total: number
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          sale_date?: string
          sold_by?: string | null
          total: number
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          notes?: string | null
          sale_date?: string
          sold_by?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_sold_by_fkey"
            columns: ["sold_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          added_by: string | null
          content_type: string
          created_at: string
          file_name: string
          id: string
          size_bytes: number
          storage_path: string
          vehicle_id: string
        }
        Insert: {
          added_by?: string | null
          content_type: string
          created_at?: string
          file_name: string
          id?: string
          size_bytes: number
          storage_path: string
          vehicle_id: string
        }
        Update: {
          added_by?: string | null
          content_type?: string
          created_at?: string
          file_name?: string
          id?: string
          size_bytes?: number
          storage_path?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_expenses: {
        Row: {
          added_by: string | null
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          spent_on: string
          vehicle_id: string
        }
        Insert: {
          added_by?: string | null
          amount: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          spent_on?: string
          vehicle_id: string
        }
        Update: {
          added_by?: string | null
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          spent_on?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          added_by: string | null
          color: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          make: string
          model: string
          notes: string | null
          photo_path: string | null
          purchase_date: string
          purchase_price: number
          registration: string | null
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          added_by?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          make: string
          model: string
          notes?: string | null
          photo_path?: string | null
          purchase_date?: string
          purchase_price?: number
          registration?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          added_by?: string | null
          color?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          make?: string
          model?: string
          notes?: string | null
          photo_path?: string | null
          purchase_date?: string
          purchase_price?: number
          registration?: string | null
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_deleted_by_fkey"
            columns: ["deleted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bin_part: {
        Args: { target: string; typed_name: string }
        Returns: undefined
      }
      bin_parts: { Args: { targets: string[] }; Returns: Json }
      bin_vehicle: {
        Args: { keep_parts: boolean; target: string; typed_name: string }
        Returns: undefined
      }
      complete_sale: {
        Args: {
          customer_name?: string
          customer_phone?: string
          items: Json
          notes?: string
        }
        Returns: string
      }
      restore_part: { Args: { target: string }; Returns: undefined }
      restore_vehicle: { Args: { target: string }; Returns: undefined }
      set_member_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user: string
        }
        Returns: undefined
      }
      undo_sale: { Args: { target_sale: string }; Returns: undefined }
    }
    Enums: {
      app_role: "owner" | "staff"
      part_condition: "good" | "fair" | "spares_only"
      part_status: "draft" | "in_stock" | "reserved" | "sold" | "returned"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "staff"],
      part_condition: ["good", "fair", "spares_only"],
      part_status: ["draft", "in_stock", "reserved", "sold", "returned"],
    },
  },
} as const

