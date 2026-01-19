-- ============================================
-- MEJORA: Sistema de Tratamientos con Cálculo Automático
-- ============================================
-- ============================================
-- TABLA: treatments_catalog
-- Catálogo de tratamientos disponibles
-- ============================================
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
-- Insertar tratamientos de ejemplo
INSERT INTO calculadora.treatments_catalog (
        name,
        category,
        sale_price,
        cost_price,
        duration_mins
    )
VALUES ('Botox - Frente', 'medical', 250.00, 45.00, 30),
    (
        'Botox - Entrecejo',
        'medical',
        200.00,
        35.00,
        20
    ),
    (
        'Botox - Patas de gallo',
        'medical',
        180.00,
        30.00,
        20
    ),
    (
        'Ácido Hialurónico - Labios',
        'medical',
        350.00,
        80.00,
        45
    ),
    (
        'Ácido Hialurónico - Surcos',
        'medical',
        400.00,
        90.00,
        45
    ),
    (
        'Mesoterapia Facial',
        'aesthetic',
        150.00,
        25.00,
        40
    ),
    (
        'Peeling Químico',
        'aesthetic',
        120.00,
        15.00,
        30
    ),
    (
        'Limpieza Facial Profunda',
        'aesthetic',
        80.00,
        10.00,
        60
    ),
    ('Hilos Tensores', 'medical', 600.00, 150.00, 60),
    (
        'Radiofrecuencia Facial',
        'aesthetic',
        100.00,
        5.00,
        45
    ),
    ('Crema Antiarrugas', 'cosmetic', 65.00, 20.00, 5),
    ('Sérum Vitamina C', 'cosmetic', 45.00, 12.00, 5),
    ('Contorno de Ojos', 'cosmetic', 55.00, 15.00, 5);
-- ============================================
-- TABLA: daily_treatments
-- Tratamientos realizados por día
-- ============================================
CREATE TABLE IF NOT EXISTS calculadora.daily_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    treatment_id UUID REFERENCES calculadora.treatments_catalog(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    -- Precios (pueden variar del catálogo)
    sale_price DECIMAL(10, 2) NOT NULL,
    cost_price DECIMAL(10, 2) NOT NULL,
    -- Calculados
    total_revenue DECIMAL(10, 2) GENERATED ALWAYS AS (sale_price * quantity) STORED,
    total_cost DECIMAL(10, 2) GENERATED ALWAYS AS (cost_price * quantity) STORED,
    gross_profit DECIMAL(10, 2) GENERATED ALWAYS AS ((sale_price - cost_price) * quantity) STORED,
    -- Método de pago
    payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('cash', 'card', 'transfer')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- VIEW: daily_summary
-- Resumen diario con cálculo automático
-- ============================================
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
                ),
                0
            ) as fixed_costs
    ),
    daily_overhead AS (
        SELECT labor_costs / 22 as daily_labor_cost,
            -- 22 días laborables
            fixed_costs / 22 as daily_fixed_cost
        FROM monthly_overhead
    )
SELECT d.treatment_date,
    d.gross_revenue,
    ROUND(d.gross_revenue / 1.21, 2) as net_revenue_ex_vat,
    -- Sin IVA 21%
    d.product_costs,
    d.gross_profit_before_overhead,
    ROUND(o.daily_labor_cost, 2) as daily_labor_cost,
    ROUND(o.daily_fixed_cost, 2) as daily_fixed_cost,
    ROUND(
        d.gross_profit_before_overhead - o.daily_labor_cost - o.daily_fixed_cost,
        2
    ) as daily_net_profit,
    CASE
        WHEN d.gross_revenue > 0 THEN ROUND(
            (
                d.gross_profit_before_overhead - o.daily_labor_cost - o.daily_fixed_cost
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
    daily_overhead o
ORDER BY d.treatment_date DESC;
-- ============================================
-- RLS para nuevas tablas
-- ============================================
ALTER TABLE calculadora.treatments_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculadora.daily_treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users full access" ON calculadora.treatments_catalog FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated users full access" ON calculadora.daily_treatments FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Grants
GRANT ALL ON calculadora.treatments_catalog TO authenticated;
GRANT ALL ON calculadora.daily_treatments TO authenticated;