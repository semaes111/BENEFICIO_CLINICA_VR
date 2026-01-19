-- ============================================
-- CALCULADORA BENEFICIOS - SUPABASE SCHEMA
-- Sistema de cálculo de márgenes de beneficio
-- para clínica estética (SL)
-- ============================================
-- Crear schema dedicado
CREATE SCHEMA IF NOT EXISTS calculadora;
-- ============================================
-- TABLA: company_config
-- Configuración general de la empresa
-- ============================================
CREATE TABLE calculadora.company_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'Mi Clínica Estética SL',
    cif TEXT,
    -- Configuración de empleados
    num_employees INTEGER NOT NULL DEFAULT 3,
    employee_net_salary DECIMAL(10, 2) NOT NULL DEFAULT 1200.00,
    employee_gross_salary DECIMAL(10, 2) NOT NULL DEFAULT 1550.00,
    -- Salario propietario
    owner_net_salary DECIMAL(10, 2) NOT NULL DEFAULT 3000.00,
    owner_gross_salary DECIMAL(10, 2) NOT NULL DEFAULT 4200.00,
    owner_ss_autonomo DECIMAL(10, 2) NOT NULL DEFAULT 400.00,
    -- IVA general
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- TABLA: tax_rates
-- Configuración de tasas de impuestos
-- ============================================
CREATE TABLE calculadora.tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type TEXT NOT NULL,
    description TEXT,
    rate_percentage DECIMAL(5, 2) NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Insertar tasas estándar españolas
INSERT INTO calculadora.tax_rates (tax_type, description, rate_percentage)
VALUES (
        'ss_empresa',
        'Seguridad Social - Cuota Empresarial',
        30.00
    ),
    (
        'ss_trabajador',
        'Seguridad Social - Cuota Trabajador',
        6.35
    ),
    ('irpf_medio', 'IRPF - Retención Media', 15.00),
    (
        'impuesto_sociedades',
        'Impuesto de Sociedades',
        25.00
    ),
    ('iva_general', 'IVA General', 21.00),
    ('iva_reducido', 'IVA Reducido', 10.00);
-- ============================================
-- TABLA: expense_categories
-- Categorías de gastos
-- ============================================
CREATE TABLE calculadora.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_fixed BOOLEAN DEFAULT false,
    icon TEXT DEFAULT 'receipt',
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Insertar categorías por defecto
INSERT INTO calculadora.expense_categories (name, description, is_fixed)
VALUES ('Alquiler', 'Alquiler del local', true),
    ('Suministros', 'Luz, agua, gas, internet', true),
    ('Seguros', 'Seguros del negocio', true),
    (
        'Gestoría',
        'Servicios de asesoría y gestoría',
        true
    ),
    ('Marketing', 'Publicidad y marketing', false),
    ('Material Oficina', 'Material de oficina', false),
    (
        'Mantenimiento',
        'Reparaciones y mantenimiento',
        false
    ),
    ('Formación', 'Cursos y formación', false),
    (
        'Productos',
        'Compra de productos para tratamientos',
        false
    ),
    ('Otros', 'Otros gastos', false);
-- ============================================
-- TABLA: fixed_expenses
-- Gastos fijos mensuales/anuales
-- ============================================
CREATE TABLE calculadora.fixed_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES calculadora.expense_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- TABLA: daily_sales
-- Registro de ventas diarias
-- ============================================
CREATE TABLE calculadora.daily_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_date DATE NOT NULL,
    -- Importes (IVA incluido)
    gross_amount DECIMAL(10, 2) NOT NULL,
    cash_amount DECIMAL(10, 2) DEFAULT 0,
    card_amount DECIMAL(10, 2) DEFAULT 0,
    transfer_amount DECIMAL(10, 2) DEFAULT 0,
    -- Desglose por tipo
    medical_amount DECIMAL(10, 2) DEFAULT 0,
    aesthetic_amount DECIMAL(10, 2) DEFAULT 0,
    cosmetic_amount DECIMAL(10, 2) DEFAULT 0,
    product_sales_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_sale_date UNIQUE (sale_date)
);
-- ============================================
-- TABLA: product_costs
-- Costes de productos vendidos
-- ============================================
CREATE TABLE calculadora.product_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_date DATE NOT NULL,
    product_name TEXT NOT NULL,
    supplier TEXT,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_cost DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- TABLA: variable_expenses
