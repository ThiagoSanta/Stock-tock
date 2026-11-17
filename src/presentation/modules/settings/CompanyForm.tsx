'use client';

import React, { useState } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { CompanySettings } from '@/core/domain/settings/types';
import { UpdateCompanyDTO } from '@/core/application/use-cases/settings/UpdateCompanySettingsUseCase';

interface CompanyFormProps {
  company: CompanySettings;
  onUpdate: (dto: UpdateCompanyDTO) => Promise<void>;
}

export function CompanyForm({ company, onUpdate }: CompanyFormProps) {
  const [name, setName] = useState(company.name);
  const [taxId, setTaxId] = useState(company.taxId || '');
  const [logoUrl, setLogoUrl] = useState(company.logoUrl || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await onUpdate({
        id: company.id,
        name,
        taxId,
        logoUrl,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la empresa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl bg-[#121214] border border-[#222226] p-6 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[#222226]">
        <div className="p-2 rounded-lg bg-zinc-800 text-[#84cc16]">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-100 text-sm">Perfil de la Organización</h3>
          <p className="text-xs text-zinc-400">
            Identificación legal y comercial para tickets, comprobantes y reportes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Cambios guardados exitosamente.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Nombre de Fantasía / Razón Social <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Identificación Tributaria (CUIT / RUT)
            </label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="Ej: 30-71234567-8"
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Moneda Principal del Sistema (V1)
            </label>
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-400 select-none">
              <span className="font-mono font-bold text-zinc-200">{company.primaryCurrency}</span>
              <span className="text-[10px] text-zinc-500 font-mono">(Regla SINGLE: Fijo en ARS)</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              URL del Logo (Opcional)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 rounded-lg bg-[#18181b] border border-[#27272a] text-xs text-zinc-100 focus:outline-none focus:border-[#84cc16]"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#84cc16] text-black hover:bg-[#9ae624] transition-colors flex items-center gap-1.5"
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
}
