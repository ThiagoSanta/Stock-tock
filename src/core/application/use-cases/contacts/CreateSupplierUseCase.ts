import { IContactRepository } from '@/core/application/ports/IContactRepository';
import { Supplier } from '@/core/domain/contacts/types';

export interface CreateSupplierDTO {
  companyId: string;
  name: string;
  taxId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
}

export class CreateSupplierUseCase {
  constructor(private contactRepo: IContactRepository) {}

  async execute(dto: CreateSupplierDTO): Promise<Supplier> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('El nombre o razón social del proveedor es obligatorio.');
    }

    return this.contactRepo.createSupplier({
      companyId: dto.companyId,
      name: dto.name.trim(),
      taxId: dto.taxId?.trim() || undefined,
      contactName: dto.contactName?.trim() || undefined,
      email: dto.email?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      address: dto.address?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      active: dto.active ?? true,
    });
  }
}
