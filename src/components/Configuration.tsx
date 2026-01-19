import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { CompanyConfig, TaxRate } from '@/types/database'
import TreatmentCatalogManager from './TreatmentCatalogManager'

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function Configuration() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<CompanyConfig | null>(null)
  const [taxes, setTaxes] = useState<TaxRate[]>([])

  useEffect(() => {
    loadConfig()
  }, [])

  async function loadConfig() {
    setLoading(true)
    
    const [configRes, taxesRes] = await Promise.all([
      supabase.from('company_config').select('*').limit(1).single(),
      supabase.from('tax_rates').select('*').eq('is_active', true)
    ])
    
    if (configRes.data) setConfig(configRes.data)
    if (taxesRes.data) setTaxes(taxesRes.data)
    setLoading(false)
  }

  async function saveConfig() {
    if (!config) return
    setSaving(true)
    
    await supabase.from('company_config').update({
      company_name: config.company_name,
      cif: config.cif,
      num_employees: config.num_employees,
      employee_net_salary: config.employee_net_salary,
      employee_gross_salary: config.employee_gross_salary,
      owner_net_salary: config.owner_net_salary,
      owner_gross_salary: config.owner_gross_salary,
      owner_ss_autonomo: config.owner_ss_autonomo,
      vat_rate: config.vat_rate,
      updated_at: new Date().toISOString()
    }).eq('id', config.id)
    
    setSaving(false)
    alert('Configuración guardada')
  }

  async function updateTaxRate(id: string, rate: number) {
    await supabase.from('tax_rates').update({ rate_percentage: rate }).eq('id', id)
    loadConfig()
  }

  if (loading) {
    return <div className="text-center p-6 text-muted">Cargando configuración...</div>
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Configuración</h1>
        <p>Ajustes de la empresa, empleados e impuestos</p>
      </header>

      <div className="grid-2">
        {/* Company Config */}
        <div className="card">
          <h3 className="chart-title">Datos de la Empresa</h3>
          
          {config && (
            <div className="mt-4">
              <div className="form-group">
                <label className="form-label">Nombre de la Empresa</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.company_name}
                  onChange={e => setConfig({...config, company_name: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">CIF</label>
                <input
                  type="text"
                  className="form-input"
                  value={config.cif || ''}
                  onChange={e => setConfig({...config, cif: e.target.value})}
                  placeholder="B12345678"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">IVA General (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={config.vat_rate}
                  onChange={e => setConfig({...config, vat_rate: parseFloat(e.target.value)})}
                />
              </div>
            </div>
          )}
        </div>

        {/* Employee Config */}
        <div className="card">
          <h3 className="chart-title">Configuración de Empleados</h3>
          
          {config && (
            <div className="mt-4">
              <div className="form-group">
                <label className="form-label">Número de Empleados</label>
                <input
                  type="number"
                  className="form-input"
                  value={config.num_employees}
                  onChange={e => setConfig({...config, num_employees: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Salario Neto Empleado</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={config.employee_net_salary}
                    onChange={e => setConfig({...config, employee_net_salary: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Salario Bruto Empleado</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={config.employee_gross_salary}
                    onChange={e => setConfig({...config, employee_gross_salary: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="p-4 mt-2" style={{background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)'}}>
                <p className="text-muted">
                  Coste mensual por empleado: <strong>{formatCurrency((config.employee_gross_salary || 0) * 1.3)}</strong>
                </p>
                <p className="text-muted">
                  Total empleados/mes: <strong className="text-danger">{formatCurrency((config.employee_gross_salary || 0) * 1.3 * (config.num_employees || 0))}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Owner Config */}
        <div className="card">
          <h3 className="chart-title">Salario del Propietario</h3>
          
          {config && (
            <div className="mt-4">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Salario Neto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={config.owner_net_salary}
                    onChange={e => setConfig({...config, owner_net_salary: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Salario Bruto</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={config.owner_gross_salary}
                    onChange={e => setConfig({...config, owner_gross_salary: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Cuota Autónomo</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={config.owner_ss_autonomo}
                  onChange={e => setConfig({...config, owner_ss_autonomo: parseFloat(e.target.value)})}
                />
              </div>
              
              <div className="p-4" style={{background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)'}}>
                <p className="text-muted">
                  Total coste propietario/mes: <strong className="text-danger">
                    {formatCurrency((config.owner_gross_salary || 0) + (config.owner_ss_autonomo || 0))}
                  </strong>
                </p>
              </div>
            </div>
          )}
        </div>


        {/* Tax Rates */}
        <div className="card">
          <h3 className="chart-title">Tasas de Impuestos</h3>
          
          <div className="mt-4">
            {taxes.map(tax => (
              <div key={tax.id} className="flex justify-between items-center p-4 mb-2" 
                   style={{background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)'}}>
                <div>
                  <p>{tax.description || tax.tax_type}</p>
                  <p className="text-muted text-sm">{tax.tax_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    style={{width: '100px'}}
                    value={tax.rate_percentage}
                    onChange={e => updateTaxRate(tax.id, parseFloat(e.target.value))}
                  />
                  <span>%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Treatment Catalog Manager (Full Width) */}
      <div className="mt-8">
        <TreatmentCatalogManager />
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button 
          className="btn btn-success" 
          onClick={saveConfig}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  )
}
