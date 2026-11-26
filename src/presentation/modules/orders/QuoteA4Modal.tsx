import React from 'react';
import { X, Printer, Building2, User, Calendar, FileText } from 'lucide-react';

export interface QuoteData {
  quoteNumber: string;
  date: string;
  validUntil: string;
  customerName: string;
  companyName: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  totalAmount: number;
  notes?: string;
}

interface QuoteA4ModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: QuoteData | null;
}

export function QuoteA4Modal({ isOpen, onClose, quote }: QuoteA4ModalProps) {
  if (!isOpen || !quote) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quote-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-xl border border-zinc-300 shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera modal (Oculta al imprimir) */}
        <div className="h-12 px-4 border-b border-zinc-200 flex items-center justify-between shrink-0 bg-zinc-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-zinc-900 text-white flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 id="quote-modal-title" className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
              Presupuesto Comercial A4
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-7 px-3.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Presupuesto A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/80 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Contenedor imprimible A4 */}
        <div id="printable-a4-voucher" className="p-8 overflow-y-auto font-sans space-y-6 text-zinc-900">
          {/* Encabezado */}
          <div className="flex items-start justify-between pb-4 border-b-2 border-zinc-900">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-zinc-800" />
                <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">
                  {quote.companyName}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Venta y Distribución Comercial • Presupuesto Oficial
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-900 text-white rounded">
                PRESUPUESTO #{quote.quoteNumber}
              </span>
              <p className="text-[11px] font-mono text-zinc-500 mt-1.5 flex items-center justify-end gap-1">
                <Calendar className="w-3 h-3 text-zinc-400" />
                <span>Fecha: {quote.date}</span>
              </p>
              <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded mt-1 inline-block">
                Validez hasta: {quote.validUntil}
              </p>
            </div>
          </div>

          {/* Ficha del cliente destinatario */}
          <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-500" />
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Presupuestado a
                </span>
                <p className="text-sm font-bold text-zinc-900">{quote.customerName}</p>
              </div>
            </div>
            <div className="text-right text-[11px] text-zinc-500">
              <span>Cotización en Pesos Argentinos (ARS)</span>
            </div>
          </div>

          {/* Tabla de ítems presupuestados */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-700 font-bold text-[11px] uppercase">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Descripción del Producto</th>
                  <th className="py-2.5 px-3 text-center w-24">Cantidad</th>
                  <th className="py-2.5 px-3 text-right w-28">Precio Unit.</th>
                  <th className="py-2.5 px-3 text-right w-32">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {quote.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    <td className="py-2 px-3 text-center text-zinc-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-zinc-900">{it.name}</td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-zinc-800">
                      {it.quantity}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-zinc-700">
                      ${it.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-zinc-950">
                      ${it.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-50 border-t-2 border-zinc-300 font-bold text-zinc-900">
                  <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-xs">
                    Total Presupuestado:
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-base text-zinc-950">
                    ${quote.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Condiciones comerciales y notas */}
          <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
            <p className="font-bold text-zinc-800 text-[11px] uppercase tracking-wider">
              Términos & Condiciones de la Oferta:
            </p>
            <p className="text-[11px] text-zinc-600">
              • Los precios consignados tienen carácter de cotización estimativa y se mantienen firmes hasta la fecha de validez indicada.
            </p>
            <p className="text-[11px] text-zinc-600">
              • La presente cotización no constituye compromiso de reserva de existencias en depósito hasta tanto sea confirmada por el cliente.
            </p>
            {quote.notes && (
              <p className="text-[11px] text-zinc-800 font-medium pt-1">
                Observaciones: {quote.notes}
              </p>
            )}
          </div>

          {/* Firmas al pie */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-center border-t border-zinc-200">
            <div className="border-t border-zinc-400 pt-1.5">
              <p className="font-bold text-zinc-900 text-[11px] uppercase">{quote.companyName}</p>
              <p className="text-[10px] text-zinc-500">Asesor Comercial / Firma Autorizada</p>
            </div>
            <div className="border-t border-zinc-400 pt-1.5">
              <p className="font-bold text-zinc-900 text-[11px] uppercase">{quote.customerName}</p>
              <p className="text-[10px] text-zinc-500">Conformidad de Presupuesto</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
