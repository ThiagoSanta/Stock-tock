-- ==============================================================================
-- MIGRACIÓN DE SEGURIDAD: AUTENTICACIÓN Y RLS ESTRICTO POR EMPRESA (MULTI-TENANT)
-- Archivo: docs/05-seguridad-auth-rls.sql
-- ==============================================================================
-- INSTRUCCIONES:
--   Ejecutar en Supabase SQL Editor (o con psql/migrate) cuando estés listo para
--   activar el aislamiento estricto por usuario autenticado.
--   Nota: Una vez ejecutado, el acceso anónimo (anon) queda bloqueado y se
--   requerirá iniciar sesión con Supabase Auth en la aplicación.
-- ==============================================================================

-- 1. TABLA DE MEMBRESÍAS Y ROLES POR EMPRESA
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'CASHIER' CHECK (role IN ('ADMIN', 'CASHIER', 'WAREHOUSE')),
    full_name VARCHAR(150),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_per_company UNIQUE (user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_company_users_user ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company ON company_users(company_id);

-- 2. FUNCIONES AUXILIARES DE SEGURIDAD (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_user_company_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id
    FROM company_users
    WHERE user_id = auth.uid()
      AND active = true;
$$;

CREATE OR REPLACE FUNCTION get_user_role(p_company_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role
    FROM company_users
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND active = true
    LIMIT 1;
$$;

-- RPC para vincular o crear empresa al primer usuario autenticado (bootstrap seguro)
CREATE OR REPLACE FUNCTION bootstrap_user_company(p_full_name TEXT DEFAULT 'Administrador')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_company_id UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    -- Si ya tiene empresa asignada, devolverla
    SELECT company_id INTO v_company_id
    FROM company_users
    WHERE user_id = v_uid AND active = true
    LIMIT 1;

    IF v_company_id IS NOT NULL THEN
        RETURN v_company_id;
    END IF;

    -- Si existe una empresa sin usuarios asignados (instalación inicial), vincularla como ADMIN
    SELECT c.id INTO v_company_id
    FROM companies c
    WHERE NOT EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = c.id)
    ORDER BY c.created_at ASC
    LIMIT 1;

    IF v_company_id IS NULL THEN
        INSERT INTO companies (name, primary_currency)
        VALUES ('Mi Empresa', 'ARS')
        RETURNING id INTO v_company_id;

        INSERT INTO warehouses (company_id, name, code, is_default, active)
        VALUES (v_company_id, 'Depósito Central', 'DEP-01', true, true);
    END IF;

    INSERT INTO company_users (user_id, company_id, role, full_name, active)
    VALUES (v_uid, v_company_id, 'ADMIN', COALESCE(NULLIF(TRIM(p_full_name), ''), 'Administrador'), true);

    RETURN v_company_id;
END;
$$;

-- 3. REVOCAR PERMISOS ABIERTOS A ANON Y ELIMINAR POLÍTICAS INSEGURAS
DROP POLICY IF EXISTS allow_all_stock_lots ON stock_lots;
DROP POLICY IF EXISTS allow_all_supplier_payments ON supplier_payments;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE AISLAMIENTO POR EMPRESA Y ROL

-- companies
DROP POLICY IF EXISTS tenant_companies_select ON companies;
CREATE POLICY tenant_companies_select ON companies
    FOR SELECT TO authenticated
    USING (id IN (SELECT get_user_company_ids()));

DROP POLICY IF EXISTS tenant_companies_update ON companies;
CREATE POLICY tenant_companies_update ON companies
    FOR UPDATE TO authenticated
    USING (id IN (SELECT get_user_company_ids()) AND get_user_role(id) = 'ADMIN')
    WITH CHECK (id IN (SELECT get_user_company_ids()) AND get_user_role(id) = 'ADMIN');

-- company_users
DROP POLICY IF EXISTS tenant_company_users_select ON company_users;
CREATE POLICY tenant_company_users_select ON company_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR get_user_role(company_id) = 'ADMIN');

DROP POLICY IF EXISTS tenant_company_users_admin ON company_users;
CREATE POLICY tenant_company_users_admin ON company_users
    FOR ALL TO authenticated
    USING (get_user_role(company_id) = 'ADMIN')
    WITH CHECK (get_user_role(company_id) = 'ADMIN');

-- Macro conceptual para tablas con company_id directo
DO $$
DECLARE
    tbl TEXT;
    company_tables TEXT[] := ARRAY[
        'warehouses', 'categories', 'products', 'inventory_stock',
        'stock_movements', 'stock_lots', 'customers', 'customer_payments',
        'suppliers', 'supplier_payments', 'orders', 'sales',
        'cash_movements', 'cash_shifts', 'purchases'
    ];
BEGIN
    FOREACH tbl IN ARRAY company_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS tenant_%I_all ON %I', tbl, tbl);
        EXECUTE format(
            'CREATE POLICY tenant_%I_all ON %I FOR ALL TO authenticated ' ||
            'USING (company_id IN (SELECT get_user_company_ids())) ' ||
            'WITH CHECK (company_id IN (SELECT get_user_company_ids()))',
            tbl, tbl
        );
    END LOOP;
END $$;

-- Tablas hijas sin company_id directo
DROP POLICY IF EXISTS tenant_product_variants_all ON product_variants;
CREATE POLICY tenant_product_variants_all ON product_variants
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_variants.product_id
          AND p.company_id IN (SELECT get_user_company_ids())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM products p
        WHERE p.id = product_variants.product_id
          AND p.company_id IN (SELECT get_user_company_ids())
    ));

DROP POLICY IF EXISTS tenant_order_items_all ON order_items;
CREATE POLICY tenant_order_items_all ON order_items
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id
          AND o.company_id IN (SELECT get_user_company_ids())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM orders o
        WHERE o.id = order_items.order_id
          AND o.company_id IN (SELECT get_user_company_ids())
    ));

DROP POLICY IF EXISTS tenant_sale_items_all ON sale_items;
CREATE POLICY tenant_sale_items_all ON sale_items
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM sales s
        WHERE s.id = sale_items.sale_id
          AND s.company_id IN (SELECT get_user_company_ids())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM sales s
        WHERE s.id = sale_items.sale_id
          AND s.company_id IN (SELECT get_user_company_ids())
    ));

DROP POLICY IF EXISTS tenant_purchase_items_all ON purchase_items;
CREATE POLICY tenant_purchase_items_all ON purchase_items
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM purchases pr
        WHERE pr.id = purchase_items.purchase_id
          AND pr.company_id IN (SELECT get_user_company_ids())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM purchases pr
        WHERE pr.id = purchase_items.purchase_id
          AND pr.company_id IN (SELECT get_user_company_ids())
    ));

-- audit_logs: solo inserción por miembros y lectura por ADMIN (inmutable: sin UPDATE/DELETE)
DROP POLICY IF EXISTS tenant_audit_logs_insert ON audit_logs;
CREATE POLICY tenant_audit_logs_insert ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (company_id IN (SELECT get_user_company_ids()));

DROP POLICY IF EXISTS tenant_audit_logs_select ON audit_logs;
CREATE POLICY tenant_audit_logs_select ON audit_logs
    FOR SELECT TO authenticated
    USING (company_id IN (SELECT get_user_company_ids()) AND get_user_role(company_id) = 'ADMIN');
