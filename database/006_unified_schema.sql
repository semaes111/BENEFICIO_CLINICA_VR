-- ============================================
-- SCRIPT UNIFICADO Y COMPLETO (V4 Final)
-- Ejecutar en Supabase SQL Editor
-- Este script configura TODA la base de datos necesaria para la aplicación.
-- ============================================

-- 1. SETUP DE ESQUEMA PRINCIPAL
CREATE SCHEMA IF NOT EXISTS calculadora;

-- LIMPIEZA DE VISTAS Y FUNCIONES (Para evitar conflictos)
DROP VIEW IF EXISTS calculadora.daily_summary CASCADE;
DROP VIEW IF EXISTS calculadora.monthly_labor_costs CASCADE;
DROP VIEW IF EXISTS calculadora.monthly_fixed_expenses CASCADE;
DROP FUNCTION IF EXISTS calculadora.calculate_monthly_summary;

-- 2. TABLAS DE CONFIGURACIÓN
CREATE TABLE IF NOT EXISTS calculadora.company_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL DEFAULT 'Mi Clínica Estética SL',
    cif TEXT,
    num_employees INTEGER NOT NULL DEFAULT 3,
    employee_net_salary DECIMAL(10, 2) NOT NULL DEFAULT 1200.00,
    employee_gross_salary DECIMAL(10, 2) NOT NULL DEFAULT 1550.00,
    owner_net_salary DECIMAL(10, 2) NOT NULL DEFAULT 3000.00,
    owner_gross_salary DECIMAL(10, 2) NOT NULL DEFAULT 4200.00,
    owner_ss_autonomo DECIMAL(10, 2) NOT NULL DEFAULT 400.00,
    vat_rate DECIMAL(5, 2) NOT NULL DEFAULT 21.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculadora.tax_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_type TEXT NOT NULL,
    description TEXT,
    rate_percentage DECIMAL(5, 2) NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculadora.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    is_fixed BOOLEAN DEFAULT false,
    icon TEXT DEFAULT 'receipt',
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GASTOS Y COSTES
CREATE TABLE IF NOT EXISTS calculadora.fixed_expenses (
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

CREATE TABLE IF NOT EXISTS calculadora.variable_expenses (
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

CREATE TABLE IF NOT EXISTS calculadora.product_costs (
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

-- 4. VENTAS (LEGACY / SIMPLE)
CREATE TABLE IF NOT EXISTS calculadora.daily_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_date DATE NOT NULL,
    gross_amount DECIMAL(10, 2) NOT NULL,
    cash_amount DECIMAL(10, 2) DEFAULT 0,
    card_amount DECIMAL(10, 2) DEFAULT 0,
    transfer_amount DECIMAL(10, 2) DEFAULT 0,
    medical_amount DECIMAL(10, 2) DEFAULT 0,
    aesthetic_amount DECIMAL(10, 2) DEFAULT 0,
    cosmetic_amount DECIMAL(10, 2) DEFAULT 0,
    product_sales_amount DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_sale_date UNIQUE (sale_date)
);

-- 5. SISTEMA DE TRATAMIENTOS (DASHBOARD)
CREATE TABLE IF NOT EXISTS calculadora.treatments_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'aesthetic' CHECK (category IN ('medical', 'aesthetic', 'cosmetic')),
    sale_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    duration_mins INTEGER DEFAULT 30,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculadora.daily_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    treatment_id UUID REFERENCES calculadora.treatments_catalog(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    sale_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    total_revenue DECIMAL(10, 2) GENERATED ALWAYS AS (sale_price * quantity) STORED,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (cost_price * quantity) STORED,
    gross_profit DECIMAL(10, 2) GENERATED ALWAYS AS ((sale_price - cost_price) * quantity) STORED,
    payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('cash', 'card', 'transfer')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. VISTAS
CREATE OR REPLACE VIEW calculadora.monthly_labor_costs AS
SELECT c.id as config_id,
    c.num_employees,
    c.employee_gross_salary,
    -- Coste total empleados (aprox +30% SS)
    ROUND(
        (c.employee_gross_salary * 1.30) * c.num_employees,
        2
    ) as total_employees_cost,
    -- Coste propietario
    ROUND(c.owner_gross_salary + c.owner_ss_autonomo, 2) as total_owner_cost,
    -- TOTAL COSTES LABORALES
    ROUND(
        (
            (c.employee_gross_salary * 1.30) * c.num_employees
        ) + c.owner_gross_salary + c.owner_ss_autonomo,
        2
    ) as total_labor_cost
FROM calculadora.company_config c;

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

-- VISTA DIARIA (KPIs del Dashboard - Basado en Tratamientos)
CREATE OR REPLACE VIEW calculadora.daily_summary AS WITH daily_data AS (
        SELECT treatment_date,
            SUM(total_revenue) as gross_revenue,
            SUM(total_cost) as product_costs,
            SUM(gross_profit) as gross_profit_before_overhead,
            SUM(
                CASE
                    WHEN payment_method = 'cash' THEN total_revenue
                    ELSE 0
                END
            ) as cash_amount,
            SUM(
                CASE
                    WHEN payment_method = 'card' THEN total_revenue
                    ELSE 0
                END
            ) as card_amount,
            SUM(
                CASE
                    WHEN payment_method = 'transfer' THEN total_revenue
                    ELSE 0
                END
            ) as transfer_amount,
            COUNT(*) as num_treatments
        FROM calculadora.daily_treatments
        GROUP BY treatment_date
    ),
    monthly_overhead AS (
        SELECT COALESCE(
                (
                    SELECT total_labor_cost
                    FROM calculadora.monthly_labor_costs
                    LIMIT 1
                ), 0
            ) as labor_costs,
            COALESCE(
                (
                    SELECT total_monthly_fixed
                    FROM calculadora.monthly_fixed_expenses
                    LIMIT 1
                ), 0
            ) as fixed_costs
    )
SELECT d.treatment_date,
    d.gross_revenue,
    ROUND(d.gross_revenue / 1.21, 2) as net_revenue_ex_vat,
    d.product_costs,
    d.gross_profit_before_overhead,
    ROUND(o.labor_costs / 22, 2) as daily_labor_cost,
    ROUND(o.fixed_costs / 22, 2) as daily_fixed_cost,
    ROUND(
        d.gross_profit_before_overhead - (o.labor_costs / 22) - (o.fixed_costs / 22),
        2
    ) as daily_net_profit,
    CASE
        WHEN d.gross_revenue > 0 THEN ROUND(
            (
                d.gross_profit_before_overhead - (o.labor_costs / 22) - (o.fixed_costs / 22)
            ) / d.gross_revenue * 100,
            2
        )
        ELSE 0
    END as profit_margin_pct,
    d.cash_amount,
    d.card_amount,
    d.transfer_amount,
    d.num_treatments
FROM daily_data d,
    monthly_overhead o;

-- 7. FUNCIONES
CREATE OR REPLACE FUNCTION calculadora.calculate_monthly_summary(p_year INTEGER, p_month INTEGER) RETURNS TABLE (
        year_month TEXT,
        gross_revenue DECIMAL(10, 2),
        net_revenue_ex_vat DECIMAL(10, 2),
        product_costs DECIMAL(10, 2),
        variable_expenses DECIMAL(10, 2),
        fixed_expenses DECIMAL(10, 2),
        labor_costs DECIMAL(10, 2),
        total_expenses DECIMAL(10, 2),
        gross_profit DECIMAL(10, 2),
        corporate_tax DECIMAL(10, 2),
        net_profit DECIMAL(10, 2),
        profit_margin_pct DECIMAL(10, 2)
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_start_date DATE;
v_end_date DATE;
v_total_fixed DECIMAL(10, 2);
v_total_labor DECIMAL(10, 2);
v_corporate_tax_rate DECIMAL(10, 2) := 0.25;
BEGIN v_start_date := MAKE_DATE(p_year, p_month, 1);
v_end_date := (
    v_start_date + INTERVAL '1 month' - INTERVAL '1 day'
)::DATE;
SELECT COALESCE(total_monthly_fixed, 0) INTO v_total_fixed
FROM calculadora.monthly_fixed_expenses;
SELECT COALESCE(total_labor_cost, 0) INTO v_total_labor
FROM calculadora.monthly_labor_costs;
RETURN QUERY WITH monthly_aggregates AS (
    SELECT COALESCE(SUM(d.gross_revenue), 0) as total_gross,
        COALESCE(SUM(d.net_revenue_ex_vat), 0) as total_net_rev,
        COALESCE(SUM(d.product_costs), 0) as total_product_costs
    FROM calculadora.daily_summary d
    WHERE d.treatment_date BETWEEN v_start_date AND v_end_date
)
SELECT TO_CHAR(v_start_date, 'YYYY-MM') as ym,
    ma.total_gross,
    ma.total_net_rev,
    ma.total_product_costs,
    0.00 as var_expenses,
    v_total_fixed as fix_expenses,
    v_total_labor as lab_costs,
    (
        ma.total_product_costs + v_total_fixed + v_total_labor
    ) as total_expenses,
    (
        ma.total_net_rev - (
            ma.total_product_costs + v_total_fixed + v_total_labor
        )
    ) as gross_profit,
    CASE
        WHEN (
            ma.total_net_rev - (
                ma.total_product_costs + v_total_fixed + v_total_labor
            )
        ) > 0 THEN (
            ma.total_net_rev - (
                ma.total_product_costs + v_total_fixed + v_total_labor
            )
        ) * v_corporate_tax_rate
        ELSE 0
    END,
    (
        (
            ma.total_net_rev - (
                ma.total_product_costs + v_total_fixed + v_total_labor
            )
        ) - CASE
            WHEN (
                ma.total_net_rev - (
                    ma.total_product_costs + v_total_fixed + v_total_labor
                )
            ) > 0 THEN (
                ma.total_net_rev - (
                    ma.total_product_costs + v_total_fixed + v_total_labor
                )
            ) * v_corporate_tax_rate
            ELSE 0
        END
    ) as net_profit,
    CASE
        WHEN ma.total_gross > 0 THEN (
            (
                ma.total_net_rev - (
                    ma.total_product_costs + v_total_fixed + v_total_labor
                )
            ) / ma.total_gross
        ) * 100
        ELSE 0
    END
FROM monthly_aggregates ma;
END;
$$;

-- 8. SEGURIDAD (RLS)
ALTER TABLE calculadora.company_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.variable_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.treatments_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.daily_treatments ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (Public Access)
DROP POLICY IF EXISTS "Public Access" ON calculadora.company_config;
CREATE POLICY "Public Access" ON calculadora.company_config FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.tax_rates;
CREATE POLICY "Public Access" ON calculadora.tax_rates FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.expense_categories;
CREATE POLICY "Public Access" ON calculadora.expense_categories FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.fixed_expenses;
CREATE POLICY "Public Access" ON calculadora.fixed_expenses FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.variable_expenses;
CREATE POLICY "Public Access" ON calculadora.variable_expenses FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.product_costs;
CREATE POLICY "Public Access" ON calculadora.product_costs FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.daily_sales;
CREATE POLICY "Public Access" ON calculadora.daily_sales FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.treatments_catalog;
CREATE POLICY "Public Access" ON calculadora.treatments_catalog FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public Access" ON calculadora.daily_treatments;
CREATE POLICY "Public Access" ON calculadora.daily_treatments FOR ALL TO public USING (true) WITH CHECK (true);

-- Políticas para usuarios autenticados (opcional, pero buena práctica)
DROP POLICY IF EXISTS "Auth Access" ON calculadora.company_config;
CREATE POLICY "Auth Access" ON calculadora.company_config FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.tax_rates;
CREATE POLICY "Auth Access" ON calculadora.tax_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.expense_categories;
CREATE POLICY "Auth Access" ON calculadora.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.fixed_expenses;
CREATE POLICY "Auth Access" ON calculadora.fixed_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.variable_expenses;
CREATE POLICY "Auth Access" ON calculadora.variable_expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.product_costs;
CREATE POLICY "Auth Access" ON calculadora.product_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.daily_sales;
CREATE POLICY "Auth Access" ON calculadora.daily_sales FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.treatments_catalog;
CREATE POLICY "Auth Access" ON calculadora.treatments_catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Auth Access" ON calculadora.daily_treatments;
CREATE POLICY "Auth Access" ON calculadora.daily_treatments FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA calculadora TO public;
GRANT USAGE ON SCHEMA calculadora TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA calculadora TO public;
GRANT ALL ON ALL TABLES IN SCHEMA calculadora TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA calculadora TO public;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA calculadora TO authenticated;

-- 9. DATOS INICIALES

-- Configuración Empresa
INSERT INTO calculadora.company_config (company_name)
SELECT 'Mi Clínica Estética SL'
WHERE NOT EXISTS (SELECT 1 FROM calculadora.company_config);

-- Tasas Impuestos
INSERT INTO calculadora.tax_rates (tax_type, rate_percentage)
VALUES ('ss_empresa', 30.00),
    ('ss_trabajador', 6.35),
    ('irpf_medio', 15.00),
    ('impuesto_sociedades', 25.00),
    ('iva_general', 21.00)
ON CONFLICT DO NOTHING;

-- Categorías de Gastos
INSERT INTO calculadora.expense_categories (name, description, is_fixed)
VALUES
    ('Alquiler', 'Alquiler del local', true),
    ('Suministros', 'Luz, agua, gas, internet', true),
    ('Seguros', 'Seguros del negocio', true),
    ('Gestoría', 'Servicios de asesoría y gestoría', true),
    ('Marketing', 'Publicidad y marketing', false),
    ('Material Oficina', 'Material de oficina', false),
    ('Mantenimiento', 'Reparaciones y mantenimiento', false),
    ('Formación', 'Cursos y formación', false),
    ('Productos', 'Compra de productos para tratamientos', false),
    ('Otros', 'Otros gastos', false)
ON CONFLICT DO NOTHING; -- Nota: id es UUID, conflict no funcionará igual sin unique constraint en name.
-- Para evitar duplicados en categorías si se re-ejecuta, lo ideal sería borrar primero o usar DO BLOCK.
-- Como id es generado, DELETE FROM es más seguro para limpieza inicial, pero cuidado con FKs.
-- Asumimos ejecución limpia o sobre DB vacía preferiblemente.

-- TRATAMIENTOS (Importación Completa)
-- Borramos previos para evitar duplicados si se re-ejecuta
DELETE FROM calculadora.treatments_catalog;

INSERT INTO calculadora.treatments_catalog (name, category, sale_price, cost_price, duration_mins)
VALUES
    ('ACP', 'medical', 250.00, 73.15, 30),
    ('DUO', 'medical', 250.00, 76.20, 30),
    ('Hyal System Lips', 'medical', 300.00, 61.95, 45),
    ('Bocouture 2x100u', 'medical', 350.00, 95.98, 30),
    ('Bocouture 50u', 'medical', 300.00, 90.00, 30),
    ('Vistabell', 'medical', 350.00, 122.50, 30),
    ('Azzalure', 'medical', 325.00, 111.76, 30),
    ('Redensity 2 (2024)', 'medical', 420.00, 117.37, 45),
    ('RHA1', 'medical', 350.00, 70.79, 45),
    ('RHA2', 'medical', 350.00, 90.14, 45),
    ('RHA3', 'medical', 350.00, 89.54, 45),
    ('RHA4', 'medical', 350.00, 94.38, 45),
    ('Ultra Deep', 'medical', 350.00, 88.94, 45),
    ('Kiss', 'medical', 350.00, 81.07, 45),
    ('RHA Kiss', 'medical', 350.00, 71.96, 45),
    ('Maili Volume', 'medical', 350.00, 73.05, 45),
    ('Maili Extreme', 'medical', 350.00, 76.23, 45),
    ('Aliaxin SV', 'medical', 350.00, 85.91, 45),
    ('Aliaxin EV', 'medical', 350.00, 56.87, 45),
    ('Viscoderm Hydrobooster', 'medical', 200.00, 60.05, 30),
    ('Profhilo Face', 'medical', 410.00, 96.80, 30),
    ('Profhilo Estructura', 'medical', 450.00, 121.00, 30),
    ('Profhilo Kit', 'medical', 800.00, 284.35, 60),
    ('Radiesse', 'medical', 420.00, 148.50, 45),
    ('Lenisna', 'medical', 450.00, 160.93, 45),
    ('Purasomes Hair & Scalp', 'medical', 300.00, 145.20, 60),
    ('Purasomes Nutricomplex', 'medical', 250.00, 116.97, 60),
    ('Purasomes SGC100 + Skin Glow', 'medical', 250.00, 145.20, 60),
    ('Adipozon', 'medical', 120.00, 24.20, 30),
    ('Polinucleótidos Ojos', 'medical', 250.00, 90.75, 45),
    ('Kit Nanofat Plus Fidia', 'medical', 1350.00, 391.31, 90),
    ('Kit PRP Fidia', 'medical', 250.00, 102.85, 45),
    ('Kit PRP Unisthetic', 'medical', 275.00, 42.35, 45);
