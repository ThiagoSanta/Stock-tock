import React, { useState } from 'react';
import {
  X,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Building2,
  Boxes,
} from 'lucide-react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { createClient } from '@/utils/supabase/client';

interface SaleReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleWithDetails | null;
  companyName: string;
  onReturnComplete: () => void;
}

export function SaleReturnModal({
  isOpen,
  onClose,
  sale,
  companyName,
  onReturnComplete,
}: SaleReturnModalProps) {
  // Cantidades a devolver por cada ítem: itemId -> string
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});
  const [reason, setReason] = useState('Devolución de mercadería / Cambio de mostrador');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnVoucher, setReturnVoucher] = useState<{
    returnNumber: string;
    items: Array<{ name: string; qty: number; unitPrice: number; subtotal: number }>;
    totalRefund: number;
    date: string;
  } | null>(null);

  if (!isOpen || !sale) return null;

  const handleQtyChange = (itemId: string, val: string, maxQty: number) => {
    const num = parseFloat(val) || 0;
    if (num > maxQty) return;
    setReturnQtys((prev) => ({ ...prev, [itemId]: val }));
  };

  const itemsToReturn = sale.items
    .map((item) => {
      const q = parseFloat(returnQtys[item.id] || '0') || 0;
      return {
        ...item,
        returnQty: q,
        refundSubtotal: q * item.unitPrice,
      };
    })
    .filter((it) => it.returnQty > 0);

  const totalRefund = itemsToReturn.reduce((sum, it) => sum + it.refundSubtotal, 0);

  const handleProcessReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsToReturn.length === 0) {
      setError('Debes ingresar al menos 1 unidad para devolver.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const returnNumber = `DEV-${Math.floor(100000 + Math.random() * 900000)}`;

      // Resolver ID del depósito de la venta
      let effectiveWarehouseId = sale.warehouseId || (sale as any).warehouse_id;
      if (!effectiveWarehouseId) {
        const { data: wh } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', sale.companyId)
          .eq('is_default', true)
          .maybeSingle();
        effectiveWarehouseId = wh?.id;
      }
      if (!effectiveWarehouseId) {
        const { data: anyWh } = await supabase
          .from('warehouses')
          .select('id')
          .eq('company_id', sale.companyId)
          .limit(1)
          .maybeSingle();
        effectiveWarehouseId = anyWh?.id || '';
      }

      for (const item of itemsToReturn) {
        // 1. Obtener stock actual en el depósito
        const { data: stockRow } = await supabase
          .from('inventory_stock')
          .select('id, physical_stock, reserved_stock')
          .eq('company_id', sale.companyId)
          .eq('warehouse_id', effectiveWarehouseId)
          .eq('product_id', item.productId)
          .maybeSingle();

        const currentPhysical = Number(stockRow?.physical_stock || 0);
        const currentReserved = Number(stockRow?.reserved_stock || 0);
        const newPhysical = currentPhysical + item.returnQty;
        const newAvailable = newPhysical - currentReserved;

        // 2. Incrementar stock físico
        if (stockRow) {
          await supabase
            .from('inventory_stock')
            .update({
              physical_stock: newPhysical,
              updated_at: new Date().toISOString(),
            })
            .eq('id', stockRow.id);
        } else if (effectiveWarehouseId) {
          await supabase.from('inventory_stock').insert({
            company_id: sale.companyId,
            warehouse_id: effectiveWarehouseId,
            product_id: item.productId,
            variant_id: item.variantId || null,
            physical_stock: newPhysical,
            reserved_stock: 0,
          });
        }

        // 3. Asentar movimiento DEVOLUCION_CLIENTE en Kardex
        await supabase.from('stock_movements').insert({
          company_id: sale.companyId,
          warehouse_id: effectiveWarehouseId || null,
          product_id: item.productId,
          variant_id: item.variantId || null,
          movement_type: 'DEVOLUCION_CLIENTE',
          quantity: item.returnQty,
          balance_physical_after: newPhysical,
          balance_reserved_after: currentReserved,
          balance_available_after: newAvailable,
          unit_cost: item.historicalCostPrice,
          reference_type: 'SALE_RETURN',
          reference_id: returnNumber,
          notes: `${reason.trim()} (Venta origen: ${sale.saleNumber})`,
        });
      }

      setReturnVoucher({
        returnNumber,
        items: itemsToReturn.map((it) => ({
          name: it.productName,
          qty: it.returnQty,
          unitPrice: it.unitPrice,
          subtotal: it.refundSubtotal,
        })),
        totalRefund,
        date: new Date().toLocaleString('es-AR'),
      });

      onReturnComplete();
    } catch (err: any) {
      console.error('Error al procesar devolución:', err);
      setError(err.message || 'Error al procesar la devolución en Kardex.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal */}
        <div className="h-13 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-700 text-white flex items-center justify-center">
              <Undo2 className="w-4 h-4" />
            </div>
            <h3 id="return-modal-title" className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Devolución de Mercadería & Reingreso a Stock
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {returnVoucher ? (
          <div className="p-6 space-y-5">
            <div
              id="printable-a4-voucher"
              className="p-6 rounded-xl border-2 border-slate-900 bg-white space-y-4 font-sans text-xs text-slate-900 leading-normal"
            >
              <div className="flex items-start justify-between pb-4 border-b border-slate-300">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase">{companyName}</h4>
                  <p className="text-[11px] text-slate-500">Nota de Crédito Interna / Comprobante de Devolución</p>
                  <p className="text-[10px] text-slate-400">Venta Origen: {sale.saleNumber}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-700 text-white">
                    {returnVoucher.returnNumber}
                  </span>
                  <p className="text-[11px] font-mono text-slate-500 mt-1">{returnVoucher.date}</p>
                </div>
              </div>

              <div>
                <p className="mb-2">
                  Cliente: <strong className="font-semibold text-slate-900">{sale.customerName}</strong>
                </p>

                <table className="w-full text-left text-xs border-collapse border border-slate-200 rounded">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-1.5 px-3">Artículo Reingresado</th>
                      <th className="py-1.5 px-3 text-center">Cant.</th>
                      <th className="py-1.5 px-3 text-right">Precio</th>
                      <th className="py-1.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {returnVoucher.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 font-sans font-medium text-slate-900">{it.name}</td>
                        <td className="py-1.5 px-3 text-center">{it.qty} un.</td>
                        <td className="py-1.5 px-3 text-right">${it.unitPrice.toLocaleString('es-AR')}</td>
                        <td className="py-1.5 px-3 text-right font-bold">${it.subtotal.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-xs text-rose-950 uppercase">Crédito a Favor / Reintegro:</span>
                <span className="font-mono text-base font-bold text-rose-900 tabular-nums">
                  ${returnVoucher.totalRefund.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center border-t border-slate-200">
                <div className="border-t border-slate-400 pt-1.5">
                  <p className="font-bold text-slate-900 text-[11px]">Recepción de Stock / Depósito</p>
                  <p className="text-[10px] text-slate-500">Mercadería reingresada a Kardex</p>
                </div>
                <div className="border-t border-slate-400 pt-1.5">
                  <p className="font-bold text-slate-900 text-[11px]">Conformidad del Cliente</p>
                  <p className="text-[10px] text-slate-500">Firma y Aclaración</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Nota de Crédito A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleProcessReturn} className="p-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 font-medium"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Comprobante Seleccionado
                </span>
                <span className="font-mono font-bold text-slate-900">{sale.saleNumber}</span>
                <span className="text-slate-600 ml-2">• Cliente: {sale.customerName}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-500 block uppercase">Total Venta</span>
                <span className="font-bold text-slate-900">${sale.totalAmount.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Tabla de selección de cantidades a devolver */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Artículo</th>
                    <th className="py-2 px-3 text-center">Compradas</th>
                    <th className="py-2 px-3 text-center w-28">A Devolver</th>
                    <th className="py-2 px-3 text-right">Subtotal Reintegro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item) => {
                    const returnVal = returnQtys[item.id] || '';
                    const returnNum = parseFloat(returnVal) || 0;
                    const subtotal = returnNum * item.unitPrice;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-slate-900">{item.productName}</p>
                          <p className="text-[10px] font-mono text-slate-500">
                            Precio unitario: ${item.unitPrice.toLocaleString('es-AR')}
                          </p>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-medium text-slate-700">
                          {item.quantity} un.
                        </td>
                        <td className="py-2 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              step="1"
                              placeholder="0"
                              value={returnVal}
                              onChange={(e) => handleQtyChange(item.id, e.target.value, item.quantity)}
                              className="w-16 h-7 text-center font-mono font-bold text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-900"
                            />
                            <span className="text-[11px] text-slate-400">un.</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <label htmlFor="ret-reason" className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo de la Devolución / Cambio
              </label>
              <input
                id="ret-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Falla en producto, cambio de talle..."
                className="w-full h-8 px-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold block">
                  Total a Reintegrar / Crédito
                </span>
                <span className="text-lg font-bold font-mono text-slate-900 tabular-nums">
                  ${totalRefund.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || totalRefund <= 0}
                  className="h-8 px-4 rounded-lg bg-rose-700 hover:bg-rose-800 disabled:opacity-40 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Reingresando...' : 'Procesar Reingreso a Stock'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
