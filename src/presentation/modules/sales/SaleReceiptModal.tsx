'use client';

import React from 'react';
import { X, Printer, Receipt, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[#121214] border border-[#27272a] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-[#222226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#84cc16]/10 text-[#84cc16] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Comprobante Comercial <span className="font-mono text-[#84cc16]">{sale.saleNumber}</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-[#1a1a1e]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Voucher Body (Printable Area) */}
        <div className="p-6 space-y-4 text-xs font-sans">
          {/* Company & Ticket Header */}
          <div className="text-center pb-4 border-b border-[#222226] space-y-1">
            <h2 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
              Stock-tock Casa Central
            </h2>
            <p className="text-[11px] text-zinc-500">
              Comprobante No Fiscal de Gestión Comercial Interna
            </p>
            <p className="text-[11px] font-mono text-zinc-400">
              Operación: {sale.saleNumber} • {new Date(sale.createdAt).toLocaleString('es-AR')}
            </p>
          </div>

          {/* Client & Payment Details */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#161619] border border-[#222226]">
            <div>
              <span className="text-[10px] text-zinc-500 block">Cliente</span>
              <span className="font-semibold text-zinc-100">{sale.customerName}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Medio de Cobro</span>
              <span className="font-mono font-medium text-zinc-200">{sale.paymentMethod}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Canal de Venta</span>
              <span className="text-zinc-300">
                {sale.origin === 'VENTA_DIRECTA_MOSTRADOR' ? 'Mostrador (POS)' : 'Despacho de Pedido'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">Depósito Origen</span>
              <span className="text-zinc-300">{sale.warehouseName || 'Depósito Central'}</span>
            </div>
          </div>

          {/* Items breakdown */}
          <div className="rounded-xl bg-[#161619] border border-[#222226] overflow-hidden">
            <div className="p-2.5 bg-[#1a1a1e] border-b border-[#222226] font-semibold text-zinc-400 flex justify-between">
              <span>Detalle de Artículos</span>
              <span>Subtotal</span>
            </div>
            <div className="p-3 space-y-2.5 divide-y divide-[#202026]">
              {sale.items.length === 0 ? (
                <p className="text-center py-2 text-zinc-500 text-[11px]">
                  Ítems consolidados en la transacción
                </p>
              ) : (
                sale.items.map((it) => (
                  <div key={it.id} className="pt-2 first:pt-0 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-zinc-200">{it.productName}</p>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {it.quantity} un. × ${it.unitPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-100">
                      ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Totals & Margin Summary */}
          <div className="p-3.5 rounded-xl bg-[#161619] border border-[#222226] space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-zinc-100">
              <span>Total Cobrado:</span>
              <span className="font-mono text-lg text-[#84cc16]">
                ${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="pt-2 border-t border-[#222226] flex justify-between text-[11px] text-zinc-400">
              <span>Margen Bruto Estimado:</span>
              <span className="font-mono font-semibold text-[#84cc16]">
                ${sale.estimatedGrossMargin.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ({sale.marginPercentage}%)
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#222226] flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#84cc16]" />
              <span>Operación auditada e inmutable</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg bg-[#18181b] hover:bg-[#202024] text-xs font-medium text-zinc-300 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={handlePrint}
                className="h-9 px-4 rounded-lg bg-[#84cc16] hover:bg-[#74b412] text-black text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
