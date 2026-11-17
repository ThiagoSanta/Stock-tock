/**
 * Dominio: Configuración de Empresa y Depósitos
 */

export interface CompanySettings {
  id: string;
  name: string;
  taxId?: string;
  primaryCurrency: string;
  logoUrl?: string;
  updatedAt: string;
}

export interface WarehouseSettings {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}
