-- ==============================================================================
-- MIGRACIÓN DE INTEGRIDAD TRANSACCIONAL Y ATOMICIDAD (PUNTO 2)
-- Archivo: docs/06-integridad-rpcs-transaccionales.sql
-- ==============================================================================
-- Incluye:
--   1. Índice único parcial en inventory_stock cuando variant_id IS NULL
--   2. Tablas sale_returns y sale_return_items para control de devoluciones
--   3. Funciones RPC atómicas con bloqueo pesimista (FOR UPDATE) para:
--      - rpc_process_direct_sale
--      - rpc_confirm_order
--      - rpc_dispatch_order
--      - rpc_cancel_order
--      - rpc_receive_purchase (con PPP global multi-depósito)
--      - rpc_adjust_stock
--      - rpc_transfer_stock (con UUID válido en reference_id)
--      - rpc_process_sale_return (con control de saldo devuelto y caja)
-- ==============================================================================

-- 1. EVITAR DUPLICADOS EN inventory_stock CUANDO variant_id IS NULL
CREATE UNIQUE INDEX IF NOT EXISTS unique_inventory_stock_no_variant
ON inventory_stock (warehouse_id, product_id)
WHERE variant_id IS NULL;

-- 2. TABLAS DE DEVOLUCIONES DE VENTA
CREATE TABLE IF NOT EXISTS sale_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    return_number VARCHAR(50) NOT NULL,
    total_refund NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_return_number_per_company UNIQUE (company_id, return_number)
);

CREATE TABLE IF NOT EXISTS sale_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES sale_returns(id) ON DELETE CASCADE,
    sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(14, 2) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sale_returns_sale ON sale_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_return_items_sale_item ON sale_return_items(sale_item_id);

