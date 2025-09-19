import { getCreateChargeUseCase } from '@/di/container';
import { CreateChargeRequest } from '@/application/use-cases/CreateCharge';
import { DomainError } from '@/entities/errors/DomainErrors';

/**
 * Controller de Cobranças - Interface Adapters Layer
 * Adapta requests HTTP para use cases
 */
export interface CreateChargeControllerRequest {
  userId: string;
  tenantId: string;
  valor: number;
  descricao?: string;
  expiracao?: number;
}

export interface CreateChargeControllerResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    statusCode: number;
  };
}

export class ChargeController {
  async createCharge(request: CreateChargeControllerRequest): Promise<CreateChargeControllerResponse> {
    try {
      const createChargeUseCase = getCreateChargeUseCase();

      const useCaseRequest: CreateChargeRequest = {
        userId: request.userId,
        tenantId: request.tenantId,
        valor: request.valor,
        descricao: request.descricao,
        expiracao: request.expiracao
      };

      const result = await createChargeUseCase.execute(useCaseRequest);

      return {
        success: true,
        data: {
          charge: {
            id: result.charge.id,
            valor: result.charge.valor,
            valorFormatado: result.charge.getValorFormatado(),
            descricao: result.charge.descricao,
            status: result.charge.status,
            statusLabel: result.charge.getStatusLabel(),
            txid: result.charge.txid,
            qr_code: result.charge.qr_code,
            qr_code_image: result.charge.qr_code_image,
            expires_at: result.charge.expires_at,
            timeRemaining: result.charge.getTimeRemaining(),
            created_at: result.charge.created_at
          }
        }
      };
    } catch (error) {
      if (error instanceof DomainError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            statusCode: error.statusCode
          }
        };
      }

      // Erro genérico
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro interno do servidor',
          statusCode: 500
        }
      };
    }
  }
}

// Factory function
export function createChargeController(): ChargeController {
  return new ChargeController();
} 