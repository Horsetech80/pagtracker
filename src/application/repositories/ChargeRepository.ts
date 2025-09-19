import { ChargeEntity, ChargeData } from '@/entities/models/Charge';

/**
 * Interface do Repositório de Cobranças - Camada Application
 * Define contratos sem implementação (Dependency Inversion)
 */
export interface ChargeRepository {
  create(charge: ChargeData): Promise<ChargeEntity>;
  findById(id: string, tenantId: string): Promise<ChargeEntity | null>;
  findByTxid(txid: string, tenantId: string): Promise<ChargeEntity | null>;
  findByUserId(
    userId: string, 
    tenantId: string, 
    options?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ): Promise<{
    charges: ChargeEntity[];
    total: number;
  }>;
  update(id: string, data: Partial<ChargeData>, tenantId: string): Promise<ChargeEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  updateStatus(txid: string, status: string, tenantId: string): Promise<ChargeEntity>;
} 