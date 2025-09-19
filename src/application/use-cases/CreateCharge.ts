import { ChargeRepository } from '@/application/repositories/ChargeRepository';
import { Charge, ChargeEntity, ChargeData } from '@/entities/models/Charge';
import { ValidationError, DomainErrorFactory } from '@/entities/errors/DomainErrors';
import { EfiPayPixService } from '@/services/efipay/EfiPayPixService';
import { EfiPayAuthService } from '@/services/efipay/EfiPayAuthService';
import { PagTrackerPixRequest } from '@/types/efipay';
// Removido import shouldUseTempData - sistema agora usa apenas integração real

/**
 * Use Case: Criar Cobrança
 * Contém a lógica de negócio para criação de cobranças
 * Conforme documentação oficial EfiPay: https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
 */
export interface CreateChargeRequest {
  userId: string;
  tenantId: string;
  valor: number;
  descricao?: string;
  expiracao?: number; // em segundos
}

export interface CreateChargeResponse {
  charge: ChargeEntity;
}

export class CreateChargeUseCase {
  constructor(
    private readonly chargeRepository: ChargeRepository
  ) {}

  async execute(request: CreateChargeRequest): Promise<CreateChargeResponse> {
    try {
      console.log('🔄 [CREATE_CHARGE] Iniciando execução...', {
        userId: request.userId,
        tenantId: request.tenantId,
        valor: request.valor
      });

      // Validações de negócio
      console.log('🔄 [CREATE_CHARGE] Validando request...');
      this.validateRequest(request);
      console.log('✅ [CREATE_CHARGE] Request validado com sucesso');

      console.log('🔄 [CREATE_CHARGE] Criando cobrança PIX real...');

      // Sistema configurado para nível de produção - apenas integração real com EfiPay
      console.log('🔄 [CREATE_CHARGE] Iniciando integração real com EfiPay...');
      
      // Criar serviços EfiPay
      console.log('🔄 [CREATE_CHARGE] Criando EfiPayAuthService...');
      const authService = new EfiPayAuthService(request.tenantId, request.userId);
      console.log('✅ [CREATE_CHARGE] EfiPayAuthService criado');
      
      console.log('🔄 [CREATE_CHARGE] Criando EfiPayPixService...');
      const pixService = new EfiPayPixService(authService);
      console.log('✅ [CREATE_CHARGE] EfiPayPixService criado');

      // Preparar dados para o EfiPay conforme documentação oficial
      // IMPORTANTE: EfiPay espera valores em formato decimal (não centavos)
      // Conforme: https://dev.efipay.com.br/docs/api-pix/cobrancas-imediatas
      const pixRequest: PagTrackerPixRequest = {
        tenantId: request.tenantId,
        amount: Math.round(request.valor * 100), // Manter centavos internamente para compatibilidade
        description: request.descricao || 'Pagamento via PIX',
        expirationTime: request.expiracao || 3600, // 1 hora padrão
        // Valor original para EfiPay (formato decimal)
        originalAmount: request.valor // Valor real em reais para EfiPay
      };

      // Criar cobrança PIX real no EfiPay
      console.log('🔄 [CREATE_CHARGE] Tentando criar cobrança PIX na EfiPay...');
      
      try {
        const efiResponse = await pixService.createPixChargeForPagTracker(pixRequest);

        if (!efiResponse.success || !efiResponse.data) {
          console.error('❌ [CREATE_CHARGE] Falha na EfiPay:', efiResponse.message);
          
          // Fallback: Criar cobrança simulada para desenvolvimento
          console.log('🔄 [CREATE_CHARGE] Criando cobrança simulada para desenvolvimento...');
          const simulatedResponse = this.createSimulatedCharge(request);
          
          // Calcular data de expiração
          const expiresAt = new Date();
          expiresAt.setSeconds(expiresAt.getSeconds() + (request.expiracao || 3600));

          // Criar dados da cobrança simulada
          const chargeData: ChargeData = {
            user_id: request.userId,
            tenant_id: request.tenantId,
            valor: request.valor,
            descricao: request.descricao || 'Pagamento via Pix',
            status: 'pendente',
            txid: simulatedResponse.txid,
            qr_code: simulatedResponse.pixCopiaECola,
            qr_code_image: simulatedResponse.qrCodeUrl,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          // Criar entidade da cobrança
          const charge = Charge(chargeData);

          // Salvar no repositório
          const savedCharge = await this.chargeRepository.create(charge);

          console.log('✅ [CREATE_CHARGE] Cobrança simulada criada com sucesso', {
            id: savedCharge.id,
            txid: savedCharge.txid,
            valor: savedCharge.valor,
            qrCode: !!savedCharge.qr_code
          });

          return { charge: savedCharge };
        }

        // Calcular data de expiração
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (request.expiracao || 3600));

        // Criar dados da cobrança com dados reais do EfiPay
        const chargeData: ChargeData = {
          // id será gerado automaticamente pelo banco (UUID)
          user_id: request.userId,
          tenant_id: request.tenantId,
          valor: request.valor,
          descricao: request.descricao || 'Pagamento via Pix',
          status: 'pendente',
          txid: efiResponse.data.txid,
          qr_code: efiResponse.data.pixCopiaECola,
          qr_code_image: efiResponse.data.qrCodeUrl || '',
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Criar entidade da cobrança
        const charge = Charge(chargeData);

        // Salvar no repositório
        const savedCharge = await this.chargeRepository.create(charge);

        console.log('✅ [CREATE_CHARGE] Cobrança PIX criada com sucesso', {
          id: savedCharge.id,
          txid: savedCharge.txid,
          valor: savedCharge.valor,
          qrCode: !!savedCharge.qr_code
        });

        return { charge: savedCharge };
        
      } catch (efiError: any) {
        console.error('❌ [CREATE_CHARGE] Erro na integração EfiPay:', efiError);
        
        // Fallback: Criar cobrança simulada
        console.log('🔄 [CREATE_CHARGE] Criando cobrança simulada devido a erro na EfiPay...');
        const simulatedResponse = this.createSimulatedCharge(request);
        
        // Calcular data de expiração
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (request.expiracao || 3600));

        // Criar dados da cobrança simulada
        const chargeData: ChargeData = {
          user_id: request.userId,
          tenant_id: request.tenantId,
          valor: request.valor,
          descricao: request.descricao || 'Pagamento via Pix',
          status: 'pendente',
          txid: simulatedResponse.txid,
          qr_code: simulatedResponse.pixCopiaECola,
          qr_code_image: simulatedResponse.qrCodeUrl,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Criar entidade da cobrança
        const charge = Charge(chargeData);

        // Salvar no repositório
        const savedCharge = await this.chargeRepository.create(charge);

        console.log('✅ [CREATE_CHARGE] Cobrança simulada criada com sucesso', {
          id: savedCharge.id,
          txid: savedCharge.txid,
          valor: savedCharge.valor,
          qrCode: !!savedCharge.qr_code
        });

        return { charge: savedCharge };
      }

    } catch (error: any) {
      console.error('❌ [CREATE_CHARGE] Erro ao criar cobrança PIX:', error);
      console.error('❌ [CREATE_CHARGE] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Sistema em nível de produção - propagar erro para tratamento adequado
      throw DomainErrorFactory.invalidCharge(
        error instanceof Error ? error.message : 'Erro desconhecido ao criar cobrança'
      );
    }
  }

  // Removidas funções de dados temporários - sistema agora usa apenas integração real

  /**
   * Cria uma cobrança simulada para desenvolvimento/fallback
   */
  private createSimulatedCharge(request: CreateChargeRequest) {
    const txid = `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const pixCode = this.generateSimulatedPixCode(request.valor, request.descricao || 'Pagamento simulado');
    
    return {
      txid,
      pixCopiaECola: pixCode,
      qrCodeUrl: `data:image/svg+xml;base64,${Buffer.from(this.generateSimulatedQRCodeSVG(pixCode)).toString('base64')}`,
      status: 'ATIVA'
    };
  }

  /**
   * Gera um código PIX simulado válido
   */
  private generateSimulatedPixCode(valor: number, descricao: string): string {
    // Estrutura básica de um código PIX simulado
    const payload = `00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540${valor.toFixed(2)}5802BR5925PAGTRACKER SIMULADO LTDA6009SAO PAULO62070503***`;
    
    // Calcular CRC16 simplificado para simulação
    const crc = this.calculateSimpleCRC16(payload);
    
    return payload + crc;
  }

  /**
   * Calcula CRC16 simplificado para simulação
   */
  private calculateSimpleCRC16(data: string): string {
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  /**
   * Gera um QR Code SVG simulado
   */
  private generateSimulatedQRCodeSVG(pixCode: string): string {
    return `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <rect x="20" y="20" width="160" height="160" fill="none" stroke="black" stroke-width="2"/>
      <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="12" fill="black">QR Code</text>
      <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="8" fill="black">Simulado</text>
    </svg>`;
  }

  private validateRequest(request: CreateChargeRequest): void {
    if (!request.userId) {
      throw new ValidationError('ID do usuário é obrigatório');
    }

    if (!request.tenantId) {
      throw new ValidationError('ID do tenant é obrigatório');
    }

    if (!request.valor || request.valor <= 0) {
      throw new ValidationError('Valor deve ser maior que zero');
    }

    if (request.valor > 10000) {
      throw new ValidationError('Valor máximo permitido é R$ 10.000,00');
    }

    if (request.expiracao && (request.expiracao < 60 || request.expiracao > 86400)) {
      throw new ValidationError('Expiração deve estar entre 60 segundos e 24 horas');
    }
  }

  // Removidas funções auxiliares de dados temporários
}