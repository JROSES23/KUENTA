// Este archivo sera generado por: npx supabase gen types typescript --local
// Por ahora, definimos los tipos manualmente basados en las migrations

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone: string | null
          display_name: string
          avatar_url: string | null
          push_token: string | null
          plan: string
          plan_expires_at: string | null
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          display_name: string
          avatar_url?: string | null
          push_token?: string | null
          plan?: string
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          display_name?: string
          avatar_url?: string | null
          push_token?: string | null
          plan?: string
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          id: string
          created_by: string
          name: string
          emoji: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by: string
          name: string
          emoji?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string
          name?: string
          emoji?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          id: number
          group_id: string
          user_id: string | null
          phone_guest: string | null
          guest_name: string | null
          role: string
          joined_at: string
        }
        Insert: {
          group_id: string
          user_id?: string | null
          phone_guest?: string | null
          guest_name?: string | null
          role?: string
          joined_at?: string
        }
        Update: {
          group_id?: string
          user_id?: string | null
          phone_guest?: string | null
          guest_name?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          paid_by: string
          title: string
          total_amount: number
          split_type: string
          receipt_url: string | null
          receipt_items: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          paid_by: string
          title: string
          total_amount: number
          split_type?: string
          receipt_url?: string | null
          receipt_items?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          paid_by?: string
          title?: string
          total_amount?: number
          split_type?: string
          receipt_url?: string | null
          receipt_items?: Json | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      expense_splits: {
        Row: {
          expense_id: string
          user_id: string
          amount_owed: number
          is_paid: boolean
          paid_at: string | null
          khipu_payment_id: string | null
          khipu_payment_url: string | null
        }
        Insert: {
          expense_id: string
          user_id: string
          amount_owed: number
          is_paid?: boolean
          paid_at?: string | null
          khipu_payment_id?: string | null
          khipu_payment_url?: string | null
        }
        Update: {
          expense_id?: string
          user_id?: string
          amount_owed?: number
          is_paid?: boolean
          paid_at?: string | null
          khipu_payment_id?: string | null
          khipu_payment_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_feed: {
        Row: {
          id: string
          actor_id: string
          type: string
          payload: Json
          visible_to: string[]
          created_at: string
        }
        Insert: {
          id?: string
          actor_id: string
          type: string
          payload?: Json
          visible_to?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string
          type?: string
          payload?: Json
          visible_to?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "activity_feed_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      plan_usage: {
        Row: {
          id: string
          user_id: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_expense_with_splits: {
        Args: {
          p_group_id: string
          p_paid_by: string
          p_title: string
          p_total: number
          p_split_type: string
          p_splits: Json
          p_receipt_url?: string | null
          p_receipt_items?: Json | null
          p_notes?: string | null
        }
        Returns: string
      }
      get_user_balance: {
        Args: { p_user_id: string }
        Returns: {
          total_owed_to_user: number
          total_user_owes: number
          net_balance: number
        }[]
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