-- Gastos variables (no fijos)
-- ============================================
CREATE TABLE calculadora.variable_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_date DATE NOT NULL,
    category_id UUID REFERENCES calculadora.expense_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    has_vat BOOLEAN DEFAULT true,
    vat_amount DECIMAL(10, 2),
    invoice_number TEXT,
    supplier TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- VIEW: monthly_labor_costs
-- Costes laborales mensuales calculados
-- ============================================
CREATE OR REPLACE VIEW calculadora.monthly_labor_costs AS
SELECT c.id as config_id,
    c.num_employees,
    c.employee_gross_salary,
    c.employee_net_salary,
    -- Coste por empleado
    c.employee_gross_salary as salary_per_employee,
    ROUND(
        c.employee_gross_salary * (
            SELECT rate_percentage / 100
            FROM calculadora.tax_rates
            WHERE tax_type = 'ss_empresa'
                AND is_active
            LIMIT 1
        ), 2
    ) as ss_empresa_per_employee,
    ROUND(
        c.employee_gross_salary + (
            c.employee_gross_salary * (
                SELECT rate_percentage / 100
                FROM calculadora.tax_rates
                WHERE tax_type = 'ss_empresa'
                    AND is_active
                LIMIT 1
            )
        ), 2
    ) as total_cost_per_employee,
    -- Coste total empleados
    ROUND(
        (
            c.employee_gross_salary + (
                c.employee_gross_salary * (
                    SELECT rate_percentage / 100
                    FROM calculadora.tax_rates
                    WHERE tax_type = 'ss_empresa'
                        AND is_active
                    LIMIT 1
                )
            )
        ) * c.num_employees, 2
    ) as total_employees_cost,
    -- Coste propietario
    c.owner_gross_salary,
    c.owner_ss_autonomo,
    ROUND(c.owner_gross_salary + c.owner_ss_autonomo, 2) as total_owner_cost,
    -- TOTAL COSTES LABORALES
    ROUND(
        (
            (
                c.employee_gross_salary + (
                    c.employee_gross_salary * (
                        SELECT rate_percentage / 100
                        FROM calculadora.tax_rates
                        WHERE tax_type = 'ss_empresa'
                            AND is_active
                        LIMIT 1
                    )
                )
            ) * c.num_employees
        ) + c.owner_gross_salary + c.owner_ss_autonomo, 2
    ) as total_labor_cost
FROM calculadora.company_config c;
-- ============================================
-- VIEW: monthly_fixed_expenses
-- Gastos fijos mensualizados
-- ============================================
CREATE OR REPLACE VIEW calculadora.monthly_fixed_expenses AS
SELECT COALESCE(
        SUM(
            CASE
                frequency
                WHEN 'monthly' THEN amount
                WHEN 'quarterly' THEN amount / 3
                WHEN 'annual' THEN amount / 12
            END
        ),
        0
    ) as total_monthly_fixed
FROM calculadora.fixed_expenses
WHERE is_active = true
    AND (
        end_date IS NULL
        OR end_date >= CURRENT_DATE
    );
-- ============================================
-- FUNCTION: calculate_monthly_summary
-- Calcula el resumen mensual de beneficios
-- ============================================
CREATE OR REPLACE FUNCTION calculadora.calculate_monthly_summary(p_year INTEGER, p_month INTEGER) RETURNS TABLE (
        year_month TEXT,
        gross_revenue DECIMAL,
        net_revenue_ex_vat DECIMAL,
        product_costs DECIMAL,
        variable_expenses DECIMAL,
        fixed_expenses DECIMAL,
        labor_costs DECIMAL,
        total_expenses DECIMAL,
        gross_profit DECIMAL,
        corporate_tax DECIMAL,
        net_profit DECIMAL,
        profit_margin_pct DECIMAL
    ) AS $$
DECLARE v_vat_rate DECIMAL;
v_corporate_tax_rate DECIMAL;
v_labor_costs DECIMAL;
v_fixed_expenses DECIMAL;
BEGIN -- Obtener tasas
SELECT rate_percentage INTO v_vat_rate
FROM calculadora.tax_rates
WHERE tax_type = 'iva_general'
    AND is_active
LIMIT 1;
SELECT rate_percentage INTO v_corporate_tax_rate
FROM calculadora.tax_rates
WHERE tax_type = 'impuesto_sociedades'
    AND is_active
