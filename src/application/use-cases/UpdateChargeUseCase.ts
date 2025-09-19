import { ChargeRepository } from '../repositories/ChargeRepository';
import { ChargeEntity, ChargeData } from '@/entities/models/Charge';

export interface UpdateChargeRequest {
  id: string;
  tenantId: string;
  updateData: Partial<ChargeData>;
}

export class UpdateChargeUseCase {
  constructor(private chargeRepository: ChargeRepository) {}

  async execute(request: UpdateChargeRequest): Promise<ChargeEntity> {
    const { id, tenantId, updateData } = request;
    
    // Verificar se a cobrança existe
    const existingCharge = await this.chargeRepository.findById(id, tenantId);
    
    if (!existingCharge) {
      throw new Error('Cobrança não encontrada');
    }
    
    // Atualizar a cobrança
    const updatedCharge = await this.chargeRepository.update(id, updateData, tenantId);
    
    return updatedCharge;
  }
}