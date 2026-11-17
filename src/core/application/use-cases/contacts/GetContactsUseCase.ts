import { IContactRepository } from '@/core/application/ports/IContactRepository';
import { CustomerWithMetrics, SupplierWithMetrics } from '@/core/domain/contacts/types';

export class GetContactsUseCase {
  constructor(private contactRepo: IContactRepository) {}

  async executeCustomers(companyId: string): Promise<CustomerWithMetrics[]> {
    return this.contactRepo.getCustomers(companyId);
  }

  async executeSuppliers(companyId: string): Promise<SupplierWithMetrics[]> {
    return this.contactRepo.getSuppliers(companyId);
  }
}
