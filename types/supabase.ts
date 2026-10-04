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
      bookings: {
        Row: {
          class_datetime: string
          class_name: string
          conversation_id: string | null
          created_at: string
          id: string
          lead_contact: string | null
          lead_name: string
          owner_id: string
          status: string
          studio_config_id: string
          updated_at: string
        }
        Insert: {
          class_datetime: string
          class_name: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_contact?: string | null
          lead_name: string
          owner_id?: string
          status?: string
          studio_config_id: string
          updated_at?: string
        }
        Update: {
          class_datetime?: string
          class_name?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          lead_contact?: string | null
          lead_name?: string
          owner_id?: string
          status?: string
          studio_config_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_studio_config_id_fkey"
            columns: ["studio_config_id"]
            isOneToOne: false
            referencedRelation: "studio_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string
          consent_given: boolean
          consent_source: string | null
          consent_timestamp: string | null
          contact_identifier: string
          contact_name: string | null
          created_at: string
          id: string
          owner_id: string
          status: string
          studio_config_id: string
          updated_at: string
        }
        Insert: {
          channel?: string
          consent_given?: boolean
          consent_source?: string | null
          consent_timestamp?: string | null
          contact_identifier: string
          contact_name?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          status?: string
          studio_config_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          consent_given?: boolean
          consent_source?: string | null
          consent_timestamp?: string | null
          contact_identifier?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          status?: string
          studio_config_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_studio_config_id_fkey"
            columns: ["studio_config_id"]
            isOneToOne: false
            referencedRelation: "studio_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_brands: {
        Row: {
          always_exclude: boolean
          brand_name: string
          created_at: string
          id: string
          match_patterns: string[]
          owner_id: string
          updated_at: string
        }
        Insert: {
          always_exclude?: boolean
          brand_name: string
          created_at?: string
          id?: string
          match_patterns?: string[]
          owner_id?: string
          updated_at?: string
        }
        Update: {
          always_exclude?: boolean
          brand_name?: string
          created_at?: string
          id?: string
          match_patterns?: string[]
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          owner_id: string
          sender: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          owner_id?: string
          sender: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          owner_id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_drafts: {
        Row: {
          approved_at: string | null
          body: string
          created_at: string
          id: string
          owner_id: string
          provider_message_id: string | null
          sent_at: string | null
          sequence_step: number
          status: string
          studio_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          body: string
          created_at?: string
          id?: string
          owner_id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          sequence_step: number
          status?: string
          studio_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          body?: string
          created_at?: string
          id?: string
          owner_id?: string
          provider_message_id?: string | null
          sent_at?: string | null
          sequence_step?: number
          status?: string
          studio_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_drafts_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_activities: {
        Row: {
          created_at: string
          id: string
          new_stage: string | null
          note: string | null
          owner_id: string
          previous_stage: string | null
          studio_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          new_stage?: string | null
          note?: string | null
          owner_id?: string
          previous_stage?: string | null
          studio_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          new_stage?: string | null
          note?: string | null
          owner_id?: string
          previous_stage?: string | null
          studio_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_activities_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_leak_assumptions: {
        Row: {
          avg_months_retained: number
          close_rate_with_actual_response: number
          close_rate_with_fast_response: number
          created_at: string
          id: string
          leads_per_month: number
          monthly_membership_price: number
          owner_id: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          avg_months_retained?: number
          close_rate_with_actual_response?: number
          close_rate_with_fast_response?: number
          created_at?: string
          id?: string
          leads_per_month?: number
          monthly_membership_price?: number
          owner_id?: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          avg_months_retained?: number
          close_rate_with_actual_response?: number
          close_rate_with_fast_response?: number
          created_at?: string
          id?: string
          leads_per_month?: number
          monthly_membership_price?: number
          owner_id?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "revenue_leak_assumptions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      secret_shop_logs: {
        Row: {
          channel: string
          created_at: string
          first_reply_at: string | null
          id: string
          notes: string | null
          offered_booking: boolean | null
          owner_id: string
          replied_within_72h: boolean | null
          reply_quality: number | null
          sent_at: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          channel: string
          created_at?: string
          first_reply_at?: string | null
          id?: string
          notes?: string | null
          offered_booking?: boolean | null
          owner_id?: string
          replied_within_72h?: boolean | null
          reply_quality?: number | null
          sent_at: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          created_at?: string
          first_reply_at?: string | null
          id?: string
          notes?: string | null
          offered_booking?: boolean | null
          owner_id?: string
          replied_within_72h?: boolean | null
          reply_quality?: number | null
          sent_at?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secret_shop_logs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_configs: {
        Row: {
          brand_voice: string | null
          cancellation_policy: string | null
          class_types: Json
          created_at: string
          escalation_contact_email: string | null
          escalation_contact_name: string | null
          escalation_contact_phone: string | null
          faqs: Json
          id: string
          intro_offer: string | null
          is_demo: boolean
          late_arrival_policy: string | null
          location_parking: string | null
          owner_id: string
          pricing: Json
          schedule: Json
          studio_id: string
          updated_at: string
        }
        Insert: {
          brand_voice?: string | null
          cancellation_policy?: string | null
          class_types?: Json
          created_at?: string
          escalation_contact_email?: string | null
          escalation_contact_name?: string | null
          escalation_contact_phone?: string | null
          faqs?: Json
          id?: string
          intro_offer?: string | null
          is_demo?: boolean
          late_arrival_policy?: string | null
          location_parking?: string | null
          owner_id?: string
          pricing?: Json
          schedule?: Json
          studio_id: string
          updated_at?: string
        }
        Update: {
          brand_voice?: string | null
          cancellation_policy?: string | null
          class_types?: Json
          created_at?: string
          escalation_contact_email?: string | null
          escalation_contact_name?: string | null
          escalation_contact_phone?: string | null
          faqs?: Json
          id?: string
          intro_offer?: string | null
          is_demo?: boolean
          late_arrival_policy?: string | null
          location_parking?: string | null
          owner_id?: string
          pricing?: Json
          schedule?: Json
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_configs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          address: string | null
          booking_platform: string | null
          booking_platform_source: string
          category: string | null
          class_price: number | null
          created_at: string
          email: string | null
          estimated_size: string | null
          franchise_brand: string | null
          google_place_id: string | null
          id: string
          instagram_handle: string | null
          intro_offer: string | null
          is_franchise: boolean
          lost_reason: string | null
          name: string
          neighborhood: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          on_classpass: boolean | null
          owner_id: string
          phone: string | null
          pipeline_stage: string
          rating: number | null
          review_count: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          booking_platform?: string | null
          booking_platform_source?: string
          category?: string | null
          class_price?: number | null
          created_at?: string
          email?: string | null
          estimated_size?: string | null
          franchise_brand?: string | null
          google_place_id?: string | null
          id?: string
          instagram_handle?: string | null
          intro_offer?: string | null
          is_franchise?: boolean
          lost_reason?: string | null
          name: string
          neighborhood?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          on_classpass?: boolean | null
          owner_id?: string
          phone?: string | null
          pipeline_stage?: string
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          booking_platform?: string | null
          booking_platform_source?: string
          category?: string | null
          class_price?: number | null
          created_at?: string
          email?: string | null
          estimated_size?: string | null
          franchise_brand?: string | null
          google_place_id?: string | null
          id?: string
          instagram_handle?: string | null
          intro_offer?: string | null
          is_franchise?: boolean
          lost_reason?: string | null
          name?: string
          neighborhood?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          on_classpass?: boolean | null
          owner_id?: string
          phone?: string | null
          pipeline_stage?: string
          rating?: number | null
          review_count?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      suppression_list: {
        Row: {
          created_at: string
          email: string
          id: string
          owner_id: string
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          owner_id?: string
          reason?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          owner_id?: string
          reason?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
