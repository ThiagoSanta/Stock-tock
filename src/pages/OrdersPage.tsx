import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { getCompanyContext } from '@/utils/supabase/companyContext';

export function OrdersPage() {
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
      const context = await getCompanyContext();
      if (context) {
        setCompanyId(context.companyId);
        setWarehouseId(context.defaultWarehouseId);

        const [ordersList, prods] = await Promise.all([
          orderRepo.findOrders(context.companyId),
          productRepo.getProductsWithStock(context.companyId),
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link
              to="/"
              className="hover:text-slate-700 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Pedidos de Clientes
            </h1>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="h-8 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Tabs de Filtro por Estado */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 text-xs w-fit overflow-x-auto">
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
            className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
