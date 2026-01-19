import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { DailySale } from '@/types/database'

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

// Demo data
const demoSales: DailySale[] = [
  { id: '1', sale_date: '2026-01-18', gross_amount: 1500, cash_amount: 500, card_amount: 800, transfer_amount: 200, medical_amount: 800, aesthetic_amount: 500, cosmetic_amount: 200, product_sales_amount: 0, notes: 'Demo', created_at: '', updated_at: '' },
  { id: '2', sale_date: '2026-01-17', gross_amount: 2100, cash_amount: 700, card_amount: 1200, transfer_amount: 200, medical_amount: 1000, aesthetic_amount: 800, cosmetic_amount: 300, product_sales_amount: 0, notes: null, created_at: '', updated_at: '' },
]

export default function DailySales() {
  const [sales, setSales] = useState<DailySale[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    sale_date: format(new Date(), 'yyyy-MM-dd'),
    gross_amount: '',
    cash_amount: '',
    card_amount: '',
    transfer_amount: '',
    medical_amount: '',
    aesthetic_amount: '',
    cosmetic_amount: '',
    product_sales_amount: '',
    notes: ''
  })

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
    const { data, error } = await supabase
      .from('daily_sales')
      .select('*')
      .order('sale_date', { ascending: false })
      .limit(50)
    
    if (!error && data) setSales(data)
    else setSales(demoSales)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isSupabaseConfigured || !supabase) {
      alert('Modo demo: Supabase no está configurado')
      return
    }
    
    const { error } = await supabase
      .from('daily_sales')
      .upsert({
        sale_date: formData.sale_date,
        gross_amount: parseFloat(formData.gross_amount) || 0,
        cash_amount: parseFloat(formData.cash_amount) || 0,
        card_amount: parseFloat(formData.card_amount) || 0,
        transfer_amount: parseFloat(formData.transfer_amount) || 0,
        medical_amount: parseFloat(formData.medical_amount) || 0,
        aesthetic_amount: parseFloat(formData.aesthetic_amount) || 0,
        cosmetic_amount: parseFloat(formData.cosmetic_amount) || 0,
        product_sales_amount: parseFloat(formData.product_sales_amount) || 0,
        notes: formData.notes || null
      } as any, { onConflict: 'sale_date' })
    
    if (!error) {
      setShowForm(false)
      setFormData({
        sale_date: format(new Date(), 'yyyy-MM-dd'),
        gross_amount: '',
        cash_amount: '',
        card_amount: '',
        transfer_amount: '',
        medical_amount: '',
        aesthetic_amount: '',
        cosmetic_amount: '',
        product_sales_amount: '',
        notes: ''
      })
      loadSales()
    }
  }

  async function handleDelete(id: string) {
    if (!isSupabaseConfigured || !supabase) {
      alert('Modo demo: Supabase no está configurado')
      return
    }
    if (confirm('¿Eliminar esta venta?')) {
      await supabase.from('daily_sales').delete().eq('id', id)
      loadSales()
    }
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>Ventas Diarias</h1>
          <p>Registro de ingresos por día</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nueva Venta'}
        </button>
      </header>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="chart-title">Registrar Venta</h3>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.sale_date}
                  onChange={e => setFormData({...formData, sale_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Importe Bruto (IVA incl.) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.gross_amount}
                  onChange={e => setFormData({...formData, gross_amount: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notas</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Observaciones..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>

            <h4 className="mb-4 mt-4" style={{color: 'var(--color-text-secondary)'}}>Desglose por forma de pago</h4>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Efectivo</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.cash_amount}
                  onChange={e => setFormData({...formData, cash_amount: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tarjeta</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.card_amount}
                  onChange={e => setFormData({...formData, card_amount: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Transferencia</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.transfer_amount}
                  onChange={e => setFormData({...formData, transfer_amount: e.target.value})}
                />
              </div>
            </div>

            <h4 className="mb-4 mt-4" style={{color: 'var(--color-text-secondary)'}}>Desglose por tipo de servicio</h4>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Médico</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.medical_amount}
                  onChange={e => setFormData({...formData, medical_amount: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Estético</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.aesthetic_amount}
                  onChange={e => setFormData({...formData, aesthetic_amount: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cosmético/Productos</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.product_sales_amount}
                  onChange={e => setFormData({...formData, product_sales_amount: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-success">
              Guardar Venta
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="text-right">Bruto</th>
                <th className="text-right">Efectivo</th>
                <th className="text-right">Tarjeta</th>
                <th className="text-right">Transferencia</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center">Cargando...</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted">No hay ventas registradas</td></tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale.id}>
                    <td>{format(new Date(sale.sale_date), 'dd/MM/yyyy')}</td>
                    <td className="text-right">{formatCurrency(sale.gross_amount)}</td>
                    <td className="text-right">{formatCurrency(sale.cash_amount)}</td>
                    <td className="text-right">{formatCurrency(sale.card_amount)}</td>
                    <td className="text-right">{formatCurrency(sale.transfer_amount)}</td>
                    <td className="text-muted">{sale.notes || '-'}</td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{padding: '6px 12px', fontSize: '0.75rem'}}
                        onClick={() => handleDelete(sale.id)}
                      >
                        Eliminar
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
  )
}
