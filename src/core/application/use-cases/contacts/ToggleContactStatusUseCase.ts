import { IContactRepository } from '@/core/application/ports/IContactRepository';

export class ToggleContactStatusUseCase {
  constructor(private contactRepo: IContactRepository) {}

  async executeCustomer(id: string, active: boolean): Promise<void> {
    return this.contactRepo.toggleCustomerStatus(id, active);
  }

  async executeSupplier(id: string, active: boolean): Promise<void> {
    return this.contactRepo.toggleSupplierStatus(id, active);
  }
}
