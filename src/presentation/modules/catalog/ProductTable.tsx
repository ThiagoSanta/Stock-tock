'use client';

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
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226]">
        <div className="w-6 h-6 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-zinc-400">Cargando catálogo desde Supabase...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-12 text-center rounded-xl bg-[#121214] border border-[#222226] space-y-2">
        <PackageX className="w-8 h-8 text-zinc-600 mx-auto" />
        <h4 className="text-sm font-semibold text-zinc-300">No se encontraron productos</h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No hay artículos que coincidan con la búsqueda o el filtro aplicado.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#161619] border-b border-[#222226] text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
            <tr>
              <th className="py-3 px-4">Producto & SKU</th>
              <th className="py-3 px-4">Unidad</th>
              <th className="py-3 px-4 text-right">Costo PPP</th>
              <th className="py-3 px-4 text-right">Precio Venta</th>
              <th className="py-3 px-4 text-center">Físico</th>
              <th className="py-3 px-4 text-center">Reservado</th>
              <th className="py-3 px-4 text-center">Disponible</th>
              <th className="py-3 px-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c20]">
            {products.map((item) => {
              const isOutOfStock = item.availableStock <= 0;
              const isLowStock = item.availableStock <= item.minStockAlert && !isOutOfStock;

              return (
                <tr key={item.id} className="hover:bg-[#16161a] transition-colors">
                  {/* Nombre y SKU */}
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-zinc-100 block">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-zinc-500">
                        SKU: {item.sku}
                      </span>
                      {item.barcode && (
                        <span className="font-mono text-[10px] text-zinc-600">
                          EAN: {item.barcode}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Unidad */}
                  <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                    {item.unitOfMeasure}
                  </td>

                  {/* Costo PPP */}
                  <td className="py-3.5 px-4 text-right font-mono text-zinc-400">
                    ${item.costPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Precio Venta */}
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-100">
                    ${item.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>

                  {/* Físico */}
                  <td className="py-3.5 px-4 text-center font-mono font-medium text-zinc-300">
                    {item.physicalStock}
                  </td>

                  {/* Reservado */}
                  <td className="py-3.5 px-4 text-center font-mono text-zinc-500">
                    {item.reservedStock}
                  </td>

                  {/* Disponible */}
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#84cc16]">
                    {item.availableStock}
                  </td>

                  {/* Estado Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <PackageX className="w-3 h-3" />
                        <span>Agotado</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Bajo Mínimo</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#84cc16]/10 text-[#84cc16] border border-[#84cc16]/20">
                        <CheckCircle className="w-3 h-3" />
                        <span>Normal</span>
                      </span>
                    )}
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
