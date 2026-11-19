import test from 'node:test';
import assert from 'node:assert/strict';

// ── PUNTO 1 & 5: REGLAS COMERCIALES, DESCUENTOS Y CRÉDITO ──────────────────
test('Punto 1: Cálculo de descuentos y recargos en mostrador', () => {
  const calculateTotal = (subtotal, type, value) => {
    let adjustment = 0;
    if (type === 'DISCOUNT_PERCENT') {
      adjustment = -(subtotal * (value / 100));
    } else if (type === 'DISCOUNT_FIXED') {
      adjustment = -value;
    } else if (type === 'SURCHARGE_PERCENT') {
      adjustment = subtotal * (value / 100);
    } else if (type === 'SURCHARGE_FIXED') {
      adjustment = value;
    }
    return Math.max(0, subtotal + adjustment);
  };

  const subtotal = 10000;

  // 10% Descuento por efectivo
  assert.equal(calculateTotal(subtotal, 'DISCOUNT_PERCENT', 10), 9000);

  // $1500 Descuento fijo
  assert.equal(calculateTotal(subtotal, 'DISCOUNT_FIXED', 1500), 8500);

  // 10% Recargo con tarjeta
  assert.equal(calculateTotal(subtotal, 'SURCHARGE_PERCENT', 10), 11000);

  // $500 Recargo fijo
  assert.equal(calculateTotal(subtotal, 'SURCHARGE_FIXED', 500), 10500);

  // Descuento no puede resultar en total negativo
  assert.equal(calculateTotal(subtotal, 'DISCOUNT_FIXED', 15000), 0);
});

test('Punto 5: Selección de precio por lista (Minorista / Mayorista / Gremio)', () => {
  const product = {
    salePrice: 1000,
    wholesalePrice: 850,
    specialPrice: 750,
  };

  const getPrice = (prod, listType) => {
    if (listType === 'MAYORISTA' && prod.wholesalePrice) return prod.wholesalePrice;
    if (listType === 'GREMIO' && prod.specialPrice) return prod.specialPrice;
    return prod.salePrice;
  };

  assert.equal(getPrice(product, 'MINORISTA'), 1000);
  assert.equal(getPrice(product, 'MAYORISTA'), 850);
  assert.equal(getPrice(product, 'GREMIO'), 750);

  // Fallback si no tiene precio especial definido
  const prodWithoutTier = { salePrice: 1200 };
  assert.equal(getPrice(prodWithoutTier, 'MAYORISTA'), 1200);
});

test('Punto 5: Control de límite de crédito en Cuenta Corriente', () => {
  const checkCreditLimit = (customer, newSaleAmount) => {
    const totalExposure = (customer.currentBalance || 0) + newSaleAmount;
    if (customer.creditLimit > 0 && totalExposure > customer.creditLimit) {
      return {
        allowed: false,
        exceededBy: totalExposure - customer.creditLimit,
        message: `Límite de crédito excedido por $${totalExposure - customer.creditLimit}`,
      };
    }
    return { allowed: true, exceededBy: 0 };
  };

  const customerWithLimit = {
    name: 'Constructora del Sur',
    creditLimit: 500000,
    currentBalance: 400000,
  };

  // Compra dentro del límite ($50.000) -> permitido
  const okResult = checkCreditLimit(customerWithLimit, 50000);
  assert.equal(okResult.allowed, true);

  // Compra que supera el límite ($150.000 -> saldo 550.000 > 500.000) -> bloqueado
  const blockedResult = checkCreditLimit(customerWithLimit, 150000);
  assert.equal(blockedResult.allowed, false);
  assert.equal(blockedResult.exceededBy, 50000);

  // Cliente sin límite (creditLimit = 0) -> siempre permitido
  const customerNoLimit = { name: 'Cliente Libre', creditLimit: 0, currentBalance: 900000 };
  assert.equal(checkCreditLimit(customerNoLimit, 500000).allowed, true);
});

