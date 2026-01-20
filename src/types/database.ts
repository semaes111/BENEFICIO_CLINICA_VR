// Tipos para Supabase - Schema PUBLIC
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      company_config: {
        Row: {
          id: string
          company_name: string
          cif: string | null
          num_employees: number
          employee_net_salary: number
          employee_gross_salary: number
          owner_net_salary: number
          owner_gross_salary: number
          owner_ss_autonomo: number
          vat_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name?: string
          cif?: string | null
          num_employees?: number
          employee_net_salary?: number
          employee_gross_salary?: number
          owner_net_salary?: number
          owner_gross_salary?: number
          owner_ss_autonomo?: number
          vat_rate?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          cif?: string | null
          num_employees?: number
          employee_net_salary?: number
          employee_gross_salary?: number
          owner_net_salary?: number
          owner_gross_salary?: number
          owner_ss_autonomo?: number
          vat_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      tax_rates: {
        Row: {
          id: string
          tax_type: string
          description: string | null
          rate_percentage: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tax_type: string
          description?: string | null
          rate_percentage: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tax_type?: string
          description?: string | null
          rate_percentage?: number
          is_active?: boolean
          created_at?: string
        }
      }
      fixed_expenses: {
        Row: {
          id: string
          description: string
          amount: number
          frequency: 'monthly' | 'quarterly' | 'annual'
          start_date: string
          end_date: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          frequency?: 'monthly' | 'quarterly' | 'annual'
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          frequency?: 'monthly' | 'quarterly' | 'annual'
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      treatments_catalog: {
        Row: {
          id: string
          name: string
          category: 'medical' | 'aesthetic' | 'cosmetic'
          sale_price: number
          cost_price: number
          duration_mins: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: 'medical' | 'aesthetic' | 'cosmetic'
          sale_price: number
          cost_price?: number
          duration_mins?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'medical' | 'aesthetic' | 'cosmetic'
          sale_price?: number
          cost_price?: number
          duration_mins?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_treatments: {
        Row: {
          id: string
          treatment_date: string
          treatment_id: string | null
          quantity: number
          sale_price: number
          cost_price: number
          total_revenue: number
          total_cost: number
          gross_profit: number
          payment_method: 'cash' | 'card' | 'transfer'
          created_at: string
        }
        Insert: {
          id?: string
          treatment_date?: string
          treatment_id?: string | null
          quantity?: number
          sale_price: number
          cost_price: number
          payment_method?: 'cash' | 'card' | 'transfer'
          created_at?: string
        }
        Update: {
          id?: string
          treatment_date?: string
          treatment_id?: string | null
          quantity?: number
          sale_price?: number
          cost_price?: number
          payment_method?: 'cash' | 'card' | 'transfer'
          created_at?: string
        }
      }
      product_costs: {
        Row: {
          id: string
          cost_date: string
          product_name: string
          supplier: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cost_date?: string
          product_name: string
          supplier?: string | null
          quantity?: number
          unit_cost: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cost_date?: string
          product_name?: string
          supplier?: string | null
          quantity?: number
          unit_cost?: number
          notes?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      monthly_labor_costs: {
        Row: {
          config_id: string
          num_employees: number
          employee_gross_salary: number
          total_employees_cost: number
          total_owner_cost: number
          total_labor_cost: number
        }
      }
      monthly_fixed_expenses: {
        Row: {
          total_monthly_fixed: number
        }
      }
      daily_summary: {
        Row: {
          treatment_date: string
          gross_revenue: number
          net_revenue_ex_vat: number
          product_costs: number
          gross_profit_before_overhead: number
          daily_labor_cost: number
          daily_fixed_cost: number
          daily_net_profit: number
          profit_margin_pct: number
          cash_amount: number
          card_amount: number
          transfer_amount: number
          num_treatments: number
        }
      }
    }
    Functions: {
      calculate_monthly_summary: {
        Args: {
          p_year: number
          p_month: number
        }
        Returns: {
          year_month: string
          gross_revenue: number
          net_revenue_ex_vat: number
          product_costs: number
          variable_expenses: number
          fixed_expenses: number
          labor_costs: number
          total_expenses: number
          gross_profit: number
          corporate_tax: number
          net_profit: number
          profit_margin_pct: number
        }[]
      }
    }
    Enums: {}
  }
}

// Type exports for convenience
export type CompanyConfig = Database['public']['Tables']['company_config']['Row']
export type TaxRate = Database['public']['Tables']['tax_rates']['Row']
export type FixedExpense = Database['public']['Tables']['fixed_expenses']['Row']
export type TreatmentCatalog = Database['public']['Tables']['treatments_catalog']['Row']
export type DailyTreatment = Database['public']['Tables']['daily_treatments']['Row'] & {
  treatment?: { name: string }
}
export type ProductCost = Database['public']['Tables']['product_costs']['Row']
export type MonthlyLaborCosts = Database['public']['Views']['monthly_labor_costs']['Row']
export type DailySummary = Database['public']['Views']['daily_summary']['Row']
export type MonthlySummary = Database['public']['Functions']['calculate_monthly_summary']['Returns'][0]

// Legacy type for backwards compatibility
export type DailySale = {
  id: string
  sale_date: string
  gross_amount: number
  cash_amount: number
  card_amount: number
  transfer_amount: number
  medical_amount: number
  aesthetic_amount: number
  cosmetic_amount: number
  product_sales_amount: number
  notes: string | null
  created_at: string
  updated_at: string
}
