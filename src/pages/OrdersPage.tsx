import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingBag, Plus } from 'lucide-react';
import { PageHeader, Button } from '@/presentation/components/ui';
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
      <PageHeader
        title="Pedidos de Clientes"
        icon={<ShoppingBag className="w-3.5 h-3.5" />}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4 text-lime-400 dark:text-lime-600" />}
          >
            Nuevo Pedido
          </Button>
        }
      />

      {/* Tabs de Filtro por Estado */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs w-fit overflow-x-auto">
        {[
          { id: 'ALL', label: 'Todos' },
          { id: 'BORRADOR', label: 'Borradores' },
          { id: 'CONFIRMADO', label: 'Reservas Activas' },
          { id: 'DESPACHADO_TOTAL', label: 'Despachados' },
          { id: 'CANCELADO', label: 'Cancelados' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              statusFilter === tab.id
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
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
