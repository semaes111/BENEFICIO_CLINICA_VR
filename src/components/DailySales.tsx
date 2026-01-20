import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface DailySalesData {
  treatment_date: string
  gross_revenue: number
  product_costs: number
  gross_profit_before_overhead: number
  cash_amount: number
  card_amount: number
  transfer_amount: number
  num_treatments: number
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

// Demo data
const demoSales: DailySalesData[] = [
  { treatment_date: '2026-01-18', gross_revenue: 1500, product_costs: 300, gross_profit_before_overhead: 1200, cash_amount: 500, card_amount: 800, transfer_amount: 200, num_treatments: 5 },
  { treatment_date: '2026-01-17', gross_revenue: 2100, product_costs: 450, gross_profit_before_overhead: 1650, cash_amount: 700, card_amount: 1200, transfer_amount: 200, num_treatments: 7 },
]

export default function DailySales() {
  const [sales, setSales] = useState<DailySalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSales()
  }, [])

  async function loadSales() {
    setLoading(true)
    if (!isSupabaseConfigured || !supabase) {
      setSales(demoSales)
      setLoading(false)
      return
    }

    // Obtener datos agregados por día desde daily_treatments
    const { data, error } = await supabase
      .from('daily_summary')
      .select('*')
      .order('treatment_date', { ascending: false })
      .limit(50)
    
    if (!error && data) {
      setSales(data as DailySalesData[])
    } else {
      console.error('Error loading daily summary:', error)
      setSales(demoSales)
    }
    setLoading(false)
  }

  // Calcular totales
  const totals = sales.reduce((acc, sale) => ({
    gross_revenue: acc.gross_revenue + (sale.gross_revenue || 0),
    product_costs: acc.product_costs + (sale.product_costs || 0),
    gross_profit: acc.gross_profit + (sale.gross_profit_before_overhead || 0),
    cash: acc.cash + (sale.cash_amount || 0),
    card: acc.card + (sale.card_amount || 0),
    transfer: acc.transfer + (sale.transfer_amount || 0),
    treatments: acc.treatments + (sale.num_treatments || 0)
  }), { gross_revenue: 0, product_costs: 0, gross_profit: 0, cash: 0, card: 0, transfer: 0, treatments: 0 })

  return (
    <div className="animate-fade-in">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>Ventas Diarias</h1>
          <p>Resumen automático de tratamientos registrados</p>
        </div>
        <button className="btn btn-primary" onClick={loadSales}>
          🔄 Actualizar
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border border-emerald-500/20">
          <p className="text-xs text-emerald-400 uppercase font-bold">Total Ingresos</p>
          <p className="text-2xl font-bold text-emerald-300">{formatCurrency(totals.gross_revenue)}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-red-900/40 to-rose-900/40 border border-red-500/20">
          <p className="text-xs text-red-400 uppercase font-bold">Costes Productos</p>
          <p className="text-2xl font-bold text-red-300">{formatCurrency(totals.product_costs)}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-blue-500/20">
          <p className="text-xs text-blue-400 uppercase font-bold">Beneficio Bruto</p>
          <p className="text-2xl font-bold text-blue-300">{formatCurrency(totals.gross_profit)}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20">
          <p className="text-xs text-purple-400 uppercase font-bold">Nº Tratamientos</p>
          <p className="text-2xl font-bold text-purple-300">{totals.treatments}</p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl">💡</span>
        <p className="text-blue-300 text-sm">
          Los datos se generan <strong>automáticamente</strong> desde los tratamientos registrados en el Dashboard. 
          Añade tratamientos allí y aparecerán aquí agrupados por día.
        </p>
      </div>

      {/* Table */}
      <div className="card">
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-lg">Historial por Día</h3>
          <span className="text-xs text-muted">{sales.length} días con actividad</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/5">
                <th className="p-4 text-left text-xs font-bold uppercase text-gray-400">Fecha</th>
                <th className="p-4 text-center text-xs font-bold uppercase text-gray-400">Tratamientos</th>
                <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Ingresos</th>
                <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Costes</th>
                <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Beneficio</th>
                <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Efectivo</th>
                <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Tarjeta</th>
                <th className="p-4 text-right text-xs font-bold uppercase text-gray-400">Transfer.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted">Cargando...</td></tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="text-4xl mb-4 opacity-30">📝</div>
                    <p className="text-muted">No hay ventas registradas</p>
                    <p className="text-xs text-muted mt-2">Añade tratamientos desde el Dashboard para verlos aquí</p>
                  </td>
                </tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.treatment_date} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium">{format(new Date(sale.treatment_date), 'dd/MM/yyyy')}</td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold">
                        {sale.num_treatments}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium text-white">{formatCurrency(sale.gross_revenue)}</td>
                    <td className="p-4 text-right text-red-400">{formatCurrency(sale.product_costs)}</td>
                    <td className="p-4 text-right font-bold text-emerald-400">{formatCurrency(sale.gross_profit_before_overhead)}</td>
                    <td className="p-4 text-right text-gray-400">{formatCurrency(sale.cash_amount || 0)}</td>
                    <td className="p-4 text-right text-gray-400">{formatCurrency(sale.card_amount || 0)}</td>
                    <td className="p-4 text-right text-gray-400">{formatCurrency(sale.transfer_amount || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {sales.length > 0 && (
              <tfoot className="bg-white/5 border-t border-white/10">
                <tr className="font-bold">
                  <td className="p-4">TOTALES</td>
                  <td className="p-4 text-center text-purple-300">{totals.treatments}</td>
                  <td className="p-4 text-right text-white">{formatCurrency(totals.gross_revenue)}</td>
                  <td className="p-4 text-right text-red-400">{formatCurrency(totals.product_costs)}</td>
                  <td className="p-4 text-right text-emerald-400">{formatCurrency(totals.gross_profit)}</td>
                  <td className="p-4 text-right text-gray-400">{formatCurrency(totals.cash)}</td>
                  <td className="p-4 text-right text-gray-400">{formatCurrency(totals.card)}</td>
                  <td className="p-4 text-right text-gray-400">{formatCurrency(totals.transfer)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
