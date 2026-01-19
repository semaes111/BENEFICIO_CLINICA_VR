-- ============================================
-- MIGRATION: Importar Tratamientos Iniciales
-- ============================================
DELETE FROM calculadora.treatments_catalog;
-- Limpiar tabla (opcional, quitar si se quiere preservar)
INSERT INTO calculadora.treatments_catalog (
        name,
        category,
        sale_price,
        cost_price,
        duration_mins
    )
VALUES -- Toxinas y Neuromoduladores
    ('ACP', 'medical', 250.00, 73.15, 30),
    ('DUO', 'medical', 250.00, 76.20, 30),
    ('Bocouture 2x100u', 'medical', 350.00, 95.98, 30),
    ('Bocouture 50u', 'medical', 300.00, 90.00, 30),
    ('Vistabell', 'medical', 350.00, 122.50, 30),
    ('Azzalure', 'medical', 325.00, 111.76, 30),
    -- Ácido Hialurónico (Labios, Rellenos)
    ('Hyal System Lips', 'medical', 300.00, 61.95, 45),
    (
        'Redensity 2 (2024)',
        'medical',
        420.00,
        117.37,
        45
    ),
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
    -- Bioestimuladores e Hidratación Profunda
    (
        'Viscoderm Hydrobooster',
        'medical',
        200.00,
        60.05,
        30
    ),
    ('Profhilo Face', 'medical', 410.00, 96.80, 30),
    (
        'Profhilo Estructura',
        'medical',
        450.00,
        121.00,
        30
    ),
    ('Profhilo Kit', 'medical', 800.00, 284.35, 60),
    ('Radiesse', 'medical', 420.00, 148.50, 45),
    ('Lenisna', 'medical', 450.00, 160.93, 45),
    (
        'Polinucleótidos Ojos',
        'medical',
        250.00,
        90.75,
        45
    ),
    ('Adipozon', 'medical', 120.00, 24.20, 30),
    -- Exosomas y Tratamientos Capilares/Skin
    (
        'Purasomes Hair & Scalp',
        'medical',
        300.00,
        145.20,
        60
    ),
    (
        'Purasomes Nutricomplex',
        'medical',
        250.00,
        116.97,
        60
    ),
    (
        'Purasomes SGC100 + Skin Glow',
        'medical',
        250.00,
        145.20,
        60
    ),
    -- Kits PRP y Nanofat
    (
        'Kit Nanofat Plus Fidia',
        'medical',
        1350.00,
        391.31,
        90
    ),
    ('Kit PRP Fidia', 'medical', 250.00, 102.85, 45),
    (
        'Kit PRP Unisthetic',
        'medical',
        275.00,
        42.35,
        45
    );