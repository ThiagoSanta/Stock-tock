import React from 'react';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';
import { AlertTriangle, CheckCircle, PackageX } from 'lucide-react';

interface ProductTableProps {
  products: ProductWithStock[];
  loading: boolean;
}

export function ProductTable({ products, loading }: ProductTableProps) {
  if (loading) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 shadow-xs">
        <div className="w-5 h-5 border-2 border-slate-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500">Cargando catálogo...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg bg-white border border-slate-200 space-y-1 shadow-xs">
        <PackageX className="w-6 h-6 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-semibold text-slate-900">No se encontraron productos</h4>
        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
          No hay artículos que coincidan con la búsqueda o el filtro aplicado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-2.5 px-3">Producto & SKU</th>
              <th className="py-2.5 px-3">Unidad</th>
              <th className="py-2.5 px-3 text-right">Costo PPP</th>
              <th className="py-2.5 px-3 text-right">Precio Venta</th>
              <th className="py-2.5 px-3 text-center">Físico</th>
              <th className="py-2.5 px-3 text-center">Reservado</th>
              <th className="py-2.5 px-3 text-center">Disponible</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((item) => {
              const isOutOfStock = item.availableStock <= 0;
              const isLowStock = item.availableStock <= item.minStockAlert && !isOutOfStock;

              return (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2 px-3">
                    <span className="font-medium text-slate-900 block">{item.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      SKU: {item.sku}
                      {item.barcode && ` • ${item.barcode}`}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                    {item.unitOfMeasure}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-600">
                    ${item.costPrice.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                    ${item.salePrice.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-700">
                    {item.physicalStock}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-500">
                    {item.reservedStock}
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                    {item.availableStock}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isOutOfStock
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : isLowStock
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <PackageX className="w-3 h-3" /> Quiebre
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Bajo Stock
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" /> Normal
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
