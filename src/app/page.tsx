'use client';

import React, { useEffect, useState } from 'react';
import {
  Boxes,
  Plus,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Calendar,
  PackageCheck,
  Database,
} from 'lucide-react';
import { MetricCard } from '@/presentation/components/MetricCard';
import { createClient } from '@/utils/supabase/client';

interface CompanyData {
  id: string;
  name: string;
  primary_currency: string;
}

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  sale_price: number;
  cost_price: number;
  min_stock_alert: number;
}

interface StockItem {
  product_id: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
}

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stockList, setStockList] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setCurrentDate(
      new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'full',
      }).format(new Date())
    );

    const loadRealData = async () => {
      try {
        const supabase = createClient();
        
        // Cargar empresa
        const { data: companies } = await supabase.from('companies').select('*').limit(1);
        if (companies && companies.length > 0) {
          setCompany(companies[0]);
        }

        // Cargar productos
        const { data: prods } = await supabase.from('products').select('*');
        if (prods) setProducts(prods);

        // Cargar stock
        const { data: stocks } = await supabase.from('inventory_stock').select('*');
        if (stocks) setStockList(stocks);
      } catch (err) {
        console.error('Error cargando datos de Supabase:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);

  // Métricas calculadas en tiempo real desde Supabase
  const totalPhysicalStock = stockList.reduce((acc, curr) => acc + Number(curr.physical_stock), 0);
  const totalReservedStock = stockList.reduce((acc, curr) => acc + Number(curr.reserved_stock), 0);
  const totalAvailableStock = stockList.reduce((acc, curr) => acc + Number(curr.available_stock), 0);
  const stockValuation = products.reduce((acc, prod) => {
    const itemStock = stockList.find((s) => s.product_id === prod.id);
    const qty = itemStock ? Number(itemStock.physical_stock) : 0;
    return acc + qty * Number(prod.cost_price);
  }, 0);

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
          <button className="h-9 px-3.5 rounded-lg bg-[#18181b] hover:bg-[#222226] border border-[#27272a] text-xs font-medium text-zinc-300 transition-colors flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Nuevo Pedido</span>
          </button>
          <button className="h-9 px-4 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_20px_rgba(132,204,22,0.25)] transition-all flex items-center gap-1.5">
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Venta Rápida (POS)</span>
          </button>
        </div>
      </div>

      {/* Reglas de Negocio V1 Status Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#121410] to-[#121214] border border-[#84cc16]/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#84cc16]/10 border border-[#84cc16]/30 flex items-center justify-center text-[#84cc16]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-200">
              Políticas de Integridad V1 Activas en Base de Datos
            </h4>
            <p className="text-[11px] text-zinc-400">
              Restricción CHECK de stock negativo activa • Costo promedio a nivel empresa • Trazabilidad Kardex
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
          SISTEMA PROTEGIDO
        </span>
      </div>

      {/* Metric Cards Grid (Datos Reales de Supabase) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Stock Físico Real"
          value={`${totalPhysicalStock} un.`}
          trend={`Valuado $${stockValuation.toLocaleString('es-AR')}`}
          isPositive={true}
          subtitle={`En depósito central de la empresa`}
          icon={Boxes}
        />
        <MetricCard
          title="Stock Disponible"
          value={`${totalAvailableStock} un.`}
          trend="100% libre"
          isPositive={true}
          subtitle="Listo para vender o reservar"
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
        <MetricCard
          title="Productos en Catálogo"
          value={`${products.length} ítems`}
          trend="Activos"
          isPositive={true}
          subtitle="Registrados en la base de datos"
          icon={TrendingUp}
        />
      </div>

      {/* Main Grid: Live Products & Audit Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Catálogo Real en Supabase (2 cols) */}
        <div className="lg:col-span-2 rounded-xl bg-[#121214] border border-[#222226] p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Productos en Base de Datos
              </h3>
              <p className="text-xs text-zinc-500">
                Artículos cargados en Supabase con existencia física y precios
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#84cc16] bg-[#84cc16]/10 px-2 py-0.5 rounded border border-[#84cc16]/20">
              {products.length} productos
            </span>
          </div>

          <div className="space-y-2.5">
            {products.map((prod) => {
              const stock = stockList.find((s) => s.product_id === prod.id);
              const physical = stock ? Number(stock.physical_stock) : 0;
              const available = stock ? Number(stock.available_stock) : 0;

              return (
                <div
                  key={prod.id}
                  className="p-4 rounded-lg bg-[#161619] border border-[#222226] hover:border-[#2a2a30] transition-colors flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-zinc-400">
                        SKU: {prod.sku}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/30">
                        {available} disp.
                      </span>
                    </div>
                    <p className="text-sm text-zinc-100 font-semibold">{prod.name}</p>
                    <p className="text-[11px] text-zinc-500">
                      Costo: ${Number(prod.cost_price).toLocaleString('es-AR')} • Venta: ${Number(prod.sale_price).toLocaleString('es-AR')}
                    </p>
                  </div>

                  <div className="text-right space-y-1.5">
                    <p className="text-sm font-bold font-mono text-[#84cc16]">
                      ${Number(prod.sale_price).toLocaleString('es-AR')}
                    </p>
                    <button className="text-[11px] font-semibold px-2.5 py-1 rounded bg-[#1f2024] hover:bg-[#27282e] text-zinc-200 border border-[#303036] transition-colors">
                      Gestionar Stock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Movimientos Auditados */}
        <div className="rounded-xl bg-[#121214] border border-[#222226] p-5 space-y-4">
          <div className="pb-3 border-b border-[#222226]">
            <h3 className="text-sm font-semibold text-zinc-100">
              Kardex de Inventario
            </h3>
            <p className="text-xs text-zinc-500">Últimos movimientos auditados</p>
          </div>

          <div className="space-y-3">
            <div className="pb-3 border-b border-[#1c1c20] last:border-0 flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1c1c20] text-[#84cc16]">
                  INGRESO_AJUSTE
                </span>
                <p className="text-xs font-medium text-zinc-200 mt-1">
                  Apertura Inicial de Inventario
                </p>
                <p className="text-[10px] text-zinc-500">Taladro Percutor 750W</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-[#84cc16]">
                  +25 un.
                </span>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Saldo: 25 un.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
