import React, { useEffect, useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Calendar,
  PackageCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MetricCard } from '@/presentation/components/MetricCard';
import { createClient } from '@/utils/supabase/client';
import { getCompanyContext } from '@/utils/supabase/companyContext';
import { PosModal } from '@/presentation/modules/pos/PosModal';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseSaleRepository } from '@/core/infrastructure/repositories/SupabaseSaleRepository';
import { ProcessDirectSaleUseCase } from '@/core/application/use-cases/sales/ProcessDirectSaleUseCase';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { Sale } from '@/core/domain/sales/types';

interface CompanyData {
  id: string;
  name: string;
  primary_currency: string;
}

interface StockMovementRow {
  id: string;
  movement_type: string;
  quantity: number;
  balance_physical_after: number;
  created_at: string;
  notes?: string;
  product?: { name: string };
}

export function DashboardPage() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [defaultWarehouseId, setDefaultWarehouseId] = useState<string>('');
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovementRow[]>([]);
  const [isPosOpen, setIsPosOpen] = useState(false);

  const productRepo = useMemo(() => new SupabaseProductRepository(), []);
  const saleRepo = useMemo(() => new SupabaseSaleRepository(), []);
  const processSaleUseCase = useMemo(() => new ProcessDirectSaleUseCase(saleRepo), [saleRepo]);

  const loadData = async () => {
    try {
      const context = await getCompanyContext();
      if (!context) return;

      setCompany({
        id: context.companyId,
        name: context.companyName,
        primary_currency: 'ARS',
      });
      setDefaultWarehouseId(context.defaultWarehouseId);

      const supabase = createClient();

      // Carga paralela por HTTP/2 de todos los datos del dashboard en un solo roundtrip
      const [prods, salesRes, movsRes] = await Promise.all([
        productRepo.getProductsWithStock(context.companyId),
        supabase
          .from('sales')
          .select('*')
          .eq('company_id', context.companyId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('stock_movements')
          .select(
            'id, movement_type, quantity, balance_physical_after, created_at, notes, product:products(name)'
          )
          .eq('company_id', context.companyId)
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      setProducts(prods);
      setRecentSales((salesRes.data as any) || []);
      setRecentMovements((movsRes.data as any) || []);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
    }
  };

  useEffect(() => {
    loadData();
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString('es-AR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
    );

    const handleOpenPos = () => setIsPosOpen(true);
    window.addEventListener('stocktock:open-pos', handleOpenPos);
    return () => window.removeEventListener('stocktock:open-pos', handleOpenPos);
  }, [productRepo]);

  const handleCompleteSale = async (dataOrItems: any, maybePaymentMethod?: any, maybeNotes?: string) => {
    if (!company) return;

    const isObject = !Array.isArray(dataOrItems);
    const items = isObject ? dataOrItems.items : dataOrItems;
    const paymentMethod = isObject ? dataOrItems.paymentMethod : maybePaymentMethod;
    const notes = isObject ? dataOrItems.notes : maybeNotes;
    const customerName = isObject ? dataOrItems.customerName : undefined;
    const customerId = isObject ? dataOrItems.customerId : undefined;

    const sale = await processSaleUseCase.execute({
      items: items.map((it: any) => ({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
        productName: it.productName,
      })),
      paymentMethod,
      customerName,
      customerId,
      notes,
      companyId: company.id,
      warehouseId: defaultWarehouseId,
    });

    await loadData();
    return sale;
  };

  const totalPhysicalStock = products.reduce((acc, curr) => acc + (Number(curr.physicalStock) || 0), 0);
  const totalAvailableStock = products.reduce((acc, curr) => acc + (Number(curr.availableStock) || 0), 0);
  const totalReservedStock = products.reduce((acc, curr) => acc + (Number(curr.reservedStock) || 0), 0);
  const totalSalesAmount = recentSales.reduce(
    (acc, curr: any) => acc + (Number(curr.total_amount ?? curr.totalAmount) || 0),
    0
  );
  const stockValuation = products.reduce((acc, p) => acc + (Number(p.physicalStock) || 0) * (Number(p.costPrice) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
            <span className="font-semibold text-slate-800">
              {company ? company.name : 'Stock-tock Casa Central'}
            </span>
            <span aria-hidden="true">•</span>
            <Calendar className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <span className="capitalize font-medium text-slate-700">{currentDate}</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Control de Operaciones
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPosOpen(true)}
            className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Venta Rápida (POS)</span>
          </button>
        </div>
      </div>

      {/* Reglas de Negocio V1 Status Banner */}
      <div className="p-3.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-800 shrink-0" aria-hidden="true">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">
              Políticas de Integridad V1 Activas
            </h4>
            <p className="text-xs text-slate-600">
              Bloqueo automático de stock negativo • Costos históricos inmutables • Kardex auditado
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-300">
          PROTEGIDO
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Ventas Registradas"
          value={`$${totalSalesAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          trend={`${recentSales.length} op.`}
          isPositive={true}
          subtitle="Cobrado en mostrador"
          icon={TrendingUp}
        />
        <MetricCard
          title="Stock Físico Real"
          value={`${totalPhysicalStock} un.`}
          trend={`Valuado $${stockValuation.toLocaleString('es-AR')}`}
          isPositive={true}
          subtitle="Depósito central"
          icon={Boxes}
        />
        <MetricCard
          title="Stock Disponible"
          value={`${totalAvailableStock} un.`}
          trend="Disponible"
          isPositive={true}
          subtitle="Libre para venta"
          icon={PackageCheck}
        />
        <MetricCard
          title="Stock Reservado"
          value={`${totalReservedStock} un.`}
          trend="0 pedidos"
          isPositive={false}
          subtitle="Comprometido sin despachar"
          icon={Clock}
        />
      </div>

      {/* Main Grid: Products & Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Catálogo */}
        <section aria-label="Productos destacados del catálogo" className="lg:col-span-2 rounded-lg bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Productos en Catálogo
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                Existencia física real y precios de lista
              </p>
            </div>
            <Link
              to="/productos"
              className="text-xs text-blue-700 hover:text-blue-900 flex items-center gap-1 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-slate-900"
            >
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {products.slice(0, 5).map((prod) => (
              <div
                key={prod.id}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-800">
                      {prod.sku}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-300">
                      {prod.availableStock} un. disp.
                    </span>
                  </div>
                  <p className="text-xs text-slate-900 font-semibold">{prod.name}</p>
                  <p className="text-xs text-slate-600 font-mono">
                    Costo: ${prod.costPrice.toLocaleString('es-AR')} • Venta: ${prod.salePrice.toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-xs font-bold font-mono text-slate-900 tabular-nums">
                    ${prod.salePrice.toLocaleString('es-AR')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPosOpen(true)}
                    aria-label={`Vender ${prod.name}`}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
                  >
                    Vender
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Movimientos Kardex */}
        <section aria-label="Últimos movimientos del Kardex" className="rounded-lg bg-white border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="pb-2.5 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Kardex de Inventario
            </h3>
            <p className="text-xs text-slate-600 font-medium">Últimos movimientos auditados</p>
          </div>

          <div className="divide-y divide-slate-100">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-4 font-medium">
                No hay movimientos registrados aún.
              </p>
            ) : (
              recentMovements.map((mov) => {
                const isNegative = Number(mov.quantity) < 0;
                return (
                  <div key={mov.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                          isNegative
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {mov.movement_type}
                      </span>
                      <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                        {mov.product?.name || mov.notes || 'Movimiento'}
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        {new Date(mov.created_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          isNegative ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {isNegative ? '' : '+'}{mov.quantity} un.
                      </span>
                      <p className="text-xs text-slate-600 font-mono tabular-nums">
                        Saldo: {mov.balance_physical_after}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal POS */}
      <PosModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        products={products}
        companyId={company?.id || ''}
        companyName={company?.name || 'Stock·tock'}
        defaultWarehouseId={defaultWarehouseId}
        onCompleteSale={handleCompleteSale as any}
      />
    </div>
  );
}
