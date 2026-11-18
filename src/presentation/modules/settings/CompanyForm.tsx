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
    <div className="rounded-lg bg-white border border-slate-200 p-4 space-y-4 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
        <div className="w-6 h-6 rounded bg-slate-100 text-slate-800 flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
            Perfil de la Empresa
          </h3>
          <p className="text-[11px] text-slate-500">
            Identificación legal y comercial para comprobantes y reportes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-2xl">
        {error && (
          <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Cambios guardados exitosamente.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Razón Social / Nombre Comercial <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Identificación Fiscal (CUIT / RUT)
            </label>
            <input
              type="text"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              placeholder="30-71234567-8"
              className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Moneda Principal
            </label>
            <div className="flex items-center gap-2 h-8 px-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-mono font-bold text-slate-900">{company.primaryCurrency}</span>
              <span className="text-[10px] text-slate-400 font-mono">(Regla SINGLE: Fijo en ARS)</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              URL del Logo (Opcional)
            </label>
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-8 px-2.5 rounded bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>
        </div>

        <div className="pt-1">
          <button
            type="submit"
            disabled={saving}
            className="h-8 px-4 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
