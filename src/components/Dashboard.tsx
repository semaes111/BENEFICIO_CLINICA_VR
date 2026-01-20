import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { MonthlySummary, MonthlyLaborCosts, TreatmentCatalog, DailyTreatment, DailySummary } from '@/types/database'

// Formatear números como moneda
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [catalog, setCatalog] = useState<TreatmentCatalog[]>([])
  
  // Dashboard Data
  const [summary, setSummary] = useState<MonthlySummary | null>(null)
  const [laborCosts, setLaborCosts] = useState<MonthlyLaborCosts | null>(null)
  const [dailyData, setDailyData] = useState<DailySummary | null>(null)
  const [todaysTreatments, setTodaysTreatments] = useState<DailyTreatment[]>([])

  // Form State
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('card')

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadDailyData()
  }, [selectedDate])

  async function loadInitialData() {
    try {
      if (!isSupabaseConfigured || !supabase) return

      console.log('Fetching catalog...')
      // Cargar catálogo
      const { data: catalogData, error: catalogError } = await supabase
        .from('treatments_catalog')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (catalogError) console.error('Error fetching catalog:', catalogError)
      if (catalogData) {
        console.log('Catalog loaded:', catalogData.length, 'items')
        setCatalog(catalogData)
      } else {
        console.log('No catalog data found')
      }

      // Cargar costes laborales (para cálculos)
      const { data: laborData } = await supabase
        .from('monthly_labor_costs' as any)
        .select('*')
        .limit(1)
        .single()
      if (laborData) setLaborCosts(laborData as MonthlyLaborCosts)

      // Cargar resumen del mes actual
      await loadMonthlySummary()

    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadMonthlySummary() {
    if (!supabase) return
    const date = new Date(selectedDate)
    const { data } = await (supabase.rpc as any)('calculate_monthly_summary', {
      p_year: date.getFullYear(),
      p_month: date.getMonth() + 1
    })
    if (data) setSummary(data[0])
  }

  async function loadDailyData() {
    if (!supabase) return
    
    // 1. Cargar tratamientos del día
    const { data: treatments } = await supabase
      .from('daily_treatments')
      .select(`
        *,
        treatment:treatments_catalog(name)
      `)
      .eq('treatment_date', selectedDate)
      .order('created_at', { ascending: false })
    
    if (treatments) setTodaysTreatments(treatments)

    // 2. Cargar resumen del día (vista)
    const { data: dailyView } = await supabase
      .from('daily_summary')
      .select('*')
      .eq('treatment_date', selectedDate)
      .maybeSingle()
    
    if (dailyView) {
      setDailyData(dailyView)
    } else {
      setDailyData(null)
    }
  }

  async function handleAddTreatment(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !selectedTreatmentId) return

    const treatment = catalog.find(t => t.id === selectedTreatmentId)
    if (!treatment) return

    const { error } = await (supabase.from('daily_treatments') as any).insert({
      treatment_date: selectedDate,
      treatment_id: treatment.id,
      quantity: quantity,
      sale_price: treatment.sale_price,
      cost_price: treatment.cost_price,
      payment_method: paymentMethod
    })

    if (error) {
      alert('Error al añadir tratamiento: ' + error.message)
    } else {
      // Reset form and reload
      setQuantity(1)
      loadDailyData()
      loadMonthlySummary() // Update monthly KPIs
    }
  }

  async function handleDeleteTreatment(id: string) {
    if (!confirm('¿Borrar este tratamiento?')) return
    if (!supabase) return

    await supabase.from('daily_treatments').delete().eq('id', id)
    loadDailyData()
    loadMonthlySummary()
  }

  if (loading) return <div className="p-8 text-center text-muted">Cargando...</div>

  return (
    <div className="animate-fade-in space-y-8 max-w-7xl mx-auto">
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
              Panel Diario 
            </span>
            <span className="text-2xl ml-2 opacity-50">✨</span>
          </h1>
          <p className="text-muted text-lg max-w-2xl mb-4">
            Gestiona los tratamientos de hoy y visualiza tu <span className="text-emerald-400 font-medium">beneficio real</span> al instante.
          </p>

          {/* DEBUG PANEL - TEMPORARY */}
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg text-xs font-mono text-gray-400 mb-6">
            <p className="font-bold text-white mb-2 underline">PANEL DE DIAGNÓSTICO (Para Soporte):</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1">
              <span>Supabase Configurado:</span>
              <span className={isSupabaseConfigured ? "text-green-400" : "text-red-500 font-bold"}>
                {isSupabaseConfigured ? "SÍ (Conectado)" : "NO (Revisar .env)"}
              </span>
              
              <span>Items en Catálogo:</span>
              <span className={catalog.length > 0 ? "text-green-400" : "text-orange-400"}>
                {catalog.length} tratamientos cargados
              </span>

              <span>Estado Carga:</span>
              <span>{loading ? "Cargando..." : "Finalizado"}</span>

              {/* Si hay error, mostrarlo en rojo */}
              <div className="col-span-2 mt-2 pt-2 border-t border-gray-800">
                {catalog.length === 0 && !loading && isSupabaseConfigured && (
                  <span className="text-yellow-400">
                    ⚠ La tabla parece vacía o bloqueada. Revisa si ejecutaste el script SQL 005.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <label className="text-xs text-muted uppercase tracking-wider font-semibold">Seleccionar Fecha</label>
          <div className="relative group">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#1a1a24] border border-white/10 rounded-xl px-6 py-3 text-white text-lg font-medium outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-lg group-hover:border-primary/30"
            />
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Main Interaction (Span 8) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Add Treatment Bar - Gradient Theme: Purple/Pink */}
          <div className="relative overflow-hidden card p-1 rounded-2xl bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/20 shadow-2xl shadow-purple-900/20">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500"></div>
             
             <div className="bg-[#0f0f14]/80 backdrop-blur-xl p-6 rounded-xl relative z-10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">✚</div>
                Nuevo Registro
              </h3>
              
              <form onSubmit={handleAddTreatment} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wide mb-2">Tratamiento</label>
                  <select 
                    value={selectedTreatmentId}
                    onChange={e => setSelectedTreatmentId(e.target.value)}
                    className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all hover:bg-black/60"
                    required
                  >
                    <option value="">Seleccionar del catálogo...</option>
                    {catalog.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {formatCurrency(t.sale_price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wide mb-2">Cantidad</label>
                  <input 
                    type="number" 
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white text-center focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all hover:bg-black/60"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-purple-300 uppercase tracking-wide mb-2">Método Pago</label>
                  <select 
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-black/40 border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all hover:bg-black/60"
                  >
                    <option value="card">💳 Tarjeta</option>
                    <option value="cash">💶 Efectivo</option>
                    <option value="transfer">🏦 Transferencia</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button 
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-purple-900/40 transition-all transform hover:scale-[1.02] active:scale-95 border border-white/10"
                  >
                    Añadir
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* 2. Treatments List Table - Gradient Theme: Blue/Cyan */}
          <div className="relative overflow-hidden card p-1 rounded-2xl bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-blue-500/20 shadow-2xl shadow-blue-900/20">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>
             
             <div className="bg-[#0f0f14]/90 backdrop-blur-xl rounded-xl relative z-10">
               <div className="p-6 border-b border-blue-500/10 flex justify-between items-center bg-blue-500/5">
                  <h3 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center gap-2">
                    <span className="text-xl">📋</span> Tratamientos de Hoy
                  </h3>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">
                    {todaysTreatments.length} Registros
                  </span>
               </div>
               
               <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-blue-500/5 border-b border-blue-500/10">
                      <th className="p-5 text-left text-xs font-bold text-blue-300 uppercase tracking-wider">Tratamiento</th>
                      <th className="p-5 text-center text-xs font-bold text-blue-300 uppercase tracking-wider">Cant.</th>
                      <th className="p-5 text-right text-xs font-bold text-blue-300 uppercase tracking-wider">Venta</th>
                      <th className="p-5 text-right text-xs font-bold text-blue-300 uppercase tracking-wider">Margen</th>
                      <th className="p-5 text-right text-xs font-bold text-blue-300 uppercase tracking-wider">Beneficio</th>
                      <th className="p-5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-500/5">
                    {todaysTreatments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center">
                          <div className="text-4xl mb-4 opacity-30 grayscale">📝</div>
                          <p className="text-blue-300/50 italic font-medium">No hay tratamientos registrados hoy</p>
                        </td>
                      </tr>
                    ) : (
                      todaysTreatments.map(item => (
                        <tr key={item.id} className="group hover:bg-blue-500/5 transition-colors">
                          <td className="p-5">
                            <div className="font-semibold text-gray-200 group-hover:text-blue-300 transition-colors">
                              {item.treatment?.name || 'Tratamiento eliminado'}
                            </div>
                            <div className="text-xs text-blue-300/60 flex items-center gap-2 mt-1">
                               <span className={`w-2 h-2 rounded-full ${item.payment_method === 'cash' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                               {item.payment_method === 'card' ? 'Tarjeta' : item.payment_method === 'cash' ? 'Efectivo' : 'Transferencia'}
                            </div>
                          </td>
                          <td className="p-5 text-center font-medium opacity-80">{item.quantity}</td>
                          <td className="p-5 text-right font-medium text-gray-300">
                            {formatCurrency(item.total_revenue)}
                          </td>
                          <td className="p-5 text-right font-medium text-gray-400">
                             {Math.round((item.gross_profit / item.total_revenue) * 100)}%
                          </td>
                          <td className="p-5 text-right font-bold text-emerald-400 text-lg drop-shadow-sm">
                            +{formatCurrency(item.gross_profit)}
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => handleDeleteTreatment(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Eliminar registro"
                            >
                             ✕
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Summary Stats (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Main Profit Card */}
          <div className={`relative group overflow-hidden rounded-3xl border shadow-2xl p-8 transition-all duration-500
            ${!dailyData || dailyData.daily_net_profit > 0 
              ? 'bg-gradient-to-br from-emerald-950/40 to-teal-950/40 border-emerald-500/20 shadow-emerald-900/20' 
              : 'bg-gradient-to-br from-red-950/40 to-rose-950/40 border-red-500/20 shadow-red-900/20'
            }`}>
            
            {/* Background Glow */}
            <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-40 mix-blend-screen transition-colors duration-1000
              ${!dailyData || dailyData.daily_net_profit > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <h3 className={`text-sm font-bold uppercase tracking-widest mb-2 flex items-center gap-2
                  ${!dailyData || dailyData.daily_net_profit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  <span className="text-xl">{!dailyData || dailyData.daily_net_profit > 0 ? '📈' : '📉'}</span>
                  Beneficio Neto Hoy
                </h3>
                <div className={`text-5xl font-black tracking-tight drop-shadow-lg
                  ${!dailyData || dailyData.daily_net_profit > 0 
                    ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300' 
                    : 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-400 to-orange-400'}`}>
                  {formatCurrency(dailyData?.daily_net_profit || 0)}
                </div>
              </div>
              
              <div className="mt-6 flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-xl text-sm font-bold border backdrop-blur-md shadow-lg
                  ${!dailyData || dailyData.daily_net_profit > 0 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                  {dailyData?.profit_margin_pct || 0}% Margen
                </div>
                <span className="text-sm text-gray-400 font-medium">vs costes totales</span>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown - Gradient Theme: Orange/Amber */}
          <div className="relative overflow-hidden card p-1 rounded-2xl bg-gradient-to-br from-orange-900/30 to-amber-900/30 border border-orange-500/20 shadow-2xl shadow-orange-900/20">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"></div>

             <div className="bg-[#0f0f14]/80 backdrop-blur-xl p-8 rounded-xl relative z-10">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-amber-300">
                <span className="text-2xl">📊</span> Desglose Contable
              </h3>
              
              <div className="space-y-5">
                <div className="flex justify-between items-center p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                  <span className="text-orange-200/70 font-bold uppercase text-xs tracking-wider">Ingresos Brutos</span>
                  <span className="font-bold text-white text-lg">{formatCurrency(dailyData?.gross_revenue || 0)}</span>
                </div>
                
                <div className="pl-4 border-l-2 border-orange-500/10 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">(-) IVA 21%</span>
                    <span className="text-gray-400">{formatCurrency((dailyData?.gross_revenue || 0) * 0.21 / 1.21)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted text-base">Ingresos Netos</span>
                    <span className="font-bold text-white text-base">{formatCurrency(dailyData?.net_revenue_ex_vat || 0)}</span>
                  </div>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-orange-500/20 to-transparent my-4"></div>

                <div className="pl-4 border-l-2 border-red-500/20 space-y-3">
                   <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Costes Deducidos</h4>
                  <div className="flex justify-between text-sm group cursor-help hover:bg-red-500/5 p-1 rounded transition-colors" title="Coste de compra de los productos usados">
                    <span className="text-gray-400">📦 Productos</span>
                    <span className="text-red-300 font-medium">-{formatCurrency(dailyData?.product_costs || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm group cursor-help hover:bg-red-500/5 p-1 rounded transition-colors" title="Alquiler, luz, software... dividido por 30 días">
                    <span className="text-gray-400">🏢 Fijos Diarios</span>
                    <span className="text-red-300 font-medium">-{formatCurrency(dailyData?.daily_fixed_cost || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm group cursor-help hover:bg-red-500/5 p-1 rounded transition-colors" title="Sueldos + SS + IRPF dividido por 22 días laborables">
                    <span className="text-gray-400">👥 Personal Diario</span>
                    <span className="text-red-300 font-medium">-{formatCurrency(dailyData?.daily_labor_cost || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="animate-pulse p-4 bg-gradient-to-r from-yellow-900/20 to-yellow-600/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h4 className="text-yellow-500 font-bold text-sm">Modo Demo Activo</h4>
                <p className="text-yellow-500/70 text-xs mt-1">
                  Los datos que ves son simulados. Configura Supabase para guardar información real.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
