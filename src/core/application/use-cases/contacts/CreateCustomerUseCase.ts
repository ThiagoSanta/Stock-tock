import { IContactRepository } from '@/core/application/ports/IContactRepository';
import { Customer } from '@/core/domain/contacts/types';

export interface CreateCustomerDTO {
  companyId: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
}

export class CreateCustomerUseCase {
  constructor(private contactRepo: IContactRepository) {}

  async execute(dto: CreateCustomerDTO): Promise<Customer> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('El nombre o razón social del cliente es obligatorio.');
    }

    return this.contactRepo.createCustomer({
      companyId: dto.companyId,
      name: dto.name.trim(),
      taxId: dto.taxId?.trim() || undefined,
      email: dto.email?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      address: dto.address?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      active: dto.active ?? true,
    });
  }
}
