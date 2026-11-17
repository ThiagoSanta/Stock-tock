-- ==============================================================================
-- MODELO DE DATOS - STOCK-TOCK (V1)
-- Base de Datos: PostgreSQL (Supabase)
-- Reglas Clave:
--  - Multiempresa preparada con company_id
--  - Inviolabilidad de stock: CHECK (physical_stock >= 0), CHECK (available_stock >= 0)
--  - Cálculo de disponibilidad automático: available_stock = physical_stock - reserved_stock
--  - Trazabilidad total de movimientos de inventario (Kardex inmutable)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función utilitaria para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. EMPRESAS Y DEPÓSITOS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50), -- CUIT/RUT/RFC opcional
    primary_currency VARCHAR(10) NOT NULL DEFAULT 'ARS',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_companies_modtime
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    address TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_warehouse_code_per_company UNIQUE (company_id, code)
);

-- ==============================================================================
-- 3. CATÁLOGO: CATEGORÍAS, PRODUCTOS Y VARIANTES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'UNIDAD', -- UNIDAD, KG, LITRO, METRO, PACK
    cost_price NUMERIC(14, 4) NOT NULL DEFAULT 0.0000, -- Costo promedio ponderado (PPP) a nivel empresa
    sale_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,  -- Precio minorista principal
    wholesale_price NUMERIC(14, 2),                   -- Precio mayorista opcional
    min_stock_alert NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    max_stock NUMERIC(12, 2),
    tracks_lots_and_expiry BOOLEAN NOT NULL DEFAULT false, -- Lotes/vencimiento opcional
    has_variants BOOLEAN NOT NULL DEFAULT false,
    image_url TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_sku_per_company UNIQUE (company_id, sku)
);

CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- Ej: "Talle XL / Negro"
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    cost_price NUMERIC(14, 4),
    sale_price NUMERIC(14, 2),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 4. INVENTARIO Y REGLAS DE STOCK INVIOLABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS inventory_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    physical_stock NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    reserved_stock NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    available_stock NUMERIC(14, 4) GENERATED ALWAYS AS (physical_stock - reserved_stock) STORED,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT check_physical_non_negative CHECK (physical_stock >= 0),
    CONSTRAINT check_reserved_non_negative CHECK (reserved_stock >= 0),
    CONSTRAINT check_available_non_negative CHECK (physical_stock - reserved_stock >= 0),
    CONSTRAINT unique_product_warehouse UNIQUE (warehouse_id, product_id, variant_id)
);

-- KARDEX AUDITABLE (Movimientos inmutables)
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    movement_type VARCHAR(50) NOT NULL, -- INGRESO_COMPRA, SALIDA_VENTA, RESERVA_PEDIDO, LIBERACION_PEDIDO, AJUSTE, etc.
    quantity NUMERIC(14, 4) NOT NULL,   -- Cantidad movida
    balance_physical_after NUMERIC(14, 4) NOT NULL,
    balance_reserved_after NUMERIC(14, 4) NOT NULL,
    balance_available_after NUMERIC(14, 4) NOT NULL,
    unit_cost NUMERIC(14, 4), -- Costo unitario asociado al movimiento
    reference_type VARCHAR(50), -- ORDER, SALE, PURCHASE, INVENTORY_COUNT
    reference_id UUID,
    notes TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 5. CONTACTOS: CLIENTES Y PROVEEDORES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    contact_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. PEDIDOS (CIRCUITO CON RESERVA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, CONFIRMADO, EN_PREPARACION, DESPACHADO_PARCIAL, DESPACHADO_TOTAL, CERRADO, CANCELADO
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    confirmed_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_order_number_per_company UNIQUE (company_id, order_number)
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity_requested NUMERIC(12, 2) NOT NULL,
    quantity_dispatched NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(14, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- ==============================================================================
-- 7. VENTAS (VENTA DIRECTA MOSTRADOR O POR DESPACHO)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    sale_number VARCHAR(50) NOT NULL,
    origin VARCHAR(40) NOT NULL, -- VENTA_DIRECTA_MOSTRADOR, PEDIDO_DESPACHADO
    payment_method VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO', -- EFECTIVO, TRANSFERENCIA, TARJETA_DEBITO, TARJETA_CREDITO, CHEQUE, OTRO
    total_amount NUMERIC(14, 2) NOT NULL,
    total_cost NUMERIC(14, 2) NOT NULL DEFAULT 0.00, -- Suma de costos históricos
    estimated_gross_margin NUMERIC(14, 2) GENERATED ALWAYS AS (total_amount - total_cost) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_sale_number_per_company UNIQUE (company_id, sale_number)
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(14, 2) NOT NULL,
    historical_cost_price NUMERIC(14, 4) NOT NULL, -- Guardado para no afectarse ante cambios futuros
    subtotal NUMERIC(14, 2) NOT NULL
);

-- ==============================================================================
-- 8. COMPRAS (ÓRDENES DE COMPRA Y RECEPCIÓN)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_number VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'BORRADOR', -- BORRADOR, EMITIDA, RECEPCION_PARCIAL, RECEPCION_TOTAL, CERRADA, CANCELADA
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_purchase_number_per_company UNIQUE (company_id, purchase_number)
);

