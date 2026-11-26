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

      if (!effectiveWarehouseId) {
        throw new Error('No se encontró un depósito válido para reingresar el stock.');
      }

      const { data: returnRes, error: rpcErr } = await supabase.rpc('rpc_process_sale_return', {
        p_company_id: sale.companyId,
        p_sale_id: sale.id,
        p_warehouse_id: effectiveWarehouseId,
        p_reason: reason.trim(),
        p_items: itemsToReturn.map((it) => ({
          saleItemId: it.id,
          quantity: it.returnQty,
        })),
      });

      if (rpcErr || !returnRes) {
        throw new Error(rpcErr?.message || 'Error al procesar la devolución.');
      }

      setReturnVoucher({
        returnNumber: returnRes.returnNumber,
        items: itemsToReturn.map((it) => ({
          name: it.productName,
          qty: it.returnQty,
          unitPrice: it.unitPrice,
          subtotal: it.refundSubtotal,
        })),
        totalRefund: Number(returnRes.totalRefund ?? totalRefund),
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal */}
        <div className="h-13 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-700 text-white flex items-center justify-center">
              <Undo2 className="w-4 h-4" />
            </div>
            <h3 id="return-modal-title" className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Devolución de Mercadería & Reingreso a Stock
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {returnVoucher ? (
          <div className="p-6 space-y-5">
            <div
              id="printable-a4-voucher"
              className="p-6 rounded-xl border-2 border-zinc-900 bg-white dark:bg-zinc-900 space-y-4 font-sans text-xs text-zinc-900 dark:text-zinc-100 leading-normal"
            >
              <div className="flex items-start justify-between pb-4 border-b border-zinc-300 dark:border-zinc-700">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase">{companyName}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Nota de Crédito Interna / Comprobante de Devolución</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Venta Origen: {sale.saleNumber}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-rose-700 text-white">
                    {returnVoucher.returnNumber}
                  </span>
                  <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-1">{returnVoucher.date}</p>
                </div>
              </div>

              <div>
                <p className="mb-2">
                  Cliente: <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{sale.customerName}</strong>
                </p>

                <table className="w-full text-left text-xs border-collapse border border-zinc-200 dark:border-zinc-800 rounded">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="py-1.5 px-3">Artículo Reingresado</th>
                      <th className="py-1.5 px-3 text-center">Cant.</th>
                      <th className="py-1.5 px-3 text-right">Precio</th>
                      <th className="py-1.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                    {returnVoucher.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-3 font-sans font-medium text-zinc-900 dark:text-zinc-100">{it.name}</td>
                        <td className="py-1.5 px-3 text-center">{it.qty} un.</td>
                        <td className="py-1.5 px-3 text-right">${it.unitPrice.toLocaleString('es-AR')}</td>
                        <td className="py-1.5 px-3 text-right font-bold">${it.subtotal.toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70">
                <span className="font-bold text-xs text-rose-950 uppercase">Crédito a Favor / Reintegro:</span>
                <span className="font-mono text-base font-bold text-rose-800 dark:text-rose-300 tabular-nums">
                  ${returnVoucher.totalRefund.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-6 grid grid-cols-2 gap-8 text-center border-t border-zinc-200 dark:border-zinc-800">
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Recepción de Stock / Depósito</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Mercadería reingresada a Kardex</p>
                </div>
                <div className="border-t border-zinc-400 pt-1.5">
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Conformidad del Cliente</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Firma y Aclaración</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="h-8 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Nota de Crédito A4</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-8 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
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
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 font-medium"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider block">
                  Comprobante Seleccionado
                </span>
                <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{sale.saleNumber}</span>
                <span className="text-zinc-600 dark:text-zinc-400 ml-2">• Cliente: {sale.customerName}</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block uppercase">Total Venta</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">${sale.totalAmount.toLocaleString('es-AR')}</span>
              </div>
            </div>

            {/* Tabla de selección de cantidades a devolver */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-[11px] uppercase">
                  <tr>
                    <th className="py-2 px-3">Artículo</th>
                    <th className="py-2 px-3 text-center">Compradas</th>
                    <th className="py-2 px-3 text-center w-28">A Devolver</th>
                    <th className="py-2 px-3 text-right">Subtotal Reintegro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {sale.items.map((item) => {
                    const returnVal = returnQtys[item.id] || '';
                    const returnNum = parseFloat(returnVal) || 0;
                    const subtotal = returnNum * item.unitPrice;

                    return (
                      <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                        <td className="py-2 px-3">
                          <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.productName}</p>
                          <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                            Precio unitario: ${item.unitPrice.toLocaleString('es-AR')}
                          </p>
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-medium text-zinc-700 dark:text-zinc-300">
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
                              className="w-16 h-7 text-center font-mono font-bold text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:border-zinc-900"
                            />
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-500">un.</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                          ${subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div>
              <label htmlFor="ret-reason" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Motivo de la Devolución / Cambio
              </label>
              <input
                id="ret-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Falla en producto, cambio de talle..."
                className="w-full h-8 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900"
              />
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 uppercase font-bold block">
                  Total a Reintegrar / Crédito
                </span>
                <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                  ${totalRefund.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-8 px-3.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
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
