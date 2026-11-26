import React, { useState } from 'react';
import { Building2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { CompanySettings } from '@/core/domain/settings/types';
import { UpdateCompanyDTO } from '@/core/application/use-cases/settings/UpdateCompanySettingsUseCase';
import { Button, Input } from '@/presentation/components/ui';

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
    <div className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 space-y-4 shadow-xs">
      <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
          <Building2 className="w-3.5 h-3.5" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
            Perfil de la Empresa
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Identificación legal y comercial para comprobantes y reportes
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 max-w-2xl">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Cambios guardados exitosamente.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Razón Social / Nombre Comercial"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Identificación Fiscal (CUIT / RUT)"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="30-71234567-8"
            mono
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Moneda Principal
            </label>
            <div className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{company.primaryCurrency}</span>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">(Regla SINGLE: Fijo en ARS)</span>
            </div>
          </div>

          <Input
            label="URL del Logo (Opcional)"
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={saving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form>
    </div>
  );
}
