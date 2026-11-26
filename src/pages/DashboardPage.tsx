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
import { PageHeader, Button, Badge } from '@/presentation/components/ui';
import { createClient } from '@/utils/supabase/client';
import { getCompanyContext } from '@/utils/supabase/companyContext';
import { PosModal } from '@/presentation/modules/pos/PosModal';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { SupabaseSaleRepository } from '@/core/infrastructure/repositories/SupabaseSaleRepository';
import { ProcessDirectSaleUseCase } from '@/core/application/use-cases/sales/ProcessDirectSaleUseCase';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { Sale } from '@/core/domain/sales/types';
import { useUserRole } from '@/utils/security/UserRoleContext';

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
  const { permissions } = useUserRole();

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
    <div className="space-y-5">
      <PageHeader
        title="Control de Operaciones"
        backTo=""
        subtitle={
          <>
            <Building2 className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {company ? company.name : 'Stock-tock Casa Central'}
            </span>
            <span aria-hidden="true">•</span>
            <Calendar className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
            <span className="capitalize font-medium text-zinc-600 dark:text-zinc-400">{currentDate}</span>
          </>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPosOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-lime-400 dark:text-lime-600" aria-hidden="true" />}
          >
            Venta Rápida (POS)
          </Button>
        }
      />

      {/* Políticas de Integridad Comercial */}
      <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0" aria-hidden="true">
            <ShieldCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              Políticas de Integridad Comercial Activas
            </h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Bloqueo automático de stock negativo • Costos históricos inmutables • Kardex auditado
            </p>
          </div>
        </div>
        <Badge variant="brand" mono>
          PROTEGIDO
        </Badge>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Ventas Registradas"
          value={
            permissions.canViewFinancials
              ? `$${totalSalesAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
              : `${recentSales.length} op.`
          }
          trend={permissions.canViewFinancials ? `${recentSales.length} op.` : '(restringido)'}
          isPositive={true}
          subtitle="Cobrado en mostrador"
          icon={TrendingUp}
        />
        <MetricCard
          title="Stock Físico Real"
          value={`${totalPhysicalStock} un.`}
          trend={
            permissions.canViewFinancials
              ? `Valuado $${stockValuation.toLocaleString('es-AR')}`
              : 'Valuación restringida'
          }
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
        <section aria-label="Productos destacados del catálogo" className="lg:col-span-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Productos en Catálogo
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Existencia física real y precios de lista
              </p>
            </div>
            <Link
              to="/productos"
              className="text-xs text-sky-800 dark:text-sky-300 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300 flex items-center gap-1 font-semibold transition-colors"
            >
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {products.slice(0, 5).map((prod) => (
              <div
                key={prod.id}
                className="py-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 px-2 rounded-lg transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {prod.sku}
                    </span>
                    <Badge variant="neutral">
                      {prod.availableStock} un. disp.
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-900 dark:text-zinc-100 font-semibold">{prod.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                    {permissions.canViewFinancials
                      ? `Costo: $${prod.costPrice.toLocaleString('es-AR')} • Venta: $${prod.salePrice.toLocaleString('es-AR')}`
                      : `Venta: $${prod.salePrice.toLocaleString('es-AR')}`}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <p className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                    ${prod.salePrice.toLocaleString('es-AR')}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsPosOpen(true)}
                    aria-label={`Vender ${prod.name}`}
                  >
                    Vender
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Movimientos Kardex */}
        <section aria-label="Últimos movimientos del Kardex" className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-xs">
          <div className="pb-2.5 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Kardex de Inventario
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Últimos movimientos auditados</p>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4 font-medium">
                No hay movimientos registrados aún.
              </p>
            ) : (
              recentMovements.map((mov) => {
                const isNegative = Number(mov.quantity) < 0;
                return (
                  <div key={mov.id} className="py-2.5 flex items-start justify-between gap-2">
                    <div>
                      <Badge variant={isNegative ? 'danger' : 'success'} mono>
                        {mov.movement_type}
                      </Badge>
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
                        {mov.product?.name || mov.notes || 'Movimiento'}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        {new Date(mov.created_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-bold tabular-nums ${
                          isNegative ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {isNegative ? '' : '+'}{mov.quantity} un.
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
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
