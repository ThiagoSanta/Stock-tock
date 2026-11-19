import { createClient } from './client';

export interface CompanyContext {
  companyId: string;
  companyName: string;
  defaultWarehouseId: string;
}

let cachedContext: CompanyContext | null = null;
let pendingPromise: Promise<CompanyContext | null> | null = null;

/**
 * Obtiene el contexto activo de la empresa y depósito por defecto con caché en memoria.
 * Evita realizar consultas repetidas de metadatos de empresa en cada navegación de página.
 */
export async function getCompanyContext(): Promise<CompanyContext | null> {
  if (cachedContext) return cachedContext;
  if (pendingPromise) return pendingPromise;

  pendingPromise = (async () => {
    try {
      const supabase = createClient();
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .limit(1);

      if (!companies || companies.length === 0) return null;

      const company = companies[0];
      const { data: wh } = await supabase
        .from('warehouses')
        .select('id')
        .eq('company_id', company.id)
        .eq('is_default', true)
        .limit(1);

      cachedContext = {
        companyId: company.id,
        companyName: company.name,
        defaultWarehouseId: wh && wh.length > 0 ? wh[0].id : '',
      };
      return cachedContext;
    } finally {
      pendingPromise = null;
    }
  })();

  return pendingPromise;
}

/**
 * Invalida la caché del contexto (por ejemplo, si se edita la empresa o depósito en Configuración).
 */
export function invalidateCompanyContext(): void {
  cachedContext = null;
}
