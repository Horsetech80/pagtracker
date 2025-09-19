import { ChargeRepository } from '@/application/repositories/ChargeRepository';
import { ChargeEntity } from '@/entities/models/Charge';

/**
 * Use Case: Listar Cobranças
 * Contém a lógica de negócio para listagem de cobranças
 */
export interface ListChargesRequest {
  tenantId: string;
  userId: string;
  page?: number;
  limit?: number;
  status?: string;
}

export interface ListChargesResponse {
  charges: ChargeEntity[];
  total: number;
}

export class ListChargesUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository
  ) {}

  async execute(request: ListChargesRequest): Promise<ListChargesResponse> {
    try {
      console.log('🔄 [LIST_CHARGES] Iniciando execução...', {
        tenantId: request.tenantId,
        userId: request.userId,
        page: request.page,
        limit: request.limit
      });

      // Validações de negócio
      this.validateRequest(request);

      // Buscar cobranças no repositório
      const result = await this.chargeRepository.findByUserId(
        request.userId,
        request.tenantId,
        {
          page: request.page || 1,
          limit: request.limit || 50,
          status: request.status
        }
      );

      console.log('✅ [LIST_CHARGES] Cobranças listadas com sucesso:', {
        count: result.charges.length,
        total: result.total
      });

      return {
        charges: result.charges,
        total: result.total
      };

    } catch (error) {
      console.error('❌ [LIST_CHARGES] Erro ao listar cobranças:', error);
      throw error;
    }
  }

  private validateRequest(request: ListChargesRequest): void {
    if (!request.tenantId) {
      throw new Error('DOMAIN_ERROR: tenantId é obrigatório');
    }

    if (!request.userId) {
      throw new Error('DOMAIN_ERROR: userId é obrigatório');
    }

    if (request.limit && (request.limit < 1 || request.limit > 100)) {
      throw new Error('DOMAIN_ERROR: limit deve estar entre 1 e 100');
    }

    if (request.page && request.page < 1) {
      throw new Error('DOMAIN_ERROR: page deve ser maior que 0');
    }
  }
}