CREATE TABLE IF NOT EXISTS purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity_ordered NUMERIC(12, 2) NOT NULL,
    quantity_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(14, 4) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL
);

-- ==============================================================================
-- 9. ÍNDICES DE RENDIMIENTO (Búsquedas ultra rápidas)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(company_id, sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(company_id, barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON inventory_stock(company_id, warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(company_id, status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(company_id, created_at DESC);

-- ==============================================================================
-- 10. DATOS SEMILLA INICIALES (Para empezar a operar de inmediato)
-- ==============================================================================

DO $$
DECLARE
    v_company_id UUID;
    v_warehouse_id UUID;
    v_category_id UUID;
    v_product_id UUID;
BEGIN
    -- 1. Crear Empresa Demo
    INSERT INTO companies (name, tax_id, primary_currency)
    VALUES ('Stock-tock Casa Central', '30-12345678-9', 'ARS')
    RETURNING id INTO v_company_id;

    -- 2. Crear Depósito Principal
    INSERT INTO warehouses (company_id, name, code, is_default, active)
    VALUES (v_company_id, 'Depósito Central', 'DEP-01', true, true)
    RETURNING id INTO v_warehouse_id;

    -- 3. Crear Categoría Inicial
    INSERT INTO categories (company_id, name, slug)
    VALUES (v_company_id, 'Herramientas y Maquinaria', 'herramientas-y-maquinaria')
    RETURNING id INTO v_category_id;

    -- 4. Crear Producto Inicial
    INSERT INTO products (
        company_id, category_id, name, description, sku, barcode,
        unit_of_measure, cost_price, sale_price, min_stock_alert, tracks_lots_and_expiry
    )
    VALUES (
        v_company_id, v_category_id, 'Taladro Percutor 750W Profesional',
        'Mandril 13mm velocidad variable reversible con maletín.',
        'TAL-PER-750', '7791234567890', 'UNIDAD', 45000.0000, 78500.00, 5.00, false
    )
    RETURNING id INTO v_product_id;

    -- 5. Inicializar Stock Físico (25 unidades)
    INSERT INTO inventory_stock (company_id, warehouse_id, product_id, physical_stock, reserved_stock)
    VALUES (v_company_id, v_warehouse_id, v_product_id, 25.0000, 0.0000);

    -- 6. Registrar Movimiento Inicial de Inventario
    INSERT INTO stock_movements (
        company_id, warehouse_id, product_id, movement_type,
        quantity, balance_physical_after, balance_reserved_after, balance_available_after,
        unit_cost, notes
    )
    VALUES (
        v_company_id, v_warehouse_id, v_product_id, 'INGRESO_AJUSTE',
        25.0000, 25.0000, 0.0000, 25.0000,
        45000.0000, 'Inventario inicial de apertura del sistema'
    );
END $$;
