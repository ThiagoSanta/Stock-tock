'use client';

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
    <div className="rounded-xl bg-[#121214] border border-[#222226] p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#222226]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 text-[#84cc16]">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-100 text-sm">Depósitos & Puntos de Despacho</h3>
            <p className="text-xs text-zinc-400">
              Administrá tus locaciones físicas para inventario independiente y stock segregado
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-8 px-3 rounded-lg bg-[#18181b] hover:bg-zinc-800 border border-[#27272a] text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#84cc16]" />
          <span>{showAddForm ? 'Cancelar' : 'Nuevo Depósito'}</span>
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-lg bg-[#161619] border border-[#27272a] space-y-3 animate-in fade-in"
        >
          <h4 className="text-xs font-semibold text-zinc-200">Registrar Nuevo Depósito</h4>
          {error && (
            <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Depósito Norte"
                className="w-full h-8 px-2.5 rounded bg-[#121214] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Código Único</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ej: DEP-NORTE"
                className="w-full h-8 px-2.5 rounded bg-[#121214] border border-[#27272a] text-xs text-zinc-100 uppercase font-mono focus:outline-none focus:border-[#84cc16]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Dirección Física</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ej: Acceso Norte Km 24"
                className="w-full h-8 px-2.5 rounded bg-[#121214] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-[#27272a] text-[#84cc16] focus:ring-0"
              />
              <span>Establecer como depósito predeterminado para ventas directas</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="px-3.5 py-1.5 rounded-lg bg-[#84cc16] text-black font-semibold text-xs hover:bg-[#9ae624] transition-colors"
            >
              Guardar Depósito
            </button>
          </div>
        </form>
      )}

      {/* Warehouse List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className={`p-4 rounded-xl border transition-all ${
              wh.isDefault
                ? 'bg-zinc-900/60 border-[#84cc16]/40'
                : 'bg-[#18181b] border-[#27272a]'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-zinc-100">{wh.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300 border border-zinc-700">
                    {wh.code}
                  </span>
                </div>
                {wh.address && (
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span>{wh.address}</span>
                  </div>
                )}
              </div>

              {wh.isDefault ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#84cc16]/20 text-[#84cc16] border border-[#84cc16]/40 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Principal
                </span>
              ) : (
                <button
                  onClick={() => onSetDefault(wh.id)}
                  className="px-2 py-1 text-[11px] rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Hacer Principal
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
