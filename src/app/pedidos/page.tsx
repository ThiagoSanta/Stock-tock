'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Plus } from 'lucide-react';
import { Order, OrderStatus } from '@/core/domain/orders/types';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { SupabaseOrderRepository } from '@/core/infrastructure/repositories/SupabaseOrderRepository';
import { SupabaseProductRepository } from '@/core/infrastructure/repositories/SupabaseProductRepository';
import { CreateOrderUseCase } from '@/core/application/use-cases/orders/CreateOrderUseCase';
import { ConfirmOrderUseCase } from '@/core/application/use-cases/orders/ConfirmOrderUseCase';
import { DispatchOrderUseCase } from '@/core/application/use-cases/orders/DispatchOrderUseCase';
import { CancelOrderUseCase } from '@/core/application/use-cases/orders/CancelOrderUseCase';
import { OrderTable } from '@/presentation/modules/orders/OrderTable';
import { OrderModal } from '@/presentation/modules/orders/OrderModal';
import { OrderDetailModal } from '@/presentation/modules/orders/OrderDetailModal';
import { createClient } from '@/utils/supabase/client';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [companyId, setCompanyId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

  const orderRepo = useMemo(() => new SupabaseOrderRepository(), []);
  const productRepo = useMemo(() => new SupabaseProductRepository(), []);

  const createOrderUseCase = useMemo(() => new CreateOrderUseCase(orderRepo), [orderRepo]);
  const confirmOrderUseCase = useMemo(() => new ConfirmOrderUseCase(orderRepo), [orderRepo]);
  const dispatchOrderUseCase = useMemo(() => new DispatchOrderUseCase(orderRepo), [orderRepo]);
  const cancelOrderUseCase = useMemo(() => new CancelOrderUseCase(orderRepo), [orderRepo]);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: companies } = await supabase.from('companies').select('id').limit(1);

      if (companies && companies.length > 0) {
        const cId = companies[0].id;
        setCompanyId(cId);

        const { data: wh } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', cId)
          .eq('is_default', true)
          .single();
        if (wh) setWarehouseId(wh.id);

        const [ordersList, prods] = await Promise.all([
          orderRepo.findOrders(cId),
          productRepo.findAllWithStock(cId),
        ]);

        setOrders(ordersList);
        setProducts(prods);
      }
    } catch (err) {
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orderRepo, productRepo]);

  const handleCreateOrder = async (
    dto: Parameters<typeof createOrderUseCase.execute>[0]
  ) => {
    if (!companyId || !warehouseId) throw new Error('Empresa o depósito no configurado.');
    await createOrderUseCase.execute({
      ...dto,
      companyId,
      warehouseId,
    });
    await loadData();
  };

  const handleConfirmOrder = async (orderId: string) => {
    if (!companyId) return;
    await confirmOrderUseCase.execute(orderId, companyId);
    await loadData();
  };

  const handleDispatchOrder = async (orderId: string) => {
    if (!companyId) return;
    await dispatchOrderUseCase.execute(orderId, companyId);
    await loadData();
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!companyId) return;
    await cancelOrderUseCase.execute(orderId, companyId);
    await loadData();
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222226]">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <Link
              href="/"
              className="hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              Pedidos de Clientes
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-9 px-4 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-[0_0_15px_rgba(132,204,22,0.25)] transition-all flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Tabs de Filtro por Estado */}
      <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#141518] border border-[#27272a] text-xs w-fit overflow-x-auto">
        {[
          { id: 'ALL', label: 'Todos' },
          { id: 'BORRADOR', label: 'Borradores' },
          { id: 'CONFIRMADO', label: 'Reservas Activas' },
          { id: 'DESPACHADO_TOTAL', label: 'Despachados' },
          { id: 'CANCELADO', label: 'Cancelados' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              statusFilter === tab.id
                ? 'bg-[#22242a] text-[#84cc16]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tabla de Pedidos */}
      <OrderTable
        orders={filteredOrders}
        loading={loading}
        onSelectOrder={setSelectedOrder}
        onConfirmOrder={handleConfirmOrder}
        onDispatchOrder={handleDispatchOrder}
      />

      {/* Modal Crear Pedido */}
      <OrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        products={products}
        onCreateOrder={handleCreateOrder as any}
      />

      {/* Modal Detalle de Pedido */}
      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onConfirm={handleConfirmOrder}
        onDispatch={handleDispatchOrder}
        onCancel={handleCancelOrder}
      />
    </div>
  );
}
