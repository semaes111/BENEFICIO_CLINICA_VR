// Tipos generados para Supabase - Calculadora Beneficios
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  calculadora: {
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
          effective_from: string
          effective_to: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          tax_type: string
          description?: string | null
          rate_percentage: number
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          tax_type?: string
          description?: string | null
          rate_percentage?: number
          effective_from?: string
          effective_to?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      expense_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          is_fixed: boolean
          icon: string
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_fixed?: boolean
          icon?: string
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_fixed?: boolean
          icon?: string
          color?: string
          created_at?: string
        }
      }
      fixed_expenses: {
        Row: {
          id: string
          category_id: string | null
          description: string
          amount: number
          frequency: 'monthly' | 'quarterly' | 'annual'
          start_date: string
          end_date: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id?: string | null
          description: string
          amount: number
          frequency?: 'monthly' | 'quarterly' | 'annual'
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string | null
          description?: string
          amount?: number
          frequency?: 'monthly' | 'quarterly' | 'annual'
          start_date?: string
          end_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      daily_sales: {
        Row: {
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
        Insert: {
          id?: string
          sale_date: string
          gross_amount: number
          cash_amount?: number
          card_amount?: number
          transfer_amount?: number
          medical_amount?: number
          aesthetic_amount?: number
          cosmetic_amount?: number
          product_sales_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sale_date?: string
          gross_amount?: number
          cash_amount?: number
          card_amount?: number
          transfer_amount?: number
          medical_amount?: number
          aesthetic_amount?: number
          cosmetic_amount?: number
          product_sales_amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
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
          cost_date: string
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
      variable_expenses: {
        Row: {
          id: string
          expense_date: string
          category_id: string | null
          description: string
          amount: number
          has_vat: boolean
          vat_amount: number | null
          invoice_number: string | null
          supplier: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          expense_date: string
          category_id?: string | null
          description: string
          amount: number
          has_vat?: boolean
          vat_amount?: number | null
          invoice_number?: string | null
          supplier?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          expense_date?: string
          category_id?: string | null
          description?: string
          amount?: number
          has_vat?: boolean
          vat_amount?: number | null
          invoice_number?: string | null
          supplier?: string | null
          notes?: string | null
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
          treatment_id: string
          quantity: number
          sale_price: number
          cost_price: number
          total_revenue: number
          total_cost: number
          gross_profit: number
          payment_method: 'cash' | 'card' | 'transfer'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          treatment_date?: string
          treatment_id: string
          quantity?: number
          sale_price: number
          cost_price: number
          payment_method?: 'cash' | 'card' | 'transfer'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          treatment_date?: string
          treatment_id?: string
          quantity?: number
          sale_price?: number
          cost_price?: number
          payment_method?: 'cash' | 'card' | 'transfer'
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
          employee_net_salary: number
          salary_per_employee: number
          ss_empresa_per_employee: number
          total_cost_per_employee: number
          total_employees_cost: number
          owner_gross_salary: number
          owner_ss_autonomo: number
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
  }
}

// Tipos de conveniencia
export type CompanyConfig = Database['calculadora']['Tables']['company_config']['Row']
export type TaxRate = Database['calculadora']['Tables']['tax_rates']['Row']
export type ExpenseCategory = Database['calculadora']['Tables']['expense_categories']['Row']
export type FixedExpense = Database['calculadora']['Tables']['fixed_expenses']['Row']
export type DailySale = Database['calculadora']['Tables']['daily_sales']['Row']
export type ProductCost = Database['calculadora']['Tables']['product_costs']['Row']
export type VariableExpense = Database['calculadora']['Tables']['variable_expenses']['Row']
export type MonthlyLaborCosts = Database['calculadora']['Views']['monthly_labor_costs']['Row']
export type MonthlySummary = Database['calculadora']['Functions']['calculate_monthly_summary']['Returns'][0]

// Tipos para el sistema de tratamientos
export interface TreatmentCatalog {
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

export interface DailyTreatment {
  id: string
  treatment_date: string
  treatment_id: string
  quantity: number
  sale_price: number
  cost_price: number
  total_revenue: number
  total_cost: number
  gross_profit: number
  payment_method: 'cash' | 'card' | 'transfer'
  notes: string | null
  created_at: string
  // Joined data
  treatment?: TreatmentCatalog
}

export interface DailySummary {
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

