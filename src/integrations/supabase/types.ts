export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      agency_settings: {
        Row: {
          agency_name: string | null
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          agency_name?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          agency_name?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          assigned_to: string | null
          client_id: string | null
          completed_date: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          activity_type: string
          assigned_to?: string | null
          client_id?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          assigned_to?: string | null
          client_id?: string | null
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount: number | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          status: string
          subtotal: number
          tax_rate: number
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_rate?: number
          title: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          status?: string
          subtotal?: number
          tax_rate?: number
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      job_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_cost_items: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          date_incurred: string | null
          description: string
          id: string
          job_id: string
          quantity: number
          total_cost: number | null
          unit_cost: number
          vendor: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          date_incurred?: string | null
          description: string
          id?: string
          job_id: string
          quantity?: number
          total_cost?: number | null
          unit_cost: number
          vendor?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          date_incurred?: string | null
          description?: string
          id?: string
          job_id?: string
          quantity?: number
          total_cost?: number | null
          unit_cost?: number
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_cost_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          assigned_to: string | null
          budget: number | null
          category_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          job_number: string
          profit_margin: number | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_to?: string | null
          budget?: number | null
          category_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          job_number: string
          profit_margin?: number | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_to?: string | null
          budget?: number | null
          category_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          job_number?: string
          profit_margin?: number | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          entry_number: string
          id: string
          reference: string | null
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          entry_date?: string
          entry_number: string
          id?: string
          reference?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: string
          id?: string
          reference?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          account_id: string
          created_at: string
          credit_amount: number | null
          debit_amount: number | null
          description: string | null
          id: string
          journal_entry_id: string
          line_number: number
        }
        Insert: {
          account_id: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id: string
          line_number: number
        }
        Update: {
          account_id?: string
          created_at?: string
          credit_amount?: number | null
          debit_amount?: number | null
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entry_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          company_name: string | null
          contact_name: string
          created_at: string
          created_by: string | null
          email: string | null
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          lead_number: string
          lead_source_id: string | null
          notes: string | null
          phone: string | null
          priority: string
          probability: number | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_number: string
          lead_source_id?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          probability?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          lead_number?: string
          lead_source_id?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          probability?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          position: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          position?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          assigned_team: string | null
          budget: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          progress: number | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_team?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          progress?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_team?: string | null
          budget?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          progress?: number | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotation_line_items: {
        Row: {
          created_at: string
          description: string | null
          discount_percentage: number | null
          id: string
          item_name: string
          line_total: number | null
          quantity: number
          quotation_id: string
          sort_order: number | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          item_name: string
          line_total?: number | null
          quantity?: number
          quotation_id: string
          sort_order?: number | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_percentage?: number | null
          id?: string
          item_name?: string
          line_total?: number | null
          quantity?: number
          quotation_id?: string
          sort_order?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotation_line_items_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_content: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_content?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          quote_number: string
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number
          template_id: string | null
          terms_conditions: string | null
          title: string
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          quote_number: string
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number
          template_id?: string | null
          terms_conditions?: string | null
          title: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          quote_number?: string
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number
          template_id?: string | null
          terms_conditions?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quotation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_pipeline: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          probability_percentage: number | null
          stage_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          probability_percentage?: number | null
          stage_order: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          probability_percentage?: number | null
          stage_order?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
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
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "hr" | "finance_manager" | "employee"
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
      app_role: ["admin", "hr", "finance_manager", "employee"],
    },
  },
} as const
