import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { FixedExpense } from '@/types/database'

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function FixedExpenses() {
  const [expenses, setExpenses] = useState<FixedExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    frequency: 'monthly',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    
    const { data } = await (supabase.from('fixed_expenses') as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (data) setExpenses(data)
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    
    const { error } = await (supabase.from('fixed_expenses') as any).insert({
      description: formData.description,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency
    })
    
    if (!error) {
      setShowForm(false)
      setFormData({ description: '', amount: '', frequency: 'monthly' })
      loadData()
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return
    if (confirm('¿Eliminar este gasto fijo?')) {
      await (supabase.from('fixed_expenses') as any).update({ is_active: false }).eq('id', id)
      loadData()
    }
  }

  const totalMonthly = expenses.reduce((sum, exp) => {
    switch (exp.frequency) {
      case 'monthly': return sum + exp.amount
      case 'quarterly': return sum + exp.amount / 3
      case 'annual': return sum + exp.amount / 12
      default: return sum
    }
  }, 0)

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

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card p-6">
          <div className="text-sm text-gray-400">Total Mensual</div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(totalMonthly)}</div>
          <div className="text-xs text-muted">{expenses.length} gastos activos</div>
        </div>
        <div className="card p-6">
          <div className="text-sm text-gray-400">Total Anual</div>
          <div className="text-2xl font-bold text-red-400">{formatCurrency(totalMonthly * 12)}</div>
        </div>
      </div>

      {showForm && (
        <div className="card mb-6 p-6">
          <h3 className="font-bold mb-4">Nuevo Gasto Fijo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Descripción *</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  placeholder="Ej: Alquiler local"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Importe *</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Frecuencia</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                  value={formData.frequency}
                  onChange={e => setFormData({...formData, frequency: e.target.value})}
                >
                  <option value="monthly">Mensual</option>
                  <option value="quarterly">Trimestral</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-success">Guardar</button>
          </form>
        </div>
      )}

      <div className="card">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="p-4 text-left">Descripción</th>
              <th className="p-4 text-left">Frecuencia</th>
              <th className="p-4 text-right">Importe</th>
              <th className="p-4 text-right">Mensualizado</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted">Cargando...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted">No hay gastos fijos</td></tr>
            ) : (
              expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-800/30">
                  <td className="p-4">{exp.description}</td>
                  <td className="p-4">
                    {{monthly: 'Mensual', quarterly: 'Trimestral', annual: 'Anual'}[exp.frequency]}
                  </td>
                  <td className="p-4 text-right">{formatCurrency(exp.amount)}</td>
                  <td className="p-4 text-right text-red-400">
                    {formatCurrency(
                      exp.frequency === 'monthly' ? exp.amount :
                      exp.frequency === 'quarterly' ? exp.amount / 3 :
                      exp.amount / 12
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      className="text-red-400 hover:text-red-300 text-sm"
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
  )
}
