import { ChargeRepository } from '../repositories/ChargeRepository';

export interface DeleteChargeRequest {
  id: string;
  tenantId: string;
}

export class DeleteChargeUseCase {
  constructor(private chargeRepository: ChargeRepository) {}

  async execute(request: DeleteChargeRequest): Promise<void> {
    const { id, tenantId } = request;
    
    // Verificar se a cobrança existe
    const existingCharge = await this.chargeRepository.findById(id, tenantId);
    
    if (!existingCharge) {
      throw new Error('Cobrança não encontrada');
    }
    
    // Deletar a cobrança
    await this.chargeRepository.delete(id, tenantId);
  }
}