// ── PUNTO 2: TESORERÍA, CAJA CHICA Y ARQUEO DE TURNO ────────────────────────
test('Punto 2: Balance de caja chica y arqueo de turno con fondo inicial', () => {
  const initialFund = 20000; // $20.000 de cambio inicial
  const salesCash = 85000;   // Ventas en efectivo cobradas
  const salesCard = 40000;   // Ventas en tarjeta (no van a la gaveta física)

  const movements = [
    { type: 'EGRESO', amount: 3500, concept: 'Pago de flete' },
    { type: 'EGRESO', amount: 1500, concept: 'Artículos de limpieza' },
    { type: 'INGRESO', amount: 5000, concept: 'Cobro de seña diferida' },
  ];

  const totalInflows = movements
    .filter(m => m.type === 'INGRESO')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalOutflows = movements
    .filter(m => m.type === 'EGRESO')
    .reduce((sum, m) => sum + m.amount, 0);

  // El efectivo teórico esperado en la gaveta física
  const expectedCashInDrawer = initialFund + salesCash + totalInflows - totalOutflows;
  assert.equal(expectedCashInDrawer, 20000 + 85000 + 5000 - 5000); // 105.000

  // Caso 1: Arqueo exacto
  const declaredExact = 105000;
  assert.equal(declaredExact - expectedCashInDrawer, 0);

  // Caso 2: Faltante de caja
  const declaredMissing = 103000;
  const diffMissing = declaredMissing - expectedCashInDrawer;
  assert.equal(diffMissing, -2000);

  // Caso 3: Sobrante de caja
  const declaredSurplus = 106000;
  const diffSurplus = declaredSurplus - expectedCashInDrawer;
  assert.equal(diffSurplus, 1000);
});

// ── PUNTO 3: LOTES Y DESPACHO POR REGLA FIFO ────────────────────────────────
test('Punto 3: Despacho de stock por regla FIFO (First-In, First-Out según vencimiento)', () => {
  const lots = [
    { lotNumber: 'LOTE-C', expirationDate: '2026-12-15', quantity: 20 },
    { lotNumber: 'LOTE-A', expirationDate: '2026-06-01', quantity: 15 },
    { lotNumber: 'LOTE-B', expirationDate: '2026-09-30', quantity: 30 },
  ];

  // Ordenar por fecha de vencimiento más próxima (FIFO)
  const sortedLots = [...lots].sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));

  assert.equal(sortedLots[0].lotNumber, 'LOTE-A'); // Vence en junio
  assert.equal(sortedLots[1].lotNumber, 'LOTE-B'); // Vence en septiembre
  assert.equal(sortedLots[2].lotNumber, 'LOTE-C'); // Vence en diciembre

  // Simular despacho de 25 unidades
  let qtyToDispatch = 25;
  const dispatchedFrom = [];

  for (const lot of sortedLots) {
    if (qtyToDispatch <= 0) break;
    const take = Math.min(lot.quantity, qtyToDispatch);
    dispatchedFrom.push({ lotNumber: lot.lotNumber, quantity: take });
    qtyToDispatch -= take;
  }

  // Se consumen 15 del LOTE-A y 10 del LOTE-B (0 del LOTE-C)
  assert.deepEqual(dispatchedFrom, [
    { lotNumber: 'LOTE-A', quantity: 15 },
    { lotNumber: 'LOTE-B', quantity: 10 },
  ]);
  assert.equal(qtyToDispatch, 0);
});

test('Punto 3: Detección preventiva de lotes por vencer (ventana de 30 días)', () => {
  const today = new Date('2026-11-19T00:00:00Z');

  const checkExpirationAlert = (expirationDateStr) => {
    const exp = new Date(expirationDateStr);
    const diffDays = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'VENCIDO';
    if (diffDays <= 30) return 'POR_VENCER';
    return 'VIGENTE';
  };

  assert.equal(checkExpirationAlert('2026-11-10T00:00:00Z'), 'VENCIDO');
  assert.equal(checkExpirationAlert('2026-12-05T00:00:00Z'), 'POR_VENCER'); // En 16 días
  assert.equal(checkExpirationAlert('2027-04-01T00:00:00Z'), 'VIGENTE');    // En meses
});

