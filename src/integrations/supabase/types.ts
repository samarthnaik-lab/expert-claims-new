export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      departments: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          manager_id: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          manager_id?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_expenses: {
        Row: {
          amount: number
          description: string | null
          employee_id: string
          expense_date: string
          expense_type: string
          id: string
          receipt_path: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          amount: number
          description?: string | null
          employee_id: string
          expense_date: string
          expense_type: string
          id?: string
          receipt_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          amount?: number
          description?: string | null
          employee_id?: string
          expense_date?: string
          expense_type?: string
          id?: string
          receipt_path?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_expenses_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leaves: {
        Row: {
          applied_at: string | null
          employee_id: string
          from_date: string
          id: string
          leave_type: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          to_date: string
        }
        Insert: {
          applied_at?: string | null
          employee_id: string
          from_date: string
          id?: string
          leave_type: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          to_date: string
        }
        Update: {
          applied_at?: string | null
          employee_id?: string
          from_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          to_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_leaves_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_payslips: {
        Row: {
          compensation_letter: string | null
          created_at: string | null
          employee_id: string
          gross_pay: number
          id: string
          month: string
          net_pay: number
          payslip_file: string | null
        }
        Insert: {
          compensation_letter?: string | null
          created_at?: string | null
          employee_id: string
          gross_pay: number
          id?: string
          month: string
          net_pay: number
          payslip_file?: string | null
        }
        Update: {
          compensation_letter?: string | null
          created_at?: string | null
          employee_id?: string
          gross_pay?: number
          id?: string
          month?: string
          net_pay?: number
          payslip_file?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          department: string | null
          department_id: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          task_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          task_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          comment_text: string
          created_at: string | null
          created_by: string
          hours_spent: number | null
          id: string
          is_internal: boolean | null
          task_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string | null
          created_by: string
          hours_spent?: number | null
          id?: string
          is_internal?: boolean | null
          task_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string | null
          created_by?: string
          hours_spent?: number | null
          id?: string
          is_internal?: boolean | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_daily_tracking: {
        Row: {
          created_at: string
          created_by: string
          id: string
          status: string
          task_id: string
          tracking_date: string
          work_description: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          status: string
          task_id: string
          tracking_date?: string
          work_description: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          status?: string
          task_id?: string
          tracking_date?: string
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_task_daily_tracking_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_task_daily_tracking_task_id"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_stakeholders: {
        Row: {
          contact: string | null
          contact_email: string | null
          created_at: string | null
          id: string
          notes: string | null
          role: string | null
          stakeholder_id: string | null
          stakeholder_name: string | null
          task_id: string
        }
        Insert: {
          contact?: string | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          stakeholder_id?: string | null
          stakeholder_name?: string | null
          task_id: string
        }
        Update: {
          contact?: string | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          role?: string | null
          stakeholder_id?: string | null
          stakeholder_name?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_stakeholders_stakeholder_id_fkey"
            columns: ["stakeholder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_stakeholders_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_status_history: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string | null
          id: string
          new_stage: Database["public"]["Enums"]["ticket_stage"]
          new_status: Database["public"]["Enums"]["task_status"]
          previous_stage: Database["public"]["Enums"]["ticket_stage"] | null
          previous_status: Database["public"]["Enums"]["task_status"] | null
          task_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          new_stage: Database["public"]["Enums"]["ticket_stage"]
          new_status: Database["public"]["Enums"]["task_status"]
          previous_stage?: Database["public"]["Enums"]["ticket_stage"] | null
          previous_status?: Database["public"]["Enums"]["task_status"] | null
          task_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          new_stage?: Database["public"]["Enums"]["ticket_stage"]
          new_status?: Database["public"]["Enums"]["task_status"]
          previous_stage?: Database["public"]["Enums"]["ticket_stage"] | null
          previous_status?: Database["public"]["Enums"]["task_status"] | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          approver_id: string | null
          assigned_to: string | null
          category_id: string | null
          created_at: string | null
          created_by: string
          current_status: Database["public"]["Enums"]["task_status"]
          customer_id: string | null
          description: string | null
          due_date: string | null
          estimated_efforts: number | null
          id: string
          planned_date: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          remaining_efforts: number | null
          reviewer_id: string | null
          task_id: string
          task_summary: string | null
          ticket_stage: Database["public"]["Enums"]["ticket_stage"]
          time_tracked: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approver_id?: string | null
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by: string
          current_status?: Database["public"]["Enums"]["task_status"]
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_efforts?: number | null
          id?: string
          planned_date?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          remaining_efforts?: number | null
          reviewer_id?: string | null
          task_id: string
          task_summary?: string | null
          ticket_stage?: Database["public"]["Enums"]["ticket_stage"]
          time_tracked?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approver_id?: string | null
          assigned_to?: string | null
          category_id?: string | null
          created_at?: string | null
          created_by?: string
          current_status?: Database["public"]["Enums"]["task_status"]
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          estimated_efforts?: number | null
          id?: string
          planned_date?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          remaining_efforts?: number | null
          reviewer_id?: string | null
          task_id?: string
          task_summary?: string | null
          ticket_stage?: Database["public"]["Enums"]["ticket_stage"]
          time_tracked?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reviewer_id_fkey"
            columns: ["reviewer_id"]
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
      generate_task_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "new" | "in-progress" | "completed" | "cancelled"
      ticket_stage: "analysis" | "review" | "approval" | "waiting"
      user_role: "admin" | "employee" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["new", "in-progress", "completed", "cancelled"],
      ticket_stage: ["analysis", "review", "approval", "waiting"],
      user_role: ["admin", "employee", "customer"],
    },
  },
} as const
