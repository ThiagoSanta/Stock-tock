import React from 'react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { AlertTriangle, CheckCircle, PackageX, MapPin, Layers, Lock } from 'lucide-react';
import { useUserRole } from '@/utils/security/UserRoleContext';
import { DataTable, Badge, Button } from '@/presentation/components/ui';

interface ProductTableProps {
  products: ProductWithStock[];
  loading: boolean;
  onOpenLots?: (product: ProductWithStock) => void;
}

export function ProductTable({ products, loading, onOpenLots }: ProductTableProps) {
  const { permissions } = useUserRole();

  return (
    <DataTable
      caption="Listado completo de productos en catálogo y sus stocks"
      loading={loading}
      loadingText="Cargando catálogo de productos..."
      isEmpty={products.length === 0}
      emptyTitle="No se encontraron productos"
      emptyDescription="No hay artículos que coincidan con la búsqueda o el filtro aplicado."
      emptyIcon={<PackageX className="w-6 h-6" />}
    >
      <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase tracking-wider text-[11px] font-bold">
        <tr>
          <th scope="col" className="py-2.5 px-3">Producto & SKU</th>
          <th scope="col" className="py-2.5 px-3">Ubicación</th>
          <th scope="col" className="py-2.5 px-3">Unidad</th>
          <th scope="col" className="py-2.5 px-3 text-right">Costo PPP</th>
          <th scope="col" className="py-2.5 px-3 text-right">Precio Venta</th>
          <th scope="col" className="py-2.5 px-3 text-center">Físico</th>
          <th scope="col" className="py-2.5 px-3 text-center">Reservado</th>
          <th scope="col" className="py-2.5 px-3 text-center">Disponible</th>
          <th scope="col" className="py-2.5 px-3 text-center">Mínimo</th>
          <th scope="col" className="py-2.5 px-3 text-center">Estado</th>
          <th scope="col" className="py-2.5 px-3 text-center">Lotes</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
        {products.map((item) => {
          const isOutOfStock = item.availableStock <= 0;
          const isLowStock = item.availableStock <= item.minStockAlert && !isOutOfStock;

          return (
            <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
              <td className="py-2.5 px-3">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">{item.name}</span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                  SKU: {item.sku}
                  {item.barcode && ` • ${item.barcode}`}
                </span>
              </td>
              <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 text-xs">
                {item.storageLocation ? (
                  <span className="inline-flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-medium">
                    <MapPin className="w-3 h-3 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    {item.storageLocation}
                  </span>
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-600">—</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
                {item.unitOfMeasure}
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-zinc-700 dark:text-zinc-300 tabular-nums">
                {permissions.canViewFinancials ? (
                  `$${item.costPrice.toFixed(2)}`
                ) : (
                  <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs flex items-center justify-end gap-1" title="Confidencial (Solo Administradores)">
                    <Lock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                    <span>***</span>
                  </span>
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 block">${item.salePrice.toFixed(2)}</span>
                {(item.wholesalePrice || item.specialPrice) ? (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 space-y-0.5 mt-0.5">
                    {item.wholesalePrice ? <div>May: ${item.wholesalePrice.toFixed(2)}</div> : null}
                    {item.specialPrice ? <div>Grem: ${item.specialPrice.toFixed(2)}</div> : null}
                  </div>
                ) : null}
              </td>
              <td className="py-2.5 px-3 text-center font-mono text-zinc-800 dark:text-zinc-200 tabular-nums font-medium">
                {item.physicalStock}
              </td>
              <td className="py-2.5 px-3 text-center font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
                {item.reservedStock}
              </td>
              <td className="py-2.5 px-3 text-center font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {item.availableStock}
              </td>
              <td className="py-2.5 px-3 text-center font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                {item.minStockAlert ? `${item.minStockAlert} un.` : '—'}
              </td>
              <td className="py-2.5 px-3 text-center">
                <Badge
                  variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
                >
                  {isOutOfStock ? (
                    <>
                      <PackageX className="w-3 h-3" aria-hidden="true" /> Quiebre
                    </>
                  ) : isLowStock ? (
                    <>
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Bajo Stock
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" aria-hidden="true" /> Normal
                    </>
                  )}
                </Badge>
              </td>
              <td className="py-2.5 px-3 text-center">
                {onOpenLots && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenLots(item)}
                    title="Gestionar lotes y vencimientos FIFO"
                    leftIcon={<Layers className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />}
                  >
                    Lotes
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}