-- ==============================================================================
-- 3. RPC: VENTA DIRECTA DE MOSTRADOR ATÓMICA
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_process_direct_sale(
    p_company_id UUID,
    p_warehouse_id UUID,
    p_customer_id UUID,
    p_customer_name TEXT,
    p_payment_method TEXT,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
    v_sale_number TEXT;
    v_total_amount NUMERIC(14, 2) := 0;
    v_total_cost NUMERIC(14, 2) := 0;
    v_item JSONB;
    v_product_id UUID;
    v_variant_id UUID;
    v_qty NUMERIC(14, 4);
    v_unit_price NUMERIC(14, 2);
    v_cost_price NUMERIC(14, 4);
    v_product_name TEXT;
    v_stock_id UUID;
    v_physical NUMERIC(14, 4);
    v_reserved NUMERIC(14, 4);
    v_available NUMERIC(14, 4);
    v_new_physical NUMERIC(14, 4);
    v_new_available NUMERIC(14, 4);
    v_created_at TIMESTAMPTZ;
BEGIN
    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'La venta debe incluir al menos un producto.';
    END IF;

    v_sale_number := 'VTA-' || RIGHT(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, 4) || LPAD((FLOOR(RANDOM() * 9000) + 1000)::TEXT, 4, '0');

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_price := (v_item->>'unitPrice')::NUMERIC;
        v_cost_price := COALESCE((v_item->>'costPrice')::NUMERIC, 0);
        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'La cantidad debe ser mayor a 0.';
        END IF;
        v_total_amount := v_total_amount + (v_qty * v_unit_price);
        v_total_cost := v_total_cost + (v_qty * v_cost_price);
    END LOOP;

    INSERT INTO sales (
        company_id, warehouse_id, customer_id, sale_number, origin,
        payment_method, total_amount, total_cost, notes
    ) VALUES (
        p_company_id, p_warehouse_id, p_customer_id, v_sale_number, 'VENTA_DIRECTA_MOSTRADOR',
        COALESCE(NULLIF(p_payment_method, ''), 'EFECTIVO'), v_total_amount, v_total_cost,
        COALESCE(NULLIF(p_notes, ''), 'Cliente: ' || COALESCE(NULLIF(p_customer_name, ''), 'Consumidor Final'))
    )
    RETURNING id, created_at INTO v_sale_id, v_created_at;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_product_id := (v_item->>'productId')::UUID;
        v_variant_id := NULLIF(v_item->>'variantId', '')::UUID;
        v_qty := (v_item->>'quantity')::NUMERIC;
        v_unit_price := (v_item->>'unitPrice')::NUMERIC;
        v_cost_price := COALESCE((v_item->>'costPrice')::NUMERIC, 0);
        v_product_name := COALESCE(v_item->>'productName', 'Producto');

        SELECT id, physical_stock, reserved_stock, available_stock
        INTO v_stock_id, v_physical, v_reserved, v_available
        FROM inventory_stock
        WHERE company_id = p_company_id
          AND warehouse_id = p_warehouse_id
          AND product_id = v_product_id
          AND variant_id IS NOT DISTINCT FROM v_variant_id
        FOR UPDATE;

        IF v_stock_id IS NULL THEN
            RAISE EXCEPTION 'El producto "%" no tiene registro de stock en este depósito.', v_product_name;
        END IF;

        IF v_qty > v_available THEN
            RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: % un., solicitado: % un.', v_product_name, v_available, v_qty;
        END IF;

        INSERT INTO sale_items (
            sale_id, product_id, variant_id, quantity, unit_price, historical_cost_price, subtotal
        ) VALUES (
            v_sale_id, v_product_id, v_variant_id, v_qty, v_unit_price, v_cost_price, v_qty * v_unit_price
        );

        v_new_physical := v_physical - v_qty;
        v_new_available := v_new_physical - v_reserved;

        UPDATE inventory_stock
        SET physical_stock = v_new_physical, updated_at = NOW()
        WHERE id = v_stock_id;

        INSERT INTO stock_movements (
            company_id, warehouse_id, product_id, variant_id, movement_type,
            quantity, balance_physical_after, balance_reserved_after, balance_available_after,
            unit_cost, reference_type, reference_id, notes
        ) VALUES (
            p_company_id, p_warehouse_id, v_product_id, v_variant_id, 'SALIDA_VENTA',
            -v_qty, v_new_physical, v_reserved, v_new_available,
            v_cost_price, 'SALE', v_sale_id, 'Venta Directa de Mostrador #' || v_sale_number
        );
    END LOOP;

    RETURN jsonb_build_object(
        'id', v_sale_id,
        'company_id', p_company_id,
        'sale_number', v_sale_number,
        'origin', 'VENTA_DIRECTA_MOSTRADOR',
        'payment_method', COALESCE(NULLIF(p_payment_method, ''), 'EFECTIVO'),
        'total_amount', v_total_amount,
        'total_cost', v_total_cost,
        'created_at', v_created_at
    );
END;
$$;

-- ==============================================================================
-- 4. RPC: CONFIRMAR PEDIDO (RESERVA ATÓMICA)
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_confirm_order(
    p_order_id UUID,
    p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_stock_id UUID;
    v_physical NUMERIC(14, 4);
    v_reserved NUMERIC(14, 4);
    v_available NUMERIC(14, 4);
    v_new_reserved NUMERIC(14, 4);
    v_new_available NUMERIC(14, 4);
BEGIN
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND company_id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido no encontrado.';
    END IF;

    IF v_order.status <> 'BORRADOR' THEN
        RAISE EXCEPTION 'El pedido ya está en estado %.', v_order.status;
    END IF;

    FOR v_item IN
        SELECT oi.*, p.name AS product_name
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
    LOOP
        SELECT id, physical_stock, reserved_stock, available_stock
        INTO v_stock_id, v_physical, v_reserved, v_available
        FROM inventory_stock
        WHERE company_id = p_company_id
          AND warehouse_id = v_order.warehouse_id
          AND product_id = v_item.product_id
          AND variant_id IS NOT DISTINCT FROM v_item.variant_id
        FOR UPDATE;

        IF v_stock_id IS NULL THEN
            RAISE EXCEPTION 'El producto "%" no tiene inventario en este depósito.', v_item.product_name;
        END IF;

        IF v_item.quantity_requested > v_available THEN
            RAISE EXCEPTION 'Stock disponible insuficiente para "%" (Disponible: %, Requerido: %).', v_item.product_name, v_available, v_item.quantity_requested;
        END IF;

        v_new_reserved := v_reserved + v_item.quantity_requested;
        v_new_available := v_physical - v_new_reserved;

        UPDATE inventory_stock
        SET reserved_stock = v_new_reserved, updated_at = NOW()
        WHERE id = v_stock_id;

        INSERT INTO stock_movements (
            company_id, warehouse_id, product_id, variant_id, movement_type,
            quantity, balance_physical_after, balance_reserved_after, balance_available_after,
            reference_type, reference_id, notes
        ) VALUES (
            p_company_id, v_order.warehouse_id, v_item.product_id, v_item.variant_id, 'RESERVA_PEDIDO',
            v_item.quantity_requested, v_physical, v_new_reserved, v_new_available,
            'ORDER', p_order_id, 'Reserva para Pedido #' || v_order.order_number
        );
    END LOOP;

    UPDATE orders
    SET status = 'CONFIRMADO', confirmed_at = NOW(), updated_at = NOW()
    WHERE id = p_order_id;
END;
$$;

-- ==============================================================================
-- 5. RPC: DESPACHAR PEDIDO ATÓMICO
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_dispatch_order(
    p_order_id UUID,
    p_company_id UUID,
    p_payment_method TEXT DEFAULT 'TRANSFERENCIA'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_stock_id UUID;
    v_physical NUMERIC(14, 4);
    v_reserved NUMERIC(14, 4);
    v_new_physical NUMERIC(14, 4);
    v_new_reserved NUMERIC(14, 4);
    v_new_available NUMERIC(14, 4);
    v_total_cost NUMERIC(14, 2) := 0;
    v_sale_id UUID;
    v_sale_number TEXT;
BEGIN
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND company_id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido no encontrado.';
    END IF;

    IF v_order.status NOT IN ('CONFIRMADO', 'EN_PREPARACION') THEN
        RAISE EXCEPTION 'El pedido debe estar confirmado para poder despacharlo (Estado actual: %).', v_order.status;
    END IF;

    v_sale_number := 'VTA-PED-' || REPLACE(v_order.order_number, 'PED-', '');

    INSERT INTO sales (
        company_id, warehouse_id, customer_id, order_id, sale_number, origin,
        payment_method, total_amount, total_cost, notes
    ) VALUES (
        p_company_id, v_order.warehouse_id, v_order.customer_id, p_order_id, v_sale_number, 'PEDIDO_DESPACHADO',
        COALESCE(NULLIF(p_payment_method, ''), 'TRANSFERENCIA'), v_order.total_amount, 0,
        'Venta procedente de Despacho de Pedido #' || v_order.order_number
    )
    RETURNING id INTO v_sale_id;

    FOR v_item IN
        SELECT oi.*, p.cost_price
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = p_order_id
    LOOP
        SELECT id, physical_stock, reserved_stock
        INTO v_stock_id, v_physical, v_reserved
        FROM inventory_stock
        WHERE company_id = p_company_id
          AND warehouse_id = v_order.warehouse_id
          AND product_id = v_item.product_id
          AND variant_id IS NOT DISTINCT FROM v_item.variant_id
        FOR UPDATE;

        v_new_physical := v_physical - v_item.quantity_requested;
        v_new_reserved := GREATEST(0, v_reserved - v_item.quantity_requested);
        v_new_available := v_new_physical - v_new_reserved;
        v_total_cost := v_total_cost + (COALESCE(v_item.cost_price, 0) * v_item.quantity_requested);

        UPDATE inventory_stock
        SET physical_stock = v_new_physical, reserved_stock = v_new_reserved, updated_at = NOW()
        WHERE id = v_stock_id;

        INSERT INTO stock_movements (
            company_id, warehouse_id, product_id, variant_id, movement_type,
            quantity, balance_physical_after, balance_reserved_after, balance_available_after,
            unit_cost, reference_type, reference_id, notes
        ) VALUES (
            p_company_id, v_order.warehouse_id, v_item.product_id, v_item.variant_id, 'SALIDA_VENTA',
            -v_item.quantity_requested, v_new_physical, v_new_reserved, v_new_available,
            COALESCE(v_item.cost_price, 0), 'ORDER', p_order_id, 'Despacho de Pedido #' || v_order.order_number
        );

        INSERT INTO sale_items (
            sale_id, product_id, variant_id, quantity, unit_price, historical_cost_price, subtotal
        ) VALUES (
            v_sale_id, v_item.product_id, v_item.variant_id, v_item.quantity_requested,
            v_item.unit_price, COALESCE(v_item.cost_price, 0), v_item.subtotal
        );

        UPDATE order_items
        SET quantity_dispatched = v_item.quantity_requested
        WHERE id = v_item.id;
    END LOOP;

    UPDATE sales SET total_cost = v_total_cost WHERE id = v_sale_id;

    UPDATE orders
    SET status = 'DESPACHADO_TOTAL', dispatched_at = NOW(), updated_at = NOW()
    WHERE id = p_order_id;

    RETURN v_sale_id;
END;
$$;

-- ==============================================================================
-- 6. RPC: CANCELAR PEDIDO ATÓMICO
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_cancel_order(
    p_order_id UUID,
    p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_stock_id UUID;
    v_physical NUMERIC(14, 4);
    v_reserved NUMERIC(14, 4);
    v_new_reserved NUMERIC(14, 4);
    v_new_available NUMERIC(14, 4);
BEGIN
    SELECT * INTO v_order
    FROM orders
    WHERE id = p_order_id AND company_id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido no encontrado.';
    END IF;

    IF v_order.status IN ('DESPACHADO_TOTAL', 'CANCELADO') THEN
        RAISE EXCEPTION 'No se puede cancelar un pedido en estado %.', v_order.status;
    END IF;

    IF v_order.status IN ('CONFIRMADO', 'EN_PREPARACION') THEN
        FOR v_item IN SELECT * FROM order_items WHERE order_id = p_order_id LOOP
            SELECT id, physical_stock, reserved_stock
            INTO v_stock_id, v_physical, v_reserved
            FROM inventory_stock
            WHERE company_id = p_company_id
              AND warehouse_id = v_order.warehouse_id
              AND product_id = v_item.product_id
              AND variant_id IS NOT DISTINCT FROM v_item.variant_id
            FOR UPDATE;

            IF v_stock_id IS NOT NULL THEN
                v_new_reserved := GREATEST(0, v_reserved - v_item.quantity_requested);
                v_new_available := v_physical - v_new_reserved;

                UPDATE inventory_stock
                SET reserved_stock = v_new_reserved, updated_at = NOW()
                WHERE id = v_stock_id;

                INSERT INTO stock_movements (
                    company_id, warehouse_id, product_id, variant_id, movement_type,
                    quantity, balance_physical_after, balance_reserved_after, balance_available_after,
                    reference_type, reference_id, notes
                ) VALUES (
                    p_company_id, v_order.warehouse_id, v_item.product_id, v_item.variant_id, 'LIBERACION_PEDIDO',
                    -v_item.quantity_requested, v_physical, v_new_reserved, v_new_available,
                    'ORDER', p_order_id, 'Liberación de reserva por Cancelación de Pedido #' || v_order.order_number
                );
            END IF;
        END LOOP;
    END IF;

    UPDATE orders
    SET status = 'CANCELADO', updated_at = NOW()
    WHERE id = p_order_id;
END;
$$;

-- ==============================================================================
-- 7. RPC: RECEPCIÓN DE COMPRA CON PPP GLOBAL MULTI-DEPÓSITO
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_receive_purchase(
    p_purchase_id UUID,
    p_company_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_purchase RECORD;
    v_item RECORD;
    v_current_cost NUMERIC(14, 4);
    v_global_physical NUMERIC(14, 4);
    v_stock_id UUID;
    v_wh_physical NUMERIC(14, 4);
    v_wh_reserved NUMERIC(14, 4);
    v_new_wh_physical NUMERIC(14, 4);
    v_new_wh_available NUMERIC(14, 4);
    v_total_units NUMERIC(14, 4);
    v_rounded_ppp NUMERIC(14, 4);
BEGIN
    SELECT * INTO v_purchase
    FROM purchases
    WHERE id = p_purchase_id AND company_id = p_company_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Orden de compra no encontrada.';
    END IF;

    IF v_purchase.status NOT IN ('EMITIDA', 'BORRADOR') THEN
        RAISE EXCEPTION 'La compra ya se encuentra en estado %.', v_purchase.status;
    END IF;

    FOR v_item IN SELECT * FROM purchase_items WHERE purchase_id = p_purchase_id LOOP
        SELECT cost_price INTO v_current_cost
        FROM products
        WHERE id = v_item.product_id
        FOR UPDATE;

        -- Stock físico global en toda la empresa para cálculo real de PPP
        SELECT COALESCE(SUM(physical_stock), 0) INTO v_global_physical
        FROM inventory_stock
        WHERE company_id = p_company_id
          AND product_id = v_item.product_id
          AND variant_id IS NOT DISTINCT FROM v_item.variant_id;

        v_total_units := v_global_physical + v_item.quantity_ordered;
        IF v_total_units > 0 THEN
            v_rounded_ppp := ROUND(((v_global_physical * COALESCE(v_current_cost, 0)) + (v_item.quantity_ordered * v_item.unit_cost)) / v_total_units, 2);
        ELSE
            v_rounded_ppp := v_item.unit_cost;
        END IF;

        UPDATE products
        SET cost_price = v_rounded_ppp, updated_at = NOW()
        WHERE id = v_item.product_id;

        SELECT id, physical_stock, reserved_stock
        INTO v_stock_id, v_wh_physical, v_wh_reserved
        FROM inventory_stock
        WHERE company_id = p_company_id
          AND warehouse_id = v_purchase.warehouse_id
          AND product_id = v_item.product_id
          AND variant_id IS NOT DISTINCT FROM v_item.variant_id
        FOR UPDATE;

        IF v_stock_id IS NULL THEN
            v_wh_physical := 0;
            v_wh_reserved := 0;
            v_new_wh_physical := v_item.quantity_ordered;
            INSERT INTO inventory_stock (company_id, warehouse_id, product_id, variant_id, physical_stock, reserved_stock)
            VALUES (p_company_id, v_purchase.warehouse_id, v_item.product_id, v_item.variant_id, v_new_wh_physical, 0);
        ELSE
            v_new_wh_physical := v_wh_physical + v_item.quantity_ordered;
            UPDATE inventory_stock
            SET physical_stock = v_new_wh_physical, updated_at = NOW()
            WHERE id = v_stock_id;
        END IF;

        v_new_wh_available := v_new_wh_physical - v_wh_reserved;

        INSERT INTO stock_movements (
            company_id, warehouse_id, product_id, variant_id, movement_type,
            quantity, balance_physical_after, balance_reserved_after, balance_available_after,
            unit_cost, reference_type, reference_id, notes
        ) VALUES (
            p_company_id, v_purchase.warehouse_id, v_item.product_id, v_item.variant_id, 'INGRESO_COMPRA',
            v_item.quantity_ordered, v_new_wh_physical, v_wh_reserved, v_new_wh_available,
            v_item.unit_cost, 'PURCHASE', p_purchase_id,
            'Recepción Orden #' || v_purchase.purchase_number || '. Nuevo costo PPP: $' || v_rounded_ppp
        );

        UPDATE purchase_items
        SET quantity_received = v_item.quantity_ordered
        WHERE id = v_item.id;
    END LOOP;

    UPDATE purchases
    SET status = 'RECEPCION_TOTAL', received_at = NOW(), updated_at = NOW()
    WHERE id = p_purchase_id;
END;
$$;

-- ==============================================================================
-- 8. RPC: AJUSTE MANUAL DE STOCK ATÓMICO
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_adjust_stock(
    p_company_id UUID,
    p_warehouse_id UUID,
    p_product_id UUID,
    p_variant_id UUID,
    p_type TEXT,
    p_quantity NUMERIC,
    p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stock_id UUID;
    v_physical NUMERIC(14, 4) := 0;
    v_reserved NUMERIC(14, 4) := 0;
    v_available NUMERIC(14, 4) := 0;
    v_new_physical NUMERIC(14, 4);
    v_new_available NUMERIC(14, 4);
    v_delta NUMERIC(14, 4);
    v_cost NUMERIC(14, 4) := 0;
    v_mov_id UUID;
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'La cantidad de ajuste debe ser mayor a 0.';
    END IF;

    SELECT id, physical_stock, reserved_stock
    INTO v_stock_id, v_physical, v_reserved
    FROM inventory_stock
    WHERE company_id = p_company_id
      AND warehouse_id = p_warehouse_id
      AND product_id = p_product_id
      AND variant_id IS NOT DISTINCT FROM p_variant_id
    FOR UPDATE;

    v_physical := COALESCE(v_physical, 0);
    v_reserved := COALESCE(v_reserved, 0);
    v_available := v_physical - v_reserved;

    IF p_type = 'SALIDA_AJUSTE' THEN
        IF p_quantity > v_available THEN
            RAISE EXCEPTION 'Stock insuficiente para el ajuste negativo. Disponible: % un., solicitado: % un.', v_available, p_quantity;
        END IF;
        v_new_physical := v_physical - p_quantity;
        v_delta := -p_quantity;
    ELSE
        v_new_physical := v_physical + p_quantity;
        v_delta := p_quantity;
    END IF;

    v_new_available := v_new_physical - v_reserved;

    IF v_stock_id IS NOT NULL THEN
        UPDATE inventory_stock
        SET physical_stock = v_new_physical, updated_at = NOW()
        WHERE id = v_stock_id;
    ELSE
        INSERT INTO inventory_stock (company_id, warehouse_id, product_id, variant_id, physical_stock, reserved_stock)
        VALUES (p_company_id, p_warehouse_id, p_product_id, p_variant_id, v_new_physical, 0);
    END IF;

    SELECT COALESCE(cost_price, 0) INTO v_cost FROM products WHERE id = p_product_id;

    INSERT INTO stock_movements (
        company_id, warehouse_id, product_id, variant_id, movement_type,
        quantity, balance_physical_after, balance_reserved_after, balance_available_after,
        unit_cost, reference_type, notes
    ) VALUES (
        p_company_id, p_warehouse_id, p_product_id, p_variant_id, p_type,
        v_delta, v_new_physical, v_reserved, v_new_available,
        v_cost, 'MANUAL_ADJUSTMENT', TRIM(p_reason)
    )
    RETURNING id INTO v_mov_id;

    RETURN v_mov_id;
END;
$$;

-- ==============================================================================
-- 9. RPC: TRANSFERENCIA ENTRE DEPÓSITOS ATÓMICA (CON UUID VÁLIDO)
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_transfer_stock(
    p_company_id UUID,
    p_origin_warehouse_id UUID,
    p_destination_warehouse_id UUID,
    p_product_id UUID,
    p_variant_id UUID,
    p_quantity NUMERIC,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transfer_id UUID := gen_random_uuid();
    v_transfer_number TEXT;
    v_origin_name TEXT;
    v_dest_name TEXT;
    v_orig_id UUID;
    v_orig_physical NUMERIC(14, 4);
    v_orig_reserved NUMERIC(14, 4);
    v_orig_available NUMERIC(14, 4);
    v_new_orig_physical NUMERIC(14, 4);
    v_new_orig_available NUMERIC(14, 4);
    v_dest_id UUID;
    v_dest_physical NUMERIC(14, 4);
    v_dest_reserved NUMERIC(14, 4);
    v_new_dest_physical NUMERIC(14, 4);
    v_new_dest_available NUMERIC(14, 4);
    v_cost NUMERIC(14, 4) := 0;
BEGIN
    IF p_origin_warehouse_id = p_destination_warehouse_id THEN
        RAISE EXCEPTION 'El depósito de origen y destino no pueden ser el mismo.';
    END IF;

    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'La cantidad a transferir debe ser mayor a 0.';
    END IF;

    v_transfer_number := 'TRF-' || LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');

    SELECT name INTO v_origin_name FROM warehouses WHERE id = p_origin_warehouse_id;
    SELECT name INTO v_dest_name FROM warehouses WHERE id = p_destination_warehouse_id;

    SELECT id, physical_stock, reserved_stock, available_stock
    INTO v_orig_id, v_orig_physical, v_orig_reserved, v_orig_available
    FROM inventory_stock
    WHERE company_id = p_company_id
      AND warehouse_id = p_origin_warehouse_id
      AND product_id = p_product_id
      AND variant_id IS NOT DISTINCT FROM p_variant_id
    FOR UPDATE;

    v_orig_available := COALESCE(v_orig_available, 0);
    IF v_orig_id IS NULL OR v_orig_available < p_quantity THEN
        RAISE EXCEPTION 'Stock disponible insuficiente en %. Disponible: % un., requerido: % un.',
            COALESCE(v_origin_name, 'Depósito Origen'), v_orig_available, p_quantity;
    END IF;

    SELECT COALESCE(cost_price, 0) INTO v_cost FROM products WHERE id = p_product_id;

    v_new_orig_physical := v_orig_physical - p_quantity;
    v_new_orig_available := v_new_orig_physical - v_orig_reserved;

    UPDATE inventory_stock
    SET physical_stock = v_new_orig_physical, updated_at = NOW()
    WHERE id = v_orig_id;

    INSERT INTO stock_movements (
        company_id, warehouse_id, product_id, variant_id, movement_type,
        quantity, balance_physical_after, balance_reserved_after, balance_available_after,
        unit_cost, reference_type, reference_id, notes
    ) VALUES (
        p_company_id, p_origin_warehouse_id, p_product_id, p_variant_id, 'TRANSFERENCIA_SALIDA',
        -p_quantity, v_new_orig_physical, v_orig_reserved, v_new_orig_available,
        v_cost, 'INTERNAL_TRANSFER', v_transfer_id,
        v_transfer_number || ' — ' || COALESCE(NULLIF(TRIM(p_reason), ''), 'Transferencia') || ' (Hacia ' || COALESCE(v_dest_name, 'Destino') || ')'
    );

    SELECT id, physical_stock, reserved_stock
    INTO v_dest_id, v_dest_physical, v_dest_reserved
    FROM inventory_stock
    WHERE company_id = p_company_id
      AND warehouse_id = p_destination_warehouse_id
      AND product_id = p_product_id
      AND variant_id IS NOT DISTINCT FROM p_variant_id
    FOR UPDATE;

    v_dest_physical := COALESCE(v_dest_physical, 0);
    v_dest_reserved := COALESCE(v_dest_reserved, 0);
    v_new_dest_physical := v_dest_physical + p_quantity;
    v_new_dest_available := v_new_dest_physical - v_dest_reserved;

    IF v_dest_id IS NOT NULL THEN
        UPDATE inventory_stock
        SET physical_stock = v_new_dest_physical, updated_at = NOW()
        WHERE id = v_dest_id;
    ELSE
        INSERT INTO inventory_stock (company_id, warehouse_id, product_id, variant_id, physical_stock, reserved_stock)
        VALUES (p_company_id, p_destination_warehouse_id, p_product_id, p_variant_id, v_new_dest_physical, 0);
    END IF;

    INSERT INTO stock_movements (
        company_id, warehouse_id, product_id, variant_id, movement_type,
        quantity, balance_physical_after, balance_reserved_after, balance_available_after,
        unit_cost, reference_type, reference_id, notes
    ) VALUES (
        p_company_id, p_destination_warehouse_id, p_product_id, p_variant_id, 'TRANSFERENCIA_ENTRADA',
        p_quantity, v_new_dest_physical, v_dest_reserved, v_new_dest_available,
        v_cost, 'INTERNAL_TRANSFER', v_transfer_id,
        v_transfer_number || ' — ' || COALESCE(NULLIF(TRIM(p_reason), ''), 'Recepción') || ' (Desde ' || COALESCE(v_origin_name, 'Origen') || ')'
    );

    RETURN jsonb_build_object(
        'transferNumber', v_transfer_number,
        'transferId', v_transfer_id,
        'createdAt', NOW()
    );
END;
$$;

-- ==============================================================================
-- 10. RPC: DEVOLUCIÓN DE VENTA ATÓMICA (CON CONTROL DE SALDO Y CAJA)
-- ==============================================================================
CREATE OR REPLACE FUNCTION rpc_process_sale_return(
    p_company_id UUID,
    p_sale_id UUID,
    p_warehouse_id UUID,
    p_reason TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale RECORD;
    v_return_id UUID;
    v_return_number TEXT;
    v_item JSONB;
    v_sale_item RECORD;
    v_already_returned NUMERIC(14, 2);
    v_req_qty NUMERIC(14, 2);
    v_total_refund NUMERIC(14, 2) := 0;
    v_stock_id UUID;
    v_physical NUMERIC(14, 4);
    v_reserved NUMERIC(14, 4);
    v_new_physical NUMERIC(14, 4);
    v_new_available NUMERIC(14, 4);
BEGIN
    SELECT * INTO v_sale FROM sales WHERE id = p_sale_id AND company_id = p_company_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta no encontrada.';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Debe especificar al menos un producto a devolver.';
    END IF;

    v_return_number := 'DEV-' || LPAD((FLOOR(RANDOM() * 900000) + 100000)::TEXT, 6, '0');

    INSERT INTO sale_returns (company_id, sale_id, warehouse_id, return_number, total_refund, reason)
    VALUES (p_company_id, p_sale_id, p_warehouse_id, v_return_number, 0, TRIM(p_reason))
    RETURNING id INTO v_return_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_req_qty := (v_item->>'quantity')::NUMERIC;
        IF v_req_qty <= 0 THEN
            CONTINUE;
        END IF;

        SELECT * INTO v_sale_item
        FROM sale_items
        WHERE id = (v_item->>'saleItemId')::UUID AND sale_id = p_sale_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Ítem de venta inválido.';
        END IF;

        SELECT COALESCE(SUM(quantity), 0) INTO v_already_returned
        FROM sale_return_items
        WHERE sale_item_id = v_sale_item.id;

        IF v_already_returned + v_req_qty > v_sale_item.quantity THEN
            RAISE EXCEPTION 'La cantidad a devolver (%) supera el saldo disponible de la venta (Vendido: %, Ya devuelto: %).',
                v_req_qty, v_sale_item.quantity, v_already_returned;
        END IF;

        INSERT INTO sale_return_items (
            return_id, sale_item_id, product_id, variant_id, quantity, unit_price, subtotal
        ) VALUES (
            v_return_id, v_sale_item.id, v_sale_item.product_id, v_sale_item.variant_id,
            v_req_qty, v_sale_item.unit_price, v_req_qty * v_sale_item.unit_price
        );

        v_total_refund := v_total_refund + (v_req_qty * v_sale_item.unit_price);

        SELECT id, physical_stock, reserved_stock
        INTO v_stock_id, v_physical, v_reserved
        FROM inventory_stock
        WHERE company_id = p_company_id
          AND warehouse_id = p_warehouse_id
          AND product_id = v_sale_item.product_id
          AND variant_id IS NOT DISTINCT FROM v_sale_item.variant_id
        FOR UPDATE;

        v_physical := COALESCE(v_physical, 0);
        v_reserved := COALESCE(v_reserved, 0);
        v_new_physical := v_physical + v_req_qty;
        v_new_available := v_new_physical - v_reserved;

        IF v_stock_id IS NOT NULL THEN
            UPDATE inventory_stock
            SET physical_stock = v_new_physical, updated_at = NOW()
            WHERE id = v_stock_id;
        ELSE
            INSERT INTO inventory_stock (company_id, warehouse_id, product_id, variant_id, physical_stock, reserved_stock)
            VALUES (p_company_id, p_warehouse_id, v_sale_item.product_id, v_sale_item.variant_id, v_new_physical, 0);
        END IF;

        INSERT INTO stock_movements (
            company_id, warehouse_id, product_id, variant_id, movement_type,
            quantity, balance_physical_after, balance_reserved_after, balance_available_after,
            unit_cost, reference_type, reference_id, notes
        ) VALUES (
            p_company_id, p_warehouse_id, v_sale_item.product_id, v_sale_item.variant_id, 'DEVOLUCION_CLIENTE',
            v_req_qty, v_new_physical, v_reserved, v_new_available,
            v_sale_item.historical_cost_price, 'SALE_RETURN', v_return_id,
            v_return_number || ' — ' || COALESCE(NULLIF(TRIM(p_reason), ''), 'Devolución') || ' (Venta: ' || v_sale.sale_number || ')'
        );
    END LOOP;

    IF v_total_refund <= 0 THEN
        RAISE EXCEPTION 'Debe ingresar al menos 1 unidad válida para devolver.';
    END IF;

    UPDATE sale_returns SET total_refund = v_total_refund WHERE id = v_return_id;

    -- Registrar egreso en caja chica si la venta original fue en efectivo
    IF v_sale.payment_method = 'EFECTIVO' THEN
        INSERT INTO cash_movements (
            company_id, movement_type, category, amount, description, voucher_number, responsible_name
        ) VALUES (
            p_company_id, 'EGRESO', 'DEVOLUCION_VENTA', v_total_refund,
            'Reembolso por devolución ' || v_return_number || ' (Venta ' || v_sale.sale_number || ')',
            v_return_number, 'Sistema'
        );
    END IF;

    RETURN jsonb_build_object(
        'returnId', v_return_id,
        'returnNumber', v_return_number,
        'totalRefund', v_total_refund,
        'createdAt', NOW()
    );
END;
$$;
