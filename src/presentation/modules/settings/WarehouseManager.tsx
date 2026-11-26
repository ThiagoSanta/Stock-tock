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
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center justify-center">
            <Boxes className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
              Depósitos & Puntos de Despacho
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Locaciones físicas para inventario independiente y stock segregado
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-7 px-2.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center gap-1 transition-colors border border-zinc-200 dark:border-zinc-800 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? 'Cancelar' : 'Nuevo Depósito'}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-3 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5"
        >
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Registrar Nuevo Depósito</h4>
          {error && (
            <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/70 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Depósito Norte"
                className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Código Único</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="DEP-NORTE"
                className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs uppercase font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-600 dark:text-zinc-400 mb-1">Dirección</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Acceso Norte Km 24"
                className="w-full h-8 px-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-zinc-300 dark:border-zinc-700"
              />
              <span>Depósito predeterminado para ventas</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="h-7 px-3 rounded bg-zinc-900 text-white font-semibold text-xs hover:bg-zinc-800 transition-colors cursor-pointer"
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
                ? 'bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100">{wh.name}</span>
                  <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                    {wh.code}
                  </span>
                </div>
                {wh.address && (
                  <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    <MapPin className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <span>{wh.address}</span>
                  </div>
                )}
              </div>

              {wh.isDefault ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> Principal
                </span>
              ) : (
                <button
                  onClick={() => onSetDefault(wh.id)}
                  className="px-2 py-0.5 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 transition-colors cursor-pointer"
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
