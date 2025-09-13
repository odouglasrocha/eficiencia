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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      access_level_permissions: {
        Row: {
          access_level: string
          created_at: string
          id: string
          permission_name: string
        }
        Insert: {
          access_level: string
          created_at?: string
          id?: string
          permission_name: string
        }
        Update: {
          access_level?: string
          created_at?: string
          id?: string
          permission_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_level_permissions_permission_name_fkey"
            columns: ["permission_name"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["name"]
          },
        ]
      }
      alert_configurations: {
        Row: {
          advanced_settings: Json
          alert_level: string
          alert_types: Json
          created_at: string
          frequency: number
          id: string
          notification_types: Json
          recipients: Json
          updated_at: string
          user_id: string
          whatsapp_config: Json
        }
        Insert: {
          advanced_settings?: Json
          alert_level?: string
          alert_types?: Json
          created_at?: string
          frequency?: number
          id?: string
          notification_types?: Json
          recipients?: Json
          updated_at?: string
          user_id?: string
          whatsapp_config?: Json
        }
        Update: {
          advanced_settings?: Json
          alert_level?: string
          alert_types?: Json
          created_at?: string
          frequency?: number
          id?: string
          notification_types?: Json
          recipients?: Json
          updated_at?: string
          user_id?: string
          whatsapp_config?: Json
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          created_at: string | null
          id: string
          machine_id: string | null
          message: string
          severity: string
          type: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          machine_id?: string | null
          message: string
          severity: string
          type: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          machine_id?: string | null
          message?: string
          severity?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_alerts_machine_id"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      downtime_events: {
        Row: {
          category: string | null
          created_at: string | null
          downtime_reason_id: string | null
          end_time: string | null
          id: string
          machine_id: string | null
          minutes: number | null
          reason: string
          start_time: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          downtime_reason_id?: string | null
          end_time?: string | null
          id?: string
          machine_id?: string | null
          minutes?: number | null
          reason: string
          start_time: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          downtime_reason_id?: string | null
          end_time?: string | null
          id?: string
          machine_id?: string | null
          minutes?: number | null
          reason?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "downtime_events_downtime_reason_id_fkey"
            columns: ["downtime_reason_id"]
            isOneToOne: false
            referencedRelation: "downtime_reasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "downtime_events_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_downtime_events_machine_id"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      downtime_reasons: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      machines: {
        Row: {
          access_level: string | null
          availability: number | null
          capacity: number | null
          code: string
          created_at: string | null
          current_production: number | null
          id: string
          name: string
          oee: number | null
          performance: number | null
          permissions: string[] | null
          quality: number | null
          status: Database["public"]["Enums"]["machine_status"]
          target_production: number | null
          updated_at: string | null
        }
        Insert: {
          access_level?: string | null
          availability?: number | null
          capacity?: number | null
          code: string
          created_at?: string | null
          current_production?: number | null
          id?: string
          name: string
          oee?: number | null
          performance?: number | null
          permissions?: string[] | null
          quality?: number | null
          status?: Database["public"]["Enums"]["machine_status"]
          target_production?: number | null
          updated_at?: string | null
        }
        Update: {
          access_level?: string | null
          availability?: number | null
          capacity?: number | null
          code?: string
          created_at?: string | null
          current_production?: number | null
          id?: string
          name?: string
          oee?: number | null
          performance?: number | null
          permissions?: string[] | null
          quality?: number | null
          status?: Database["public"]["Enums"]["machine_status"]
          target_production?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      oee_history: {
        Row: {
          availability: number | null
          created_at: string | null
          id: string
          machine_id: string | null
          oee: number | null
          performance: number | null
          quality: number | null
          timestamp: string
        }
        Insert: {
          availability?: number | null
          created_at?: string | null
          id?: string
          machine_id?: string | null
          oee?: number | null
          performance?: number | null
          quality?: number | null
          timestamp: string
        }
        Update: {
          availability?: number | null
          created_at?: string | null
          id?: string
          machine_id?: string | null
          oee?: number | null
          performance?: number | null
          quality?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_oee_history_machine_id"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oee_history_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      production_records: {
        Row: {
          created_at: string | null
          downtime_minutes: number | null
          downtime_reason: string | null
          end_time: string | null
          film_waste: number | null
          good_production: number | null
          id: string
          machine_id: string | null
          organic_waste: number | null
          planned_time: number | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          downtime_minutes?: number | null
          downtime_reason?: string | null
          end_time?: string | null
          film_waste?: number | null
          good_production?: number | null
          id?: string
          machine_id?: string | null
          organic_waste?: number | null
          planned_time?: number | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          downtime_minutes?: number | null
          downtime_reason?: string | null
          end_time?: string | null
          film_waste?: number | null
          good_production?: number | null
          id?: string
          machine_id?: string | null
          organic_waste?: number | null
          planned_time?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_production_records_machine_id"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: true
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          language: string | null
          location: string | null
          notifications: Json | null
          phone: string | null
          position: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          location?: string | null
          notifications?: Json | null
          phone?: string | null
          position?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          language?: string | null
          location?: string | null
          notifications?: Json | null
          phone?: string | null
          position?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          active: boolean
          alert_types: Json
          created_at: string
          escalation: Json
          frequency_minutes: number
          id: string
          machine_ids: string[] | null
          notification_types: Json
          quiet_hours: Json
          schedule: Json
          thresholds: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          alert_types?: Json
          created_at?: string
          escalation?: Json
          frequency_minutes?: number
          id?: string
          machine_ids?: string[] | null
          notification_types?: Json
          quiet_hours?: Json
          schedule?: Json
          thresholds?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          alert_types?: Json
          created_at?: string
          escalation?: Json
          frequency_minutes?: number
          id?: string
          machine_ids?: string[] | null
          notification_types?: Json
          quiet_hours?: Json
          schedule?: Json
          thresholds?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_oee_metrics: {
        Args: {
          p_downtime_minutes: number
          p_good_production: number
          p_machine_id: string
          p_planned_time: number
          p_target_production: number
        }
        Returns: {
          availability: number
          oee: number
          performance: number
          quality: number
        }[]
      }
      delete_machine_and_related_data: {
        Args: { p_machine_id: string }
        Returns: undefined
      }
      get_user_permissions: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          description: string
          permission_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upsert_production_record: {
        Args: {
          p_downtime_minutes: number
          p_downtime_reason?: string
          p_end_time: string
          p_film_waste: number
          p_good_production: number
          p_machine_id: string
          p_organic_waste: number
          p_planned_time: number
          p_start_time: string
        }
        Returns: string
      }
      user_has_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "administrador" | "operador" | "supervisor"
      machine_status: "ativa" | "manutencao" | "parada" | "inativa"
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
      app_role: ["administrador", "operador", "supervisor"],
      machine_status: ["ativa", "manutencao", "parada", "inativa"],
    },
  },
} as const
