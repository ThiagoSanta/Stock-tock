import React, { useEffect, useState } from 'react';
import { X, Printer, Download, CheckCircle2, Building2, UserCheck } from 'lucide-react';
import { SaleWithDetails } from '@/core/application/ports/ISaleRepository';
import { Sale } from '@/core/domain/sales/types';
import { getCompanyContext } from '@/utils/supabase/companyContext';

interface SaleA4InvoiceModalProps {
  sale: SaleWithDetails | Sale | null;
  onClose: () => void;
  companyNameOverride?: string;
}

export function SaleA4InvoiceModal({
  sale,
  onClose,
  companyNameOverride,
}: SaleA4InvoiceModalProps) {
  const [companyName, setCompanyName] = useState<string>(companyNameOverride || 'Empresa Comercial');

  useEffect(() => {
    if (!companyNameOverride) {
      getCompanyContext().then((ctx) => {
        if (ctx?.companyName) {
          setCompanyName(ctx.companyName);
        }
      });
    }
  }, [companyNameOverride]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(sale.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const formattedTime = new Date(sale.createdAt).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalQuantity = sale.items.reduce((acc, it) => acc + (it.quantity || 0), 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Comprobante de Venta y Entrega A4"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl my-auto bg-zinc-100 rounded-xl border border-zinc-300 shadow-2xl overflow-hidden flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior de acciones (Se oculta al imprimir) */}
        <div className="h-14 px-4 bg-white border-b border-zinc-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-zinc-900 text-white">
              {sale.saleNumber}
            </span>
            <span className="text-xs font-semibold text-zinc-800">
              Comprobante de Entrega & Venta A4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-3.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 active:bg-zinc-950 text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-zinc-900"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar vista previa"
              className="w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Contenedor con Scroll de la Hoja A4 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-zinc-200/60 print:p-0 print:bg-white print:overflow-visible">
          {/* HOJA A4 (210mm de ancho simulado) */}
          <div
            id="printable-a4-voucher"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white text-zinc-900 shadow-lg print:shadow-none p-8 sm:p-12 flex flex-col justify-between font-sans text-xs leading-normal print:p-0 print:w-full print:min-h-0"
          >
            {/* Cabecera Principal */}
            <div>
              <div className="flex items-start justify-between pb-6 border-b-2 border-zinc-900">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-zinc-900" aria-hidden="true" />
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900 uppercase">
                      {companyName}
                    </h1>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-medium mt-1">
                    Control Comercial y Gestión de Stock
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Documento de Respaldo y Remito de Entrega
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-zinc-900 text-white font-mono font-bold text-sm tracking-wider">
                    {sale.saleNumber}
                  </span>
                  <div className="mt-2 text-zinc-700 font-medium text-[11px] space-y-0.5">
                    <p>Fecha: <strong className="font-semibold text-zinc-900">{formattedDate}</strong></p>
                    <p>Hora: <span className="font-mono">{formattedTime} hs</span></p>
                  </div>
                </div>
              </div>

              {/* Leyenda aclaratoria no fiscal */}
              <div className="py-2 px-3 my-4 bg-zinc-50 border border-zinc-200 rounded text-[10px] text-zinc-600 text-center font-medium">
                DOCUMENTO COMERCIAL INTERNO • REMITO DE ENTREGA Y COBRO • NO VÁLIDO COMO FACTURA FISCAL
              </div>

              {/* Datos de la Operación y Cliente */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-zinc-200 bg-zinc-50/50 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Datos del Cliente / Destinatario
                  </span>
                  <p className="text-sm font-bold text-zinc-900">
                    {sale.customerName || 'Consumidor Final'}
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Tipo de Venta: {sale.origin === 'VENTA_DIRECTA_MOSTRADOR' ? 'Venta Directa en Mostrador' : 'Despacho de Pedido'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Condiciones Comerciales
                  </span>
                  <p className="text-[11px] text-zinc-800">
                    Medio de Cobro: <strong className="font-semibold text-zinc-900 font-mono">{sale.paymentMethod}</strong>
                  </p>
                  <p className="text-[11px] text-zinc-800 mt-0.5">
                    Estado: <strong className="text-emerald-700 font-semibold">COBRADO / DESPACHADO</strong>
                  </p>
                  {sale.notes && (
                    <p className="text-[11px] text-zinc-600 mt-1 italic">
                      Notas: {sale.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Tabla de Artículos */}
              <div className="border border-zinc-200 rounded-lg overflow-hidden mb-6">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-800 font-bold text-[11px] uppercase">
                      <th scope="col" className="py-2.5 px-3 text-center w-10">#</th>
                      <th scope="col" className="py-2.5 px-3">Descripción del Producto</th>
                      <th scope="col" className="py-2.5 px-3 text-center w-20">Cant.</th>
                      <th scope="col" className="py-2.5 px-3 text-right w-28">Precio Unit.</th>
                      <th scope="col" className="py-2.5 px-3 text-right w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-800">
                    {sale.items.map((item, index) => (
                      <tr key={item.id || index} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 text-center text-zinc-500 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-medium tabular-nums">
                          {item.quantity} un.
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-zinc-700 tabular-nums">
                          ${Number(item.unitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 tabular-nums">
                          ${Number(item.subtotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen de Totales y Bultos */}
              <div className="flex justify-between items-start gap-6 pb-6 border-b border-zinc-200">
                <div className="text-zinc-600 text-[11px] space-y-1">
                  <p>Total de ítems: <strong className="text-zinc-900 font-semibold">{sale.items.length}</strong></p>
                  <p>Unidades totales despachadas: <strong className="text-zinc-900 font-semibold">{totalQuantity} un.</strong></p>
                </div>

                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-zinc-600 text-xs">
                    <span>Subtotal Operación:</span>
                    <span className="font-mono tabular-nums font-medium text-zinc-900">
                      ${Number(sale.totalAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-zinc-900 pt-2 border-t-2 border-zinc-900">
                    <span>TOTAL COBRADO:</span>
                    <span className="font-mono text-base tabular-nums">
                      ${Number(sale.totalAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie de Página: Firmas y Recepción Conforme */}
            <div className="pt-8 space-y-6">
              <div className="grid grid-cols-2 gap-12 text-center">
                <div className="border-t border-zinc-400 pt-2">
                  <p className="font-semibold text-zinc-900 text-xs">Firma del Despachante / Vendedor</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Control de Stock y Salida</p>
                </div>

                <div className="border-t border-zinc-400 pt-2">
                  <p className="font-semibold text-zinc-900 text-xs">Recibí Conforme (Firma y Aclaración)</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">DNI / Constancia de Recepción</p>
                </div>
              </div>

              <div className="text-center text-[10px] text-zinc-500 pt-4 border-t border-zinc-100">
                Stock·tock Sistema de Control Comercial y Gestión de Stock • Impreso el {new Date().toLocaleDateString('es-AR')} a las {new Date().toLocaleTimeString('es-AR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
