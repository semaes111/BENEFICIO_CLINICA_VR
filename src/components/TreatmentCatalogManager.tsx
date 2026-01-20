import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { TreatmentCatalog } from '@/types/database'

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function TreatmentCatalogManager() {
  const [treatments, setTreatments] = useState<TreatmentCatalog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'aesthetic' as 'medical' | 'aesthetic' | 'cosmetic',
    sale_price: '',
    cost_price: '',
    duration_mins: '30',
    description: ''
  })

  useEffect(() => {
    loadTreatments()
  }, [])

  async function loadTreatments() {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await (supabase.from('treatments_catalog') as any)
      .select('*')
      .order('name')
    
    if (data) setTreatments(data)
    setLoading(false)
  }

  function handleEdit(treatment: TreatmentCatalog) {
    setFormData({
      name: treatment.name,
      category: treatment.category,
      sale_price: treatment.sale_price.toString(),
      cost_price: treatment.cost_price.toString(),
      duration_mins: treatment.duration_mins.toString(),
      description: treatment.description || ''
    })
    setEditingId(treatment.id)
    setShowForm(true)
  }

  function handleNew() {
    setFormData({
      name: '',
      category: 'aesthetic',
      sale_price: '',
      cost_price: '',
      duration_mins: '30',
      description: ''
    })
    setEditingId(null)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    
    const dataToSave = {
      name: formData.name,
      category: formData.category,
      sale_price: parseFloat(formData.sale_price),
      cost_price: parseFloat(formData.cost_price),
      duration_mins: parseInt(formData.duration_mins),
      description: formData.description || null
    }

    let error
    if (editingId) {
      const res = await (supabase.from('treatments_catalog') as any)
        .update(dataToSave)
        .eq('id', editingId)
      error = res.error
    } else {
      const res = await (supabase.from('treatments_catalog') as any)
        .insert(dataToSave)
      error = res.error
    }

    if (!error) {
      setShowForm(false)
      setEditingId(null)
      loadTreatments()
    } else {
      alert('Error al guardar: ' + error.message)
    }
  }

  async function handleDelete(id: string) {
    if (!supabase) return
    if (confirm('¿Estás seguro de desactivar este tratamiento? (No se borrará el historial)')) {
        const { error } = await (supabase.from('treatments_catalog') as any)
            .update({ is_active: false })
            .eq('id', id)
            
        if (error) {
            alert('Error: ' + error.message)
        } else {
            loadTreatments()
        }
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h3 className="chart-title">Catálogo de Tratamientos</h3>
        <button className="btn btn-primary" onClick={handleNew}>
          {showForm ? 'Cancelar' : '+ Nuevo Tratamiento'}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10 animate-fade-in">
          <h4 className="text-lg font-bold mb-4 text-primary">
            {editingId ? 'Editar Tratamiento' : 'Nuevo Tratamiento'}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Nombre del Tratamiento *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                >
                  <option value="aesthetic">Estética</option>
                  <option value="medical">Médica</option>
                  <option value="cosmetic">Cosmética</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label text-emerald-400">Precio Venta (PVP) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input border-emerald-500/30 focus:border-emerald-500"
                  value={formData.sale_price}
                  onChange={e => setFormData({...formData, sale_price: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label text-red-400">Coste de Materiales *</label>
                <div className="relative">
                    <input
                    type="number"
                    step="0.01"
                    className="form-input border-red-500/30 focus:border-red-500"
                    value={formData.cost_price}
                    onChange={e => setFormData({...formData, cost_price: e.target.value})}
                    required
                    />
                    <div className="text-xs text-muted mt-1 absolute right-0">Coste medio de insumos</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Duración (min)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.duration_mins}
                  onChange={e => setFormData({...formData, duration_mins: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
                <label className="form-label">Descripción / Notas</label>
                <textarea
                  className="form-input min-h-[80px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-success">
                {editingId ? 'Guardar Cambios' : 'Crear Tratamiento'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container max-h-[500px] overflow-y-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-white/10">
              <th className="p-4 font-bold text-gray-400">Nombre</th>
              <th className="p-4 font-bold text-gray-400">Categoría</th>
              <th className="p-4 font-bold text-gray-400 text-right">PVP</th>
              <th className="p-4 font-bold text-gray-400 text-right">Coste Est.</th>
              <th className="p-4 font-bold text-gray-400 text-right">Margen</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted">Cargando catálogo...</td></tr>
            ) : treatments.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted">No hay tratamientos activos. Añade el primero.</td></tr>
            ) : (
                treatments.filter(t => t.is_active).map(t => {
                    const margin = t.sale_price - t.cost_price;
                    const marginPct = t.sale_price > 0 ? Math.round((margin / t.sale_price) * 100) : 0;
                    
                    return (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4">
                                <div className="font-semibold text-white">{t.name}</div>
                                {t.description && <div className="text-xs text-muted truncate max-w-[200px]">{t.description}</div>}
                            </td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium border
                                    ${t.category === 'medical' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
                                      t.category === 'aesthetic' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                                      'bg-pink-500/10 border-pink-500/20 text-pink-400'}`}>
                                    {t.category === 'medical' ? 'Médica' : t.category === 'aesthetic' ? 'Estética' : 'Cosmética'}
                                </span>
                            </td>
                            <td className="p-4 text-right font-medium text-white">{formatCurrency(t.sale_price)}</td>
                            <td className="p-4 text-right font-medium text-red-300">-{formatCurrency(t.cost_price)}</td>
                            <td className="p-4 text-right">
                                <div className={`font-bold ${marginPct > 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                    {marginPct}%
                                </div>
                                <div className="text-xs text-muted">{formatCurrency(margin)}</div>
                            </td>
                            <td className="p-4 text-right space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleEdit(t)}
                                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    ✏️
                                </button>
                                <button 
                                    onClick={() => handleDelete(t.id)}
                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                                    title="Desactivar"
                                >
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    )
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
