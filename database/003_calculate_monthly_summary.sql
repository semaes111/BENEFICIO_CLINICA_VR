-- ============================================
-- RPC: calculate_monthly_summary
-- Calculates monthly financial summary aggregating daily data
-- ============================================
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
-- Default 25%
BEGIN -- Determinar rango de fechas
v_start_date := MAKE_DATE(p_year, p_month, 1);
v_end_date := (
    v_start_date + INTERVAL '1 month' - INTERVAL '1 day'
)::DATE;
-- Obtener Costes Fijos Mensuales (Vista)
SELECT COALESCE(total_monthly_fixed, 0) INTO v_total_fixed
FROM calculadora.monthly_fixed_expenses;
-- Obtener Costes Laborales Mensuales (Vista)
SELECT COALESCE(total_labor_cost, 0) INTO v_total_labor
FROM calculadora.monthly_labor_costs;
RETURN QUERY WITH monthly_aggregates AS (
    SELECT COALESCE(SUM(d.gross_revenue), 0) as total_gross,
        COALESCE(SUM(d.net_revenue_ex_vat), 0) as total_net_rev,
        COALESCE(SUM(d.product_costs), 0) as total_product_costs
    FROM calculadora.daily_summary d
    WHERE d.treatment_date BETWEEN v_start_date AND v_end_date
),
calcs AS (
    SELECT TO_CHAR(v_start_date, 'YYYY-MM') as ym,
        ma.total_gross,
        ma.total_net_rev,
        ma.total_product_costs,
        0.00 as var_expenses,
        -- Placeholder for variable expenses table if integration needed
        v_total_fixed as fix_expenses,
        v_total_labor as lab_costs
    FROM monthly_aggregates ma
)
SELECT c.ym,
    c.total_gross,
    c.total_net_rev,
    c.total_product_costs,
    c.var_expenses,
    c.fix_expenses,
    c.lab_costs,
    (
        c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
    ) as total_expenses,
    (
        c.total_net_rev - (
            c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
        )
    ) as gross_profit,
    CASE
        WHEN (
            c.total_net_rev - (
                c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
            )
        ) > 0 THEN (
            c.total_net_rev - (
                c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
            )
        ) * v_corporate_tax_rate
        ELSE 0
    END as corporate_tax,
    (
        (
            c.total_net_rev - (
                c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
            )
        ) - CASE
            WHEN (
                c.total_net_rev - (
                    c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
                )
            ) > 0 THEN (
                c.total_net_rev - (
                    c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
                )
            ) * v_corporate_tax_rate
            ELSE 0
        END
    ) as net_profit,
    CASE
        WHEN c.total_gross > 0 THEN (
            (
                c.total_net_rev - (
                    c.total_product_costs + c.var_expenses + c.fix_expenses + c.lab_costs
                )
            ) / c.total_gross
        ) * 100
        ELSE 0
    END as profit_margin_pct
FROM calcs c;
END;
$$;