LIMIT 1;
-- Obtener costes laborales
SELECT total_labor_cost INTO v_labor_costs
FROM calculadora.monthly_labor_costs
LIMIT 1;
-- Obtener gastos fijos mensualizados
SELECT total_monthly_fixed INTO v_fixed_expenses
FROM calculadora.monthly_fixed_expenses;
RETURN QUERY WITH sales AS (
    SELECT COALESCE(SUM(gross_amount), 0) as total_gross
    FROM calculadora.daily_sales
    WHERE EXTRACT(
            YEAR
            FROM sale_date
        ) = p_year
        AND EXTRACT(
            MONTH
            FROM sale_date
        ) = p_month
),
products AS (
    SELECT COALESCE(SUM(total_cost), 0) as total_products
    FROM calculadora.product_costs
    WHERE EXTRACT(
            YEAR
            FROM cost_date
        ) = p_year
        AND EXTRACT(
            MONTH
            FROM cost_date
        ) = p_month
),
variable AS (
    SELECT COALESCE(SUM(amount), 0) as total_variable
    FROM calculadora.variable_expenses
    WHERE EXTRACT(
            YEAR
            FROM expense_date
        ) = p_year
        AND EXTRACT(
            MONTH
            FROM expense_date
        ) = p_month
)
SELECT TO_CHAR(MAKE_DATE(p_year, p_month, 1), 'YYYY-MM') as year_month,
    s.total_gross as gross_revenue,
    ROUND(s.total_gross / (1 + v_vat_rate / 100), 2) as net_revenue_ex_vat,
    p.total_products as product_costs,
    v.total_variable as variable_expenses,
    COALESCE(v_fixed_expenses, 0) as fixed_expenses,
    COALESCE(v_labor_costs, 0) as labor_costs,
    ROUND(
        p.total_products + v.total_variable + COALESCE(v_fixed_expenses, 0) + COALESCE(v_labor_costs, 0),
        2
    ) as total_expenses,
    ROUND(
        (s.total_gross / (1 + v_vat_rate / 100)) - p.total_products - v.total_variable - COALESCE(v_fixed_expenses, 0) - COALESCE(v_labor_costs, 0),
        2
    ) as gross_profit,
    ROUND(
        GREATEST(
            0,
            (
                (s.total_gross / (1 + v_vat_rate / 100)) - p.total_products - v.total_variable - COALESCE(v_fixed_expenses, 0) - COALESCE(v_labor_costs, 0)
            )
        ) * (v_corporate_tax_rate / 100),
        2
    ) as corporate_tax,
    ROUND(
        (
            (s.total_gross / (1 + v_vat_rate / 100)) - p.total_products - v.total_variable - COALESCE(v_fixed_expenses, 0) - COALESCE(v_labor_costs, 0)
        ) - GREATEST(
            0,
            (
                (s.total_gross / (1 + v_vat_rate / 100)) - p.total_products - v.total_variable - COALESCE(v_fixed_expenses, 0) - COALESCE(v_labor_costs, 0)
            )
        ) * (v_corporate_tax_rate / 100),
        2
    ) as net_profit,
    CASE
        WHEN s.total_gross > 0 THEN ROUND(
            (
                (
                    (s.total_gross / (1 + v_vat_rate / 100)) - p.total_products - v.total_variable - COALESCE(v_fixed_expenses, 0) - COALESCE(v_labor_costs, 0)
                ) - GREATEST(
                    0,
                    (
                        (s.total_gross / (1 + v_vat_rate / 100)) - p.total_products - v.total_variable - COALESCE(v_fixed_expenses, 0) - COALESCE(v_labor_costs, 0)
                    )
                ) * (v_corporate_tax_rate / 100)
            ) / s.total_gross * 100,
            2
        )
        ELSE 0
    END as profit_margin_pct
FROM sales s,
    products p,
    variable v;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE calculadora.company_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.variable_expenses ENABLE ROW LEVEL SECURITY;
-- Políticas para usuarios autenticados
CREATE POLICY "Allow authenticated users full access" ON calculadora.company_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access" ON calculadora.tax_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access" ON calculadora.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access" ON calculadora.fixed_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access" ON calculadora.daily_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access" ON calculadora.product_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access" ON calculadora.variable_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- ============================================
-- INSERTAR CONFIGURACIÓN INICIAL
-- ============================================
INSERT INTO calculadora.company_config (company_name)
VALUES ('Mi Clínica Estética SL');
-- ============================================
-- GRANTS para el schema
-- ============================================
GRANT USAGE ON SCHEMA calculadora TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA calculadora TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA calculadora TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA calculadora TO authenticated;