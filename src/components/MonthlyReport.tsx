import { useState } from 'react'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getMonthlySummary } from '@/lib/supabase'
import type { MonthlySummary } from '@/types/database'

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)

export default function MonthlyReport() {
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [report, setReport] = useState<MonthlySummary | null>(null)
  const [comparison, setComparison] = useState<MonthlySummary[]>([])

  async function generateReport() {
    setLoading(true)
    const [year, month] = selectedMonth.split('-').map(Number)
    
    try {
      // Resumen del mes seleccionado
      const data = await getMonthlySummary(year, month)
      setReport(data)
      
      // Comparativa últimos 6 meses
      const comparisonData: MonthlySummary[] = []
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(new Date(year, month - 1), i)
        const summary = await getMonthlySummary(d.getFullYear(), d.getMonth() + 1)
        if (summary) comparisonData.push(summary)
      }
      setComparison(comparisonData)
    } catch (error) {
      console.error('Error generating report:', error)
    }
    
    setLoading(false)
  }

  return (
    <div className="animate-fade-in">
      <header className="page-header">
        <h1>Informe Mensual</h1>
        <p>Análisis detallado de beneficios por período</p>
      </header>

      {/* Month Selector */}
      <div className="card mb-6">
        <div className="flex gap-4 items-center">
          <div className="form-group" style={{marginBottom: 0, flex: 1}}>
            <label className="form-label">Seleccionar Mes</label>
            <input
              type="month"
              className="form-input"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            />
          </div>
          <button 
            className="btn btn-primary" 
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? 'Generando...' : 'Generar Informe'}
          </button>
        </div>
      </div>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="kpi-grid">
            <div className={`kpi-card ${report.net_profit > 0 ? 'positive' : 'negative'}`}>
              <div className="kpi-label">Beneficio Neto</div>
              <div className={`kpi-value ${report.net_profit > 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(report.net_profit)}
              </div>
              <div className={`kpi-change ${report.profit_margin_pct > 0 ? 'positive' : 'negative'}`}>
                {report.profit_margin_pct.toFixed(1)}% margen sobre ingresos
              </div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-label">Ingresos Netos (sin IVA)</div>
              <div className="kpi-value">{formatCurrency(report.net_revenue_ex_vat)}</div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-label">Total Gastos</div>
              <div className="kpi-value text-danger">{formatCurrency(report.total_expenses)}</div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-label">Impuesto Sociedades</div>
              <div className="kpi-value text-danger">{formatCurrency(report.corporate_tax)}</div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid-2">
            <div className="card">
              <h3 className="chart-title">Desglose de Ingresos y Gastos</h3>
              <div className="table-container mt-4">
                <table>
                  <tbody>
                    <tr style={{background: 'var(--color-bg-tertiary)'}}>
                      <td><strong>Ingresos Brutos (con IVA)</strong></td>
                      <td className="text-right"><strong>{formatCurrency(report.gross_revenue)}</strong></td>
                    </tr>
                    <tr>
                      <td className="text-muted">- IVA Repercutido (21%)</td>
                      <td className="text-right text-muted">
                        {formatCurrency(report.gross_revenue - report.net_revenue_ex_vat)}
                      </td>
                    </tr>
                    <tr style={{borderTop: '2px solid var(--color-border)'}}>
                      <td><strong>Ingresos Netos</strong></td>
                      <td className="text-right"><strong>{formatCurrency(report.net_revenue_ex_vat)}</strong></td>
                    </tr>
                    <tr><td colSpan={2} style={{height: '16px'}}></td></tr>
                    <tr>
                      <td className="text-danger">- Costes de Productos</td>
                      <td className="text-right text-danger">{formatCurrency(report.product_costs)}</td>
                    </tr>
                    <tr>
                      <td className="text-danger">- Gastos Variables</td>
                      <td className="text-right text-danger">{formatCurrency(report.variable_expenses)}</td>
                    </tr>
                    <tr>
                      <td className="text-danger">- Gastos Fijos</td>
                      <td className="text-right text-danger">{formatCurrency(report.fixed_expenses)}</td>
                    </tr>
                    <tr>
                      <td className="text-danger">- Costes Laborales</td>
                      <td className="text-right text-danger">{formatCurrency(report.labor_costs)}</td>
                    </tr>
                    <tr style={{borderTop: '2px solid var(--color-border)'}}>
                      <td><strong>Beneficio Bruto</strong></td>
                      <td className={`text-right ${report.gross_profit > 0 ? 'text-success' : 'text-danger'}`}>
                        <strong>{formatCurrency(report.gross_profit)}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td className="text-danger">- Impuesto Sociedades (25%)</td>
                      <td className="text-right text-danger">{formatCurrency(report.corporate_tax)}</td>
                    </tr>
                    <tr style={{background: 'var(--color-bg-tertiary)', borderTop: '2px solid var(--color-primary)'}}>
                      <td><strong style={{fontSize: '1.1rem'}}>BENEFICIO NETO</strong></td>
                      <td className={`text-right ${report.net_profit > 0 ? 'text-success' : 'text-danger'}`}>
                        <strong style={{fontSize: '1.1rem'}}>{formatCurrency(report.net_profit)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expense Distribution */}
            <div className="card">
              <h3 className="chart-title">Distribución de Gastos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Productos', valor: report.product_costs },
                    { name: 'Variables', valor: report.variable_expenses },
                    { name: 'Fijos', valor: report.fixed_expenses },
                    { name: 'Laborales', valor: report.labor_costs },
                    { name: 'Impuestos', valor: report.corporate_tax },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#64748b" tickFormatter={(v) => `${v}€`} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" width={80} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a24', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value), 'Importe']}
                  />
                  <Bar dataKey="valor" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6-Month Comparison */}
          {comparison.length > 1 && (
            <div className="chart-container mt-6">
              <h3 className="chart-title">Evolución Últimos 6 Meses</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={comparison.map(c => ({
                  mes: format(new Date(c.year_month + '-01'), 'MMM yy', { locale: es }),
                  ingresos: c.net_revenue_ex_vat,
                  gastos: c.total_expenses,
                  beneficio: c.net_profit
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="mes" stroke="#64748b" />
                  <YAxis stroke="#64748b" tickFormatter={(v) => `${v}€`} />
                  <Tooltip 
                    contentStyle={{ background: '#1a1a24', border: '1px solid #333', borderRadius: '8px' }}
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="beneficio" name="Beneficio" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {!report && !loading && (
        <div className="card text-center p-6">
          <p className="text-muted">Selecciona un mes y pulsa "Generar Informe" para ver el análisis detallado</p>
        </div>
      )}
    </div>
  )
}
