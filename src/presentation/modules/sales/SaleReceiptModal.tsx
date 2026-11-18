import React from 'react';
import { X, Printer, Receipt } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg bg-white border border-slate-200 shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-12 px-4 border-b border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
              {sale.saleNumber}
            </span>
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Comprobante de Venta
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Voucher Body (Printable Area) */}
        <div className="p-5 space-y-4 text-xs font-sans text-slate-900">
          <div className="text-center pb-3 border-b border-slate-200 space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Stock-tock Casa Central
            </h2>
            <p className="text-[11px] text-slate-500">
              Comprobante Interno de Operación Comercial
            </p>
            <p className="text-[11px] font-mono text-slate-600">
              {sale.saleNumber} • {new Date(sale.createdAt).toLocaleString('es-AR')}
            </p>
          </div>

          {/* Client & Payment Details */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Cliente</span>
              <span className="font-medium text-slate-900">{sale.customerName}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-semibold">Medio de Cobro</span>
              <span className="font-mono font-medium text-slate-900">{sale.paymentMethod}</span>
            </div>
          </div>

          {/* Items */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3 text-center">Cant.</th>
                  <th className="py-2 px-3 text-right">Precio Unit.</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2 px-3 font-medium text-slate-900">{it.productName}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-700">{it.quantity}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">
                      ${it.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ${it.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Margin */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Costo Histórico de Mercadería (CMV):</span>
              <span className="font-mono">${sale.totalCost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
              <span>Margen Bruto Obtenido:</span>
              <span className="font-mono font-bold">+${sale.estimatedGrossMargin.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-bold pt-2 border-t border-slate-200">
              <span className="text-slate-900">Total Cobrado:</span>
              <span className="font-mono text-slate-900">
                ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 print:hidden">
            <button
              onClick={onClose}
              className="h-8 px-3 rounded bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
