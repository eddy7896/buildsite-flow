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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      account_lockouts: {
        Row: {
          created_at: string
          email: string
          failed_attempts: number
          id: string
          ip_address: unknown | null
          locked_until: string
          unlocked_at: string | null
          unlocked_by: string | null
        }
        Insert: {
          created_at?: string
          email: string
          failed_attempts?: number
          id?: string
          ip_address?: unknown | null
          locked_until: string
          unlocked_at?: string | null
          unlocked_by?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          failed_attempts?: number
          id?: string
          ip_address?: unknown | null
          locked_until?: string
          unlocked_at?: string | null
          unlocked_by?: string | null
        }
        Relationships: []
      }
      agencies: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          is_active: boolean
          max_users: number | null
          name: string
          subscription_plan: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          max_users?: number | null
          name: string
          subscription_plan?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean
          max_users?: number | null
          name?: string
          subscription_plan?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      agency_settings: {
        Row: {
          agency_id: string | null
          agency_name: string | null
          created_at: string
          default_currency: string | null
          domain: string | null
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          agency_name?: string | null
          created_at?: string
          default_currency?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          agency_name?: string | null
          created_at?: string
          default_currency?: string | null
          domain?: string | null
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_settings_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          agency_id: string | null
          break_end_time: string | null
          break_start_time: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          ip_address: unknown | null
          location: string | null
          notes: string | null
          overtime_hours: number | null
          status: string
          total_hours: number | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          ip_address?: unknown | null
          location?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          break_end_time?: string | null
          break_start_time?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          ip_address?: unknown | null
          location?: string | null
          notes?: string | null
          overtime_hours?: number | null
          status?: string
          total_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          hash_chain: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          action: string
          created_at?: string | null
          hash_chain?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          action?: string
          created_at?: string | null
          hash_chain?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      calendar_settings: {
        Row: {
          agency_id: string
          created_at: string
          default_view: string | null
          id: string
          show_birthdays: boolean | null
          show_company_events: boolean | null
          show_holidays: boolean | null
          show_leave_requests: boolean | null
          updated_at: string
          working_days: Json | null
          working_hours: Json | null
        }
        Insert: {
          agency_id: string
          created_at?: string
          default_view?: string | null
          id?: string
          show_birthdays?: boolean | null
          show_company_events?: boolean | null
          show_holidays?: boolean | null
          show_leave_requests?: boolean | null
          updated_at?: string
          working_days?: Json | null
          working_hours?: Json | null
        }
        Update: {
          agency_id?: string
          created_at?: string
          default_view?: string | null
          id?: string
          show_birthdays?: boolean | null
          show_company_events?: boolean | null
          show_holidays?: boolean | null
          show_leave_requests?: boolean | null
          updated_at?: string
          working_days?: Json | null
          working_hours?: Json | null
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
      clients: {
        Row: {
          address: string | null
          agency_id: string | null
          billing_address: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state: string | null
          city: string | null
          client_number: string
          company_name: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contact_position: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          payment_terms: number | null
          phone: string | null
          postal_code: string | null
          state: string | null
          status: string
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          city?: string | null
          client_number: string
          company_name?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_position?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          billing_address?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state?: string | null
          city?: string | null
          client_number?: string
          company_name?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_position?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          payment_terms?: number | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          status?: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_events: {
        Row: {
          agency_id: string | null
          all_day: boolean | null
          attendees: Json | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          event_type: string
          id: string
          is_recurring: boolean | null
          location: string | null
          recurrence_pattern: Json | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          all_day?: boolean | null
          attendees?: Json | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          recurrence_pattern?: Json | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          all_day?: boolean | null
          attendees?: Json | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string
          id?: string
          is_recurring?: boolean | null
          location?: string | null
          recurrence_pattern?: Json | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: string
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
            foreignKeyName: "crm_activities_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_analytics: {
        Row: {
          active_agencies: number | null
          active_users: number | null
          created_at: string
          date: string
          id: string
          new_agencies: number | null
          new_users: number | null
          support_tickets_created: number | null
          support_tickets_resolved: number | null
          total_agencies: number | null
          total_invoices_created: number | null
          total_logins: number | null
          total_payments: number | null
          total_projects_created: number | null
          total_revenue: number | null
          total_users: number | null
        }
        Insert: {
          active_agencies?: number | null
          active_users?: number | null
          created_at?: string
          date: string
          id?: string
          new_agencies?: number | null
          new_users?: number | null
          support_tickets_created?: number | null
          support_tickets_resolved?: number | null
          total_agencies?: number | null
          total_invoices_created?: number | null
          total_logins?: number | null
          total_payments?: number | null
          total_projects_created?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Update: {
          active_agencies?: number | null
          active_users?: number | null
          created_at?: string
          date?: string
          id?: string
          new_agencies?: number | null
          new_users?: number | null
          support_tickets_created?: number | null
          support_tickets_resolved?: number | null
          total_agencies?: number | null
          total_invoices_created?: number | null
          total_logins?: number | null
          total_payments?: number | null
          total_projects_created?: number | null
          total_revenue?: number | null
          total_users?: number | null
        }
        Relationships: []
      }
      department_hierarchy: {
        Row: {
          agency_id: string | null
          created_at: string
          department_id: string
          hierarchy_level: number
          id: string
          parent_department_id: string | null
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          department_id: string
          hierarchy_level?: number
          id?: string
          parent_department_id?: string | null
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          department_id?: string
          hierarchy_level?: number
          id?: string
          parent_department_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_hierarchy_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_hierarchy_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          department_id: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          department_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          department_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          agency_id: string | null
          budget: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          name: string
          parent_department_id: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          budget?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          name?: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_details: {
        Row: {
          address: string | null
          agency_id: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_id: string
          employment_type: string | null
          first_name: string
          id: string
          is_active: boolean | null
          last_name: string
          marital_status: string | null
          nationality: string | null
          notes: string | null
          skills: Json | null
          social_security_number: string | null
          supervisor_id: string | null
          updated_at: string
          user_id: string
          work_location: string | null
        }
        Insert: {
          address?: string | null
          agency_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id: string
          employment_type?: string | null
          first_name: string
          id?: string
          is_active?: boolean | null
          last_name: string
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          skills?: Json | null
          social_security_number?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id: string
          work_location?: string | null
        }
        Update: {
          address?: string | null
          agency_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string
          employment_type?: string | null
          first_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string
          marital_status?: string | null
          nationality?: string | null
          notes?: string | null
          skills?: Json | null
          social_security_number?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_id?: string
          work_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_details_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_files: {
        Row: {
          category: string
          created_at: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          employee_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          employee_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_files_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employee_details"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salary_details: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          salary: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          salary?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          salary?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_version: number
          rotated_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_version?: number
          rotated_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_version?: number
          rotated_at?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      expense_policies: {
        Row: {
          auto_approve_below: number | null
          category_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          max_amount: number | null
          mileage_rate: number | null
          policy_description: string | null
          requires_finance_approval: boolean | null
          requires_manager_approval: boolean | null
          requires_receipt_above: number | null
          updated_at: string
        }
        Insert: {
          auto_approve_below?: number | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          mileage_rate?: number | null
          policy_description?: string | null
          requires_finance_approval?: boolean | null
          requires_manager_approval?: boolean | null
          requires_receipt_above?: number | null
          updated_at?: string
        }
        Update: {
          auto_approve_below?: number | null
          category_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_amount?: number | null
          mileage_rate?: number | null
          policy_description?: string | null
          requires_finance_approval?: boolean | null
          requires_manager_approval?: boolean | null
          requires_receipt_above?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_policies_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_login_attempts: {
        Row: {
          attempt_time: string
          created_at: string
          email: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          attempt_time?: string
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          attempt_time?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          metadata: Json | null
          name: string
          required_permissions: string[] | null
          required_roles: Database["public"]["Enums"]["app_role"][] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          name: string
          required_permissions?: string[] | null
          required_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          metadata?: Json | null
          name?: string
          required_permissions?: string[] | null
          required_roles?: Database["public"]["Enums"]["app_role"][] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gst_returns: {
        Row: {
          acknowledgment_number: string | null
          agency_id: string | null
          cess_amount: number | null
          cgst_amount: number | null
          created_at: string
          due_date: string
          filed_date: string | null
          filing_period: string
          id: string
          igst_amount: number | null
          return_type: string
          sgst_amount: number | null
          status: string
          total_tax_amount: number | null
          total_taxable_value: number | null
          updated_at: string
        }
        Insert: {
          acknowledgment_number?: string | null
          agency_id?: string | null
          cess_amount?: number | null
          cgst_amount?: number | null
          created_at?: string
          due_date: string
          filed_date?: string | null
          filing_period: string
          id?: string
          igst_amount?: number | null
          return_type: string
          sgst_amount?: number | null
          status?: string
          total_tax_amount?: number | null
          total_taxable_value?: number | null
          updated_at?: string
        }
        Update: {
          acknowledgment_number?: string | null
          agency_id?: string | null
          cess_amount?: number | null
          cgst_amount?: number | null
          created_at?: string
          due_date?: string
          filed_date?: string | null
          filing_period?: string
          id?: string
          igst_amount?: number | null
          return_type?: string
          sgst_amount?: number | null
          status?: string
          total_tax_amount?: number | null
          total_taxable_value?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      gst_settings: {
        Row: {
          agency_id: string | null
          business_type: string
          composition_scheme: boolean | null
          created_at: string
          filing_frequency: string
          gstin: string
          id: string
          is_active: boolean | null
          legal_name: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          business_type?: string
          composition_scheme?: boolean | null
          created_at?: string
          filing_frequency?: string
          gstin: string
          id?: string
          is_active?: boolean | null
          legal_name: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          business_type?: string
          composition_scheme?: boolean | null
          created_at?: string
          filing_frequency?: string
          gstin?: string
          id?: string
          is_active?: boolean | null
          legal_name?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gst_transactions: {
        Row: {
          agency_id: string | null
          cess_amount: number | null
          cess_rate: number | null
          cgst_amount: number | null
          cgst_rate: number | null
          created_at: string
          customer_gstin: string | null
          customer_name: string
          description: string | null
          hsn_sac_code: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_date: string
          invoice_number: string
          place_of_supply: string | null
          quantity: number | null
          sgst_amount: number | null
          sgst_rate: number | null
          taxable_value: number
          total_amount: number
          transaction_type: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          cess_amount?: number | null
          cess_rate?: number | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          customer_gstin?: string | null
          customer_name: string
          description?: string | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_date: string
          invoice_number: string
          place_of_supply?: string | null
          quantity?: number | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          taxable_value: number
          total_amount: number
          transaction_type: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          cess_amount?: number | null
          cess_rate?: number | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          created_at?: string
          customer_gstin?: string | null
          customer_name?: string
          description?: string | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_date?: string
          invoice_number?: string
          place_of_supply?: string | null
          quantity?: number | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          taxable_value?: number
          total_amount?: number
          transaction_type?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      holidays: {
        Row: {
          agency_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          is_company_holiday: boolean | null
          is_national_holiday: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          date: string
          description?: string | null
          id?: string
          is_company_holiday?: boolean | null
          is_national_holiday?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          is_company_holiday?: boolean | null
          is_national_holiday?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      hsn_sac_codes: {
        Row: {
          code: string
          created_at: string
          description: string
          gst_rate: number
          id: string
          is_active: boolean | null
          type: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          gst_rate?: number
          id?: string
          is_active?: boolean | null
          type: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          gst_rate?: number
          id?: string
          is_active?: boolean | null
          type?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          agency_id: string | null
          cgst_amount: number | null
          cgst_rate: number | null
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          discount: number | null
          due_date: string | null
          gstin: string | null
          hsn_sac_code: string | null
          id: string
          igst_amount: number | null
          igst_rate: number | null
          invoice_number: string
          issue_date: string
          notes: string | null
          place_of_supply: string | null
          sgst_amount: number | null
          sgst_rate: number | null
          status: string
          subtotal: number
          tax_rate: number
          title: string
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount?: number | null
          due_date?: string | null
          gstin?: string | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number: string
          issue_date?: string
          notes?: string | null
          place_of_supply?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string
          subtotal?: number
          tax_rate?: number
          title: string
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          cgst_amount?: number | null
          cgst_rate?: number | null
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          discount?: number | null
          due_date?: string | null
          gstin?: string | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          igst_rate?: number | null
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          place_of_supply?: string | null
          sgst_amount?: number | null
          sgst_rate?: number | null
          status?: string
          subtotal?: number
          tax_rate?: number
          title?: string
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
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
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
            foreignKeyName: "jobs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
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
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "journal_entries_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
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
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
            foreignKeyName: "leads_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_balances: {
        Row: {
          agency_id: string | null
          allocated_days: number
          created_at: string
          employee_id: string | null
          id: string
          leave_type_id: string | null
          pending_days: number | null
          remaining_days: number | null
          updated_at: string
          used_days: number | null
          year: number
        }
        Insert: {
          agency_id?: string | null
          allocated_days: number
          created_at?: string
          employee_id?: string | null
          id?: string
          leave_type_id?: string | null
          pending_days?: number | null
          remaining_days?: number | null
          updated_at?: string
          used_days?: number | null
          year: number
        }
        Update: {
          agency_id?: string | null
          allocated_days?: number
          created_at?: string
          employee_id?: string | null
          id?: string
          leave_type_id?: string | null
          pending_days?: number | null
          remaining_days?: number | null
          updated_at?: string
          used_days?: number | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          agency_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string
          total_days: number
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string
          total_days: number
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string
          total_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          max_days_per_year: number | null
          name: string
          requires_approval: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_days_per_year?: number | null
          name: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          max_days_per_year?: number | null
          name?: string
          requires_approval?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          agency_id: string | null
          category: string
          created_at: string
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string | null
          weekend_notifications: boolean | null
        }
        Insert: {
          agency_id?: string | null
          category: string
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string | null
          weekend_notifications?: boolean | null
        }
        Update: {
          agency_id?: string | null
          category?: string
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string | null
          weekend_notifications?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          agency_id: string | null
          category: string
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          read_at: string | null
          sent_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          agency_id?: string | null
          category: string
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          agency_id?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_analytics: {
        Row: {
          agency_id: string | null
          amount: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          payment_method_type: string | null
          processed_at: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_id: string | null
        }
        Insert: {
          agency_id?: string | null
          amount: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          payment_method_type?: string | null
          processed_at?: string | null
          status: string
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
        }
        Update: {
          agency_id?: string | null
          amount?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          payment_method_type?: string | null
          processed_at?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_id?: string | null
        }
        Relationships: []
      }
      payroll: {
        Row: {
          agency_id: string | null
          base_salary: number
          bonuses: number | null
          created_at: string
          created_by: string | null
          deductions: number | null
          employee_id: string
          gross_pay: number
          hours_worked: number | null
          id: string
          net_pay: number
          notes: string | null
          overtime_hours: number | null
          overtime_pay: number | null
          payroll_period_id: string
          status: string
          tax_deductions: number | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          base_salary?: number
          bonuses?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_id: string
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          net_pay?: number
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_period_id: string
          status?: string
          tax_deductions?: number | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          base_salary?: number
          bonuses?: number | null
          created_at?: string
          created_by?: string | null
          deductions?: number | null
          employee_id?: string
          gross_pay?: number
          hours_worked?: number | null
          id?: string
          net_pay?: number
          notes?: string | null
          overtime_hours?: number | null
          overtime_pay?: number | null
          payroll_period_id?: string
          status?: string
          tax_deductions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          name: string
          pay_date: string | null
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          name: string
          pay_date?: string | null
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          name?: string
          pay_date?: string | null
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      plan_feature_mappings: {
        Row: {
          created_at: string
          enabled: boolean
          feature_id: string
          id: string
          plan_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_id: string
          id?: string
          plan_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_id?: string
          id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_feature_mappings_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "plan_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_feature_mappings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agency_id: string
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
          agency_id: string
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
          agency_id?: string
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
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "projects_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
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
          agency_id: string | null
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
          agency_id?: string | null
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
          agency_id?: string | null
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
            foreignKeyName: "quotations_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quotation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursement_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          reimbursement_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          reimbursement_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          reimbursement_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursement_attachments_reimbursement_id_fkey"
            columns: ["reimbursement_id"]
            isOneToOne: false
            referencedRelation: "reimbursement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursement_requests: {
        Row: {
          agency_id: string | null
          amount: number
          business_purpose: string | null
          category_id: string
          created_at: string
          currency: string
          description: string
          employee_id: string
          expense_date: string
          finance_reviewer_id: string | null
          id: string
          manager_id: string | null
          mileage_amount: number | null
          mileage_distance: number | null
          mileage_rate: number | null
          payment_date: string | null
          policy_violation: string | null
          receipt_required: boolean | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          amount: number
          business_purpose?: string | null
          category_id: string
          created_at?: string
          currency?: string
          description: string
          employee_id: string
          expense_date: string
          finance_reviewer_id?: string | null
          id?: string
          manager_id?: string | null
          mileage_amount?: number | null
          mileage_distance?: number | null
          mileage_rate?: number | null
          payment_date?: string | null
          policy_violation?: string | null
          receipt_required?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          amount?: number
          business_purpose?: string | null
          category_id?: string
          created_at?: string
          currency?: string
          description?: string
          employee_id?: string
          expense_date?: string
          finance_reviewer_id?: string | null
          id?: string
          manager_id?: string | null
          mileage_amount?: number | null
          mileage_distance?: number | null
          mileage_rate?: number | null
          payment_date?: string | null
          policy_violation?: string | null
          receipt_required?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_reimbursement_requests_employee_id"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reimbursement_requests_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursement_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reimbursement_workflow_states: {
        Row: {
          action_date: string | null
          actor_id: string | null
          attachments: Json | null
          comments: string | null
          created_at: string
          id: string
          request_id: string | null
          state: string
        }
        Insert: {
          action_date?: string | null
          actor_id?: string | null
          attachments?: Json | null
          comments?: string | null
          created_at?: string
          id?: string
          request_id?: string | null
          state: string
        }
        Update: {
          action_date?: string | null
          actor_id?: string | null
          attachments?: Json | null
          comments?: string | null
          created_at?: string
          id?: string
          request_id?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursement_workflow_states_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "reimbursement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          expires_at: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          generated_at: string
          generated_by: string | null
          id: string
          is_public: boolean | null
          name: string
          parameters: Json | null
          report_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          parameters?: Json | null
          report_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          parameters?: Json | null
          report_type?: string
        }
        Relationships: []
      }
      role_change_requests: {
        Row: {
          approval_reason: string | null
          approved_by: string | null
          created_at: string | null
          existing_role: Database["public"]["Enums"]["app_role"] | null
          expires_at: string | null
          id: string
          reason: string | null
          rejected_by: string | null
          requested_by: string
          requested_role: Database["public"]["Enums"]["app_role"]
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approval_reason?: string | null
          approved_by?: string | null
          created_at?: string | null
          existing_role?: Database["public"]["Enums"]["app_role"] | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          rejected_by?: string | null
          requested_by: string
          requested_role: Database["public"]["Enums"]["app_role"]
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approval_reason?: string | null
          approved_by?: string | null
          created_at?: string | null
          existing_role?: Database["public"]["Enums"]["app_role"] | null
          expires_at?: string | null
          id?: string
          reason?: string | null
          rejected_by?: string | null
          requested_by?: string
          requested_role?: Database["public"]["Enums"]["app_role"]
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_metadata: {
        Row: {
          created_at: string | null
          department_restricted: boolean | null
          description: string | null
          display_name: string
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department_restricted?: boolean | null
          description?: string | null
          display_name: string
          id?: string
          permissions?: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department_restricted?: boolean | null
          description?: string | null
          display_name?: string
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          granted: boolean | null
          id: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          granted?: boolean | null
          id?: string
          permission_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          granted?: boolean | null
          id?: string
          permission_id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
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
      ssn_access_logs: {
        Row: {
          access_reason: string | null
          access_timestamp: string
          accessed_by: string | null
          created_at: string
          employee_user_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_timestamp?: string
          accessed_by?: string | null
          created_at?: string
          employee_user_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_timestamp?: string
          accessed_by?: string | null
          created_at?: string
          employee_user_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      subscription_analytics: {
        Row: {
          agency_id: string | null
          canceled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_amount: number
          plan_name: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          agency_id?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_amount?: number
          plan_name: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          agency_id?: string | null
          canceled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_amount?: number
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: string
          is_active: boolean
          max_agencies: number | null
          max_storage_gb: number | null
          max_users: number | null
          name: string
          price: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          max_agencies?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          max_agencies?: number | null
          max_storage_gb?: number | null
          max_users?: number | null
          name?: string
          price?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          agency_id: string | null
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          first_response_at: string | null
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          tags: string[] | null
          ticket_number: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          agency_id?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          first_response_at?: string | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          tags?: string[] | null
          ticket_number: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          agency_id?: string | null
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          first_response_at?: string | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          tags?: string[] | null
          ticket_number?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_usage_logs: {
        Row: {
          action_type: string
          agency_id: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          session_id: string | null
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          agency_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          agency_id?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          session_id?: string | null
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          agency_id: string | null
          assigned_at: string
          assigned_by: string
          id: string
          role: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          assigned_at?: string
          assigned_by?: string
          id?: string
          role?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          assigned_at?: string
          assigned_by?: string
          id?: string
          role?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          agency_id: string | null
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id?: string
        }
        Update: {
          agency_id?: string | null
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_time_tracking: {
        Row: {
          agency_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          hours_logged: number | null
          id: string
          start_time: string
          task_id: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          start_time: string
          task_id: string
          user_id?: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          hours_logged?: number | null
          id?: string
          start_time?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_time_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          agency_id: string | null
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          agency_id?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          agency_id?: string | null
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_assignments: {
        Row: {
          agency_id: string | null
          created_at: string
          created_by: string
          department_id: string
          end_date: string | null
          id: string
          is_active: boolean | null
          position_title: string | null
          reporting_to: string | null
          role_in_department: string | null
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          created_at?: string
          created_by?: string
          department_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          position_title?: string | null
          reporting_to?: string | null
          role_in_department?: string | null
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_id?: string | null
          created_at?: string
          created_by?: string
          department_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          position_title?: string | null
          reporting_to?: string | null
          role_in_department?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          agency_id: string | null
          assigned_at: string
          assigned_by: string
          id: string
          team_assignment_id: string
          team_role: string | null
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          assigned_at?: string
          assigned_by?: string
          id?: string
          team_assignment_id: string
          team_role?: string | null
          user_id: string
        }
        Update: {
          agency_id?: string | null
          assigned_at?: string
          assigned_by?: string
          id?: string
          team_assignment_id?: string
          team_role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_assignment_id_fkey"
            columns: ["team_assignment_id"]
            isOneToOne: false
            referencedRelation: "team_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          agency_id: string | null
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          agency_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          agency_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown | null
          is_active: boolean
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_gst_liability: {
        Args: { p_agency_id: string; p_end_date: string; p_start_date: string }
        Returns: {
          total_cess: number
          total_cgst: number
          total_igst: number
          total_sgst: number
          total_tax: number
          total_taxable_value: number
        }[]
      }
      can_access_employee_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_view_employee_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_immutable_audit_log: {
        Args: {
          p_action: string
          p_new_values: Json
          p_old_values: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: string
      }
      create_notification: {
        Args: {
          p_action_url?: string
          p_category: string
          p_expires_at?: string
          p_message: string
          p_metadata?: Json
          p_priority?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      decrypt_ssn: {
        Args: { encrypted_ssn: string; encryption_key?: string }
        Returns: string
      }
      decrypt_ssn_with_audit: {
        Args: {
          access_reason?: string
          employee_user_id: string
          encrypted_ssn: string
        }
        Returns: string
      }
      encrypt_ssn: {
        Args: { encryption_key?: string; ssn_text: string }
        Returns: string
      }
      encrypt_ssn_with_rotation: {
        Args: { key_version?: number; ssn_text: string }
        Returns: string
      }
      generate_client_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_employee_full_details: {
        Args: { target_user_id: string }
        Returns: {
          department: string
          emp_position: string
          employee_id: string
          employment_type: string
          first_name: string
          full_name: string
          hire_date: string
          id: string
          is_active: boolean
          last_name: string
          phone: string
          social_security_number: string
          user_id: string
        }[]
      }
      get_employee_ssn: {
        Args: { employee_user_id: string }
        Returns: string
      }
      get_leave_balance_summary: {
        Args: { p_employee_id?: string; p_year?: number }
        Returns: {
          allocated_days: number
          leave_type_name: string
          pending_days: number
          remaining_days: number
          used_days: number
        }[]
      }
      get_unread_notification_count: {
        Args: { p_user_id?: string }
        Returns: number
      }
      get_user_agency_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: { permission_name: string; user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_or_higher: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_leave_balances: {
        Args: { p_employee_id: string; p_year?: number }
        Returns: undefined
      }
      is_account_locked: {
        Args: { user_email: string }
        Returns: boolean
      }
      list_employees: {
        Args: Record<PropertyKey, never>
        Returns: {
          department: string
          emp_position: string
          employee_id: string
          employment_type: string
          first_name: string
          full_name: string
          hire_date: string
          id: string
          is_active: boolean
          last_name: string
          phone: string
          user_id: string
        }[]
      }
      log_system_usage: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: boolean
      }
      record_failed_login: {
        Args: {
          client_ip?: unknown
          client_user_agent?: string
          user_email: string
        }
        Returns: boolean
      }
      rotate_ssn_encryption_keys: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      unlock_account: {
        Args: { user_email: string }
        Returns: boolean
      }
      validate_expense_policy: {
        Args: {
          p_amount: number
          p_category_id: string
          p_has_receipt?: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "hr"
        | "finance_manager"
        | "employee"
        | "super_admin"
        | "ceo"
        | "cto"
        | "cfo"
        | "coo"
        | "operations_manager"
        | "department_head"
        | "team_lead"
        | "project_manager"
        | "sales_manager"
        | "marketing_manager"
        | "quality_assurance"
        | "it_support"
        | "legal_counsel"
        | "business_analyst"
        | "customer_success"
        | "contractor"
        | "intern"
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
      app_role: [
        "admin",
        "hr",
        "finance_manager",
        "employee",
        "super_admin",
        "ceo",
        "cto",
        "cfo",
        "coo",
        "operations_manager",
        "department_head",
        "team_lead",
        "project_manager",
        "sales_manager",
        "marketing_manager",
        "quality_assurance",
        "it_support",
        "legal_counsel",
        "business_analyst",
        "customer_success",
        "contractor",
        "intern",
      ],
    },
  },
} as const
