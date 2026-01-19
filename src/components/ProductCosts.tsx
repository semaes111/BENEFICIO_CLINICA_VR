import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { ProductCost } from '@/types/database'

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function ProductCosts() {
  const [costs, setCosts] = useState<ProductCost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    cost_date: format(new Date(), 'yyyy-MM-dd'),
    product_name: '',
    supplier: '',
    quantity: '1',
    unit_cost: '',
    notes: ''
  })

  useEffect(() => {
    loadCosts()
  }, [])

  async function loadCosts() {
    setLoading(true)
    const { data } = await supabase
      .from('product_costs')
      .select('*')
      .order('cost_date', { ascending: false })
      .limit(100)
    
    if (data) setCosts(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { error } = await supabase.from('product_costs').insert({
      cost_date: formData.cost_date,
      product_name: formData.product_name,
      supplier: formData.supplier || null,
      quantity: parseFloat(formData.quantity) || 1,
      unit_cost: parseFloat(formData.unit_cost),
      notes: formData.notes || null
    })
    
    if (!error) {
      setShowForm(false)
      setFormData({
        cost_date: format(new Date(), 'yyyy-MM-dd'),
        product_name: '',
        supplier: '',
        quantity: '1',
        unit_cost: '',
        notes: ''
      })
      loadCosts()
    }
  }

  async function handleDelete(id: string) {
    if (confirm('¿Eliminar este coste?')) {
      await supabase.from('product_costs').delete().eq('id', id)
      loadCosts()
    }
  }

  // Totales del mes actual
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()
  const monthlyTotal = costs
    .filter(c => {
      const d = new Date(c.cost_date)
      return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, c) => sum + c.total_cost, 0)

  return (
    <div className="animate-fade-in">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>Costes de Productos</h1>
          <p>Registro de compras de productos para tratamientos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Coste'}
        </button>
      </header>

      {/* Summary */}
      <div className="kpi-grid" style={{gridTemplateColumns: '1fr'}}>
        <div className="kpi-card">
          <div className="kpi-label">Costes Este Mes</div>
          <div className="kpi-value text-danger">{formatCurrency(monthlyTotal)}</div>
          <div className="text-muted">{format(new Date(), 'MMMM yyyy')}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="chart-title">Registrar Coste de Producto</h3>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.cost_date}
                  onChange={e => setFormData({...formData, cost_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Producto *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre del producto"
                  value={formData.product_name}
                  onChange={e => setFormData({...formData, product_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Proveedor</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nombre del proveedor"
                  value={formData.supplier}
                  onChange={e => setFormData({...formData, supplier: e.target.value})}
                />
              </div>
            </div>
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Coste Unitario *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.unit_cost}
                  onChange={e => setFormData({...formData, unit_cost: e.target.value})}
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
            <button type="submit" className="btn btn-success">Guardar</button>
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
                <th>Producto</th>
                <th>Proveedor</th>
                <th className="text-right">Cantidad</th>
                <th className="text-right">Coste Unit.</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center">Cargando...</td></tr>
              ) : costs.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted">No hay costes registrados</td></tr>
              ) : (
                costs.map(cost => (
                  <tr key={cost.id}>
                    <td>{format(new Date(cost.cost_date), 'dd/MM/yyyy')}</td>
                    <td>{cost.product_name}</td>
                    <td className="text-muted">{cost.supplier || '-'}</td>
                    <td className="text-right">{cost.quantity}</td>
                    <td className="text-right">{formatCurrency(cost.unit_cost)}</td>
                    <td className="text-right text-danger">{formatCurrency(cost.total_cost)}</td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{padding: '6px 12px', fontSize: '0.75rem'}}
                        onClick={() => handleDelete(cost.id)}
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
