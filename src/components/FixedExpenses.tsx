import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { FixedExpense, ExpenseCategory } from '@/types/database'

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function FixedExpenses() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    category_id: '',
    description: '',
    amount: '',
    frequency: 'monthly',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!supabase) return
    setLoading(true)
    
    const [expensesRes, categoriesRes] = await Promise.all([
      supabase.from('fixed_expenses').select('*').eq('is_active', true).order('created_at', { ascending: false }),
      supabase.from('expense_categories').select('*').eq('is_fixed', true)
    ])
    
    if (expensesRes.data) setExpenses(expensesRes.data)
    if (categoriesRes.data) setCategories(categoriesRes.data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    
    const { error } = await supabase.from('fixed_expenses').insert({
      category_id: formData.category_id || null,
      description: formData.description,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency as 'monthly' | 'quarterly' | 'annual',
      notes: formData.notes || null
    } as any)
    
    if (!error) {
      setShowForm(false)
      setFormData({ category_id: '', description: '', amount: '', frequency: 'monthly', notes: '' })
      loadData()
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return
    if (confirm('¿Eliminar este gasto fijo?')) {
      // @ts-ignore
      await supabase.from('fixed_expenses').update({ is_active: false } as any).eq('id', id)
      loadData()
    }
  }

  // Calcular total mensual
  const totalMonthly = expenses.reduce((sum, exp) => {
    switch (exp.frequency) {
      case 'monthly': return sum + exp.amount
      case 'quarterly': return sum + exp.amount / 3
      case 'annual': return sum + exp.amount / 12
      default: return sum
    }
  }, 0)

  const getCategoryName = (id: string | null) => {
    if (!id) return '-'
    return categories.find(c => c.id === id)?.name || '-'
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header flex justify-between items-center">
        <div>
          <h1>Gastos Fijos</h1>
          <p>Gastos recurrentes mensuales, trimestrales y anuales</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Nuevo Gasto Fijo'}
        </button>
      </header>

      {/* Summary Card */}
      <div className="kpi-grid" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
        <div className="kpi-card">
          <div className="kpi-label">Total Mensual (Mensualizado)</div>
          <div className="kpi-value text-danger">{formatCurrency(totalMonthly)}</div>
          <div className="text-muted">{expenses.length} gastos activos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Anual Estimado</div>
          <div className="kpi-value text-danger">{formatCurrency(totalMonthly * 12)}</div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h3 className="chart-title">Nuevo Gasto Fijo</h3>
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-input"
                  value={formData.category_id}
                  onChange={e => setFormData({...formData, category_id: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Alquiler local"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Importe *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Frecuencia</label>
                <select
                  className="form-input"
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                >
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="annual">Anual</option>
                </select>
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
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Frecuencia</th>
                <th className="text-right">Importe</th>
                <th className="text-right">Mensualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center">Cargando...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted">No hay gastos fijos</td></tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id}>
                    <td>{getCategoryName(exp.category_id)}</td>
                    <td>{exp.description}</td>
                    <td>
                      {{monthly: 'Mensual', quarterly: 'Trimestral', annual: 'Anual'}[exp.frequency]}
                    </td>
                    <td className="text-right">{formatCurrency(exp.amount)}</td>
                    <td className="text-right text-danger">
                      {formatCurrency(
                        exp.frequency === 'monthly' ? exp.amount :
                        exp.frequency === 'quarterly' ? exp.amount / 3 :
                        exp.amount / 12
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        style={{padding: '6px 12px', fontSize: '0.75rem'}}
                        onClick={() => handleDelete(exp.id)}
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
