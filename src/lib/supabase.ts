import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Flag para saber si Supabase está configurado
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Cliente Supabase (o null si no está configurado)
export const supabase = isSupabaseConfigured
  ? createClient<Database, 'calculadora'>(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'calculadora'
      }
    })
  : null

// Helper para llamar funciones RPC
export async function getMonthlySummary(year: number, month: number) {
  if (!supabase) return null
  
  // @ts-ignore
  const { data, error } = await supabase.rpc('calculate_monthly_summary', {
    p_year: year,
    p_month: month
  } as any)
  
  if (error) {
    console.error('Error fetching monthly summary:', error)
    return null
  }
  return data?.[0] || null
}