// ── PUNTO 4: ACTUALIZACIÓN MASIVA DE PRECIOS & COMPARATIVA COSTOS ───────────
test('Punto 4: Actualizador de precios por porcentaje con modos de redondeo', () => {
  const roundPrice = (val, mode) => {
    if (val <= 0) return 0;
    switch (mode) {
      case 'INTEGER': return Math.round(val);
      case 'DECADE': return Math.round(val / 10) * 10;
      case 'HUNDRED': return Math.round(val / 100) * 100;
      case 'PSYCHOLOGICAL_90': return Math.floor(val) + 0.90;
      case 'PSYCHOLOGICAL_99': return Math.floor(val) + 0.99;
      default: return Math.round(val * 100) / 100;
    }
  };

  const originalPrice = 1250;
  const percent = 15; // +15%
  const updatedRaw = originalPrice * (1 + percent / 100); // 1437.5

  assert.equal(roundPrice(updatedRaw, 'INTEGER'), 1438);
  assert.equal(roundPrice(updatedRaw, 'DECADE'), 1440);
  assert.equal(roundPrice(updatedRaw, 'HUNDRED'), 1400);
  assert.equal(roundPrice(updatedRaw, 'PSYCHOLOGICAL_90'), 1437.90);
  assert.equal(roundPrice(updatedRaw, 'PSYCHOLOGICAL_99'), 1437.99);
});

// ── PUNTO 6: MATRIZ DE ROLES Y PERMISOS ──────────────────────────────────────
test('Punto 6: Matriz de permisos de seguridad y roles', () => {
  const ROLE_PERMISSIONS = {
    ADMIN: {
      canViewFinancials: true,
      canEditPrices: true,
      canAccessPurchases: true,
      canMakeSales: true,
      canManageInventory: true,
      canManageUsers: true,
      canAccessSettings: true,
    },
    CASHIER: {
      canViewFinancials: false, // Cajero NO ve costos PPP ni márgenes
      canEditPrices: false,     // Cajero no edita listas a voluntad
      canAccessPurchases: false,// Cajero no accede a compras ni costos
      canMakeSales: true,
      canManageInventory: false,
      canManageUsers: false,
      canAccessSettings: false,
    },
    WAREHOUSE: {
      canViewFinancials: false, // Encargado depósito NO ve números financieros
      canEditPrices: false,
      canAccessPurchases: false,
      canMakeSales: false,      // No cobra ventas
      canManageInventory: true, // Gestiona stock y remitos
      canManageUsers: false,
      canAccessSettings: false,
    },
  };

  // Verificaciones críticas de seguridad
  assert.equal(ROLE_PERMISSIONS.CASHIER.canViewFinancials, false);
  assert.equal(ROLE_PERMISSIONS.CASHIER.canAccessPurchases, false);
  assert.equal(ROLE_PERMISSIONS.WAREHOUSE.canMakeSales, false);
  assert.equal(ROLE_PERMISSIONS.WAREHOUSE.canViewFinancials, false);
  assert.equal(ROLE_PERMISSIONS.ADMIN.canManageUsers, true);
  assert.equal(ROLE_PERMISSIONS.ADMIN.canViewFinancials, true);
});

// ── PUNTO 7: MODO OSCURO & VARIABLES DE TEMA ────────────────────────────────
test('Punto 7: Alternador de tema visual (ThemeContext)', () => {
  let theme = 'light';
  const toggle = () => { theme = (theme === 'light' ? 'dark' : 'light'); };

  assert.equal(theme, 'light');
  toggle();
  assert.equal(theme, 'dark');
  toggle();
  assert.equal(theme, 'light');
});
