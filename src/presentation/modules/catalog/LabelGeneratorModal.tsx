import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Printer, Tag, ChevronDown } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import { ProductWithStock } from '@/core/application/ports/IProductRepository';

interface LabelGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: ProductWithStock[];
  companyName: string;
}

type LabelSize = 'small' | 'medium' | 'large';
type BarcodeFormat = 'CODE128' | 'EAN13' | 'CODE39';

interface LabelConfig {
  size: LabelSize;
  barcodeFormat: BarcodeFormat;
  showPrice: boolean;
  showSku: boolean;
  showCompany: boolean;
  copiesPerProduct: number;
}

interface SelectedProduct {
  product: ProductWithStock;
  copies: number;
}

const SIZE_CONFIG: Record<LabelSize, { label: string; widthMm: number; heightMm: number; cols: number }> = {
  small:  { label: 'Pequeña (38×25 mm)', widthMm: 38,  heightMm: 25, cols: 5 },
  medium: { label: 'Mediana (63×38 mm)', widthMm: 63,  heightMm: 38, cols: 3 },
  large:  { label: 'Grande (100×60 mm)', widthMm: 100, heightMm: 60, cols: 2 },
};

function BarcodeLabel({
  product,
  config,
  companyName,
}: {
  product: ProductWithStock;
  config: LabelConfig;
  companyName: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const sz = SIZE_CONFIG[config.size];
  const scale = 3.78; // 1mm ≈ 3.78px at 96dpi

  const widthPx  = Math.round(sz.widthMm  * scale);
  const heightPx = Math.round(sz.heightMm * scale);

  const barcodeValue = product.barcode || product.sku || 'NO-CODE';

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, barcodeValue, {
        format: config.barcodeFormat,
        width: config.size === 'small' ? 1 : config.size === 'medium' ? 1.5 : 2,
        height: config.size === 'small' ? 20 : config.size === 'medium' ? 28 : 40,
        displayValue: true,
        fontSize: config.size === 'small' ? 7 : config.size === 'medium' ? 8 : 10,
        margin: 2,
        background: 'transparent',
        lineColor: '#000',
        textMargin: 1,
        fontOptions: 'bold',
      });
    } catch {
      // Invalid barcode value – skip silently
    }
  }, [barcodeValue, config]);

  const nameFontSize = config.size === 'small' ? 7 : config.size === 'medium' ? 8 : 10;
  const priceFontSize = config.size === 'small' ? 8 : config.size === 'medium' ? 10 : 13;

  return (
    <div
      className="border border-dashed border-slate-300 bg-white flex flex-col items-center justify-between p-1 overflow-hidden print:border-black"
      style={{ width: widthPx, height: heightPx, fontSize: nameFontSize }}
    >
      {config.showCompany && (
        <div className="w-full text-center font-bold truncate leading-tight" style={{ fontSize: nameFontSize - 1 }}>
          {companyName}
        </div>
      )}
      <div className="w-full text-center font-semibold truncate leading-tight" style={{ fontSize: nameFontSize }}>
        {product.name}
      </div>
      {config.showSku && (
        <div className="w-full text-center text-slate-500 leading-tight" style={{ fontSize: nameFontSize - 1 }}>
          {product.sku}
        </div>
      )}
      <div className="w-full flex justify-center items-center" style={{ flex: 1 }}>
        <svg ref={svgRef} className="max-w-full" />
      </div>
      {config.showPrice && (
        <div className="w-full text-center font-black leading-tight font-mono" style={{ fontSize: priceFontSize }}>
          ${product.salePrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
}

export function LabelGeneratorModal({
  isOpen,
  onClose,
  products,
  companyName,
}: LabelGeneratorModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SelectedProduct[]>([]);
  const [config, setConfig] = useState<LabelConfig>({
    size: 'medium',
    barcodeFormat: 'CODE128',
    showPrice: true,
    showSku: true,
    showCompany: true,
    copiesPerProduct: 1,
  });
  const [previewMode, setPreviewMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  });

  const toggleProduct = useCallback((product: ProductWithStock) => {
    setSelected((prev) => {
      const exists = prev.find((s) => s.product.id === product.id);
      if (exists) return prev.filter((s) => s.product.id !== product.id);
      return [...prev, { product, copies: config.copiesPerProduct }];
    });
  }, [config.copiesPerProduct]);

  const updateCopies = (productId: string, copies: number) => {
    setSelected((prev) =>
      prev.map((s) => (s.product.id === productId ? { ...s, copies: Math.max(1, copies) } : s))
    );
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    const originalContents = document.body.innerHTML;
    const printContents = printRef.current.innerHTML;
    document.body.innerHTML = `
      <style>
        @page { margin: 10mm; }
        body { margin: 0; }
        .label-grid { display: flex; flex-wrap: wrap; gap: 2px; }
        * { box-sizing: border-box; }
      </style>
      <div class="label-grid">${printContents}</div>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  const totalLabels = selected.reduce((sum, s) => sum + s.copies, 0);
  const sz = SIZE_CONFIG[config.size];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-bold text-slate-900">Generador de Etiquetas A4</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-200 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel – Config & Product Selector */}
          <div className="w-80 border-r border-slate-200 flex flex-col overflow-hidden">
            {/* Config */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Configuración</p>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Tamaño de etiqueta</label>
                <div className="relative">
                  <select
                    value={config.size}
                    onChange={(e) => setConfig((c) => ({ ...c, size: e.target.value as LabelSize }))}
                    className="w-full h-8 pl-2 pr-6 rounded border border-slate-300 text-xs bg-white appearance-none focus:outline-none focus:border-slate-900"
                  >
                    {Object.entries(SIZE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Formato de código de barras</label>
                <div className="relative">
                  <select
                    value={config.barcodeFormat}
                    onChange={(e) => setConfig((c) => ({ ...c, barcodeFormat: e.target.value as BarcodeFormat }))}
                    className="w-full h-8 pl-2 pr-6 rounded border border-slate-300 text-xs bg-white appearance-none focus:outline-none focus:border-slate-900"
                  >
                    <option value="CODE128">CODE128 (Universal)</option>
                    <option value="EAN13">EAN-13 (Retail)</option>
                    <option value="CODE39">CODE39 (Alfanum.)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-600 font-medium">Copias por producto (default)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={config.copiesPerProduct}
                  onChange={(e) => setConfig((c) => ({ ...c, copiesPerProduct: parseInt(e.target.value) || 1 }))}
                  className="w-full h-8 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {[
                  { key: 'showPrice', label: 'Mostrar precio' },
                  { key: 'showSku', label: 'Mostrar SKU' },
                  { key: 'showCompany', label: 'Mostrar empresa' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={config[key as keyof LabelConfig] as boolean}
                      onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.checked }))}
                      className="rounded border-slate-300 text-slate-900"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Product Selector */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b border-slate-100">
                <input
                  type="search"
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-7 px-2 rounded border border-slate-300 text-xs focus:outline-none focus:border-slate-900"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.slice(0, 100).map((p) => {
                  const sel = selected.find((s) => s.product.id === p.id);
                  return (
                    <div
                      key={p.id}
                      className={`px-4 py-2 flex items-center gap-2 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${sel ? 'bg-slate-50' : ''}`}
                      onClick={() => toggleProduct(p)}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${sel ? 'bg-slate-900 border-slate-900' : 'border-slate-300'}`}>
                        {sel && <svg viewBox="0 0 10 10" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-[2]"><polyline points="1.5,5 4,7.5 8.5,2.5" /></svg>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-900 truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.sku}</div>
                      </div>
                      {sel && (
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={sel.copies}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateCopies(p.id, parseInt(e.target.value) || 1)}
                          className="w-12 h-6 px-1 rounded border border-slate-300 text-xs text-center focus:outline-none focus:border-slate-900"
                        />
                      )}
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="px-4 py-6 text-center text-xs text-slate-400">Sin resultados</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel – Preview */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600">
                  <span className="font-bold text-slate-900">{selected.length}</span> producto{selected.length !== 1 ? 's' : ''}
                  {' · '}
                  <span className="font-bold text-slate-900">{totalLabels}</span> etiqueta{totalLabels !== 1 ? 's' : ''}
                  {' · '}
                  <span className="text-slate-500">{sz.cols} col/fila · {sz.widthMm}×{sz.heightMm}mm</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreviewMode((v) => !v)}
                  className="h-7 px-3 rounded border border-slate-300 bg-white text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {previewMode ? 'Ocultar preview' : 'Ver preview'}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={selected.length === 0}
                  className="h-7 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir A4
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
              {selected.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Tag className="w-10 h-10 opacity-30" />
                  <p className="text-sm">Seleccioná productos de la lista de la izquierda</p>
                </div>
              ) : (
                <div ref={printRef} className="flex flex-wrap gap-1 justify-start">
                  {selected.map(({ product, copies }) =>
                    Array.from({ length: copies }, (_, i) => (
                      <BarcodeLabel
                        key={`${product.id}-${i}`}
                        product={product}
                        config={config}
                        companyName={companyName}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
          <p className="text-xs text-slate-400">Las etiquetas se imprimen en A4 estándar · Sin validez fiscal</p>
          <button onClick={onClose} className="h-8 px-4 rounded border border-slate-300 bg-white text-xs font-medium hover:bg-slate-50 transition-colors cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
