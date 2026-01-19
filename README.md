# Calculadora Beneficios

Sistema de cálculo de márgenes de beneficio real para clínica estética (SL).

## 🚀 Características

- **Dashboard** con KPIs de beneficio neto, ingresos y gastos
- **Ventas Diarias** - Registro con desglose por forma de pago y tipo de servicio
- **Gastos Fijos** - Gestión de gastos recurrentes (mensual, trimestral, anual)
- **Costes de Productos** - Registro de compras para tratamientos
- **Informe Mensual** - Análisis detallado con comparativas
- **Configuración** - Ajustes de empresa, empleados e impuestos

## 📊 Cálculos Incluidos

| Concepto | Cálculo |
|----------|---------|
| **3 Empleados** | €1,200 neto → €1,550 bruto + 30% SS = €2,015/empleado |
| **Propietario** | €3,000 neto → €4,200 bruto + €400 autónomo = €4,600 |
| **Total Laboral** | €10,645/mes |
| **IVA** | 21% |
| **Impuesto Sociedades** | 25% del beneficio |

## 🛠️ Tecnologías

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Estilos**: CSS custom con diseño premium dark

## 📦 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Supabase
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 3. Ejecutar el SQL en Supabase
# Ir a SQL Editor en Supabase Dashboard
# Ejecutar database/006_unified_schema.sql

# 4. Iniciar desarrollo
npm run dev
```

## 🗄️ Configuración de Supabase

### Paso 1: Crear proyecto
1. Ve a [supabase.com/dashboard](https://supabase.com/dashboard)
2. Crear nuevo proyecto "CalculadoraBeneficios"
3. Copiar la URL y anon key a `.env`

### Paso 2: Ejecutar schema SQL
1. Ir a SQL Editor en el dashboard
2. Copiar contenido de `database/006_unified_schema.sql`
3. Ejecutar

### Paso 3: Verificar
1. Ir a Table Editor
2. Verificar que existen las tablas en schema `calculadora`

## 📁 Estructura del Proyecto

```
CALCULADORA BENEFICIOS/
├── database/
│   └── 006_unified_schema.sql # Schema completo y unificado
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # KPIs y gráficos
│   │   ├── DailySales.tsx     # Registro de ventas
│   │   ├── FixedExpenses.tsx  # Gastos fijos
│   │   ├── ProductCosts.tsx   # Costes de productos
│   │   ├── MonthlyReport.tsx  # Informe mensual
│   │   └── Configuration.tsx  # Configuración
│   ├── lib/
│   │   └── supabase.ts        # Cliente Supabase
│   ├── types/
│   │   └── database.ts        # Tipos TypeScript
│   ├── App.tsx                # Router y sidebar
│   ├── main.tsx               # Entry point
│   └── index.css              # Estilos globales
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── .env.example
```

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Solo usuarios autenticados pueden acceder a los datos
- Schema aislado (`calculadora`)

## 📝 Licencia

Uso privado - Clínica Estética SL
