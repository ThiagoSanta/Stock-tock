import React from 'react';
import { X, Printer } from 'lucide-react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';

interface SaleReceiptModalProps {
  sale: SaleWithDetails | null;
  onClose: () => void;
}

export function SaleReceiptModal({ sale, onClose }: SaleReceiptModalProps) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs"
    >
      <div className="w-full max-w-lg rounded-lg bg-white border border-zinc-300 shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between shrink-0 print:hidden bg-zinc-50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-200 text-zinc-900 border border-zinc-300">
              {sale.saleNumber}
            </span>
            <h3
              id="receipt-modal-title"
              className="text-xs font-bold text-zinc-900 uppercase tracking-wider"
            >
              Comprobante de Venta
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar comprobante"
            className="text-zinc-500 hover:text-zinc-800 p-1.5 rounded hover:bg-zinc-200 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-900"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Receipt Voucher Body (Printable Area) */}
        <div className="p-5 space-y-4 text-xs font-sans text-zinc-900">
          <div className="text-center pb-3 border-b border-zinc-200 space-y-0.5">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              Stock-tock Casa Central
            </h2>
            <p className="text-xs text-zinc-600 font-medium">
              Comprobante Interno de Operación Comercial
            </p>
            <p className="text-xs font-mono text-zinc-700 tabular-nums">
              {sale.saleNumber} • {new Date(sale.createdAt).toLocaleString('es-AR')}
            </p>
          </div>

          {/* Client & Payment Details */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-zinc-50 border border-zinc-200">
            <div>
              <span className="text-[11px] text-zinc-600 uppercase block font-bold tracking-wider">
                Cliente
              </span>
              <span className="font-semibold text-zinc-900">{sale.customerName}</span>
            </div>
            <div>
              <span className="text-[11px] text-zinc-600 uppercase block font-bold tracking-wider">
                Medio de Cobro
              </span>
              <span className="font-mono font-bold text-zinc-900">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Items */}
          <div className="border border-zinc-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 text-[11px] uppercase font-bold">
                <tr>
                  <th scope="col" className="py-2.5 px-3">Producto</th>
                  <th scope="col" className="py-2.5 px-3 text-center">Cant.</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Precio Unit.</th>
                  <th scope="col" className="py-2.5 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sale.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900">{it.productName}</td>
                    <td className="py-2.5 px-3 text-center font-mono text-zinc-800 tabular-nums font-medium">
                      {it.quantity}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-700 tabular-nums">
                      ${it.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                      ${it.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Margin */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-200">
            <div className="flex items-center justify-between text-xs text-zinc-700">
              <span className="font-medium">Costo Histórico de Mercadería (CMV):</span>
              <span className="font-mono tabular-nums">${sale.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>Margen Bruto Obtenido:</span>
              <span className="font-mono font-bold tabular-nums">
                +${sale.estimatedGrossMargin.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-zinc-200">
              <span className="text-zinc-900">Total Cobrado:</span>
              <span className="font-mono text-zinc-900 tabular-nums">
                ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 print:hidden">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3 rounded bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-4 rounded bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 active:bg-zinc-950 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Imprimir Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
