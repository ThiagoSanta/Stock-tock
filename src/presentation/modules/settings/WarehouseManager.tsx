import React, { useState } from 'react';
import { Boxes, Plus, Check, MapPin, AlertCircle } from 'lucide-react';
import { WarehouseSettings } from '@/core/domain/settings/types';
import { CreateWarehouseDTO } from '@/core/application/use-cases/settings/ManageWarehousesUseCase';

interface WarehouseManagerProps {
  companyId: string;
  warehouses: WarehouseSettings[];
  onCreateWarehouse: (dto: CreateWarehouseDTO) => Promise<void>;
  onSetDefault: (warehouseId: string) => Promise<void>;
}

export function WarehouseManager({
  companyId,
  warehouses,
  onCreateWarehouse,
  onSetDefault,
}: WarehouseManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    try {
      setSaving(true);
      setError(null);

      await onCreateWarehouse({
        companyId,
        name,
        code,
        address,
        isDefault,
      });

      setName('');
      setCode('');
      setAddress('');
      setIsDefault(false);
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || 'Error al crear el depósito.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-white border border-slate-200 p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
            <Boxes className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Depósitos & Puntos de Despacho
            </h3>
            <p className="text-[11px] text-slate-500">
              Locaciones físicas para inventario independiente y stock segregado
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-7 px-2.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cancelar' : 'Nuevo Depósito'}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-3 rounded bg-slate-50 border border-slate-200 space-y-2.5"
        >
          <h4 className="text-xs font-semibold text-slate-900">Registrar Nuevo Depósito</h4>
          {error && (
            <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Depósito Norte"
                className="w-full h-8 px-2 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Código Único</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DEP-NORTE"
                className="w-full h-8 px-2 rounded bg-white border border-slate-200 text-xs uppercase font-mono text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-1">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Acceso Norte Km 24"
                className="w-full h-8 px-2 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span>Depósito predeterminado para ventas</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="h-7 px-3 rounded bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Guardar Depósito
            </button>
          </div>
        </form>
      )}

      {/* Warehouse List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className={`p-3 rounded-lg border transition-all ${
              wh.isDefault
                ? 'bg-slate-50 border-slate-300'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900">{wh.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-700 border border-slate-200">
                    {wh.code}
                  </span>
                </div>
                {wh.address && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{wh.address}</span>
                  </div>
                )}
              </div>

              {wh.isDefault ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Principal
                </span>
              ) : (
                <button
                  onClick={() => onSetDefault(wh.id)}
                  className="px-2 py-0.5 text-[11px] rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                >
                  Predeterminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
