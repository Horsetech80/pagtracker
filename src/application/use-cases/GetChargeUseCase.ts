import { ChargeRepository } from '../repositories/ChargeRepository';
import { ChargeEntity } from '@/entities/models/Charge';

export interface GetChargeRequest {
  id: string;
  tenantId: string;
}

export class GetChargeUseCase {
  constructor(private chargeRepository: ChargeRepository) {}

  async execute(request: GetChargeRequest): Promise<ChargeEntity> {
    const { id, tenantId } = request;
    
    const charge = await this.chargeRepository.findById(id, tenantId);
    
    if (!charge) {
      throw new Error('Cobrança não encontrada');
    }
    
    return charge;
  }
}