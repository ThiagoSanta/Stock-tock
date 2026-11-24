'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Boxes,
  Plus,
  ShoppingBag,
  TrendingUp,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Calendar,
  PackageCheck,
  Database,
} from 'lucide-react';
import Link from 'next/link';
import { MetricCard } from '@/presentation/components/MetricCard';
import { createClient } from '@/utils/supabase/client';
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

export default function DashboardPage() {
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
      const supabase = createClient();

      // Cargar empresa
      const { data: companies } = await supabase.from('companies').select('*').limit(1);
      if (companies && companies.length > 0) {
        const c = companies[0];
        setCompany(c);

        // Cargar depósito por defecto
        const { data: wh } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', c.id)
          .eq('is_default', true)
          .single();
        if (wh) setDefaultWarehouseId(wh.id);

        // Cargar productos con stock
        const prodsWithStock = await productRepo.findAllWithStock(c.id);
        setProducts(prodsWithStock);

        // Cargar ventas recientes
        const sales = await saleRepo.findRecentSales(c.id, 5);
        setRecentSales(sales);

        // Cargar movimientos de Kardex
        const { data: movs } = await supabase
          .from('stock_movements')
          .select('id, movement_type, quantity, balance_physical_after, created_at, notes, product:products(name)')
          .eq('company_id', c.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (movs) setRecentMovements(movs as any);
      }
    } catch (err) {
      console.error('Error cargando datos del dashboard:', err);
    }
  };

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'full',
      }).format(new Date())
    );
    loadData();
  }, [productRepo, saleRepo]);

  // Manejador para completar la venta desde el POS
  const handleCompleteSale = async (data: Parameters<typeof processSaleUseCase.execute>[0]) => {
    if (!company?.id || !defaultWarehouseId) {
      throw new Error('Empresa o depósito no configurado.');
    }

    const sale = await processSaleUseCase.execute({
      ...data,
      companyId: company.id,
      warehouseId: defaultWarehouseId,
    });

    // Recargar métricas y movimientos en tiempo real
    await loadData();
    return sale;
  };

  // Cálculos en tiempo real
  const totalPhysicalStock = products.reduce((acc, curr) => acc + curr.physicalStock, 0);
  const totalAvailableStock = products.reduce((acc, curr) => acc + curr.availableStock, 0);
  const totalReservedStock = products.reduce((acc, curr) => acc + curr.reservedStock, 0);
  const totalSalesAmount = recentSales.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const stockValuation = products.reduce((acc, p) => acc + p.physicalStock * p.costPrice, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#222226]">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#84cc16]" />
            <span className="font-medium text-zinc-300">
              {company ? company.name : 'Stock-tock Casa Central'}
            </span>
            <span>•</span>
            <Calendar className="w-3.5 h-3.5" />
            <span className="capitalize">{currentDate}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Control de Operaciones
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141518] border border-[#27272a] text-[11px] font-mono text-zinc-400">
            <Database className="w-3.5 h-3.5 text-[#84cc16]" />
            <span>Supabase Cloud Conectado</span>
          </div>
          <button
            onClick={() => setIsPosOpen(true)}
            className="h-9 px-4 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_20px_rgba(132,204,22,0.25)] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Venta Rápida (POS)</span>
          </button>
        </div>
      </div>

      {/* Políticas de Integridad */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#121410] to-[#121214] border border-[#84cc16]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-200">
              Políticas de Integridad Activas en Base de Datos
            </h4>
            <p className="text-[11px] text-zinc-400">
              Bloqueo automático de stock negativo • Costos históricos inmutables • Kardex auditado
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
          SISTEMA PROTEGIDO
        </span>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Ventas Registradas"
          value={`$${totalSalesAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
          trend={`${recentSales.length} op.`}
          isPositive={true}
          subtitle="Total cobrado en mostrador"
          icon={TrendingUp}
        />
        <MetricCard
          title="Stock Físico Real"
          value={`${totalPhysicalStock} un.`}
          trend={`Valuado $${stockValuation.toLocaleString('es-AR')}`}
          isPositive={true}
          subtitle="En depósito central"
          icon={Boxes}
        />
        <MetricCard
          title="Stock Disponible"
          value={`${totalAvailableStock} un.`}
          trend="Disponible"
          isPositive={true}
          subtitle="Libre para nuevas ventas"
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

      {/* Main Grid: Live Products & Audit Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Catálogo Real en Supabase (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#121214] border border-[#222226] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Productos en Catálogo
              </h3>
              <p className="text-xs text-zinc-500">
                Artículos cargados en Supabase con existencia física y precios
              </p>
            </div>
            <Link
              href="/productos"
              className="text-xs text-[#84cc16] hover:underline flex items-center gap-1 font-medium"
            >
              Ver catálogo completo <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {products.slice(0, 4).map((prod) => (
              <div
                key={prod.id}
                className="p-3.5 rounded-lg bg-[#161619] border border-[#222226] hover:border-[#2a2a30] transition-colors flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-zinc-400">
                      SKU: {prod.sku}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/30">
                      {prod.availableStock} disponibles
                    </span>
                  </div>
                  <p className="text-sm text-zinc-100 font-semibold">{prod.name}</p>
                  <p className="text-[11px] text-zinc-500">
                    Costo: ${prod.costPrice.toLocaleString('es-AR')} • Venta: ${prod.salePrice.toLocaleString('es-AR')}
                  </p>
                </div>

                <div className="text-right space-y-1.5">
                  <p className="text-sm font-bold font-mono text-[#84cc16]">
                    ${prod.salePrice.toLocaleString('es-AR')}
                  </p>
                  <button
                    onClick={() => setIsPosOpen(true)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#1f2024] hover:bg-[#27282e] text-zinc-200 border border-[#303036] transition-colors"
                  >
                    Vender Ahora
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Movimientos Auditados (Kardex) */}
        <div className="rounded-xl bg-[#121214] border border-[#222226] p-5 space-y-4">
          <div className="pb-3 border-b border-[#222226]">
            <h3 className="text-sm font-semibold text-zinc-100">
              Kardex de Inventario
            </h3>
            <p className="text-xs text-zinc-500">Últimos movimientos auditados</p>
          </div>

          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">
                No hay movimientos registrados aún.
              </p>
            ) : (
              recentMovements.map((mov) => {
                const isNegative = Number(mov.quantity) < 0;
                return (
                  <div
                    key={mov.id}
                    className="pb-3 border-b border-[#1c1c20] last:border-0 flex items-start justify-between gap-3"
                  >
                    <div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isNegative
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-[#84cc16]/10 text-[#84cc16]'
                        }`}
                      >
                        {mov.movement_type}
                      </span>
                      <p className="text-xs font-medium text-zinc-200 mt-1 line-clamp-1">
                        {mov.product?.name || mov.notes || 'Movimiento de Stock'}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(mov.created_at).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-mono font-bold ${
                          isNegative ? 'text-rose-400' : 'text-[#84cc16]'
                        }`}
                      >
                        {isNegative ? '' : '+'}{mov.quantity} un.
                      </span>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Saldo: {mov.balance_physical_after} un.
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal POS de Venta Rápida */}
      <PosModal
        isOpen={isPosOpen}
        onClose={() => setIsPosOpen(false)}
        products={products}
        companyId={company?.id || ''}
        onCompleteSale={handleCompleteSale as any}
      />
    </div>
  );
}
